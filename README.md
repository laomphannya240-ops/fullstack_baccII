# BAC II StudyHub

A full-stack **BAC II StudyHub** web application for Cambodian Grade 12 students (Science and Social Science tracks). Built as a single Laravel project with a React + Tailwind + Vite frontend served via Laravel Vite integration.

## Stack

- **Backend:** Laravel 13 (PHP ^8.3), Sanctum (bearer tokens), REST API under `/api/v1`
- **Frontend:** React 19, React Router, Axios, Tailwind CSS 4, Lucide React, Recharts, KaTeX
- **Build:** Vite (`resources/js/app.jsx`)
- **Database:** MySQL/MariaDB (default in `.env.example` shows MySQL; local dev may use the values below)

## Features (high level)

- Roles: **Student** and **Admin** (role middleware/policies; students cannot access admin APIs/actions or other students’ data)
- Auth (Sanctum): register, login, logout, profile, password change, track selection, forgot/reset password
- Public catalog: tracks, subjects, materials, announcements (some content may still require auth depending on route usage)
- Students: subjects/chapters/lessons, exercises (with server-side grading), quizzes, mock exams, attempts/results, progress dashboard/history, bookmarks
- Admin: dashboard and CRUD for tracks, subjects, chapters, lessons, exercises, quizzes, mock exams, materials, announcements, students, and progress views
- Bilingual UI copy is supported in the data model; frontend locale/theme contexts included
- **Demo content is clearly labelled demo** in seeders and should not be presented as official exam content

## Demo credentials (seeded)

After running migrations and seeders:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bacii.test` | `password` |
| Student | `student@bacii.test` | `password` |

> Change these credentials in production. Demo data is for local development/testing only.

## Requirements

- **PHP** ^8.3 with extensions commonly required by Laravel (OpenSSL, PDO, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath, Fileinfo, etc.)
- **Composer**
- **Node.js** and **npm** (LTS recommended)
- **MySQL** or **MariaDB** (XAMPP/MariaDB works)

### Windows (XAMPP) + VS Code

1. Install **XAMPP** and ensure **Apache** (optional) and **MySQL/MariaDB** are available. Start **MySQL** from the XAMPP Control Panel.
2. Install **PHP 8.3+** matching your Laravel setup (XAMPP’s PHP version may differ; you can use the PHP bundled with your environment or install separately and configure `PATH`). Verify: `php -v`
3. Install **Composer** and verify: `composer -V`
4. Install **Node.js** (includes npm) and verify: `node -v`, `npm -v`
5. Open the project folder in **VS Code**: `File → Open Folder…` → select the repository root (this folder).

> **Note:** This project uses a Vite dev proxy for `/api` and `/storage` to `VITE_BACKEND_URL` (default `http://127.0.0.1:8000`). Run the Laravel dev server on that host/port when using `npm run dev`.

## Environment setup

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell you can use:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Edit `.env` and set database values. Example for **XAMPP/MariaDB** (adjust to your setup):

   ```env
   APP_NAME="BAC II StudyHub"
   APP_ENV=local
   APP_DEBUG=true
   APP_URL=http://127.0.0.1:8000

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=bac_ii_studyhub
   DB_USERNAME=root
   DB_PASSWORD=
   ```

   This repository was previously tested locally with a non-default MySQL port (e.g. `3309`) and `DB_PASSWORD=` (empty). Use the values that match your MySQL instance.

3. Create the database (e.g. via **phpMyAdmin** at `http://localhost/phpmyadmin` or MySQL CLI):

   ```sql
   CREATE DATABASE bac_ii_studyhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. Generate the application key:

   ```bash
   php artisan key:generate
   ```

## Install dependencies

From the project root:

```bash
composer install
npm install
```

## Database: migrate and seed

Run migrations and seed demo data:

```bash
php artisan migrate
php artisan db:seed
```

Or refresh everything (drops all tables, migrates, seeds):

```bash
php artisan migrate:fresh --seed
```

## Storage (public files)

Create the symbolic link so uploaded/public files in `storage/app/public` are available at `public/storage`:

```bash
php artisan storage:link
```

## Run the application

### Option A: Laravel + Vite together (recommended for development)

Use the combined dev script (if configured in your environment) or run both in separate terminals.

**Terminal 1 — Laravel server:**

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

**Terminal 2 — Vite dev server:**

```bash
npm run dev
```

Then open: **http://127.0.0.1:8000**

### Option B: Production-style build

```bash
npm run build
php artisan serve --host=127.0.0.1 --port=8000
```

## Useful commands

| Task | Command |
|------|---------|
| Install PHP deps | `composer install` |
| Install JS deps | `npm install` |
| Run dev servers (separately) | `php artisan serve` + `npm run dev` |
| Build frontend | `npm run build` |
| Migrate | `php artisan migrate` |
| Seed demo data | `php artisan db:seed` |
| Fresh migrate + seed | `php artisan migrate:fresh --seed` |
| Create storage link | `php artisan storage:link` |
| Clear config cache (if needed) | `php artisan config:clear` |
| Run tests | `php artisan test --compact` |
| Format PHP (Laravel Pint) | `vendor/bin/pint --format agent` |

## Testing

```bash
php artisan test --compact
```

Feature tests use SQLite in-memory by default (see `phpunit.xml`).

## API notes

- Base URL (local): `http://127.0.0.1:8000/api/v1`
- Authenticated requests use `Authorization: Bearer <token>` (Sanctum personal access tokens).
- JSON responses follow the application’s `{ success, message?, data, meta? }` style where applicable.

## Project layout (quick reference)

- `app/` — Laravel backend (controllers, models, services, resources)
- `routes/api.php` — API route definitions
- `database/migrations`, `database/seeders` — schema and demo data
- `resources/js` — React application
- `resources/views` — Blade entry (Vite)

## Troubleshooting

- **`npm run build` says Vite manifest file missing** after changing frontend assets: run `npm run build` again, or run `npm run dev` while developing.
- **403 “inactive account”**: ensure the user record is active (`is_active = true`).
- **Storage images/files not loading**: run `php artisan storage:link` and confirm `FILESYSTEM_DISK` / public disk settings.
- **MySQL connection errors**: verify `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in `.env`, and that MySQL is running.

## License

This project is open-sourced under the [MIT license](https://opensource.org/licenses/MIT) unless stated otherwise.
