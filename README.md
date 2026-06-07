# Sharaf Dent Lab Web Platform & Appwrite CMS

This is a premium, modern, responsive web application for **Sharaf Dent Lab**, a leading dental laboratory specializing in fixed prosthetics, zirconia, E.max, titanium restorations, All-on-X planning, and Photogrammetry.

The system features:
- A high-end, responsive public English website with beautiful entrance animations.
- Three native theme modes: **Light**, **Dark**, and **Night** (low-contrast black with amber glows) with an accessible theme switcher.
- A fully protected administrative CMS dashboard (`/admin`) to manage homepage sections, service catalogs, case gallery items, timeline steps, and incoming messages.
- An **offline-safe Local Mock Mode** fallback to allow instant browser-testing of all CRUD and forms without database credentials.
- Instant WhatsApp link launchers pre-filled with clinic case details.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 & custom HSL tokens
- **Animations**: Framer Motion
- **CMS Backend**: Appwrite Cloud (Auth, Database, and Storage)
- **Forms**: React Hook Form & Zod schemas

---

## 🚀 Setup & Execution Guide

Follow these steps to launch the platform locally:

### 1. Download Dependencies
Ensure you have [Node.js](https://nodejs.org/) installed, then run in the project root:
```bash
npm install
```

### 2. Run in Local Mock Mode (Zero-Setup Development)
The platform is designed with a **Dynamic Service Adapter**. If no environment variables are defined, the platform automatically switches to a local state-backed MockDB running in `localStorage`!
1. Start the Next.js development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser.
3. Browse landing sections, test filters, or submit a clinical contact form.
4. To enter the administrative CMS dashboard, go to [http://localhost:3000/admin](http://localhost:3000/admin) and log in with these pre-loaded credentials:
   - **Email**: `admin@sharafdent.com`
   - **Password**: `admin123`
5. You can now add/edit services, upload case graphics, update copywriting, toggle layouts, and manage messages. Everything works instantly in your browser!

---

## ☁️ Connecting to Appwrite Cloud (Live Mode)

Once you are ready to transition from Mock Mode to a live cloud database, follow these steps:

### 1. Create Appwrite Project
1. Log in to [Appwrite Cloud](https://cloud.appwrite.io/) or your local Docker dashboard.
2. Create a new project called **Sharaf Dent Lab** and record its **Project ID**.

### 2. Configure Environment Variables
Create a `.env.local` file in the root of your project directory and add the following parameters:
```env
# Public Client Variables
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-appwrite-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=main-db
NEXT_PUBLIC_APPWRITE_BUCKET_ID=website-media

# Server-Only Variables (Required strictly for seeding & admin actions)
APPWRITE_API_KEY=your-appwrite-api-key
```
> [!NOTE]
> To obtain `APPWRITE_API_KEY`, go to **Appwrite Settings > API Keys** in your console. Create a new key with full permissions on: `databases` (read/write), `collections` (read/write), `documents` (read/write), and `buckets` (read/write).

### 3. Run the Automated Seeding Script
Our automated seeding script automatically builds the entire database schema (creates the database, creates the 7 required collections, sets up all attributes/fields, modifies security permissions, seeds initial default copy, and initializes the storage bucket) in one click!
Run:
```bash
npx tsx src/scripts/seed.ts
```
*(Wait a few seconds for the Appwrite backend queue to build. Once complete, you will see a success message!)*

### 4. Setup Admin Credentials in Appwrite
1. Go to **Auth > Users** in your Appwrite Console.
2. Click **Create User** and add your administrative email and password (e.g. `admin@sharafdent.com`).
3. You can now use these live credentials to log into your cloud `/admin` CMS dashboard!

---

## 📂 Core Folder Architecture

- `app/` - Next.js App Router:
  - `(public)/` - Public landing routes (`/`, `/services`, `/cases`, `/contact`).
  - `admin/` - Administrative control room panels.
- `components/` - Visual React components:
  - `public/` - Landing pages sections (*Hero*, *About*, *Mission*, *WhyChooseUs*, *Services*, *Cases*, *Lightbox*, *Workflow*).
  - `admin/` - CMS control layout, dashboard stats widgets, login interfaces, and CRUD forms.
  - `shared/` - Dynamic `ImageUploader` dropzones, headings, loading spinners, and error alerts.
- `lib/` - Libraries & utilities:
  - `appwrite/` - Cloud SDK client/server, configuration models, and offline `MockDB` adapter.
  - `theme/` - Dynamic class-aware ThemeProvider context.
  - `validations/` - Zod schema constraints.
- `hooks/` - Custom context react hooks (`useAuth`).
- `scripts/` - Cloud database schema seed scripts.

---

## ⚡ Production Compilation

To compile a highly optimized production bundle:
```bash
npm run build
```
To run the production bundle locally:
```bash
npm start
```
