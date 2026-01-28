<!--
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║  IMPORTANT: CLAUDE.md is a SYMLINK to this file (AGENTS.md)               ║
  ║                                                                           ║
  ║  This ensures all AI agents (Claude, GPT, Gemini, etc.) read the same     ║
  ║  instructions. DO NOT:                                                    ║
  ║    - Delete CLAUDE.md (it will break Claude Code compatibility)           ║
  ║    - Replace the symlink with a separate file                             ║
  ║    - Create conflicting instructions in multiple files                    ║
  ║                                                                           ║
  ║  If you need to edit these instructions, edit THIS file (AGENTS.md).      ║
  ║  The symlink will automatically reflect the changes.                      ║
  ╚═══════════════════════════════════════════════════════════════════════════╝
-->

# Cerebras Code - AI Coding Agent

This is the source code for **Cerebras Code**, an AI-powered development tool that runs in the terminal.

## Quick Reference

- To run from source: `bun dev` (in `packages/opencode`)
- To run typecheck: `bun turbo typecheck`
- To build: `bun run build` (in `packages/opencode`)
- The main package is in `packages/opencode/`
- Config directories: `.cerebras/` (primary) or `.opencode/` (fallback)

## Development Guidelines

### Parallel Tool Usage

ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE. When multiple operations are independent, execute them simultaneously to improve performance.

### Key Directories

```
packages/
├── opencode/           # Main CLI package
│   ├── src/
│   │   ├── agent/      # Agent system
│   │   ├── cli/        # CLI commands and TUI
│   │   ├── config/     # Configuration loading
│   │   ├── provider/   # LLM providers
│   │   ├── session/    # Session management
│   │   └── tool/       # Tool implementations
│   └── package.json
├── console/            # Web console
└── sdk/                # SDK package
```

### Configuration

- Global config: `~/.config/cerebras/config.jsonc` (or `~/.config/opencode/`)
- Project config: `.cerebras/cerebras.jsonc` (or `.opencode/opencode.jsonc`)
- Skills: `.cerebras/skill/` or `.cerebras/skills/`
- Commands: `.cerebras/command/`
- Agents: `.cerebras/agent/`

### Important Files

| File | Purpose |
|------|---------|
| `docs/OPS.md` | Operations guide - read this if fixes don't take effect |
| `docs/ENVIRONMENT_VARIABLES.md` | All environment variables |
| `packages/opencode/src/flag/flag.ts` | Feature flags |
| `packages/opencode/src/config/config.ts` | Configuration loading |

## Operations Note

When testing changes, be aware of the two execution modes:

1. **Dev mode** (`bun dev`): Uses source files directly, changes take effect on restart
2. **Production mode** (compiled binary): Requires rebuild + reinstall

See `docs/OPS.md` for detailed debugging guidance.
