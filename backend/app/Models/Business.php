<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Business extends Model
{
    protected $fillable = [
        'admin_id', 'name', 'phone', 'email', 'address', 'city',
        'description', 'logo', 'cover_image', 'status', 'plan', 'plan_expiry',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function serviceCategories()
    {
        return $this->hasMany(ServiceCategory::class);
    }

    public function productCategories()
    {
        return $this->hasMany(ProductCategory::class);
    }

    public function invoiceCategories()
    {
        return $this->hasMany(InvoiceCategory::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function workers()
    {
        return $this->hasMany(Worker::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}