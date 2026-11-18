<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mock_exam_questions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('mock_exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('marks')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['mock_exam_id', 'exercise_id']);
            $table->index(['mock_exam_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mock_exam_questions');
    }
};
