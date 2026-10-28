import { useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import ExperienceTimer from "./ExperienceTimer";
import { PROFILE } from "@/data/profile";
import { ERAS } from "@/data/experience";
import { clamp01, inWords, pad2, yearsSince } from "@/lib/format";
import { phase } from "@/lib/phase";
import { isTouchFirst, onLayoutResize } from "@/lib/viewport";

/** The year the career starts, and the year today: the Experience scenes run between them */
const FIRST_YEAR = PROFILE.careerStart.getFullYear();
const THIS_YEAR = Math.max(FIRST_YEAR + 1, new Date().getFullYear());

/* ------------------------------------------------------------------ */
/* Shipping since the first year                                       */
/* ------------------------------------------------------------------ */

/** Where the sun sits above the crease, in viewport heights: every line of the tunnel runs to it */
const SUN_ABOVE = 0.85;
/** How far above the sun the ceiling folds back into the wall over it, in viewport heights */
const CEILING_ABOVE = 0.45;
/** The words shrink toward the sun, so they never rise past it */
const TEXT_VANISH = SUN_ABOVE;
/** Height of a wall cell, in viewport heights; across, a cell is a twelfth of the width (a sixth on phones) */
const ROW = 0.108;
/** The floor is drawn in rows this many px tall; thinner reads smoother */
const FLOOR_STEP = 2;
/** Phones draw the floor in coarser rows: a third fewer draws per frame, still smooth at their density */
const FLOOR_STEP_TOUCH = 3;
/** The floor runs up until the words would be down to a sixteenth of their size */
const FLOOR_END = 0.94;
/** Enough lines for the floor, both walls and the ceiling on any screen */
const RAY_SLOTS = 64;
/** Where the crease sits over the scene, in viewport heights from the top: below the screen, then past the top */
const CREASE_FROM = 1.45;
const CREASE_TO = -0.2;
/** How far up the floor from the crease the words' foot starts, in viewport heights: the crease
 * then overtakes them, a little faster than they come, until they stand flat on the wall */
const WORDS_START = 0.3;
/** Share of the scene the crease takes to sweep past; the rest holds the flat wall */
const SWEEP = 0.8;
/** The arrival, as shares of the way in: the sun is up by SUN_IN */
const SUN_IN = 0.3;
/** The first line starts running out of the sun at LINES_FROM, the last LINES_STAGGER later; each takes LINES_RUN */
const LINES_FROM = 0.22;
const LINES_STAGGER = 0.2;
const LINES_RUN = 0.28;
/** The words come in from WORDS_FROM, once the lines are down, sliding WORDS_TRAVEL viewport heights down the floor */
const WORDS_FROM = 0.68;
const WORDS_TRAVEL = 0.35;

/** Writes a style only when it changes, so a scroll frame that leaves an element as it was costs nothing */
const written = new WeakMap<Element, Record<string, string>>();
const put = (el: HTMLElement | SVGElement, prop: string, value: string) => {
  const seen = written.get(el) ?? {};
  if (seen[prop] === value) return;
  seen[prop] = value;
  written.set(el, seen);
  el.style.setProperty(
    prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
    value,
  );
};

const wallGrid =
  "[background-image:linear-gradient(to_right,hsl(0_0%_100%/0.16)_1px,transparent_1px),linear-gradient(to_bottom,hsl(0_0%_100%/0.16)_1px,transparent_1px)]";

/** The words, one copy per slice of the floor and one on the wall */
const ShippingWords = ({ refFn }: { refFn: (el: HTMLDivElement | null) => void }) => (
  <div
    ref={refFn}
    className="absolute inset-x-0 top-0 flex flex-col items-center gap-[3vh] font-display uppercase leading-[0.9] tracking-[-0.01em]"
    style={{ fontWeight: 700 }}
  >
    <span className="block text-snow text-[min(25vw,25vh)] md:text-[min(17.6vw,25vh)]">Shipping</span>
    <span className="block text-snow text-[min(41vw,41vh)] md:text-[min(29vw,41vh)]">since</span>
    <span className="block text-emerald-400 text-[min(49vw,62vh)] md:text-[min(34.3vw,62vh)]">{FIRST_YEAR}</span>
  </div>
);

/**
 * Experience opens after wodniack.dev's "Coding my way since 1987". You look down a tunnel at
 * an emerald sun: a wall of cells above folds back into the ceiling, and the floor runs out of
 * the distance to a crease, where it turns down into a flat wall of cells facing you. Every
 * line of the tunnel runs straight to the sun. "Shipping since 2018" lies on the floor, leaning
 * toward the sun and shrinking into the distance, and comes toward you as you scroll, over the
 * crease, until it stands flat on the wall. The scene builds as you arrive: the sun rises, the
 * lines run out of it, then the words come down the floor.
 *
 * The floor is drawn on a canvas, row by row from one picture of the words, each row narrowed
 * toward the sun by its distance up the floor: the words narrow along straight edges while
 * keeping their height, which a single tilted plane can't do. (It was a stack of matrix3d
 * slices, which Safari tears apart.)
 */
export const ShippingSince = () => {
  const ref = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const floor = useRef<HTMLDivElement>(null);
  const floorCanvas = useRef<HTMLCanvasElement>(null);
  // The words drawn once, at the screen's width, for the floor to sample
  const picture = useRef<HTMLCanvasElement | null>(null);
  const touch = useRef(isTouchFirst());
  const wallWords = useRef<HTMLDivElement | null>(null);
  const topWall = useRef<HTMLDivElement>(null);
  const bottomWall = useRef<HTMLDivElement>(null);
  const rays_ = useRef<SVGSVGElement>(null);
  const rays = useRef<(SVGPolylineElement | null)[]>([]);
  const sun = useRef<HTMLDivElement>(null);
  // Sizes that only change with the screen: set by `layout`, read by every `draw`
  const geo = useRef({ W: 0, H: 0, dpr: 1, block: 0, year: 0, stagger: [] as number[] });
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // From when the scene's top is still well down the screen, so the sun is already rising as it
  // comes into view and there is no empty frame after the section above, to a little after it pins
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start 0.6", "start -0.3"] });
  const counter = useTransform(p, (v) => phase(v, SWEEP, SWEEP + 0.08));

  const layout = () => {
    const el = stage.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const cx = W / 2;
    const cell = W >= 768 ? W / 12 : W / 6;
    const row = ROW * H;

    [topWall.current, bottomWall.current].forEach((wall, i) => {
      if (!wall) return;
      wall.style.backgroundSize = `${cell}px ${row}px`;
      wall.style.backgroundPosition = `${cx % cell}px ${i === 0 ? "100%" : "0"}`;
    });

    // The tunnel's lines, measured from the crease: the floor's columns, the side walls' rows,
    // and the ceiling's columns, each from the sun out to where it meets the near edge
    const sunY = -SUN_ABOVE * H;
    const ceiling = -(SUN_ABOVE + CEILING_ABOVE) * H;
    // The lines sit between the ceiling and the crease; the drawing is sized to that band and
    // moved as one layer (see draw), so a scroll frame never redraws it
    if (rays_.current) {
      rays_.current.setAttribute("viewBox", `0 ${ceiling - 2} ${W} ${-ceiling + 4}`);
      rays_.current.style.height = `${-ceiling + 4}px`;
    }
    const columns: number[] = [];
    for (let i = -Math.floor(cx / cell + 1e-6); cx + i * cell <= W + 1e-6; i++) columns.push(cx + i * cell);
    const ends: [number, number][] = [];
    columns.forEach((x) => ends.push([x, 0], [x, ceiling]));
    for (let y = -row; y > ceiling; y -= row) ends.push([0, y], [W, y]);
    const stagger: number[] = [];
    rays.current.forEach((line, i) => {
      if (!line) return;
      const end = ends[i];
      if (!end) {
        line.setAttribute("points", "");
        return;
      }
      line.setAttribute("points", `${cx},${sunY} ${end[0]},${end[1]}`);
      // Straight down first, then round to straight up
      stagger[i] = Math.atan2(Math.abs(end[0] - cx), end[1] - sunY) / Math.PI;
    });

    // The picture of the words the floor is drawn from: each line set where the wall copy sets it
    const words = wallWords.current;
    const block = words?.offsetHeight ?? 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fc = floorCanvas.current;
    if (fc) {
      fc.width = Math.round(W * dpr);
      fc.height = Math.round(H * dpr);
    }
    if (words && block) {
      const pic = picture.current ?? document.createElement("canvas");
      picture.current = pic;
      pic.width = Math.round(W * dpr);
      pic.height = Math.round(block * dpr);
      const ctx = pic.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, block);
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        [...words.children].forEach((child) => {
          const line = child as HTMLElement;
          const cs = getComputedStyle(line);
          const size = parseFloat(cs.fontSize);
          const lineHeight = parseFloat(cs.lineHeight) || size * 0.9;
          ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
          ctx.fillStyle = cs.color;
          if ("letterSpacing" in ctx) ctx.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
          const text = (line.textContent ?? "").toUpperCase();
          const m = ctx.measureText(text);
          const ascent = m.fontBoundingBoxAscent || size * 0.8;
          const descent = m.fontBoundingBoxDescent || size * 0.2;
          // The browser centres the font's ascent and descent in the line box
          const baseline = line.offsetTop + (lineHeight - (ascent + descent)) / 2 + ascent;
          ctx.fillText(text, line.offsetLeft + line.offsetWidth / 2, baseline);
        });
      }
    }
    geo.current = {
      W,
      H,
      dpr,
      block,
      year: (words?.lastElementChild as HTMLElement | null)?.offsetHeight ?? 0,
      stagger,
    };
  };

  // The floor: each row of screen above the crease, at height g, shows the page at distance
  // u = -D ln(1 - g / D) up the floor, narrowed about the middle by 1 - g / D. The words' top is
  // `top` up the page, so a row samples the picture at top - u.
  const drawFloor = (crease: number, top: number, come: number) => {
    const fc = floorCanvas.current;
    const ctx = fc?.getContext("2d");
    if (!fc || !ctx) return;
    const { W, H, dpr, block } = geo.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, fc.width, fc.height);
    put(fc, "opacity", come.toFixed(3));
    const pic = picture.current;
    if (!pic || !come || !block) return;
    const D = TEXT_VANISH * H;
    const cx = W / 2;
    const u = (g: number) => -D * Math.log(1 - g / D);
    const step = touch.current ? FLOOR_STEP_TOUCH : FLOOR_STEP;
    for (let g = 0; g < FLOOR_END * D; g += step) {
      const yBottom = crease - g;
      const yTop = yBottom - step;
      if (yBottom < 0) break;
      if (yTop > H) continue;
      // Picture rows for this screen row: the far edge (higher up) is nearer the words' top
      const from = top - u(g + step);
      const to = top - u(g);
      const a = Math.max(0, from);
      const b = Math.min(block, to);
      if (b <= a) continue;
      const s = 1 - (g + step / 2) / D;
      const y0 = yTop + ((a - from) / (to - from)) * step;
      const y1 = yTop + ((b - from) / (to - from)) * step;
      ctx.drawImage(
        pic,
        0,
        a * dpr,
        pic.width,
        (b - a) * dpr,
        (cx - (W * s) / 2) * dpr,
        y0 * dpr,
        W * s * dpr,
        (y1 - y0) * dpr + 0.5,
      );
    }
  };

  const draw = (v: number) => {
    const { W, H, block, year, stagger } = geo.current;
    if (!W) return;
    const t = clamp01(v / SWEEP);
    const crease = (CREASE_FROM + (CREASE_TO - CREASE_FROM) * t) * H;
    const e = enter.get();
    const rise = phase(e, 0, SUN_IN);
    const come = phase(e, WORDS_FROM, 1);

    // How far up the page from the crease the words' top is: just up the floor at first, and at
    // the end flat on the wall with the year in the middle of the screen. Until they have come
    // in they sit further up, and slide down the floor to you.
    const far = WORDS_START * H + block;
    const flat = CREASE_TO * H - (H / 2 + year / 2) + block;
    const top = far + (flat - far) * t + (1 - come) * WORDS_TRAVEL * H;

    if (floor.current) {
      floor.current.style.transform = `translateY(${crease}px)`;
      floor.current.style.opacity = String(come);
    }
    if (wallWords.current) wallWords.current.style.transform = `translateY(${-top}px)`;
    drawFloor(crease, top, come);
    if (topWall.current)
      put(
        topWall.current,
        "transform",
        `translate3d(0, ${(crease - (SUN_ABOVE + CEILING_ABOVE + 2) * H).toFixed(1)}px, 0)`,
      );
    if (bottomWall.current) put(bottomWall.current, "transform", `translate3d(0, ${crease.toFixed(1)}px, 0)`);
    if (rays_.current)
      put(
        rays_.current,
        "transform",
        `translate3d(0, ${(crease - (SUN_ABOVE + CEILING_ABOVE) * H - 2).toFixed(1)}px, 0)`,
      );
    rays.current.forEach((line, i) => {
      if (!line || stagger[i] === undefined) return;
      const from = LINES_FROM + stagger[i] * LINES_STAGGER;
      put(line, "strokeDashoffset", (1 - phase(e, from, from + LINES_RUN)).toFixed(4));
    });
    if (sun.current) {
      put(
        sun.current,
        "transform",
        `translate(-50%, -50%) translate3d(${W / 2}px, ${(crease - SUN_ABOVE * H).toFixed(1)}px, 0) scale(${(0.4 + 0.6 * rise).toFixed(4)})`,
      );
      put(sun.current, "opacity", rise.toFixed(3));
    }
  };

  useMotionValueEvent(p, "change", draw);
  useMotionValueEvent(enter, "change", () => draw(p.get()));
  useEffect(() => {
    const redo = () => {
      layout();
      draw(p.get());
    };
    redo();
    // The words' height depends on the display font, which may still be loading
    document.fonts?.ready.then(redo);
    const offResize = onLayoutResize(redo);
    return () => offResize();
    // Draws from refs; p is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} data-reveal-skip data-glass-off className="relative h-[300vh]">
      <p className="sr-only">Shipping since {FIRST_YEAR}</p>
      <div ref={stage} aria-hidden="true" className="sticky top-0 h-screen overflow-hidden bg-night">
        {/* The tunnel's lines, all running to the sun */}
        <svg ref={rays_} className="absolute left-0 top-0 w-full will-change-transform">
          <g>
            {Array.from({ length: RAY_SLOTS }, (_, i) => (
              <polyline
                key={i}
                ref={(el) => {
                  rays.current[i] = el;
                }}
                fill="none"
                stroke="white"
                strokeOpacity={0.22}
                strokeWidth={1}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1}
              />
            ))}
          </g>
        </svg>
        {/* The wall over the ceiling, ending in the fold, and the wall under the crease */}
        <div
          ref={topWall}
          className={`will-change-transform absolute inset-x-0 top-0 h-[200vh] bg-night border-b border-white/20 ${wallGrid}`}
        />
        <div
          ref={bottomWall}
          className={`will-change-transform absolute inset-x-0 top-0 h-[200vh] bg-night border-t border-white/20 ${wallGrid}`}
        />
        <div
          ref={sun}
          className="absolute left-0 top-0 w-[min(10vh,22vw)] aspect-square rounded-full border-2 border-emerald-400 bg-night shadow-[0_0_60px_hsl(var(--accent-500)/0.35)]"
          style={{ opacity: 0 }}
        />

        {/* The words: drawn on the floor, and one flat copy on the wall under the crease */}
        <canvas ref={floorCanvas} className="absolute inset-0 w-full h-full" style={{ opacity: 0 }} />
        <div ref={floor} className="absolute inset-x-0 top-0 h-0" style={{ opacity: 0 }}>
          <div className="absolute inset-x-0 top-0 h-[200vh] overflow-clip">
            <ShippingWords
              refFn={(el) => {
                wallWords.current = el;
              }}
            />
          </div>
        </div>

        <p className="t-label absolute top-24 md:top-28 left-6 md:left-10 lg:left-12">Experience</p>
        <motion.div
          style={{ opacity: counter }}
          className="absolute left-6 md:left-10 lg:left-12 bottom-8 md:bottom-10"
        >
          <ExperienceTimer startDate={PROFILE.careerStart} inline />
        </motion.div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* The zoom out: one model → the models → the programs → the platform → the employers */
/* ------------------------------------------------------------------ */

/** Each level is this many times the size of the one inside it */
const RATIO = 3;
/** The views the camera holds on, from the one model out to the employers */
const VIEWS = 5;

/**
 * Where the camera is, in levels (0 = framing one model, 4 = the whole picture), by scene
 * progress: a hold on each level so its caption can be read, and a pull-back between them.
 */
const cameraAt = (v: number) => {
  const stops = [
    [0.06, 0.18],
    [0.26, 0.38],
    [0.46, 0.58],
    [0.65, 0.77],
  ];
  let z = 0;
  for (const [a, b] of stops) z += phase(v, a, b);
  return z;
};

/** The year on the final level: the first year → this year as the last stretch plays */
const yearAt = (v: number) => FIRST_YEAR + (THIS_YEAR - FIRST_YEAR) * phase(v, 0.82, 0.96);

/** The years of experience, for the headline: "Eight years," */
const YEARS = inWords(yearsSince(PROFILE.careerStart));

/**
 * The headline and line that close the zoom, and head the static Experience under reduced
 * motion: the heading and its paragraph, styled by the caller.
 */
export const ExperienceLede = ({ headingClassName, className }: { headingClassName: string; className: string }) => (
  <>
    <h2 className={headingClassName}>
      {YEARS} years,
      <br />
      three industries.
    </h2>
    <p className={className}>
      Semiconductor manufacturing at Yangtze Memory, telecom AI at FiberHome, autonomous-driving AI at Black Sesame,{" "}
      <span className="text-snow">and now independent work on LLMs and AI agents</span>.
    </p>
  </>
);

/** One level of the zoom: a full-screen layer, sized by how far the camera has pulled back */
const Level = ({ index, camera, children }: { index: number; camera: MotionValue<number>; children: ReactNode }) => {
  const scale = useTransform(camera, (z) => Math.pow(RATIO, index - z));
  // Gone once it is too small to read inside the level two out, or still far outside the screen
  const opacity = useTransform(camera, (z) => {
    const d = z - index;
    if (d < -1) return 0;
    return 1 - clamp01((d - 1.6) / 0.6);
  });
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? "hidden" : "visible"));
  return (
    <motion.div style={{ scale, opacity, visibility }} className="absolute inset-0 will-change-transform">
      {children}
    </motion.div>
  );
};

