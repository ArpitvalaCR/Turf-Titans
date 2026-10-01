import { ArrowRight, Trophy } from 'lucide-react'
import Link from 'next/link'

const stats = [
  { value: '120+', label: 'Teams' },
  { value: '48', label: 'Tournaments' },
  { value: '$250K', label: 'Prize Pool' },
]

export function Hero() {
  return (
    <section id="home" className="relative flex min-h-screen items-center overflow-hidden">
      <img
        src="/images/hero-turf.png"
        alt="Player striking a ball on a floodlit turf pitch at night"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-24 md:px-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Trophy className="h-3.5 w-3.5" />
            Season 2026 now open
          </span>

          <h1 className="mt-6 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-balance sm:text-6xl md:text-7xl">
            Where legends
            <span className="block text-primary">take the turf</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Turf Titans runs the most electric amateur and pro sports tournaments in the region.
            Rally your squad, chase the glory, and leave everything on the field.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#tournaments"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View Tournaments
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-transparent px-6 py-3 text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-secondary"
            >
              Register Your Team
            </Link>
          </div>

          <dl className="mt-14 grid max-w-md grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="border-l-2 border-primary pl-4">
                <dt className="font-display text-3xl font-bold text-foreground">{stat.value}</dt>
                <dd className="text-xs uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
