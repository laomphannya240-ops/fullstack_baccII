<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exercises', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('chapter_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->longText('question_km');
            $table->longText('question_en')->nullable();
            $table->longText('explanation_km')->nullable();
            $table->longText('explanation_en')->nullable();
            $table->string('correct_answer')->nullable();
            $table->json('accepted_answers')->nullable();
            $table->unsignedInteger('points')->default(1);
            $table->string('difficulty')->default('medium');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['subject_id', 'type', 'is_published']);
            $table->index(['lesson_id', 'is_published']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercises');
    }
};
