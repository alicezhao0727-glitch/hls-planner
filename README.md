# HLS 2L Schedule Planner

A React app for planning your Harvard Law School 2L course schedule.

## Features
- Fall / Winter / Spring scheduling with conflict detection
- TAW 4hr/week overlap rule enforced live
- Peer course evaluations with direct quotes
- Clinic selector (Consumer Protection, Cyberlaw, Employment, Federal Courts, Mediation)
- Course suggestions based on interests (litigation, gender, IP, rule of law)
- Persistent notes per course (saved to localStorage)
- Credit bar tracking (10–16cr per term, 24–35cr annual)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → Import repo
3. Default settings work — click Deploy

## Deploy to Netlify

Drag-and-drop the whole folder to netlify.com/drop after running:
```bash
npm run build
```
Then drop the `dist/` folder.

## Notes
- Course times are from the 2026-27 HLS catalog (confirmed where available)
- Admin Law / Block: confirmed 3cr, T,W 3:45–5:15pm
- TBD-timed courses will be updated in HELIOS after April 2026
- Notes are saved to your browser's localStorage — they persist across sessions

## Modify
Edit `src/App.jsx`. The entire app is one file.
