import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useFightingContract } from "../hooks/useFightingContract";

interface StakeManagerProps {
  onNavigateToMainMenu: () => void;
}

const StakeManager: React.FC<StakeManagerProps> = ({ onNavigateToMainMenu }) => {
  const { isConnected } = useAccount();
  const {
    playerShips,
    stakeShip,
    unstakeShip,
    isPending,
    error,
    isConnected: contractConnected,
  } = useFightingContract();

  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState<string>("");
  const [loadingShipId, setLoadingShipId] = useState<number | null>(null);

  const handleStakeShip = async (shipId: number, shipName: string) => {
    try {
      setLoadingShipId(shipId);
      setTxStatus("pending");
      setTxMessage(`Staking ${shipName}...`);

      const txHash = await stakeShip(shipId);

      setTxStatus("success");
      setTxMessage(`✅ ${shipName} staked successfully!`);

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
        setLoadingShipId(null);
      }, 5000);
    } catch (error: any) {
      setLoadingShipId(null);
      setTxStatus("error");
      setTxMessage(`❌ Failed to stake ${shipName}: ${error.message}`);

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
        setLoadingShipId(null);
      }, 5000);
    }
  };

  const handleUnstakeShip = async (shipId: number, shipName: string) => {
    try {
      setLoadingShipId(shipId);
      setTxStatus("pending");
      setTxMessage(`Unstaking ${shipName}...`);

      const txHash = await unstakeShip(shipId);

      setTxStatus("success");
      setTxMessage(`✅ ${shipName} unstaked successfully!`);

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
        setLoadingShipId(null);
      }, 5000);
    } catch (error: any) {
      setLoadingShipId(null);
      setTxStatus("error");
      setTxMessage(`❌ Failed to unstake ${shipName}: ${error.message}`);

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
        setLoadingShipId(null);
      }, 5000);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="font-space text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Stake Manager
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Please connect your wallet to manage ship staking and earn passive rewards
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

  if (!contractConnected || playerShips.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-4xl mb-3">🚀</div>
          <h1 className="font-space text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            No Ships Available
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            You need to purchase NFT ships before you can stake them. Visit the Ship Store to get your first spaceship!
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

  const stakedShips = playerShips.filter(ship => ship.isStaked);
  const availableShips = playerShips.filter(ship => !ship.isStaked);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 p-3 py-4 space-y-4 h-screen overflow-y-auto">
        <div className="text-center space-y-2">
          <h1 className="font-space text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            🔒 Stake Manager
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Stake your ships to earn passive rewards over time. Staked ships cannot be used in combat but generate continuous income.
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

        <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto">
          <div className="flex items-center space-x-3 bg-gray-900/60 backdrop-blur-sm border border-emerald-500/30 rounded-lg px-4 py-2">
            <div className="text-lg">🔓</div>
            <div>
              <div className="text-emerald-400 font-semibold text-xs">Available</div>
              <div className="text-lg font-bold text-white">{availableShips.length}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-gray-900/60 backdrop-blur-sm border border-amber-500/30 rounded-lg px-4 py-2">
            <div className="text-lg">🔒</div>
            <div>
              <div className="text-amber-400 font-semibold text-xs">Staked</div>
              <div className="text-lg font-bold text-white">{stakedShips.length}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-gray-900/60 backdrop-blur-sm border border-purple-500/30 rounded-lg px-4 py-2">
            <div className="text-lg">🚀</div>
            <div>
              <div className="text-purple-400 font-semibold text-xs">Total Fleet</div>
              <div className="text-lg font-bold text-white">{playerShips.length}</div>
            </div>
          </div>
        </div>

        {availableShips.length > 0 && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className="text-lg">🔓</div>
              <h2 className="text-lg font-bold text-emerald-400">Available Ships</h2>
              <div className="bg-emerald-500/20 px-2 py-1 rounded-full text-emerald-300 text-xs">
                Ready to Stake
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableShips.map((ship) => {
              const isLoading = loadingShipId === ship.id;
              return (
                <div
                  key={ship.id}
                  className="group bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-2 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm" style={{ color: ship.color || "#10b981" }}>
                      {ship.name}
                    </h3>
                    <div className="bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded text-xs">
                      AVAILABLE
                    </div>
                  </div>

                  <div className="space-y-0.5 mb-2 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Level:</span>
                      <span className="text-white">{Math.floor(ship.experience / 100) + 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Experience:</span>
                      <span className="text-white">{ship.experience} XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wins:</span>
                      <span className="text-white">{ship.wins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Combats:</span>
                      <span className="text-white">{ship.combats}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStakeShip(ship.id, ship.name)}
                    disabled={isLoading}
                    className="w-full py-1.5 text-xs bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 rounded font-semibold transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "🔒 Stake Ship"
                    )}
                  </button>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {stakedShips.length > 0 && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className="text-lg">🔒</div>
              <h2 className="text-lg font-bold text-amber-400">Staked Ships</h2>
              <div className="bg-amber-500/20 px-2 py-1 rounded-full text-amber-300 text-xs">
                Earning Rewards
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stakedShips.map((ship) => {
              const isLoading = loadingShipId === ship.id;
              return (
                <div
                  key={ship.id}
                  className="group bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-2 hover:border-amber-500/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm" style={{ color: ship.color || "#f59e0b" }}>
                      {ship.name}
                    </h3>
                    <div className="bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded text-xs animate-pulse">
                      STAKED
                    </div>
                  </div>

                  <div className="space-y-0.5 mb-2 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Level:</span>
                      <span className="text-white">{Math.floor(ship.experience / 100) + 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Experience:</span>
                      <span className="text-white">{ship.experience} XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staked Time:</span>
                      <span className="text-amber-300">
                        {ship.stakedTime ? Math.floor((Date.now() - ship.stakedTime * 1000) / (1000 * 60 * 60 * 24)) : 0} days
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 rounded p-1.5 mb-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Est. Rewards:</span>
                      <span className="text-amber-300 font-semibold">+50 FIGHT/day</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnstakeShip(ship.id, ship.name)}
                    disabled={isLoading}
                    className="w-full py-1.5 text-xs bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 rounded font-semibold transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "🔓 Unstake Ship"
                    )}
                  </button>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center">
            Error: {error}
          </div>
        )}

        <div className="flex justify-center pt-4">
          <button
            onClick={onNavigateToMainMenu}
            className="px-6 py-2 text-sm bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600/50 hover:border-gray-500/50 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
          >
            ← Back to Main Menu
          </button>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

export default StakeManager;