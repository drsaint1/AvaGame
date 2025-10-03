import React, { useState, useEffect, useCallback } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { config } from "../config/web3Config";
import {
  FIGHTING_CONTRACT_ADDRESS,
  FIGHTING_ABI,
} from "../hooks/useFightingContract";
import {
  TOURNAMENTS_CONTRACT_ADDRESS,
  TOURNAMENTS_ABI,
} from "../contracts/tournamentsAbi";

const LOCAL_TOURNAMENT_ABI = [
  {
    inputs: [
      { name: "name", type: "string" },
      { name: "entryFee", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "maxParticipants", type: "uint256" },
    ],
    name: "createTournament",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "tournamentId", type: "uint256" },
      { name: "shipId", type: "uint256" },
    ],
    name: "enterTournament",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "tournaments",
    outputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "entryFee", type: "uint256" },
      { name: "prizePool", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "maxParticipants", type: "uint256" },
      { name: "finalized", type: "bool" },
      { name: "creator", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextTournamentId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tournamentId", type: "uint256" }],
    name: "getTournamentParticipants",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tournamentId", type: "uint256" }],
    name: "getTournamentDetails",
    outputs: [
      { name: "name", type: "string" },
      { name: "entryFee", type: "uint256" },
      { name: "prizePool", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "participantCount", type: "uint256" },
      { name: "finalized", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "player", type: "address" }],
    name: "getPlayerShips",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
    name: "tournaments",
    outputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "entryFee", type: "uint256" },
      { name: "prizePool", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "maxParticipants", type: "uint256" },
      { name: "finalized", type: "bool" },
      { name: "creator", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "shipId", type: "uint256" }],
    name: "getShipCombatHistory",
    outputs: [
      {
        components: [
          { name: "player", type: "address" },
          { name: "shipId", type: "uint256" },
          { name: "score", type: "uint256" },
          { name: "distance", type: "uint256" },
          { name: "obstaclesAvoided", type: "uint256" },
          { name: "bonusCollected", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "tournamentId", type: "uint256" },
        ],
        internalType: "struct AvalancheFighting.CombatResult[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tournamentId", type: "uint256" }],
    name: "getTournamentWinners",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface Tournament {
  id: number;
  name: string;
  entryFee: bigint;
  prizePool: bigint;
  startTime: number;
  endTime: number;
  participantCount: number;
  maxParticipants: number;
  finalized: boolean;
}

interface TournamentLobbyProps {
  onStartRace: (tournamentId: number) => void;
  onClose: () => void;
  selectedShipId?: number;
  completedTournamentsFromApp?: Set<number>;
}

interface TournamentResultsModalProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
  userAddress?: string;
  selectedShipId?: number;
}

interface TournamentResult {
  shipId: number;
  owner: string;
  ownerAddress: string;
  score: number;
  rank: number;
  prize?: string;
  shipName?: string;
}

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

