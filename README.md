# Quantum Cloud Quiz

Quantum Cloud Quiz is an immersive AWS cloud-computing practice examination platform featuring adaptive scoring, learner profiles, topic analytics, progress tracking, certificates of mastery, and a cinematic interactive storm environment.

## Current Architecture

This release is a static website designed for deployment through Cloudflare Pages.

- Static HTML, CSS, and JavaScript
- AWS practice exams stored in `data/exams.json`
- Local browser profile and progress storage
- Downloadable mastery certificates
- Custom quiz upload support
- Progressive Web App support
- Architecture prepared for future API and database integration

## Cloudflare Pages Deployment

Use these settings:

- Framework preset: `None`
- Build command: `exit 0`
- Build output directory: `.`
- Production branch: `main`
- Root directory: leave blank

The `index.html` file must remain at the repository root.

## Project Structure

```text
quantum-cloud-quiz/
├── assets/
│   ├── cloud-mark.svg
│   └── nimbus-supercell.png
├── data/
│   └── exams.json
├── js/
│   ├── analytics.js
│   ├── app.js
│   ├── audio-engine.js
│   ├── certificate.js
│   ├── constants.js
│   ├── fx-engine.js
│   ├── progress-repository.js
│   ├── quiz-engine.js
│   ├── repository.js
│   ├── storage.js
│   └── storm-engine.js
├── DEPLOYMENT-NOTE.txt
├── index.html
├── manifest.webmanifest
├── README.md
├── styles.css
└── sw.js
```

## Data and Privacy

The current static release stores profile data, progress, scores, and preferences in the user's browser. A future release can replace local browser storage with an authenticated API and cloud database without redesigning the interface.

## Author

**Carl Gilmour**