/** Which view this is, out of all of them: "02 / 05" */
const Step = ({ index }: { index: number }) => (
  <p className="t-figure text-[13px] tracking-[0.16em] text-emerald-300">
    {pad2(index + 1)} / {pad2(VIEWS)}
  </p>
);

/**
 * What the view on screen shows, set large at the foot of the screen on a dark plate so it
 * reads over the tiles and frames behind it; it drifts up a touch as it comes and goes.
 */
const Caption = ({ index, camera, children }: { index: number; camera: MotionValue<number>; children: ReactNode }) => {
  const opacity = useTransform(camera, (z) => clamp01(1 - Math.abs(z - index) * 2.2));
  const y = useTransform(camera, (z) => (index - z) * 24);
  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute left-4 right-4 md:right-auto md:left-10 lg:left-12 bottom-6 md:bottom-10 md:max-w-[min(36rem,60vw)] rounded-xl border border-line bg-night/85 px-4 py-3 md:px-6 md:py-5"
    >
      <Step index={index} />
      <p className="mt-2 t-heading text-[clamp(1.3rem,3.2vw,3rem)] leading-[1.02] text-snow">{children}</p>
    </motion.div>
  );
};

/**
 * The models grid around the hole the level inside sits in: nine by five on wide screens,
 * five by nine on phones, the middle and the four corners left out. 32 tiles, with the one
 * model in the hole: "30+".
 */
