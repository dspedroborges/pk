"use strict";

// ─────────────────────────────────────────────────────────────────
// RETURN TYPE
// Wraps a class name string so it works in template literals
// as-is, and also exposes a .class property for explicit access.
// ─────────────────────────────────────────────────────────────────

function PKClass(classStr) {
  if (!(this instanceof PKClass)) return new PKClass(classStr);
  this._c = classStr;
}

PKClass.prototype.toString = function () { return this._c; };
PKClass.prototype.valueOf  = function () { return this._c; };
Object.defineProperty(PKClass.prototype, "class", {
    get() { return this._c; }
  });

// ─────────────────────────────────────────────────────────────────
// STORAGE
// All generated CSS accumulates in cssBuffer.
// Call flush() to write to disk or get the string.
// ─────────────────────────────────────────────────────────────────

let cssBuffer = "";
const cache   = new Map();

function injectRaw(css) {
  cssBuffer += css;
}

// ─────────────────────────────────────────────────────────────────
// FLUSH  — write buffer to file and/or return CSS string
// ─────────────────────────────────────────────────────────────────

function flush(filepath) {
  if (filepath) {
    require("fs").writeFileSync(filepath, cssBuffer, "utf8");
  }
  return cssBuffer;
}

// ─────────────────────────────────────────────────────────────────
// RESET  — clear buffer + cache (use between SSR requests)
// ─────────────────────────────────────────────────────────────────

function reset() {
  cssBuffer = "";
  cache.clear();
  injectedKeyframes.clear();
}

// ─────────────────────────────────────────────────────────────────
// HASH  (FNV-1a, 32-bit)
// ─────────────────────────────────────────────────────────────────

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36).slice(0, 7);
}

// ─────────────────────────────────────────────────────────────────
// REGISTER  (hash → inject once → return class name string)
// ─────────────────────────────────────────────────────────────────

function register(css) {
  const key  = hash(css);
  const name = "pk-" + key;
  if (!cache.has(key)) {
    cache.set(key, name);
    injectRaw(css.replaceAll("__c__", name));
  }
  return name;
}

// ─────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────

const COLORS = {
  bg:      "var(--pk-bg,      #ffffff)",
  surface: "var(--pk-surface, #f4f4f5)",
  border:  "var(--pk-border,  #d4d4d8)",
  ink:     "var(--pk-ink,     #09090b)",
  muted:   "var(--pk-muted,   #71717a)",
  accent:  "var(--pk-accent,  #3b82f6)",
  success: "var(--pk-success, #22c55e)",
  warning: "var(--pk-warning, #f59e0b)",
  danger:  "var(--pk-danger,  #ef4444)",
};

const FONTS = {
  sans:  "var(--pk-font-sans,  system-ui, sans-serif)",
  serif: "var(--pk-font-serif, Georgia, serif)",
  mono:  "var(--pk-font-mono,  ui-monospace, monospace)",
};

const ROUND = {
  none: "0",
  sm:   "4px",
  md:   "8px",
  lg:   "12px",
  xl:   "16px",
  full: "9999px",
};

const SHADOW = {
  none: "none",
  sm:   "0 1px 3px 0 rgba(0,0,0,.10), 0 1px 2px -1px rgba(0,0,0,.10)",
  md:   "0 4px 6px -1px rgba(0,0,0,.10), 0 2px 4px -2px rgba(0,0,0,.10)",
  lg:   "0 10px 15px -3px rgba(0,0,0,.10), 0 4px 6px -4px rgba(0,0,0,.10)",
  xl:   "0 20px 25px -5px rgba(0,0,0,.10), 0 8px 10px -6px rgba(0,0,0,.10)",
};

const WEIGHT = {
  thin:   "100",
  light:  "300",
  normal: "400",
  medium: "500",
  semi:   "600",
  bold:   "700",
  black:  "900",
};

const BREAKPOINTS = {
  sm:  "480px",
  md:  "768px",
  lg:  "1024px",
  xl:  "1280px",
};

