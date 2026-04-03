<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// SQLite does not support ALTER COLUMN — we drop the CHECK constraint by
// recreating the column as a plain string (values are already validated in app code).
return new class extends Migration
{
    public function up(): void
    {
        // Drop the old CHECK constraint by changing to a string column
        DB::statement("ALTER TABLE orders ADD COLUMN payment_status_new VARCHAR(20) NOT NULL DEFAULT 'unpaid'");
        DB::statement('UPDATE orders SET payment_status_new = payment_status');
        DB::statement('ALTER TABLE orders DROP COLUMN payment_status');
        DB::statement("ALTER TABLE orders CHANGE COLUMN payment_status_new payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'");
    }

    public function down(): void
    {
        // Restore original enum (loses any 'pending' values)
        DB::statement("ALTER TABLE orders ADD COLUMN payment_status_old VARCHAR(20) NOT NULL DEFAULT 'unpaid'");
        DB::statement("UPDATE orders SET payment_status_old = CASE WHEN payment_status IN ('unpaid','paid','failed','refunded') THEN payment_status ELSE 'unpaid' END");
        DB::statement('ALTER TABLE orders DROP COLUMN payment_status');
        DB::statement("ALTER TABLE orders CHANGE COLUMN payment_status_old payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'");
    }
};
