<?php

namespace App\Http\Requests;

use App\Models\Exercise;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('access-admin') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Exercise $exercise */
        $exercise = $this->route('exercise');
        $type = $this->input('type', $exercise->type);
        $needsOptions = in_array($type, ['mcq', 'true_false'], true);

        return [
            'subject_id' => ['sometimes', 'required', 'integer', 'exists:subjects,id'],
            'chapter_id' => ['nullable', 'integer', 'exists:chapters,id'],
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'type' => ['sometimes', 'required', Rule::in(['mcq', 'true_false', 'short_answer', 'numerical'])],
            'question_km' => ['sometimes', 'required', 'string'],
            'question_en' => ['nullable', 'string'],
            'image' => ['nullable', 'file', 'image', 'max:5120'],
            'explanation_km' => ['nullable', 'string'],
            'explanation_en' => ['nullable', 'string'],
            'correct_answer' => ['nullable', 'string', 'max:255'],
            'accepted_answers' => ['nullable', 'array'],
            'accepted_answers.*' => ['string', 'max:255'],
            'points' => ['nullable', 'integer', 'min:1', 'max:100'],
            'difficulty' => ['nullable', Rule::in(['easy', 'medium', 'hard'])],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_published' => ['nullable', 'boolean'],
            'options' => [$needsOptions ? 'required' : 'nullable', 'array', 'min:2'],
            'options.*.option_km' => ['required_with:options', 'string', 'max:500'],
            'options.*.option_en' => ['nullable', 'string', 'max:500'],
            'options.*.is_correct' => ['required_with:options', 'boolean'],
        ];
    }

    /**
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) use ($exercise): void {
                $type = $this->input('type', $exercise->type);

                if (! $this->has('options') || ! in_array($type, ['mcq', 'true_false'], true)) {
                    return;
                }

                if (collect($this->input('options', []))->where('is_correct', true)->count() !== 1) {
                    $validator->errors()->add('options', 'Exactly one option must be marked as correct.');
                }
            },
        ];
    }
}
