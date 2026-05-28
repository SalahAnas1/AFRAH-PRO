<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Worker extends Model
{
    protected $fillable = [
        'business_id',
        'name',
        'phone',
        'role',
        'image',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}