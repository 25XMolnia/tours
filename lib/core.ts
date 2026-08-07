// lib/core.ts — весь серверный и общий код портала, объединён из 16 файлов lib/
import { SupabaseClient, createClient } from "@supabase/supabase-js";

/* ===================== types.ts ===================== */

/**
 * Who is flying.
 *
 * A seaplane is loaded by weight as much as by seats, so adults are counted
 * by gender: Transport Canada standard weights differ and the plane's payload
 * decides how many seats are really open. Nobody is weighed at the dock; the
 * standard figures in lib/party.ts are the whole story.
 */
export type Pax = {
  /** Adults, 13 plus. Standard weight 196 lb. */
  males: number;
  /** Adults, 13 plus. Standard weight 154 lb. */
  females: number;
  /** Adults, 13 plus, gender X or unspecified. Standard weight 196 lb. */
  x: number;
  /** Ages 3 to 12. 75 lb. Take a seat on the plane and the boat. */
  children: number;
  /** Under 3, on an adult's lap. 30 lb. No seat, no fare. */
  infants: number;
  pregnant: boolean;
  /** Someone in the group is 65 or older. Boat rule only. */
  senior: boolean;
};

export type BoatType = "semi_covered" | "open";

/**
 * One fare bucket on one departure: how many seats can still be sold at this
 * price. Buckets are nested, not additive: a plane showing 4 at value and 10
 * at flex has 10 open seats, of which the first 4 can go at the value price.
 * The bucket's name never reaches the interface: the site sells a seat, and
 * the ladder only decides what each seat costs.
 */
export type FareBucket = {
  seats: number;
  priceCents: number;
};

export type FlightLeg = {
  /** The export's flight_id, unique per dated departure. */
  id: string;
  /** "HA 2013" when the export's label carries a number, else the raw label. */
  flightNo: string;
  /** "Twin Otter" and friends, when the export names the aircraft. */
  aircraft?: string;
  /** Airport codes, e.g. "CXH" -> "YWH". The pair, not a hardcoded product. */
  from: string;
  to: string;
  /** `${from}-${to}`, kept for sorting and stable ids. */
  route: string;
  /** YYYY-MM-DD, a real calendar date. The feed is inventory, not a timetable. */
  date: string;
  dep: string;
  arr: string;
  /** The export's status. Only statuses starting with KK are ever loaded. */
  status: string;
  /**
   * Seats still on sale: the LARGEST open fare bucket, never the sum.
   * Buckets nest, so adding them would count the same chair four times.
   */
  seatsLeft: number;
  /** Payload still available in pounds, or null when the export omitted it. */
  weightRemainingLbs: number | null;
  /** Open buckets, cheapest first. Empty means nothing is on sale. */
  fares: FareBucket[];
  /** The cheapest open per-seat price, for "from $X" labels. */
  fromCents: number | null;
};

export type TourCustomerType = {
  /** Company-wide customer type pk. Joins onto FareHarbor price data. */
  customerTypePk: number;
  /** Per-departure rate pk. Needed to create a booking. */
  ratePk: number;
  singular: string;
  /** Customer-facing label, e.g. "Ages 19+". */
  note: string;
  /** The age actually enforced, which can disagree with `note`. */
  minAge: number | null;
  maxAge: number | null;
};

export type TourSlot = {
  availabilityPk: string;
  boat: BoatType;
  start: string;
  end: string;
  seatsLeft: number;
  priceAdultCents: number;
  priceChildCents: number;
  priceSeniorCents: number;
  /**
   * The boat's own infant fare. Real money: the semi-covered vessel sells
   * Infant (ages 0-2) at its own rate, which is nothing like free. The open
   * vessel has no infant type at all and leaves this at zero.
   */
  priceInfantCents: number;
  /** True when we could not read a seat count; pairing skips the seat test. */
  seatsUnknown?: boolean;
  partialSchedule?: boolean;

  // Present when the departure came from the public feed.
  /** FareHarbor item pk this departure belongs to. */
  itemPk?: string;
  /** "auto" | "open" | "call" */
  status?: string;
  soldOut?: boolean;
  phoneOnly?: boolean;
  headline?: string;
  /** Absolute FareHarbor checkout URL for this exact departure. */
  bookUrl?: string;
  customerTypes?: TourCustomerType[];
};

export type TourWithFlights = TourSlot & {
  outbound: FlightLeg[];
  returns: FlightLeg[];
};

export type DayCombos = {
  date: string;
  eligibleBoats: BoatType[];
  tours: TourWithFlights[];
};

export type Selection = {
  date: string;
  pax: Pax;
  boat: BoatType;
  availabilityPk: string;
  outboundId: string;
  returnId: string;
  extraBefore: boolean;
  extraAfter: boolean;
};

export type Contact = {
  name: string;
  email: string;
  phone: string;
};

export type PriceBreakdown = {
  /** Both seaplane legs together, kids at the seat price, infants free. */
  flightsCents: number;
  outboundCents: number;
  returnCents: number;
  tourCents: number;
  totalCents: number;
  /** The boat's ladder, split out. Flight fares are charged as quoted. */
  tourSubtotalCents: number;
  tourBookingFeeCents: number;
  tourTaxCents: number;
  /** Flights plus the boat with GST added. */
  totalAllInCents: number;
  /** Which price the boat figures came from. */
  mode: "public" | "net";
  /** Fuel plus conservation, broken out. Zero in public mode, where it is
   *  already inside the fare and cannot be separated per guest type. */
  tourSurchargeCents: number;
};

/* ===================== time.ts ===================== */

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function toHHMM(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMin(hhmm: string, delta: number): string {
  return toHHMM(toMin(hhmm) + delta);
}

export function fmt12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "pm" : "am";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

export function minutesBetween(a: string, b: string): number {
  return toMin(b) - toMin(a);
}

export function fmtWait(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function fmtMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-CA", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayVancouver(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}

/** The Vancouver wall clock, "HH:MM". Today's flights that already left use it. */
export function nowVancouverHHMM(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  // en-CA can render midnight as "24:00"; the schedule speaks "00:00".
  return fmt.format(new Date()).replace(/^24/, "00");
}

export function seeded(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^= h >>> 16) >>> 0) / 4294967295;
}

/* ===================== config.ts ===================== */

export const FLIGHT_MINUTES = 35;

export function minConnectionMinutes(): number {
  return Number(process.env.MIN_CONNECTION_MINUTES || 60);
}

export function extraTimeMinutes(): number {
  return Number(process.env.EXTRA_TIME_MINUTES || 120);
}

export const BOAT_LABELS: Record<BoatType, string> = {
  semi_covered: "Victoria Whale Watching, Semi-Covered Vessel Tour",
  open: "Victoria Open Vessel Tour",
};

export const BOAT_SHORT: Record<BoatType, string> = {
  semi_covered: "Semi-covered vessel",
  open: "Open vessel",
};

export function eligibleBoats(pax: Pax): BoatType[] {
  const boats: BoatType[] = ["semi_covered"];
  if (!pax.pregnant && !pax.senior && pax.children === 0 && pax.infants === 0) {
    boats.push("open");
  }
  return boats;
}

/** Travellers who take a seat, on the boat and on the plane. Infants ride on laps. */
export function partySize(pax: Pax): number {
  return pax.males + pax.females + pax.x + pax.children;
}

/**
 * The party in the boat's vocabulary.
 *
 * FareHarbor rates by adult, child, senior and infant. Gender does not exist
 * on the water, and seniors bill at the adult rate on both boats (there is no
 * Senior type in this account), so a 65-plus group member changes which boat
 * is offered but never the boat price.
 *
 * Infants are free on the plane, where they ride on a lap, and NOT free on the
 * boat: the semi-covered vessel sells an Infant fare of its own. Two different
 * products, two different answers.
 */
export function tourGuests(pax: Pax): {
  adults: number;
  children: number;
  seniors: number;
  infants: number;
} {
  return {
    adults: pax.males + pax.females + pax.x,
    children: pax.children,
    seniors: 0,
    infants: pax.infants,
  };
}

/**
 * The key used to read the flight table.
 *
 * For this site the anon / publishable key is enough and is the better choice:
 * flight_schedule has a select policy for anon, and an anon key that leaks can
 * only read a published timetable. A service_role key that leaks can read and
 * write everything in the project.
 *
 * Either is accepted, so an existing SUPABASE_SERVICE_ROLE_KEY keeps working.
 */
export function supabaseKey(): string | undefined {
  return process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function supabaseLive(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && supabaseKey());
}

export const FH_DEFAULTS = {
  shortname: "orcaspiritadventures",
  summer: { semiCovered: "679769", openVessel: "685994" },
  winter: { semiCovered: "679748", openVessel: "685990" },
} as const;

export function fhShortname(): string {
  return process.env.FAREHARBOR_SHORTNAME || FH_DEFAULTS.shortname;
}

