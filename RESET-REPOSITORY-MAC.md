# Replace the Existing Repository Working Tree on macOS

Run these commands from the existing local repository. Replace `/path/to/extracted/quantum-cloud-quiz-master` with the actual extracted folder.

```bash
cd "$HOME/Projects/quantum-cloud-quiz"

git status
git switch -c backup/pre-master-reset-$(date +%Y%m%d-%H%M%S)
git add -A
git commit -m "backup: preserve repository before MASTER reset" || true

# Return to the branch that will receive the clean baseline.
git switch feature/react-living-scene

# Remove every working-tree item except the hidden .git directory.
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# Copy the new baseline into the existing clone.
rsync -av --exclude='.git' /path/to/extracted/quantum-cloud-quiz-master/ ./

npm install
npm run verify:master
npm run build

git add -A
git commit -m "reset: establish approved MASTER animation baseline"
git push -u origin feature/react-living-scene
```

Do not run the deletion command until the backup branch and commit exist.