// ─────────────────────────────────────────────────────────────────
// VALUE RESOLVERS
// ─────────────────────────────────────────────────────────────────

const resolveColor  = v => COLORS[v]  ?? v;
const resolveFont   = v => FONTS[v]   ?? v;
const resolveRound  = v => typeof v === "number" ? v + "px" : (ROUND[v]  ?? v);
const resolveShadow = v => SHADOW[v]  ?? v;
const resolveWeight = v => typeof v === "number" ? String(v) : (WEIGHT[v] ?? v);

function px(v) { return typeof v === "number" ? v + "px" : v; }

function resolveSizeAxis(v, axis) {
  if (v === "screen") return axis === "w" ? "100vw" : "100vh";
  if (typeof v === "number") return v + "px";
  return { full: "100%", auto: "auto", fit: "fit-content",
    min: "min-content", max: "max-content" }[v] ?? v;
}

function resolveXY(v) {
  if (Array.isArray(v)) { const [x, y] = v; return `${px(y)} ${px(x)}`; }
  return px(v);
}

function resolveAlign(v) {
  return { start: "flex-start", end: "flex-end", center: "center",
    stretch: "stretch", between: "space-between",
    around: "space-around", evenly: "space-evenly",
    baseline: "baseline" }[v] ?? v;
}

// ─────────────────────────────────────────────────────────────────
// RESPONSIVE WRAPPER
// ─────────────────────────────────────────────────────────────────

function responsive(value, resolveFn) {
  if (value == null) return [];
  if (typeof value !== "object" || Array.isArray(value)) {
    return [[null, resolveFn(value)]];
  }
  const entries = [];
  if ("base" in value) entries.push([null, resolveFn(value.base)]);
  for (const [bp, minW] of Object.entries(BREAKPOINTS)) {
    if (bp in value) entries.push([minW, resolveFn(value[bp])]);
  }
  return entries;
}

function rp(prop, value, resolveFn) {
  if (value == null) return [];
  return responsive(value, resolveFn ?? (v => v))
  .map(([mq, v]) => ({ mq, decl: `${prop}:${v}` }));
}

// ─────────────────────────────────────────────────────────────────
// PSEUDO STATES
// ─────────────────────────────────────────────────────────────────

const PSEUDO_SELECTORS = {
  hover:        ":hover",
  focus:        ":focus",
  active:       ":active",
  disabled:     ":disabled",
  checked:      ":checked",
  selected:     `:is(:checked,[aria-selected="true"])`,
  focusVisible: ":focus-visible",
  focusWithin:  ":focus-within",
  placeholder:  "::placeholder",
  before:       "::before",
  after:        "::after",
  first:        ":first-child",
  last:         ":last-child",
  odd:          ":nth-child(odd)",
  even:         ":nth-child(even)",
};

function processPseudos(on, propBuilder) {
  if (!on) return null;
  const pseudoMap = {};
  for (const [key, styles] of Object.entries(on)) {
    const selector = PSEUDO_SELECTORS[key];
    if (!selector || !styles) continue;
    pseudoMap[selector] = propBuilder(styles);
  }
  return pseudoMap;
}

// ─────────────────────────────────────────────────────────────────
// CSS ASSEMBLER
// ─────────────────────────────────────────────────────────────────

function assemble(items, pseudoMap) {
  const groups = new Map();
  const ensureGroup = mq => {
    if (!groups.has(mq)) groups.set(mq, { base: [], pseudos: {} });
    return groups.get(mq);
  };

  for (const { mq, decl } of items) ensureGroup(mq).base.push(decl);

  if (pseudoMap) {
    for (const [pseudo, pseudoItems] of Object.entries(pseudoMap)) {
      for (const { mq, decl } of pseudoItems) {
        const g = ensureGroup(mq);
        if (!g.pseudos[pseudo]) g.pseudos[pseudo] = [];
        g.pseudos[pseudo].push(decl);
      }
    }
  }

  let css = "";
  for (const [mq, { base, pseudos }] of groups) {
    const baseBlock = base.length ? `.__c__{${base.join(";")}}` : "";
    let pseudoBlocks = "";
    for (const [pseudo, ds] of Object.entries(pseudos)) {
      if (ds.length) pseudoBlocks += `.__c__${pseudo}{${ds.join(";")}}`;
    }
    const inner = baseBlock + pseudoBlocks;
    if (!inner) continue;
    css += mq ? `@media(min-width:${mq}){${inner}}` : inner;
  }
  return css;
}