export function fhItemPks(boat: BoatType, date?: string): string[] {
  const override =
    boat === "semi_covered"
      ? process.env.FAREHARBOR_ITEM_SEMI_COVERED
      : process.env.FAREHARBOR_ITEM_OPEN_VESSEL;
  if (override) {
    return override
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const summer =
    boat === "semi_covered"
      ? FH_DEFAULTS.summer.semiCovered
      : FH_DEFAULTS.summer.openVessel;
  const winter =
    boat === "semi_covered"
      ? FH_DEFAULTS.winter.semiCovered
      : FH_DEFAULTS.winter.openVessel;

  const month = date ? Number(date.slice(5, 7)) : 0;
  if (month >= 5 && month <= 9) return [summer];
  if (month === 12 || month === 1 || month === 2) return [winter];
  return [summer, winter];
}

export function fhItemPk(boat: BoatType): string {
  return fhItemPks(boat, undefined)[0];
}

export function fareharborLive(): boolean {
  return Boolean(
    process.env.FAREHARBOR_USER_KEY && process.env.FAREHARBOR_APP_KEY
  );
}

export function demoDataAllowed(): boolean {
  return process.env.DEMO_MODE === "1" || process.env.DEMO_MODE === "true";
}

/**
 * The operator's public feed. On by default: it needs no keys and returns the
 * real schedule, so there is no reason to show an empty site while waiting for
 * FareHarbor to issue an App Key. Set FAREHARBOR_PUBLIC_FALLBACK=0 to turn it
 * off and go back to the hard "not connected" state.
 */
export function publicFallbackEnabled(): boolean {
  const v = process.env.FAREHARBOR_PUBLIC_FALLBACK;
  if (v === "0" || v === "false") return false;
  return true;
}

export type DataSources = {
  tours: "fareharbor" | "public" | "mock" | "unconfigured";
  flights: "supabase" | "mock";
};

export function dataSources(): DataSources {
  return {
    tours: fareharborLive()
      ? "fareharbor"
      : demoDataAllowed()
        ? "mock"
        : publicFallbackEnabled()
          ? "public"
          : "unconfigured",
    flights: supabaseLive() ? "supabase" : "mock",
  };
}


export function fareharborBase(): string {
  return (
    process.env.FAREHARBOR_API_BASE || "https://fareharbor.com/api/external/v1"
  ).replace(/\/$/, "");
}

/**
 * The package deal: booking the day as one thing costs less than its parts.
 * Shown on the ticket as a percentage off the whole total. Zero turns it off.
 */
export function packageDiscountPct(): number {
  const n = Number(process.env.NEXT_PUBLIC_PACKAGE_DISCOUNT_PCT);
  return Number.isFinite(n) && n >= 0 && n < 100 ? n : 5;
}

/** What a discounted total looks like, with the rounding in one place. */
export function applyPackageDeal(cents: number): { saveCents: number; totalCents: number } {
  const saveCents = Math.round((cents * packageDiscountPct()) / 100);
  return { saveCents, totalCents: cents - saveCents };
}

/**
 * The flexibility add-on: change or cancel anytime before departure. One flat
 * figure for the whole booking, whatever the party size.
 */
export function flexAddonCents(): number {
  const n = Number(process.env.NEXT_PUBLIC_FLEX_ADDON_CENTS);
  return Number.isFinite(n) && n >= 0 ? n : 9900;
}

/* ===================== breakdown.ts ===================== */

/**
 * The full FareHarbor price ladder for one guest.
 *
 * The price preview gives one number per guest type. That number is
 * fee-inclusive and tax-exclusive, which is an awkward middle rung: it is
 * neither what the operator earns nor what the guest pays. Everything above
 * and below it is derivable, so we never spend a request on it.
 *
 * Verified against orcaspiritadventures on 2026-08-05, two items, seven guest
 * types. Both rates came out exact to the cent, and every derived subtotal
 * landed on a whole dollar, which is what you would expect if the operator
 * types round dollars into FareHarbor and the platform derives the rest.
 *
 *   item 685994, open vessel, availability 1923668237
 *     include_taxes=no   total 19764   booking_fee 1464
 *     include_taxes=yes  total 20679   booking_fee 1464
 *     components         offset 16900 + 1000 fuel + 400 wildlife = 18300
 *
 *     18300 * 0.08 = 1464   ->  19764   matches include_taxes=no
 *     18300 * 0.05 =  915   ->  20679   matches include_taxes=yes
 *
 * Two things that fall out of those numbers and are worth stating plainly,
 * because both are easy to get wrong:
 *
 *   1. GST is charged on the subtotal, not on the fee-inclusive number.
 *      5% of 18300 is 915, which is what FareHarbor returned. 5% of 19764
 *      would be 988. The booking fee is not taxed.
 *
 *   2. The 8% is a percentage of the subtotal, not a slice of the total.
 *      preview = subtotal * 1.08, so recovering the subtotal is a division
 *      by 1.08 and not a multiplication by 0.92.
 */

/**
 * FareHarbor's booking fee, as a share of the operator's subtotal.
 *
 * Inferred, not returned by the preview. It held exactly across all seven
 * guest types on both boats, but a fee schedule can be tiered or capped and
 * we have no data above $187. `ladderIsExact` below is the tripwire: if the
 * operator's fee changes, subtotals stop landing on whole cents and you find
 * out from a log line instead of from a customer.
 */
export const BOOKING_FEE_RATE = 0.08;

/**
 * GST. Tax type 123021 in this account, at 0.05, on every priced component.
 *
 * The sheet response marks the fare, the fuel surcharge and the wildlife fee
 * as `taxability: "pro-rate"`, and every add-on dropdown as
 * `taxability: "none"`. One tax type only, so no PST on tour services.
 */
export const TAX_RATE = 0.05;
export const TAX_TYPE_PK = 123021;

/**
 * What the operator charges, before FareHarbor and before the government.
 *
 * Only known for item 685994 and only for the availability probed above. The
 * semi-covered boat's subtotal is a different number and its split into fare,
 * fuel and wildlife is unknown without its own total sheet. Kept here as
 * reference so nobody re-derives it, and deliberately not used for pricing.
 */
export const KNOWN_COMPONENTS_685994 = {
  fareCents: 16900,
  fuelSurchargeCents: 1000,
  wildlifeFeeCents: 400,
} as const;

export type GuestLadder = {
  /** What the operator books. Fare plus any surcharges, before fee and tax. */
  subtotalCents: number;
  /** FareHarbor's cut. Already inside the preview number. Not taxed. */
  bookingFeeCents: number;
  /** GST on the subtotal alone. */
  taxCents: number;
  /** The preview's own number. Fee in, tax out. */
  exTaxCents: number;
  /** What the guest actually pays. */
  allInCents: number;
};

/**
 * Split one price-preview figure into the whole ladder.
 *
 * Rounds half-up at each rung the same way FareHarbor does, so the sum of the
 * parts always equals the whole and a receipt never shows a stray cent.
 */
export function guestLadder(previewCents: number): GuestLadder {
  const subtotalCents = Math.round(previewCents / (1 + BOOKING_FEE_RATE));
  const bookingFeeCents = previewCents - subtotalCents;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return {
    subtotalCents,
    bookingFeeCents,
    taxCents,
    exTaxCents: previewCents,
    allInCents: previewCents + taxCents,
  };
}

/**
 * True when the preview divides cleanly by the fee rate.
 *
 * Every real figure so far has. A false here means the fee schedule moved and
 * `guestLadder` is now guessing, so callers should log it rather than trust a
 * subtotal that is a cent or two off.
 */
export function ladderIsExact(previewCents: number): boolean {
  const exact = previewCents / (1 + BOOKING_FEE_RATE);
  return Math.abs(exact - Math.round(exact)) < 1e-6;
}

/** Add up a party's ladders into one. */
export function sumLadders(ladders: GuestLadder[]): GuestLadder {
  return ladders.reduce<GuestLadder>(
    (a, l) => ({
      subtotalCents: a.subtotalCents + l.subtotalCents,
      bookingFeeCents: a.bookingFeeCents + l.bookingFeeCents,
      taxCents: a.taxCents + l.taxCents,
      exTaxCents: a.exTaxCents + l.exTaxCents,
      allInCents: a.allInCents + l.allInCents,
    }),
    { subtotalCents: 0, bookingFeeCents: 0, taxCents: 0, exTaxCents: 0, allInCents: 0 }
  );
}

/** Repeat one guest type n times. */
export function ladderFor(previewCents: number, count: number): GuestLadder {
  return sumLadders(Array.from({ length: count }, () => guestLadder(previewCents)));
}

/* ===================== party.ts ===================== */

/**
 * Standard weights, in pounds, per traveller type.
 *
 * A seaplane's payload is a hard number and the party's weight is checked
 * against `weight_remaining` from the flight export. These are planning
 * figures, nobody is weighed at the dock, and they are deliberately in one
 * place so a regulatory change is a one-line edit.
 *
 *   male / X   196 lb
 *   female     154 lb
 *   child      75 lb   (3 to 12, takes a seat)
 *   infant     30 lb   (under 3, on a lap: weight counts, no seat, no fare)
 */
export const STANDARD_WEIGHT_LBS = {
  male: 196,
  female: 154,
  x: 196,
  child: 75,
  infant: 30,
} as const;

export function adultCount(pax: Pax): number {
  return pax.males + pax.females + pax.x;
}

/** Travellers who occupy a seat: adults and kids. Infants ride on a lap. */
export function seatsNeeded(pax: Pax): number {
  return adultCount(pax) + pax.children;
}

/** The party's planning weight, infants included. */
export function partyWeightLbs(pax: Pax): number {
  return (
    (pax.males + pax.x) * STANDARD_WEIGHT_LBS.male +
    pax.females * STANDARD_WEIGHT_LBS.female +
    pax.children * STANDARD_WEIGHT_LBS.child +
    pax.infants * STANDARD_WEIGHT_LBS.infant
  );
}

/**
 * How many seats this flight really has for THIS party.
 *
 * Two ceilings apply and the lower one wins:
 *
 *   1. Seats on sale, the largest open fare bucket (`leg.seatsLeft`).
 *   2. Payload. A plane can have chairs free and no pounds left. The cap is
 *      how many travellers of this party's average weight still fit into
 *      `weight_remaining`.
 *
 * Using the party's own average keeps the number honest in both directions:
 * two 154 lb travellers fit where one 196 lb pair would not, and the maths
 * below guarantees the displayed count agrees with the booking test:
 * `seatsNeeded(pax) <= seatsOpenFor(leg, pax)` is exactly
 * `partyWeightLbs(pax) <= weight_remaining` plus the seat ceiling, because
 * floor(remaining / avg) >= n  ⇔  n * avg <= remaining  for integer n.
 */
export function seatsOpenFor(leg: FlightLeg, pax: Pax): number {
  const seats = seatsNeeded(pax);
  const byFare = leg.seatsLeft;
  if (leg.weightRemainingLbs === null) return byFare;

  const weight = partyWeightLbs(pax);
  // No party yet (or an impossible zero-weight one): quote the conservative
  // count, a full load of standard 196 lb adults.
  const avg = seats > 0 && weight > 0 ? weight / seats : STANDARD_WEIGHT_LBS.male;
  const byWeight = Math.floor(leg.weightRemainingLbs / avg);
  return Math.max(0, Math.min(byFare, byWeight));
}

/** Can this party board this flight? Seats and payload both have to say yes. */
export function legFits(leg: FlightLeg, pax: Pax): boolean {
  const seats = seatsNeeded(pax);
  if (seats === 0) return false;
  return seats <= seatsOpenFor(leg, pax);
}

/**
 * The price of `seats` seats on one leg, filled cheapest first.
 *
 * Fare buckets are nested, not additive: `fares` is sorted cheapest first and
 * each bucket says how many seats can go at that price in total. So the k-th
 * seat costs the cheapest bucket that still covers k seats. With 1 seat open
 * at $176 and 2 at $266, a pair pays $176 + $266, the two cheapest tickets
 * on the plane, exactly as they would be sold one by one.
 *
 * The site sells all of it as one product: bucket names never reach the
 * interface, the ladder only decides what each seat costs.
 *
 * Returns null when the plane cannot price that many seats, which callers
 * treat as "does not fit". Infants are not passed in here: they hold no seat
 * and fly free.
 */
export function legPriceCents(leg: FlightLeg, seats: number): number | null {
  if (seats <= 0) return 0;
  let total = 0;
  for (let k = 1; k <= seats; k++) {
    const bucket = leg.fares.find((f) => f.seats >= k);
    if (!bucket) return null;
    total += bucket.priceCents;
  }
  return total;
}

/** Per-seat prices for a receipt line, cheapest first. Null when short. */
export function perSeatCents(leg: FlightLeg, seats: number): number[] | null {
  const out: number[] = [];
  for (let k = 1; k <= seats; k++) {
    const bucket = leg.fares.find((f) => f.seats >= k);
    if (!bucket) return null;
    out.push(bucket.priceCents);
  }
  return out;
}

/* ===================== pax-params.ts ===================== */

/**
 * Read a party out of query params.
 *
 * The interface sends males / females / x / children / infants plus the two
 * flags. Old links that still say ?adults=2 keep working: with no gender to
 * go on, each legacy adult is planned at the conservative 196 lb standard
 * weight, which can only under-promise seats, never oversell them.
 */
export function paxFromParams(sp: URLSearchParams): Pax {
  const n = (key: string) => {
    const v = Math.floor(Number(sp.get(key)));
    if (!Number.isFinite(v) || v < 0) return 0;
    return Math.min(24, v);
  };

  let males = n("males");
  const females = n("females");
  const x = n("x");
  if (males + females + x === 0) {
    males = Math.max(1, n("adults") || 1);
  }

  const children = n("children");
  const adults = males + females + x;

  return {
    males,
    females,
    x,
    children,
    // An infant rides on an adult's lap, so there is never more of one than
    // the other.
    infants: Math.min(n("infants"), adults),
    pregnant: sp.get("pregnant") === "1",
    senior: sp.get("senior") === "1",
  };
}

/* ===================== fareharbor-embed.ts ===================== */

export type EmbedCustomerType = {
  id: number;
  singular: string;
  plural: string;
  note: string | null;
  priceCents: number;
  minPartySize: number;
};

export type EmbedItemPreview = {
  itemPk: number;
  availabilityPk: number | null;
  start: string | null;
  end: string | null;
  lowCents: number | null;
  highCents: number | null;
  customerTypes: EmbedCustomerType[];
};

export type EmbedPreview = {
  items: EmbedItemPreview[];
  currency: string | null;
  includesBookingFees: boolean;
  includesTaxes: boolean;
};

function hhmmEmbed(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const m = String(iso).match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : null;
}

type RawType = {
  id?: number;
  singular?: string;
  plural?: string;
  note?: string | null;
  price?: number;
  min_party_size?: number;
};

type RawItem = {
  id?: number;
  availability?: { id?: number; start_at?: string; end_at?: string } | null;
  price?: {
    low?: number | null;
    high?: number | null;
    breakdown?: { customer_types?: RawType[] } | null;
  } | null;
};

type RawPreview = {
  items?: RawItem[];
  details?: {
    currency?: string;
    prices_include_booking_fees?: boolean;
    prices_include_taxes?: boolean;
  };
};

export function parsePricePreview(raw: RawPreview): EmbedPreview {
  const items: EmbedItemPreview[] = (raw.items || []).map((it) => ({
    itemPk: Number(it.id),
    availabilityPk: it.availability?.id ?? null,
    start: hhmmEmbed(it.availability?.start_at),
    end: hhmmEmbed(it.availability?.end_at),
    lowCents: it.price?.low ?? null,
    highCents: it.price?.high ?? null,
    customerTypes: (it.price?.breakdown?.customer_types || []).map((t) => ({
      id: Number(t.id),
      singular: String(t.singular ?? ""),
      plural: String(t.plural ?? ""),
      note: t.note ?? null,
      priceCents: Number(t.price ?? 0),
      minPartySize: Number(t.min_party_size ?? 1),
    })),
  }));

  return {
    items,
    currency: raw.details?.currency ?? null,
    includesBookingFees: Boolean(raw.details?.prices_include_booking_fees),
    includesTaxes: Boolean(raw.details?.prices_include_taxes),
  };
}

export function pricePreviewUrlEmbed(date: string, itemPks: string[]): string {
  const qs = new URLSearchParams({
    date,
    item_pks: itemPks.join(","),
    include_breakdown: "yes",
  });
  return `https://fareharbor.com/api/embed/${fhShortname()}/price-preview/per-item/v2/?${qs}`;
}

export async function fetchPricePreview(
  date: string,
  itemPks: string[]
): Promise<EmbedPreview> {
  const res = await fetch(pricePreviewUrlEmbed(date, itemPks), {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`FareHarbor embed ${res.status} for ${date}`);
  }
  return parsePricePreview((await res.json()) as RawPreview);
}

export async function publicAvailabilities(
  date: string,
  boats: BoatType[]
): Promise<TourSlot[]> {
  const wanted = new Map<string, BoatType>();
  for (const boat of boats) {
    for (const pk of fhItemPks(boat, date)) wanted.set(pk, boat);
  }
  if (wanted.size === 0) return [];

  const preview = await fetchPricePreview(date, Array.from(wanted.keys()));
  const slots: TourSlot[] = [];

  for (const item of preview.items) {
    const boat = wanted.get(String(item.itemPk));
    if (!boat || !item.start || !item.end || item.availabilityPk == null) continue;

    const adult = matchCustomerType(item.customerTypes, "adult");
    const child = matchCustomerType(item.customerTypes, "child");
    const senior = matchCustomerType(item.customerTypes, "senior");
    const fallback = item.lowCents ?? adult?.priceCents ?? 0;

    slots.push({
      availabilityPk: String(item.availabilityPk),
      boat,
      start: item.start,
      end: item.end,
      seatsLeft: 0,
      seatsUnknown: true,
      partialSchedule: true,
      priceAdultCents: adult?.priceCents ?? fallback,
      priceChildCents: child?.priceCents ?? adult?.priceCents ?? fallback,
      priceSeniorCents: senior?.priceCents ?? adult?.priceCents ?? fallback,
      priceInfantCents:
        matchCustomerType(item.customerTypes, "infant" as PaxKind)?.priceCents ?? 0,
    });
  }

  slots.sort((a, b) => a.start.localeCompare(b.start) || a.boat.localeCompare(b.boat));
  return slots;
}
export type PaxKind = "adult" | "youth" | "child" | "senior" | "infant";

export function matchCustomerType<T extends { singular: string; plural?: string }>(
  types: T[],
  kind: PaxKind
): T | undefined {
  const has = (t: T, word: string) =>
    `${t.singular} ${t.plural ?? ""}`.toLowerCase().includes(word);

  const exact = types.find((t) => has(t, kind));
  if (exact) return exact;

  // No fallback for infants. The open vessel has no infant type because it
  // does not take them, and inheriting the adult fare would invent a price.
  if (kind === "infant") return undefined;
  if (kind === "senior") return types.find((t) => has(t, "adult"));
  if (kind === "youth") {
    return types.find((t) => has(t, "child")) || types.find((t) => has(t, "adult"));
  }
  if (kind === "child") {
    return types.find((t) => has(t, "youth")) || types.find((t) => has(t, "adult"));
  }
  return undefined;
}

/* ===================== fareharbor-public.ts ===================== */

/**
 * Key-free FareHarbor client.
 *
 * The External API (`/api/external/v1/`) needs a partner App Key that
 * FareHarbor issues by hand, so `lib/fareharbor.ts` cannot show anything until
 * those arrive. These endpoints are the ones the operator's own booking widget
 * calls. No auth, and between them they carry everything this site needs:
 *
 *   1. month calendar   1 request per item per MONTH   every departure + times
 *   2. availability      1 request per departure        real seats left
 *   3. price preview     1 request per item per date    price per customer type
 *
 * All three were verified live against orcaspiritadventures on 2026-07-31.
 * Response shapes and the traps below are documented inline in this file.
 *
 * The month endpoint is why this is viable: painting a calendar grid costs two
 * requests, not sixty. Seats are only fetched for the day a guest actually
 * opens.
 *
 * Caveat to keep in mind: these are internal widget endpoints. They are not
 * documented or versioned and FareHarbor can change them in any release. Good
 * enough to launch on; swap to `lib/fareharbor.ts` the moment the keys land.
 */




const BASE = "https://fareharbor.com";

/** Company timezone. Departure times come back naive; they are always this. */
export const OPERATOR_TZ = "Canada/Pacific";

// ---------------------------------------------------------------------------
// Cache. Keyed by URL-ish strings, TTL per kind of data.
// Survives within a server process; Vercel's data cache and the
// Cache-Control headers on the routes absorb the rest.
// ---------------------------------------------------------------------------

type Entry<T> = { at: number; value: T };

const MONTH_TTL_MS = 5 * 60_000; //  departures move when the operator edits
const SEAT_TTL_MS = 45_000; //      seats move on every booking
const PRICE_TTL_MS = 60 * 60_000; // prices move seasonally

const monthCache = new Map<string, Entry<MonthCalendar>>();
const seatCache = new Map<string, Entry<SeatDetail | null>>();
const priceCache = new Map<string, Entry<DatePrices>>();

function fresh<T>(m: Map<string, Entry<T>>, key: string, ttl: number): T | undefined {
  const hit = m.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > ttl) {
    m.delete(key);
    return undefined;
  }
  return hit.value;
}

