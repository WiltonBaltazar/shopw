<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // delivery_type and delivery_region_id were partially added by a previous failed attempt
        Schema::table('orders', function (Blueprint $table) {
            $table->integer('delivery_fee')->default(0)->after('delivery_region_id'); // cents
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivery_type', 'delivery_region_id', 'delivery_fee']);
        });
    }
};
