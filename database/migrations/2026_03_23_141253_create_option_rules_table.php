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
        Schema::create('option_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('condition_value_id')->constrained('product_attribute_values')->cascadeOnDelete();
            $table->foreignId('target_value_id')->constrained('product_attribute_values')->cascadeOnDelete();
            $table->enum('rule_type', ['disable', 'hide'])->default('disable');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('option_rules');
    }
};
