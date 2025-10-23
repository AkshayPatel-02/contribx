import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  Timestamp,
  runTransaction,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team, Repository, Issue } from '@/types';

// Collection names
const COLLECTIONS = {
  TEAMS: 'teams',
  REPOSITORIES: 'repositories',
  ISSUES: 'issues'
};

// ============ TEAMS ============

export const getAllTeams = async (): Promise<Team[]> => {
  try {
    const teamsCol = collection(db, COLLECTIONS.TEAMS);
    const snapshot = await getDocs(teamsCol);
    const teams = snapshot.docs.map(doc => ({ ...doc.data() } as Team));
    return teams;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

export const subscribeToTeams = (callback: (teams: Team[]) => void) => {
  const teamsCol = collection(db, COLLECTIONS.TEAMS);
  return onSnapshot(teamsCol, (snapshot) => {
    const teams = snapshot.docs.map(doc => ({ ...doc.data() } as Team));
    callback(teams);
  });
};

export const createTeam = async (team: Team): Promise<void> => {
  const teamDoc = doc(db, COLLECTIONS.TEAMS, team.name);
  await setDoc(teamDoc, team);
};

export const updateTeam = async (teamName: string, updates: Partial<Team>): Promise<void> => {
  const teamDoc = doc(db, COLLECTIONS.TEAMS, teamName);
  await updateDoc(teamDoc, updates);
};

export const initializeTeams = async (teamNames: string[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    for (const name of teamNames) {
      const teamDoc = doc(db, COLLECTIONS.TEAMS, name);
      const teamData = { name, points: 0, active: false } as Team;
      batch.set(teamDoc, teamData, { merge: true });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error initializing teams:', error);
    throw error;
  }
};

// ============ REPOSITORIES ============

export const getAllRepositories = async (): Promise<Repository[]> => {
  const reposCol = collection(db, COLLECTIONS.REPOSITORIES);
  const snapshot = await getDocs(reposCol);
  return snapshot.docs.map(doc => ({ 
    id: doc.id,
    ...doc.data() 
  } as Repository));
};

export const subscribeToRepositories = (callback: (repos: Repository[]) => void) => {
  const reposCol = collection(db, COLLECTIONS.REPOSITORIES);
  return onSnapshot(reposCol, (snapshot) => {
    const repos = snapshot.docs.map(doc => ({ 
      id: doc.id,
      ...doc.data() 
    } as Repository));
    callback(repos);
  });
};

export const createRepository = async (repo: Repository): Promise<void> => {
  const repoDoc = doc(collection(db, COLLECTIONS.REPOSITORIES));
  await setDoc(repoDoc, repo);
};

export const deleteRepository = async (repoId: string): Promise<void> => {
  const repoDoc = doc(db, COLLECTIONS.REPOSITORIES, repoId);
  await deleteDoc(repoDoc);
};

export const initializeRepositories = async (repos: Repository[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    for (const repo of repos) {
      const repoDoc = doc(collection(db, COLLECTIONS.REPOSITORIES));
      batch.set(repoDoc, repo);
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error initializing repositories:', error);
    throw error;
  }
};

// ============ ISSUES ============

export const getAllIssues = async (): Promise<Issue[]> => {
  const issuesCol = collection(db, COLLECTIONS.ISSUES);
  const snapshot = await getDocs(issuesCol);
  return snapshot.docs.map(doc => ({ 
    id: doc.id,
    ...doc.data() 
  } as Issue));
};

export const subscribeToIssues = (callback: (issues: Issue[]) => void) => {
  const issuesCol = collection(db, COLLECTIONS.ISSUES);
  
  // Set up snapshot listener with error handling and metadata changes
  const unsubscribe = onSnapshot(
    issuesCol,
    { includeMetadataChanges: true },
    (snapshot) => {
      const issues = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to numbers
          occupiedAt: data.occupiedAt?.toMillis?.() || data.occupiedAt,
          closedAt: data.closedAt?.toMillis?.() || data.closedAt
        } as Issue;
      });
      
      // Only trigger callback if this is not a local cache update
      if (!snapshot.metadata.fromCache) {
        callback(issues);
      }
    },
    (error) => {
      console.error('Error in issues subscription:', error);
      // Try to reestablish subscription after error
      setTimeout(() => {
        const newUnsubscribe = subscribeToIssues(callback);
        // Clean up old subscription if it exists
        if (unsubscribe) unsubscribe();
      }, 5000);
    }
  );

  return unsubscribe;
};

export const createIssue = async (issue: Omit<Issue, 'id'>): Promise<string> => {
  const issueDoc = doc(collection(db, COLLECTIONS.ISSUES));
  await setDoc(issueDoc, {
    ...issue,
    occupiedAt: issue.occupiedAt ? Timestamp.fromMillis(issue.occupiedAt) : null,
    closedAt: issue.closedAt ? Timestamp.fromMillis(issue.closedAt) : null
  });
  return issueDoc.id;
};

export const updateIssue = async (issueId: string, updates: Partial<Issue>): Promise<void> => {
  const issueDoc = doc(db, COLLECTIONS.ISSUES, issueId);
  const updateData: any = { ...updates };
  
  // Convert timestamps
  if (updates.occupiedAt !== undefined) {
    updateData.occupiedAt = updates.occupiedAt ? Timestamp.fromMillis(updates.occupiedAt) : null;
  }
  if (updates.closedAt !== undefined) {
    updateData.closedAt = updates.closedAt ? Timestamp.fromMillis(updates.closedAt) : null;
  }
  
  await updateDoc(issueDoc, updateData);
};

export const deleteIssue = async (issueId: string): Promise<void> => {
  const issueDoc = doc(db, COLLECTIONS.ISSUES, issueId);
  await deleteDoc(issueDoc);
};

export const getIssuesByRepo = async (repoName: string): Promise<Issue[]> => {
  const issuesCol = collection(db, COLLECTIONS.ISSUES);
  const q = query(issuesCol, where('repo', '==', repoName));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id,
    ...doc.data() 
  } as Issue));
};

