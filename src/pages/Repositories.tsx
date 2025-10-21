import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, LogOut, Trophy, ExternalLink, Clock, CheckCircle, Award, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

const Repositories = () => {
  const { currentTeam, repositories, issues, logoutTeam } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentTeam) {
      navigate('/');
    }
  }, [currentTeam, navigate]);

  const handleLogout = () => {
    logoutTeam();
    navigate('/');
  };

  if (!currentTeam) {
    return null;
  }

  // Get team's issues counts
  const getTeamIssuesForRepo = (repoName: string) => {
    const repoIssues = issues.filter(issue => issue.repo === repoName && issue.assignedTo === currentTeam.name);
    const inProgress = repoIssues.filter(i => i.status === 'occupied').length;
    const closed = repoIssues.filter(i => i.status === 'closed').length;
    return { inProgress, closed };
  };

  // Get total team stats
  const totalInProgress = issues.filter(i => i.status === 'occupied' && i.assignedTo === currentTeam.name).length;
  const totalClosed = issues.filter(i => i.status === 'closed' && i.assignedTo === currentTeam.name).length;
  const totalAvailable = issues.filter(i => i.status === 'open').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Modern Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg ring-2 ring-cyan-500/20">
                <img 
                  src="/image.png" 
                  alt="DataVedhi Club" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  {currentTeam.name}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Award className="w-3 h-3" />
                  Team Dashboard
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/rankings')}
                className="shadow-sm hover:shadow-md transition-all border-slate-200 dark:border-slate-700"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Rankings
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {/* Hero Stats Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold">Team Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Points Card */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="pb-3 relative z-10">
                <CardDescription className="text-blue-100 font-medium">Total Points</CardDescription>
                <CardTitle className="text-5xl font-bold">{currentTeam.points || 0}</CardTitle>
                <div className="flex items-center gap-1 text-blue-100 text-sm mt-2">
                  <Award className="w-4 h-4" />
                  <span>Keep it up!</span>
                </div>
              </CardHeader>
            </Card>

            {/* Available Issues */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-1 font-medium">
                  <GitBranch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Available Issues
                </CardDescription>
                <CardTitle className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalAvailable}</CardTitle>
                <p className="text-xs text-muted-foreground mt-2">Ready to tackle</p>
              </CardHeader>
            </Card>

            {/* In Progress */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-amber-50 dark:from-slate-800 dark:to-slate-900">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-1 font-medium">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  In Progress
                </CardDescription>
                <CardTitle className="text-4xl font-bold text-amber-600 dark:text-amber-400">{totalInProgress}</CardTitle>
                <p className="text-xs text-muted-foreground mt-2">Active work</p>
              </CardHeader>
            </Card>

            {/* Completed */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-1 font-medium">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  Completed
                </CardDescription>
                <CardTitle className="text-4xl font-bold text-green-600 dark:text-green-400">{totalClosed}</CardTitle>
                <p className="text-xs text-muted-foreground mt-2">Finished tasks</p>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Repositories Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold">Explore Repositories</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo) => {
              const { inProgress, closed } = getTeamIssuesForRepo(repo.name);
              
              return (
                <Card 
                  key={repo.name} 
                  className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white dark:bg-slate-800 overflow-hidden relative"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-600/0 group-hover:from-blue-500/5 group-hover:to-indigo-600/5 transition-all duration-300 pointer-events-none"></div>
                  
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                        <GitBranch className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        GitHub
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <CardTitle className="text-xl mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {repo.name}
                    </CardTitle>
                    
                    {/* Team's issue stats for this repo */}
                    {(inProgress > 0 || closed > 0) ? (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                        {inProgress > 0 && (
                          <Badge variant="secondary" className="text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0">
                            <Clock className="w-3 h-3 mr-1" />
                            {inProgress} Active
                          </Badge>
                        )}
                        {closed > 0 && (
                          <Badge variant="secondary" className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {closed} Done
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">No active issues yet</p>
                    )}
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <Button
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all group/btn"
                      onClick={() => navigate(`/issues/${repo.name}`)}
                    >
                      <span>View Issues</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Repositories;
