
interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const DashboardGame: React.FC<GameProps> = ({ balance }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">Welcome to GrainBet!</h1>
        <p className="text-xl text-gray-300">Choose a game from the sidebar to start playing</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Dice', emoji: '🎮', desc: 'Predict if the roll goes under or over your chosen number' },
          { name: 'Limbo', emoji: '🚀', desc: 'Set a target multiplier and hope the result reaches it' },
          { name: 'Blackjack', emoji: '♠️', desc: 'Beat the dealer by getting closer to 21 without going over' },
          { name: 'Mines', emoji: '💣', desc: 'Find gems while avoiding hidden mines on the grid' },
          { name: 'Keno', emoji: '🎯', desc: 'Pick numbers and see how many match the draw' },
          { name: 'Plinko', emoji: '🟡', desc: 'Drop a ball through pegs to land in multiplier slots' },
        ].map((game) => (
          <div key={game.name} className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-yellow-400 transition-colors">
            <div className="text-4xl mb-4 text-center">{game.emoji}</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">{game.name}</h3>
            <p className="text-gray-300">{game.desc}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 inline-block">
          <h3 className="text-xl font-bold mb-2">Your Balance</h3>
          <p className="text-3xl font-bold text-yellow-400">{balance.toFixed(0)} coins</p>
        </div>
      </div>
    </div>
  );
};
