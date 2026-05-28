<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'business_id',
        'category_id',
        'supplier',
        'invoice_date',
        'total_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'invoice_date' => 'date',
    ];

    public function category()
    {
        return $this->belongsTo(InvoiceCategory::class, 'category_id');
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}