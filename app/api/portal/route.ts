// app/api/portal/route.ts — все 7 API-эндпоинтов портала в одном файле (диспетчер по ?__route=, см. rewrites в next.config.mjs)
import { NextRequest, NextResponse } from "next/server";
import { FH_DEFAULTS, STANDARD_WEIGHT_LBS, clearFlightCache, dataSources, dayCombos, dayFlightLegs, demoDataAllowed, extraTimeMinutes, fareharborBase, fhItemPks, fhShortname, flightDaysMonth, flightStats, flightsForDate, fmtMoney, legPriceCents, minConnectionMinutes, minutesBetween, monthAvailability, monthCalendarUrl, paxFromParams, pricePreviewUrl, seatsOpenFor, todayVancouver, tourAvailabilities } from "@/lib/core";
import type { BoatType, FlightLeg, LegNeed, Pax } from "@/lib/core";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const HANDLERS: Record<string, (req: NextRequest) => Promise<Response>> = {
  "availability": (req) => GET_availability(req),
  "calendar": (req) => GET_calendar(req),
  "combos": (req) => GET_combos(req),
  "flight-days": (req) => GET_flight_days(req),
  "flight-legs": (req) => GET_flight_legs(req),
  "flights": (req) => GET_flights(req),
  "status": () => GET_status(),
};

export async function GET(req: NextRequest) {
  // При rewrite nextUrl сохраняет исходный путь (/api/status и т.п.) — берём маршрут из него;
  // прямое обращение к /api/portal?__route=... тоже работает.
  const fromPath = req.nextUrl.pathname.replace(/^\/api\//, "").replace(/\/+$/, "");
  const key = fromPath !== "portal" ? fromPath : req.nextUrl.searchParams.get("__route") || "";
  const h = HANDLERS[key];
  if (!h) return Response.json({ error: "not found", debug: { url: req.url, pathname: req.nextUrl.pathname, search: req.nextUrl.search } }, { status: 404 });
  return h(req);
}

/* ===================== /api/availability ===================== */
async function GET_availability(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const date = sp.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date required as YYYY-MM-DD, for example /api/availability?date=2026-08-15" },
      { status: 400 }
    );
  }
  const boatParam = sp.get("boat");
  const boats: BoatType[] =
    boatParam === "open" || boatParam === "semi_covered"
      ? [boatParam]
      : ["semi_covered", "open"];

  const source = dataSources().tours;
  const itemPks = {
    semi_covered: fhItemPks("semi_covered", date),
    open: fhItemPks("open", date),
  };
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));

  const meta = {
    date,
    source,
    shortname: fhShortname(),
    apiBase:
      source === "fareharbor"
        ? fareharborBase()
        : source === "public"
          ? "https://fareharbor.com/api/v1 (public, no keys)"
          : "no live connection",
    items: itemPks,
    // The exact upstream URLs behind this response, so a failure can be
    // reproduced in a browser in one click.
    upstream:
      source === "public"
        ? [...itemPks.semi_covered, ...itemPks.open].flatMap((pk) => [
            monthCalendarUrl(pk, year, month),
            pricePreviewUrl(pk, date),
          ])
        : undefined,
  };

  if (source === "unconfigured") {
    return NextResponse.json(
      {
        ...meta,
        error: "Availability is switched off (FAREHARBOR_PUBLIC_FALLBACK=0 and no keys).",
        hint: "Unset FAREHARBOR_PUBLIC_FALLBACK to read the operator's public feed with no keys at all, or set FAREHARBOR_USER_KEY plus FAREHARBOR_APP_KEY for the partner API, or DEMO_MODE=1 for sample data.",
      },
      { status: 503 }
    );
  }

  try {
    const tours = await tourAvailabilities(date, boats);
    return NextResponse.json(
      { ...meta, count: tours.length, tours },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "availability lookup failed";

    let hint =
      "FareHarbor rejected the request. Check the response body above for the reason.";
    if (/key-missing/.test(message) || /API-App header/i.test(message)) {
      hint =
        "FareHarbor requires BOTH keys. Your dashboard Reseller Key is the User Key; the App Key identifies the calling application and is issued separately. Request it from api-support@fareharbor.com, then set FAREHARBOR_APP_KEY and redeploy.";
    } else if (/app-key-invalid|app-invalid/.test(message)) {
      hint =
        "The App Key was rejected. Confirm you are using the production key with the production API base, and that it has not been rotated.";
    } else if (/user-key-invalid/.test(message)) {
      hint =
        "The User Key was rejected. Re-copy the Key field from your Reseller Key in the FareHarbor dashboard, with no stray spaces.";
    } else if (/company-shortname-invalid/.test(message) || /\b404\b/.test(message)) {
      hint =
        "The shortname or item pk was not found on this API base. Sandbox keys only see demo companies such as the Dolphin Tours sandbox, so real Orca Spirit inventory needs production keys with FAREHARBOR_API_BASE unset.";
    } else if (/\b40[13]\b/.test(message)) {
      hint =
        "Authentication or permission failure. Confirm the keys are production keys and that the operator has approved your API access.";
    }
    return NextResponse.json({ ...meta, error: message, hint }, { status: 502 });
  }
}