function store<T>(m: Map<string, Entry<T>>, key: string, value: T): T {
  // Keep the maps from growing without bound in a long-lived process.
  if (m.size > 400) {
    for (const k of Array.from(m.keys()).slice(0, 200)) m.delete(k);
  }
  m.set(key, { at: Date.now(), value });
  return value;
}

export function clearPublicCache(): void {
  monthCache.clear();
  seatCache.clear();
  priceCache.clear();
}

// ---------------------------------------------------------------------------
// HTTP. Retries 429 and 5xx, honours Retry-After, never throws on a bad body.
// ---------------------------------------------------------------------------

export class FhPublicError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "FhPublicError";
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson<T>(url: string, revalidate: number, attempt = 0): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate },
    });
  } catch (err) {
    if (attempt < 2) {
      await sleep(400 * (attempt + 1));
      return getJson<T>(url, revalidate, attempt + 1);
    }
    throw new FhPublicError(
      `Could not reach FareHarbor: ${err instanceof Error ? err.message : String(err)}`,
      0
    );
  }

  if ((res.status === 429 || res.status >= 500) && attempt < 2) {
    const retryAfter = Number(res.headers.get("Retry-After") || 0);
    await sleep(retryAfter > 0 ? retryAfter * 1000 : 700 * Math.pow(2, attempt));
    return getJson<T>(url, revalidate, attempt + 1);
  }

  if (!res.ok) {
    throw new FhPublicError(
      `FareHarbor ${res.status} on ${new URL(url).pathname}`,
      res.status
    );
  }

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // A 200 with a non-JSON body means the path does not exist. Several
    // plausible-looking /api/embed/ paths behave exactly this way.
    throw new FhPublicError(
      `FareHarbor returned 200 but not JSON on ${new URL(url).pathname}. The endpoint has probably moved`,
      200
    );
  }
}

/** Run tasks with a small worker pool so we never fan out hard at the API. */
async function pooled<T>(tasks: (() => Promise<T>)[], size = 3): Promise<T[]> {
  const out: T[] = new Array(tasks.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < tasks.length) {
      const i = cursor++;
      out[i] = await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, tasks.length) }, worker));
  return out;
}

// ---------------------------------------------------------------------------
// 1. Month calendar
// ---------------------------------------------------------------------------

export type PublicDeparture = {
  availabilityPk: string;
  itemPk: string;
  date: string; // YYYY-MM-DD, operator local
  start: string; // HH:MM, operator local
  end: string; // HH:MM
  status: string; // "auto" | "open" | "call"
  isBookable: boolean;
  isSoldOut: boolean;
  phoneOnly: boolean;
  isWaitlist: boolean;
  headline: string;
  bookUrl: string;
  /** Departure has no meaningful clock time (private charters, gift cards). */
  timeTbd: boolean;
};

export type MonthCalendar = {
  byDate: Map<string, PublicDeparture[]>;
  /** Set only when the month is empty: when the item next runs. */
  nextBookableAt: string | null;
  /** Days the API collapsed into item_groups; their departures are hidden. */
  groupedDays: string[];
};

type RawAvailability = {
  pk?: number;
  item?: { pk?: number };
  start_at?: string;
  end_at?: string;
  status?: string;
  is_bookable?: boolean;
  is_sold_out?: boolean;
  is_bookable_only_by_phone?: boolean;
  is_waitlist?: boolean;
  is_unlisted?: boolean;
  headline?: string;
  availability_headline?: { name?: string } | null;
  book_url?: string;
};

type RawCalendar = {
  calendar?: {
    next_bookable_start_at?: string | null;
    weeks?: {
      days?: {
        at?: string;
        count?: number;
        availabilities?: RawAvailability[];
        item_groups?: unknown[];
      }[];
    }[];
  };
};

function hhmm(iso: string | undefined | null): string | null {
  const m = String(iso ?? "").match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : null;
}

export function monthCalendarUrl(itemPk: string, year: number, month: number): string {
  const mm = String(month).padStart(2, "0");
  // allow_grouped=no is load bearing. The widget sends "yes", and on a busy day
  // that returns count:2 with availabilities:[], every departure hidden inside
  // item_groups. Orca Spirit's private tour does this on 16 Aug 2026.
  const qs = "allow_grouped=no&bookable_only=no&asn=&path=&is_fh_app=no";
  return `${BASE}/api/v1/companies/${fhShortname()}/items/${itemPk}/calendar/${year}/${mm}/?${qs}`;
}

export async function fetchMonthCalendar(
  itemPk: string,
  year: number,
  month: number
): Promise<MonthCalendar> {
  const url = monthCalendarUrl(itemPk, year, month);
  const cached = fresh(monthCache, url, MONTH_TTL_MS);
  if (cached) return cached;

  const raw = await getJson<RawCalendar>(url, 300);
  const byDate = new Map<string, PublicDeparture[]>();
  const groupedDays: string[] = [];
  const seen = new Set<number>();

  for (const week of raw.calendar?.weeks ?? []) {
    for (const day of week.days ?? []) {
      const date = day.at;
      if (!date) continue;
      const list = day.availabilities ?? [];

      // Collapsed day: count says there is inventory but the array is empty.
      if (list.length === 0 && (day.item_groups?.length ?? 0) > 0) {
        groupedDays.push(date);
        continue;
      }

      for (const a of list) {
        if (a.pk == null || seen.has(a.pk)) continue;
        seen.add(a.pk);
        const start = hhmm(a.start_at);
        const end = hhmm(a.end_at);
        if (!start || !end) continue;
        if (a.is_unlisted) continue;

        // Private charters and gift cards come back 00:00 to next midnight with
        // the real arrangement in availability_headline. Never render that as a
        // midnight sailing.
        const timeTbd = start === "00:00" && end === "00:00";

        const rows = byDate.get(date) ?? [];
        rows.push({
          availabilityPk: String(a.pk),
          itemPk: String(a.item?.pk ?? itemPk),
          date,
          start,
          end,
          status: a.status ?? "",
          isBookable: Boolean(a.is_bookable),
          isSoldOut: Boolean(a.is_sold_out),
          phoneOnly: Boolean(a.is_bookable_only_by_phone),
          isWaitlist: Boolean(a.is_waitlist),
          headline: a.headline || a.availability_headline?.name || "",
          bookUrl: a.book_url ? `${BASE}${a.book_url}` : "",
          timeTbd,
        });
        byDate.set(date, rows);
      }
    }
  }

  Array.from(byDate.values()).forEach((rows) =>
    rows.sort((x, y) => x.start.localeCompare(y.start))
  );

  return store(monthCache, url, {
    byDate,
    nextBookableAt: raw.calendar?.next_bookable_start_at ?? null,
    groupedDays,
  });
}

// ---------------------------------------------------------------------------
// 2. Availability detail, the only public source of real seat counts
// ---------------------------------------------------------------------------

export type PublicCustomerType = {
  /** Company-wide customer type pk. Joins onto the price preview. */
  customerTypePk: number;
  /** Per-departure rate pk. Different id space; needed to book. */
  ratePk: number;
  singular: string;
  /** What the book form shows, e.g. "Ages 19+". */
  note: string;
  /** The age the system actually enforces. Can disagree with `note`. */
  minAge: number | null;
  maxAge: number | null;
};

export type SeatDetail = {
  seatsLeft: number | null;
  reserved: number | null;
  customerTypes: PublicCustomerType[];
};

type RawDetail = {
  availability?: {
    capacity?: number | null;
    bookable_capacity?: number | null;
    non_resource_bookable_capacity?: number | null;
    reserved_capacity?: number | null;
    customer_type_rates?: {
      pk?: number;
      customer_prototype?: {
        display_name?: string;
        minimum_age?: number | null;
        maximum_age?: number | null;
        customer_type?: { pk?: number; singular?: string; note?: string };
      };
    }[];
  };
};

export function availabilityUrl(itemPk: string, availabilityPk: string): string {
  return `${BASE}/api/v1/companies/${fhShortname()}/items/${itemPk}/availabilities/${availabilityPk}/`;
}

export async function fetchSeatDetail(
  itemPk: string,
  availabilityPk: string
): Promise<SeatDetail | null> {
  const url = availabilityUrl(itemPk, availabilityPk);
  const cached = fresh(seatCache, url, SEAT_TTL_MS);
  if (cached !== undefined) return cached;

  let raw: RawDetail;
  try {
    raw = await getJson<RawDetail>(url, 45);
  } catch (err) {
    // A departure can vanish between the calendar call and this one. Treat it
    // as "seats unknown" rather than failing the whole day.
    if (err instanceof FhPublicError && (err.status === 404 || err.status === 200)) {
      return store(seatCache, url, null);
    }
    throw err;
  }

  const a = raw.availability;
  if (!a) return store(seatCache, url, null);

  return store(seatCache, url, {
    // bookable_capacity first, always. non_resource_bookable_capacity is 2 on
    // availability 1923668237 and null on 1923668233, same item, same day.
    seatsLeft: a.bookable_capacity ?? a.non_resource_bookable_capacity ?? null,
    reserved: a.reserved_capacity ?? null,
    customerTypes: (a.customer_type_rates ?? []).flatMap((r) => {
      const proto = r.customer_prototype;
      const ct = proto?.customer_type;
      if (r.pk == null || ct?.pk == null) return [];
      return [
        {
          customerTypePk: ct.pk,
          ratePk: r.pk,
          singular: ct.singular || proto?.display_name || "",
          note: ct.note || "",
          minAge: proto?.minimum_age ?? null,
          maxAge: proto?.maximum_age ?? null,
        },
      ];
    }),
  });
}

// ---------------------------------------------------------------------------
// 3. Prices
// ---------------------------------------------------------------------------

export type DatePrices = {
  currency: string;
  /** customer type pk -> cents. Booking fees included, tax NOT. */
  byTypePk: Map<number, number>;
  byName: { singular: string; plural: string; priceCents: number }[];
  lowCents: number | null;
  includesBookingFees: boolean;
  includesTaxes: boolean;
  /**
   * The date of the departure FareHarbor actually priced, which is not always
   * the date asked for. Ask for a day in the past and it quietly quotes the
   * next bookable sailing instead: `date=2026-08-01` on 2026-08-05 came back
   * with availability 1898205835 on 2026-08-06. Prices are seasonal, so
   * accepting that silently stamps the wrong season onto a day. Callers must
   * compare this against the date they requested.
   */
  quotedDate: string | null;
};

type RawPricePreview = {
  items?: {
    id?: number;
    availability?: { id?: number; start_at?: string } | null;
    price?: {
      low?: number | null;
      breakdown?: {
        customer_types?: {
          id?: number;
          singular?: string;
          plural?: string;
          price?: number;
        }[];
      } | null;
    } | null;
  }[];
  details?: {
    currency?: string;
    prices_include_booking_fees?: boolean;
    prices_include_taxes?: boolean;
  };
};

export function pricePreviewUrl(itemPk: string, date: string): string {
  return (
    `${BASE}/api/embed/${fhShortname()}/price-preview/per-item/v2/` +
    `?date=${date}&item_pks=${itemPk}&include_breakdown=yes`
  );
}

export async function fetchDatePrices(itemPk: string, date: string): Promise<DatePrices> {
  const url = pricePreviewUrl(itemPk, date);
  const cached = fresh(priceCache, url, PRICE_TTL_MS);
  if (cached) return cached;

  const raw = await getJson<RawPricePreview>(url, 3600);
  const item = (raw.items ?? []).find((i) => String(i.id) === String(itemPk)) ?? raw.items?.[0];
  const types = item?.price?.breakdown?.customer_types ?? [];

  return store(priceCache, url, {
    currency: raw.details?.currency ?? "CAD",
    byTypePk: new Map(
      types.flatMap((t) => (t.id == null ? [] : [[Number(t.id), Number(t.price ?? 0)] as const]))
    ),
    byName: types.map((t) => ({
      singular: String(t.singular ?? ""),
      plural: String(t.plural ?? ""),
      priceCents: Number(t.price ?? 0),
    })),
    lowCents: item?.price?.low ?? null,
    includesBookingFees: Boolean(raw.details?.prices_include_booking_fees),
    includesTaxes: Boolean(raw.details?.prices_include_taxes),
    quotedDate: item?.availability?.start_at?.slice(0, 10) ?? null,
  });
}

// ---------------------------------------------------------------------------
// Assembling TourSlots
// ---------------------------------------------------------------------------

/** Which of our two boats an item pk belongs to, for a given date. */
function boatIndex(date: string, boats: BoatType[]): Map<string, BoatType> {
  const idx = new Map<string, BoatType>();
  for (const boat of boats) {
    for (const pk of fhItemPks(boat, date)) idx.set(pk, boat);
  }
  return idx;
}

/**
 * Resolve the fares for one item on one date, straight from the operator's
 * own price preview.
 *
 * Orca Spirit sells Adult (19+), Youth (13-18), Child and, on the semi-covered
 * vessel only, Infant (0-2). Two things follow that are easy to get wrong:
 *
 *   - There is no Senior type, so seniors pay the adult fare. Verified on
 *     both items: `matchCustomerType` already falls back that way.
 *   - Infant is a real, priced type on the semi-covered boat and is missing
 *     entirely from the open vessel. Absent means zero, never inherited from
 *     a sibling type.
 *
 * Every figure here has the booking fee inside and the tax outside, which is
 * what `prices_include_booking_fees: true, prices_include_taxes: false` in
 * the response says. `lib/breakdown.ts` turns that into a receipt.
 */
