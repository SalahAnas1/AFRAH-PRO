<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('booking_id')->nullable()->nullOnDelete();
            $table->foreignId('booking_day_id')->nullable()->nullOnDelete();
            $table->enum('type', ['in','out','return','adjustment']);
            $table->integer('quantity');
            $table->enum('reason', ['broken','damaged','lost','sold','consumed','other'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};