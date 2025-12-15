# README Update Rule

## ⚠️ MANDATORY: Update README with Every Commit

Every commit MUST update the `README.md` file under the **"Commits Categorized by Strategic Pillars"** section.

---

## How to Update

### 1. Determine Which Pillar Your Change Belongs To:

#### **Pillar 1: Idea Stack (Infrastructure & Architecture)**
- Architecture changes
- Infrastructure setup
- CI/CD configuration
- Provider systems
- Build tools
- Package management
- Git hooks

#### **Pillar 2: TUI Features (User Interface & Experience)**
- UI/UX improvements
- TUI components
- Dialogs and modals
- Keyboard shortcuts
- Visual feedback
- User interactions
- Metrics display in UI

#### **Pillar 3: SDK Level Features (Core Functionality & API)**
- Core functionality
- API changes
- Authentication systems
- Retry logic
- SDK implementations
- Request/response handling
- Error handling

#### **Pillar 4: Experiment and Reporting (Metrics & Analytics)**
- Metrics collection
- Logging systems
- Experimentation tracking
- Analytics
- Reporting tools
- Usage statistics

---

### 2. Add Your Commit to the README

**Location:** Near the top of `README.md`, under "Commits Categorized by Strategic Pillars"

**Format:**
```markdown
- **[commit-hash]** - [Brief description] ([key details])
```

**Example:**
```markdown
- **a1b2c3d4e** - Add cache display to sidebar (93% hit rate visualization)
```

---

### 3. Placement Rules

- Add **new commits at the TOP** of their pillar section (most recent first)
- Keep entries concise (one line)
- Include commit hash (first 9 characters)
- Mention key metrics if applicable (lines changed, files added, etc.)

---

## Example Workflow

```bash
# 1. Make your changes
git add .

# 2. Commit with descriptive message
git commit -m "add cache display to sidebar"

# 3. Get your commit hash
git log -1 --format=%h

# 4. Update README.md under appropriate pillar
# Add line: - **abc123def** - Add cache display to sidebar (shows 93% cache hit rate)

# 5. Amend your commit to include README update
git add README.md
git commit --amend --no-edit

# 6. Push
git push
```

---

## Why This Matters

1. **Transparency:** Everyone can see what's been done at a glance
2. **Organization:** Changes are categorized by strategic focus
3. **History:** Complete record of all improvements
4. **Planning:** Easy to see which pillars need attention

---

## Enforcement

This rule is enforced by:
- Git pre-push hooks (warning if README not updated)
- Code review process
- Team accountability

**If you forget:** The pre-push hook will remind you to update the README before pushing.

---

## Questions?

Ask any collaborator:
- Kevin
- Isaac
- Daniel
- Arihant
