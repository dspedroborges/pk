# pk.js

A CSS-in-JS utility that works in both the browser and Node.js. You write styles as plain JavaScript objects, get unique scoped class names back, and never worry about cascade conflicts or memorising CSS property names.

```js
const btn = cx(
  box({ fill: "accent", round: "md", ink: "bg" }),
  space({ pad: [16, 9] }),
  text({ size: 14, weight: "medium" }),
  decor({ cursor: "pointer" })
)

// use it
element.className = btn        // works — toString() returns the class string
element.className = btn.class  // also works — explicit .class property
```

---

## Install

**Browser**
```html
<script src="pk.js"></script>
<script>
  const { box, text, layout, space, size, place, decor, animate, cx, theme, global } = pk
</script>
```

**Node.js / SSR**
```js
const pk = require("./pk.js")
const { box, text, cx, flush } = pk
```

---

## How it works

Every function returns a **`PKClass` object**. It behaves like a string anywhere you use it — in template literals, assigned to `className`, passed to `cx()`. It also has a `.class` property if you want to be explicit.

```js
const heading = text({ size: 24, weight: "bold" })

heading          // → PKClass { _c: "pk-3f9a1c" }
`${heading}`     // → "pk-3f9a1c"
heading.class    // → "pk-3f9a1c"
heading.toString()  // → "pk-3f9a1c"
```

Internally, pk.js maintains a **single `<style data-pk>` tag** in the browser, or an **in-memory CSS buffer** in Node. The first time a unique set of styles is seen, their CSS is written there. Identical styles always produce the same class and are never written twice — the hash is deterministic, so `box({ fill: "red" })` called 100 times generates exactly one CSS rule.

```
box({ fill: "surface", round: "md" })
  ↓
resolves tokens, builds CSS string
  ↓
hashes it → "3f9a1c"
  ↓
already in cache? → return PKClass("pk-3f9a1c")  (nothing written)
not in cache?     → write .pk-3f9a1c{...} to style tag / buffer
                  → return PKClass("pk-3f9a1c")
```

---

## SSR / Node.js

In Node there is no DOM, so nothing is injected anywhere automatically. Instead, all generated CSS accumulates in an in-memory buffer. When you're done building your HTML, call `flush()` to write the CSS to a file (or get it as a string to inline it).

```js
const { box, text, cx, theme, flush, reset } = require("./pk.js")

// define your styles
theme({ colors: { bg: "#fff", ink: "#111", accent: "#3b82f6" } })

const card = cx(
  box({ fill: "bg", round: "lg", raise: "md", line: 1 }),
  space({ pad: 24 })
)

const heading = text({ size: 24, weight: "bold", ink: "ink" })

// write the accumulated CSS to disk
flush("./public/styles.css")

// use the class names in your HTML template
const html = `
  <div class="${card}">
    <h1 class="${heading}">Hello</h1>
  </div>
`
```

Then link the file in your HTML:
```html
<link rel="stylesheet" href="/styles.css" />
```

Or inline it:
```js
const css = flush()  // no path = returns string without writing
const html = `
  <!DOCTYPE html>
  <html>
  <head><style>${css}</style></head>
  <body>...</body>
  </html>
`
```

### `flush(filepath?)`

Writes the accumulated CSS to `filepath` (Node only) and returns the CSS string. Safe to call multiple times — it writes whatever has accumulated so far.

```js
flush()                        // returns CSS string, no file written
flush("./public/styles.css")  // writes file AND returns CSS string
```

### `reset()`

Clears the cache, the CSS buffer, and (in the browser) the style tag. Useful between SSR requests if you want per-request CSS instead of a global accumulation.

```js
// per-request SSR pattern
reset()
// ... render your page, generating styles ...
const css = flush()
```

---

## Core concepts

### Numbers are always `px`

Wherever a number is accepted, it becomes `px` automatically. Exceptions: `leading` (line-height) and `opacity` are always unitless.

```js
space({ pad: 16 })     // padding: 16px
size({ w: 320 })       // width: 320px
box({ round: 8 })      // border-radius: 8px
text({ leading: 1.6 }) // line-height: 1.6  ← no px
box({ opacity: 0.5 })  // opacity: 0.5      ← no px
```

### Arrays are always `[x, y]`

For two-axis properties, the array is always `[horizontal, vertical]`.

