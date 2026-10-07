# CTF Inatel cas@viva

[![Live demo](https://img.shields.io/badge/demo-live-E87000)](https://ctfcasaviva-theta.vercel.app/)
![React 19](https://img.shields.io/badge/React-19-004898?logo=react&logoColor=white)
![Tailwind CSS 3](https://img.shields.io/badge/Tailwind_CSS-3-004898?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/backend-Supabase-3ECF8E?logo=supabase&logoColor=white)
![Deployed on Vercel](https://img.shields.io/badge/deployed_on-Vercel-000000?logo=vercel&logoColor=white)

An educational Capture The Flag (CTF) built for the students of **Inatel cas@viva**. Players join *Operação cas@viva*, a digital investigation in five stages, each one teaching a security or reasoning skill. Every player gets one official, server-validated attempt, scored on accuracy and speed, with a live ranking and a printable certificate.

**[Play it live →](https://ctfcasaviva-theta.vercel.app/)**

> The game interface is written in Brazilian Portuguese, the language of its audience. Code, comments, documentation and commit messages are in English.

## Table of contents

- [The mission](#the-mission)
- [Features](#features)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Progression](#progression)
- [How answers are validated](#how-answers-are-validated)
- [Scoring and time](#scoring-and-time)
- [Backend](#backend)
- [Ranking](#ranking)
- [Admin area](#admin-area)
- [Adding a challenge](#adding-a-challenge)
- [Deployment](#deployment)
- [Tech stack](#tech-stack)
- [Author](#author)

## The mission

```text
                 Origem
                   │
     ┌─────────────┼──────────────┐
     ▼             ▼              ▼
  Galeria      Sequência    Interceptação     ← any order
     └─────────────┼──────────────┘
                   ▼
                O Cofre
                   │
                   ▼
              Certificate
```

| # | Challenge | Skill | What the player learns |
|---|-----------|-------|------------------------|
| 00 | Origem (Origin) | Careful reading | A black bar hides data, it does not erase it |
| 01 | Galeria (Gallery) | Visual analysis | Steganography: information hidden inside images |
| 02 | Sequência (Sequence) | Pattern recognition | Finding the rule behind apparently random data |
| 03 | Interceptação (Interception) | Substitution cipher | Breaking a Caesar cipher |
| Final | O Cofre (The Vault) | Telling signal from noise | An investigation room with three documents: picking the one that matters, decoding binary to text and connecting the clues to open a 4-digit vault |

## Features

**Gameplay**

- Origem is required first; it unlocks the three investigations at once, which can be played in any order. The Vault opens when all three are solved.
- A mission map that shows every stage as completed, unlocked or locked, and why the Vault is still closed.
- One official attempt per player, saved on the server from the first second: it survives reloads, closed browsers and a change of device, and cannot be replayed once completed.
- Players identify themselves with full name and class (A1–A4, B1–B4). Names are always shown in capital letters.
- One optional hint per challenge, which guides without giving the answer away.
- Scoring that rewards accuracy and speed, with a mission clock that only runs inside the stages.
- A live Top 20 ranking of everyone who started, finished or not.
- Contextual feedback for near misses, such as submitting the key instead of the message.
- Printable completion certificate with score, time, errors and hints.
- A "Sair" (leave) button that forgets the player on that browser; the attempt stays on the server and resumes when the player identifies again.

**Tools**

- Image viewer that opens each piece of evidence at a fixed size. It has no zoom, by design.
- Case files that open as documents in the final stage.
- Numeric keypad for the vault combination, also usable from the keyboard.

**Quality**

- Accessible: keyboard navigation, visible focus, live regions, labels and alt text, and support for `prefers-reduced-motion`.
- Mobile-first layout, tested from 320 px to 1920 px.
- Unit tests, integration tests for every progression scenario and a test that plays the whole mission from start to finish against an in-memory copy of the backend.

## Getting started

Requires [Node.js](https://nodejs.org/) (current LTS recommended) and npm.

```bash
git clone https://github.com/tiagoosm/ctfcasaviva.git
cd ctfcasaviva
npm install
npm start
```

The development server runs at <http://localhost:3000>. It uses the project's Supabase backend by default; see [Backend](#backend) to point it at your own.

## Available scripts

| Command | Description |
|---------|-------------|
| `npm start` | Starts the development server (`npm run dev` is an alias). |
| `npm test` | Runs the tests in watch mode. |
| `npm run test:ci` | Runs the full test suite once, including the end-to-end playthrough. |
| `npm run build` | Creates the production build in `build/`. |
| `npm run hash-flag -- <challenge-id> <answer>` | Prints the salted hash of an answer for a challenge config. |

## Project structure

```
src/
├── challenges/          # one folder per challenge: config (index.js) + Stage component
│   ├── vault/           # investigation room: vault keypad and case files
│   └── index.js         # challenge registry and unlock tiers
├── components/
│   ├── challenge/       # ProgressTrack, MissionTimer, ChallengeHeader, FlagForm, HintPanel, SuccessPanel
│   ├── layout/          # AppLayout, Header, Footer, BrandMark
│   ├── ui/              # Button, Modal, ConfirmDialog, Select, FeedbackMessage…
│   └── ImageViewer.js
├── admin/               # admin area (lazy-loaded): login, players, stages
├── api/                 # backend client, plus an in-memory fake used by the tests (__mocks__)
├── game/                # reducer, selectors, scoring, names, classes, persistence, provider
├── hooks/
├── pages/               # Landing, Mission map, Challenge, Completion, Ranking, 404
├── styles/              # Tailwind base layer and global styles
└── utils/               # sha256, answer normalization/validation, formatting
scripts/
└── hash-flag.mjs        # answer hash generator
supabase/
└── migrations/          # database schema and server-side functions, in order
```

Design tokens (cas@viva orange `#E87000`, blue `#004898`, surfaces, fonts and animations) live in [`tailwind.config.js`](tailwind.config.js).

## Progression

Challenges are grouped in tiers, defined in [`src/challenges/index.js`](src/challenges/index.js) and mirrored by the `tier` column of `ctf_challenges` on the server:

| Tier | Challenges | Unlocks when |
|------|------------|--------------|
| 1 | Origem | The attempt starts |
| 2 | Galeria, Sequência, Interceptação | Origem is solved |
| 3 | O Cofre | All of tier 2 is solved |

A challenge opens once every challenge of an earlier tier is solved; inside a tier the order is up to the player. The status of each stage (`solved`, `available`, `locked`) is derived from the saved progress of each challenge, so there is no "current stage" to keep in sync.

The rule is enforced in two places. The interface sends a player who opens a locked stage by URL back to the map with the reason. The server refuses entering, asking for the hint or answering a locked challenge, so the rule holds even when the API is called directly.

A solved stage can be opened again to review it, but it cannot be answered again: its score is recorded once.

## How answers are validated

The server has the final word on every answer: [`ctf_submit`](supabase/migrations) compares it with its own hash, and only then records the stage as solved.

1. The player types the answer. It is normalized so that case, accents and spaces are ignored.
2. The normalized answer is hashed with SHA-256, using the challenge id as salt, so the same word produces different hashes in different challenges.
3. The server compares the hash with the one stored in `ctf_challenges`.

The challenge configs also carry these hashes, plus hashes of near-miss answers. The browser uses them only to pick a helpful message ("you are close"), never to accept an answer.

The Vault ships no hash at all: a 4-digit combination has only 10,000 possibilities, so it is checked by the server alone, which also locks the stage after each wrong combination (3 s, then 15 s from the fifth error and 60 s from the tenth). Its hash and plain-text answer are set directly in the database, not in the migrations.

Solutions exist in readable form only in the test files, which are not part of the production bundle. SHA-256 is implemented in [`src/utils/sha256.js`](src/utils/sha256.js) rather than through Web Crypto, because `crypto.subtle` is only available in secure contexts and the game also needs to run over a local network.

## Scoring and time

The mission is worth 1000 points: 100 for Origem, 200 each for the Gallery, Sequence and Interception, and 300 for the Vault. For each challenge:

| Component | Rule |
|-----------|------|
| Base | 70% of the challenge, earned by solving it |
| Speed bonus | Up to 30%, based on the time spent in that challenge. Full up to the challenge's fast time, then decaying linearly to zero at its slow time |
| Wrong answers | −10 each, charged for at most five |
| Hint | −25 |
| Floor | A challenge never scores below zero |

A challenge's score is computed by the server when it is solved. The order in which the investigations are played does not change anything.

Time only counts while the player is inside a challenge. Each challenge has its own clock, kept by the server, which runs while its page is open and pauses when the player goes to the map, the ranking or anywhere else. A heartbeat every 30 seconds keeps it running; a clock that stops hearing from the browser is closed at the last heartbeat, so a closed tab does not keep counting. That active time alone decides the challenge's speed bonus.

The mission clock, pinned to the top right corner of the challenge pages, is the sum of the challenge clocks. It is hidden outside the challenges, where it is paused anyway, and stops for good when the last challenge is solved. The total time is shown on the certificate and breaks ties in the ranking.

The formula lives in [`src/game/scoring.js`](src/game/scoring.js) and is mirrored by `ctf_score` on the server.

## Backend

The backend is [Supabase](https://supabase.com/) (Postgres). The schema and all server logic are in [`supabase/migrations`](supabase/migrations), applied in order.

The browser cannot read or write the tables: row level security is enabled with no policies. It can only call a few database functions, and the server is the one that checks each answer, measures time with its own clock, counts errors and computes the score. A client therefore cannot submit a score, a time or an error count.

| Function | Purpose |
|----------|---------|
| `ctf_start` | Creates the player's attempt, or returns the one that already exists |
| `ctf_state` | Returns the current state of an attempt |
| `ctf_enter` | Starts or resumes the clock of a challenge; also the heartbeat |
| `ctf_leave` | Pauses the clock of a challenge |
| `ctf_hint` | Records that the hint was used |
| `ctf_submit` | Validates an answer; on success stores time and score, and freezes the result on the last one |
| `ctf_ranking` | Returns the Top 20 described in [Ranking](#ranking) |

Every call that touches a challenge goes through the same check of the [progression](#progression) rules.

### One player, one attempt

A player is identified by full name and class. Names are stored and shown in capital letters, and the server compares a normalized form of them (case, accents and extra spaces are ignored), so `João da Silva`, `joao da silva` and `JOÃO  DA  SILVA` are the same player. A unique index on that key guarantees a single attempt per player, even under parallel requests.

- The attempt is created when the player starts, and every relevant action updates it right away: entering a stage, a wrong answer, the hint, a solved stage.
- Coming back with the same name and class resumes it exactly where it was left, from any browser or device. What the browser keeps in `localStorage` is only a cache, rebuilt from the server when the app opens.
- When the last challenge is solved the attempt becomes `completed` and its score, time, errors and hints are frozen. A completed attempt cannot be entered, answered or started again.
- Requests are idempotent: starting twice returns the same attempt, a retried wrong answer is charged once, the hint is a flag, and a solved challenge stays solved.
- Only an administrator can reset an attempt, which lets that player start over.

Because identity is just name and class, anyone who types another player's name and class picks up that player's attempt. That is a deliberate trade-off to avoid accounts and passwords for students.

The backend is required to play: nothing starts and no answer is accepted unless the server confirms it.

Known limit: the challenge content ships with the site, so someone who was told the answers can finish quickly. The server bounds every score to what the rules allow, but it cannot tell a fast solver from an informed one.

To point the app at another Supabase project, apply the migrations there, set the Vault's answer in `ctf_challenges`, and set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_KEY` (the publishable key) at build time.

## Ranking

The public ranking shows the Top 20 among **everyone who started**, completed or still playing, and refreshes every 30 seconds.

- Players in progress are ranked by the points earned so far; completed players by their frozen official score.
- Ties are broken by the shortest total time, then by name.
- Each row shows a discreet "Em andamento" (in progress) or "Concluído" (completed) status, and the current player's row is highlighted.
- Attempts hidden by an administrator are left out.

The certificate is about completing the CTF, so it shows no ranking position.

## Admin area

The admin area lives at `/admin`. It is not linked from the player interface and is loaded as a separate bundle only when that route is opened.

- **Players:** every attempt, in progress or completed, with the stage the player was in last, score, time, errors, hints and start/finish times; search by name, filter by class and status; per-player history by stage; edit name and class; hide a result from the public ranking; reset an attempt (with confirmation) so the player can start again.
- **Stages:** preview any stage without playing, with its answer, hint, scoring and configuration, and a tester that checks an answer the same way the game does.

Access is enforced by the server, not by hiding the route. Administrators sign in with Supabase Auth (email and password), and every `ctf_admin_*` database function checks that the caller's confirmed email is listed in the `ctf_admins` table. Players never sign in, and name and class are identification only. Plain-text answers are stored in the database and returned only to administrators.

To set up an administrator:

1. Add the email to `ctf_admins` (SQL editor: `insert into ctf_admins (email) values ('you@example.com');`).
2. In the Supabase dashboard, open Authentication → Users → Add user, create the user with that email and a password, and mark it as confirmed.
3. Recommended: disable new sign-ups under Authentication → Sign In / Providers, since players do not need accounts.

## Adding a challenge

1. Create `src/challenges/<name>/index.js` with the config (`id`, `slug`, `code`, `title`, `points`, `fastSeconds`, `slowSeconds`, `objective`, `answerMode`, `hint`, `success`, `Stage`) and a `Stage` component.
2. Generate the answer hash and paste it into `answerHash`. Use the same command for `nearMisses[].hashes`.

   ```bash
   npm run hash-flag -- <challenge-id> <answer>
   ```

3. Add the challenge to the array in [`src/challenges/index.js`](src/challenges/index.js) and give it a tier in `TIERS`. Routing, the mission map, the progress track and scoring adapt automatically.
4. Add a row for it to the `ctf_challenges` table with the same id, display order, tier, points, time window and hash, plus the plain-text `answer` for the admin area, so the server can check and score it.

## Deployment

The app is a static single-page application hosted on [Vercel](https://vercel.com/), deployed automatically from `main`. [`vercel.json`](vercel.json) rewrites every route to `index.html` so client-side routing works on direct access and reload. Any static host with an equivalent rewrite rule can serve the contents of `build/`.

## Tech stack

- [React 19](https://react.dev/) with [React Router 7](https://reactrouter.com/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Create React App](https://create-react-app.dev/) (build tooling) with Jest and Testing Library
- [Supabase](https://supabase.com/) (Postgres database, server-side functions and admin authentication)
- [Vercel](https://vercel.com/) (hosting)

## Author

Developed by [Tiago Machado](https://github.com/tiagoosm) for Inatel cas@viva.

This project is intended for educational purposes.
