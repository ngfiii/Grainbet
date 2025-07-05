
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  path: number[];
  currentStep: number;
  isActive: boolean;
}

interface Peg {
  x: number;
  y: number;
  row: number;
  col: number;
  isAnimating: boolean;
}

export const PlinkoGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [rows, setRows] = useState(8);
  const [isDropping, setIsDropping] = useState(false);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [pegs, setPegs] = useState<Peg[]>([]);
  const [lastResult, setLastResult] = useState<{ slot: number; multiplier: number } | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [springSlots, setSpringSlots] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Risk-based multipliers for different row counts
  const getMultipliers = (rows: number, risk: 'low' | 'medium' | 'high') => {
    const multiplierSets: Record<'low' | 'medium' | 'high', Record<number, number[]>> = {
      low: {
        8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
        12: [8.4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 8.4],
        16: [16, 9, 2, 1.4, 1.1, 1, 0.5, 0.3, 0.5, 0.3, 0.5, 1, 1.1, 1.4, 2, 9, 16]
      },
      medium: {
        8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
        12: [18, 4, 1.7, 1.1, 0.5, 0.3, 0.5, 0.3, 0.5, 1.1, 1.7, 4, 18],
        16: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.2, 0.2, 0.2, 0.3, 0.6, 1.1, 2, 4, 11, 33]
      },
      high: {
        8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
        12: [43, 7, 2, 0.6, 0.2, 0.2, 0.2, 0.2, 0.2, 0.6, 2, 7, 43],
        16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
      }
    };
    return multiplierSets[risk][rows] || multiplierSets[risk][8];
  };

  const multipliers = getMultipliers(rows, riskLevel);

  // Generate provably fair path using hash
  const generatePath = (rows: number): number[] => {
    // Simple hash-based path generation (in real implementation, use proper provably fair hash)
    const seed = Date.now() + Math.random();
    const path: number[] = [];
    
    for (let i = 0; i < rows; i++) {
      const hash = Math.sin(seed * (i + 1)) * 10000;
      const bit = Math.floor((hash - Math.floor(hash)) * 2);
      path.push(bit);
    }
    
    return path;
  };

  // Initialize pegs based on row count
  const initializePegs = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newPegs: Peg[] = [];
    const centerX = canvas.width / 2;
    const startY = 80;
    const rowSpacing = 40;
    const pegSpacing = 35;

    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 1;
      for (let col = 0; col < pegsInRow; col++) {
        const x = centerX + (col - row / 2) * pegSpacing;
        const y = startY + row * rowSpacing;
        
        newPegs.push({
          x,
          y,
          row,
          col,
          isAnimating: false
        });
      }
    }

    setPegs(newPegs);
  };

  // Draw the plinko board
  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw pegs
    pegs.forEach(peg => {
      const pegRadius = peg.isAnimating ? 6 : 4;
      
      // Peg shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(peg.x + 2, peg.y + 2, pegRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Peg
      ctx.fillStyle = peg.isAnimating ? '#fbbf24' : '#64748b';
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, pegRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Peg highlight
      ctx.fillStyle = peg.isAnimating ? '#fcd34d' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(peg.x - 1, peg.y - 1, pegRadius * 0.6, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw bucket dividers at the bottom
    const bucketY = height - 80;
    const bucketWidth = (width - 80) / multipliers.length;
    
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    for (let i = 0; i <= multipliers.length; i++) {
      const x = 40 + i * bucketWidth;
      ctx.beginPath();
      ctx.moveTo(x, bucketY);
      ctx.lineTo(x, height - 40);
      ctx.stroke();
    }
    
    // Draw balls
    balls.forEach(ball => {
      if (!ball.isActive) return;
      
      // Ball shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(ball.x + 2, ball.y + 2, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Ball
      const ballGradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, 8);
      ballGradient.addColorStop(0, '#fbbf24');
      ballGradient.addColorStop(1, '#f59e0b');
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 8, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Animate peg bounce
  const animatePeg = (row: number, col: number) => {
    setPegs(prev => prev.map(peg => 
      peg.row === row && peg.col === col 
        ? { ...peg, isAnimating: true }
        : peg
    ));

    setTimeout(() => {
      setPegs(prev => prev.map(peg => 
        peg.row === row && peg.col === col 
          ? { ...peg, isAnimating: false }
          : peg
      ));
    }, 100);
  };

  // Animate ball movement
  const animateBall = async (ball: Ball) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const startY = 50;
    const rowSpacing = 40;
    const pegSpacing = 35;
    const bucketY = canvas.height - 80;
    const bucketWidth = (canvas.width - 80) / multipliers.length;

    let currentX = centerX;
    let currentY = startY;

    // Update ball position
    setBalls(prev => prev.map(b => 
      b.id === ball.id 
        ? { ...b, x: currentX, y: currentY, isActive: true }
        : b
    ));

    // Animate through each row
    for (let step = 0; step < ball.path.length; step++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const direction = ball.path[step]; // 1 = right, 0 = left
      const nextX = currentX + (direction === 1 ? pegSpacing / 2 : -pegSpacing / 2);
      const nextY = currentY + rowSpacing;

      // Animate peg hit
      const pegCol = direction === 1 ? step : step + 1;
      animatePeg(step, pegCol);

      // Update ball position
      currentX = nextX;
      currentY = nextY;

      setBalls(prev => prev.map(b => 
        b.id === ball.id 
          ? { ...b, x: currentX, y: currentY }
          : b
      ));
    }

    // Final drop into bucket
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const finalSlot = ball.path.reduce((sum, bit) => sum + bit, 0);
    const bucketX = 40 + (finalSlot + 0.5) * bucketWidth;
    
    setBalls(prev => prev.map(b => 
      b.id === ball.id 
        ? { ...b, x: bucketX, y: bucketY + 20, isActive: true }
        : b
    ));

    // Calculate result
    const multiplier = multipliers[finalSlot];
    setLastResult({ slot: finalSlot, multiplier });
    
    // Trigger spring animation
    setSpringSlots([finalSlot]);
    setTimeout(() => setSpringSlots([]), 800);
    
    const profit = betAmount * (multiplier - 1);
    setLastWin(profit);
    onUpdateBalance(profit);
    
    setIsDropping(false);
    
    // Clean up ball after animation
    setTimeout(() => {
      setBalls(prev => prev.filter(b => b.id !== ball.id));
    }, 1000);
  };

  // Drop ball function
  const dropBall = async () => {
    if (betAmount < 10 || betAmount > balance || isDropping) return;
    
    onUpdateBalance(-betAmount);
    setIsDropping(true);
    setLastResult(null);
    setLastWin(null);

    // Generate deterministic path
    const path = generatePath(rows);
    
    // Create new ball
    const newBall: Ball = {
      id: Date.now(),
      x: 0,
      y: 0,
      path,
      currentStep: 0,
      isActive: false
    };

    setBalls([newBall]);
    
    // Start animation
    animateBall(newBall);
  };

  // Initialize pegs when rows change
  useEffect(() => {
    initializePegs();
  }, [rows]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      drawBoard();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pegs, balls, multipliers]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center font-mono">🟡 Plinko</h2>
        
        {/* Controls Row */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {/* Bet Amount */}
          <div>
            <label className="block text-sm font-medium mb-2 font-mono">Bet Amount (min: 10)</label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 10))}
              className="bg-gray-700 border-gray-600 text-white font-mono"
              min={10}
            />
          </div>
          
          {/* Risk Level */}
          <div>
            <label className="block text-sm font-medium mb-2 font-mono">Risk</label>
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as const).map((risk) => (
                <Button
                  key={risk}
                  onClick={() => setRiskLevel(risk)}
                  className={cn(
                    "flex-1 text-xs font-mono",
                    riskLevel === risk
                      ? risk === 'low' ? 'bg-green-600 hover:bg-green-700' :
                        risk === 'medium' ? 'bg-yellow-600 hover:bg-yellow-700' :
                        'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  )}
                >
                  {risk.charAt(0).toUpperCase() + risk.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Rows */}
          <div>
            <label className="block text-sm font-medium mb-2 font-mono">Rows</label>
            <div className="grid grid-cols-3 gap-1">
              {[8, 12, 16].map((rowCount) => (
                <Button
                  key={rowCount}
                  onClick={() => setRows(rowCount)}
                  className={cn(
                    "text-xs font-mono",
                    rows === rowCount ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
                  )}
                >
                  {rowCount}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Drop Button */}
          <div className="flex items-end">
            <Button
              onClick={dropBall}
              disabled={betAmount > balance || isDropping || betAmount < 10}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 font-mono"
            >
              {isDropping ? 'Dropping...' : 'Drop'}
            </Button>
          </div>
        </div>

        {/* Plinko Board */}
        <div className="mb-2 relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={500}
            className="w-full border border-gray-600 rounded-lg"
          />
        </div>

        {/* Multiplier Slots */}
        <div className="grid gap-1 mb-6" style={{gridTemplateColumns: `repeat(${multipliers.length}, minmax(0, 1fr))`}}>
          {multipliers.map((multiplier, index) => (
            <div
              key={index}
              className={cn(
                "text-center p-2 rounded text-sm font-bold font-mono transition-transform duration-300",
                multiplier >= 10 
                  ? "bg-red-600 text-white" 
                  : multiplier >= 2 
                  ? "bg-orange-600 text-white"
                  : multiplier >= 1 
                  ? "bg-yellow-600 text-black"
                  : multiplier >= 0.5
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-white",
                lastResult?.slot === index && "ring-2 ring-yellow-400 animate-pulse",
                springSlots.includes(index) && "animate-bounce scale-110"
              )}
            >
              {multiplier}x
            </div>
          ))}
        </div>

        {/* Result Display */}
        {lastResult && (
          <div className="text-center">
            <div className="text-2xl font-bold mb-2 font-mono">
              Ball landed in {lastResult.multiplier}x slot!
            </div>
            {lastWin !== null && (
              <div className={cn(
                "text-xl font-bold font-mono",
                lastWin > 0 ? "text-green-400" : "text-red-400"
              )}>
                {lastWin > 0 ? '🎉 PROFIT: ' : '💔 LOSS: '}
                {Math.abs(lastWin).toFixed(0)} coins
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
