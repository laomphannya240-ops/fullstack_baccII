<?php

namespace Tests\Feature;

use App\Models\ExerciseAttempt;
use App\Models\StudyMaterial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesStudyContent;
use Tests\TestCase;

class ExerciseReferenceAndCatalogTest extends TestCase
{
    use CreatesStudyContent;
    use RefreshDatabase;

    public function test_reference_filter_returns_only_reference_content_and_show_logs_a_view(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $chapter = $this->createChapter($subject);
        $reference = $this->createLesson($chapter, [
            'slug' => 'formula-sheet',
            'title_en' => 'Formula Sheet',
            'title_km' => 'តារាងរូបមន្ត',
            'is_reference' => true,
        ]);
        $this->createLesson($chapter, [
            'slug' => 'normal-lesson',
            'title_en' => 'Regular Lesson',
        ]);

        $student = $this->createStudent($track);
        Sanctum::actingAs($student);

        $this->getJson('/api/v1/lessons?is_reference=true&search=Formula')
            ->assertOk()
            ->assertJsonPath('data.0.id', $reference->id)
            ->assertJsonPath('data.0.is_reference', true)
            ->assertJsonCount(1, 'data');

        $this->getJson("/api/v1/lessons/{$reference->id}")
            ->assertOk()
            ->assertJsonPath('data.is_reference', true)
            ->assertJsonPath('data.kind', 'reference');

        $this->assertDatabaseHas('study_activities', [
            'user_id' => $student->id,
            'type' => 'reference_viewed',
            'reference_id' => $reference->id,
            'subject_id' => $subject->id,
        ]);
    }

    public function test_reference_navigation_does_not_include_regular_lessons(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $chapter = $this->createChapter($subject);
        $reference = $this->createLesson($chapter, ['slug' => 'reference-1', 'is_reference' => true, 'sort_order' => 1]);
        $nextReference = $this->createLesson($chapter, ['slug' => 'reference-2', 'is_reference' => true, 'sort_order' => 2]);
        $this->createLesson($chapter, ['slug' => 'lesson-1', 'is_reference' => false, 'sort_order' => 3]);

        Sanctum::actingAs($this->createStudent($track));

        $this->getJson("/api/v1/lessons/{$reference->id}")
            ->assertOk()
            ->assertJsonPath('data.next.id', $nextReference->id);
    }

    public function test_admin_can_filter_lessons_by_reference_flag(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $chapter = $this->createChapter($subject);
        $reference = $this->createLesson($chapter, ['slug' => 'admin-reference', 'is_reference' => true]);
        $lesson = $this->createLesson($chapter, ['slug' => 'admin-lesson', 'is_reference' => false]);

        Sanctum::actingAs($this->createAdmin());

        $this->getJson('/api/v1/admin/lessons?is_reference=true')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $reference->id)
            ->assertJsonPath('data.0.is_reference', true);

