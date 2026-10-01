import Link from 'next/link'
import { Calendar, MapPin, Users, Trophy, ArrowRight, Shield } from 'lucide-react'
import {
  formatEventDates,
  formatSport,
  formatStatus,
  getEvents,
  getEventRegistrationCount,
} from '@/lib/services'

export async function Tournaments() {
  let events: Awaited<ReturnType<typeof getEvents>> = []

  try {
    events = await getEvents()
  } catch {
    events = []
  }

  const eventsWithCounts = await Promise.all(
    events.map(async (event) => {
      try {
        const count = await getEventRegistrationCount(event._id)
        return { event, count }
      } catch {
        return {
          event,
          count: { registeredTeams: 0, maxTeams: event.maxTeams },
        }
      }
    })
  )

  return (
    <section id="tournaments" className="w-full bg-[#080e1e] py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#74c004]/10 border border-[#74c004]/30 px-3 py-1 text-xs font-bold text-[#74c004] uppercase tracking-wider mb-2">
              <Trophy className="h-3.5 w-3.5" />
              <span>OFFICIAL TOURNAMENTS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display uppercase tracking-tight text-white">
              Upcoming <span className="text-[#74c004]">Championships</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-400 font-medium">
            Lock in your squad's slot early. Brackets fill fast and every title run starts with a single kickoff.
          </p>
        </div>

        {eventsWithCounts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-12 text-center">
            <p className="text-slate-400 font-medium text-sm">
              No tournaments listed yet. Check back soon for new season announcements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventsWithCounts.map(({ event, count }) => {
              const spotsLeft = Math.max(0, count.maxTeams - count.registeredTeams)
              const isNearlyFull = count.registeredTeams >= count.maxTeams * 0.75

              return (
                <div
                  key={event._id}
                  className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0f182e] hover:border-[#74c004]/50 transition-all duration-300 p-6 shadow-lg hover:shadow-[0_0_25px_rgba(116,192,4,0.15)]"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-200">
                        {formatSport(event.sport)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          isNearlyFull
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-[#74c004]/20 text-[#74c004] border border-[#74c004]/30'
                        }`}
                      >
                        {formatStatus(event.status, count.registeredTeams, count.maxTeams, event.startDate, event.endDate)}
                      </span>
                    </div>

                    {/* Tournament Title */}
                    <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-white group-hover:text-[#74c004] transition-colors">
                      {event.title}
                    </h3>

                    {/* Meta details */}
                    <div className="mt-5 space-y-2.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 text-[#74c004] shrink-0" />
                        <span>{formatEventDates(event.startDate, event.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <MapPin className="h-4 w-4 text-[#74c004] shrink-0" />
                        <span>{event.location || event.venue || 'Lush Turf Arena, Mumbai'}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Users className="h-4 w-4 text-[#74c004] shrink-0" />
                        <span>
                          {count.registeredTeams} / {count.maxTeams} Teams ({spotsLeft} spots left)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Prize & CTA Button */}
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                        Prize Pool
                      </span>
                      <span className="font-display text-xl font-black text-[#74c004]">
                        {event.prizes || '₹35,000'}
                      </span>
                    </div>

                    <Link
                      href={`/register?eventId=${event._id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#74c004] hover:bg-[#86dc05] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#080e1e] shadow-md transition-all hover:scale-105"
                    >
                      <span>Enter Squad</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
