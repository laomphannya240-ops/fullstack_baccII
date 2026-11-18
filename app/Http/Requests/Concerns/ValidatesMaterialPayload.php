<?php

namespace App\Http\Requests\Concerns;

use App\Models\Chapter;
use App\Models\StudyMaterial;
use App\Models\StudyMaterialFile;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\UploadedFile;

trait ValidatesMaterialPayload
{
    /**
     * @return array<int, UploadedFile>
     */
    protected function uploadedMaterialFiles(): array
    {
        $files = $this->file('files', []);

        if (! is_array($files)) {
            $files = [$files];
        }

        $legacyFile = $this->file('file');

        if ($legacyFile instanceof UploadedFile) {
            $files[] = $legacyFile;
        }

        return array_values(array_filter($files, fn ($file) => $file instanceof UploadedFile));
    }

    protected function validateMaterialPlacement(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $material = $this->route('material');
            $material = $material instanceof StudyMaterial ? $material : null;

            $subjectId = $this->filled('subject_id')
                ? (int) $this->input('subject_id')
                : (int) ($material?->subject_id ?? 0);
            $chapterId = $this->filled('chapter_id')
                ? (int) $this->input('chapter_id')
                : (int) ($material?->chapter_id ?? 0);

            if ($subjectId === 0 || $chapterId === 0) {
                return;
            }

            $chapterSubjectId = Chapter::whereKey($chapterId)->value('subject_id');

            if ($chapterSubjectId && (int) $chapterSubjectId !== $subjectId) {
                $validator->errors()->add('chapter_id', 'The selected chapter does not belong to the selected subject.');
            }
        });
    }

    protected function validateMaterialFiles(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $files = $this->uploadedMaterialFiles();
            $material = $this->route('material');
            $material = $material instanceof StudyMaterial ? $material : null;

            if ($files !== []) {
                $kinds = collect($files)->map(fn (UploadedFile $file) => StudyMaterialFile::kindFor($file))->unique()->values();

                if ($kinds->count() > 1) {
                    $validator->errors()->add('files', 'A material must contain either PDF files or images, not both.');
                }

                if ($kinds->contains('pdf') && count($files) > 1) {
                    $validator->errors()->add('files', 'Upload only one PDF per material.');
                }
            }

            if ($this->boolean('replace_files') && $files === []) {
                $validator->errors()->add('files', 'Choose at least one file to replace the current files.');
            }

            if (! $material) {
                return;
            }

            $removeIds = collect($this->input('removed_file_ids', []))
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values();

            if ($removeIds->isNotEmpty()) {
                $existingIds = $material->files()->whereIn('id', $removeIds)->pluck('id')
                    ->map(fn ($id) => (int) $id);

                if ($existingIds->count() !== $removeIds->count()) {
                    $validator->errors()->add('removed_file_ids', 'One or more selected files do not belong to this material.');
                }

                if ($existingIds->count() === $material->files()->count() && $files === []) {
                    $validator->errors()->add('files', 'A material must keep at least one file.');
                }
            }
        });
    }
}
