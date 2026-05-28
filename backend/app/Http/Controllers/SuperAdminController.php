<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use App\Models\User;
use App\Models\Business;
use App\Models\ServiceCategory;
use App\Models\ProductCategory;
use App\Models\InvoiceCategory;

class SuperAdminController extends Controller
{
    // ══════════════════════════════════════════════════════════════════
    //  إحصائيات داشبورد السوبر أدمن
    // ══════════════════════════════════════════════════════════════════

    public function dashboardStatistics()
    {
        // ── إحصائيات المحلات ──────────────────────────────────────────
        $biz = Business::selectRaw('
            COUNT(*)                          AS total,
            SUM(status = "active")            AS active,
            SUM(status = "disabled")          AS disabled,
            SUM(status = "expiring_soon")     AS expiring_soon,
            SUM(status = "expired")           AS expired
        ')->first();

        // ── أصحاب المحلات ─────────────────────────────────────────────
        $ownersCount = User::where('role', 'admin')->count();

        // ── الحجوزات والمحتوى ─────────────────────────────────────────
        $bookingsCount  = DB::table('bookings')->count();
        $productsCount  = DB::table('products')->count();
        $servicesCount  = DB::table('services')->count();
        $workersCount   = DB::table('workers')->count();
        $invoicesCount  = DB::table('invoices')->count();

        // ── الإيرادات من بنود الحجوزات (مؤكدة + منتهية) ──────────────
        $revenue = (float) DB::table('booking_items')
            ->join('bookings', 'booking_items.booking_id', '=', 'bookings.id')
            ->whereIn('bookings.status', ['confirmed', 'completed'])
            ->sum(DB::raw('booking_items.quantity * booking_items.unit_price'));

        // ── مصاريف الحجوزات ───────────────────────────────────────────
        $expBookings = (float) DB::table('booking_expenses')
            ->join('bookings', 'booking_expenses.booking_id', '=', 'bookings.id')
            ->whereIn('bookings.status', ['confirmed', 'completed'])
            ->sum(DB::raw('booking_expenses.quantity * booking_expenses.unit_price'));

        // ── تكلفة العمال ──────────────────────────────────────────────
        $expWorkers = (float) DB::table('booking_workers')
            ->join('bookings', 'booking_workers.booking_id', '=', 'bookings.id')
            ->whereIn('bookings.status', ['confirmed', 'completed'])
            ->sum('booking_workers.cost');

        // ── مجموع فواتير المحلات ──────────────────────────────────────
        $expInvoices = (float) DB::table('invoices')->sum('total_amount');

        // ── صافي الربح ───────────────────────────────────────────────
        $netProfit = $revenue - $expBookings - $expWorkers - $expInvoices;

        // ── أحدث 5 محلات ─────────────────────────────────────────────
        $recentBusinesses = Business::withCount('bookings')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($b) => [
                'id'             => $b->id,
                'name'           => $b->name,
                'city'           => $b->city ?? '',
                'status'         => $b->status,
                'bookings_count' => $b->bookings_count ?? 0,
                'created_at'     => $b->created_at ? $b->created_at->toDateString() : '',
            ]);

        // ── أكثر 5 محلات نشاطاً (بالحجوزات) ─────────────────────────
        $topBusinesses = Business::withCount('bookings')
            ->orderBy('bookings_count', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($b) => [
                'id'             => $b->id,
                'name'           => $b->name,
                'city'           => $b->city ?? '',
                'status'         => $b->status,
                'bookings_count' => $b->bookings_count ?? 0,
            ]);

        return response()->json([
            'businesses' => [
                'total'         => (int) ($biz->total         ?? 0),
                'active'        => (int) ($biz->active        ?? 0),
                'disabled'      => (int) ($biz->disabled      ?? 0),
                'expiring_soon' => (int) ($biz->expiring_soon ?? 0),
                'expired'       => (int) ($biz->expired       ?? 0),
            ],
            'owners'            => $ownersCount,
            'bookings_total'    => $bookingsCount,
            'products_total'    => $productsCount,
            'services_total'    => $servicesCount,
            'workers_total'     => $workersCount,
            'invoices_total'    => $invoicesCount,
            'revenue'           => $revenue,
            'expenses_bookings' => $expBookings,
            'expenses_workers'  => $expWorkers,
            'expenses_invoices' => $expInvoices,
            'net_profit'        => $netProfit,
            'recent_businesses' => $recentBusinesses,
            'top_businesses'    => $topBusinesses,
        ]);
    }

    // ── قائمة المحلات ──────────────────────────────────────────────────────

