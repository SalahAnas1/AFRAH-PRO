<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    private function bookingIds(int $businessId, string $from, string $to, array $statuses = ['confirmed','completed'])
    {
        return DB::table('booking_days')
            ->join('bookings','bookings.id','=','booking_days.booking_id')
            ->where('bookings.business_id',$businessId)
            ->whereIn('bookings.status',$statuses)
            ->whereBetween(DB::raw('DATE(booking_days.date)'),[$from,$to])
            ->distinct()->pluck('booking_days.booking_id');
    }

    private function financials(int $businessId, $ids, string $from, string $to): array
    {
        if ($ids->isEmpty()) {
            return ['revenue'=>0,'booking_expenses'=>0,'worker_costs'=>0,'invoices'=>0,'total_expenses'=>0,'net_profit'=>0,'bookings_count'=>0];
        }
        $revenue  = (float) DB::table('booking_items')->whereIn('booking_id',$ids)->sum(DB::raw('quantity * unit_price'));
        $bookExp  = (float) DB::table('booking_expenses')->whereIn('booking_id',$ids)->sum(DB::raw('quantity * unit_price'));
        $workers  = (float) DB::table('booking_workers')->whereIn('booking_id',$ids)->sum('cost');
        $invoices = (float) DB::table('invoices')->where('business_id',$businessId)->whereBetween(DB::raw('DATE(invoice_date)'),[$from,$to])->sum('total_amount');
        $total    = $bookExp + $workers + $invoices;
        return ['revenue'=>round($revenue,2),'booking_expenses'=>round($bookExp,2),'worker_costs'=>round($workers,2),'invoices'=>round($invoices,2),'total_expenses'=>round($total,2),'net_profit'=>round($revenue-$total,2),'bookings_count'=>$ids->count()];
    }

    private function enrichBookings($ids, $daysMap = null)
    {
        if ($ids->isEmpty()) return collect();
        $revMap  = DB::table('booking_items')->whereIn('booking_id',$ids)->selectRaw("booking_id, SUM(quantity*unit_price) as revenue, SUM(CASE WHEN item_type='service' THEN quantity*unit_price ELSE 0 END) as service_rev")->groupBy('booking_id')->get()->keyBy('booking_id');
        $expMap  = DB::table('booking_expenses')->whereIn('booking_id',$ids)->selectRaw('booking_id, SUM(quantity*unit_price) as total')->groupBy('booking_id')->pluck('total','booking_id');
        $wcMap   = DB::table('booking_workers')->whereIn('booking_id',$ids)->selectRaw('booking_id, SUM(cost) as total')->groupBy('booking_id')->pluck('total','booking_id');
        if (!$daysMap) $daysMap = DB::table('booking_days')->whereIn('booking_id',$ids)->orderBy('date')->get(['booking_id','date'])->groupBy('booking_id');
        return DB::table('bookings')->whereIn('id',$ids)->get(['id','client_name','client_phone','status','deposit'])
            ->map(function ($b) use ($revMap,$expMap,$wcMap,$daysMap) {
                $rev = (float)($revMap[$b->id]->revenue ?? 0);
                $svc = (float)($revMap[$b->id]->service_rev ?? 0);
                $exp = (float)($expMap[$b->id] ?? 0);
                $wc  = (float)($wcMap[$b->id] ?? 0);
                return (array)$b + ['revenue'=>round($rev,2),'product_revenue'=>round($rev-$svc,2),'service_revenue'=>round($svc,2),'booking_expenses'=>round($exp,2),'worker_costs'=>round($wc,2),'net_profit'=>round($rev-$exp-$wc,2),'days'=>($daysMap[$b->id] ?? collect())->pluck('date')->map(fn($d)=>substr($d,0,10))->values()];
            });
    }

    // ─── GET /reports/daily ──────────────────────────────────────────────────

    public function daily(Request $request)
    {
        $business = $request->user()->business;
        $date = $request->date ?? now()->toDateString();
        $ids  = $this->bookingIds($business->id,$date,$date);
        $fin  = $this->financials($business->id,$ids,$date,$date);
        return response()->json(array_merge($fin,['date'=>$date,'bookings'=>$this->enrichBookings($ids)]));
    }

    // ─── GET /reports/monthly ────────────────────────────────────────────────

    public function monthly(Request $request)
    {
        $business = $request->user()->business;
        $year  = (int)($request->year  ?? now()->year);
        $month = (int)($request->month ?? now()->month);
        $from  = Carbon::create($year,$month,1)->toDateString();
        $to    = Carbon::create($year,$month,1)->endOfMonth()->toDateString();

        $ids = $this->bookingIds($business->id,$from,$to);
        $fin = $this->financials($business->id,$ids,$from,$to);

        $topProducts = $topServices = $expenseNames = $topBookings = $topInvoices = $dailyBreakdown = collect();

        if ($ids->isNotEmpty()) {
            $topProducts  = DB::table('booking_items')->whereIn('booking_id',$ids)->where('item_type','product')->selectRaw('item_id,item_name,COUNT(*) as uses,SUM(quantity) as total_qty,SUM(quantity*unit_price) as revenue')->groupBy('item_id','item_name')->orderByDesc('uses')->limit(8)->get();
            $topServices  = DB::table('booking_items')->whereIn('booking_id',$ids)->where('item_type','service')->selectRaw('item_id,item_name,COUNT(*) as uses,SUM(quantity) as total_qty,SUM(quantity*unit_price) as revenue')->groupBy('item_id','item_name')->orderByDesc('uses')->limit(8)->get();
            $expenseNames = DB::table('booking_expenses')->whereIn('booking_id',$ids)->selectRaw('name,SUM(quantity*unit_price) as total')->groupBy('name')->orderByDesc('total')->limit(6)->get();
            $topBookings  = $this->enrichBookings($ids)->sortByDesc('net_profit')->values()->slice(0,5);

            // Daily breakdown (group by booking first-day)
            $firstDaySub = DB::table('booking_days')->whereIn('booking_id',$ids)->selectRaw('booking_id, MIN(date) as first_day')->groupBy('booking_id');
            $dailyRev = DB::table('booking_items')->joinSub($firstDaySub,'fd','fd.booking_id','=','booking_items.booking_id')->selectRaw('DAY(fd.first_day) as day, SUM(booking_items.quantity*booking_items.unit_price) as revenue')->groupBy('day')->pluck('revenue','day');
            $dailyExp = DB::table('booking_expenses')->joinSub($firstDaySub,'fd','fd.booking_id','=','booking_expenses.booking_id')->selectRaw('DAY(fd.first_day) as day, SUM(booking_expenses.quantity*booking_expenses.unit_price) as exp')->groupBy('day')->pluck('exp','day');
            $dailyWc  = DB::table('booking_workers')->joinSub($firstDaySub,'fd','fd.booking_id','=','booking_workers.booking_id')->selectRaw('DAY(fd.first_day) as day, SUM(cost) as wc')->groupBy('day')->pluck('wc','day');
            $daysInMonth = Carbon::create($year,$month)->daysInMonth;
            $daily = [];
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $daily[] = ['day'=>$d,'revenue'=>round((float)($dailyRev[$d]??0),2),'expenses'=>round((float)($dailyExp[$d]??0)+(float)($dailyWc[$d]??0),2)];
            }
            $dailyBreakdown = $daily;
        }

        $topInvoices = DB::table('invoices')->where('business_id',$business->id)->whereBetween(DB::raw('DATE(invoice_date)'),[$from,$to])->orderByDesc('total_amount')->limit(5)->get(['supplier','invoice_date','total_amount']);

        return response()->json(array_merge($fin,['year'=>$year,'month'=>$month,'from'=>$from,'to'=>$to,'top_products'=>$topProducts,'top_services'=>$topServices,'daily_breakdown'=>$dailyBreakdown,'top_bookings'=>$topBookings,'expense_names'=>$expenseNames,'top_invoices'=>$topInvoices]));
    }

    // ─── GET /reports/annual ─────────────────────────────────────────────────

    public function annual(Request $request)
    {
        $business = $request->user()->business;
        $year = (int)($request->year ?? now()->year);
        $from = "$year-01-01"; $to = "$year-12-31";
        $ids  = $this->bookingIds($business->id,$from,$to);
        $fin  = $this->financials($business->id,$ids,$from,$to);

        $monthBookings = DB::table('booking_days')->join('bookings','bookings.id','=','booking_days.booking_id')->where('bookings.business_id',$business->id)->whereIn('bookings.status',['confirmed','completed'])->whereYear('booking_days.date',$year)->selectRaw('MONTH(booking_days.date) as month, booking_days.booking_id')->distinct()->get()->groupBy('month');
        $revMap = $ids->isNotEmpty() ? DB::table('booking_items')->whereIn('booking_id',$ids)->selectRaw('booking_id,SUM(quantity*unit_price) as rev')->groupBy('booking_id')->pluck('rev','booking_id') : collect();
        $expMap = $ids->isNotEmpty() ? DB::table('booking_expenses')->whereIn('booking_id',$ids)->selectRaw('booking_id,SUM(quantity*unit_price) as total')->groupBy('booking_id')->pluck('total','booking_id') : collect();
        $wcMap  = $ids->isNotEmpty() ? DB::table('booking_workers')->whereIn('booking_id',$ids)->selectRaw('booking_id,SUM(cost) as total')->groupBy('booking_id')->pluck('total','booking_id') : collect();
        $invMap = DB::table('invoices')->where('business_id',$business->id)->whereYear('invoice_date',$year)->selectRaw('MONTH(invoice_date) as month,SUM(total_amount) as total')->groupBy(DB::raw('MONTH(invoice_date)'))->pluck('total','month');

        $monthly = [];
        for ($m = 1; $m <= 12; $m++) {
            $mRows = $monthBookings->get($m); $mIds = $mRows ? $mRows->pluck('booking_id') : collect();
            $rev = $mIds->sum(fn($id)=>(float)($revMap[$id]??0)); $exp = $mIds->sum(fn($id)=>(float)($expMap[$id]??0)); $wc = $mIds->sum(fn($id)=>(float)($wcMap[$id]??0)); $inv = (float)($invMap[$m]??0);
            $monthly[] = ['month'=>$m,'bookings_count'=>$mIds->count(),'revenue'=>round($rev,2),'expenses'=>round($exp+$wc+$inv,2),'net_profit'=>round($rev-$exp-$wc-$inv,2)];
        }
        return response()->json(array_merge($fin,['year'=>$year,'monthly'=>$monthly]));
    }

    // ─── GET /reports/bookings ────────────────────────────────────────────────

    public function bookings(Request $request)
    {
        $business = $request->user()->business;
        $from     = $request->date_from ?? now()->startOfMonth()->toDateString();
        $to       = $request->date_to   ?? now()->toDateString();
        $statuses = $request->status ? [$request->status] : ['confirmed','completed','draft','cancelled'];
        $ids      = $this->bookingIds($business->id,$from,$to,$statuses);
        if ($ids->isEmpty()) return response()->json(['data'=>[],'total'=>0,'page'=>1,'last_page'=>1]);
        $perPage = 15; $page = max(1,(int)($request->page??1));
        $rows    = $this->enrichBookings($ids->values()->slice(($page-1)*$perPage,$perPage));
        return response()->json(['data'=>$rows,'total'=>$ids->count(),'page'=>$page,'last_page'=>max(1,(int)ceil($ids->count()/$perPage))]);
    }

    // ─── GET /reports/products ────────────────────────────────────────────────

    public function products(Request $request)
    {
        $business = $request->user()->business;
        $from = $request->date_from ?? now()->startOfYear()->toDateString();
        $to   = $request->date_to   ?? now()->toDateString();
        $ids  = $this->bookingIds($business->id,$from,$to);
        if ($ids->isEmpty()) return response()->json([]);
        return response()->json(DB::table('booking_items')->whereIn('booking_id',$ids)->where('item_type','product')->selectRaw('item_id,item_name,COUNT(*) as bookings_count,SUM(quantity) as total_qty,SUM(quantity*unit_price) as revenue')->groupBy('item_id','item_name')->orderByDesc('total_qty')->get());
    }

    // ─── GET /reports/services ────────────────────────────────────────────────

    public function services(Request $request)
    {
        $business = $request->user()->business;
        $from = $request->date_from ?? now()->startOfYear()->toDateString();
        $to   = $request->date_to   ?? now()->toDateString();
        $ids  = $this->bookingIds($business->id,$from,$to);
        if ($ids->isEmpty()) return response()->json([]);
        return response()->json(DB::table('booking_items')->whereIn('booking_id',$ids)->where('item_type','service')->selectRaw('item_id,item_name,COUNT(*) as bookings_count,SUM(quantity) as total_qty,SUM(quantity*unit_price) as revenue')->groupBy('item_id','item_name')->orderByDesc('bookings_count')->get());
    }

    // ─── GET /reports/workers ─────────────────────────────────────────────────

    public function workers(Request $request)
    {
        $business = $request->user()->business;
        $from = $request->date_from ?? now()->startOfYear()->toDateString();
        $to   = $request->date_to   ?? now()->toDateString();
        $ids  = $this->bookingIds($business->id,$from,$to);
        if ($ids->isEmpty()) return response()->json([]);
        return response()->json(DB::table('booking_workers')->whereIn('booking_id',$ids)->selectRaw('worker_name,COUNT(DISTINCT booking_id) as bookings_count,SUM(cost) as total_cost')->groupBy('worker_name')->orderByDesc('total_cost')->get());
    }
}