<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->enum('type', ['fixed', 'percentage']);
            $table->decimal('value', 10, 2);
            $table->decimal('min_order_amount', 10, 2)->nullable()->comment('Minimum cart total to activate');
            $table->decimal('max_discount_amount', 10, 2)->nullable()->comment('Cap for percentage discounts');
            $table->boolean('applies_to_all')->default(true)->comment('True = whole cart, false = linked products only');
            $table->boolean('is_first_buy')->default(false)->comment('Only valid for customers with 0 prior orders');
            $table->boolean('is_active')->default(true);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
