// Drawing, animation and control primitives, so a note can build figures out of OpenUI alone:
// SVG shapes driven by expressions, a Player that moves a $variable over time, native sliders and
// checkboxes that follow their $variable while a Player runs, and a few maths functions.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { z } from "zod/v4";
import { defineComponent, defineFunction, reactive, useFormName, useStateField, useTriggerAction } from "@openuidev/react-lang";

type RenderNode = (node: unknown) => ReactNode;

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// "ring s1" -> "omd-ring omd-s1". Each token is styled in styles.css.
const paint = (p?: string) => (p ?? "").split(/\s+/).filter(Boolean).map((t) => `omd-${t}`).join(" ") || undefined;

// Strings are text; anything else (an element, an array of them) goes through the renderer.
const content = (value: unknown, renderNode: RenderNode): ReactNode =>
  value == null ? null : typeof value === "string" || typeof value === "number" ? String(value) : renderNode(value);

// **bold** and *italic* inside captions and readouts.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) =>
    part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part.startsWith("*") && part.length > 2 ? <em key={i}>{part.slice(1, -1)}</em> : part,
  );
}

const InSvg = createContext(false);
const n = z.number();
const look = { paint: z.string().optional(), opacity: z.number().optional(), visible: z.boolean().optional() };

// Inside a Plot, shapes give positions as data values and these turn them into drawing units.
// Outside one they pass values through unchanged.
type Scale = { x: (v: number) => number; y: (v: number) => number } | null;
const PlotScale = createContext<Scale>(null);
const useScale = () => {
  const s = useContext(PlotScale);
  return { x: s ? s.x : (v: number) => v, y: s ? s.y : (v: number) => v, active: !!s };
};
type Point = { x: number; y: number };
// "x,y x,y" or [{x, y}, …] -> "x,y x,y" in drawing units.
const pointsAttr = (points: unknown, s: ReturnType<typeof useScale>) => {
  if (typeof points === "string" && !s.active) return points;
  const list: Point[] = Array.isArray(points)
    ? points.filter((q) => q && typeof q === "object")
    : String(points ?? "").trim().split(/\s+/).filter(Boolean).map((pair) => {
        const [x, y] = pair.split(",").map(Number);
        return { x, y };
      });
  return list.map((q) => `${round(s.x(Number(q.x)))},${round(s.y(Number(q.y)))}`).join(" ");
};
const round = (v: number) => Math.round(v * 100) / 100;

const Svg = defineComponent({
  name: "Svg",
  props: z.object({ viewBox: z.string(), children: z.array(z.any()), label: z.string().optional() }),
  description: "A scalable drawing. Children are Circle, Ellipse, Line, Path, Polygon, Polyline, Rect, SvgText, Group, Glyph and Plot.",
  component: ({ props, renderNode }) => (
    <InSvg.Provider value={true}>
      <svg className="omd-svg" viewBox={props.viewBox} role="img" aria-label={props.label}>
        {renderNode(props.children)}
      </svg>
    </InSvg.Provider>
  ),
});

const Plot = defineComponent({
  name: "Plot",
  props: z.object({ x: z.array(n), y: z.array(n), box: z.array(n), children: z.array(z.any()) }),
  description:
    "A chart frame inside an Svg. Its children give positions as data values. x is [left value, right value]; y is [bottom value, top value]; box is [left, top, width, height] in the drawing's units. Radii, SvgText dx/dy and Path stay in drawing units.",
  component: ({ props, renderNode }) => {
    const [x0, x1] = props.x, [y0, y1] = props.y, [left, top, width, height] = props.box;
    const scale: Scale = {
      x: (v) => left + ((v - x0) / (x1 - x0)) * width,
      y: (v) => top + height - ((v - y0) / (y1 - y0)) * height,
    };
    return <PlotScale.Provider value={scale}>{renderNode(props.children)}</PlotScale.Provider>;
  },
});

const shape = <S extends z.ZodRawShape>(
  name: string,
  description: string,
  shapeProps: S,
  draw: (p: any, cls: string | undefined, s: ReturnType<typeof useScale>) => ReactNode,
) =>
  defineComponent({
    name,
    props: z.object({ ...shapeProps, ...look }),
    description,
    component: ({ props }: { props: any }) => {
      const s = useScale();
      return props.visible === false ? null : draw(props, paint(props.paint), s);
    },
  });

