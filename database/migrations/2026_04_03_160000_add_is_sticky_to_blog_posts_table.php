<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('blog_posts', 'is_sticky')) {
            Schema::table('blog_posts', function (Blueprint $table) {
                $table->boolean('is_sticky')->default(false)->after('is_published');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('blog_posts', 'is_sticky')) {
            Schema::table('blog_posts', function (Blueprint $table) {
                $table->dropColumn('is_sticky');
            });
        }
    }
};
