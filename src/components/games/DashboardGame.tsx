
interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

interface DashboardGameProps extends GameProps {
  onGameSelect: (game: string) => void;
}

export const DashboardGame: React.FC<DashboardGameProps> = ({ balance, onGameSelect }) => {
  const games = [
    { id: 'dice', name: 'Dice', emoji: '🎮', desc: 'Predict if the roll goes under or over your chosen number' },
    { id: 'limbo', name: 'Limbo', emoji: '🚀', desc: 'Set a target multiplier and hope the result reaches it' },
    { id: 'blackjack', name: 'Blackjack', emoji: '♠️', desc: 'Beat the dealer by getting closer to 21 without going over' },
    { id: 'mines', name: 'Mines', emoji: '💣', desc: 'Find gems while avoiding hidden mines on the grid' },
    { id: 'keno', name: 'Keno', emoji: '🎯', desc: 'Pick numbers and see how many match the draw' },
    { id: 'plinko', name: 'Plinko', emoji: '🟡', desc: 'Drop a ball through pegs to land in multiplier slots' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4 font-mono">Welcome to GrainBet!</h1>
        <p className="text-xl text-gray-300 font-mono">Choose a game from below to start playing</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <div 
            key={game.id} 
            onClick={() => onGameSelect(game.id)}
            className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-yellow-400 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl"
          >
            <div className="text-4xl mb-4 text-center">{game.emoji}</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2 font-mono">{game.name}</h3>
            <p className="text-gray-300 font-mono text-sm">{game.desc}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 inline-block">
          <h3 className="text-xl font-bold mb-2 font-mono">Your Balance</h3>
          <p className="text-3xl font-bold text-yellow-400 font-mono">{balance.toFixed(0)} coins</p>
        </div>
      </div>

      {/* Credits */}
      <div className="fixed bottom-4 left-4 text-xs text-gray-500 font-mono">
        🤫 ngfi on dc, updating soon
      </div>
    </div>
  );
};
