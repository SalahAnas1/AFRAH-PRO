<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingWorker extends Model
{
    protected $fillable = [
        'booking_id', 'booking_day_id', 'worker_id',
        'worker_name', 'cost', 'booking_item_id',
    ];
    protected $casts = ['cost' => 'decimal:2'];

    public function booking()     { return $this->belongsTo(Booking::class); }
    public function bookingDay()  { return $this->belongsTo(BookingDay::class); }
    public function worker()      { return $this->belongsTo(Worker::class); }
    public function bookingItem() { return $this->belongsTo(BookingItem::class); }
}