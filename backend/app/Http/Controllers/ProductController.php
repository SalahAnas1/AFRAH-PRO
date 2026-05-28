<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $business = $request->user()->business;

        $query = Product::with('category')
            ->where('business_id', $business->id);

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->stock_status === 'out') {
            $query->where('stock', 0);
        } elseif ($request->stock_status === 'low') {
            $query->where('stock', '>', 0)->where('stock', '<=', 10);
        }

        return response()->json($query->latest()->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'nullable|exists:product_categories,id',
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'stock'       => 'required|integer|min:0',
            'unit'        => 'required|string|max:50',
            'image'       => 'nullable|image|max:5120',
        ]);

        $business = $request->user()->business;

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        }

        $product = Product::create([
            'business_id' => $business->id,
            'category_id' => $request->category_id ?: null,
            'name'        => $request->name,
            'description' => $request->description,
            'price'       => $request->price,
            'stock'       => $request->stock,
            'unit'        => $request->unit,
            'image'       => $imagePath,
        ]);

        return response()->json($product->load('category'), 201);
    }

    public function update(Request $request, Product $product)
    {
        $request->validate([
            'category_id' => 'nullable|exists:product_categories,id',
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'stock'       => 'required|integer|min:0',
            'unit'        => 'required|string|max:50',
            'image'       => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $product->image = $request->file('image')->store('products', 'public');
        }

        $product->update([
            'category_id' => $request->category_id ?: null,
            'name'        => $request->name,
            'description' => $request->description,
            'price'       => $request->price,
            'stock'       => $request->stock,
            'unit'        => $request->unit,
            'image'       => $product->image,
        ]);

        return response()->json($product->load('category'));
    }

    public function destroy(Product $product)
    {
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }
        $product->delete();

        return response()->json(['message' => 'تم حذف المنتج بنجاح']);
    }

    public function categories(Request $request)
    {
        $business = $request->user()->business;
        return response()->json(
            ProductCategory::where('business_id', $business->id)->orderBy('name')->get()
        );
    }

    public function storeCategory(Request $request)
    {
        $request->validate(['name' => 'required|string|max:100']);

        $business = $request->user()->business;

        $category = ProductCategory::create([
            'business_id' => $business->id,
            'name'        => $request->name,
        ]);

        return response()->json($category, 201);
    }

    public function destroyCategory(Request $request, ProductCategory $productCategory)
    {
        $business = $request->user()->business;

        if ($productCategory->business_id !== $business->id) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        $productCategory->delete();

        return response()->json(['message' => 'تم حذف الفئة بنجاح']);
    }
}