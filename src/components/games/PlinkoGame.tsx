import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

const multipliers = [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000];

export const PlinkoGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const sceneRef = useRef<HTMLDivElement>(null);

  const engine = useRef<any>(null);
  const [isDropping, setIsDropping] = useState(false);

  useEffect(() => {
    const Matter = (window as any).Matter;
    if (!Matter) {
      console.error('Matter.js not loaded');
      return;
    }

    engine.current = Matter.Engine.create();

    const render = Matter.Render.create({
      element: sceneRef.current!,
      engine: engine.current,
      options: {
        width: 700,
        height: 600,
        wireframes: false,
        background: '#1f2937',
      },
    });

    const world = engine.current.world;
    Matter.World.clear(world);
    Matter.Engine.clear(engine.current);

    // Create walls
    const walls = [
      Matter.Bodies.rectangle(350, 0, 700, 20, { isStatic: true }),
      Matter.Bodies.rectangle(350, 600, 700, 20, { isStatic: true }),
      Matter.Bodies.rectangle(0, 300, 20, 600, { isStatic: true }),
      Matter.Bodies.rectangle(700, 300, 20, 600, { isStatic: true }),
    ];
    Matter.World.add(world, walls);

    // Create pegs
    const pegRows = 10;
    const spacing = 50;
    for (let row = 0; row < pegRows; row++) {
      for (let col = 0; col < row + 1; col++) {
        // stagger odd rows instead of even
        const x = 100 + col * spacing + (row % 2 !== 0 ? spacing / 2 : 0);
        const y = 100 + row * spacing;
        const peg = Matter.Bodies.circle(x, y, 5, {
          isStatic: true,
          render: { fillStyle: '#facc15' },
        });
        Matter.World.add(world, peg);
      }
    }

    // Create bins
    const binWidth = 700 / multipliers.length;
    for (let i = 0; i < multipliers.length + 1; i++) {
      const binWall = Matter.Bodies.rectangle(i * binWidth, 580, 10, 100, {
        isStatic: true,
        render: { fillStyle: '#374151' },
      });
      Matter.World.add(world, binWall);
    }

    Matter.Engine.run(engine.current);
    Matter.Render.run(render);

    return () => {
      Matter.Render.stop(render);
      Matter.World.clear(world);
      Matter.Engine.clear(engine.current);
      render.canvas.remove();
    };
  }, []);

  const dropBall = () => {
    const Matter = (window as any).Matter;
    if (!Matter || !engine.current) return;
    if (betAmount > balance || isDropping) return;

    setIsDropping(true);
    onUpdateBalance(-betAmount);

    // drop ball centered over pegs
    const pegRows = 10;
    const spacing = 50;
    const ballDropX = 100 + ((pegRows - 1) * spacing) / 2;

    const ball = Matter.Bodies.circle(ballDropX, 20, 8, {
      restitution: 0.5,
      render: { fillStyle: '#facc15' },
      label: 'plinko-ball',
    });

    Matter.World.add(engine.current.world, ball);

    setTimeout(() => {
      const x = ball.position.x;
      const binIndex = Math.floor((x / 700) * multipliers.length);
      const index = Math.max(0, Math.min(multipliers.length - 1, binIndex));
      const multiplier = multipliers[index];
      const payout = betAmount * multiplier;

      if (multiplier >= 1) onUpdateBalance(payout);

      setIsDropping(false);
      Matter.World.remove(engine.current.world, ball);
    }, 5000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center font-mono">🟡 Plinko</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 font-mono">Bet Amount</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-gray-700 border-gray-600 text-white font-mono"
          />
        </div>

        <div className="mb-6 text-center text-gray-300 font-mono">
          Max payout: {(betAmount * 1000).toFixed(0)} coins
        </div>

        <div className="mb-6 border border-gray-600 rounded-xl overflow-hidden">
          <div ref={sceneRef} className="w-full h-[600px]" />
        </div>

        <Button
          onClick={dropBall}
          disabled={betAmount > balance || isDropping}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 font-mono"
        >
          {isDropping ? 'Dropping Ball... 🟡' : `Drop Ball (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};
