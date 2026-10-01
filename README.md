# CTF Inatel cas@viva

[![Live demo](https://img.shields.io/badge/demo-live-E87000)](https://ctfcasaviva-theta.vercel.app/)
![React 19](https://img.shields.io/badge/React-19-004898?logo=react&logoColor=white)
![Tailwind CSS 3](https://img.shields.io/badge/Tailwind_CSS-3-004898?logo=tailwindcss&logoColor=white)
![Deployed on Vercel](https://img.shields.io/badge/deployed_on-Vercel-000000?logo=vercel&logoColor=white)

An educational Capture The Flag (CTF) built for the students of **Inatel cas@viva**. Players join *Operação cas@viva*, a five-stage digital investigation in which each stage teaches one security skill and leaves a clue for the next.

**[Play it live →](https://ctfcasaviva-theta.vercel.app/)**

> The game interface is written in Brazilian Portuguese, the language of its audience. Code, comments, documentation and commit messages are in English.

## Table of contents

- [The mission](#the-mission)
- [Features](#features)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [How answers are validated](#how-answers-are-validated)
- [Scoring](#scoring)
- [Ranking backend](#ranking-backend)
- [Admin area](#admin-area)
- [Adding a challenge](#adding-a-challenge)
- [Deployment](#deployment)
- [Tech stack](#tech-stack)
- [Author](#author)

## The mission

| # | Challenge | Skill | What the player learns |
|---|-----------|-------|------------------------|
| 00 | Briefing | Careful reading | A black bar hides data, it does not erase it |
| 01 | Galeria (Gallery) | Visual analysis | Steganography: information hidden inside images |
| 02 | Sequência (Sequence) | Pattern recognition | Finding the rule behind apparently random data |
| 03 | Interceptação (Interception) | Substitution cipher | Breaking a Caesar cipher |
| Final | O Cofre (The Vault) | Vigenère cipher | Combining a key found earlier with a multi-shift cipher |

## Features

**Gameplay**

- Progressive unlocking: stages cannot be skipped through the URL.
- Progress is saved in `localStorage` and survives reloads; corrupted or outdated data is discarded safely.
- Name and class are required before the mission starts.
- One optional hint per challenge, which guides without giving the answer away.
- Scoring that rewards speed and accuracy, with a stopwatch per challenge.
- A shared Top 20 ranking, computed by the server.
- Contextual feedback for near misses, such as submitting the key instead of the message.
- Printable completion certificate.

**Tools**

- Image viewer that opens each piece of evidence at a fixed size. It has no zoom, by design.
- Interactive shift-cipher tool for the cryptography stages.

**Quality**

- Accessible: keyboard navigation, visible focus, live regions, labels and alt text, and support for `prefers-reduced-motion`.
- Mobile-first layout, tested from 320 px to 1920 px.
- Unit tests plus an integration test that plays the whole mission from start to finish.

## Getting started

Requires [Node.js](https://nodejs.org/) (current LTS recommended) and npm.

```bash
git clone https://github.com/tiagoosm/ctfcasaviva.git
cd ctfcasaviva
npm install
npm start
```

The development server runs at <http://localhost:3000>.

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
│   └── index.js         # mission order / registry
├── components/
│   ├── challenge/       # ProgressTrack, ChallengeHeader, FlagForm, HintPanel, SuccessPanel
│   ├── layout/          # AppLayout, Header, Footer, BrandMark
│   ├── ui/              # Button, Badge, Modal, ConfirmDialog, FeedbackMessage…
│   ├── ImageViewer.js
│   └── CipherTool.js
├── admin/               # admin area (lazy-loaded): login, players, stages
├── api/                 # ranking backend client
├── game/                # reducer, scoring, selectors, persistence, provider
├── hooks/
├── pages/               # Landing, Mission map, Challenge, Completion, Ranking, 404
├── styles/              # Tailwind base layer and global styles
└── utils/               # sha256, answer normalization/validation, ciphers, formatting
scripts/
└── hash-flag.mjs        # answer hash generator
supabase/
└── migrations/          # ranking schema and server-side functions
```

Design tokens (cas@viva orange `#E87000`, blue `#004898`, surfaces, fonts and animations) live in [`tailwind.config.js`](tailwind.config.js).

## How answers are validated

Flags are never stored in plain text.

1. The player types the answer word directly. It is normalized so that case, accents and spaces are ignored.
2. The normalized answer is hashed with SHA-256, using the challenge id as salt, so the same word produces different hashes in different challenges.
3. The result is compared with the hash stored in the challenge config. Near-miss answers are stored as hashes too.

Solutions exist in readable form only in the test files, which are not part of the production bundle. SHA-256 is implemented in [`src/utils/sha256.js`](src/utils/sha256.js) rather than through Web Crypto, because `crypto.subtle` is only available in secure contexts and the game also needs to run over a local network.

As with any client-side CTF, this raises the effort needed to read answers from the source; it is not a substitute for server-side validation.

## Scoring

The mission is worth 1000 points: 100 for the Briefing, 200 each for the Gallery, Sequence and Interception, and 300 for the Vault. For each challenge:

| Component | Rule |
|-----------|------|
| Base | 70% of the challenge, earned by solving it |
| Speed bonus | Up to 30%. Full up to the challenge's fast time, then decaying linearly to zero at its slow time |
| Wrong answers | −10 each, charged for at most five |
| Hint | −25 |
| Floor | A challenge never scores below zero |

The clock of a challenge starts when the player first opens it and stops when it is solved. Time spent between challenges does not count, and reloading the page does not restart it. The total time is the sum of the challenge times and breaks ties in the ranking.

The formula lives in [`src/game/scoring.js`](src/game/scoring.js) and is mirrored by `ctf_score` on the server.

## Ranking backend

The ranking is stored in [Supabase](https://supabase.com/) (Postgres). The schema and all server logic are in [`supabase/migrations`](supabase/migrations).

The browser cannot read or write the tables: row level security is enabled with no policies. It can only call a few database functions, and the server is the one that checks each answer against its own hashes, measures time with its own clock, counts errors and computes the score. A client therefore cannot submit a score, a time or an error count.

| Function | Purpose |
|----------|---------|
| `ctf_start` | Opens a run for a name and class |
| `ctf_enter` | Starts the clock of a challenge (only once) |
| `ctf_hint` | Records that the hint was used |
| `ctf_submit` | Validates an answer; on success stores time and score |
| `ctf_ranking` | Returns the top players, one row per participant (their best run) |
| `ctf_result` | Returns the final result and ranking place of a run |

The game stays playable if the backend is unreachable: answers are also validated locally and the score is estimated with the same formula, but that run does not enter the ranking.

Known limits of a client-side CTF: the challenge content ships with the site, so someone who already knows the answers can replay the mission quickly. The server bounds every score to what the rules allow, but it cannot tell a fast solver from a returning one.

To point the app at another Supabase project, apply the migration there and set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_KEY` (the publishable key) at build time.

## Admin area

The admin area lives at `/admin`. It is not linked from the player interface and is loaded as a separate bundle only when that route is opened.

- **Players:** every run with score, time, errors, hints, completed stages and status; search by name, filter by class and status; per-player history by stage; edit name and class; hide a result from the public ranking or delete it (with confirmation).
- **Stages:** preview any stage without playing, with its answer, hint, scoring and configuration, and a tester that checks an answer the same way the game does.

Access is enforced by the server, not by hiding the route. Administrators sign in with Supabase Auth (email and password), and every `ctf_admin_*` database function checks that the caller's confirmed email is listed in the `ctf_admins` table. Players never sign in, and name and class are identification only. Plain-text answers are stored in the database and returned only to administrators; the public bundle contains hashes.

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

3. Add a row for it to the `ctf_challenges` table (same id, points, time window and hash, plus the plain-text `answer` for the admin area) so the server can score it.
4. Add the challenge to the array in [`src/challenges/index.js`](src/challenges/index.js). Routing, progress, mission map and scoring adapt automatically.

## Deployment

The app is a static single-page application hosted on [Vercel](https://vercel.com/). [`vercel.json`](vercel.json) rewrites every route to `index.html` so client-side routing works on direct access and reload. Any static host with an equivalent rewrite rule can serve the contents of `build/`.

## Tech stack

- [React 19](https://react.dev/) with [React Router 7](https://reactrouter.com/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Create React App](https://create-react-app.dev/) (build tooling) with Jest and Testing Library
- [Supabase](https://supabase.com/) (ranking backend)
- [Vercel](https://vercel.com/) (hosting)

## Author

Developed by [Tiago Machado](https://github.com/tiagoosm) for Inatel cas@viva.

This project is intended for educational purposes.