        $this->getJson('/api/v1/admin/lessons?is_reference=false')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $lesson->id)
            ->assertJsonPath('data.0.is_reference', false);
    }

    public function test_exercise_search_returns_image_url_and_attempt_metadata(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $exercise = $this->createMcqExercise($subject, [
            'question_en' => 'Find the velocity from the distance-time graph',
            'question_km' => 'រកល្បឿនពីក្រាហ្វិកចម្ងាយ-ពេលវេលា',
            'image_path' => 'exercises/motion-graph.svg',
        ]);
        $this->createMcqExercise($subject, ['question_en' => 'Unrelated geography question']);

        Sanctum::actingAs($this->createStudent($track));

        $this->getJson('/api/v1/exercises?search=velocity')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $exercise->id)
            ->assertJsonPath('data.0.image_url', asset('storage/exercises/motion-graph.svg'))
            ->assertJsonPath('data.0.attempts_count', 0)
            ->assertJsonPath('data.0.is_completed', false);
    }

    public function test_completed_exercise_filter_returns_only_attempted_exercises(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $completed = $this->createMcqExercise($subject, ['question_en' => 'Completed question']);
        $pending = $this->createMcqExercise($subject, ['question_en' => 'Pending question']);
        $student = $this->createStudent($track);

        Sanctum::actingAs($student);

        $this->postJson("/api/v1/exercises/{$completed->id}/submit", [
            'answer' => $this->correctAnswerFor($completed),
        ])->assertOk();

        $this->getJson('/api/v1/exercises?status=completed')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $completed->id)
            ->assertJsonPath('data.0.attempts_count', 1)
            ->assertJsonPath('data.0.correct_attempts', 1)
            ->assertJsonPath('data.0.is_completed', true);

        $this->getJson('/api/v1/exercises?status=not_completed')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $pending->id);
    }

    public function test_same_subject_slug_is_allowed_in_both_tracks(): void
    {
        $science = $this->createTrack(['slug' => 'science']);
        $socialScience = $this->createTrack(['slug' => 'social-science']);
        Sanctum::actingAs($this->createAdmin());

        $this->postJson('/api/v1/admin/subjects', [
            'study_track_id' => $science->id,
            'slug' => 'mathematics',
            'name_en' => 'Mathematics',
            'name_km' => 'គណិតវិទ្យា',
        ])->assertCreated();

        $this->postJson('/api/v1/admin/subjects', [
            'study_track_id' => $socialScience->id,
            'slug' => 'mathematics',
            'name_en' => 'Mathematics',
            'name_km' => 'គណិតវិទ្យា',
        ])->assertCreated()
            ->assertJsonPath('data.study_track.id', $socialScience->id);
    }

    public function test_same_subject_slug_is_rejected_within_one_track(): void
    {
        $track = $this->createTrack();
        $this->createSubject($track, ['slug' => 'mathematics']);
        Sanctum::actingAs($this->createAdmin());

        $this->postJson('/api/v1/admin/subjects', [
            'study_track_id' => $track->id,
            'slug' => 'mathematics',
            'name_en' => 'Mathematics',
            'name_km' => 'គណិតវិទ្យា',
        ])->assertUnprocessable()->assertJsonValidationErrors('slug');
    }

    public function test_student_can_open_a_material_from_another_track(): void
    {
        $studentTrack = $this->createTrack(['slug' => 'science']);
        $otherTrack = $this->createTrack(['slug' => 'social-science']);
        $otherSubject = $this->createSubject($otherTrack);
        $material = StudyMaterial::create([
            'subject_id' => $otherSubject->id,
            'title_en' => 'Shared revision notes',
            'title_km' => 'កំណត់ចំណាំរួម',
            'file_path' => 'materials/shared.txt',
            'file_type' => 'txt',
            'is_published' => true,
        ]);

        Sanctum::actingAs($this->createStudent($studentTrack));

        $this->getJson("/api/v1/materials/{$material->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $material->id);
    }

    public function test_admin_can_list_exercise_results(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $exercise = $this->createMcqExercise($subject);
        $student = $this->createStudent($track);
        $attempt = ExerciseAttempt::create([
            'user_id' => $student->id,
            'exercise_id' => $exercise->id,
            'submitted_answer' => $this->correctAnswerFor($exercise),
            'is_correct' => true,
            'points_earned' => 1,
        ]);

        Sanctum::actingAs($this->createAdmin());

        $this->getJson('/api/v1/admin/exercise-results?student_id='.$student->id)
            ->assertOk()
            ->assertJsonPath('data.0.id', $attempt->id)
            ->assertJsonPath('data.0.student.id', $student->id)
            ->assertJsonPath('data.0.exercise.id', $exercise->id);
    }

    public function test_student_cannot_list_admin_exercise_results(): void
    {
        $track = $this->createTrack();
        Sanctum::actingAs($this->createStudent($track));

        $this->getJson('/api/v1/admin/exercise-results')->assertForbidden();
    }
}
