<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mock_exams', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->string('title_en');
            $table->string('title_km');
            $table->text('description_en')->nullable();
            $table->text('description_km')->nullable();
            $table->unsignedInteger('question_count')->default(20);
            $table->unsignedInteger('duration_minutes')->default(60);
            $table->unsignedInteger('passing_score')->default(70);
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['subject_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mock_exams');
    }
};
