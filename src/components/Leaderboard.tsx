import React, { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { config } from "../config/web3Config";
import {
  FIGHTING_CONTRACT_ADDRESS,
  FIGHTING_ABI,
} from "../hooks/useFightingContract";

interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string;
  bestScore: number;
  level: number;
  totalXP: number;
  totalTokensEarned: number;
  isCurrentPlayer?: boolean;
}

interface LeaderboardProps {
  onClose: () => void;
}

type SortBy = "score" | "level" | "tokens";

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("score");
  const [loading, setLoading] = useState(true);
  const [currentPlayerRank, setCurrentPlayerRank] = useState<number | null>(
    null
  );
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { data: currentPlayerStats } = useReadContract({
    address: FIGHTING_CONTRACT_ADDRESS,
    abi: FIGHTING_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    const buildContractBasedLeaderboard = async () => {
      setLoading(true);

      try {
        const leaderboardData = await readContract(config, {
          address: FIGHTING_CONTRACT_ADDRESS,
          abi: FIGHTING_ABI,
          functionName: "getLeaderboard",
          args: [100n],
        });

        const [players, scores, levels, totalXPs, shipCounts] = leaderboardData;

        if (players.length === 0) {
          setLeaderboard([]);
          setCurrentPlayerRank(null);
          setLastRefresh(new Date());
          setLoading(false);
          return;
        }

        const leaderboardEntries: LeaderboardEntry[] = players.map(
          (playerAddress, index) => {
            const isCurrentPlayer =
              address && playerAddress.toLowerCase() === address.toLowerCase();

            const bestScore = Number(scores[index]);


            return {
              rank: index + 1,
              address: playerAddress,
              displayName: isCurrentPlayer
                ? `${playerAddress.slice(0, 6)}... (You)`
                : `${playerAddress.slice(0, 6)}...`,
              bestScore,
              level: Number(levels[index]),
              totalXP: Number(totalXPs[index]),
              totalTokensEarned: 0,
              isCurrentPlayer: !!isCurrentPlayer,
            };
          }
        );

        const leaderboardWithTokens: LeaderboardEntry[] = await Promise.all(
          leaderboardEntries.map(async (entry) => {
            try {
              const tokenBalance = await readContract(config, {
                address: FIGHTING_CONTRACT_ADDRESS,
                abi: FIGHTING_ABI,
                functionName: "getTokenBalance",
                args: [entry.address as `0x${string}`],
              });
              const earnedTokens = Number(tokenBalance) / 1e18;

              return {
                ...entry,
                totalTokensEarned: earnedTokens,
              };
            } catch (error) {
              console.warn(
                `Failed to fetch earned tokens for ${entry.address}:`,
                error
              );
              return entry;
            }
          })
        );

        leaderboardWithTokens.sort((a, b) => {
          switch (sortBy) {
            case "score":
              return b.bestScore - a.bestScore;
            case "level":
              return b.level - a.level;
            case "tokens":
              return b.totalTokensEarned - a.totalTokensEarned;
            default:
              return b.bestScore - a.bestScore;
          }
        });

        leaderboardEntries.forEach((player, index) => {
          player.rank = index + 1;
        });

        const currentPlayerEntry = leaderboardEntries.find(
          (p) => p.isCurrentPlayer
        );
        if (currentPlayerEntry) {
          setCurrentPlayerRank(currentPlayerEntry.rank);
        } else {
          setCurrentPlayerRank(null);
        }

        setLeaderboard(leaderboardWithTokens);
        setLastRefresh(new Date());
      } catch (error) {
        console.error("❌ Failed to build contract-based leaderboard:", error);

        if (address && currentPlayerStats) {
          const [level, totalXP] = currentPlayerStats;

          const bestScore = 0;

          let earnedTokens = 0;
          try {
            const tokenBalance = await readContract(config, {
              address: FIGHTING_CONTRACT_ADDRESS,
              abi: FIGHTING_ABI,
              functionName: "getTokenBalance",
              args: [address],
            });
            earnedTokens = Number(tokenBalance) / 1e18;
          } catch (tokenError) {
            console.warn(
              "Failed to fetch current player's earned tokens:",
              tokenError
            );
          }

          const fallbackPlayer: LeaderboardEntry = {
            rank: 1,
            address: address,
            displayName: `${address.slice(0, 6)}... (You)`,
            bestScore,
            level: Number(level),
            totalXP: Number(totalXP),
            totalTokensEarned: earnedTokens,
            isCurrentPlayer: true,
          };

          setLeaderboard([fallbackPlayer]);
          setCurrentPlayerRank(1);
        } else {
          setLeaderboard([]);
          setCurrentPlayerRank(null);
        }
      } finally {
        setLoading(false);
      }
    };

    buildContractBasedLeaderboard();
  }, [address, currentPlayerStats, sortBy]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        setLastRefresh(new Date());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading]);

  const handleRefresh = () => {
    setLoading(true);
    setLastRefresh(new Date());
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "#fbbf24";
      case 2:
        return "#d1d5db";
      case 3:
        return "#d97706";
      default:
        return "#ffffff";
    }
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toLocaleString();
  };

  const sortLabels = {
    score: "Best Score",
    level: "Level",
    tokens: "Tokens Earned",
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50 overflow-hidden">
        {/* Animated floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-transparent border-t-yellow-400 rounded-full animate-spin"></div>
            <span className="text-white">Loading leaderboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/30 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center m-0">
              🏆 Global Leaderboard
            </h2>
            {address && currentPlayerRank && (
              <p className="text-sm text-yellow-400 mt-1 m-0">
                Your current rank: #{currentPlayerRank}
              </p>
            )}
            {address && !currentPlayerRank && (
              <p className="text-sm text-gray-400 mt-1 m-0">
                🎮 Start playing to appear on the leaderboard!
              </p>
            )}
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`${
                loading ? "bg-gray-500 cursor-not-allowed opacity-60" : "bg-emerald-500 hover:bg-emerald-600 cursor-pointer"
              } text-white border-none px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                  Refreshing...
                </>
              ) : (
                <>🔄 Refresh</>
              )}
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white border-none px-4 py-2 rounded-lg cursor-pointer transition-all duration-300"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            <span className="text-gray-400 text-sm self-center">
              Sort by:
            </span>
            {(Object.keys(sortLabels) as SortBy[]).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-3 py-1 rounded-lg text-sm border-none cursor-pointer transition-all duration-300 ${
                  sortBy === sort
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {sortLabels[sort]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-sm">
                <tr className="border-b border-gray-700">
                  <th className="pb-3 text-gray-400 font-semibold">
                    Rank
                  </th>
                  <th className="pb-3 text-gray-400 font-semibold">
                    Player
                  </th>
                  <th className="pb-3 text-gray-400 font-semibold">
                    Level
                  </th>
                  <th className="pb-3 text-gray-400 font-semibold">
                    Best Score
                  </th>
                  <th className="pb-3 text-gray-400 font-semibold">
                    Total XP
                  </th>
                  <th className="pb-3 text-gray-400 font-semibold">
                    Tokens Earned
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr
                    key={`${entry.address}-${index}`}
                    className={`border-b border-gray-800 transition-all duration-300 ${
                      entry.isCurrentPlayer
                        ? "bg-blue-500/30 hover:bg-blue-500/40"
                        : "hover:bg-gray-800"
                    }`}
                  >
                    <td className="py-3">
                      <span
                        className="font-bold text-lg"
                        style={{ color: getRankColor(entry.rank) }}
                      >
                        {getRankIcon(entry.rank)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div>
                        <div
                          className={`font-semibold ${
                            entry.isCurrentPlayer ? "text-blue-400" : "text-white"
                          }`}
                        >
                          {entry.displayName}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {entry.address.slice(0, 10)}...
                          {entry.address.slice(-4)}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-white font-bold text-lg">
                        {entry.level}
                      </div>
                    </td>
                    <td className="py-3 text-emerald-400 font-bold text-lg">
                      {entry.bestScore.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <div className="text-purple-400 font-medium">
                        {entry.totalXP.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 text-yellow-400 font-bold">
                      {formatTokens(entry.totalTokensEarned)} RACE
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">
                {leaderboard.length}
              </div>
              <div className="text-sm text-gray-400">
                Total Players
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatTokens(
                  leaderboard.reduce(
                    (sum, entry) => sum + entry.totalTokensEarned,
                    0
                  )
                )}
              </div>
              <div className="text-sm text-gray-400">
                Total Tokens
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {leaderboard
                  .reduce((sum, entry) => sum + entry.totalXP, 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">
                Total XP
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {Math.max(
                  ...leaderboard.map((entry) => entry.bestScore)
                ).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">
                Highest Score
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-3 m-0">
              🎮 Game Statistics
            </h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 text-sm">
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-3">
                <div className="text-blue-400 font-bold">
                  {leaderboard.filter((entry) => entry.level >= 10).length}
                </div>
                <div className="text-gray-400">Level 10+ Players</div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-3">
                <div className="text-emerald-400 font-bold">
                  {
                    leaderboard.filter((entry) => entry.bestScore >= 15000)
                      .length
                  }
                </div>
                <div className="text-gray-400">15K+ Score</div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-3">
                <div className="text-yellow-400 font-bold">
                  {
                    leaderboard.filter(
                      (entry) => entry.totalTokensEarned >= 10000
                    ).length
                  }
                </div>
                <div className="text-gray-400">10K+ Tokens</div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-3">
                <div className="text-purple-400 font-bold">
                  {leaderboard.filter((entry) => entry.level >= 15).length}
                </div>
                <div className="text-gray-400">Level 15+</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            📊 Contract-based leaderboard • Auto-refreshes every 30s
          </p>
          <p className="text-[11px] text-gray-600 mt-1">
            💡 Last updated: {lastRefresh.toLocaleTimeString()} • Data directly
            from smart contract
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