// ─────────────────────────────────────────────────────────────────
// BOX
// ─────────────────────────────────────────────────────────────────

function buildBoxDecls(p) {
  const items = [];
  items.push(...rp("background",    p.fill,    resolveColor));
  items.push(...rp("color",         p.ink,     resolveColor));
  items.push(...rp("border-radius", p.round,   resolveRound));
  items.push(...rp("box-shadow",    p.raise,   resolveShadow));
  items.push(...rp("opacity",       p.opacity, v => String(v)));

  if (p.clip != null) items.push({ mq: null, decl: `overflow:${p.clip ? "hidden" : "visible"}` });
  if (p.line != null) {
    items.push(...rp("border-width", p.line, v => typeof v === "number" ? v + "px" : v));
    items.push({ mq: null, decl: "border-style:solid" });
  }
  items.push(...rp("border-color", p.lineColor, resolveColor));
  if (p.line != null && p.lineColor == null) {
    items.push({ mq: null, decl: `border-color:${resolveColor("border")}` });
  }
  return items;
}

function box(props) {
  const { on, ...rest } = props;
  return PKClass(register(assemble(buildBoxDecls(rest), processPseudos(on, buildBoxDecls))));
}

// ─────────────────────────────────────────────────────────────────
// TEXT
// ─────────────────────────────────────────────────────────────────

function buildTextDecls(p) {
  const items = [];
  items.push(...rp("font-size",      p.size,     v => typeof v === "number" ? v + "px" : v));
  items.push(...rp("font-weight",    p.weight,   resolveWeight));
  items.push(...rp("color",          p.ink,      resolveColor));
  items.push(...rp("font-family",    p.font,     resolveFont));
  items.push(...rp("line-height",    p.leading,  v => String(v)));
  items.push(...rp("letter-spacing", p.tracking, v => v));
  items.push(...rp("text-align",     p.align,    v => v));

  if (p.italic  != null) items.push({ mq: null, decl: `font-style:${p.italic  ? "italic"  : "normal"}` });
  if (p.under   != null) items.push({ mq: null, decl: `text-decoration:${p.under   ? "underline"    : "none"}` });
  if (p.strike  != null) items.push({ mq: null, decl: `text-decoration:${p.strike  ? "line-through" : "none"}` });
  if (p.upper   != null) items.push({ mq: null, decl: `text-transform:${ p.upper   ? "uppercase"    : "none"}` });
  if (p.lower   != null) items.push({ mq: null, decl: `text-transform:${ p.lower   ? "lowercase"    : "none"}` });
  if (p.cap     != null) items.push({ mq: null, decl: `text-transform:${ p.cap     ? "capitalize"   : "none"}` });
  if (p.nowrap  != null) items.push({ mq: null, decl: `white-space:${    p.nowrap  ? "nowrap"       : "normal"}` });
  if (p.clamp   != null) {
    items.push({ mq: null, decl: "display:-webkit-box" });
    items.push({ mq: null, decl: "-webkit-box-orient:vertical" });
    items.push({ mq: null, decl: "overflow:hidden" });
    items.push({ mq: null, decl: `-webkit-line-clamp:${p.clamp}` });
  }
  return items;
}

function text(props) {
  const { on, ...rest } = props;
  return PKClass(register(assemble(buildTextDecls(rest), processPseudos(on, buildTextDecls))));
}