```js
space({ pad: [16, 8] })     // padding: 8px 16px   (y top/bottom, x left/right)
space({ gap: [0, 24] })     // margin: 24px 0px
space({ between: [12, 8] }) // column-gap: 12px; row-gap: 8px
place({ inset: [0, 16] })   // top:0 bottom:0 left:16px right:16px
layout({ align: ["center", "start"] })  // x-axis center, y-axis start
```

### Tokens

Named values that map to CSS custom properties. Set them once with `theme()`, use them everywhere. Raw hex/rgb/hsl strings always work too.

**Color tokens** — used in `fill`, `ink`, `lineColor`, `caret`, `selectColor`, `scrollColor`

| Token | Default |
|---|---|
| `bg` | `#ffffff` |
| `surface` | `#f4f4f5` |
| `border` | `#d4d4d8` |
| `ink` | `#09090b` |
| `muted` | `#71717a` |
| `accent` | `#3b82f6` |
| `success` | `#22c55e` |
| `warning` | `#f59e0b` |
| `danger` | `#ef4444` |

**Font tokens** — used in `font`

| Token | Default |
|---|---|
| `sans` | `system-ui, sans-serif` |
| `serif` | `Georgia, serif` |
| `mono` | `ui-monospace, monospace` |

**Shadow tokens** — used in `raise`

| Token | |
|---|---|
| `none` | no shadow |
| `sm` | subtle / tight |
| `md` | standard card |
| `lg` | elevated panel |
| `xl` | modal / overlay |

**Round tokens** — used in `round`

| Token | Value |
|---|---|
| `none` | `0` |
| `sm` | `4px` |
| `md` | `8px` |
| `lg` | `12px` |
| `xl` | `16px` |
| `full` | `9999px` |

**Weight tokens** — used in `weight`

| Token | Value |
|---|---|
| `thin` | `100` |
| `light` | `300` |
| `normal` | `400` |
| `medium` | `500` |
| `semi` | `600` |
| `bold` | `700` |
| `black` | `900` |

**Size tokens** — used in `w`, `h`, `minW`, `maxW`, `minH`, `maxH`

| Token | Value |
|---|---|
| `full` | `100%` |
| `screen` | `100vw` (width) or `100vh` (height) |
| `auto` | `auto` |
| `fit` | `fit-content` |
| `min` | `min-content` |
| `max` | `max-content` |

---

### Responsive values

Any prop in any function accepts a `{ base, sm, md, lg, xl }` object instead of a plain value. pk.js is **mobile-first**.

```js
layout({ grid: { base: 1, md: 2, lg: 3 } })
text({ size: { base: 14, lg: 18 } })
space({ pad: { base: 16, md: 32 } })
size({ maxW: { base: "full", lg: 860 } })
```

| Key | Breakpoint |
|---|---|
| `base` | no media query (all screens) |
| `sm` | `min-width: 480px` |
| `md` | `min-width: 768px` |
| `lg` | `min-width: 1024px` |
| `xl` | `min-width: 1280px` |

---

### Pseudo states (`on`)

Every function except `place()` accepts an `on` object. Props inside `on` are the same as the function's normal props.

```js
box({
  fill: "surface",
  on: {
    hover:        { fill: "border", raise: "md" },
    focus:        { line: 2, lineColor: "accent" },
    active:       { raise: "none" },
    disabled:     { opacity: 0.4 },
    focusVisible: { line: 2 },
    placeholder:  { ink: "muted" },
    first:        { fill: "accent" },
    odd:          { fill: "surface" },
  }
})
```

| Key | Selector |
|---|---|
| `hover` | `:hover` |
| `focus` | `:focus` |
| `active` | `:active` |
| `disabled` | `:disabled` |
| `checked` | `:checked` |
| `selected` | `:is(:checked, [aria-selected="true"])` |
| `focusVisible` | `:focus-visible` |
| `focusWithin` | `:focus-within` |
| `placeholder` | `::placeholder` |
| `before` | `::before` |
| `after` | `::after` |
| `first` | `:first-child` |
| `last` | `:last-child` |
| `odd` | `:nth-child(odd)` |
| `even` | `:nth-child(even)` |

---

## The eight functions

### `box()` — visual shell

