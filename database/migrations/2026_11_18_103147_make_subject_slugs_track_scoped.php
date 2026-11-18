<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table): void {
            $table->dropUnique(['slug']);
            $table->unique(['study_track_id', 'slug'], 'subjects_track_slug_unique');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table): void {
            $table->dropUnique('subjects_track_slug_unique');
            $table->unique('slug', 'subjects_slug_unique');
        });
    }
};
