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
  runTransaction
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
  return onSnapshot(issuesCol, (snapshot) => {
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
    callback(issues);
  });
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
 */
export const occupyIssueTransaction = async (
  issueId: string, 
  teamName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const start = Date.now();

    // Pre-check how many issues this team currently has occupied (do this OUTSIDE the transaction to reduce transaction time)
    const issuesCol = collection(db, COLLECTIONS.ISSUES);
    const teamIssuesQuery = query(
      issuesCol,
      where('assignedTo', '==', teamName),
      where('status', '==', 'occupied')
    );

    const tPre = Date.now();
    const teamIssuesSnapshot = await getDocs(teamIssuesQuery);
    console.log('[TRACE] occupyIssueTransaction: pre-getDocs(teamIssuesQuery) took', Date.now() - tPre, 'ms', 'size=', teamIssuesSnapshot.size);
    try {
      const ids = teamIssuesSnapshot.docs.map(d => d.id).slice(0, 10);
      console.log('[TRACE] occupyIssueTransaction: team occupied ids sample=', ids);
    } catch (err) {}

    if (teamIssuesSnapshot.size >= 3) {
      return { success: false, error: 'Your team has already occupied 3 issues. Please close an issue before occupying a new one.' };
    }

    // Now perform a short transaction that only reads and updates the issue document.
    const result = await runTransaction(db, async (transaction) => {
      console.log('[TRACE] occupyIssueTransaction: start transaction for', issueId, 'team', teamName);
      const issueRef = doc(db, COLLECTIONS.ISSUES, issueId);

      const t0 = Date.now();
      const issueDoc = await transaction.get(issueRef);
      console.log('[TRACE] occupyIssueTransaction: transaction.get(issue) took', Date.now() - t0, 'ms');

      if (!issueDoc.exists()) {
        throw new Error('Issue not found');
      }

      const issueData = issueDoc.data();
      console.log('[TRACE] occupyIssueTransaction: issueData=', { id: issueDoc.id, ...issueData });

      // Check if issue is already occupied
      if (issueData.status !== 'open') {
        throw new Error(`This issue is already ${issueData.status}. Please choose another issue.`);
      }

      transaction.update(issueRef, {
        status: 'occupied',
        assignedTo: teamName,
        occupiedAt: Timestamp.fromMillis(Date.now())
      });

      console.log('[TRACE] occupyIssueTransaction: transaction.update queued');
      return { success: true };
    });

    console.log('[TRACE] occupyIssueTransaction: total flow took', Date.now() - start, 'ms');
    return result;
  } catch (error: any) {
    console.error('Error in occupyIssueTransaction:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to occupy issue. Please try again.' 
    };
  }
};