const Circle = shape("Circle", "Circle at (cx, cy); r is in drawing units. Negative radii draw as 0.", { cx: n, cy: n, r: n }, (p, cls, s) => (
  <circle cx={s.x(p.cx)} cy={s.y(p.cy)} r={Math.max(0, p.r)} className={cls} opacity={p.opacity} />
));
const Ellipse = shape("Ellipse", "Ellipse at (cx, cy); rx and ry are in drawing units.", { cx: n, cy: n, rx: n, ry: n }, (p, cls, s) => (
  <ellipse cx={s.x(p.cx)} cy={s.y(p.cy)} rx={p.rx} ry={p.ry} className={cls} opacity={p.opacity} />
));
const Line = shape("Line", "Straight line.", { x1: n, y1: n, x2: n, y2: n }, (p, cls, s) => (
  <line x1={s.x(p.x1)} y1={s.y(p.y1)} x2={s.x(p.x2)} y2={s.y(p.y2)} className={cls} opacity={p.opacity} />
));
const Path = shape("Path", "SVG path from a d string, always in drawing units.", { d: z.string() }, (p, cls) => <path d={p.d} className={cls} opacity={p.opacity} />);
const Polygon = shape("Polygon", 'Closed shape through points: "x,y x,y …" or a list of {x, y}.', { points: z.any() }, (p, cls, s) => (
  <polygon points={pointsAttr(p.points, s)} className={cls} opacity={p.opacity} />
));
const Polyline = shape("Polyline", 'Open line through points: "x,y x,y …" or a list of {x, y}.', { points: z.any() }, (p, cls, s) => (
  <polyline points={pointsAttr(p.points, s)} className={cls} opacity={p.opacity} />
));
const Rect = shape("Rect", "Rectangle from corner (x, y); rx rounds the corners.", { x: n, y: n, width: n, height: n, rx: n.optional() }, (p, cls, s) => {
  const xa = s.x(p.x), xb = s.x(p.x + Math.max(0, p.width)), ya = s.y(p.y), yb = s.y(p.y + Math.max(0, p.height));
  return <rect x={Math.min(xa, xb)} y={Math.min(ya, yb)} width={Math.abs(xb - xa)} height={Math.abs(yb - ya)} rx={p.rx} className={cls} opacity={p.opacity} />;
});

const SvgText = defineComponent({
  name: "SvgText",
  props: z.object({
    x: n,
    y: n,
    text: z.any(),
    paint: z.string().optional(),
    anchor: z.enum(["start", "middle", "end"]).optional(),
    visible: z.boolean().optional(),
    dx: n.optional(),
    dy: n.optional(),
  }),
  description: "Text in a drawing. text is a string or an array of Span. dx and dy nudge it in drawing units, handy inside a Plot.",
  component: ({ props, renderNode }) => {
    const s = useScale();
    return props.visible === false ? null : (
      <text x={s.x(props.x)} y={s.y(props.y)} dx={props.dx} dy={props.dy} textAnchor={props.anchor} className={paint(props.paint)}>
        {content(props.text, renderNode)}
      </text>
    );
  },
});

const Span = defineComponent({
  name: "Span",
  props: z.object({ text: z.any(), paint: z.string().optional() }),
  description: "A run of text with its own paint, inside SvgText or Tile.",
  component: ({ props }) => {
    const svg = useContext(InSvg);
    const text = props.text == null ? "" : String(props.text);
    return svg ? <tspan className={paint(props.paint)}>{text}</tspan> : <span className={paint(props.paint)}>{text}</span>;
  },
});

const Group = defineComponent({
  name: "Group",
  props: z.object({ children: z.array(z.any()), transform: z.string().optional(), ...look, at: z.array(n).optional() }),
  description: "Groups shapes, optionally moved, rotated or faded together. at: [x, y] moves the group's origin to that point (a data value inside a Plot).",
  component: ({ props, renderNode }) => {
    const s = useScale();
    if (props.visible === false) return null;
    const at = props.at?.length === 2 ? `translate(${s.x(props.at[0])} ${s.y(props.at[1])}) ` : "";
    return (
      <g transform={(at + (props.transform ?? "")).trim() || undefined} opacity={props.opacity} className={paint(props.paint)}>
        {renderNode(props.children)}
      </g>
    );
  },
});

