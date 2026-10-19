# Case Study for Louis: Full Stack Engineer (f/m/x)

> Note: original Notion page was headed "Head of Sales Case Study" — likely a template leftover.

## Format

**Total slot: 40 min, remote.**

- 15 min — prepared presentation
- 15 min — structured drill-down
- 10 min — unprepared block

## Briefing: AI Milestone Generator ✨

### Context

We build learning products where staff define **challenges** made up of **milestones**. We use AI to help draft content, but humans must review everything before anything is saved. 👀✅

### Task

Build a small web app with the following flow:

1. **Input** 📝 — form with:
   - Challenge title
   - Challenge brief (free text)
2. **Generate** ✨ — a **"Generate milestones"** button that:
   - Calls an LLM using a **hardcoded system prompt** that you write
   - Sends the challenge title + brief as context
   - Expects **structured output** (e.g. 3–5 milestones, each with `title` and `description`)
3. **Review** 🔍 — show the proposed milestones as cards. Staff can:
   - Accept ✅
   - Reject ❌
   - Edit ✏️ (title/description)
4. **Save** 💾 — persist **accepted** milestones to the challenge (DB, JSON file, or in-memory — your choice; please document your approach)

### Deliverables

- Runnable app 🚀
- Short README covering:
  - Setup
  - Stack choice
  - Prompt + schema approach
  - Failure handling
- Optional: tests for validation logic 🧪

### Constraints

- TypeScript preferred; stack otherwise your choice
- No auth required
- AI tools are absolutely fine 🤖 — we'll discuss your design decisions and trade-offs in the interview
