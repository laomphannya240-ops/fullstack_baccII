<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mock_exam_answers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('attempt_id')->constrained('mock_exam_attempts')->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->string('submitted_answer')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->unsignedInteger('points_earned')->default(0);
            $table->timestamps();

            $table->unique(['attempt_id', 'exercise_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mock_exam_answers');
    }
};