// Small drawings placed like an <image>: x, y is the top-left corner of the box.
const glyphs: Record<string, { viewBox: string; body: ReactNode }> = {
  satellite: {
    viewBox: "-32 -16 64 32",
    body: (
      <>
        <rect className="omd-sat-panel" x="-31" y="-6" width="19" height="12" rx="1" />
        <line className="omd-sat-line" x1="-24.7" y1="-6" x2="-24.7" y2="6" />
        <line className="omd-sat-line" x1="-18.3" y1="-6" x2="-18.3" y2="6" />
        <rect className="omd-sat-panel" x="12" y="-6" width="19" height="12" rx="1" />
        <line className="omd-sat-line" x1="18.3" y1="-6" x2="18.3" y2="6" />
        <line className="omd-sat-line" x1="24.7" y1="-6" x2="24.7" y2="6" />
        <line className="omd-sat-line" x1="-12" y1="0" x2="12" y2="0" />
        <rect className="omd-sat-body" x="-8" y="-9" width="16" height="18" rx="2" />
        <path className="omd-sat-body" d="M-5 9 L5 9 L3 14 L-3 14 Z" />
      </>
    ),
  },
  pin: {
    viewBox: "-14 -40 28 42",
    body: (
      <>
        <path fill="currentColor" d="M0 0 C-4 -9 -12 -16 -12 -26 A12 12 0 1 1 12 -26 C12 -16 4 -9 0 0 Z" />
        <circle cx="0" cy="-26" r="4.6" className="omd-glyph-hole" />
      </>
    ),
  },
  phone: {
    viewBox: "-10 -16 20 32",
    body: (
      <>
        <rect x="-9" y="-15" width="18" height="30" rx="3.5" className="omd-phone-case" />
        <rect x="-6" y="-11" width="12" height="20" rx="1" className="omd-phone-screen" />
        <circle cx="0" cy="12" r="1.3" className="omd-phone-button" />
      </>
    ),
  },
};

const Glyph = defineComponent({
  name: "Glyph",
  props: z.object({ name: z.enum(["satellite", "pin", "phone"]), x: n, y: n, width: n, height: n, ...look }),
  description: "A small built-in drawing (satellite, pin, phone) in the box at x, y. paint sets its colour.",
  component: ({ props }) => {
    const s = useScale();
    const g = glyphs[props.name];
    if (!g || props.visible === false) return null;
    return (
      <svg x={s.x(props.x)} y={s.y(props.y)} width={props.width} height={props.height} viewBox={g.viewBox} overflow="visible" className={paint(props.paint)} opacity={props.opacity}>
        {g.body}
      </svg>
    );
  },
});

const Figure = defineComponent({
  name: "Figure",
  props: z.object({ tag: z.string(), title: z.string(), children: z.array(z.any()), caption: z.string().optional() }),
  description: "A numbered figure card: tag and title above, caption (supports **bold** and *italic*) below.",
  component: ({ props, renderNode }) => (
    <figure className="omd-fig">
      <p className="omd-fig-title">
        <span className="omd-fig-tag">{props.tag}</span>
        {props.title}
      </p>
      {renderNode(props.children)}
      {props.caption ? <figcaption>{inline(props.caption)}</figcaption> : null}
    </figure>
  ),
});

const Controls = defineComponent({
  name: "Controls",
  props: z.object({ children: z.array(z.any()) }),
  description: "A wrapping row of controls under a figure.",
  component: ({ props, renderNode }) => <div className="omd-controls">{renderNode(props.children)}</div>,
});

const Readout = defineComponent({
  name: "Readout",
  props: z.object({ text: z.string() }),
  description: "A live sentence under a figure; **bold** is highlighted.",
  component: ({ props }) => (
    <div className="omd-readout" aria-live="polite">
      {inline(String(props.text ?? ""))}
    </div>
  ),
});

