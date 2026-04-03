<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        $privacy = DB::table('settings')->where('key', 'privacy_policy_content')->value('value');
        $terms = DB::table('settings')->where('key', 'terms_conditions_content')->value('value');

        DB::table('pages')->insert([
            [
                'title' => 'Política de Privacidade',
                'slug' => 'politica-de-privacidade',
                'content' => $this->normalizeToHtml($privacy, '<p>Atualize esta política de privacidade no painel de administração.</p>'),
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Termos e Condições',
                'slug' => 'termos-e-condicoes',
                'content' => $this->normalizeToHtml($terms, '<p>Atualize os termos e condições no painel de administração.</p>'),
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }

    private function normalizeToHtml(mixed $value, string $fallback): string
    {
        $text = trim((string) ($value ?? ''));

        if ($text === '') {
            return $fallback;
        }

        if (str_contains($text, '<') && str_contains($text, '>')) {
            return $text;
        }

        $lines = preg_split("/\r\n|\n|\r/", $text) ?: [];
        $paragraphs = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            $paragraphs[] = '<p>' . e($line) . '</p>';
        }

        return count($paragraphs) ? implode('', $paragraphs) : $fallback;
    }
};
