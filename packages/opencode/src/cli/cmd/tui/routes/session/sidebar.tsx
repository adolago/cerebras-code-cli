import { useSync } from "@tui/context/sync"
import { createMemo, For, Show, Switch, Match } from "solid-js"
import { createStore } from "solid-js/store"
import { useTheme } from "../../context/theme"
import { Locale } from "@/util/locale"
import path from "path"
import type { AssistantMessage } from "@opencode-ai/sdk/v2"
import { Global } from "@/global"
import { Installation } from "@/installation"
import { useKeybind } from "../../context/keybind"
import { useDirectory } from "../../context/directory"

export function Sidebar(props: { sessionID: string }) {
  const sync = useSync()
  const { theme } = useTheme()
  const session = createMemo(() => sync.session.get(props.sessionID)!)
  const diff = createMemo(() => sync.data.session_diff[props.sessionID] ?? [])
  const todo = createMemo(() => sync.data.todo[props.sessionID] ?? [])
  const messages = createMemo(() => sync.data.message[props.sessionID] ?? [])

  const [expanded, setExpanded] = createStore({
    mcp: true,
    diff: true,
    todo: true,
    lsp: true,
  })

  // Sort MCP servers alphabetically for consistent display order
  const mcpEntries = createMemo(() => Object.entries(sync.data.mcp).sort(([a], [b]) => a.localeCompare(b)))

  const usage = createMemo(() => {
    const now = Date.now()
    const assistants = messages().filter((m) => m.role === "assistant")
    const total = assistants.length
    const countWithin = (ms: number) =>
      assistants.filter((m) => {
        const t = m.time?.completed ?? m.time?.updated ?? m.time?.created ?? 0
        return now - t <= ms
      }).length
    return {
      total,
      min1: countWithin(60_000),
      hour1: countWithin(60 * 60_000),
      day1: countWithin(24 * 60 * 60_000),
    }
  })

  const context = createMemo(() => {
    const last = messages().findLast((x) => x.role === "assistant" && x.tokens.output > 0) as AssistantMessage
    if (!last) return
    const total =
      last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
    const model = sync.data.provider.find((x) => x.id === last.providerID)?.models[last.modelID]
    return {
      tokens: total.toLocaleString(),
      percentage: model?.limit.context ? Math.round((total / model.limit.context) * 100) : null,
    }
  })

  // Cache hit rate tracking
  const cacheMetrics = createMemo(() => {
    const assistantMessages = messages().filter((m) => m.role === "assistant" && m.tokens.output > 0) as AssistantMessage[]

    // Calculate current cache hit rate from the last message
    const last = assistantMessages[assistantMessages.length - 1]
    const currentHitRate = last?.tokens.input > 0
      ? ((last.tokens.cache.read / last.tokens.input) * 100)
      : 0

    // Calculate historical cache hit rates for graphing (last 20 messages)
    const history = assistantMessages.slice(-20).map((msg, idx) => {
      const hitRate = msg.tokens.input > 0
        ? ((msg.tokens.cache.read / msg.tokens.input) * 100)
        : 0
      return {
        index: idx,
        hitRate: hitRate,
        cachedTokens: msg.tokens.cache.read,
        totalInputTokens: msg.tokens.input,
      }
    })

    // Calculate average hit rate across all messages
    const avgHitRate = assistantMessages.length > 0
      ? assistantMessages.reduce((sum, msg) => {
          const rate = msg.tokens.input > 0 ? ((msg.tokens.cache.read / msg.tokens.input) * 100) : 0
          return sum + rate
        }, 0) / assistantMessages.length
      : 0

    return {
      current: currentHitRate,
      average: avgHitRate,
      history,
      lastCached: last?.tokens.cache.read ?? 0,
      lastTotal: last?.tokens.input ?? 0,
    }
  })

  const keybind = useKeybind()
  const directory = useDirectory()

  const hasProviders = createMemo(() =>
    sync.data.provider.some((x) => x.id !== "opencode" || Object.values(x.models).some((y) => y.cost?.input !== 0)),
  )

  // Generate a sparkline graph for cache hit rates
  const createSparkline = (history: Array<{ hitRate: number }>) => {
    if (history.length === 0) return ""
    const bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"]
    const max = Math.max(...history.map(h => h.hitRate), 1)
    return history.map(h => {
      const normalized = h.hitRate / max
      const index = Math.min(Math.floor(normalized * bars.length), bars.length - 1)
      return bars[index]
    }).join("")
  }

  return (
    <Show when={session()}>
      <box
        backgroundColor={theme.backgroundPanel}
        width={42}
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={2}
        paddingRight={2}
      >
        <scrollbox flexGrow={1}>
          <box flexShrink={0} gap={1} paddingRight={1}>
            <box>
              <text fg={theme.text}>
                <b>{session().title}</b>
              </text>
              <Show when={session().share?.url}>
                <text fg={theme.textMuted}>{session().share!.url}</text>
              </Show>
            </box>
            <box>
              <text fg={theme.text}>
                <b>Context</b>
              </text>
              <text fg={theme.textMuted}>{context()?.tokens ?? 0} tokens</text>
              <text fg={theme.textMuted}>{context()?.percentage ?? 0}% used</text>
              <text fg={theme.textMuted}>
                Requests: {usage().total} (1m {usage().min1} / 1h {usage().hour1} / 24h {usage().day1})
              </text>
            </box>
            <Show when={cacheMetrics().lastTotal > 0}>
              <box>
                <text fg={theme.text}>
                  <b>Cache Hit Rate</b>
                </text>
                <text fg={theme.textMuted}>
                  Current: {cacheMetrics().current.toFixed(1)}% ({cacheMetrics().lastCached}/{cacheMetrics().lastTotal} tokens)
                </text>
                <text fg={theme.textMuted}>
                  Average: {cacheMetrics().average.toFixed(1)}%
                </text>
                <Show when={cacheMetrics().history.length > 1}>
                  <text fg={theme.textMuted}>
                    Trend: <span style={{ fg: theme.success }}>{createSparkline(cacheMetrics().history)}</span>
                  </text>
                  <text fg={theme.textMuted} style={{ fontSize: "0.8em" }}>
                    ← Last {cacheMetrics().history.length} requests
                  </text>
                </Show>
              </box>
            </Show>
            <Show when={mcpEntries().length > 0}>
              <box>
                <box
                  flexDirection="row"
                  gap={1}
                  onMouseDown={() => mcpEntries().length > 2 && setExpanded("mcp", !expanded.mcp)}
                >
                  <Show when={mcpEntries().length > 2}>
                    <text fg={theme.text}>{expanded.mcp ? "▼" : "▶"}</text>
                  </Show>
                  <text fg={theme.text}>
                    <b>MCP</b>
                  </text>
                </box>
                <Show when={mcpEntries().length <= 2 || expanded.mcp}>
                  <For each={mcpEntries()}>
                    {([key, item]) => (
                      <box flexDirection="row" gap={1}>
                        <text
                          flexShrink={0}
                          style={{
                            fg: (
                              {
                                connected: theme.success,
                                failed: theme.error,
                                disabled: theme.textMuted,
                                needs_auth: theme.warning,
                                needs_client_registration: theme.error,
                              } as Record<string, typeof theme.success>
                            )[item.status],
                          }}
                        >
                          •
                        </text>
                        <text fg={theme.text} wrapMode="word">
                          {key}{" "}
                          <span style={{ fg: theme.textMuted }}>
                            <Switch fallback={item.status}>
                              <Match when={item.status === "connected"}>Connected</Match>
                              <Match when={item.status === "failed" && item}>{(val) => <i>{val().error}</i>}</Match>
                              <Match when={item.status === "disabled"}>Disabled</Match>
                              <Match when={(item.status as string) === "needs_auth"}>Needs auth</Match>
                              <Match when={(item.status as string) === "needs_client_registration"}>
                                Needs client ID
                              </Match>
                            </Switch>
                          </span>
                        </text>
                      </box>
                    )}
                  </For>
                </Show>
              </box>
            </Show>
            <box>
              <box
                flexDirection="row"
                gap={1}
                onMouseDown={() => sync.data.lsp.length > 2 && setExpanded("lsp", !expanded.lsp)}
              >
                <Show when={sync.data.lsp.length > 2}>
                  <text fg={theme.text}>{expanded.lsp ? "▼" : "▶"}</text>
                </Show>
                <text fg={theme.text}>
                  <b>LSP</b>
                </text>
              </box>
              <Show when={sync.data.lsp.length <= 2 || expanded.lsp}>
                <Show when={sync.data.lsp.length === 0}>
                  <text fg={theme.textMuted}>LSPs will activate as files are read</text>
                </Show>
                <For each={sync.data.lsp}>
                  {(item) => (
                    <box flexDirection="row" gap={1}>
                      <text
                        flexShrink={0}
                        style={{
                          fg: {
                            connected: theme.success,
                            error: theme.error,
                          }[item.status],
                        }}
                      >
                        •
                      </text>
                      <text fg={theme.textMuted}>
                        {item.id} {item.root}
                      </text>
                    </box>
                  )}
                </For>
              </Show>
            </box>
            <Show when={todo().length > 0 && todo().some((t) => t.status !== "completed")}>
              <box>
                <box
                  flexDirection="row"
                  gap={1}
                  onMouseDown={() => todo().length > 2 && setExpanded("todo", !expanded.todo)}
                >
                  <Show when={todo().length > 2}>
                    <text fg={theme.text}>{expanded.todo ? "▼" : "▶"}</text>
                  </Show>
                  <text fg={theme.text}>
                    <b>Todo</b>
                  </text>
                </box>
                <Show when={todo().length <= 2 || expanded.todo}>
                  <For each={todo()}>
                    {(todo) => (
                      <text style={{ fg: todo.status === "in_progress" ? theme.success : theme.textMuted }}>
                        [{todo.status === "completed" ? "✓" : " "}] {todo.content}
                      </text>
                    )}
                  </For>
                </Show>
              </box>
            </Show>
            <Show when={diff().length > 0}>
              <box>
                <box
                  flexDirection="row"
                  gap={1}
                  onMouseDown={() => diff().length > 2 && setExpanded("diff", !expanded.diff)}
                >
                  <Show when={diff().length > 2}>
                    <text fg={theme.text}>{expanded.diff ? "▼" : "▶"}</text>
                  </Show>
                  <text fg={theme.text}>
                    <b>Modified Files</b>
                  </text>
                </box>
                <Show when={diff().length <= 2 || expanded.diff}>
                  <For each={diff() || []}>
                    {(item) => {
                      const file = createMemo(() => {
                        const splits = item.file.split(path.sep).filter(Boolean)
                        const last = splits.at(-1)!
                        const rest = splits.slice(0, -1).join(path.sep)
                        if (!rest) return last
                        return Locale.truncateMiddle(rest, 30 - last.length) + "/" + last
                      })
                      return (
                        <box flexDirection="row" gap={1} justifyContent="space-between">
                          <text fg={theme.textMuted} wrapMode="char">
                            {file()}
                          </text>
                          <box flexDirection="row" gap={1} flexShrink={0}>
                            <Show when={item.additions}>
                              <text fg={theme.diffAdded}>+{item.additions}</text>
                            </Show>
                            <Show when={item.deletions}>
                              <text fg={theme.diffRemoved}>-{item.deletions}</text>
                            </Show>
                          </box>
                        </box>
                      )
                    }}
                  </For>
                </Show>
              </box>
            </Show>
          </box>
        </scrollbox>

        <box flexShrink={0} gap={1} paddingTop={1}>
          <Show when={!hasProviders()}>
            <box
              backgroundColor={theme.backgroundElement}
              paddingTop={1}
              paddingBottom={1}
              paddingLeft={2}
              paddingRight={2}
              flexDirection="row"
              gap={1}
            >
              <text flexShrink={0}>⬖</text>
              <box flexGrow={1} gap={1}>
                <text>
                  <b>Getting started</b>
                </text>
                <text fg={theme.textMuted}>OpenCode includes free models so you can start immediately.</text>
                <text fg={theme.textMuted}>
                  Connect from 75+ providers to use other models, including Claude, GPT, Gemini etc
                </text>
                <box flexDirection="row" gap={1} justifyContent="space-between">
                  <text>Connect provider</text>
                  <text fg={theme.textMuted}>/connect</text>
                </box>
              </box>
            </box>
          </Show>
          <text fg={theme.text}>{directory()}</text>
          <text fg={theme.textMuted}>
            <span style={{ fg: theme.success }}>•</span> <b>Open</b>
            <span style={{ fg: theme.text }}>
              <b>Code</b>
            </span>{" "}
            <span>{Installation.VERSION}</span>
          </text>
        </box>
      </box>
    </Show>
  )
}
