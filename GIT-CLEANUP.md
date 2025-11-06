# Git History Cleanup Guide

## Step 1: Remove sensitive files from history
```bash
# Install BFG Repo Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Replace sensitive files with placeholder text
java -jar bfg.jar --replace-text passwords.txt GeoFence-QR-Attendance.git

# Clean up and prune
cd GeoFence-QR-Attendance
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## Step 2: Force push changes (WARNING: This rewrites history!)
```bash
git push --force origin main
```

## Step 3: Update all branches
```bash
# For each branch
git checkout <branch>
git rebase main
git push --force origin <branch>
```

## Step 4: Team Instructions
After cleaning history, all team members should:
1. Backup their changes
2. Delete their local repo
3. Clone fresh copy
4. Re-apply their changes

## Files to Check
- backend/service-account.json
- backend/.env
- FacultyApp/.env
- StudentApp/.env
- Any other files with API keys or secrets