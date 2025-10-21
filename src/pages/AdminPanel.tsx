import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Shield, ArrowLeft, Plus, ExternalLink, Trophy, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { isAdmin, loginAdmin, logoutAdmin, issues, teams, addIssue, moveIssue, assignIssue, awardPoints, repositories, updatePrStatus } = useApp();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueTags, setNewIssueTags] = useState<string[]>([]);
  const [newIssueRepo, setNewIssueRepo] = useState('');
  
  const [pointsTeam, setPointsTeam] = useState('');
  const [pointsAmount, setPointsAmount] = useState('');
  
  const [selectedRepo, setSelectedRepo] = useState<string>('all');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(username, password)) {
      toast.success('Admin login successful!');
    } else {
      toast.error('Invalid credentials');
    }
  };

  const handleAddIssue = () => {
    if (!newIssueTitle || !newIssueRepo || newIssueTags.length === 0) {
      toast.error('Please fill all fields');
      return;
    }
    addIssue({ title: newIssueTitle, tags: newIssueTags, repo: newIssueRepo });
    toast.success('Issue added successfully!');
    setNewIssueTitle('');
    setNewIssueTags([]);
    setNewIssueRepo('');
  };

  const handleAwardPoints = () => {
    if (!pointsTeam || !pointsAmount) {
      toast.error('Please select team and enter points');
      return;
    }
    awardPoints(pointsTeam, parseInt(pointsAmount));
    toast.success(`Awarded ${pointsAmount} points to ${pointsTeam}!`);
    setPointsTeam('');
    setPointsAmount('');
  };

  const toggleTag = (tag: string) => {
    setNewIssueTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-red-950 p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-200/20 dark:bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200/20 dark:bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative z-10">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 transform hover:scale-105 transition-transform">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">Admin Access</CardTitle>
              <CardDescription className="text-base">Authorized personnel only</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <Input
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-14 text-base border-slate-200 dark:border-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 text-base border-slate-200 dark:border-slate-700"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg shadow-red-500/30"
                size="lg"
              >
                Access Admin Panel
              </Button>
            </form>
            <div className="mt-8 pt-6 border-t text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ← Back to Team Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Modern Admin Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg shadow-red-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Admin Control Center
                </h1>
                <p className="text-sm text-muted-foreground">Manage issues, teams & awards</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/rankings')}
                className="shadow-sm hover:shadow-md transition-all"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Rankings
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => { logoutAdmin(); navigate('/'); }}
                className="hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-10">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardDescription className="font-medium">Total Issues</CardDescription>
              <CardTitle className="text-4xl font-bold text-slate-700 dark:text-slate-300">{issues.length}</CardTitle>
              <p className="text-xs text-muted-foreground mt-2">All repositories</p>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardDescription className="font-medium text-blue-600 dark:text-blue-400">Open Issues</CardDescription>
              <CardTitle className="text-4xl font-bold text-blue-600 dark:text-blue-400">{issues.filter(i => i.status === 'open').length}</CardTitle>
              <p className="text-xs text-muted-foreground mt-2">Available to assign</p>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50 dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardDescription className="font-medium text-amber-600 dark:text-amber-400">In Progress</CardDescription>
              <CardTitle className="text-4xl font-bold text-amber-600 dark:text-amber-400">{issues.filter(i => i.status === 'occupied').length}</CardTitle>
              <p className="text-xs text-muted-foreground mt-2">Being worked on</p>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardDescription className="font-medium text-green-600 dark:text-green-400">Awaiting Review</CardDescription>
              <CardTitle className="text-4xl font-bold text-green-600 dark:text-green-400">{issues.filter(i => i.status === 'closed').length}</CardTitle>
              <p className="text-xs text-muted-foreground mt-2">Review PRs</p>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Add New Issue */}
          <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Add New Issue</CardTitle>
                  <CardDescription>Create a new challenge for teams</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Issue Title</Label>
                <Input
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  placeholder="e.g., Fix responsive layout bug"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Repository</Label>
                <Select value={newIssueRepo} onValueChange={setNewIssueRepo}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map(repo => (
                      <SelectItem key={repo.name} value={repo.name}>
                        {repo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Difficulty</Label>
                <div className="flex gap-2">
                  {['easy', 'medium', 'hard'].map(tag => (
                    <Badge
                      key={tag}
                      variant={newIssueTags.includes(tag) ? 'default' : 'outline'}
                      className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                        newIssueTags.includes(tag)
                          ? tag === 'easy' ? 'bg-green-500 hover:bg-green-600' :
                            tag === 'medium' ? 'bg-amber-500 hover:bg-amber-600' :
                            'bg-red-500 hover:bg-red-600'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button 
                onClick={handleAddIssue} 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Issue
              </Button>
            </CardContent>
          </Card>

          {/* Award Points */}
          <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
            <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Award Points</CardTitle>
                  <CardDescription>Reward teams for exceptional work</CardDescription>
                </div>
              </div>
            </CardHeader>
          <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Team</Label>
                <Select value={pointsTeam} onValueChange={setPointsTeam}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.name} value={team.name}>
                        {team.name} - {team.points} pts
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Points Amount</Label>
                <Input
                  type="number"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(e.target.value)}
                  placeholder="e.g., 50"
                  className="h-11"
                />
              </div>
              <Button 
                onClick={handleAwardPoints} 
                className="w-full h-11 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Award Points
              </Button>
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="font-semibold text-sm mb-2 text-amber-900 dark:text-amber-100">⏱️ Auto Penalty System</p>
                <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-200">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Easy (20 min): <strong>-5 pts</strong> if expired
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Medium (40 min): <strong>-10 pts</strong> if expired
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Hard (60 min): <strong>-15 pts</strong> if expired
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manage Issues Section */}
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <GitBranch className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <CardTitle className="text-lg">Issue Management</CardTitle>
                  <CardDescription>Track, review, and manage all issues with PR workflow</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Repository Filter */}
            <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <Label className="mb-3 block text-sm font-medium">Filter by Repository</Label>
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger className="w-full max-w-md h-11 bg-white dark:bg-slate-800 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="font-medium">All Repositories</span> · {issues.length} total issues
                  </SelectItem>
                  {repositories.map(repo => {
                    const repoIssueCount = issues.filter(i => i.repo === repo.name).length;
                    return (
                      <SelectItem key={repo.name} value={repo.name}>
                        <span className="font-medium">{repo.name}</span> · {repoIssueCount} issues
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              {issues.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No issues yet. Add some issues to get started.</p>
              ) : (
                (() => {
                  // Group issues by repository
                  const groupedIssues = repositories.reduce((acc, repo) => {
                    let repoIssues = issues.filter(i => i.repo === repo.name);
                    
                    // Sort issues: closed first, then occupied, then open
                    repoIssues = repoIssues.sort((a, b) => {
                      const statusOrder = { closed: 0, occupied: 1, open: 2 };
                      return statusOrder[a.status] - statusOrder[b.status];
                    });
                    
                    if (repoIssues.length > 0 && (selectedRepo === 'all' || selectedRepo === repo.name)) {
                      acc[repo.name] = repoIssues;
                    }
                    return acc;
                  }, {} as Record<string, typeof issues>);

                  return Object.entries(groupedIssues).map(([repoName, repoIssues]) => (
                    <div key={repoName} className="space-y-4">
                      {/* Repository Header */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            📦 {repoName}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {repoIssues.length} issue{repoIssues.length !== 1 ? 's' : ''} • 
                            {' '}{repoIssues.filter(i => i.status === 'open').length} open • 
                            {' '}{repoIssues.filter(i => i.status === 'occupied').length} in progress • 
                            {' '}{repoIssues.filter(i => i.status === 'closed').length} closed
                          </p>
                        </div>
                        <a
                          href={repositories.find(r => r.name === repoName)?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          View on GitHub <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      {/* Issues for this repository */}
                      <div className="space-y-4 pl-4">
                        {repoIssues.map(issue => {
                  const getTimeRemaining = () => {
                    if (issue.status !== 'occupied' || !issue.occupiedAt) return null;
                    const duration = issue.tags.includes('easy') ? 20 * 60 * 1000 :
                                    issue.tags.includes('medium') ? 40 * 60 * 1000 :
                                    60 * 60 * 1000;
                    const elapsed = Date.now() - issue.occupiedAt;
                    const remaining = duration - elapsed;
                    if (remaining <= 0) return 'EXPIRED';
                    const minutes = Math.floor(remaining / 60000);
                    const seconds = Math.floor((remaining % 60000) / 1000);
                    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                  };

                  const timeRemaining = getTimeRemaining();
                  const pointsMap = { easy: 10, medium: 20, hard: 30 };
                  const tag = issue.tags[0] as keyof typeof pointsMap;
                  const potentialPoints = pointsMap[tag] || 0;

                  return (
                    <div key={issue.id} className={`border rounded-lg overflow-hidden ${
                      issue.status === 'closed' ? 'bg-success/5 border-success' : 
                      issue.status === 'occupied' ? 'bg-primary/5 border-primary' : 
                      'bg-card'
                    }`}>
                      {/* Header Section */}
                      <div className="p-4 border-b bg-muted/30">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono text-muted-foreground">#{issue.id}</span>
                              <h3 className="font-semibold text-lg">{issue.title}</h3>
                            </div>
                            <div className="flex gap-2 items-center flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {issue.repo}
                              </Badge>
                              {issue.tags.map(tag => (
                                <Badge 
                                  key={tag} 
                                  variant="outline" 
                                  className={`text-xs ${
                                    tag === 'easy' ? 'bg-success/10 text-success border-success' :
                                    tag === 'medium' ? 'bg-warning/10 text-warning border-warning' :
                                    'bg-destructive/10 text-destructive border-destructive'
                                  }`}
                                >
                                  {tag} • {potentialPoints} pts
                                </Badge>
                              ))}
                              <Badge 
                                variant={
                                  issue.status === 'open' ? 'outline' :
                                  issue.status === 'occupied' ? 'default' :
                                  'secondary'
                                }
                                className={
                                  issue.status === 'closed' ? 'bg-success text-white' :
                                  issue.status === 'occupied' ? 'bg-primary' :
                                  ''
                                }
                              >
                                {issue.status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2">
                            <Select
                              value={issue.status}
                              onValueChange={(value) => moveIssue(issue.id, value as any)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="occupied">Occupied</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="p-4 space-y-3">
                        {/* Team Assignment */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground min-w-[100px]">Team:</span>
                          <Select
                            value={issue.assignedTo || 'none'}
                            onValueChange={(value) => assignIssue(issue.id, value === 'none' ? null : value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {teams.map(team => (
                                <SelectItem key={team.name} value={team.name}>
                                  {team.name} ({team.points} pts)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {issue.assignedTo && (
                            <span className="text-xs text-muted-foreground">
                              Current Points: {teams.find(t => t.name === issue.assignedTo)?.points || 0}
                            </span>
                          )}
                        </div>

                        {/* Time Tracking for Occupied Issues */}
                        {issue.status === 'occupied' && issue.occupiedAt && (
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground min-w-[100px]">Time:</span>
                            <div className="flex items-center gap-2">
                              {timeRemaining === 'EXPIRED' ? (
                                <Badge variant="destructive" className="font-mono">
                                  ⏰ TIME EXPIRED - Points Deducted
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="font-mono">
                                  ⏱️ {timeRemaining} remaining
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Started: {new Date(issue.occupiedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* PR Tracking for Closed Issues */}
                        {issue.status === 'closed' && (
                          <>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-muted-foreground min-w-[100px]">Closed:</span>
                              <span className="text-xs text-muted-foreground">
                                {issue.closedAt ? new Date(issue.closedAt).toLocaleString() : 'N/A'}
                              </span>
                            </div>

                            {issue.prUrl ? (
                              <div className="mt-3 p-4 bg-muted rounded-lg space-y-3 border-l-4 border-primary">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold">Pull Request Submitted</span>
                                  <a
                                    href={issue.prUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
                                  >
                                    View PR on GitHub <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Status:</span>
                                    <Badge variant={
                                      issue.prStatus === 'merged' ? 'default' :
                                      issue.prStatus === 'approved' ? 'secondary' :
                                      issue.prStatus === 'rejected' ? 'destructive' :
                                      'outline'
                                    } className={issue.prStatus === 'merged' ? 'bg-success' : ''}>
                                      {issue.prStatus || 'PENDING REVIEW'}
                                    </Badge>
                                  </div>

                                  {issue.assignedTo && (
                                    <span className="text-sm text-muted-foreground">
                                      By: <span className="font-medium text-foreground">{issue.assignedTo}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="pt-2 text-xs text-muted-foreground">
                                  <p className="font-medium mb-1">PR URL:</p>
                                  <code className="bg-background px-2 py-1 rounded text-xs break-all">
                                    {issue.prUrl}
                                  </code>
                                </div>
                                
                                {/* Admin Actions */}
                                {issue.prStatus === 'pending' && (
                                  <div className="flex gap-2 pt-3 border-t">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        updatePrStatus(issue.id, 'approved');
                                        toast.success('PR approved! ✅');
                                      }}
                                      className="flex-1"
                                    >
                                      👍 Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => {
                                        updatePrStatus(issue.id, 'merged');
                                        toast.success(`🎉 PR merged! ${issue.assignedTo} awarded ${potentialPoints} points!`, {
                                          description: `${issue.assignedTo} earned ${potentialPoints} points for completing "${issue.title}"`
                                        });
                                      }}
                                      className="flex-1 bg-success hover:bg-success/90"
                                    >
                                      ✅ Merge & Award {potentialPoints} pts
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        updatePrStatus(issue.id, 'rejected');
                                        toast.error(`PR rejected for "${issue.title}"`, {
                                          description: 'Team will not receive points.'
                                        });
                                      }}
                                      className="flex-1"
                                    >
                                      ❌ Reject
                                    </Button>
                                  </div>
                                )}
                                
                                {issue.prStatus === 'merged' && (
                                  <div className="p-3 bg-success/10 border border-success rounded-md">
                                    <p className="text-sm text-success font-semibold flex items-center gap-2">
                                      ✅ PR Merged - {potentialPoints} points awarded to {issue.assignedTo}
                                    </p>
                                  </div>
                                )}
                                
                                {issue.prStatus === 'approved' && (
                                  <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                                    <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-2">
                                      👍 PR Approved - Waiting for merge
                                    </p>
                                  </div>
                                )}
                                
                                {issue.prStatus === 'rejected' && (
                                  <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                                    <p className="text-sm text-destructive font-semibold flex items-center gap-2">
                                      ❌ PR Rejected - No points awarded
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                                  ⚠️ Issue marked as closed but no PR URL submitted
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPanel;
