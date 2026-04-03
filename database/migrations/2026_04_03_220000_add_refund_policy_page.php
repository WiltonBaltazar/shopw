<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $exists = DB::table('pages')->where('slug', 'politica-de-reembolso')->exists();

        if (!$exists) {
            DB::table('pages')->insert([
                'title' => 'Política de Reembolso',
                'slug' => 'politica-de-reembolso',
                'content' => '<p>Descreva aqui a sua política de devolução e reembolso.</p>',
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('pages')->where('slug', 'politica-de-reembolso')->delete();
    }
};
