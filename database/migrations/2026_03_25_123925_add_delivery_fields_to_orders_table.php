<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('orders', 'delivery_type')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('delivery_type', 10)->default('delivery');
            });
        }

        if (! Schema::hasColumn('orders', 'delivery_region_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->unsignedBigInteger('delivery_region_id')->nullable();
            });
        }

        if (! Schema::hasColumn('orders', 'delivery_fee')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->integer('delivery_fee')->default(0); // cents
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('orders', 'delivery_fee')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('delivery_fee');
            });
        }

        if (Schema::hasColumn('orders', 'delivery_region_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('delivery_region_id');
            });
        }

        if (Schema::hasColumn('orders', 'delivery_type')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('delivery_type');
            });
        }
    }
};
