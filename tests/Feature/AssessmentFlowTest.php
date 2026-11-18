<?php

namespace Tests\Feature;

use App\Models\Exercise;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesStudyContent;
use Tests\TestCase;

class AssessmentFlowTest extends TestCase
{
    use CreatesStudyContent;
    use RefreshDatabase;

    public function test_student_can_start_submit_and_review_a_quiz(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $first = $this->createMcqExercise($subject, ['points' => 1]);
        $second = $this->createMcqExercise($subject, ['points' => 2]);
        $quiz = $this->createQuiz($subject, [$first->id, $second->id]);
        Sanctum::actingAs($this->createStudent($track));

        $start = $this->postJson("/api/v1/quizzes/{$quiz->id}/start", ['question_count' => 2]);

        $start->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.score', 0)
            ->assertJsonPath('data.max_score', 3)
            ->assertJsonPath('data.correct_count', 0)
            ->assertJsonPath('data.answers.0.exercise.correct_answer', null)
            ->assertJsonPath('data.answers.0.exercise.explanation_km', null)
            ->assertJsonPath('data.answers.0.is_correct', null);

        $attemptId = $start->json('data.id');

        $this->getJson("/api/v1/quiz-attempts/{$attemptId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.answers.0.exercise.correct_answer', null);

        $answers = [];
        foreach ($start->json('data.answers') as $answer) {
            $exercise = Exercise::findOrFail($answer['exercise_id']);
            $answers[$exercise->id] = $this->correctAnswerFor($exercise);
        }

        $submit = $this->postJson("/api/v1/quiz-attempts/{$attemptId}/submit", ['answers' => $answers]);

        $submit->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.score', 3)
            ->assertJsonPath('data.max_score', 3)
            ->assertJsonPath('data.correct_count', 2)
            ->assertJsonPath('data.percentage', 100);

        foreach ($submit->json('data.answers') as $answer) {
            $this->assertTrue($answer['is_correct']);
            $this->assertNotNull($answer['exercise']['correct_answer']);
            $this->assertNotNull($answer['exercise']['explanation_km']);
        }

        $this->assertDatabaseHas('quiz_attempts', [
            'id' => $attemptId,
            'status' => 'completed',
            'score' => 3,
            'correct_count' => 2,
        ]);

        $this->postJson("/api/v1/quiz-attempts/{$attemptId}/submit", ['answers' => $answers])
            ->assertUnprocessable();
    }

    public function test_quiz_submit_uses_only_valid_question_ids(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $exercise = $this->createMcqExercise($subject);
        $quiz = $this->createQuiz($subject, [$exercise->id]);
        Sanctum::actingAs($this->createStudent($track));

        $start = $this->postJson("/api/v1/quizzes/{$quiz->id}/start")->assertCreated();
        $attemptId = $start->json('data.id');

        $this->postJson("/api/v1/quiz-attempts/{$attemptId}/submit", [
            'answers' => [
                $exercise->id => $this->correctAnswerFor($exercise),
                999999 => $this->correctAnswerFor($exercise),
            ],
        ])->assertOk()->assertJsonPath('data.score', 1)->assertJsonPath('data.max_score', 1);
    }

    public function test_student_can_save_answers_and_submit_a_mock_exam(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $first = $this->createMcqExercise($subject, ['points' => 2]);
        $second = $this->createMcqExercise($subject, ['points' => 3]);
        $exam = $this->createExam($subject, [$first->id, $second->id]);
        Sanctum::actingAs($this->createStudent($track));

        $start = $this->postJson("/api/v1/mock-exams/{$exam->id}/start")->assertCreated();

        $start->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.max_score', 5)
            ->assertJsonPath('data.answers.0.exercise.correct_answer', null)
            ->assertJsonPath('data.answers.0.is_correct', null);

        $attemptId = $start->json('data.id');
        $answers = collect($start->json('data.answers'))->keyBy('exercise_id');
        $firstId = (int) $answers->keys()->get(0);
        $secondId = (int) $answers->keys()->get(1);

        $this->postJson("/api/v1/exam-attempts/{$attemptId}/answers", [
            'exercise_id' => $firstId,
            'answer' => $this->correctAnswerFor(Exercise::findOrFail($firstId)),
        ])->assertOk()->assertJsonPath('data.exercise_id', $firstId);

        $this->postJson("/api/v1/exam-attempts/{$attemptId}/answers", [
            'exercise_id' => $secondId,
            'answer' => $this->wrongAnswerFor(Exercise::findOrFail($secondId)),
        ])->assertOk()->assertJsonPath('data.exercise_id', $secondId);

        $this->getJson("/api/v1/exam-attempts/{$attemptId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.answers.0.exercise.correct_answer', null);

        $submit = $this->postJson("/api/v1/exam-attempts/{$attemptId}/submit");

        $submit->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.score', 2)
            ->assertJsonPath('data.max_score', 5)
            ->assertJsonPath('data.correct_count', 1)
            ->assertJsonPath('data.percentage', 40);

        $graded = collect($submit->json('data.answers'))->keyBy('exercise_id');
        $this->assertTrue($graded[$firstId]['is_correct']);
        $this->assertFalse($graded[$secondId]['is_correct']);
        $this->assertNotNull($graded[$firstId]['exercise']['correct_answer']);

        $this->postJson("/api/v1/exam-attempts/{$attemptId}/answers", [
            'exercise_id' => $firstId,
            'answer' => $this->correctAnswerFor(Exercise::findOrFail($firstId)),
        ])->assertUnprocessable();
    }
}
