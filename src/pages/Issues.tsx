import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Lock, Clock, GitPullRequest } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Issues = () => {
  const { repo } = useParams<{ repo: string }>();
  const navigate = useNavigate();
  const { issues, currentTeam, occupyIssue, closeIssue } = useApp();
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
  const [showOccupyDialog, setShowOccupyDialog] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [selectedIssueDetails, setSelectedIssueDetails] = useState<any>(null);
  const [prUrl, setPrUrl] = useState('');
  const [prUrlError, setPrUrlError] = useState('');

  const repoIssues = useMemo(() => issues.filter(issue => issue.repo === repo), [issues, repo]);
  const openIssues = useMemo(() => repoIssues.filter(i => i.status === 'open'), [repoIssues]);
  const occupiedIssues = useMemo(() => repoIssues.filter(i => i.status === 'occupied'), [repoIssues]);
  const closedIssues = useMemo(() => repoIssues.filter(i => i.status === 'closed'), [repoIssues]);

  const confirmOccupy = useCallback((issueId: string) => {
    const issue = issues.find(i => i.id === issueId);
    setSelectedIssue(issueId);
    setSelectedIssueDetails(issue);
    setShowOccupyDialog(true);
  }, [issues]);

  const handleOccupy = useCallback(() => {
    if (!selectedIssue) return;
    
    const result = occupyIssue(selectedIssue);
    
    // Close dialog first to prevent focus warning
    setShowOccupyDialog(false);
    
    // Then show feedback after a brief delay
    setTimeout(() => {
      if (result.success) {
        toast.success('Issue occupied successfully!');
        setShowInstructionsDialog(true);
      } else {
        toast.error(result.error || 'Failed to occupy issue');
        setSelectedIssue(null);
        setSelectedIssueDetails(null);
      }
    }, 50);
  }, [selectedIssue, occupyIssue]);

  const validatePrUrl = (url: string): boolean => {
    // Check if it's a valid GitHub PR URL
    const githubPrPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/pull\/\d+$/;
    return githubPrPattern.test(url);
  };

  const confirmClose = useCallback(() => {
    if (!selectedIssue) return;
    
    if (!prUrl.trim()) {
      setPrUrlError('Please enter a PR URL');
      return;
    }
    
    if (!validatePrUrl(prUrl)) {
      setPrUrlError('Please enter a valid GitHub PR URL (e.g., https://github.com/owner/repo/pull/123)');
      return;
    }
    
    const result = closeIssue(selectedIssue, prUrl);
    if (result.success) {
      toast.success('Issue marked as solved! PR submitted for review 🎉', {
        description: 'Admin will review your PR before awarding points.'
      });
      setShowCloseDialog(false);
      setSelectedIssue(null);
      setPrUrl('');
      setPrUrlError('');
    } else {
      toast.error(result.error || 'Failed to close issue');
    }
  }, [selectedIssue, prUrl, closeIssue]);

  const handleCloseClick = useCallback((issueId: string) => {
    setSelectedIssue(issueId);
    setPrUrl('');
    setPrUrlError('');
    setShowCloseDialog(true);
  }, []);

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'easy': return 'bg-success text-white';
      case 'medium': return 'bg-warning text-white';
      case 'hard': return 'bg-destructive text-white';
      default: return 'bg-muted';
    }
  };

  const getTimeRemaining = (issue: any) => {
    if (!issue.occupiedAt) return null;
    
    const duration = issue.tags.includes('easy') ? 20 * 60 * 1000 :
                    issue.tags.includes('medium') ? 40 * 60 * 1000 :
                    60 * 60 * 1000;
    
    const elapsed = Date.now() - issue.occupiedAt;
    const remaining = Math.max(0, duration - elapsed);
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Memoized timer component to prevent unnecessary re-renders
  const Timer = memo(({ issue }: { issue: any }) => {
    const [time, setTime] = useState(getTimeRemaining(issue));

    useEffect(() => {
      const interval = setInterval(() => {
        setTime(getTimeRemaining(issue));
      }, 1000);
      return () => clearInterval(interval);
    }, [issue.occupiedAt, issue.tags]);

    if (!time) return null;

    // Calculate remaining time percentage
    const duration = issue.tags.includes('easy') ? 20 * 60 * 1000 :
                    issue.tags.includes('medium') ? 40 * 60 * 1000 :
                    60 * 60 * 1000;
    const elapsed = Date.now() - issue.occupiedAt;
    const remaining = Math.max(0, duration - elapsed);
    const percentRemaining = (remaining / duration) * 100;

    // Color based on time remaining
    const getTimerColor = () => {
      if (percentRemaining > 50) return 'text-primary';
      if (percentRemaining > 25) return 'text-warning';
      return 'text-destructive';
    };

    return (
      <div className={`flex items-center gap-2 mt-2 text-sm font-medium ${getTimerColor()}`}>
        <Clock className="w-4 h-4" />
        {time}
        {percentRemaining <= 25 && (
          <span className="text-xs">⚠️ Hurry!</span>
        )}
      </div>
    );
  });

  Timer.displayName = 'Timer';

  const IssueCard = memo(
    ({ issue, actions }: { issue: any; actions: React.ReactNode }) => {
      return (
        <Card className="shadow-card hover:shadow-elevated transition-shadow duration-300 card-hover-optimized">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{issue.title}</CardTitle>
            </div>
            <div className="flex gap-2 mt-2">
              {issue.tags.map((tag: string) => (
                <Badge key={tag} className={getTagColor(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
            {issue.assignedTo && (
              <p className="text-sm text-muted-foreground mt-2">
                Assigned to: {issue.assignedTo}
              </p>
            )}
            {issue.status === 'occupied' && issue.occupiedAt && (
              <Timer issue={issue} />
            )}
          </CardHeader>
          <CardContent>
            {actions}
          </CardContent>
        </Card>
      );
    },
    (prevProps, nextProps) => {
      // Only re-render if issue data actually changes
      return (
        prevProps.issue.id === nextProps.issue.id &&
        prevProps.issue.status === nextProps.issue.status &&
        prevProps.issue.assignedTo === nextProps.issue.assignedTo &&
        prevProps.issue.occupiedAt === nextProps.issue.occupiedAt
      );
    }
  );

  IssueCard.displayName = 'IssueCard';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/repositories')} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Repositories
          </Button>
          <h1 className="text-2xl font-bold">{repo} - Issues</h1>
          <p className="text-sm text-muted-foreground">Team: {currentTeam?.name}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Open Issues
              <Badge variant="secondary">{openIssues.length}</Badge>
            </h2>
            <div className="space-y-4">
              {openIssues.map(issue => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  actions={
                    <Button
                      className="w-full"
                      onClick={() => confirmOccupy(issue.id)}
                    >
                      Occupy Issue
                    </Button>
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Occupied Issues
              <Badge variant="secondary">{occupiedIssues.length}</Badge>
            </h2>
            <div className="space-y-4">
              {occupiedIssues.map(issue => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  actions={
                    issue.assignedTo === currentTeam?.name ? (
                      <Button 
                        className="w-full" 
                        variant="default"
                        onClick={() => handleCloseClick(issue.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Solved
                      </Button>
                    ) : (
                      <Button className="w-full" variant="ghost" disabled>
                        <Lock className="w-4 h-4 mr-2" />
                        Occupied by {issue.assignedTo}
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Closed Issues
              <Badge variant="secondary">{closedIssues.length}</Badge>
            </h2>
            <div className="space-y-4">
              {closedIssues.map(issue => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  actions={
                    <div className="flex items-center justify-center text-success">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Occupy Confirmation Dialog - Shows before occupying */}
      <AlertDialog open={showOccupyDialog} onOpenChange={setShowOccupyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚡ Occupy Issue #{selectedIssueDetails?.id}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📊 Point System:
                  </p>
                  <div className="space-y-2 text-blue-800 dark:text-blue-200">
                    {selectedIssueDetails?.tags.includes('easy') && (
                      <p>• <strong>Easy Issue</strong> - Time limit: 20 minutes</p>
                    )}
                    {selectedIssueDetails?.tags.includes('medium') && (
                      <p>• <strong>Medium Issue</strong> - Time limit: 40 minutes</p>
                    )}
                    {selectedIssueDetails?.tags.includes('hard') && (
                      <p>• <strong>Hard Issue</strong> - Time limit: 60 minutes</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="font-semibold text-green-900 dark:text-green-100 mb-1 flex items-center gap-2">
                      ✅ Complete on time
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Earn points when PR is merged
                    </p>
                  </div>

                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="font-semibold text-red-900 dark:text-red-100 mb-1 flex items-center gap-2">
                      ⏰ Time expires
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {selectedIssueDetails?.tags.includes('easy') && 'Lose 5 points'}
                      {selectedIssueDetails?.tags.includes('medium') && 'Lose 10 points'}
                      {selectedIssueDetails?.tags.includes('hard') && 'Lose 15 points'}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-amber-800 dark:text-amber-200 text-xs font-medium">
                    ⚠️ You can occupy up to 3 issues at a time. Choose wisely and work efficiently!
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedIssue(null);
              setSelectedIssueDetails(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleOccupy}>
              Yes, I'll Solve This! 💪
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Instructions Dialog - Shows when issue is occupied */}
      <AlertDialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-primary" />
              📋 Contribution Workflow
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm">
                <p className="font-medium text-foreground">
                  Follow these steps to contribute:
                </p>
                <ol className="list-decimal list-inside space-y-3 pl-2 text-foreground">
                  <li>
                    <strong className="text-primary">Fork the repository</strong>
                    <p className="text-xs text-muted-foreground ml-5 mt-1">Click "Fork" button on GitHub to create your copy</p>
                  </li>
                  <li>
                    <strong className="text-primary">Clone your fork</strong>
                    <p className="text-xs text-muted-foreground ml-5 mt-1">
                      <code className="bg-muted px-1 rounded">git clone https://github.com/YOUR_USERNAME/repo.git</code>
                    </p>
                  </li>
                  <li>
                    <strong className="text-primary">Make your changes</strong>
                    <p className="text-xs text-muted-foreground ml-5 mt-1">Create a branch, fix the issue, test your code</p>
                  </li>
                  <li>
                    <strong className="text-primary">Commit & Push</strong>
                    <p className="text-xs text-muted-foreground ml-5 mt-1">
                      <code className="bg-muted px-1 rounded">git commit -m "Fix: description"</code> then push to your fork
                    </p>
                  </li>
                  <li>
                    <strong className="text-primary">Create Pull Request</strong>
                    <p className="text-xs text-muted-foreground ml-5 mt-1">From your fork to the original repository</p>
                  </li>
                  <li>
                    <strong className="text-primary">Mark as solved</strong>
                    <p className="text-xs text-muted-foreground ml-5 mt-1">Only after PR is created and linked!</p>
                  </li>
                </ol>
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
                  <p className="text-amber-800 dark:text-amber-200 font-medium text-xs flex items-center gap-2">
                    ⚠️ Remember: You have limited time! Work efficiently and don't forget to create the PR before time runs out.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInstructionsDialog(false)}>
              Got it! Let's start coding 🚀
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Issue Dialog - Shows when marking issue as solved */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <GitPullRequest className="w-5 h-5" />
              Submit Your Pull Request
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Before marking this issue as solved, make sure you've completed all steps:
                </p>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                  <li><strong>Fork the repository</strong> to your GitHub account</li>
                  <li><strong>Clone your fork</strong> and make your changes</li>
                  <li><strong>Commit</strong> all your changes with clear messages</li>
                  <li><strong>Push</strong> changes to your fork</li>
                  <li><strong>Create a Pull Request</strong> from your fork to the original repo</li>
                  <li><strong>Copy the PR URL</strong> and paste it below</li>
                </ol>
                
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-foreground">
                    Pull Request URL <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://github.com/owner/repo/pull/123"
                    value={prUrl}
                    onChange={(e) => {
                      setPrUrl(e.target.value);
                      setPrUrlError('');
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                  {prUrlError && (
                    <p className="text-xs text-destructive">{prUrlError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Example: https://github.com/username/contribx/pull/42
                  </p>
                </div>
                
                <p className="text-amber-600 dark:text-amber-500 font-medium">
                  ⚠️ Only submit after creating the PR! Admin will review before awarding points.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPrUrl('');
              setPrUrlError('');
              setSelectedIssue(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>
              Submit PR & Mark as Solved
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Issues;
