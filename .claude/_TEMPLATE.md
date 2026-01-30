# Claude Code Memory System - Template

This template explains how to set up the `.claude/` memory system for any project.

---

## Purpose

The `.claude/` directory serves as persistent memory across Claude Code sessions. It solves the problem of context loss when starting new conversations.

**Benefits:**
- No re-explaining the project each session
- Track what's done, in progress, and planned
- Document decisions so they don't get revisited
- Faster onboarding for new sessions
- Consistent patterns across work

---

## Directory Structure

Create `.claude/` in the project root with these files:

```
.claude/
├── project-overview.md      # What the project does, goals, architecture
├── current-state.md         # What's done, in progress, priorities
├── technical-decisions.md   # Key decisions and rationale
├── conventions.md           # Code style, naming, patterns
├── common-tasks.md          # How-to guides for frequent operations
├── context-for-claude.md    # Instructions for Claude sessions
└── _TEMPLATE.md             # This file (for reference/replication)
```

---

## File Templates

### project-overview.md
```markdown
# [Project Name] - Project Overview

## What is [Project]?
[1-2 paragraph description]

## Core Problem Solved
[What pain point does this address?]

## Key Features
1. Feature one
2. Feature two
3. ...

## Tech Stack Summary
- Frontend: [...]
- Backend: [...]
- Database: [...]
- Hosting: [...]

## Architecture
[Simple diagram or description]
```

### current-state.md
```markdown
# [Project Name] - Current State

*Last updated: [DATE]*

## What's Working
- [x] Feature one
- [x] Feature two

## In Progress
### [Current Task]
**Status**: [In progress / Blocked / Waiting]
**Context**: [What's happening]
**Next steps**: [What to do next]

## Recent Changes
### [DATE]
- Change one
- Change two

## Known Issues
1. Issue one
2. Issue two

## Priorities
1. Immediate: [...]
2. Next: [...]
3. Future: [...]
```

### technical-decisions.md
```markdown
# [Project Name] - Technical Decisions

## [Decision Category]

### Why [Choice]?
- Reason one
- Reason two
- **Decision date**: [When]

### Alternatives Considered
- Option A: [Why not]
- Option B: [Why not]

## What We Chose NOT To Do
### No [Technology/Approach]
**Why**: [Reasoning]
```

### conventions.md
```markdown
# [Project Name] - Conventions

## File Naming
| Type | Convention | Example |
|------|------------|---------|
| ... | ... | ... |

## Code Style
[Language-specific conventions]

## Import Order
[Standard import ordering]

## Git Conventions
[Branch naming, commit messages]
```

### common-tasks.md
```markdown
# [Project Name] - Common Tasks

## Development
### Start Development
\`\`\`bash
[command]
\`\`\`

### Run Tests
\`\`\`bash
[command]
\`\`\`

## Adding Features
### New [Component Type]
[Step-by-step guide]

## Debugging
### Common Issue
[How to fix]

## Deployment
### To [Environment]
[Steps]
```

### context-for-claude.md
```markdown
# Instructions for Claude Code Sessions

## At the Start of Every Session
**ALWAYS read these files first:**
1. `.claude/current-state.md`
2. `.claude/project-overview.md` (if unfamiliar)

## After Completing Significant Work
Update `.claude/current-state.md`

## Key Project Files
| File | Purpose |
|------|---------|
| ... | ... |

## Common Patterns
[Project-specific patterns]

## Gotchas
[Non-obvious things to remember]
```

---

## Workflow

### New Project Setup
1. Create `.claude/` directory
2. Create all files from templates above
3. Populate with initial project information

### Each Session Start
1. Read `current-state.md`
2. Read `context-for-claude.md`
3. Continue work with full context

### After Significant Work
1. Update `current-state.md`
2. Add any new technical decisions
3. Update conventions if patterns emerge

### Context Getting Long
1. Summarize in memory files
2. Start fresh session
3. Memory persists in files

---

## Best Practices

1. **Keep files concise** - Scannable, not exhaustive
2. **Update regularly** - Stale docs are worse than none
3. **Date entries** - Know when things changed
4. **Link to code** - Reference file paths
5. **Be specific** - "Fix bug" → "Fix login cookie expiry issue"

---

## Replicating to New Projects

1. Copy this `_TEMPLATE.md` to new project
2. Create `.claude/` directory
3. Create files following templates above
4. Populate with project-specific content
5. Add `.claude/` to version control (it's documentation, not secrets)

---

## This is Standard Operating Procedure

For every project, Claude Code should:
1. **Create** `.claude/` directory at project start
2. **Read** memory files at session start
3. **Update** files after significant work
4. **Treat** `.claude/` as essential as `.git/`