async function itemFares(
  itemPk: string,
  date: string
): Promise<{
  adult: number;
  child: number;
  senior: number;
  infant: number;
  currency: string;
} | null> {
  let prices: DatePrices;
  try {
    prices = await fetchDatePrices(itemPk, date);
  } catch {
    return null;
  }
  if (prices.byName.length === 0) return null;

  // Asking for a past date returns the next bookable sailing's price instead of
  // an error. Prices are seasonal, so taking it would put summer money on a
  // winter day. No price is better than a wrong one.
  if (prices.quotedDate && prices.quotedDate !== date) {
    return null;
  }

  const adult = matchCustomerType(prices.byName, "adult")?.priceCents;
  const child = matchCustomerType(prices.byName, "child")?.priceCents;
  const senior = matchCustomerType(prices.byName, "senior")?.priceCents;
  // Exact match only. "Infant" must not fall back to Child or Adult, or the
  // open vessel would quote a full fare for a babe in arms it cannot carry.
  const infant = prices.byName.find((t) =>
    `${t.singular} ${t.plural}`.toLowerCase().includes("infant")
  )?.priceCents;
  const base = adult ?? prices.lowCents ?? 0;
  if (!base) return null;

  return {
    adult: base,
    child: child ?? base,
    senior: senior ?? base,
    infant: infant ?? 0,
    currency: prices.currency,
  };
}

function toSlot(d: PublicDeparture, boat: BoatType): TourSlot {
  return {
    availabilityPk: d.availabilityPk,
    boat,
    start: d.start,
    end: d.end,
    seatsLeft: 0,
    seatsUnknown: true,
    priceAdultCents: 0,
    priceChildCents: 0,
    priceSeniorCents: 0,
    priceInfantCents: 0,
    status: d.status,
    soldOut: d.isSoldOut,
    phoneOnly: d.phoneOnly,
    headline: d.headline,
    bookUrl: d.bookUrl,
    itemPk: d.itemPk,
  };
}

/** Departures we are willing to sell: real time, bookable, not sold out. */
function sellable(d: PublicDeparture): boolean {
  return d.isBookable && !d.isSoldOut && !d.phoneOnly && !d.isWaitlist && !d.timeTbd;
}

/**
 * Every sellable departure in a month, keyed by date, with prices attached but
 * seats left unknown.
 *
 * Cost: one request per item per month, plus one price request per item per
 * date that has departures. For a two-boat August that is 2 + ~60. The calendar
 * grid only needs the times, so callers that don't show money can pass
 * `withPrices: false` and spend just the 2.
 */
export async function publicMonthSlots(
  year: number,
  month: number,
  boats: BoatType[],
  opts?: { withPrices?: boolean }
): Promise<{
  byDate: Map<string, TourSlot[]>;
  nextBookableAt: string | null;
  groupedDays: string[];
  errors: string[];
}> {
  const mm = String(month).padStart(2, "0");
  const probe = `${year}-${mm}-15`; // mid-month, for season-aware item choice
  const index = boatIndex(probe, boats);

  const byDate = new Map<string, TourSlot[]>();
  const errors: string[] = [];
  const groupedDays = new Set<string>();
  let nextBookableAt: string | null = null;

  const calendars = await pooled(
    Array.from(index.entries()).map(([pk, boat]) => async () => {
      try {
        return { pk, boat, cal: await fetchMonthCalendar(pk, year, month) };
      } catch (err) {
        // Out-of-season products 404. That is "no departures", not a failure.
        if (err instanceof FhPublicError && err.status === 404) {
          return { pk, boat, cal: null };
        }
        errors.push(err instanceof Error ? err.message : String(err));
        return { pk, boat, cal: null };
      }
    })
  );

  for (const { boat, cal } of calendars) {
    if (!cal) continue;
    if (cal.nextBookableAt && !nextBookableAt) nextBookableAt = cal.nextBookableAt;
      cal.groupedDays.forEach((d) => groupedDays.add(d));

    for (const [date, departures] of Array.from(cal.byDate.entries())) {
      // The month grid pads with neighbouring months; keep only this one.
      if (!date.startsWith(`${year}-${mm}`)) continue;
      const rows = byDate.get(date) ?? [];
      for (const dep of departures) {
        if (!sellable(dep)) continue;
        rows.push(toSlot(dep, boat));
      }
      if (rows.length) byDate.set(date, rows);
    }
  }

  if (opts?.withPrices !== false) {
    const jobs: (() => Promise<void>)[] = [];
    const wanted = new Set<string>();
    Array.from(byDate.entries()).forEach(([date, rows]) => {
      rows.forEach((r) => wanted.add(`${r.itemPk}|${date}`));
    });
    for (const key of Array.from(wanted)) {
      const [itemPk, date] = key.split("|");
      jobs.push(async () => {
        const p = await itemFares(itemPk, date);
        if (!p) return;
        for (const r of byDate.get(date) ?? []) {
          if (r.itemPk !== itemPk) continue;
          r.priceAdultCents = p.adult;
          r.priceChildCents = p.child;
          r.priceSeniorCents = p.senior;
          r.priceInfantCents = p.infant;
        }
      });
    }
    await pooled(jobs, 6);
  }

  Array.from(byDate.values()).forEach((rows) => {
    rows.sort((a, b) => a.start.localeCompare(b.start) || a.boat.localeCompare(b.boat));
  });

  return { byDate, nextBookableAt, groupedDays: Array.from(groupedDays), errors };
}

/**
 * One day, with real seat counts.
 *
 * Reads the day out of the cached month calendar, then spends one request per
 * departure on the detail endpoint to learn `bookable_capacity`. On a busy
 * August day for the open vessel that is about six requests.
 *
 * `seatsUnknown` stays true for any departure whose detail call failed, so the
 * pairing logic will not silently drop it: `lib/combos.ts` skips the seat test
 * when seats are unknown rather than assuming zero.
 */
export async function publicDaySlots(
  date: string,
  boats: BoatType[],
  opts?: { withSeats?: boolean }
): Promise<TourSlot[]> {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const index = boatIndex(date, boats);
  const slots: TourSlot[] = [];

  const calendars = await pooled(
    Array.from(index.entries()).map(([pk, boat]) => async () => {
      try {
        return { boat, cal: await fetchMonthCalendar(pk, year, month) };
      } catch (err) {
        if (err instanceof FhPublicError && err.status === 404) return { boat, cal: null };
        throw err;
      }
    })
  );

  for (const { boat, cal } of calendars) {
    for (const dep of cal?.byDate.get(date) ?? []) {
      if (!sellable(dep)) continue;
      slots.push(toSlot(dep, boat));
    }
  }

  // Prices: one call per distinct item on this date.
  const items = Array.from(new Set(slots.map((s) => s.itemPk!).filter(Boolean)));
  await pooled(
    items.map((itemPk) => async () => {
      const p = await itemFares(itemPk, date);
      if (!p) return;
      for (const s of slots) {
        if (s.itemPk !== itemPk) continue;
        s.priceAdultCents = p.adult;
        s.priceChildCents = p.child;
        s.priceSeniorCents = p.senior;
        s.priceInfantCents = p.infant;
      }
    }),
    3
  );

  if (opts?.withSeats !== false) {
    await pooled(
      slots.map((s) => async () => {
        try {
          const detail = await fetchSeatDetail(s.itemPk!, s.availabilityPk);
          if (!detail || detail.seatsLeft == null) return;
          s.seatsLeft = detail.seatsLeft;
          s.seatsUnknown = false;
          s.customerTypes = detail.customerTypes.map((t) => ({
            customerTypePk: t.customerTypePk,
            ratePk: t.ratePk,
            singular: t.singular,
            note: t.note,
            minAge: t.minAge,
            maxAge: t.maxAge,
          }));
        } catch {
          // Leave seatsUnknown true.
        }
      }),
      3
    );
  }

  slots.sort((a, b) => a.start.localeCompare(b.start) || a.boat.localeCompare(b.boat));
  return slots;
}

/* ===================== fareharbor.ts ===================== */

const shortname = fhShortname; // алиас из оригинального импорта

function headers(): HeadersInit {
  const h: Record<string, string> = {
    "X-FareHarbor-API-User": process.env.FAREHARBOR_USER_KEY as string,
    "Content-Type": "application/json",
  };
  const app = process.env.FAREHARBOR_APP_KEY;
  if (app) h["X-FareHarbor-API-App"] = app;
  return h;
}


