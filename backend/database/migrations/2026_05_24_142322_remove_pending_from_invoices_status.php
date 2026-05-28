<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("UPDATE invoices SET status = 'unpaid' WHERE status = 'pending'");

        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check");
            DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('paid', 'unpaid'))");
        } else {
            DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('paid', 'unpaid') NOT NULL DEFAULT 'unpaid'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check");
            DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('paid', 'unpaid', 'pending'))");
        } else {
            DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('paid', 'unpaid', 'pending') NOT NULL DEFAULT 'unpaid'");
        }
    }
};