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
- Optional two-level hints that cost points, a running score and a final rank.
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
├── game/                # reducer, selectors (status, score, rank), persistence, provider
├── hooks/
├── pages/               # Landing, Mission map, Challenge, Completion, 404
├── styles/              # Tailwind base layer and global styles
└── utils/               # sha256, answer normalization/validation, ciphers, formatting
scripts/
└── hash-flag.mjs        # answer hash generator
```

Design tokens (cas@viva orange `#E87000`, blue `#004898`, surfaces, fonts and animations) live in [`tailwind.config.js`](tailwind.config.js).

## How answers are validated

Flags are never stored in plain text.

1. The player types the answer word directly. It is normalized so that case, accents and spaces are ignored.
2. The normalized answer is hashed with SHA-256, using the challenge id as salt, so the same word produces different hashes in different challenges.
3. The result is compared with the hash stored in the challenge config. Near-miss answers are stored as hashes too.

Solutions exist in readable form only in the test files, which are not part of the production bundle. SHA-256 is implemented in [`src/utils/sha256.js`](src/utils/sha256.js) rather than through Web Crypto, because `crypto.subtle` is only available in secure contexts and the game also needs to run over a local network.

As with any client-side CTF, this raises the effort needed to read answers from the source; it is not a substitute for server-side validation.

## Adding a challenge

1. Create `src/challenges/<name>/index.js` with the config (`id`, `slug`, `code`, `title`, `points`, `objective`, `answerMode`, `hints`, `success`, `Stage`) and a `Stage` component.
2. Generate the answer hash and paste it into `answerHash`. Use the same command for `nearMisses[].hashes`.

   ```bash
   npm run hash-flag -- <challenge-id> <answer>
   ```

3. Add the challenge to the array in [`src/challenges/index.js`](src/challenges/index.js). Routing, progress, mission map and scoring adapt automatically.

## Deployment

The app is a static single-page application hosted on [Vercel](https://vercel.com/). [`vercel.json`](vercel.json) rewrites every route to `index.html` so client-side routing works on direct access and reload. Any static host with an equivalent rewrite rule can serve the contents of `build/`.

## Tech stack

- [React 19](https://react.dev/) with [React Router 7](https://reactrouter.com/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Create React App](https://create-react-app.dev/) (build tooling) with Jest and Testing Library
- [Vercel](https://vercel.com/) (hosting)

## Author

Developed by [Tiago Machado](https://github.com/tiagoosm) for Inatel cas@viva.

This project is intended for educational purposes.
