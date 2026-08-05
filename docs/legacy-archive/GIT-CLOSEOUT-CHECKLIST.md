# Git Closeout Checklist

## Before staging

- [ ] Run `prepare-closeout.sh`.
- [ ] Review Git status and all untracked files.
- [ ] Review every file larger than 50 MB.
- [ ] Resolve every file larger than 100 MB before attempting a new GitHub push.
- [ ] Review sensitive-looking filenames.
- [ ] Confirm no credentials or local environment files are staged.
- [ ] Apply the archive banner.
- [ ] Run closeout verification.

## Commit and remote preservation

- [ ] Stage the intended complete legacy state.
- [ ] Review `git diff --cached --stat` and `git diff --cached --name-status`.
- [ ] Create the final closeout commit.
- [ ] Create annotated tag `qcq-legacy-final-v1.0.0`.
- [ ] Push the current branch.
- [ ] Push the final tag.
- [ ] Verify remote branch and tag.

## Recovery release

- [ ] Create the final recovery ZIP from the clean committed state.
- [ ] Verify its SHA-256.
- [ ] Verify its Git bundle.
- [ ] Verify its source archive.
- [ ] Restore into a clean test directory.
- [ ] Attach the ZIP and checksum to the final GitHub release.
- [ ] Verify the remote release assets.

## Repository archive

- [ ] Close or document remaining issues and pull requests.
- [ ] Update the repository description to indicate legacy status.
- [ ] Confirm the native rebuild repository has been created or is ready to create.
- [ ] Archive the legacy repository in GitHub Settings.
- [ ] Keep the latest two verified recovery archives locally until the native repository reaches its first approved milestone.
