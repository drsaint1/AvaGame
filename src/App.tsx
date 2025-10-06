import { useState } from "react";
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
import { useFightingContract } from "./hooks/useFightingContract";

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
  const {
    selectedShip,
  } = useFightingContract();
  const [currentView, setCurrentView] = useState<GameView>("mainmenu");
  const [activeTournamentId, setActiveTournamentId] = useState<number | null>(
    null
  );
  const [completedTournaments, setCompletedTournaments] = useState<Set<number>>(
    new Set()
  );
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

  if (currentView === "space") {
    return <SpaceFleetGame onClose={handleNavigateToMainMenu} />;
  }

  // Bypass minting screen - automatically proceed to game

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
