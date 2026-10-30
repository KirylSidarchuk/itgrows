// Hover, focus and button motion of the public GEO pages ("/", /de, /fr, /es, /ru and the two checks):
// the owner's request of 30 Oct 2026 to bring the site alive. A card lifts 4px with a soft violet
// shadow and border (a violet glow on dark), a big number in it grows 5%, a primary button rises 2px
// and a light sweeps across it once.
// Keyboard users get the same: a focused card (focus-visible) or a card with a focused link or
// question inside (has-focus-visible) lifts like a hovered one; no focus ring or outline is removed.
// Every movement is motion-safe (none at all with "reduce motion"); Tailwind's hover applies only on
// devices that can hover, so a phone gets the scroll reveal instead (app/_home/ScrollReveal.tsx).
// Transforms and shadows only: nothing changes size or pushes its neighbours.
// The class names are written out in full on purpose: Tailwind finds them by reading this file.

// The lift itself, on hover, on keyboard focus and with a keyboard-focused element inside. Opacity is
// not in the transition, so it never fights the scroll reveal's fade.
const LIFT_MOVE =
  "transition-[translate,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-1 motion-safe:focus-visible:-translate-y-1 motion-safe:has-focus-visible:-translate-y-1"

/** A light card on the light page: lifts with a soft violet shadow and a violet border. */
export const LIFT = `${LIFT_MOVE} hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 focus-visible:border-violet-300 focus-visible:shadow-xl focus-visible:shadow-violet-500/10 has-focus-visible:border-violet-300 has-focus-visible:shadow-xl has-focus-visible:shadow-violet-500/10`

/** A dark card (the why tiles and columns, the plan card): lifts with a violet glow. */
export const LIFT_DARK = `${LIFT_MOVE} hover:border-violet-400/60 hover:shadow-[0_18px_50px_-12px_rgba(139,92,246,0.5)] focus-visible:border-violet-400/60 focus-visible:shadow-[0_18px_50px_-12px_rgba(139,92,246,0.5)] has-focus-visible:border-violet-400/60 has-focus-visible:shadow-[0_18px_50px_-12px_rgba(139,92,246,0.5)]`

/** The violet panel that already casts a shadow (the versus block, ours): lifts with a deeper one. */
export const LIFT_ACCENT = `${LIFT_MOVE} hover:shadow-2xl hover:shadow-violet-600/40 focus-visible:shadow-2xl focus-visible:shadow-violet-600/40 has-focus-visible:shadow-2xl has-focus-visible:shadow-violet-600/40`

/** A big number inside a card marked "group": grows 5% from its left edge while the card is hovered or holds keyboard focus. */
export const NUM =
  "transition-transform duration-300 ease-out origin-left motion-safe:group-hover:scale-105 motion-safe:group-has-focus-visible:scale-105"

/** A stage of the plan's pipeline (WorkSystem; the stage is the "group"): it lifts and its node glows. */
export const STEP = "transition-[translate] duration-300 ease-out motion-safe:hover:-translate-y-1"
export const STEP_NODE =
  "transition-[border-color,box-shadow] duration-300 ease-out group-hover:border-violet-400 group-hover:shadow-lg group-hover:shadow-violet-500/20"

// The sweep: a soft diagonal light parked just left of the button (clipped, so invisible) that crosses
// it once on hover or keyboard focus and jumps back unseen when the pointer leaves.
const SWEEP =
  "relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.35)_50%,transparent_75%)]"

/** A primary button that is a link: rises 2px with a violet shadow and a light sweeps across it. */
export const SHINE = `${SWEEP} transition duration-300 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-600/30 motion-safe:hover:before:translate-x-full motion-safe:hover:before:transition-transform motion-safe:hover:before:duration-700 motion-safe:focus-visible:-translate-y-0.5 focus-visible:shadow-lg focus-visible:shadow-violet-600/30 motion-safe:focus-visible:before:translate-x-full motion-safe:focus-visible:before:transition-transform motion-safe:focus-visible:before:duration-700`

/** The same on a form's submit <button>, only while it can be pressed (not while disabled). */
export const SHINE_BUTTON = `${SWEEP} transition duration-300 ease-out motion-safe:enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg enabled:hover:shadow-violet-600/30 motion-safe:enabled:hover:before:translate-x-full motion-safe:enabled:hover:before:transition-transform motion-safe:enabled:hover:before:duration-700 motion-safe:enabled:focus-visible:-translate-y-0.5 enabled:focus-visible:shadow-lg enabled:focus-visible:shadow-violet-600/30 motion-safe:enabled:focus-visible:before:translate-x-full motion-safe:enabled:focus-visible:before:transition-transform motion-safe:enabled:focus-visible:before:duration-700`