```js
box({
  fill:      "surface",  // background — token or raw
  ink:       "ink",      // text color — token or raw
  line:      1,          // border-width in px
  lineColor: "border",   // border-color — token or raw (defaults to "border" token when line is set)
  round:     "md",       // border-radius — token or px number
  raise:     "sm",       // box-shadow — token or raw
  opacity:   0.9,        // 0–1, unitless
  clip:      true,       // overflow: hidden
  on: { ... }
})
```

---

### `text()` — typography

```js
text({
  size:     14,          // font-size in px
  weight:   "medium",    // weight token or number
  ink:      "muted",     // color — token or raw
  font:     "mono",      // font token or raw string
  leading:  1.6,         // line-height — always unitless
  tracking: "0.05em",    // letter-spacing — string with explicit unit
  align:    "center",    // text-align

  italic:   true,        // font-style: italic
  under:    true,        // text-decoration: underline
  strike:   true,        // text-decoration: line-through
  upper:    true,        // text-transform: uppercase
  lower:    true,        // text-transform: lowercase
  cap:      true,        // text-transform: capitalize
  nowrap:   true,        // white-space: nowrap
  clamp:    2,           // line-clamp at N lines with ellipsis

  on: { ... }
})
```

---

### `layout()` — arrangement

Controls how **children** are arranged inside an element.

```js
layout({
  row:    true,                    // display: flex; flex-direction: row
  col:    true,                    // display: flex; flex-direction: column
  grid:   3,                       // display: grid; grid-template-columns: repeat(3, 1fr)
  grid:   "200px 1fr",             // display: grid; grid-template-columns: 200px 1fr
  align:  ["center", "between"],   // [x-axis, y-axis]
  wrap:   true,                    // flex-wrap: wrap
  inline: true,                    // inline-flex or inline-grid
  on: { ... }
})
```

**`align` is always `[x, y]`.** pk.js figures out which CSS property each axis maps to based on direction — you never have to think about `justify-content` vs `align-items` again.

| Direction | x maps to | y maps to |
|---|---|---|
| `row` | `justify-content` | `align-items` |
| `col` | `align-items` | `justify-content` |
| `grid` | `justify-items` | `align-items` |

**Align tokens:** `start` · `end` · `center` · `stretch` · `between` · `around` · `evenly` · `baseline`

---

### `space()` — spacing

```js
space({
  pad:     16,        // padding all sides
  pad:     [16, 8],   // [x, y] → padding: 8px 16px
  gap:     24,        // margin all sides
  gap:     [0, 24],   // [x, y] → margin: 24px 0px
  between: 12,        // gap between flex/grid children (uniform)
  between: [12, 8],   // [column-gap, row-gap]
  on: { ... }
})
```

> `pad` → `padding` · `gap` → `margin` · `between` → CSS `gap` property

---

### `size()` — dimensions

```js
size({
  w:     320,        // width
  h:     "full",     // height: 100%
  minW:  200,        // min-width
  minH:  48,         // min-height
  maxW:  640,        // max-width
  maxH:  "screen",   // max-height: 100vh
  ratio: "16/9",     // aspect-ratio
  on: { ... }
})
```

---

### `place()` — positioning

Controls where an element sits relative to its containing block.

```js
place({
  type:   "absolute",  // static | relative | absolute | fixed | sticky
  x:      16,          // left
  y:      0,           // top
  right:  0,           // right (use when you need right instead of x)
  bottom: 0,           // bottom (use when you need bottom instead of y)
  z:      10,          // z-index — always unitless
  inset:  0,           // all four edges at once
  inset:  [0, 16],     // [y, x] → top/bottom: 0; left/right: 16px
})
```

> `place()` does not accept `on:` — positions don't typically change on interaction.

**Common patterns:**
```js
place({ type: "sticky", y: 0, z: 100 })         // sticky header
place({ type: "absolute", inset: 0 })            // full-cover overlay
place({ type: "fixed", right: 24, bottom: 24 })  // floating button
place({ type: "absolute", inset: [0, 16] })      // pinned sides, free vertically
```

---

### `decor()` — interaction decoration

```js
decor({
  cursor:      "pointer",             // any CSS cursor value
  select:      "none",                // user-select: none | all | text | auto
  selectColor: "accent",              // ::selection background — token or raw
  selectInk:   "bg",                  // ::selection text color — token or raw
  scroll:      "thin",                // scrollbar-width: none | thin | auto
  scrollColor: ["accent", "surface"], // [thumb, track] — tokens or raw
  scrollX:     "hidden",              // overflow-x
  scrollY:     "auto",                // overflow-y
  caret:       "accent",              // caret-color — token or raw
  events:      false,                 // false → pointer-events: none
                                      // true  → pointer-events: auto
  appearance:  "none",                // -webkit-appearance + appearance
  on: { ... }
})
```

