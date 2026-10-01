'use client'

import { CinematicNavbar } from './CinematicNavbar'
import { CinematicHero } from './CinematicHero'
import { AnimatedStats } from './AnimatedStats'
import { AboutUsSection } from './AboutUsSection'
import { SportsJourneyStory } from './SportsJourneyStory'
import { LiveScoreShowcase } from './LiveScoreShowcase'
import { ChampionshipCtaSection } from './ChampionshipCtaSection'
import { LandingFooter } from '@/components/landing-page-view'

export function CinematicLandingPage() {
  return (
    <div className="min-h-screen bg-[#060b18] text-white flex flex-col justify-between selection:bg-[#74c004] selection:text-slate-950 overflow-x-hidden">
      {/* 1. Smart Scroll-Driven Navigation Bar */}
      <CinematicNavbar />

      {/* 2. Cinematic Stadium Hero with 3D Cricket Ball */}
      <CinematicHero />

      {/* 3. Animated Viewport Statistics Counters */}
      <AnimatedStats />

      {/* 4. About Us • More Than A Club */}
      <AboutUsSection />

      {/* 5. The 4-Part Sports Journey & Value Narrative */}
      <SportsJourneyStory />

      {/* 5. Live Ball-by-Ball Arena Telemetry Engine Showcase */}
      <LiveScoreShowcase />

      {/* 6. 3D Championship Trophy & Final Call to Action */}
      <ChampionshipCtaSection />

      {/* 7. Platform Footer */}
      <LandingFooter />
    </div>
  )
}
