'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  Radio,
  CheckCircle2,
  Trophy,
  Users,
  Eye,
  ArrowRight,
  Sparkles,
  MapPin,
  Flame,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Layers,
  CheckSquare,
  Square,
  Loader2,
  ShieldCheck,
  Shield,
  ChevronDown,
  UserCheck,
  X
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  getRegisteredTeams,
  getTournamentGroups,
  saveTournamentGroup,
  createTournamentGroup,
  deleteTournamentGroup,
  assignTournamentGroupTeam,
  removeTournamentGroupTeam,
  getTournamentFixtures,
  createTournamentFixture,
  updateTournamentFixture,
  deleteTournamentFixture,
  RegisteredTeam,
  TournamentGroup,
  Fixture,
  getEvent,
  Event as BackendEvent
} from '@/lib/services'
import { MatchSetupModal } from '@/components/match-scoring/match-setup-modal'

const DEFAULT_GROUPS = ['GROUP A', 'GROUP B', 'GROUP C', 'GROUP D']

export const MATCH_TITLE_OPTIONS = [
  'Group Stage Match',
  'Quarter Final',
  'Semi Final',
  'Final',
  'Third Place Match',
  'Qualifier',
  'Eliminator',
  'Custom',
]

export function FixturesView({ tournamentId = 'turf-titans-2025' }: { tournamentId?: string }) {
  const { isAdmin } = useAuth()
  const router = useRouter()

  // Dynamic Group Dropdown Selector
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL')
  const [activeStatus, setActiveStatus] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL')
  const [activeCourt, setActiveCourt] = useState('ALL')
  const [viewMode, setViewMode] = useState<'groups' | 'matches'>('groups')

  // Data State
  const [tournamentData, setTournamentData] = useState<BackendEvent | null>(null)
  const [registeredTeams, setRegisteredTeams] = useState<RegisteredTeam[]>([])
  const [groups, setGroups] = useState<TournamentGroup[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)

  // Start Match / Setup Modal State
  const [fixtureForSetup, setFixtureForSetup] = useState<Fixture | null>(null)

  // Admin UI Tabs: 'fixtures' | 'groups' | 'create-fixture'
  const [adminTab, setAdminTab] = useState<'fixtures' | 'groups' | 'create-fixture'>('fixtures')
  const [selectedGroupToManage, setSelectedGroupToManage] = useState('GROUP A')
  const [teamToAssign, setTeamToAssign] = useState('')
  const [selectedTeamsForGroup, setSelectedTeamsForGroup] = useState<string[]>([])
  const [groupSaveLoading, setGroupSaveLoading] = useState(false)
  const [groupSuccessMsg, setGroupSuccessMsg] = useState('')
  const [groupErrorMsg, setGroupErrorMsg] = useState('')

  // Add Group Modal State (Admin)
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  // Fixture creation form state
  const [fixtureGroup, setFixtureGroup] = useState('GROUP A')
  const [fixtureTeam1, setFixtureTeam1] = useState('')
  const [fixtureTeam2, setFixtureTeam2] = useState('')
  const [fixtureMatchTitle, setFixtureMatchTitle] = useState('Group Stage Match')
  const [customMatchTitle, setCustomMatchTitle] = useState('')
  const [fixtureDate, setFixtureDate] = useState('2025-10-11')
  
  // Fast time input state
  const [fixtureHour, setFixtureHour] = useState('09')
  const [fixtureMinute, setFixtureMinute] = useState('00')
  const [fixturePeriod, setFixturePeriod] = useState<'AM' | 'PM'>('AM')
  const [fixtureTimeText, setFixtureTimeText] = useState('09:00 AM')
  const [fixtureTime, setFixtureTime] = useState('09:00 AM')

  const [fixtureGround, setFixtureGround] = useState('Pitch 1 - North Court')
  const [fixtureStatus, setFixtureStatus] = useState<'UPCOMING' | 'LIVE' | 'COMPLETED'>('UPCOMING')
  const [fixtureCreateLoading, setFixtureCreateLoading] = useState(false)
  const [fixtureSuccessMsg, setFixtureSuccessMsg] = useState('')
  const [fixtureErrorMsg, setFixtureErrorMsg] = useState('')

  // Load all tournament data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [teamsData, groupsData, fixturesData, eventData] = await Promise.all([
        getRegisteredTeams(tournamentId).catch(() => []),
        getTournamentGroups(tournamentId).catch(() => []),
        getTournamentFixtures(tournamentId).catch(() => []),
        getEvent(tournamentId).catch(() => null),
      ])

      setRegisteredTeams(teamsData || [])
      setGroups(groupsData || [])
      setFixtures(fixturesData || [])
      if (eventData) {
        setTournamentData(eventData)
        if (eventData.startDate) {
          const sDate = new Date(eventData.startDate).toISOString().split('T')[0]
          setFixtureDate(sDate)
        }
        if (eventData.venue) {
          setFixtureGround(eventData.venue)
        }
      }
    } catch {
      // Keep existing state
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Compute tournament date constraints
  const tournamentMinDate = tournamentData?.startDate
    ? new Date(tournamentData.startDate).toISOString().split('T')[0]
    : '2025-10-11'
  const tournamentMaxDate = tournamentData?.endDate
    ? new Date(tournamentData.endDate).toISOString().split('T')[0]
    : tournamentMinDate

  // Smart time typing handler
  const handleTimeTextChange = (val: string) => {
    setFixtureTimeText(val)
    const cleaned = val.trim()
    const match = cleaned.match(/^(\d{1,2})(?:[:\s](\d{1,2}))?\s*(am|pm)?$/i)
    if (match) {
      let h = parseInt(match[1], 10)
      let m = match[2] ? parseInt(match[2], 10) : 0
      let p = match[3] ? match[3].toUpperCase() : (h >= 12 && h < 24 ? 'PM' : fixturePeriod)

      if (h > 12 && h <= 23) {
        h = h - 12
        p = 'PM'
      } else if (h === 0) {
        h = 12
        p = 'AM'
      }

      if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
        const formattedH = String(h).padStart(2, '0')
        const formattedM = String(m).padStart(2, '0')
        setFixtureHour(formattedH)
        setFixtureMinute(formattedM)
        setFixturePeriod(p as 'AM' | 'PM')
        const finalFormatted = `${formattedH}:${formattedM} ${p}`
        setFixtureTime(finalFormatted)
        return
      }
    }
    setFixtureTime(val)
  }

  const syncTimeFromParts = (h: string, m: string, p: 'AM' | 'PM') => {
    const formatted = `${h}:${m} ${p}`
    setFixtureHour(h)
    setFixtureMinute(m)
    setFixturePeriod(p)
    setFixtureTime(formatted)
    setFixtureTimeText(formatted)
  }

  // Get available configured group names (or default A, B, C, D)
  const configuredGroupNames = groups.length > 0
    ? Array.from(new Set(groups.map((g) => g.groupName.toUpperCase())))
    : DEFAULT_GROUPS

  // Sync selected group teams when managing a group in Admin
  useEffect(() => {
    const currentGroup = groups.find((g) => g.groupName.toUpperCase() === selectedGroupToManage.toUpperCase())
    setSelectedTeamsForGroup(currentGroup?.teams || [])
    setGroupSuccessMsg('')
    setGroupErrorMsg('')
    setTeamToAssign('')
  }, [selectedGroupToManage, groups])

  // Map of teamName -> groupName to know which teams are assigned
  const teamGroupMap = new Map<string, string>()
  groups.forEach((g) => {
    (g.teams || []).forEach((t) => {
      teamGroupMap.set(t.trim().toLowerCase(), g.groupName)
    })
  })

  // Approved registered teams
  const approvedTeams = registeredTeams.filter(
    (t) => t.registrationStatus?.toLowerCase() === 'approved'
  )

  // When fixture group changes, reset team selections to valid group teams
  const currentFixtureGroupObj = groups.find(
    (g) => g.groupName.toUpperCase() === fixtureGroup.toUpperCase()
  )
  const availableFixtureTeams = currentFixtureGroupObj?.teams || []

  useEffect(() => {
    if (availableFixtureTeams.length >= 2) {
      setFixtureTeam1(availableFixtureTeams[0])
      setFixtureTeam2(availableFixtureTeams[1])
    } else if (availableFixtureTeams.length === 1) {
      setFixtureTeam1(availableFixtureTeams[0])
      setFixtureTeam2('')
    } else {
      setFixtureTeam1('')
      setFixtureTeam2('')
    }
  }, [fixtureGroup, groups])

  // Create New Group (Admin)
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) {
      setGroupErrorMsg('Please enter a group name.')
      return
    }
    setGroupSaveLoading(true)
    setGroupSuccessMsg('')
    setGroupErrorMsg('')
    try {
      await createTournamentGroup(tournamentId, newGroupName.trim())
      setGroupSuccessMsg(`Successfully created "${newGroupName.trim()}"!`)
      setSelectedGroupToManage(newGroupName.trim().toUpperCase())
      setNewGroupName('')
      setIsAddingGroup(false)
      await loadData()
      setTimeout(() => setGroupSuccessMsg(''), 3500)
    } catch (err: any) {
      setGroupErrorMsg(err?.message || 'Failed to create group.')
    } finally {
      setGroupSaveLoading(false)
    }
  }

  // Delete Group (Admin)
  const handleDeleteGroup = async (groupName: string) => {
    if (!confirm(`Are you sure you want to delete group "${groupName}"? This action cannot be undone.`)) return
    setGroupSaveLoading(true)
    setGroupSuccessMsg('')
    setGroupErrorMsg('')
    try {
      await deleteTournamentGroup(tournamentId, groupName)
      setGroupSuccessMsg(`Successfully deleted group "${groupName}".`)
      await loadData()
      setTimeout(() => setGroupSuccessMsg(''), 3500)
    } catch (err: any) {
      alert(err?.message || 'Failed to delete group.')
      setGroupErrorMsg(err?.message || 'Failed to delete group.')
    } finally {
      setGroupSaveLoading(false)
    }
  }

  // Assign a single team to the selected group (Admin)
  const handleAssignSingleTeam = async () => {
    if (!teamToAssign) {
      setGroupErrorMsg('Please select an approved team from the dropdown to assign.')
      return
    }
    setGroupSaveLoading(true)
    setGroupSuccessMsg('')
    setGroupErrorMsg('')
    try {
      await assignTournamentGroupTeam(tournamentId, selectedGroupToManage, teamToAssign)
      setGroupSuccessMsg(`Successfully assigned "${teamToAssign}" to ${selectedGroupToManage}!`)
      setTeamToAssign('')
      await loadData()
      setTimeout(() => setGroupSuccessMsg(''), 3000)
    } catch (err: any) {
      setGroupErrorMsg(err?.message || 'Failed to assign team to group.')
    } finally {
      setGroupSaveLoading(false)
    }
  }

  // Remove/Unassign Team from Group (Admin)
  const handleRemoveTeamFromGroup = async (groupName: string, teamName: string) => {
    if (!confirm(`Are you sure you want to remove "${teamName}" from ${groupName}? This will make the team available for re-assignment.`)) return
    setGroupSaveLoading(true)
    setGroupSuccessMsg('')
    setGroupErrorMsg('')
    try {
      await removeTournamentGroupTeam(tournamentId, groupName, teamName)
      setGroupSuccessMsg(`Removed "${teamName}" from ${groupName}. It is now available for assignment.`)
      await loadData()
      setTimeout(() => setGroupSuccessMsg(''), 3000)
    } catch (err: any) {
      setGroupErrorMsg(err?.message || 'Failed to remove team from group.')
      alert(err?.message || 'Failed to remove team from group.')
    } finally {
      setGroupSaveLoading(false)
    }
  }

  // Create Fixture (Admin)
  const handleCreateFixture = async (e: React.FormEvent) => {
    e.preventDefault()
    setFixtureCreateLoading(true)
    setFixtureSuccessMsg('')
    setFixtureErrorMsg('')

    if (!fixtureTeam1 || !fixtureTeam2) {
      setFixtureErrorMsg('Please select both Team 1 and Team 2 from the group roster.')
      setFixtureCreateLoading(false)
      return
    }

    if (fixtureTeam1.trim().toLowerCase() === fixtureTeam2.trim().toLowerCase()) {
      setFixtureErrorMsg('Team 1 and Team 2 must be different teams.')
      setFixtureCreateLoading(false)
      return
    }

    if (tournamentMinDate && fixtureDate < tournamentMinDate) {
      setFixtureErrorMsg(`Fixture date cannot be before tournament start date (${tournamentMinDate}).`)
      setFixtureCreateLoading(false)
      return
    }

    if (tournamentMaxDate && fixtureDate > tournamentMaxDate) {
      setFixtureErrorMsg(`Fixture date cannot be after tournament end date (${tournamentMaxDate}).`)
      setFixtureCreateLoading(false)
      return
    }

    const finalTitle = fixtureMatchTitle === 'Custom' ? (customMatchTitle.trim() || 'Custom Match') : fixtureMatchTitle

    try {
      await createTournamentFixture(tournamentId, {
        groupName: fixtureGroup,
        team1: fixtureTeam1,
        team2: fixtureTeam2,
        date: fixtureDate,
        time: fixtureTime.trim() || '09:00 AM',
        matchTitle: finalTitle,
        round: finalTitle,
        ground: fixtureGround,
        status: fixtureStatus,
      })
      setFixtureSuccessMsg(`Fixture "${finalTitle}: ${fixtureTeam1} vs ${fixtureTeam2}" scheduled successfully!`)
      await loadData()
      setAdminTab('fixtures')
      setViewMode('matches')
      setTimeout(() => setFixtureSuccessMsg(''), 3000)
    } catch (err: any) {
      setFixtureErrorMsg(err?.message || 'Failed to create fixture.')
    } finally {
      setFixtureCreateLoading(false)
    }
  }

  // Delete Fixture (Admin only)
  const handleDeleteFixture = async (fixtureId: string) => {
    if (!confirm('Are you sure you want to delete this fixture?')) return
    try {
      await deleteTournamentFixture(tournamentId, fixtureId)
      await loadData()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete fixture')
    }
  }

  // Filter fixtures
  const filteredFixtures = fixtures.filter((f) => {
    if (selectedGroup !== 'ALL' && f.groupName?.toUpperCase() !== selectedGroup.toUpperCase()) {
      return false
    }
    if (activeStatus !== 'ALL' && f.status?.toUpperCase() !== activeStatus.toUpperCase()) {
      return false
    }
    if (activeCourt !== 'ALL' && !f.ground?.toLowerCase().includes(activeCourt.toLowerCase())) {
      return false
    }
    return true
  })

  // Display groups
  const displayedGroups = selectedGroup === 'ALL'
    ? (groups.length > 0 ? groups : DEFAULT_GROUPS.map(g => ({ tournamentId, groupName: g, teams: [] })))
    : (groups.filter(g => g.groupName.toUpperCase() === selectedGroup.toUpperCase()).length > 0
      ? groups.filter(g => g.groupName.toUpperCase() === selectedGroup.toUpperCase())
      : [{ tournamentId, groupName: selectedGroup, teams: [] }])

  // Counters
  const totalCount = fixtures.length
  const liveCount = fixtures.filter((f) => f.status?.toUpperCase() === 'LIVE').length
  const completedCount = fixtures.filter((f) => f.status?.toUpperCase() === 'COMPLETED').length
  const upcomingCount = fixtures.filter((f) => f.status?.toUpperCase() === 'UPCOMING').length

  return (
    <div className="w-full bg-[#080e1e] text-slate-100 min-h-screen pb-20">

      {/* 1. HERO & STAT COUNTERS */}
      <div className="w-full border-b border-white/10 bg-[#070c1a] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Title & Subtitle */}
            <div className="lg:col-span-7 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#74c004] block">
                LUSH TURF STADIUM • DUAL COURT SERIES • TOURNAMENT FIXTURES
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display uppercase tracking-tight text-white leading-none">
                GROUPS & <span className="text-[#74c004]">MATCH FIXTURES</span>
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium pt-1">
                Official tournament brackets and schedule sourced directly from verified team entries. Select any group below to review seeded squads and scheduled fixtures.
              </p>
            </div>

            {/* 4 Stat Counters */}
            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-3">

              {/* Total */}
              <div className="rounded-xl border border-white/10 bg-[#0f182e] p-3.5 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  TOTAL MATCHES
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-display text-2xl font-black text-white">
                    {totalCount > 0 ? String(totalCount).padStart(2, '0') : '--'}
                  </span>
                  <span className="text-slate-500 text-base">🏏</span>
                </div>
              </div>

              {/* In Progress */}
              <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3.5 flex flex-col justify-between shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span>IN PROGRESS</span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-display text-2xl font-black text-red-400">
                    {String(liveCount).padStart(2, '0')}
                  </span>
                  <span className="rounded bg-red-500/20 text-red-300 px-1 py-0.5 text-[9px] font-black uppercase">
                    LIVE
                  </span>
                </div>
              </div>

              {/* Completed */}
              <div className="rounded-xl border border-sky-500/30 bg-[#0f182e] p-3.5 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                  COMPLETED
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-display text-2xl font-black text-white">
                    {String(completedCount).padStart(2, '0')}
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-sky-400" />
                </div>
              </div>

              {/* Upcoming */}
              <div className="rounded-xl border border-amber-500/30 bg-[#0f182e] p-3.5 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  UPCOMING
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-display text-2xl font-black text-white">
                    {String(upcomingCount).padStart(2, '0')}
                  </span>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* 2. ADMIN TOURNAMENT CONTROL PANEL (ADMIN ONLY) */}
      {isAdmin && (
        <div className="w-full bg-[#0a1329] border-b border-[#74c004]/30 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">

            {/* Header with Admin Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#74c004]/20 border border-[#74c004]/40 text-[#74c004]">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-black uppercase tracking-wide text-white">
                    ADMIN TOURNAMENT CONTROLS
                  </h2>
                  <p className="text-xs text-slate-400">
                    Review registrations, manage dynamic groups, and create official fixtures.
                  </p>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-2 bg-[#060b18] p-1.5 rounded-xl border border-white/10 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setAdminTab(adminTab === 'groups' ? 'fixtures' : 'groups')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${adminTab === 'groups'
                    ? 'bg-[#74c004] text-[#080e1e]'
                    : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10'
                    }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Manage Groups ({configuredGroupNames.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab(adminTab === 'create-fixture' ? 'fixtures' : 'create-fixture')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${adminTab === 'create-fixture'
                    ? 'bg-[#74c004] text-[#080e1e]'
                    : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10'
                    }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Fixture</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: MANAGE GROUPS & ADD GROUP */}
            {adminTab === 'groups' && (
              <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#74c004]" />
                      <span>Group & Squad Management</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Create new groups, assign approved teams, or remove squads.
                    </p>
                  </div>

                  {/* + Add Group Button for Admin */}
                  <button
                    type="button"
                    onClick={() => setIsAddingGroup(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#080e1e] shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" strokeWidth={3} />
                    <span>+ Add Group</span>
                  </button>
                </div>

                {/* + Add Group Modal/Dialog */}
                {isAddingGroup && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-[#0b1329] border border-[#74c004]/40 p-6 space-y-4 shadow-2xl animate-in fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                          <Plus className="h-4 w-4 text-[#74c004]" />
                          <span>Create New Tournament Group</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingGroup(false)
                            setNewGroupName('')
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <form onSubmit={handleCreateGroup} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase text-slate-300 block">
                            Group Name / Label <span className="text-[#74c004]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="e.g. GROUP E, GROUP F, PLATINUM POOL..."
                            className="w-full rounded-xl bg-[#060b18] border border-white/20 p-3 text-xs font-bold text-white uppercase focus:border-[#74c004] focus:outline-none"
                            autoFocus
                          />
                          <span className="text-[10px] text-slate-400">
                            The new group will be isolated to this tournament ({tournamentId}) and persisted in MongoDB.
                          </span>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingGroup(false)
                              setNewGroupName('')
                            }}
                            className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-slate-300 hover:bg-white/15"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={groupSaveLoading || !newGroupName.trim()}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] text-xs font-black uppercase text-[#080e1e] shadow-md disabled:opacity-50"
                          >
                            {groupSaveLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                            )}
                            <span>Create Group</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* 1. ASSIGN TEAM FORM (Select Group -> Select Team -> Assign Team) */}
                <div className="rounded-2xl bg-[#060b18] border border-white/10 p-5 space-y-4">
                  <span className="text-xs font-black uppercase tracking-wider text-[#74c004] block">
                    Assign Approved Team to Group
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                    {/* Group Selector */}
                    <div className="sm:col-span-4 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 uppercase block">
                        Select Group <span className="text-[#74c004]">*</span>
                      </label>
                      <select
                        value={selectedGroupToManage}
                        onChange={(e) => setSelectedGroupToManage(e.target.value)}
                        className="w-full rounded-xl border border-white/20 bg-[#0f182e] px-3.5 py-2 text-xs font-black text-white uppercase focus:border-[#74c004] focus:outline-none"
                      >
                        {configuredGroupNames.map((g) => (
                          <option key={g} value={g} className="bg-[#0f182e]">
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Team Selector (Only unassigned approved teams) */}
                    <div className="sm:col-span-5 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 uppercase block">
                        Select Approved Team <span className="text-[#74c004]">*</span>
                      </label>
                      <select
                        value={teamToAssign}
                        onChange={(e) => setTeamToAssign(e.target.value)}
                        className="w-full rounded-xl border border-white/20 bg-[#0f182e] px-3.5 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                      >
                        <option value="">-- Choose Approved Team --</option>
                        {approvedTeams
                          .filter((t) => !teamGroupMap.has(t.teamName.trim().toLowerCase()))
                          .map((t) => (
                            <option key={t._id} value={t.teamName} className="bg-[#0f182e]">
                              {t.teamName} (Capt: {t.captainName})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Assign Button */}
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        disabled={groupSaveLoading || !teamToAssign}
                        onClick={handleAssignSingleTeam}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#080e1e] shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        {groupSaveLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Assigning...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Assign Team</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  {groupSuccessMsg && (
                    <div className="p-3 rounded-xl bg-[#74c004]/10 border border-[#74c004]/30 text-xs text-[#74c004] font-bold">
                      {groupSuccessMsg}
                    </div>
                  )}
                  {groupErrorMsg && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-bold">
                      {groupErrorMsg}
                    </div>
                  )}
                </div>

                {/* 2. CURRENT ROSTER FOR SELECTED GROUP WITH REMOVE ACTION */}
                <div className="rounded-2xl bg-[#060b18] border border-white/10 p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h4 className="font-display text-sm font-black uppercase text-white">
                        Seeded Teams in {selectedGroupToManage} ({selectedTeamsForGroup.length})
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Teams currently allocated to {selectedGroupToManage}. Click Remove to unassign.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#74c004]/20 border border-[#74c004]/30 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#74c004]">
                        {selectedGroupToManage}
                      </span>
                      {selectedTeamsForGroup.length === 0 && groups.some(g => g.groupName.toUpperCase() === selectedGroupToManage.toUpperCase()) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(selectedGroupToManage)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase transition-colors"
                          title="Delete empty group"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete Group</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedTeamsForGroup.length === 0 ? (
                    <div className="py-6 text-center space-y-1">
                      <p className="text-xs font-bold text-slate-400">
                        No teams assigned to {selectedGroupToManage} yet.
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Select an approved team from the dropdown above and click &quot;Assign Team&quot;.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedTeamsForGroup.map((teamName) => {
                        const regInfo = approvedTeams.find(
                          (r) => r.teamName.trim().toLowerCase() === teamName.trim().toLowerCase()
                        )
                        return (
                          <div
                            key={teamName}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-[#0f182e] border border-[#74c004]/30 shadow-md text-white text-xs"
                          >
                            <div className="space-y-1 truncate pr-2">
                              <div className="flex items-center gap-2.5 truncate">
                                {regInfo?.teamLogo ? (
                                  <img
                                    src={regInfo.teamLogo}
                                    alt={teamName}
                                    className="h-7 w-7 rounded-full object-cover border border-[#74c004]/40 shrink-0"
                                  />
                                ) : (
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#74c004]/20 border border-[#74c004]/40 text-[#74c004] text-[10px] font-black shrink-0">
                                    {teamName.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <span className="font-bold uppercase text-white truncate">
                                  {teamName}
                                </span>
                              </div>
                              {regInfo && (
                                <span className="text-[10px] text-slate-400 block truncate">
                                  Capt: {regInfo.captainName} • {regInfo.playerCount || 11} Members
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              title={`Remove ${teamName} from ${selectedGroupToManage}`}
                              onClick={() => handleRemoveTeamFromGroup(selectedGroupToManage, teamName)}
                              className="inline-flex items-center gap-1 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-bold uppercase hidden sm:inline">Remove</span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB CONTENT: CREATE FIXTURE */}
            {adminTab === 'create-fixture' && (
              <form onSubmit={handleCreateFixture} className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 space-y-5">
                <div className="pb-3 border-b border-white/10">
                  <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Plus className="h-4 w-4 text-[#74c004]" />
                    <span>Create Official Match Fixture</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select the target group. Team 1 and Team 2 are strictly populated only from approved squads in that group.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  {/* 1. Group Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      1. Select Tournament Group <span className="text-[#74c004]">*</span>
                    </label>
                    <select
                      value={fixtureGroup}
                      onChange={(e) => setFixtureGroup(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#060b18] px-3.5 py-2.5 text-xs font-bold text-white uppercase focus:border-[#74c004] focus:outline-none"
                    >
                      {configuredGroupNames.map((g) => (
                        <option key={g} value={g} className="bg-[#060b18]">
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Team 1 Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      2. Team 1 ({fixtureGroup}) <span className="text-[#74c004]">*</span>
                    </label>
                    <select
                      required
                      value={fixtureTeam1}
                      onChange={(e) => setFixtureTeam1(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#060b18] px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                    >
                      <option value="" disabled>-- Choose Team 1 --</option>
                      {availableFixtureTeams.map((team) => (
                        <option key={team} value={team} className="bg-[#060b18]">
                          {team}
                        </option>
                      ))}
                    </select>
                    {availableFixtureTeams.length === 0 && (
                      <span className="text-[10px] text-amber-400 block mt-1">
                        ⚠️ No teams assigned to {fixtureGroup} yet. Assign teams in the &apos;Manage Groups&apos; tab.
                      </span>
                    )}
                  </div>

                  {/* 3. Team 2 Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      3. Team 2 ({fixtureGroup}) <span className="text-[#74c004]">*</span>
                    </label>
                    <select
                      required
                      value={fixtureTeam2}
                      onChange={(e) => setFixtureTeam2(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#060b18] px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                    >
                      <option value="" disabled>-- Choose Team 2 --</option>
                      {availableFixtureTeams
                        .filter((t) => t !== fixtureTeam1)
                        .map((team) => (
                          <option key={team} value={team} className="bg-[#060b18]">
                            {team}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* 4. Match Title / Round Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      4. Match Title / Round <span className="text-[#74c004]">*</span>
                    </label>
                    <select
                      value={fixtureMatchTitle}
                      onChange={(e) => setFixtureMatchTitle(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#060b18] px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                    >
                      {MATCH_TITLE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} className="bg-[#060b18]">
                          {opt}
                        </option>
                      ))}
                    </select>
                    {fixtureMatchTitle === 'Custom' && (
                      <input
                        type="text"
                        required
                        value={customMatchTitle}
                        onChange={(e) => setCustomMatchTitle(e.target.value)}
                        placeholder="e.g. Bronze Playoff, Warm-Up Match..."
                        className="mt-2 w-full rounded-xl border border-white/15 bg-[#060b18] px-3.5 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                      />
                    )}
                  </div>

                  {/* 5. Match Date (Clamped to Tournament Date Range) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        5. Match Date <span className="text-[#74c004]">*</span>
                      </label>
                      <span className="text-[10px] text-[#74c004] font-semibold">
                        Valid: {tournamentMinDate} to {tournamentMaxDate}
                      </span>
                    </div>
                    <input
                      type="date"
                      required
                      min={tournamentMinDate}
                      max={tournamentMaxDate}
                      value={fixtureDate}
                      onChange={(e) => setFixtureDate(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#060b18] px-3.5 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                    />
                  </div>

                  {/* 6. Match Time (Fast UX: Quick Type + AM/PM + Quick-Pick) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      6. Match Time <span className="text-[#74c004]">*</span>
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={fixtureTimeText}
                          onChange={(e) => handleTimeTextChange(e.target.value)}
                          placeholder="Type '8' or '8 30' or '08:30 AM'"
                          className="w-full rounded-xl border border-white/15 bg-[#060b18] px-3.5 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                        />
                        <div className="flex items-center rounded-xl border border-white/15 bg-[#060b18] p-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => syncTimeFromParts(fixtureHour, fixtureMinute, 'AM')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                              fixturePeriod === 'AM' ? 'bg-[#74c004] text-[#080e1e]' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            onClick={() => syncTimeFromParts(fixtureHour, fixtureMinute, 'PM')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                              fixturePeriod === 'PM' ? 'bg-[#74c004] text-[#080e1e]' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                        <span>Presets:</span>
                        {['07', '08', '09', '10', '11', '04', '06', '08'].map((hr, idx) => {
                          const period = idx < 5 ? 'AM' : 'PM'
                          return (
                            <button
                              key={`${hr}-${period}-${idx}`}
                              type="button"
                              onClick={() => syncTimeFromParts(hr, '00', period)}
                              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer"
                            >
                              {parseInt(hr, 10)}{period}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 7. Pitch / Ground */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      7. Arena Pitch / Venue Allotment
                    </label>
                    <input
                      type="text"
                      value={fixtureGround}
                      onChange={(e) => setFixtureGround(e.target.value)}
                      placeholder="e.g. Lush Turf Mira Road • Pitch 1"
                      className="w-full rounded-xl border border-white/15 bg-[#060b18] px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                    />
                  </div>

                </div>

                {/* Messages */}
                {fixtureSuccessMsg && (
                  <div className="p-3 rounded-xl bg-[#74c004]/10 border border-[#74c004]/30 text-xs text-[#74c004] font-bold">
                    {fixtureSuccessMsg}
                  </div>
                )}
                {fixtureErrorMsg && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-bold">
                    {fixtureErrorMsg}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setAdminTab('fixtures')}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={fixtureCreateLoading || availableFixtureTeams.length < 2}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#080e1e] shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {fixtureCreateLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Creating Fixture...</span>
                      </>
                    ) : (
                      <span>Schedule Official Fixture</span>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* 3. DYNAMIC GROUP DROPDOWN & VIEW FILTER BAR */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">

          {/* Dynamic Group Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Select Tournament Group
              </label>
              <div className="relative inline-flex items-center">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="rounded-xl border border-white/20 bg-[#0f182e] hover:border-[#74c004]/50 text-white font-display text-sm font-black uppercase tracking-wider pl-4 pr-10 py-2.5 shadow-lg focus:border-[#74c004] focus:outline-none cursor-pointer appearance-none min-w-[200px]"
                >
                  <option value="ALL" className="bg-[#0f182e]">ALL GROUPS ▼</option>
                  {configuredGroupNames.map((grp) => (
                    <option key={grp} value={grp} className="bg-[#0f182e]">
                      {grp} ▼
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 h-4 w-4 text-[#74c004] pointer-events-none" />
              </div>
            </div>

            {/* + Add Group button directly for admin */}
            {isAdmin && (
              <div className="self-end">
                <button
                  type="button"
                  onClick={() => setIsAddingGroup(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#74c004]/15 hover:bg-[#74c004]/25 border border-[#74c004]/40 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-[#74c004] transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                  <span>+ Add Group</span>
                </button>
              </div>
            )}

            {/* View Mode Toggle: Groups vs Matches */}
            <div className="self-end flex items-center p-1 rounded-xl bg-[#0f182e] border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('groups')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'groups'
                  ? 'bg-[#74c004] text-[#080e1e] shadow-md'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Groups Overview
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matches')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'matches'
                  ? 'bg-[#74c004] text-[#080e1e] shadow-md'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                View Matches ({filteredFixtures.length})
              </button>
            </div>
          </div>

          {/* Right Side Filters: Status & Pitch */}
          <div className="flex flex-wrap items-center gap-3 text-xs self-start sm:self-end">
            {/* Pitch Selector */}
            <div className="flex items-center gap-2 rounded-xl bg-[#0f182e] border border-white/10 px-3 py-1.5 text-slate-300">
              <span className="text-[10px] font-bold text-slate-400">COURT:</span>
              <select
                value={activeCourt}
                onChange={(e) => setActiveCourt(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none"
              >
                <option value="ALL" className="bg-[#0f182e]">All Pitches</option>
                <option value="PITCH 1" className="bg-[#0f182e]">Pitch 1 - North</option>
                <option value="PITCH 2" className="bg-[#0f182e]">Pitch 2 - South</option>
              </select>
            </div>

            {/* Status Selector */}
            <div className="flex items-center rounded-xl bg-[#0f182e] border border-white/10 p-1">
              <button
                type="button"
                onClick={() => setActiveStatus('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider cursor-pointer ${activeStatus === 'ALL' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                  }`}
              >
                ALL
              </button>
              <button
                type="button"
                onClick={() => setActiveStatus('LIVE')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer ${activeStatus === 'LIVE' ? 'bg-red-500 text-white' : 'text-red-400 hover:text-red-300'
                  }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                <span>LIVE</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStatus('UPCOMING')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider cursor-pointer ${activeStatus === 'UPCOMING' ? 'bg-amber-500 text-[#080e1e]' : 'text-amber-400 hover:text-amber-300'
                  }`}
              >
                UPCOMING
              </button>
              <button
                type="button"
                onClick={() => setActiveStatus('COMPLETED')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider cursor-pointer ${activeStatus === 'COMPLETED' ? 'bg-sky-500 text-[#080e1e]' : 'text-sky-400 hover:text-sky-300'
                  }`}
              >
                COMPLETED
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

        {/* VIEW MODE 1: GROUPS FIRST SHOWCASE */}
        {viewMode === 'groups' && (
          <div className="space-y-8 animate-in fade-in">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedGroups.map((grp) => {
                const groupMatches = fixtures.filter(
                  (f) => f.groupName?.toUpperCase() === grp.groupName.toUpperCase()
                )

                return (
                  <div
                    key={grp.groupName}
                    className="rounded-3xl border border-white/10 bg-[#0f182e] p-6 sm:p-7 shadow-xl space-y-5 hover:border-[#74c004]/30 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Group Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#74c004]/20 text-[#74c004] font-black">
                            🏏
                          </div>
                          <div>
                            <h3 className="font-display text-lg font-black uppercase text-white tracking-wide">
                              {grp.groupName}
                            </h3>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                              Tournament Group Bracket
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-black uppercase text-[#74c004]">
                            {grp.teams.length} Teams
                          </span>
                          {isAdmin && grp.teams.length === 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(grp.groupName)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title={`Delete empty ${grp.groupName}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Group Teams List */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                          Seeded Squads
                        </span>

                        {grp.teams.length === 0 ? (
                          <div className="rounded-2xl bg-[#080e1e] border border-white/5 p-5 text-center space-y-1">
                            <p className="text-xs font-bold text-slate-400">
                              No teams assigned yet.
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {isAdmin
                                ? 'Use the "Manage Groups" admin tool to allocate approved squads to this bracket.'
                                : 'Squad allocations will appear once finalized by organizers.'}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {grp.teams.map((teamName, idx) => {
                              const regInfo = registeredTeams.find(
                                (r) => r.teamName.trim().toLowerCase() === teamName.trim().toLowerCase()
                              )
                              return (
                                <div
                                  key={teamName}
                                  className="flex items-center justify-between p-3 rounded-xl bg-[#080e1e] border border-white/5 gap-2"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="font-mono text-[11px] font-bold text-[#74c004]">
                                      #{idx + 1}
                                    </span>
                                    {regInfo?.teamLogo ? (
                                      <img
                                        src={regInfo.teamLogo}
                                        alt={teamName}
                                        className="h-6 w-6 rounded-full object-cover border border-[#74c004]/40 shrink-0"
                                      />
                                    ) : (
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#74c004]/20 border border-[#74c004]/30 text-[#74c004] text-[9px] font-black shrink-0">
                                        {teamName.substring(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <span className="font-bold text-xs text-white uppercase truncate">
                                      {teamName}
                                    </span>
                                  </div>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      title={`Remove ${teamName} from ${grp.groupName}`}
                                      onClick={() => handleRemoveTeamFromGroup(grp.groupName, teamName)}
                                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 text-[10px] font-bold uppercase transition-colors shrink-0 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Group Action: View Group Matches Button */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">
                        {groupMatches.length} scheduled match(es)
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGroup(grp.groupName.toUpperCase())
                          setViewMode('matches')
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#080e1e] shadow-md transition-all hover:scale-105 cursor-pointer"
                      >
                        <span>View Group Matches</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Callout to View All Matches */}
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup('ALL')
                  setViewMode('matches')
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer"
              >
                <span>View All Match Fixtures ({fixtures.length})</span>
                <ArrowRight className="h-4 w-4 text-[#74c004]" />
              </button>
            </div>

          </div>
        )}

        {/* VIEW MODE 2: MATCH CARDS */}
        {viewMode === 'matches' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in">

            {/* LEFT 2/3: MATCH CARDS */}
            <div className="lg:col-span-8 space-y-4">

              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-12 text-center shadow-xl space-y-3">
                  <Loader2 className="h-8 w-8 text-[#74c004] animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Loading Tournament Fixtures...
                  </p>
                </div>
              ) : filteredFixtures.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-12 text-center shadow-xl space-y-4">
                  <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#74c004]/10 border border-[#74c004]/30 text-[#74c004]">
                      <Calendar className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display text-xl font-bold uppercase text-white tracking-wide">
                      No Fixtures Scheduled {selectedGroup !== 'ALL' ? `for ${selectedGroup}` : ''}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      {isAdmin
                        ? 'Click "Create Fixture" above to schedule matches between approved teams.'
                        : 'Official match fixtures will appear here once released.'}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminTab('create-fixture')
                          if (selectedGroup !== 'ALL') setFixtureGroup(selectedGroup)
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#080e1e] shadow-md transition-all cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Schedule New Fixture</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* DYNAMIC FIXTURE CARDS */
                filteredFixtures.map((fixture) => {
                  const isLive = fixture.status?.toUpperCase() === 'LIVE'
                  const isCompleted = fixture.status?.toUpperCase() === 'COMPLETED'
                  const isStopped = fixture.status?.toUpperCase() === 'STOPPED'

                  return (
                    <div
                      key={fixture._id}
                      className={`rounded-2xl border bg-[#0f182e] p-5 shadow-xl transition-all space-y-4 ${isLive
                        ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                        : isStopped
                        ? 'border-amber-500/40 bg-amber-950/10'
                        : 'border-white/10 hover:border-white/20'
                        }`}
                    >
                      {/* Top Row: Match Title, Group, Ground, Match Status */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs pb-3 border-b border-white/10">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#74c004]/20 border border-[#74c004]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#74c004]">
                            {fixture.matchTitle || fixture.round || 'GROUP STAGE MATCH'}
                          </span>
                          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                            {fixture.groupName}
                          </span>
                          {fixture.ground && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fixture.ground)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-slate-400 hover:text-[#74c004] text-xs font-semibold transition-colors cursor-pointer"
                              title="Open venue in Google Maps"
                            >
                              <MapPin className="h-3 w-3 text-[#74c004]" />
                              <span>{fixture.ground}</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isLive ? (
                            <span className="flex items-center gap-1.5 rounded-full bg-red-500 text-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              <span>LIVE</span>
                            </span>
                          ) : isCompleted ? (
                            <span className="rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-0.5 text-[10px] font-bold uppercase">
                              COMPLETED
                            </span>
                          ) : isStopped ? (
                            <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
                              <ShieldAlert className="h-3 w-3 text-amber-400" />
                              <span>STOPPED</span>
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 text-[10px] font-bold uppercase">
                              UPCOMING
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Teams Encounter */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center py-2">

                        {/* Team 1 */}
                        <div className="sm:col-span-5 flex items-center gap-3">
                          {fixture.team1Logo ? (
                            <img
                              src={fixture.team1Logo}
                              alt={fixture.team1}
                              className="h-10 w-10 rounded-xl object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-xs font-black text-[#74c004] shrink-0">
                              {fixture.team1.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="truncate">
                            <h4 className="font-display text-base font-black uppercase text-white truncate">
                              {fixture.team1}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                              Approved Squad
                            </span>
                          </div>
                        </div>

                        {/* VS Divider & Time */}
                        <div className="sm:col-span-2 text-center space-y-1">
                          <span className="font-display font-black text-sm text-[#74c004] bg-[#74c004]/10 border border-[#74c004]/30 px-2.5 py-0.5 rounded-md">
                            VS
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {fixture.time}
                          </span>
                        </div>

                        {/* Team 2 */}
                        <div className="sm:col-span-5 flex items-center justify-start sm:justify-end gap-3 text-left sm:text-right">
                          <div className="truncate">
                            <h4 className="font-display text-base font-black uppercase text-white truncate">
                              {fixture.team2}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                              Approved Squad
                            </span>
                          </div>
                          {fixture.team2Logo ? (
                            <img
                              src={fixture.team2Logo}
                              alt={fixture.team2}
                              className="h-10 w-10 rounded-xl object-cover border border-white/10 shrink-0 order-first sm:order-last"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-xs font-black text-[#74c004] shrink-0 order-first sm:order-last">
                              {fixture.team2.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Bottom: Date & Match Start Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-[#74c004]" />
                          <span>{fixture.date}</span>
                          <span>•</span>
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{fixture.time}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                          {/* 1. If LIVE */}
                          {fixture.status?.toUpperCase() === 'LIVE' && (
                            <Link
                              href={`/tournaments/${tournamentId}?tab=scoring&matchId=${fixture.matchId}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-300 transition-colors animate-pulse"
                            >
                              <Radio className="h-3 w-3 text-red-400" />
                              <span>{isAdmin ? 'Score Live ⚡' : 'Live Score'}</span>
                            </Link>
                          )}

                          {/* 2. If UPCOMING: Start Match (Admin only) */}
                          {fixture.status?.toUpperCase() === 'UPCOMING' && (
                            <>
                              {isAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => setFixtureForSetup(fixture)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#74c004] hover:bg-[#86dc05] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#080e1e] shadow-md shadow-[#74c004]/20 transition-all cursor-pointer hover:scale-105"
                                >
                                  <span>Start Match 🏏</span>
                                </button>
                              ) : (
                                <Link
                                  href={`/tournaments/${tournamentId}?tab=scoring&matchId=${fixture.matchId}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 transition-colors"
                                >
                                  <span>Preview</span>
                                </Link>
                              )}
                            </>
                          )}

                          {/* 3. If COMPLETED */}
                          {fixture.status?.toUpperCase() === 'COMPLETED' && (
                            <Link
                              href={`/tournaments/${tournamentId}?tab=scoring&matchId=${fixture.matchId}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-300 transition-colors"
                            >
                              <CheckCircle2 className="h-3 w-3 text-sky-400" />
                              <span>Scorecard</span>
                            </Link>
                          )}

                          {/* 4. If STOPPED */}
                          {isStopped && (
                            <Link
                              href={`/tournaments/${tournamentId}?tab=scoring&matchId=${fixture.matchId}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 transition-colors"
                            >
                              <ShieldAlert className="h-3 w-3 text-amber-400" />
                              <span>Stopped Match</span>
                            </Link>
                          )}

                          {/* Admin Action Controls */}
                          {isAdmin && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteFixture(fixture._id)}
                                className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 transition-colors cursor-pointer"
                                title="Delete Fixture"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

            </div>


          </div>
        )}

        {/* MATCH SETUP MODAL (ADMIN START MATCH) */}
        {fixtureForSetup && (
          <MatchSetupModal
            matchId={fixtureForSetup.matchId || ''}
            team1={fixtureForSetup.team1}
            team2={fixtureForSetup.team2}
            team1Logo={fixtureForSetup.team1Logo}
            team2Logo={fixtureForSetup.team2Logo}
            team1AvailablePlayers={
              (registeredTeams.find(
                (r) => r.teamName.trim().toLowerCase() === fixtureForSetup.team1.trim().toLowerCase()
              )?.players || []).map((p) => ({
                name: p.name,
                role: p.role || 'Player',
                isSubstitute: !!p.isSubstitute,
              }))
            }
            team2AvailablePlayers={
              (registeredTeams.find(
                (r) => r.teamName.trim().toLowerCase() === fixtureForSetup.team2.trim().toLowerCase()
              )?.players || []).map((p) => ({
                name: p.name,
                role: p.role || 'Player',
                isSubstitute: !!p.isSubstitute,
              }))
            }
            onClose={() => setFixtureForSetup(null)}
            onSuccess={(_newSession) => {
              const activeMatchId = fixtureForSetup.matchId
              setFixtureForSetup(null)
              loadData()
              router.push(`/tournaments/${tournamentId}?tab=scoring&matchId=${activeMatchId}`)
            }}
          />
        )}

      </div>
    </div>
  )
}
