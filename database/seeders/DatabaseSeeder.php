<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Chapter;
use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\MockExam;
use App\Models\MockExamQuestion;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\StudyMaterial;
use App\Models\StudyTrack;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    private const DEMO_PASSWORD = 'password';

    /**
     * Seed the application's database with clearly labelled demo content.
     */
    public function run(): void
    {
        $science = StudyTrack::updateOrCreate(['slug' => 'science'], [
            'name_en' => 'Science',
            'name_km' => 'វិទ្យាសាស្ត្រ',
            'description_en' => 'Mathematics, Physics, Chemistry and Biology for Grade 12 Science students.',
            'description_km' => 'គណិតវិទ្យា រូបវិទ្យា គីមីវិទ្យា និងជីវវិទ្យាសម្រាប់សិស្សវិទ្យាសាស្ត្រថ្នាក់ទី១២។',
            'icon' => 'flask-conical',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $socialScience = StudyTrack::updateOrCreate(['slug' => 'social-science'], [
            'name_en' => 'Social Science',
            'name_km' => 'វិទ្យាសាស្ត្រសង្គម',
            'description_en' => 'Khmer Literature, History, Geography and Moral & Civic Education for Grade 12.',
            'description_km' => 'អក្សរសាស្ត្រខ្មែរ ប្រវត្តិសាស្ត្រ ភូមិវិទ្យា និងសីលធម៌ពលរដ្ឋវិជ្ជាសម្រាប់ថ្នាក់ទី១២។',
            'icon' => 'landmark',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $admin = User::updateOrCreate(['email' => 'admin@bacii.test'], [
            'name' => 'BAC II Administrator',
            'password' => Hash::make(self::DEMO_PASSWORD),
            'role' => 'admin',
            'locale' => 'en',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $student = User::updateOrCreate(['email' => 'student@bacii.test'], [
            'name' => 'Sokha Dara',
            'password' => Hash::make(self::DEMO_PASSWORD),
            'role' => 'student',
            'study_track_id' => $science->id,
            'locale' => 'km',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $subjects = [
            ['track' => $science, 'slug' => 'mathematics', 'en' => 'Mathematics', 'km' => 'គណិតវិទ្យា', 'color' => '#2563eb', 'icon' => 'sigma', 'topics' => ['algebra', 'functions']],
            ['track' => $science, 'slug' => 'physics', 'en' => 'Physics', 'km' => 'រូបវិទ្យា', 'color' => '#0891b2', 'icon' => 'atom', 'topics' => ['motion', 'energy']],
            ['track' => $science, 'slug' => 'chemistry', 'en' => 'Chemistry', 'km' => 'គីមីវិទ្យា', 'color' => '#7c3aed', 'icon' => 'flask', 'topics' => ['atomic-structure', 'chemical-bonds']],
            ['track' => $science, 'slug' => 'biology', 'en' => 'Biology', 'km' => 'ជីវវិទ្យា', 'color' => '#16a34a', 'icon' => 'dna', 'topics' => ['cell-biology', 'genetics']],
            ['track' => $socialScience, 'slug' => 'khmer-literature', 'en' => 'Khmer Literature', 'km' => 'អក្សរសាស្ត្រខ្មែរ', 'color' => '#dc2626', 'icon' => 'book-open', 'topics' => ['khmer-texts', 'essay-writing']],
            ['track' => $socialScience, 'slug' => 'history', 'en' => 'History', 'km' => 'ប្រវត្តិសាស្ត្រ', 'color' => '#ea580c', 'icon' => 'landmark', 'topics' => ['ancient-cambodia', 'modern-cambodia']],
            ['track' => $socialScience, 'slug' => 'geography', 'en' => 'Geography', 'km' => 'ភូមិវិទ្យា', 'color' => '#0d9488', 'icon' => 'globe', 'topics' => ['physical-geography', 'cambodia-region']],
            ['track' => $socialScience, 'slug' => 'moral-civic-education', 'en' => 'Moral and Civic Education', 'km' => 'សីលធម៌ និងពលរដ្ឋវិជ្ជា', 'color' => '#db2777', 'icon' => 'scale', 'topics' => ['ethics', 'civic-life']],
        ];

        foreach ($subjects as $index => $subjectData) {
            $subject = Subject::updateOrCreate(['slug' => $subjectData['slug']], [
                'study_track_id' => $subjectData['track']->id,
                'name_en' => $subjectData['en'],
                'name_km' => $subjectData['km'],
                'description_en' => "Demo lessons and practice questions for {$subjectData['en']}. Content is for study practice only.",
                'description_km' => "មេរៀនសាកល្បង និងសំណួរលំហាត់សម្រាប់{$subjectData['km']}។ ខ្លឹមសារសម្រាប់ការសិក្សាសាកល្បងប៉ុណ្ណោះ។",
                'icon' => $subjectData['icon'],
                'color' => $subjectData['color'],
                'sort_order' => $index + 1,
                'is_active' => true,
            ]);

            $chapterData = [
                [
                    'slug' => $subjectData['topics'][0],
                    'en' => 'Foundations and Key Concepts',
                    'km' => 'គ្រឹះ និងគំនិតសំខាន់ៗ',
                    'lesson_en' => 'Introduction to Key Concepts',
                    'lesson_km' => 'ការណែនាំគំនិតសំខាន់ៗ',
                ],
                [
                    'slug' => $subjectData['topics'][1],
                    'en' => 'Applications and Exam Practice',
                    'km' => 'ការអនុវត្ត និងលំហាត់ប្រឡង',
                    'lesson_en' => 'Working Through Exam Questions',
                    'lesson_km' => 'ការដោះស្រាយសំណួរប្រឡង',
                ],
            ];

            $exercises = [];

            foreach ($chapterData as $chapterIndex => $chapterInfo) {
                $chapter = Chapter::updateOrCreate([
                    'subject_id' => $subject->id,
                    'slug' => $chapterInfo['slug'],
                ], [
                    'title_en' => $chapterInfo['en'],
                    'title_km' => $chapterInfo['km'],
                    'description_en' => 'Demo chapter created for BAC II StudyHub practice.',
                    'description_km' => 'ជំពូកសាកល្បងដែលបង្កើតសម្រាប់ការហ្វឹកហាត់ BAC II។',
                    'sort_order' => $chapterIndex + 1,
                    'is_active' => true,
                ]);

                $lesson = Lesson::updateOrCreate([
                    'chapter_id' => $chapter->id,
                    'slug' => 'core-lesson-'.($chapterIndex + 1),
                ], [
                    'title_en' => $chapterInfo['lesson_en'],
                    'title_km' => $chapterInfo['lesson_km'],
                    'summary_en' => "A short demo lesson covering the most important {$subjectData['en']} ideas for this chapter.",
                    'summary_km' => "មេរៀនសាកល្បងខ្លីៗអំពីគំនិតសំខាន់ៗនៃ{$subjectData['km']}សម្រាប់ជំពូកនេះ។",
                    'content_en' => $this->lessonContent($subjectData['en'], $chapterInfo['en']),
                    'content_km' => $this->lessonContentKm($subjectData['km'], $chapterInfo['km']),
                    'important_notes' => "Demo content only. Always confirm official syllabus requirements with your teacher.\n\nKey terms: {$subjectData['en']}, {$chapterInfo['en']}, practice, review.",
                    'estimated_minutes' => 12,
                    'sort_order' => 1,
                    'is_published' => true,
                ]);

                $exercises[] = $this->createExercise($subject, $chapter, $lesson, 0, [
                    'type' => 'mcq',
                    'question_en' => "Which statement about {$subjectData['en']} is most accurate?",
                    'question_km' => "សេចក្តីថ្លែងការណ៍ណាអំពី{$subjectData['km']}ត្រឹមត្រូវបំផុត?",
                    'options' => [
                        ['en' => 'It can only be memorised, not understood.', 'km' => 'វាអាចតែទន្ទេញ មិនអាចយល់បានទេ។', 'correct' => false],
                        ['en' => 'Understanding concepts and practising regularly builds confidence.', 'km' => 'ការយល់គំនិត និងហាត់ជាប់ទាក់ទង បង្កើនទំនុកចិត្ត។', 'correct' => true],
                        ['en' => 'Exam questions never require application.', 'km' => 'សំណួរប្រឡងមិនតម្រូវឱ្យអនុវត្តឡើយ។', 'correct' => false],
                        ['en' => 'Reviewing past mistakes is a waste of time.', 'km' => 'ការពិនិត្យកំហុសចាស់ជាការខំឥតប្រយោជន៍។', 'correct' => false],
                    ],
                    'explanation_en' => 'Conceptual understanding plus consistent practice is the most reliable study strategy.',
                    'explanation_km' => 'ការយល់គំនិតជ្រៅជ្រួត និងការហាត់ជាប់ទាក់ទង ជាវិធីសិក្សាដែលគួរទុកចិត្តបំផុត។',
                ]);
            }

            $firstLesson = $exercises[0]['lesson'];
            $secondLesson = $exercises[1]['lesson'];

            $exercises[] = $this->createExercise($subject, null, $secondLesson, 2, [
                'type' => 'true_false',
                'question_en' => 'Regular short revision sessions are more effective than one long cram session.',
                'question_km' => 'ការពិនិត្យមេរៀនខ្លីៗជាប់ទាក់ទង មានប្រសិទ្ធភាពជាងការទន្ទេញមួយលើកធំ។',
                'options' => [
                    ['en' => 'True', 'km' => 'ត្រឹមត្រូវ', 'correct' => true],
                    ['en' => 'False', 'km' => 'មិនត្រឹមត្រូវ', 'correct' => false],
                ],
                'explanation_en' => 'Spaced repetition helps long-term retention.',
                'explanation_km' => 'ការពិនិត្យចន្លោះៗជួយឱ្យចាំបានយូរ។',
            ]);

            $exercises[] = $this->createExercise($subject, null, $firstLesson, 3, [
                'type' => 'short_answer',
                'question_en' => "Name one important topic you should revise in {$subjectData['en']}.",
                'question_km' => "ចូររៀបរាប់ប្រធានបទសំខាន់មួយដែលអ្នកគួរពិនិត្យក្នុង{$subjectData['km']}។",
                'correct_answer' => $subjectData['topics'][0],
                'accepted_answers' => $subjectData['topics'],
                'explanation_en' => 'Any of the chapter topics is a valid answer for this demo exercise.',
                'explanation_km' => 'ប្រធានបទណាមួយក្នុងជំពូក ជាចម្លើយត្រឹមត្រូវសម្រាប់លំហាត់សាកល្បងនេះ។',
            ]);

            if (in_array($subjectData['slug'], ['mathematics', 'physics'], true)) {
                $exercises[] = $this->createExercise($subject, null, $secondLesson, 4, [
                    'type' => 'numerical',
                    'question_en' => 'Calculate 12 × 3.',
                    'question_km' => 'គណនា ១២ × ៣។',
                    'correct_answer' => '36',
                    'accepted_answers' => ['36.0'],
                    'explanation_en' => '12 multiplied by 3 equals 36.',
                    'explanation_km' => '១២ គុណនឹង ៣ ស្មើនឹង ៣៦។',
                ]);
            } else {
                $exercises[] = $this->createExercise($subject, null, $secondLesson, 4, [
                    'type' => 'short_answer',
                    'question_en' => "What should you do first when analysing a {$subjectData['en']} exam question?",
                    'question_km' => "តើអ្នកគួរធ្វើអ្វីមុនគេ នៅពេលវិភាគសំណួរប្រឡង{$subjectData['km']}?",
                    'correct_answer' => 'identify keywords',
                    'accepted_answers' => ['identify the keywords', 'read carefully', 'understand the question'],
                    'explanation_en' => 'Reading carefully and identifying keywords tells you what the question is asking.',
                    'explanation_km' => 'ការអានដោយយកចិត្តទុកដាក់ និងកំណត់ពាក្យគន្លឹះ ជួយឱ្យដឹងថាសំណួរចង់សួរអ្វី។',
                ]);
            }

            $exerciseIds = collect($exercises)->pluck('id')->all();

            $quiz = Quiz::updateOrCreate(['title_en' => "Demo Quiz: {$subjectData['en']}"], [
                'subject_id' => $subject->id,
                'chapter_id' => $exercises[0]['chapter']?->id,
                'lesson_id' => $exercises[0]['lesson']?->id,
                'title_km' => "សំណួរសាកល្បង៖ {$subjectData['km']}",
                'description_en' => 'Short demo quiz for practice. Not official exam material.',
                'description_km' => 'សំណួរសាកល្បងខ្លីៗសម្រាប់ការហាត់។ មិនមែនជាសម្ភារៈប្រឡងផ្លូវការទេ។',
                'question_count' => count($exerciseIds),
                'duration_minutes' => 15,
                'passing_score' => 70,
                'is_active' => true,
            ]);

            foreach ($exerciseIds as $questionIndex => $exerciseId) {
                QuizQuestion::updateOrCreate([
                    'quiz_id' => $quiz->id,
                    'exercise_id' => $exerciseId,
                ], ['sort_order' => $questionIndex]);
            }

            $exam = MockExam::updateOrCreate(['title_en' => "Demo Mock Exam: {$subjectData['en']}"], [
                'subject_id' => $subject->id,
                'title_km' => "ការប្រឡងសាកល្បង៖ {$subjectData['km']}",
                'description_en' => 'Timed demo mock exam. Not official exam material.',
                'description_km' => 'ការប្រឡងសាកល្បងកំណត់ពេល។ មិនមែនជាសម្ភារៈប្រឡងផ្លូវការទេ។',
                'question_count' => count($exerciseIds),
                'duration_minutes' => 60,
                'passing_score' => 70,
                'is_active' => true,
            ]);

            foreach ($exerciseIds as $questionIndex => $exerciseId) {
                MockExamQuestion::updateOrCreate([
                    'mock_exam_id' => $exam->id,
                    'exercise_id' => $exerciseId,
                ], [
                    'marks' => 1,
                    'sort_order' => $questionIndex,
                ]);
            }

            $materialPath = 'materials/'.$subjectData['slug'].'-demo-notes.txt';
            $materialContent = $this->materialContent($subjectData['en'], $subjectData['km']);
            Storage::disk('public')->put($materialPath, $materialContent);

            StudyMaterial::updateOrCreate(['title_en' => "Demo Study Notes: {$subjectData['en']}"], [
                'subject_id' => $subject->id,
                'chapter_id' => $exercises[0]['chapter']?->id,
                'title_km' => "កំណត់ចំណាំសាកល្បង៖ {$subjectData['km']}",
                'description' => 'Short demo revision notes. Not official exam material. / កំណត់ចំណាំសាកល្បង មិនមែនឯកសារផ្លូវការទេ។',
                'file_path' => $materialPath,
                'file_type' => 'txt',
                'file_size' => strlen($materialContent),
                'is_published' => true,
            ]);
        }

        Announcement::updateOrCreate(['title_en' => 'Welcome to BAC II StudyHub'], [
            'created_by' => $admin->id,
            'title_km' => 'សូមស្វាគមន៍មកកាន់ BAC II StudyHub',
            'body_en' => "Explore demo lessons, exercises, quizzes and mock exams for both Grade 12 tracks. All seeded study content is clearly labelled as demo and is not official exam material.\n\nDemo student login: student@bacii.test / password",
            'body_km' => 'សូមរុករកមេរៀន លំហាត់ សំណួរ និងការប្រឡងសាកល្បងសម្រាប់ជំនាញទាំងពីរ។ ខ្លឹមសារគ្រប់យ៉ាងដែលបានបញ្ចូលគឺជាការសាកល្បង និងមិនមែនឯកសារប្រឡងផ្លូវការទេ។',
            'is_pinned' => true,
            'published_at' => now()->subDay(),
        ]);

        Announcement::updateOrCreate(['title_en' => 'Demo content disclaimer'], [
            'created_by' => $admin->id,
            'title_km' => 'ការបដិសេធអំពីខ្លឹមសារសាកល្បង',
            'body_en' => 'Questions, lessons and notes in this demo are written for software demonstration purposes. Always use your official textbook and teacher guidance for exam preparation.',
            'body_km' => 'សំណួរ មេរៀន និងកំណត់ចំណាំទាំងអស់ ត្រូវបានសរសេរសម្រាប់ការបង្ហាញកម្មវិធី។ សូមប្រើសៀវភៅសិក្សាផ្លូវការ និងការណែនាំរបស់គ្រូ សម្រាប់ការរៀបចំប្រឡង។',
            'is_pinned' => false,
            'published_at' => now()->subHours(6),
        ]);

        $this->command?->info(sprintf(
            'Seeded %d tracks, %d subjects, %d lessons, %d exercises, %d quizzes, %d mock exams and demo users.',
            StudyTrack::count(),
            Subject::count(),
            Lesson::count(),
            Exercise::count(),
            Quiz::count(),
            MockExam::count(),
        ));
    }

    /**
     * @param  array<string, mixed>  $definition
     * @return array{id: int, chapter: ?Chapter, lesson: Lesson}
     */
    private function createExercise(Subject $subject, ?Chapter $chapter, Lesson $lesson, int $sortOrder, array $definition): array
    {
        $exercise = Exercise::updateOrCreate([
            'subject_id' => $subject->id,
            'question_en' => $definition['question_en'],
        ], [
            'chapter_id' => $chapter?->id,
            'lesson_id' => $lesson->id,
            'type' => $definition['type'],
            'question_km' => $definition['question_km'],
            'question_en' => $definition['question_en'],
            'correct_answer' => $definition['correct_answer'] ?? null,
            'accepted_answers' => $definition['accepted_answers'] ?? null,
            'explanation_km' => $definition['explanation_km'] ?? null,
            'explanation_en' => $definition['explanation_en'] ?? null,
            'points' => 1,
            'difficulty' => 'medium',
            'sort_order' => $sortOrder,
            'is_published' => true,
        ]);

        $exercise->options()->delete();

        foreach ($definition['options'] ?? [] as $optionIndex => $option) {
            $exercise->options()->create([
                'option_km' => $option['km'],
                'option_en' => $option['en'],
                'is_correct' => $option['correct'],
                'sort_order' => $optionIndex,
            ]);
        }

        return [
            'id' => $exercise->id,
            'chapter' => $chapter,
            'lesson' => $lesson,
        ];
    }

    private function lessonContent(string $subject, string $chapter): string
    {
        return "# Demo lesson: {$subject}\n\n"
            ."## {$chapter}\n\n"
            .'This is demonstration content for BAC II StudyHub. It is written to show how bilingual lessons, '
            ."progress tracking and practice questions work together.\n\n"
            ."### What you will practise\n\n"
            ."- Reading and understanding key ideas in {$subject}.\n"
            ."- Applying those ideas to short exam-style questions.\n"
            ."- Reviewing feedback after you submit an answer.\n\n"
            ."> Demo content only — not official exam material.\n";
    }

    private function lessonContentKm(string $subject, string $chapter): string
    {
        return "# មេរៀនសាកល្បង៖ {$subject}\n\n"
            ."## {$chapter}\n\n"
            .'នេះជាខ្លឹមសារសាកល្បងសម្រាប់ BAC II StudyHub។ វាត្រូវបានសរសេរដើម្បីបង្ហាញពីរបៀបដែលមេរៀនទ្វេភាសា '
            ."ការតាមដានវឌ្ឍនភាព និងសំណួរលំហាត់ដំណើរការជាមួយគ្នា។\n\n"
            ."### អ្វីដែលអ្នកនឹងហាត់\n\n"
            ."- ការអាន និងយល់គំនិតសំខាន់ៗក្នុង{$subject}។\n"
            ."- ការអនុវត្តគំនិតទាំងនោះចំពោះសំណួរខ្លីៗបែបប្រឡង។\n"
            ."- ការពិនិត្យមតិត្រឡប់ក្រោយពេលដាក់ចម្លើយ។\n\n"
            ."> ខ្លឹមសារសាកល្បងប៉ុណ្ណោះ — មិនមែនសម្ភារៈប្រឡងផ្លូវការទេ។\n";
    }

    private function materialContent(string $subjectEn, string $subjectKm): string
    {
        return "BAC II StudyHub — Demo Study Notes\n"
            ."====================================\n\n"
            ."Subject: {$subjectEn} / {$subjectKm}\n\n"
            ."These notes are demonstration content only and are not official exam material.\n"
            ."Use your official Grade 12 textbook and your teacher's guidance for exam preparation.\n\n"
            ."Suggested revision routine:\n"
            ."1. Read the lesson in your preferred language.\n"
            ."2. Answer the practice exercises without looking at the explanation.\n"
            ."3. Take the short quiz and review your feedback.\n"
            ."4. Try the timed mock exam when you feel ready.\n";
    }
}
