<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesStudyContent;
use Tests\TestCase;

class AnswerHidingAndScoringTest extends TestCase
{
    use CreatesStudyContent;
    use RefreshDatabase;

    public function test_exercise_response_hides_answers_and_explanations_before_submission(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $exercise = $this->createMcqExercise($subject);
        Sanctum::actingAs($this->createStudent($track));

        $this->getJson("/api/v1/exercises/{$exercise->id}")
            ->assertOk()
            ->assertJsonPath('data.correct_answer', null)
            ->assertJsonPath('data.accepted_answers', null)
            ->assertJsonPath('data.explanation_km', null)
            ->assertJsonPath('data.explanation_en', null)
            ->assertJsonPath('data.options.0.is_correct', null)
            ->assertJsonPath('data.options.1.is_correct', null);
    }

    public function test_mcq_is_graded_on_the_server_and_reveals_answers_after_submission(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $exercise = $this->createMcqExercise($subject, ['points' => 2]);
        $correct = $this->correctAnswerFor($exercise);
        $wrong = $this->wrongAnswerFor($exercise);
        Sanctum::actingAs($this->createStudent($track));

        $this->postJson("/api/v1/exercises/{$exercise->id}/submit", [
            'answer' => $wrong,
            'is_correct' => true,
            'points_earned' => 999,
        ])
            ->assertOk()
            ->assertJsonPath('data.is_correct', false)
            ->assertJsonPath('data.points_earned', 0)
            ->assertJsonPath('data.exercise.correct_answer', $correct)
            ->assertJsonPath('data.exercise.options.0.is_correct', true)
            ->assertJsonPath('data.exercise.options.1.is_correct', false)
            ->assertJsonPath('data.exercise.explanation_km', 'នេះជាការពន្យល់សាកល្បង។');

        $this->postJson("/api/v1/exercises/{$exercise->id}/submit", ['answer' => $correct])
            ->assertOk()
            ->assertJsonPath('data.is_correct', true)
            ->assertJsonPath('data.points_earned', 2);

        $this->assertDatabaseHas('exercise_attempts', [
            'exercise_id' => $exercise->id,
            'submitted_answer' => $correct,
            'is_correct' => true,
            'points_earned' => 2,
        ]);
    }

    public function test_short_answer_grading_normalizes_whitespace_and_case(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $exercise = $this->createMcqExercise($subject, [
            'type' => 'short_answer',
            'correct_answer' => 'Phnom Penh',
            'accepted_answers' => ['រាជធានីភ្នំពេញ'],
        ]);
        Sanctum::actingAs($this->createStudent($track));

        $this->postJson("/api/v1/exercises/{$exercise->id}/submit", ['answer' => '  phnom   PENH  '])
            ->assertOk()
            ->assertJsonPath('data.is_correct', true)
            ->assertJsonPath('data.points_earned', 1);
    }

    public function test_numerical_grading_allows_small_precision_differences(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $exercise = $this->createMcqExercise($subject, [
            'type' => 'numerical',
            'correct_answer' => '10',
        ]);
        Sanctum::actingAs($this->createStudent($track));

        $this->postJson("/api/v1/exercises/{$exercise->id}/submit", ['answer' => '10.00001'])
            ->assertOk()
            ->assertJsonPath('data.is_correct', true);
    }

    public function test_unpublished_exercise_cannot_be_viewed_or_answered(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $exercise = $this->createMcqExercise($subject, ['is_published' => false]);
        Sanctum::actingAs($this->createStudent($track));

        $this->getJson("/api/v1/exercises/{$exercise->id}")->assertNotFound();
        $this->postJson("/api/v1/exercises/{$exercise->id}/submit", [
            'answer' => $this->correctAnswerFor($exercise),
        ])->assertNotFound();
    }
}
