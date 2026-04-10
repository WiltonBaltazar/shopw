<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// SQLite does not support ALTER COLUMN — we drop the CHECK constraint by
// recreating the column as a plain string (values are already validated in app code).
return new class extends Migration
{
    public function up(): void
    {
        $hasOld = Schema::hasColumn('orders', 'payment_status');
        $hasNew = Schema::hasColumn('orders', 'payment_status_new');

        // Step 1: add temp column (skip if already exists from a partial run)
        if ($hasOld && !$hasNew) {
            DB::statement("ALTER TABLE orders ADD COLUMN payment_status_new VARCHAR(20) NOT NULL DEFAULT 'unpaid'");
            $hasNew = true;
        }

        // Step 2: copy data
        if ($hasOld && $hasNew) {
            DB::statement('UPDATE orders SET payment_status_new = payment_status');
        }

        // Step 3: drop original
        if ($hasOld) {
            DB::statement('ALTER TABLE orders DROP COLUMN payment_status');
        }

        // Step 4: rename temp to final
        if ($hasNew) {
            DB::statement("ALTER TABLE orders CHANGE COLUMN payment_status_new payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'");
        }
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