async function fh<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${fareharborBase()}${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FareHarbor ${res.status} on ${path}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

type FhMinimalAvailability = {
  pk: number;
  start_at: string;
  end_at: string;
  capacity: number;
  customer_type_rates?: FhCustomerTypeRate[];
};

type FhCustomerTypeRate = {
  pk: number;
  capacity?: number;
  total?: number;
  total_including_tax?: number;
  customer_prototype?: { display_name?: string };
  customer_type?: { singular?: string; plural?: string };
  note?: string | null;
};

function isoToHHMM(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "00:00";
}

function rateName(r: FhCustomerTypeRate): string {
  return [
    r.customer_prototype?.display_name,
    r.customer_type?.singular,
    r.customer_type?.plural,
  ]
    .filter(Boolean)
    .join(" ");
}

function pickRate(
  rates: FhCustomerTypeRate[],
  kind: PaxKind
): FhCustomerTypeRate | undefined {
  const adapted = rates.map((r) => ({ singular: rateName(r), original: r }));
  const hit = matchCustomerType(adapted, kind);
  return hit?.original;
}

function centsOf(r: FhCustomerTypeRate | undefined, fallback: number): number {
  if (!r) return fallback;
  return r.total_including_tax ?? r.total ?? fallback;
}

async function liveAvailabilities(
  date: string,
  boat: BoatType,
  light: boolean
): Promise<TourSlot[]> {
  const slots: TourSlot[] = [];
  const seen = new Set<string>();

  for (const pk of fhItemPks(boat, date)) {
    let data: { availabilities: FhMinimalAvailability[] };
    try {
      data = await fh<{ availabilities: FhMinimalAvailability[] }>(
        `/companies/${shortname()}/items/${pk}/minimal/availabilities/date/${date}/`
      );
    } catch (err) {
      if (err instanceof Error && /\b404\b/.test(err.message)) continue;
      throw err;
    }

    for (const a of data.availabilities || []) {
      if (seen.has(String(a.pk))) continue;
      seen.add(String(a.pk));

      let rates = a.customer_type_rates;
      if ((!rates || rates.length === 0) && !light) {
        const detail = await fh<{ availability: FhMinimalAvailability }>(
          `/companies/${shortname()}/availabilities/${a.pk}/?detailed=yes`
        );
        rates = detail.availability.customer_type_rates || [];
      }
      rates = rates || [];
      const adult = pickRate(rates, "adult");
      const child = pickRate(rates, "child");
      const senior = pickRate(rates, "senior");
      const infant = pickRate(rates, "infant");
      const adultCents = centsOf(adult, 15900);
      slots.push({
        availabilityPk: String(a.pk),
        boat,
        start: isoToHHMM(a.start_at),
        end: isoToHHMM(a.end_at),
        seatsLeft: a.capacity,
        priceAdultCents: adultCents,
        priceChildCents: centsOf(child, adultCents),
        priceSeniorCents: centsOf(senior, adultCents),
        // Zero when the boat has no infant type, never the adult fare.
        priceInfantCents: infant ? centsOf(infant, 0) : 0,
      });
    }
  }
  return slots;
}

const MOCK: Record<BoatType, { times: [string, string][]; durMin: number; adult: number; child: number; senior: number }> = {
  semi_covered: {
    times: [
      ["10:00", "13:00"],
      ["14:30", "17:30"],
    ],
    durMin: 180,
    adult: 15900,
    child: 11900,
    senior: 14900,
  },
  open: {
    times: [
      ["10:30", "13:30"],
      ["15:00", "18:00"],
    ],
    durMin: 180,
    adult: 16900,
    child: 16900,
    senior: 16900,
  },
};

function mockAvailabilities(date: string, boat: BoatType): TourSlot[] {
  if (seeded(`fh:${date}`) < 0.11) return [];
  const cfg = MOCK[boat];
  const slots: TourSlot[] = [];
  cfg.times.forEach(([start], idx) => {
    const r = seeded(`fh:${date}:${boat}:${idx}`);
    if (r < 0.15) return;
    const seatsLeft = 4 + Math.floor(r * 36);
    slots.push({
      availabilityPk: `mock-${boat}-${date}-${idx}`,
      boat,
      start,
      end: addMin(start, cfg.durMin),
      seatsLeft,
      priceAdultCents: cfg.adult,
      priceChildCents: cfg.child,
      priceSeniorCents: cfg.senior,
      priceInfantCents: boat === "semi_covered" ? 1512 : 0,
    });
  });
  return slots;
}

export async function tourAvailabilities(
  date: string,
  boats: BoatType[],
  opts?: { light?: boolean }
): Promise<TourSlot[]> {
  if (!fareharborLive()) {
    // DEMO_MODE wins so an offline developer gets deterministic data.
    if (demoDataAllowed()) {
      return boats.flatMap((b) => mockAvailabilities(date, b));
    }
    if (publicFallbackEnabled()) {
      // Real schedule and prices with no keys at all. Seats come from the
      // availability detail endpoint unless the caller only wants the grid.
      return publicDaySlots(date, boats, { withSeats: !opts?.light });
    }
    throw new Error(
      "Availability is switched off. Set FAREHARBOR_USER_KEY plus FAREHARBOR_APP_KEY for the partner API, or leave FAREHARBOR_PUBLIC_FALLBACK unset to read the operator's public feed, or DEMO_MODE=1 for sample data."
    );
  }
  const results = await Promise.all(
    boats.map((b) => liveAvailabilities(date, b, Boolean(opts?.light)))
  );
  return results.flat();
}

export type FhBookingResult = {
  uuid: string | null;
  displayId: string | null;
  mock: boolean;
};

function buildCustomers(rates: FhCustomerTypeRate[], pax: Pax) {
  // The boat books by adult / child / senior; gender is a flight concern.
  const guests = tourGuests(pax);
  const adult = pickRate(rates, "adult");
  const child = pickRate(rates, "child");
  const senior = pickRate(rates, "senior") || adult;
  const customers: { customer_type_rate: number }[] = [];
  const push = (r: FhCustomerTypeRate | undefined, n: number) => {
    if (!r) throw new Error("FareHarbor customer type rate not found for party");
    for (let i = 0; i < n; i++) customers.push({ customer_type_rate: r.pk });
  };
  push(adult, guests.adults);
  if (guests.children > 0) push(child || adult, guests.children);
  if (guests.seniors > 0) push(senior, guests.seniors);
  return customers;
}

export async function validateTourBooking(
  availabilityPk: string,
  pax: Pax,
  contact: Contact
): Promise<{ ok: boolean; error?: string }> {
  if (!fareharborLive()) return { ok: true };
  const detail = await fh<{ availability: FhMinimalAvailability }>(
    `/companies/${shortname()}/availabilities/${availabilityPk}/?detailed=yes`
  );
  const payload = {
    contact: { name: contact.name, email: contact.email, phone: contact.phone },
    customers: buildCustomers(detail.availability.customer_type_rates || [], pax),
  };
  const res = await fh<{ is_bookable?: boolean; error?: string }>(
    `/companies/${shortname()}/availabilities/${availabilityPk}/bookings/validate/`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  if (res.is_bookable) return { ok: true };
  return { ok: false, error: res.error || "This departure is no longer bookable" };
}

export type FhBooking = {
  uuid?: string;
  display_id?: string;
  status?: string;
  is_cancelled?: boolean;
  external_id?: string | null;
  voucher_number?: string | null;
  rebooked_to?: unknown;
  rebooked_from?: unknown;
};

export async function retrieveBooking(uuid: string): Promise<FhBooking | null> {
  if (!fareharborLive()) return null;
  const res = await fh<{ booking: FhBooking }>(
    `/companies/${shortname()}/bookings/${uuid}/`
  );
  return res.booking ?? null;
}

export async function createTourBooking(
  availabilityPk: string,
  pax: Pax,
  contact: Contact,
  note: string,
  externalId: string
): Promise<FhBookingResult> {
  if (!fareharborLive()) {
    return { uuid: null, displayId: null, mock: true };
  }
  const detail = await fh<{ availability: FhMinimalAvailability }>(
    `/companies/${shortname()}/availabilities/${availabilityPk}/?detailed=yes`
  );
  const payload = {
    contact: { name: contact.name, email: contact.email, phone: contact.phone },
    customers: buildCustomers(detail.availability.customer_type_rates || [], pax),
    note,
    external_id: externalId,
    voucher_number: externalId,
  };
  const res = await fh<{ booking: { uuid: string; display_id: string } }>(
    `/companies/${shortname()}/availabilities/${availabilityPk}/bookings/`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return { uuid: res.booking.uuid, displayId: res.booking.display_id, mock: false };
}

/* ===================== net-rate.ts ===================== */

/**
 * What we pay Orca Spirit, as opposed to what the public pays.
 *
 * This is a flat contracted rate per guest. It is not a discount off the public
 * price, and nothing about it can be derived from the price preview: no booking
 * fee to divide out, no surcharge to subtract, no commission percentage. Two
 * numbers from the agreement, the same on both boats.
 *
 * VERIFIED against three partner invoices, Harbour Air -> Orca Spirit, July 2026:
 *
 *   #1003730  semi-covered  24 bookings  71 guests  $8,722.60
 *   #1000864  open vessel   12 bookings  42 guests  $4,623.34
 *   #1003710  open vessel    8 bookings  24 guests  $2,212.68
 *
 * Every line reconstructs to the cent from the table below, and so does every
 * invoice total. Two lines are not fares and are excluded: booking #351642709
 * at 0.00, comped, and #366712955 at -271.72, a rebooking credit paired with
 * #366707179 on the same voucher.
 *
 * Youth bills at the adult rate. `2 Adults, 2 Youths = 496.88` is 4 x 124.22,
 * on both boats, which is why the site's 13-64 "Adults" bucket is correct here
 * even though it would misprice against the public ladder.
 *
 * The rate is GST-inclusive: 124.22 is 118.30 plus 5%, 91.88 is 87.50 plus 5%.
 * Fuel and wildlife conservation are inside it and are not billed on top. That
 * is what the invoices show; do not re-add them on the strength of FareHarbor
 * marking those fields non-commissionable, which governs commission on retail
 * bookings and not this arrangement.
 *
 * If the agreement changes, change AGENT_NET_RATES and nothing else.
 */

/** The site's three party buckets. Adults 13-64, kids 3-12, seniors 65+. */
export type GuestType = "adult" | "child" | "senior";

/**
 * Contracted rate per guest, in cents, GST included.
 *
 * Seniors carry the adult rate because neither boat has a Senior customer type
 * in FareHarbor and the invoices bill them as adults.
 *
 * Override for a new agreement, cents, GST in:
 *
 *     AGENT_NET_RATES="adult:12422,child:9188"
 */
export const NET_RATE_CENTS: Record<GuestType, number> = {
  adult: 12422,
  child: 9188,
  senior: 12422,
};

function rateFor(type: GuestType): number {
  const raw = process.env.AGENT_NET_RATES;
  if (raw) {
    for (const pair of raw.split(",")) {
      const [key, cents] = pair.split(":").map((s) => s.trim());
      if (key === type || (key === "adult" && type === "senior")) {
        const n = Number(cents);
        if (Number.isInteger(n) && n >= 0) return n;
      }
    }
  }
  return NET_RATE_CENTS[type];
}

/**
 * The tax rate the contracted figures were struck at.
 *
 * Used only to split a rate back into fare and GST for the receipt. The total
 * is the contracted number either way, so a wrong split here moves two display
 * lines and never the amount owed.
 */
const CONTRACT_TAX_RATE = 0.05;

/**
 * The public price, or our cost. Public by default.
 *
 * Every figure a visitor sees comes straight from the operator's own price
 * preview: the same numbers Orca Spirit quotes on its own site, booking fee
 * inside and GST added on top by `lib/breakdown.ts`. Nothing is derived,
 * estimated or marked up here.
 *
 * `NEXT_PUBLIC_PRICE_MODE=net` switches to the contracted rate instead. That
 * is an internal view: the net rate is confidential commercial terms, so do
 * not point it at the public site.
 */
export function priceMode(): "public" | "net" {
  return process.env.NEXT_PUBLIC_PRICE_MODE === "net" ? "net" : "public";
}

export type NetRate = {
  /** The contracted amount less its GST component. */
  netFareCents: number;
  /** Zero. Fuel and conservation sit inside the contracted rate. */
  surchargeCents: number;
  /** The GST inside the contracted amount. */
  taxCents: number;
  /** What we owe. The invoice figure. */
  totalCents: number;
};

/** Our cost for one guest of a given type. */
export function netRate(type: GuestType): NetRate {
  const totalCents = rateFor(type);
  const netFareCents = Math.round(totalCents / (1 + CONTRACT_TAX_RATE));
  return {
    netFareCents,
    surchargeCents: 0,
    taxCents: totalCents - netFareCents,
    totalCents,
  };
}

/** Sum a party's net rates. */
export function sumNetRates(rates: NetRate[]): NetRate {
  return rates.reduce<NetRate>(
    (a, r) => ({
      netFareCents: a.netFareCents + r.netFareCents,
      surchargeCents: a.surchargeCents + r.surchargeCents,
      taxCents: a.taxCents + r.taxCents,
      totalCents: a.totalCents + r.totalCents,
    }),
    { netFareCents: 0, surchargeCents: 0, taxCents: 0, totalCents: 0 }
  );
}

/** One guest type, n times. */
export function netRateFor(type: GuestType, count: number): NetRate {
  if (count <= 0) {
    return { netFareCents: 0, surchargeCents: 0, taxCents: 0, totalCents: 0 };
  }
  const one = netRate(type);
  return {
    netFareCents: one.netFareCents * count,
    surchargeCents: 0,
    taxCents: one.taxCents * count,
    totalCents: one.totalCents * count,
  };
}

/** Our cost for a whole party. */
export function netRateForParty(pax: {
  adults: number;
  children: number;
  seniors: number;
}): NetRate {
  return sumNetRates([
    netRateFor("adult", pax.adults),
    netRateFor("child", pax.children),
    netRateFor("senior", pax.seniors),
  ]);
}

/* ===================== pricing.ts ===================== */

/**
 * One seaplane leg for the whole party, in cents, or null when the plane
 * cannot price that many seats.
 *
 * Every seat-holder, adult or kid, pays the seat's own price, filled from
 * the cheapest open fare bucket up (lib/party.ts). Infants hold no seat and
 * fly free on a lap.
 */
export function flightPriceCents(leg: FlightLeg, pax: Pax): number | null {
  return legPriceCents(leg, seatsNeeded(pax));
}

/**
 * The cheapest leg in a list, for this party, or null when none can carry it.
 * Powers the "from" price in the calendar and the plan cards.
 */
export function cheapestLegCents(legs: FlightLeg[], pax: Pax): number | null {
  let best: number | null = null;
  for (const leg of legs) {
    const c = flightPriceCents(leg, pax);
    if (c === null) continue;
    if (best === null || c < best) best = c;
  }
  return best;
}

/**
 * What the boat costs this party, all in.
 *
 * Net mode is the contracted rate with its GST already inside. Public mode
 * runs the FareHarbor ladder. Returns 0 in public mode when the grid never
 * fetched prices, which is why the calendar labels its figure honestly.
 */
export function boatAllInCents(t: TourSlot, pax: Pax): number {
  const g = tourGuests(pax);
  if (priceMode() === "net") return netRateForParty(g).totalCents;
  return sumLadders([
    ladderFor(t.priceAdultCents, g.adults),
    ladderFor(t.priceChildCents, g.children),
    ladderFor(t.priceSeniorCents, g.seniors),
    ladderFor(t.priceInfantCents, g.infants),
  ]).allInCents;
}

export function tourPrice(t: TourSlot, pax: Pax): number {
  const g = tourGuests(pax);
  return (
    t.priceAdultCents * g.adults +
    t.priceChildCents * g.children +
    t.priceSeniorCents * g.seniors +
    t.priceInfantCents * g.infants
  );
}

export function priceBreakdown(
  tour: TourSlot,
  outbound: FlightLeg,
  ret: FlightLeg,
  pax: Pax
): PriceBreakdown | null {
  const outboundCents = flightPriceCents(outbound, pax);
  const returnCents = flightPriceCents(ret, pax);
  // Both legs were filtered for this party before they could be picked, so a
  // null here means the seats moved under us. Say "no price" rather than $0.
  if (outboundCents === null || returnCents === null) return null;
  const flightsCents = outboundCents + returnCents;

  const guests = tourGuests(pax);

  // Our contracted cost. A flat rate per guest, verified against the July 2026
  // partner invoices, so there is nothing to derive and nothing to fall back
  // from: it does not depend on the item or on the public price.
  if (priceMode() === "net") {
    const net = netRateForParty(guests);
    return {
      flightsCents,
      outboundCents,
      returnCents,
      tourCents: net.netFareCents,
      totalCents: flightsCents + net.netFareCents,
      tourSubtotalCents: net.netFareCents,
      tourBookingFeeCents: 0,
      tourTaxCents: net.taxCents,
      tourSurchargeCents: 0,
      totalAllInCents: flightsCents + net.totalCents,
      mode: "net",
    };
  }

  // Each guest type gets its own ladder, because the fee and the tax are both
  // percentages of that guest's own subtotal. Adding the party up first and
  // splitting afterwards drifts by a cent or two on mixed parties.
  const boat = sumLadders([
    ladderFor(tour.priceAdultCents, guests.adults),
    ladderFor(tour.priceChildCents, guests.children),
    ladderFor(tour.priceSeniorCents, guests.seniors),
    ladderFor(tour.priceInfantCents, guests.infants),
  ]);

  if (!ladderIsExact(tour.priceAdultCents) && tour.priceAdultCents > 0) {
    console.warn(
      `[pricing] ${tour.priceAdultCents} does not divide by the booking fee rate. ` +
        `FareHarbor's fee schedule may have changed; the subtotal below is approximate.`
    );
  }

  return {
    flightsCents,
    outboundCents,
    returnCents,
    tourCents: boat.exTaxCents,
    totalCents: flightsCents + boat.exTaxCents,
    tourSubtotalCents: boat.subtotalCents,
    tourBookingFeeCents: boat.bookingFeeCents,
    tourTaxCents: boat.taxCents,
    tourSurchargeCents: 0,
    totalAllInCents: flightsCents + boat.allInCents,
    mode: "public",
  };
}

/* ===================== flights.ts ===================== */

let sb: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!supabaseLive()) return null;
  if (!sb) {
    sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      supabaseKey() as string,
      { auth: { persistSession: false } }
    );
  }
  return sb;
}

export function flightTable(): string {
  return process.env.FLIGHT_TABLE || "flight_schedule";
}

// ---------------------------------------------------------------------------
// The airport codes the catalog sells between. A route only needs its two
// codes in this list for its rows to be read; everything downstream works per
// code pair, nothing assumes a single product.
//
//   CXH  Vancouver Harbour, Coal Harbour, downtown
//   YWH  Victoria Harbour, Inner Harbour, downtown
//   GLK  Whistler, Green Lake
//   GNG  Ganges, Salt Spring Island
//
// Everything else in the export is ignored: ZNA Nanaimo, and YVR which is the
// South terminal out in Richmond. To sell one, add its code.
// ---------------------------------------------------------------------------

export const ROUTE_CODES = ["CXH", "YWH", "GLK", "GNG"];

// ---------------------------------------------------------------------------
// Reading the inventory export
//
// One row per dated departure, straight from the reservations system. The row
// carries everything a sale needs: real seats per fare bucket, real prices,
// and the payload still available. Three rules turn a row into a sellable
// flight, and all three come from how the aircraft is actually sold:
//
//   ON SALE   only rows whose status starts with KK. Cancelled (CX) and the
//             rest of the alphabet never load at all.
//
//   SEATS     the LARGEST open fare bucket, never the sum. Buckets nest: a
//             plane showing 4 seats at value and 10 at flex has 10 open
//             chairs, of which the first 4 can go at the value price. Adding
//             the buckets would count the same chair four times.
//
//   PRICE     seats fill cheapest bucket first. lib/party.ts owns that
//             ladder. The site quotes "from" the cheapest open price and the
//             bucket names never reach the interface.
//
// Weight is the fourth column that matters: `weight_remaining` is checked
// against the party's standard weights, because a seaplane can have chairs
// free and no pounds left.
// ---------------------------------------------------------------------------

type Row = {
  flight_id: number | string | null;
  flight_number: string | null;
  flight_date: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  departure_code: string | null;
  arrival_code: string | null;
  status: string | null;
  weight_remaining: number | string | null;
  light_seats: number | string | null;
  light_price: number | string | null;
  value_seats: number | string | null;
  value_price: number | string | null;
  comfort_seats: number | string | null;
  comfort_price: number | string | null;
  flex_seats: number | string | null;
  flex_price: number | string | null;
};

const ROW_COLUMNS =
  "flight_id, flight_number, flight_date, departure_time, arrival_time, " +
  "departure_code, arrival_code, status, weight_remaining, " +
  "light_seats, light_price, value_seats, value_price, " +
  "comfort_seats, comfort_price, flex_seats, flex_price";

