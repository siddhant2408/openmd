import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { z } from "zod/v4";
import { defineComponent } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { figureComponents, functions } from "./figures";

// What a Slot needs from the note it belongs to: where each block's element is, and when that changes.
export interface SlotTargets {
  targets: Map<string, HTMLElement>;
  subscribe: (fn: () => void) => () => void;
}
export const RuntimeContext = createContext<SlotTargets | null>(null);

// Renders a block's UI into that block's element in the note.
const Slot = defineComponent({
  name: "Slot",
  props: z.object({ id: z.string(), child: z.any() }),
  description: "Places one block's UI at its spot in the note.",
  component: ({ props, renderNode }) => {
    const runtime = useContext(RuntimeContext)!;
    const target = useSyncExternalStore(runtime.subscribe, () => runtime.targets.get(props.id) ?? null);
    return target ? createPortal(<>{renderNode(props.child)}</>, target) : null;
  },
});

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Eases from the last shown value to `value`; starts from 0 on first render.
function useTween(value: number, ms = 700) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current;
    if (start === value || reducedMotion()) {
      from.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      from.current = start + (value - start) * (1 - (1 - p) ** 3);
      setShown(from.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

const format = (n: number, decimals: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const CountUp = defineComponent({
  name: "CountUp",
  props: z.object({
    value: z.number(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    decimals: z.number().optional(),
    size: z.enum(["small", "medium", "large"]).optional(),
  }),
  description: "A number that rolls to its new value whenever it changes. Formatted with thousands separators.",
  component: ({ props }) => {
    const shown = useTween(Number(props.value) || 0);
    return (
      <span className={`intr-countup intr-countup-${props.size ?? "large"}`}>
        {props.prefix ?? ""}
        {format(shown, props.decimals ?? 0)}
        {props.suffix ?? ""}
      </span>
    );
  },
});

const Progress = defineComponent({
  name: "Progress",
  props: z.object({ value: z.number(), max: z.number(), label: z.string().optional() }),
  description: "A bar that fills toward max. Green at 100%+, amber from 80%, red below.",
  component: ({ props }) => {
    const pct = props.max > 0 ? (Number(props.value) / props.max) * 100 : 0;
    const shown = useTween(pct);
    const tone = pct >= 100 ? "good" : pct >= 80 ? "close" : "behind";
    return (
      <div className="intr-progress">
        <div className="intr-progress-row">
          <span>{props.label ?? ""}</span>
          <span>{format(shown, 1)}%</span>
        </div>
        <div className="intr-progress-track">
          <div className={`intr-progress-fill intr-progress-${tone}`} style={{ width: `${Math.min(shown, 100)}%` }} />
        </div>
      </div>
    );
  },
});

const Reveal = defineComponent({
  name: "Reveal",
  props: z.object({
    children: z.array(z.any()),
    effect: z.enum(["fade", "slide", "scale"]).optional(),
    delay: z.number().optional(),
  }),
  description: "Animates its children in when they first appear. delay is in milliseconds.",
  component: ({ props, renderNode }) => (
    <div className={`intr-reveal intr-reveal-${props.effect ?? "slide"}`} style={{ animationDelay: `${props.delay ?? 0}ms` }}>
      {renderNode(props.children)}
    </div>
  ),
});

const inCards = ["Card.children", "TabItem.content", "AccordionItem.content"];
export const library = openuiLibrary.extend({
  components: {
    add: [
      Slot,
      { component: CountUp, slots: inCards },
      { component: Progress, slots: inCards },
      { component: Reveal, slots: inCards },
      ...figureComponents,
    ],
  },
  functions: { add: functions },
});