/* ===================== /api/calendar ===================== */
async function GET_calendar(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const year = Number(sp.get("year"));
  const month = Number(sp.get("month"));
  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: "year and month required" }, { status: 400 });
  }
  const pax = paxFromParams(sp);
  const extraBefore = sp.get("extraBefore") === "1";
  const extraAfter = sp.get("extraAfter") === "1";

  try {
    const result = await monthAvailability(
      year,
      month,
      pax,
      extraBefore,
      extraAfter,
      todayVancouver()
    );

    return NextResponse.json(
      {
        days: result.days,
        nextBookableAt: result.nextBookableAt ?? null,
        groupedDays: result.groupedDays ?? [],
        blocked: result.blocked ?? null,
        sources: dataSources(),
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "calendar lookup failed",
        sources: dataSources(),
      },
      { status: 502 }
    );
  }
}

/* ===================== /api/combos ===================== */
async function GET_combos(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const date = sp.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date required as YYYY-MM-DD" }, { status: 400 });
  }
  const pax = paxFromParams(sp);
  const extraBefore = sp.get("extraBefore") === "1";
  const extraAfter = sp.get("extraAfter") === "1";

  try {
    const combos = await dayCombos(date, pax, extraBefore, extraAfter);
    return NextResponse.json(
      { ...combos, sources: dataSources() },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "availability lookup failed" },
      { status: 502 }
    );
  }
}

/* ===================== /api/flight-days ===================== */
function parseLeg(v: string | null): LegNeed | undefined {
  if (!v) return undefined;
  const m = /^([A-Z]{3}):([A-Z]{3})$/.exec(v);
  if (!m) return undefined;
  return { from: m[1], to: m[2] };
}

/**
 * GET /api/flight-days?year&month&out=CXH:GLK&back=GLK:CXH&males=2...
 *
 * The flights-only calendar. `out` and `back` are code pairs; either may be
 * omitted for one-way products. Same DayOffer shape as /api/calendar, so the
 * client calendar does not care which product it is drawing.
 */
async function GET_flight_days(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const year = Number(sp.get("year"));
  const month = Number(sp.get("month"));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "year and month required" }, { status: 400 });
  }
  const out = parseLeg(sp.get("out"));
  const back = parseLeg(sp.get("back"));
  if (!out && !back) {
    return NextResponse.json({ error: "out or back pair required, e.g. out=CXH:GLK" }, { status: 400 });
  }
  const pax = paxFromParams(sp);

  try {
    const { days, routeOnFeed } = await flightDaysMonth(year, month, pax, out, back);
    return NextResponse.json({ days, routeOnFeed });
  } catch {
    return NextResponse.json({ error: "could not read the flight feed" }, { status: 502 });
  }
}

