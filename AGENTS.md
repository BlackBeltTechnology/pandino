# pandino

## Project Overview

<!-- One-paragraph description of what this project is. -->

## Code Instructions

Behavioral guidelines to reduce common coding mistakes. Bias toward caution over
speed. For trivial tasks, use judgment.

### 1. Think Before Coding

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- Never speculate about code you have not opened. Read the file first.
- Before any major change, confirm the plan.

### 2. Simplicity First

- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked; no abstractions for single-use code.
- No error handling for impossible scenarios.
- DRY: extract a shared helper when a pattern repeats; don't pre-extract for one call site.

### 3. Surgical Changes

- Touch only what you must. Match existing style.
- Don't refactor things that aren't broken.
- Remove imports/variables your changes made unused; leave pre-existing dead code (mention it).
- Every changed line traces directly to the request.

### 4. Goal-Driven Execution (TDD)

- Turn tasks into verifiable goals with explicit success criteria.
- Write or update tests first, verify they fail, then write the minimal implementation to pass.
- For multi-step tasks, state a brief plan with a verify step each.

### 5. Communication

- Give a high-level explanation of what changed — don't dump diffs without summary.

## Commands

<!-- Filled from the detected project stack; edit if your commands differ. -->

```bash
pnpm install --frozen-lockfile    # install dependencies
pnpm test       # run tests
pnpm build       # build
```

## OpenSpec

This project uses OpenSpec for spec-driven changes. Place change artifacts at
`openspec/changes/<name>/`. Prefer `openspec change new <name>` to scaffold.

When authoring a proposal, add a `## Discipline Skills` line to `proposal.md`
naming the `eng-disciplines` skills its tasks will trigger (mapped via the
checkpoint table below); omit only when none apply. This needs no edit to any
openspec skill — the implement loop reads the proposal artifact unchanged, so
the named skills enter its context and get invoked.

## Discipline Skills

During implementation, invoke the matching `eng-disciplines` skill when a task
signal appears. Skills auto-trigger on natural language, but the implement loop
may never utter the phrase — this table makes the mapping explicit (signals are
observable in the diff / `tasks.md`, not vague intent):

| Task signal (in diff / tasks.md)                                                       | Skill                           |
| -------------------------------------------------------------------------------------- | ------------------------------- |
| touches auth, untrusted input, secrets, webhooks, PII                                  | `security-hardening`            |
| spec has a latency/throughput budget, or a large-data / high-traffic path              | `performance-optimization`      |
| new endpoint, job, external call, or "can't tell what happened in prod"                | `observability-instrumentation` |
| non-trivial/irreversible step (migration, public API, cross-boundary) BEFORE it stands | `doubt-driven-review`           |
| a bug surfaces mid-implementation                                                      | `systematic-debugging`          |
| runtime state opaque, `console.log` insufficient                                       | `node-inspect-debugger`         |
| feature works + tests pass but the implementation feels heavy                          | `code-simplification`           |

The end gates (`code-review`, `code-quality`) remain unchanged and run at completion before commit.

<!-- dox-doctrine -->

## Documentation Update Protocol (WRITE discipline)

Per-directory `AGENTS.md` files form a tree. Each directory `AGENTS.md` is the
per-file record for the files in that directory. The ROOT `AGENTS.md` holds
doctrine + architecture pointers only — never a per-file index.

**Route every doc update by kind:**

| Kind of update                                                   | Goes in                                       |
| ---------------------------------------------------------------- | --------------------------------------------- |
| New file in a directory, or its per-file detail / change history | Nearest directory `AGENTS.md`. Add a ``       | `<basename>` | <purpose> | `` row, path-alphabetical. |
| Data flow, protocol, architecture rationale                      | `docs/architecture.md` or a `docs/<topic>.md` |
| End-user / developer setup                                       | `README.md`                                   |
| Cross-cutting rule every agent needs every turn (rare)           | ROOT `AGENTS.md`                              |

**Read before editing (chain walk).** Before editing a file, read the nearest
`AGENTS.md` chain root→leaf so you know the file's recorded purpose, contracts,
and change history. Do not edit blind.

**Update after editing (closeout pass).** After changing a file, update its row
in the nearest directory `AGENTS.md`: find the file's row, update its purpose in
place; if absent, add it in path-alphabetical order. New directory → scaffold
its `AGENTS.md`. One row per file. The purpose carries a one-line summary, key
exported symbols, contracts/invariants, and `See change: <id>` history.

**Row style (caveman).** Short declarative fragments. Drop articles. Subject →
verb → object, present tense. One fact per row. Prefer concrete tokens (paths,
symbols, env vars) over prose. Keep identifiers verbatim.

**Size rule — split an over-large directory `AGENTS.md` file-based.** pi
auto-injects a directory `AGENTS.md` on every turn when cwd sits at/below it, so
an over-large directory `AGENTS.md` (past a byte cap — typically a flat
directory holding many files) is not supported. Split it file-based: a row
exceeding the length threshold promotes to a per-file `<File>.AGENTS.md`
sidecar carrying that file's full detail (including every `See change:`). The
sidecar is pull-only — its name is not `AGENTS.md`, so pi never auto-injects it
— yet it stays search-indexed (`agents` doc_type). The directory `AGENTS.md`
keeps a one-line summary plus a `→ see `<File>.AGENTS.md`` pointer. Rows within
the threshold stay verbatim (lossless).

## Finding docs (READ discipline)

For any "where is X" / "how does Y work" / "what files relate to X" question,
consult the doc tree BEFORE grepping source:

1. `kb agents <path>` — returns the root→nearest `AGENTS.md` chain for a file or
   directory (the cheapest map: one-line purpose + key exports + change history
   per file).
2. `kb_search "<terms>"` — full-text search across the indexed markdown tree.
3. Only then open source for the few files that matter.

Grepping source before checking the tree wastes tokens and risks hallucinated
answers. Fall through to `rg` / manual search only when the tree misses — then
add the missing row per the WRITE discipline.

| `CHANGELOG.agent.md` | Digest of `CHANGELOG.md` (pull-only sidecar). |
| `CHANGELOG.md` | |
| `CLAUDE.md` | |
| `CONTRIBUTING.md` | |
| `README.md` | |
| `docs/AGENTS.md` | → see `docs/AGENTS.md` (pattern & how-to guides). |
| `docs-site/AGENTS.md` | → see `docs-site/AGENTS.md` (VitePress docs site index). |
| `packages/AGENTS.md` | → see `packages/AGENTS.md` (workspace package records). |
