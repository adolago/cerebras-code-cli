# Environment Variables Reference

Complete reference for environment variables in Cerebras Code.

---

## Configuration Flags

All flags support both `CEREBRAS_CODE_*` (primary) and `OPENCODE_*` (fallback) prefixes for backwards compatibility.

| Variable | Type | Description |
|----------|------|-------------|
| `CEREBRAS_CODE_CONFIG` | Path | Override config file path |
| `CEREBRAS_CODE_CONFIG_DIR` | Path | Override config directory |
| `CEREBRAS_CODE_CONFIG_CONTENT` | String | Inline config JSON content |
| `CEREBRAS_CODE_PERMISSION` | String | Permission mode override |
| `CEREBRAS_CODE_AUTO_SHARE` | Boolean | Auto-share sessions |
| `CEREBRAS_CODE_DISABLE_AUTOUPDATE` | Boolean | Disable auto-update checks |
| `CEREBRAS_CODE_DISABLE_PRUNE` | Boolean | Disable automatic pruning |
| `CEREBRAS_CODE_DISABLE_AUTOCOMPACT` | Boolean | Disable automatic compaction |
| `CEREBRAS_CODE_DISABLE_DEFAULT_PLUGINS` | Boolean | Disable built-in plugins |
| `CEREBRAS_CODE_DISABLE_CLAUDE_CODE_SKILLS` | Boolean | Disable Claude Code skills |
| `CEREBRAS_CODE_DISABLE_LSP_DOWNLOAD` | Boolean | Disable LSP binary downloads |
| `CEREBRAS_CODE_ENABLE_EXPERIMENTAL_MODELS` | Boolean | Enable experimental models |
| `CEREBRAS_CODE_FAKE_VCS` | String | Simulate VCS for testing |
| `CEREBRAS_CODE_EXPERIMENTAL_BASH_MAX_OUTPUT_LENGTH` | Number | Max bash output length |

### Experimental Flags

| Variable | Type | Description |
|----------|------|-------------|
| `CEREBRAS_CODE_EXPERIMENTAL` | Boolean | Enable all experimental features |
| `CEREBRAS_CODE_EXPERIMENTAL_WATCHER` | Boolean | Enable file watcher |
| `CEREBRAS_CODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT` | Boolean | Disable copy on select |
| `CEREBRAS_CODE_ENABLE_EXA` | Boolean | Enable Exa search integration |

---

## LLM Providers

### Anthropic

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API key for Claude models |

### OpenAI

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | API key for GPT models |

### Google

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Google API key for Gemini |
| `GEMINI_API_KEY` | Alternative Google API key |

### OpenRouter

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key |

### GitHub Copilot

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub token for Copilot |
| `GH_TOKEN` | Alternative GitHub token |

### Cerebras

| Variable | Description |
|----------|-------------|
| `CEREBRAS_API_KEY` | Cerebras Cloud API key |

### Other Providers

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key |
| `MISTRAL_API_KEY` | Mistral API key |
| `XAI_API_KEY` | xAI API key |
| `DEEPSEEK_API_KEY` | DeepSeek API key |

---

## Shell & Terminal

| Variable | Default | Description |
|----------|---------|-------------|
| `SHELL` | `bash` | Default shell for bash tool |
| `VISUAL` | - | Preferred visual editor |
| `EDITOR` | - | Fallback text editor |
| `TMUX` | - | Indicates running inside tmux |
| `WAYLAND_DISPLAY` | - | Wayland display (affects clipboard) |
| `TERM_PROGRAM` | - | Terminal program identifier |
| `VIRTUAL_ENV` | - | Active Python virtual environment |

---

## XDG Directories

| Variable | Default | Description |
|----------|---------|-------------|
| `XDG_CONFIG_HOME` | `~/.config` | Config directory (uses `cerebras/`) |
| `XDG_DATA_HOME` | `~/.local/share` | Data directory |
| `XDG_STATE_HOME` | `~/.local/state` | State directory |
| `XDG_CACHE_HOME` | `~/.cache` | Cache directory |

---

## IDE Integration

| Variable | Description |
|----------|-------------|
| `OPENCODE_CALLER` | IDE caller identifier (`vscode`, `vscode-insiders`) |
| `OPENCODE_ROUTE` | JSON route configuration for embedded mode |
| `GIT_ASKPASS` | Git credential helper path (used for VS Code detection) |

---

## GitHub Actions

| Variable | Description |
|----------|-------------|
| `MODEL` | Model override for CI |
| `GITHUB_RUN_ID` | GitHub Actions run ID |
| `SHARE` | Share session in CI |
| `PROMPT` | Custom prompt for automation |

---

## Network & Proxy

| Variable | Description |
|----------|-------------|
| `HTTP_PROXY` | HTTP proxy URL |
| `HTTPS_PROXY` | HTTPS proxy URL |
| `http_proxy` | HTTP proxy URL (lowercase) |
| `https_proxy` | HTTPS proxy URL (lowercase) |

---

## Internal Variables

These are set automatically by the runtime:

| Variable | Description |
|----------|-------------|
| `OPENCODE` | Set to `1` when Cerebras Code is running |
| `OPENCODE_API` | API endpoint for session sharing |
| `PATH` | Extended with LSP binary paths |

---

## Boolean Values

Boolean flags accept:
- **True**: `true`, `1` (case-insensitive)
- **False**: Any other value or unset

---

## Configuration Precedence

1. **Environment variables** (highest priority)
2. **Project config** (`.cerebras/cerebras.jsonc` or `.opencode/opencode.jsonc`)
3. **Global config** (`~/.config/cerebras/config.jsonc` or `~/.config/opencode/config.jsonc`)
4. **Defaults** (lowest priority)

---

## Usage Examples

### Minimal Setup

```bash
# Required for LLM functionality (one of these)
export ANTHROPIC_API_KEY="sk-ant-..."
# or
export OPENAI_API_KEY="sk-..."
# or
export CEREBRAS_API_KEY="..."

# Run Cerebras Code
opencode
```

### Development Setup

```bash
# Enable experimental features
export CEREBRAS_CODE_EXPERIMENTAL=true

# Disable auto-update checks
export CEREBRAS_CODE_DISABLE_AUTOUPDATE=true

# Custom config file
export CEREBRAS_CODE_CONFIG=/path/to/config.jsonc
```

### CI/Automation

```bash
# Override model for CI
export MODEL=anthropic/claude-sonnet-4-20250514

# Custom prompt
export PROMPT="Fix the failing tests"

# Share session
export SHARE=true
```

---

## Security Notes

1. **Never commit API keys** - Use environment variables or `.env` files
2. **`.env` files** are blocked from agent reading by default (security feature)
3. **Use `CEREBRAS_CODE_*` prefix** for new deployments (the `OPENCODE_*` prefix is for backwards compatibility only)

---

*Updated: 2026-01-28*
