<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_reviews', function (Blueprint $table) {
            $table->string('customer_phone', 30)->nullable()->after('customer_email');
            $table->boolean('verified_purchase')->default(false)->after('is_approved');
            $table->string('photo_path')->nullable()->after('body');

            $table->index('product_id');
            $table->unique(['product_id', 'customer_email'], 'unique_review_per_product_email');
        });
    }

    public function down(): void
    {
        Schema::table('product_reviews', function (Blueprint $table) {
            $table->dropUnique('unique_review_per_product_email');
            $table->dropIndex(['product_id']);
            $table->dropColumn(['customer_phone', 'verified_purchase', 'photo_path']);
        });
    }
};
