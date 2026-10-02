import { apiFetch } from './api';

export type Event = {
  _id: string;
  title: string;
  sport: string;
  description: string;
  location: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  registrationFee: number;
  maxTeams: number;
  bannerImage?: string | null;
  rules?: string;
  rulebookPdf?: string | null;
  rulebookFileName?: string | null;
  rulebookUpdatedAt?: string | null;
  prizes: string;
  status: string;
};

export type RegistrationCount = {
  registeredTeams: number;
  maxTeams: number;
  totalSubmitted?: number;
};

export async function getEvents(filters?: { sport?: string; status?: string }) {
  const query = new URLSearchParams();
  if (filters?.sport) query.set('sport', filters.sport);
  if (filters?.status) query.set('status', filters.status);
  const qs = query.toString();
  return apiFetch<Event[]>(`/api/v1/events${qs ? `?${qs}` : ''}`);
}

export async function getEvent(id: string) {
  return apiFetch<Event>(`/api/v1/events/${id}`);
}

export async function createAdminEvent(data: Record<string, any> | FormData) {
  return apiFetch<Event>('/api/v1/admin/events', {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}

export async function updateAdminEvent(id: string, data: Record<string, any> | FormData) {
  return apiFetch<Event>(`/api/v1/admin/events/${id}`, {
    method: 'PATCH',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}

export async function deleteAdminEvent(id: string) {
  return apiFetch<{ success: boolean }>(`/api/v1/admin/events/${id}`, {
    method: 'DELETE',
  });
}

export async function getEventRegistrationCount(eventId: string) {
  return apiFetch<RegistrationCount>(`/api/v1/events/${eventId}/registrations/count`);
}

export async function uploadEventRulebook(eventId: string, file: File) {
  const formData = new FormData();
  formData.append('rulebook', file);
  return apiFetch<Event>(`/api/v1/admin/events/${eventId}/rulebook`, {
    method: 'POST',
    body: formData,
  });
}

export async function deleteEventRulebook(eventId: string) {
  return apiFetch<Event>(`/api/v1/admin/events/${eventId}/rulebook`, {
    method: 'DELETE',
  });
}

export type LiveStatusResponse = {
  isLive: boolean;
  activeEventId?: string | null;
  activeMatchId?: string | null;
  liveFixture?: {
    _id: string;
    team1: string;
    team2: string;
    tournamentId: string;
  } | null;
  liveEvent?: {
    _id: string;
    title: string;
    sport: string;
    slug?: string;
  } | null;
  liveEvents?: Array<{
    _id: string;
    title: string;
    sport: string;
    slug?: string;
  }>;
};

export async function getLiveEventStatus() {
  return apiFetch<LiveStatusResponse>('/api/v1/events/live-status');
}

export type RegistrationPayload = {
  registrationId?: string;
  teamName: string;
  teamLogo?: string | null;
  captainName: string;
  captainEmail: string;
  captainPhone?: string;
  whatsappNumber?: string;
  sport?: string;
  message?: string;
  eventId?: string;
  transactionId?: string;
  paymentAmount?: number;
  paymentProof?: string | null;
  players?: Array<{ name: string; role?: string; isSubstitute?: boolean }>;
};

export async function submitRegistration(data: RegistrationPayload | FormData) {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return apiFetch<AdminRegistrationItem>('/api/v1/registrations', {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function getMyRegistrations() {
  return apiFetch<AdminRegistrationItem[]>('/api/v1/registrations/my-registrations');
}

export async function getRegistrationStatus(identifier: string) {
  return apiFetch<AdminRegistrationItem>(`/api/v1/registrations/status/${encodeURIComponent(identifier)}`);
}

export type AdminRegistrationItem = {
  _id: string;
  registrationId?: string;
  teamName: string;
  teamLogo?: string | null;
  captainName: string;
  captainEmail: string;
  captainPhone?: string;
  whatsappNumber?: string;
  department?: string;
  sport?: string;
  message?: string;
  players?: Array<{ name: string; role?: string; isSubstitute?: boolean }>;
  playerCount?: number;
  paymentAmount?: number;
  transactionId?: string;
  paymentProof?: string | null;
  paymentStatus: 'pending' | 'verified' | 'rejected';
  registrationStatus: 'pending' | 'approved' | 'rejected';
  verifiedBy?: { _id: string; username: string; email: string } | null;
  verifiedAt?: string | null;
  rejectionReason?: string;
  createdAt: string;
  eventId?: { _id: string; title: string; sport: string; venue: string; registrationFee?: number } | null;
};

export async function getAdminRegistrations(filters?: { eventId?: string; paymentStatus?: string; registrationStatus?: string }) {
  const query = new URLSearchParams();
  if (filters?.eventId) query.set('eventId', filters.eventId);
  if (filters?.paymentStatus) query.set('paymentStatus', filters.paymentStatus);
  if (filters?.registrationStatus) query.set('registrationStatus', filters.registrationStatus);

  const qs = query.toString();
  return apiFetch<AdminRegistrationItem[]>(`/api/v1/admin/registrations${qs ? `?${qs}` : ''}`);
}

export async function verifyAdminPayment(id: string) {
  return apiFetch<AdminRegistrationItem>(`/api/v1/admin/registrations/${id}/verify-payment`, {
    method: 'PATCH',
  });
}

export async function rejectAdminPayment(id: string, reason?: string) {
  return apiFetch<AdminRegistrationItem>(`/api/v1/admin/registrations/${id}/reject-payment`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function approveAdminRegistration(id: string) {
  return apiFetch<AdminRegistrationItem>(`/api/v1/admin/registrations/${id}/approve`, {
    method: 'PATCH',
  });
}

export async function rejectAdminRegistration(id: string, reason?: string) {
  return apiFetch<AdminRegistrationItem>(`/api/v1/admin/registrations/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function deleteAdminRegistration(id: string) {
  return apiFetch<{ success: boolean }>(`/api/v1/admin/registrations/${id}`, {
    method: 'DELETE',
  });
}

export type Highlight = {
  _id: string;
  title: string;
  description?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnail?: string | null;
};

export async function getHighlights() {
  return apiFetch<Highlight[]>('/api/v1/highlights');
}

const sportLabels: Record<string, string> = {
  football: 'Football',
  cricket: 'Cricket',
  badminton: 'Badminton',
  basketball: 'Basketball',
  volleyball: 'Volleyball',
  other: 'Other',
};

export function formatSport(sport: string) {
  return sportLabels[sport] || sport;
}

export function formatEventDates(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (start.toDateString() === end.toDateString()) {
    return formatter.format(start);
  }

  const startPart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(start);

  const endPart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(end);

  return `${startPart}–${endPart}, ${end.getFullYear()}`;
}

export function getTournamentCountdown(startDate: string | Date, endDate?: string | Date): {
  status: 'upcoming' | 'live' | 'completed';
  statusText: string;
  badgeClass: string;
} {
  const now = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);

  // Completed
  if (now > end) {
    return {
      status: 'completed',
      statusText: 'Completed',
      badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    };
  }

  // Live / In Progress
  if (now >= start && now <= end) {
    const diffMs = end.getTime() - now.getTime();
    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft >= 1) {
      return {
        status: 'live',
        statusText: `Live • ${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining`,
        badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse',
      };
    }

    return {
      status: 'live',
      statusText: `Live • ${Math.max(1, hoursLeft)} hr${hoursLeft > 1 ? 's' : ''} remaining`,
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse',
    };
  }

  // Upcoming
  const diffMs = start.getTime() - now.getTime();
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const hoursUntil = Math.ceil(diffMs / (1000 * 60 * 60));

  if (daysUntil > 1) {
    return {
      status: 'upcoming',
      statusText: `Starts in ${daysUntil} days`,
      badgeClass: 'bg-[#74c004]/20 text-[#74c004] border-[#74c004]/30',
    };
  } else if (daysUntil === 1) {
    return {
      status: 'upcoming',
      statusText: 'Starts tomorrow',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    };
  } else {
    return {
      status: 'upcoming',
      statusText: `Starts in ${Math.max(1, hoursUntil)} hrs`,
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    };
  }
}

export function formatStatus(status: string, registeredTeams = 0, maxTeams = 0, startDate?: string, endDate?: string) {
  if (startDate) {
    const countdown = getTournamentCountdown(startDate, endDate);
    if (countdown.status === 'live' || countdown.status === 'completed') {
      return countdown.statusText;
    }
  }

  if (status === 'registration_open') {
    if (maxTeams > 0 && registeredTeams >= maxTeams * 0.85) {
      return 'Few spots left';
    }
    return 'Registering';
  }

  const labels: Record<string, string> = {
    upcoming: 'Coming soon',
    registration_closed: 'Registration closed',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return labels[status] || status;
}

export function mapContactSportToBackend(sport: string) {
  const normalized = sport.toLowerCase();
  if (normalized.includes('football') || normalized.includes('futsal')) return 'football';
  if (normalized.includes('cricket')) return 'cricket';
  if (normalized.includes('badminton')) return 'badminton';
  if (normalized.includes('basketball')) return 'basketball';
  if (normalized.includes('volleyball')) return 'volleyball';
  return 'other';
}

export type RegisteredTeam = {
  _id: string;
  teamName: string;
  teamLogo?: string | null;
  captainName: string;
  captainEmail: string;
  captainPhone?: string;
  sport?: string;
  players?: Array<{ name: string; role?: string; isSubstitute?: boolean }>;
  playerCount?: number;
  registrationStatus?: string;
  paymentStatus?: string;
  createdAt?: string;
};

export type TournamentGroup = {
  _id?: string;
  tournamentId: string;
  groupName: string;
  teams: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type Fixture = {
  _id: string;
  tournamentId: string;
  groupName: string;
  matchTitle?: string;
  round?: string;
  matchNumber?: number;
  team1: string;
  team1Logo?: string | null;
  team2: string;
  team2Logo?: string | null;
  date: string;
  time: string;
  ground: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'STOPPED' | 'upcoming' | 'live' | 'completed' | 'stopped';
  score?: {
    team1Runs: number;
    team1Wickets: number;
    team1Overs: string;
    team2Runs: number;
    team2Wickets: number;
    team2Overs: string;
  };
  result?: string;
  matchId?: string;
  createdAt?: string;
};

export async function getRegisteredTeams(tournamentId: string) {
  return apiFetch<RegisteredTeam[]>(`/api/v1/tournaments/${tournamentId}/registered-teams`);
}

export async function getTournamentGroups(tournamentId: string) {
  return apiFetch<TournamentGroup[]>(`/api/v1/tournaments/${tournamentId}/groups`);
}

export async function createTournamentGroup(tournamentId: string, groupName: string) {
  return apiFetch<TournamentGroup>(`/api/v1/tournaments/${tournamentId}/groups/create`, {
    method: 'POST',
    body: JSON.stringify({ groupName }),
  });
}

export async function deleteTournamentGroup(tournamentId: string, groupName: string) {
  return apiFetch<{ success: boolean }>(`/api/v1/tournaments/${tournamentId}/groups/${encodeURIComponent(groupName)}`, {
    method: 'DELETE',
  });
}

export async function saveTournamentGroup(tournamentId: string, groupName: string, teams: string[]) {
  return apiFetch<TournamentGroup>(`/api/v1/tournaments/${tournamentId}/groups`, {
    method: 'POST',
    body: JSON.stringify({ groupName, teams }),
  });
}

export async function assignTournamentGroupTeam(
  tournamentId: string,
  groupName: string,
  teamName: string
) {
  return apiFetch<TournamentGroup>(
    `/api/v1/tournaments/${tournamentId}/groups/${encodeURIComponent(groupName)}/teams`,
    {
      method: 'POST',
      body: JSON.stringify({ teamName }),
    }
  );
}

export async function removeTournamentGroupTeam(
  tournamentId: string,
  groupName: string,
  teamName: string
) {
  return apiFetch<TournamentGroup>(
    `/api/v1/tournaments/${tournamentId}/groups/${encodeURIComponent(groupName)}/teams/${encodeURIComponent(teamName)}`,
    {
      method: 'DELETE',
    }
  );
}

export async function getTournamentFixtures(
  tournamentId: string,
  filters?: { groupName?: string; status?: string; ground?: string }
) {
  const query = new URLSearchParams();
  if (filters?.groupName && filters.groupName !== 'ALL') query.set('groupName', filters.groupName);
  if (filters?.status && filters.status !== 'ALL') query.set('status', filters.status);
  if (filters?.ground && filters.ground !== 'ALL') query.set('ground', filters.ground);

  const qs = query.toString();
  return apiFetch<Fixture[]>(`/api/v1/tournaments/${tournamentId}/fixtures${qs ? `?${qs}` : ''}`);
}

export async function createTournamentFixture(
  tournamentId: string,
  data: {
    groupName: string;
    team1: string;
    team2: string;
    date: string;
    time: string;
    matchTitle?: string;
    round?: string;
    ground?: string;
    status?: string;
  }
) {
  return apiFetch<Fixture>(`/api/v1/tournaments/${tournamentId}/fixtures`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTournamentFixture(
  tournamentId: string,
  fixtureId: string,
  data: Partial<Fixture>
) {
  return apiFetch<Fixture>(`/api/v1/tournaments/${tournamentId}/fixtures/${fixtureId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTournamentFixture(tournamentId: string, fixtureId: string) {
  return apiFetch<{ success: boolean }>(`/api/v1/tournaments/${tournamentId}/fixtures/${fixtureId}`, {
    method: 'DELETE',
  });
}

export type PointsTableEntry = {
  team: string;
  teamLogo?: string | null;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  runsScored?: number;
  oversFaced?: string;
  runsConceded?: number;
  oversBowled?: string;
  nrr: string;
};

export type GroupPointsTable = {
  groupName: string;
  standings: PointsTableEntry[];
};

export async function getTournamentPointsTable(tournamentId: string) {
  return apiFetch<GroupPointsTable[]>(`/api/v1/tournaments/${tournamentId}/points-table`);
}

export type LeaderboardCategory = 'batting' | 'bowling' | 'fielding' | 'mvp';

export type LeaderboardEntry = {
  rank: number;
  player: string;
  team: string;
  role?: string;
  value: number;
  displayValue: string;
  qualified: boolean;
  lowerIsBetter?: boolean;
  supporting: {
    innings?: number;
    runs?: number;
    balls?: number;
    fours?: number;
    sixes?: number;
    strikeRate?: string;
    average?: string;
    overs?: string;
    runsConceded?: number;
    wickets?: number;
    economy?: string;
    maidens?: number;
    dotBalls?: number;
    catches?: number;
    stumpings?: number;
    directRunOuts?: number;
    assistedRunOuts?: number;
    totalDismissals?: number;
    battingImpact?: number;
    bowlingImpact?: number;
    fieldingImpact?: number;
  };
};

export type LeaderboardResponse = {
  tournamentId: string;
  category: string;
  statistic: string;
  team: string;
  standings: LeaderboardEntry[];
};

export async function getTournamentLeaderboard(
  tournamentId: string,
  params?: { category?: string; statistic?: string; team?: string }
) {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.statistic) query.set('statistic', params.statistic);
  if (params?.team) query.set('team', params.team);

  const qs = query.toString();
  return apiFetch<LeaderboardResponse>(`/api/v1/tournaments/${tournamentId}/leaderboard${qs ? `?${qs}` : ''}`);
}


