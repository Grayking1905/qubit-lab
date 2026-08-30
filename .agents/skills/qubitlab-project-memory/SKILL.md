---
name: qubitlab-project-memory
description: Guide on reading, maintaining, and updating QubitLab project memory, architecture decisions, and roadmap tracking.
---

# QubitLab Project Memory Skill

Use this skill when completing tasks, adding new architectural features, resolving bugs, or making key technical decisions in QubitLab.

## Memory Locations
- **`AGENTS.md` & `CLAUDE.md`**: Master blueprints containing full context, architecture, command guides, data models, and high-level progress logs.
- **`.agents/memory.md`**: Granular progress log, active decisions, and roadmap milestones.

## Memory Update Protocol
Whenever significant architectural changes or milestone progress occurs:
1. Update `.agents/memory.md` with:
   - Newly completed features or fixed issues.
   - Any new architectural decisions or gotchas discovered.
2. Update the progress table in `CLAUDE.md` / `AGENTS.md` if high-level milestone status changes.
3. Keep the Next.js rule comment block at the very top of `AGENTS.md` preserved at all times.
