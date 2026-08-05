# A2.3 Repository Audit

## Protected foundation

- Repository family: Quantum Cloud Quiz / BorderFrameEngine R5.5.3
- Expected branch: `feature/tablet-question-answer-engine-t1`
- Foundation ancestor: `2839592af1d29925b791c9c59f0a736620b0cf67`
- Known checkpoint: `fcb984626b15d926fa85c093764d29573359e622`
- Protected MASTER: `public/images/master/MASTER.png`
- MASTER dimensions: 3840 × 2160
- MASTER SHA-256: `5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c`

## Composition finding

**Mode D.** The tablet body, button artwork, A–D badges, placeholder question, and placeholder answers are baked into MASTER. React supplies dynamic copy, veils, metrics, and hit regions. The live tablet is therefore neither a purely separate raster asset nor a purely DOM interface.

## Original production ownership

- MASTER rendering: `src/components/scene/Scene.jsx`
- Scene lifecycle: `src/hooks/useSceneEngine.js`
- Quiz controller: `src/hooks/useQuizController.js`
- Original tablet renderer: `src/components/quiz/QuizInterface.jsx`
- Original geometry: `src/components/quiz/tabletGeometry.js`
- Protected A2.1R aperture authority: `src/components/quiz/tabletMaximumApertureGeometry.js`
- Styling: `src/styles/quiz-interface.css`
- Dataset: `public/data/aws-cloud-practitioner.exams.json`

## A2.3 decision

The original MASTER remains untouched. A new shell is extracted from original pixels and split into rear frame, screen surface, and foreground rim. One 1000×1000 live content plane is mapped once to the screen quadrilateral. All question, answer, badge, selection, and footer elements remain ordinary children of that plane.
