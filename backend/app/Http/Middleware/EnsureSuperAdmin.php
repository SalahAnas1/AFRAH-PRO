<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->role !== 'super_admin') {
            return response()->json([
                'message' => 'غير مصرح لك. هذه المنطقة مخصصة للسوبر أدمن فقط.',
            ], 403);
        }

        return $next($request);
    }
}