# Quantum Cloud Quiz — Native Rebuild Strategy v2.0
## Continuity-Safe, Milestone-Packaged, Storage-Conscious Production Plan

## 1. Governing decision

The previous implementation will be preserved as an archived prototype, but it will not serve as the technical foundation of the new application. The new Quantum Cloud Quiz will be built as a native interactive website from the beginning. The conceptual image will be used as art direction, not as a full-page production surface. Dynamic questions, answers, counters, navigation, score states, metrics, audio controls, and accessibility elements will be real application components rather than overlays forced into a completed painting.

The project will be organized into 18 major milestones. Each milestone will end with:

1. an approved Git checkpoint;
2. a self-contained recovery ZIP;
3. a machine-readable file and checksum manifest;
4. a restoration script;
5. a safe-cleanup manifest;
6. a project-state report;
7. a ready-to-paste continuation prompt for a new ChatGPT thread;
8. a remote-backup verification report.

No chat thread will be treated as the source of truth. The Git repository, milestone recovery archive, and continuity documents will be authoritative.

---

## 2. Continuity strategy for ChatGPT thread limits

### 2.1 One major milestone per primary conversation

A new chat should normally begin at the start of each major milestone. This prevents long threads from becoming the only place where decisions exist.

A milestone may use more than one chat when necessary, but every new chat must begin from the latest verified milestone package rather than from memory.

### 2.2 Required continuity files

The repository will permanently maintain:

```text
docs/continuity/
├── PROJECT-STATE.md
├── PROJECT-STATE.json
├── MILESTONE-INDEX.md
├── DECISION-LOG.md
├── OPEN-ISSUES.md
├── ASSET-REGISTRY.json
├── REMOTE-ARTIFACT-INDEX.md
├── NEXT-THREAD-PROMPT.txt
└── RESTORE-QUICKSTART.md
```

`PROJECT-STATE.json` will record at minimum:

```text
project
repository
milestone_number
milestone_name
release_version
active_branch
git_head
last_verified_at
completed_work
approved_assets
test_results
known_limitations
next_action
required_user_action
recovery_archive
recovery_archive_sha256
remote_locations
```

### 2.3 New-thread startup protocol

At the beginning of every new conversation:

1. upload or link the latest approved recovery ZIP;
2. paste `NEXT-THREAD-PROMPT.txt`;
3. identify the target milestone;
4. require verification of the package manifest and checksum;
5. require a summary of the authoritative current state before implementation begins;
6. do not continue when the uploaded package and continuation prompt disagree.

### 2.4 Milestone closing protocol

At the end of every milestone:

1. stop feature development;
2. run tests and production build;
3. verify Git status;
4. update continuity documents;
5. create the recovery ZIP;
6. generate SHA-256;
7. extract the ZIP into a clean temporary directory;
8. perform a restoration smoke test;
9. upload the ZIP and checksum to the chosen remote storage;
10. re-download or independently verify the remote checksum;
11. generate the safe-cleanup manifest;
12. provide the next-thread prompt.

---

## 3. Repository and remote-storage strategy

### 3.1 Repository disposition

```text
Legacy repository:
quantum-cloud-quiz

Status:
Archived prototype
Read-only after final archive checkpoint

New repository:
quantum-cloud-quiz-native

Purpose:
Clean production rebuild
```

### 3.2 What belongs in Git

Git should contain:

- TypeScript, React, CSS, SVG, and configuration source;
- dataset schemas and normalizers;
- production-ready datasets that are permitted to be stored;
- production asset derivatives;
- tests;
- scripts;
- documentation;
- manifests;
- package lockfile;
- Cloudflare configuration;
- `.env.example`.

Git should not contain:

- `node_modules`;
- `dist`;
- coverage output;
- browser caches;
- temporary renders;
- extracted ZIP folders;
- local screenshots that are not part of an approved proof set;
- secrets;
- access tokens;
- account credentials.

### 3.3 Large binary assets

Large source artwork, lossless audio, and archival graphics should use one of these controlled methods:

1. Git LFS;
2. an immutable GitHub release asset;
3. an independent object-storage or cloud-drive backup.

Every large asset must be referenced in `ASSET-REGISTRY.json` with:

```text
asset_id
filename
category
source_or_generated
version
dimensions_or_duration
format
license_status
sha256
remote_location
production_derivatives
approved_milestone
```

### 3.4 Required redundancy

An original source asset must not be deleted locally until:

1. it exists in at least two independent remote locations;
2. both remote copies have been checksum-verified;
3. the recovery archive references the exact checksum;
4. a restoration test has succeeded.

---

