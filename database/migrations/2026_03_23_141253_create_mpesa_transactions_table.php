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
        Schema::create('mpesa_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->string('transaction_id')->nullable()->unique();
            $table->string('msisdn');
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['pending', 'success', 'failed', 'timeout'])->default('pending');
            $table->json('raw_response')->nullable();
            $table->timestamps();

            $table->index('order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mpesa_transactions');
    }
};
