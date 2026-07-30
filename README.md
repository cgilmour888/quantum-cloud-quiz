# Quantum Cloud Living Scene

This package creates the animated Neon Storm Exam Lab scene using the approved static artwork as the permanent master layer.

## Included effects

- Full uncropped 1672 × 941 master artwork
- Preserved exterior mechanical border
- Breathing storm-cloud illumination
- Procedural multi-depth rain
- Irregular lightning sequences
- Atmospheric mist
- Four counter-rotating gyroscope overlays
- Subtle tablet breathing and scanning energy
- Slightly emphasized engraved tablet markings
- Seamless OGG/Opus soundtrack with MP3 fallback
- Accessible soundtrack and FX controls
- Reduced-motion support
- Page-visibility animation suspension
- Root or subdirectory deployment support

## Install into a new React/Vite repository

1. Back up the repository.
2. Extract this archive at the repository root.
3. Run:

```bash
npm install
npm run dev
```

4. Verify the scene locally.
5. Build it:

```bash
npm run build
```

6. Commit and push the files to GitHub.

## Integrate into an existing React/Vite repository

Add these folders and assets:

```text
public/audio/
public/images/neon-storm-cloud-exam-dashboard.png
src/components/audio/
src/components/scene/
src/hooks/
```

Then merge the supplied `src/App.jsx` composition into the existing application rather than deleting unrelated routes or components.

The essential composition is:

```jsx
<>
  <AnimatedExamScene />
  <BackgroundSoundtrack volume={0.18} />
</>
```

Do not replace an existing `package.json` blindly when it contains additional dependencies. The supplied package file is a complete minimal baseline for a new React/Vite site.

## Deployment base path

Root domain deployments require no additional configuration.

For a deployment under `/quantum-cloud/`, create `.env.production` containing:

```env
VITE_PUBLIC_BASE_PATH=/quantum-cloud/
```

## Browser autoplay behavior

Modern browsers may require one click, tap, or key press before audible playback. The soundtrack component attempts playback, detects a blocked attempt, and retries automatically after the first interaction.
