# Progressive navigation and universal search

## One floating control

The bottom-centre button runs the current page's primary action with a mouse click.
On touchscreens its visible Navigate label and compass invite a tap to reveal routes. The same
centre then shows the page action; a second tap runs it. No gesture is needed to discover navigation.
Watch adds a title, Notes writes a note, Ideas captures an idea, Calendar creates an event.
Title details play the film or next episode; idea and editable event details expose Edit.
The shell reuses each page's callback. Pages without a registered action retain quick capture.

The same control reveals the five destinations in a semicircle:

- Mouse: hover opens the fan; leaving closes it unless it was explicitly opened.
- Touch: tap opens routes. Hold for 450 ms or swipe up are optional shortcuts.
- Keyboard: focus or an arrow key opens routes; arrows, Home and End move between links.
- Escape closes and returns focus. Ordinary Tab and native links continue to work.
- The Common Ground logo also offers Navigate.

Home, Watch, Ideas, Notes and Calendar keep their order and current-page marker.
The fan adapts its radius to the available width, retains 44 px targets and clears safe areas.
The primary control retains a solid contrasting surface and an outer separation ring over cards.
Route surfaces and labels appear while open. Reduced motion disables the animation.

## Header

The header shares the content's exact maximum width and gutters. The app logo sits at the left edge,
search at the right. At rest, search is a bare icon. Hovering or opening it reveals a frosted
field across the full header; the utility icons fade away and become inert while it is open.
Close, Escape or clicking outside restores the utility controls. Cmd/Ctrl+K focuses search.
The bottom control remains available; page actions no longer compete for header space.
The logo replaces both the space avatar and More. It holds space switching, quick capture,
notifications with live unread counts, settings, account tools and sign out. It closes completely
before opening a dialog or drawer; closing that view returns focus to the logo.

Touch dialogs focus Close instead of a text field. Typing starts when the user taps a field;
desktop dialogs retain their typing shortcut. Touch inputs use at least 16 px text to avoid
automatic input zoom, while pinch zoom remains enabled. Hidden search contents cannot widen the page.

## Universal search

There is one content search for the current space, including saved titles and catalog discovery,
ideas, notes, events, tasks, milestones, research, discussion and attachment names. Existing RLS
permissions apply to every source. Expired notes, unfinished attachments and unrevealed spoilers
are excluded. A failed source leaves the remaining results usable and offers retry.

Queries debounce, cancel previous requests and ignore late replies. Literal query characters are
escaped before PostgREST filtering. Results open the exact note or event, or the relevant idea tab.
Catalog matches reuse the existing add flow and offer Open for saved or newly added titles.
Manual entry remains available inside search. Route-level search fields have been removed;
collection filters and form-specific mention/link pickers keep their separate purposes.
Watch filters open on demand in a responsive dialog. Changes apply together, Cancel preserves
the existing collection, and active choices show a compact summary with a clear action.

## Implementation and checks

`SECTIONS` supplies the destinations, `RadialNav` arranges them, and `RouteAction` owns the primary
button and gestures. `PageAction` registers callbacks independently of their visual placement.
`UniversalSearch` uses a feature service and adapter rather than querying from the component.
The sample demo uses these same components and adapters with a read-only sample transport.

Browser checks cover narrow phones, tablets and desktops, full-width expansion, shared margins,
hover, touch, keyboard, reduced motion, light/dark accessibility and route actions.
