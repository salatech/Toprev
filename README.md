# TopRev

**TopRev** is an advanced AI code review platform that provides "brutal, honest" technical analysis by simulating top-tier engineering personas. It goes beyond simple linting to offer architectural feedback, security audits, and scalability checks with a premium, gamified experience.

![TopRev UI](public/og-image.png)

## Features

### AI Code Roasting

Get unfiltered feedback from 4 distinct personas:

- **The Principal**: Brutal, high-standards, performance-obsessed.
- **The VC Founder**: Focused on "investability", buzzwords, and scale.
- **The Paranoiac**: Audits for security holes (XSS, Injection, PII).
- **The Clean Coder**: Obsessive about DRY, SOLID, and naming conventions.

### PR Narrator

Turn raw code diffs into professional Pull Request descriptions instantly.

- **Auto-Summarization**: Generates executive summaries of changes.
- **Impact Analysis**: Identifies potential risks and breaking changes.
- **Testing Steps**: Suggests verification steps for QA.

### GitHub Integration

- **Paste & Roast**: Paste a GitHub PR URL (e.g., `https://github.com/owner/repo/pull/123`) to analyze the entire diff automatically.
- **Diff Parsing**: Automatically fetches and parses file patches via GitHub API.

### Cloud History & Sync

- **Firebase Sync**: Login with Google to sync your roast history across devices.
- **Guest Fallback**: Guest history is stored locally (LS).
- **Usage Limits**: Guests get 2 free roasts before being prompted to sign in.

### Social Sharing

- **Branded Cards**: Generate high-resolution (3x pixel ratio) images of your roast.
- **Virality**: One-click sharing to Twitter/X with "Beat my Score" challenges.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Motion (Framer Motion)
- **AI**: Google Gemini Pro (via Vercel AI SDK)
- **Database**: Firebase Firestore (NoSQL)
- **Auth**: Firebase Auth (Google Provider)
- **GitHub API**: Octokit
- **Image Gen**: html-to-image

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase Project
- Google Gemini API Key

### Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/salatech/Toprev.git
   cd Toprev
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` 


4. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## Security

- **Rate Limiting**: 10 requests/minute per IP.
- **Input Validation**: Strict Zod schemas for all API inputs (max 50k chars).
- **Auth Rules**: Firestore security rules ensure users can only access their own history.
- **Guest Limits**: Strict 2-request limit for unauthenticated users tracked client-side.

---

## Contributing

This project is currently closed source / private.

## License

Copyright © 2026 Solahudeen Babatunde Abdulrahmon. All rights reserved.
