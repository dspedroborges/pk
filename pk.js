// ─── State ────────────────────────────────────────────────────────────────────

const _rules = new Map();   // className → css rule string
const _keyframes = new Map(); // name → @keyframes string
let _counter = 0;
let _themeVars = {};

function uid() {
  return `x${(++_counter).toString(36)}`;
}

function addRule(cls, declarations, extra = "") {
  const body = declarations.filter(Boolean).join("; ");
  _rules.set(cls, `.${cls}${extra} { ${body} }`);
}

function addRaw(cls, raw) {
  _rules.set(cls, raw);
}

// ─── Theme ────────────────────────────────────────────────────────────────────

const _defaultColors = {
  bg: "#ffffff", surface: "#f4f4f5", border: "#d4d4d8",
  ink: "#09090b", muted: "#71717a", accent: "#3b82f6",
  success: "#22c55e", warning: "#f59e0b", danger: "#ef4444",
};

const _defaultFonts = {
  sans: "system-ui, sans-serif",
  serif: "Georgia, serif",
  mono: "ui-monospace, monospace",
};

let _colors = { ..._defaultColors };
let _fonts  = { ..._defaultFonts };

function theme({ colors = {}, fonts = {} } = {}) {
  _colors = { ..._defaultColors, ...colors };
  _fonts  = { ..._defaultFonts,  ...fonts };
}

function resolveColor(val) {
  if (!val) return null;
  return _colors[val] ?? val;
}

function resolveFont(val) {
  if (!val) return null;
  return _fonts[val] ?? val;
}

// ─── Token maps ───────────────────────────────────────────────────────────────

const _shadows = {
  none: "none",
  sm:   "0 1px 2px 0 rgba(0,0,0,.05)",
  md:   "0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)",
  lg:   "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)",
  xl:   "0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)",
};

const _rounds = {
  none: "0", sm: "4px", md: "8px", lg: "12px", xl: "16px", full: "9999px",
};

const _weights = {
  thin: "100", light: "300", normal: "400",
  medium: "500", semi: "600", bold: "700", black: "900",
};

function resolveSize(val, axis = "width") {
  if (val === "full")   return "100%";
  if (val === "screen") return axis === "width" ? "100vw" : "100vh";
  if (val === "auto")   return "auto";
  if (val === "fit")    return "fit-content";
  if (val === "min")    return "min-content";
  if (val === "max")    return "max-content";
  if (typeof val === "number") return `${val}px`;
  return val;
}

// ─── box() ────────────────────────────────────────────────────────────────────

