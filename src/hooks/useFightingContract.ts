import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWatchContractEvent,
} from "wagmi";
import { readContract } from "wagmi/actions";
import { parseEther, formatEther } from "viem";
import { config } from "../config/web3Config";

export const FIGHTING_CONTRACT_ADDRESS = import.meta.env
  .VITE_FIGHTING_CONTRACT_ADDRESS as `0x${string}`;

export const FIGHTING_ABI = [
  {
    inputs: [],
    name: "mintStarterShip",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "mintPremiumShip",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "mintDestroyer",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "mintBattlecruiser",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "player", type: "address" },
      { internalType: "uint256", name: "shipId", type: "uint256" },
      { internalType: "uint256", name: "score", type: "uint256" },
      { internalType: "uint256", name: "distance", type: "uint256" },
      { internalType: "uint256", name: "obstaclesAvoided", type: "uint256" },
      { internalType: "uint256", name: "bonusCollected", type: "uint256" },
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
    ],
    name: "submitCombatResult",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "player", type: "address" },
      { internalType: "uint256", name: "shipId", type: "uint256" },
      { internalType: "uint256", name: "score", type: "uint256" },
      { internalType: "uint256", name: "distance", type: "uint256" },
      { internalType: "uint256", name: "obstaclesAvoided", type: "uint256" },
      { internalType: "uint256", name: "bonusCollected", type: "uint256" },
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
      { internalType: "bool", name: "mintTokens", type: "bool" },
    ],
    name: "submitCombatResultWithTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "claimCombatTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPendingTokens",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getTokenBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "parent1Id", type: "uint256" },
      { internalType: "uint256", name: "parent2Id", type: "uint256" },
    ],
    name: "breedShips",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
      { internalType: "uint256", name: "shipId", type: "uint256" },
    ],
    name: "enterTournament",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "entryFee", type: "uint256" },
      { internalType: "uint256", name: "duration", type: "uint256" },
      { internalType: "uint256", name: "maxParticipants", type: "uint256" },
    ],
    name: "createTournament",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "shipId", type: "uint256" }],
    name: "stakeShip",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "shipId", type: "uint256" }],
    name: "unstakeShip",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPlayerShips",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "shipId", type: "uint256" }],
    name: "getShipDetails",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "speed", type: "uint256" },
          { internalType: "uint256", name: "handling", type: "uint256" },
          { internalType: "uint256", name: "acceleration", type: "uint256" },
          { internalType: "uint256", name: "rarity", type: "uint256" },
          { internalType: "uint256", name: "experience", type: "uint256" },
          { internalType: "uint256", name: "wins", type: "uint256" },
          { internalType: "uint256", name: "races", type: "uint256" },
          { internalType: "uint256", name: "generation", type: "uint256" },
          { internalType: "uint256", name: "birthTime", type: "uint256" },
          { internalType: "bool", name: "isStaked", type: "bool" },
          { internalType: "uint256", name: "stakedTime", type: "uint256" },
          { internalType: "string", name: "name", type: "string" },
        ],
        internalType: "struct AvalancheFighting.SpaceShip",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPlayerStats",
    outputs: [
      { internalType: "uint256", name: "level", type: "uint256" },
      { internalType: "uint256", name: "totalXP", type: "uint256" },
      { internalType: "uint256", name: "earnings", type: "uint256" },
      { internalType: "uint256", name: "shipCount", type: "uint256" },
      { internalType: "uint256", name: "lastReward", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
    ],
    name: "getTournamentDetails",
    outputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "entryFee", type: "uint256" },
      { internalType: "uint256", name: "prizePool", type: "uint256" },
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "uint256", name: "participantCount", type: "uint256" },
      { internalType: "bool", name: "finalized", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
    ],
    name: "getTournamentParticipants",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
    ],
    name: "getTournamentWinners",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
      { internalType: "uint256", name: "shipId", type: "uint256" },
    ],
    name: "getTournamentScore",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
    ],
    name: "getTournamentScores",
    outputs: [
      { internalType: "uint256[]", name: "shipIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "scores", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "shipId", type: "uint256" }],
    name: "getShipCombatHistory",
    outputs: [
      {
        components: [
          { internalType: "address", name: "player", type: "address" },
          { internalType: "uint256", name: "shipId", type: "uint256" },
          { internalType: "uint256", name: "score", type: "uint256" },
          { internalType: "uint256", name: "distance", type: "uint256" },
          {
            internalType: "uint256",
            name: "obstaclesAvoided",
            type: "uint256",
          },
          { internalType: "uint256", name: "bonusCollected", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "uint256", name: "tournamentId", type: "uint256" },
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
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" },
    ],
    name: "hasPlayerParticipated",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" },
    ],
    name: "getPlayerTournamentShips",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" },
    ],
    name: "getPlayerTournamentResults",
    outputs: [
      { internalType: "bool", name: "participated", type: "bool" },
      { internalType: "uint256[]", name: "shipIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "scores", type: "uint256[]" },
      { internalType: "uint256", name: "bestScore", type: "uint256" },
      { internalType: "uint256", name: "bestRank", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "shipId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "rarity",
        type: "uint256",
      },
    ],
    name: "ShipMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "TokensMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "score",
        type: "uint256",
      },
    ],
    name: "TokensEarned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "shipId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "score",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "xpGained",
        type: "uint256",
      },
    ],
    name: "CombatCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tournamentId",
        type: "uint256",
      },
      { indexed: false, internalType: "string", name: "name", type: "string" },
      {
        indexed: false,
        internalType: "uint256",
        name: "prizePool",
        type: "uint256",
      },
    ],
    name: "TournamentCreated",
    type: "event",
  },
  {
    inputs: [],
    name: "claimDailyReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tournamentId", type: "uint256" },
    ],
    name: "finalizeTournament",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "nextTournamentId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "limit", type: "uint256" }],
    name: "getLeaderboard",
    outputs: [
      { internalType: "address[]", name: "players", type: "address[]" },
      { internalType: "uint256[]", name: "scores", type: "uint256[]" },
      { internalType: "uint256[]", name: "levels", type: "uint256[]" },
      { internalType: "uint256[]", name: "totalXPs", type: "uint256[]" },
      { internalType: "uint256[]", name: "shipCounts", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newReward", type: "uint256" }],
    name: "setDailyReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_racingToken", type: "address" },
    ],
    name: "setRacingToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "player", type: "address" },
      { internalType: "uint256", name: "score", type: "uint256" },
      { internalType: "bool", name: "isTournament", type: "bool" },
    ],
    name: "mintCombatReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "score", type: "uint256" },
      { internalType: "bool", name: "isTournament", type: "bool" },
    ],
    name: "getRewardEstimate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getDailyChallengeReward",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "rewardAmount", type: "uint256" },
    ],
    name: "getDailyChallengeRewardCustom",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface ShipNFT {
  id: number;
  speed: number;
  handling: number;
  acceleration: number;
  rarity: number;
  experience: number;
  wins: number;
  combats: number;
  generation: number;
  birthTime: number;
  isStaked: boolean;
  stakedTime: number;
  name: string;
  color?: string;
}