const modelTiles = (cols: number, rows: number, hole: [number, number, number, number]) => {
  const [c0, c1, r0, r1] = hole;
  const tiles: { c: number; r: number }[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const inHole = c >= c0 && c <= c1 && r >= r0 && r <= r1;
      const corner = (c === 0 || c === cols - 1) && (r === 0 || r === rows - 1);
      if (!inHole && !corner) tiles.push({ c, r });
    }
  return tiles.map(({ c, r }) => ({
    key: `${c}-${r}`,
    left: `${(c * 100) / cols + 1.2}%`,
    top: `${(r * 100) / rows + 1.2}%`,
    width: `${100 / cols - 2.4}%`,
    height: `${100 / rows - 2.4}%`,
  }));
};
const TILES_WIDE = modelTiles(9, 5, [3, 5, 1, 3]);
const TILES_PHONE = modelTiles(5, 9, [1, 3, 3, 5]);

/**
 * Rolls the year's last two digits to the next with no clipping window: the old pair lifts away
 * as the new one rises in. Two digits, so a decade turning over (2019 → 2020) rolls cleanly.
 */
const RollingYear = ({ progress }: { progress: MotionValue<number> }) => {
  const year = useTransform(progress, yearAt);
  const whole = useTransform(year, (y) => Math.min(THIS_YEAR, Math.floor(y)));
  const frac = useTransform(year, (y) => (y >= THIS_YEAR ? 0 : y - Math.floor(y)));
  const current = useTransform(whole, (w) => pad2(w % 100));
  const next = useTransform(whole, (w) => pad2(Math.min(THIS_YEAR, w + 1) % 100));
  const outY = useTransform(frac, (f) => `${-f * 0.45}em`);
  const outO = useTransform(frac, (f) => Math.pow(1 - f, 2));
  const inY = useTransform(frac, (f) => `${(1 - f) * 0.45}em`);
  const inO = useTransform(frac, (f) => f * f);
  return (
    <p className="t-wordmark leading-none text-[clamp(3.5rem,9vw,8rem)] tabular-nums">
      <span className="sr-only">{FIRST_YEAR} to today</span>
      <span aria-hidden="true">{String(FIRST_YEAR).slice(0, 2)}</span>
      <span aria-hidden="true" className="relative inline-block">
        <motion.span style={{ y: outY, opacity: outO }} className="inline-block text-emerald-400">
          {current}
        </motion.span>
        <motion.span style={{ y: inY, opacity: inO }} className="absolute left-0 top-0 text-emerald-400">
          {next}
        </motion.span>
      </span>
    </p>
  );
};