function box({
  color,
  fill,
  padding, paddingX, paddingY, paddingTop, paddingRight, paddingBottom, paddingLeft,
  p, px, py, pt, pr, pb, pl,
  margin, marginX, marginY, marginTop, marginRight, marginBottom, marginLeft,
  m, mx, my, mt, mr, mb, ml,
  gap, gapX, gapY,
  round,
  raise,
  opacity,
  border, borderTop, borderBottom, borderLeft, borderRight,
  shadow,
  overflow, overflowX, overflowY,
  cursor,
  display,
  ink,
  lineColor,
  outline,
} = {}) {
  const cls = uid();
  const d = [];

  const bg = fill ?? color;
  if (bg) d.push(`background-color: ${resolveColor(bg)}`);
  if (ink) d.push(`color: ${resolveColor(ink)}`);
  if (lineColor) d.push(`border-color: ${resolveColor(lineColor)}`);

  const pxv = paddingX ?? px;
  const pyv = paddingY ?? py;
  const pv  = padding  ?? p;
  if (pv  !== undefined) d.push(`padding: ${typeof pv === "number" ? pv+"px" : pv}`);
  if (pxv !== undefined) { const v = typeof pxv==="number"?pxv+"px":pxv; d.push(`padding-left: ${v}; padding-right: ${v}`); }
  if (pyv !== undefined) { const v = typeof pyv==="number"?pyv+"px":pyv; d.push(`padding-top: ${v}; padding-bottom: ${v}`); }
  if ((paddingTop    ?? pt) !== undefined) d.push(`padding-top: ${typeof (paddingTop??pt)==="number"?(paddingTop??pt)+"px":(paddingTop??pt)}`);
  if ((paddingRight  ?? pr) !== undefined) d.push(`padding-right: ${typeof (paddingRight??pr)==="number"?(paddingRight??pr)+"px":(paddingRight??pr)}`);
  if ((paddingBottom ?? pb) !== undefined) d.push(`padding-bottom: ${typeof (paddingBottom??pb)==="number"?(paddingBottom??pb)+"px":(paddingBottom??pb)}`);
  if ((paddingLeft   ?? pl) !== undefined) d.push(`padding-left: ${typeof (paddingLeft??pl)==="number"?(paddingLeft??pl)+"px":(paddingLeft??pl)}`);

  const mxv = marginX ?? mx;
  const myv = marginY ?? my;
  const mv  = margin  ?? m;
  if (mv  !== undefined) d.push(`margin: ${typeof mv === "number" ? mv+"px" : mv}`);
  if (mxv !== undefined) { const v = typeof mxv==="number"?mxv+"px":mxv; d.push(`margin-left: ${v}; margin-right: ${v}`); }
  if (myv !== undefined) { const v = typeof myv==="number"?myv+"px":myv; d.push(`margin-top: ${v}; margin-bottom: ${v}`); }
  if ((marginTop    ?? mt) !== undefined) d.push(`margin-top: ${typeof (marginTop??mt)==="number"?(marginTop??mt)+"px":(marginTop??mt)}`);
  if ((marginRight  ?? mr) !== undefined) d.push(`margin-right: ${typeof (marginRight??mr)==="number"?(marginRight??mr)+"px":(marginRight??mr)}`);
  if ((marginBottom ?? mb) !== undefined) d.push(`margin-bottom: ${typeof (marginBottom??mb)==="number"?(marginBottom??mb)+"px":(marginBottom??mb)}`);
  if ((marginLeft   ?? ml) !== undefined) d.push(`margin-left: ${typeof (marginLeft??ml)==="number"?(marginLeft??ml)+"px":(marginLeft??ml)}`);

  if (gap  !== undefined) d.push(`gap: ${typeof gap==="number"?gap+"px":gap}`);
  if (gapX !== undefined) d.push(`column-gap: ${typeof gapX==="number"?gapX+"px":gapX}`);
  if (gapY !== undefined) d.push(`row-gap: ${typeof gapY==="number"?gapY+"px":gapY}`);

  if (round   !== undefined) d.push(`border-radius: ${_rounds[round] ?? (typeof round==="number"?round+"px":round)}`);
  if (raise   !== undefined) d.push(`box-shadow: ${_shadows[raise] ?? raise}`);
  if (shadow  !== undefined) d.push(`box-shadow: ${_shadows[shadow] ?? shadow}`);
  if (opacity !== undefined) d.push(`opacity: ${opacity}`);
  if (display !== undefined) d.push(`display: ${display}`);
  if (cursor  !== undefined) d.push(`cursor: ${cursor}`);
  if (overflow  !== undefined) d.push(`overflow: ${overflow}`);
  if (overflowX !== undefined) d.push(`overflow-x: ${overflowX}`);
  if (overflowY !== undefined) d.push(`overflow-y: ${overflowY}`);
  if (outline !== undefined) d.push(`outline: ${outline}`);

  const borderVal = (v) => {
    if (v === true) return "1px solid";
    if (typeof v === "number") return `${v}px solid`;
    return v;
  };
  if (border       !== undefined) d.push(`border: ${borderVal(border)}`);
  if (borderTop    !== undefined) d.push(`border-top: ${borderVal(borderTop)}`);
  if (borderBottom !== undefined) d.push(`border-bottom: ${borderVal(borderBottom)}`);
  if (borderLeft   !== undefined) d.push(`border-left: ${borderVal(borderLeft)}`);
  if (borderRight  !== undefined) d.push(`border-right: ${borderVal(borderRight)}`);

  addRule(cls, d);
  return cls;
}

// ─── text() ───────────────────────────────────────────────────────────────────

function text({
  size, weight, color, font, leading, tracking,
  align, italic, underline, strike, upper, lower, cap,
  nowrap, clamp,
} = {}) {
  const cls = uid();
  const d = [];

  if (size    !== undefined) d.push(`font-size: ${typeof size==="number"?size+"px":size}`);
  if (weight  !== undefined) d.push(`font-weight: ${_weights[weight] ?? weight}`);
  if (color   !== undefined) d.push(`color: ${resolveColor(color)}`);
  if (font    !== undefined) d.push(`font-family: ${resolveFont(font)}`);
  if (leading !== undefined) d.push(`line-height: ${leading}`);
  if (tracking!== undefined) d.push(`letter-spacing: ${tracking}`);
  if (align   !== undefined) d.push(`text-align: ${align}`);
  if (italic)                d.push(`font-style: italic`);
  if (nowrap)                d.push(`white-space: nowrap`);

  const decorations = [];
  if (underline) decorations.push("underline");
  if (strike)    decorations.push("line-through");
  if (decorations.length) d.push(`text-decoration: ${decorations.join(" ")}`);

  const transforms = [];
  if (upper) transforms.push("uppercase");
  if (lower) transforms.push("lowercase");
  if (cap)   transforms.push("capitalize");
  if (transforms.length) d.push(`text-transform: ${transforms[0]}`);

  if (clamp !== undefined) {
    d.push(
      `display: -webkit-box`,
      `-webkit-line-clamp: ${clamp}`,
      `-webkit-box-orient: vertical`,
      `overflow: hidden`
    );
  }

  addRule(cls, d);
  return cls;
}

