# Lessons Learned

## Architectural conclusions

1. A completed illustration should not be treated as the live interactive interface.
2. Dynamic text must never be baked into production artwork.
3. Questions, answers, counters, navigation, and metrics must be native semantic components.
4. Visual atmosphere and interactive controls must use separate rendering responsibilities.
5. Animation must be owned by the component or system whose state it communicates.
6. One authoritative application state must drive all visual reactions.
7. Long projects must not depend upon one ChatGPT thread or local temporary folders.
8. Every milestone requires a recovery ZIP, checksum, project-state record, and restoration test.
9. Cleanup occurs only after Git push, remote archive verification, and successful restoration.
10. The native rebuild should reuse requirements and evidence, not legacy implementation debt.

## Release-engineering conclusions

- installers must reject unexpected working-tree changes;
- parsers must ignore comments and validate manifest records structurally;
- rollback must restore the exact pre-install state, including approved uncommitted work;
- progress may only increase when physical files, tests, builds, or packages exist;
- a production build is not equivalent to visual approval;
- target-browser and target-machine inspection remain mandatory.
