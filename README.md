# Life OS Tracker

A personal "life operating system" web app for tracking habits and personal finances in one clean, fast interface. Built with React and Supabase, with per-user data isolation enforced by Postgres Row-Level Security.

## Key Features

- **Development module**: create habits, log daily values and notes, browse a monthly calendar, and view a 14-day consistency chart with per-habit sparklines.
- **Finance module**: manage jobs, log shifts (hours, hourly rate, tips), record expenses, and see a 6-month income vs. expenses chart.
- **Authentication**: email/password sign-up and login via Supabase Auth.
- **Internationalization**: English, Romanian, French, Spanish, German and Chinese, with instant switching.
- **Light/dark theme** with no page reload; preferences persist in `localStorage`.
- **Secure by default**: every table has forced RLS policies scoped to `auth.uid()`.

## Tech Stack

React 19, Vite, Tailwind CSS, Chart.js (react-chartjs-2), Supabase (PostgreSQL + Auth), oxlint.

## Project Structure

```
src/
  App.jsx              App shell, i18n dictionaries, theme, navigation
  pages/               Auth, Dashboard (habits), Money (finances)
  components/          BalanceChart
  lib/supabase.js      Supabase client (reads env vars)
supabase/migrations/   Schema, signup trigger and RLS policies
```

## Environment Variables

Copy `.env.example` to `.env`:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

Never commit `.env` or use the `service_role` key in the frontend.

## Local Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/20260703000000_life_os_schema_rls.sql` in the Supabase SQL editor.
3. Install and configure:
   ```bash
   npm install
   cp .env.example .env   # then fill in your values
   npm run dev
   ```
4. Other scripts: `npm run build`, `npm run preview`, `npm run lint`.
