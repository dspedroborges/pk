# pk

A zero-dependency, server-side CSS utility library for Node.js. Write styles as JavaScript function calls, collect the generated CSS as a string, and inject it into your HTML or write it to a file.

No build step. No runtime. No stylesheet shipped to the browser that you don't control.

---

## How it works

Every utility function (`box`, `text`, `layout`, etc.) registers an atomic CSS rule internally and returns a **unique class name string**. Use those strings directly in your HTML templates. When you're done building a page, call `getCss()` to retrieve the full CSS string.

```js
const { box, text, getCss } = require("./pk");

const card  = box({ fill: "#fff", p: 24, round: "md" });  // → "x1"
const title = text({ size: 18, weight: "bold" });          // → "x2"

const html = `<div class="${card}"><h2 class="${title}">Hello</h2></div>`;
const css  = getCss(); // all rules collected so far
```

---

## Installation

Just copy `pk.js` into your project. No npm package needed.

```
cp pk.js src/
```

---

## API

### `theme(options)`

Override the default design token palette. Call this once at startup before building any classes.

```js
theme({
  colors: {
    bg:      "#0f0f10",
    surface: "#18181b",
    border:  "#27272a",
    ink:     "#fafafa",
    muted:   "#71717a",
    accent:  "#6366f1",
    success: "#22c55e",
    warning: "#f59e0b",
    danger:  "#ef4444",
  },
  fonts: {
    sans:  "'Inter', system-ui, sans-serif",
    serif: "'Georgia', serif",
    mono:  "'JetBrains Mono', monospace",
  },
});
```

Any color prop that accepts a token also accepts a raw CSS value like `"#ff0000"` or `"rgb(255,0,0)"`.

---

### `box(options)` — visual container

Controls backgrounds, spacing, borders, shadows, and more.

```js
box({
  fill:          "surface",        // background-color — token or raw
  ink:           "ink",            // color — token or raw
  p:             24,               // padding (px shorthand)
  px:            16,               // horizontal padding
  py:            8,                // vertical padding
  pt, pr, pb, pl,                  // individual sides (longhand: paddingTop etc.)
  m:             "auto",           // margin
  mx:            "auto",           // horizontal margin
  gap:           12,               // gap (use inside flex/grid parents)
  round:         "md",             // border-radius token: none sm md lg xl full
  raise:         "md",             // box-shadow token: none sm md lg xl
  opacity:       0.5,
  border:        "1px solid #333", // or true → "1px solid", or a number → Npx solid
  borderTop:     "1px solid red",
  borderBottom, borderLeft, borderRight,
  overflow:      "hidden",
  cursor:        "pointer",
  display:       "block",
})
```

---

### `text(options)` — typography

```js
text({
  size:     14,           // font-size in px
  weight:   "medium",     // thin light normal medium semi bold black — or a number
  color:    "muted",      // color token or raw value
  font:     "mono",       // font token or raw font-family string
  leading:  1.6,          // line-height (unitless)
  tracking: "0.05em",     // letter-spacing (string with unit)
  align:    "center",     // text-align
  italic:   true,
  underline: true,
  strike:   true,         // line-through
  upper:    true,         // uppercase
  lower:    true,         // lowercase
  cap:      true,         // capitalize
  nowrap:   true,         // white-space: nowrap
  clamp:    2,            // line-clamp at N lines
})
```

---

### `layout(options)` — flexbox and grid

```js
// Vertical stack (flex column)
layout({ type: "stack", gap: 16, x: "center" })

// Horizontal row (flex row)
layout({ type: "row", x: "between", y: "center", wrap: true })

// CSS grid
layout({ type: "grid", cols: 3, gap: 24 })
```

`x` and `y` alignment values: `top`, `bottom`, `center`, `left`, `right`, `between`, `around`, `evenly`, `stretch`.

---

### `size(options)` — dimensions

