<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingItem extends Model
{
    protected $fillable = [
        'booking_id', 'booking_day_id', 'item_type', 'item_id',
        'item_name', 'quantity', 'unit_price',
    ];
    protected $casts = ['unit_price' => 'decimal:2'];

    public function booking()    { return $this->belongsTo(Booking::class); }
    public function bookingDay() { return $this->belongsTo(BookingDay::class); }
    public function workers()    { return $this->hasMany(BookingWorker::class); }
}