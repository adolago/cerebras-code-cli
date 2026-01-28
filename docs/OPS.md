# Cerebras Code Operations Guide

> **CRITICAL:** The biggest source of confusion when debugging is **not knowing which binary is running**. Fixes made to source code won't take effect if:
>
> 1. You're running `bun run dev` (dev mode) instead of the compiled binary
> 2. The TUI was started before the binary was updated

## Quick Reference

| Command | Purpose |
| ------- | ------- |
| `bun run dev --print-logs` | Run from source (dev mode) |
| `bun run build` | Compile binary |
| `bun link` | Link binary to `~/.bun/bin/opencode` |
| `pgrep -af opencode` | Show running processes |

## The Two Execution Modes

### 1. Development Mode (`bun run dev`)

```bash
cd packages/opencode
bun run dev --print-logs
```

**Characteristics:**

- Runs directly from TypeScript source
- Changes take effect on restart (no build needed)
- Process shows as: `bun run dev --print-logs` or similar
- Useful for rapid iteration

**How to identify:**

```bash
pgrep -af "bun.*opencode"
```

### 2. Production Mode (Compiled Binary)

```bash
~/.bun/bin/opencode --print-logs
```

**Characteristics:**

- Runs from compiled binary at `~/.bun/bin/opencode`
- Requires rebuild (`bun run build`) and re-link (`bun link`) to take effect
- Process shows as: `/home/user/.bun/bin/opencode`
- What gets deployed and used in production

**How to identify:**

```bash
pgrep -af "/.bun/bin/opencode"
```

## Why Fixes "Don't Take Effect"

### Root Cause Analysis

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WHY FIXES DON'T TAKE EFFECT                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  You edit: packages/opencode/src/foo.ts                                │
│                                                                         │
│  BUT your TUI is running:                                               │
│                                                                         │
│  CASE A: bun run dev (dev mode)                                         │
│  ├── Process: bun run ./src/index.ts                                    │
│  ├── Uses: Source files directly                                        │
│  └── Fix: Just restart the TUI                                          │
│                                                                         │
│  CASE B: ~/.bun/bin/opencode (compiled binary)                          │
│  ├── Process: /home/user/.bun/bin/opencode                              │
│  ├── Uses: Bundled code from WHEN IT WAS BUILT                          │
│  └── Fix: Must rebuild + bun link, then restart                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Common Mistakes

| Mistake | Why It Happens | Fix |
| ------- | -------------- | --- |
| Edit source, but TUI uses old code | Running compiled binary, not dev mode | Rebuild and restart |
| Binary says "Text file busy" | Process still using the file | Kill ALL opencode processes first |
| Changes work in dev, not prod | Forgot to rebuild | Run `bun run build && bun link` |

## Debugging Checklist

When a fix doesn't take effect, check in order:

- [ ] **1. Which mode am I running?**

  ```bash
  pgrep -af "bun.*opencode"        # Dev mode
  pgrep -af "/.bun/bin/opencode"   # Compiled binary
  ```

- [ ] **2. When was the binary built?**

  ```bash
  ls -la ~/.bun/bin/opencode
  ls -la packages/opencode/dist/opencode-linux-x64/bin/opencode
  ```

- [ ] **3. When was the source file modified?**

  ```bash
  ls -la packages/opencode/src/path/to/file.ts
  ```

- [ ] **4. Is source newer than binary?**
  If the source file's modification time is newer than the binary, rebuild is needed.

- [ ] **5. Nuclear option - kill everything and restart**
  ```bash
  pkill -f opencode
  cd packages/opencode && bun run build && bun link
  opencode --print-logs
  ```

## Location Reference

| What | Path |
| ---- | ---- |
| Source repository | Project root |
| Package source | `packages/opencode/src/` |
| Compiled binary | `~/.bun/bin/opencode` |
| Build output | `packages/opencode/dist/opencode-linux-x64/bin/opencode` |
| Config directory | `~/.config/cerebras/` (primary) or `~/.config/opencode/` (fallback) |
| Project config | `.cerebras/cerebras.jsonc` (primary) or `.opencode/opencode.jsonc` (fallback) |

## Building and Installing

### Full Rebuild

```bash
cd packages/opencode
bun run build
bun link
```

### Quick Dev Iteration

```bash
# Just restart dev mode - no build needed
pkill -f "bun.*opencode"
cd packages/opencode && bun run dev --print-logs
```

## Process Hierarchy

```
When running bun run dev:

  shell
    └── bun run dev --print-logs
          └── bun run ./src/index.ts (child)

When running compiled binary:

  shell
    └── /home/user/.bun/bin/opencode --print-logs
```

## Version Verification

To verify which version is running:

```bash
# Check binary version
opencode --version

# Compare with source
git describe --tags --always
```

If versions don't match, rebuild is needed.
