<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('study_materials', function (Blueprint $table): void {
            $table->string('file_name')->nullable()->after('file_path');
            $table->index(['chapter_id', 'is_published']);
        });

        Schema::create('study_material_files', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('study_material_id')->constrained()->cascadeOnDelete();
            $table->string('original_name');
            $table->string('path');
            $table->string('type', 10);
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['study_material_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('study_material_files');

        Schema::table('study_materials', function (Blueprint $table): void {
            $table->dropIndex(['chapter_id', 'is_published']);
            $table->dropColumn('file_name');
        });
    }
};
