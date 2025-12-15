# Complete List of Changes for Cache Display Implementation

## Overview
This document details **all changes** needed to get cache information from the Cerebras API to display in the sidebar with statistics.

---

## The Problem

**Issue:** Cerebras API uses OpenAI **Chat Completions** format, but OpenCode was built for OpenAI **Responses API** format.

**Key Difference:**
- **Chat Completions API**: Uses `prompt_tokens`, `completion_tokens`, `prompt_tokens_details`
- **Responses API**: Uses `input_tokens`, `output_tokens`, `input_tokens_details`

**Result:** Cache data from Cerebras (`prompt_tokens_details.cached_tokens`) was being ignored.

---

## Data Flow (Before Changes)

```
Cerebras API Response
{
  "usage": {
    "prompt_tokens": 3000,              ← Not parsed
    "prompt_tokens_details": {
      "cached_tokens": 2800              ← Lost!
    }
  }
}
           ↓
OpenCode SDK (expects input_tokens)
           ↓
Schema validation fails / fields = undefined
           ↓
cachedInputTokens = undefined
           ↓
Sidebar: cache.read = 0                 ← No cache data!
```

---

## Data Flow (After Changes)

```
Cerebras API Response
{
  "usage": {
    "prompt_tokens": 3000,
    "prompt_tokens_details": {
      "cached_tokens": 2800
    }
  }
}
           ↓
OpenCode SDK (now accepts BOTH formats)
cachedInputTokens = 2800                ← Extracted!
           ↓
Session.getUsage()
tokens.cache.read = 2800                ← Stored!
           ↓
Database (SQLite)
message.tokens.cache.read = 2800        ← Persisted!
           ↓
Sidebar calculation
cacheHitRate = 93%                      ← Calculated!
           ↓
Sidebar UI
⚡ 2,800 cached (93%)                   ← Displayed!
```

---

## Changes Required

### **Change 1: Update API Response Schema**

**File:** `packages/opencode/src/provider/sdk/openai-compatible/src/responses/openai-responses-language-model.ts`

**Location:** Lines 1300-1305

**Current Code:**
```typescript
const usageSchema = z.object({
  input_tokens: z.number(),
  input_tokens_details: z.object({ cached_tokens: z.number().nullish() }).nullish(),
  output_tokens: z.number(),
  output_tokens_details: z.object({ reasoning_tokens: z.number().nullish() }).nullish(),
})
```

**New Code:**
```typescript
const usageSchema = z.object({
  // Support both OpenAI Responses API format (input_tokens) and Chat Completions format (prompt_tokens)
  input_tokens: z.number().optional(),
  prompt_tokens: z.number().optional(),
  input_tokens_details: z.object({ cached_tokens: z.number().nullish() }).nullish(),
  prompt_tokens_details: z.object({ cached_tokens: z.number().nullish() }).nullish(),
  output_tokens: z.number().optional(),
  completion_tokens: z.number().optional(),
  output_tokens_details: z.object({ reasoning_tokens: z.number().nullish() }).nullish(),
  completion_tokens_details: z.object({ reasoning_tokens: z.number().nullish() }).nullish(),
})
```

**Why:**
- Makes all fields optional (`.optional()`)
- Adds Chat Completions format fields (`prompt_tokens`, `completion_tokens`, etc.)
- Allows schema to accept responses from both API formats
- Backward compatible: existing Responses API calls still work

**Impact:** Schema validation no longer rejects Cerebras responses

---

### **Change 2: Update Non-Streaming Response Parser**

**File:** `packages/opencode/src/provider/sdk/openai-compatible/src/responses/openai-responses-language-model.ts`

**Location:** Lines 752-758

**Current Code:**
```typescript
usage: {
  inputTokens: response.usage.input_tokens,
  outputTokens: response.usage.output_tokens,
  totalTokens: response.usage.input_tokens + response.usage.output_tokens,
  reasoningTokens: response.usage.output_tokens_details?.reasoning_tokens ?? undefined,
  cachedInputTokens: response.usage.input_tokens_details?.cached_tokens ?? undefined,
},
```

**New Code:**
```typescript
usage: {
  inputTokens: response.usage.input_tokens ?? response.usage.prompt_tokens ?? 0,
  outputTokens: response.usage.output_tokens ?? response.usage.completion_tokens ?? 0,
  totalTokens: (response.usage.input_tokens ?? response.usage.prompt_tokens ?? 0) +
               (response.usage.output_tokens ?? response.usage.completion_tokens ?? 0),
  reasoningTokens: response.usage.output_tokens_details?.reasoning_tokens ??
                   response.usage.completion_tokens_details?.reasoning_tokens ?? undefined,
  cachedInputTokens: response.usage.input_tokens_details?.cached_tokens ??
                     response.usage.prompt_tokens_details?.cached_tokens ?? undefined,
},
```

**Why:**
- Uses nullish coalescing (`??`) to check both field names
- Falls back to Chat Completions format if Responses API format not present
- Extracts `cached_tokens` from either `input_tokens_details` or `prompt_tokens_details`
- Defaults to 0 if both are missing (prevents NaN)

