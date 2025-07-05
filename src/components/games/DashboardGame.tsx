
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RedemptionTester } from '@/components/RedemptionTester';

const DashboardGame = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-yellow-400 mb-2 font-mono">Welcome to GrainBet!</h1>
        <p className="text-gray-300 font-mono">Choose a game from the sidebar to start playing and earning coins.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 font-mono">🎲 Dice</CardTitle>
            <CardDescription className="font-mono">Roll the dice and win big!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm font-mono">
              Classic dice game with customizable multipliers. Simple yet exciting!
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 font-mono">🚀 Limbo</CardTitle>
            <CardDescription className="font-mono">How high can you go?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm font-mono">
              Aim for the highest multiplier without crashing. Risk vs reward!
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 font-mono">🃏 Blackjack</CardTitle>
            <CardDescription className="font-mono">Beat the dealer!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm font-mono">
              Classic card game. Get as close to 21 as possible without going over.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 font-mono">💣 Mines</CardTitle>
            <CardDescription className="font-mono">Navigate the minefield!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm font-mono">
              Reveal tiles without hitting mines. The more you reveal, the bigger the reward!
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 font-mono">🎯 Keno</CardTitle>
            <CardDescription className="font-mono">Pick your lucky numbers!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm font-mono">
              Choose numbers and see how many match the draw. More matches = bigger wins!
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 font-mono">🏀 Plinko</CardTitle>
            <CardDescription className="font-mono">Drop and win!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm font-mono">
              Drop the ball and watch it bounce to different multiplier slots!
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <RedemptionTester />
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-400 mb-4 font-mono">How to Play</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 font-mono">
          <div>
            <h3 className="text-yellow-400 font-bold mb-2">Getting Started</h3>
            <ul className="space-y-1 text-sm">
              <li>• Choose a game from the sidebar</li>
              <li>• Set your bet amount</li>
              <li>• Play and win coins!</li>
              <li>• Redeem codes for bonus coins</li>
            </ul>
          </div>
          <div>
            <h3 className="text-yellow-400 font-bold mb-2">Tips</h3>
            <ul className="space-y-1 text-sm">
              <li>• Start with smaller bets</li>
              <li>• Learn each game's mechanics</li>
              <li>• Manage your bankroll wisely</li>
              <li>• Have fun and play responsibly!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGame;
