import Link from "next/link";
import { HomeTop, FromPrice, IconChevronRight } from "@/components/ui";
import { TOURS, packageDiscountPct } from "@/lib/core";

export const dynamic = "force-dynamic";

/**
 * The catalog. Every card comes out of lib/catalog.ts; the plan bar writes
 * the guest's day and party into this page's own URL, and every card link
 * carries them forward, so "when and who" is answered once for the shelf.
 */
export default function Home({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const carry = new URLSearchParams();
  for (const k of ["date", "adults", "children", "infants"]) {
    const v = searchParams[k];
    if (typeof v === "string" && v) carry.set(k, v);
  }
  const qs = carry.toString();
  const href = (slug: string) => `/tours/${slug}${qs ? `?${qs}` : ""}`;

  return (
    <main className="bg-mist">
      <HomeTop
        initialDate={typeof searchParams.date === "string" ? searchParams.date : undefined}
        initialAdults={
          typeof searchParams.adults === "string" ? Number(searchParams.adults) : undefined
        }
      />

      <section id="days" className="mx-auto max-w-6xl px-5 pb-8 pt-12 sm:px-8">
        <h2 className="mb-6 text-4xl sm:text-5xl">Days from Vancouver.</h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOURS.map((tour) => (
            <Link
              key={tour.slug}
              href={href(tour.slug)}
              className="group flex flex-col overflow-hidden rounded-3xl bg-white no-underline shadow-ticket transition-transform hover:-translate-y-1.5"
            >
              <div
                className="relative h-44 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(180deg,rgba(0,45,98,0) 55%,rgba(0,45,98,.45)), url(${tour.image}), linear-gradient(170deg,#8FCBFF,#0E5FA8)`,
                }}
              >
                <span className="absolute left-3.5 top-3.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11.5px] font-black text-navy">
                  {tour.durationChip}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="text-xs font-extrabold text-cobalt">{tour.route}</span>
                <h3 className="mt-1.5 text-xl leading-snug">{tour.title}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tour.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-lg bg-mist px-2.5 py-1 text-[11.5px] font-extrabold text-navy/65"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-end justify-between pt-5">
                  {tour.booking.kind === "whale-day" ? (
                    <FromPrice
                      discountPct={packageDiscountPct()}
                      className="text-xs font-bold text-navy/55 [&>b]:text-[21px] [&>b]:font-black [&>b]:text-navy"
                    />
                  ) : tour.booking.kind === "flights" ? (
                    <FromPrice
                      endpoint="/api/flight-days"
                      extraParams={[
                        tour.booking.variants[0].out
                          ? `out=${tour.booking.variants[0].out.from}:${tour.booking.variants[0].out.to}`
                          : "",
                        tour.booking.variants[0].back
                          ? `back=${tour.booking.variants[0].back.from}:${tour.booking.variants[0].back.to}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join("&")}
                      className="text-xs font-bold text-navy/55 [&>b]:text-[21px] [&>b]:font-black [&>b]:text-navy"
                    />
                  ) : (
                    <span />
                  )}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-smart text-navy transition-transform group-hover:translate-x-0.5">
                    <IconChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}
