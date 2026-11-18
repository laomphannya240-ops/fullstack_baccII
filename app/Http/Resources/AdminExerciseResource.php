<?php

namespace App\Http\Resources;

class AdminExerciseResource extends ExerciseResource
{
    public function __construct(mixed $resource)
    {
        parent::__construct($resource, true);
    }
}