/** How strongly era i shows at year y: in from its own start, out as the next one starts */
const eraOpacity = (i: number, y: number) => {
  // The first is in from the start and the last stays to the end
  const fadeIn = i === 0 ? 1 : phase(y, ERAS[i].from - 0.4, ERAS[i].from);
  const fadeOut = i === ERAS.length - 1 ? 0 : phase(y, ERAS[i + 1].from - 0.4, ERAS[i + 1].from);
  return fadeIn * (1 - fadeOut);
};

/** One employer and its line, crossfading with the others as the year rolls */
const Era = ({ index, progress }: { index: number; progress: MotionValue<number> }) => {
  const opacity = useTransform(progress, (v) => eraOpacity(index, yearAt(v)));
  const era = ERAS[index];
  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <p className="t-heading text-[clamp(1.5rem,2.4vw,2.25rem)] leading-[1.05] text-snow">{era.company}</p>
      <p className="mt-2 t-body text-[15px] md:text-[17px] text-snow/75">{era.line}</p>
    </motion.div>
  );
};

/**
 * The career, shown as a pull-back after noth.in's zoom-out: it opens on one model I optimized
 * filling the screen, then the camera pulls back level by level, each level three times the
 * last: it is one of 30+ perception models; they shipped across five automotive customer
 * programs; that is one AI chip platform, with perception and LLM tools on it; and around it,
 * the employers from the first year to today, the year rolling as they change. Real figures
 * only. At the end a line drops out of the employers' column and carries on as the rail of
 * the roles below.
 */
