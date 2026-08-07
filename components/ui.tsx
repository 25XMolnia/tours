"use client";
// components/ui.tsx — все компоненты портала, объединены из 14 файлов
import { BOAT_SHORT, titleLines, applyPackageDeal, boatAllInCents, eligibleBoats, flexAddonCents, flightPriceCents, fmt12, fmtMoney, fmtWait, minutesBetween, packageDiscountPct, partySize, priceBreakdown, seatsOpenFor, todayVancouver } from "@/lib/core";
import type { BoatType, DataSources, DayCombos, DayOffer, FlightLeg, FlightVariant, Pax, PriceBreakdown, TourSlot, TourWithFlights } from "@/lib/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ===================== icons.tsx ===================== */

type P = { className?: string };

export function IconPlane({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2.5 13.4 21 4.5c.6-.3 1.2.3.9.9l-6.6 15.2c-.3.6-1.1.6-1.4 0l-2.3-5-5.1-1.9c-.6-.2-.6-1 0-1.3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="m11.6 15.6 4.9-6.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconWhale({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 9c1.5 3.4 4.4 5.2 8 5.2S18.5 12.4 20 9c.3-.7-.3-1.3-1-1.1-1.6.5-2.7 1.4-3.5 2.6-.6-2.3-2-3.9-3.5-4.6-.7-.3-1.3.3-1.1 1 .4 1.3.4 2.6.1 3.7C10 9.3 8.6 8.4 6.9 7.9 6.2 7.7 5.7 8.3 6 9H4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M3 17c1.4 1 2.9 1 4.3 0 1.4 1 2.9 1 4.3 0 1.4 1 2.9 1 4.3 0 1.4 1 2.9 1 4.1 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconClock({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconUsers({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M3 19.5c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15.5 5.6a3.5 3.5 0 0 1 0 5.8M18.4 15.4c1.4.8 2.3 2.1 2.6 4.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconWalk({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="13" cy="4.5" r="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M13 8.5 10 10l-1.5 4M13 8.5l2 3 3 1.5M13 8.5l-.5 5 2.5 3.5.5 4M11 14l-2.5 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCheck({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronRight({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronLeft({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconAlert({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3 2.5 20h19L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9.5V14M12 16.8v.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ===================== Waves.tsx ===================== */

/** The waterline between a navy band and the page. Color rides on currentColor. */
export function Waves({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ===================== SiteNav.tsx ===================== */

/**
 * The platform frame: a navy bar carrying the brand mark alone. The REV
 * artwork is white, which is exactly what a navy bar wants, so no plate.
 */
export function SiteNav() {
  return (
    <nav className="sticky top-0 z-40 bg-navy">
      <div className="mx-auto flex max-w-6xl items-center px-5 py-3.5 sm:px-8">
        <Link href="/" aria-label="Harbour Air day trips, home" className="flex items-center no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://i.postimg.cc/hPPNvZyP/strapi-Harbour-Air-REV-2-C-290f4c3765.png"
            alt="Harbour Air"
            className="h-7 w-auto"
          />
        </Link>
      </div>
    </nav>
  );
}

/* ===================== FromPrice.tsx ===================== */

/**
 * The "from" figure on a card, per guest, all in.
 *
 * It is the cheapest bookable day the feed can currently sell for one adult,
 * with the package deal applied where one exists. Real inventory, real
 * prices, never a hardcoded number: when nothing can be priced the line does
 * not render, because a made-up "from" is worse than none.
 */
export function FromPrice({
  className,
  suffix = "a guest, all in",
  endpoint = "/api/calendar",
  extraParams = "",
  discountPct = 0,
}: {
  className?: string;
  suffix?: string;
  /** Which availability feed prices the card: the whale day or a flight pair. */
  endpoint?: string;
  /** e.g. "out=CXH:GLK&back=GLK:CXH" for the flights-only feed. */
  extraParams?: string;
  /** The package deal, so a "from" never overstates what a day starts at. */
  discountPct?: number;
}) {
  const [cents, setCents] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const today = todayVancouver();
    const months: [number, number][] = [];
    const y = Number(today.slice(0, 4));
    const m = Number(today.slice(5, 7));
    months.push([y, m]);
    months.push(m === 12 ? [y + 1, 1] : [y, m + 1]);

    (async () => {
      for (const [yy, mm] of months) {
        try {
          const r = await fetch(
            `${endpoint}?year=${yy}&month=${mm}&males=1${extraParams ? `&${extraParams}` : ""}`
          );
          const data: { days?: Record<string, DayOffer> } = await r.json();
          const prices = Object.values(data.days ?? {})
            .filter((d) => d.ok && d.fromCents !== null)
            .map((d) => d.fromCents as number);
          if (prices.length > 0) {
            if (alive) setCents(Math.min(...prices));
            return;
          }
        } catch {
          // Try the next month, then give up quietly.
        }
      }
    })().finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [endpoint, extraParams]);

  if (loading) {
    return (
      <span className={`inline-block h-[1.1em] w-24 animate-pulse rounded-md bg-current opacity-20 ${className ?? ""}`} />
    );
  }
  if (cents === null) return null;
  const final = cents - Math.round((cents * discountPct) / 100);

  return (
    <span className={className}>
      From <b className="tabular-nums">{fmtMoney(final)}</b> {suffix}
    </span>
  );
}

/* ===================== HomeTop.tsx ===================== */

/**
 * The top of the home page as one piece: the navy bar, the hero, and the plan
 * bar, because the plan bar lives in two places at once. In the hero it is
 * the big capsule; scroll it under the bar and it docks top left as a small
 * pill, same state, same values, and scrolls you back up when tapped. An
 * IntersectionObserver watches the big capsule rather than a magic pixel
 * number, so the handoff happens exactly when the capsule leaves the screen.
 */
export function HomeTop({
  initialDate,
  initialAdults,
}: {
  initialDate?: string;
  initialAdults?: number;
}) {
  const router = useRouter();
  const today = useMemo(() => todayVancouver(), []);

  const [date, setDate] = useState(initialDate && initialDate >= today ? initialDate : today);
  const [adults, setAdults] = useState(
    initialAdults && initialAdults >= 1 && initialAdults <= 8 ? initialAdults : 1
  );
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [whoOpen, setWhoOpen] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);

  // Docking: true once the big capsule has scrolled up under the navy bar.
  const barRef = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setDocked(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const whoLabel =
    `${adults} ${adults === 1 ? "adult" : "adults"}` +
    (children > 0 ? `, ${children} ${children === 1 ? "kid" : "kids"}` : "") +
    (infants > 0 ? `, ${infants} ${infants === 1 ? "infant" : "infants"}` : "");
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const go = () => {
    const qs = new URLSearchParams({
      date,
      adults: String(adults),
      children: String(children),
      infants: String(infants),
    });
    router.push(`/?${qs.toString()}#days`, { scroll: false });
    document.getElementById("days")?.scrollIntoView({ behavior: "smooth" });
  };

  const backToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <nav className="sticky top-0 z-40 bg-navy">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-8">
          <Link
            href="/"
            aria-label="Harbour Air day trips, home"
            className="flex shrink-0 items-center no-underline"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://i.postimg.cc/hPPNvZyP/strapi-Harbour-Air-REV-2-C-290f4c3765.png"
              alt="Harbour Air"
              className="h-7 w-auto"
            />
          </Link>

          {/* The docked pill: the plan bar, shrunk into the top left. */}
          <div
            aria-hidden={!docked}
            className={[
              "flex origin-left items-center transition-all duration-300 ease-out",
              docked
                ? "translate-x-0 scale-100 opacity-100"
                : "pointer-events-none -translate-x-5 scale-90 opacity-0",
            ].join(" ")}
          >
            <div className="flex items-center gap-1 rounded-full bg-white p-1 pl-4 shadow-lift">
              <button
                type="button"
                onClick={backToTop}
                tabIndex={docked ? 0 : -1}
                className="py-1.5 text-left"
              >
                <span className="font-display text-[13px] font-extrabold text-navy">
                  {dateLabel}
                </span>
                <span className="px-2 text-navy/30">|</span>
                <span className="text-[12.5px] font-bold text-navy/65">{whoLabel}</span>
              </button>
              <button
                type="button"
                onClick={go}
                tabIndex={docked ? 0 : -1}
                aria-label="Find your day"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-smart text-navy transition-transform hover:scale-105"
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden bg-navy pb-24 pt-14 text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h1 className="max-w-2xl text-5xl sm:text-6xl">
            Big days out, by <span className="text-smart">seaplane</span>.
          </h1>
          <p className="mt-4 max-w-xl text-[16.5px] leading-relaxed text-pale">
            Whole days, planned end to end: the flight out, the thing itself,
            the flight home.
          </p>
        </div>
        <svg
          className="absolute right-[8%] top-14 opacity-60"
          width="120"
          height="40"
          viewBox="0 0 120 40"
          aria-hidden="true"
        >
          <path
            d="M5 20 Q13 12 21 20 M21 20 Q29 12 37 20 M60 12 Q66 6 72 12 M72 12 Q78 6 84 12"
            stroke="#99D3FF"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <Waves className="absolute inset-x-0 -bottom-px h-12 w-full text-mist" />
      </header>

      {/* The big capsule. When docked it slips up and hands over to the pill. */}
      <div
        ref={barRef}
        aria-hidden={docked}
        className={[
          "relative z-10 mx-auto -mt-11 max-w-4xl px-5 transition-all duration-300 ease-out sm:px-8",
          docked ? "pointer-events-none -translate-y-3 scale-[.97] opacity-0" : "opacity-100",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-stretch gap-1 rounded-[28px] bg-white p-2 shadow-ticket sm:flex-nowrap sm:rounded-full">
          <button
            type="button"
            tabIndex={docked ? -1 : 0}
            onClick={() => dateRef.current?.showPicker?.() ?? dateRef.current?.focus()}
            className="relative min-w-[160px] flex-1 rounded-full px-6 py-2.5 text-left transition-colors hover:bg-mist"
          >
            <span className="block text-[11px] font-extrabold text-cobalt">Day</span>
            <input
              ref={dateRef}
              type="date"
              min={today}
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="w-full cursor-pointer border-none bg-transparent p-0 font-display text-[15px] font-extrabold text-navy outline-none"
            />
          </button>

          <div className="relative min-w-[160px] flex-1 border-pale sm:border-l">
            <button
              type="button"
              tabIndex={docked ? -1 : 0}
              onClick={() => setWhoOpen((o) => !o)}
              className="w-full rounded-full px-6 py-2.5 text-left transition-colors hover:bg-mist"
            >
              <span className="block text-[11px] font-extrabold text-cobalt">Travellers</span>
              <span className="font-display text-[15px] font-extrabold">{whoLabel}</span>
            </button>
            {whoOpen && (
              <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-72 rounded-3xl border border-pale bg-white p-4 shadow-ticket">
                <MiniStepper label="Adults" hint="13 plus" value={adults} min={1} max={8} onChange={setAdults} />
                <MiniStepper label="Kids" hint="3 to 12" value={children} min={0} max={6} onChange={setChildren} />
                <MiniStepper
                  label="Infants"
                  hint="Under 3, on a lap"
                  value={infants}
                  min={0}
                  max={adults}
                  onChange={setInfants}
                />
                <button
                  type="button"
                  onClick={() => setWhoOpen(false)}
                  className="mt-2 w-full rounded-full bg-navy py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-cobalt"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            tabIndex={docked ? -1 : 0}
            onClick={go}
            className="w-full rounded-full bg-smart px-8 py-4 font-display text-[15px] font-extrabold text-navy transition-transform hover:scale-[1.02] sm:w-auto sm:py-0"
          >
            Find your day
          </button>
        </div>
      </div>
    </>
  );
}

function MiniStepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-extrabold">{label}</p>
        <p className="text-[11px] font-semibold text-navy/50">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="chip h-8 w-8 px-0 py-0 leading-none"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Fewer ${label}`}
        >
          -
        </button>
        <span className="w-4 text-center font-display text-base font-extrabold tabular-nums">{value}</span>
        <button
          type="button"
          className="chip h-8 w-8 px-0 py-0 leading-none"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`More ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ===================== Calendar.tsx ===================== */

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "$1,221.75" is too wide for a calendar square, so squares round down to the dollar. */
function short(cents: number): string {
  return `$${Math.floor(cents / 100).toLocaleString("en-CA")}`;
}

export function Calendar({
  year,
  month,
  days,
  loading,
  value,
  minDate,
  onSelect,
  onMonthChange,
}: {
  year: number;
  month: number;
  days: Record<string, DayOffer>;
  loading: boolean;
  value: string | null;
  minDate: string;
  onSelect: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}) {
  const first = new Date(year, month - 1, 1);
  const startPad = first.getDay();
  const count = new Date(year, month, 0).getDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: count }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      return `${year}-${String(month).padStart(2, "0")}-${d}`;
    }),
  ];

  const prev = () => {
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    onMonthChange(y, m);
  };
  const next = () => {
    const m = month === 12 ? 1 : month + 1;
    const y = month === 12 ? year + 1 : year;
    onMonthChange(y, m);
  };

  const atMin = `${year}-${String(month).padStart(2, "0")}` <= minDate.slice(0, 7);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={atMin}
          className="chip flex items-center px-3 py-1.5"
          aria-label="Previous month"
        >
          <IconChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-display text-lg font-bold">
          {MONTHS[month - 1]} {year}
        </p>
        <button
          type="button"
          onClick={next}
          className="chip flex items-center px-3 py-1.5"
          aria-label="Next month"
        >
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-[11px] font-semibold text-cobalt">
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (date === null) return <div key={`pad-${i}`} />;

          const offer = days[date];
          const open = offer?.ok === true && date >= minDate;
          const price = offer?.fromCents ?? null;
          const active = value === date;

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              disabled={loading || !open}
              data-active={active}
              title={open && price !== null ? `From ${fmtMoney(price)} for your group` : undefined}
              className={[
                "flex aspect-square flex-col items-center justify-center rounded-xl px-0.5 transition-colors",
                loading
                  ? "animate-pulse bg-mist text-transparent"
                  : !open
                    ? "bg-mist text-navy/25 line-through decoration-navy/20"
                    : active
                      ? "bg-cobalt/5 text-navy ring-2 ring-cobalt"
                      : "bg-pale text-navy hover:bg-sky",
              ].join(" ")}
            >
              <span className="text-sm font-bold leading-none">{Number(date.slice(8))}</span>
              {!loading && open && price !== null && (
                <span className="mt-1 text-[10px] font-semibold leading-none tabular-nums text-navy/55">
                  {short(price)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== Timeline.tsx ===================== */

/**
 * The day as a strip you can rearrange.
 *
 * Three stops, in the order they happen, each with its alternatives sitting
 * underneath as times. Between the stops sits the gap that changing a time
 * actually moves. No icons and no connector line: the anchor of each stop is
 * the departure time itself, big and tabular, which updates as the guest
 * picks, so the data is the graphic.
 */
export function Timeline({
  tours,
  pax,
  tourPk,
  outboundId,
  returnId,
  onPickTour,
  onPickOutbound,
  onPickReturn,
}: {
  tours: TourWithFlights[];
  pax: Pax;
  tourPk: string | null;
  outboundId: string | null;
  returnId: string | null;
  onPickTour: (pk: string) => void;
  onPickOutbound: (id: string) => void;
  onPickReturn: (id: string) => void;
}) {
  const tour = tours.find((t) => t.availabilityPk === tourPk) ?? null;
  const outbound = tour?.outbound.find((f) => f.id === outboundId) ?? null;
  const ret = tour?.returns.find((f) => f.id === returnId) ?? null;

  return (
    <div>
      <Stop
        anchor={outbound ? fmt12(outbound.dep) : null}
        label="out"
        title="Fly to Victoria"
        time={outbound ? `${fmt12(outbound.dep)} to ${fmt12(outbound.arr)}` : "Pick a flight"}
        price={outbound ? flightPriceCents(outbound, pax) : null}
      >
        {tour ? (
          <FlightChips
            legs={tour.outbound}
            pax={pax}
            selected={outboundId}
            onPick={onPickOutbound}
          />
        ) : (
          <Muted text="Choose a sailing first and the flights that fit it show up here." />
        )}
      </Stop>

      {outbound && tour && (
        <Gap text={`${fmtWait(minutesBetween(outbound.arr, tour.start))} from landing to the boat`} />
      )}

      <Stop
        anchor={tour ? fmt12(tour.start) : null}
        label="boat"
        title="Whale watching"
        time={tour ? `${fmt12(tour.start)} to ${fmt12(tour.end)}` : "Pick a sailing"}
        price={null}
      >
        {tour && !tour.seatsUnknown && (
          <p className="mb-2 text-xs text-navy/55">{tour.seatsLeft} seats left on the boat</p>
        )}
        <div className="flex flex-wrap gap-2">
          {tours.map((t) => (
            <button
              key={t.availabilityPk}
              type="button"
              className="chip py-1.5 text-xs"
              data-active={tourPk === t.availabilityPk}
              onClick={() => onPickTour(t.availabilityPk)}
            >
              <span className="tabular-nums">{fmt12(t.start)}</span>
            </button>
          ))}
        </div>
      </Stop>

      {ret && tour && (
        <Gap text={`${fmtWait(minutesBetween(tour.end, ret.dep))} from the boat to your flight home`} />
      )}

      <Stop
        anchor={ret ? fmt12(ret.dep) : null}
        label="home"
        title="Fly to Vancouver"
        time={ret ? `${fmt12(ret.dep)} to ${fmt12(ret.arr)}` : "Pick a flight"}
        price={ret ? flightPriceCents(ret, pax) : null}
        last
      >
        {tour ? (
          <FlightChips legs={tour.returns} pax={pax} selected={returnId} onPick={onPickReturn} />
        ) : (
          <Muted text="Same here: the sailing sets which flights get you home." />
        )}
      </Stop>
    </div>
  );
}

function FlightChips({
  legs,
  pax,
  selected,
  onPick,
}: {
  legs: FlightLeg[];
  pax: Pax;
  selected: string | null;
  onPick: (id: string) => void;
}) {
  if (legs.length === 0) {
    return <Muted text="No flight can carry your group around this sailing." />;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {legs.map((f) => {
        const cents = flightPriceCents(f, pax);
        const open = seatsOpenFor(f, pax);
        return (
          <button
            key={f.id}
            type="button"
            className="chip flex items-baseline gap-1.5 py-1.5 text-xs"
            data-active={selected === f.id}
            onClick={() => onPick(f.id)}
            title={f.fromCents !== null ? `From ${fmtMoney(f.fromCents)} a seat` : undefined}
          >
            <span className="tabular-nums">{fmt12(f.dep)}</span>
            {cents !== null && (
              <span className="font-bold tabular-nums text-cobalt">{fmtMoney(cents)}</span>
            )}
            {open <= 4 && <span className="font-bold text-ember">{open} left</span>}
          </button>
        );
      })}
    </div>
  );
}

function Stop({
  anchor,
  label,
  title,
  time,
  price,
  last,
  children,
}: {
  /** The departure time of the picked leg, the stop's whole left column. */
  anchor: string | null;
  label: string;
  title: string;
  time: string;
  price: number | null;
  last?: boolean;
  children: React.ReactNode;
}) {
  const [big, meridiem] = anchor ? [anchor.replace(/ (am|pm)$/, ""), anchor.split(" ").pop()] : ["--:--", null];
  return (
    <div className={`grid grid-cols-[74px_1fr] gap-4 ${last ? "" : "pb-2"}`}>
      <div className={`pt-1 ${anchor ? "" : "opacity-35"}`}>
        <p className="font-display text-[19px] font-black leading-none tabular-nums">
          {big}
          {meridiem && <span className="ml-0.5 text-[11px] font-extrabold">{meridiem}</span>}
        </p>
        <p className="mt-1 text-[11px] font-extrabold text-cobalt">{label}</p>
      </div>
      <div className="min-w-0 pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-sm font-bold">{title}</p>
          {price !== null && (
            <p className="font-display text-sm font-bold tabular-nums">{fmtMoney(price)}</p>
          )}
        </div>
        <p className="mt-0.5 font-display text-base font-bold tabular-nums">{time}</p>
        <div className="mt-2.5">{children}</div>
      </div>
    </div>
  );
}

function Gap({ text }: { text: string }) {
  return (
    <p className="mb-4 ml-[90px] text-xs font-extrabold text-navy/45">{text}</p>
  );
}

function Muted({ text }: { text: string }) {
  return <p className="text-xs text-navy/50">{text}</p>;
}

/* ===================== bits.tsx ===================== */

/**
 * The shared anatomy of every booking flow on the site: the numbered station
 * on the yellow thread, the ribbon cells, the steppers, the hints. The whale
 * flow and the flights-only flow are different products wearing the same
 * clothes, and this file is the wardrobe.
 */



export function qsFrom(pax: Pax): string {
  return new URLSearchParams({
    males: String(pax.males),
    females: String(pax.females),
    x: String(pax.x),
    children: String(pax.children),
    infants: String(pax.infants),
    pregnant: pax.pregnant ? "1" : "0",
    senior: pax.senior ? "1" : "0",
  }).toString();
}

export function Thread() {
  return (
    <div
      className="absolute bottom-10 left-[41px] top-16 hidden w-[3px] sm:block"
      style={{
        backgroundImage:
          "repeating-linear-gradient(180deg,#FFDE00 0 10px,transparent 10px 22px)",
      }}
      aria-hidden="true"
    />
  );
}

export function Station({
  n,
  title,
  note,
  last,
  children,
}: {
  n: number;
  title: string;
  note?: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`relative sm:pl-[76px] ${last ? "" : "mb-14"}`}>
      <span
        className="absolute left-0 top-0 hidden h-11 w-11 items-center justify-center rounded-full bg-navy font-display text-[17px] font-black text-smart ring-[6px] ring-mist sm:flex"
        aria-hidden="true"
      >
        {n}
      </span>
      <h2 className="text-3xl">{title}</h2>
      {note && <p className="mt-1 text-[15px] text-navy/60">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Cell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex min-w-[190px] flex-1 items-center rounded-2xl bg-mist px-4 py-3 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function StepperInline({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div>
        <p className="text-sm font-extrabold">{label}</p>
        <p className="text-[11.5px] font-semibold text-navy/55">{hint}</p>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="chip h-8 w-8 px-0 py-0 leading-none"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Fewer ${label}`}
        >
          -
        </button>
        <span className="w-4 text-center font-display text-base font-extrabold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          className="chip h-8 w-8 px-0 py-0 leading-none"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`More ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

/**
 * The whole "who's coming" ribbon. A seaplane is loaded by weight, and every
 * adult is planned at the male standard, the heaviest one, so the seat counts
 * on screen can only be pessimistic, never wrong. The interface says nothing
 * about it.
 */
export function TravellersRibbon({
  adults,
  setAdults,
  children,
  setChildren,
  infants,
  setInfants,
  pregnant,
  setPregnant,
  senior,
  setSenior,
  withBoatRules,
}: {
  adults: number;
  setAdults: (v: number) => void;
  children: number;
  setChildren: (v: number) => void;
  infants: number;
  setInfants: React.Dispatch<React.SetStateAction<number>>;
  pregnant: boolean;
  setPregnant: (v: boolean) => void;
  senior: boolean;
  setSenior: (v: boolean) => void;
  /** The expecting and 65-plus checkboxes matter to the boat, not the plane. */
  withBoatRules: boolean;
}) {
  return (
    <div className="flex flex-wrap items-stretch gap-2.5 rounded-3xl border border-pale bg-white p-2.5 shadow-ticket">
      <Cell>
        <StepperInline
          label="Adults"
          hint="13 plus"
          value={adults}
          min={1}
          max={8}
          onChange={(v) => {
            setAdults(v);
            setInfants((i) => Math.min(i, v));
          }}
        />
      </Cell>
      <Cell>
        <StepperInline label="Kids" hint="3 to 12" value={children} min={0} max={6} onChange={setChildren} />
      </Cell>
      <Cell>
        <StepperInline
          label="Infants"
          hint="Under 3, on a lap"
          value={infants}
          min={0}
          max={adults}
          onChange={setInfants}
        />
      </Cell>
      {withBoatRules && (
        <Cell className="flex-col items-start justify-center gap-2">
          <label className="flex cursor-pointer items-center gap-2.5 text-[12.5px] font-bold text-navy/70">
            <input
              type="checkbox"
              checked={pregnant}
              onChange={(e) => setPregnant(e.target.checked)}
              className="h-4 w-4 accent-[#0072DA]"
            />
            Someone is expecting
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-[12.5px] font-bold text-navy/70">
            <input
              type="checkbox"
              checked={senior}
              onChange={(e) => setSenior(e.target.checked)}
              className="h-4 w-4 accent-[#0072DA]"
            />
            Someone is 65 or older
          </label>
        </Cell>
      )}
    </div>
  );
}

export function Hint({ text, pulse }: { text: string; pulse?: boolean }) {
  return (
    <p
      className={`rounded-3xl border border-pale bg-white px-5 py-8 text-center text-sm text-navy/60 shadow-ticket ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      {text}
    </p>
  );
}

export function ErrorNote({ text }: { text: string }) {
  return (
    <p className="mb-4 flex items-start gap-2 rounded-2xl bg-ember/10 px-4 py-3 text-sm font-semibold text-navy">
      <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
      <span>{text}</span>
    </p>
  );
}

/* ===================== DayCapsule.tsx ===================== */

/**
 * The capsule: the same white pill a guest already met on the home page, now
 * answering "when and who" for one tour. Tapping it opens a single popover
 * with the priced month and the party steppers together, so the two questions
 * that drive every price live in one place. The calendar data is owned by the
 * flow; this component is the pill and the popover mechanics.
 */
export function DayCapsule({
  align = "left",
  variant = "pill",
  date,
  onDate,
  ym,
  onMonthChange,
  calDays,
  calLoading,
  calError,
  today,
  adults,
  setAdults,
  children,
  setChildren,
  infants,
  setInfants,
  pregnant,
  setPregnant,
  senior,
  setSenior,
  withBoatRules,
}: {
  /** Which capsule edge the popover hangs from; "right" for the hero corner. */
  align?: "left" | "right";
  /** "pill" is the white capsule in the hero; "fields" prints the same two
   *  answers as bare boarding-pass fields, no capsule and no chrome. */
  variant?: "pill" | "fields";
  date: string | null;
  onDate: (d: string) => void;
  ym: { y: number; m: number };
  onMonthChange: (y: number, m: number) => void;
  calDays: Record<string, DayOffer>;
  calLoading: boolean;
  calError: string | null;
  today: string;
  adults: number;
  setAdults: (v: number) => void;
  children: number;
  setChildren: (v: number) => void;
  infants: number;
  setInfants: React.Dispatch<React.SetStateAction<number>>;
  pregnant: boolean;
  setPregnant: (v: boolean) => void;
  senior: boolean;
  setSenior: (v: boolean) => void;
  withBoatRules: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const whoLabel =
    `${adults} ${adults === 1 ? "adult" : "adults"}` +
    (children > 0 ? `, ${children} ${children === 1 ? "kid" : "kids"}` : "") +
    (infants > 0 ? `, ${infants} ${infants === 1 ? "infant" : "infants"}` : "");
  const dateLabel = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;
  /* The ticket head has the whole line to itself, so the day gets its full
     name there: "Wednesday, Aug 12" rather than the capsule's "Wed". */
  const dateLong = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      ref={rootRef}
      className={variant === "fields" ? "relative block" : "relative block sm:inline-block"}
    >
      {variant === "fields" ? (
        /* Two rows reading as two rules of a boarding pass: DAY over the full
           date across the whole line, a hairline of white, then TRAVELLERS.
           The tap target is the full head, so there is no button to hunt for. */
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="block w-full px-5 pb-3.5 pt-5 text-left"
        >
          <span className="block text-[9.5px] font-black tracking-[0.08em] text-sky">DAY</span>
          <span
            className={`block font-display text-[19px] font-extrabold leading-tight text-white ${
              dateLong ? "" : "opacity-75"
            }`}
          >
            {dateLong ?? "Pick a day"}
          </span>
          <span className="mt-2 flex items-end justify-between border-t border-white/25 pt-2">
            <span className="min-w-0">
              <span className="block text-[9.5px] font-black tracking-[0.08em] text-sky">
                TRAVELLERS
              </span>
              <span className="block font-display text-[15px] font-extrabold leading-tight text-white">
                {whoLabel}
              </span>
            </span>
            {/* The fields are the button, so they need one mark saying so: a
                chevron that turns down while the picker is open. */}
            <span className="shrink-0 pb-0.5 text-white/90">
              <IconChevronRight
                className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
              />
            </span>
          </span>
        </button>
      ) : (
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-full bg-white p-1.5 pl-5 text-left shadow-ticket transition-shadow hover:shadow-lift sm:w-auto sm:justify-start"
      >
        <span className="pr-4">
          <span className="block text-[10px] font-black text-cobalt">Day</span>
          <span
            className={`block font-display text-[14.5px] font-extrabold ${
              dateLabel ? "" : "text-navy/40"
            }`}
          >
            {dateLabel ?? "When are you going?"}
          </span>
        </span>
        <span className="border-l-2 border-pale py-0.5 pl-4 pr-4">
          <span className="block text-[10px] font-black text-cobalt">Travellers</span>
          <span className="block font-display text-[14.5px] font-extrabold">{whoLabel}</span>
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-smart text-navy">
          <IconChevronRight className="h-4 w-4" />
        </span>
      </button>
      )}

      {open && (
        <div
          className={`absolute top-[calc(100%+10px)] z-30 w-[min(94vw,370px)] rounded-3xl border border-pale bg-white p-5 shadow-ticket ${
            align === "right" ? "left-0 sm:left-auto sm:right-0" : "left-0"
          }`}
        >
          {calError && <ErrorNote text={calError} />}
          <Calendar
            year={ym.y}
            month={ym.m}
            days={calDays}
            loading={calLoading && Object.keys(calDays).length === 0}
            value={date}
            minDate={today}
            onSelect={(d) => onDate(d)}
            onMonthChange={onMonthChange}
          />
          <div className="mt-4 grid gap-1 border-t-2 border-dashed border-pale pt-3">
            <CapsuleStepper label="Adults" hint="13 plus" value={adults} min={1} max={8}
              onChange={(v) => { setAdults(v); setInfants((i) => Math.min(i, v)); }} />
            <CapsuleStepper label="Kids" hint="3 to 12" value={children} min={0} max={6} onChange={setChildren} />
            <CapsuleStepper label="Infants" hint="Under 3, on a lap" value={infants} min={0} max={adults} onChange={setInfants} />
          </div>
          {withBoatRules && (
            <div className="mt-2 grid gap-2 border-t-2 border-dashed border-pale pt-3">
              <label className="flex cursor-pointer items-center gap-2.5 text-[12.5px] font-bold text-navy/70">
                <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} className="h-4 w-4 accent-[#0072DA]" />
                Someone is expecting
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-[12.5px] font-bold text-navy/70">
                <input type="checkbox" checked={senior} onChange={(e) => setSenior(e.target.checked)} className="h-4 w-4 accent-[#0072DA]" />
                Someone is 65 or older
              </label>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-full bg-navy py-3 text-sm font-extrabold text-white transition-colors hover:bg-cobalt"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

function CapsuleStepper({
  label, hint, value, min, max, onChange,
}: {
  label: string; hint: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <p className="text-sm font-extrabold">{label}</p>
        <p className="text-[11px] font-semibold text-navy/50">{hint}</p>
      </div>
      <div className="flex items-center gap-2.5">
        <button type="button" className="chip h-8 w-8 px-0 py-0 leading-none" disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer ${label}`}>-</button>
        <span className="w-4 text-center font-display text-base font-extrabold tabular-nums">{value}</span>
        <button type="button" className="chip h-8 w-8 px-0 py-0 leading-none" disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))} aria-label={`More ${label}`}>+</button>
      </div>
    </div>
  );
}

/* ===================== SideTicket.tsx ===================== */

/**
 * The frames the hero cycles through, in order. A slow crossfade, never a
 * slideshow with chrome: the photo is scenery, not a gallery to operate.
 */
export const HERO_SHOTS = [
  "https://loved-serenity-e0ed39558b.media.strapiapp.com/Victoria_Whale_Watching_W_4d01395347.webp",
  "https://i.redd.it/sunset-whale-watching-v0-h1y8a1zlp6if1.jpg?width=3050&format=pjpg&auto=webp&s=cf3135cd1cfc81e0655625c353849483ecfb0de9",
];

/** The one photograph on the ticket. Still, so the stub stays paperwork. */
export const TICKET_SHOT =
  "https://t3.ftcdn.net/jpg/10/35/88/50/360_F_1035885083_P5DoiniSyFhg9aGvbgxN2xFJbTWdVHFs.jpg";

/**
 * The stack of crossfading photographs behind a cover. Absolutely positioned,
 * so the caller owns the shape and the clipping; only one frame is lit at a
 * time and the change takes a second and a half, which is slow enough to read
 * as weather rather than as a transition.
 */
export function CoverSlides({
  images,
  frame,
  className = "",
}: {
  images: string[];
  frame: number;
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden="true">
      {images.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1400ms] ease-in-out"
          style={{ backgroundImage: `url(${src})`, opacity: i === frame ? 1 : 0 }}
        />
      ))}
    </div>
  );
}

/**
 * The ticket, boarding-pass anatomy: one still photograph across the head
 * with the day and the party printed on it as two fields that open the
 * picker on tap, the day as a three-stop mini-itinerary underneath (dashes
 * until the plan lands), then a perforation, then the money in the stub.
 * The hero runs the slideshow; the ticket keeps a single frame, so the rail
 * stays calm next to it. The mobile dock is untouched.
 *
 * Its one motion: a changed total rolls up behind a single sweep of light,
 * and that stops dead under prefers-reduced-motion.
 */
export function SideTicket({
  image = TICKET_SHOT,
  cities,
  pax,
  tour,
  outbound,
  ret,
  breakdown,
  flexCents,
  plan,
}: {
  /** The one photograph across the head of the ticket. */
  image?: string;
  /** City names for the two flight stops, e.g. { out: "Victoria", home: "Vancouver" }. */
  cities: { out: string; home: string };
  pax: Pax;
  tour: TourSlot | null;
  outbound: FlightLeg | null;
  ret: FlightLeg | null;
  breakdown: PriceBreakdown | null;
  /** 0 when the add-on is off, the flat add-on in cents when it is on. */
  flexCents: number;
  /** The day and party control, printed at the head of the ticket. */
  plan: React.ReactNode;
}) {
  const complete = breakdown !== null && tour !== null && outbound !== null && ret !== null;
  const pct = packageDiscountPct();
  const bookHref = process.env.NEXT_PUBLIC_BOOK_URL;

  const fullCents = complete ? breakdown.totalAllInCents + flexCents : null;
  const deal = fullCents !== null ? applyPackageDeal(fullCents) : null;
  const itemised = flexCents > 0 || (deal?.saveCents ?? 0) > 0;

  const calm = usePrefersReducedMotion();
  const [rolled, sheen] = useRollingTotal(deal?.totalCents ?? null, calm);

  return (
    <aside className="sticky top-[76px]">
      <div className="relative">
        <div className="overflow-hidden rounded-3xl border border-pale bg-white shadow-ticket">
          {/* The head: one photograph, a wash of navy so the white fields
              always hold against it. */}
          <div
            className="relative h-[134px] bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(180deg,rgba(0,45,98,.06) 28%,rgba(0,45,98,.7)), url(${image}), linear-gradient(170deg,#8FCBFF,#0E5FA8)`,
            }}
          />

          <div className="p-5 pb-4">
            {/* The day as a mini-itinerary, quiet type, dashes until it lands. */}
            <div className="grid grid-cols-[64px_1fr] gap-x-2.5 gap-y-1.5 text-[12.5px]">
              <ItinRow time={outbound ? fmt12(outbound.dep) : null} label={`Fly to ${cities.out}`} />
              <ItinRow time={tour ? fmt12(tour.start) : null} label="Whale watching" />
              <ItinRow time={ret ? fmt12(ret.dep) : null} label={`Fly to ${cities.home}`} />
            </div>
          </div>

          {/* Perforation: the money lives in the stub. */}
          <div className="relative border-t-2 border-dashed border-pale" aria-hidden="true">
            <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-mist" />
            <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-mist" />
          </div>

          <div className="p-5 pt-3.5">
            {deal !== null && fullCents !== null ? (
              <>
                {/* The money reads as arithmetic: the day, then anything added or
                    taken off, then what you pay. With nothing to adjust the lines
                    would just restate the total, so they only appear when they
                    have something to say. */}
                {itemised && (
                  <div className="grid gap-0.5 text-[12px] font-bold">
                    <MoneyLine label="The day" value={ledger(fullCents - flexCents)} />
                    {flexCents > 0 && <MoneyLine label="Flexible" value={ledger(flexCents)} />}
                    {deal.saveCents > 0 && (
                      <MoneyLine
                        label={`Package deal, ${pct}% off`}
                        value={`-${ledger(deal.saveCents)}`}
                        accent
                      />
                    )}
                  </div>
                )}
                <p
                  className={`font-display text-[27px] font-black tabular-nums leading-none ${
                    itemised ? "mt-2 border-t-2 border-dashed border-pale pt-2.5" : "mt-0.5"
                  }`}
                >
                  {fmtMoney(rolled ?? deal.totalCents)}
                </p>
                <p className="mt-1 text-[11px] font-bold text-navy/50">for everyone, all in</p>
                {bookHref && (
                  <a
                    href={bookHref}
                    className="mt-3 block rounded-2xl bg-smart py-3 text-center text-sm font-extrabold text-navy no-underline transition-[filter] hover:brightness-105"
                  >
                    Book this day
                  </a>
                )}
                {pax.infants > 0 && (
                  <p className="mt-2 text-[11px] font-semibold text-navy/50">
                    Infants fly free on a lap. The boat&#x27;s infant fare is in the total.
                  </p>
                )}
              </>
            ) : (
              <p className="text-[12.5px] font-bold leading-relaxed text-navy/50">
                Pick a day and a plan and the price lands here, package deal included.
              </p>
            )}
          </div>

          {/* One sweep of light when the total changes, so the new figure is
              seen rather than merely displayed. */}
          {sheen > 0 && (
            <span
              key={sheen}
              aria-hidden="true"
              className="ticket-sheen pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg,transparent 38%,rgba(255,255,255,.5) 50%,transparent 62%)",
              }}
            />
          )}
        </div>

        {/* The plan control rides above the clipped ticket so its calendar
            can hang past the edge; the notches need that clip, the popover
            does not. */}
        <div className="absolute inset-x-0 top-0 z-20 h-[134px]">
          <div className="absolute inset-x-0 bottom-0">{plan}</div>
        </div>
      </div>
    </aside>
  );
}

/** True when the guest has asked their system for less movement. */
function usePrefersReducedMotion() {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setCalm(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return calm;
}

/** Which cover frame is showing. Holds on the first one when asked to be calm. */
function useCoverFrame(count: number, calm: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (calm || count < 2) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % count), 7000);
    return () => window.clearInterval(id);
  }, [calm, count]);
  return i;
}

/**
 * Counts the total up to its new figure and returns a token that changes with
 * every landing, which the sheen keys off. Under reduced motion the figure
 * simply appears.
 */
function useRollingTotal(target: number | null, calm: boolean): [number | null, number] {
  const [shown, setShown] = useState<number | null>(target);
  const [token, setToken] = useState(0);
  const from = useRef<number | null>(target);

  useEffect(() => {
    if (target === null) {
      from.current = null;
      setShown(null);
      return;
    }
    const start = from.current;
    if (start === null || calm || start === target) {
      from.current = target;
      setShown(target);
      if (start !== null && start !== target) setToken((t) => t + 1);
      return;
    }
    setToken((t) => t + 1);
    const t0 = performance.now();
    let frame = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 520);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(start + (target - start) * eased));
      if (k < 1) frame = requestAnimationFrame(step);
      else from.current = target;
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, calm]);

  return [shown, token];
}

/**
 * The shared money formatter drops empty cents ($99), which is right on a
 * button but ragged in a column of figures. In the ledger every line keeps
 * two decimals so the amounts line up under each other.
 */
function ledger(cents: number) {
  return `$${(cents / 100).toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function MoneyLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${accent ? "text-cobalt" : "text-navy/60"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function ItinRow({ time, label, sub }: { time: string | null; label: string; sub?: string }) {
  return (
    <>
      <span className={`whitespace-nowrap font-bold tabular-nums ${time ? "text-navy" : "text-navy/30"}`}>
        {time ?? "--:--"}
      </span>
      <span className={`font-semibold ${time ? "text-navy/80" : "text-navy/45"}`}>
        {label}
        {sub && <span className="text-navy/50"> {sub}</span>}
      </span>
    </>
  );
}

/* ===================== DockTicket.tsx ===================== */

/**
 * The ticket at the bottom of the screen.
 *
 * No line items: the day is sold as one thing, so the bar quotes one figure,
 * struck full price beside the package price, and the expanded view shows the
 * legs and the saving rather than an invoice. The flex add-on rides inside
 * the total and is named, not priced, here; its price lives on the add-on
 * card where it is chosen.
 */
export function DockTicket({
  date,
  pax,
  boat,
  tour,
  outbound,
  ret,
  breakdown,
  flexCents,
}: {
  date: string | null;
  pax: Pax;
  boat: BoatType;
  tour: TourSlot | null;
  outbound: FlightLeg | null;
  ret: FlightLeg | null;
  breakdown: PriceBreakdown | null;
  /** Total for the flexibility add-on, zero when it is off. */
  flexCents: number;
}) {
  const [open, setOpen] = useState(false);
  const size = partySize(pax);
  const complete = breakdown !== null && tour !== null && outbound !== null && ret !== null;
  const bookHref = process.env.NEXT_PUBLIC_BOOK_URL;
  const pct = packageDiscountPct();

  const fullCents = complete ? breakdown.totalAllInCents + flexCents : null;
  const deal = fullCents !== null ? applyPackageDeal(fullCents) : null;

  const dateLabel = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "Pick a day";
  const whoLabel =
    `${size} ${size === 1 ? "traveller" : "travellers"}` +
    (pax.infants > 0 ? ` plus ${pax.infants} on laps` : "") +
    `, ${BOAT_SHORT[boat].toLowerCase()}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-0 sm:px-5">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-t-3xl bg-navy text-white shadow-[0_-20px_60px_-20px_rgba(0,45,98,0.55)]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-4 px-6 py-4 text-left"
          aria-expanded={open}
        >
          <span className="min-w-0">
            <span className="block truncate font-display text-[15px] font-extrabold">
              {dateLabel}
            </span>
            <span className="block truncate text-[12.5px] font-bold text-pale">{whoLabel}</span>
          </span>
          <span className="flex-1" />
          {deal !== null && fullCents !== null ? (
            <span className="text-right">
              <span className="flex items-baseline justify-end gap-2.5">
                {deal.saveCents > 0 && (
                  <span className="text-sm font-bold text-sky/70 line-through decoration-2">
                    {fmtMoney(fullCents)}
                  </span>
                )}
                <span className="font-display text-2xl font-black tabular-nums text-smart">
                  {fmtMoney(deal.totalCents)}
                </span>
              </span>
              {deal.saveCents > 0 && (
                <span className="mt-0.5 inline-block rounded-full bg-smart/15 px-2.5 py-0.5 text-[11px] font-black text-smart">
                  Package deal, {pct}% off
                </span>
              )}
            </span>
          ) : (
            <span className="text-[13px] font-bold text-sky">
              {date ? "Pick a plan to price your day" : "Your ticket fills in here"}
            </span>
          )}
          {complete && bookHref && (
            <a
              href={bookHref}
              onClick={(e) => e.stopPropagation()}
              className="hidden rounded-full bg-smart px-6 py-3 text-sm font-extrabold text-navy no-underline sm:block"
            >
              Book this day
            </a>
          )}
          <span className="text-[12.5px] font-extrabold text-sky">
            {open ? "close" : "details"}
          </span>
        </button>

        <div
          className="overflow-hidden transition-[max-height] duration-300 ease-out"
          style={{ maxHeight: open ? 380 : 0 }}
        >
          <div className="grid gap-6 border-t border-dashed border-sky/40 px-6 py-5 sm:grid-cols-2">
            <div>
              <DockLeg
                time={outbound ? fmt12(outbound.dep) : "--:--"}
                name="Fly out of Vancouver Harbour"
                sub={outbound ? `Lands Victoria ${fmt12(outbound.arr)}` : "Not picked yet"}
                muted={!outbound}
              />
              <DockLeg
                time={tour ? fmt12(tour.start) : "--:--"}
                name={tour ? BOAT_SHORT[tour.boat] : "Whale watching"}
                sub={tour ? `Back at the dock ${fmt12(tour.end)}` : "Not picked yet"}
                muted={!tour}
              />
              <DockLeg
                time={ret ? fmt12(ret.dep) : "--:--"}
                name="Fly to Vancouver"
                sub={ret ? `Lands Vancouver Harbour ${fmt12(ret.arr)}` : "Not picked yet"}
                muted={!ret}
              />
            </div>
            <div className="flex flex-col justify-center text-[13.5px]">
              {deal !== null && fullCents !== null ? (
                <>
                  <div className="flex justify-between py-1.5 text-pale">
                    <span>Your day, full price</span>
                    <span className="tabular-nums line-through decoration-2">
                      {fmtMoney(fullCents)}
                    </span>
                  </div>
                  {deal.saveCents > 0 && (
                    <div className="flex justify-between py-1.5 font-extrabold text-smart">
                      <span>Package deal, {pct}% off</span>
                      <span className="tabular-nums">&minus;{fmtMoney(deal.saveCents)}</span>
                    </div>
                  )}
                  {flexCents > 0 && (
                    <p className="py-1.5 text-[12px] font-bold text-sky">
                      Flex is in: change or cancel anytime before departure.
                    </p>
                  )}
                  <div className="mt-1.5 flex items-baseline justify-between border-t border-dashed border-sky/30 pt-3">
                    <span className="font-extrabold">You pay</span>
                    <span className="font-display text-[26px] font-black tabular-nums text-smart">
                      {fmtMoney(deal.totalCents)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[13px] font-bold text-sky">
                  Pick a day and a plan above and the money shows up here, package deal included.
                </p>
              )}
              {pax.infants > 0 && (
                <p className="pt-2 text-xs text-sky">
                  Infants fly free on a lap. The boat has its own infant fare, and it is in the
                  total.
                </p>
              )}
              {complete && bookHref && (
                <a
                  href={bookHref}
                  className="mt-3 block rounded-2xl bg-smart py-3 text-center text-sm font-extrabold text-navy no-underline sm:hidden"
                >
                  Book this day
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DockLeg({
  time,
  name,
  sub,
  muted,
}: {
  time: string;
  name: string;
  sub: string;
  muted?: boolean;
}) {
  return (
    <div className={`flex gap-3 py-2 text-[13.5px] ${muted ? "opacity-40" : ""}`}>
      <span className="min-w-[64px] font-black tabular-nums text-smart">{time}</span>
      <span>
        <span className="block font-extrabold">{name}</span>
        <span className="block text-[11.5px] font-semibold text-sky">{sub}</span>
      </span>
    </div>
  );
}

/* ===================== DayPlans.tsx ===================== */

export type Combo = {
  tour: TourWithFlights;
  outboundId: string;
  returnId: string;
  totalCents: number;
  /** Minutes in Victoria before the boat, and after it. */
  before: number;
  after: number;
  /** The outbound departure, for the early-start test. */
  dep: string;
  /** The return arrival back in Vancouver. */
  home: string;
};

export type Plan = Combo & {
  title: string;
  why: string;
};

/**
 * Every workable shape of the day, priced.
 *
 * This is the full cross product of sailings, outbound flights and return
 * flights that the server already filtered for seats, weight and buffers, so
 * nothing sellable is missed. A busy August day is roughly eight sailings by
 * ten flights by eleven flights, which is under a thousand rows: cheap enough
 * to build on every render and honest enough to pick from.
 */
export function buildCombos(tours: TourWithFlights[], pax: Pax): Combo[] {
  const combos: Combo[] = [];
  for (const tour of tours) {
    const boat = boatAllInCents(tour, pax);
    for (const out of tour.outbound) {
      const outCents = flightPriceCents(out, pax);
      if (outCents === null) continue;
      for (const back of tour.returns) {
        const backCents = flightPriceCents(back, pax);
        if (backCents === null) continue;
        combos.push({
          tour,
          outboundId: out.id,
          returnId: back.id,
          totalCents: outCents + backCents + boat,
          before: minutesBetween(out.arr, tour.start),
          after: minutesBetween(tour.end, back.dep),
          dep: out.dep,
          home: back.arr,
        });
      }
    }
  }
  return combos;
}

const key = (c: Combo) => `${c.tour.availabilityPk}|${c.outboundId}|${c.returnId}`;

/** Distance from a comfortable hour and a half on each side of the boat. */
const relaxed = (c: Combo) => Math.abs(c.before - 90) + Math.abs(c.after - 90);

/**
 * Four ways to spend the day, drawn from the full list.
 *
 * Each pick answers a question a guest actually asks, and every card says out
 * loud what it costs you: the cheapest day is often the earliest one, and
 * hiding that would be the kind of thing you find out at 5 in the morning.
 * Duplicates collapse, so a day with one workable shape shows one card.
 */
export function pickPlans(combos: Combo[]): Plan[] {
  if (combos.length === 0) return [];

  const byPrice = [...combos].sort(
    (a, b) => a.totalCents - b.totalCents || relaxed(a) - relaxed(b)
  );
  const byAshore = [...combos].sort(
    (a, b) => b.before + b.after - (a.before + a.after) || a.totalCents - b.totalCents
  );
  const byLate = [...combos].sort(
    (a, b) => b.dep.localeCompare(a.dep) || a.totalCents - b.totalCents
  );
  const byBalance = [...combos].sort(
    (a, b) => relaxed(a) - relaxed(b) || a.totalCents - b.totalCents
  );

  /**
   * Four cards, four different days: each archetype claims its best combo
   * that nobody has claimed yet, instead of everyone independently grabbing
   * the same one and the dedupe eating the rail down to two cards. Claim
   * order protects the promises: the cheapest and the most time ashore are
   * absolute, so they pick first; the late start and the balanced day read
   * honestly whichever combo they end up with, so they yield.
   */
  const taken = new Set<string>();
  const claim = (sorted: Combo[]): Combo | null => {
    const c = sorted.find((x) => !taken.has(key(x)));
    if (!c) return null;
    taken.add(key(c));
    return c;
  };

  const cheapest = claim(byPrice);
  const longest = claim(byAshore);
  const late = claim(byLate);
  const balanced = claim(byBalance);
  const latestDep = byLate[0]?.dep;

  const plans: Plan[] = [];
  if (cheapest)
    plans.push({
      ...cheapest,
      title: "Best price.",
      why: `Leaves ${fmt12(cheapest.dep)}, home ${fmt12(cheapest.home)}.`,
    });
  if (balanced)
    plans.push({
      ...balanced,
      title: "Our pick.",
      why: `${fmtWait(balanced.before)} from landing to the boat, ${fmtWait(balanced.after)} from the boat to your flight.`,
    });
  if (late)
    plans.push({
      ...late,
      title: "No early alarm.",
      why:
        late.dep === latestDep
          ? `The latest start that still works, ${fmt12(late.dep)}.`
          : `A late start, ${fmt12(late.dep)}, still makes the boat.`,
    });
  if (longest)
    plans.push({
      ...longest,
      title: "Longest in Victoria.",
      why: `${fmtWait(longest.before + longest.after)} ashore, before and after the boat.`,
    });
  return plans;
}


export function DayPlans({
  plans,
  selected,
  onPick,
}: {
  plans: Plan[];
  selected: string | null;
  onPick: (plan: Plan) => void;
}) {
  return (
    <div className="rail -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-4 pt-3">
      {plans.map((plan, i) => {
        const active = selected === key(plan);
        return (
          <button
            key={key(plan)}
            type="button"
            onClick={() => onPick(plan)}
            data-active={active}
            className={[
              "relative w-[280px] shrink-0 snap-start rounded-3xl border-2 p-5 text-left transition-all sm:w-[300px]",
              active
                ? "-translate-y-1 border-cobalt bg-white shadow-ticket"
                : "border-pale bg-white shadow-lift hover:-translate-y-1 hover:border-sky",
            ].join(" ")}
          >
            {i === 0 && (
              <span className="absolute -top-3 left-4 rounded-full bg-smart px-3 py-1 text-[11px] font-black text-navy shadow-lift">
                Lowest
              </span>
            )}
            <p className="font-display text-[26px] font-black tabular-nums leading-none tracking-tight">
              {fmtMoney(plan.totalCents)}
              <span className="ml-1.5 text-xs font-extrabold text-navy/50">all in</span>
            </p>
            <p className="mt-2.5 font-display text-lg font-extrabold">{plan.title}</p>
            <p className="mt-1 text-[13.5px] leading-snug text-navy/65">{plan.why}</p>
            <p className="mt-3.5 border-t-2 border-dashed border-pale pt-3 text-xs font-bold tabular-nums text-navy/55">
              {fmt12(plan.dep)} out, boat {fmt12(plan.tour.start)}, home {fmt12(plan.home)}
            </p>
          </button>
        );
      })}
    </div>
  );
}

/* ===================== FlightsFlow.tsx ===================== */

/**
 * The flow for tours priced off the flight feed. Same flight line, same
 * calendar, same dock as the whale day; what a guest sees is the tour's
 * price, full stop. The ground pieces named in `ground` join the figure when
 * their data lands, and the page will not change when they do.
 *
 * A tour that runs both ways ships more than one variant, and the flow puts
 * a direction toggle above the calendar: availability, days and departures
 * all follow the direction picked.
 */
export function FlightsFlow({
  variants,
  ground,
  initialDate,
  initialAdults,
  initialChildren,
  initialInfants,
}: {
  variants: FlightVariant[];
  /** What the tour includes beyond the flying, said plainly on the dock. */
  ground: string[];
  initialDate?: string;
  initialAdults?: number;
  initialChildren?: number;
  initialInfants?: number;
}) {
  const today = useMemo(() => todayVancouver(), []);

  const [variantIdx, setVariantIdx] = useState(0);
  const active = variants[Math.min(variantIdx, variants.length - 1)] ?? variants[0];
  const out = active?.out;
  const back = active?.back;

  const [adults, setAdults] = useState(() => Math.min(Math.max(initialAdults ?? 1, 1), 8));
  const [children, setChildren] = useState(Math.min(Math.max(initialChildren ?? 0, 0), 6));
  const [infants, setInfants] = useState(Math.max(initialInfants ?? 0, 0));
  const [pregnant, setPregnant] = useState(false);
  const [senior, setSenior] = useState(false);

  // Every adult counts as male: the heaviest standard weight, so availability
  // is conservative by construction and a group is never oversold.
  const pax: Pax = useMemo(
    () => ({
      males: adults,
      females: 0,
      x: 0,
      children,
      infants: Math.min(infants, adults),
      pregnant,
      senior,
    }),
    [adults, children, infants, pregnant, senior]
  );
  const paxKey = qsFrom(pax);

  const legParams = useMemo(() => {
    const p = new URLSearchParams();
    if (out) p.set("out", `${out.from}:${out.to}`);
    if (back) p.set("back", `${back.from}:${back.to}`);
    return p.toString();
  }, [out, back]);

  const startDate = initialDate && initialDate >= today ? initialDate : null;
  const [ym, setYm] = useState(() => ({
    y: Number((startDate ?? today).slice(0, 4)),
    m: Number((startDate ?? today).slice(5, 7)),
  }));
  const [calDays, setCalDays] = useState<Record<string, DayOffer>>({});
  const [calLoading, setCalLoading] = useState(true);
  const [calError, setCalError] = useState<string | null>(null);

  const [date, setDate] = useState<string | null>(startDate);
  const [legs, setLegs] = useState<{ out: FlightLeg[]; back: FlightLeg[] } | null>(null);
  const [legsLoading, setLegsLoading] = useState(false);
  const [legsError, setLegsError] = useState<string | null>(null);
  const [outId, setOutId] = useState<string | null>(null);
  const [backId, setBackId] = useState<string | null>(null);

  useEffect(() => {
    setCalDays({});
  }, [paxKey, legParams]);

  useEffect(() => {
    let alive = true;
    setCalLoading(true);
    setCalError(null);
    fetch(`/api/flight-days?year=${ym.y}&month=${ym.m}&${legParams}&${paxKey}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data.error) {
          setCalError("Could not load the calendar. Refresh to retry.");
          return;
        }
        setCalDays((prev) => ({ ...prev, ...(data.days || {}) }));
      })
      .catch(() => alive && setCalError("Could not load the calendar. Refresh to retry."))
      .finally(() => alive && setCalLoading(false));
    return () => {
      alive = false;
    };
  }, [ym, paxKey, legParams]);

  useEffect(() => {
    if (!date) return;
    let alive = true;
    setLegsLoading(true);
    setLegsError(null);
    setLegs(null);
    setOutId(null);
    setBackId(null);
    fetch(`/api/flight-legs?date=${date}&${legParams}&${paxKey}`)
      .then((r) => r.json())
      .then((data) => alive && setLegs(data))
      .catch(() => alive && setLegsError("Could not load flights for that day. Try again."))
      .finally(() => alive && setLegsLoading(false));
    return () => {
      alive = false;
    };
  }, [date, paxKey, legParams]);

  const switchVariant = (i: number) => {
    if (i === variantIdx) return;
    setVariantIdx(i);
    setDate(null);
    setLegs(null);
    setOutId(null);
    setBackId(null);
  };

  const outLeg = legs?.out.find((l) => l.id === outId) ?? null;
  const backLeg = legs?.back.find((l) => l.id === backId) ?? null;

  const outCents = outLeg ? flightPriceCents(outLeg, pax) : null;
  const backCents = backLeg ? flightPriceCents(backLeg, pax) : null;
  const needOut = Boolean(out);
  const needBack = Boolean(back);
  const complete =
    (!needOut || outCents !== null) && (!needBack || backCents !== null) && date !== null;
  const totalCents = complete ? (outCents ?? 0) + (backCents ?? 0) : null;

  return (
    <section id="plan" className="relative">
      <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-14 sm:px-8">
        <Thread />

        <Station
          n={1}
          title="Pick your day."
          note="Every price is for your whole group."
        >
          {variants.length > 1 && (
            <div className="mb-4 inline-flex flex-wrap gap-1.5 rounded-full border border-pale bg-white p-1.5 shadow-lift">
              {variants.map((v, i) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => switchVariant(i)}
                  className={[
                    "rounded-full px-5 py-2.5 text-[13px] font-extrabold transition-colors",
                    i === variantIdx
                      ? "bg-navy text-white"
                      : "text-navy/60 hover:text-cobalt",
                  ].join(" ")}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
          <div className="rounded-3xl border border-pale bg-white p-6 shadow-ticket sm:p-7">
            {calError && <ErrorNote text={calError} />}
            <Calendar
              year={ym.y}
              month={ym.m}
              days={calDays}
              loading={calLoading && Object.keys(calDays).length === 0}
              value={date}
              minDate={today}
              onSelect={(d) => setDate(d)}
              onMonthChange={(y, m) => setYm({ y, m })}
            />
          </div>
        </Station>

        <Station n={2} title="Who's coming.">
          <TravellersRibbon
            adults={adults}
            setAdults={setAdults}
            children={children}
            setChildren={setChildren}
            infants={infants}
            setInfants={setInfants}
            pregnant={pregnant}
            setPregnant={setPregnant}
            senior={senior}
            setSenior={setSenior}
            withBoatRules={false}
          />
        </Station>

        <Station
          n={3}
          title={needOut && needBack ? "Pick your flights." : "Pick your flight."}
          last
        >
          {legsError && <ErrorNote text={legsError} />}
          {!date ? (
            <Hint text="Pick a day first and the departures will show up here." />
          ) : legsLoading ? (
            <Hint text="Checking the flight board" pulse />
          ) : (
            <div className="space-y-4">
              {needOut && (
                <LegPanel
                  title={out ? `Fly to ${AIRPORT_CITY[out.to] ?? out.to}` : "Fly out"}
                  sub={out ? `${out.from} to ${out.to}` : ""}
                  legs={legs?.out ?? []}
                  pax={pax}
                  selected={outId}
                  onPick={setOutId}
                />
              )}
              {needBack && (
                <LegPanel
                  title={back ? `Fly to ${AIRPORT_CITY[back.to] ?? back.to}` : "Fly back"}
                  sub={back ? `${back.from} to ${back.to}` : ""}
                  legs={legs?.back ?? []}
                  pax={pax}
                  selected={backId}
                  onPick={setBackId}
                />
              )}
            </div>
          )}
        </Station>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 sm:px-5">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-t-3xl bg-navy text-white shadow-[0_-20px_60px_-20px_rgba(0,45,98,0.55)]">
          <div className="flex items-center gap-4 px-6 py-4">
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-extrabold">
                {date
                  ? new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : "Pick a day"}
              </span>
              <span className="block truncate text-[12.5px] font-bold text-pale">
                {outLeg ? `Out ${fmt12(outLeg.dep)}` : needOut ? "Outbound not picked" : ""}
                {needOut && needBack ? ", " : ""}
                {backLeg ? `home ${fmt12(backLeg.dep)}` : needBack ? "return not picked" : ""}
              </span>
            </span>
            <span className="flex-1" />
            {totalCents !== null ? (
              <span className="font-display text-2xl font-black tabular-nums text-smart">
                {fmtMoney(totalCents)}
              </span>
            ) : (
              <span className="text-[13px] font-bold text-sky">
                {date
                  ? needOut && needBack
                    ? "Pick your flights to price your day"
                    : "Pick your flight to price your day"
                  : "Your ticket fills in here"}
              </span>
            )}
          </div>
          <div className="border-t border-dashed border-sky/40 px-6 py-3">
            {ground.map((g) => (
              <p key={g} className="py-0.5 text-[12px] font-semibold text-sky">
                {g}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const AIRPORT_CITY: Record<string, string> = {
  CXH: "Vancouver",
  YWH: "Victoria",
  GLK: "Whistler",
  GNG: "Salt Spring",
};

function LegPanel({
  title,
  sub,
  legs,
  pax,
  selected,
  onPick,
}: {
  title: string;
  sub: string;
  legs: FlightLeg[];
  pax: Pax;
  selected: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-pale bg-white p-5 shadow-ticket sm:p-6">
      <div className="mb-3 flex items-baseline gap-3">
        <p className="font-display text-lg font-extrabold">{title}</p>
        <p className="text-xs font-bold text-navy/50">{sub}</p>
      </div>
      {legs.length === 0 ? (
        <p className="text-sm text-navy/55">
          No flight on this leg can carry your group that day. Another date usually does it.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {legs.map((f) => {
            const cents = flightPriceCents(f, pax);
            const open = seatsOpenFor(f, pax);
            return (
              <button
                key={f.id}
                type="button"
                className="chip flex items-baseline gap-1.5 py-1.5 text-xs"
                data-active={selected === f.id}
                onClick={() => onPick(f.id)}
                title={`Lands ${fmt12(f.arr)}`}
              >
                <span className="tabular-nums">{fmt12(f.dep)}</span>
                {cents !== null && (
                  <span className="font-bold tabular-nums text-cobalt">{fmtMoney(cents)}</span>
                )}
                {open <= 4 && <span className="font-bold text-ember">{open} left</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===================== BookingFlow.tsx ===================== */

export type TourVisuals = {
  image: string;
  route: string;
  title: string;
  durationChip: string;
  facts: { label: string; value: string }[];
};

/**
 * The booking flow, "booking starts on the photo" architecture.
 *
 * The hero is the flow's first station: the capsule on the photo answers
 * "when and who" through one popover (month calendar plus party steppers),
 * and everything below prices off it. Then two named sections, Pick your
 * boat and Shape your day, with the light ticket riding the right rail on
 * desktop. On phones the ticket hides and the bottom dock takes over: one
 * state, two poses.
 *
 * The plan bar on the home page can hand over a date and a party through
 * props, so a guest who already answered "when and who" lands with both done.
 */
export function BookingFlow({
  visuals,
  initialDate,
  initialAdults,
  initialChildren,
  initialInfants,
}: {
  visuals: TourVisuals;
  initialDate?: string;
  initialAdults?: number;
  initialChildren?: number;
  initialInfants?: number;
}) {
  const today = useMemo(() => todayVancouver(), []);

  const [adults, setAdults] = useState(() => Math.min(Math.max(initialAdults ?? 1, 1), 8));
  const [children, setChildren] = useState(Math.min(Math.max(initialChildren ?? 0, 0), 6));
  const [infants, setInfants] = useState(Math.max(initialInfants ?? 0, 0));
  const [pregnant, setPregnant] = useState(false);
  const [senior, setSenior] = useState(false);

  // Every adult counts as male: the heaviest standard weight, so availability
  // is conservative by construction and a group is never oversold.
  const pax: Pax = useMemo(
    () => ({
      males: adults,
      females: 0,
      x: 0,
      children,
      infants: Math.min(infants, adults),
      pregnant,
      senior,
    }),
    [adults, children, infants, pregnant, senior]
  );

  const startDate = initialDate && initialDate >= today ? initialDate : null;
  const [ym, setYm] = useState(() => ({
    y: Number((startDate ?? today).slice(0, 4)),
    m: Number((startDate ?? today).slice(5, 7)),
  }));
  // Months merge rather than replace, so month flips never lose loaded prices.
  const [calDays, setCalDays] = useState<Record<string, DayOffer>>({});
  const [calLoading, setCalLoading] = useState(true);
  const [calError, setCalError] = useState<string | null>(null);
  const [sources, setSources] = useState<DataSources | null>(null);

  const [date, setDate] = useState<string | null>(startDate);
  const [boat, setBoat] = useState<BoatType>("semi_covered");
  const [combos, setCombos] = useState<DayCombos | null>(null);
  const [combosLoading, setCombosLoading] = useState(false);
  const [combosError, setCombosError] = useState<string | null>(null);
  const [custom, setCustom] = useState(false);

  const [flexOn, setFlexOn] = useState(false);
  /* One clock for every cover on the page: the hero and the ticket stub turn
     to the same frame, so the two photographs never argue with each other. */
  const calmCovers = usePrefersReducedMotion();
  const frame = useCoverFrame(HERO_SHOTS.length, calmCovers);
  const [tourPk, setTourPk] = useState<string | null>(null);
  const [outboundId, setOutboundId] = useState<string | null>(null);
  const [returnId, setReturnId] = useState<string | null>(null);

  const boats = eligibleBoats(pax);
  const openAllowed = boats.includes("open");

  const paxKey = qsFrom(pax);

  const clearChoice = useCallback(() => {
    setTourPk(null);
    setOutboundId(null);
    setReturnId(null);
    setCustom(false);
  }, []);

  useEffect(() => {
    setCombos(null);
    clearChoice();
  }, [paxKey, clearChoice]);

  useEffect(() => {
    if (!openAllowed && boat === "open") setBoat("semi_covered");
  }, [openAllowed, boat]);

  const monthsToLoad = useMemo(() => {
    const list = [`${ym.y}-${String(ym.m).padStart(2, "0")}`];
    return list.filter((m) => m >= today.slice(0, 7));
  }, [ym, today]);

  useEffect(() => {
    let alive = true;
    setCalLoading(true);
    setCalError(null);
    Promise.all(
      monthsToLoad.map((m) =>
        fetch(`/api/calendar?year=${m.slice(0, 4)}&month=${Number(m.slice(5, 7))}&${paxKey}`)
          .then((r) => r.json())
          .catch(() => ({ days: {}, error: "unreachable" }))
      )
    )
      .then((results) => {
        if (!alive) return;
        const merged: Record<string, DayOffer> = {};
        let failed = 0;
        for (const data of results) {
          Object.assign(merged, data.days || {});
          if (data.sources) setSources(data.sources);
          if (data.error) failed++;
        }
        setCalDays((prev) => ({ ...prev, ...merged }));
        if (failed === results.length && failed > 0) {
          setCalError("Could not reach the availability service. Refresh to retry.");
        }
      })
      .finally(() => alive && setCalLoading(false));
    return () => {
      alive = false;
    };
  }, [monthsToLoad, paxKey]);

  // A change of party invalidates every price already on screen.
  useEffect(() => {
    setCalDays({});
  }, [paxKey]);

  useEffect(() => {
    if (!date) return;
    let alive = true;
    setCombosLoading(true);
    setCombosError(null);
    setCombos(null);
    clearChoice();
    fetch(`/api/combos?date=${date}&${paxKey}`)
      .then((r) => r.json())
      .then((data: DayCombos) => alive && setCombos(data))
      .catch(() => alive && setCombosError("Could not load times for that day. Try again."))
      .finally(() => alive && setCombosLoading(false));
    return () => {
      alive = false;
    };
  }, [date, paxKey, clearChoice]);

  const boatTours = useMemo(
    () => (combos ? combos.tours.filter((t) => t.boat === boat) : []),
    [combos, boat]
  );

  const allCombos: Combo[] = useMemo(() => buildCombos(boatTours, pax), [boatTours, pax]);
  const plans: Plan[] = useMemo(() => pickPlans(allCombos), [allCombos]);

  const tour = boatTours.find((t) => t.availabilityPk === tourPk) || null;
  const outbound = tour?.outbound.find((f) => f.id === outboundId) || null;
  const ret = tour?.returns.find((f) => f.id === returnId) || null;

  const breakdown = tour && outbound && ret ? priceBreakdown(tour, outbound, ret, pax) : null;

  const flexPrice = flexAddonCents();
  const flexCents = flexOn ? flexPrice : 0;

  const selectedKey =
    tourPk && outboundId && returnId ? `${tourPk}|${outboundId}|${returnId}` : null;

  const takePlan = (plan: Plan) => {
    setTourPk(plan.tour.availabilityPk);
    setOutboundId(plan.outboundId);
    setReturnId(plan.returnId);
  };

  const pickTour = (pk: string) => {
    setTourPk(pk);
    setOutboundId(null);
    setReturnId(null);
  };

  const switchBoat = (b: BoatType) => {
    setBoat(b);
    clearChoice();
  };

  const publicFeed = sources?.tours === "public";

  return (
    <section id="plan">
      {/* The hero is station one: photo, title, fact chips, and the capsule
          riding the bottom right edge, half on the photo, half off, handing
          the flow over to the sections below. On phones the corners fold into
          a stack and the capsule goes full width inside the photo. */}
      <div
        className="relative flex min-h-[380px] flex-col justify-between rounded-3xl bg-cover bg-center p-4 shadow-ticket sm:mb-4 sm:p-5"
        style={{ backgroundImage: "linear-gradient(170deg,#8FCBFF,#0E5FA8)" }}
      >
        {/* The photographs and their wash live in their own clipped layer, so
            the capsule can still hang past the bottom edge. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <CoverSlides images={HERO_SHOTS} frame={frame} />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg,rgba(0,45,98,0) 30%,rgba(0,45,98,.62))" }}
          />
        </div>

        <span className="relative self-start rounded-full bg-white/95 px-4 py-2 text-[12.5px] font-black text-navy">
          {visuals.durationChip}
        </span>
        <div className="relative">
          <div className="text-white sm:max-w-[58%] sm:pb-1">
            <h1 className="mt-1.5 max-w-xl text-3xl text-white sm:text-4xl">
              {titleLines(visuals.title).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {visuals.facts.map((f) => (
                <span
                  key={f.label}
                  className="rounded-full bg-white/15 px-3.5 py-1.5 text-[11.5px] font-extrabold text-white backdrop-blur-sm"
                >
                  {f.label === "Leaves from"
                    ? `Leaves from ${f.value.replace(/\.$/, "")}`
                    : f.value.replace(/\.$/, "")}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_284px]">
        <div className="min-w-0">
          <h2 className="text-3xl">Pick your boat.</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            <BoatCard
              active={boat === "semi_covered"}
              onPick={() => switchBoat("semi_covered")}
              image="https://media.tacdn.com/media/attractions-splice-spp-674x446/06/74/10/b2.jpg"
              imageStyle={{ backgroundSize: "150%", backgroundPosition: "center 60%" }}
              title="Semi-covered vessel"
              blurb="Heated cabin, open decks, washrooms on board, and a photo package included. Orca Spirit welcomes all ages on this boat."
            />
            <BoatCard
              active={boat === "open"}
              disabled={!openAllowed}
              onPick={() => switchBoat("open")}
              image="https://orcaspirit.com/wp-content/uploads/sites/8276/2026/01/zodiac-with-whales.jpg?w=700&h=700&zoom=2"
              title="Open vessel"
              blurb="Low, fast and right at the waterline, in a full flotation suit. Orca Spirit takes ages 6 and up, and for this same day package we keep it to adults under 65."
              note={!openAllowed ? "Not available for your group" : undefined}
            />
          </div>
          {!openAllowed && (
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-ember/10 px-4 py-3 text-sm text-navy">
              <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
              <span>
                For this package we keep the open vessel to adults under 65 who are not expecting,
                so we will book you on the semi covered boat. Same whales, warmer seats.
              </span>
            </p>
          )}

          <h2 className="mt-10 text-3xl">Shape your day.</h2>
          {plans.length > 0 && !custom && (
            <p className="mt-1 text-[15px] text-navy/60">
              {["One way", "Two ways", "Three ways", "Four ways"][plans.length - 1] ??
                `${plans.length} ways`}{" "}
              to run it, priced for your whole group.
            </p>
          )}
          <div className="mt-4">
            {combosError && <ErrorNote text={combosError} />}
            {!date ? (
              <Hint text="Pick a day on the ticket and the times show up here." />
            ) : combosLoading ? (
              <Hint text="Checking the boats and the flight board" pulse />
            ) : boatTours.length === 0 ? (
              <Hint text="No sailings pair with flights that can carry your group that day. A seaplane sells out by weight as well as seats, so a different date, or the other boat, often does it." />
            ) : custom ? (
              <div className="rounded-3xl border border-pale bg-white p-6 shadow-ticket sm:p-7">
                <Timeline
                  tours={boatTours}
                  pax={pax}
                  tourPk={tourPk}
                  outboundId={outboundId}
                  returnId={returnId}
                  onPickTour={pickTour}
                  onPickOutbound={setOutboundId}
                  onPickReturn={setReturnId}
                />
                {plans.length > 0 && (
                  <button
                    type="button"
                    className="mt-2 text-sm font-bold text-cobalt underline-offset-4 hover:underline"
                    onClick={() => setCustom(false)}
                  >
                    Back to the ready-made days
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="mb-3 text-[12.5px] font-extrabold text-cobalt sm:hidden">
                  Swipe through the days &rsaquo;
                </p>
                <DayPlans plans={plans} selected={selectedKey} onPick={takePlan} />
                <button
                  type="button"
                  className="mt-4 text-sm font-bold text-cobalt underline underline-offset-4"
                  onClick={() => {
                    setCustom(true);
                    if (!tourPk && boatTours.length > 0) pickTour(boatTours[0].availabilityPk);
                  }}
                >
                  Build it yourself
                </button>
              </>
            )}
            {date && !combosLoading && boatTours.length > 0 && (
              <button
                type="button"
                onClick={() => setFlexOn((f) => !f)}
                data-active={flexOn}
                className={[
                  "mt-5 flex w-full items-center gap-4 rounded-3xl border-2 p-5 text-left transition-all",
                  flexOn
                    ? "border-cobalt bg-gradient-to-br from-white to-pale/60 shadow-ticket"
                    : "border-pale bg-white hover:border-cobalt",
                ].join(" ")}
              >
                <span
                  className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${
                    flexOn ? "bg-cobalt" : "bg-pale"
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      flexOn ? "translate-x-5" : ""
                    }`}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-display text-lg font-extrabold">Make it flexible.</span>
                  <span className="mt-0.5 block text-sm leading-snug text-navy/70">
                    Change your day, your times or your boat, or cancel outright, anytime before
                    departure.
                  </span>
                </span>
                <span className="whitespace-nowrap font-display text-sm font-extrabold tabular-nums">
                  +{fmtMoney(flexPrice)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* With the hero capsule gone, the ticket head is the only door to
            the day and the party, so below lg it can no longer hide: it leads
            the stack instead, and from lg it returns to the right rail. */}
        <div className="order-first lg:order-1">
          <SideTicket
            cities={{ out: "Victoria", home: "Vancouver" }}
            pax={pax}
            tour={tour}
            outbound={outbound}
            ret={ret}
            breakdown={breakdown}
            flexCents={flexCents}
            plan={
              <DayCapsule
                variant="fields"
                align="right"
                date={date}
                onDate={(d) => setDate(d)}
                ym={ym}
                onMonthChange={(y, m) => setYm({ y, m })}
                calDays={calDays}
                calLoading={calLoading}
                calError={calError}
                today={today}
                adults={adults}
                setAdults={setAdults}
                children={children}
                setChildren={setChildren}
                infants={infants}
                setInfants={setInfants}
                pregnant={pregnant}
                setPregnant={setPregnant}
                senior={senior}
                setSenior={setSenior}
                withBoatRules
              />
            }
          />
        </div>
      </div>

      <div className="lg:hidden">
        <DockTicket
          date={date}
          pax={pax}
          boat={boat}
          tour={tour}
          outbound={outbound}
          ret={ret}
          breakdown={breakdown}
          flexCents={flexCents}
        />
      </div>
    </section>
  );
}




function BoatCard({
  active,
  disabled,
  onPick,
  image,
  imageStyle,
  title,
  blurb,
  note,
}: {
  active: boolean;
  disabled?: boolean;
  onPick: () => void;
  image: string;
  /**
   * Per-photo crop. The semi-covered shot ships with white bars baked into
   * the file, so it is zoomed past them; plain cover cannot crop what is
   * part of the image.
   */
  imageStyle?: React.CSSProperties;
  title: string;
  blurb: string;
  note?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      data-active={active}
      className={[
        "flex h-full flex-col overflow-hidden rounded-3xl border-2 text-left transition-all",
        disabled
          ? "cursor-not-allowed border-pale bg-mist opacity-50"
          : active
            ? "border-cobalt bg-gradient-to-br from-white to-pale/60 shadow-ticket"
            : "border-pale bg-white hover:border-cobalt",
      ].join(" ")}
    >
      <div
        className={`h-36 bg-cover bg-center ${disabled ? "grayscale" : ""}`}
        style={{
          backgroundImage: `url(${image}), linear-gradient(170deg,#8FCBFF,#0E5FA8)`,
          ...imageStyle,
        }}
        aria-hidden="true"
      />
      <div className="flex-1 p-5">
        <p className="font-display text-lg font-extrabold">{title}</p>
        <p className="mt-1.5 text-sm leading-snug text-navy/70">{blurb}</p>
        {note && <p className="mt-2 text-xs font-extrabold text-ember">{note}</p>}
      </div>
    </button>
  );
}
