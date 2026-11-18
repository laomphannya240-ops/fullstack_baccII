<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesMaterialPayload;
use App\Models\StudyMaterial;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudyMaterialRequest extends FormRequest
{
    use ValidatesMaterialPayload;

    public function authorize(): bool
    {
        return $this->user()?->can('access-admin') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $material = $this->route('material');
        $materialId = $material instanceof StudyMaterial ? $material->id : 0;

        return [
            'subject_id' => ['sometimes', 'required', 'integer', 'exists:subjects,id'],
            'chapter_id' => ['sometimes', 'required', 'integer', 'exists:chapters,id'],
            'title_en' => ['sometimes', 'required', 'string', 'max:200'],
            'title_km' => ['sometimes', 'required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'files' => ['nullable', 'array', 'min:1', 'max:20'],
            'files.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:20480'],
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:20480'],
            'replace_files' => ['nullable', 'boolean'],
            'removed_file_ids' => ['nullable', 'array', 'max:20'],
            'removed_file_ids.*' => ['integer', Rule::exists('study_material_files', 'id')->where('study_material_id', $materialId)],
            'is_published' => ['nullable', 'boolean'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $this->validateMaterialPlacement($validator);
        $this->validateMaterialFiles($validator);
    }
}
