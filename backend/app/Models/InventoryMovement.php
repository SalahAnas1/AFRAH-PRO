<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    protected $fillable = [
        'business_id', 'product_id', 'booking_id', 'booking_day_id',
        'type', 'quantity', 'reason', 'notes',
    ];

    public function product()    { return $this->belongsTo(Product::class); }
    public function booking()    { return $this->belongsTo(Booking::class); }
    public function bookingDay() { return $this->belongsTo(BookingDay::class); }
    public function business()   { return $this->belongsTo(Business::class); }
}