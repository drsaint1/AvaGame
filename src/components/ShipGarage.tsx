import React, { useState, useEffect } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { useFightingContract, ShipNFT } from "../hooks/useFightingContract";

interface ShipGarageProps {
  onClose: () => void;
}

type TabType = "overview" | "staking";

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "loading";
  title: string;
  message: string;
  duration?: number;
}

const ShipGarage: React.FC<ShipGarageProps> = ({ onClose }) => {
  const {
    playerShips,
    loading,
    stakeShip,
    unstakeShip,
    isPending,
    refetchShips,
    getRarityName,
    getRarityColor,
    getStakingRewards,
  } = useFightingContract();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [stakingRewards, setStakingRewards] = useState<Map<number, number>>(
    new Map()
  );
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingStakeUpdates, setPendingStakeUpdates] = useState<Set<number>>(
    new Set()
  );

  const { isSuccess: isTxConfirmed, isError: isTxError } =
    useWaitForTransactionReceipt({
      hash: currentTxHash as `0x${string}`,
      query: { enabled: !!currentTxHash },
    });

  useEffect(() => {
    if (isTxConfirmed && currentTxHash) {
      addNotification({
        type: "success",
        title: "Transaction Confirmed!",
        message: actionInProgress?.includes("staking")
          ? "Your ship has been successfully staked and is now earning XP!"
          : "Your ship has been successfully unstaked and XP rewards have been claimed!",
        duration: 5000,
      });

      setTimeout(() => {
        refetchShips();
        setActionInProgress(null);
        setCurrentTxHash(null);
        setPendingStakeUpdates(new Set());
      }, 1000);
    }

    if (isTxError && currentTxHash) {
      addNotification({
        type: "error",
        title: "Transaction Failed",
        message: "The transaction was rejected or failed. Please try again.",
        duration: 5000,
      });

      setActionInProgress(null);
      setCurrentTxHash(null);
      setPendingStakeUpdates(new Set());
    }
  }, [isTxConfirmed, isTxError, currentTxHash, actionInProgress]);

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    setNotifications((prev) => [...prev, newNotification]);

    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    const updateStakingRewards = () => {
      const newRewards = new Map<number, number>();
      playerShips.forEach((ship) => {
        if (ship.isStaked) {
          const rewards = getStakingRewards(ship);
          newRewards.set(ship.id, rewards);
        }
      });
      setStakingRewards(newRewards);
    };

    updateStakingRewards();

    const interval = setInterval(updateStakingRewards, 30000);
    return () => clearInterval(interval);
  }, [playerShips, getStakingRewards]);

  const handleStakeShip = async (ship: ShipNFT) => {
    if (ship.isStaked) return;

    try {
      setActionInProgress(`staking-${ship.id}`);
      setPendingStakeUpdates((prev) => new Set([...prev, ship.id]));

     
      addNotification({
        type: "info",
        title: "Staking Ship...",
        message: `Please confirm the transaction in your wallet to stake ${ship.name}`,
        duration: 3000,
      });

      const txHash = await stakeShip(ship.id);

      if (txHash) {
        setCurrentTxHash(txHash);

        
        addNotification({
          type: "loading",
          title: "Transaction Submitted",
          message: `Staking ${ship.name}... Waiting for confirmation.`,
          duration: 8000,
        });
      }
    } catch (error: any) {
      console.error("Failed to stake ship:", error);

      let errorMessage = "Failed to stake ship. Please try again.";
      if (error.message?.includes("rejected")) {
        errorMessage = "Transaction was rejected in wallet.";
      } else if (error.message?.includes("insufficient")) {
        errorMessage = "Insufficient funds to pay gas fees.";
      }

      addNotification({
        type: "error",
        title: "Staking Failed",
        message: errorMessage,
        duration: 5000,
      });

      setActionInProgress(null);
      setPendingStakeUpdates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(ship.id);
        return newSet;
      });
    }
  };

  const handleUnstakeShip = async (ship: ShipNFT) => {
    if (!ship.isStaked) return;

    try {
      setActionInProgress(`unstaking-${ship.id}`);
      setPendingStakeUpdates((prev) => new Set([...prev, ship.id]));

      const currentRewards = stakingRewards.get(ship.id) || 0;

      addNotification({
        type: "info",
        title: "Unstaking Ship...",
        message: `Please confirm to unstake ${ship.name} and claim ${currentRewards} XP`,
        duration: 3000,
      });

      const txHash = await unstakeShip(ship.id);

      if (txHash) {
        setCurrentTxHash(txHash);

        addNotification({
          type: "loading",
          title: "Transaction Submitted",
          message: `Unstaking ${ship.name} and claiming ${currentRewards} XP... Waiting for confirmation.`,
          duration: 8000,
        });
      }
    } catch (error: any) {
      console.error("Failed to unstake ship:", error);

      let errorMessage = "Failed to unstake ship. Please try again.";
      if (error.message?.includes("rejected")) {
        errorMessage = "Transaction was rejected in wallet.";
      } else if (error.message?.includes("insufficient")) {
        errorMessage = "Insufficient funds to pay gas fees.";
      }

      addNotification({
        type: "error",
        title: "Unstaking Failed",
        message: errorMessage,
        duration: 5000,
      });

      setActionInProgress(null);
      setPendingStakeUpdates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(ship.id);
        return newSet;
      });
    }
  };

  const getShipStatusText = (ship: ShipNFT) => {
    if (pendingStakeUpdates.has(ship.id)) {
      if (ship.isStaked) {
        return "Unstaking...";
      } else {
        return "Staking...";
      }
    }

    if (ship.isStaked) {
      const timeStaked = Math.floor(
        (Date.now() - ship.stakedTime * 1000) / 1000
      );
      const daysStaked = Math.floor(timeStaked / (24 * 60 * 60));
      const hoursStaked = Math.floor((timeStaked % (24 * 60 * 60)) / (60 * 60));

      if (daysStaked > 0) {
        return `Staked for ${daysStaked}d ${hoursStaked}h`;
      } else {
        return `Staked for ${hoursStaked}h`;
      }
    }
    return "Available";
  };

  const getShipStatusColor = (ship: ShipNFT) => {
    if (pendingStakeUpdates.has(ship.id)) {
      return "#8b5cf6";
    }
    return ship.isStaked ? "#fbbf24" : "#10b981";
  };

  const stakedShips = playerShips.filter((ship) => ship.isStaked);
  const availableShips = playerShips.filter((ship) => !ship.isStaked);

  const tabs = [
    { id: "overview", label: "🏠 Overview", count: playerShips.length },
    { id: "staking", label: "⚡ Staking", count: stakedShips.length },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50 overflow-hidden">
        {/* Animated floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

        <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-8 text-center relative z-10">
          <div
            style={{
              width: "24px",
              height: "24px",
              border: "2px solid transparent",
              borderTop: "2px solid #fbbf24",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          ></div>
          <span style={{ color: "white" }}>Loading your garage...</span>
        </div>
      </div>
    );
  }

  const renderShipCard = (ship: ShipNFT, showStakingControls: boolean = false) => (
    <div
      key={ship.id}
      style={{
        background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
        borderRadius: "12px",
        padding: "20px",
        border: ship.isStaked ? "2px solid #fbbf24" : "1px solid #374151",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: getShipStatusColor(ship),
          color: "white",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
        }}
      >
        {pendingStakeUpdates.has(ship.id)
          ? ship.isStaked
            ? "⏳ UNSTAKING"
            : "⏳ STAKING"
          : ship.isStaked
          ? "⚡ STAKED"
          : "🟢 AVAILABLE"}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <h3
          style={{
            color: "white",
            margin: "0 0 4px 0",
            fontSize: "18px",
            fontWeight: "bold",
            paddingRight: "80px",
          }}
        >
          {ship.name}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              color: getRarityColor(ship.rarity),
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            {getRarityName(ship.rarity)}
          </span>
          <span style={{ color: "#6b7280", fontSize: "12px" }}>
            ID #{ship.id}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{ color: "#ef4444", fontSize: "18px", fontWeight: "bold" }}
          >
            {ship.speed}
          </div>
          <div style={{ color: "#9ca3af", fontSize: "11px" }}>SPEED</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{ color: "#3b82f6", fontSize: "18px", fontWeight: "bold" }}
          >
            {ship.handling}
          </div>
          <div style={{ color: "#9ca3af", fontSize: "11px" }}>HANDLING</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{ color: "#10b981", fontSize: "18px", fontWeight: "bold" }}
          >
            {ship.acceleration}
          </div>
          <div style={{ color: "#9ca3af", fontSize: "11px" }}>ACCEL</div>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "#a78bfa", fontSize: "12px" }}>Experience</span>
          <span style={{ color: "#a78bfa", fontSize: "12px" }}>
            {ship.experience} XP
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#fbbf24", fontSize: "12px" }}>Wins/Races</span>
          <span style={{ color: "#fbbf24", fontSize: "12px" }}>
            {ship.wins}/{ship.races}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            background: ship.isStaked
              ? "rgba(251, 191, 36, 0.1)"
              : "rgba(16, 185, 129, 0.1)",
            padding: "8px 12px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: getShipStatusColor(ship),
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {getShipStatusText(ship)}
          </div>
          {ship.isStaked && stakingRewards.has(ship.id) && (
            <div
              style={{ color: "#a78bfa", fontSize: "11px", marginTop: "2px" }}
            >
              Pending: +{stakingRewards.get(ship.id)} XP
            </div>
          )}
        </div>
      </div>

      {showStakingControls && (
        <div style={{ display: "flex", gap: "8px" }}>
          {!ship.isStaked ? (
            <button
              onClick={() => handleStakeShip(ship)}
              disabled={actionInProgress === `staking-${ship.id}` || isPending}
              style={{
                flex: 1,
                background:
                  actionInProgress === `staking-${ship.id}`
                    ? "#6b7280"
                    : "#10b981",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor:
                  actionInProgress === `staking-${ship.id}`
                    ? "not-allowed"
                    : "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                opacity: actionInProgress === `staking-${ship.id}` ? 0.6 : 1,
              }}
            >
              {actionInProgress === `staking-${ship.id}`
                ? "⏳ Staking..."
                : "⚡ Stake Ship"}
            </button>
          ) : (
            <button
              onClick={() => handleUnstakeShip(ship)}
              disabled={actionInProgress === `unstaking-${ship.id}` || isPending}
              style={{
                flex: 1,
                background:
                  actionInProgress === `unstaking-${ship.id}`
                    ? "#6b7280"
                    : "#f59e0b",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor:
                  actionInProgress === `unstaking-${ship.id}`
                    ? "not-allowed"
                    : "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                opacity: actionInProgress === `unstaking-${ship.id}` ? 0.6 : 1,
              }}
            >
              {actionInProgress === `unstaking-${ship.id}`
                ? "⏳ Unstaking..."
                : "💰 Claim & Unstake"}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50 p-5 overflow-hidden">
      {/* Animated floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col relative z-10"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #374151",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                color: "white",
                margin: "0 0 4px 0",
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              🏠 Ship Garage
            </h2>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px" }}>
              Manage your NFT space ships • Stake for XP rewards
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#4b5563",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ✕ Close
          </button>
        </div>

        <div
          style={{
            padding: "0 24px",
            borderBottom: "1px solid #374151",
            display: "flex",
            gap: "4px",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                background: activeTab === tab.id ? "#1f2937" : "transparent",
                color: activeTab === tab.id ? "white" : "#9ca3af",
                border: "none",
                padding: "12px 16px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                borderBottom:
                  activeTab === tab.id
                    ? "2px solid #fbbf24"
                    : "2px solid transparent",
                transition: "all 0.3s ease",
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {playerShips.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "60px", marginBottom: "16px" }}>🏗️</div>
              <h3 style={{ color: "white", marginBottom: "8px" }}>
                No Ships Yet
              </h3>
              <p style={{ color: "#9ca3af" }}>
                Mint your first ship to get started!
              </p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {playerShips.map((ship) => renderShipCard(ship, true))}
                  </div>
                </div>
              )}

              {activeTab === "staking" && (
                <div>
                  <div style={{ marginBottom: "24px" }}>
                    <h3 style={{ color: "white", marginBottom: "8px" }}>
                      ⚡ Staking Overview
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "16px",
                        marginBottom: "24px",
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(251, 191, 36, 0.1)",
                          padding: "16px",
                          borderRadius: "8px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            color: "#fbbf24",
                            fontSize: "24px",
                            fontWeight: "bold",
                          }}
                        >
                          {stakedShips.length}
                        </div>
                        <div style={{ color: "#9ca3af", fontSize: "12px" }}>
                          Ships Staked
                        </div>
                      </div>
                      <div
                        style={{
                          background: "rgba(167, 139, 250, 0.1)",
                          padding: "16px",
                          borderRadius: "8px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            color: "#a78bfa",
                            fontSize: "24px",
                            fontWeight: "bold",
                          }}
                        >
                          {Array.from(stakingRewards.values()).reduce(
                            (sum, reward) => sum + reward,
                            0
                          )}
                        </div>
                        <div style={{ color: "#9ca3af", fontSize: "12px" }}>
                          Pending XP
                        </div>
                      </div>
                      <div
                        style={{
                          background: "rgba(16, 185, 129, 0.1)",
                          padding: "16px",
                          borderRadius: "8px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            color: "#10b981",
                            fontSize: "24px",
                            fontWeight: "bold",
                          }}
                        >
                          100
                        </div>
                        <div style={{ color: "#9ca3af", fontSize: "12px" }}>
                          XP per Day
                        </div>
                      </div>
                    </div>
                  </div>

                  {stakedShips.length > 0 ? (
                    <div>
                      <h4 style={{ color: "white", marginBottom: "16px" }}>
                        🔥 Currently Staked
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: "20px",
                          marginBottom: "32px",
                        }}
                      >
                        {stakedShips.map((ship) => renderShipCard(ship, true))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                      <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                        ⚡
                      </div>
                      <h3 style={{ color: "white", marginBottom: "8px" }}>
                        No Ships Staked
                      </h3>
                      <p style={{ color: "#9ca3af" }}>
                        Stake your ships to earn 100 XP per day passively!
                      </p>
                    </div>
                  )}

                  {availableShips.length > 0 && (
                    <div>
                      <h4 style={{ color: "white", marginBottom: "16px" }}>
                        🚗 Available to Stake
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: "20px",
                        }}
                      >
                        {availableShips.map((ship) => renderShipCard(ship, true))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "400px",
        }}
      >
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              background:
                notification.type === "success"
                  ? "linear-gradient(45deg, #10b981, #059669)"
                  : notification.type === "error"
                  ? "linear-gradient(45deg, #ef4444, #dc2626)"
                  : notification.type === "loading"
                  ? "linear-gradient(45deg, #8b5cf6, #7c3aed)"
                  : "linear-gradient(45deg, #3b82f6, #2563eb)",
              color: "white",
              padding: "16px",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              animation: "slideInRight 0.3s ease-out",
              cursor: "pointer",
            }}
            onClick={() => removeNotification(notification.id)}
          >
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
            >
              <div style={{ fontSize: "20px", marginTop: "2px" }}>
                {notification.type === "success" && "✅"}
                {notification.type === "error" && "❌"}
                {notification.type === "loading" && "⏳"}
                {notification.type === "info" && "ℹ️"}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  {notification.title}
                </div>
                <div
                  style={{ fontSize: "13px", opacity: 0.9, lineHeight: "1.4" }}
                >
                  {notification.message}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideInRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          33% {
            transform: translateY(-20px) translateX(10px);
          }
          66% {
            transform: translateY(10px) translateX(-10px);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ShipGarage;