---

### `animate()` — animations

Applies a named animation and injects the corresponding `@keyframes` (once).

```js
animate({
  name:      "fadeIn",   // preset name (see list below)
  duration:  300,        // ms
  ease:      "out",      // in | out | in-out | linear | raw cubic-bezier
  delay:     0,          // ms
  repeat:    1,          // number or Infinity
  fill:      "both",     // animation-fill-mode
  direction: "normal",   // normal | reverse | alternate | alternate-reverse
})
```

**Built-in presets:**

| Name | Description |
|---|---|
| `fadeIn` | opacity 0 → 1 |
| `fadeOut` | opacity 1 → 0 |
| `slideUp` | fade in, moves up from below |
| `slideDown` | fade in, moves down from above |
| `slideLeft` | fade in, moves left from the right |
| `slideRight` | fade in, moves right from the left |
| `scaleIn` | fade in, scale 0.9 → 1 |
| `scaleOut` | fade out, scale 1 → 0.9 |
| `spin` | continuous 360° rotation |
| `ping` | ripple / sonar pulse (scale + fade out) |
| `pulse` | opacity breathe (1 → 0.4 → 1) |
| `bounce` | vertical bounce |
| `shake` | horizontal shake (error feedback) |
| `float` | gentle vertical float loop |
| `flip` | perspective Y-axis rotation |
| `blink` | hard on/off blink |

```js
// preset
const spinner = animate({ name: "spin", duration: 800, repeat: Infinity, ease: "linear" })

// custom keyframes
const pop = animate({
  keyframes: {
    "0%":   { transform: "scale(1)" },
    "50%":  { transform: "scale(1.15)" },
    "100%": { transform: "scale(1)" },
  },
  duration: 200,
  ease: "in-out",
})
```

---

## Composing with `cx()`

`cx()` merges multiple `PKClass` values (or plain strings) into one. It returns a `PKClass` so `.class` and template literals keep working.

```js
const card = cx(
  box({ fill: "surface", round: "lg", raise: "sm" }),
  space({ pad: 24 }),
  size({ maxW: 480 })
)

element.className = card        // "pk-3f9a1c pk-7b2d4e pk-a1f903"
element.className = card.class  // same
`<div class="${card}">...</div>` // same
```

**Conditional classes** — falsy values are silently ignored:

```js
cx(base, isActive && activeClass, hasError && errorClass)
```

**Conditional object syntax:**

```js
cx(base, {
  [activeClass]: isActive,
  [errorClass]:  hasError,
})
```

**Building reusable component variants:**

```js
const btnBase = cx(
  layout({ row: true, align: ["center", "center"], inline: true }),
  space({ pad: [16, 9], between: 6 }),
  box({ round: "md" }),
  text({ size: 13, weight: "medium" }),
  decor({ cursor: "pointer" })
)

// each variant adds only what differs
const btnPrimary = cx(btnBase,
  box({ fill: "accent", ink: "bg", on: { hover: { opacity: 0.85 } } })
)
const btnOutline = cx(btnBase,
  box({ fill: "bg", ink: "ink", line: 1, on: { hover: { lineColor: "accent", ink: "accent" } } })
)
const btnDanger  = cx(btnBase,
  box({ fill: "danger", ink: "bg", on: { hover: { opacity: 0.85 } } })
)
```

---

## `theme()` — define your token palette

Sets CSS custom properties that all color and font tokens resolve through. Call once at the top of your app (or at the top of your SSR render function).

```js
theme({
  colors: {
    bg:      "#0f0f10",
    surface: "#18181b",
    border:  "#27272a",
    ink:     "#fafafa",
    muted:   "#71717a",
    accent:  "#3b82f6",
    success: "#22c55e",
    warning: "#f59e0b",
    danger:  "#ef4444",
  },
  fonts: {
    sans:  "'Inter', system-ui, sans-serif",
    mono:  "'JetBrains Mono', monospace",
    serif: "'Georgia', serif",
  }
})
```

