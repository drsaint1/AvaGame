import { useState, useEffect } from "react";
import Web3Provider from "./providers/Web3Provider";
import MainMenu from "./components/MainMenu";
import BuyShip from "./components/BuyShip";
import Breeding from "./components/Breeding";
import DailyChallenge from "./components/DailyChallenge";
import StakeManager from "./components/StakeManager";
import SpaceFleetGame from "./components/SpaceFleetGame";
import TournamentLobby from "./components/TournamentLobby";
import Leaderboard from "./components/Leaderboard";
import ConnectButton from "./components/ConnectButton";
import ErrorBoundary from "./components/ErrorBoundary";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useFightingContract } from "./hooks/useFightingContract";
import { useWeb3Modal } from "@web3modal/wagmi/react";

type GameView =
  | "mainmenu"
  | "selectship"
  | "buyship"
  | "breeding"
  | "dailychallenge"
  | "stakemanager"
  | "practicefight"
  | "menu"
  | "fighting"
  | "space"
  | "tournament"
  | "leaderboard";

function GameWrapper() {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const {
    selectedShip,
    playerShips,
    loading: shipLoading,
    mintStarterShip,
    isPending,
    refetchShips,
  } = useFightingContract();
  const [currentView, setCurrentView] = useState<GameView>("mainmenu");
  const [activeTournamentId, setActiveTournamentId] = useState<number | null>(
    null
  );
  const [completedTournaments, setCompletedTournaments] = useState<Set<number>>(
    new Set()
  );
  const [mintingStatus, setMintingStatus] = useState<
    "idle" | "wallet_confirm" | "confirming" | "success" | "error" | "rejected"
  >("idle");
  const [mintingMessage, setMintingMessage] = useState<string>("");
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null);
  const [hasSuccessfullyMinted, setHasSuccessfullyMinted] =
    useState<boolean>(false);

  const { isSuccess: isConfirmed, isError: isConfirmError } =
    useWaitForTransactionReceipt({
      hash: currentTxHash as `0x${string}`,
      query: { enabled: !!currentTxHash },
    });

  useEffect(() => {
    if (isConfirmed && mintingStatus === "confirming") {
      setMintingStatus("success");
      setHasSuccessfullyMinted(true);
      setMintingMessage(
        " Congratulations! You have successfully purchased your first NFT spaceship!"
      );

      refetchShips();

      setTimeout(() => {
        setMintingMessage("🎮 Entering the game...");

        refetchShips();
      }, 2000);

      setTimeout(() => {
        setCurrentView("selectship");
        setMintingStatus("idle");
        setMintingMessage("");
        setCurrentTxHash(null);

        setTimeout(() => {
          if (playerShips.length === 0) {
            setHasSuccessfullyMinted(false);
          }
        }, 3000);
      }, 3500);
    } else if (isConfirmError && mintingStatus === "confirming") {
      setMintingStatus("error");
      setMintingMessage(" Transaction failed on blockchain. Please try again.");

      setTimeout(() => {
        setMintingStatus("idle");
        setMintingMessage("");
        setCurrentTxHash(null);
        setHasSuccessfullyMinted(false);
      }, 2000);
    }
  }, [isConfirmed, isConfirmError, mintingStatus]);

  const handleStartRace = (tournamentId?: number) => {
    setActiveTournamentId(tournamentId || null);
    setCurrentView("fighting");
  };

  const handleTournamentCompleted = (tournamentId: number) => {
    setCompletedTournaments((prev) => new Set([...prev, tournamentId]));
  };

  const handleNavigateToTournaments = () => {
    setActiveTournamentId(null);
    setCurrentView("tournament");
  };

  const handleNavigateToMenu = () => {
    setActiveTournamentId(null);
    setCurrentView("menu");
  };

  const handleSelectShip = () => {
    setCurrentView("selectship");
  };

  const handleBuyShip = () => {
    setCurrentView("buyship");
  };

  const handleDailyChallenge = () => {
    setCurrentView("dailychallenge");
  };

  const handleNavigateToMainMenu = () => {
    setActiveTournamentId(null);
    setCurrentView("mainmenu");
  };

  const handlePracticeFight = () => {
    setCurrentView("practicefight");
  };

  const handleStakeManager = () => {
    setCurrentView("stakemanager");
  };

  const handleMintStarterShip = async () => {
    try {
      setMintingStatus("wallet_confirm");
      setMintingMessage("💳 Please confirm the transaction in your wallet...");

      const txHash = await mintStarterShip();

      setCurrentTxHash(txHash);
      setMintingStatus("confirming");
      setMintingMessage("⏳ Waiting for blockchain confirmation...");
    } catch (error: any) {
      console.error("Minting error:", error);

      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("user rejected") ||
        error.code === 4001
      ) {
        setMintingStatus("rejected");
        setMintingMessage(
          "❌ Transaction rejected by user. Please try again when ready."
        );
      } else if (error.message?.includes("insufficient")) {
        setMintingStatus("error");
        setMintingMessage(
          "❌ Insufficient funds. You need at least 0.01 AVAX to mint a Starter Interceptor."
        );
      } else if (error.message?.includes("Already has starter ship")) {
        setMintingStatus("error");
        setMintingMessage(
          "❌ You already have a starter spaceship. Please refresh the page."
        );
      } else {
        setMintingStatus("error");
        setMintingMessage(
          "❌ Minting failed. Please check your wallet and try again."
        );
      }

      setTimeout(() => {
        setMintingStatus("idle");
        setMintingMessage("");
        setCurrentTxHash(null);
        setHasSuccessfullyMinted(false);
      }, 2000);
    }
  };

  if (currentView === "space") {
    return <SpaceFleetGame onClose={handleNavigateToMainMenu} />;
  }

  if (!isConnected) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'url(\'data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Ccircle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.3"/%3E%3C/svg%3E\') repeat',
            backgroundSize: "100px 100px",
            opacity: 0.4,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "30px",
            right: "30px",
            zIndex: 50,
          }}
        >
          <ConnectButton />
        </div>

        <div
          style={{
            textAlign: "center",
            color: "white",
            maxWidth: "1100px",
            padding: "20px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: "clamp(60px, 10vw, 80px)",
              marginBottom: "15px",
              filter: "drop-shadow(0 0 40px rgba(99, 102, 241, 0.6))",
              animation: "float 3s ease-in-out infinite",
            }}
          >
            🚀
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 6vw, 56px)",
              fontWeight: "800",
              marginBottom: "12px",
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-1px",
              lineHeight: "1.1",
            }}
          >
            AVA Space Fleet
          </h1>

          <p
            style={{
              fontSize: "clamp(16px, 2.5vw, 22px)",
              marginBottom: "30px",
              opacity: 0.85,
              fontWeight: "300",
              maxWidth: "700px",
              margin: "0 auto 30px",
              color: "#e0e0ff",
            }}
          >
            The Ultimate Blockchain Space Combat Experience
          </p>
          <button
            onClick={() => open()}
            style={{
              padding: "14px 40px",
              fontSize: "clamp(16px, 2vw, 18px)",
              fontWeight: "700",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow:
                "0 10px 40px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              marginBottom: "40px",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
              e.currentTarget.style.boxShadow =
                "0 15px 50px rgba(102, 126, 234, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow =
                "0 10px 40px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
            }}
          >
            Connect Wallet & Launch
          </button>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
              maxWidth: "950px",
              margin: "0 auto 30px",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                padding: "25px 20px",
                borderRadius: "20px",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s ease",
                cursor: "default",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.borderColor = "rgba(255,215,0,0.4)";
                e.currentTarget.style.boxShadow =
                  "0 12px 48px rgba(255,215,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)";
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  marginBottom: "12px",
                  filter: "drop-shadow(0 4px 12px rgba(255,215,0,0.3))",
                }}
              >
                💥
              </div>
              <h3
                style={{
                  marginBottom: "10px",
                  color: "#ffd700",
                  fontSize: "clamp(18px, 2vw, 20px)",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                Epic Space Battles
              </h3>
              <p
                style={{
                  fontSize: "clamp(13px, 1.5vw, 14px)",
                  opacity: 0.8,
                  lineHeight: "1.5",
                  color: "#d0d0e0",
                  margin: 0,
                }}
              >
                Engage in intense combat, destroy enemies, and survive waves of
                attacks
              </p>
            </div>

            <div
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                padding: "25px 20px",
                borderRadius: "20px",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s ease",
                cursor: "default",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.borderColor = "rgba(0,255,136,0.4)";
                e.currentTarget.style.boxShadow =
                  "0 12px 48px rgba(0,255,136,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)";
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  marginBottom: "12px",
                  filter: "drop-shadow(0 4px 12px rgba(0,255,136,0.3))",
                }}
              >
                🛸
              </div>
              <h3
                style={{
                  marginBottom: "10px",
                  color: "#00ff88",
                  fontSize: "clamp(18px, 2vw, 20px)",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                NFT Spaceships
              </h3>
              <p
                style={{
                  fontSize: "clamp(13px, 1.5vw, 14px)",
                  opacity: 0.8,
                  lineHeight: "1.5",
                  color: "#d0d0e0",
                  margin: 0,
                }}
              >
                Own and command unique NFT spaceships with distinct combat stats
              </p>
            </div>

            <div
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                padding: "25px 20px",
                borderRadius: "20px",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s ease",
                cursor: "default",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.borderColor = "rgba(102,126,234,0.4)";
                e.currentTarget.style.boxShadow =
                  "0 12px 48px rgba(102,126,234,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)";
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  marginBottom: "12px",
                  filter: "drop-shadow(0 4px 12px rgba(102,126,234,0.3))",
                }}
              >
                ⚡
              </div>
              <h3
                style={{
                  marginBottom: "10px",
                  color: "#667eea",
                  fontSize: "clamp(18px, 2vw, 20px)",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                Lightning Fast
              </h3>
              <p
                style={{
                  fontSize: "clamp(13px, 1.5vw, 14px)",
                  opacity: 0.8,
                  lineHeight: "1.5",
                  color: "#d0d0e0",
                  margin: 0,
                }}
              >
                Built on AVAX for sub-500ms confirmations and minimal fees
              </p>
            </div>
          </div>

          <div
            style={{
              fontSize: "clamp(14px, 1.8vw, 16px)",
              opacity: 0.6,
              fontWeight: "300",
              color: "#b0b0d0",
            }}
          >
            Connect your EVM wallet to command your space fleet
          </div>
        </div>

        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }
          `}
        </style>
      </div>
    );
  }

  if (
    isConnected &&
    !shipLoading &&
    playerShips.length === 0 &&
    !hasSuccessfullyMinted
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          position: "relative",
          paddingTop: "30px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            zIndex: 50,
          }}
        >
          <ConnectButton />
        </div>

        <div
          style={{
            textAlign: "center",
            color: "white",
            maxWidth: "600px",
            padding: "20px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "60px", marginBottom: "15px" }}>🏎️</div>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              marginBottom: "15px",
              background: "linear-gradient(45deg, #ffd700, #ff6b6b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Welcome to Avalanche Space Fleet!
          </h1>
          <p
            style={{
              fontSize: "20px",
              marginBottom: "25px",
              opacity: 0.9,
            }}
          >
            You need to mint your first NFT spaceship to start combat
          </p>

          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.3)",
              borderRadius: "20px",
              padding: "25px",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ marginBottom: "15px", fontSize: "22px" }}>
              🚀 Get Your Starter Interceptor
            </h3>
            <p style={{ marginBottom: "15px", opacity: 0.8, fontSize: "15px" }}>
              Mint your first NFT spaceship to enter the world of blockchain
              space combat!
            </p>

            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                backgroundColor: "rgba(255, 215, 0, 0.1)",
                borderRadius: "8px",
                border: "1px solid rgba(255, 215, 0, 0.3)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#ffd700",
                }}
              >
                💰 Price: 0.01 AVAX
              </p>
            </div>

            {mintingMessage && (
              <div
                style={{
                  marginBottom: "25px",
                  marginTop: "15px",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  minHeight: "60px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    mintingStatus === "success"
                      ? "rgba(16, 185, 129, 0.1)"
                      : mintingStatus === "error" ||
                        mintingStatus === "rejected"
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(59, 130, 246, 0.1)",
                  border: `1px solid ${
                    mintingStatus === "success"
                      ? "rgba(16, 185, 129, 0.3)"
                      : mintingStatus === "error" ||
                        mintingStatus === "rejected"
                      ? "rgba(239, 68, 68, 0.3)"
                      : "rgba(59, 130, 246, 0.3)"
                  }`,
                  color:
                    mintingStatus === "success"
                      ? "#10b981"
                      : mintingStatus === "error" ||
                        mintingStatus === "rejected"
                      ? "#ef4444"
                      : "#3b82f6",
                }}
              >
                {(mintingStatus === "wallet_confirm" ||
                  mintingStatus === "confirming") && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        border: "2px solid transparent",
                        borderTop: "2px solid #3b82f6",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    ></div>
                    <span style={{ fontSize: "16px", fontWeight: "600" }}>
                      {mintingMessage}
                    </span>
                  </div>
                )}
                {mintingStatus !== "wallet_confirm" &&
                  mintingStatus !== "confirming" && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "600",
                        lineHeight: "1.4",
                      }}
                    >
                      {mintingMessage}
                    </p>
                  )}
              </div>
            )}

            <button
              onClick={handleMintStarterShip}
              disabled={
                mintingStatus === "wallet_confirm" ||
                mintingStatus === "confirming" ||
                mintingStatus === "success" ||
                isPending
              }
              style={{
                backgroundColor:
                  mintingStatus === "success"
                    ? "#059669"
                    : mintingStatus === "wallet_confirm" ||
                      mintingStatus === "confirming" ||
                      isPending
                    ? "#6b7280"
                    : "#10b981",
                color: "white",
                padding: "16px 32px",
                borderRadius: "12px",
                border: "none",
                cursor:
                  mintingStatus === "wallet_confirm" ||
                  mintingStatus === "confirming" ||
                  mintingStatus === "success" ||
                  isPending
                    ? "not-allowed"
                    : "pointer",
                fontSize: "18px",
                fontWeight: "bold",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                transition: "all 0.3s ease",
                opacity:
                  mintingStatus === "success"
                    ? 1
                    : mintingStatus === "wallet_confirm" ||
                      mintingStatus === "confirming" ||
                      isPending
                    ? 0.6
                    : 1,
                minWidth: "250px",
              }}
              onMouseEnter={(e) => {
                if (
                  mintingStatus !== "wallet_confirm" &&
                  mintingStatus !== "confirming" &&
                  mintingStatus !== "success" &&
                  !isPending
                ) {
                  e.currentTarget.style.backgroundColor = "#059669";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (
                  mintingStatus !== "wallet_confirm" &&
                  mintingStatus !== "confirming" &&
                  mintingStatus !== "success" &&
                  !isPending
                ) {
                  e.currentTarget.style.backgroundColor = "#10b981";
                  e.currentTarget.style.transform = "translateY(0px)";
                }
              }}
            >
              {mintingStatus === "wallet_confirm" ? (
                "💳 Confirm in Wallet..."
              ) : mintingStatus === "confirming" ? (
                "⏳ Confirming on Blockchain..."
              ) : mintingStatus === "success" ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid transparent",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  🎮 Redirecting to Game...
                </div>
              ) : (
                "🚀 Mint Starter Interceptor (0.01 AVAX)"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSpaceView = false; // currentView === "space" - disabled
  const isFightingView = currentView === "fighting";
  const showNavigation = !isFightingView && !isSpaceView;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {showNavigation && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            right: "20px",
            zIndex: 50,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "6px",
              background: "rgba(0,0,0,0.3)",
              padding: "8px 12px",
              borderRadius: "20px",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
          >
            <button
              onClick={() =>
                selectedShip
                  ? setCurrentView("space")
                  : setCurrentView("selectship")
              }
              style={{
                background:
                  isSpaceView
                    ? "linear-gradient(45deg, #ff6b6b, #4ecdc4)"
                    : "transparent",
                color: isSpaceView ? "#000" : "#fff",
                border:
                  isSpaceView
                    ? "none"
                    : "1px solid rgba(255,255,255,0.2)",
                padding: "8px 12px",
                borderRadius: "15px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow:
                  isSpaceView
                    ? "0 4px 15px rgba(255,107,107,0.4)"
                    : "none",
              }}
              onMouseEnter={(e) => {
                if (!isSpaceView) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSpaceView) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "translateY(0px)";
                }
              }}
            >
              🚀 Space Combat
            </button>

            <button
              onClick={() => setCurrentView("tournament")}
              style={{
                background:
                  currentView === "tournament"
                    ? "linear-gradient(45deg, #8b5cf6, #06b6d4)"
                    : "transparent",
                color: currentView === "tournament" ? "#000" : "#fff",
                border:
                  currentView === "tournament"
                    ? "none"
                    : "1px solid rgba(255,255,255,0.2)",
                padding: "8px 12px",
                borderRadius: "15px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow:
                  currentView === "tournament"
                    ? "0 4px 15px rgba(139,92,246,0.4)"
                    : "none",
              }}
              onMouseEnter={(e) => {
                if (currentView !== "tournament") {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== "tournament") {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "translateY(0px)";
                }
              }}
            >
              🏆 Tournaments
            </button>

            <button
              onClick={() => setCurrentView("leaderboard")}
              style={{
                background:
                  currentView === "leaderboard"
                    ? "linear-gradient(45deg, #10b981, #ffd700)"
                    : "transparent",
                color: currentView === "leaderboard" ? "#000" : "#fff",
                border:
                  currentView === "leaderboard"
                    ? "none"
                    : "1px solid rgba(255,255,255,0.2)",
                padding: "8px 12px",
                borderRadius: "15px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow:
                  currentView === "leaderboard"
                    ? "0 4px 15px rgba(16,185,129,0.4)"
                    : "none",
              }}
              onMouseEnter={(e) => {
                if (currentView !== "leaderboard") {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== "leaderboard") {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "translateY(0px)";
                }
              }}
            >
              📊 Leaderboard
            </button>
          </div>

          <ConnectButton />
        </div>
      )}

      {currentView === "mainmenu" && (
        <MainMenu
          onSelectShip={handleSelectShip}
          onBuyShip={handleBuyShip}
          onDailyChallenge={handleDailyChallenge}
          onTournaments={handleNavigateToTournaments}
          onPracticeFight={handlePracticeFight}
          onStakeManager={handleStakeManager}
        />
      )}

      {currentView === "selectship" && (
        <SpaceFleetGame
          onNavigateToTournaments={handleNavigateToTournaments}
          onNavigateToMenu={handleNavigateToMainMenu}
        />
      )}

      {currentView === "buyship" && (
        <BuyShip
          onNavigateToMainMenu={handleNavigateToMainMenu}
          onBreedShip={() => setCurrentView("breeding")}
        />
      )}

      {currentView === "breeding" && (
        <Breeding onNavigateToMainMenu={handleNavigateToMainMenu} />
      )}

      {currentView === "dailychallenge" && (
        <DailyChallenge
          onNavigateToMainMenu={handleNavigateToMainMenu}
          onStartChallenge={() =>
            selectedShip
              ? setCurrentView("space")
              : setCurrentView("selectship")
          }
        />
      )}

      {currentView === "practicefight" && (
        <SpaceFleetGame
          onNavigateToTournaments={handleNavigateToTournaments}
          onNavigateToMenu={handleNavigateToMainMenu}
          practiceMode={true}
        />
      )}

      {currentView === "stakemanager" && (
        <StakeManager onNavigateToMainMenu={handleNavigateToMainMenu} />
      )}

      {currentView === "menu" && (
        <SpaceFleetGame
          onNavigateToTournaments={handleNavigateToTournaments}
          onNavigateToMenu={handleNavigateToMenu}
        />
      )}

      {currentView === "fighting" && (
        <SpaceFleetGame
          activeTournamentId={activeTournamentId}
          onTournamentCompleted={handleTournamentCompleted}
          onNavigateToTournaments={handleNavigateToTournaments}
          onNavigateToMenu={handleNavigateToMenu}
        />
      )}

      {currentView === "tournament" && (
        <TournamentLobby
          onStartRace={handleStartRace}
          onClose={handleNavigateToMainMenu}
          selectedShipId={selectedShip?.id}
          completedTournamentsFromApp={completedTournaments}
        />
      )}

      {currentView === "leaderboard" && (
        <Leaderboard onClose={handleNavigateToMainMenu} />
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Web3Provider>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <GameWrapper />
      </Web3Provider>
    </ErrorBoundary>
  );
}

export default App;
