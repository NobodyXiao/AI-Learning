---
name: git-commit
description: Generate concise commit messages in `#<work-item-id> <message>` format (under 50 characters) and maintain a COMMIT.md changelog. Use when the user asks to commit changes, write a commit message, record work, or update the commit log. Also trigger when the user provides a work item ID or mentions recording progress.
compatibility:
  tools: [Read, Write, Bash]
---

# Git Commit & Changelog Skill

## Workflow

Follow these steps in order when the user asks you to commit changes.

### Step 1: Understand the changes

First check the current state of the repository:

1. Run `git status` to see all changes (modified, staged, and untracked files)
2. Run `git diff` (and `git diff --cached` if there are staged changes) to understand what was modified
3. Run `git log --oneline -3` to see recent commit messages for style reference

### Step 2: Determine the work item ID

- If the user provided a work item ID (like `#1234567`), use it directly
- If not, ask the user for the work item ID — do not guess or invent one

### Step 3: Write the commit message

Format: `#<work-item-id> <concise message>`

Rules:

- **Must be under 50 characters total** (including the `#<id> ` prefix)
- Use imperative mood ("Add", "Fix", "Refactor", "Update", "Remove")
- Be concise but descriptive — capture what was done, not how
- No trailing period
- If the message alone would be too vague to be useful, it's better to slightly shorten the ID scope than to pad with filler words

Examples:

- `#1234567 Add theme toggle to header`
- `#1234567 Refactor UI with Ant Design`
- `#1234567 Fix login form validation`
- `#1234567 Initialize project with CRA`

### Step 4: Commit

1. Run the commit:
   ```
   git commit -m "#<work-item-id> <message>"
   ```

If the commit fails (e.g., due to hooks), fix the issue and retry — do not skip hooks.

### Step 5: Update COMMIT.md

After a successful commit, update (or create) `COMMIT.md` in the project root by appending a new entry at the top of the file.

**Entry format:**

```markdown
## [YYYY-MM-DD HH:mm] #<work-item-id>

**Project:** <project-name>
**Branch:** <branch-name>
**Author:** <author-name>

**Changed files:**

- <path/to/file> — <brief description of the change>
- <path/to/file> — <brief description of the change>

**Summary:**
<1-2 sentence summary of what was done and why>

---
```

**Rules for the entry:**

- Use the current date and time in the header
- Project name comes from `package.json`'s `name` field (or the directory name if unavailable)
- Branch name from `git branch --show-current`
- List all files that were staged and committed, with a brief note on what changed in each
- The summary should explain the intent, not just restate the diff
- Append at the top (newest first), keeping a `---` separator between entries
- If COMMIT.md doesn't exist yet, create it with a title `# Commit Log` first

## Important notes

- Do NOT commit if there are no changes to stage (empty commit)
- Do NOT push to remote — just commit locally
- If there are untracked files that are clearly not part of the intended commit (node_modules, build output, .env files), skip them
- When in doubt about what to include, ask the user