// ─────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────

function buildLayoutDecls(p) {
  const items    = [];
  const isGrid   = p.grid   != null;
  const isRow    = p.row    === true;
  const isCol    = p.col    === true;
  const isInline = p.inline === true;

  if (isGrid) {
    items.push({ mq: null, decl: `display:${isInline ? "inline-grid" : "grid"}` });
    items.push(...rp("grid-template-columns", p.grid,
        v => typeof v === "number" ? `repeat(${v},1fr)` : v));
  } else if (isRow || isCol) {
    items.push({ mq: null, decl: `display:${isInline ? "inline-flex" : "flex"}` });
    items.push({ mq: null, decl: `flex-direction:${isCol ? "column" : "row"}` });
  }

  if (p.wrap != null) items.push({ mq: null, decl: `flex-wrap:${p.wrap ? "wrap" : "nowrap"}` });

  if (p.align != null) {
    items.push(...responsive(p.align, v => v).flatMap(([mq, val]) => {
          const [xVal, yVal] = Array.isArray(val) ? val : [val, val];
          const xProp = isGrid ? "justify-items"  : isCol ? "align-items"     : "justify-content";
          const yProp = isGrid ? "align-items"     : isCol ? "justify-content" : "align-items";
          return [
            { mq, decl: `${xProp}:${resolveAlign(xVal)}` },
            { mq, decl: `${yProp}:${resolveAlign(yVal)}` },
          ];
        }));
  }
  return items;
}

function layout(props) {
  const { on, ...rest } = props;
  return PKClass(register(assemble(buildLayoutDecls(rest), processPseudos(on, buildLayoutDecls))));
}

// ─────────────────────────────────────────────────────────────────
// SPACE
// ─────────────────────────────────────────────────────────────────

function buildSpaceDecls(p) {
  const items = [];
  items.push(...rp("padding", p.pad, resolveXY));
  items.push(...rp("margin",  p.gap, resolveXY));
  if (p.between != null) {
    if (Array.isArray(p.between)) {
      const [x, y] = p.between;
      items.push(...rp("column-gap", x, v => px(v)));
      items.push(...rp("row-gap",    y, v => px(v)));
    } else {
      items.push(...rp("gap", p.between, v => px(v)));
    }
  }
  return items;
}

function space(props) {
  const { on, ...rest } = props;
  return PKClass(register(assemble(buildSpaceDecls(rest), processPseudos(on, buildSpaceDecls))));
}

// ─────────────────────────────────────────────────────────────────
// SIZE
// ─────────────────────────────────────────────────────────────────

function buildSizeDecls(p) {
  const items = [];
  items.push(...rp("width",        p.w,     v => resolveSizeAxis(v, "w")));
  items.push(...rp("height",       p.h,     v => resolveSizeAxis(v, "h")));
  items.push(...rp("min-width",    p.minW,  v => resolveSizeAxis(v, "w")));
  items.push(...rp("min-height",   p.minH,  v => resolveSizeAxis(v, "h")));
  items.push(...rp("max-width",    p.maxW,  v => resolveSizeAxis(v, "w")));
  items.push(...rp("max-height",   p.maxH,  v => resolveSizeAxis(v, "h")));
  items.push(...rp("aspect-ratio", p.ratio, v => v));
  return items;
}

function size(props) {
  const { on, ...rest } = props;
  return PKClass(register(assemble(buildSizeDecls(rest), processPseudos(on, buildSizeDecls))));
}

// ─────────────────────────────────────────────────────────────────
// PLACE
// ─────────────────────────────────────────────────────────────────

