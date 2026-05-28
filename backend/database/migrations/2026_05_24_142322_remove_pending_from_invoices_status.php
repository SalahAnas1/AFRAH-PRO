<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // تحويل أي فاتورة معلقة إلى غير مدفوعة أولاً
        DB::statement("UPDATE invoices SET status = 'unpaid' WHERE status = 'pending'");
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('paid', 'unpaid') NOT NULL DEFAULT 'unpaid'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('paid', 'unpaid', 'pending') NOT NULL DEFAULT 'unpaid'");
    }
};