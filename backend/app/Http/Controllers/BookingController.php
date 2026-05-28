<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingDay;
use App\Models\BookingItem;
use App\Models\BookingWorker;
use App\Models\BookingExpense;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    // ─── الحجوزات ─────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $business = $request->user()->business;

        $base = Booking::where('business_id', $business->id);

        if ($request->search) {
            $base->where(function ($q) use ($request) {
                $q->where('client_name', 'like', '%' . $request->search . '%')
                  ->orWhere('client_phone', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->status) {
            $base->where('status', $request->status);
        }

        if ($request->month) {
            [$year, $month] = explode('-', $request->month);
            $base->whereHas('days', function ($q) use ($year, $month) {
                $q->whereYear('date', $year)->whereMonth('date', $month);
            });
        }

        $totals = [
            'all'       => (clone $base)->count(),
            'draft'     => (clone $base)->where('status', 'draft')->count(),
            'confirmed' => (clone $base)->where('status', 'confirmed')->count(),
            'completed' => (clone $base)->where('status', 'completed')->count(),
            'cancelled' => (clone $base)->where('status', 'cancelled')->count(),
        ];

        $paginated = (clone $base)
            ->with(['days' => fn($q) => $q->orderBy('date')])
            ->selectRaw('bookings.*, (SELECT COALESCE(SUM(quantity * unit_price),0) FROM booking_items WHERE booking_id=bookings.id) as total_revenue')
            ->latest()
            ->paginate($request->per_page ?? 10);

        return response()->json(array_merge($paginated->toArray(), ['totals' => $totals]));
    }

    public function store(Request $request)
    {
        $request->validate([
            'client_name'          => 'required|string|max:255',
            'client_phone'         => 'required|string|max:30',
            'client_phone_alt'     => 'nullable|string|max:30',
            'address'              => 'nullable|string|max:500',
            'notes'                => 'nullable|string',
            'deposit'              => 'nullable|numeric|min:0',
            'days'                 => 'required|array|min:1',
            'days.*'               => 'date',
            'items'                => 'nullable|array',
            'items.*.item_type'    => 'required_with:items|in:product,service',
            'items.*.item_id'      => 'required_with:items|integer',
            'items.*.item_name'    => 'required_with:items|string',
            'items.*.quantity'     => 'required_with:items|integer|min:1',
            'items.*.unit_price'   => 'required_with:items|numeric|min:0',
            'workers'              => 'nullable|array',
            'workers.*.worker_name' => 'required_with:workers|string',
            'workers.*.cost'        => 'required_with:workers|numeric|min:0',
            'expenses'             => 'nullable|array',
            'expenses.*.name'       => 'required_with:expenses|string',
            'expenses.*.quantity'   => 'required_with:expenses|integer|min:1',
            'expenses.*.unit_price' => 'required_with:expenses|numeric|min:0',
        ]);

        $business = $request->user()->business;

        DB::transaction(function () use ($request, $business, &$booking) {
            $booking = Booking::create([
                'business_id'      => $business->id,
                'client_name'      => $request->client_name,
                'client_phone'     => $request->client_phone,
                'client_phone_alt' => $request->client_phone_alt,
                'address'          => $request->address,
                'notes'            => $request->notes,
                'deposit'          => $request->deposit ?? 0,
                'status'           => 'draft',
            ]);

            $dayMap = [];
            foreach ($request->days as $index => $date) {
                $day = BookingDay::create(['booking_id' => $booking->id, 'date' => $date]);
                $dayMap[$index] = $day->id;
            }

            $itemMap = [];
            foreach ($request->items ?? [] as $index => $itemData) {
                $dayId = isset($itemData['day_index']) ? ($dayMap[$itemData['day_index']] ?? null) : null;
                $item = BookingItem::create([
                    'booking_id'     => $booking->id,
                    'booking_day_id' => $dayId,
                    'item_type'      => $itemData['item_type'],
                    'item_id'        => $itemData['item_id'],
                    'item_name'      => $itemData['item_name'],
                    'quantity'       => $itemData['quantity'],
                    'unit_price'     => $itemData['unit_price'],
                ]);
                $itemMap[$index] = $item->id;
            }

            foreach ($request->workers ?? [] as $workerData) {
                $dayId  = isset($workerData['day_index'])  ? ($dayMap[$workerData['day_index']]  ?? null) : null;
                $itemId = isset($workerData['item_index']) ? ($itemMap[$workerData['item_index']] ?? null) : null;
                BookingWorker::create([
                    'booking_id'      => $booking->id,
                    'booking_day_id'  => $dayId,
                    'worker_id'       => $workerData['worker_id'] ?? null,
                    'worker_name'     => $workerData['worker_name'],
                    'cost'            => $workerData['cost'],
                    'booking_item_id' => $itemId,
                ]);
            }

            foreach ($request->expenses ?? [] as $expenseData) {
                $dayId = isset($expenseData['day_index']) ? ($dayMap[$expenseData['day_index']] ?? null) : null;
                BookingExpense::create([
                    'booking_id'     => $booking->id,
                    'booking_day_id' => $dayId,
                    'name'           => $expenseData['name'],
                    'quantity'       => $expenseData['quantity'] ?? 1,
                    'unit_price'     => $expenseData['unit_price'],
                ]);
            }
        });

        NotificationService::forBusiness(
            $business->id,
            'booking',
            'حجز جديد',
            'تم إنشاء حجز جديد للعميل: ' . $booking->client_name,
            $booking->id,
            'booking'
        );

        return response()->json($this->loadFull($booking), 201);
    }

    public function show(Request $request, Booking $booking)
    {
        $this->authorizeBooking($request, $booking);
        return response()->json($this->loadFull($booking));
    }

    public function update(Request $request, Booking $booking)
    {
        $this->authorizeBooking($request, $booking);

        $request->validate([
            'client_name'      => 'sometimes|required|string|max:255',
            'client_phone'     => 'sometimes|required|string|max:30',
            'client_phone_alt' => 'nullable|string|max:30',
            'address'          => 'nullable|string|max:500',
            'notes'            => 'nullable|string',
            'deposit'          => 'nullable|numeric|min:0',
        ]);

        $booking->update($request->only(['client_name','client_phone','client_phone_alt','address','notes','deposit']));

        return response()->json($this->loadFull($booking));
    }

    public function destroy(Request $request, Booking $booking)
    {
        $this->authorizeBooking($request, $booking);
        $booking->delete();
        return response()->json(['message' => 'تم حذف الحجز بنجاح']);
    }

    // ─── تحديث كامل (للتعديل من الويزارد) ───────────────────────────────────

    public function fullUpdate(Request $request, Booking $booking)
    {
        $this->authorizeBooking($request, $booking);

        $request->validate([
            'client_name'          => 'required|string|max:255',
            'client_phone'         => 'required|string|max:30',
            'client_phone_alt'     => 'nullable|string|max:30',
            'address'              => 'nullable|string|max:500',
            'notes'                => 'nullable|string',
            'deposit'              => 'nullable|numeric|min:0',
            'days'                 => 'required|array|min:1',
            'days.*'               => 'date',
            'items'                => 'nullable|array',
            'items.*.item_type'    => 'required_with:items|in:product,service',
            'items.*.item_id'      => 'required_with:items|integer',
            'items.*.item_name'    => 'required_with:items|string',
            'items.*.quantity'     => 'required_with:items|integer|min:1',
            'items.*.unit_price'   => 'required_with:items|numeric|min:0',
            'workers'              => 'nullable|array',
            'workers.*.worker_name' => 'required_with:workers|string',
            'workers.*.cost'        => 'required_with:workers|numeric|min:0',
            'expenses'             => 'nullable|array',
            'expenses.*.name'       => 'required_with:expenses|string',
            'expenses.*.quantity'   => 'required_with:expenses|integer|min:1',
            'expenses.*.unit_price' => 'required_with:expenses|numeric|min:0',
        ]);

        DB::transaction(function () use ($request, $booking) {
            $booking->update([
                'client_name'      => $request->client_name,
                'client_phone'     => $request->client_phone,
                'client_phone_alt' => $request->client_phone_alt,
                'address'          => $request->address,
                'notes'            => $request->notes,
                'deposit'          => $request->deposit ?? 0,
            ]);

            // حذف كل شيء وإعادة الإنشاء
            $booking->expenses()->delete();
            $booking->workers()->delete();
            $booking->items()->delete();
            $booking->days()->delete();

            $dayMap = [];
            foreach ($request->days as $index => $date) {
                $day = BookingDay::create(['booking_id' => $booking->id, 'date' => $date]);
                $dayMap[$index] = $day->id;
            }

            $itemMap = [];
            foreach ($request->items ?? [] as $index => $itemData) {
                $dayId = isset($itemData['day_index']) ? ($dayMap[$itemData['day_index']] ?? null) : null;
                $item = BookingItem::create([
                    'booking_id'     => $booking->id,
                    'booking_day_id' => $dayId,
                    'item_type'      => $itemData['item_type'],
                    'item_id'        => $itemData['item_id'],
                    'item_name'      => $itemData['item_name'],
                    'quantity'       => $itemData['quantity'],
                    'unit_price'     => $itemData['unit_price'],
                ]);
                $itemMap[$index] = $item->id;
            }

            foreach ($request->workers ?? [] as $workerData) {
                $dayId  = isset($workerData['day_index'])  ? ($dayMap[$workerData['day_index']]  ?? null) : null;
                $itemId = isset($workerData['item_index']) ? ($itemMap[$workerData['item_index']] ?? null) : null;
                BookingWorker::create([
                    'booking_id'      => $booking->id,
                    'booking_day_id'  => $dayId,
                    'worker_id'       => $workerData['worker_id'] ?? null,
                    'worker_name'     => $workerData['worker_name'],
                    'cost'            => $workerData['cost'],
                    'booking_item_id' => $itemId,
                ]);
            }

            foreach ($request->expenses ?? [] as $expenseData) {
                $dayId = isset($expenseData['day_index']) ? ($dayMap[$expenseData['day_index']] ?? null) : null;
                BookingExpense::create([
                    'booking_id'     => $booking->id,
                    'booking_day_id' => $dayId,
                    'name'           => $expenseData['name'],
                    'quantity'       => $expenseData['quantity'] ?? 1,
                    'unit_price'     => $expenseData['unit_price'],
                ]);
            }
        });

        $booking->refresh();
        return response()->json($this->loadFull($booking));
    }

    // ─── تحديث التسبيق فقط ────────────────────────────────────────────────────

    public function updateDeposit(Request $request, Booking $booking)
    {
        $this->authorizeBooking($request, $booking);
        $request->validate(['deposit' => 'required|numeric|min:0']);
        $booking->update(['deposit' => $request->deposit]);
        return response()->json(['deposit' => $booking->deposit]);
    }

    // ─── تغيير الحالة ─────────────────────────────────────────────────────────

    public function confirm(Request $request, Booking $booking)
    {
        $this->authorizeBooking($request, $booking);
        $booking->update(['status' => 'confirmed']);
        NotificationService::forBusiness(
            $booking->business_id, 'booking',
            'تم تأكيد الحجز',
            'تم تأكيد حجز العميل: ' . $booking->client_name,
            $booking->id, 'booking'
        );
        return response()->json($this->loadFull($booking));
    }

    public function complete(Request $request, Booking $booking)
    {
        $this->authorizeBooking($request, $booking);
        $booking->update(['status' => 'completed']);
        NotificationService::forBusiness(
            $booking->business_id, 'booking',
            'اكتمل الحجز',
            'اكتمل حجز العميل: ' . $booking->client_name,
            $booking->id, 'booking'
        );
        return response()->json($this->loadFull($booking));
    }

    public function cancel(Request $request, Booking $booking)
    {
        $this->authorizeBooking($request, $booking);
        $booking->update(['status' => 'cancelled']);
        NotificationService::forBusiness(
            $booking->business_id, 'booking',
            'تم إلغاء الحجز',
            'تم إلغاء حجز العميل: ' . $booking->client_name,
            $booking->id, 'booking'
        );
        return response()->json($this->loadFull($booking));
    }

    // ─── أيام الحجز ───────────────────────────────────────────────────────────

    public function storeDay(Request $request, Booking $booking)
    {
        $this->authorizeBooking($request, $booking);
        $request->validate(['date' => 'required|date']);
        $day = BookingDay::create(['booking_id' => $booking->id, 'date' => $request->date]);
        return response()->json($day, 201);
    }

    public function destroyDay(Request $request, Booking $booking, BookingDay $day)
    {
        $this->authorizeBooking($request, $booking);
        $day->delete();
        return response()->json(['message' => 'تم حذف اليوم']);
    }

    // ─── منتجات وخدمات الحجز ──────────────────────────────────────────────────

    public function storeItem(Request $request, Booking $booking)
    {
        $this->authorizeBooking($request, $booking);
        $request->validate([
            'booking_day_id' => 'nullable|exists:booking_days,id',
            'item_type'      => 'required|in:product,service',
            'item_id'        => 'required|integer',
            'item_name'      => 'required|string',
            'quantity'       => 'required|integer|min:1',
            'unit_price'     => 'required|numeric|min:0',
        ]);
        $item = BookingItem::create(array_merge(['booking_id' => $booking->id], $request->only([
            'booking_day_id','item_type','item_id','item_name','quantity','unit_price',
        ])));
        return response()->json($item, 201);
    }

    public function updateItem(Request $request, Booking $booking, BookingItem $item)
    {
        $this->authorizeBooking($request, $booking);
        $item->update($request->only(['booking_day_id','quantity','unit_price']));
        return response()->json($item);
    }

    public function destroyItem(Request $request, Booking $booking, BookingItem $item)
    {
        $this->authorizeBooking($request, $booking);
        $item->delete();
        return response()->json(['message' => 'تم حذف العنصر']);
    }

    // ─── عمال الحجز ───────────────────────────────────────────────────────────

    public function storeWorker(Request $request, Booking $booking)
    {
        $this->authorizeBooking($request, $booking);
        $request->validate([
            'worker_id'       => 'nullable|exists:workers,id',
            'worker_name'     => 'required|string',
            'cost'            => 'required|numeric|min:0',
            'booking_day_id'  => 'nullable|exists:booking_days,id',
            'booking_item_id' => 'nullable|exists:booking_items,id',
        ]);
        $worker = BookingWorker::create(array_merge(['booking_id' => $booking->id], $request->only([
            'worker_id','worker_name','cost','booking_day_id','booking_item_id',
        ])));
        return response()->json($worker, 201);
    }

    public function updateWorker(Request $request, Booking $booking, BookingWorker $worker)
    {
        $this->authorizeBooking($request, $booking);
        $worker->update($request->only(['worker_name','cost','booking_day_id','booking_item_id']));
        return response()->json($worker);
    }

    public function destroyWorker(Request $request, Booking $booking, BookingWorker $worker)
    {
        $this->authorizeBooking($request, $booking);
        $worker->delete();
        return response()->json(['message' => 'تم حذف العامل']);
    }

    // ─── مصاريف الحجز ─────────────────────────────────────────────────────────

    public function storeExpense(Request $request, Booking $booking)
    {
        $this->authorizeBooking($request, $booking);
        $request->validate([
            'name'           => 'required|string',
            'quantity'       => 'required|integer|min:1',
            'unit_price'     => 'required|numeric|min:0',
            'booking_day_id' => 'nullable|exists:booking_days,id',
        ]);
        $expense = BookingExpense::create(array_merge(['booking_id' => $booking->id], $request->only([
            'name','quantity','unit_price','booking_day_id',
        ])));
        return response()->json($expense, 201);
    }

    public function updateExpense(Request $request, Booking $booking, BookingExpense $expense)
    {
        $this->authorizeBooking($request, $booking);
        $expense->update($request->only(['name','quantity','unit_price','booking_day_id']));
        return response()->json($expense);
    }

    public function destroyExpense(Request $request, Booking $booking, BookingExpense $expense)
    {
        $this->authorizeBooking($request, $booking);
        $expense->delete();
        return response()->json(['message' => 'تم حذف المصروف']);
    }

    // ─── مساعد ────────────────────────────────────────────────────────────────

    private function authorizeBooking(Request $request, Booking $booking): void
    {
        if ($booking->business_id !== $request->user()->business->id) {
            abort(403, 'غير مصرح');
        }
    }

    private function loadFull(Booking $booking): Booking
    {
        return $booking->load(['days', 'items', 'workers', 'expenses']);
    }
}