/* ===================== /api/flight-legs ===================== */
function parseLegFL(v: string | null): LegNeed | undefined {
  if (!v) return undefined;
  const m = /^([A-Z]{3}):([A-Z]{3})$/.exec(v);
  if (!m) return undefined;
  return { from: m[1], to: m[2] };
}

/** GET /api/flight-legs?date&out=CXH:GLK&back=GLK:CXH&males=2... */
async function GET_flight_legs(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const date = sp.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date required as YYYY-MM-DD" }, { status: 400 });
  }
  const out = parseLegFL(sp.get("out"));
  const back = parseLegFL(sp.get("back"));
  if (!out && !back) {
    return NextResponse.json({ error: "out or back pair required" }, { status: 400 });
  }
  const pax = paxFromParams(sp);

  try {
    const legs = await dayFlightLegs(date, pax, out, back);
    return NextResponse.json(legs);
  } catch {
    return NextResponse.json({ error: "could not read the flight feed" }, { status: 502 });
  }
}

/* ===================== /api/flights ===================== */
/**
 * GET /api/flights?date=2026-08-07
 *
 * What the site knows about the seaplane inventory, and whether it is enough
 * to sell a day. Open it in a browser after the sync lands; it answers the
 * questions you would otherwise ask a terminal:
 *
 *   - did the import land, and how many rows are actually on sale (CXH/YWH,
 *     status starting with KK, dated today or later)
 *   - per departure: seats on sale (largest fare bucket), payload remaining,
 *     and the "from" price out of the cheapest open bucket
 *   - what a standard pair (two 196 lb adults) would pay, seat by seat, so
 *     the cheapest-first ladder can be eyeballed against the export
 *
 * `?refresh=1` drops the short cache, so a fresh import shows up immediately.
 */
