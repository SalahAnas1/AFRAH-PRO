<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('email')->nullable()->after('phone');
            $table->string('city')->nullable()->after('address');
            $table->text('description')->nullable()->after('city');
            $table->string('cover_image')->nullable()->after('logo');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['email', 'city', 'description', 'cover_image']);
        });
    }
};