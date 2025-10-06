import React, { useState, useEffect } from "react";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useFightingContract } from "../hooks/useFightingContract";

interface BuyShipProps {
  onNavigateToMainMenu: () => void;
  onBreedShip?: () => void;
}

const BuyShip: React.FC<BuyShipProps> = ({ onNavigateToMainMenu, onBreedShip }) => {
  const { isConnected } = useAccount();
  const {
    mintStarterShip,
    mintPremiumShip,
    // mintDestroyer,
    mintBattlecruiser,
    hasShipType,
    refetchShips,
    // isPending,
    error,
  } = useFightingContract();

  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "confirming" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState<string>("");
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null);
  const [loadingShip, setLoadingShip] = useState<string | null>(null);

  const { isSuccess: isConfirmed, isError: isConfirmError } = useWaitForTransactionReceipt({
    hash: currentTxHash as `0x${string}`,
    query: { enabled: !!currentTxHash },
  });

  useEffect(() => {
    if (isConfirmed && txStatus === "confirming") {
      setTxStatus("success");
      setTxMessage("🎉 Ship minted successfully! Transaction confirmed on blockchain.");

      refetchShips();

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
        setCurrentTxHash(null);
        setLoadingShip(null);
      }, 5000);
    } else if (isConfirmError && txStatus === "confirming") {
      setTxStatus("error");
      setTxMessage("❌ Transaction failed on blockchain. Please try again.");

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
        setCurrentTxHash(null);
        setLoadingShip(null);
      }, 8000);
    }
  }, [isConfirmed, isConfirmError, txStatus, refetchShips]);

  const handleMintShip = async (mintFunction: () => Promise<any>, shipName: string) => {
    try {
      setLoadingShip(shipName);
      setTxStatus("pending");
      setTxMessage(`🔄 Submitting ${shipName} transaction...`);
      setCurrentTxHash(null);

      const txHash = await mintFunction();

      if (txHash) {
        setCurrentTxHash(txHash);
        setTxStatus("confirming");
        setTxMessage(`⏳ Waiting for blockchain confirmation...`);
      }

    } catch (err: any) {
      setLoadingShip(null);
      setTxStatus("error");
      setCurrentTxHash(null);
      console.error('Minting error:', err);

      // Handle different types of errors
      let errorMessage = "Transaction failed";
      if (err.message) {
        if (err.message.includes("User rejected")) {
          errorMessage = "Transaction was rejected by user";
        } else if (err.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds to complete transaction";
        } else if (err.message.includes("gas")) {
          errorMessage = "Transaction failed due to gas estimation error";
        } else {
          errorMessage = err.message;
        }
      }

      setTxMessage(`❌ Failed to mint ${shipName}: ${errorMessage}`);

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
        setLoadingShip(null);
      }, 8000);
    }
  };

  const ships = [
    {
      name: "Interceptor",
      price: "0.01 AVAX",
      description: "Fast starter ship",
      stats: { speed: 5, armor: 2, weapons: 2, special: 1 },
      gradient: "from-cyan-400 to-blue-500",
      hoverGradient: "from-cyan-500 to-blue-600",
      mintFunction: mintStarterShip,
      features: ["Quick acceleration", "Beginner friendly"],
      rarity: "Common",
      rarityColor: "text-gray-400",
    },
    {
      name: "Destroyer",
      price: "0.05 AVAX",
      description: "Advanced combat vessel",
      stats: { speed: 4, armor: 4, weapons: 4, special: 3 },
      gradient: "from-yellow-400 to-orange-500",
      hoverGradient: "from-yellow-500 to-orange-600",
      mintFunction: mintPremiumShip,
      features: ["Enhanced weapons", "Better armor"],
      rarity: "Rare",
      rarityColor: "text-blue-400",
    },
    {
      name: "Dreadnought",
      price: "0.01 AVAX + 2 Ships",
      description: "Hybrid breeding vessel",
      stats: { speed: 5, armor: 5, weapons: 5, special: 5 },
      gradient: "from-amber-400 to-yellow-500",
      hoverGradient: "from-amber-500 to-yellow-600",
      mintFunction: null, // Special handling for breeding
      features: ["Hybrid technology", "Maximum stats"],
      rarity: "Legendary",
      rarityColor: "text-amber-400",
      isBreeding: true,
    },
    {
      name: "Battlecruiser",
      price: "0.2 AVAX",
      description: "Elite combat vessel",
      stats: { speed: 4, armor: 5, weapons: 5, special: 5 },
      gradient: "from-purple-400 to-indigo-500",
      hoverGradient: "from-purple-500 to-indigo-600",
      mintFunction: mintBattlecruiser,
      features: ["Maximum firepower", "Elite armor"],
      rarity: "Legendary",
      rarityColor: "text-amber-400",
    },
  ];

  const StatBar = ({ value, max = 5 }: { value: number; max?: number }) => (
    <div className="flex space-x-1">
      {[...Array(max)].map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < value ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-gray-600'
          }`}
        />
      ))}
    </div>
  );

  // Allow browsing ships without wallet connection

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 p-3 py-4 space-y-4 h-screen overflow-y-auto">
        <div className="text-center space-y-2">
          <h1 className="font-space text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            🛒 Space Fleet Shipyard
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Purchase NFT spaceships with AVAX
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

        {/* Ships Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {ships.map((ship, index) => {
            const isOwned = hasShipType(ship.name);
            const isLoading = loadingShip === ship.name;
            return (
            <div
              key={index}
              className="group bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 hover:border-gray-600/80 transition-all duration-300 hover:scale-102 relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${ship.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}></div>

              <div className="relative space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className={`text-sm font-bold bg-gradient-to-r ${ship.gradient} bg-clip-text text-transparent`}>
                        {ship.name}
                      </h3>
                      <div className={`px-1 py-0.5 rounded text-xs font-medium ${ship.rarityColor} bg-gray-800/50`}>
                        {ship.rarity}
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs leading-tight line-clamp-2">
                      {ship.description}
                    </p>
                  </div>
                  <div className="text-xl group-hover:scale-110 transition-transform duration-300">
                    🚀
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 p-2 bg-gray-800/30 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Speed</span>
                      <StatBar value={ship.stats.speed} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Armor</span>
                      <StatBar value={ship.stats.armor} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Weapons</span>
                      <StatBar value={ship.stats.weapons} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Special</span>
                      <StatBar value={ship.stats.special} />
                    </div>
                  </div>
                </div>


                {/* Price and Buy Button */}
                <div className="space-y-1">
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-400 mb-1">
                      {ship.price}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (isOwned) return;
                      if (ship.isBreeding && onBreedShip) {
                        onBreedShip();
                      } else if (ship.mintFunction && isConnected) {
                        handleMintShip(ship.mintFunction, ship.name);
                      }
                    }}
                    disabled={isOwned || isLoading}
                    className={`w-full py-2 rounded-lg font-semibold transition-all duration-300 transform shadow-lg text-sm ${
                      isOwned
                        ? "bg-emerald-600/50 text-emerald-300 cursor-not-allowed"
                        : `bg-gradient-to-r ${ship.gradient} hover:bg-gradient-to-r hover:${ship.hoverGradient} disabled:from-gray-600 disabled:to-gray-700 text-black disabled:text-gray-400 hover:scale-105 disabled:cursor-not-allowed disabled:scale-100`
                    }`}
                  >
                    {isOwned ? (
                      <div className="flex items-center justify-center space-x-2">
                        <span>✅</span>
                        <span>Owned</span>
                      </div>
                    ) : isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        <span>
                          {txStatus === "confirming" ? "Confirming..." :
                           ship.isBreeding ? "Breeding..." : "Minting..."}
                        </span>
                      </div>
                    ) : !isConnected ? (
                      "Preview Only"
                    ) : (
                      ship.isBreeding ? `🧬 Breed ${ship.name}` : `Buy ${ship.name}`
                    )}
                  </button>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>
            );
          })}
        </div>

        {error && (
          <div className="max-w-4xl mx-auto p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center">
            Error: {error}
          </div>
        )}
        <div className="flex justify-center pt-4 pb-4">
          <button
            onClick={onNavigateToMainMenu}
            className="px-6 py-2 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600/50 hover:border-gray-500/50 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm text-sm"
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

export default BuyShip;