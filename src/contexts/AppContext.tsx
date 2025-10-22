import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Team, Repository, Issue } from '@/types';
import { toast } from 'sonner';
import {
  getAllTeams,
  getAllRepositories,
  getAllIssues,
  subscribeToTeams,
  subscribeToRepositories,
  subscribeToIssues,
  updateTeam,
  createRepository as createRepoInDb,
  deleteRepository as deleteRepoFromDb,
  createIssue as createIssueInDb,
  updateIssue as updateIssueInDb,
  deleteIssue as deleteIssueFromDb,
  initializeTeams,
  initializeRepositories,
  occupyIssueTransaction
} from '@/services/firebaseService';

interface AppContextType {
  currentTeam: Team | null;
  teams: Team[];
  repositories: Repository[];
  issues: Issue[];
  isAdmin: boolean;
  loginTeam: (teamName: string, password: string) => { success: boolean; error?: string };
  logoutTeam: () => void;
  loginAdmin: (username: string, password: string) => boolean;
  logoutAdmin: () => void;
  addRepository: (repo: Repository) => Promise<void>;
  deleteRepository: (name: string) => Promise<void>;
  addIssue: (issue: Omit<Issue, 'id' | 'status' | 'assignedTo'>) => Promise<void>;
  occupyIssue: (issueId: string) => Promise<{ success: boolean; error?: string }>;
  closeIssue: (issueId: string, prUrl: string) => { success: boolean; error?: string };
  moveIssue: (issueId: string, status: Issue['status']) => Promise<void>;
  updatePrStatus: (issueId: string, status: 'approved' | 'merged' | 'rejected') => Promise<void>;
  awardPoints: (teamName: string, points: number) => Promise<void>;
  assignIssue: (issueId: string, teamName: string | null) => Promise<void>;
  deleteIssue: (issueId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ALLOWED_TEAMS = ["123", "TeamBravo", "TeamCharlie", "TeamDelta"];

// Team passwords
const TEAM_PASSWORDS: { [key: string]: string } = {
  "123": "123",
  "TeamBravo": "bravo123",
  "TeamCharlie": "charlie123",
  "TeamDelta": "delta123",
};

const INITIAL_REPOSITORIES: Repository[] = [
  { name: "awesome-repo", url: "https://github.com/example/awesome-repo" },
  { name: "ui-kit", url: "https://github.com/example/ui-kit" },
  { name: "lib-helpers", url: "https://github.com/example/lib-helpers" },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Firebase data on first load
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check if teams exist
        const existingTeams = await getAllTeams();
        
        if (existingTeams.length === 0) {
          // Initialize teams
          await initializeTeams(ALLOWED_TEAMS);
        } else {
          // Reset all active states on app load (handle stale sessions)
          for (const team of existingTeams) {
            if (team.active) {
              await updateTeam(team.name, { active: false });
            }
          }
        }

        // Check if repositories exist
        const existingRepos = await getAllRepositories();
        
        if (existingRepos.length === 0) {
          // Initialize repositories
          await initializeRepositories(INITIAL_REPOSITORIES);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error(`Failed to initialize data: ${error.message}`);
      }
    };

    initializeData();
  }, []);

  // Temporary global pointerdown logger for debugging desktop click interception
  useEffect(() => {
    const DEBUG_UI = true;
    if (!DEBUG_UI) return;

    const onPointerDown = (e: PointerEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        const desc = target ? `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ''}${target.className ? `.${target.className.split(' ').slice(0,3).join('.')}` : ''}` : 'unknown';
        console.log('[UI-TRACE] pointerdown on', desc);
      } catch (err) {
        // ignore
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        const desc = target ? `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ''}${target.className ? `.${target.className.split(' ').slice(0,3).join('.')}` : ''}` : 'unknown';
        console.log('[UI-TRACE] pointerup on', desc);
      } catch (err) {}
    };

    const onClickCapture = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        const desc = target ? `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ''}${target.className ? `.${target.className.split(' ').slice(0,3).join('.')}` : ''}` : 'unknown';
        console.log('[UI-TRACE] click capture on', desc, 'defaultPrevented=', e.defaultPrevented);
        // log the first few nodes in the composedPath for inspection
        const path = (e.composedPath && (e.composedPath() as EventTarget[])) || [];
        if (path.length) {
          const brief = path.slice(0,5).map(p => {
            try {
              const el = p as HTMLElement;
              return el && el.tagName ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className ? `.${(el.className as string).split(' ').slice(0,3).join('.')}` : ''}` : String(p);
            } catch (err) { return String(p); }
          });
          console.log('[UI-TRACE] click path sample:', brief);
        }
      } catch (err) {}
    };

    window.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('pointerup', onPointerUp, { capture: true });
    window.addEventListener('click', onClickCapture, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointerup', onPointerUp, { capture: true });
      window.removeEventListener('click', onClickCapture, { capture: true });
    };
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribeTeams = subscribeToTeams((updatedTeams) => {
      setTeams(updatedTeams);
      // Update current team if logged in
      if (currentTeam) {
        const updated = updatedTeams.find(t => t.name === currentTeam.name);
        if (updated) {
          setCurrentTeam(updated);
        }
      }
    });

    const unsubscribeRepos = subscribeToRepositories(setRepositories);
    const unsubscribeIssues = subscribeToIssues(setIssues);

    return () => {
      unsubscribeTeams();
      unsubscribeRepos();
      unsubscribeIssues();
    };
  }, [isInitialized, currentTeam]);

  // Check for expired issues
  useEffect(() => {
    const checkExpiredIssues = async () => {
      const now = Date.now();
      const timeouts = {
        easy: 20 * 60 * 1000,   // 20 minutes
        medium: 40 * 60 * 1000, // 40 minutes
        hard: 60 * 60 * 1000    // 60 minutes
      };

      for (const issue of issues) {
        if (issue.status === 'occupied' && issue.occupiedAt && issue.assignedTo) {
          const tag = issue.tags[0] as keyof typeof timeouts;
          const timeLimit = timeouts[tag] || timeouts.medium;
          const elapsed = now - issue.occupiedAt;

          if (elapsed >= timeLimit) {
            // Time expired - deduct points and reset issue
            const penalties = { easy: 5, medium: 10, hard: 15 };
            const penalty = penalties[tag] || 0;

            // Deduct points from team
            const team = teams.find(t => t.name === issue.assignedTo);
            if (team) {
              const newPoints = Math.max(0, team.points - penalty);
              await updateTeam(team.name, { points: newPoints });
              toast.error(`⏰ Time expired for "${issue.title}"! ${penalty} points deducted from ${team.name}.`);
            }

            // Reset issue
            await updateIssueInDb(issue.id, {
              status: 'open',
              assignedTo: null,
              occupiedAt: null,
              closedAt: null
            });
          }
        }
      }
    };

    const interval = setInterval(checkExpiredIssues, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [issues, teams]);

  const loginTeam = (teamName: string, password: string) => {
    if (!ALLOWED_TEAMS.includes(teamName)) {
      return { success: false, error: 'Team not recognized. Contact admin.' };
    }

    if (TEAM_PASSWORDS[teamName] !== password) {
      return { success: false, error: 'Invalid password. Please check your team password.' };
    }

    const isActive = teams.some(t => t.name === teamName && t.active);
    if (isActive) {
      return { success: false, error: 'This team is already active. Only one active session allowed.' };
    }

    const team = teams.find(t => t.name === teamName);
    if (team) {
      setCurrentTeam(team);
      updateTeam(teamName, { active: true });
      return { success: true };
    }

    return { success: false, error: 'Team not found.' };
  };

  const logoutTeam = async () => {
    if (currentTeam) {
      await updateTeam(currentTeam.name, { active: false });
      setCurrentTeam(null);
    }
  };

  const loginAdmin = (username: string, password: string) => {
    if (username === 'dvadmin' && password === '2025') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
  };

  const addRepository = async (repo: Repository) => {
    await createRepoInDb(repo);
    toast.success('Repository added successfully!');
  };

  const deleteRepository = async (name: string) => {
    const repo = repositories.find(r => r.name === name);
    if (repo && repo.id) {
      await deleteRepoFromDb(repo.id);
      toast.success('Repository deleted!');
    }
  };

  const addIssue = async (issue: Omit<Issue, 'id' | 'status' | 'assignedTo'>) => {
    await createIssueInDb({ ...issue, status: 'open', assignedTo: null });
    toast.success('Issue added successfully!');
  };

  const occupyIssue = async (issueId: string) => {
    if (!currentTeam) {
      return { success: false, error: 'You must be logged in to occupy an issue.' };
    }
    console.log('[DEBUG] AppContext.occupyIssue called for', issueId, 'by team', currentTeam.name);

    // Avoid running the transaction when the client is offline — Firestore will queue
    // writes but our UX depends on a quick response, and the logs show net::ERR_INTERNET_DISCONNECTED
    // causing long waits. Provide clear feedback instead of timing out.
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      console.warn('[DEBUG] Occupy aborted: offline');
      toast.error('No internet connection — please reconnect and try again.');
      return { success: false, error: 'No internet connection' };
    }

    // Fast local pre-checks to avoid starting network transactions when we can
    // determine the result locally (faster UX and avoids hangs when offline)
    const issue = issues.find(i => i.id === issueId);
    if (!issue) {
      console.warn('[DEBUG] Occupy aborted: issue not found locally for', issueId);
      return { success: false, error: 'Issue not found.' };
    }

    if (issue.status !== 'open') {
      console.warn('[DEBUG] Occupy aborted: issue not open for', issueId, 'status=', issue.status);
      return { success: false, error: `This issue is already ${issue.status}. Please choose another issue.` };
    }

    const teamOccupiedCount = issues.filter(i => i.assignedTo === currentTeam.name && i.status === 'occupied').length;
    if (teamOccupiedCount >= 3) {
      console.warn('[DEBUG] Occupy aborted: team already has 3 occupied issues for', currentTeam.name);
      return { success: false, error: 'Your team has already occupied 3 issues. Please close an issue before occupying a new one.' };
    }

    // Optimistic UI: update local issues immediately so the UI feels snappy
    // Clone previousIssues to make revert safe against in-place mutations
    const previousIssues = [...issues];
    const now = Date.now();
    setIssues((prev) => prev.map(i => i.id === issueId ? {
      ...i,
      status: 'occupied',
      assignedTo: currentTeam.name,
      occupiedAt: now
    } : i));

    // Wrap transaction with a timeout to avoid hanging the UI indefinitely
    const TIMEOUT_MS = 10000; // 10 seconds

  console.log('[DEBUG] Starting occupyIssueTransaction for', issueId);

  // Try the transaction with a single retry for transient failures
  const MAX_RETRIES = 1; // one retry
  let attempt = 0;

  const attemptTransaction = async (): Promise<{ success: boolean; error?: string }> => {
    while (attempt <= MAX_RETRIES) {
      attempt += 1;
      console.log('[DEBUG] occupyIssue: transaction attempt', attempt, 'for', issueId);

      const transactionPromise: Promise<{ success: boolean; error?: string }> = occupyIssueTransaction(issueId, currentTeam.name);

      const wrapped = new Promise<{ success: boolean; error?: string }>(async (resolve) => {
        const timer = setTimeout(() => {
          console.warn('[DEBUG] AppContext.occupyIssue timed out for', issueId, 'attempt', attempt);
          resolve({ success: false, error: 'Transaction timed out. Please try again.' });
        }, TIMEOUT_MS);

        try {
          const res = await transactionPromise;
          clearTimeout(timer);
          resolve(res);
        } catch (err: any) {
          clearTimeout(timer);
          resolve({ success: false, error: err?.message || 'Transaction failed' });
        }
      });

      const res = await wrapped;
      // If success, or the error is not transient, return immediately
      if (res.success) return res;

      const errMsg = (res.error || '').toLowerCase();
      const transientIndicators = ['timed out', 'network', 'transport errored', 'could not reach', 'err_internet_disconnected', 'err_network_changed', 'quic'];
      const isTransient = transientIndicators.some(ind => errMsg.includes(ind));

      if (!isTransient) {
        // Non-transient error (e.g., already occupied, team limit) — do not retry
        return res;
      }

      if (attempt <= MAX_RETRIES) {
        // small backoff before retrying
        const backoff = 500 * attempt;
        console.log('[DEBUG] occupyIssue: transient failure, backing off', backoff, 'ms before retry for', issueId);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }

    return { success: false, error: 'Transaction failed after retries. Please check your connection and try again.' };
  };

  const result = await attemptTransaction();
  console.log('[DEBUG] Finished occupyIssueTransaction for', issueId, 'result=', result);
    console.log('[DEBUG] AppContext.occupyIssue transaction result for', issueId, result);

    if (!result.success) {
      // Revert optimistic update on failure
      console.log('[DEBUG] Reverting optimistic occupy for', issueId);
      setIssues(previousIssues);
    }

    return result;
  };

  const closeIssue = (issueId: string, prUrl: string) => {
    if (!prUrl || !prUrl.trim()) {
      return { success: false, error: 'PR URL is required' };
    }

    updateIssueInDb(issueId, {
      status: 'closed',
      closedAt: Date.now(),
      prUrl: prUrl.trim(),
      prStatus: 'pending'
    });

    return { success: true };
  };

  const moveIssue = async (issueId: string, status: Issue['status']) => {
    await updateIssueInDb(issueId, { status });
    toast.success('Issue status updated!');
  };

  const updatePrStatus = async (issueId: string, status: 'approved' | 'merged' | 'rejected') => {
    await updateIssueInDb(issueId, { prStatus: status });

    // If PR is merged, award points
    if (status === 'merged') {
      const issue = issues.find(i => i.id === issueId);
      if (issue && issue.assignedTo) {
        const pointsMap = { easy: 10, medium: 20, hard: 30 };
        const tag = issue.tags[0] as keyof typeof pointsMap;
        const points = pointsMap[tag] || 0;

        const team = teams.find(t => t.name === issue.assignedTo);
        if (team) {
          await updateTeam(team.name, { points: team.points + points });
          toast.success(`${issue.assignedTo} awarded ${points} points for ${issue.title}!`);
        }
      }
    } else if (status === 'rejected') {
      toast.error('PR rejected. Team will not receive points.');
    } else if (status === 'approved') {
      toast.success('PR approved! Waiting for merge.');
    }
  };

  const awardPoints = async (teamName: string, points: number) => {
    const team = teams.find(t => t.name === teamName);
    if (team) {
      await updateTeam(teamName, { points: team.points + points });
      toast.success(`Awarded ${points} points to ${teamName}!`);
    }
  };

  const assignIssue = async (issueId: string, teamName: string | null) => {
    await updateIssueInDb(issueId, { assignedTo: teamName });
    toast.success(teamName ? `Issue assigned to ${teamName}!` : 'Issue unassigned!');
  };

  const deleteIssue = async (issueId: string) => {
    await deleteIssueFromDb(issueId);
    toast.success('Issue deleted!');
  };

  const value: AppContextType = {
    currentTeam,
    teams,
    repositories,
    issues,
    isAdmin,
    loginTeam,
    logoutTeam,
    loginAdmin,
    logoutAdmin,
    addRepository,
    deleteRepository,
    addIssue,
    occupyIssue,
    closeIssue,
    moveIssue,
    updatePrStatus,
    awardPoints,
    assignIssue,
    deleteIssue
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

