# 0009: Discoverable touch navigation and intentional dialog focus

Status: accepted for implementation in #91; follows #90.

## Context

The single contextual control kept the chrome quiet, but touch navigation depended on discovering
a hold or swipe. A transparent primary action disappeared over cards. Immediately focusing a
dialog's first text field also summoned the phone keyboard and could trigger input zoom.

## Decision

- Keep one bottom control. A normal touch opens the route fan; its centre then runs the page
  action. Show Navigate and a compass while closed. Hold and swipe remain optional shortcuts.
- Preserve immediate primary activation with a mouse and the existing keyboard navigation.
- Give the control a solid theme colour, contrasting icon, separation ring and elevation.
- Replace both header utilities with the Common Ground logo. Its menu contains space switching,
  navigation, quick capture, unread notifications, settings, account tools and sign out.
- Complete a menu's close lifecycle before opening another focus-trapped surface. Restore
  focus through the surviving logo trigger.
- On coarse pointers, let dialogs focus Close. Focus a text field only when the person selects
  it. Keep the desktop typing shortcut and at least 16 px touch-input text. Preserve pinch zoom.
- Clip collapsed search contents so invisible form padding cannot widen the mobile viewport.

The minimum text size follows the same mobile Safari mitigation documented in
[Flutter's web accessibility guidance](https://docs.flutter.dev/ui/accessibility/web-accessibility).

## Consequences

The primary action takes two taps from a closed touch control. Navigation becomes available
without learning a gesture, and popups open without an unsolicited keyboard. The route fan,
search and existing page action callbacks stay shared across screen sizes.

Browser coverage checks real touch events, keyboard focus, viewport bounds, menu handoffs,
readable fields and repeated open/close cycles. Emulated profiles do not replace a physical
iPhone Safari check of its native keyboard and viewport behaviour.