export const getIssuesByTeam = async (teamName: string): Promise<Issue[]> => {
  const issuesCol = collection(db, COLLECTIONS.ISSUES);
  const q = query(issuesCol, where('assignedTo', '==', teamName));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id,
    ...doc.data() 
  } as Issue));
};

// ============ TRANSACTIONS ============

/**
 * Atomically occupy an issue using Firestore transaction
 * This prevents race conditions when multiple teams try to occupy the same issue
 * @param issueId - The ID of the issue to occupy
 * @param teamName - The name of the team attempting to occupy the issue
 * @returns A promise that resolves to an object containing success status and optional error message
 */
// Cache for team issue counts to avoid repeated queries
const teamIssueCountCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds TTL for cache

interface TransactionError extends Error {
  code?: string;
  name?: string;
}

export const occupyIssueTransaction = async (
  issueId: string, 
  teamName: string,
  maxRetries: number = 3
): Promise<{ success: boolean; error?: string }> => {
  const errors: TransactionError[] = [];
  const startTime = Date.now();

  try {
    if (!issueId || !teamName) {
      return { success: false, error: 'Issue ID and team name are required' };
    }

    // Get a direct reference to the issue document first - this will be fast
    const issueRef = doc(db, COLLECTIONS.ISSUES, issueId);
    const issueDoc = await getDoc(issueRef);
    
    if (!issueDoc.exists()) {
      return { success: false, error: 'Issue not found' };
    }

    const issueData = issueDoc.data() as Issue;
    if (issueData.status !== 'open') {
      return { success: false, error: `This issue is already ${issueData.status}. Please choose another issue.` };
    }

    // Fast pre-check using cache
    const currentTime = Date.now();
    const cachedCount = teamIssueCountCache.get(teamName);
    
    if (cachedCount && (currentTime - cachedCount.timestamp) < CACHE_TTL) {
      if (cachedCount.count >= 3) {
        return { 
          success: false, 
          error: 'Your team has already occupied 3 issues. Please close an issue before occupying a new one.' 
        };
      }
    }

    // Attempt transaction with retries
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // First, get current issue count (inside retry loop to ensure freshness)
        if (!cachedCount || (currentTime - cachedCount.timestamp) >= CACHE_TTL) {
          const issuesCol = collection(db, COLLECTIONS.ISSUES);
          const teamCurrentIssues = query(
            issuesCol,
            where('assignedTo', '==', teamName),
            where('status', '==', 'occupied'),
            limit(3)
          );

          const snapshot = await getDocs(teamCurrentIssues);
          if (snapshot.size >= 3) {
            return { 
              success: false, 
              error: 'Your team has already occupied 3 issues. Please close an issue before occupying a new one.' 
            };
          }

          // Update cache
          teamIssueCountCache.set(teamName, {
            count: snapshot.size,
            timestamp: currentTime
          });
        }

        // Perform the transaction
        const result = await runTransaction(db, async (transaction) => {
          const latestDoc = await transaction.get(issueRef);
          if (!latestDoc.exists()) {
            throw new Error('Issue no longer exists');
          }

          const currentData = latestDoc.data() as Issue;
          if (currentData.status !== 'open') {
            throw new Error(`This issue is already ${currentData.status}. Please choose another issue.`);
          }

          if (currentData.assignedTo === teamName) {
            throw new Error('Your team is already assigned to this issue.');
          }

          const updateTime = Date.now();
          transaction.update(issueRef, {
            status: 'occupied',
            assignedTo: teamName,
            occupiedAt: Timestamp.fromMillis(updateTime),
            lastUpdated: Timestamp.fromMillis(updateTime)
          });

          return { success: true };
        });

        // On success, update cache
        const updatedCache = teamIssueCountCache.get(teamName);
        if (updatedCache) {
          teamIssueCountCache.set(teamName, {
            count: updatedCache.count + 1,
            timestamp: currentTime
          });
        }

        return result;

      } catch (error: any) {
        lastError = error;
        
        // Don't retry for business logic errors
        if (error.message.includes('already')) {
          return { success: false, error: error.message };
        }

        // For transient errors, wait and retry
        if (i < maxRetries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.min(1000 * (i + 1), 3000))
          );
          continue;
        }
      }
    }

    // All retries exhausted
    return { 
      success: false, 
      error: lastError?.message || 'Failed to occupy issue after multiple attempts. Please try again.'
    };

    const teamIssuesSnapshot = await getDocs(teamIssuesQuery);

    if (teamIssuesSnapshot.size >= 3) {
      return { success: false, error: 'Your team has already occupied 3 issues. Please close an issue before occupying a new one.' };
    }

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      try {
        // Perform a short, focused transaction
        const result = await runTransaction(db, async (transaction) => {
          const issueDoc = await transaction.get(issueRef);
          const currentData = issueDoc.data() as Issue;

          // Recheck status inside transaction
          if (currentData.status !== 'open') {
            throw new Error(`This issue is already ${currentData.status}. Please choose another issue.`);
          }

          // Check if this team is already working on this issue
          if (currentData.assignedTo === teamName) {
            throw new Error('Your team is already assigned to this issue.');
          }

          const now = Date.now();
          transaction.update(issueRef, {
            status: 'occupied',
            assignedTo: teamName,
            occupiedAt: Timestamp.fromMillis(now),
            lastUpdated: Timestamp.fromMillis(now)
          });

          return { success: true };
        });

        // If we get here, transaction succeeded
        return result;

      } catch (error: any) {
        lastError = error;
        
        // If it's a condition error (like issue already occupied), don't retry
        if (error.message.includes('already')) {
          return { success: false, error: error.message };
        }

        // For other errors, wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * attempt, 3000)));
        }
      }
    }

    // If we get here, all retries failed
    return { 
      success: false, 
      error: lastError?.message || 'Failed to occupy issue after multiple attempts. Please try again.'
    };
  } catch (error: any) {
    console.error('Error in occupyIssueTransaction:', error);
    
    // Handle specific error cases
    if (error.code === 'permission-denied') {
      return {
        success: false,
        error: 'You do not have permission to occupy this issue.'
      };
    }
    
    if (error.code === 'failed-precondition') {
      return {
        success: false,
        error: 'The issue status has changed. Please refresh and try again.'
      };
    }
    
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return {
        success: false,
        error: 'The service is temporarily unavailable. Please try again in a moment.'
      };
    }

    return { 
      success: false, 
      error: error.message || 'Failed to occupy issue. Please try again.' 
    };
  }

  // Clear any expired cache entries periodically
  if (Math.random() < 0.1) { // 10% chance to clean up on each call
    const now = Date.now();
    for (const [team, data] of teamIssueCountCache.entries()) {
      if (now - data.timestamp > CACHE_TTL) {
        teamIssueCountCache.delete(team);
      }
    }
  }
};
