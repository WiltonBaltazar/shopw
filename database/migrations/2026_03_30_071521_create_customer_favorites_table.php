<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_favorites', function (Blueprint $table) {
            $table->id();
            $table->string('phone', 30);
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('product_slug');
            $table->string('product_name');
            $table->string('product_image')->nullable();
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->string('variant_label')->nullable();
            $table->decimal('price', 10, 2);
            $table->json('selected_values');
            $table->json('flavour_selections');
            $table->json('addon_values');
            $table->timestamps();

            $table->index('phone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_favorites');
    }
};
