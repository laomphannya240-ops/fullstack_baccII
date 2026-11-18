<?php

namespace App\Services;

use App\Models\StudyActivity;
use App\Models\User;

class ActivityService
{
    /**
     * @param  class-string  $referenceType
     */
    public function log(
        User $user,
        string $type,
        ?int $subjectId = null,
        ?int $referenceId = null,
        ?string $description = null,
        ?string $referenceType = null,
    ): StudyActivity {
        return StudyActivity::create([
            'user_id' => $user->id,
            'type' => $type,
            'subject_id' => $subjectId,
            'reference_id' => $referenceId,
            'description' => $description,
            'occurred_at' => now(),
        ]);
    }
}
