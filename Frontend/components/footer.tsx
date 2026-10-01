import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#050814] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs tracking-wide">
            <img
              src="/logo.png"
              alt="Turf Titans"
              className="h-6 w-6 rounded-md object-contain"
            />
            <span className="font-display font-black tracking-wider text-white uppercase text-sm">
              TURF TITANS
            </span>
            <span className="text-slate-600">•</span>
            <span>© 2025 Turf Titans League. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">
            <Link href="/tournaments" className="hover:text-[#74c004] transition-colors">
              All Tournaments
            </Link>
            <Link href="/tournaments/turf-titans-2025?tab=fixtures" className="hover:text-[#74c004] transition-colors">
              Match Schedule
            </Link>
            <Link href="/tournaments/turf-titans-2025?tab=points-table" className="hover:text-[#74c004] transition-colors">
              Points Table
            </Link>
            <Link href="/tournaments/turf-titans-2025?tab=registration" className="hover:text-[#74c004] transition-colors">
              Team Registration
            </Link>
            <Link href="/tournaments/turf-titans-2025?tab=rules" className="hover:text-[#74c004] transition-colors">
              Rules & Regulations
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
