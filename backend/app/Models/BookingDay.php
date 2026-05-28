<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingDay extends Model
{
    protected $fillable = ['booking_id', 'date'];
    protected $casts    = ['date' => 'date'];

    public function booking()  { return $this->belongsTo(Booking::class); }
    public function items()    { return $this->hasMany(BookingItem::class); }
    public function workers()  { return $this->hasMany(BookingWorker::class); }
    public function expenses() { return $this->hasMany(BookingExpense::class); }
}