// ─── layout() ─────────────────────────────────────────────────────────────────

function layout({
  type = "stack",
  x,
  y,
  cols,
  wrap,
  inline,
  gap,
  gapX,
  gapY,
} = {}) {
  const cls = uid();
  const d = [];

  if (gap  !== undefined) d.push(`gap: ${typeof gap  === "number" ? gap  + "px" : gap}`);
  if (gapX !== undefined) d.push(`column-gap: ${typeof gapX === "number" ? gapX + "px" : gapX}`);
  if (gapY !== undefined) d.push(`row-gap: ${typeof gapY === "number" ? gapY + "px" : gapY}`);

  if (type === "grid") {
    d.push(`display: ${inline ? "inline-grid" : "grid"}`);
    if (cols !== undefined) d.push(`grid-template-columns: repeat(${cols}, minmax(0, 1fr))`);
    if (x) {
      const map = { left: "start", right: "end", center: "center", stretch: "stretch" };
      d.push(`justify-items: ${map[x] ?? x}`);
    }
    if (y) {
      const map = { top: "start", bottom: "end", center: "center", stretch: "stretch" };
      d.push(`align-items: ${map[y] ?? y}`);
    }
  } else {
    d.push(`display: ${inline ? "inline-flex" : "flex"}`);
    d.push(`flex-direction: ${type === "row" ? "row" : "column"}`);
    if (wrap) d.push(`flex-wrap: wrap`);

    const mainAxis = type === "row" ? "justify-content" : "align-items";
    const crossAxis = type === "row" ? "align-items" : "justify-content";

    const mainMap  = { left: "flex-start", right: "flex-end", center: "center", between: "space-between", around: "space-around", evenly: "space-evenly" };
    const crossMap = { top: "flex-start",  bottom: "flex-end", center: "center", stretch: "stretch" };

    if (x) d.push(`${type === "row" ? "justify-content" : "align-items"}: ${(type === "row" ? mainMap : crossMap)[x] ?? x}`);
    if (y) d.push(`${type === "row" ? "align-items" : "justify-content"}: ${(type === "row" ? crossMap : mainMap)[y] ?? y}`);
  }

  addRule(cls, d);
  return cls;
}

// ─── size() ───────────────────────────────────────────────────────────────────

function size({
  width, w,
  height, h,
  minW, maxW,
  minH, maxH,
} = {}) {
  const cls = uid();
  const d = [];

  const wv = width ?? w;
  const hv = height ?? h;

  if (wv   !== undefined) d.push(`width: ${resolveSize(wv, "width")}`);
  if (hv   !== undefined) d.push(`height: ${resolveSize(hv, "height")}`);
  if (minW !== undefined) d.push(`min-width: ${resolveSize(minW, "width")}`);
  if (maxW !== undefined) d.push(`max-width: ${resolveSize(maxW, "width")}`);
  if (minH !== undefined) d.push(`min-height: ${resolveSize(minH, "height")}`);
  if (maxH !== undefined) d.push(`max-height: ${resolveSize(maxH, "height")}`);

  addRule(cls, d);
  return cls;
}

// ─── place() ──────────────────────────────────────────────────────────────────

function place({
  type = "relative",
  top, right, bottom, left,
  z, inset,
} = {}) {
  const cls = uid();
  const d = [];
  const px = (v) => v !== undefined ? (typeof v==="number"?v+"px":v) : null;

  d.push(`position: ${type}`);
  if (inset !== undefined)  d.push(`inset: ${px(inset)}`);
  if (top   !== undefined)  d.push(`top: ${px(top)}`);
  if (right !== undefined)  d.push(`right: ${px(right)}`);
  if (bottom!== undefined)  d.push(`bottom: ${px(bottom)}`);
  if (left  !== undefined)  d.push(`left: ${px(left)}`);
  if (z     !== undefined)  d.push(`z-index: ${z}`);

  addRule(cls, d);
  return cls;
}