## 4. Naming and versioning system

### 4.1 Milestone identifiers

Use:

```text
QCQ-NATIVE-M00
QCQ-NATIVE-M01
...
QCQ-NATIVE-M17
```

### 4.2 Recovery archive naming

```text
QCQ-NATIVE-M##_SHORT-DESCRIPTOR-vMAJOR.MINOR.PATCH-YYYYMMDD-RECOVERY.zip
```

Example:

```text
QCQ-NATIVE-M05-STATIC-SHELL-v0.5.0-20260812-RECOVERY.zip
```

Checksum:

```text
QCQ-NATIVE-M05-STATIC-SHELL-v0.5.0-20260812-RECOVERY.zip.sha256
```

### 4.3 Release package naming

```text
QCQ-NATIVE-RELEASE-vMAJOR.MINOR.PATCH-YYYYMMDD.zip
```

### 4.4 Project-specific asset naming

```text
QCQ-[CATEGORY]-[SYSTEM]-[DESCRIPTOR]-[VARIANT]-vMAJOR.MINOR.PATCH.ext
```

Examples:

```text
QCQ-UI-QUIZ-CONSOLE-FRAME-DESKTOP-v1.0.0.svg
QCQ-FX-ANSWER-CORRECT-ENERGY-PULSE-v1.0.0.webp
QCQ-AUD-QUIZ-CORRECT-CUE-SHORT-v1.0.0.wav
QCQ-DATA-AWS-CLOUD-PRACTITIONER-NORMALIZED-v1.0.0.json
```

### 4.5 Reusable cross-project asset naming

Reusable assets must not be tied to the QCQ project name:

```text
ASSET-[CATEGORY]-[DESCRIPTOR]-[VARIANT]-vMAJOR.MINOR.PATCH.ext
```

Examples:

```text
ASSET-ENV-STORM-CLOUD-DEEP-BLUE-01-v1.0.0.png
ASSET-TEX-BRUSHED-METAL-COOL-DARK-01-v1.0.0.png
ASSET-UI-HEX-PANEL-FRAME-ANGLED-01-v1.0.0.svg
ASSET-FX-ELECTRIC-ARC-BRANCH-01-v1.0.0.png
ASSET-ICON-ACHIEVEMENT-LAUREL-01-v1.0.0.svg
```

### 4.6 Version rules

- `v0.x` means draft or pre-approval.
- `v1.0.0` means first approved production version.
- Patch increments correct defects without changing intent.
- Minor increments add compatible variants or behavior.
- Major increments represent redesigns.
- Approved files are never overwritten in place; a new version is created.

---

## 5. Standard milestone recovery package

Every milestone ZIP will use:

```text
QCQ-NATIVE-M##_DESCRIPTOR-vX.Y.Z-YYYYMMDD-RECOVERY/
├── README-FIRST.md
├── MILESTONE-REPORT.md
├── PROJECT-STATE.md
├── PROJECT-STATE.json
├── NEXT-THREAD-PROMPT.txt
├── DECISION-LOG.md
├── OPEN-ISSUES.md
├── SOURCE-CONTENTS.md
├── repo/
│   └── [restorable project source]
├── git/
│   ├── repository.bundle
│   ├── HEAD.txt
│   ├── BRANCHES.txt
│   ├── TAGS.txt
│   └── STATUS.txt
├── assets/
│   ├── source/
│   ├── production/
│   └── reusable-library/
├── manifests/
│   ├── FILE-MANIFEST.txt
│   ├── SHA256SUMS.txt
│   ├── ASSET-REGISTRY.json
│   ├── REMOTE-LOCATIONS.md
│   └── SAFE-DELETE-MANIFEST.txt
├── reports/
│   ├── TEST-REPORT.md
│   ├── BUILD-REPORT.md
│   ├── VISUAL-REVIEW.md
│   └── KNOWN-LIMITATIONS.md
├── proof/
│   ├── screenshots/
│   └── video-index.md
├── restore/
│   ├── restore-macos.sh
│   ├── verify-restore.sh
│   └── RESTORE-INSTRUCTIONS.md
└── cleanup/
    ├── cleanup-macos-dry-run.sh
    ├── cleanup-macos.sh
    └── CLEANUP-INSTRUCTIONS.md
```

The archive must not contain secrets.

---

## 6. Local-storage and cleanup policy

### 6.1 Keep locally

Maintain only:

1. the active working repository;
2. the latest approved recovery ZIP;
3. the immediately preceding stable recovery ZIP until the next milestone is approved;
4. the source-vault archive until two remote copies are verified;
5. any files currently being edited.

