---
name: chatium-workspace
description: Workspace-specific Chatium development workflows for the repository s.chtm.khudoley.pro. Use when Codex works on Chatium tasks in this workspace, including task formalization, implementation planning, plan review, code review, standards/routing/runtime checks, technical verification, documentation updates, or when the user invokes /check, /pipeline, /pp, /toprod, or references migrated Claude agents/commands.
---

# Chatium Workspace

## Overview

This skill is the Codex-native entrypoint for the former `.claude/agents` and `.claude/commands` setup in `s.chtm.khudoley.pro`.

Do not copy Claude mechanics literally. Translate them to Codex:

- Claude `Read/Grep/Glob/Bash/Edit/Write` -> Codex `exec_command`, `rg`, shell file reads, and `apply_patch`.
- Claude `Agent` / `subagent_type` -> Codex `spawn_agent`, but only when the user explicitly asks for subagents, delegation, or parallel agent work.
- `/pipeline` and `/pp` are explicit delegated workflows because their documented purpose includes subagents/parallel workers.
- `/check`, code review, plan review, standards checks, routing checks, runtime checks, docs updates, and planning are local workflows unless the user explicitly asks to delegate them.
- Claude `tools`, `model`, and `allowed-tools` metadata are historical source metadata, not executable Codex config.

## Quick Selection

Open only the reference needed for the current request:

- User asks to formalize a vague task: `references/roles/task-formalizer.md`
- User asks for an implementation plan: `references/roles/planner.md`
- User asks to review a plan: `references/roles/plan-reviewer.md`
- User asks to review code: `references/roles/code-reviewer.md`
- User asks whether review coverage is complete: `references/roles/completeness-reviewer.md`
- User asks for standards check: `references/roles/standards-checker.md`
- User asks about file-based routing: `references/roles/file-based-routing-checker.md`
- User asks about runtime/architecture risks: `references/roles/runtime-architecture-checker.md`
- User asks to verify current changes or invokes `/check`: `references/workflows/check.md` and, as needed, `references/roles/verification-runner.md`
- User asks to update docs after code changes: `references/roles/docs-keeper.md`
- User wants pre-implementation discussion: `references/roles/discussion-architect.md`
- User invokes `/pipeline` or asks for the full delegated pipeline: `references/workflows/pipeline.md` and `references/roles/pipeline-orchestrator.md`
- User invokes `/pp` or asks for parallel agents: `references/workflows/pp.md`
- User invokes `/toprod`: `references/workflows/toprod.md`

For a full inventory, read `references/index.md`.

## Chatium Invariants

Keep these in active memory while working in this workspace:

- `ctx` and `app` are global; do not import them.
- Log with `ctx.account.log()`, not `console.log()`.
- File-based routing: one file is one route; prefer route path `'/'`.
- Route links must use `withProjectRoot(route.url())` or `withProjectRootAndSubroute(base, '/sub')`; avoid hardcoded URLs.
- Heap/tables are server-only. Vue may import only `shared/*` marked with `// @shared`; no `tables/`, `repos/`, or `lib/` in `.vue`.
- Use Heap `countBy`, `where`, and object `order` syntax. Do not use `findAll().length`, `filter`, or `{ field, direction }`.
- Use Money methods (`.add()`, `.subtract()`, `.multiply()`), not arithmetic operators.
- Use `runWithExclusiveLock` for real race conditions.
- Protected endpoints must start with `requireRealUser(ctx)` or `requireAccountRole(ctx, 'admin')`.
- `// @ts-ignore` is allowed only for Chatium system modules without local types.

## Date And Docs

When current date/time is needed for reports, changelog entries, or `docs/LLM/` files, run `date` through shell. Do not rely on model time.

After code changes in an app project root (`index.tsx` / `index.ts` with `docs/`), check whether README, `.CHATIUM-LLM.md`, `docs/architecture.md`, `docs/api.md`, `docs/data.md`, or `docs/LLM/` need updates. Use `docs-keeper` for substantial changes.
