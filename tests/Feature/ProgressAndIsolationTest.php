<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesStudyContent;
use Tests\TestCase;

class ProgressAndIsolationTest extends TestCase
{
    use CreatesStudyContent;
    use RefreshDatabase;

    public function test_lesson_progress_and_exercise_attempts_appear_in_progress_dashboard(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $chapter = $this->createChapter($subject);
        $lesson = $this->createLesson($chapter);
        $exercise = $this->createMcqExercise($subject, ['chapter_id' => $chapter->id, 'lesson_id' => $lesson->id]);
        Sanctum::actingAs($this->createStudent($track));

        $this->postJson("/api/v1/lessons/{$lesson->id}/progress", [
            'is_completed' => true,
            'last_position' => 120,
        ])->assertOk()->assertJsonPath('success', true);

        $this->postJson("/api/v1/exercises/{$exercise->id}/submit", [
            'answer' => $this->correctAnswerFor($exercise),
        ])->assertOk();

        $this->getJson('/api/v1/progress/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.total_subjects', 1)
            ->assertJsonPath('data.stats.total_lessons', 1)
            ->assertJsonPath('data.stats.completed_lessons', 1)
            ->assertJsonPath('data.stats.completed_exercises', 1)
            ->assertJsonPath('data.stats.quiz_attempts', 0)
            ->assertJsonPath('data.stats.exam_attempts', 0);

        $this->getJson('/api/v1/progress/history')
            ->assertOk()
            ->assertJsonPath('data.lesson_progress.0.lesson_id', $lesson->id)
            ->assertJsonPath('data.lesson_progress.0.is_completed', true)
            ->assertJsonPath('data.exercise_attempts.0.exercise_id', $exercise->id);

        $this->assertDatabaseHas('lesson_progress', [
            'lesson_id' => $lesson->id,
            'is_completed' => true,
            'last_position' => 120,
        ]);
    }

    public function test_bookmarks_are_private_to_each_student(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $chapter = $this->createChapter($subject);
        $lesson = $this->createLesson($chapter);

        $owner = $this->createStudent($track);
        $otherStudent = $this->createStudent($track);

        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/bookmarks/toggle', [
            'type' => 'lesson',
            'id' => $lesson->id,
        ])->assertOk()->assertJsonPath('data.bookmarked', true);

        $this->getJson('/api/v1/bookmarks')
            ->assertOk()
            ->assertJsonPath('data.0.type', 'lesson')
            ->assertJsonPath('data.0.item.id', $lesson->id);

        Sanctum::actingAs($otherStudent);

        $this->getJson('/api/v1/bookmarks')
            ->assertOk()
            ->assertJsonPath('data', []);

        $this->getJson('/api/v1/progress/history')
            ->assertOk()
            ->assertJsonPath('data.lesson_progress', [])
            ->assertJsonPath('data.exercise_attempts', []);
    }
}
