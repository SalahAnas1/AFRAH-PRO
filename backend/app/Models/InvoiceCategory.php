<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceCategory extends Model
{
    protected $fillable = ['business_id', 'name'];

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'category_id');
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}