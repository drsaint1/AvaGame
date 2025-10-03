import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useFightingContract } from "../hooks/useFightingContract";

interface BreedingProps {
  onNavigateToMainMenu: () => void;
}

const Breeding: React.FC<BreedingProps> = ({ onNavigateToMainMenu }) => {
  const { isConnected } = useAccount();
  const {
    playerShips,
    breedShips,
    canBreed,
    isPending,
    error,
    loading,
  } = useFightingContract();

  const [selectedShip1, setSelectedShip1] = useState<any>(null);
  const [selectedShip2, setSelectedShip2] = useState<any>(null);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState<string>("");

  // Function to check if a ship can be bred and get the reason if not
  const getShipBreedingStatus = (ship: any) => {
    if (ship.isStaked) {
      return { canBreed: false, reason: "Ship is currently staked" };
    }

    const now = Date.now();
    const timeSinceBirth = now - (ship.birthTime * 1000);
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (timeSinceBirth < twentyFourHours) {
      const remainingTime = twentyFourHours - timeSinceBirth;
      const hours = Math.floor(remainingTime / (60 * 60 * 1000));
      const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
      return {
        canBreed: false,
        reason: `Cooldown: ${hours}h ${minutes}m remaining`
      };
    }

    return { canBreed: true, reason: "Ready for breeding!" };
  };

  // Show all ships, but mark their breeding status
  const allShipsWithStatus = playerShips.map(ship => ({
    ...ship,
    breedingStatus: getShipBreedingStatus(ship)
  }));



  const breedableShips = allShipsWithStatus.filter(ship => ship.breedingStatus.canBreed);

  const handleBreeding = async () => {
    if (!selectedShip1 || !selectedShip2) return;

    try {
      setTxStatus("pending");
      setTxMessage("🧬 Breeding ships...");

      await breedShips(selectedShip1.id, selectedShip2.id);

      setTxStatus("success");
      setTxMessage("🎉 Dreadnought created successfully!");

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
        setSelectedShip1(null);
        setSelectedShip2(null);
      }, 5000);
    } catch (err: any) {
      setTxStatus("error");
      console.error('Breeding error:', err);

      let errorMessage = "Breeding failed";
      if (err.message) {
        if (err.message.includes("User rejected")) {
          errorMessage = "Transaction was rejected by user";
        } else if (err.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds to complete breeding";
        } else {
          errorMessage = err.message;
        }
      }

      setTxMessage(`❌ ${errorMessage}`);

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 8000);
    }
  };

  const canBreedSelected = selectedShip1 && selectedShip2 &&
    selectedShip1.breedingStatus?.canBreed && selectedShip2.breedingStatus?.canBreed &&
    canBreed(selectedShip1, selectedShip2);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="text-8xl mb-6">🧬</div>
          <h1 className="font-space text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
            Ship Breeding
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Please connect your wallet to access ship breeding
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="text-8xl mb-6">🧬</div>
          <h1 className="font-space text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
            Ship Breeding
          </h1>
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
            <p className="text-gray-400 text-lg">Loading your fleet...</p>
          </div>
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

  if (playerShips.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="font-space text-2xl font-bold text-amber-400 mb-4">
            Need More Ships
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            You need at least 2 ships to breed. Purchase more ships from the shop.
          </p>
          <p className="text-gray-400 text-xs">
            Current ships: {playerShips.length}
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 p-6 py-8 h-screen overflow-y-auto">
        <div className="text-center space-y-4 mb-8">
          <h1 className="font-space text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
            🧬 Ship Breeding Laboratory
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            Combine two ships to create the ultimate Dreadnought. Ships must be unstaked and at least 24 hours old.
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-amber-400 text-center mb-6">Select Two Ships to Breed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allShipsWithStatus.map((ship) => {
                const isSelected = selectedShip1?.id === ship.id || selectedShip2?.id === ship.id;
                const selectionNumber = selectedShip1?.id === ship.id ? 1 : selectedShip2?.id === ship.id ? 2 : null;

                return (
                  <div
                    key={ship.id}
                    onClick={() => {
                      if (!ship.breedingStatus.canBreed) return;

                      if (selectedShip1?.id === ship.id) {
                        setSelectedShip1(null);
                      } else if (selectedShip2?.id === ship.id) {
                        setSelectedShip2(null);
                      } else if (!selectedShip1) {
                        setSelectedShip1(ship);
                      } else if (!selectedShip2) {
                        setSelectedShip2(ship);
                      } else {
                        // Both slots filled, replace the first one
                        setSelectedShip1(ship);
                        setSelectedShip2(null);
                      }
                    }}
                    className={`bg-gray-900/60 backdrop-blur-sm border-2 rounded-lg p-4 transition-all duration-300 relative ${
                      ship.breedingStatus.canBreed
                        ? `cursor-pointer hover:scale-105 ${
                            isSelected
                              ? 'border-amber-500 ring-2 ring-amber-500/50'
                              : 'border-gray-700/50 hover:border-gray-600/80'
                          }`
                        : 'cursor-not-allowed opacity-50 border-red-500/30'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {selectionNumber}
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-bold ${ship.breedingStatus.canBreed ? 'text-white' : 'text-gray-500'}`}>
                        {ship.name}
                      </h4>
                      <div className="text-lg">{ship.breedingStatus.canBreed ? '🚀' : '⏰'}</div>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      Level: {Math.floor(ship.experience / 100) + 1} • ID: {ship.id}
                    </div>
                    <div className={`text-xs ${ship.breedingStatus.canBreed ? 'text-green-400' : 'text-red-400'}`}>
                      {ship.breedingStatus.reason}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selection Status */}
            {(selectedShip1 || selectedShip2) && (
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <h4 className="text-amber-400 font-bold mb-2">Selected for Breeding:</h4>
                <div className="flex gap-4">
                  {selectedShip1 && (
                    <div className="flex items-center space-x-2">
                      <span className="bg-amber-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">1</span>
                      <span className="text-white">{selectedShip1.name}</span>
                    </div>
                  )}
                  {selectedShip2 && (
                    <div className="flex items-center space-x-2">
                      <span className="bg-amber-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">2</span>
                      <span className="text-white">{selectedShip2.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Breeding Button */}
          <div className="text-center space-y-4">
            <div className="text-4xl">🧬</div>
            <button
              onClick={handleBreeding}
              disabled={!canBreedSelected || isPending || txStatus === "pending"}
              className={`px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                canBreedSelected && txStatus !== "pending"
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-black cursor-pointer shadow-lg'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isPending || txStatus === "pending" ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  <span>Breeding...</span>
                </div>
              ) : canBreedSelected ? (
                "🧬 Create Dreadnought (0.01 AVAX)"
              ) : (
                "Select Two Ships to Breed"
              )}
            </button>
          </div>

          <div className="bg-gray-900/40 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-bold text-amber-400 text-center mb-4">🧬 How Breeding Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl mb-2">🚀</div>
                <div className="text-white font-semibold mb-1">Select Parents</div>
                <div className="text-gray-400 text-sm">Choose two unstaked ships over 24hrs old</div>
              </div>
              <div>
                <div className="text-2xl mb-2">🧬</div>
                <div className="text-white font-semibold mb-1">Combine DNA</div>
                <div className="text-gray-400 text-sm">Pay 0.01 AVAX to breed a hybrid ship</div>
              </div>
              <div>
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-white font-semibold mb-1">Get Dreadnought</div>
                <div className="text-gray-400 text-sm">Receive the most powerful ship type</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="max-w-6xl mx-auto mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center">
            Error: {error}
          </div>
        )}
        <div className="flex justify-center pt-8">
          <button
            onClick={onNavigateToMainMenu}
            className="px-6 py-3 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600/50 hover:border-gray-500/50 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
          >
            ← Back to Main Menu
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

export default Breeding;