<?php

namespace Tests\Feature;

use App\Models\QuizAttempt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesStudyContent;
use Tests\TestCase;

class AuthAndRbacTest extends TestCase
{
    use CreatesStudyContent;
    use RefreshDatabase;

    public function test_student_can_register_with_a_valid_study_track(): void
    {
        $track = $this->createTrack();

        $response = $this->postJson('/api/v1/register', [
            'name' => 'Sokha',
            'email' => 'sokha@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'study_track_id' => $track->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'sokha@example.test')
            ->assertJsonPath('data.user.role', 'student')
            ->assertJsonPath('data.user.study_track.id', $track->id)
            ->assertJsonStructure(['success', 'data' => ['user', 'token']]);

        $this->assertDatabaseHas('users', [
            'email' => 'sokha@example.test',
            'role' => 'student',
            'study_track_id' => $track->id,
        ]);
    }

    public function test_registration_rejects_an_invalid_track(): void
    {
        $this->postJson('/api/v1/register', [
            'name' => 'Sokha',
            'email' => 'sokha@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'study_track_id' => 9999,
        ])->assertUnprocessable()->assertJsonValidationErrors('study_track_id');
    }

    public function test_user_can_login_and_logout_with_a_sanctum_token(): void
    {
        $track = $this->createTrack();
        $student = $this->createStudent($track);

        $login = $this->postJson('/api/v1/login', [
            'email' => $student->email,
            'password' => 'password',
        ]);

        $login->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $student->id)
            ->assertJsonStructure(['data' => ['user', 'token']]);

        $token = $login->json('data.token');

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withToken($token)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.id', $student->id);

        $this->withToken($token)
            ->postJson('/api/v1/logout')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_rejects_wrong_credentials(): void
    {
        $track = $this->createTrack();
        $student = $this->createStudent($track);

        $this->postJson('/api/v1/login', [
            'email' => $student->email,
            'password' => 'wrong-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_guest_cannot_access_protected_routes(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
    }

    public function test_student_cannot_access_admin_routes(): void
    {
        $track = $this->createTrack();
        Sanctum::actingAs($this->createStudent($track));

        $this->getJson('/api/v1/admin/dashboard')
            ->assertForbidden()
            ->assertJsonPath('success', false);

        $this->getJson('/api/v1/admin/students')->assertForbidden();
    }

    public function test_admin_can_access_admin_dashboard(): void
    {
        Sanctum::actingAs($this->createAdmin());

        $this->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_inactive_user_is_denied_access(): void
    {
        $track = $this->createTrack();
        Sanctum::actingAs($this->createStudent($track, ['is_active' => false]));

        $this->getJson('/api/v1/me')
            ->assertForbidden()
            ->assertJsonPath('message', 'This account is inactive.');
    }

    public function test_student_cannot_view_another_students_attempt(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $exercise = $this->createMcqExercise($subject);
        $quiz = $this->createQuiz($subject, [$exercise->id]);

        $owner = $this->createStudent($track);
        $otherStudent = $this->createStudent($track);

        $attempt = QuizAttempt::create([
            'user_id' => $owner->id,
            'quiz_id' => $quiz->id,
            'status' => 'in_progress',
            'started_at' => now(),
            'max_score' => 1,
        ]);

        Sanctum::actingAs($otherStudent);

        $this->getJson("/api/v1/quiz-attempts/{$attempt->id}")
            ->assertNotFound()
            ->assertJsonPath('success', false);
    }
}