// ─── decor() ──────────────────────────────────────────────────────────────────

function decor({
  cursor,
  select,
  pointer,
  resize,
  appearance,
  listStyle,
  outline,
  outlineOffset,
  caretColor,
  accentColor,
  scrollColor,
  scrollBehavior,
  userSelect,
} = {}) {
  const cls = uid();
  const d = [];

  if (cursor      !== undefined) d.push(`cursor: ${cursor}`);
  if (pointer)                   d.push(`cursor: pointer`);
  if (select      !== undefined) d.push(`user-select: ${select}`);
  if (userSelect  !== undefined) d.push(`user-select: ${userSelect}`);
  if (resize      !== undefined) d.push(`resize: ${resize}`);
  if (appearance  !== undefined) d.push(`appearance: ${appearance}`);
  if (listStyle   !== undefined) d.push(`list-style: ${listStyle}`);
  if (outline     !== undefined) d.push(`outline: ${outline}`);
  if (outlineOffset!==undefined) d.push(`outline-offset: ${outlineOffset}`);
  if (caretColor  !== undefined) d.push(`caret-color: ${resolveColor(caretColor)}`);
  if (accentColor !== undefined) d.push(`accent-color: ${resolveColor(accentColor)}`);
  if (scrollColor !== undefined) d.push(`scrollbar-color: ${resolveColor(scrollColor)} transparent`);
  if (scrollBehavior!==undefined)d.push(`scroll-behavior: ${scrollBehavior}`);

  addRule(cls, d);
  return cls;
}

// ─── animate() ────────────────────────────────────────────────────────────────

const _keyframesDefs = {
  fadeIn:    `@keyframes fadeIn    { from { opacity: 0 } to { opacity: 1 } }`,
  fadeOut:   `@keyframes fadeOut   { from { opacity: 1 } to { opacity: 0 } }`,
  slideUp:   `@keyframes slideUp   { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }`,
  slideDown: `@keyframes slideDown { from { opacity: 0; transform: translateY(-16px) } to { opacity: 1; transform: translateY(0) } }`,
  slideLeft: `@keyframes slideLeft { from { opacity: 0; transform: translateX(16px) } to { opacity: 1; transform: translateX(0) } }`,
  slideRight:`@keyframes slideRight{ from { opacity: 0; transform: translateX(-16px) } to { opacity: 1; transform: translateX(0) } }`,
  scaleIn:   `@keyframes scaleIn   { from { opacity: 0; transform: scale(.9) } to { opacity: 1; transform: scale(1) } }`,
  scaleOut:  `@keyframes scaleOut  { from { opacity: 1; transform: scale(1) } to { opacity: 0; transform: scale(.9) } }`,
  spin:      `@keyframes spin      { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`,
  ping:      `@keyframes ping      { 75%,100% { transform: scale(2); opacity: 0 } }`,
  pulse:     `@keyframes pulse     { 0%,100% { opacity: 1 } 50% { opacity: .4 } }`,
  bounce:    `@keyframes bounce    { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }`,
  shake:     `@keyframes shake     { 0%,100% { transform: translateX(0) } 20%,60% { transform: translateX(-6px) } 40%,80% { transform: translateX(6px) } }`,
  float:     `@keyframes float     { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }`,
  flip:      `@keyframes flip      { from { transform: perspective(400px) rotateY(0) } to { transform: perspective(400px) rotateY(360deg) } }`,
  blink:     `@keyframes blink     { 0%,100% { opacity: 1 } 50% { opacity: 0 } }`,
};

function animate({
  name,
  duration = "0.4s",
  easing   = "ease",
  delay    = "0s",
  count    = 1,
  fill     = "both",
  direction,
} = {}) {
  if (!name || !_keyframesDefs[name]) throw new Error(`Unknown animation: ${name}`);
  _keyframes.set(name, _keyframesDefs[name]);

  const cls = uid();
  const parts = [name, duration, easing, delay, count, fill];
  if (direction) parts.push(direction);
  addRule(cls, [`animation: ${parts.join(" ")}`]);
  return cls;
}

// ─── transform() ──────────────────────────────────────────────────────────────