```js
size({
  w:    320,         // width in px, or a size token
  h:    "full",      // 100%
  minW: 200,
  maxW: "screen",    // 100vw
  minH: 400,
  maxH: "fit",       // fit-content
})
```

Size tokens: `full` (100%), `screen` (100vw / 100vh), `auto`, `fit`, `min`, `max`.

---

### `place(options)` — positioning

```js
place({
  type:   "absolute",  // static relative absolute fixed sticky
  top:    0,
  right:  0,
  bottom: "auto",
  left:   16,
  z:      10,
  inset:  0,           // shorthand for all four sides
})
```

---

### `decor(options)` — interaction and decoration

```js
decor({
  cursor:        "pointer",
  userSelect:    "none",
  caretColor:    "accent",
  accentColor:   "accent",
  scrollColor:   "muted",
  scrollBehavior:"smooth",
  appearance:    "none",
  outline:       "none",
  listStyle:     "none",
})
```

---

### `animate(options)` — keyframe animations

```js
animate({
  name:      "fadeIn",    // see animation name table below
  duration:  "0.4s",
  easing:    "ease",
  delay:     "0s",
  count:     1,           // or "infinite"
  fill:      "both",
  direction: "normal",    // optional
})
```

Available animation names:

| Name | Effect |
|---|---|
| `fadeIn` | opacity 0 → 1 |
| `fadeOut` | opacity 1 → 0 |
| `slideUp` | fade in, rises from below |
| `slideDown` | fade in, drops from above |
| `slideLeft` | fade in, slides from right |
| `slideRight` | fade in, slides from left |
| `scaleIn` | fade in, scale 0.9 → 1 |
| `scaleOut` | fade out, scale 1 → 0.9 |
| `spin` | continuous 360° rotation |
| `ping` | ripple / sonar pulse |
| `pulse` | opacity breathe |
| `bounce` | vertical bounce |
| `shake` | horizontal shake (error feedback) |
| `float` | gentle vertical float loop |
| `flip` | perspective Y-axis rotation |
| `blink` | hard on/off blink |

---

### `transform(options)` — transforms and transitions

```js
transform({
  scale:      1.05,
  scaleX:     1.2,
  rotate:     45,          // degrees
  translateX: -8,          // px
  translateY: 0,
  origin:     "top left",
  properties: "all",       // transition-property
  duration:   "200ms",
  easing:     "ease-out",
  opacity:    0.8,
  willChange: "transform",
})
```

---

### `hover(options)` — hover state

Generates a `:hover` pseudo-class rule. Accepts the same visual props as `box` and `text`.

```js
hover({
  fill:      "#4f46e5",   // background on hover
  ink:       "#fff",      // text color on hover
  scale:     1.02,        // transform: scale()
  raise:     "lg",        // box-shadow token
  opacity:   0.9,
  underline: true,
  cursor:    "pointer",
})
```

Pair with `transform()` to set the transition so the hover animates smoothly:

```js
const btn = cx(
  box({ fill: "accent", px: 20, py: 10, round: "md" }),
  hover({ fill: "#4f46e5" }),
  transform({ properties: "background-color", duration: "200ms" }),
);
```

---

### `cx(...classes)` — compose class names

Joins multiple class name strings into one, filtering out falsy values.

```js
const isActive = true;

const item = cx(
  box({ p: 12, round: "md" }),
  isActive && box({ fill: "accent" }),   // conditional
  text({ size: 14 }),
);
// → "x1 x2 x3"  or  "x1 x3"  depending on isActive
```

---

### `getCss()` — emit the stylesheet

Returns a string containing every CSS rule and `@keyframes` block that has been generated so far. Call it once after all your classes are built.

```js
const css = getCss();
// write to a file:
fs.writeFileSync("styles.css", css);
// or inline into HTML:
const html = `<style>${css}</style><body>…</body>`;
```

### `resetCss()`

Clears all collected rules and resets the class name counter. Use this between requests in a long-running server so rules don't accumulate across renders.

