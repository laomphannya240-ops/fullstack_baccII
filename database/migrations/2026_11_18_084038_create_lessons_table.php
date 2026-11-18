<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('chapter_id')->constrained()->cascadeOnDelete();
            $table->string('slug');
            $table->string('title_en');
            $table->string('title_km');
            $table->text('summary_en')->nullable();
            $table->text('summary_km')->nullable();
            $table->longText('content_km')->nullable();
            $table->longText('content_en')->nullable();
            $table->string('video_url')->nullable();
            $table->string('pdf_path')->nullable();
            $table->longText('important_notes')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('estimated_minutes')->default(15);
            $table->boolean('is_published')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['chapter_id', 'slug']);
            $table->index(['chapter_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
