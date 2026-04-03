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
            'product_attributes',
            'product_attributes_product_id_foreign',
            fn (Blueprint $table) => $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete()
        );

        $this->addForeignIfMissing(
            'product_images',
            'product_images_product_id_foreign',
            fn (Blueprint $table) => $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete()
        );

        $this->addForeignIfMissing(
            'product_variants',
            'product_variants_product_id_foreign',
            fn (Blueprint $table) => $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete()
        );

        $this->addForeignIfMissing(
            'product_attribute_values',
            'product_attribute_values_attribute_id_foreign',
            fn (Blueprint $table) => $table->foreign('attribute_id')->references('id')->on('product_attributes')->cascadeOnDelete()
        );

        $this->addForeignIfMissing(
            'variant_attribute_values',
            'variant_attribute_values_variant_id_foreign',
            fn (Blueprint $table) => $table->foreign('variant_id')->references('id')->on('product_variants')->cascadeOnDelete()
        );

        $this->addForeignIfMissing(
            'variant_attribute_values',
            'variant_attribute_values_attribute_value_id_foreign',
            fn (Blueprint $table) => $table->foreign('attribute_value_id')->references('id')->on('product_attribute_values')->cascadeOnDelete()
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropForeignIfExists('product_attributes', 'product_attributes_product_id_foreign');
        $this->dropForeignIfExists('product_images', 'product_images_product_id_foreign');
        $this->dropForeignIfExists('product_variants', 'product_variants_product_id_foreign');
        $this->dropForeignIfExists('product_attribute_values', 'product_attribute_values_attribute_id_foreign');
        $this->dropForeignIfExists('variant_attribute_values', 'variant_attribute_values_variant_id_foreign');
        $this->dropForeignIfExists('variant_attribute_values', 'variant_attribute_values_attribute_value_id_foreign');
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