function buildPlaceDecls(p) {
  const items = [];
  if (p.type != null) items.push({ mq: null, decl: `position:${p.type}` });
  items.push(...rp("left",    p.x,      v => px(v)));
  items.push(...rp("top",     p.y,      v => px(v)));
  items.push(...rp("right",   p.right,  v => px(v)));
  items.push(...rp("bottom",  p.bottom, v => px(v)));
  items.push(...rp("z-index", p.z,      v => String(v)));
  if (p.inset != null) {
    if (Array.isArray(p.inset)) {
      const [y, x] = p.inset;
      items.push({ mq: null, decl: `inset:${px(y)} ${px(x)} ${px(y)} ${px(x)}` });
    } else {
      items.push({ mq: null, decl: `inset:${px(p.inset)}` });
    }
  }
  return items;
}

function place(props) {
  return PKClass(register(assemble(buildPlaceDecls(props), null)));
}

// ─────────────────────────────────────────────────────────────────
// DECOR
// ─────────────────────────────────────────────────────────────────

function buildDecorDecls(p) {
  const items = [];
  items.push(...rp("cursor",               p.cursor,     v => v));
  items.push(...rp("user-select",          p.select,     v => v));
  items.push(...rp("caret-color",          p.caret,      resolveColor));
  items.push(...rp("pointer-events",       p.events,
      v => v === false ? "none" : v === true ? "auto" : v));
  items.push(...rp("appearance",           p.appearance, v => v));
  items.push(...rp("-webkit-appearance",   p.appearance, v => v));
  items.push(...rp("scrollbar-width",      p.scroll,     v => v));
  items.push(...rp("overflow-x",           p.scrollX,    v => v));
  items.push(...rp("overflow-y",           p.scrollY,    v => v));
  if (p.scrollColor != null) {
    const [thumb, track] = Array.isArray(p.scrollColor)
    ? p.scrollColor.map(resolveColor)
    : [resolveColor(p.scrollColor), "transparent"];
    items.push({ mq: null, decl: `scrollbar-color:${thumb} ${track}` });
  }
  return items;
}

function decor(props) {
  const { on, selectColor, selectInk, ...rest } = props;
  const name = register(assemble(buildDecorDecls(rest), processPseudos(on, buildDecorDecls)));
  if (selectColor != null || selectInk != null) {
    const bg  = resolveColor(selectColor ?? "accent");
    const ink = resolveColor(selectInk   ?? "bg");
    injectRaw(`.${name}::selection{background:${bg};color:${ink}}`);
  }
  return PKClass(name);
}

// ─────────────────────────────────────────────────────────────────
// ANIMATE
// ─────────────────────────────────────────────────────────────────

const KEYFRAME_PRESETS = {
  fadeIn:    { from: { opacity: 0 },                               to: { opacity: 1 } },
  fadeOut:   { from: { opacity: 1 },                               to: { opacity: 0 } },
  slideUp:   { from: { opacity: 0, transform: "translateY(16px)" },to: { opacity: 1, transform: "translateY(0)" } },
  slideDown: { from: { opacity: 0, transform: "translateY(-16px)"},to: { opacity: 1, transform: "translateY(0)" } },
  slideLeft: { from: { opacity: 0, transform: "translateX(16px)" },to: { opacity: 1, transform: "translateX(0)" } },
  slideRight:{ from: { opacity: 0, transform: "translateX(-16px)"},to: { opacity: 1, transform: "translateX(0)" } },
  scaleIn:   { from: { opacity: 0, transform: "scale(0.9)" },      to: { opacity: 1, transform: "scale(1)" } },
  scaleOut:  { from: { opacity: 1, transform: "scale(1)" },        to: { opacity: 0, transform: "scale(0.9)" } },
  spin:      { from: { transform: "rotate(0deg)" },                to: { transform: "rotate(360deg)" } },
  ping:      { "0%": { transform: "scale(1)", opacity: 1 }, "75%,100%": { transform: "scale(2)", opacity: 0 } },
  pulse:     { "0%,100%": { opacity: 1 },                          "50%": { opacity: 0.4 } },
  bounce:    {
    "0%,100%": { transform: "translateY(0)",    "animation-timing-function": "cubic-bezier(0.8,0,1,1)" },
    "50%":     { transform: "translateY(-25%)", "animation-timing-function": "cubic-bezier(0,0,0.2,1)" },
  },
  shake: {
    "0%,100%": { transform: "translateX(0)" },
    "15%":     { transform: "translateX(-6px)" },
    "30%":     { transform: "translateX(6px)" },
    "45%":     { transform: "translateX(-4px)" },
    "60%":     { transform: "translateX(4px)" },
    "75%":     { transform: "translateX(-2px)" },
    "90%":     { transform: "translateX(2px)" },
  },
  float: {
    "0%,100%": { transform: "translateY(0)" },
    "50%":     { transform: "translateY(-8px)" },
  },
  flip: {
    from: { transform: "perspective(400px) rotateY(0deg)" },
    to:   { transform: "perspective(400px) rotateY(360deg)" },
  },
  blink: {
    "0%,100%": { opacity: 1 },
    "50%":     { opacity: 0 },
  },
};

