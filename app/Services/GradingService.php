<?php

namespace App\Services;

use App\Models\Exercise;

class GradingService
{
    /**
     * Grade a submitted answer entirely on the server.
     *
     * @return array{is_correct: bool, points_earned: int}
     */
    public function grade(Exercise $exercise, ?string $submittedAnswer): array
    {
        $exercise->loadMissing('options');

        $isCorrect = match ($exercise->type) {
            'mcq', 'true_false' => $this->gradeChoice($exercise, $submittedAnswer),
            'short_answer' => $this->gradeShortAnswer($exercise, $submittedAnswer),
            'numerical' => $this->gradeNumerical($exercise, $submittedAnswer),
            default => false,
        };

        return [
            'is_correct' => $isCorrect,
            'points_earned' => $isCorrect ? $exercise->points : 0,
        ];
    }

    /**
     * Correct answer is only exposed after a submission has been graded.
     */
    public function correctAnswer(Exercise $exercise): ?string
    {
        $exercise->loadMissing('options');

        if (in_array($exercise->type, ['mcq', 'true_false'], true)) {
            return (string) $exercise->options->firstWhere('is_correct', true)?->id;
        }

        return $exercise->correct_answer;
    }

    private function gradeChoice(Exercise $exercise, ?string $submittedAnswer): bool
    {
        if ($submittedAnswer === null) {
            return false;
        }

        $correctOption = $exercise->options->firstWhere('is_correct', true);

        return $correctOption !== null && (string) $correctOption->id === $submittedAnswer;
    }

    private function gradeShortAnswer(Exercise $exercise, ?string $submittedAnswer): bool
    {
        if ($submittedAnswer === null) {
            return false;
        }

        $accepted = collect([$exercise->correct_answer])
            ->merge($exercise->accepted_answers ?? [])
            ->filter(fn ($value) => is_string($value) && $value !== '')
            ->map(fn (string $value): string => $this->normalize($value));

        return $accepted->contains($this->normalize($submittedAnswer));
    }

    private function gradeNumerical(Exercise $exercise, ?string $submittedAnswer): bool
    {
        if ($submittedAnswer === null || ! is_numeric($submittedAnswer) || $exercise->correct_answer === null) {
            return false;
        }

        $expected = (float) $exercise->correct_answer;
        $tolerance = max(0.0001, abs($expected) * 0.0001);

        return abs((float) $submittedAnswer - $expected) <= $tolerance;
    }

    private function normalize(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        $value = str_replace(["\u{00A0}", '។', '៕'], ' ', $value);

        return mb_strtolower(trim(preg_replace('/\s+/u', ' ', $value) ?? $value));
    }
}
