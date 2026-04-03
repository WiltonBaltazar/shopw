<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_type', 10)->default('standard')->after('reference');
            $table->decimal('amount_paid', 10, 2)->default(0)->after('total');
            $table->decimal('payment_due', 10, 2)->nullable()->after('amount_paid');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['order_type', 'amount_paid', 'payment_due']);
        });
    }
};