const EASE_MAP = {
  linear:  "linear",
  in:      "cubic-bezier(0.4,0,1,1)",
  out:     "cubic-bezier(0,0,0.2,1)",
  "in-out":"cubic-bezier(0.4,0,0.2,1)",
};

const injectedKeyframes = new Set();

function buildKeyframeCSS(name, frames) {
  let css = `@keyframes ${name}{`;
    for (const [stop, styles] of Object.entries(frames)) {
      css += `${stop}{${Object.entries(styles).map(([p,v]) => `${p}:${v}`).join(";")}}`;
    }
    return css + "}";
}

function animate(props = {}) {
  const {
    name      = "fadeIn",
    keyframes : customFrames = null,
    duration  = 300,
    ease      = "out",
    delay     = 0,
    repeat    = 1,
    fill      = "both",
    direction = "normal",
  } = props;

  const frameName = customFrames ? `pk-kf-${hash(JSON.stringify(customFrames))}` : name;
  const frames    = customFrames ?? KEYFRAME_PRESETS[name];

  if (!frames) {
    throw new Error(
      `pk.animate: unknown preset "${name}". ` +
      `Available: ${Object.keys(KEYFRAME_PRESETS).join(", ")}`
    );
  }

  if (!injectedKeyframes.has(frameName)) {
    injectedKeyframes.add(frameName);
    injectRaw(buildKeyframeCSS(frameName, frames));
  }

  const animValue = [
    frameName,
    typeof duration === "number" ? `${duration}ms` : duration,
    EASE_MAP[ease] ?? ease,
    typeof delay === "number" ? `${delay}ms` : delay,
    repeat === Infinity ? "infinite" : String(repeat),
    fill,
    direction,
  ].join(" ");

  return PKClass(register(`.__c__{animation:${animValue}}`));
}

// ─────────────────────────────────────────────────────────────────
// TRANSFORM
// x, y, z3d, scale, scaleX, scaleY, rotate, skewX, skewY, origin
// + transition: duration, ease, delay, prop
// + visibility helpers: visible, pointer
// ─────────────────────────────────────────────────────────────────

const ORIGIN_TOKENS = {
  center:       "center",
  top:          "top center",
  bottom:       "bottom center",
  left:         "center left",
  right:        "center right",
  "top-left":   "top left",
  "top-right":  "top right",
  "bottom-left":"bottom left",
  "bottom-right":"bottom right",
};

