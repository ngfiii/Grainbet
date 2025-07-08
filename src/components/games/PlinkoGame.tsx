import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

const multipliers = [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000];

export const PlinkoGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const Matter = (window as any).Matter;
  const [betAmount, setBetAmount] = useState(10);
  const sceneRef = useRef<HTMLDivElement>(null);
  const engine = useRef<any>();
  const [isDropping, setIsDropping] = useState(false);
  const [binsX, setBinsX] = useState<number[]>([]);

  useEffect(() => {
    if (!sceneRef.current || !Matter) return;

    engine.current = Matter.Engine.create();

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine.current,
      options: {
        width: 700,
        height: 600,
        wireframes: false,
        background: '#1f2937',
        pixelRatio: window.devicePixelRatio || 1,
      },
    });

    const world = engine.current.world;
    Matter.World.clear(world);
    Matter.Engine.clear(engine.current);

    const walls = [
      Matter.Bodies.rectangle(350, 0, 700, 20, { isStatic: true }),
      Matter.Bodies.rectangle(350, 600, 700, 20, { isStatic: true }),
      Matter.Bodies.rectangle(0, 300, 20, 600, { isStatic: true }),
      Matter.Bodies.rectangle(700, 300, 20, 600, { isStatic: true }),
    ];
    Matter.World.add(world, walls);

    const pegRows = 13;
    const spacingX = 50;
    const spacingY = 43;

    for (let row = 0; row < pegRows; row++) {
      const pegsInRow = row + 1;
      const offsetX = (row % 2 === 0) ? spacingX / 2 : 0;

      for (let col = 0; col < pegsInRow; col++) {
        const x = 50 + col * spacingX + offsetX;
        const y = 80 + row * spacingY;

        const peg = Matter.Bodies.circle(x, y, 7, {
          isStatic: true,
          render: { fillStyle: '#facc15' },
          collisionFilter: { group: -1 },
        });
        Matter.World.add(world, peg);
      }
    }

    const binCount = multipliers.length;
    const binWidth = 700 / binCount;
    const binWalls: any[] = [];
    const binPositions: number[] = [];

    for (let i = 0; i <= binCount; i++) {
      const x = i * binWidth;
      const binWall = Matter.Bodies.rectangle(x, 580, 10, 120, {
        isStatic: true,
        render: { fillStyle: '#374151' },
        collisionFilter: { group: -1 },
      });
      binWalls.push(binWall);
      if (i < binCount) binPositions.push(x + binWidth / 2);
    }

    Matter.World.add(world, binWalls);

    const ground = Matter.Bodies.rectangle(350, 620, 700, 40, {
      isStatic: true,
      render: { visible: false },
    });
    Matter.World.add(world, ground);

    setBinsX(binPositions);

    Matter.Engine.run(engine.current);
    Matter.Render.run(render);

    return () => {
      Matter.Render.stop(render);
      Matter.World.clear(world);
      Matter.Engine.clear(engine.current);
      render.canvas.remove();
    };
  }, [Matter]);

  const dropBall = () => {
    if (!engine.current || !Matter) return;
    if (betAmount > balance || isDropping) return;

    setIsDropping(true);
    onUpdateBalance(-betAmount);

    const ballX = 50 + (multipliers.length * 50) / 2;
    const ballRadius = 10;

    const ball = Matter.Bodies.circle(ballX, 20, ballRadius, {
      restitution: 0.5,
      friction: 0.02,
      frictionAir: 0.01,
      density: 0.002,
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
    }, 6000);
  };

  return (
    <div className="max-w-2xl mx-auto select-none">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center font-mono">🟡 Plinko</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 font-mono">Bet Amount</label>
          <Input
            type="number"
            value={betAmount}
            min={1}
            max={balance}
            onChange={(e) => setBetAmount(Math.min(balance, Math.max(1, parseInt(e.target.value) || 1)))}
            className="bg-gray-700 border-gray-600 text-white font-mono"
          />
        </div>

        <div className="mb-6 text-center text-gray-300 font-mono">
          Max payout: {(betAmount * 1000).toFixed(0)} coins
        </div>

        <div className="mb-6 border border-gray-600 rounded-xl overflow-hidden relative">
          <div ref={sceneRef} className="w-full h-[600px]" />

          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 10px',
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: '#facc15',
              fontSize: 14,
              letterSpacing: 1,
            }}
          >
            {binsX.map((x, i) => (
              <div key={i} style={{ width: `${700 / multipliers.length}px`, textAlign: 'center' }}>
                {multipliers[i]}x
              </div>
            ))}
          </div>
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
