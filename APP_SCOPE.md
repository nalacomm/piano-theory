# Piano Theory Trainer — App Scope & State

## Objective

A mobile-first web app that teaches practical piano theory. The goal is to give players the vocabulary and pattern recognition to understand what they're playing — not just play by rote. It targets beginner-to-intermediate players who want to move beyond learning songs and start understanding music.

Live at: https://www.pianotheorytrainer.com

---

## Current Feature Set

### Authentication
- Google OAuth login via NextAuth v4
- Each user has their own account and progress saved to the cloud
- Works across devices — log in anywhere and pick up where you left off
- Admin account (eddieriley.tmo@gmail.com) has access to an Admin tab

### Train Tab (Core Learning)
17 structured lessons across 4 categories. Each lesson includes:
- Visual piano keyboard with highlighted notes
- Sheet music notation (SVG treble clef staff)
- Audio playback of the scale/chord
- Key facts about the concept
- Identification tips for practical use
- A quick-check question at the end

Lesson library:

| Category | Lessons |
|---|---|
| Fundamentals | The Major Scale, Intervals, The Number System |
| Modes | Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian (Natural Minor), Locrian |
| Scales | Minor Pentatonic, Blues Scale, Harmonic Minor |
| Chords | Triads, 7th Chords, Sus Chords |

Progress is saved per user to a Neon PostgreSQL database. A progress bar and completion percentage shows on the Train tab header.

### Modes Tab
Interactive explorer for all 7 modes. Select any root key and see the mode's notes highlighted on a piano keyboard, with sheet music and audio playback.

### Scales Tab
Interactive explorer for common scales (major, minor, pentatonic, blues, harmonic minor, etc.). Same interactive format as Modes.

### Chords Tab
Interactive chord builder. Select a root and chord type and see the voicing on piano + sheet music + audio.

### Circle of Fifths Tab
Visual circle of fifths reference. Shows key relationships, relative minors, and key signatures.

### Quiz Tab
Multiple choice questions testing theory knowledge. Wrong answers show the correct answer plus an explanation paragraph. Questions cover intervals, chord construction, scale degrees, and mode identification.

### Ask AI Tab
Natural language Q&A powered by the Anthropic API (Claude). Users can ask any piano theory question and get a conversational answer. All AI calls go through a server-side route — the API key is never exposed to the client.

### Admin Tab (admin only)
Visible only to the admin account. Shows:
- Summary stats: total users, total ratings, average star rating
- User list with email, last active date, lesson progress bar, and expandable lesson chip view
- Feedback list with star rating, email, date, and suggestion text. Comment-only submissions (no rating) are labeled "comment."

### Feedback System
- Floating chat button (bottom right) always accessible
- First-time users: prompted for a 1-5 star rating + optional suggestion
- Returning users (already rated): see a comment-only form — no stars shown again
- Auto-prompt: every 5th visit, if the user has never submitted a rating, the feedback sheet opens automatically after 1.5 seconds
- Once a rating is submitted, auto-prompting stops permanently (tracked in localStorage)
- All submissions stored in Neon and visible in the Admin tab

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Auth | NextAuth v4 + Google OAuth |
| Database | Neon PostgreSQL (serverless) |
| AI | Anthropic API (Claude) via server route |
| Hosting | Vercel (Hobby plan) |
| Audio | Web Audio API |
| Styling | Inline CSS with design tokens via CSS variables |

Mobile-first layout, max-width 520px centered. Dark theme.

---

## Current Constraints

- Vercel Hobby: ~100k serverless function calls/month before needing to upgrade
- Neon Free: 0.5 GB storage, 191 compute hours/month — fine for hundreds of active users
- No native app — web only, but works well on mobile Safari/Chrome
- No onboarding flow — users land directly in the Train tab after login
- No social or community features
- No structured progression or curriculum path — users pick any lesson in any order
- No spaced repetition or retention system
- Quiz questions are static (fixed pool, no randomization by topic or difficulty)

---

## What's Working Well (Based on Feedback So Far)

- 5.0 average rating (1 rating as of writing)
- Core lesson format (piano + sheet music + audio + facts + quick check) is solid
- Multi-user auth and cross-device progress sync works reliably
- Mobile layout is clean and functional

---

## Open Questions for Strategy

1. Curriculum vs. exploration — should there be a recommended learning path, or is the free-explore model correct for the target user?
2. Retention — what brings users back? Streaks, new content drops, challenges?
3. Content gaps — what theory topics are missing that users would find most valuable?
4. Quiz depth — expand the static question pool, add difficulty levels, or move to adaptive quizzing?
5. Community — is there value in a leaderboard, shared progress, or a social layer?
6. Monetization — if the app grows, what features belong behind a paywall vs. staying free?
7. Onboarding — should new users be guided through a starting lesson rather than dropped into a menu?
