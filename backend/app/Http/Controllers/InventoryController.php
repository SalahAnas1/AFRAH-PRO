<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\Product;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryController extends Controller
{
    // GET /inventory/calendar?year=2026&month=05
    public function calendar(Request $request)
    {
        $business = $request->user()->business;
        $year  = (int)($request->year  ?? now()->year);
        $month = (int)($request->month ?? now()->month);

        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end   = $start->copy()->endOfMonth()->endOfDay();

        $rows = DB::table('booking_days')
            ->join('bookings', 'bookings.id', '=', 'booking_days.booking_id')
            ->where('bookings.business_id', $business->id)
            ->whereIn('bookings.status', ['confirmed', 'completed'])
            ->whereBetween('booking_days.date', [$start, $end])
            ->selectRaw('DATE(booking_days.date) as day, COUNT(DISTINCT bookings.id) as booking_count')
            ->groupBy('day')
            ->get()
            ->keyBy('day');

        $days = [];
        $current = $start->copy();
        while ($current->lte($end)) {
            $dayStr = $current->toDateString();
            $days[] = [
                'date'          => $dayStr,
                'booking_count' => $rows->has($dayStr) ? (int)$rows[$dayStr]->booking_count : 0,
            ];
            $current->addDay();
        }

        return response()->json(['year' => $year, 'month' => $month, 'days' => $days]);
    }

    // GET /inventory/day?date=2026-05-25
    public function dayDetail(Request $request)
    {
        $business = $request->user()->business;
        $date = $request->date ?? now()->toDateString();

        $products = Product::where('business_id', $business->id)
            ->with('category:id,name')
            ->get();

        $reserved = DB::table('booking_items')
            ->join('booking_days', 'booking_days.id', '=', 'booking_items.booking_day_id')
            ->join('bookings', 'bookings.id', '=', 'booking_items.booking_id')
            ->where('bookings.business_id', $business->id)
            ->whereIn('bookings.status', ['confirmed', 'completed'])
            ->where('booking_items.item_type', 'product')
            ->whereDate('booking_days.date', $date)
            ->selectRaw('booking_items.item_id as product_id, SUM(booking_items.quantity) as reserved_qty')
            ->groupBy('booking_items.item_id')
            ->get()
            ->keyBy('product_id');

        $result = $products->map(function ($p) use ($reserved) {
            $r = $reserved->has($p->id) ? (int)$reserved[$p->id]->reserved_qty : 0;
            return [
                'id'        => $p->id,
                'name'      => $p->name,
                'unit'      => $p->unit,
                'stock'     => $p->stock,
                'reserved'  => $r,
                'available' => max(0, $p->stock - $r),
                'category'  => $p->category?->name,
            ];
        })->sortByDesc('reserved')->values();

        return response()->json(['date' => $date, 'products' => $result]);
    }

    // GET /inventory/movements
    public function movements(Request $request)
    {
        $business = $request->user()->business;

        $query = InventoryMovement::where('business_id', $business->id)
            ->with('product:id,name,unit');

        if ($request->product_id) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }

        return response()->json($query->latest()->paginate($request->per_page ?? 20));
    }

    // POST /inventory/movements
    public function store(Request $request)
    {
        $business = $request->user()->business;

        $request->validate([
            'product_id'     => 'required|exists:products,id',
            'type'           => 'required|in:in,out,return,adjustment',
            'quantity'       => 'required|integer|not_in:0',
            'reason'         => 'nullable|in:broken,damaged,lost,sold,consumed,other',
            'notes'          => 'nullable|string|max:500',
            'booking_id'     => 'nullable|exists:bookings,id',
            'booking_day_id' => 'nullable|exists:booking_days,id',
        ]);

        $product = Product::where('id', $request->product_id)
            ->where('business_id', $business->id)
            ->firstOrFail();

        DB::transaction(function () use ($request, $business, $product) {
            InventoryMovement::create([
                'business_id'    => $business->id,
                'product_id'     => $product->id,
                'booking_id'     => $request->booking_id,
                'booking_day_id' => $request->booking_day_id,
                'type'           => $request->type,
                'quantity'       => $request->quantity,
                'reason'         => $request->reason,
                'notes'          => $request->notes,
            ]);

            $delta = match($request->type) {
                'in'         =>  abs($request->quantity),
                'out'        => -abs($request->quantity),
                'return'     =>  abs($request->quantity),
                'adjustment' =>  $request->quantity,
            };
            $product->increment('stock', $delta);
        });

        $freshProduct = $product->fresh();
        $threshold    = 5;

        if ($freshProduct->stock <= 0) {
            NotificationService::forBusiness(
                $business->id, 'inventory',
                'نفد المخزون',
                'نفد مخزون المنتج: ' . $freshProduct->name,
                $freshProduct->id, 'product'
            );
        } elseif ($freshProduct->stock <= $threshold) {
            NotificationService::forBusiness(
                $business->id, 'inventory',
                'مخزون منخفض',
                'مخزون ' . $freshProduct->name . ' منخفض: ' . $freshProduct->stock . ' ' . ($freshProduct->unit ?? 'قطعة') . ' متبقية',
                $freshProduct->id, 'product'
            );
        }

        return response()->json([
            'message' => 'تم تسجيل الحركة بنجاح',
            'stock'   => $freshProduct->stock,
        ], 201);
    }

    // GET /inventory/alerts
    public function alerts(Request $request)
    {
        $business  = $request->user()->business;
        $threshold = (int)($request->threshold ?? 5);

        $products = Product::where('business_id', $business->id)
            ->where('stock', '<=', $threshold)
            ->with('category:id,name')
            ->orderBy('stock')
            ->get(['id','name','unit','stock','category_id']);

        return response()->json($products);
    }
}