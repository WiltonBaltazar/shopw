<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->addForeignIfMissing(
            'mpesa_transactions',
            'mpesa_transactions_order_id_foreign',
            fn (Blueprint $table) => $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete()
        );

        $this->addForeignIfMissing(
            'order_items',
            'order_items_order_id_foreign',
            fn (Blueprint $table) => $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete()
        );

        $this->addForeignIfMissing(
            'order_item_addons',
            'order_item_addons_order_item_id_foreign',
            fn (Blueprint $table) => $table->foreign('order_item_id')->references('id')->on('order_items')->cascadeOnDelete()
        );

        $this->addForeignIfMissing(
            'order_item_addons',
            'order_item_addons_addon_id_foreign',
            fn (Blueprint $table) => $table->foreign('addon_id')->references('id')->on('product_addons')->restrictOnDelete()
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropForeignIfExists('mpesa_transactions', 'mpesa_transactions_order_id_foreign');
        $this->dropForeignIfExists('order_items', 'order_items_order_id_foreign');
        $this->dropForeignIfExists('order_item_addons', 'order_item_addons_order_item_id_foreign');
        $this->dropForeignIfExists('order_item_addons', 'order_item_addons_addon_id_foreign');
    }

    private function addForeignIfMissing(string $table, string $constraintName, Closure $callback): void
    {
        if (! Schema::hasTable($table) || $this->foreignExists($table, $constraintName)) {
            return;
        }

        Schema::table($table, $callback);
    }

    private function dropForeignIfExists(string $table, string $constraintName): void
    {
        if (! Schema::hasTable($table) || ! $this->foreignExists($table, $constraintName)) {
            return;
        }

        Schema::table($table, function (Blueprint $table) use ($constraintName) {
            $table->dropForeign($constraintName);
        });
    }

    private function foreignExists(string $table, string $constraintName): bool
    {
        $database = DB::getDatabaseName();

        return DB::table('information_schema.table_constraints')
            ->where('constraint_schema', $database)
            ->where('table_name', $table)
            ->where('constraint_name', $constraintName)
            ->where('constraint_type', 'FOREIGN KEY')
            ->exists();
    }
};
