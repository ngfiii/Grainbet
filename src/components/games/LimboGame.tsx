import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const LimboGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [targetMultiplier, setTargetMultiplier] = useState(2.0);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [animatedResult, setAnimatedResult] = useState<number>(0);

  const winChance = Math.min(99, Math.max(1, 99 / targetMultiplier));

  // Toggle which generator to use:
  const useManual = false; // set to true to use manual CDF interpolation, false to use math-based generator

  // Data for mathematical generator:
  const multiplierRanges = [
    { min: 1.00, max: 2.00, probMin: 1.0, probMax: 0.5 },
    { min: 2.00, max: 3.00, probMin: 0.5, probMax: 0.3333 },
    { min: 3.00, max: 4.00, probMin: 0.3333, probMax: 0.25 },
    { min: 4.00, max: 5.00, probMin: 0.25, probMax: 0.2 },
    { min: 5.00, max: 6.00, probMin: 0.2, probMax: 0.1667 },
    { min: 6.00, max: 7.00, probMin: 0.1667, probMax: 0.1429 },
    { min: 7.00, max: 8.00, probMin: 0.1429, probMax: 0.125 },
    { min: 8.00, max: 9.00, probMin: 0.125, probMax: 0.1111 },
    { min: 9.00, max: 10.00, probMin: 0.1111, probMax: 0.1 },
    { min: 10.00, max: 15.00, probMin: 0.1, probMax: 0.0667 },
    { min: 15.00, max: 20.00, probMin: 0.0667, probMax: 0.05 },
    { min: 20.00, max: 25.00, probMin: 0.05, probMax: 0.04 },
    { min: 25.00, max: 30.00, probMin: 0.04, probMax: 0.0333 },
    { min: 30.00, max: 35.00, probMin: 0.0333, probMax: 0.0286 },
    { min: 35.00, max: 40.00, probMin: 0.0286, probMax: 0.025 },
    { min: 40.00, max: 45.00, probMin: 0.025, probMax: 0.0222 },
    { min: 45.00, max: 50.00, probMin: 0.0222, probMax: 0.02 },
  ];

  // Manual CDF data for manual generator:
  const rainbetCdfManual = [
    { multiplier: 1.00, cumProb: 1.0 },
    { multiplier: 2.00, cumProb: 0.5 },
    { multiplier: 3.00, cumProb: 0.3333 },
    { multiplier: 4.00, cumProb: 0.25 },
    { multiplier: 5.00, cumProb: 0.2 },
    { multiplier: 6.00, cumProb: 0.1667 },
    { multiplier: 7.00, cumProb: 0.1429 },
    { multiplier: 8.00, cumProb: 0.125 },
    { multiplier: 9.00, cumProb: 0.1111 },
    { multiplier: 10.00, cumProb: 0.1 },
    { multiplier: 15.00, cumProb: 0.0667 },
    { multiplier: 20.00, cumProb: 0.05 },
    { multiplier: 25.00, cumProb: 0.04 },
    { multiplier: 30.00, cumProb: 0.0333 },
    { multiplier: 35.00, cumProb: 0.0286 },
    { multiplier: 40.00, cumProb: 0.025 },
    { multiplier: 45.00, cumProb: 0.0222 },
    { multiplier: 50.00, cumProb: 0.02 },
  ];

  const generateCrashPointMath = (): number => {
    const p = Math.random();

    for (const range of multiplierRanges) {
      if (p <= range.probMin && p > range.probMax) {
        const probInterval = range.probMin - range.probMax;
        const localP = (p - range.probMax) / probInterval;
        const multiplier = range.min + localP * (range.max - range.min);
        return parseFloat(multiplier.toFixed(2));
      }
    }
    // Fallback:
    return 1.0;
  };

  const generateCrashPointManual = (): number => {
    const r = Math.random();

    // Iterate backward for correct interpolation:
    for (let i = rainbetCdfManual.length - 1; i >= 0; i--) {
      if (r <= rainbetCdfManual[i].cumProb) {
        if (i === rainbetCdfManual.length - 1) return rainbetCdfManual[i].multiplier;

        const curr = rainbetCdfManual[i];
        const next = rainbetCdfManual[i + 1];

        const rangeProb = next.cumProb - curr.cumProb;
        const localP = (r - curr.cumProb) / rangeProb;
        const multiplier = curr.multiplier + localP * (next.multiplier - curr.multiplier);
        return parseFloat(multiplier.toFixed(2));
      }
    }
    return 1.0;
  };

  const generateLimboCrashPoint = () => (useManual ? generateCrashPointManual() : generateCrashPointMath());

  const roll = async () => {
    if (betAmount < 10 || betAmount > balance) return;

    setIsRolling(true);
    setResult(null);
    setLastWin(null);
    setAnimatedResult(0);

    onUpdateBalance(-betAmount);

    const crashPoint = generateLimboCrashPoint();

    console.log('🚀 LIMBO ROLL:', {
      crashPoint: crashPoint.toFixed(2),
      targetMultiplier: targetMultiplier.toFixed(2),
      playerWins: crashPoint >= targetMultiplier,
      winChance: winChance.toFixed(2) + '%',
    });

    const animationDuration = 700;
    const steps = 42;
    const stepDuration = animationDuration / steps;

    for (let i = 0; i <= steps; i++) {
      setTimeout(() => {
        const progress = i / steps;
        const currentValue = 1 + (crashPoint - 1) * progress;
        setAnimatedResult(currentValue);

        if (i === steps) {
          setResult(crashPoint);
          if (crashPoint >= targetMultiplier) {
            const totalPayout = betAmount * targetMultiplier;
            const profit = totalPayout - betAmount;
            setLastWin(profit);
            onUpdateBalance(totalPayout);
          }
          setIsRolling(false);
        }
      }, i * stepDuration);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4 md:mb-6 text-center font-mono">🚀 Limbo</h2>

        <div className="mb-4 md:mb-6">
          <label className="block text-sm font-medium mb-2 font-mono">Bet Amount (min: 10)</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 10))}
            className="bg-gray-700 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-yellow-400 font-mono"
            min={10}
          />
        </div>

        <div className="mb-4 md:mb-6">
          <label className="block text-sm font-medium mb-2 font-mono">Target Multiplier</label>
          <Input
            type="number"
            step="0.01"
            min="1.01"
            max="1000000"
            value={targetMultiplier}
            onChange={(e) => setTargetMultiplier(Math.max(1.01, Math.min(1000000, parseFloat(e.target.value) || 1.01)))}
            className="bg-gray-700 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-yellow-400 font-mono"
          />
        </div>

        <div className="mb-4 md:mb-6 text-center bg-gradient-to-br from-gray-900 to-gray-700 p-6 md:p-8 rounded-xl border-2 border-gray-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/5 to-transparent"></div>
          <div className="text-4xl md:text-6xl font-bold mb-2 font-mono relative z-10">
            {isRolling ? (
              <span className={`transition-all duration-100 ${animatedResult >= targetMultiplier ? 'text-green-400' : 'text-yellow-400'}`}>
                {animatedResult.toFixed(2)}x
              </span>
            ) : result !== null ? (
              <span className={`transition-all duration-200 ${result >= targetMultiplier ? 'text-green-400' : 'text-red-400'}`}>
                {result.toFixed(2)}x
              </span>
            ) : (
              <span className="text-gray-500">0.00x</span>
            )}
          </div>

          {isRolling && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl md:text-4xl animate-bounce">🚀</div>
            </div>
          )}
        </div>

        <div className="mb-4 md:mb-6 text-center bg-gray-700/50 p-3 md:p-4 rounded-lg border border-gray-600">
          <div className="text-base md:text-lg text-gray-300 mb-1 font-mono">Win Chance: {winChance.toFixed(2)}%</div>
          <div className="text-sm md:text-base text-gray-400 font-mono">Target: {targetMultiplier.toFixed(2)}x multiplier</div>
          <div className="text-sm md:text-base text-gray-400 font-mono">Potential profit: {(betAmount * (targetMultiplier - 1)).toFixed(0)} coins</div>
        </div>

        {!isRolling && result !== null && (
          <div className="mb-4 md:mb-6 text-center animate-fade-in">
            <div
              className={`text-xl md:text-2xl font-bold mb-2 transition-all duration-300 font-mono ${
                result >= targetMultiplier ? 'text-green-400 animate-bounce' : 'text-red-400'
              }`}
            >
              {result >= targetMultiplier ? '🎉 WIN!' : '💔 CRASHED!'}
            </div>
            {lastWin && lastWin > 0 && (
              <div className="text-base md:text-lg text-green-400 animate-pulse font-mono">+{lastWin.toFixed(0)} coins profit</div>
            )}
          </div>
        )}

        <Button
          onClick={roll}
          disabled={betAmount > balance || isRolling || betAmount < 10}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 font-mono text-sm md:text-base"
        >
          {isRolling ? 'Rolling... 🚀' : `Roll (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};