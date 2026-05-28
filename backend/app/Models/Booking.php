<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'business_id', 'client_name', 'client_phone', 'client_phone_alt',
        'address', 'status', 'notes', 'deposit',
    ];

    public function business()   { return $this->belongsTo(Business::class); }
    public function days()       { return $this->hasMany(BookingDay::class); }
    public function items()      { return $this->hasMany(BookingItem::class); }
    public function workers()    { return $this->hasMany(BookingWorker::class); }
    public function expenses()   { return $this->hasMany(BookingExpense::class); }

    public function getRevenueAttribute(): float
    {
        return $this->items->sum(fn($i) => $i->quantity * $i->unit_price);
    }

    public function getCostsAttribute(): float
    {
        $workerCosts  = $this->workers->sum('cost');
        $expenseCosts = $this->expenses->sum(fn($e) => $e->quantity * $e->unit_price);
        return $workerCosts + $expenseCosts;
    }

    public function getNetProfitAttribute(): float
    {
        return $this->revenue - $this->costs;
    }
}