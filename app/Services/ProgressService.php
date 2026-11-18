<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\ExerciseAttempt;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\MockExamAttempt;
use App\Models\QuizAttempt;
use App\Models\StudyActivity;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Collection;

class ProgressService
{
    /**
     * @return array<string, mixed>
     */
    public function dashboard(User $user): array
    {
        $subjectIds = $this->accessibleSubjectIds($user);

        $subjects = $subjectIds->isNotEmpty()
            ? Subject::whereIn('id', $subjectIds)->get(['id', 'name_en', 'name_km', 'slug', 'color', 'icon'])
            : collect();

        $lessonIds = $subjectIds->isNotEmpty()
            ? Lesson::whereHas('chapter', fn ($query) => $query->whereIn('subject_id', $subjectIds))
                ->pluck('id')
            : collect();

        $completedLessonIds = LessonProgress::where('user_id', $user->id)
            ->where('is_completed', true)
            ->pluck('lesson_id');

        $quizAttempts = QuizAttempt::where('user_id', $user->id)
            ->where('status', 'completed')
            ->with('quiz.subject:id,name_en,name_km')
            ->get();

        $examAttempts = MockExamAttempt::where('user_id', $user->id)
            ->where('status', 'completed')
            ->with('mockExam.subject:id,name_en,name_km')
            ->get();

        $subjectPerformance = $this->subjectPerformance($quizAttempts, $examAttempts);
        $sortedPerformance = $subjectPerformance->sortByDesc('average');

        $recommendedLessons = $lessonIds->isNotEmpty()
            ? Lesson::whereIn('id', $lessonIds)
                ->where('is_published', true)
                ->whereNotIn('id', $completedLessonIds)
                ->with(['chapter.subject:id,name_en,name_km,slug'])
                ->orderBy('sort_order')
                ->limit(4)
                ->get()
            : collect();

        $continueLessons = LessonProgress::where('user_id', $user->id)
            ->where('is_completed', false)
            ->with(['lesson.chapter.subject:id,name_en,name_km,slug'])
            ->latest('updated_at')
            ->limit(3)
            ->get()
            ->pluck('lesson')
            ->filter();

        return [
            'track' => $user->studyTrack()->first(),
            'stats' => [
                'total_subjects' => $subjects->count(),
                'total_lessons' => $lessonIds->count(),
                'completed_lessons' => $completedLessonIds->intersect($lessonIds)->count(),
                'completed_exercises' => ExerciseAttempt::where('user_id', $user->id)->distinct('exercise_id')->count('exercise_id'),
                'quiz_attempts' => $quizAttempts->count(),
                'exam_attempts' => $examAttempts->count(),
                'quiz_average' => $this->averagePercentage($quizAttempts),
                'exam_average' => $this->averagePercentage($examAttempts),
            ],
            'activity_chart' => $this->activityChart($user),
            'recent_activity' => StudyActivity::where('user_id', $user->id)
                ->with('subject:id,name_en,name_km')
                ->latest('occurred_at')
                ->limit(6)
                ->get(),
            'recommended_lessons' => $recommendedLessons->values(),
            'continue_learning' => $continueLessons->values(),
            'subject_performance' => $subjectPerformance->values(),
            'strong_subjects' => $sortedPerformance->take(2)->values(),
            'weak_subjects' => $sortedPerformance->reverse()->take(2)->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function subjectProgress(User $user): array
    {
        $subjectIds = $this->accessibleSubjectIds($user);

        $subjects = $subjectIds->isNotEmpty()
            ? Subject::whereIn('id', $subjectIds)->with(['chapters' => fn ($query) => $query->with('lessons:id,chapter_id')->orderBy('sort_order')])->get()
            : collect();

        $completedLessonIds = LessonProgress::where('user_id', $user->id)
            ->where('is_completed', true)
            ->pluck('lesson_id');

        $chapters = $subjects->flatMap(function (Subject $subject) use ($completedLessonIds): Collection {
            return $subject->chapters->map(function (Chapter $chapter) use ($completedLessonIds, $subject): array {
                $lessonIds = $chapter->lessons->pluck('id');
                $completed = $completedLessonIds->intersect($lessonIds)->count();
                $total = $lessonIds->count();

                return [
                    'id' => $chapter->id,
                    'subject_id' => $subject->id,
                    'subject_name_en' => $subject->name_en,
                    'subject_name_km' => $subject->name_km,
                    'title_en' => $chapter->title_en,
                    'title_km' => $chapter->title_km,
                    'lessons_total' => $total,
                    'lessons_completed' => $completed,
                    'percentage' => $total > 0 ? (int) round($completed / $total * 100) : 0,
                ];
            });
        })->values();

        return [
            'subjects' => $subjects,
            'chapters' => $chapters,
        ];
    }

    private function accessibleSubjectIds(User $user): Collection
    {
        if (! $user->study_track_id) {
            return Subject::pluck('id');
        }

        return Subject::where('study_track_id', $user->study_track_id)->pluck('id');
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Collection<int, QuizAttempt>  $quizAttempts
     * @param  \Illuminate\Database\Eloquent\Collection<int, MockExamAttempt>  $examAttempts
     */
    private function subjectPerformance($quizAttempts, $examAttempts): Collection
    {
        $attempts = $quizAttempts->map(fn (QuizAttempt $attempt) => [
            'subject' => $attempt->quiz->subject,
            'percentage' => $this->percentage($attempt->score, $attempt->max_score),
        ])->concat($examAttempts->map(fn (MockExamAttempt $attempt) => [
            'subject' => $attempt->mockExam->subject,
            'percentage' => $this->percentage($attempt->score, $attempt->max_score),
        ]))->filter(fn (array $item) => $item['subject'] !== null);

        return $attempts->groupBy(fn (array $item) => $item['subject']->id)
            ->map(fn (Collection $group, int $subjectId): array => [
                'subject_id' => $subjectId,
                'name_en' => $group->first()['subject']->name_en,
                'name_km' => $group->first()['subject']->name_km,
                'attempts' => $group->count(),
                'average' => (int) round($group->avg('percentage')),
            ])->values();
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Collection<int, QuizAttempt>|Collection<int, QuizAttempt>  $attempts
     */
    private function averagePercentage($attempts): int
    {
        if ($attempts->isEmpty()) {
            return 0;
        }

        return (int) round($attempts->avg(fn ($attempt) => $this->percentage($attempt->score, $attempt->max_score)));
    }

    private function percentage(int $score, int $maxScore): float
    {
        return $maxScore > 0 ? min(100, $score / $maxScore * 100) : 0;
    }

    /**
     * @return array<int, array{date: string, count: int}>
     */
    private function activityChart(User $user): array
    {
        $start = now()->startOfDay()->subDays(6);

        $counts = StudyActivity::where('user_id', $user->id)
            ->where('occurred_at', '>=', $start)
            ->selectRaw('DATE(occurred_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        return collect(range(0, 6))->map(function (int $offset) use ($start, $counts): array {
            $date = $start->copy()->addDays($offset)->toDateString();

            return [
                'date' => $date,
                'count' => (int) ($counts[$date] ?? 0),
            ];
        })->all();
    }
}