**Impact:** `cachedInputTokens` now populated with Cerebras data

---

### **Change 3: Update Streaming Response Parser**

**File:** `packages/opencode/src/provider/sdk/openai-compatible/src/responses/openai-responses-language-model.ts`

**Location:** Lines 1232-1236

**Current Code:**
```typescript
usage.inputTokens = value.response.usage.input_tokens
usage.outputTokens = value.response.usage.output_tokens
usage.totalTokens = value.response.usage.input_tokens + value.response.usage.output_tokens
usage.reasoningTokens = value.response.usage.output_tokens_details?.reasoning_tokens ?? undefined
usage.cachedInputTokens = value.response.usage.input_tokens_details?.cached_tokens ?? undefined
```

**New Code:**
```typescript
usage.inputTokens = value.response.usage.input_tokens ?? value.response.usage.prompt_tokens ?? 0
usage.outputTokens = value.response.usage.output_tokens ?? value.response.usage.completion_tokens ?? 0
usage.totalTokens = (value.response.usage.input_tokens ?? value.response.usage.prompt_tokens ?? 0) +
                    (value.response.usage.output_tokens ?? value.response.usage.completion_tokens ?? 0)
usage.reasoningTokens = value.response.usage.output_tokens_details?.reasoning_tokens ??
                        value.response.usage.completion_tokens_details?.reasoning_tokens ?? undefined
usage.cachedInputTokens = value.response.usage.input_tokens_details?.cached_tokens ??
                          value.response.usage.prompt_tokens_details?.cached_tokens ?? undefined
```

**Why:**
- Same fix as Change 2, but for streaming responses
- Cerebras streaming responses also use Chat Completions format
- Ensures cache data captured in streaming mode

**Impact:** Cache stats work in both streaming and non-streaming modes

---

### **Change 4: Add Cache Calculation to Sidebar**

**File:** `packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx`

**Location:** Lines 48-58 (updating the `context` memo)

**Current Code:**
```typescript
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
```

**New Code:**
```typescript
const context = createMemo(() => {
  const last = messages().findLast((x) => x.role === "assistant" && x.tokens.output > 0) as AssistantMessage
  if (!last) return
  const total =
    last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
  const model = sync.data.provider.find((x) => x.id === last.providerID)?.models[last.modelID]

  // Calculate cache statistics
  const cachedTokens = last.tokens.cache.read
  const totalInput = last.tokens.input + cachedTokens
  const cacheHitRate = totalInput > 0 ? Math.round((cachedTokens / totalInput) * 100) : 0

  return {
    tokens: total.toLocaleString(),
    percentage: model?.limit.context ? Math.round((total / model.limit.context) * 100) : null,
    cache: {
      tokens: cachedTokens.toLocaleString(),
      hitRate: cacheHitRate,
    }
  }
})
```

**Why:**
- `cachedTokens`: Extract from `last.tokens.cache.read` (already populated by Changes 1-3)
- `totalInput`: Sum of fresh input tokens + cached tokens
- `cacheHitRate`: Percentage of input that came from cache
- Format tokens with commas for readability
- Return cache stats as part of context object

**Formula:** `cacheHitRate = (cachedTokens / (input + cachedTokens)) * 100`

**Example:**
```
input = 200 tokens (fresh)
cachedTokens = 2800 tokens (from cache)
totalInput = 3000 tokens
cacheHitRate = (2800 / 3000) * 100 = 93%
```

**Impact:** Cache statistics now calculated and available for display

---

### **Change 5: Display Cache Stats in Sidebar UI**

**File:** `packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx`

**Location:** Lines 88-96 (updating the Context display box)

**Current Code:**
```typescript
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
```

**New Code:**
```typescript
<box>
  <text fg={theme.text}>
    <b>Context</b>
  </text>
  <text fg={theme.textMuted}>{context()?.tokens ?? 0} tokens</text>
  <text fg={theme.textMuted}>{context()?.percentage ?? 0}% used</text>
  <text fg={theme.textMuted}>
    Requests: {usage().total} (1m {usage().min1} / 1h {usage().hour1} / 24h {usage().day1})
  </text>
  <Show when={context()?.cache && context()!.cache.hitRate > 0}>
    <text style={{
      fg: context()!.cache.hitRate > 80 ? theme.success : theme.warning
    }}>
      ⚡ {context()!.cache.tokens} cached ({context()!.cache.hitRate}%)
    </text>
  </Show>
</box>
```

**Why:**
- `<Show when={...}>`: Only display if cache data exists and hit rate > 0
- Color coding:
  - **Green** (`theme.success`): Hit rate > 80% (excellent caching)
  - **Yellow** (`theme.warning`): Hit rate ≤ 80% (moderate caching)
- `⚡` emoji: Visual indicator for cache performance
- Display format: `⚡ 2,800 cached (93%)`