async function GET_flights(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || todayVancouver();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date must be YYYY-MM-DD, for example /api/flights?date=2026-08-07" },
      { status: 400 }
    );
  }
  if (url.searchParams.get("refresh") === "1") clearFlightCache();

  const sources = dataSources();
  const stats = await flightStats();
  const { out, back } = await flightsForDate(date);

  // A reference party: two adults at the standard 196 lb. The seat and
  // payload numbers below are quoted for this pair, which is the most common
  // booking and the heaviest per seat, so it can only understate availability
  // for lighter groups.
  const pair: Pax = { males: 2, females: 0, x: 0, children: 0, infants: 0, pregnant: false, senior: false };

  const describe = (f: FlightLeg) => ({
    flight: f.flightNo,
    aircraft: f.aircraft ?? null,
    status: f.status,
    dep: f.dep,
    arr: f.arr,
    seatsOnSale: f.seatsLeft,
    weightRemainingLbs: f.weightRemainingLbs,
    seatsForStandardPair: seatsOpenFor(f, pair),
    from: f.fromCents !== null ? fmtMoney(f.fromCents) : null,
    pairTotal: (() => {
      const c = legPriceCents(f, 2);
      return c !== null ? fmtMoney(c) : null;
    })(),
    fareLadder: f.fares.map((b) => `${b.seats} @ ${fmtMoney(b.priceCents)}`),
  });

  const sellable = (f: FlightLeg) => f.seatsLeft > 0;
  const bookableOut = out.filter(sellable).length;
  const bookableBack = back.filter(sellable).length;

  let verdict: string;
  if (stats.error && !stats.connected) {
    verdict = stats.error;
  } else if (stats.error) {
    verdict = stats.error;
  } else if (sources.flights === "mock") {
    verdict =
      "Using the built-in sample inventory. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "SUPABASE_KEY to read the real export instead.";
  } else if (out.length === 0 && back.length === 0) {
    verdict =
      "No flights on sale for this date. Either the sync has not covered it, " +
      "every row's status fell out of KK, or today's departures have all left.";
  } else if (out.length === 0) {
    verdict = "No Vancouver to Victoria flights on sale this date, so no day can start.";
  } else if (back.length === 0) {
    verdict = "No Victoria to Vancouver flights on sale this date, so no day can end.";
  } else {
    verdict =
      `${bookableOut} of ${out.length} outbound and ${bookableBack} of ${back.length} ` +
      `return departures have seats on sale.`;
  }

  return NextResponse.json(
    {
      date,
      source: sources.flights,
      verdict,
      // What is actually sitting in the database.
      table: stats,
      counts: { outbound: out.length, returns: back.length },
      outbound: out.map(describe),
      returns: back.map(describe),
      rules: {
        onSale: "status starts with KK; CX and everything else never loads",
        seats: "the largest open fare bucket, never the sum: buckets nest",
        price: "seats fill cheapest bucket first; sold as one product, no bucket names shown",
        weight: `party checked against weight_remaining at standard weights (lb): ${JSON.stringify(
          STANDARD_WEIGHT_LBS
        )}`,
        today: "departures earlier than the Vancouver wall clock are dropped",
      },
      notes: [
        "Times are Vancouver local, as they appear in the export.",
        "Prices include every seat-holder; infants ride on a lap, free.",
        `Wait test for a 10:00 sailing on this date: ${out
          .filter((f) => minutesBetween(f.arr, "10:00") >= 60)
          .map((f) => f.dep)
          .join(", ") || "no outbound lands an hour before it"}.`,
      ],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/* ===================== /api/status ===================== */
async function GET_status() {
  const sources = dataSources();

  const env = {
    FAREHARBOR_USER_KEY: Boolean(process.env.FAREHARBOR_USER_KEY),
    FAREHARBOR_APP_KEY: Boolean(process.env.FAREHARBOR_APP_KEY),
    FAREHARBOR_WEBHOOK_KEY: Boolean(process.env.FAREHARBOR_WEBHOOK_KEY),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_KEY: Boolean(
      process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    DEMO_MODE: demoDataAllowed(),
  };

  const todo: string[] = [];
  if (sources.tours === "unconfigured") {
    todo.push(
      "Availability is off. Set FAREHARBOR_USER_KEY to your dashboard Reseller Key, then redeploy."
    );
  }
  if (sources.tours === "public") {
    todo.push(
      "Browsing the operator's public feed: real times and prices, but no seat counts and one departure per item per date, so days are sold as requests and land in /ops. Add FAREHARBOR_USER_KEY plus the App Key for instant confirmation."
    );
  }
  if (sources.tours === "mock") {
    todo.push(
      "Showing sample data because DEMO_MODE is on. Remove DEMO_MODE for production."
    );
  }
  if (env.FAREHARBOR_USER_KEY && !env.FAREHARBOR_APP_KEY) {
    todo.push(
      sources.tours === "public"
        ? "Reseller Key is set but the App Key is missing, so the certified API stays unused and the public feed is serving the site. Request the App Key from api-support@fareharbor.com to switch to instant booking."
        : "FareHarbor requires both keys and rejects requests with code key-missing when the App Key is absent. Request the App Key from api-support@fareharbor.com, or set FAREHARBOR_PUBLIC_FALLBACK=1 to run on the public feed meanwhile."
    );
  }
  if (sources.flights !== "supabase") {
    todo.push(
      "The flight inventory is the built in mock, not real Harbour Air seats. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_KEY to read the real export."
    );
  }
  if (todo.length === 0) {
    todo.push("Everything is wired.");
  }

  return NextResponse.json(
    {
      sources,
      env,
      fareharbor: {
        apiBase: fareharborBase(),
        shortname: fhShortname(),
        seasons: FH_DEFAULTS,
        itemsQueriedToday: {
          date: todayVancouver(),
          semi_covered: fhItemPks("semi_covered", todayVancouver()),
          open: fhItemPks("open", todayVancouver()),
        },
      },
      rules: {
        minConnectionMinutes: minConnectionMinutes(),
        extraTimeMinutes: extraTimeMinutes(),
      },
      mode:
        sources.tours === "unconfigured"
          ? "not connected"
          : sources.tours === "public"
            ? "public feed, availability only"
            : "keyed api, availability only",
      todo,
      checks: {
        availability: "/api/availability?date=2026-08-15",
        webhook: "/api/webhooks/fareharbor?key=YOUR_SECRET",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
