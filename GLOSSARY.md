# Milestone Generator

Staff draft the milestones of a learning challenge with AI help; a human reviews every AI proposal before anything is saved.

## Language

**Challenge**:
A learning unit defined by staff, consisting of a title and a brief, and owning an ordered set of Milestones.
_Avoid_: Course, project, task

**Brief**:
The free-text description of a Challenge that gives the AI its context.
_Avoid_: Description, prompt

**Draft Milestone**:
A proposed milestone (title + description) awaiting a Review Decision; never persisted. Usually AI-proposed; a staff-written one counts as already accepted, since writing it is the decision.
_Avoid_: Suggestion, proposal, generated milestone

**Review Decision**:
A staff member's verdict on one Draft Milestone: accepted (optionally after editing) or rejected. Skipping a draft in the review queue only defers it; it is not a Review Decision.
_Avoid_: Approval, status

**Milestone**:
A persisted step of a Challenge; only ever created from an accepted Draft Milestone.
_Avoid_: Step, goal