/** "07:30:00" or "2026-08-06 07:30:00" -> "07:30". Wall clock, no timezone maths. */
function timeOf(value: string | null): string | null {
  const m = String(value ?? "").match(/\d{2}:\d{2}/);
  return m ? m[0] : null;
}

/** "2026-08-06" out of whatever the date column holds. */
function dateOf(value: string | null): string | null {
  const m = String(value ?? "").match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

/** Numbers may arrive as numerics or as text; "" and null both mean absent. */
function num(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function cents(value: number | string | null | undefined): number | null {
  const n = num(value);
  return n === null ? null : Math.round(n * 100);
}

export function statusOnSale(status: string | null | undefined): boolean {
  return String(status ?? "").trim().toUpperCase().startsWith("KK");
}

/**
 * "Flight #2013/Twin Otter" -> { flightNo: "HA 2013", aircraft: "Twin Otter" }.
 * Anything that does not match keeps its raw label.
 */
function splitLabel(raw: string | null): { flightNo: string; aircraft?: string } {
  const label = String(raw ?? "").trim();
  const no = label.match(/#\s*(\d+)/);
  const slash = label.indexOf("/");
  const aircraft = slash >= 0 ? label.slice(slash + 1).trim() : "";
  return {
    flightNo: no ? `HA ${Number(no[1])}` : label || "HA ?",
    aircraft: aircraft || undefined,
  };
}

/**
 * One export row -> one sellable flight, or null when the row is not this
 * product (wrong route), not on sale (status), or unreadable.
 */
export function rowToLeg(r: Row): FlightLeg | null {
  const from = String(r.departure_code ?? "").trim().toUpperCase();
  const to = String(r.arrival_code ?? "").trim().toUpperCase();
  if (!ROUTE_CODES.includes(from) || !ROUTE_CODES.includes(to) || from === to) return null;
  if (!statusOnSale(r.status)) return null;

  const date = dateOf(r.flight_date);
  const dep = timeOf(r.departure_time);
  const arr = timeOf(r.arrival_time);
  if (!date || !dep || !arr) return null;

  // Cheapest first by actual price, whatever the column order claims. A
  // bucket sells only when it has both seats and a price.
  const fares: FareBucket[] = (
    [
      [r.light_seats, r.light_price],
      [r.value_seats, r.value_price],
      [r.comfort_seats, r.comfort_price],
      [r.flex_seats, r.flex_price],
    ] as const
  )
    .map(([seats, price]) => ({ seats: num(seats) ?? 0, priceCents: cents(price) ?? 0 }))
    .filter((b) => b.seats > 0 && b.priceCents > 0)
    .sort((a, b) => a.priceCents - b.priceCents);

  // The largest open bucket, not the sum: buckets nest.
  const seatsLeft = fares.reduce((max, b) => Math.max(max, b.seats), 0);

  const route = `${from}-${to}`;
  const { flightNo, aircraft } = splitLabel(r.flight_number);

  return {
    id: r.flight_id != null && r.flight_id !== "" ? String(r.flight_id) : `${flightNo}:${route}:${date}:${dep}`,
    flightNo,
    aircraft,
    from,
    to,
    route,
    date,
    dep,
    arr,
    status: String(r.status ?? "").trim(),
    seatsLeft,
    weightRemainingLbs: num(r.weight_remaining),
    fares,
    fromCents: fares.length > 0 ? fares[0].priceCents : null,
  };
}

export type Inventory = {
  /** Sellable legs keyed by YYYY-MM-DD, each day's list sorted by departure. */
  byDate: Map<string, FlightLeg[]>;
  /** Rows the query returned, before the route/status/shape checks. */
  rowsRead: number;
  /** Legs that survived those checks. */
  legs: number;
  firstDate: string | null;
  lastDate: string | null;
};

/** Turn raw rows into the day-keyed inventory. Pure, so it is testable dry. */
export function buildInventory(rows: Row[]): Inventory {
  const byDate = new Map<string, FlightLeg[]>();
  let legs = 0;
  for (const r of rows) {
    const leg = rowToLeg(r);
    if (!leg) continue;
    legs++;
    const list = byDate.get(leg.date) ?? [];
    list.push(leg);
    byDate.set(leg.date, list);
  }
  for (const list of Array.from(byDate.values())) {
    list.sort((a, b) => a.dep.localeCompare(b.dep) || a.route.localeCompare(b.route));
  }
  const dates = Array.from(byDate.keys()).sort();
  return {
    byDate,
    rowsRead: rows.length,
    legs,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
  };
}

// ---------------------------------------------------------------------------
// Loading, paging and caching
//
// Postgres does the filtering: route codes, the KK status prefix and
// `flight_date >= today` all run server side, so other routes and dead
// statuses never cross the wire. The read is paged because PostgREST caps a
// response at 1000 rows however wide a range is asked for, and the result is
// cached briefly, because the upstream sync lands every few minutes and a month
// calendar should not mean thirty-one table reads.
// ---------------------------------------------------------------------------

const PAGE = 1000;
const MAX_ROWS = 200_000;

function cacheTtlMs(): number {
  const s = Number(process.env.FLIGHT_CACHE_SECONDS);
  return (Number.isFinite(s) && s >= 0 ? s : 120) * 1000;
}

/**
 * Read every page of a result set.
 *
 * `getPage` is given an inclusive row range and returns that slice, or null on
 * failure. Paging stops on a short page. This is separate from Supabase on
 * purpose: the reason it exists is PostgREST capping a response at 1000 rows
 * regardless of the range asked for, and that behaviour is worth testing
 * without a database in the room.
 */
export async function fetchAllPages<T>(
  getPage: (from: number, to: number) => Promise<T[] | null>,
  pageSize = PAGE
): Promise<T[] | null> {
  const all: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += pageSize) {
    const page = await getPage(from, from + pageSize - 1);
    if (page === null) return null;
    all.push(...page);
    if (page.length < pageSize) return all;
  }
  return all;
}

let cached: { at: number; from: string; value: Inventory } | null = null;

/** Drop the cached inventory. Call after re-importing the export. */
export function clearFlightCache(): void {
  cached = null;
}

async function loadInventory(): Promise<Inventory | null> {
  const from = todayVancouver();
  if (cached && cached.from === from && Date.now() - cached.at < cacheTtlMs()) {
    return cached.value;
  }

  const client = supabase();
  if (!client) return null;
  const table = flightTable();

  const rows = await fetchAllPages<Row>(async (lo, hi) => {
    const { data, error } = await client
      .from(table)
      .select(ROW_COLUMNS)
      .in("departure_code", ROUTE_CODES)
      .in("arrival_code", ROUTE_CODES)
      .like("status", "KK%")
      .gte("flight_date", from)
      .order("flight_date", { ascending: true })
      .order("departure_time", { ascending: true })
      .range(lo, hi);
    if (error) return null;
    return (data ?? []) as unknown as Row[];
  });

  if (rows === null) return null;
  const built = buildInventory(rows);
  cached = { at: Date.now(), from, value: built };
  return built;
}

// ---------------------------------------------------------------------------
// Mock inventory, used when Supabase is not configured. The shapes mirror the
// real export, nested buckets, a payload figure, KK statuses, so the whole
// seat, weight and price ladder can be exercised with no keys at all.
// ---------------------------------------------------------------------------

const OUT_TIMES = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30"];
const BACK_TIMES = ["07:45", "08:45", "09:45", "10:45", "11:45", "13:15", "14:45", "16:15", "17:45", "19:15", "20:15"];

function mockLeg(
  date: string,
  from: string,
  to: string,
  dep: string,
  index: number,
  minutes = FLIGHT_MINUTES
): FlightLeg {
  const route = `${from}-${to}`;
  const id = `${route}:${date}:${dep}`;
  const r = seeded(id);
  const flexSeats = 3 + Math.floor(r * 10); // 3..12
  const comfortSeats = Math.max(0, flexSeats - 2 - Math.floor(r * 3));
  const valueSeats = Math.max(0, comfortSeats - 2 - Math.floor(seeded(id + "v") * 3));
  const lightSeats = seeded(id + "l") > 0.7 ? Math.min(valueSeats, 1) : 0;
  const base = 17635 + Math.floor(seeded(id + "p") * 5) * 1000; // from $176.35

  const fares: FareBucket[] = (
    [
      [lightSeats, base],
      [valueSeats, base + 5000],
      [comfortSeats, base + 14000],
      [flexSeats, base + 19000],
    ] as const
  )
    .map(([seats, priceCents]) => ({ seats, priceCents }))
    .filter((b) => b.seats > 0);

  return {
    id,
    flightNo: `HA ${300 + (from.charCodeAt(0) % 3) * 20 + index + 1}`,
    aircraft: "Twin Otter",
    from,
    to,
    route,
    date,
    dep,
    arr: addMin(dep, minutes),
    status: "KK - On Time",
    seatsLeft: fares.reduce((m, b) => Math.max(m, b.seats), 0),
    weightRemainingLbs: 600 + Math.floor(seeded(id + "w") * 30) * 100, // 600..3500 lb
    fares,
    fromCents: fares.length > 0 ? fares[0].priceCents : null,
  };
}

const GLK_OUT = ["09:00", "10:00", "13:00", "16:00"];
const GLK_BACK = ["10:15", "14:15", "17:15", "18:00"];
const GNG_OUT = ["09:15", "12:00", "15:30"];
const GNG_BACK = ["10:15", "13:00", "18:15"];

function mockDayLegs(date: string): FlightLeg[] {
  return [
    ...OUT_TIMES.map((t, i) => mockLeg(date, "CXH", "YWH", t, i)),
    ...BACK_TIMES.map((t, i) => mockLeg(date, "YWH", "CXH", t, i)),
    ...GLK_OUT.map((t, i) => mockLeg(date, "CXH", "GLK", t, i, 45)),
    ...GLK_BACK.map((t, i) => mockLeg(date, "GLK", "CXH", t, i, 45)),
    ...GNG_OUT.map((t, i) => mockLeg(date, "CXH", "GNG", t, i)),
    ...GNG_BACK.map((t, i) => mockLeg(date, "GNG", "CXH", t, i)),
  ];
}

// ---------------------------------------------------------------------------
// What the site asks for
// ---------------------------------------------------------------------------

/**
 * Sellable flights for one calendar date, split by direction.
 *
 * The feed is dated inventory, so a date the export does not cover simply has
 * no flights, no weekday projection, no guessing. Today's list also drops
 * departures that have already left the dock.
 */
async function dayLegs(date: string): Promise<FlightLeg[]> {
  let legs: FlightLeg[];
  if (!supabase()) {
    if (date < todayVancouver()) return [];
    legs = mockDayLegs(date);
  } else {
    const inv = await loadInventory();
    legs = inv?.byDate.get(date) ?? [];
  }
  if (date === todayVancouver()) {
    const now = nowVancouverHHMM();
    legs = legs.filter((l) => l.dep > now);
  }
  return legs;
}

/** Sellable flights for one date on one code pair, in departure order. */
export async function flightsForPair(
  date: string,
  from: string,
  to: string
): Promise<FlightLeg[]> {
  return (await dayLegs(date)).filter((l) => l.from === from && l.to === to);
}

/**
 * How many legs the whole feed carries for a pair, any date.
 *
 * Zero means the route is not in the sync yet, which the interface says out
 * loud instead of showing a month of sold-out squares.
 */
export async function pairLegCount(from: string, to: string): Promise<number> {
  if (!supabase()) return 1; // the mock covers every catalog route
  const inv = await loadInventory();
  if (!inv) return 0;
  let n = 0;
  for (const legs of Array.from(inv.byDate.values())) {
    for (const l of legs) if (l.from === from && l.to === to) n++;
  }
  return n;
}

export async function flightsForDate(
  date: string
): Promise<{ out: FlightLeg[]; back: FlightLeg[] }> {
  const legs = await dayLegs(date);
  return {
    out: legs.filter((l) => l.from === "CXH" && l.to === "YWH"),
    back: legs.filter((l) => l.from === "YWH" && l.to === "CXH"),
  };
}

// ---------------------------------------------------------------------------
// Health check for /api/flights: did the import land, and is it sellable?
// ---------------------------------------------------------------------------

export type TableStats = {
  connected: boolean;
  table: string;
  /** Rows in the table, all routes and statuses. Null if the count failed. */
  rowsTotal: number | null;
  /** Rows the loader kept: CXH/YWH, status KK*, today onwards. */
  rowsOnSale: number;
  /** Distinct sellable departures after the shape checks. */
  flights: number;
  datesCovered: number;
  firstDate: string | null;
  lastDate: string | null;
  error?: string;
};

export async function flightStats(): Promise<TableStats> {
  const table = flightTable();
  const empty: TableStats = {
    connected: false,
    table,
    rowsTotal: null,
    rowsOnSale: 0,
    flights: 0,
    datesCovered: 0,
    firstDate: null,
    lastDate: null,
  };

  const client = supabase();
  if (!client) {
    return { ...empty, error: "Supabase is not configured, so the mock inventory is in use." };
  }

  const counted = await client.from(table).select("*", { count: "exact", head: true });
  if (counted.error) {
    return { ...empty, error: `Could not read ${table}: ${counted.error.message}` };
  }
  const rowsTotal = counted.count ?? null;

  const inv = await loadInventory();
  if (!inv) {
    return {
      ...empty,
      connected: true,
      rowsTotal,
      error: `Could not read rows from ${table}. Check the read policy for the anon key.`,
    };
  }

  return {
    connected: true,
    table,
    rowsTotal,
    rowsOnSale: inv.rowsRead,
    flights: inv.legs,
    datesCovered: inv.byDate.size,
    firstDate: inv.firstDate,
    lastDate: inv.lastDate,
    error:
      inv.legs > 0
        ? undefined
        : rowsTotal === 0
          ? `${table} exists but is empty. Import the export in the Supabase table editor.`
          : `${rowsTotal} rows in ${table}, but none are on sale: the loader keeps rows between the catalog's airports with a status starting with KK, dated today or later.`,
  };
}

/* ===================== flightdays.ts ===================== */

/**
 * Flight-only availability, for tours whose ground half is not wired up yet.
 *
 * A Fly 'n' Drive needs one leg; a Spend the Day needs two. This module
 * answers "which days work for this party" and "what flies that day" using
 * nothing but the flight inventory, so a tour can go on sale the moment its
 * route appears in the sync, and the rest of the product can be attached
 * later without touching the calendar.
 */







export type LegNeed = { from: string; to: string };

function monthDatesFD(year: number, month: number): string[] {
  const today = todayVancouver();
  const mm = String(month).padStart(2, "0");
  const count = new Date(year, month, 0).getDate();
  const dates: string[] = [];
  for (let d = 1; d <= count; d++) {
    const date = `${year}-${mm}-${String(d).padStart(2, "0")}`;
    if (date >= today) dates.push(date);
  }
  return dates;
}

/** The legs of one date that can actually carry this party, in time order. */
export async function dayFlightLegs(
  date: string,
  pax: Pax,
  out?: LegNeed,
  back?: LegNeed
): Promise<{ out: FlightLeg[]; back: FlightLeg[] }> {
  const [o, b] = await Promise.all([
    out ? flightsForPair(date, out.from, out.to) : Promise.resolve([]),
    back ? flightsForPair(date, back.from, back.to) : Promise.resolve([]),
  ]);
  return {
    out: o.filter((l) => legFits(l, pax)),
    back: b.filter((l) => legFits(l, pax)),
  };
}

/**
 * One square per day: bookable when every required leg has a flight that fits
 * the party, priced at the cheapest workable combination. The inventory is a
 * single cached read, so a month costs memory work, not table reads.
 */
export async function flightDaysMonth(
  year: number,
  month: number,
  pax: Pax,
  out?: LegNeed,
  back?: LegNeed
): Promise<{ days: Record<string, DayOffer>; routeOnFeed: boolean }> {
  const days: Record<string, DayOffer> = {};
  const dates = monthDatesFD(year, month);

  const chunk = 8;
  for (let i = 0; i < dates.length; i += chunk) {
    await Promise.all(
      dates.slice(i, i + chunk).map(async (date) => {
        const legs = await dayFlightLegs(date, pax, out, back);
        const needOut = Boolean(out);
        const needBack = Boolean(back);
        const okOut = !needOut || legs.out.length > 0;
        const okBack = !needBack || legs.back.length > 0;
        if (!okOut || !okBack) {
          days[date] = { ok: false, fromCents: null };
          return;
        }
        let cents = 0;
        if (needOut) {
          const c = cheapestLegCents(legs.out, pax);
          if (c === null) {
            days[date] = { ok: false, fromCents: null };
            return;
          }
          cents += c;
        }
        if (needBack) {
          const c = cheapestLegCents(legs.back, pax);
          if (c === null) {
            days[date] = { ok: false, fromCents: null };
            return;
          }
          cents += c;
        }
        days[date] = { ok: true, fromCents: cents };
      })
    );
  }

  // An all-empty month reads very differently when the route has never been
  // synced at all; the caller can say "not connected yet" instead of "sold out".
  let routeOnFeed = true;
  if (!Object.values(days).some((d) => d.ok)) {
    const counts = await Promise.all([
      out ? pairLegCount(out.from, out.to) : Promise.resolve(1),
      back ? pairLegCount(back.from, back.to) : Promise.resolve(1),
    ]);
    routeOnFeed = counts.every((n) => n > 0);
  }

  return { days, routeOnFeed };
}

/* ===================== catalog.ts ===================== */

/**
 * The shelf.
 *
 * Five tours, one file. The home page grid, the plan bar and every tour page
 * read from here; adding a tour is adding an entry, not redesigning a site.
 *
 * Three kinds of booking today:
 *   - "whale-day": the full machine, flights paired with the boat.
 *   - "flights": priced off the flight feed, presented as the tour's price.
 *     The ground half (coach, ferry, gardens, shuttle) is listed in `ground`
 *     as what the tour includes; its data joins the price later without the
 *     page changing. A tour that runs both ways ships `variants`, and the
 *     flow renders a direction toggle.
 *   - "manual": no feed applies; the page says booking is arranged directly.
 *
 * Copy and sample itineraries follow harbourair.com. Times in `hours` are the
 * published sample day; the booking flow itself always shows live times.
 */


export type TourHour = {
  time: string;
  title: string;
  body: string;
};

/** One way a tour can run: which legs are flown, under what name. */
export type FlightVariant = { label: string; out?: LegNeed; back?: LegNeed };

export type BookingSpec =
  | { kind: "whale-day" }
  | { kind: "flights"; variants: FlightVariant[]; ground: string[] }
  /**
   * No feed applies yet: the flight is a scenic loop out of one dock, not a
   * pair in the schedule export. The page shows the day and says booking is
   * arranged with us, rather than drawing a calendar it cannot back.
   */
  | { kind: "manual"; notes: string[] };

export type Tour = {
  slug: string;
  route: string;
  title: string;
  durationChip: string;
  image: string;
  blurb: string;
  tags: string[];
  facts: { label: string; value: string }[];
  hours: TourHour[];
  /** A line under the itinerary rail, when the day has a caveat worth saying. */
  hoursNote?: string;
  booking: BookingSpec;
};

/**
 * A headline reads better broken where it is already punctuated: each
 * sentence takes its own line, so "Whales for lunch. Home for dinner." lands
 * as two lines instead of wrapping wherever the column happens to end.
 * Titles that are a single sentence come back untouched.
 */
export function titleLines(title: string): string[] {
  const parts = title.match(/[^.!?]+[.!?]+/g);
  if (!parts || parts.length < 2) return [title];
  return parts.map((s) => s.trim());
}

const hours = (rows: [string, string, string][]): TourHour[] =>
  rows.map(([time, title, body]) => ({ time, title, body }));

export const TOURS: Tour[] = [
  {
    slug: "whales-for-lunch",
    route: "Vancouver to Victoria and back",
    title: "Whales for lunch. Home for dinner.",
    durationChip: "Full day, about 13 hours",
    image:
      "https://loved-serenity-e0ed39558b.media.strapiapp.com/Victoria_Whale_Watching_W_4d01395347.webp",
    blurb:
      "Fly out of Vancouver Harbour, spend three full hours with the whales on the Salish Sea, and fly back the same evening. One booking covers the seaplane out, the boat, and the seaplane home.",
    tags: ["Seaplane both ways", "3 hrs on the water", "All ages boat"],
    facts: [
      { label: "The shape of it", value: "Fly, whales, fly home." },
      { label: "Leaves from", value: "Vancouver Harbour, downtown" },
    ],
    hours: hours([
      ["7:50 am", "Check in downtown.", "Arrive for tour check-in at Harbour Air's downtown Vancouver terminal."],
      ["8:30 am", "Wheels up.", "Meet your pilot and depart on a scenic 35 minute flight to Victoria."],
      ["9:30 am", "Meet the boat crew.", "Check in at Orca Spirit Adventures, on the dock next to our Victoria terminal."],
      ["10:00 am", "Out with the whales.", "Embark on a three hour whale watching tour by boat."],
      ["1:00 pm", "Victoria, yours.", "Free time exploring downtown Victoria. Ask us for recommendations."],
      ["4:30 pm", "Fly to Vancouver.", "Return to the Harbour Air terminal to check in for your flight to Vancouver."],
    ]),
    hoursNote:
      "A sample day. Your own times come from the flights and sailing you pick above.",
    booking: { kind: "whale-day" },
  },
  {
    slug: "victoria-fly-n-drive",
    route: "Vancouver to Victoria, home by ferry",
    title: "Victoria Fly 'n' Drive.",
    durationChip: "Full day, fly out, ferry home",
    image:
      "https://loved-serenity-e0ed39558b.media.strapiapp.com/victoria_fly_n_drive_d0a0d24af8.webp",
    blurb:
      "The complete coastal experience: city, mountain and island views on the flight out of downtown Vancouver, a day in the historic capital at your own pace, then home by coach aboard BC Ferries. Runs in either direction; pick yours below.",
    tags: ["One flight, one ferry", "Set your own pace"],
    facts: [
      { label: "The shape of it", value: "Fly there, coach and ferry home." },
      { label: "Leaves from", value: "Vancouver Harbour, downtown" },
    ],
    hours: hours([
      ["8:50 am", "Check in downtown.", "Arrive for tour check-in at Harbour Air's downtown Vancouver terminal."],
      ["9:30 am", "Wheels up.", "Meet your pilot and depart on a scenic 35 minute flight to Victoria."],
      ["10:15 am", "The capital, yours.", "Spend the day exploring BC's beautiful capital city. Ask us for recommendations."],
      ["3:15 pm", "To the bus depot.", "Arrive at the Capital City Station bus depot to check in for your coach."],
      ["3:45 pm", "Coach and ferry.", "Board the BC Ferries Connector to Swartz Bay for the 5:00 pm sailing."],
      ["7:40 pm", "Home.", "Arrive back in downtown Vancouver."],
    ]),
    hoursNote: "A sample day departing downtown Vancouver. Times vary by season.",
    booking: {
      kind: "flights",
      variants: [
        { label: "Fly out, ferry home", out: { from: "CXH", to: "YWH" } },
        { label: "Ferry out, fly home", back: { from: "YWH", to: "CXH" } },
      ],
      ground: ["Coach and BC Ferries between Victoria and Vancouver is part of the tour."],
    },
  },
  {
    slug: "spend-the-day-in-victoria",
    route: "Vancouver to Victoria and back",
    title: "Spend the day in Victoria.",
    durationChip: "Full day in the capital",
    image:
      "https://loved-serenity-e0ed39558b.media.strapiapp.com/tour_featured_tour_vid_day_b3764e7815.webp",
    blurb:
      "Two scenic flights and a day built your way. Land steps from Victoria's downtown core, stroll the Inner Harbour, then ride the shuttle out to The Butchart Gardens, the world famous 55 acre floral display and National Historic Site, included in your ticket.",
    tags: ["Butchart Gardens included", "Seaplane both ways"],
    facts: [
      { label: "The shape of it", value: "Two flights, Butchart Gardens included." },
      { label: "Leaves from", value: "Vancouver Harbour, downtown" },
    ],
    hours: hours([
      ["7:50 am", "Check in downtown.", "Arrive for tour check-in at Harbour Air's downtown Vancouver terminal."],
      ["8:30 am", "Wheels up.", "Meet your pilot and depart on a scenic flight to Victoria."],
      ["9:00 am", "Land in the harbour.", "Proceed to the terminal for instructions on the shuttle location."],
      ["10:00 am", "Shuttle to the Gardens.", "Depart for The Butchart Gardens; arrive 10:45 am."],
      ["1:00 pm", "Back downtown.", "Shuttle returns; arrive in downtown Victoria 1:45 pm and take time to explore."],
      ["5:20 pm", "Check in for home.", "Return to the Victoria Harbour Air terminal for your flight."],
      ["6:00 pm", "Fly to Vancouver.", "Depart on your return flight to Vancouver Harbour."],
    ]),
    hoursNote: "A sample day. Flight times are subject to availability and season.",
    booking: {
      kind: "flights",
      variants: [{ label: "", out: { from: "CXH", to: "YWH" }, back: { from: "YWH", to: "CXH" } }],
      ground: ["Butchart Gardens entry and the shuttle are part of the tour."],
    },
  },
  {
    slug: "spend-the-day-in-whistler",
    route: "Vancouver to Whistler and back",
    title: "Spend the day in Whistler.",
    durationChip: "Full day in the mountains",
    image:
      "https://loved-serenity-e0ed39558b.media.strapiapp.com/1_Whistler_207c2e8f54.webp",
    blurb:
      "Depart from the heart of Vancouver, soar over the Coast Mountains and land on Whistler's Green Lake. Discover the village, hike the alpine, golf, bike, shop or just relax. Shuttle transfer between the Green Lake seaplane base and Whistler Village is included.",
    tags: ["Green Lake landing", "Village shuttle included"],
    facts: [
      { label: "The shape of it", value: "Two flights, shuttle to the village included." },
      { label: "Leaves from", value: "Vancouver Harbour, downtown" },
    ],
    hours: hours([
      ["8:20 am", "Check in downtown.", "Arrive for tour check-in at Harbour Air's downtown Vancouver terminal."],
      ["9:00 am", "Wheels up.", "Meet your pilot and depart on a scenic 45 minute flight to Green Lake."],
      ["10:00 am", "Into the village.", "Take our complimentary shuttle into Whistler Village and spend the day exploring."],
      ["5:10 pm", "Back to the lake.", "Meet the shuttle at the Visitor Centre to return to the Green Lake seaplane base."],
      ["6:00 pm", "Fly to Vancouver.", "Depart on your return flight to Vancouver."],
    ]),
    hoursNote: "A sample day. Departure times vary by season.",
    booking: {
      kind: "flights",
      variants: [{ label: "", out: { from: "CXH", to: "GLK" }, back: { from: "GLK", to: "CXH" } }],
      ground: ["The shuttle between Green Lake and Whistler Village is part of the tour."],
    },
  },
  {
    slug: "whistler-fly-n-drive",
    route: "Vancouver to Whistler, home by coach",
    title: "Whistler Fly 'n' Drive.",
    durationChip: "Full day, fly out, coach home",
    image:
      "https://loved-serenity-e0ed39558b.media.strapiapp.com/menu_tour_whistler_1c664d8cb2.webp",
    blurb:
      "Fly from Vancouver Harbour over peaks, valleys and glaciers to Whistler's Green Lake, spend the day in the village, then ride a fully narrated mini coach down the Sea to Sky Highway with a stop at Shannon Falls. Runs in either direction; pick yours below.",
    tags: ["Sea to Sky views", "Shannon Falls stop"],
    facts: [
      { label: "The shape of it", value: "Fly there, coach home down the Sea to Sky." },
      { label: "Leaves from", value: "Vancouver Harbour, downtown" },
    ],
    hours: hours([
      ["10:00 am", "Wheels up.", "Flight from Vancouver Harbour to Whistler's Green Lake."],
      ["10:45 am", "Into the village.", "Arrive in Whistler, then take the courtesy shuttle to the village."],
      ["3:45 pm", "Coach home.", "Pick up at the Gateway Taxi Loop by Westcoast Sightseeing, with a stop at Shannon Falls."],
      ["6:30 pm", "Home.", "Arrive in downtown Vancouver."],
    ]),
    hoursNote:
      "A sample day. The reverse runs coach up with a Sea to Sky Gondola stop, then a 6:00 pm flight home.",
    booking: {
      kind: "flights",
      variants: [
        { label: "Fly out, coach home", out: { from: "CXH", to: "GLK" } },
        { label: "Coach out, fly home", back: { from: "GLK", to: "CXH" } },
      ],
      ground: [
        "The narrated coach along the Sea to Sky, with the Shannon Falls stop, is part of the tour.",
      ],
    },
  },
  {
    slug: "spend-the-day-on-salt-spring",
    route: "Vancouver to Salt Spring Island and back",
    title: "Spend the day on Salt Spring Island.",
    durationChip: "Full day on the island",
    image:
      "https://loved-serenity-e0ed39558b.media.strapiapp.com/Untitled_786_x_380_px_2_216cf27b9c.webp",
    blurb:
      "Leave the car and the traffic behind. Fly from downtown Vancouver to Salt Spring and explore at your own pace, or book a local guide for a deeper dive into the island's natural beauty, arts scene and local charm: artisan studios, working farms, scenic trails, cozy cafes, even a cheesemaker or a vineyard.",
    tags: ["Seaplane both ways", "Studios, farms, trails"],
    facts: [
      { label: "The shape of it", value: "Two flights, the island at your pace." },
      { label: "Leaves from", value: "Vancouver Harbour, downtown" },
    ],
    hours: hours([
      ["8:35 am", "Check in downtown.", "Arrive for tour check-in at Harbour Air's downtown Vancouver terminal."],
      ["9:15 am", "Wheels up.", "Meet your pilot and depart on a scenic flight to Salt Spring Island."],
      ["9:50 am", "The island, yours.", "Arrive on Salt Spring and explore at your leisure. Ask us for ideas."],
      ["5:35 pm", "Check in for home.", "Arrive for departure check-in at the Salt Spring Island terminal."],
      ["6:15 pm", "Fly to Vancouver.", "Depart on a scenic flight to downtown Vancouver; land 6:50 pm."],
    ]),
    hoursNote:
      "A sample day. Alternate departures are available; flight times are subject to availability.",
    booking: {
      kind: "flights",
      variants: [{ label: "", out: { from: "CXH", to: "GNG" }, back: { from: "GNG", to: "CXH" } }],
      ground: ["Want a local guide for the day? Just ask when you book."],
    },
  },
  {
    slug: "vancouver-planes-and-parks",
    route: "Vancouver, sky and rainforest",
    title: "Vancouver planes and parks.",
    durationChip: "Most of a day, city and canyon",
    image:
      "https://loved-serenity-e0ed39558b.media.strapiapp.com/Capilano_Suspension_Bridge_with_Sunrise_1_ece9fb2cb0.webp",
    blurb:
      "A local favourite: the Vancouver Classic Panorama seaplane tour paired with Capilano Suspension Bridge Park. Lift off from Coal Harbour for aerial views of the downtown skyline, Stanley Park, English Bay, the Lions Gate Bridge and the North Shore Mountains, then ride the shuttle to the famous swinging bridge over Capilano Canyon and wander the rainforest for as long as you like.",
    tags: ["20 min panorama flight", "Capilano bridge entry"],
    facts: [
      { label: "The shape of it", value: "A panorama flight, then Capilano by shuttle." },
      { label: "Leaves from", value: "Vancouver Harbour, downtown" },
    ],
    hours: hours([
      ["9:50 am", "Check in downtown.", "Arrive for tour check-in at Harbour Air's downtown Vancouver terminal."],
      ["10:30 am", "Lift off.", "Meet your pilot and depart on a scenic 20 minute panorama tour over the city."],
      ["11:30 am", "Shuttle at Canada Place.", "Board the shuttle to the North Shore."],
      ["12:00 pm", "Capilano, yours.", "Explore the suspension bridge park for a duration of your choosing."],
      ["4:30 pm", "Shuttle home.", "Return to downtown Vancouver. Frequent return shuttles run all afternoon."],
    ]),
    hoursNote:
      "A sample day; times vary by season. Ask us about staying longer in the park.",
    booking: {
      kind: "manual",
      notes: [
        "We book this day with you directly: one call or message covers the whole thing.",
        "Two flight fares to choose from, scenicTOUR or scenicULTIMATE.",
        "Capilano Suspension Bridge Park entry and the round trip shuttle are part of the tour.",
      ],
    },
  },
];

export function findTour(slug: string): Tour | undefined {
  return TOURS.find((t) => t.slug === slug);
}

/* ===================== combos.ts ===================== */

export function buffers(extraBefore: boolean, extraAfter: boolean) {
  const base = minConnectionMinutes();
  const extra = extraTimeMinutes();
  return {
    before: extraBefore ? extra : base,
    after: extraAfter ? extra : base,
  };
}

export function pairFlights(
  tour: TourSlot,
  out: FlightLeg[],
  back: FlightLeg[],
  pax: Pax,
  extraBefore: boolean,
  extraAfter: boolean
): { outbound: FlightLeg[]; returns: FlightLeg[] } {
  const b = buffers(extraBefore, extraAfter);
  // A flight fits when it can carry THIS party: enough seats on sale AND
  // enough payload for the party's standard weights. A plane with chairs free
  // and no pounds left is full; lib/party.ts owns both ceilings.
  const fits = (f: FlightLeg) => legFits(f, pax);
  const outbound = out.filter(
    (f) => fits(f) && minutesBetween(f.arr, tour.start) >= b.before
  );
  const returns = back.filter(
    (f) => fits(f) && minutesBetween(tour.end, f.dep) >= b.after
  );
  return { outbound, returns };
}

export async function dayCombos(
  date: string,
  pax: Pax,
  extraBefore: boolean,
  extraAfter: boolean
): Promise<DayCombos> {
  const boats = eligibleBoats(pax);
  const size = partySize(pax);
  const [{ out, back }, tours] = await Promise.all([
    flightsForDate(date),
    tourAvailabilities(date, boats),
  ]);

  const withFlights: TourWithFlights[] = [];
  for (const t of tours) {
    if (!t.seatsUnknown && t.seatsLeft < size) continue;
    const { outbound, returns } = pairFlights(t, out, back, pax, extraBefore, extraAfter);
    if (outbound.length === 0 || returns.length === 0) continue;
    withFlights.push({ ...t, outbound, returns });
  }
  withFlights.sort((a, b) => a.start.localeCompare(b.start) || a.boat.localeCompare(b.boat));

  return { date, eligibleBoats: boats, tours: withFlights };
}

/** Whether a day can be booked, and what it starts at. */
export async function dayOffer(
  date: string,
  pax: Pax,
  extraBefore: boolean,
  extraAfter: boolean
): Promise<DayOffer> {
  const boats = eligibleBoats(pax);
  const size = partySize(pax);
  const [{ out, back }, tours] = await Promise.all([
    flightsForDate(date),
    tourAvailabilities(date, boats, { light: true }),
  ]);

  let ok = false;
  let cheapest: number | null = null;
  for (const t of tours) {
    if (!t.seatsUnknown && t.seatsLeft < size) continue;
    const { outbound, returns } = pairFlights(t, out, back, pax, extraBefore, extraAfter);
    if (outbound.length === 0 || returns.length === 0) continue;
    ok = true;
    const price = bestPriceFor(t, outbound, returns, pax);
    if (price !== null && (cheapest === null || price < cheapest)) cheapest = price;
  }
  return { ok, fromCents: cheapest };
}

export async function dayHasCombo(
  date: string,
  pax: Pax,
  extraBefore: boolean,
  extraAfter: boolean
): Promise<boolean> {
  return (await dayOffer(date, pax, extraBefore, extraAfter)).ok;
}

/**
 * One square in the calendar: can the day be booked, and the lowest price it
 * can be booked at. `fromCents` is the cheapest workable pairing, not the
 * cheapest seat in isolation, so a day never quotes a price it cannot sell.
 */
export type DayOffer = {
  ok: boolean;
  fromCents: number | null;
};

const NO_OFFER: DayOffer = { ok: false, fromCents: null };

/**
 * The lowest all-in price for a day, across every workable pairing.
 *
 * Flights are priced for this exact party from the cheapest open fare bucket
 * up, and the boat comes from the operator's own price preview. A day whose
 * boat price could not be read returns null rather than a flights-only figure
 * dressed up as a total: the square then shows as bookable with no price,
 * which is honest, where "$540" for a day that costs $1,100 would not be.
 */
function bestPriceFor(
  tour: TourSlot,
  outbound: FlightLeg[],
  returns: FlightLeg[],
  pax: Pax
): number | null {
  const out = cheapestLegCents(outbound, pax);
  const back = cheapestLegCents(returns, pax);
  if (out === null || back === null) return null;
  // A zero adult fare means the price preview failed for that item and date,
  // not a free boat ride.
  if (priceMode() === "public" && tour.priceAdultCents <= 0) return null;
  return out + back + boatAllInCents(tour, pax);
}

export type MonthAvailability = {
  days: Record<string, DayOffer>;
  /** When every product is out of season, when the operator sails again. */
  nextBookableAt?: string | null;
  /** Days the feed collapsed; their departures could not be read. */
  groupedDays?: string[];
  /**
   * Why nothing is bookable, when nothing is. A month of crossed-out squares
   * has several very different causes and the visitor deserves the real one.
   */
  blocked?: {
    reason: "out_of_season" | "no_flights" | "no_outbound" | "no_return";
    /** Sailings that existed but could not be paired. */
    sailings: number;
    /** The latest return departure the flight data knows about, if any. */
    lastReturn?: string | null;
    /** The earliest sailing end that needs a return after it. */
    earliestBoatEnd?: string | null;
  };
};

/**
 * Which days of a month have at least one workable flight/boat pairing.
 *
 * On the public feed the times cost **two requests for the whole grid**, one
 * month calendar per boat, because that endpoint returns every departure in
 * the month. Prices add one request per boat per date, roughly 60 for an
 * August, pooled and cached for an hour, which is what lets every square
 * quote a real total. Seat counts are still not fetched: those are one
 * request per departure (~350 in August) and are read when a day is opened.
 *
 * The partner-API and demo paths still walk day by day, which is what they have
 * always done.
 */
export async function monthAvailability(
  year: number,
  month: number,
  pax: Pax,
  extraBefore: boolean,
  extraAfter: boolean,
  fromDate: string
): Promise<MonthAvailability> {
  const dates = monthDates(year, month, fromDate);
  if (dates.length === 0) return { days: {} };

  if (dataSources().tours === "public") {
    return monthFromPublicFeed(year, month, dates, pax, extraBefore, extraAfter);
  }
  return { days: await monthDayByDay(dates, pax, extraBefore, extraAfter) };
}

function monthDates(year: number, month: number, fromDate: string): string[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (date >= fromDate) dates.push(date);
  }
  return dates;
}

async function monthFromPublicFeed(
  year: number,
  month: number,
  dates: string[],
  pax: Pax,
  extraBefore: boolean,
  extraAfter: boolean
): Promise<MonthAvailability> {
  const boats = eligibleBoats(pax);
  const size = partySize(pax);

  // Prices are worth their cost here: one request per item per date, pooled
  // and cached for an hour, against a calendar that quotes real money in
  // every square.
  const feed = await publicMonthSlots(year, month, boats, { withPrices: true });
  if (feed.errors.length > 0 && feed.byDate.size === 0) {
    throw new Error(feed.errors[0]);
  }

  const days: Record<string, DayOffer> = {};

  // Tallies so an empty month can explain itself instead of just going grey.
  let sailings = 0;
  let anyOutbound = 0;
  let anyReturn = 0;
  let flightsSeen = 0;
  let lastReturn: string | null = null;
  let earliestBoatEnd: string | null = null;

  await Promise.all(
    dates.map(async (date) => {
      const tours = feed.byDate.get(date) ?? [];
      if (tours.length === 0) {
        days[date] = NO_OFFER;
        return;
      }
      const { out, back } = await flightsForDate(date);
      flightsSeen += out.length + back.length;
      for (const f of back) {
        if (lastReturn === null || f.dep > lastReturn) lastReturn = f.dep;
      }

      let ok = false;
      let cheapest: number | null = null;
      for (const t of tours) {
        sailings++;
        if (earliestBoatEnd === null || t.end < earliestBoatEnd) earliestBoatEnd = t.end;
        // seatsUnknown is expected here: the grid never fetches seat counts,
        // because that is one request per departure. So a party too large for
        // every boat cannot be detected at this level and is not one of the
        // reasons below. It is caught when the guest opens a day, where
        // dayCombos does read real seats.
        if (!t.seatsUnknown && t.seatsLeft < size) continue;
        const { outbound, returns } = pairFlights(t, out, back, pax, extraBefore, extraAfter);
        if (outbound.length > 0) anyOutbound++;
        if (returns.length > 0) anyReturn++;
        if (outbound.length === 0 || returns.length === 0) continue;
        ok = true;
        const price = bestPriceFor(t, outbound, returns, pax);
        if (price !== null && (cheapest === null || price < cheapest)) cheapest = price;
      }
      days[date] = { ok, fromCents: cheapest };
    })
  );

  const result: MonthAvailability = {
    days,
    nextBookableAt: feed.nextBookableAt,
    groupedDays: feed.groupedDays,
  };

  if (!Object.values(days).some((d) => d.ok)) {
    result.blocked = {
      reason:
        sailings === 0
          ? "out_of_season"
          : flightsSeen === 0
            ? "no_flights"
            : anyOutbound === 0
              ? "no_outbound"
              : anyReturn === 0
                ? "no_return"
                : "no_flights",
      sailings,
      lastReturn,
      earliestBoatEnd,
    };
  }

  return result;
}

async function monthDayByDay(
  dates: string[],
  pax: Pax,
  extraBefore: boolean,
  extraAfter: boolean
): Promise<Record<string, DayOffer>> {
  const result: Record<string, DayOffer> = {};
  const errors: Error[] = [];
  const CONCURRENCY = 6;
  for (let i = 0; i < dates.length; i += CONCURRENCY) {
    const chunk = dates.slice(i, i + CONCURRENCY);
    const flags = await Promise.all(
      chunk.map((date) =>
        dayOffer(date, pax, extraBefore, extraAfter).catch((err) => {
          errors.push(err instanceof Error ? err : new Error(String(err)));
          return NO_OFFER;
        })
      )
    );
    chunk.forEach((date, idx) => {
      result[date] = flags[idx];
    });
  }
  if (dates.length > 0 && errors.length >= dates.length) {
    throw errors[0];
  }
  return result;
}

/* ===================== fonts.ts ===================== */

/**
 * One typeface, everywhere: Nunito.
 *
 * Display and body are the same family at different weights, which is what
 * keeps the interface feeling like one voice. The rounded terminals do the
 * work the brand's own Bricolage Grotesque does in print: friendly, West
 * Coast, not a corporate grotesque.
 */
export type FontPreset = {
  name: string;
  googleHref: string;
  display: string;
  body: string;
  displayWeight: string;
  displayTracking: string;
};

const STACK_SANS = "system-ui, -apple-system, Segoe UI, Helvetica, sans-serif";

export const NUNITO: FontPreset = {
  name: "nunito",
  googleHref:
    "https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap",
  display: `Nunito, ${STACK_SANS}`,
  body: `Nunito, ${STACK_SANS}`,
  displayWeight: "800",
  displayTracking: "-0.02em",
};

export function activePreset(): FontPreset {
  return NUNITO;
}