### 6.2 Safe to delete after verification

After a milestone is committed, pushed, remotely archived, checksum-verified, and restoration-tested, the cleanup script may remove:

- `node_modules`;
- `dist`;
- `.vite`;
- coverage;
- Playwright browser output;
- temporary screenshots;
- rejected generated art;
- temporary audio conversions;
- extracted milestone package directories;
- duplicate ZIP downloads;
- local package caches created specifically for the milestone;
- old local recovery ZIPs beyond the latest two;
- temporary branches already merged and remotely preserved.

### 6.3 Never delete automatically

Cleanup scripts must never automatically delete:

- original conceptual artwork;
- original music;
- original dataset;
- active repository;
- latest approved recovery ZIP;
- previous stable recovery ZIP;
- Git credentials or user configuration;
- anything outside explicitly listed project directories.

Every cleanup must support a dry run first.

---

## 7. Revised 18-milestone production plan

# M00 — Legacy Archive and Source Vault

## Objective

Preserve all useful historical work while establishing a clean break.

## Actions

1. Snapshot the legacy repository.
2. Record branch, HEAD, tags, remotes, and Cloudflare configuration.
3. Create one immutable legacy archive.
4. Create a source vault containing the conceptual image, soundtrack, dataset, licenses, and checksums.
5. Mark the old repository read-only.
6. Create the new repository.

## Acceptance gate

- Legacy recovery test passes.
- Source-vault checksums pass.
- New repository contains no legacy implementation code.

## Recovery archive

```text
QCQ-NATIVE-M00-LEGACY-ARCHIVE-SOURCE-VAULT-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M01 — Product Constitution and Production Specification

## Objective

Freeze what the product is before code or new artwork is generated.

## Define

- target exam and deadline;
- desktop, tablet, and mobile priorities;
- game modes;
- passing score;
- timing rules;
- scoring;
- explanation behavior;
- analytics;
- audio behavior;
- animation intensity;
- accessibility;
- performance;
- deployment;
- acceptance criteria.

## Deliverables

```text
PRODUCT-CONSTITUTION.md
PRODUCTION-SPECIFICATION.md
ACCESSIBILITY-SPECIFICATION.md
AUDIO-SPECIFICATION.md
PERFORMANCE-BUDGET.md
ACCEPTANCE-GATES.md
```

## Acceptance gate

Every dynamic element and game rule is explicitly defined.

## Recovery archive

```text
QCQ-NATIVE-M01-PRODUCT-SPECIFICATION-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M02 — Asset Intake, Rights, and Provenance

## Objective

Catalog every source asset and determine what may be used privately and publicly.

## Actions

1. Verify image dimensions and checksum.
2. Verify soundtrack duration, format, and distribution rights.
3. Inspect dataset structure.
4. Create asset IDs.
5. Record licenses and restrictions.
6. Create production-derivative requirements.
7. Establish reusable versus project-specific classifications.

## Acceptance gate

No asset enters production without provenance, checksum, and license status.

## Recovery archive

```text
QCQ-NATIVE-M02-ASSET-INTAKE-PROVENANCE-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M03 — Concept Decomposition and UX Wireframes

## Objective

Translate the conceptual artwork into a native application composition.

## Actions

1. Extract visual hierarchy.
2. Create grayscale desktop wireframes.
3. Define left navigation, central quiz, right metrics, lower status area, and atmospheric environment.
4. Define responsive collapse behavior.
5. Perform keyboard-flow review.
6. Validate readability without effects.

## Acceptance gate

The grayscale interface is intuitive before animation, texture, or glow.

## Recovery archive

```text
QCQ-NATIVE-M03-UX-WIREFRAMES-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M04 — Design System and Original Art Direction

## Objective

Create the new visual language and reusable asset library.

## Actions

1. Define colors, typography, spacing, materials, and geometry.
2. Generate original environmental concepts.
3. Generate text-free textures and motifs.
4. Build SVG panel and icon systems.
5. Separate reusable assets from QCQ-specific assets.
6. Create motion tokens.

## Acceptance gate

The approved visual system is original, text-free, scalable, and reusable.

## Recovery archive

```text
QCQ-NATIVE-M04-DESIGN-SYSTEM-ASSET-LIBRARY-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M05 — Native Static Application Shell

## Objective

Build the complete interface without gameplay, animation, or audio.

## Actions

1. Create React, TypeScript, and Vite project.
2. Implement app frame.
3. Implement navigation.
4. Implement quiz console shell.
5. Implement metrics shell.
6. Implement responsive layout.
7. Implement semantic controls.
8. Implement base keyboard navigation.

## Acceptance gate

The application looks premium and remains understandable with all effects disabled.

## Recovery archive

```text
QCQ-NATIVE-M05-STATIC-APPLICATION-SHELL-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M06 — Dataset Schema and Import Pipeline

