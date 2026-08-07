import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav, FromPrice, BookingFlow, FlightsFlow } from "@/components/ui";
import { findTour, titleLines, TOURS, packageDiscountPct, todayVancouver } from "@/lib/core";

type Search = Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

function slugFrom(searchParams: Search): string {
  const v = searchParams.slug;
  return (Array.isArray(v) ? v[0] : v) || "";
}

export function generateMetadata({ searchParams }: { searchParams: Search }): Metadata {
  const tour = findTour(slugFrom(searchParams));
  if (!tour) return {};
  return {
    title: `${tour.title} | Harbour Air day trips`,
    description: tour.blurb,
  };
}

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function intIn(v: string | undefined, min: number, max: number): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return undefined;
  return n;
}

/**
 * A product page inside a catalog: breadcrumb up to the shelf, the cover, the
 * facts, the published sample day, and then whichever booking flow this tour
 * runs on. The plan bar's date and party arrive in the URL and are validated
 * here, never trusted.
 */
export default function TourPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const tour = findTour(slugFrom(searchParams));
  if (!tour) notFound();

  const today = todayVancouver();
  const rawDate = one(searchParams.date);
  const initial = {
    initialDate:
      rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && rawDate >= today ? rawDate : undefined,
    initialAdults: intIn(one(searchParams.adults), 1, 8),
    initialChildren: intIn(one(searchParams.children), 0, 6),
    initialInfants: intIn(one(searchParams.infants), 0, 8),
  };

  const flightsSpec = tour.booking.kind === "flights" ? tour.booking : null;
  const manualSpec = tour.booking.kind === "manual" ? tour.booking : null;
  const first = flightsSpec?.variants[0];
  const fromParams = first
    ? [
        first.out ? `out=${first.out.from}:${first.out.to}` : "",
        first.back ? `back=${first.back.from}:${first.back.to}` : "",
      ]
        .filter(Boolean)
        .join("&")
    : "";

  if (tour.booking.kind === "whale-day") {
    return (
      <main className="bg-mist pb-32">
        <SiteNav />
        <div className="mx-auto max-w-6xl px-5 pt-7 sm:px-8">
          <p className="text-[13px] font-extrabold text-navy/55">
            <Link href="/" className="text-cobalt no-underline hover:underline">
              Day trips
            </Link>
            <span className="px-2">/</span>
            {tour.title}
          </p>

          <div className="mt-4">
            <BookingFlow
              visuals={{
                image: tour.image,
                route: tour.route,
                title: tour.title,
                durationChip: tour.durationChip,
                facts: tour.facts,
              }}
              {...initial}
            />
          </div>

          {/* The story lives after the booking: a guest arriving from the
              catalog card is already warm, so the machine comes first. */}
          <section className="pt-14">
            <h2 className="mb-5 text-3xl">The day, hour by hour.</h2>
            <div className="rail flex snap-x gap-4 overflow-x-auto pb-4">
              {tour.hours.map((h) => (
                <div
                  key={h.time}
                  className="w-[236px] shrink-0 snap-start rounded-3xl bg-white p-5 shadow-lift"
                >
                  <p className="text-[13px] font-black tabular-nums text-cobalt">{h.time}</p>
                  <p className="mt-1.5 font-display text-[16.5px] font-extrabold leading-tight">
                    {h.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-navy/60">{h.body}</p>
                </div>
              ))}
            </div>
            {tour.hoursNote && (
              <p className="text-[12.5px] font-semibold text-navy/50">{tour.hoursNote}</p>
            )}
            <p className="mt-6 max-w-2xl text-[15.5px] leading-relaxed text-navy/70">
              {tour.blurb}
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-mist pb-32">
      <SiteNav />

      <header className="mx-auto max-w-6xl px-5 pt-7 sm:px-8">
        <p className="text-[13px] font-extrabold text-navy/55">
          <Link href="/" className="text-cobalt no-underline hover:underline">
            Day trips
          </Link>
          <span className="px-2">/</span>
          {tour.title}
        </p>

        {/* Variant "everything on the photo": the cover is the header. Route,
            title and fact chips sit bottom left; the price rides bottom right
            on a frosted card. The cover is a flex column, not an absolute
            stack, so on narrow screens the pieces wrap instead of colliding. */}
        <div
          className="mt-4 flex min-h-[380px] flex-col justify-between rounded-3xl bg-cover bg-center p-4 shadow-ticket sm:p-5"
          style={{
            backgroundImage: `linear-gradient(180deg,rgba(0,45,98,0) 30%,rgba(0,45,98,.62)), url(${tour.image}), linear-gradient(170deg,#8FCBFF,#0E5FA8)`,
          }}
        >
          <span className="self-start rounded-full bg-white/95 px-4 py-2 text-[12.5px] font-black text-navy">
            {tour.durationChip}
          </span>

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[240px] flex-1 text-white">
              <h1 className="mt-1.5 max-w-xl text-3xl text-white sm:text-4xl">
                {titleLines(tour.title).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h1>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tour.facts.map((f) => (
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

            <div className="w-full rounded-2xl bg-white/90 p-4 shadow-lift backdrop-blur-md sm:w-[212px]">
              {manualSpec ? (
                <p className="text-[12.5px] font-bold leading-relaxed text-navy/70">
                  Booked with us directly. The whole day, one call or message.
                </p>
              ) : (
                <FromPrice
                  endpoint={flightsSpec ? "/api/flight-days" : "/api/calendar"}
                  extraParams={fromParams}
                  discountPct={flightsSpec ? 0 : packageDiscountPct()}
                  suffix="a guest, all in"
                  className="block text-[12px] font-bold text-navy/60 [&>b]:block [&>b]:font-display [&>b]:text-[26px] [&>b]:font-black [&>b]:text-navy"
                />
              )}
              <a
                href="#plan"
                className="mt-3 block rounded-2xl bg-smart py-3 text-center text-sm font-extrabold text-navy no-underline transition-[filter] hover:brightness-105"
              >
                {manualSpec ? "See the day" : "Pick a date"}
              </a>
            </div>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-navy/70">{tour.blurb}</p>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-12 sm:px-8">
        <h2 className="mb-5 text-3xl">The day, hour by hour.</h2>
        <div className="rail flex snap-x gap-4 overflow-x-auto pb-4">
          {tour.hours.map((h) => (
            <div
              key={h.time}
              className="w-[236px] shrink-0 snap-start rounded-3xl bg-white p-5 shadow-lift"
            >
              <p className="text-[13px] font-black tabular-nums text-cobalt">{h.time}</p>
              <p className="mt-1.5 font-display text-[16.5px] font-extrabold leading-tight">
                {h.title}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-navy/60">{h.body}</p>
            </div>
          ))}
        </div>
        {tour.hoursNote && (
          <p className="text-[12.5px] font-semibold text-navy/50">{tour.hoursNote}</p>
        )}
      </section>

      {tour.booking.kind === "flights" ? (
        <FlightsFlow
          image={tour.image}
          variants={tour.booking.variants}
          ground={tour.booking.ground}
          {...initial}
        />
      ) : (
        <section id="plan" className="mx-auto max-w-6xl px-5 pt-12 sm:px-8">
          <h2 className="mb-5 text-3xl">Book this day.</h2>
          <div className="max-w-3xl rounded-3xl border border-pale bg-white p-7 shadow-ticket">
            {tour.booking.notes.map((n) => (
              <p key={n} className="py-1.5 text-[15px] leading-relaxed text-navy/75">
                {n}
              </p>
            ))}
            {process.env.NEXT_PUBLIC_BOOK_URL && (
              <a
                href={process.env.NEXT_PUBLIC_BOOK_URL}
                className="mt-4 inline-block rounded-full bg-navy px-7 py-3.5 text-sm font-extrabold text-white no-underline transition-colors hover:bg-cobalt"
              >
                Get in touch to book
              </a>
            )}
          </div>
        </section>
      )}

    </main>
  );
}
