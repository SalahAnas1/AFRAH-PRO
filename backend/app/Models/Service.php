<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'business_id',
        'category_id',
        'name',
        'description',
        'price',
        'image',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    // علاقة: الخدمة تنتمي لفئة
    public function category()
    {
        return $this->belongsTo(ServiceCategory::class, 'category_id');
    }

    // علاقة: الخدمة تنتمي لمحل
    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}