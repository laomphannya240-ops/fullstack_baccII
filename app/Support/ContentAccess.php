<?php

namespace App\Support;

use App\Models\Subject;
use App\Models\User;

class ContentAccess
{
    public static function assertSubjectAvailable(Subject $subject, ?User $user = null): void
    {
        if (! $subject->is_active) {
            abort(404);
        }

        if ($user && ! $user->isAdmin() && $user->study_track_id && $subject->study_track_id !== $user->study_track_id) {
            abort(404);
        }
    }

    public static function assertPublished(mixed $model): void
    {
        if (isset($model->is_published) && ! $model->is_published) {
            abort(404);
        }
    }
}