Each key becomes a CSS custom property — `accent` → `--pk-accent`, `fonts.mono` → `--pk-font-mono`.

**Dark mode / alternate themes** — pass a CSS selector as the second argument:

```js
theme({
  colors: { bg: "#000", surface: "#111", ink: "#fff" }
}, ".dark")

// then toggle it
document.documentElement.classList.toggle("dark")
```

---

## `global()` — unscoped CSS

Injects CSS for any selector without scoping. Accepts the same props as `box()`, `text()`, `space()`, and `size()`.

```js
global("*, *::before, *::after", { clip: false })  // box-sizing via clip: false... or just:
global("*", { "box-sizing": "border-box" })
global("body",   { fill: "bg", ink: "ink", font: "sans", leading: 1.6 })
global("button", { border: "none", background: "none" })
global("img",    { display: "block" })
global("a",      { ink: "accent", on: { hover: { ink: "ink" } } })
```

> `global()` is not scoped and will cascade normally. Use it only for resets and base element styles.

---

## Full SSR example

```js
// styles.js — run at build time or request time
const pk  = require("./pk.js")
const { box, text, layout, space, size, cx, theme, flush, reset } = pk

reset() // clear any previous run

theme({
  colors: {
    bg: "#fff", surface: "#f8fafc", border: "#e2e8f0",
    ink: "#0f172a", muted: "#64748b", accent: "#6366f1",
  },
  fonts: { sans: "'Inter', system-ui, sans-serif" }
})

// define component styles
const page = cx(
  size({ maxW: 900 }),
  space({ pad: [32, 64], gap: [0, "auto"] })
)

const card = cx(
  box({ fill: "surface", line: 1, round: "xl", raise: "sm", clip: true }),
  space({ pad: 24 }),
  size({ maxW: 380 })
)

const cardTitle = text({ size: 18, weight: "semi" })
const cardBody  = text({ size: 14, ink: "muted", leading: 1.7 })

const btn = cx(
  box({ fill: "accent", round: "lg", ink: "bg",
        on: { hover: { opacity: 0.88 } } }),
  space({ pad: [16, 10] }),
  text({ size: 14, weight: "medium" }),
  layout({ row: true, align: ["center", "center"], inline: true }),
  decor({ cursor: "pointer" })
)

// write CSS to disk
flush("./public/styles.css")

// export class names for use in templates
module.exports = { page, card, cardTitle, cardBody, btn }
```

```js
// template.js
const { page, card, cardTitle, cardBody, btn } = require("./styles.js")

module.exports = (data) => `
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <div class="${page}">
    <div class="${card}">
      <h2 class="${cardTitle}">${data.title}</h2>
      <p class="${cardBody}">${data.description}</p>
      <a href="${data.url}" class="${btn}">Read more</a>
    </div>
  </div>
</body>
</html>
`
```

---

## Full browser example

```html
<!DOCTYPE html>
<html>
<head><title>pk.js example</title></head>
<body>
<script src="pk.js"></script>
<script>
  const { box, text, layout, space, size, animate, cx, theme, global } = pk

  theme({
    colors: { bg: "#fff", surface: "#f4f4f5", ink: "#111", accent: "#6366f1" }
  })

  global("body", { fill: "bg", ink: "ink", font: "sans" })

  const card = cx(
    box({ fill: "surface", round: "xl", raise: "md" }),
    space({ pad: 32 }),
    layout({ col: true, align: ["start", "start"] }),
    space({ between: 16 }),
    animate({ name: "slideUp", duration: 400 })
  )

  const title = text({ size: 22, weight: "bold" })
  const body  = text({ size: 15, ink: "muted", leading: 1.7 })

  document.body.innerHTML = `
    <div class="${card}" style="max-width:380px;margin:64px auto">
      <h2 class="${title}">Hello pk.js</h2>
      <p class="${body}">Styles written in JS, scoped by default.</p>
    </div>
  `
</script>
</body>
</html>
```

---

## What pk.js does not cover

- `transform`, `transition`, `animation` shorthand (beyond `animate()`) — write these as inline styles or in a regular stylesheet
- `position: relative` shorthand — use `place({ type: "relative" })`
- SSR in environments without `fs` (e.g. Deno) — use `flush()` with no argument to get the CSS string and write it yourself

For anything outside the eight functions, a regular `<style>` tag or `.css` file works alongside pk.js without conflict.

---

## License

MIT