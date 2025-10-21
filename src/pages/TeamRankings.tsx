import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';

const TeamRankings = () => {
  const navigate = useNavigate();
  const { teams, currentTeam } = useApp();

  const sortedTeams = [...teams].sort((a, b) => b.points - a.points);

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-warning" />;
      case 1: return <Medal className="w-6 h-6 text-muted-foreground" />;
      case 2: return <Medal className="w-6 h-6 text-amber-700" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/repositories')} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Repositories
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Team Rankings
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto shadow-elevated">
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedTeams.map((team, index) => (
                <div
                  key={team.name}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    team.name === currentTeam?.name
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex justify-center">
                      {getMedalIcon(index) || (
                        <span className="text-lg font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{team.name}</p>
                      {team.active && (
                        <span className="text-xs text-success">● Active</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{team.points}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TeamRankings;