export const PlatformZoom = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const camera = useTransform(p, cameraAt);
  const finale = useTransform(camera, (z) => clamp01((z - 3.4) / 0.5));
  // In the last stretch a line drops out of the employers' column to the foot of the screen; the
  // roles' rail starts where it leaves off, so the scene runs straight on into the roles
  const handoff = useTransform(p, (v) => phase(v, 0.88, 1));

  return (
    <div ref={ref} data-reveal-skip data-glass-off className="relative h-[560vh]">
      {/* Clipped to the screen, like the site's other pinned scenes: the outer levels are far larger than it */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Level 4: the employers round the work, and the year */}
        <Level index={4} camera={camera}>
          {/* The work, held in the middle while the employers round it change */}
          <motion.div
            style={{ opacity: finale }}
            className="absolute left-[33.3%] right-[33.3%] top-[33.3%] bottom-[33.3%] rounded-2xl border border-emerald-400/50 shadow-[0_0_80px_hsl(var(--accent-500)/0.18)]"
          >
            <p className="absolute left-1/2 -translate-x-1/2 top-full mt-4 t-figure text-[13px] uppercase tracking-[0.16em] text-emerald-300 whitespace-nowrap">
              ML in production · {FIRST_YEAR} → today
            </p>
          </motion.div>
        </Level>

        {/* Level 3: the platform, with both kinds of AI on it */}
        <Level index={3} camera={camera}>
          <div className="absolute left-[22%] right-[22%] top-[20%] bottom-[20%] rounded-[2rem] border border-emerald-400/55 bg-[radial-gradient(60%_60%_at_50%_45%,hsl(var(--accent-500)/0.08),transparent_70%)]" />
          <p className="absolute left-1/2 -translate-x-1/2 top-[22.5%] t-heading text-[clamp(1rem,2.4vw,2.25rem)] text-snow whitespace-nowrap">
            Automotive AI chip platform
          </p>
          <span className="absolute left-1/2 -translate-x-1/2 top-[9%] md:left-auto md:translate-x-0 md:right-[79%] md:top-1/2 md:-translate-y-1/2 md:mr-4 rounded-pill border border-snow/30 bg-night px-4 py-2 text-[clamp(0.875rem,1.3vw,1.15rem)] text-snow whitespace-nowrap">
            Perception models
          </span>
          <span className="absolute left-1/2 -translate-x-1/2 top-[84%] md:translate-x-0 md:left-[79%] md:top-1/2 md:-translate-y-1/2 md:ml-4 rounded-pill border border-snow/30 bg-night px-4 py-2 text-[clamp(0.875rem,1.3vw,1.15rem)] text-snow whitespace-nowrap">
            LLM tools
          </span>
        </Level>

        {/* Level 2: who the models shipped to, and who shipped them */}
        <Level index={2} camera={camera}>
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            {[
              [33.3, 50, 16, 50, "hidden md:inline"],
              [66.7, 50, 84, 50, "hidden md:inline"],
              [50, 66.7, 50, 80, "hidden md:inline"],
              [50, 33.3, 50, 18, "md:hidden"],
              [50, 66.7, 50, 69, "md:hidden"],
            ].map(([x1, y1, x2, y2, show]) => (
              <line
                key={`${x1}-${y1}-${x2}-${y2}`}
                className={String(show)}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(158 64% 52%)"
                strokeOpacity={0.5}
                strokeDasharray="1.2 1.2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <div className="absolute left-[33.3%] right-[33.3%] top-[33.3%] bottom-[33.3%] rounded-2xl border border-dashed border-snow/35" />
          {[
            [
              "Five customer programs",
              "left-1/2 -translate-x-1/2 top-[7%] w-[70%] md:translate-x-0 md:left-[2%] md:top-1/2 md:-translate-y-1/2 md:w-[14%]",
            ],
            [
              "Tier-1 suppliers",
              "left-1/2 -translate-x-1/2 top-[69%] w-[70%] md:translate-x-0 md:left-auto md:right-[2%] md:top-1/2 md:-translate-y-1/2 md:w-[14%]",
            ],
            ["A team of seven", "left-1/2 -translate-x-1/2 top-[77%] md:top-[80%] w-[50%] md:w-[20%]"],
          ].map(([label, pos]) => (
            <p
              key={label}
              className={`absolute ${pos} rounded-xl border border-emerald-400/60 bg-night px-3 py-3 text-center t-heading text-[clamp(0.95rem,1.6vw,1.5rem)] text-snow shadow-[0_0_40px_hsl(var(--accent-500)/0.12)]`}
            >
              {label}
            </p>
          ))}
        </Level>

        {/* Level 1: one of 30+ models */}
        <Level index={1} camera={camera}>
          {[
            [TILES_WIDE, "hidden md:block"],
            [TILES_PHONE, "md:hidden"],
          ].map(([tiles, show]) =>
            (tiles as typeof TILES_WIDE).map(({ key, ...box }) => (
              <span
                key={`${show}-${key}`}
                aria-hidden="true"
                className={`absolute rounded-lg border border-snow/[0.22] bg-night ${show}`}
                style={box}
              >
                {/* A sketch of a model: a status light and two lines of readout */}
                <span className="absolute left-[10%] top-[12%] w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                <span className="absolute left-[10%] bottom-[24%] w-[55%] h-[3px] rounded-full bg-snow/20" />
                <span className="absolute left-[10%] bottom-[14%] w-[35%] h-[3px] rounded-full bg-snow/[0.12]" />
              </span>
            )),
          )}
        </Level>

        {/* Level 0: the model the camera starts on */}
        <Level index={0} camera={camera}>
          <div className="absolute left-[7%] right-[7%] top-[12%] bottom-[26%] md:bottom-[25%] rounded-[2rem] border border-emerald-400/60 bg-[radial-gradient(70%_70%_at_50%_40%,hsl(var(--accent-500)/0.22),hsl(var(--night))_70%)] flex flex-col items-center justify-center text-center px-[6%]">
            <p className="t-label">One perception model, quantized</p>
            <p className="mt-6 t-statement text-[clamp(3rem,10vw,10rem)] leading-[0.9]">3.2× faster</p>
            <p className="mt-6 t-body text-snow/70 text-[clamp(0.9rem,1.5vw,1.25rem)] max-w-2xl">
              INT8 quantization for in-vehicle AI chips: up to 3.2× lower inference latency and 60% lower memory usage,
              with less than 1% mAP loss.
            </p>
          </div>
        </Level>

        {/* The year and employers, and the closing words: drawn over the zoom at their own size, so
            they never show enlarged and cut off at the screen's edges while the camera pulls back */}
        <motion.div style={{ opacity: finale }} className="absolute inset-0">
          {/* On wide screens this column lines up with the roles below, so its line meets their rail */}
          <div className="absolute inset-x-6 md:inset-x-auto md:left-[5%] lg:left-[calc(max((100%_-_1400px)_/_2,0px)_+_3rem)] md:w-[27%] top-[9%] md:top-[18%]">
            <RollingYear progress={p} />
            <div className="relative mt-4 min-h-[6.5em]">
              {ERAS.map((era, i) => (
                <Era key={era.company} index={i} progress={p} />
              ))}
            </div>
            <motion.span
              aria-hidden="true"
              style={{ scaleY: handoff }}
              className="hidden lg:block absolute left-[10px] top-full mt-8 w-px h-screen bg-emerald-400 origin-top"
            />
          </div>
          <div className="absolute inset-x-6 md:inset-x-auto md:right-[5%] md:w-[27%] bottom-[4%] md:bottom-auto md:top-[18%]">
            {/* On phones the platform's own label sits right above this; the count would crowd it */}
            <div className="hidden md:block mb-3">
              <Step index={VIEWS - 1} />
            </div>
            <ExperienceLede
              headingClassName="t-statement text-4xl md:text-5xl lg:text-6xl"
              className="mt-4 md:mt-5 t-body text-[14px] md:text-[17px] text-snow/75"
            />
          </div>
        </motion.div>

        <Caption index={0} camera={camera}>
          INT8 quantization · one model on the chip
        </Caption>
        <Caption index={1} camera={camera}>
          One of 30+ perception models I deployed
        </Caption>
        <Caption index={2} camera={camera}>
          Shipped across five automotive customer programs
        </Caption>
        <Caption index={3} camera={camera}>
          One AI chip platform, perception and LLM tools
        </Caption>
      </div>
    </div>
  );
};
