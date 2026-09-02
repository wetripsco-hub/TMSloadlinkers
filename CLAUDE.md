# Turvo Clone Agent Instructions

## Mandatory Preflight

Before reading implementation files or touching code, read:

`graphify-out/GRAPH_REPORT.md`

Use its navigation hubs and dependency relationships to choose the smallest relevant code path. Check graph freshness against `git rev-parse HEAD`; after code changes, run `graphify update .` when available.

## Working Rules

- Inspect the nearest owning abstraction, call site, or test before editing.
- State one falsifiable hypothesis and one cheap check that could disconfirm it, then act.
- Keep changes minimal and local. Preserve public APIs, existing patterns, and unrelated user work.
- Do not guess through ambiguity that affects architecture or behavior. Ask for clarification or report the blocker.
- Use ASCII by default, two-space TypeScript indentation, strict types, named exports, PascalCase components, and camelCase utilities.
- Do not add comments unless they explain genuinely non-obvious logic.
- Do not commit, reset, checkout, or create branches unless explicitly requested.

## Implementation Workflow

1. Read the graph report, then inspect the relevant local code and nearby tests.
2. For multi-step work, write a short plan with independently verifiable tasks.
3. For behavior changes, use a focused test-first or reproduce-first loop: establish the failure, make the smallest fix, and cover the regression.
4. After the first substantive edit, immediately run the narrowest executable validation available. Repair that slice and rerun it before widening scope.
5. Before completion, run the relevant project checks, inspect the diff/status, and report what was verified and any residual risk.

## Debugging

Reproduce the failure, trace it to the controlling code path, form a root-cause hypothesis, run a discriminating check, fix the cause, and verify both the original failure and the regression case. Avoid symptom-only patches and unrelated cleanup.

## Review

Review the actual diff against the request and local conventions. Findings come first and are ordered by severity: critical, important, minor. Include file links and concrete evidence. Reviewers are read-only and must not modify the tree or dispatch another reviewer. Fix critical/important findings, then rerun focused checks.

## Parallel Work

Use isolated worktrees/branches for independent parallel implementation. Give each worker a precise task, relevant context, and a verification contract. Reconcile changes only after each result is checked; never let parallel work overwrite unrelated edits.

## Repository Contract

- Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui, and Lucide React.
- Node.js `>=24`.
- Primary commands: `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run check`.
- This is a website reverse-engineering project: match the target’s content, assets, layout, responsive behavior, states, and interactions before customization. Use real extracted assets, not placeholders.
- Keep the established `src/app`, `src/components`, `src/hooks`, `src/lib`, `src/types`, and `public` structure. Prefer existing components and utilities.
- For frontend work, preserve the target design language; use responsive mobile-first layouts, stable dimensions, accessible controls, Lucide icons, and meaningful motion. Avoid generic marketing layouts, purple-on-white defaults, nested cards, decorative blobs, and text that explains the UI instead of being the UI.

## Completion Gate

Do not claim completion without executable evidence. Confirm the requested behavior, run the narrowest relevant test or check, then run `npm run check` when the environment permits. Mention unavailable checks explicitly. Update the graph after code changes so the next task starts with current architecture context.