    public function index()
    {
        $businesses = Business::with('admin')
            ->withCount(['bookings', 'products', 'services', 'workers'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($b) => $this->formatBusiness($b));

        return response()->json($businesses);
    }

    // ── إنشاء محل جديد مع حساب المدير ────────────────────────────────────

    public function store(Request $request)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'phone'          => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:255',
            'city'           => 'nullable|string|max:100',
            'address'        => 'nullable|string|max:500',
            'plan'           => 'nullable|in:Basic,Premium,Enterprise',
            'plan_expiry'    => 'nullable|date',
            'status'         => 'nullable|in:active,disabled',
            'owner_name'     => 'required|string|max:255',
            'owner_email'    => 'required|email|unique:users,email',
            'owner_phone'    => 'nullable|string|max:20',
            'owner_password' => ['required', Password::min(8)],
        ]);

        $result = DB::transaction(function () use ($request) {

            // الخطوة 1: إنشاء حساب المدير
            $user = User::create([
                'name'     => $request->owner_name,
                'email'    => $request->owner_email,
                'phone'    => $request->owner_phone,
                'password' => Hash::make($request->owner_password),
                'role'     => 'admin',
                'status'   => 'active',
            ]);

            // الخطوة 2: إنشاء المحل وربطه بالمدير
            $business = Business::create([
                'admin_id'   => $user->id,
                'name'       => $request->name,
                'phone'      => $request->phone,
                'email'      => $request->email,
                'city'       => $request->city,
                'address'    => $request->address,
                'plan'       => $request->plan       ?? 'Basic',
                'plan_expiry'=> $request->plan_expiry,
                'status'     => $request->status     ?? 'active',
            ]);

            // الخطوة 3: إنشاء البيانات الافتراضية
            $this->createDefaultData($business);

            return ['user' => $user, 'business' => $business];
        });

        $business = Business::with('admin')
            ->withCount(['bookings', 'products', 'services', 'workers'])
            ->find($result['business']->id);

        NotificationService::forSystem(
            'business',
            'محل جديد',
            'تم إنشاء محل جديد: ' . $business->name . ' في ' . ($business->city ?? 'غير محدد'),
            $business->id, 'business'
        );

        return response()->json([
            'message'  => 'تم إنشاء المحل وحساب المدير بنجاح',
            'business' => $this->formatBusiness($business),
        ], 201);
    }

    // ── تعديل بيانات محل ────────────────────────────────────────────────

    public function update(Request $request, $id)
    {
        $business = Business::findOrFail($id);

        $request->validate([
            'name'        => 'required|string|max:255',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:255',
            'city'        => 'nullable|string|max:100',
            'address'     => 'nullable|string|max:500',
            'plan'        => 'nullable|in:Basic,Premium,Enterprise',
            'plan_expiry' => 'nullable|date',
            'status'      => 'nullable|in:active,disabled,expiring_soon,expired',
            'owner_name'  => 'nullable|string|max:255',
            'owner_email' => 'nullable|email|unique:users,email,' . $business->admin_id,
            'owner_phone' => 'nullable|string|max:20',
        ]);

        DB::transaction(function () use ($request, $business) {

            $business->update([
                'name'       => $request->name,
                'phone'      => $request->phone,
                'email'      => $request->email,
                'city'       => $request->city,
                'address'    => $request->address,
                'plan'       => $request->plan       ?? $business->plan,
                'plan_expiry'=> $request->plan_expiry ?? $business->plan_expiry,
                'status'     => $request->status     ?? $business->status,
            ]);

            if ($business->admin) {
                $business->admin->update(array_filter([
                    'name'  => $request->owner_name,
                    'email' => $request->owner_email,
                    'phone' => $request->owner_phone,
                ]));
            }
        });

        $business->refresh()->load('admin');
        $business->loadCount(['bookings', 'products', 'services', 'workers']);

        return response()->json([
            'message'  => 'تم تحديث بيانات المحل بنجاح',
            'business' => $this->formatBusiness($business),
        ]);
    }

    // ── تفعيل أو تعطيل محل ──────────────────────────────────────────────

    public function toggleStatus($id)
    {
        $business = Business::findOrFail($id);

        $newStatus = in_array($business->status, ['active', 'expiring_soon'])
            ? 'disabled'
            : 'active';

        $business->update(['status' => $newStatus]);

        NotificationService::forSystem(
            'business',
            $newStatus === 'active' ? 'تم تفعيل محل' : 'تم تعطيل محل',
            ($newStatus === 'active' ? 'تم تفعيل المحل: ' : 'تم تعطيل المحل: ') . $business->name,
            $business->id, 'business'
        );

        return response()->json([
            'message' => $newStatus === 'active' ? 'تم تفعيل المحل بنجاح' : 'تم تعطيل المحل بنجاح',
            'status'  => $newStatus,
        ]);
    }

    // ── حذف محل ─────────────────────────────────────────────────────────

    public function destroy($id)
    {
        $business = Business::with('admin')->findOrFail($id);
        $bizName  = $business->name;

        DB::transaction(function () use ($business) {
            $adminId = $business->admin_id;
            $business->delete();
            if ($adminId) {
                User::where('id', $adminId)->where('role', 'admin')->delete();
            }
        });

        NotificationService::forSystem(
            'business',
            'تم حذف محل',
            'تم حذف المحل: ' . $bizName . ' وحساب المدير المرتبط به'
        );

        return response()->json(['message' => 'تم حذف المحل وحساب المدير بنجاح']);
    }

    // ── إنشاء البيانات الافتراضية ────────────────────────────────────────

    private function createDefaultData(Business $business): void
    {
        // فئات الخدمات
        foreach (['التصوير', 'الديكور', 'الضيافة', 'الصوتيات', 'التأجير'] as $name) {
            ServiceCategory::create(['business_id' => $business->id, 'name' => $name]);
        }

        // فئات المنتجات
        foreach (['معدات', 'ديكور', 'مستلزمات', 'إضاءة'] as $name) {
            ProductCategory::create(['business_id' => $business->id, 'name' => $name]);
        }

        // فئات الفواتير
        foreach (['إيرادات المناسبات', 'مصاريف التشغيل', 'رواتب', 'متفرقات'] as $name) {
            InvoiceCategory::create(['business_id' => $business->id, 'name' => $name]);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  أصحاب المحلات
    // ══════════════════════════════════════════════════════════════════

    // ── قائمة أصحاب المحلات ─────────────────────────────────────────

    public function owners()
    {
        $owners = User::where('role', 'admin')
            ->with('business')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($u) => $this->formatOwner($u));

        return response()->json($owners);
    }

    // ── تعديل بيانات صاحب المحل ─────────────────────────────────────

    public function updateOwner(Request $request, $id)
    {
        $user = User::where('id', $id)->where('role', 'admin')->firstOrFail();

        $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update([
            'name'  => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
        ]);

        return response()->json([
            'message' => 'تم تحديث بيانات صاحب المحل بنجاح',
            'owner'   => $this->formatOwner($user->fresh()->load('business')),
        ]);
    }

    // ── تفعيل / تعطيل حساب صاحب المحل ──────────────────────────────

    public function toggleOwnerStatus($id)
    {
        $user = User::where('id', $id)->where('role', 'admin')->firstOrFail();

        $newStatus = $user->status === 'active' ? 'disabled' : 'active';
        $user->update(['status' => $newStatus]);

        return response()->json([
            'message' => $newStatus === 'active' ? 'تم تفعيل الحساب بنجاح' : 'تم تعطيل الحساب بنجاح',
            'status'  => $newStatus,
        ]);
    }

    // ── إعادة تعيين كلمة المرور ──────────────────────────────────────

    public function resetOwnerPassword(Request $request, $id)
    {
        $user = User::where('id', $id)->where('role', 'admin')->firstOrFail();

        $request->validate([
            'password' => ['required', Password::min(8)],
        ]);

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'تم تعيين كلمة المرور الجديدة بنجاح']);
    }

    // ── حذف صاحب المحل وبياناته ─────────────────────────────────────

    public function destroyOwner($id)
    {
        $user = User::where('id', $id)->where('role', 'admin')->with('business')->firstOrFail();

        DB::transaction(function () use ($user) {
            if ($user->business) {
                $user->business->delete();
            }
            $user->delete();
        });

        return response()->json(['message' => 'تم حذف الحساب والمحل المرتبط به بنجاح']);
    }

    // ── تنسيق بيانات صاحب المحل للإرسال ────────────────────────────

    private function formatOwner(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'phone'      => $user->phone      ?? '',
            'status'     => $user->status     ?? 'active',
            'created_at' => $user->created_at ? $user->created_at->toDateString() : '',
            'business'   => $user->business ? [
                'id'   => $user->business->id,
                'name' => $user->business->name,
                'city' => $user->business->city ?? '',
                'plan' => $user->business->plan ?? 'Basic',
            ] : null,
        ];
    }

    // ── تنسيق بيانات المحل للإرسال ──────────────────────────────────

    private function formatBusiness(Business $business): array
    {
        return [
            'id'           => $business->id,
            'name'         => $business->name,
            'phone'        => $business->phone        ?? '',
            'email'        => $business->email        ?? '',
            'city'         => $business->city         ?? '',
            'address'      => $business->address      ?? '',
            'plan'         => $business->plan         ?? 'Basic',
            'plan_expiry'  => $business->plan_expiry  ?? '',
            'status'       => $business->status       ?? 'active',
            'bookings'     => $business->bookings_count  ?? 0,
            'products'     => $business->products_count  ?? 0,
            'services'     => $business->services_count  ?? 0,
            'workers'      => $business->workers_count   ?? 0,
            'registered_at'=> $business->created_at ? $business->created_at->toDateString() : '',
            'owner' => $business->admin ? [
                'id'    => $business->admin->id,
                'name'  => $business->admin->name,
                'email' => $business->admin->email,
                'phone' => $business->admin->phone ?? '',
            ] : null,
        ];
    }
}