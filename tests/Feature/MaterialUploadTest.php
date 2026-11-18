<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\StudyMaterial;
use App\Models\Subject;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesStudyContent;
use Tests\TestCase;

class MaterialUploadTest extends TestCase
{
    use CreatesStudyContent;
    use RefreshDatabase;

    public function test_guest_and_student_cannot_upload_materials(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $chapter = $this->createChapter($subject);
        $payload = $this->uploadPayload($subject, $chapter, [$this->pngFile('guest.png')]);

        $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/v1/admin/materials', $payload)
            ->assertUnauthorized();

        Sanctum::actingAs($this->createStudent($track));

        $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/v1/admin/materials', $payload)
            ->assertForbidden();
    }

    public function test_admin_can_upload_multiple_images_for_one_material(): void
    {
        Storage::fake('public');
        $track = $this->createTrack(['slug' => 'science']);
        $subject = $this->createSubject($track, ['slug' => 'physics']);
        $chapter = $this->createChapter($subject, ['slug' => 'motion']);
        Sanctum::actingAs($this->createAdmin());

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/v1/admin/materials', $this->uploadPayload($subject, $chapter, [
                $this->pngFile('page-one.png'),
                $this->pngFile('page-two.png'),
            ]));

        $response->assertCreated()
            ->assertJsonPath('data.material_type', 'image')
            ->assertJsonCount(2, 'data.files')
            ->assertJsonPath('data.files.0.name', 'page-one.png')
            ->assertJsonPath('data.files.1.sort_order', 1);

        $material = StudyMaterial::with('files')->findOrFail($response->json('data.id'));

        $this->assertSame('image', $material->file_type);
        $this->assertCount(2, $material->files);
        $this->assertDatabaseCount('study_material_files', 2);

        foreach ($material->files as $file) {
            Storage::disk('public')->assertExists($file->path);
        }
    }

    public function test_upload_rejects_unsupported_files_mixed_kinds_and_wrong_chapter(): void
    {
        Storage::fake('public');
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $chapter = $this->createChapter($subject);
        $otherChapter = $this->createChapter($subject);
        Sanctum::actingAs($this->createAdmin());

        $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/v1/admin/materials', $this->uploadPayload($subject, $chapter, [
                UploadedFile::fake()->createWithContent('notes.docx', 'not a valid material'),
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('files.0');

        $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/v1/admin/materials', $this->uploadPayload($subject, $chapter, [
                $this->pdfFile('notes.pdf'),
                $this->pngFile('page.png'),
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('files');

        $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/v1/admin/materials', $this->uploadPayload($subject, $otherChapter, [
                $this->pdfFile('notes.pdf'),
            ], $this->createSubject($track)->id))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('chapter_id');
    }

    public function test_replacing_files_removes_old_files_from_storage_and_database(): void
    {
        Storage::fake('public');
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $chapter = $this->createChapter($subject);
        Sanctum::actingAs($this->createAdmin());

        $created = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/v1/admin/materials', $this->uploadPayload($subject, $chapter, [
                $this->pdfFile('old.pdf'),
            ]));

        $materialId = $created->json('data.id');
        $oldPath = StudyMaterial::findOrFail($materialId)->file_path;
        Storage::disk('public')->assertExists($oldPath);

        $updated = $this->withHeaders(['Accept' => 'application/json'])
            ->post("/api/v1/admin/materials/{$materialId}", [
                '_method' => 'PUT',
                'subject_id' => $subject->id,
                'chapter_id' => $chapter->id,
                'title_en' => 'Updated notes',
                'title_km' => 'បានធ្វើបច្ចុប្បន្នភាព',
                'replace_files' => true,
                'files' => [$this->pngFile('new.png')],
            ]);

        $updated->assertOk()
            ->assertJsonPath('data.material_type', 'image')
            ->assertJsonCount(1, 'data.files')
            ->assertJsonPath('data.title_en', 'Updated notes');

        $material = StudyMaterial::with('files')->findOrFail($materialId);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($material->files->first()->path);
        $this->assertDatabaseCount('study_material_files', 1);
        $this->assertSame('new.png', $material->files->first()->original_name);
    }

    public function test_deleting_material_removes_its_files(): void
    {
        Storage::fake('public');
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $chapter = $this->createChapter($subject);
        Sanctum::actingAs($this->createAdmin());

        $created = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/v1/admin/materials', $this->uploadPayload($subject, $chapter, [
                $this->pngFile('delete-me.png'),
            ]));

        $materialId = $created->json('data.id');
        $path = StudyMaterial::findOrFail($materialId)->file_path;

        $this->deleteJson("/api/v1/admin/materials/{$materialId}")->assertOk();

        Storage::disk('public')->assertMissing($path);
        $this->assertDatabaseMissing('study_materials', ['id' => $materialId]);
        $this->assertDatabaseMissing('study_material_files', ['study_material_id' => $materialId]);
    }

    public function test_public_list_filters_by_subject_chapter_and_search_and_hides_unpublished(): void
    {
        $track = $this->createTrack();
        $subject = $this->createSubject($track);
        $chapter = $this->createChapter($subject);
        $otherChapter = $this->createChapter($subject);

        $visible = StudyMaterial::create([
            'subject_id' => $subject->id,
            'chapter_id' => $chapter->id,
            'title_en' => 'Visible formula sheet',
            'title_km' => 'រូបមន្ត',
            'file_path' => 'materials/visible.pdf',
            'file_type' => 'pdf',
            'is_published' => true,
        ]);
        StudyMaterial::create([
            'subject_id' => $subject->id,
            'chapter_id' => $otherChapter->id,
            'title_en' => 'Hidden draft',
            'title_km' => 'សេចក្តីព្រាង',
            'file_path' => 'materials/hidden.pdf',
            'file_type' => 'pdf',
            'is_published' => false,
        ]);

        $this->getJson('/api/v1/materials')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $visible->id);

        $this->getJson("/api/v1/materials?subject_id={$subject->id}&chapter_id={$chapter->id}&search=formula")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $visible->id);

        $this->getJson("/api/v1/materials?chapter_id={$otherChapter->id}")
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->getJson('/api/v1/materials/'.$visible->id)
            ->assertOk()
            ->assertJsonPath('data.material_type', 'pdf')
            ->assertJsonPath('data.files.0.url', asset('storage/materials/visible.pdf'));
    }

    public function test_student_can_browse_materials_from_both_tracks(): void
    {
        $science = $this->createTrack(['slug' => 'science']);
        $socialScience = $this->createTrack(['slug' => 'social-science']);
        $scienceSubject = $this->createSubject($science, ['slug' => 'physics']);
        $socialSubject = $this->createSubject($socialScience, ['slug' => 'geography']);

        foreach ([['physics', $scienceSubject], ['geography', $socialSubject]] as [$name, $subject]) {
            StudyMaterial::create([
                'subject_id' => $subject->id,
                'title_en' => "{$name} notes",
                'title_km' => "{$name} កំណត់",
                'file_path' => "materials/{$name}.pdf",
                'file_type' => 'pdf',
                'is_published' => true,
            ]);
        }

        Sanctum::actingAs($this->createStudent($science));

        $this->getJson('/api/v1/materials')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/v1/materials?track_slug=social-science')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.subject.study_track.slug', 'social-science');
    }

    /**
     * @param  array<int, UploadedFile>  $files
     * @return array<string, mixed>
     */
    private function uploadPayload(Subject $subject, Chapter $chapter, array $files, ?int $subjectId = null): array
    {
        return [
            'subject_id' => $subjectId ?? $subject->id,
            'chapter_id' => $chapter->id,
            'title_en' => 'Revision notes',
            'title_km' => 'កំណត់ចំណាំ',
            'description' => 'Demo material',
            'files' => $files,
        ];
    }

    private function pngFile(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=='),
        );
    }

    private function pdfFile(string $name): UploadedFile
    {
        $content = "%PDF-1.4\n"
            ."1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            ."2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            ."3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>\nendobj\n"
            ."trailer\n<< /Root 1 0 R >>\n%%EOF\n";

        return UploadedFile::fake()->createWithContent($name, $content);
    }
}
