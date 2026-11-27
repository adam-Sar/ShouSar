# ShouSar | شو صار

A full-stack Lebanese news and open community publishing platform built with **Nuxt 3**, **Nitro**, and **Prisma**, wrapped in a crystal glassmorphism UI over a fixed Beirut & Mount Lebanon backdrop.

## Stack

- **Frontend / SSR**: Nuxt 3, Vue 3 (`<script setup>`), TypeScript, Arabic RTL (`Cairo` & `Noto Serif`)
- **Backend API**: Nitro server routes (`server/api/**`)
- **Database**: Prisma ORM (`prisma/schema.prisma`) connected to PostgreSQL (Neon)
- **Auth**: Cookie-based JWT sessions (`jose` + `bcryptjs`)

## Getting Started

1. Install dependencies, add your Neon PostgreSQL `DATABASE_URL` and `SESSION_SECRET` to `.env`, and push the schema:

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npx prisma db seed
```

2. Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo Accounts

- **Chief Editor / Admin**: `admin@shousar.lb` / `ShouSarAdmin2026!`
- **Writer (Dr. Fouad Karam)**: `fouad@shousar.lb` / `ShouSarWriter2026!`

Anyone can also register a new account at `/register` and immediately publish articles, upload cover images, and comment on stories.

## Pages

- `/` — Homepage (breaking ticker, featured lead story, connected live timeline, category cards)
- `/articles/[slug]` — Full article reader with progress bar, font scaler, pull quotes, and comments
- `/category/[slug]` — Category hub (`lebanon`, `economy`, `arab-world`, `investigations`, `culture`, `sports`)
- `/live` — Live coverage timeline & breaking flash publisher (for editors/admins)
- `/search` — Search & tag filtering
- `/author/[username]` — Writer profile & published archive
- `/login`, `/register` — Auth screens
- `/studio`, `/studio/editor` — Writer dashboard, cover upload, article composer, and editor moderation
