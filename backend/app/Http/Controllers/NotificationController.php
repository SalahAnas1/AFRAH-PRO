<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    private function baseQuery(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'super_admin') {
            return Notification::whereNull('business_id');
        }

        $business = $user->business;
        return Notification::where('business_id', $business->id);
    }

    // GET /notifications
    public function index(Request $request)
    {
        $notifs = $this->baseQuery($request)
            ->orderByDesc('created_at')
            ->paginate(30);

        return response()->json($notifs);
    }

    // GET /notifications/unread-count
    public function unreadCount(Request $request)
    {
        $count = $this->baseQuery($request)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    // PUT /notifications/{id}/mark-read
    public function markRead(Request $request, int $id)
    {
        $notif = $this->baseQuery($request)->findOrFail($id);
        $notif->update(['is_read' => true]);
        return response()->json(['message' => 'تم تحديده كمقروء']);
    }

    // PUT /notifications/mark-all-read
    public function markAllRead(Request $request)
    {
        $this->baseQuery($request)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'تم تحديد الكل كمقروء']);
    }

    // DELETE /notifications/{id}
    public function destroy(Request $request, int $id)
    {
        $notif = $this->baseQuery($request)->findOrFail($id);
        $notif->delete();
        return response()->json(['message' => 'تم حذف الإشعار']);
    }
}