```js
app.get("/", (req, res) => {
  resetCss();                 // ← start fresh for this request
  const card = box({ p: 24 });
  const css  = getCss();
  res.send(`<style>${css}</style><div class="${card}">…</div>`);
});
```

---

## Full example

```js
const fs = require("fs");
const { theme, box, text, layout, size, hover, transform, animate, cx, md, lg, getCss } = require("./pk");

theme({ colors: { accent: "#6366f1" } });

const page = cx(
  layout({ type: "stack", x: "center", y: "center" }),
  size({ minH: "screen", w: "full" }),
  box({ fill: "bg", p: 16 }),
);

const card = cx(
  box({ fill: "surface", p: 24, round: "lg", raise: "md" }),
  md(box({ p: 40, round: "xl" })),
  layout({ type: "stack", gap: 16 }),
  md(layout({ type: "stack", gap: 24 })),
  size({ w: "full" }),
  md(size({ w: 400 })),
  animate({ name: "scaleIn", duration: "0.3s" }),
);

const title = cx(
  text({ size: 20, weight: "bold", color: "ink" }),
  md(text({ size: 26 })),
);

const btn = cx(
  box({ fill: "accent", px: 20, py: 10, round: "md", cursor: "pointer" }),
  size({ w: "full" }),
  md(size({ w: "fit" })),
  text({ size: 14, weight: "medium", color: "#fff", align: "center" }),
  hover({ fill: "#4f46e5" }),
  transform({ properties: "background-color", duration: "150ms" }),
);

const css  = getCss();
const html = `<!DOCTYPE html>
<html><head><style>${css}</style></head>
<body class="${page}">
  <div class="${card}">
    <h1 class="${title}">Hello pk</h1>
    <button class="${btn}">Get started</button>
  </div>
</body></html>`;

fs.writeFileSync("index.css", css);
fs.writeFileSync("index.html", html);
```

---

## Responsive design

The lib is **mobile-first**. Write base styles without any wrapper, then use a breakpoint function to override at larger screens.

```js
const { sm, md, lg, xl } = require("./pk");
```

| Function | Min-width |
|---|---|
| `sm(cls)` | 640px |
| `md(cls)` | 768px |
| `lg(cls)` | 1024px |
| `xl(cls)` | 1280px |

Each function takes a class returned by any utility and re-emits its rule inside a `@media (min-width: ...)` block:

```js
const card = cx(
  // mobile: full width, compact padding, stacked
  size({ w: "full" }),
  box({ p: 20 }),
  layout({ type: "stack", gap: 16 }),

  // ≥ 768px: fixed width, spacious, row
  md(size({ w: 480 })),
  md(box({ p: 40 })),
  md(layout({ type: "row", gap: 24 })),
);
```

Any utility works with any breakpoint — `box`, `text`, `layout`, `size`, `place`, `transform`, all of them:

```js
const heading = cx(
  text({ size: 24, weight: "bold" }),  // mobile
  md(text({ size: 32 })),              // ≥ 768px
  lg(text({ size: 40 })),              // ≥ 1024px
);

const sidebar = cx(
  size({ w: "full" }),                 // mobile: full width
  lg(size({ w: 260 })),               // ≥ 1024px: fixed sidebar
  place({ type: "relative" }),
  lg(place({ type: "sticky", top: 24 })),
);
```

The generated CSS comes out naturally layered — base rules first, media queries after — so the cascade works as expected without any extra configuration.

---

## Design principles

**Server-only.** No runtime JavaScript is sent to the browser. The CSS is generated once and served as a static string.

**Atomic by default.** Every call to a utility function generates exactly one CSS rule. Composing is done with `cx()`.

**Tokens are optional.** Every prop that accepts a token also accepts any raw CSS string. You never have to configure a theme to get started.

**No magic.** Class names are short (`x1`, `x2`, …) and deterministic within a single run. If you need stable names across deploys, call each utility function at module load time (not inside request handlers) so the order is always the same.