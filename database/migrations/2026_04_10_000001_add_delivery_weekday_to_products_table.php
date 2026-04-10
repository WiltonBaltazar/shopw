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
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'delivery_weekday')) {
                // 0 = Sunday ... 6 = Saturday. Null means available any day.
                $table->unsignedTinyInteger('delivery_weekday')->nullable()->after('requires_advance_order');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'delivery_weekday')) {
                $table->dropColumn('delivery_weekday');
            }
        });
    }
};