export interface PlayerStats {
  level: number;
  totalXP: number;
  earnings: number;
  shipCount: number;
  lastReward: number;
}

export interface Tournament {
  id: number;
  name: string;
  entryFee: bigint;
  prizePool: bigint;
  startTime: number;
  endTime: number;
  participantCount: number;
  finalized: boolean;
}

export const useFightingContract = () => {
  const { address, isConnected } = useAccount();
  const { writeContract, writeContractAsync, isPending } = useWriteContract();

  const [playerShips, setPlayerShips] = useState<ShipNFT[]>([]);
  const [selectedShip, setSelectedShip] = useState<ShipNFT | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: playerShipsData, refetch: refetchShips } = useReadContract({
    address: FIGHTING_CONTRACT_ADDRESS,
    abi: FIGHTING_ABI,
    functionName: "getPlayerShips",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: playerStatsData, refetch: refetchStats } = useReadContract({
    address: FIGHTING_CONTRACT_ADDRESS,
    abi: FIGHTING_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useWatchContractEvent({
    address: FIGHTING_CONTRACT_ADDRESS,
    abi: FIGHTING_ABI,
    eventName: "ShipMinted",
    onLogs(_logs) {
      refetchShips();
      refetchStats();
    },
  });

  useWatchContractEvent({
    address: FIGHTING_CONTRACT_ADDRESS,
    abi: FIGHTING_ABI,
    eventName: "CombatCompleted",
    onLogs(_logs) {
      refetchShips();
      refetchStats();
    },
  });

  useEffect(() => {
    const loadShipDetails = async () => {
      if (!playerShipsData || playerShipsData.length === 0) {
        setPlayerShips([]);
        return;
      }

      setLoading(true);
      try {
        const ships: ShipNFT[] = [];

        // Fetch ship data from contract
        for (const shipId of playerShipsData) {
          try {
            const contractShipData = await readContract(config, {
              address: FIGHTING_CONTRACT_ADDRESS,
              abi: FIGHTING_ABI,
              functionName: "getShipDetails",
              args: [shipId],
            });

            const shipData = {
              id: Number(shipId),
              speed: Number(contractShipData.speed),
              handling: Number(contractShipData.handling),
              acceleration: Number(contractShipData.acceleration),
              rarity: Number(contractShipData.rarity),
              experience: Number(contractShipData.experience),
              wins: Number(contractShipData.wins),
              races: Number(contractShipData.races),
              generation: Number(contractShipData.generation),
              birthTime: Number(contractShipData.birthTime),
              isStaked: contractShipData.isStaked,
              stakedTime: Number(contractShipData.stakedTime),
              name: getShipNameFromContract(contractShipData.name),
              color: getShipColorName(contractShipData.name),
            };

            ships.push(shipData);
          } catch (error) {
            const fallbackName = getShipNameById(Number(shipId));
            const fallbackShipData = {
              id: Number(shipId),
              speed: 50 + (Number(shipId) % 30),
              handling: 55 + (Number(shipId) % 25),
              acceleration: 60 + (Number(shipId) % 20),
              rarity: Math.min(
                5,
                Math.max(1, Math.floor(Number(shipId) / 2) + 1)
              ),
              experience: 0,
              wins: 0,
              races: 0,
              generation: 1,
              birthTime: Date.now() / 1000,
              isStaked: false,
              stakedTime: 0,
              name: fallbackName,
              color: getShipColorName(fallbackName),
            };
            ships.push(fallbackShipData);
          }
        }

        setPlayerShips(ships);

        if (ships.length > 0 && !selectedShip) {
          const availableShip = ships.find((ship) => !ship.isStaked);
          if (availableShip) {
            setSelectedShip(availableShip);
          } else {
            setSelectedShip(null);
          }
        } else if (selectedShip && ships.length > 0) {
          const currentShip = ships.find((ship) => ship.id === selectedShip.id);
          if (currentShip && currentShip.isStaked) {
            const availableShip = ships.find((ship) => !ship.isStaked);
            if (availableShip) {
              setSelectedShip(availableShip);
            } else {
              setSelectedShip(null);
            }
          }
        }
      } catch (err) {
        setError("Failed to load ship details");
        console.error("Failed to load ship details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadShipDetails();
  }, [playerShipsData, selectedShip]);

  useEffect(() => {
    if (playerStatsData) {
      setPlayerStats({
        level: Number(playerStatsData[0]),
        totalXP: Number(playerStatsData[1]),
        earnings: Number(playerStatsData[2]),
        shipCount: Number(playerStatsData[3]),
        lastReward: Number(playerStatsData[4]),
      });
    }
  }, [playerStatsData]);

  const mintStarterShip = useCallback(async () => {
    try {
      setError(null);
      const txHash = await writeContractAsync({
        address: FIGHTING_CONTRACT_ADDRESS,
        abi: FIGHTING_ABI,
        functionName: "mintStarterShip",
        value: parseEther("0.01"),
      });
      return txHash;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to mint starter ship";
      setError(errorMessage);
      throw err;
    }
  }, [writeContractAsync]);

  const mintPremiumShip = useCallback(async () => {
    try {
      setError(null);
      await writeContract({
        address: FIGHTING_CONTRACT_ADDRESS,
        abi: FIGHTING_ABI,
        functionName: "mintPremiumShip",
        value: parseEther("0.05"),
      });
    } catch (err: any) {
      const errorMessage = err.message || "Failed to mint premium ship";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [writeContract]);

  const mintDestroyer = useCallback(async () => {
    try {
      setError(null);
      const txHash = await writeContractAsync({
        address: FIGHTING_CONTRACT_ADDRESS,
        abi: FIGHTING_ABI,
        functionName: "mintDestroyer",
        value: parseEther("0.05"),
      });
      return txHash;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to mint destroyer";
      setError(errorMessage);
      throw err;
    }
  }, [writeContractAsync]);

  const mintBattlecruiser = useCallback(async () => {
    try {
      setError(null);
      const txHash = await writeContractAsync({
        address: FIGHTING_CONTRACT_ADDRESS,
        abi: FIGHTING_ABI,
        functionName: "mintBattlecruiser",
        value: parseEther("0.08"),
      });
      return txHash;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to mint battlecruiser";
      setError(errorMessage);
      throw err;
    }
  }, [writeContractAsync]);

  const submitCombatResult = useCallback(
    async (
      shipId: number,
      score: number,
      distance: number,
      obstaclesAvoided: number,
      bonusCollected: number,
      tournamentId: number = 0
    ) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        setError(null);
        await writeContract({
          address: FIGHTING_CONTRACT_ADDRESS,
          abi: FIGHTING_ABI,
          functionName: "submitCombatResult",
          args: [
            address,
            BigInt(shipId),
            BigInt(score),
            BigInt(distance),
            BigInt(obstaclesAvoided),
            BigInt(bonusCollected),
            BigInt(tournamentId),
          ],
        });

        setTimeout(() => {
          refetchShips();
          refetchStats();
        }, 2000);
      } catch (err: any) {
        const errorMessage = err.message || "Failed to submit combat result";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [address, writeContract, refetchShips, refetchStats]
  );

  const breedShips = useCallback(
    async (parent1Id: number, parent2Id: number) => {
      try {
        setError(null);
        await writeContract({
          address: FIGHTING_CONTRACT_ADDRESS,
          abi: FIGHTING_ABI,
          functionName: "breedShips",
          args: [BigInt(parent1Id), BigInt(parent2Id)],
          value: parseEther("0.01"), // Breeding cost
        });
      } catch (err: any) {
        const errorMessage = err.message || "Failed to breed ships";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [writeContract]
  );

  const stakeShip = useCallback(
    async (shipId: number) => {
      try {
        setError(null);
        const txHash = await writeContractAsync({
          address: FIGHTING_CONTRACT_ADDRESS,
          abi: FIGHTING_ABI,
          functionName: "stakeShip",
          args: [BigInt(shipId)],
        });
        return txHash;
      } catch (err: any) {
        const errorMessage = err.message || "Failed to stake ship";
        setError(errorMessage);
        throw err;
      }
    },
    [writeContractAsync]
  );

  const unstakeShip = useCallback(
    async (shipId: number) => {
      try {
        setError(null);
        const txHash = await writeContractAsync({
          address: FIGHTING_CONTRACT_ADDRESS,
          abi: FIGHTING_ABI,
          functionName: "unstakeShip",
          args: [BigInt(shipId)],
        });
        return txHash;
      } catch (err: any) {
        const errorMessage = err.message || "Failed to unstake ship";
        setError(errorMessage);
        throw err;
      }
    },
    [writeContractAsync]
  );

  // Get daily reward amount from contract
  const { data: dailyRewardAmount } = useReadContract({
    address: FIGHTING_CONTRACT_ADDRESS,
    abi: FIGHTING_ABI,
    functionName: "getDailyChallengeReward",
    query: { enabled: true },
  });

  const claimDailyReward = useCallback(async () => {
    try {
      setError(null);
      const txHash = await writeContractAsync({
        address: FIGHTING_CONTRACT_ADDRESS,
        abi: FIGHTING_ABI,
        functionName: "claimDailyReward",
      });
      setTimeout(() => {
        refetchShips();
        refetchStats();
      }, 2000);
      return txHash;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to claim daily reward";
      setError(errorMessage);
      throw err;
    }
  }, [writeContractAsync, refetchShips, refetchStats]);

  // Check if daily reward is available (24 hours since last claim)
  const isDailyRewardAvailable = useCallback(() => {
    if (!playerStats?.lastReward) return true;
    const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const timeSinceLastReward = now - playerStats.lastReward;
    return timeSinceLastReward >= 86400; // 24 hours = 86400 seconds
  }, [playerStats]);

  // Get time until next daily reward
  const getTimeUntilNextReward = useCallback(() => {
    if (!playerStats?.lastReward) return "Available now!";
    const now = Math.floor(Date.now() / 1000);
    const timeSinceLastReward = now - playerStats.lastReward;
    const timeUntilNext = 86400 - timeSinceLastReward; // 24 hours - time passed

    if (timeUntilNext <= 0) return "Available now!";

    const hours = Math.floor(timeUntilNext / 3600);
    const minutes = Math.floor((timeUntilNext % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }, [playerStats]);

  const createTournament = useCallback(
    async (
      name: string,
      entryFee: string,
      duration: number,
      maxParticipants: number,
      prizePool: string
    ) => {
      try {
        setError(null);
        await writeContract({
          address: FIGHTING_CONTRACT_ADDRESS,
          abi: FIGHTING_ABI,
          functionName: "createTournament",
          args: [
            name,
            parseEther(entryFee),
            BigInt(duration),
            BigInt(maxParticipants),
          ],
          value: parseEther(prizePool),
        });
      } catch (err: any) {
        const errorMessage = err.message || "Failed to create tournament";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [writeContract]
  );

  const joinTournament = useCallback(
    async (tournamentId: number, shipId: number, entryFee: bigint) => {
      try {
        setError(null);
        await writeContract({
          address: FIGHTING_CONTRACT_ADDRESS,
          abi: FIGHTING_ABI,
          functionName: "enterTournament",
          args: [BigInt(tournamentId), BigInt(shipId)],
          value: entryFee,
        });
      } catch (err: any) {
        const errorMessage = err.message || "Failed to join tournament";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [writeContract]
  );

  const getShipColorName = (shipName: string): string => {
    const name = shipName?.toLowerCase() || "";

    if (name.includes("interceptor") || name.includes("starter")) return "Purple";
    if (name.includes("destroyer") || name.includes("sport")) return "Blue";
    if (name.includes("dreadnought") || (name.includes("gen-") && name.includes("hybrid"))) return "Gold";
    if (name.includes("battlecruiser") || name.includes("racing beast")) return "Green";

    return "Gray";
  };

  const getShipNameFromContract = (contractName: string): string => {
    const name = contractName?.toLowerCase() || "";

    if (name.includes("starter")) return "Interceptor";
    if (name.includes("sport")) return "Destroyer";
    if (name.includes("gen-") && name.includes("hybrid")) return "Dreadnought";
    if (name.includes("racing beast")) return "Battlecruiser";

    return contractName; // Return original if no match
  };

  const getShipNameById = (shipId: number): string => {
    return `Ship #${shipId} (Unknown Type)`;
  };

  const getRarityName = (rarity: number): string => {
    const rarityNames = ["", "Common", "Uncommon", "Rare", "Epic", "Legendary"];
    return rarityNames[rarity] || "Unknown";
  };

  const getRarityColor = (rarity: number): string => {
    const rarityColors = {
      1: "text-gray-400",
      2: "text-green-400",
      3: "text-blue-400",
      4: "text-purple-400",
      5: "text-orange-400",
    };
    return rarityColors[rarity as keyof typeof rarityColors] || "text-gray-400";
  };

  const getShipPowerLevel = (ship: ShipNFT): number => {
    return Math.floor((ship.speed + ship.handling + ship.acceleration) / 3);
  };

  const canBreed = (ship1: ShipNFT, ship2: ShipNFT): boolean => {
    const BREEDING_COOLDOWN = 24 * 60 * 60 * 1000;
    const now = Date.now();

    return (
      ship1.id !== ship2.id &&
      !ship1.isStaked &&
      !ship2.isStaked &&
      now - ship1.birthTime * 1000 >= BREEDING_COOLDOWN &&
      now - ship2.birthTime * 1000 >= BREEDING_COOLDOWN
    );
  };

  const getStakingRewards = (ship: ShipNFT): number => {
    if (!ship.isStaked) return 0;

    const STAKE_REWARD_RATE = 100; // XP per day
    const stakingDuration = (Date.now() - ship.stakedTime * 1000) / 1000; // seconds
    const daysStaked = stakingDuration / (24 * 60 * 60);

    return Math.floor(daysStaked * STAKE_REWARD_RATE);
  };

  const formatXP = (xp: number): string => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toString();
  };

  const formatEarnings = (earnings: number): string => {
    return `${formatEther(BigInt(earnings))} ETH`;
  };

  const safeSetSelectedShip = (ship: ShipNFT | null) => {
    if (!ship) {
      setSelectedShip(null);
      return;
    }

    if (ship.isStaked) {
      const availableShip = playerShips.find((s) => !s.isStaked);
      if (availableShip) {
        setSelectedShip(availableShip);
      } else {
        setSelectedShip(null);
      }
      return;
    }

    setSelectedShip(ship);
  };

  const hasShipType = useCallback((shipTypeName: string): boolean => {
    if (!playerShips || playerShips.length === 0) return false;

    const normalizedTypeName = shipTypeName.toLowerCase().replace(/\s+/g, '');

    return playerShips.some(ship => {
      const normalizedShipName = ship.name.toLowerCase().replace(/\s+/g, '');
      return normalizedShipName.includes(normalizedTypeName) ||
             normalizedTypeName.includes(normalizedShipName);
    });
  }, [playerShips]);

  return {
    selectedShip,
    playerShips,
    playerStats,
    loading,
    error,
    isPending,
    isConnected,

    setSelectedShip: safeSetSelectedShip,
    mintStarterShip,
    mintPremiumShip: mintPremiumShip,
    mintDestroyer: mintDestroyer,
    mintBattlecruiser: mintBattlecruiser,
    submitCombatResult,
    breedShips,
    stakeShip: stakeShip,
    unstakeShip: unstakeShip,
    claimDailyReward,
    dailyRewardAmount: dailyRewardAmount ? Number(dailyRewardAmount) : 100,
    isDailyRewardAvailable,
    getTimeUntilNextReward,
    createTournament,
    joinTournament,
    refetchShips,
    refetchStats,

    getRarityName,
    getRarityColor,
    getShipPowerLevel,
    canBreed,
    getStakingRewards,
    formatXP,
    formatEarnings,
    hasShipType,

    FIGHTING_CONTRACT_ADDRESS,
    FIGHTING_ABI,
  };
};

export default useFightingContract;
