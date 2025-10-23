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

interface TransactionError extends Error {
  code?: string;
  name?: string;
}

// Cache for team issue counts to avoid repeated queries
const teamIssueCountCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds TTL for cache

export const occupyIssueTransaction = async (
  issueId: string, 
  teamName: string,
  maxRetries: number = 3
): Promise<{ success: boolean; error?: string }> => {
  const errors: TransactionError[] = [];
  
  try {
    if (!issueId || !teamName) {
      return { success: false, error: 'Issue ID and team name are required' };
    }

    // Get the issue reference
    const issueRef = doc(db, COLLECTIONS.ISSUES, issueId);
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const currentTime = Date.now();

        // Check team's current issues (with caching)
        const cachedCount = teamIssueCountCache.get(teamName);
        if (cachedCount && (currentTime - cachedCount.timestamp) < CACHE_TTL) {
          if (cachedCount.count >= 3) {
            return { 
              success: false, 
              error: 'Your team has already occupied 3 issues. Please close an issue before occupying a new one.' 
            };
          }
        } else {
          // If cache miss or expired, query Firestore with timeout
          const issuesCol = collection(db, COLLECTIONS.ISSUES);
          const teamIssues = query(
            issuesCol,
            where('assignedTo', '==', teamName),
            where('status', '==', 'occupied'),
            limit(3)
          );

          // Add timeout for the query
          const queryPromise = getDocs(teamIssues);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Query timeout')), 5000);
          });

          const snapshot = await Promise.race([queryPromise, timeoutPromise]) as any;
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

        // Perform the transaction with timeout
        const transactionPromise = runTransaction(db, async (transaction) => {
          const issueDoc = await transaction.get(issueRef);
          
          if (!issueDoc.exists()) {
            throw new Error('Issue no longer exists');
          }

          const currentData = issueDoc.data() as Issue;
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

        // Add timeout for the transaction
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transaction timeout')), 5000);
        });

        const result = await Promise.race([transactionPromise, timeoutPromise]);

        // On success, update cache
        const updatedCache = teamIssueCountCache.get(teamName);
        if (updatedCache) {
          teamIssueCountCache.set(teamName, {
            count: updatedCache.count + 1,
            timestamp: currentTime
          });
        }

        return result as { success: boolean; error?: string };

      } catch (error: any) {
        errors.push(error);
        
        // Don't retry for business logic errors
        if (error.message.includes('already')) {
          return { success: false, error: error.message };
        }

        // For transient errors, wait before retrying
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.min(1000 * (attempt + 1), 3000))
          );
          continue;
        }
      }
    }

    // If we get here, all retries failed
    const lastError = errors[errors.length - 1];
    
    // Check for specific error types
    if (lastError?.code === 'failed-precondition') {
      return {
        success: false,
        error: 'The issue status has changed. Please refresh and try again.'
      };
    }

    if (lastError?.code === 'unavailable' || lastError?.code === 'deadline-exceeded') {
      return {
        success: false,
        error: 'The service is temporarily unavailable. Please try again.'
      };
    }

    // Generic error case
    return { 
      success: false, 
      error: lastError?.message || 'Failed to occupy issue after multiple attempts. Please try again.'
    };

  } catch (error: any) {
    console.error('Error in occupyIssueTransaction:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred. Please try again.' 
    };
  }

  // Clean up expired cache entries periodically
  if (Math.random() < 0.1) { // 10% chance on each call
    const now = Date.now();
    for (const [team, data] of teamIssueCountCache.entries()) {
      if (now - data.timestamp > CACHE_TTL) {
        teamIssueCountCache.delete(team);
      }
    }
  }
};