function transform({
  scale, scaleX, scaleY,
  rotate,
  translateX, translateY,
  skewX, skewY,
  origin,
  transition,
  duration   = "150ms",
  easing     = "ease",
  properties = "all",
  visible,
  hidden,
  opacity,
  willChange,
} = {}) {
  const cls = uid();
  const d = [];
  const tx = [];

  if (scale     !== undefined) tx.push(`scale(${scale})`);
  if (scaleX    !== undefined) tx.push(`scaleX(${scaleX})`);
  if (scaleY    !== undefined) tx.push(`scaleY(${scaleY})`);
  if (rotate    !== undefined) tx.push(`rotate(${typeof rotate==="number"?rotate+"deg":rotate})`);
  if (translateX!== undefined) tx.push(`translateX(${typeof translateX==="number"?translateX+"px":translateX})`);
  if (translateY!== undefined) tx.push(`translateY(${typeof translateY==="number"?translateY+"px":translateY})`);
  if (skewX     !== undefined) tx.push(`skewX(${typeof skewX==="number"?skewX+"deg":skewX})`);
  if (skewY     !== undefined) tx.push(`skewY(${typeof skewY==="number"?skewY+"deg":skewY})`);
  if (tx.length)               d.push(`transform: ${tx.join(" ")}`);
  if (origin    !== undefined) d.push(`transform-origin: ${origin}`);

  if (transition !== undefined) {
    d.push(`transition: ${transition}`);
  } else if (properties !== undefined) {
    d.push(`transition: ${properties} ${duration} ${easing}`);
  }

  if (visible === true)  d.push(`visibility: visible`);
  if (hidden  === true)  d.push(`visibility: hidden`);
  if (opacity !== undefined) d.push(`opacity: ${opacity}`);
  if (willChange !== undefined) d.push(`will-change: ${willChange}`);

  addRule(cls, d);
  return cls;
}

// ─── hover() ──────────────────────────────────────────────────────────────────

function hover(opts = {}) {
  const cls = uid();
  const d = [];
  const px = (v) => typeof v === "number" ? v + "px" : v;

  if (opts.fill  !== undefined) d.push(`background-color: ${resolveColor(opts.fill)}`);
  if (opts.color !== undefined) d.push(`background-color: ${resolveColor(opts.color)}`);
  if (opts.ink   !== undefined) d.push(`color: ${resolveColor(opts.ink)}`);
  if (opts.opacity  !== undefined) d.push(`opacity: ${opts.opacity}`);
  if (opts.scale    !== undefined) d.push(`transform: scale(${opts.scale})`);
  if (opts.raise    !== undefined) d.push(`box-shadow: ${_shadows[opts.raise] ?? opts.raise}`);
  if (opts.shadow   !== undefined) d.push(`box-shadow: ${_shadows[opts.shadow] ?? opts.shadow}`);
  if (opts.round    !== undefined) d.push(`border-radius: ${_rounds[opts.round] ?? px(opts.round)}`);
  if (opts.border   !== undefined) d.push(`border: ${opts.border}`);
  if (opts.underline)              d.push(`text-decoration: underline`);
  if (opts.cursor   !== undefined) d.push(`cursor: ${opts.cursor}`);
  if (opts.translate !== undefined) d.push(`transform: translateY(${px(opts.translate)})`);

  addRule(cls, d, ":hover");
  return cls;
}

// ─── cx() ─────────────────────────────────────────────────────────────────────

function cx(...args) {
  return args
    .flat()
    .filter(Boolean)
    .join(" ");
}

// ─── Breakpoints ──────────────────────────────────────────────────────────────

const _breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 };

function responsive(bp, cls) {
  const minWidth = _breakpoints[bp];
  if (!minWidth) throw new Error(`Unknown breakpoint: ${bp}. Available: ${Object.keys(_breakpoints).join(", ")}`);
  const existing = _rules.get(cls);
  if (!existing) return cls;
  _rules.set(cls, `@media (min-width: ${minWidth}px) { ${existing} }`);
  return cls;
}

const sm = (cls) => responsive("sm", cls);
const md = (cls) => responsive("md", cls);
const lg = (cls) => responsive("lg", cls);
const xl = (cls) => responsive("xl", cls);

// ─── getCss() ─────────────────────────────────────────────────────────────────

function getCss() {
  const kf = [..._keyframes.values()].join("\n");
  const rules = [..._rules.values()].join("\n");
  return kf ? `${kf}\n${rules}` : rules;
}

function resetCss() {
  _rules.clear();
  _keyframes.clear();
  _counter = 0;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  theme,
  box,
  text,
  layout,
  size,
  place,
  decor,
  animate,
  transform,
  hover,
  cx,
  responsive,
  sm, md, lg, xl,
  getCss,
  resetCss,
};