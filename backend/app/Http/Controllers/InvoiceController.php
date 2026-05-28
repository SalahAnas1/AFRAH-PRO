<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceCategory;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $business = $request->user()->business;

        $base = Invoice::where('business_id', $business->id);

        if ($request->search) {
            $base->where('supplier', 'like', '%' . $request->search . '%');
        }

        if ($request->category_id) {
            $base->where('category_id', $request->category_id);
        }

        if ($request->month) {
            [$year, $month] = explode('-', $request->month);
            $base->whereYear('invoice_date', $year)->whereMonth('invoice_date', $month);
        }

        // المجاميع قبل فلتر الحالة
        $totals = [
            'all'    => (clone $base)->sum('total_amount'),
            'paid'   => (clone $base)->where('status', 'paid')->sum('total_amount'),
            'unpaid' => (clone $base)->where('status', 'unpaid')->sum('total_amount'),
        ];

        if ($request->status) {
            $base->where('status', $request->status);
        }

        $paginated = $base->with('category')->latest('invoice_date')->paginate($request->per_page ?? 10);

        return response()->json(array_merge($paginated->toArray(), ['totals' => $totals]));
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_id'  => 'nullable|exists:invoice_categories,id',
            'supplier'     => 'required|string|max:255',
            'invoice_date' => 'required|date',
            'total_amount' => 'required|numeric|min:0',
            'status'       => 'required|in:paid,unpaid',
            'notes'        => 'nullable|string',
        ]);

        $business = $request->user()->business;

        $invoice = Invoice::create([
            'business_id'  => $business->id,
            'category_id'  => $request->category_id ?: null,
            'supplier'     => $request->supplier,
            'invoice_date' => $request->invoice_date,
            'total_amount' => $request->total_amount,
            'status'       => $request->status,
            'notes'        => $request->notes,
        ]);

        $title   = $request->status === 'unpaid' ? 'فاتورة غير مدفوعة' : 'فاتورة جديدة';
        $message = $title . ' من ' . $request->supplier . ' بقيمة ' . number_format((float)$request->total_amount, 2) . ' د.م';
        NotificationService::forBusiness($business->id, 'invoice', $title, $message, $invoice->id, 'invoice');

        return response()->json($invoice->load('category'), 201);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $request->validate([
            'category_id'  => 'nullable|exists:invoice_categories,id',
            'supplier'     => 'required|string|max:255',
            'invoice_date' => 'required|date',
            'total_amount' => 'required|numeric|min:0',
            'status'       => 'required|in:paid,unpaid',
            'notes'        => 'nullable|string',
        ]);

        $invoice->update([
            'category_id'  => $request->category_id ?: null,
            'supplier'     => $request->supplier,
            'invoice_date' => $request->invoice_date,
            'total_amount' => $request->total_amount,
            'status'       => $request->status,
            'notes'        => $request->notes,
        ]);

        return response()->json($invoice->load('category'));
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();
        return response()->json(['message' => 'تم حذف الفاتورة بنجاح']);
    }

    public function categories(Request $request)
    {
        $business = $request->user()->business;
        return response()->json(
            InvoiceCategory::where('business_id', $business->id)->orderBy('name')->get()
        );
    }

    public function storeCategory(Request $request)
    {
        $request->validate(['name' => 'required|string|max:100']);
        $business = $request->user()->business;
        $category = InvoiceCategory::create([
            'business_id' => $business->id,
            'name'        => $request->name,
        ]);
        return response()->json($category, 201);
    }

    public function destroyCategory(Request $request, InvoiceCategory $invoiceCategory)
    {
        $business = $request->user()->business;
        if ($invoiceCategory->business_id !== $business->id) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }
        $invoiceCategory->delete();
        return response()->json(['message' => 'تم حذف الفئة بنجاح']);
    }
}