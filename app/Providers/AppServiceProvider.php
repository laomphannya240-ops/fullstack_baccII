<?php

namespace App\Providers;

use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\MockExamAttempt;
use App\Models\QuizAttempt;
use App\Models\StudyMaterial;
use App\Models\User;
use App\Policies\AttemptPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Model::preventLazyLoading(! $this->app->isProduction());

        Relation::morphMap([
            'lesson' => Lesson::class,
            'exercise' => Exercise::class,
            'material' => StudyMaterial::class,
        ]);

        Gate::define('access-admin', fn (User $user): bool => $user->isAdmin());
        Gate::policy(QuizAttempt::class, AttemptPolicy::class);
        Gate::policy(MockExamAttempt::class, AttemptPolicy::class);
    }
}
