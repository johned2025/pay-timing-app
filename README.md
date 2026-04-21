# Pay Timing App

A simple, reliable shift tracking app for hourly-paid workers. Log your shifts, set your hourly rate, and generate custom pay reports in seconds.

**Live app → [pay-timing-app.vercel.app](https://pay-timing-app.vercel.app)**

---

## The Problem

Hourly workers often track their hours in notes apps, spreadsheets, or paper — then do the math manually at the end of the pay period. It's tedious, error-prone, and doesn't give you any flexibility around which shifts to include in a report.

Pay Timing App solves this with a focused, no-friction tool built for one job: know exactly what you've earned.

---

## Features

- **Log shifts** — record start time, end time, and date for each shift
- **Set your hourly rate** — the app calculates your pay automatically
- **Custom reports** — select any combination of shifts to generate a report for that period
- **Running totals** — see hours worked and earnings at a glance
- **Persistent data** — your shifts are saved between sessions

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | Supabase |
| Styling | Tailwind CSS v4 |
| Deployment | Vercel |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/johned2025/pay-timing-app.git
cd pay-timing-app

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Setup

This app uses Supabase for data persistence. To run it locally you'll need your own Supabase project.

Create a `.env.local` file in the root with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can get these from your [Supabase project dashboard](https://supabase.com) under Project Settings → API.

---



Active development. Version 1 is live and in use by real users.

Planned improvements:
- [ ] Landing page
- [ ] Export reports as PDF or CSV
- [ ] Multiple hourly rate support (for workers with different clients)
- [ ] Supervisor / worker synchronized roles — supervisors can view and validate their team's reported shifts
- [ ] Mobile-optimized install (PWA)

---

## Author

**John Solarte** — Junior Full-Stack Developer based in Kelowna, BC  
[github.com/johned2025](https://github.com/johned2025) · [Portfolio](https://john-solarte-portfolio.netlify.app/) · [LinkedIn](https://www.linkedin.com/in/john-solarte/)