const TournamentResultsModal: React.FC<TournamentResultsModalProps> = ({
  tournament,
  isOpen,
  onClose,
  userAddress,
  selectedShipId,
}) => {
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userResult, setUserResult] = useState<TournamentResult | null>(null);

  useEffect(() => {
    if (isOpen && tournament) {
      loadResults();
    }
  }, [isOpen, tournament]);

  const loadResults = async () => {
    if (!tournament) return;

    setLoading(true);
    try {
      const [tournamentWinners, tournamentScoresData] = await Promise.all([
        readContract(config, {
          address: TOURNAMENTS_CONTRACT_ADDRESS,
          abi: TOURNAMENTS_ABI,
          functionName: "getTournamentWinners",
          args: [BigInt(tournament.id)],
        }),
        readContract(config, {
          address: TOURNAMENTS_CONTRACT_ADDRESS,
          abi: TOURNAMENTS_ABI,
          functionName: "getTournamentScores",
          args: [BigInt(tournament.id)],
        }),
      ]);


      const [shipIds, scores] = tournamentScoresData;

      const participantDataPromises = shipIds.map(async (shipId, index) => {
        try {
          const shipIdNum = Number(shipId);
          const tournamentScore = Number(scores[index]);
          const [shipDetails, ownerAddress] = await Promise.all([
            readContract(config, {
              address: FIGHTING_CONTRACT_ADDRESS,
              abi: FIGHTING_ABI,
              functionName: "getShipDetails",
              args: [shipId],
            }),
            readContract(config, {
              address: FIGHTING_CONTRACT_ADDRESS,
              abi: FIGHTING_ABI,
              functionName: "ownerOf",
              args: [shipId],
            }),
          ]);

          const ownerAddressStr = String(ownerAddress);
          const shipDetailsObj = shipDetails as any;

          return {
            shipId: shipIdNum,
            owner: `${ownerAddressStr.slice(0, 6)}...${ownerAddressStr.slice(
              -4
            )}`,
            ownerAddress: ownerAddressStr,
            score: tournamentScore,
            shipName:
              shipDetailsObj.name || shipDetailsObj[1] || `Ship #${shipIdNum}`,
            rank: 0,
            prize: undefined,
          };
        } catch (error) {
          console.error(`Failed to load data for ship ${shipId}:`, error);

          return {
            shipId: Number(shipId),
            owner: "Unknown Player",
            ownerAddress:
              "0x0000000000000000000000000000000000000000" as string,
            score: Number(scores[index]) || 0,
            shipName: `Ship #${shipId}`,
            rank: 0,
            prize: undefined,
          };
        }
      });

      const participantResults = await Promise.all(participantDataPromises);

      participantResults.sort((a, b) => b.score - a.score);

      participantResults.forEach((result, index) => {
        result.rank = index + 1;
        if (index < 3) {
          (result as any).prize = ["🥇 50%", "🥈 30%", "🥉 20%"][index];
        }
      });

      setResults(participantResults);

      if (userAddress) {
        try {
          const playerTournamentData = await readContract(config, {
            address: TOURNAMENTS_CONTRACT_ADDRESS,
            abi: TOURNAMENTS_ABI,
            functionName: "getPlayerTournamentResults",
            args: [BigInt(tournament.id), userAddress as `0x${string}`],
          });

          const [participated, playerShipIds, , bestScore, bestRank] =
            playerTournamentData;

          if (participated && Number(bestScore) > 0) {
            const userTournamentResult: TournamentResult = {
              shipId: Number(playerShipIds[0]),
              owner: `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`,
              ownerAddress: userAddress,
              score: Number(bestScore),
              rank: Number(bestRank),
              prize:
                Number(bestRank) <= 3
                  ? ["🥇 50%", "🥈 30%", "🥉 20%"][Number(bestRank) - 1]
                  : undefined,
              shipName: `Multiple Ships (${playerShipIds.length})`,
            };
            setUserResult(userTournamentResult);
          } else {
            setUserResult(null);
          }
        } catch (error) {
          console.error("Failed to get player tournament results:", error);

          const userResults = participantResults.filter(
            (r) =>
              String(r.ownerAddress).toLowerCase() === userAddress.toLowerCase()
          );

          if (userResults.length > 0) {
            const bestResult = userResults.sort((a, b) => a.rank - b.rank)[0];
            setUserResult(bestResult);
          } else {
            setUserResult(null);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load tournament results:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !tournament) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-700/50 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
              🏆 {tournament.name} Results
            </h2>
            <p className="text-gray-400 text-sm mb-2">
              Prize Pool: {formatEther(tournament.prizePool)} AVAX • Participants: {tournament.participantCount}
            </p>
            <p className="text-emerald-400 text-xs">
              ✅ Exact tournament scores & participation tracking from blockchain
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105"
          >
            ✕ Close
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 border-gray-600 border-t-amber-400 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-white text-base">Loading tournament results...</p>
          </div>
        ) : (
          <>
            {userResult && (
              <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl p-3 mb-4 text-center">
                <h3 className="text-white text-lg font-bold mb-3">🎯 Your Performance</h3>
                <div className="flex justify-center gap-4">
                  <div>
                    <div className="text-white/80 text-sm">Rank</div>
                    <div className="text-white text-xl font-bold">#{userResult.rank}</div>
                  </div>
                  <div>
                    <div className="text-white/80 text-sm">Score</div>
                    <div className="text-white text-xl font-bold">{userResult.score.toLocaleString()}</div>
                  </div>
                  {userResult.prize && (
                    <div>
                      <div className="text-white/80 text-sm">Prize</div>
                      <div className="text-white text-xl font-bold">{userResult.prize}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gray-900/60 rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 gap-3 p-3 bg-gray-800/50 text-sm font-semibold text-gray-300">
                <div>Rank</div>
                <div>Player</div>
                <div>Score</div>
                <div>Prize</div>
              </div>

              <div className="divide-y divide-gray-700/50">
                {results.slice(0, 10).map((result) => (
                  <div
                    key={result.shipId}
                    className={`grid grid-cols-4 gap-3 p-3 transition-colors duration-200 ${
                      result.shipId === selectedShipId ? 'bg-emerald-500/10' : 'hover:bg-gray-800/30'
                    }`}
                  >
                    <div className={`font-bold ${result.rank <= 3 ? 'text-amber-400' : 'text-white'}`}>
                      {result.rank <= 3 ? ["🥇", "🥈", "🥉"][result.rank - 1] : `#${result.rank}`}
                    </div>
                    <div className="text-white">
                      {result.shipName || `Ship #${result.shipId}`}
                      {result.shipId === selectedShipId && " (You)"}
                    </div>
                    <div className="text-white font-semibold">{result.score.toLocaleString()}</div>
                    <div className={result.prize ? "text-emerald-400" : "text-gray-500"}>
                      {result.prize || "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {results.length > 10 && (
              <p className="text-center text-gray-400 text-sm mt-4">
                Showing top 10 results of {results.length} participants
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const TournamentLobby: React.FC<TournamentLobbyProps> = ({
  onStartRace,
  onClose,
  selectedShipId,
  completedTournamentsFromApp,
}) => {
  const { isConnected, address } = useAccount();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [joinedTournaments, setJoinedTournaments] = useState<Set<number>>(
    new Set()
  );
  const [availableShipId, setAvailableShipId] = useState<number | null>(null);
  const [playerShips, setPlayerShips] = useState<any[]>([]);
  const [shipAvailabilityLoading, setShipAvailabilityLoading] = useState(true);
  const [completedTournaments, setCompletedTournaments] = useState<Set<number>>(
    new Set()
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedTournamentResults, setSelectedTournamentResults] =
    useState<Tournament | null>(null);
  const [newTournament, setNewTournament] = useState({
    name: "",
    entryFee: "0.01",
    duration: "24",
    maxParticipants: "50",
    prizePool: "0.1",
  });

  // Blockchain hooks
  const { writeContractAsync } = useWriteContract();

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const loadTournamentResults = async (tournament: Tournament) => {
    if (
      getCurrentTournamentStatus(tournament) !== "ended" ||
      !tournament.finalized
    ) {
      showToast(
        "Tournament results are only available for completed tournaments",
        "warning"
      );
      return;
    }

    try {
      setSelectedTournamentResults(tournament);
      setShowResultsModal(true);
    } catch (error) {
      console.error("Failed to load tournament results:", error);
      showToast("Failed to load tournament results", "error");
    }
  };

  // Check tournament completion
  const checkIfUserCompletedTournament = async (tournamentId: number) => {
    if (!address) return false;

    try {
      const playerTournamentData = await readContract(config, {
        address: TOURNAMENTS_CONTRACT_ADDRESS,
        abi: TOURNAMENTS_ABI,
        functionName: "getPlayerTournamentResults",
        args: [BigInt(tournamentId), address],
      });

      const [participated, playerShipIds, , bestScore] = playerTournamentData;

      const hasCompleted = participated && Number(bestScore) > 0;


      return hasCompleted;
    } catch (error) {
      console.error(
        `Error checking tournament ${tournamentId} completion:`,
        error
      );

      if (!selectedShipId) return false;

      try {

        const raceHistory = await readContract(config, {
          address: FIGHTING_CONTRACT_ADDRESS,
          abi: LOCAL_TOURNAMENT_ABI,
          functionName: "getShipCombatHistory",
          args: [BigInt(selectedShipId)],
        });

        if (!raceHistory || raceHistory.length === 0) {
          return false;
        }

        const hasRacedInTournament = raceHistory.some(
          (race: any) => Number(race.tournamentId) === tournamentId
        );

        return hasRacedInTournament;
      } catch (fallbackError) {
        console.error(
          `Fallback completion check also failed for tournament ${tournamentId}:`,
          fallbackError
        );
        return false;
      }
    }
  };

  const checkIfUserJoined = async (tournamentId: number) => {
    if (!address) return false;

    try {
      const hasParticipated = await readContract(config, {
        address: TOURNAMENTS_CONTRACT_ADDRESS,
        abi: TOURNAMENTS_ABI,
        functionName: "hasPlayerParticipated",
        args: [BigInt(tournamentId), address],
      });


      return hasParticipated;
    } catch (error) {
      console.error(
        `Error checking tournament ${tournamentId} participation:`,
        error
      );

      try {

        const participants = await readContract(config, {
          address: TOURNAMENTS_CONTRACT_ADDRESS,
          abi: TOURNAMENTS_ABI,
          functionName: "getTournamentParticipants",
          args: [BigInt(tournamentId)],
        });

        if (!participants || participants.length === 0) {
          return false;
        }

        const userShips = await readContract(config, {
          address: FIGHTING_CONTRACT_ADDRESS,
          abi: LOCAL_TOURNAMENT_ABI,
          functionName: "getPlayerShips",
          args: [address],
        });

        if (!userShips || userShips.length === 0) {
          return false;
        }

        const userShipIds = userShips.map((shipId) => Number(shipId));
        const participantShipIds = participants.map((shipId) => Number(shipId));
        const hasJoined = userShipIds.some((userShipId) =>
          participantShipIds.includes(userShipId)
        );

        return hasJoined;
      } catch (fallbackError) {
        console.error(
          `Fallback method also failed for tournament ${tournamentId}:`,
          fallbackError
        );
        return false;
      }
    }
  };

  const { data: nextTournamentId, refetch: refetchTournamentCount } =
    useReadContract({
      address: TOURNAMENTS_CONTRACT_ADDRESS,
      abi: TOURNAMENTS_ABI,
      functionName: "nextTournamentId",
    });

  const loadTournaments = useCallback(async () => {
    if (!isConnected || !nextTournamentId) {
      setTournaments([]);
      return;
    }

    setLoading(true);

    try {
      const loadedTournaments: Tournament[] = [];
      const now = Date.now();
      const joinedTournamentIds = new Set<number>();
      const completedTournamentIds = new Set<number>();


      const tournamentCount = Number(nextTournamentId || 0);

      if (tournamentCount > 1) {

        const tournamentIds = Array.from(
          { length: tournamentCount - 1 },
          (_, i) => i + 1
        );

        const tournamentPromises = tournamentIds.map(async (tournamentId) => {
          try {

            const [tournamentDetails, userHasJoined, userHasCompleted] =
              await Promise.all([
                readContract(config, {
                  address: TOURNAMENTS_CONTRACT_ADDRESS,
                  abi: TOURNAMENTS_ABI,
                  functionName: "getTournamentDetails",
                  args: [BigInt(tournamentId)],
                }),
                checkIfUserJoined(tournamentId),
                checkIfUserCompletedTournament(tournamentId),
              ]);


            const [
              name,
              entryFee,
              prizePool,
              startTime,
              endTime,
              participantCount,
              finalized,
            ] = tournamentDetails;

            const startTimeMs = Number(startTime) * 1000;
            const endTimeMs = Number(endTime) * 1000;

            if (userHasJoined) {
              joinedTournamentIds.add(tournamentId);
            }
            if (userHasCompleted) {
              completedTournamentIds.add(tournamentId);
            }

            return {
              id: tournamentId,
              name: name || `🏆 Tournament #${tournamentId}`,
              entryFee: entryFee,
              prizePool: prizePool,
              startTime: startTimeMs,
              endTime: endTimeMs,
              participantCount: Number(participantCount),
              maxParticipants: 50,
              finalized: finalized,
            };
          } catch (error) {
            console.error(`Failed to load tournament ${tournamentId}:`, error);

            return {
              id: tournamentId,
              name: `🏆 Tournament #${tournamentId} (Loading...)`,
              entryFee: parseEther("0.01"),
              prizePool: parseEther("0.1"),
              startTime: now + 300000,
              endTime: now + 86400000,
              participantCount: 0,
              maxParticipants: 50,
              finalized: false,
            };
          }
        });

        const loadedTournamentResults = await Promise.all(tournamentPromises);
        loadedTournaments.push(...loadedTournamentResults);
      } else {

        loadedTournaments.push({
          id: 0,
          name: "🎮 Demo Tournament (Create your own!)",
          entryFee: parseEther("0.001"),
          prizePool: parseEther("0.01"),
          startTime: now + 300000,
          endTime: now + 86400000,
          participantCount: 0,
          maxParticipants: 10,
          finalized: false,
        });
      }

      setJoinedTournaments(joinedTournamentIds);

      const allCompletedTournaments = new Set([
        ...completedTournamentIds,
        ...(completedTournamentsFromApp || []),
      ]);
      setCompletedTournaments(allCompletedTournaments);

      setTournaments(loadedTournaments);
    } catch (error) {
      console.error("❌ Failed to load tournaments:", error);
      showToast("Failed to load tournaments. Please try refreshing.", "error");
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }, [
    isConnected,
    nextTournamentId,
    address,
    selectedShipId,
    completedTournamentsFromApp,
  ]);

  useEffect(() => {
    loadTournaments();

    const interval = setInterval(loadTournaments, 60000);
    return () => clearInterval(interval);
  }, [loadTournaments]);

  const getCurrentTournamentStatus = (
    tournament: Tournament
  ): "upcoming" | "active" | "ended" => {
    const now = Date.now();
    return now < tournament.startTime
      ? "upcoming"
      : now <= tournament.endTime && !tournament.finalized
      ? "active"
      : "ended";
  };

  const [, forceUpdate] = useState({});

  useEffect(() => {
    const hasUpcomingTournaments = tournaments.some(
      (tournament) =>
        getCurrentTournamentStatus(tournament) === "upcoming" &&
        Date.now() < tournament.startTime &&
        tournament.startTime - Date.now() < 600000
    );

    if (hasUpcomingTournaments) {
      const quickInterval = setInterval(() => {
        forceUpdate({});
      }, 1000);

      return () => clearInterval(quickInterval);
    }
  }, [tournaments]);

  useEffect(() => {
    const checkAvailableShips = async () => {
      if (!isConnected || !address) {
        setAvailableShipId(null);
        setPlayerShips([]);
        setShipAvailabilityLoading(false);
        return;
      }

      setShipAvailabilityLoading(true);
      try {
        const ships = await readContract(config, {
          address: FIGHTING_CONTRACT_ADDRESS,
          abi: FIGHTING_ABI,
          functionName: "getPlayerShips",
          args: [address],
        });

        if (!ships || ships.length === 0) {
          setAvailableShipId(null);
          setPlayerShips([]);
          return;
        }

        const shipsWithDetails = [];
        let firstAvailable = null;

        for (const shipId of ships) {
          try {
            const shipDetails = await readContract(config, {
              address: FIGHTING_CONTRACT_ADDRESS,
              abi: FIGHTING_ABI,
              functionName: "getShipDetails",
              args: [shipId],
            });

            const shipInfo = {
              id: Number(shipId),
              name: shipDetails.name,
              isStaked: shipDetails.isStaked,
              available: !shipDetails.isStaked,
            };

            shipsWithDetails.push(shipInfo);

            if (!shipDetails.isStaked) {
              if (!firstAvailable) {
                firstAvailable = Number(shipId);
              }

              if (selectedShipId && Number(shipId) === selectedShipId) {
                firstAvailable = selectedShipId;
              }
            }
          } catch (error) {
            console.error(`Failed to check ship ${shipId} details:`, error);
          }
        }

        setPlayerShips(shipsWithDetails);
        setAvailableShipId(firstAvailable);

      } catch (error) {
        console.error("Failed to check ship availability:", error);
        setAvailableShipId(null);
        setPlayerShips([]);
      } finally {
        setShipAvailabilityLoading(false);
      }
    };

    checkAvailableShips();
  }, [isConnected, address, selectedShipId]);

  const formatTimeRemaining = (timestamp: number) => {
    const diff = timestamp - Date.now();
    if (diff <= 0) return "Started";

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: "upcoming" | "active" | "ended") => {
    switch (status) {
      case "upcoming":
        return "from-yellow-400 to-orange-500";
      case "active":
        return "from-emerald-400 to-green-500";
      case "ended":
        return "from-gray-500 to-gray-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getStatusIcon = (status: "upcoming" | "active" | "ended") => {
    switch (status) {
      case "upcoming":
        return "⏰";
      case "active":
        return "🔥";
      case "ended":
        return "🏁";
      default:
        return "⏳";
    }
  };

  // Tournament functions
  const createTournament = async () => {

    if (!isConnected || !address) {
      showToast("Please connect your wallet to create a tournament", "warning");
      return;
    }

    if (!newTournament.name.trim()) {
      showToast("Please enter a tournament name", "warning");
      return;
    }

    try {
      setLoading(true);

      const entryFeeWei = parseEther(newTournament.entryFee);
      const durationSeconds = BigInt(parseInt(newTournament.duration) * 3600); // Convert hours to seconds
      const initialPrizePool = parseEther(newTournament.prizePool);

      const minimumPrizePool = entryFeeWei * BigInt(5);
      if (initialPrizePool < minimumPrizePool) {
        showToast(
          `Prize pool must be at least ${formatEther(
            minimumPrizePool
          )} AVAX (5x entry fee)`,
          "warning"
        );
        return;
      }


      const txHash = await writeContractAsync({
        address: TOURNAMENTS_CONTRACT_ADDRESS,
        abi: TOURNAMENTS_ABI,
        functionName: "createTournament",
        args: [
          newTournament.name,
          entryFeeWei,
          durationSeconds,
          BigInt(newTournament.maxParticipants),
        ],
        value: initialPrizePool,
      });


      setNewTournament({
        name: "",
        entryFee: "0.01",
        duration: "24",
        maxParticipants: "50",
        prizePool: "0.1",
      });
      setShowCreateModal(false);

      await refetchTournamentCount();

      showToast(
        "🎉 Tournament created successfully! It will start in 5 minutes.",
        "success"
      );
    } catch (error: any) {
      console.error("❌ Failed to create tournament:", error);
      const errorMessage =
        error?.message || error?.reason || "Unknown error occurred";
      showToast(`❌ Failed to create tournament: ${errorMessage}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournament: Tournament) => {
    if (!isConnected || !address || !availableShipId) {
      if (!availableShipId) {
        showToast(
          "No available ships for tournament. Please unstake a ship first.",
          "warning"
        );
      }
      return;
    }

    try {
      setLoading(true);


      const txHash = await writeContractAsync({
        address: TOURNAMENTS_CONTRACT_ADDRESS,
        abi: TOURNAMENTS_ABI,
        functionName: "enterTournament",
        args: [BigInt(tournament.id), BigInt(availableShipId)],
        value: tournament.entryFee,
      });


      setJoinedTournaments((prev) => new Set([...prev, tournament.id]));

      showToast(
        `Successfully joined ${tournament.name}! You can start racing when it becomes active.`,
        "success"
      );

      setTimeout(async () => {
        await refetchTournamentCount();
      }, 3000);
    } catch (error) {
      console.error("Failed to join tournament:", error);
      showToast("Failed to join tournament. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center z-50 p-3">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-700/50 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
              🏆 Tournament Lobby
            </h2>
            <p className="text-gray-400 text-sm mb-3">
              Compete against players worldwide for AVAX prizes
            </p>

            {isConnected && (
              <div className={`inline-flex items-center px-3 py-2 rounded-xl border ${
                shipAvailabilityLoading
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : availableShipId
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                <span className="text-base mr-2">
                  {shipAvailabilityLoading ? "🔄" : availableShipId ? "🚀" : "⚠️"}
                </span>
                <span className="text-sm font-medium text-white">
                  {shipAvailabilityLoading
                    ? "Checking ship availability..."
                    : availableShipId
                    ? `Tournament Ship: ${
                        playerShips.find((c) => c.id === availableShipId)?.name || `Ship #${availableShipId}`
                      } (Available)`
                    : playerShips.length === 0
                    ? "No ships available - mint a ship first"
                    : `${playerShips.length} ship(s) staked - unstake to join tournaments`}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-xl font-semibold text-sm text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              ➕ Create Tournament
            </button>
            <button
              onClick={async () => {
                await refetchTournamentCount();
                await loadTournaments();
              }}
              disabled={loading}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Refreshing...</span>
                </div>
              ) : (
                "🔄 Refresh Tournaments"
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {!isConnected ? (
          <div className="text-center py-8 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="text-4xl mb-3">🔗</div>
            <p className="text-red-400 text-lg font-semibold">
              Connect your wallet to join tournaments
            </p>
          </div>
        ) : shipAvailabilityLoading ? (
          <div className="text-center py-8 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="text-4xl mb-3 animate-pulse">🔄</div>
            <p className="text-blue-400 text-lg font-semibold mb-2">Loading tournament lobby...</p>
            <p className="text-gray-400">Checking your ship availability and tournament status</p>
          </div>
        ) : !availableShipId ? (
          <div className="text-center py-8 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="text-4xl mb-3">🚀</div>
            <p className="text-amber-400 text-lg font-semibold mb-2">
              {playerShips.length === 0
                ? "You need a space ship to join tournaments"
                : "All your ships are staked and unavailable for tournaments"}
            </p>
            <p className="text-gray-400">
              {playerShips.length === 0
                ? "Go back to main menu and mint a ship first"
                : `You have ${playerShips.length} ship(s), but they're all staked. Please unstake a ship from your garage to join tournaments.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments
              .slice()
              .sort((a, b) => {
                const aStatus = getCurrentTournamentStatus(a);
                const bStatus = getCurrentTournamentStatus(b);

                const aJoinedNotCompleted =
                  joinedTournaments.has(a.id) && !completedTournaments.has(a.id);
                const bJoinedNotCompleted =
                  joinedTournaments.has(b.id) && !completedTournaments.has(b.id);

                const aCompleted = completedTournaments.has(a.id);
                const bCompleted = completedTournaments.has(b.id);

                if (aJoinedNotCompleted && !bJoinedNotCompleted) return -1;
                if (bJoinedNotCompleted && !aJoinedNotCompleted) return 1;

                if (aJoinedNotCompleted && bJoinedNotCompleted) {
                  if (aStatus === "active" && bStatus === "active") {
                    return a.endTime - b.endTime;
                  }
                  if (aStatus === "active" && bStatus !== "active") return -1;
                  if (bStatus === "active" && aStatus !== "active") return 1;
                  return a.startTime - b.startTime;
                }

                if (aStatus === "active" && bStatus !== "active") return -1;
                if (bStatus === "active" && aStatus !== "active") return 1;

                if (aStatus === "upcoming" && bStatus === "ended") return -1;
                if (bStatus === "upcoming" && aStatus === "ended") return 1;

                if (
                  aCompleted &&
                  !bCompleted &&
                  aStatus === "ended" &&
                  bStatus === "ended"
                )
                  return -1;
                if (
                  bCompleted &&
                  !aCompleted &&
                  aStatus === "ended" &&
                  bStatus === "ended"
                )
                  return 1;

                if (aCompleted && bCompleted) {
                  return b.endTime - a.endTime;
                }

                if (aStatus === "active" && bStatus === "active") {
                  return a.endTime - b.endTime;
                }

                if (aStatus === "upcoming" && bStatus === "upcoming") {
                  return a.startTime - b.startTime;
                }

                return 0;
              })
              .map((tournament) => {
                const status = getCurrentTournamentStatus(tournament);
                const isCompleted = completedTournaments.has(tournament.id);
                const isJoinedNotCompleted = joinedTournaments.has(tournament.id) && !isCompleted;

                return (
                  <div
                    key={tournament.id}
                    className={`bg-gray-900/60 backdrop-blur-sm border-2 rounded-2xl p-3 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden ${
                      isCompleted
                        ? 'border-gray-600/40 opacity-75'
                        : isJoinedNotCompleted
                        ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/25'
                        : 'border-gray-700/50 hover:border-gray-600/80'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
                          {isCompleted ? (
                            <div className="px-2 py-1 bg-gray-600/50 text-gray-300 rounded-full text-xs font-semibold">
                              ✅ COMPLETED
                            </div>
                          ) : (
                            isJoinedNotCompleted && (
                              <div className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold animate-pulse">
                                🏁 READY TO RACE
                              </div>
                            )
                          )}
                        </div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${getStatusColor(status)}`}>
                          <span>{getStatusIcon(status)}</span>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </div>
                      </div>
                      <div className="text-right text-gray-400">
                        <div className="text-xs">Tournament #{tournament.id}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Entry Fee</div>
                        <div className="text-blue-400 font-bold text-sm">{formatEther(tournament.entryFee)} AVAX</div>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Prize Pool</div>
                        <div className="text-emerald-400 font-bold text-sm">{formatEther(tournament.prizePool)} AVAX</div>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Participants</div>
                        <div className="text-purple-400 font-bold text-sm">{tournament.participantCount}/{tournament.maxParticipants}</div>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">
                          {status === "upcoming" ? "Starts In" : status === "active" ? "Ends In" : "Ended"}
                        </div>
                        <div className="text-amber-400 font-bold text-sm">
                          {status === "upcoming"
                            ? formatTimeRemaining(tournament.startTime)
                            : status === "active"
                            ? formatTimeRemaining(tournament.endTime)
                            : "Finished"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                      <div className="text-gray-400 text-xs bg-gray-800/30 px-2 py-1 rounded-lg">
                        🏆 Prize Distribution: 🥇 50% • 🥈 30% • 🥉 20%
                      </div>
                      <div className="flex gap-2">
                        {status === "upcoming" && (
                          <>
                            {!joinedTournaments.has(tournament.id) ? (
                              <button
                                onClick={() => joinTournament(tournament)}
                                disabled={
                                  loading ||
                                  tournament.participantCount >= tournament.maxParticipants ||
                                  Date.now() < tournament.startTime
                                }
                                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                                  tournament.participantCount >= tournament.maxParticipants ||
                                  Date.now() < tournament.startTime
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                                }`}
                              >
                                {tournament.participantCount >= tournament.maxParticipants
                                  ? "🔒 Full"
                                  : Date.now() < tournament.startTime
                                  ? "⏰ Starting Soon..."
                                  : "💰 Join Now (Pay Entry Fee)"}
                              </button>
                            ) : (
                              <button
                                disabled
                                className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-xl font-semibold text-sm cursor-not-allowed"
                              >
                                ✅ Joined - Wait for Tournament Start
                              </button>
                            )}
                          </>
                        )}
                        {status === "active" && (
                          <>
                            {isCompleted ? (
                              <button
                                disabled
                                className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-xl font-semibold text-sm cursor-not-allowed"
                              >
                                ✅ Tournament Completed - Cannot Race Again
                              </button>
                            ) : joinedTournaments.has(tournament.id) ? (
                              <button
                                onClick={() => onStartRace(tournament.id)}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105"
                              >
                                🏁 Race Now!
                              </button>
                            ) : (
                              <button
                                onClick={() => joinTournament(tournament)}
                                disabled={
                                  loading ||
                                  tournament.participantCount >= tournament.maxParticipants ||
                                  Date.now() < tournament.startTime
                                }
                                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                                  tournament.participantCount >= tournament.maxParticipants ||
                                  Date.now() < tournament.startTime
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                                }`}
                              >
                                {tournament.participantCount >= tournament.maxParticipants
                                  ? "🔒 Full"
                                  : Date.now() < tournament.startTime
                                  ? "⏰ Starting Soon..."
                                  : "💰 Join & Race (Pay Entry Fee)"}
                              </button>
                            )}
                          </>
                        )}
                        {status === "ended" && (
                          <button
                            onClick={() => loadTournamentResults(tournament)}
                            disabled={!tournament.finalized}
                            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                              tournament.finalized
                                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {tournament.finalized ? "🏆 View Results" : "⏳ Finalizing..."}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                );
              })}

            {!loading && tournaments.length === 0 && (
              <div className="text-center py-8 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-blue-400 text-lg font-semibold mb-2">No tournaments available</p>
                <p className="text-gray-400">Be the first to create one and start the competition!</p>
              </div>
            )}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-3">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 max-w-lg w-full border border-gray-700/50 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4 text-center">
                🏆 Create New Tournament
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    🏷️ Tournament Name
                  </label>
                  <input
                    type="text"
                    value={newTournament.name}
                    onChange={(e) =>
                      setNewTournament((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-500/50 focus:bg-blue-500/10 transition-all duration-300 outline-none"
                    placeholder="Epic Racing Championship"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                      💰 Entry Fee (AVAX)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={newTournament.entryFee}
                      onChange={(e) =>
                        setNewTournament((prev) => ({ ...prev, entryFee: e.target.value }))
                      }
                      className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-500/50 focus:bg-blue-500/10 transition-all duration-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                      ⏰ Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={newTournament.duration}
                      onChange={(e) =>
                        setNewTournament((prev) => ({ ...prev, duration: e.target.value }))
                      }
                      className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-500/50 focus:bg-blue-500/10 transition-all duration-300 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                      👥 Max Participants
                    </label>
                    <input
                      type="number"
                      value={newTournament.maxParticipants}
                      onChange={(e) =>
                        setNewTournament((prev) => ({ ...prev, maxParticipants: e.target.value }))
                      }
                      className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-500/50 focus:bg-blue-500/10 transition-all duration-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                      🏆 Prize Pool (AVAX)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTournament.prizePool}
                      onChange={(e) =>
                        setNewTournament((prev) => ({ ...prev, prizePool: e.target.value }))
                      }
                      className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-500/50 focus:bg-blue-500/10 transition-all duration-300 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={createTournament}
                  disabled={loading || !newTournament.name.trim()}
                  className={`flex-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                    loading || !newTournament.name.trim()
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white'
                  }`}
                >
                  {loading ? "⏳ Creating..." : "🚀 Create Tournament"}
                </button>
              </div>
            </div>
          </div>
        )}

        <TournamentResultsModal
          tournament={selectedTournamentResults}
          isOpen={showResultsModal}
          onClose={() => {
            setShowResultsModal(false);
            setSelectedTournamentResults(null);
          }}
          userAddress={address}
          selectedShipId={availableShipId || undefined}
        />
      </div>

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`p-3 rounded-xl backdrop-blur-sm border cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              toast.type === "success"
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                : toast.type === "error"
                ? "bg-red-500/20 border-red-500/50 text-red-300"
                : toast.type === "warning"
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-blue-500/20 border-blue-500/50 text-blue-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {toast.type === "success"
                  ? "✅"
                  : toast.type === "error"
                  ? "❌"
                  : toast.type === "warning"
                  ? "⚠️"
                  : "ℹ️"}
              </span>
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        ))}
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

export default TournamentLobby;