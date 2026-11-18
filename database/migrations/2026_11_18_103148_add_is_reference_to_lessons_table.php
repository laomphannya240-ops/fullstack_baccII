<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table): void {
            $table->boolean('is_reference')->default(false)->after('is_published');
            $table->index(['is_reference', 'is_published'], 'lessons_reference_published_index');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table): void {
            $table->dropIndex('lessons_reference_published_index');
            $table->dropColumn('is_reference');
        });
    }
};
