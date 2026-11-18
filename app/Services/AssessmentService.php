<?php

namespace App\Services;

use App\Models\MockExam;
use App\Models\MockExamAnswer;
use App\Models\MockExamAttempt;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class AssessmentService
{
    public function __construct(
        private GradingService $grading,
        private ActivityService $activities,
    ) {}

    public function startQuiz(User $user, Quiz $quiz, ?int $questionCount = null): QuizAttempt
    {
        return DB::transaction(function () use ($user, $quiz, $questionCount): QuizAttempt {
            $questions = $quiz->questions()
                ->with('exercise')
                ->get()
                ->pluck('exercise')
                ->filter(fn ($exercise) => $exercise !== null && $exercise->is_published);

            $limit = $questionCount ?? $quiz->question_count;
            $questions = $questions->shuffle()->take(max(1, $limit));

            abort_unless($questions->isNotEmpty(), 422, 'This quiz has no published questions.');

            $attempt = QuizAttempt::create([
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'status' => 'in_progress',
                'started_at' => now(),
                'expires_at' => now()->addMinutes($quiz->duration_minutes),
                'score' => 0,
                'max_score' => (int) $questions->sum('points'),
                'correct_count' => 0,
            ]);

            foreach ($questions as $exercise) {
                QuizAttemptAnswer::create([
                    'attempt_id' => $attempt->id,
                    'exercise_id' => $exercise->id,
                ]);
            }

            $this->activities->log(
                $user,
                'quiz_started',
                $quiz->subject_id,
                $quiz->id,
                'Started quiz: '.$quiz->title_en,
            );

            return $attempt->load([
                'quiz.subject:id,name_en,name_km,slug',
                'answers.exercise.subject:id,name_en,name_km',
                'answers.exercise.options',
            ]);
        });
    }

    /**
     * @param  array<int|string, string|null>  $answers
     */
    public function submitQuiz(QuizAttempt $attempt, array $answers): QuizAttempt
    {
        return DB::transaction(function () use ($attempt, $answers): QuizAttempt {
            /** @var QuizAttempt $attempt */
            $attempt = QuizAttempt::whereKey($attempt->id)->lockForUpdate()->firstOrFail();

            if ($attempt->status !== 'in_progress') {
                abort(422, 'This quiz attempt has already been submitted.');
            }

            $expired = $attempt->expires_at?->isPast() ?? false;
            $attempt->loadMissing('answers.exercise.options');

            [$score, $maxScore, $correctCount] = $this->gradeAnswers(
                $attempt->answers,
                $expired ? [] : $answers,
            );

            $attempt->update([
                'status' => 'completed',
                'submitted_at' => now(),
                'score' => $score,
                'max_score' => $maxScore > 0 ? $maxScore : $attempt->max_score,
                'correct_count' => $correctCount,
            ]);

            $attempt->loadMissing('quiz');

            $this->activities->log(
                User::findOrFail($attempt->user_id),
                'quiz_completed',
                $attempt->quiz->subject_id,
                $attempt->quiz_id,
                'Completed quiz with '.$score.' points',
            );

            return $attempt->load([
                'quiz.subject:id,name_en,name_km,slug',
                'answers.exercise.subject:id,name_en,name_km',
                'answers.exercise.chapter:id,title_en,title_km',
                'answers.exercise.options',
            ]);
        });
    }

    public function startExam(User $user, MockExam $exam): MockExamAttempt
    {
        return DB::transaction(function () use ($user, $exam): MockExamAttempt {
            $questions = $exam->questions()
                ->with('exercise')
                ->get()
                ->pluck('exercise')
                ->filter(fn ($exercise) => $exercise !== null && $exercise->is_published);

            abort_unless($questions->isNotEmpty(), 422, 'This exam has no published questions.');

            $attempt = MockExamAttempt::create([
                'user_id' => $user->id,
                'mock_exam_id' => $exam->id,
                'status' => 'in_progress',
                'started_at' => now(),
                'expires_at' => now()->addMinutes($exam->duration_minutes),
                'score' => 0,
                'max_score' => (int) $questions->sum('points'),
                'correct_count' => 0,
            ]);

            foreach ($questions as $exercise) {
                MockExamAnswer::create([
                    'attempt_id' => $attempt->id,
                    'exercise_id' => $exercise->id,
                ]);
            }

            $this->activities->log(
                $user,
                'exam_started',
                $exam->subject_id,
                $exam->id,
                'Started mock exam: '.$exam->title_en,
            );

            return $attempt->load([
                'mockExam.subject:id,name_en,name_km,slug',
                'answers.exercise.subject:id,name_en,name_km',
                'answers.exercise.options',
            ]);
        });
    }

    public function saveExamAnswer(MockExamAttempt $attempt, int $exerciseId, ?string $answer): MockExamAnswer
    {
        if ($attempt->status !== 'in_progress' || ($attempt->expires_at?->isPast() ?? false)) {
            abort(422, 'This exam attempt is no longer accepting answers.');
        }

        $answerRow = $attempt->answers()->where('exercise_id', $exerciseId)->firstOrFail();
        $answerRow->update(['submitted_answer' => $answer]);

        return $answerRow;
    }

    public function submitExam(MockExamAttempt $attempt): MockExamAttempt
    {
        return DB::transaction(function () use ($attempt): MockExamAttempt {
            /** @var MockExamAttempt $attempt */
            $attempt = MockExamAttempt::whereKey($attempt->id)->lockForUpdate()->firstOrFail();

            if ($attempt->status !== 'in_progress') {
                abort(422, 'This exam attempt has already been submitted.');
            }

            $attempt->loadMissing('answers.exercise.options');

            [$score, $maxScore, $correctCount] = $this->gradeAnswers($attempt->answers, []);

            $attempt->update([
                'status' => 'completed',
                'submitted_at' => now(),
                'score' => $score,
                'max_score' => $maxScore > 0 ? $maxScore : $attempt->max_score,
                'correct_count' => $correctCount,
            ]);

            $attempt->loadMissing('mockExam');

            $this->activities->log(
                User::findOrFail($attempt->user_id),
                'exam_completed',
                $attempt->mockExam->subject_id,
                $attempt->mock_exam_id,
                'Completed mock exam with '.$score.' points',
            );

            return $attempt->load([
                'mockExam.subject:id,name_en,name_km,slug',
                'answers.exercise.subject:id,name_en,name_km',
                'answers.exercise.chapter:id,title_en,title_km',
                'answers.exercise.options',
            ]);
        });
    }

    /**
     * @param  iterable<Model>  $answerRows
     * @param  array<int|string, string|null>  $answers
     * @return array{0: int, 1: int, 2: int}
     */
    private function gradeAnswers(iterable $answerRows, array $answers): array
    {
        $score = 0;
        $maxScore = 0;
        $correctCount = 0;

        foreach ($answerRows as $answerRow) {
            $exercise = $answerRow->exercise;
            $submitted = $answers[$exercise->id] ?? $answers[(string) $exercise->id] ?? null;

            if ($submitted === null) {
                $submitted = $answerRow->submitted_answer;
            }

            $result = $this->grading->grade($exercise, $submitted);
            $answerRow->update([
                'submitted_answer' => $submitted,
                'is_correct' => $result['is_correct'],
                'points_earned' => $result['points_earned'],
            ]);

            $score += $result['points_earned'];
            $maxScore += $exercise->points;
            $correctCount += $result['is_correct'] ? 1 : 0;
        }

        return [$score, $maxScore, $correctCount];
    }
}
