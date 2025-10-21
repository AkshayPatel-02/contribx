import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, GitBranch, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const TeamLogin = () => {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const { loginTeam } = useApp();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginTeam(teamName, password);
    
    if (result.success) {
      toast.success('🎉 Welcome back! Let\'s build something amazing!');
      navigate('/repositories');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-200/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/20 dark:bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-200/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8 px-8">
          {/* Logo Section */}
          <div className="flex items-center gap-4 mb-6">
            <img 
              src="./image.png" 
              alt="DataVedhi Club Logo" 
              className="w-24 h-24 rounded-2xl shadow-lg object-cover"
            />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">DataVedhi.Club</h2>
              <p className="text-sm text-muted-foreground">Day 2 Competition</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-full border border-cyan-500/20">
              <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-sm font-medium text-cyan-700 dark:text-cyan-400">Welcome to ContribX</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-700 dark:from-cyan-400 dark:via-teal-400 dark:to-cyan-500 bg-clip-text text-transparent">
              Learn, Contribute<br />
              and Grow
            </h1>
            <p className="text-xl font-semibold text-cyan-600 dark:text-cyan-400 mb-2">
              One Repository at a Time
            </p>
            <p className="text-lg text-muted-foreground max-w-md">
              Join your team, tackle exciting challenges, and climb the leaderboard. Every contribution counts!
            </p>
          </div>

          {/* Feature highlights */}
         
        </div>

        {/* Right side - Login form */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 transform hover:scale-105 transition-transform">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">Team Portal</CardTitle>
              <CardDescription className="text-base">Sign in to start contributing</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Team Name</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter your team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="h-14 pl-12 text-base border-slate-200 dark:border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 pl-12 text-base border-slate-200 dark:border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all"
                size="lg"
              >
                Sign In
              </Button>
            </form>
            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground mb-3">Administrator?</p>
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="text-sm hover:bg-cyan-50 dark:hover:bg-cyan-950 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all"
              >
                Access Admin Panel →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamLogin;
