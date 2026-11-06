# 0010: Episodes first, with contextual floating actions

Status: accepted for implementation, pending design review

## Context

Title details showed synopsis, provider listings, reactions, progress and comments before an
episode could be selected. The episode picker was hidden behind a small split-button chevron.
The existing shell deliberately has one floating action control, with explicit touch discovery.

## Decision

- Keep the header compact. Series show a permanently visible episode list and native season
  select. Film headers can show a short synopsis. Full details use an About this title dialog.
- Use the existing playback scope and choices for both the visible list and the floating
  Play/Continue action. Browsing a season does not change the suggested continuation episode.
  Titles entered manually expose Update progress in the centre instead of an unrelated action.
  Selecting an episode brings the player into view and moves keyboard focus to its controls.
- Pages register contextual tools with the shared action registry. Title tools expose episodes,
  trailer, watch party and About, when available. Stable ordering handles asynchronous loading.
- Preserve one central control. Touch first reveals title tools, then the centre runs the primary
  action. Navigate switches the same fan to global routes; the logo's Navigate always opens routes.
  Keyboard arrows skip disabled tools, Escape closes and focus is restored before opening dialogs.
  Empty fan space lets clicks through. Inert and aria-hidden close the fan without delaying focus
  availability behind its visual animation.
- Hold or slide up on a closed FAB to reveal global routes. Captured touch movement highlights
  the physical destination, which activates once on release. An already open title fan also supports
  dragging between title tools. Release outside, pointer cancellation and losing capture cancel
  selection. Existing tap, hover and keyboard activation remain available. Visual hold and selection
  cues respect reduced motion, including removing transition delays.
- Put progress and discussion behind one native disclosure. Existing progress/discussion URLs
  open it automatically; spoiler protection and progress updates continue to use existing services.
- Disable provider listings and member availability-note fields using `TITLE_OPTIONS.availability`.
  Retain components, adapters, saved notes and form state so a later release can restore them.
  Editing another title field must preserve an existing availability note.

## Consequences

Episodes are usable without opening a menu. Secondary information takes a deliberate extra action.
The FAB's contextual tools do not add another persistent control or another navigation system.
Future pages can reuse the same tool registration instead of building route-specific floating menus.

Validation covers responsive layouts, visible rows, season selection, retry and empty states,
dialog handoffs, global navigation, keyboard focus, accessibility and the existing collaborative flows.
Browser automation does not establish native iOS Safari keyboard or playback behaviour.
