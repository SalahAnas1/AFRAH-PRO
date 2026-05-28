<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceCategory extends Model
{
    protected $fillable = ['business_id', 'name'];

    // علاقة: فئة واحدة لها خدمات كثيرة
    public function services()
    {
        return $this->hasMany(Service::class, 'category_id');
    }

    // علاقة: الفئة تنتمي لمحل
    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}