<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\WorkerController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdvertisementController;

// مسارات المصادقة (لا تحتاج token)
Route::prefix('auth')->group(function () {
    Route::post('/login',  [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/me',      [AuthController::class, 'me'])->middleware('auth:sanctum');
});

// مسارات محمية (تحتاج token)
Route::middleware('auth:sanctum')->group(function () {

    // الخدمات
    Route::get('/services/categories',    [ServiceController::class, 'categories']);
    Route::post('/services/categories',   [ServiceController::class, 'storeCategory']);
    Route::delete('/services/categories/{serviceCategory}', [ServiceController::class, 'destroyCategory']);
    Route::apiResource('services', ServiceController::class);
    Route::get('/products/categories',    [ProductController::class, 'categories']);
    Route::post('/products/categories',   [ProductController::class, 'storeCategory']);
    Route::delete('/products/categories/{productCategory}', [ProductController::class, 'destroyCategory']);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('workers', WorkerController::class);
    Route::get('/invoices/categories',    [InvoiceController::class, 'categories']);
    Route::post('/invoices/categories',   [InvoiceController::class, 'storeCategory']);
    Route::delete('/invoices/categories/{invoiceCategory}', [InvoiceController::class, 'destroyCategory']);
    Route::apiResource('invoices', InvoiceController::class);

    // الحجوزات
    Route::apiResource('bookings', BookingController::class);
    Route::post('bookings/{booking}/confirm',  [BookingController::class, 'confirm']);
    Route::post('bookings/{booking}/complete', [BookingController::class, 'complete']);
    Route::post('bookings/{booking}/cancel',   [BookingController::class, 'cancel']);
    Route::put('bookings/{booking}/full',      [BookingController::class, 'fullUpdate']);
    Route::put('bookings/{booking}/deposit',   [BookingController::class, 'updateDeposit']);
    Route::post('bookings/{booking}/days',                          [BookingController::class, 'storeDay']);
    Route::delete('bookings/{booking}/days/{day}',                  [BookingController::class, 'destroyDay']);
    Route::post('bookings/{booking}/items',                         [BookingController::class, 'storeItem']);
    Route::put('bookings/{booking}/items/{item}',                   [BookingController::class, 'updateItem']);
    Route::delete('bookings/{booking}/items/{item}',                [BookingController::class, 'destroyItem']);
    Route::post('bookings/{booking}/workers',                       [BookingController::class, 'storeWorker']);
    Route::put('bookings/{booking}/workers/{worker}',               [BookingController::class, 'updateWorker']);
    Route::delete('bookings/{booking}/workers/{worker}',            [BookingController::class, 'destroyWorker']);
    Route::post('bookings/{booking}/expenses',                      [BookingController::class, 'storeExpense']);
    Route::put('bookings/{booking}/expenses/{expense}',             [BookingController::class, 'updateExpense']);
    Route::delete('bookings/{booking}/expenses/{expense}',          [BookingController::class, 'destroyExpense']);

    // الإعدادات
    Route::get('/settings/business',  [SettingsController::class, 'getBusiness']);
    Route::post('/settings/business', [SettingsController::class, 'updateBusiness']);
    Route::get('/settings/account',   [SettingsController::class, 'getAccount']);
    Route::put('/settings/account',   [SettingsController::class, 'updateAccount']);
    Route::put('/settings/password',  [SettingsController::class, 'changePassword']);

    // لوحة التحكم
    Route::get('/dashboard',          [DashboardController::class, 'index']);
    Route::get('/dashboard/calendar', [DashboardController::class, 'calendar']);

    // التقارير
    Route::get('/reports/daily',    [ReportController::class, 'daily']);
    Route::get('/reports/monthly',  [ReportController::class, 'monthly']);
    Route::get('/reports/annual',   [ReportController::class, 'annual']);
    Route::get('/reports/bookings', [ReportController::class, 'bookings']);
    Route::get('/reports/products', [ReportController::class, 'products']);
    Route::get('/reports/services', [ReportController::class, 'services']);
    Route::get('/reports/workers',  [ReportController::class, 'workers']);

    // المخزن
    Route::get('/inventory/calendar',  [InventoryController::class, 'calendar']);
    Route::get('/inventory/day',       [InventoryController::class, 'dayDetail']);
    Route::get('/inventory/movements', [InventoryController::class, 'movements']);
    Route::post('/inventory/movements',[InventoryController::class, 'store']);
    Route::get('/inventory/alerts',    [InventoryController::class, 'alerts']);

    // الإعلانات — للأدمن العادي (قراءة الإعلان النشط فقط)
    Route::get('/advertisements/active', [AdvertisementController::class, 'active']);

    // الإشعارات
    Route::get('/notifications',                         [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',            [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/mark-all-read',           [NotificationController::class, 'markAllRead']);
    Route::put('/notifications/{id}/mark-read',          [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{id}',                 [NotificationController::class, 'destroy']);

});

// ── مسارات السوبر أدمن (تحتاج token + role = super_admin) ────────────────────
Route::middleware(['auth:sanctum', 'super_admin'])->prefix('super-admin')->group(function () {
    // إحصائيات الداشبورد
    Route::get('/dashboard/statistics', [SuperAdminController::class, 'dashboardStatistics']);

    // المحلات
    Route::get('/businesses',                      [SuperAdminController::class, 'index']);
    Route::post('/businesses',                     [SuperAdminController::class, 'store']);
    Route::put('/businesses/{id}',                 [SuperAdminController::class, 'update']);
    Route::delete('/businesses/{id}',              [SuperAdminController::class, 'destroy']);
    Route::patch('/businesses/{id}/toggle-status', [SuperAdminController::class, 'toggleStatus']);

    // الإعلانات — إدارة كاملة للسوبر أدمن
    Route::get('/advertisements',                             [AdvertisementController::class, 'index']);
    Route::post('/advertisements',                            [AdvertisementController::class, 'store']);
    Route::get('/advertisements/{advertisement}',             [AdvertisementController::class, 'show']);
    Route::put('/advertisements/{advertisement}',             [AdvertisementController::class, 'update']);
    Route::delete('/advertisements/{advertisement}',          [AdvertisementController::class, 'destroy']);

    // أصحاب المحلات
    Route::get('/owners',                             [SuperAdminController::class, 'owners']);
    Route::put('/owners/{id}',                        [SuperAdminController::class, 'updateOwner']);
    Route::patch('/owners/{id}/toggle-status',        [SuperAdminController::class, 'toggleOwnerStatus']);
    Route::patch('/owners/{id}/reset-password',       [SuperAdminController::class, 'resetOwnerPassword']);
    Route::delete('/owners/{id}',                     [SuperAdminController::class, 'destroyOwner']);
});