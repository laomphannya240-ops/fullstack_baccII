<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExerciseRequest extends FormRequest
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
        $type = $this->input('type');
        $needsOptions = in_array($type, ['mcq', 'true_false'], true);

        return [
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'chapter_id' => ['nullable', 'integer', 'exists:chapters,id'],
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'type' => ['required', Rule::in(['mcq', 'true_false', 'short_answer', 'numerical'])],
            'question_km' => ['required', 'string'],
            'question_en' => ['nullable', 'string'],
            'explanation_km' => ['nullable', 'string'],
            'explanation_en' => ['nullable', 'string'],
            'correct_answer' => [Rule::requiredIf(in_array($type, ['short_answer', 'numerical'], true)), 'nullable', 'string', 'max:255'],
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
            function (Validator $validator): void {
                if (! in_array($this->input('type'), ['mcq', 'true_false'], true)) {
                    return;
                }

                $options = collect($this->input('options', []));

                if ($options->where('is_correct', true)->count() !== 1) {
                    $validator->errors()->add('options', 'Exactly one option must be marked as correct.');
                }
            },
        ];
    }
}
