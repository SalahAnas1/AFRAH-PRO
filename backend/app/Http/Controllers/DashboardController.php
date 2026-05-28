<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $business = $request->user()->business;
        $bid  = $business->id;
        $date = $request->date ?? now()->toDateString();

        // All booking IDs for the date (draft + confirmed + completed)
        $allIds = DB::table('booking_days')
            ->join('bookings', 'bookings.id', '=', 'booking_days.booking_id')
            ->where('bookings.business_id', $bid)
            ->whereIn('bookings.status', ['draft', 'confirmed', 'completed'])
            ->whereDate('booking_days.date', $date)
            ->distinct()->pluck('booking_days.booking_id');

        // Financial IDs (confirmed + completed only)
        $finIds = DB::table('booking_days')
            ->join('bookings', 'bookings.id', '=', 'booking_days.booking_id')
            ->where('bookings.business_id', $bid)
            ->whereIn('bookings.status', ['confirmed', 'completed'])
            ->whereDate('booking_days.date', $date)
            ->distinct()->pluck('booking_days.booking_id');

        // --- Bookings list ---
        $bookings = collect();
        if ($allIds->isNotEmpty()) {
            $prodCounts = DB::table('booking_items')->whereIn('booking_id', $allIds)->where('item_type', 'product')
                ->selectRaw('booking_id, COUNT(*) as cnt')->groupBy('booking_id')->pluck('cnt', 'booking_id');
            $svcCounts  = DB::table('booking_items')->whereIn('booking_id', $allIds)->where('item_type', 'service')
                ->selectRaw('booking_id, COUNT(*) as cnt')->groupBy('booking_id')->pluck('cnt', 'booking_id');
            $wkrCounts  = DB::table('booking_workers')->whereIn('booking_id', $allIds)
                ->selectRaw('booking_id, COUNT(*) as cnt')->groupBy('booking_id')->pluck('cnt', 'booking_id');
            $revMap     = DB::table('booking_items')->whereIn('booking_id', $allIds)
                ->selectRaw('booking_id, SUM(quantity*unit_price) as rev')->groupBy('booking_id')->pluck('rev', 'booking_id');

            $bookings = DB::table('bookings')->whereIn('id', $allIds)->orderBy('id')
                ->get(['id', 'client_name', 'client_phone', 'status', 'notes'])
                ->map(fn($b) => [
                    'id'            => $b->id,
                    'client_name'   => $b->client_name,
                    'client_phone'  => $b->client_phone,
                    'status'        => $b->status,
                    'notes'         => $b->notes,
                    'product_count' => (int)($prodCounts[$b->id] ?? 0),
                    'service_count' => (int)($svcCounts[$b->id] ?? 0),
                    'worker_count'  => (int)($wkrCounts[$b->id] ?? 0),
                    'revenue'       => round((float)($revMap[$b->id] ?? 0), 2),
                ])->values();
        }

        // --- Financial summary ---
        $revenue = $finIds->isNotEmpty() ? (float) DB::table('booking_items')->whereIn('booking_id', $finIds)->sum(DB::raw('quantity * unit_price')) : 0;
        $bookExp = $finIds->isNotEmpty() ? (float) DB::table('booking_expenses')->whereIn('booking_id', $finIds)->sum(DB::raw('quantity * unit_price')) : 0;
        $wkrCost = $finIds->isNotEmpty() ? (float) DB::table('booking_workers')->whereIn('booking_id', $finIds)->sum('cost') : 0;

        // --- Workers for the day ---
        $workers = collect();
        if ($allIds->isNotEmpty()) {
            $workers = DB::table('booking_workers')
                ->whereIn('booking_workers.booking_id', $allIds)
                ->join('bookings', 'bookings.id', '=', 'booking_workers.booking_id')
                ->select('booking_workers.id', 'booking_workers.worker_name', 'booking_workers.cost', 'booking_workers.booking_id', 'bookings.client_name')
                ->get()->map(fn($w) => (array)$w)->values();
        }

        // --- Inventory for the day ---
        $inventory = [];
        $products  = DB::table('products')->where('business_id', $bid)->where('stock', '>', 0)->get(['id', 'name', 'stock']);
        if ($products->isNotEmpty()) {
            $reservedMap = $allIds->isNotEmpty()
                ? DB::table('booking_items')->whereIn('booking_id', $allIds)->where('item_type', 'product')
                    ->selectRaw('item_id, SUM(quantity) as reserved')->groupBy('item_id')->pluck('reserved', 'item_id')
                : collect();
            foreach ($products as $p) {
                $reserved = (int)($reservedMap[$p->id] ?? 0);
                if ($reserved > 0 || $p->stock <= 5) {
                    $inventory[] = [
                        'id'        => $p->id,
                        'name'      => $p->name,
                        'stock'     => $p->stock,
                        'reserved'  => $reserved,
                        'available' => $p->stock - $reserved,
                    ];
                }
            }
        }

        // --- Alerts ---
        $alerts = [];
        $lowStockItems = DB::table('products')->where('business_id', $bid)->where('stock', '<=', 5)->get(['name', 'stock']);
        foreach ($lowStockItems as $p) {
            $alerts[] = ['type' => 'low_stock', 'severity' => 'warning', 'message' => "مخزون {$p->name} منخفض ({$p->stock})"];
        }

        // --- Upcoming bookings count (next 7 days) ---
        $upcomingCount = DB::table('booking_days')
            ->join('bookings', 'bookings.id', '=', 'booking_days.booking_id')
            ->where('bookings.business_id', $bid)
            ->whereIn('bookings.status', ['confirmed', 'draft'])
            ->whereBetween(DB::raw('DATE(booking_days.date)'), [now()->addDay()->toDateString(), now()->addDays(7)->toDateString()])
            ->distinct()->count('booking_days.booking_id');

        $lowStockCount = DB::table('products')->where('business_id', $bid)->where('stock', '<=', 5)->count();

        return response()->json([
            'date'            => $date,
            'bookings_count'  => $allIds->count(),
            'workers_count'   => $workers->count(),
            'revenue'         => round($revenue, 2),
            'expenses'        => round($bookExp + $wkrCost, 2),
            'net_profit'      => round($revenue - $bookExp - $wkrCost, 2),
            'upcoming_count'  => $upcomingCount,
            'low_stock_count' => $lowStockCount,
            'bookings'        => $bookings,
            'workers'         => $workers,
            'inventory'       => $inventory,
            'alerts'          => $alerts,
        ]);
    }

    public function calendar(Request $request)
    {
        $business = $request->user()->business;
        $year  = (int)($request->year  ?? now()->year);
        $month = (int)($request->month ?? now()->month);

        $result = DB::table('booking_days')
            ->join('bookings', 'bookings.id', '=', 'booking_days.booking_id')
            ->where('bookings.business_id', $business->id)
            ->whereIn('bookings.status', ['draft', 'confirmed', 'completed'])
            ->whereYear('booking_days.date', $year)
            ->whereMonth('booking_days.date', $month)
            ->selectRaw('DAY(booking_days.date) as day, COUNT(DISTINCT booking_days.booking_id) as cnt')
            ->groupBy('day')
            ->pluck('cnt', 'day');

        return response()->json($result);
    }
}