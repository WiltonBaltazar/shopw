<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $replacements = [
            'Artesanais' => 'Homemade',
            'artesanais' => 'Homemade',
            'Artesanal' => 'Homemade',
            'artesanal' => 'Homemade',
        ];

        if (Schema::hasTable('settings') && Schema::hasColumn('settings', 'value')) {
            $rows = DB::table('settings')->select('key', 'value')->get();
            foreach ($rows as $row) {
                $updatedValue = $this->replaceText($row->value, $replacements);
                if ($updatedValue !== $row->value) {
                    DB::table('settings')->where('key', $row->key)->update(['value' => $updatedValue]);
                }
            }
        }

        if (Schema::hasTable('blog_posts')) {
            $rows = DB::table('blog_posts')->select('id', 'title', 'excerpt', 'content')->get();
            foreach ($rows as $row) {
                $title = $this->replaceText($row->title, $replacements);
                $excerpt = $this->replaceText($row->excerpt, $replacements);
                $content = $this->replaceText($row->content, $replacements);

                if ($title !== $row->title || $excerpt !== $row->excerpt || $content !== $row->content) {
                    DB::table('blog_posts')->where('id', $row->id)->update([
                        'title' => $title,
                        'excerpt' => $excerpt,
                        'content' => $content,
                    ]);
                }
            }
        }

        if (Schema::hasTable('testimonials')) {
            $rows = DB::table('testimonials')->select('id', 'quote', 'author_detail')->get();
            foreach ($rows as $row) {
                $quote = $this->replaceText($row->quote, $replacements);
                $authorDetail = $this->replaceText($row->author_detail, $replacements);

                if ($quote !== $row->quote || $authorDetail !== $row->author_detail) {
                    DB::table('testimonials')->where('id', $row->id)->update([
                        'quote' => $quote,
                        'author_detail' => $authorDetail,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        // Irreversible data update.
    }

    private function replaceText(?string $value, array $replacements): ?string
    {
        if ($value === null) {
            return null;
        }

        return str_replace(array_keys($replacements), array_values($replacements), $value);
    }
};
