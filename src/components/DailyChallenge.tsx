import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useFightingContract } from "../hooks/useFightingContract";

interface DailyChallengeProps {
  onNavigateToMainMenu: () => void;
  onStartChallenge: () => void;
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({
  onNavigateToMainMenu,
  onStartChallenge,
}) => {
  const { isConnected } = useAccount();
  const {
    claimDailyReward,
    dailyRewardAmount,
    isDailyRewardAvailable,
    getTimeUntilNextReward,
    playerStats,
    selectedShip,
    isPending,
    error,
  } = useFightingContract();

  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState<string>("");


  const handleClaimReward = async () => {
    try {
      setTxStatus("pending");
      setTxMessage("Claiming daily reward...");

      const txHash = await claimDailyReward();

      setTxStatus("success");
      setTxMessage(`🎉 Daily reward claimed successfully!`);

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 5000);
    } catch (err: any) {
      setTxStatus("error");
      setTxMessage(`❌ Failed to claim reward: ${err.message}`);

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 5000);
    }
  };

  // Generate daily challenges based on current date
  const generateDailyChallenges = () => {
    const today = new Date().toDateString();
    const seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

    const challengePool = [
      {
        id: 'enemy_destroyer',
        title: '💥 Enemy Destroyer',
        description: 'Destroy 50+ enemies in a single combat mission',
        target: 50,
        type: 'enemies',
        reward: dailyRewardAmount || 100,
        icon: '💥',
        gradient: 'from-red-400 to-orange-500'
      },
      {
        id: 'wave_survivor',
        title: '🌊 Wave Master',
        description: 'Survive 10+ waves in one combat session',
        target: 10,
        type: 'waves',
        reward: dailyRewardAmount || 100,
        icon: '🌊',
        gradient: 'from-blue-400 to-cyan-500'
      },
      {
        id: 'asteroid_miner',
        title: '🪨 Asteroid Miner',
        description: 'Destroy 30+ asteroids and collect resources',
        target: 30,
        type: 'asteroids',
        reward: dailyRewardAmount || 100,
        icon: '🪨',
        gradient: 'from-gray-400 to-stone-500'
      },
      {
        id: 'resource_collector',
        title: '💎 Resource Hunter',
        description: 'Collect 100+ resources in one mission',
        target: 100,
        type: 'resources',
        reward: dailyRewardAmount || 100,
        icon: '💎',
        gradient: 'from-purple-400 to-pink-500'
      },
      {
        id: 'energy_master',
        title: '⚡ Energy Efficient',
        description: 'Complete mission with 70%+ energy remaining',
        target: 70,
        type: 'energy',
        reward: dailyRewardAmount * 1.2 || 120,
        icon: '⚡',
        gradient: 'from-yellow-400 to-amber-500'
      },
      {
        id: 'combat_veteran',
        title: '🛡️ Combat Veteran',
        description: 'Survive combat with 80%+ health remaining',
        target: 80,
        type: 'health',
        reward: dailyRewardAmount * 1.5 || 150,
        icon: '🛡️',
        gradient: 'from-green-400 to-emerald-500'
      },
      {
        id: 'score_champion',
        title: '🎯 Space Ace',
        description: 'Achieve 10,000+ combat score in one mission',
        target: 10000,
        type: 'score',
        reward: dailyRewardAmount * 2 || 200,
        icon: '🎯',
        gradient: 'from-indigo-400 to-purple-500'
      }
    ];

    // Select 3 challenges for today based on date seed
    const selectedIndices = [];
    for (let i = 0; i < 3; i++) {
      selectedIndices.push((seed + i) % challengePool.length);
    }

    return selectedIndices.map(i => challengePool[i]);
  };

  const dailyChallenges = generateDailyChallenges();
  const isRewardAvailable = isDailyRewardAvailable();
  const timeUntilNext = getTimeUntilNextReward();


  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="font-space text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
            Daily Challenges
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Please connect your wallet to access daily challenges and earn valuable rewards
          </p>
          <button
            onClick={onNavigateToMainMenu}
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
          >
            ← Back to Main Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="absolute inset-0 opacity-30">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-3 py-4 space-y-4 h-screen overflow-y-auto">
        <div className="text-center space-y-2 pt-4">
          <h1 className="font-space text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            🎁 Daily Blockchain Reward
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Claim your daily FIGHT tokens directly from the smart contract
          </p>
        </div>

        {txMessage && (
          <div className={`fixed top-6 right-6 max-w-sm p-4 rounded-xl backdrop-blur-sm border z-50 ${
            txStatus === "success" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
            : txStatus === "error" ? "bg-red-500/20 border-red-500/50 text-red-300"
            : "bg-amber-500/20 border-amber-500/50 text-amber-300"
          }`}>
            {txMessage}
          </div>
        )}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="bg-gray-900/60 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4 text-center">
            <div className="text-amber-400 text-sm font-medium mb-1">Daily Challenges Reset In</div>
            <div className="text-2xl font-bold text-white">{timeUntilNext}</div>
            <div className="text-gray-400 text-xs mt-1">New challenges every 24 hours</div>
          </div>
        </div>

        {/* Today's Challenges */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="text-2xl">🎯</div>
            <h2 className="text-2xl font-bold text-white">Today's Missions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {dailyChallenges.map((challenge, index) => (
              <div
                key={challenge.id}
                className="group bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/80 rounded-xl p-4 transition-all duration-300 hover:scale-105 relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${challenge.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}></div>

                <div className="relative space-y-3">
                  <div className="text-center">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {challenge.icon}
                    </div>
                    <h3 className={`text-lg font-bold bg-gradient-to-r ${challenge.gradient} bg-clip-text text-transparent`}>
                      {challenge.title.split(' ').slice(1).join(' ')}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">{challenge.description}</p>
                  </div>

                  {/* Target & Reward */}
                  <div className="bg-gray-800/30 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Target:</span>
                      <span className="text-white font-semibold">{challenge.target.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Reward:</span>
                      <span className="text-emerald-400 font-semibold">{challenge.reward} FIGHT</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={onStartChallenge}
                    className={`w-full py-2 text-sm rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 bg-gradient-to-r ${challenge.gradient} hover:opacity-90 text-black`}
                  >
                    💥 Start Combat
                  </button>
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works & Claim Section */}
        <div className="max-w-4xl mx-auto pb-20">
          <div className="bg-gray-900/60 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-emerald-400 text-center mb-4">🎮 How Daily Challenges Work</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-white font-semibold mb-1">1. Choose Mission</div>
                <div className="text-gray-400 text-sm">Pick a daily challenge and start your space combat</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🚀</div>
                <div className="text-white font-semibold mb-1">2. Complete Goal</div>
                <div className="text-gray-400 text-sm">Achieve the target during your mission gameplay</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-white font-semibold mb-1">3. Earn Rewards</div>
                <div className="text-gray-400 text-sm">Automatically receive FIGHT tokens when mission ends</div>
              </div>
            </div>
          </div>

          {/* Claim Section */}
          {isRewardAvailable && (
            <div className="bg-gray-900/60 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold text-emerald-400 mb-4">🎁 Bonus Daily Reward Available!</h3>
              <p className="text-gray-400 text-sm mb-4">In addition to challenge rewards, claim your daily bonus</p>

              <button
                onClick={handleClaimReward}
                disabled={isPending || txStatus === "pending"}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                {isPending || txStatus === "pending" ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    <span>Claiming...</span>
                  </div>
                ) : (
                  `🎁 Claim ${dailyRewardAmount} FIGHT Bonus`
                )}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="max-w-4xl mx-auto p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center">
            Error: {error}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 pb-4">
          <button
            onClick={onNavigateToMainMenu}
            className="px-6 py-2 text-sm bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600/50 hover:border-gray-500/50 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
          >
            ← Back to Main Menu
          </button>

          <button
            onClick={onStartChallenge}
            className="px-6 py-2 text-sm bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-xl font-semibold text-black transition-all duration-300 transform hover:scale-105"
          >
            💥 Enter Combat
          </button>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DailyChallenge;