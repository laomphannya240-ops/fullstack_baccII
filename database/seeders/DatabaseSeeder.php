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
            'description_en' => 'Mathematics, Physics, Chemistry, Biology, History, English and Khmer Literature for Grade 12 Science students.',
            'description_km' => 'គណិតវិទ្យា រូបវិទ្យា គីមីវិទ្យា ជីវវិទ្យា ប្រវត្តិសាស្ត្រ ភាសាអង់គ្លេស និងអក្សរសាស្ត្រខ្មែរ សម្រាប់សិស្សវិទ្យាសាស្ត្រថ្នាក់ទី១២។',
            'icon' => 'flask-conical',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $socialScience = StudyTrack::updateOrCreate(['slug' => 'social-science'], [
            'name_en' => 'Social Science',
            'name_km' => 'វិទ្យាសាស្ត្រសង្គម',
            'description_en' => 'Khmer Literature, Mathematics, Earth Science, Geography, History, English and Moral Education for Grade 12.',
            'description_km' => 'អក្សរសាស្ត្រខ្មែរ គណិតវិទ្យា ផែនដី ភូមិវិទ្យា ប្រវត្តិសាស្ត្រ ភាសាអង់គ្លេស និងសីលធម៌ សម្រាប់ថ្នាក់ទី១២។',
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

        User::updateOrCreate(['email' => 'student@bacii.test'], [
            'name' => 'Sokha Dara',
            'password' => Hash::make(self::DEMO_PASSWORD),
            'role' => 'student',
            'study_track_id' => $science->id,
            'locale' => 'km',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $this->seedExerciseImage();

        $subjectDefinitions = $this->subjectDefinitions($science, $socialScience);
        $expectedSlugs = collect($subjectDefinitions)->pluck('slug')->unique()->all();

        // Remove stale demo subjects left behind by earlier seeder versions.
        Subject::whereIn('study_track_id', [$science->id, $socialScience->id])
            ->whereNotIn('slug', $expectedSlugs)
            ->each(fn (Subject $subject) => $subject->delete());

        foreach ($subjectDefinitions as $index => $subjectData) {
            $subject = Subject::updateOrCreate([
                'study_track_id' => $subjectData['track']->id,
                'slug' => $subjectData['slug'],
            ], [
                'name_en' => $subjectData['en'],
                'name_km' => $subjectData['km'],
                'description_en' => "Short lessons, exercises and a quick reference sheet for {$subjectData['en']}. Demo content only.",
                'description_km' => "មេរៀនខ្លីៗ លំហាត់ និងតារាងយោងរហ័សសម្រាប់{$subjectData['km']}។ ខ្លឹមសារសាកល្បងប៉ុណ្ណោះ។",
                'icon' => $subjectData['icon'],
                'color' => $subjectData['color'],
                'sort_order' => $index + 1,
                'is_active' => true,
            ]);

            $chapters = [];
            $chapterLessons = [];

            foreach ($subjectData['topics'] as $chapterIndex => $topic) {
                $chapter = Chapter::updateOrCreate([
                    'subject_id' => $subject->id,
                    'slug' => $topic['slug'],
                ], [
                    'title_en' => $topic['en'],
                    'title_km' => $topic['km'],
                    'description_en' => "Demo chapter for {$subjectData['en']} practice.",
                    'description_km' => "ជំពូកសាកល្បងសម្រាប់ហាត់{$subjectData['km']}។",
                    'sort_order' => $chapterIndex + 1,
                    'is_active' => true,
                ]);

                $lesson = Lesson::updateOrCreate([
                    'chapter_id' => $chapter->id,
                    'slug' => 'core-lesson-'.($chapterIndex + 1),
                ], [
                    'title_en' => $topic['en'],
                    'title_km' => $topic['km'],
                    'summary_en' => "A short introduction to {$topic['en']} with exam-style practice.",
                    'summary_km' => "ការណែនាំខ្លីអំពី{$topic['km']} ព្រមទាំងលំហាត់បែបប្រឡង។",
                    'content_en' => $this->lessonContent($subjectData['en'], $topic['en']),
                    'content_km' => $this->lessonContentKm($subjectData['km'], $topic['km']),
                    'important_notes' => 'Demo content only. Confirm official syllabus details with your teacher.',
                    'estimated_minutes' => 10,
                    'sort_order' => $chapterIndex + 1,
                    'is_published' => true,
                    'is_reference' => false,
                ]);

                $chapters[] = $chapter;
                $chapterLessons[] = $lesson;
            }

            $referenceLesson = Lesson::updateOrCreate([
                'chapter_id' => $chapters[0]->id,
                'slug' => 'quick-reference',
            ], [
                'title_en' => 'Quick Reference: '.$subjectData['en'],
                'title_km' => 'តារាងយោងរហ័ស៖ '.$subjectData['km'],
                'summary_en' => "Formulas, definitions and key facts for {$subjectData['en']}.",
                'summary_km' => "រូបមន្ត និយមន័យ និងព័ត៌មានសំខាន់ៗសម្រាប់{$subjectData['km']}។",
                'content_en' => $this->referenceContent('Quick Reference: '.$subjectData['en'], $subjectData['reference']['en']),
                'content_km' => $this->referenceContent('តារាងយោងរហ័ស៖ '.$subjectData['km'], $subjectData['reference']['km']),
                'important_notes' => 'Use this sheet for a fast review before practice. Demo content only.',
                'estimated_minutes' => 5,
                'sort_order' => 0,
                'is_published' => true,
                'is_reference' => true,
            ]);

            $exercises = [];

            foreach ($chapters as $chapterIndex => $chapter) {
                $exercises[] = $this->createExercise(
                    $subject,
                    $chapter,
                    $chapterLessons[$chapterIndex],
                    $chapterIndex,
                    $subjectData['exercises'][$chapterIndex],
                );
            }

            $exercises[] = $this->createExercise($subject, null, $chapterLessons[1], 2, $subjectData['exercises'][2]);
            $exercises[] = $this->createExercise($subject, null, $referenceLesson, 3, $subjectData['exercises'][3]);

            $exerciseIds = collect($exercises)->pluck('id')->all();

            $quiz = Quiz::updateOrCreate([
                'subject_id' => $subject->id,
                'title_en' => "Practice Quiz: {$subjectData['en']}",
            ], [
                'chapter_id' => $chapters[0]->id,
                'lesson_id' => $chapterLessons[0]->id,
                'title_km' => "សំណួរហាត់៖ {$subjectData['km']}",
                'description_en' => 'Short demo quiz using exercises from this subject.',
                'description_km' => 'សំណួរសាកល្បងខ្លីៗដែលប្រើលំហាត់ពីមុខវិជ្ជានេះ។',
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

            $exam = MockExam::updateOrCreate([
                'subject_id' => $subject->id,
                'title_en' => "Mock Exam: {$subjectData['en']}",
            ], [
                'title_km' => "ការប្រឡងសាកល្បង៖ {$subjectData['km']}",
                'description_en' => 'Timed demo mock exam using exercises from this subject.',
                'description_km' => 'ការប្រឡងសាកល្បងកំណត់ពេល ដោយប្រើលំហាត់ពីមុខវិជ្ជានេះ។',
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

            $materialPath = 'materials/'.$subjectData['track']->slug.'-'.$subjectData['slug'].'-notes.txt';
            $materialContent = $this->materialContent($subjectData['en'], $subjectData['km']);
            Storage::disk('public')->put($materialPath, $materialContent);

            StudyMaterial::updateOrCreate([
                'subject_id' => $subject->id,
                'title_en' => "Revision Notes: {$subjectData['en']}",
            ], [
                'chapter_id' => $chapters[0]->id,
                'title_km' => "កំណត់ចំណាំពិនិត្យ៖ {$subjectData['km']}",
                'description' => 'Short revision notes. Demo content only. / កំណត់ចំណាំខ្លីៗ សម្រាប់ការសាកល្បងប៉ុណ្ណោះ។',
                'file_path' => $materialPath,
                'file_type' => 'txt',
                'file_size' => strlen($materialContent),
                'is_published' => true,
            ]);
        }

        Announcement::updateOrCreate(['title_en' => 'Welcome to BAC II StudyHub'], [
            'created_by' => $admin->id,
            'title_km' => 'សូមស្វាគមន៍មកកាន់ BAC II StudyHub',
            'body_en' => "Choose Science or Social Science, then practise by subject, chapter and difficulty. Every subject has exercises, a quick reference sheet and progress tracking.\n\nDemo student login: student@bacii.test / password",
            'body_km' => 'ជ្រើសរើសវិទ្យាសាស្ត្រ ឬវិទ្យាសាស្ត្រសង្គម បន្ទាប់មកហាត់តាមមុខវិជ្ជា ជំពូក និងកម្រិតពិបាក។ មុខវិជ្ជានីមួយៗមានលំហាត់ តារាងយោងរហ័ស និងការតាមដានវឌ្ឍនភាព។',
            'is_pinned' => true,
            'published_at' => now()->subDay(),
        ]);

        Announcement::updateOrCreate(['title_en' => 'Demo content disclaimer'], [
            'created_by' => $admin->id,
            'title_km' => 'ការបដិសេធអំពីខ្លឹមសារសាកល្បង',
            'body_en' => 'Questions, lessons, formulas and notes in this demo are written for software demonstration purposes. Always use your official Grade 12 textbook and teacher guidance for exam preparation.',
            'body_km' => 'សំណួរ មេរៀន រូបមន្ត និងកំណត់ចំណាំទាំងអស់ ត្រូវបានសរសេរសម្រាប់ការបង្ហាញកម្មវិធី។ សូមប្រើសៀវភៅសិក្សាផ្លូវការ និងការណែនាំរបស់គ្រូ សម្រាប់ការរៀបចំប្រឡង។',
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
     * @return array<int, array<string, mixed>>
     */
    private function subjectDefinitions(StudyTrack $science, StudyTrack $socialScience): array
    {
        $mathExercises = [
            $this->mcq(
                'What are the roots of x^2 - 5x + 6 = 0?',
                'តើឫសនៃ x^2 - 5x + 6 = 0 ជាអ្វី?',
                [
                    ['en' => 'x = 1 and x = 6', 'km' => 'x = 1 និង x = 6', 'correct' => false],
                    ['en' => 'x = 2 and x = 3', 'km' => 'x = 2 និង x = 3', 'correct' => true],
                    ['en' => 'x = -2 and x = -3', 'km' => 'x = -2 និង x = -3', 'correct' => false],
                    ['en' => 'x = 0 and x = 5', 'km' => 'x = 0 និង x = 5', 'correct' => false],
                ],
                'Factorising gives (x - 2)(x - 3) = 0, so x = 2 or x = 3.',
                'ការបំបែកកត្តាបាន (x - 2)(x - 3) = 0 ដូច្នេះ x = 2 ឬ x = 3។',
                'medium',
            ),
            $this->mcq(
                'What is the gradient of y = 2x + 1?',
                'តើជម្រាលនៃ y = 2x + 1 ជាអ្វី?',
                [
                    ['en' => '1', 'km' => '១', 'correct' => false],
                    ['en' => '2', 'km' => '២', 'correct' => true],
                    ['en' => '3', 'km' => '៣', 'correct' => false],
                    ['en' => '0', 'km' => '០', 'correct' => false],
                ],
                'In y = mx + c, the coefficient of x is the gradient, so m = 2.',
                'ក្នុង y = mx + c មេគុណរបស់ x គឺជាជម្រាល ដូច្នេះ m = ២។',
                'easy',
            ),
            $this->trueFalse(
                'A negative discriminant means the quadratic has no real roots.',
                'ឌីស្គ្រីមីណង់អវិជ្ជមាន មានន័យថាសមីការដឺក្រេទី២ គ្មានឫសពិត។',
                true,
                'When D < 0, the square root is not a real number, so there are no real roots.',
                'ពេល D < 0 ឫសការេមិនមែនជាចំនួនពិតទេ ដូច្នេះគ្មានឫសពិត។',
                'medium',
            ),
            $this->numerical('Solve 3x = 12.', 'ដោះស្រាយ 3x = ១២។', '4', ['4.0'], 'Divide both sides by 3.', 'ចែកទាំងសងខាងនឹង ៣។'),
        ];

        $historyExercises = [
            $this->mcq(
                'What was the capital of the Khmer Empire?',
                'តើរាជធានីនៃចក្រភពខ្មែរជាអ្វី?',
                [
                    ['en' => 'Angkor', 'km' => 'អង្គរ', 'correct' => true],
                    ['en' => 'Phnom Penh', 'km' => 'ភ្នំពេញ', 'correct' => false],
                    ['en' => 'Siem Reap', 'km' => 'សៀមរាប', 'correct' => false],
                    ['en' => 'Battambang', 'km' => 'បាត់ដំបង', 'correct' => false],
                ],
                'Angkor served as the capital of the Khmer Empire.',
                'អង្គរជារាជធានីនៃចក្រភពខ្មែរ។',
            ),
            $this->mcq(
                'Which king is known for building the Bayon temple?',
                'តើព្រះមហាក្សត្រណាដែលគេស្គាល់ថាបានសាងសង់ប្រាសាទបាយ័ន?',
                [
                    ['en' => 'Jayavarman VII', 'km' => 'ជយវម៌្មទី៧', 'correct' => true],
                    ['en' => 'Suryavarman I', 'km' => 'សូយ៌វម៌្មទី១', 'correct' => false],
                    ['en' => 'Norodom', 'km' => 'នរោត្តម', 'correct' => false],
                    ['en' => 'Ang Eng', 'km' => 'អង្គអេង', 'correct' => false],
                ],
                'Jayavarman VII built the Bayon temple and many hospitals.',
                'ជយវម៌្មទី៧បានសាងសង់ប្រាសាទបាយ័ន និងមន្ទីរពេទ្យជាច្រើន។',
                'medium',
            ),
            $this->trueFalse(
                'Angkor Wat was originally built as a Hindu temple.',
                'អង្គរវត្តត្រូវបានសាងសង់ដំបូងជាប្រាសាទហិណ្ឌូ។',
                true,
                'Angkor Wat was dedicated to Vishnu before its Buddhist transformation.',
                'អង្គរវត្តត្រូវបានឧទ្ទិសដល់ព្រះវិស្ណុ មុនពេលក្លាយជាប្រាសាទពុទ្ធសាសនា។',
            ),
            $this->shortAnswer(
                'Name the river valley where Angkor is located.',
                'ចូរប្រាប់ឈ្មោះជ្រលងទន្លេដែលអង្គរស្ថិតនៅ។',
                'mekong',
                ['mekong river', 'tonle sap', 'ស្ទឹងសៀមរាប'],
                'Angkor lies in the Tonle Sap and Mekong river region.',
                'អង្គរស្ថិតនៅតំបន់ទន្លេសាប និងទន្លេមេគង្គ។',
                'hard',
            ),
        ];

        $englishExercises = [
            $this->mcq(
                'Choose the correct sentence.',
                'ជ្រើសរើសប្រយោគត្រឹមត្រូវ។',
                [
                    ['en' => 'He study English every day.', 'km' => 'He study English every day.', 'correct' => false],
                    ['en' => 'He studies English every day.', 'km' => 'He studies English every day.', 'correct' => true],
                    ['en' => 'He studying English every day.', 'km' => 'He studying English every day.', 'correct' => false],
                    ['en' => 'He is study English every day.', 'km' => 'He is study English every day.', 'correct' => false],
                ],
                'With he/she/it in the present simple, add -s to the verb.',
                'ជាមួយ he/she/it ក្នុង present simple ត្រូវបន្ថែម -s ទៅកិរិយាសព្ទ។',
            ),
            $this->mcq(
                'What is the past tense of "go"?',
                'តើអតីតកាលនៃ "go" ជាអ្វី?',
                [
                    ['en' => 'goed', 'km' => 'goed', 'correct' => false],
                    ['en' => 'gone', 'km' => 'gone', 'correct' => false],
                    ['en' => 'went', 'km' => 'went', 'correct' => true],
                    ['en' => 'going', 'km' => 'going', 'correct' => false],
                ],
                '"Go" is irregular: go - went - gone.',
                '"Go" ជាកិរិយាសព្ទមិនទៀងទាត់៖ go - went - gone។',
            ),
            $this->trueFalse(
                '"They are reading now" is present continuous.',
                '"They are reading now" ជា present continuous។',
                true,
                'The structure am/is/are + verb-ing expresses an action happening now.',
                'រចនាសម្ព័ន្ធ am/is/are + verb-ing បង្ហាញពីសកម្មភាពកំពុងកើតឡើង។',
            ),
            $this->shortAnswer(
                'What is the plural of "child"?',
                'តើពហុវចនៈនៃ "child" ជាអ្វី?',
                'children',
                ['children'],
                'The irregular plural of child is children.',
                'ពហុវចនៈមិនទៀងទាត់របស់ child គឺ children។',
            ),
        ];

        $khmerLiteratureExercises = [
            $this->mcq(
                'What is "ន័យធៀប" in Khmer literature?',
                'តើ "ន័យធៀប" ជាអ្វីក្នុងអក្សរសាស្ត្រខ្មែរ?',
                [
                    ['en' => 'A direct statement', 'km' => 'ការនិយាយផ្ទាល់', 'correct' => false],
                    ['en' => 'A comparison using like or as', 'km' => 'ការប្រៀបធៀបដោយប្រើ "ដូច"', 'correct' => true],
                    ['en' => 'A question', 'km' => 'សំណួរ', 'correct' => false],
                    ['en' => 'A date', 'km' => 'កាលបរិច្ឆេទ', 'correct' => false],
                ],
                'ន័យធៀប compares one thing with another, often using "ដូច".',
                'ន័យធៀបជាការប្រៀបធៀបវត្ថុមួយទៅនឹងវត្ថុមួយ ច្រើនតែប្រើពាក្យ "ដូច"។',
                'medium',
            ),
            $this->mcq(
                'Which form is a traditional Khmer poem?',
                'តើទម្រង់ណាជាកំណាព្យខ្មែរប្រពៃណី?',
                [
                    ['en' => 'Free verse only', 'km' => 'តែកំណាព្យសេរី', 'correct' => false],
                    ['en' => 'Chanting poetry (កំណាព្យចម្រៀង)', 'km' => 'កំណាព្យចម្រៀង', 'correct' => true],
                    ['en' => 'A newspaper report', 'km' => 'របាយការណ៍ព័ត៌មាន', 'correct' => false],
                    ['en' => 'A math formula', 'km' => 'រូបមន្តគណិតវិទ្យា', 'correct' => false],
                ],
                'Khmer literature includes measured and chanting poetry forms.',
                'អក្សរសាស្ត្រខ្មែរមានទម្រង់កំណាព្យចង្វាក់ និងកំណាព្យចម្រៀង។',
            ),
            $this->trueFalse(
                'Khmer folk tales are part of Khmer literature.',
                'រឿងនិទានប្រជាប្រិយខ្មែរ ជាផ្នែកមួយនៃអក្សរសាស្ត្រខ្មែរ។',
                true,
                'Folk tales, legends and poetry all form part of Khmer literature.',
                'រឿងនិទាន រឿងព្រេងនិទាន និងកំណាព្យ សុទ្ធតែជាផ្នែកនៃអក្សរសាស្ត្រខ្មែរ។',
            ),
            $this->shortAnswer(
                'Give one example of a Khmer literary genre.',
                'ចូររៀបរាប់ប្រភេទអក្សរសាស្ត្រខ្មែរមួយ។',
                'កំណាព្យ',
                ['កំណាព្យ', 'រឿងនិទាន', 'រឿងព្រេងនិទាន', 'poetry', 'folk tale'],
                'Poetry, folk tales and novels are all valid genres.',
                'កំណាព្យ រឿងនិទាន និងប្រលោមលោក សុទ្ធតែជាប្រភេទអក្សរសាស្ត្រ។',
                'hard',
            ),
        ];

        return [
            [
                'track' => $science,
                'slug' => 'mathematics',
                'en' => 'Mathematics',
                'km' => 'គណិតវិទ្យា',
                'color' => '#2563eb',
                'icon' => 'sigma',
                'topics' => [
                    ['slug' => 'quadratics', 'en' => 'Quadratic Equations', 'km' => 'សមីការដឺក្រេទី២'],
                    ['slug' => 'functions', 'en' => 'Functions and Graphs', 'km' => 'អនុគមន៍ និងក្រាហ្វិក'],
                ],
                'reference' => [
                    'en' => ['Quadratic formula: $x = (-b +/- sqrt(b^2 - 4ac)) / (2a)$', 'Discriminant $D = b^2 - 4ac$: two roots when D > 0, one when D = 0.', 'Example: x^2 - 5x + 6 = 0 gives x = 2 or x = 3.'],
                    'km' => ['រូបមន្តដឺក្រេទី២៖ $x = (-b +/- sqrt(b^2 - 4ac)) / (2a)$', 'ឌីស្គ្រីមីណង់ $D = b^2 - 4ac$៖ ឫសពីរពេល D > 0 ឫសមួយពេល D = 0។', 'ឧទាហរណ៍៖ x^2 - 5x + 6 = 0 បាន x = 2 ឬ x = 3។'],
                ],
                'exercises' => $mathExercises,
            ],
            [
                'track' => $science,
                'slug' => 'physics',
                'en' => 'Physics',
                'km' => 'រូបវិទ្យា',
                'color' => '#0891b2',
                'icon' => 'atom',
                'topics' => [
                    ['slug' => 'motion', 'en' => 'Motion and Forces', 'km' => 'ចលនា និងកម្លាំង'],
                    ['slug' => 'energy', 'en' => 'Energy and Waves', 'km' => 'ថាមពល និងរលក'],
                ],
                'reference' => [
                    'en' => ['Speed: $v = s / t$ (metres per second).', 'Acceleration: $a = (v - u) / t$.', "Newton's second law: \$F = m a\$.", 'Example: s = 60 m and t = 3 s gives v = 20 m/s.'],
                    'km' => ['ល្បឿន៖ $v = s / t$ (ម៉ែត្រក្នុងមួយវិនាទី)។', 'សំទុះ៖ $a = (v - u) / t$។', 'ច្បាប់ទី២របស់ញូតុន៖ $F = m a$។', 'ឧទាហរណ៍៖ s = ៦០ ម៉ែត្រ t = ៣ វិនាទី បាន v = ២០ ម៉ែត្រ/វិនាទី។'],
                ],
                'exercises' => [
                    $this->mcq(
                        'Using the distance-time graph, what is the average speed?',
                        'ពីក្រាហ្វិកចម្ងាយ-ពេលវេលា តើល្បឿនមធ្យមជាអ្វី?',
                        [
                            ['en' => '10 m/s', 'km' => '១០ ម៉ែត្រ/វិនាទី', 'correct' => false],
                            ['en' => '20 m/s', 'km' => '២០ ម៉ែត្រ/វិនាទី', 'correct' => true],
                            ['en' => '30 m/s', 'km' => '៣០ ម៉ែត្រ/វិនាទី', 'correct' => false],
                            ['en' => '60 m/s', 'km' => '៦០ ម៉ែត្រ/វិនាទី', 'correct' => false],
                        ],
                        'Average speed = distance / time = 60 m / 3 s = 20 m/s.',
                        'ល្បឿនមធ្យម = ចម្ងាយ / ពេលវេលា = ៦០ / ៣ = ២០ ម៉ែត្រ/វិនាទី។',
                        'medium',
                        'exercises/motion-graph.svg',
                    ),
                    $this->mcq(
                        'A 2 kg object accelerates at 3 m/s^2. What force acts on it?',
                        'វត្ថុមួយមានម៉ាស់ ២ គីឡូក្រាម សំទុះ ៣ ម៉ែត្រ/វិនាទី²។ តើកម្លាំងប៉ុន្មាន?',
                        [
                            ['en' => '1.5 N', 'km' => '១.៥ N', 'correct' => false],
                            ['en' => '5 N', 'km' => '៥ N', 'correct' => false],
                            ['en' => '6 N', 'km' => '៦ N', 'correct' => true],
                            ['en' => '9 N', 'km' => '៩ N', 'correct' => false],
                        ],
                        'Using F = m a, force = 2 x 3 = 6 N.',
                        'ប្រើ F = m a កម្លាំង = ២ x ៣ = ៦ N។',
                        'medium',
                    ),
                    $this->trueFalse(
                        'Acceleration is the rate of change of velocity.',
                        'សំទុះជាអត្រានៃការប្រែប្រួលល្បឿន។',
                        true,
                        'Acceleration measures how quickly velocity changes with time.',
                        'សំទុះវាស់ថាល្បឿនប្រែប្រួលលឿនប៉ុណ្ណោះតាមពេលវេលា។',
                    ),
                    $this->numerical('A car travels 100 m in 5 s. Find its speed.', 'រថយន្តមួយធ្វើដំណើរ ១០០ ម៉ែត្រ ក្នុង ៥ វិនាទី។ រកល្បឿន។', '20', ['20.0'], 'Speed = 100 / 5 = 20 m/s.', 'ល្បឿន = ១០០ / ៥ = ២០ ម៉ែត្រ/វិនាទី។'),
                ],
            ],
            [
                'track' => $science,
                'slug' => 'chemistry',
                'en' => 'Chemistry',
                'km' => 'គីមីវិទ្យា',
                'color' => '#7c3aed',
                'icon' => 'flask',
                'topics' => [
                    ['slug' => 'atomic-structure', 'en' => 'Atomic Structure', 'km' => 'រចនាសម្ព័ន្ធអាតូម'],
                    ['slug' => 'acids-bases', 'en' => 'Acids, Bases and pH', 'km' => 'អាស៊ីត មូលដ្ឋាន និង pH'],
                ],
                'reference' => [
                    'en' => ['An atom has protons, neutrons and electrons.', 'pH = -log[H+]: below 7 is acidic, 7 is neutral, above 7 is alkaline.', 'Moles: n = mass / molar mass.', 'Example: 18 g of water is about 1 mole.'],
                    'km' => ['អាតូមមានប្រូតុន នឺត្រុង និងអេឡិចត្រុង។', 'pH = -log[H+]៖ ក្រោម ៧ ជាអាស៊ីត ៧ ជាអព្យាក្រឹត លើស ៧ ជាមូលដ្ឋាន។', 'ចំនួនម៉ូល៖ n = ម៉ាស់ / ម៉ាស់ម៉ូលេគុល។', 'ឧទាហរណ៍៖ ទឹក ១៨ ក្រាម ស្មើប្រហែល ១ ម៉ូល។'],
                ],
                'exercises' => [
                    $this->mcq(
                        'A solution has pH 3. What is it?',
                        'ដំណោះស្រាយមួយមាន pH ៣។ តើវាជាអ្វី?',
                        [
                            ['en' => 'Strongly acidic', 'km' => 'អាស៊ីតខ្លាំង', 'correct' => true],
                            ['en' => 'Neutral', 'km' => 'អព្យាក្រឹត', 'correct' => false],
                            ['en' => 'Alkaline', 'km' => 'មូលដ្ឋាន', 'correct' => false],
                            ['en' => 'Pure water', 'km' => 'ទឹកសុទ្ធ', 'correct' => false],
                        ],
                        'pH values below 7 indicate an acidic solution.',
                        'តម្លៃ pH ក្រោម ៧ បង្ហាញថាដំណោះស្រាយជាអាស៊ីត។',
                    ),
                    $this->mcq(
                        'How many hydrogen atoms are in H2O?',
                        'តើមានអាតូមអ៊ីដ្រូសែនប៉ុន្មានក្នុង H2O?',
                        [
                            ['en' => '1', 'km' => '១', 'correct' => false],
                            ['en' => '2', 'km' => '២', 'correct' => true],
                            ['en' => '3', 'km' => '៣', 'correct' => false],
                            ['en' => '0', 'km' => '០', 'correct' => false],
                        ],
                        'The subscript 2 shows two hydrogen atoms.',
                        'លេខក្រោម ២ បង្ហាញថាមានអាតូមអ៊ីដ្រូសែនពីរ។',
                    ),
                    $this->trueFalse('Pure water has pH 7.', 'ទឹកសុទ្ធមាន pH ៧។', true, 'Pure water is neutral at room temperature.', 'ទឹកសុទ្ធជាអព្យាក្រឹតនៅសីតុណ្ហភាពធម្មតា។'),
                    $this->shortAnswer('What is the molar mass of water in g/mol?', 'តើម៉ាស់ម៉ូលេគុលរបស់ទឹកជាប៉ុន្មាន ក្រាម/ម៉ូល?', '18', ['18', '18 g/mol', '១៨'], 'H2O has molar mass 2(1) + 16 = 18 g/mol.', 'H2O មានម៉ាស់ម៉ូលេគុល ២(១) + ១៦ = ១៨ ក្រាម/ម៉ូល។'),
                ],
            ],
            [
                'track' => $science,
                'slug' => 'biology',
                'en' => 'Biology',
                'km' => 'ជីវវិទ្យា',
                'color' => '#16a34a',
                'icon' => 'dna',
                'topics' => [
                    ['slug' => 'cell-biology', 'en' => 'Cells and Life Processes', 'km' => 'កោសិកា និងដំណើរការជីវិត'],
                    ['slug' => 'genetics', 'en' => 'Genetics and Heredity', 'km' => 'ពន្ធុវិទ្យា និងកេរដំណែល'],
                ],
                'reference' => [
                    'en' => ['The cell is the basic unit of life.', 'Mitosis makes two identical body cells; meiosis makes four gametes.', 'Mitochondria release energy from food.', 'Example: plants make glucose by photosynthesis.'],
                    'km' => ['កោសិកាជាឯកតាមូលដ្ឋាននៃជីវិត។', 'មីតូសបង្កើតកោសិការាងកាយពីរដូចគ្នា មេអូសបង្កើតកោសិកាបន្តពូជបួន។', 'មីតូកុងឌ្រី ទាញយកថាមពលពីអាហារ។', 'ឧទាហរណ៍៖ រុក្ខជាតិបង្កើតគ្លុយកូសតាមរយៈការធ្វើរស្មីសំយោគ។'],
                ],
                'exercises' => [
                    $this->mcq('What is the basic unit of life?', 'តើឯកតាមូលដ្ឋាននៃជីវិតជាអ្វី?', [
                        ['en' => 'Atom', 'km' => 'អាតូម', 'correct' => false],
                        ['en' => 'Cell', 'km' => 'កោសិកា', 'correct' => true],
                        ['en' => 'Molecule', 'km' => 'ម៉ូលេគុល', 'correct' => false],
                        ['en' => 'Organ', 'km' => 'សរីរាង្គ', 'correct' => false],
                    ], 'All living things are made of cells.', 'សត្វ និងរុក្ខជាតិទាំងអស់បង្កើតឡើងពីកោសិកា។'),
                    $this->mcq('Which organelle releases energy from food?', 'តើអង្គភាពកោសិកាណាទាញយកថាមពលពីអាហារ?', [
                        ['en' => 'Ribosome', 'km' => 'រីបូសូម', 'correct' => false],
                        ['en' => 'Nucleus', 'km' => 'ស្នូល', 'correct' => false],
                        ['en' => 'Mitochondrion', 'km' => 'មីតូកុងឌ្រី', 'correct' => true],
                        ['en' => 'Cell wall', 'km' => 'ជញ្ជាំងកោសិකា', 'correct' => false],
                    ], 'Mitochondria are the site of aerobic respiration.', 'មីតូកុងឌ្រីជាកន្លែងកើតដំណើរការដកដង្ហើមអេរ៉ូប។', 'medium'),
                    $this->trueFalse('Meiosis produces four gamete cells.', 'មេអូសបង្កើតកោសិកាបន្តពូជបួន។', true, 'Meiosis reduces the chromosome number and forms four gametes.', 'មេអូសកាត់បន្ថយចំនួនក្រូមូហ្សូម ហើយបង្កើតកោសិកាបន្តពូជបួន។'),
                    $this->shortAnswer('Name the process by which plants make food.', 'ចូរប្រាប់ឈ្មោះដំណើរការដែលរុក្ខជាតិបង្កើតអាហារ។', 'photosynthesis', ['photosynthesis', 'ការធ្វើរស្មីសំយោគ'], 'Plants use light energy to make glucose.', 'រុក្ខជាតិប្រើថាមពលពន្លឺដើម្បីបង្កើតគ្លុយកូស។'),
                ],
            ],
            [
                'track' => $science,
                'slug' => 'history',
                'en' => 'History',
                'km' => 'ប្រវត្តិវិទ្យា',
                'color' => '#ea580c',
                'icon' => 'landmark',
                'topics' => [
                    ['slug' => 'angkor', 'en' => 'Ancient Cambodia and Angkor', 'km' => 'កម្ពុជាបុរាណ និងអង្គរ'],
                    ['slug' => 'modern-cambodia', 'en' => 'Modern Cambodia', 'km' => 'កម្ពុជាសម័យថ្មី'],
                ],
                'reference' => [
                    'en' => ['Angkor was the capital of the Khmer Empire.', 'Jayavarman VII ruled from 1181 to about 1218 CE.', 'Angkor Wat was first dedicated to Vishnu.', 'Example: the Bayon is famous for its smiling faces.'],
                    'km' => ['អង្គរជារាជធានីនៃចក្រភពខ្មែរ។', 'ជយវម៌្មទី៧គ្រងរាជពីឆ្នាំ ១១៨១ ដល់ប្រហែល ១២១៨។', 'អង្គរវត្តត្រូវបានឧទ្ទិសដល់ព្រះវិស្ណុដំបូង។', 'ឧទាហរណ៍៖ ប្រាសាទបាយ័នល្បីល្បាញដោយមុខញញឹម។'],
                ],
                'exercises' => $historyExercises,
            ],
            [
                'track' => $science,
                'slug' => 'english',
                'en' => 'English',
                'km' => 'ភាសាអង់គ្លេស',
                'color' => '#0ea5e9',
                'icon' => 'languages',
                'topics' => [
                    ['slug' => 'grammar', 'en' => 'Grammar and Usage', 'km' => 'វេយ្យាករណ៍ និងការប្រើប្រាស់'],
                    ['slug' => 'reading', 'en' => 'Reading and Writing', 'km' => 'ការអាន និងការសរសេរ'],
                ],
                'reference' => [
                    'en' => ['Present simple: subject + base verb; he/she/it takes -s.', 'Past simple: regular verbs add -ed; go becomes went.', 'Present continuous: am/is/are + verb-ing.', 'Example: She studies English every day.'],
                    'km' => ['Present simple៖ ប្រធាន + កិរិយាសព្ទដើម; he/she/it បន្ថែម -s។', 'Past simple៖ កិរិយាសព្ទទៀងទាត់បន្ថែម -ed; go ក្លាយជា went។', 'Present continuous៖ am/is/are + verb-ing។', 'ឧទាហរណ៍៖ She studies English every day។'],
                ],
                'exercises' => $englishExercises,
            ],
            [
                'track' => $science,
                'slug' => 'khmer-literature',
                'en' => 'Khmer Literature',
                'km' => 'អក្សរសាស្ត្រខ្មែរ',
                'color' => '#dc2626',
                'icon' => 'book-open',
                'topics' => [
                    ['slug' => 'khmer-texts', 'en' => 'Khmer Texts and Poetry', 'km' => 'អត្ថបទ និងកំណាព្យខ្មែរ'],
                    ['slug' => 'essay-writing', 'en' => 'Essay Writing', 'km' => 'ការសរសេរអត្ថបទ'],
                ],
                'reference' => [
                    'en' => ['Khmer literature includes poetry, folk tales, legends and novels.', 'ន័យធៀប is a comparison, often using "ដូច".', 'A good essay has an introduction, body and conclusion.', 'Example: describe a character using actions and words.'],
                    'km' => ['អក្សរសាស្ត្រខ្មែររួមមានកំណាព្យ រឿងនិទាន រឿងព្រេង និងប្រលោមលោក។', 'ន័យធៀបជាការប្រៀបធៀប ច្រើនតែប្រើពាក្យ "ដូច"។', 'អត្ថបទល្អមានសេចក្តីផ្តើម សេចក្តីសង្ខេប និងសេចក្តីសន្និដ្ឋាន។', 'ឧទាហរណ៍៖ ពណ៌នាតួអង្គតាមសកម្មភាព និងពាក្យសម្តី។'],
                ],
                'exercises' => $khmerLiteratureExercises,
            ],
            [
                'track' => $socialScience,
                'slug' => 'khmer-literature',
                'en' => 'Khmer Literature',
                'km' => 'អក្សរសាស្ត្រខ្មែរ',
                'color' => '#dc2626',
                'icon' => 'book-open',
                'topics' => [
                    ['slug' => 'khmer-texts', 'en' => 'Khmer Texts and Poetry', 'km' => 'អត្ថបទ និងកំណាព្យខ្មែរ'],
                    ['slug' => 'essay-writing', 'en' => 'Essay Writing', 'km' => 'ការសរសេរអត្ថបទ'],
                ],
                'reference' => [
                    'en' => ['Khmer literature preserves values, history and imagination.', 'Folk tales often teach moral lessons.', 'Key essay skills: thesis, supporting details and conclusion.', 'Example: explain a proverb with a real-life situation.'],
                    'km' => ['អក្សរសាស្ត្រខ្មែររក្សាតម្លៃ ប្រវត្តិសាស្ត្រ និងការស្រមៃ។', 'រឿងនិទានប្រជាប្រិយច្រើនបង្រៀនមេរៀនសីលធម៌។', 'ជំនាញសរសេរសំខាន់ៗ៖ គោលគំនិត ព័ត៌មានគាំទ្រ និងសេចក្តីសន្និដ្ឋាន។', 'ឧទាហរណ៍៖ ពន្យល់សុភាសិតដោយភ្ជាប់នឹងជីវិតពិត។'],
                ],
                'exercises' => $khmerLiteratureExercises,
            ],
            [
                'track' => $socialScience,
                'slug' => 'mathematics',
                'en' => 'Mathematics',
                'km' => 'គណិតវិទ្យា',
                'color' => '#2563eb',
                'icon' => 'sigma',
                'topics' => [
                    ['slug' => 'quadratics', 'en' => 'Quadratic Equations', 'km' => 'សមីការដឺក្រេទី២'],
                    ['slug' => 'functions', 'en' => 'Functions and Graphs', 'km' => 'អនុគមន៍ និងក្រាហ្វិក'],
                ],
                'reference' => [
                    'en' => ['Quadratic formula: $x = (-b +/- sqrt(b^2 - 4ac)) / (2a)$', 'Discriminant $D = b^2 - 4ac$ decides the number of roots.', 'Gradient of y = mx + c is m.', 'Example: x^2 - 5x + 6 = 0 gives x = 2 or x = 3.'],
                    'km' => ['រូបមន្តដឺក្រេទី២៖ $x = (-b +/- sqrt(b^2 - 4ac)) / (2a)$', 'ឌីស្គ្រីមីណង់ $D = b^2 - 4ac$ កំណត់ចំនួនឫស។', 'ជម្រាលនៃ y = mx + c គឺ m។', 'ឧទាហរណ៍៖ x^2 - 5x + 6 = 0 បាន x = 2 ឬ x = 3។'],
                ],
                'exercises' => $mathExercises,
            ],
            [
                'track' => $socialScience,
                'slug' => 'earth-science',
                'en' => 'Earth Science',
                'km' => 'ផែនដី',
                'color' => '#b45309',
                'icon' => 'globe',
                'topics' => [
                    ['slug' => 'earth-structure', 'en' => 'Structure of the Earth', 'km' => 'រចនាសម្ព័ន្ធផែនដី'],
                    ['slug' => 'weather', 'en' => 'Weather and Climate', 'km' => 'អាកាសធាតុ និងអាកាសធាតុយូរអង្វែង'],
                ],
                'reference' => [
                    'en' => ['Earth layers: crust, mantle, outer core and inner core.', 'Plate movement causes earthquakes, volcanoes and mountains.', 'Weather is short-term; climate is long-term.', 'Example: the Pacific Ring of Fire has many earthquakes.'],
                    'km' => ['ស្រទាប់ផែនដី៖ សំបក ម៉ាន់ទែល ស្នូលក្រៅ និងស្នូលក្នុង។', 'ចលនាបន្ទះថ្មបង្កឱ្យមានរញ្ជួយដី ភ្នំភ្លើង និងភ្នំ។', 'អាកាសធាតុជារយៈពេលខ្លី អាកាសធាតុយូរអង្វែងជារយៈពេលវែង។', 'ឧទាហរណ៍៖ រង្វង់ភ្លើងបacific មានរញ្ជួយដីច្រើន។'],
                ],
                'exercises' => [
                    $this->mcq('Which is the innermost layer of Earth?', 'តើស្រទាប់ណាជាស្រទាប់ក្នុងបំផុតរបស់ផែនដី?', [
                        ['en' => 'Crust', 'km' => 'សំបក', 'correct' => false],
                        ['en' => 'Mantle', 'km' => 'ម៉ាន់ទែល', 'correct' => false],
                        ['en' => 'Outer core', 'km' => 'ស្នូលក្រៅ', 'correct' => false],
                        ['en' => 'Inner core', 'km' => 'ស្នូលក្នុង', 'correct' => true],
                    ], 'The inner core is at the centre of the Earth.', 'ស្នូលក្នុងស្ថិតនៅចំណុចកណ្តាលនៃផែនដី។'),
                    $this->mcq('What is mainly caused by moving tectonic plates?', 'តើអ្វីបង្កឡើងដោយចលនាបន្ទះថ្ម?', [
                        ['en' => 'Earthquakes', 'km' => 'រញ្ជួយដី', 'correct' => true],
                        ['en' => 'Moon phases', 'km' => 'ដំណាក់ព្រះច័ន្ទ', 'correct' => false],
                        ['en' => 'Day and night', 'km' => 'ថ្ងៃ និងយប់', 'correct' => false],
                        ['en' => 'Seasons only', 'km' => 'តែរដូវកាល', 'correct' => false],
                    ], 'Plate boundaries are where earthquakes and volcanoes commonly occur.', 'ព្រំដែនបន្ទះថ្មជាកន្លែងដែលរញ្ជួយដី និងភ្នំភ្លើងកើតឡើងញឹកញាប់។', 'medium'),
                    $this->trueFalse('The crust is thinner than the mantle.', 'សំបកផែនដីស្តើងជាងម៉ាន់ទែល។', true, 'The crust is a thin outer shell compared with the thick mantle.', 'សំបកជាស្រទាប់ក្រៅស្តើង បើធៀបនឹងម៉ាន់ទែលក្រាស់។'),
                    $this->shortAnswer('What is the study of weather called?', 'តើការសិក្សាអំពីអាកាសធាតុហៅថាអ្វី?', 'meteorology', ['meteorology', 'ឧតុនិយម'], 'Meteorology studies weather and atmospheric processes.', 'ឧតុនិយមសិក្សាអំពីអាកាសធាតុ និងដំណើរការបរិយាកាស។', 'hard'),
                ],
            ],
            [
                'track' => $socialScience,
                'slug' => 'geography',
                'en' => 'Geography',
                'km' => 'ភូមិវិទ្យា',
                'color' => '#0d9488',
                'icon' => 'map',
                'topics' => [
                    ['slug' => 'physical-geography', 'en' => 'Physical Geography', 'km' => 'ភូមិវិទ្យារូបវ័ន្ត'],
                    ['slug' => 'cambodia-region', 'en' => 'Cambodia and the Region', 'km' => 'កម្ពុជា និងតំបន់'],
                ],
                'reference' => [
                    'en' => ['Latitude lines run east-west; longitude lines run north-south.', 'Cambodia borders Thailand, Laos and Vietnam.', 'The Mekong and Tonle Sap shape life in Cambodia.', 'Example: Phnom Penh lies near the Mekong River.'],
                    'km' => ['ខ្សែរយៈទទឹងរត់ពីកើតទៅលិច ខ្សែរយៈបណ្តោយរត់ពីជើងទៅត្បូង។', 'កម្ពុជាមានព្រំដែនជាប់ថៃ ឡាវ និងវៀតណាម។', 'ទន្លេមេគង្គ និងទន្លេសាប មានឥទ្ធិពលធំលើជីវិតកម្ពុជា។', 'ឧទាហរណ៍៖ ភ្នំពេញស្ថិតនៅជិតទន្លេមេគង្គ។'],
                ],
                'exercises' => [
                    $this->mcq('Which lines run east-west on a map?', 'តើខ្សែណារត់ពីកើតទៅលិចលើផែនទី?', [
                        ['en' => 'Latitude', 'km' => 'រយៈទទឹង', 'correct' => true],
                        ['en' => 'Longitude', 'km' => 'រយៈបណ្តោយ', 'correct' => false],
                        ['en' => 'Meridians', 'km' => 'មេរីដ្យង់', 'correct' => false],
                        ['en' => 'Contours', 'km' => 'ខ្សែសមកម្ពស់', 'correct' => false],
                    ], 'Lines of latitude circle the globe east-west.', 'ខ្សែរយៈទទឹងរត់ជារង្វង់ពីកើតទៅលិច។'),
                    $this->mcq('Which country does not border Cambodia?', 'តើប្រទេសណាមិនជាប់ព្រំដែនកម្ពុជា?', [
                        ['en' => 'Thailand', 'km' => 'ថៃ', 'correct' => false],
                        ['en' => 'Laos', 'km' => 'ឡាវ', 'correct' => false],
                        ['en' => 'Vietnam', 'km' => 'វៀតណាម', 'correct' => false],
                        ['en' => 'Myanmar', 'km' => 'ម្យានម៉ា', 'correct' => true],
                    ], 'Cambodia borders Thailand, Laos and Vietnam.', 'កម្ពុជាជាប់ព្រំដែនថៃ ឡាវ និងវៀតណាម។', 'medium'),
                    $this->trueFalse('Phnom Penh is near the Mekong River.', 'ភ្នំពេញស្ថិតនៅជិតទន្លេមេគង្គ។', true, 'The capital lies at the meeting area of the Mekong and Tonle Sap rivers.', 'រាជធានីស្ថិតនៅជិតជន្ទល់ទន្លេមេគង្គ និងទន្លេសាប។'),
                    $this->shortAnswer('What is the capital of Cambodia?', 'តើរាជធានីរបស់កម្ពុជាជាអ្វី?', 'phnom penh', ['phnom penh', 'ភ្នំពេញ'], 'Phnom Penh is the capital city.', 'ភ្នំពេញជារាជធានីរបស់កម្ពុជា។'),
                ],
            ],
            [
                'track' => $socialScience,
                'slug' => 'history',
                'en' => 'History',
                'km' => 'ប្រវត្តិវិទ្យា',
                'color' => '#ea580c',
                'icon' => 'landmark',
                'topics' => [
                    ['slug' => 'angkor', 'en' => 'Ancient Cambodia and Angkor', 'km' => 'កម្ពុជាបុរាណ និងអង្គរ'],
                    ['slug' => 'modern-cambodia', 'en' => 'Modern Cambodia', 'km' => 'កម្ពុជាសម័យថ្មី'],
                ],
                'reference' => [
                    'en' => ['The Khmer Empire reached its height between the 9th and 15th centuries.', 'Angkor Wat, Bayon and Ta Prohm are major Angkorian temples.', 'Jayavarman VII is known for public works and hospitals.', 'Example: Angkor was inscribed as a UNESCO World Heritage Site in 1992.'],
                    'km' => ['ចក្រភពខ្មែររុងរឿងរវាងសតវត្សទី៩ ដល់ទី១៥។', 'អង្គរវត្ត បាយ័ន និងតាព្រហ្ម ជាប្រាសាទសំខាន់ៗសម័យអង្គរ។', 'ជយវម៌្មទី៧ ល្បីល្បាញដោយការងារសាធារណៈ និងមន្ទីរពេទ្យ។', 'ឧទាហរណ៍៖ អង្គរត្រូវបានចុះបញ្ជីជាតំបន់បេតិកភណ្ឌពិភពលោក UNESCO ឆ្នាំ ១៩៩២។'],
                ],
                'exercises' => $historyExercises,
            ],
            [
                'track' => $socialScience,
                'slug' => 'english',
                'en' => 'English',
                'km' => 'ភាសាអង់គ្លេស',
                'color' => '#0ea5e9',
                'icon' => 'languages',
                'topics' => [
                    ['slug' => 'grammar', 'en' => 'Grammar and Usage', 'km' => 'វេយ្យាករណ៍ និងការប្រើប្រាស់'],
                    ['slug' => 'reading', 'en' => 'Reading and Writing', 'km' => 'ការអាន និងការសរសេរ'],
                ],
                'reference' => [
                    'en' => ['A sentence needs a subject and a verb.', 'Use capital letters for names and the first word of a sentence.', 'Past participles are used with have/has/had.', 'Example: She has studied English for three years.'],
                    'km' => ['ប្រយោគមួយត្រូវមានប្រធាន និងកិរិយាសព្ទ។', 'ប្រើអក្សរធំសម្រាប់ឈ្មោះ និងពាក្យដំបូងនៃប្រយោគ។', 'Past participle ប្រើជាមួយ have/has/had។', 'ឧទាហរណ៍៖ She has studied English for three years។'],
                ],
                'exercises' => $englishExercises,
            ],
            [
                'track' => $socialScience,
                'slug' => 'moral-education',
                'en' => 'Moral Education',
                'km' => 'សីលធម៌',
                'color' => '#db2777',
                'icon' => 'scale',
                'topics' => [
                    ['slug' => 'ethics', 'en' => 'Ethics and Values', 'km' => 'សីលធម៌ និងតម្លៃ'],
                    ['slug' => 'civic-life', 'en' => 'Civic Life and Responsibility', 'km' => 'ជីវិតពលរដ្ឋ និងទំនួលខុសត្រូវ'],
                ],
                'reference' => [
                    'en' => ['Respect, honesty, responsibility and kindness are key moral values.', 'Citizens have both rights and duties under the Constitution.', 'Good citizenship includes obeying laws and helping the community.', 'Example: returning lost property shows honesty.'],
                    'km' => ['ការគោរព ស្មោះត្រង់ ទំនួលខុសត្រូវ និងមេត្តា ជាតម្លៃសីលធម៌សំខាន់ៗ។', 'ពលរដ្ឋមានទាំងសិទ្ធិ និងទំនួលខុសត្រូវតាមរដ្ឋធម្មនុញ្ញ។', 'ពលរដ្ឋល្អគោរពច្បាប់ និងជួយសហគមន៍។', 'ឧទាហរណ៍៖ ការប្រគល់វត្ថុបាត់បង់ ជាការបង្ហាញពីភាពស្មោះត្រង់។'],
                ],
                'exercises' => [
                    $this->mcq('Returning a lost wallet is an example of:', 'ការប្រគល់កាបូបបាត់បង់ ជាឧទាហរណ៍នៃអ្វី?', [
                        ['en' => 'Honesty', 'km' => 'ភាពស្មោះត្រង់', 'correct' => true],
                        ['en' => 'Jealousy', 'km' => 'ច្រណែន', 'correct' => false],
                        ['en' => 'Laziness', 'km' => 'ខ្ជិល', 'correct' => false],
                        ['en' => 'Anger', 'km' => 'កំហឹង', 'correct' => false],
                    ], 'Honesty means telling the truth and doing what is right.', 'ភាពស្មោះត្រង់គឺនិយាយការពិត និងធ្វើអ្វីដែលត្រឹមត្រូវ។'),
                    $this->mcq('Where are the rights and duties of citizens written?', 'តើសិទ្ធិ និងទំនួលខុសត្រូវរបស់ពលរដ្ឋសរសេរនៅឯណា?', [
                        ['en' => 'The Constitution', 'km' => 'រដ្ឋធម្មនុញ្ញ', 'correct' => true],
                        ['en' => 'A story book', 'km' => 'សៀវភៅរឿង', 'correct' => false],
                        ['en' => 'A sports poster', 'km' => 'ប៉ូស្ទ័រកីឡា', 'correct' => false],
                        ['en' => 'A recipe', 'km' => 'រូបមន្តអាហារ', 'correct' => false],
                    ], 'The Constitution defines the basic rights and duties of citizens.', 'រដ្ឋធម្មនុញ្ញកំណត់សិទ្ធិ និងទំនួលខុសត្រូវមូលដ្ឋានរបស់ពលរដ្ឋ។', 'medium'),
                    $this->trueFalse('Respect includes listening to other people.', 'ការគោរពរួមមានការស្តាប់គំនិតអ្នកដទៃ។', true, 'Respect means valuing others and listening to their views.', 'ការគោរពមានន័យថាឱ្យតម្លៃអ្នកដទៃ និងស្តាប់គំនិតរបស់ពួកគេ។'),
                    $this->shortAnswer('Name one important moral value.', 'ចូររៀបរាប់តម្លៃសីលធម៌សំខាន់មួយ។', 'honesty', ['honesty', 'respect', 'responsibility', 'ស្មោះត្រង់', 'គោរព'], 'Honesty, respect and responsibility are all valid examples.', 'ភាពស្មោះត្រង់ ការគោរព និងទំនួលខុសត្រូវ សុទ្ធតែជាឧទាហរណ៍ត្រឹមត្រូវ។'),
                ],
            ],
        ];
    }

    /**
     * @param  array{en: string, km: string, correct: bool}  $option
     * @param  array<int, array{en: string, km: string, correct: bool}>  $options
     * @return array<string, mixed>
     */
    private function mcq(string $en, string $km, array $options, string $explanationEn, string $explanationKm, string $difficulty = 'easy', ?string $imagePath = null): array
    {
        return [
            'type' => 'mcq',
            'question_en' => $en,
            'question_km' => $km,
            'options' => $options,
            'explanation_en' => $explanationEn,
            'explanation_km' => $explanationKm,
            'difficulty' => $difficulty,
            'image_path' => $imagePath,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function trueFalse(string $en, string $km, bool $correct, string $explanationEn, string $explanationKm, string $difficulty = 'easy'): array
    {
        return [
            'type' => 'true_false',
            'question_en' => $en,
            'question_km' => $km,
            'options' => [
                ['en' => 'True', 'km' => 'ត្រឹមត្រូវ', 'correct' => $correct],
                ['en' => 'False', 'km' => 'មិនត្រឹមត្រូវ', 'correct' => ! $correct],
            ],
            'explanation_en' => $explanationEn,
            'explanation_km' => $explanationKm,
            'difficulty' => $difficulty,
            'image_path' => null,
        ];
    }

    /**
     * @param  array<int, string>  $acceptedAnswers
     * @return array<string, mixed>
     */
    private function shortAnswer(string $en, string $km, string $answer, array $acceptedAnswers, string $explanationEn, string $explanationKm, string $difficulty = 'medium'): array
    {
        return [
            'type' => 'short_answer',
            'question_en' => $en,
            'question_km' => $km,
            'correct_answer' => $answer,
            'accepted_answers' => $acceptedAnswers,
            'explanation_en' => $explanationEn,
            'explanation_km' => $explanationKm,
            'difficulty' => $difficulty,
            'image_path' => null,
        ];
    }

    /**
     * @param  array<int, string>  $acceptedAnswers
     * @return array<string, mixed>
     */
    private function numerical(string $en, string $km, string $answer, array $acceptedAnswers, string $explanationEn, string $explanationKm): array
    {
        return [
            'type' => 'numerical',
            'question_en' => $en,
            'question_km' => $km,
            'correct_answer' => $answer,
            'accepted_answers' => $acceptedAnswers,
            'explanation_en' => $explanationEn,
            'explanation_km' => $explanationKm,
            'difficulty' => 'medium',
            'image_path' => null,
        ];
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
            'explanation_km' => $definition['explanation_km'] ?? null,
            'explanation_en' => $definition['explanation_en'] ?? null,
            'correct_answer' => $definition['correct_answer'] ?? null,
            'accepted_answers' => $definition['accepted_answers'] ?? null,
            'image_path' => $definition['image_path'] ?? null,
            'points' => 1,
            'difficulty' => $definition['difficulty'] ?? 'medium',
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

    /**
     * @param  array<int, string>  $lines
     */
    private function referenceContent(string $title, array $lines): string
    {
        return '# '.$title."\n\n"
            .collect($lines)->map(fn (string $line): string => '- '.$line)->implode("\n")
            ."\n\n> Demo content only. Confirm official syllabus details with your teacher.\n";
    }

    private function lessonContent(string $subject, string $chapter): string
    {
        return "# {$chapter}\n\n"
            ."This short lesson introduces {$subject} ideas through simple explanations and exam-style practice.\n\n"
            ."### What you will do\n\n"
            ."- Read the key notes in the quick reference sheet.\n"
            ."- Answer the exercises without looking at the explanation.\n"
            ."- Review feedback and try again.\n\n"
            ."> Demo content only — not official exam material.\n";
    }

    private function lessonContentKm(string $subject, string $chapter): string
    {
        return "# {$chapter}\n\n"
            ."មេរៀនខ្លីនេះណែនាំគំនិតសំខាន់ៗនៃ{$subject} តាមរយៈការពន្យល់សាមញ្ញ និងលំហាត់បែបប្រឡង។\n\n"
            ."### អ្វីដែលអ្នកនឹងធ្វើ\n\n"
            ."- អានកំណត់សំខាន់ៗនៅក្នុងតារាងយោងរហ័ស។\n"
            ."- ឆ្លើយលំហាត់ដោយមិនមើលការពន្យល់។\n"
            ."- ពិនិត្យមតិត្រឡប់ ហើយព្យាយាមម្តងទៀត។\n\n"
            ."> ខ្លឹមសារសាកល្បងប៉ុណ្ណោះ — មិនមែនសម្ភារៈប្រឡងផ្លូវការទេ។\n";
    }

    private function materialContent(string $subjectEn, string $subjectKm): string
    {
        return "BAC II StudyHub — Revision Notes\n"
            ."================================\n\n"
            ."Subject: {$subjectEn} / {$subjectKm}\n\n"
            ."These notes are demonstration content only and are not official exam material.\n"
            ."Use your official Grade 12 textbook and your teacher's guidance for exam preparation.\n\n"
            ."Suggested revision routine:\n"
            ."1. Open the quick reference sheet for this subject.\n"
            ."2. Answer practice exercises by difficulty.\n"
            ."3. Review the explanation after each submission.\n"
            ."4. Check My Progress and retry weak areas.\n";
    }

    private function seedExerciseImage(): void
    {
        Storage::disk('public')->put('exercises/motion-graph.svg', <<<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="280" viewBox="0 0 520 280">
  <rect width="520" height="280" fill="#f8fafc"/>
  <line x1="70" y1="230" x2="490" y2="230" stroke="#334155" stroke-width="2"/>
  <line x1="70" y1="230" x2="70" y2="30" stroke="#334155" stroke-width="2"/>
  <text x="280" y="265" font-family="sans-serif" font-size="16" fill="#334155" text-anchor="middle">Time (s)</text>
  <text x="24" y="135" font-family="sans-serif" font-size="16" fill="#334155" text-anchor="middle" transform="rotate(-90 24 135)">Distance (m)</text>
  <line x1="70" y1="230" x2="430" y2="110" stroke="#1f6f5f" stroke-width="4"/>
  <circle cx="70" cy="230" r="5" fill="#1f6f5f"/>
  <circle cx="430" cy="110" r="5" fill="#1f6f5f"/>
  <text x="250" y="90" font-family="sans-serif" font-size="15" fill="#1f6f5f">60 m at 3 s</text>
</svg>
SVG);
    }
}
