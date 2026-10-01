export interface TournamentItem {
  id: string
  title: string
  sport: string
  sportLabel: string
  category: 'ALL' | 'CRICKET' | 'FOOTBALL' | 'BADMINTON' | 'CORPORATE' | 'KNOCKOUT' | 'WEEKEND'
  badgeText: string
  subtitle: string
  description: string
  date: string
  venue: string
  location: string
  fee: string
  feeNumber: number
  prizePool: string
  maxTeams: number
  registeredTeams: number
  status: 'registration_open' | 'upcoming' | 'in_progress' | 'completed'
  statusLabel: string
  format: string
  rulesSummary: string[]
  icon: string
  bgClass: string
  tag: string
}

export const TOURNAMENTS_DATA: TournamentItem[] = [
  {
    id: 'turf-titans-2025',
    title: 'Turf Titans 2025 — Box Cricket Championship',
    sport: 'cricket',
    sportLabel: 'Box Cricket',
    category: 'CRICKET',
    badgeText: 'Official Championship',
    subtitle: 'Classic 5-over tape-ball cage cricket under floodlights with ₹35,000 cash prize pool.',
    description: 'The flagship tape-ball box cricket tournament of Mumbai. Featuring 20 elite teams in a 4-group format leading into knockout quarter-finals and grand finale.',
    date: 'Saturday, 11 Oct 2025',
    venue: 'Lush Turf Arena (Twin Floodlit Courts)',
    location: 'Mira Road East, Mumbai',
    fee: '₹3,000',
    feeNumber: 3000,
    prizePool: '₹35,000 + Trophies',
    maxTeams: 20,
    registeredTeams: 14,
    status: 'registration_open',
    statusLabel: 'Registration Open',
    format: '5 Overs Per Side • 1 Over / Bowler • 7+3 Players',
    rulesSummary: [
      'Strict 5 overs per side with maximum 1 over per bowler throughout the innings.',
      'Side wall deflections score +2 runs; direct full hit on rear top scores +4 runs.',
      'Direct hit on stump dismissals count as active run-outs.',
      'Top 2 teams from each of the 4 groups qualify for the single elimination knockout bracket.'
    ],
    icon: '🏏',
    bgClass: 'bg-[#e8f1fd]',
    tag: 'Flagship Event',
  },
  {
    id: 'futsal-turf-cup',
    title: 'Turf Titans 5v5 Futsal Championship',
    sport: 'football',
    sportLabel: 'Football / Futsal',
    category: 'FOOTBALL',
    badgeText: 'High Intensity',
    subtitle: 'Fast-paced 5v5 turf football tournament with continuous rebound walls.',
    description: 'High-octane 5-a-side floodlight football showdown. 16 squads competing in fast 15-minute halves with rolling substitutions on certified turf.',
    date: 'Sunday, 19 Oct 2025',
    venue: 'Lush Arena Pitch 1 & 2',
    location: 'Mira Road East, Mumbai',
    fee: '₹3,500',
    feeNumber: 3500,
    prizePool: '₹40,000 + Golden Cup',
    maxTeams: 16,
    registeredTeams: 10,
    status: 'registration_open',
    statusLabel: 'Registering',
    format: '5v5 (5 Active + 3 Subs) • 15 Mins / Half',
    rulesSummary: [
      '15 minutes each half with rolling substitutions.',
      'No offsides; back-pass rule strictly enforced for goalkeepers.',
      'Cumulative team fouls lead to direct penalty spot kicks.',
      'Group stage followed by Semi-Finals and Grand Final.'
    ],
    icon: '⚽',
    bgClass: 'bg-[#ecf6e8]',
    tag: 'Futsal 5v5',
  },
  {
    id: 'corporate-turf-trophy',
    title: 'Corporate Multi-Sport Turf Trophy',
    sport: 'multi-sport',
    sportLabel: 'Corporate Series',
    category: 'CORPORATE',
    badgeText: 'Inter-Company',
    subtitle: 'Weekend inter-company championship across Box Cricket and Football.',
    description: 'Premier networking and sports arena championship for tech, finance, and corporate teams with certified referees, customized jerseys, and executive lounges.',
    date: 'Saturday, 25 Oct 2025',
    venue: 'Lush Turf Arena Complex',
    location: 'Mira Road East, Mumbai',
    fee: '₹5,000',
    feeNumber: 5000,
    prizePool: '₹50,000 + Corporate Crest',
    maxTeams: 16,
    registeredTeams: 8,
    status: 'registration_open',
    statusLabel: 'Weekend Slots',
    format: 'Multi-Sport Division • Box Cricket & Football',
    rulesSummary: [
      'Official company ID cards required during squad verification.',
      'Points awarded across both sports disciplines for the overall championship shield.',
      'Certified tournament officials & digital telecast replay.'
    ],
    icon: '🏢',
    bgClass: 'bg-[#f4edf9]',
    tag: 'Corporate',
  },
  {
    id: 'badminton-arena-smash',
    title: 'Turf Titans Doubles Badminton Smash',
    sport: 'badminton',
    sportLabel: 'Badminton Doubles',
    category: 'BADMINTON',
    badgeText: 'Indoor Pro Arena',
    subtitle: 'Men & Mixed Doubles tournament on synthetic courts with BWF certified scoring.',
    description: 'High tempo badminton doubles championship. 32 pairs competing in best of 3 sets with electronic scoreboards and Yonex tournament shuttlecocks.',
    date: 'Sunday, 02 Nov 2025',
    venue: 'Titan Indoor Badminton Center',
    location: 'Borivali West, Mumbai',
    fee: '₹1,500',
    feeNumber: 1500,
    prizePool: '₹25,000 + Medals',
    maxTeams: 32,
    registeredTeams: 22,
    status: 'registration_open',
    statusLabel: 'Filling Fast',
    format: 'Doubles Knockout • Best of 3 Sets (21 Pts)',
    rulesSummary: [
      'Standard BWF 21-point rally scoring system with sudden death at 29-29.',
      'Yonex feather tournament shuttles provided for all matches.',
      'Men Doubles & Mixed Doubles categories.'
    ],
    icon: '🏸',
    bgClass: 'bg-[#ebf6fd]',
    tag: 'Doubles Open',
  },
  {
    id: 'weekend-super-knockouts',
    title: 'Weekend Super Knockout Series',
    sport: 'cricket',
    sportLabel: 'Tape-Ball Knockouts',
    category: 'KNOCKOUT',
    badgeText: 'Sudden Death',
    subtitle: 'High stakes sudden-death single elimination brackets on floodlit pitches.',
    description: 'Non-stop fast-paced cricket knockout series with instant elimination. Every match is do-or-die with winner-takes-all trophy prizes.',
    date: 'Saturday, 08 Nov 2025',
    venue: 'Lush Turf Arena',
    location: 'Mira Road East, Mumbai',
    fee: '₹2,500',
    feeNumber: 2500,
    prizePool: '₹25,000',
    maxTeams: 16,
    registeredTeams: 6,
    status: 'registration_open',
    statusLabel: 'Open Entry',
    format: 'Single Elimination • 4 Overs Shootout',
    rulesSummary: [
      '4 overs per side shootout with 1 super over tiebreaker.',
      'Instant playoff advancement on match win.'
    ],
    icon: '🎯',
    bgClass: 'bg-[#fef6e7]',
    tag: 'Knockout',
  },
]

export function getTournamentById(id: string): TournamentItem {
  const found = TOURNAMENTS_DATA.find((t) => t.id === id)
  if (found) return found
  // Default fallback to flagship tournament
  return TOURNAMENTS_DATA[0]
}
