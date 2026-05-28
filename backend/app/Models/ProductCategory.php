<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    protected $fillable = ['business_id', 'name'];

    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}