**Visual Examples:**
```
⚡ 2,800 cached (93%)     ← Green (>80%)
⚡ 500 cached (45%)       ← Yellow (≤80%)
[hidden]                 ← No display if hitRate = 0
```

**Impact:** Users can now see cache performance in real-time

---

## Files Modified Summary

| File | Changes | Purpose |
|------|---------|---------|
| `openai-responses-language-model.ts` | 3 locations | Parse both API formats, extract cache data |
| `sidebar.tsx` | 2 locations | Calculate and display cache statistics |

**Total:** 5 changes across 2 files

---

## Testing the Changes

### 1. Verify API Parsing
```bash
# Run with verbose logging
CEREBRAS_API_KEY=your_key bun run packages/opencode/src/index.ts --verbose

# Look for cache tokens in logs
# Should see: cachedInputTokens: 2800
```

### 2. Verify Database Storage
```bash
# After a conversation with 2+ turns
sqlite3 ~/.opencode/sessions/[session-id]/session.db

# Query message tokens
SELECT tokens FROM message WHERE role = 'assistant' LIMIT 1;

# Expected output:
# {"input":200,"output":150,"reasoning":0,"cache":{"read":2800,"write":0}}
```

### 3. Verify Sidebar Display
```bash
# Start OpenCode and have a conversation
# After turn 2+, check the sidebar

# Expected display:
Context
12,345 tokens
45% used
Requests: 5 (1m 2 / 1h 5 / 24h 5)
⚡ 2,800 cached (93%)    ← Should appear in green
```

### 4. Test Edge Cases
```typescript
// No cache (first message)
// Sidebar should NOT show cache line

// Low cache hit rate (20%)
⚡ 100 cached (20%)      ← Should appear in yellow

// High cache hit rate (95%)
⚡ 5,000 cached (95%)    ← Should appear in green
```

---

## Why These Changes Work

### 1. **Backward Compatible**
- Existing OpenAI Responses API calls still work
- Schema accepts both formats
- No breaking changes to existing functionality

### 2. **Future Proof**
- Works with any provider using Chat Completions format
- Supports future API changes
- Extensible for new token types

### 3. **Zero Breaking Changes**
- All changes are additive
- Default values prevent undefined errors
- Graceful fallbacks throughout

### 4. **Performance Optimized**
- Uses memos for reactive updates
- Only recalculates when messages change
- Efficient conditional rendering

### 5. **User Experience**
- Visual feedback (color coding)
- Real-time updates
- Clear, actionable metrics

---

## Key Insights

### The Root Cause
**Problem:** Field name mismatch between API formats
- Cerebras: `prompt_tokens_details.cached_tokens`
- OpenCode expected: `input_tokens_details.cached_tokens`

### The Solution
**Strategy:** Support both formats using nullish coalescing
```typescript
// Try Responses API format first, fall back to Chat Completions format
response.usage.input_tokens_details?.cached_tokens ??
response.usage.prompt_tokens_details?.cached_tokens
```

### Why It's Minimal
Only 5 changes needed because:
1. OpenCode already had cache tracking infrastructure
2. Database schema already supported `cache.read` and `cache.write`
3. Only needed to fix the parsing layer and add display logic

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Cerebras API                            │
│  { "prompt_tokens_details": { "cached_tokens": 2800 } }     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          openai-responses-language-model.ts                 │
│  usageSchema: accepts both prompt_tokens & input_tokens     │
│  Parser: checks both field names → cachedInputTokens        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Session.getUsage()                         │
│  cachedInputTokens → tokens.cache.read                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│             SQLite Database (.opencode/)                    │
│  message.tokens = { cache: { read: 2800, write: 0 } }      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   sidebar.tsx                               │
│  1. Read last.tokens.cache.read                             │
│  2. Calculate hitRate = (cached / total) * 100              │
│  3. Format: "⚡ 2,800 cached (93%)"                        │
│  4. Color: green if >80%, yellow otherwise                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

### Potential Enhancements

1. **Cache Efficiency Over Time**
   - Track cache hit rate across conversation
   - Display trend (improving/declining)

2. **Cache Write Stats**
   - Show `cache.write` tokens
   - Indicate when new content is being cached

3. **Cost Savings Display**
   - Calculate cost savings from cache
   - Show: "Saved $0.15 from cache"

4. **Cache Health Score**
   - Aggregate metric across all messages
   - Warning if cache not being utilized

5. **Header Display**
   - Add cache stats to header.tsx
   - Compact inline format

---

## Related Commits

This implementation builds on commit **bde924a60**:
- Replaced pricing with request usage tracking
- Added foundation for metrics display
- Modified same files (sidebar.tsx, header.tsx)

---

## Conclusion

These 5 minimal changes enable complete cache visibility:
1. ✅ Schema accepts both API formats
2. ✅ Non-streaming parser extracts cache data
3. ✅ Streaming parser extracts cache data
4. ✅ Sidebar calculates cache statistics
5. ✅ Sidebar displays cache with visual feedback

**Result:** Seamless cache tracking from API → Database → UI with zero breaking changes.
