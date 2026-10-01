import { Zap, ShieldCheck, Medal, HeartPulse } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Fast-Paced Play',
    text: 'Tightly scheduled brackets and pro-grade officiating keep every match sharp and fair.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Squads',
    text: 'Every team is vetted so you compete against real contenders, not no-shows.',
  },
  {
    icon: Medal,
    title: 'Real Stakes',
    text: 'Championship trophies, cash prizes, and league-wide recognition on the line.',
  },
  {
    icon: HeartPulse,
    title: 'Player First',
    text: 'On-site physios, hydration stations, and safe turf so athletes stay in the game.',
  },
]

export function About() {
  return (
    <section id="about" className="scroll-mt-20 border-y border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:grid-cols-2 md:px-6">
        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Who we are
          </span>
          <h2 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight text-balance md:text-5xl">
            Built by players, for players
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            Turf Titans started as a weekend kickabout between friends and grew into the region&apos;s
            most competitive grassroots sports circuit. We obsess over the details — pristine pitches,
            honest refs, and a fixture list that actually respects your time.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground text-pretty">
            Whether you&apos;re chasing your first trophy or defending a title, there&apos;s a place for your
            squad on our turf.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-background p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