## Objective

Create a durable, exam-independent data layer.

## Actions

1. Define canonical question schema.
2. Normalize the AWS dataset.
3. Validate IDs, options, answers, selection counts, topics, references, and explanations.
4. Detect duplicates.
5. Build a local custom-dataset importer.
6. Produce validation reports.

## Acceptance gate

All 1,142 questions and 4,830 answer options are valid and reachable.

## Recovery archive

```text
QCQ-NATIVE-M06-DATASET-PIPELINE-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M07 — Core Quiz Engine

## Objective

Make the quiz completely playable before advanced presentation work.

## Actions

1. Implement ordered and randomized sessions.
2. Implement single-select.
3. Implement multiple-select.
4. Implement select-three.
5. Implement option pagination.
6. Implement grading.
7. Implement explanations.
8. Implement progression.
9. Implement timer and pause.
10. Implement completion.

## Acceptance gate

The entire quiz works in a minimal test interface.

## Recovery archive

```text
QCQ-NATIVE-M07-CORE-QUIZ-ENGINE-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M08 — Persistence and Session Recovery

## Objective

Ensure no study progress is lost.

## Actions

1. Implement IndexedDB repositories.
2. Save active sessions.
3. Restore interrupted sessions.
4. Save bookmarks.
5. Save missed questions.
6. Save completed attempts.
7. Add data export and reset tools.
8. Test schema migrations.

## Acceptance gate

A session can be closed, restored, completed, and audited deterministically.

## Recovery archive

```text
QCQ-NATIVE-M08-PERSISTENCE-SESSION-RECOVERY-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M09 — Metrics and Study Intelligence

## Objective

Turn gameplay into actionable exam preparation.

## Actions

1. Implement score and accuracy.
2. Implement streaks.
3. Implement topic analytics.
4. Implement timing analytics.
5. Implement weakest-topic detection.
6. Implement targeted review queues.
7. Implement readiness estimate with transparent methodology.
8. Implement history and achievements.

## Acceptance gate

Every displayed metric is traceable to stored attempts.

## Recovery archive

```text
QCQ-NATIVE-M09-STUDY-INTELLIGENCE-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M10 — Interaction and Motion Language

## Objective

Add native component-level motion.

## Actions

1. Define hover, focus, active, selected, correct, incorrect, and disabled states.
2. Add answer feedback.
3. Add navigation activation.
4. Add metric transitions.
5. Add panel transitions.
6. Add reduced-motion equivalents.
7. Confirm motion communicates state rather than decoration alone.

## Acceptance gate

No animation obscures content or changes layout unexpectedly.

## Recovery archive

```text
QCQ-NATIVE-M10-INTERACTION-MOTION-SYSTEM-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M11 — Cinematic Environment Systems

## Objective

Build the atmosphere as independent, performance-controlled systems.

## Systems

1. StormSystem.
2. CircuitSystem.
3. TabletEnergySystem.
4. MetricsResponseSystem.
5. LightningSystem.
6. ParticleSystem.
7. ReflectionSystem.
8. ScoreRevealSystem.

## Acceptance gate

Every system passes isolated visual, performance, and reduced-motion tests.

## Recovery archive

```text
QCQ-NATIVE-M11-CINEMATIC-ENVIRONMENT-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M12 — Audio and Soundtrack System

## Objective

Integrate music and effects without reducing study concentration.

## Actions

1. Add user-initiated playback.
2. Add music and effects buses.
3. Add volume and mute.
4. Add concentration mode.
5. Add reduced-sensory mode.
6. Add seamless looping.
7. Add restrained audio-reactive visuals.
8. Verify public-use rights before production deployment.

## Acceptance gate

The application remains fully usable with audio muted.

## Recovery archive

```text
QCQ-NATIVE-M12-AUDIO-SOUNDTRACK-SYSTEM-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M13 — Accessibility and Performance Hardening

## Objective

Make the product comfortable, inclusive, and stable.

## Actions

1. Complete keyboard operation.
2. Add screen-reader feedback.
3. Validate contrast.
4. Validate non-color state communication.
5. Implement quality tiers.
6. Pause hidden-tab rendering.
7. Optimize textures and audio.
8. Test primary Mac hardware.
9. Test reduced motion and reduced effects.

## Acceptance gate

The quiz remains responsive, readable, and operable under all quality modes.

## Recovery archive

```text
QCQ-NATIVE-M13-ACCESSIBILITY-PERFORMANCE-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M14 — Content Enrichment and Reference Review

