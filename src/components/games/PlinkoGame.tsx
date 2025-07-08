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
  const engine = useRef<any>(null);
  const render = useRef<any>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [binsX, setBinsX] = useState<number[]>([]);

  useEffect(() => {
    if (!sceneRef.current || !Matter) return;

    // Create Matter.js engine and renderer
    engine.current = Matter.Engine.create({
      gravity: { x: 0, y: 1 },
    });

    render.current = Matter.Render.create({
      element: sceneRef.current,
      engine: engine.current,
      options: {
        width: 700,
        height: 600,
        wireframes: false,
        background: '#1a202c',
        pixelRatio: window.devicePixelRatio || 1,
      },
    });

    const world = engine.current.world;
    Matter.World.clear(world);
    Matter.Engine.clear(engine.current);

    // Add walls
    const walls = [
      Matter.Bodies.rectangle(350, -10, 720, 20, { isStatic: true, render: { fillStyle: '#1a202c' } }),
      Matter.Bodies.rectangle(350, 610, 720, 20, { isStatic: true, render: { fillStyle: '#1a202c' } }),
      Matter.Bodies.rectangle(-10, 300, 20, 620, { isStatic: true, render: { fillStyle: '#1a202c' } }),
      Matter.Bodies.rectangle(710, 300, 20, 620, { isStatic: true, render: { fillStyle: '#1a202c' } }),
    ];
    Matter.World.add(world, walls);

    // Create pegs in a triangular grid
    const pegRows = 12;
    const spacingX = 45;
    const spacingY = 45;
    const startX = 350;
    const startY = 80;

    for (let row = 0; row < pegRows; row++) {
      const pegsInRow = row + 3; // Wider base for Rainbet-like layout
      const offsetX = -(pegsInRow * spacingX) / 2;

      for (let col = 0; col < pegsInRow; col++) {
        const x = startX + offsetX + col * spacingX;
        const y = startY + row * spacingY;

        const peg = Matter.Bodies.circle(x, y, 6, {
          isStatic: true,
          render: { fillStyle: '#facc15', strokeStyle: '#ffffff', lineWidth: 1 },
          collisionFilter: { group: -1 },
        });
        Matter.World.add(world, peg);
      }
    }

    // Create bins
    const binCount = multipliers.length;
    const binWidth = 700 / binCount;
    const binWalls: any[] = [];
    const binPositions: number[] = [];

    for (let i = 0; i <= binCount; i++) {
      const x = i * binWidth;
      const binWall = Matter.Bodies.rectangle(x, 580, 5, 100, {
        isStatic: true,
        render: { fillStyle: '#4b5563' },
        collisionFilter: { group: -1 },
      });
      binWalls.push(binWall);
      if (i < binCount) binPositions.push(x + binWidth / 2);
    }

    Matter.World.add(world, binWalls);
    setBinsX(binPositions);

    // Start engine and renderer
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine.current);
    Matter.Render.run(render.current);

    // Cleanup
    return () => {
      Matter.Render.stop(render.current);
      Matter.Runner.stop(runner);
      Matter.World.clear(world);
      Matter.Engine.clear(engine.current);
      render.current.canvas.remove();
    };
  }, [Matter]);

  const dropBall = () => {
    if (!engine.current || !Matter || betAmount > balance || isDropping) return;

    setIsDropping(true);
    onUpdateBalance(-betAmount);

    const ballX = 350; // Center drop
    const ballRadius = 8;

    const ball = Matter.Bodies.circle(ballX, 20, ballRadius, {
      restitution: 0.6, // Slightly bouncier for Rainbet-like feel
      friction: 0.01,
      frictionAir: 0.005,
      density: 0.001,
      render: { fillStyle: '#facc15', strokeStyle: '#ffffff', lineWidth: 1 },
      label: 'plinko-ball',
    });

    Matter.World.add(engine.current.world, ball);

    // Detect bin landing
    const checkBallPosition = () => {
      if (!ball || !engine.current) {
        setIsDropping(false);
        return;
      }

      const x = ball.position.x;
      const y = ball.position.y;

      if (y > 550) { // Ball has reached the bins
        const binIndex = Math.floor((x / 700) * multipliers.length);
        const index = Math.max(0, Math.min(multipliers.length - 1, binIndex));
        const multiplier = multipliers[index];
        const payout = betAmount * multiplier;

        onUpdateBalance(payout);
        setIsDropping(false);
        Matter.World.remove(engine.current.world, ball);
      } else {
        setTimeout(checkBallPosition, 100);
      }
    };

    setTimeout(checkBallPosition, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto select-none">
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-xl">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center font-mono">🟡 Plinko</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">Bet Amount</label>
          <Input
            type="number"
            value={betAmount}
            min={1}
            max={balance}
            onChange={(e) => setBetAmount(Math.min(balance, Math.max(1, parseInt(e.target.value) || 1)))}
            className="bg-gray-800 border-gray-600 text-white font-mono rounded-md focus:ring-yellow-500 focus:border-yellow-500"
          />
        </div>

        <div className="mb-6 text-center text-gray-300 font-mono">
          Max payout: {(betAmount * 1000).toFixed(0)} coins
        </div>

        <div className="mb-6 border border-gray-600 rounded-xl overflow-hidden relative bg-gray-800">
          <div ref={sceneRef} className="w-full h-[600px]" />

          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 5px',
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: '#facc15',
              fontSize: 12,
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
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-md transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
        >
          {isDropping ? 'Dropping Ball... 🟡' : `Drop Ball (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};