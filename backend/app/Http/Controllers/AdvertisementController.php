<?php

namespace App\Http\Controllers;

use App\Models\Advertisement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdvertisementController extends Controller
{
    // ══════════════════════════════════════════════════════════════════
    //  Super Admin — إدارة الإعلانات
    // ══════════════════════════════════════════════════════════════════

    public function index()
    {
        return response()->json(
            Advertisement::with('creator:id,name')->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image'       => 'nullable|image|max:5120',
            'link'        => 'nullable|string|max:500',
            'status'      => 'required|in:active,inactive',
            'ad_type'     => 'nullable|in:large,small',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('advertisements', 'public');
        }

        $ad = Advertisement::create([
            'title'       => $request->title,
            'description' => $request->description ?: null,
            'image'       => $imagePath,
            'link'        => $request->link ?: null,
            'status'      => $request->status,
            'ad_type'     => $request->ad_type ?? 'small',
            'start_date'  => $request->start_date,
            'end_date'    => $request->end_date,
            'created_by'  => $request->user()->id,
        ]);

        return response()->json($ad->load('creator:id,name'), 201);
    }

    public function show(Advertisement $advertisement)
    {
        return response()->json($advertisement->load('creator:id,name'));
    }

    public function update(Request $request, Advertisement $advertisement)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image'       => 'nullable|image|max:5120',
            'link'        => 'nullable|string|max:500',
            'status'      => 'required|in:active,inactive',
            'ad_type'     => 'nullable|in:large,small',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
        ]);

        $data = [
            'title'       => $request->title,
            'description' => $request->description ?: null,
            'link'        => $request->link ?: null,
            'status'      => $request->status,
            'ad_type'     => $request->ad_type ?? $advertisement->ad_type ?? 'small',
            'start_date'  => $request->start_date,
            'end_date'    => $request->end_date,
        ];

        if ($request->hasFile('image')) {
            if ($advertisement->image) {
                Storage::disk('public')->delete($advertisement->image);
            }
            $data['image'] = $request->file('image')->store('advertisements', 'public');
        }

        $advertisement->update($data);

        return response()->json($advertisement->fresh()->load('creator:id,name'));
    }

    public function destroy(Advertisement $advertisement)
    {
        if ($advertisement->image) {
            Storage::disk('public')->delete($advertisement->image);
        }
        $advertisement->delete();

        return response()->json(['message' => 'تم حذف الإعلان بنجاح']);
    }

    // ══════════════════════════════════════════════════════════════════
    //  Admin — الإعلانات النشطة مقسومة حسب النوع
    // ══════════════════════════════════════════════════════════════════

    public function active()
    {
        $today = now()->toDateString();

        $base = Advertisement::where('status', 'active')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today);

        $large = (clone $base)->where('ad_type', 'large')->latest()->first();
        $small = (clone $base)->where('ad_type', 'small')->latest()->first();

        return response()->json([
            'large' => $large,
            'small' => $small,
        ]);
    }
}