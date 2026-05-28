<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WorkerController extends Controller
{
    public function index(Request $request)
    {
        $business = $request->user()->business;

        $query = Worker::where('business_id', $business->id);

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->latest()->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'role'  => 'nullable|string|max:100',
            'image' => 'nullable|image|max:5120',
        ]);

        $business = $request->user()->business;

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('workers', 'public');
        }

        $worker = Worker::create([
            'business_id' => $business->id,
            'name'        => $request->name,
            'phone'       => $request->phone,
            'role'        => $request->role,
            'image'       => $imagePath,
        ]);

        return response()->json($worker, 201);
    }

    public function update(Request $request, Worker $worker)
    {
        $request->validate([
            'name'  => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'role'  => 'nullable|string|max:100',
            'image' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            if ($worker->image) {
                Storage::disk('public')->delete($worker->image);
            }
            $worker->image = $request->file('image')->store('workers', 'public');
        }

        $worker->update([
            'name'  => $request->name,
            'phone' => $request->phone,
            'role'  => $request->role,
            'image' => $worker->image,
        ]);

        return response()->json($worker);
    }

    public function destroy(Worker $worker)
    {
        if ($worker->image) {
            Storage::disk('public')->delete($worker->image);
        }
        $worker->delete();

        return response()->json(['message' => 'تم حذف العامل بنجاح']);
    }
}