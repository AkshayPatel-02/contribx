import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  initializeRepositories
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
  occupyIssue: (issueId: string) => { success: boolean; error?: string };
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

  const occupyIssue = (issueId: string) => {
    if (!currentTeam) {
      return { success: false, error: 'You must be logged in to occupy an issue.' };
    }

    // Check if team already has 3 occupied issues
    const teamOccupiedCount = issues.filter(
      i => i.status === 'occupied' && i.assignedTo === currentTeam.name
    ).length;

    if (teamOccupiedCount >= 3) {
      return { 
        success: false, 
        error: 'Your team has already occupied 3 issues. Please close an issue before occupying a new one.' 
      };
    }

    updateIssueInDb(issueId, {
      status: 'occupied',
      assignedTo: currentTeam.name,
      occupiedAt: Date.now()
    });

    return { success: true };
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

