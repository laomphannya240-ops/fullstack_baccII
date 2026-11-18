<?php

namespace App\Policies;

use App\Models\MockExamAttempt;
use App\Models\QuizAttempt;
use App\Models\User;

class AttemptPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, QuizAttempt|MockExamAttempt $attempt): bool
    {
        return $attempt->user_id === $user->id || $user->isAdmin();
    }
}