function buildTransformDecls(p) {
  const items = [];

  // ── transform parts ──────────────────────────────────────────
  const parts = [];

  if (p.x       != null) parts.push(`translateX(${px(p.x)})`);
  if (p.y       != null) parts.push(`translateY(${px(p.y)})`);
  if (p.z3d     != null) parts.push(`translateZ(${px(p.z3d)})`);
  if (p.scale   != null) parts.push(`scale(${p.scale})`);
  if (p.scaleX  != null) parts.push(`scaleX(${p.scaleX})`);
  if (p.scaleY  != null) parts.push(`scaleY(${p.scaleY})`);
  if (p.rotate  != null) parts.push(`rotate(${typeof p.rotate === "number" ? p.rotate + "deg" : p.rotate})`);
  if (p.skewX   != null) parts.push(`skewX(${typeof p.skewX === "number" ? p.skewX + "deg" : p.skewX})`);
  if (p.skewY   != null) parts.push(`skewY(${typeof p.skewY === "number" ? p.skewY + "deg" : p.skewY})`);

  if (parts.length) {
    items.push(...rp("transform", parts.join(" "), v => v));
  }

  // ── transform-origin ─────────────────────────────────────────
  if (p.origin != null) {
    items.push(...rp("transform-origin", p.origin, v => ORIGIN_TOKENS[v] ?? v));
  }

  // ── transition ───────────────────────────────────────────────
  const hasDuration = p.duration != null;
  const hasProp     = p.prop     != null;
  const hasEase     = p.ease     != null;
  const hasDelay    = p.delay    != null;

  if (hasDuration || hasProp || hasEase || hasDelay) {
    const prop     = p.prop ?? "all";
    const dur      = typeof p.duration === "number" ? `${p.duration}ms` : (p.duration ?? "200ms");
    const easing   = EASE_MAP[p.ease] ?? (p.ease ?? EASE_MAP["out"]);
    const delay    = typeof p.delay   === "number" ? `${p.delay}ms`    : (p.delay    ?? "0ms");
    items.push({ mq: null, decl: `transition:${prop} ${dur} ${easing} ${delay}` });
  }

  // ── will-change (perf hint when transforming) ─────────────────
  if (p.willChange != null) {
    items.push({ mq: null, decl: `will-change:${p.willChange}` });
  }

  // ── visibility helpers ────────────────────────────────────────
  if (p.visible != null) {
    items.push({ mq: null, decl: `visibility:${p.visible ? "visible" : "hidden"}` });
  }
  if (p.pointer != null) {
    items.push({ mq: null, decl: `pointer-events:${p.pointer ? "auto" : "none"}` });
  }
  if (p.opacity != null) {
    items.push(...rp("opacity", p.opacity, v => String(v)));
  }
  if (p.backface != null) {
    items.push({ mq: null, decl: `backface-visibility:${p.backface ? "visible" : "hidden"}` });
  }

  return items;
}

function transform(props) {
  const { on, ...rest } = props;
  return PKClass(register(assemble(buildTransformDecls(rest), processPseudos(on, buildTransformDecls))));
}

// ─────────────────────────────────────────────────────────────────
// CX  — compose class names
// ─────────────────────────────────────────────────────────────────

function cx(...args) {
  const out = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === "string" || arg instanceof PKClass) { out.push(String(arg)); continue; }
    if (typeof arg === "object" && !Array.isArray(arg)) {
      for (const [cls, cond] of Object.entries(arg)) {
        if (cond) out.push(String(cls));
      }
    }
  }
  return PKClass(out.filter(Boolean).join(" "));
}

// ─────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────

function theme({ colors = {}, fonts = {} } = {}, selector = ":root") {
  const decls = [];
  for (const [k, v] of Object.entries(colors)) decls.push(`--pk-${k}:${v}`);
  for (const [k, v] of Object.entries(fonts))  decls.push(`--pk-font-${k}:${v}`);
  if (decls.length) injectRaw(`${selector}{${decls.join(";")}}`);
}

// ─────────────────────────────────────────────────────────────────
// GLOBAL
// ─────────────────────────────────────────────────────────────────

function global(selector, props) {
  const items = [
    ...buildBoxDecls(props),
    ...buildTextDecls(props),
    ...buildSpaceDecls(props),
    ...buildSizeDecls(props),
  ];
  const css = items.filter(i => i.mq === null).map(i => i.decl).join(";");
  if (css) injectRaw(`${selector}{${css}}`);
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────

module.exports = {
  box, text, layout, space, size, place, decor, transform, animate,
  cx,
  theme, global,
  flush, reset,
};