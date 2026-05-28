<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    public static function forBusiness(
        int    $businessId,
        string $type,
        string $title,
        string $message,
        ?int   $relatedId   = null,
        ?string $relatedType = null
    ): void {
        Notification::create([
            'business_id'  => $businessId,
            'type'         => $type,
            'title'        => $title,
            'message'      => $message,
            'related_id'   => $relatedId,
            'related_type' => $relatedType,
        ]);
    }

    public static function forSystem(
        string $type,
        string $title,
        string $message,
        ?int   $relatedId   = null,
        ?string $relatedType = null
    ): void {
        Notification::create([
            'business_id'  => null,
            'type'         => $type,
            'title'        => $title,
            'message'      => $message,
            'related_id'   => $relatedId,
            'related_type' => $relatedType,
        ]);
    }
}