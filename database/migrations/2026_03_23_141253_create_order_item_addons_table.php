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
        Schema::create('order_item_addons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_item_id');
            $table->unsignedBigInteger('addon_id');
            $table->string('addon_name');
            $table->text('value')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->timestamps();

            $table->index('order_item_id');
            $table->index('addon_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_item_addons');
    }
};
