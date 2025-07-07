
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy, Crown, Medal, Award, TrendingUp, Target, Zap } from 'lucide-react';

interface LeaderboardEntry {
  username: string;
  balance: number;
  total_bets: number;
  biggest_win: number;
  longest_win_streak: number;
  user_id: string;
}

interface UserDetailStats {
  total_bets: number;
  total_won: number;
  total_lost: number;
  biggest_win: number;
  longest_win_streak: number;
  longest_loss_streak: number;
  current_win_streak: number;
  win_rate: number;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const [userStats, setUserStats] = useState<UserDetailStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('leaderboard_stats')
      .select('*')
      .limit(50);

    if (error) {
      toast.error('Failed to fetch leaderboard');
      console.error('Leaderboard error:', error);
      return;
    }

    setLeaderboard(data || []);
    setLoading(false);
  };

  const fetchUserStats = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user stats:', error);
      return;
    }

    const winRate = data.total_bets > 0 ? 
      ((data.total_won / (data.total_won + data.total_lost)) * 100) : 0;

    setUserStats({
      ...data,
      win_rate: winRate
    });
  };

  const handleUserClick = (user: LeaderboardEntry) => {
    setSelectedUser(user);
    fetchUserStats(user.user_id);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-400';
      case 1:
        return 'bg-gradient-to-r from-gray-300/20 to-gray-500/20 border-gray-300';
      case 2:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-800/20 border-amber-600';
      default:
        return 'bg-gray-750 border-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-300 font-mono">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img alt="GrainBet Logo" className="w-8 h-8" src="/lovable-uploads/b02b29fd-4df8-4fd3-83d6-52e449f3c4ab.png" />
            <h1 className="text-3xl font-bold text-yellow-400 font-mono">Leaderboard</h1>
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-gray-300 font-mono">Top players ranked by coin balance</p>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            <div className="order-1 text-center">
              <div className="bg-gradient-to-t from-gray-500/20 to-gray-300/20 border border-gray-300 rounded-lg p-4 mb-2">
                <Medal className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <div className="text-lg font-bold font-mono">{leaderboard[1].username}</div>
                <div className="text-2xl font-bold text-gray-300 font-mono">{leaderboard[1].balance}</div>
                <div className="text-sm text-gray-400">coins</div>
              </div>
              <div className="bg-gray-300 h-16 rounded-t-lg flex items-center justify-center">
                <span className="text-gray-800 font-bold text-xl">2</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="order-2 text-center">
              <div className="bg-gradient-to-t from-yellow-600/20 to-yellow-400/20 border border-yellow-400 rounded-lg p-4 mb-2">
                <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                <div className="text-xl font-bold font-mono">{leaderboard[0].username}</div>
                <div className="text-3xl font-bold text-yellow-400 font-mono">{leaderboard[0].balance}</div>
                <div className="text-sm text-gray-400">coins</div>
              </div>
              <div className="bg-yellow-400 h-20 rounded-t-lg flex items-center justify-center">
                <span className="text-black font-bold text-2xl">1</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 text-center">
              <div className="bg-gradient-to-t from-amber-800/20 to-amber-600/20 border border-amber-600 rounded-lg p-4 mb-2">
                <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <div className="text-lg font-bold font-mono">{leaderboard[2].username}</div>
                <div className="text-2xl font-bold text-amber-600 font-mono">{leaderboard[2].balance}</div>
                <div className="text-sm text-gray-400">coins</div>
              </div>
              <div className="bg-amber-600 h-12 rounded-t-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">3</span>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-green-400 font-mono flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Full Rankings
            </CardTitle>
            <CardDescription>Complete leaderboard sorted by coin balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leaderboard.map((entry, index) => (
                <Dialog key={entry.user_id}>
                  <DialogTrigger asChild>
                    <div
                      className={`p-4 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${getRankColor(index)}`}
                      onClick={() => handleUserClick(entry)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 min-w-[60px]">
                            {getRankIcon(index)}
                            <span className="font-bold text-lg font-mono">#{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-mono font-bold text-lg">{entry.username}</div>
                            <div className="text-sm text-gray-400">
                              {entry.total_bets} bets • Best win: {entry.biggest_win}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400 font-mono">
                            {entry.balance}
                          </div>
                          <div className="text-sm text-gray-400">coins</div>
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-yellow-400 font-mono flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        {selectedUser?.username} - Player Stats
                      </DialogTitle>
                      <DialogDescription className="text-gray-300">
                        Detailed statistics for this player
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-750 rounded-lg text-center">
                          <div className="text-xl font-bold text-green-400 font-mono">
                            {selectedUser?.balance}
                          </div>
                          <div className="text-sm text-gray-400">Current Balance</div>
                        </div>
                        <div className="p-3 bg-gray-750 rounded-lg text-center">
                          <div className="text-xl font-bold text-blue-400 font-mono">
                            {userStats?.total_bets || 0}
                          </div>
                          <div className="text-sm text-gray-400">Total Bets</div>
                        </div>
                        <div className="p-3 bg-gray-750 rounded-lg text-center">
                          <div className="text-xl font-bold text-purple-400 font-mono">
                            {userStats?.biggest_win || 0}
                          </div>
                          <div className="text-sm text-gray-400">Biggest Win</div>
                        </div>
                        <div className="p-3 bg-gray-750 rounded-lg text-center">
                          <div className="text-xl font-bold text-yellow-400 font-mono">
                            {userStats?.longest_win_streak || 0}
                          </div>
                          <div className="text-sm text-gray-400">Best Streak</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-750 rounded-lg text-center">
                          <div className="text-lg font-bold text-cyan-400 font-mono">
                            {userStats?.win_rate.toFixed(1) || 0}%
                          </div>
                          <div className="text-sm text-gray-400">Win Rate</div>
                        </div>
                        <div className="p-3 bg-gray-750 rounded-lg text-center">
                          <div className="text-lg font-bold text-orange-400 font-mono">
                            {userStats?.current_win_streak || 0}
                          </div>
                          <div className="text-sm text-gray-400">Current Streak</div>
                        </div>
                        <div className="p-3 bg-gray-750 rounded-lg text-center">
                          <div className="text-lg font-bold text-pink-400 font-mono">
                            {userStats ? (userStats.total_won - userStats.total_lost).toFixed(0) : 0}
                          </div>
                          <div className="text-sm text-gray-400">Net Profit</div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-400 font-mono">
                {leaderboard.length}
              </div>
              <div className="text-sm text-gray-400">Total Players</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-400 font-mono">
                {leaderboard.reduce((sum, player) => sum + player.balance, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Coins</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400 font-mono">
                {Math.max(...leaderboard.map(p => p.biggest_win)).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Biggest Win</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
