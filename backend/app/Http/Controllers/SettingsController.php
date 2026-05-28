<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class SettingsController extends Controller
{
    // GET /settings/business
    public function getBusiness(Request $request)
    {
        $b = $request->user()->business;
        return response()->json([
            'name'        => $b->name,
            'phone'       => $b->phone,
            'email'       => $b->email,
            'address'     => $b->address,
            'city'        => $b->city,
            'description' => $b->description,
            'logo'        => $b->logo        ? asset('storage/' . $b->logo)        : null,
            'cover_image' => $b->cover_image ? asset('storage/' . $b->cover_image) : null,
        ]);
    }

    // POST /settings/business  (multipart for file uploads)
    public function updateBusiness(Request $request)
    {
        $b    = $request->user()->business;
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'phone'       => 'nullable|string|max:30',
            'email'       => 'nullable|email|max:100',
            'address'     => 'nullable|string|max:255',
            'city'        => 'nullable|string|max:100',
            'description' => 'nullable|string|max:1000',
            'logo'        => 'nullable|image|max:2048',
            'cover_image' => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        } else {
            unset($data['logo']);
        }
        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('covers', 'public');
        } else {
            unset($data['cover_image']);
        }

        $b->update($data);
        return response()->json(['message' => 'تم الحفظ بنجاح', 'business' => [
            'name'        => $b->name,
            'logo'        => $b->logo        ? asset('storage/' . $b->logo)        : null,
            'cover_image' => $b->cover_image ? asset('storage/' . $b->cover_image) : null,
        ]]);
    }

    // GET /settings/account
    public function getAccount(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
        ]);
    }

    // PUT /settings/account
    public function updateAccount(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name'  => 'required|string|max:100',
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);
        $user->update($data);
        return response()->json(['message' => 'تم الحفظ بنجاح']);
    }

    // PUT /settings/password
    public function changePassword(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'current_password' => 'required',
            'password'         => ['required', 'confirmed', Password::min(8)],
        ]);
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['errors' => ['current_password' => ['كلمة المرور الحالية غير صحيحة']]], 422);
        }
        $user->update(['password' => Hash::make($request->password)]);
        return response()->json(['message' => 'تم تغيير كلمة المرور بنجاح']);
    }
}