## Objective

Improve explanations without introducing unsupported claims.

## Actions

1. Identify missing explanations.
2. Group by topic.
3. Research current official sources.
4. Draft referenced explanations.
5. Review terminology.
6. Preserve original dataset separately.
7. Version the enriched dataset.

## Acceptance gate

Every added explanation is distinguishable from original source content and has traceable references.

## Recovery archive

```text
QCQ-NATIVE-M14-CONTENT-ENRICHMENT-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M15 — Full Validation and Release Candidate

## Objective

Prove the application before deployment.

## Actions

1. Run unit tests.
2. Run gameplay tests.
3. Run dataset stress tests.
4. Run browser tests.
5. Run accessibility tests.
6. Run performance tests.
7. Render all question and option combinations.
8. Test long content.
9. Test option E.
10. Test session restoration.
11. Produce visual proof set.
12. Build release candidate.

## Acceptance gate

No critical defects, no clipped content, no hidden options, and no failed restoration test.

## Recovery archive

```text
QCQ-NATIVE-M15-RELEASE-CANDIDATE-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M16 — GitHub and Cloudflare Preview Deployment

## Objective

Deploy a controlled preview without replacing production prematurely.

## Actions

1. Push approved repository state.
2. Configure preview branch.
3. Configure build command and output.
4. Configure headers and redirects.
5. Verify asset caching.
6. Verify preview security.
7. Run production-like browser tests against preview URL.
8. Compare local and preview output.

## Acceptance gate

The Cloudflare preview passes the same acceptance tests as the local build.

## Recovery archive

```text
QCQ-NATIVE-M16-CLOUDFLARE-PREVIEW-v1.0.0-YYYYMMDD-RECOVERY.zip
```

---

# M17 — Production Release and Reusable Asset Catalog

## Objective

Publish the approved product and leave a clean foundation for future websites.

## Actions

1. Approve production release.
2. Merge and tag.
3. Deploy production.
4. Verify custom domain.
5. Verify rollback.
6. Publish release archive.
7. Publish reusable asset catalog.
8. Create future-project starter kit.
9. Clean local computer using the dry-run cleanup manifest.
10. Preserve latest two recovery packages locally.

## Deliverables

```text
QCQ-NATIVE-RELEASE-v1.0.0-YYYYMMDD.zip
QCQ-NATIVE-REUSABLE-ASSET-LIBRARY-v1.0.0-YYYYMMDD.zip
QCQ-NATIVE-FUTURE-PROJECT-STARTER-v1.0.0-YYYYMMDD.zip
```

## Acceptance gate

Production, rollback, recovery ZIP, asset library, and clean-machine procedure are all verified.

---

## 8. Thread handoff response format

Whenever user action is required, the response must use:

```text
USER ACTION REQUIRED:
WHY IT IS REQUIRED:
EXACT TERMINAL COMMAND:
EXPECTED RESULT:
WHAT TO SEND BACK:
DO NOT PROCEED IF:
```

Whenever a milestone closes, the response must include:

```text
MILESTONE:
STATUS:
GIT BRANCH:
GIT HEAD:
TEST RESULTS:
BUILD RESULT:
RECOVERY ZIP:
SHA-256:
REMOTE BACKUP STATUS:
SAFE TO DELETE:
KEEP LOCALLY:
NEXT THREAD:
NEXT-THREAD PROMPT:
```

---

## 9. Restoration standard

A milestone is not considered complete until its recovery package can reconstruct the project in a clean directory.

The restoration test must verify:

1. repository source;
2. Git history or bundle;
3. package lock;
4. required assets;
5. dataset;
6. scripts;
7. tests;
8. production build;
9. continuity documents;
10. checksum manifest.

Secrets must be restored manually from a user-controlled credential store and must never be placed in the archive.

---

## 10. Final operating principle

The project will no longer depend upon:

- one long ChatGPT thread;
- local temporary files;
- undocumented decisions;
- manually remembered commands;
- one computer;
- one unverified ZIP;
- one remote location.

The project will depend upon:

- an authoritative Git repository;
- 18 controlled milestone checkpoints;
- self-contained recovery archives;
- verified checksums;
- machine-readable project state;
- explicit decision logs;
- reusable asset registries;
- tested restoration scripts;
- new-thread continuation prompts;
- conservative local cleanup.

This structure allows the project to survive chat saturation, computer replacement, local cleanup, design revisions, repository migration, and future reuse without repeating the loss and confusion experienced during the prototype effort.
