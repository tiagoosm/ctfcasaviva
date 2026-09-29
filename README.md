# 🚩 CTF Inatel cas@viva

An educational Capture The Flag built for the students of **Inatel cas@viva**. Players join "Operação cas@viva", a five-stage digital investigation where each stage teaches one security skill and leaves a clue for the next.

👉 **[Play now](https://ctfcasaviva-theta.vercel.app/)**

---

## 🧭 The mission

| # | Challenge | Skill | What the player learns |
|---|-----------|-------|------------------------|
| 00 | Briefing | Careful reading | How flags work — and that a black bar does not erase data |
| 01 | Galeria | Visual analysis | Steganography: information hidden inside images |
| 02 | Sequência | Pattern recognition | Finding the rule behind apparently random data |
| 03 | Interceptação | Substitution cipher | Breaking a Caesar cipher |
| FINAL | O Cofre | Vigenère cipher | Combining a key found earlier with a multi-shift cipher |

Features:

- Progressive unlocking (stages can't be skipped via URL), progress saved in `localStorage`
- Optional two-level hints that cost points, scoring and a final rank ("Mestre do CTF")
- Contextual feedback for near-misses (e.g. submitting the key instead of the message)
- Zoom/pan image viewer (mouse, touch pinch, keyboard) and an interactive shift-cipher tool
- Printable completion certificate
- Accessible: keyboard navigation, visible focus, live regions, labels/alt text, `prefers-reduced-motion`
- Mobile-first layout tested from 320 px to 1920 px

Flags are **never stored in plain text**: answers are normalized (case, accents, spaces, optional `casaviva{...}` wrapper) and compared as salted SHA-256 hashes.

---

## ⚙️ Running locally

```bash
git clone https://github.com/tiagoosm/ctfcasaviva.git
cd ctfcasaviva
npm install
npm start          # dev server at http://localhost:3000
npm run test:ci    # unit + full playthrough integration tests
npm run build      # production build
```

---

## 🗂️ Project structure

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
├── styles/              # Tailwind base + design tokens usage
└── utils/               # sha256, answer normalization/validation, ciphers, formatting
```

Design tokens (cas@viva orange `#E87000`, blue `#004898`, surfaces, fonts, animations) live in `tailwind.config.js`.

### ➕ Adding a challenge

1. Create `src/challenges/<name>/index.js` with the config (`id`, `slug`, `code`, `title`, `points`, `objective`, `hints`, `success`, `Stage`…) and a `Stage` component.
2. Generate the answer hash: `npm run hash-flag -- <id> <answer>` and paste it into `answerHash` (use the same command for `nearMisses[].hashes`).
3. Add it to the array in `src/challenges/index.js`. Routing, progress, map and scoring adapt automatically.

---

## 🛠️ Tech

React 19 · React Router 7 · Tailwind CSS 3 · Create React App · Vercel

---

## 🧑‍💻 Author

Developed by Tiago Machado — https://github.com/tiagoosm

This project is for educational purposes.
