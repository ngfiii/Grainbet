import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const PlinkoGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [rows, setRows] = useState(8);
  const [isDropping, setIsDropping] = useState(false);
  const [ballPosition, setBallPosition] = useState<{x: number, y: number} | null>(null);
  const [lastResult, setLastResult] = useState<{ slot: number; multiplier: number } | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Risk-based multipliers for different row counts
  const getMultipliers = (rows: number, risk: 'low' | 'medium' | 'high') => {
    const multiplierSets = {
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
    return multiplierSets[risk][rows as keyof typeof multiplierSets[risk]] || multiplierSets[risk][8];
  };

  const multipliers = getMultipliers(rows, riskLevel);

  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas style
    const width = canvas.width;
    const height = canvas.height;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw pegs
    const pegRadius = 4;
    const startY = 60;
    const pegSpacing = (width - 100) / (rows + 1);
    const rowHeight = (height - 200) / rows;
    
    ctx.fillStyle = '#64748b';
    
    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 2;
      const startX = width / 2 - ((pegsInRow - 1) * pegSpacing) / 2;
      
      for (let peg = 0; peg < pegsInRow; peg++) {
        const x = startX + peg * pegSpacing;
        const y = startY + row * rowHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = '#64748b';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    
    // Draw ball if dropping
    if (ballPosition) {
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(ballPosition.x, ballPosition.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  useEffect(() => {
    drawBoard();
  }, [rows, ballPosition]);

  const dropBall = async () => {
    if (betAmount < 10 || betAmount > balance || isDropping) return;
    
    onUpdateBalance(-betAmount);
    setIsDropping(true);
    setLastResult(null);
    setLastWin(null);
    setBallPosition(null);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Simulate ball path
    let x = canvas.width / 2;
    const startY = 30;
    const endY = canvas.height - 100;
    const totalSteps = 50;
    const stepHeight = (endY - startY) / totalSteps;
    
    for (let step = 0; step < totalSteps; step++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      
      // Random horizontal movement
      const randomDirection = (Math.random() - 0.5) * 20;
      x += randomDirection;
      
      // Keep ball within bounds
      x = Math.max(50, Math.min(canvas.width - 50, x));
      
      const y = startY + step * stepHeight;
      setBallPosition({ x, y });
    }
    
    // Determine final slot
    const slotWidth = (canvas.width - 100) / multipliers.length;
    const slotIndex = Math.floor((x - 50) / slotWidth);
    const finalSlot = Math.max(0, Math.min(multipliers.length - 1, slotIndex));
    
    const multiplier = multipliers[finalSlot];
    setLastResult({ slot: finalSlot, multiplier });
    
    const winAmount = betAmount * multiplier;
    setLastWin(winAmount);
    onUpdateBalance(winAmount);
    
    setIsDropping(false);
    setBallPosition(null);
  };

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
        <div className="mb-6">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full border border-gray-600 rounded-lg bg-gradient-to-b from-gray-900 to-gray-800"
          />
        </div>

        {/* Multiplier Slots */}
        <div className="grid gap-1 mb-6" style={{gridTemplateColumns: `repeat(${multipliers.length}, minmax(0, 1fr))`}}>
          {multipliers.map((multiplier, index) => (
            <div
              key={index}
              className={cn(
                "text-center p-2 rounded text-sm font-bold font-mono",
                multiplier >= 10 
                  ? "bg-red-600 text-white" 
                  : multiplier >= 2 
                  ? "bg-orange-600 text-white"
                  : multiplier >= 1 
                  ? "bg-yellow-600 text-black"
                  : multiplier >= 0.5
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-white",
                lastResult?.slot === index && "ring-2 ring-yellow-400 animate-pulse"
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
            {lastWin && (
              <div className={cn(
                "text-xl font-bold font-mono",
                lastWin >= betAmount ? "text-green-400" : "text-red-400"
              )}>
                {lastWin >= betAmount ? '🎉 WIN: ' : '💔 LOSS: '}
                {lastWin.toFixed(0)} coins
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
