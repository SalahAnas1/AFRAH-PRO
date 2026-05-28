<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $business = $request->user()->business;

        $query = Service::with('category')
            ->where('business_id', $business->id);

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        return response()->json($query->latest()->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_id'  => 'required|exists:service_categories,id',
            'name'         => 'required|string|max:255',
            'description'  => 'nullable|string',
            'price'        => 'required|numeric|min:0',
            'image'        => 'nullable|image|max:5120',
        ]);

        $business = $request->user()->business;

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('services', 'public');
        }

        $service = Service::create([
            'business_id'  => $business->id,
            'category_id'  => $request->category_id,
            'name'         => $request->name,
            'description'  => $request->description,
            'price'        => $request->price,
            'image'        => $imagePath,
        ]);

        return response()->json($service->load('category'), 201);
    }

    public function update(Request $request, Service $service)
    {
        $request->validate([
            'category_id'  => 'required|exists:service_categories,id',
            'name'         => 'required|string|max:255',
            'description'  => 'nullable|string',
            'price'        => 'required|numeric|min:0',
            'image'        => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            if ($service->image) {
                Storage::disk('public')->delete($service->image);
            }
            $service->image = $request->file('image')->store('services', 'public');
        }

        $service->update([
            'category_id' => $request->category_id,
            'name'        => $request->name,
            'description' => $request->description,
            'price'       => $request->price,
            'image'       => $service->image,
        ]);

        return response()->json($service->load('category'));
    }

    public function destroy(Service $service)
    {
        if ($service->image) {
            Storage::disk('public')->delete($service->image);
        }
        $service->delete();

        return response()->json(['message' => 'تم حذف الخدمة بنجاح']);
    }

    public function categories(Request $request)
    {
        $business = $request->user()->business;
        return response()->json(
            ServiceCategory::where('business_id', $business->id)->orderBy('name')->get()
        );
    }

    // ── إضافة فئة جديدة ────────────────────────────────────────────────────
    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $business = $request->user()->business;

        $category = ServiceCategory::create([
            'business_id' => $business->id,
            'name'        => $request->name,
        ]);

        return response()->json($category, 201);
    }

    public function destroyCategory(Request $request, ServiceCategory $serviceCategory)
    {
        $business = $request->user()->business;

        if ($serviceCategory->business_id !== $business->id) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        $serviceCategory->delete();

        return response()->json(['message' => 'تم حذف الفئة بنجاح']);
    }
}