const Grid = defineComponent({
  name: "Grid",
  props: z.object({ children: z.array(z.any()), minWidth: z.number().optional() }),
  description: "Equal columns that wrap; each is at least minWidth pixels wide (default 160).",
  component: ({ props, renderNode }) => (
    <div className="omd-grid" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${props.minWidth ?? 160}px, 1fr))` }}>
      {renderNode(props.children)}
    </div>
  ),
});

const Tile = defineComponent({
  name: "Tile",
  props: z.object({ label: z.string().optional(), value: z.any(), sub: z.any().optional(), variant: z.enum(["stat", "clock", "freq", "arrow"]).optional() }),
  description: "A small boxed fact. stat: big value over a label. clock: label, time, sub. freq: label over a value. arrow: big value over a note.",
  component: ({ props, renderNode }) => {
    const v = props.variant ?? "stat";
    const value = content(props.value, renderNode);
    if (v === "stat")
      return (
        <div className="omd-tile omd-tile-stat">
          <b>{value}</b>
          <span>{props.label}</span>
        </div>
      );
    if (v === "arrow")
      return (
        <div className="omd-tile-arrow">
          <b>{value}</b>
          {props.label}
        </div>
      );
    return (
      <div className={`omd-tile omd-tile-${v}`}>
        <div className="omd-tile-label">{props.label}</div>
        <div className="omd-tile-value">{value}</div>
        {props.sub != null ? <div className="omd-tile-sub">{content(props.sub, renderNode)}</div> : null}
      </div>
    );
  },
});

const Scrubber = defineComponent({
  name: "Scrubber",
  props: z.object({ name: z.string(), min: n, max: n, step: n.optional(), value: reactive(z.number().optional()), label: z.string().optional() }),
  description: "A native slider bound to a number $variable. It follows the variable while a Player moves it.",
  component: ({ props }) => {
    const field = useStateField(props.name, props.value);
    const value = Number(field.value ?? props.min);
    return (
      <label className="omd-grow">
        {props.label}
        <input
          type="range"
          min={props.min}
          max={props.max}
          step={props.step ?? 1}
          value={value}
          aria-label={props.label ?? props.name}
          onChange={(e) => field.setValue(Number(e.target.value))}
        />
      </label>
    );
  },
});

const Check = defineComponent({
  name: "Check",
  props: z.object({ name: z.string(), label: z.string(), value: reactive(z.boolean().optional()) }),
  description: "A checkbox bound to a true/false $variable.",
  component: ({ props }) => {
    const field = useStateField(props.name, props.value);
    return (
      <label>
        <input type="checkbox" checked={!!field.value} onChange={(e) => field.setValue(e.target.checked)} /> {props.label}
      </label>
    );
  },
});

const Btn = defineComponent({
  name: "Btn",
  props: z.object({ label: z.string(), action: z.any().optional(), variant: z.enum(["primary", "secondary"]).optional() }),
  description: "A plain button that runs an Action, e.g. Btn(\"Reset\", Action([@Set($x, 0)])).",
  component: ({ props }) => {
    const trigger = useTriggerAction();
    const formName = useFormName();
    return (
      <button type="button" className={props.variant === "primary" ? "omd-btn omd-btn-primary" : "omd-btn"} onClick={() => trigger(props.label, formName, props.action)}>
        {props.label}
      </button>
    );
  },
});

// Moves a number $variable towards `to` over time.
//  ease "linear": constant speed, (to - from) per `duration` ms, starting wherever the variable is;
//                 a finished run starts again at `from`; `loop` wraps around forever.
//  ease "out":    eases from wherever the variable is to `to` in `duration` ms.
// Stops when anything else changes the variable (a slider, a button). With autoplay it starts the
// first time it scrolls into view while the variable is still at `from`. With reduced motion it
// jumps straight to `to`. Without a label it is invisible.
const Player = defineComponent({
  name: "Player",
  props: z.object({
    name: z.string(),
    value: reactive(z.any()),
    to: n,
    duration: n,
    label: z.string().optional(),
    pauseLabel: z.string().optional(),
    autoplay: z.boolean().optional(),
    loop: z.boolean().optional(),
    ease: z.enum(["linear", "out"]).optional(),
    from: n.optional(),
    variant: z.enum(["primary", "secondary"]).optional(),
  }),
  description: "Animates a number $variable towards `to` over `duration` ms. A play/pause button if it has a label, invisible otherwise.",
  component: ({ props }) => {
    const field = useStateField(props.name, props.value);
    const [running, setRunning] = useState(false);
    const el = useRef<HTMLElement>(null);
    const live = useRef({ field, props });
    live.current = { field, props };
    const run = useRef({ raf: 0, pos: 0, wrote: new Set<number>() });

    const current = () => Number(live.current.field.value) || 0;
    const write = (v: number) => {
      const r = run.current;
      r.pos = v;
      r.wrote.add(v);
      if (r.wrote.size > 8) r.wrote.delete(r.wrote.values().next().value!);
      live.current.field.setValue(v);
    };
    const stop = () => {
      cancelAnimationFrame(run.current.raf);
      run.current.raf = 0;
      setRunning(false);
    };
    const start = () => {
      const p = live.current.props;
      const from = p.from ?? 0;
      const dur = Math.max(1, p.duration);
      if (reducedMotion()) return write(p.to);
      cancelAnimationFrame(run.current.raf);
      const begin = p.ease !== "out" && current() >= p.to ? from : current();
      run.current.wrote.clear();
      write(begin);
      let t0 = 0;
      let last = 0;
      const tick = (ts: number) => {
        if (p.ease === "out") {
          if (!t0) t0 = ts;
          const k = Math.min(1, (ts - t0) / dur);
          write(k >= 1 ? p.to : begin + (p.to - begin) * (1 - (1 - k) ** 3));
          if (k >= 1) return stop();
        } else {
          const dt = last ? ts - last : 16;
          last = ts;
          let v = run.current.pos + (dt * (p.to - from)) / dur;
          if (v >= p.to) {
            if (!p.loop) {
              write(p.to);
              return stop();
            }
            v = from + ((v - from) % (p.to - from));
          }
          write(v);
        }
        run.current.raf = requestAnimationFrame(tick);
      };
      setRunning(true);
      run.current.raf = requestAnimationFrame(tick);
    };

    // Someone else moved the variable: give way.
    useEffect(() => {
      if (run.current.raf && !run.current.wrote.has(Number(field.value))) stop();
    }, [field.value]);

    // Watch the whole figure, not the button: the button can sit below the fold while the drawing is
    // in view. "In view" is 45% of the figure, or 45% of the screen for figures taller than it.
    useEffect(() => {
      if (!props.autoplay || !el.current || !("IntersectionObserver" in window)) return;
      const target = el.current.closest(".omd-fig") ?? el.current;
      const io = new IntersectionObserver(
        (entries) => {
          const seen = entries.some(
            (e) => e.isIntersecting && (e.intersectionRatio >= 0.45 || e.intersectionRect.height >= 0.45 * (e.rootBounds?.height ?? Infinity)),
          );
          if (!seen) return;
          io.disconnect();
          if (current() === (live.current.props.from ?? 0)) start();
        },
        { threshold: [0, 0.1, 0.2, 0.3, 0.45] },
      );
      io.observe(target);
      return () => io.disconnect();
    }, [props.autoplay]);

    useEffect(() => () => cancelAnimationFrame(run.current.raf), []);

    if (!props.label) return <span ref={el} className="omd-player-anchor" />;
    const onClick = () => (running && props.pauseLabel ? stop() : start());
    return (
      <button ref={el as never} type="button" className={props.variant === "secondary" ? "omd-btn" : "omd-btn omd-btn-primary"} onClick={onClick}>
        {running && props.pauseLabel ? props.pauseLabel : props.label}
      </button>
    );
  },
});

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const one = (name: string, description: string, fn: (x: number) => number) =>
  defineFunction({ name, description, params: z.object({ number: z.number() }), returns: z.number(), fn: ({ number }) => fn(num(number)) });

const point = z.object({ x: z.number(), y: z.number() });
const circle = z.object({ x: z.number(), y: z.number(), r: z.number() });
const dist = (a: Point, b: Point) => Math.hypot(num(a?.x) - num(b?.x), num(a?.y) - num(b?.y));

export const functions = [
  defineFunction({
    name: "Intersect",
    description: "Where two circles {x, y, r} cross: a list of 0, 1 or 2 points {x, y}. With near, the closest point comes first.",
    params: z.object({ a: circle, b: circle, near: point.optional() }),
    returns: z.array(point),
    fn: ({ a, b, near }) => {
      const [x0, y0, r0, x1, y1, r1] = [a?.x, a?.y, a?.r, b?.x, b?.y, b?.r].map(num);
      const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
      if (d === 0 || d > r0 + r1 || d < Math.abs(r0 - r1)) return [];
      const along = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
      const h = Math.sqrt(Math.max(0, r0 * r0 - along * along));
      const mx = x0 + (along * dx) / d, my = y0 + (along * dy) / d;
      const pts = [{ x: mx - (h * dy) / d, y: my + (h * dx) / d }, { x: mx + (h * dy) / d, y: my - (h * dx) / d }];
      return near ? pts.sort((p, q) => dist(p, near) - dist(q, near)) : pts;
    },
  }),
  defineFunction({
    name: "Distance",
    description: "Straight-line distance between two points {x, y}",
    params: z.object({ a: point, b: point }),
    returns: z.number(),
    fn: ({ a, b }) => dist(a, b),
  }),
  defineFunction({
    name: "Polar",
    description: "The point at distance r and angle (radians) from (x, y): {x, y}. Angles grow clockwise in a drawing, where y points down.",
    params: z.object({ x: z.number(), y: z.number(), r: z.number(), angle: z.number() }),
    returns: point,
    fn: ({ x, y, r, angle }) => ({ x: num(x) + num(r) * Math.cos(num(angle)), y: num(y) + num(r) * Math.sin(num(angle)) }),
  }),
  one("Sin", "Sine of an angle in radians", Math.sin),
  one("Cos", "Cosine of an angle in radians", Math.cos),
  one("Sqrt", "Square root", Math.sqrt),
  one("Log10", "Base-10 logarithm", Math.log10),
  defineFunction({
    name: "Pow",
    description: "base raised to exponent",
    params: z.object({ base: z.number(), exponent: z.number() }),
    returns: z.number(),
    fn: ({ base, exponent }) => Math.pow(num(base), num(exponent)),
  }),
  defineFunction({
    name: "Precision",
    description: "Round to N significant digits, e.g. @Precision(38.46, 3) is 38.5",
    params: z.object({ number: z.number(), digits: z.number() }),
    returns: z.number(),
    fn: ({ number, digits }) => Number(num(number).toPrecision(num(digits))),
  }),
  defineFunction({
    name: "Fixed",
    description: 'Text with exactly N decimals, e.g. @Fixed(2, 1) is "2.0"',
    params: z.object({ number: z.number(), decimals: z.number() }),
    returns: z.string(),
    fn: ({ number, decimals }) => num(number).toFixed(num(decimals)),
  }),
  defineFunction({
    name: "Pad",
    description: 'Text padded on the left to width, e.g. @Pad(7, 2) is "07"',
    params: z.object({ value: z.any(), width: z.number(), fill: z.string().optional() }),
    returns: z.string(),
    fn: ({ value, width, fill }) => String(value ?? "").padStart(num(width), String(fill ?? "0")),
  }),
  defineFunction({
    name: "Locale",
    description: 'A number with thousands separators, e.g. @Locale(20200) is "20,200"',
    params: z.object({ number: z.number() }),
    returns: z.string(),
    fn: ({ number }) => num(number).toLocaleString("en-US"),
  }),
  defineFunction({
    name: "Join",
    description: "Join an array into text with a separator",
    params: z.object({ array: z.array(z.any()), separator: z.string() }),
    returns: z.string(),
    fn: ({ array, separator }) => (Array.isArray(array) ? array.join(String(separator ?? "")) : ""),
  }),
  defineFunction({
    name: "Seq",
    description: "Numbers from start to end (inclusive) in steps, e.g. @Seq(0, 1, 0.5) is [0, 0.5, 1]",
    params: z.object({ start: z.number(), end: z.number(), step: z.number() }),
    returns: z.array(z.number()),
    fn: ({ start, end, step }) => {
      const s = num(start), e = num(end), d = num(step);
      if (!(d > 0)) return [];
      const out: number[] = [];
      // ponytail: capped at 10k values so a typo can't hang the note
      for (let i = 0; s + i * d <= e + 1e-9 && i < 10000; i++) out.push(s + i * d);
      return out;
    },
  }),
];

export const figureComponents = [Svg, Plot, Circle, Ellipse, Line, Path, Polygon, Polyline, Rect, SvgText, Span, Group, Glyph, Figure, Controls, Readout, Grid, Tile, Scrubber, Check, Btn, Player];
