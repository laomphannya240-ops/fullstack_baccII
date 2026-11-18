<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('study_materials', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('subject_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('chapter_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('title_en');
            $table->string('title_km');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('file_type')->default('pdf');
            $table->unsignedBigInteger('file_size')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['subject_id', 'is_published']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('study_materials');
    }
};
