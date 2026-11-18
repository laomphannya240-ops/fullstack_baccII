<?php

namespace Tests\Concerns;

use App\Models\Chapter;
use App\Models\Exercise;
use App\Models\ExerciseOption;
use App\Models\Lesson;
use App\Models\MockExam;
use App\Models\Quiz;
use App\Models\StudyTrack;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Facades\DB;

trait CreatesStudyContent
{
    protected function createTrack(array $attributes = []): StudyTrack
    {
        return StudyTrack::create(array_merge([
            'slug' => fake()->unique()->slug(),
            'name_en' => 'Science',
            'name_km' => 'វិទ្យាសាស្ត្រ',
            'is_active' => true,
        ], $attributes));
    }

    protected function createSubject(StudyTrack $track, array $attributes = []): Subject
    {
        return Subject::create(array_merge([
            'study_track_id' => $track->id,
            'slug' => fake()->unique()->slug(),
            'name_en' => 'Mathematics',
            'name_km' => 'គណិតវិទ្យា',
            'is_active' => true,
        ], $attributes));
    }

    protected function createChapter(Subject $subject, array $attributes = []): Chapter
    {
        return Chapter::create(array_merge([
            'subject_id' => $subject->id,
            'slug' => fake()->unique()->slug(),
            'title_en' => 'Algebra',
            'title_km' => 'ពិជគណិត',
            'is_active' => true,
        ], $attributes));
    }

    protected function createLesson(Chapter $chapter, array $attributes = []): Lesson
    {
        return Lesson::create(array_merge([
            'chapter_id' => $chapter->id,
            'slug' => fake()->unique()->slug(),
            'title_en' => 'Linear Equations',
            'title_km' => 'សមីការលីនេអ៊ែរ',
            'content_en' => 'Lesson content.',
            'content_km' => 'មាតិកាមេរៀន។',
            'is_published' => true,
        ], $attributes));
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    protected function createMcqExercise(Subject $subject, array $attributes = []): Exercise
    {
        $exercise = Exercise::create(array_merge([
            'subject_id' => $subject->id,
            'type' => 'mcq',
            'question_km' => 'តើចម្លើយណាត្រឹមត្រូវ?',
            'question_en' => 'Which answer is correct?',
            'explanation_km' => 'នេះជាការពន្យល់សាកល្បង។',
            'explanation_en' => 'This is a demo explanation.',
            'points' => 1,
            'difficulty' => 'easy',
            'is_published' => true,
        ], $attributes));

        ExerciseOption::create([
            'exercise_id' => $exercise->id,
            'option_km' => 'ចម្លើយត្រឹមត្រូវ',
            'option_en' => 'Correct option',
            'is_correct' => true,
            'sort_order' => 0,
        ]);

        ExerciseOption::create([
            'exercise_id' => $exercise->id,
            'option_km' => 'ចម្លើយមិនត្រឹមត្រូវ',
            'option_en' => 'Wrong option',
            'is_correct' => false,
            'sort_order' => 1,
        ]);

        return $exercise;
    }

    protected function correctAnswerFor(Exercise $exercise): string
    {
        return (string) ExerciseOption::where('exercise_id', $exercise->id)
            ->where('is_correct', true)
            ->value('id');
    }

    protected function wrongAnswerFor(Exercise $exercise): string
    {
        return (string) ExerciseOption::where('exercise_id', $exercise->id)
            ->where('is_correct', false)
            ->value('id');
    }

    /**
     * @param  array<int, int>  $exerciseIds
     */
    protected function createQuiz(Subject $subject, array $exerciseIds, array $attributes = []): Quiz
    {
        $quiz = Quiz::create(array_merge([
            'subject_id' => $subject->id,
            'title_en' => 'Demo Quiz',
            'title_km' => 'ប្រឡងសាកល្បង',
            'question_count' => count($exerciseIds),
            'duration_minutes' => 30,
            'passing_score' => 70,
            'is_active' => true,
        ], $attributes));

        foreach ($exerciseIds as $index => $exerciseId) {
            DB::table('quiz_questions')->insert([
                'quiz_id' => $quiz->id,
                'exercise_id' => $exerciseId,
                'sort_order' => $index,
            ]);
        }

        return $quiz;
    }

    /**
     * @param  array<int, int>  $exerciseIds
     */
    protected function createExam(Subject $subject, array $exerciseIds, array $attributes = []): MockExam
    {
        $exam = MockExam::create(array_merge([
            'subject_id' => $subject->id,
            'title_en' => 'Demo Mock Exam',
            'title_km' => 'ប្រឡងគំរូ',
            'question_count' => count($exerciseIds),
            'duration_minutes' => 60,
            'passing_score' => 70,
            'is_active' => true,
        ], $attributes));

        foreach ($exerciseIds as $index => $exerciseId) {
            DB::table('mock_exam_questions')->insert([
                'mock_exam_id' => $exam->id,
                'exercise_id' => $exerciseId,
                'marks' => 1,
                'sort_order' => $index,
            ]);
        }

        return $exam;
    }

    protected function createStudent(StudyTrack $track, array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 'student',
            'study_track_id' => $track->id,
            'is_active' => true,
        ], $attributes));
    }

    protected function createAdmin(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 'admin',
            'is_active' => true,
        ], $attributes));
    }
}
