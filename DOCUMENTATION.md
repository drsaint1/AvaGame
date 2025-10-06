# AVA Space Fleet - Complete Game Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Game Overview](#game-overview)
3. [Blockchain Architecture](#blockchain-architecture)
4. [Smart Contracts](#smart-contracts)
5. [Game Mechanics](#game-mechanics)
6. [Frontend Architecture](#frontend-architecture)
7. [User Guide](#user-guide)
8. [Developer Guide](#developer-guide)
9. [API Reference](#api-reference)
10. [Security](#security)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is AVA Space Fleet?

AVA Space Fleet is a blockchain-based space combat game that combines real-time 3D gameplay with Web3 technology. Built on Avalanche blockchain, the game features NFT spaceships, competitive tournaments, breeding mechanics, staking systems, and an immersive 3D combat experience powered by Three.js.

### Key Technologies

- **Blockchain**: Avalanche C-Chain
- **Smart Contracts**: Solidity 0.8.24
- **Frontend**: React 19.1.0 + TypeScript
- **3D Graphics**: Three.js 0.178.0
- **Web3 Stack**: Wagmi 2.16.0, Viem 2.33.0, Web3Modal 5.1.11
- **Build Tool**: Vite 7.0.4
- **Styling**: Tailwind CSS 3.4.17
- **Smart Contract Development**: Hardhat 2.26.1, OpenZeppelin 5.4.0

### Target Audience

- Blockchain gaming enthusiasts
- NFT collectors
- Competitive gamers
- Web3 developers
- Space combat game fans

---

## Game Overview

### Core Gameplay Loop

1. **Acquire Spaceships**: Mint or purchase NFT spaceships with unique attributes
2. **Engage in Combat**: Participate in 3D space battles to earn rewards
3. **Compete in Tournaments**: Join competitive events with prize pools
4. **Breed Ships**: Create new ships with inherited traits
5. **Stake for Rewards**: Earn passive XP by staking ships
6. **Level Up**: Progress through the ranking system
7. **Earn Tokens**: Collect RACE tokens and AVAX through gameplay

### Game Features

#### NFT Spaceships
- Each ship is a unique ERC-721 NFT
- Multiple ship classes with different stats
- Dynamic attributes: Speed, Handling, Acceleration, Rarity
- Customizable ship names
- Combat history tracking

#### Ship Classes

| Ship Class | Price | Speed | Handling | Acceleration | Use Case |
|------------|-------|-------|----------|--------------|----------|
| Starter Interceptor | 0.01 AVAX | 50 | 60 | 70 | Entry-level combat |
| Sport Destroyer | 0.05 AVAX | 70 | 80 | 75 | Enhanced maneuverability |
| Racing Beast Battlecruiser | 0.08 AVAX | 90 | 85 | 95 | High-performance combat |
| Dreadnought | Variable | 95+ | 90+ | 90+ | Elite tier vessels |

#### Combat System
- Real-time 3D space combat
- Obstacle avoidance mechanics
- Enemy destruction
- Power-up collection
- Score-based rewards
- XP and level progression

#### Tournament System
- Entry fee-based competitions
- Prize pool distribution
- Multiple tournament formats
- Global and tournament-specific leaderboards
- Real-time standings

#### Breeding Mechanics
- Combine two parent ships
- Offspring inherit traits
- Generation tracking
- Strategic stat optimization
- 0.01 AVAX breeding fee

#### Staking System
- Passive XP earning (100 XP/day per ship)
- No lock-up period
- Instant unstaking
- Reward accumulation

#### Tokenomics
- RACE token (ERC-20) for rewards
- AVAX for transactions and prizes
- Daily reward system (0.001 AVAX/24h)
- Score-based token minting

---

## Blockchain Architecture

### Network Details

#### Avalanche Fuji Testnet (Development)
- **Chain ID**: 43113
- **RPC URL**: https://api.avax-test.network/ext/bc/C/rpc
- **Explorer**: https://testnet.snowtrace.io
- **Currency**: AVAX (testnet)
- **Faucet**: https://faucet.avax.network/

#### Avalanche Mainnet (Production)
- **Chain ID**: 43114
- **RPC URL**: https://api.avax.network/ext/bc/C/rpc
- **Explorer**: https://snowtrace.io
- **Currency**: AVAX

### Contract Ecosystem

```
┌─────────────────────────────────────────────────┐
│          AVA Space Fleet Ecosystem              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐                          │
│  │  AvalancheFighting│◄────────┐               │
│  │   (Main Game)     │         │               │
│  │   ERC-721         │         │               │
│  └────────┬──────────┘         │               │
│           │                    │               │
│           │ Mints Rewards      │ Authorizes    │
│           ▼                    │               │
│  ┌──────────────────┐          │               │
│  │  FightingToken   │──────────┘               │
│  │  (RACE Token)    │                          │
│  │  ERC-20          │                          │
│  └──────────────────┘                          │
│           ▲                                    │
│           │ Distributes Rewards                │
│           │                                    │
│  ┌────────┴──────────┐                        │
│  │ AvalancheTournaments│                       │
│  │  (Tournament Mgmt) │                        │
│  └────────────────────┘                        │
│                                                │
└─────────────────────────────────────────────────┘
```

---

## Smart Contracts

### 1. AvalancheFighting.sol

**Purpose**: Main game contract managing NFT spaceships, combat, staking, and player progression.

**Inheritance**:
- `ERC721` - NFT functionality
- `ReentrancyGuard` - Prevents reentrancy attacks
- `Pausable` - Emergency pause mechanism
- `Ownable` - Access control

#### Core Data Structures

```solidity
struct Spaceship {
    string name;              // Ship name
    uint256 speed;            // Speed attribute (0-100)
    uint256 handling;         // Handling attribute (0-100)
    uint256 acceleration;     // Acceleration attribute (0-100)
    uint256 rarity;           // Rarity tier (1-5)
    uint256 wins;             // Total wins
    uint256 losses;           // Total losses
    uint256 totalRaces;       // Total races participated
    uint256 experience;       // XP earned
    uint256 level;            // Current level
    uint256 generation;       // Breeding generation (0 for original)
    uint256 parent1;          // First parent ID (0 if not bred)
    uint256 parent2;          // Second parent ID (0 if not bred)
}

struct PlayerStats {
    uint256 totalRaces;       // Total races
    uint256 totalWins;        // Total wins
    uint256 totalLosses;      // Total losses
    uint256 bestScore;        // Highest score achieved
    uint256 totalEarnings;    // Total AVAX earned
    uint256 level;            // Player level
    uint256 experience;       // Player XP
    uint256 lastDailyReward;  // Timestamp of last daily claim
}

struct StakingInfo {
    uint256 startTime;        // Staking start timestamp
    uint256 lastClaimTime;    // Last reward claim time
    uint256 totalRewards;     // Total XP earned from staking
}
```

#### Key Functions

##### Ship Minting

```solidity
function mintStarterShip(string memory _name) external payable
```
- **Cost**: 0.01 AVAX
- **Returns**: Starter Interceptor with base stats
- **Validation**: Name length, payment amount

```solidity
function mintSportShip(string memory _name) external payable
```
- **Cost**: 0.05 AVAX
- **Returns**: Sport Destroyer with enhanced stats
- **Validation**: Name length, payment amount

```solidity
function mintRacingBeastShip(string memory _name) external payable
```
- **Cost**: 0.08 AVAX
- **Returns**: Racing Beast with premium stats
- **Validation**: Name length, payment amount

##### Breeding

```solidity
function breedShips(uint256 _parent1Id, uint256 _parent2Id, string memory _name)
    external payable returns (uint256)
```
- **Cost**: 0.01 AVAX
- **Parameters**: Two parent ship IDs, offspring name
- **Returns**: New ship ID with inherited traits
- **Validation**: Ownership of both parents, payment

**Trait Inheritance Algorithm**:
```
offspring.speed = (parent1.speed + parent2.speed) / 2 + random(0-10)
offspring.handling = (parent1.handling + parent2.handling) / 2 + random(0-10)
offspring.acceleration = (parent1.acceleration + parent2.acceleration) / 2 + random(0-10)
offspring.generation = max(parent1.generation, parent2.generation) + 1
```

##### Combat

```solidity
function submitCombatResult(
    uint256 _shipId,
    uint256 _score,
    bool _won,
    bool _isTournament
) external
```
- **Parameters**: Ship ID, score achieved, win status, tournament flag
- **Effects**:
  - Updates ship stats (wins/losses/races)
  - Awards XP to ship
  - Levels up ship if threshold reached
  - Triggers RACE token minting
  - Updates player statistics
- **Access**: Ship owner only

##### Staking

```solidity
function stakeShip(uint256 _shipId) external
```
- **Parameters**: Ship ID to stake
- **Effects**: Locks ship for staking, starts reward accumulation
- **Validation**: Ownership, not already staked
- **Rewards**: 100 XP per day

```solidity
function unstakeShip(uint256 _shipId) external
```
- **Parameters**: Ship ID to unstake
- **Effects**:
  - Calculates accumulated rewards
  - Awards XP to ship
  - Unlocks ship
  - Updates staking records
- **Validation**: Ownership, currently staked

##### Daily Rewards

```solidity
function claimDailyReward() external
```
- **Cooldown**: 24 hours
- **Reward**: 0.001 AVAX
- **Validation**: Time since last claim
- **Effects**: Updates player stats, transfers AVAX

##### View Functions

```solidity
function getShip(uint256 _shipId) external view returns (Spaceship memory)
function getPlayerStats(address _player) external view returns (PlayerStats memory)
function getPlayerShips(address _player) external view returns (uint256[] memory)
function getStakingInfo(uint256 _shipId) external view returns (StakingInfo memory)
function getLeaderboard() external view returns (address[] memory, uint256[] memory)
```

---

### 2. FightingToken.sol

**Purpose**: ERC-20 token for in-game rewards (RACE token).

**Features**:
- Controlled minting by authorized contracts
- Score-based reward calculation
- Tournament bonuses
- Daily challenge rewards

#### Key Functions

```solidity
function mintRaceReward(address _player, uint256 _score, bool _isTournament)
    external onlyAuthorized returns (uint256)
```
- **Parameters**: Player address, score, tournament status
- **Returns**: Amount of RACE tokens minted
- **Algorithm**:
  ```
  baseReward = score * 10
  tournamentBonus = isTournament ? 50% : 0%
  totalReward = baseReward * (1 + tournamentBonus)
  ```
- **Access**: Only authorized contracts (AvalancheFighting, AvalancheTournaments)

```solidity
function getRewardEstimate(uint256 _score, bool _isTournament)
    external pure returns (uint256)
```
- **Parameters**: Hypothetical score, tournament status
- **Returns**: Estimated RACE token reward
- **Use**: Preview rewards before gameplay

```solidity
function getDailyChallengeReward() external pure returns (uint256)
```
- **Returns**: Fixed daily challenge reward amount
- **Default**: 1000 RACE tokens

```solidity
function authorizeContract(address _contract) external onlyOwner
function revokeContract(address _contract) external onlyOwner
```
- **Purpose**: Manage authorized minters
- **Access**: Contract owner only

---

### 3. AvalancheTournaments.sol

**Purpose**: Tournament creation, management, and prize distribution.

#### Data Structures

```solidity
struct Tournament {
    string name;              // Tournament name
    uint256 entryFee;         // Entry cost in AVAX
    uint256 prizePool;        // Total prize pool
    uint256 startTime;        // Tournament start timestamp
    uint256 endTime;          // Tournament end timestamp
    bool isActive;            // Active status
    address[] participants;   // List of participants
    mapping(address => uint256) scores;  // Participant scores
    address winner;           // Tournament winner
    bool prizeClaimed;        // Prize claim status
}
```

#### Key Functions

```solidity
function createTournament(
    string memory _name,
    uint256 _entryFee,
    uint256 _duration
) external payable returns (uint256)
```
- **Parameters**: Name, entry fee, duration (seconds)
- **Returns**: Tournament ID
- **Access**: Anyone (contract owner can add prize pool)

```solidity
function enterTournament(uint256 _tournamentId, uint256 _shipId) external payable
```
- **Parameters**: Tournament ID, ship ID
- **Cost**: Tournament entry fee
- **Validation**:
  - Ship ownership
  - Tournament active
  - Not already entered
  - Correct payment

```solidity
function submitTournamentResult(
    uint256 _tournamentId,
    uint256 _shipId,
    uint256 _score
) external
```
- **Parameters**: Tournament ID, ship ID, score
- **Effects**: Updates participant score
- **Access**: Participant only

```solidity
function finalizeTournament(uint256 _tournamentId) external
```
- **Effects**:
  - Determines winner (highest score)
  - Marks tournament as ended
- **Validation**: Tournament ended, not already finalized

```solidity
function claimTournamentPrize(uint256 _tournamentId) external
```
- **Effects**: Transfers prize pool to winner
- **Validation**: Winner only, prize not claimed
- **Distribution**: 100% to winner (can be modified for top-N distribution)

---

## Game Mechanics

### Combat System

#### 3D Gameplay

**Controls**:
- **Mouse Movement**: Ship direction
- **Spacebar**: Shoot/Fire
- **WASD**: Alternative movement (optional)
- **Esc**: Pause menu

**Objectives**:
1. Avoid obstacles (asteroids, debris)
2. Destroy enemy ships
3. Collect power-ups
4. Survive as long as possible
5. Achieve high score

**Scoring System**:
- Enemy destroyed: +100 points
- Power-up collected: +50 points
- Survival time: +1 point/second
- Combo multiplier: Up to 3x for consecutive hits
- Perfect wave clear: +500 bonus

**Power-ups**:
- **Shield**: Temporary invincibility (5s)
- **Speed Boost**: Enhanced movement (10s)
- **Double Damage**: Increased firepower (8s)
- **Score Multiplier**: 2x points (15s)

#### Ship Stats Impact

```
Effective Speed = Base Speed + (Ship Speed Stat / 10)
Turn Rate = Ship Handling Stat / 5
Acceleration Rate = Ship Acceleration Stat / 8
```

### Leveling System

**XP Requirements**:
```
Level 1 → 2: 1000 XP
Level 2 → 3: 2000 XP
Level 3 → 4: 3000 XP
Level N → N+1: N * 1000 XP
```

**XP Sources**:
- Combat victory: 200 XP
- Combat participation: 50 XP
- Tournament entry: 100 XP
- Tournament win: 500 XP
- Daily challenges: 150 XP
- Staking: 100 XP/day

**Level Benefits**:
- Ship stat multipliers
- Access to exclusive tournaments
- Breeding cost reduction (future)
- Special cosmetics (future)

### Breeding Strategy

**Optimal Breeding**:
1. Select parents with complementary high stats
2. Consider generation level (lower is rarer)
3. Breed for specific roles (speed vs handling)
4. Track lineage for rare combinations

**Example Calculation**:
```
Parent 1: Speed 80, Handling 60, Acceleration 70
Parent 2: Speed 60, Handling 90, Acceleration 65

Offspring Base:
- Speed: (80 + 60) / 2 = 70
- Handling: (60 + 90) / 2 = 75
- Acceleration: (70 + 65) / 2 = 67.5

Random Variance: +/- 0-10 on each stat

Possible Offspring:
- Speed: 60-80
- Handling: 65-85
- Acceleration: 57-77
```

### Staking Optimization

**Maximum Returns**:
- Stake multiple ships simultaneously
- Claim rewards before unstaking
- Stake during inactive play periods
- Compound XP into ship levels

**ROI Calculation**:
```
Daily XP per ship: 100
Ships staked: 5
Total daily XP: 500
Days staked: 30
Total XP earned: 15,000 (equivalent to 15 levels)
```

### Tournament Strategy

**Competitive Tips**:
1. Use highest-stat ships for entry
2. Practice in free mode first
3. Focus on consistency over high risk
4. Utilize power-ups strategically
5. Study leaderboard competitors

**Prize Pool Math**:
```
Entry Fee: 0.05 AVAX
Participants: 20
Total Entry Pool: 1.0 AVAX
Contract Prize Addition: 0.5 AVAX
Total Prize Pool: 1.5 AVAX
Winner Takes: 100% (1.5 AVAX)

Potential payout structures (future):
- 1st: 60%, 2nd: 30%, 3rd: 10%
- Top 5: Equal split
- Score tiers: Scaled distribution
```

---

## Frontend Architecture

### Project Structure

```
src/
├── components/
│   ├── SpaceFleetGame.tsx       # Main 3D game canvas
│   ├── TournamentLobby.tsx      # Tournament listing & entry
│   ├── BuyShip.tsx              # Ship purchase interface
│   ├── Breeding.tsx             # Ship breeding UI
│   ├── StakeManager.tsx         # Staking dashboard
│   ├── DailyChallenge.tsx       # Daily missions UI
│   ├── Leaderboard.tsx          # Global rankings
│   ├── ShipGarage.tsx           # Ship inventory & management
│   ├── MainMenu.tsx             # Game navigation hub
│   ├── LandingPage.tsx          # Initial landing page
│   └── WalletConnect.tsx        # Web3 connection UI
├── hooks/
│   ├── useFightingContract.ts   # Fighting contract interactions
│   ├── useTournamentContract.ts # Tournament contract calls
│   ├── useTokenContract.ts      # Token contract utilities
│   └── useWeb3.ts               # Web3 connection hooks
├── config/
│   ├── web3Config.ts            # Chain & contract config
│   ├── gameConfig.ts            # Game constants
│   └── contracts.ts             # Contract ABIs & addresses
├── providers/
│   └── Web3Provider.tsx         # Web3Modal & Wagmi provider
├── utils/
│   ├── contracts.ts             # Contract helper functions
│   ├── formatting.ts            # Data formatting utilities
│   └── validation.ts            # Input validation
├── types/
│   ├── contracts.ts             # Contract type definitions
│   └── game.ts                  # Game type definitions
├── App.tsx                      # Root application component
└── main.tsx                     # Entry point
```

### Component Details

#### SpaceFleetGame.tsx

**Purpose**: Main 3D combat game component.

**Key Features**:
- Three.js scene management
- Player ship rendering
- Enemy AI
- Obstacle generation
- Collision detection
- Score tracking
- Game state management

**State Management**:
```typescript
const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu')
const [score, setScore] = useState(0)
const [selectedShip, setSelectedShip] = useState<Ship | null>(null)
const [health, setHealth] = useState(100)
const [combo, setCombo] = useState(0)
```

**Three.js Setup**:
```typescript
- Scene: Space environment with stars
- Camera: Perspective camera following player
- Lighting: Ambient + directional lights
- Player Ship: GLB model or custom geometry
- Enemies: Procedurally generated
- Particles: Explosions, trails, effects
```

#### TournamentLobby.tsx

**Features**:
- Active tournament listing
- Tournament details display
- Entry fee payment
- Participant count
- Prize pool display
- Entry confirmation

**Contract Integration**:
```typescript
const { data: tournaments } = useContractRead({
  address: TOURNAMENT_CONTRACT,
  abi: TournamentABI,
  functionName: 'getActiveTournaments'
})

const { write: enterTournament } = useContractWrite({
  address: TOURNAMENT_CONTRACT,
  abi: TournamentABI,
  functionName: 'enterTournament'
})
```

#### BuyShip.tsx

**Ship Marketplace**:
- Ship class selection
- Price display
- Stat preview
- Name input
- Minting confirmation
- Transaction status

#### Breeding.tsx

**Breeding Interface**:
- Parent ship selection (dropdown)
- Parent stat display
- Offspring stat preview
- Breeding cost
- Name input for offspring
- Breed button with confirmation

**Stat Preview Algorithm**:
```typescript
const previewOffspring = (parent1: Ship, parent2: Ship) => {
  return {
    speed: Math.floor((parent1.speed + parent2.speed) / 2),
    handling: Math.floor((parent1.handling + parent2.handling) / 2),
    acceleration: Math.floor((parent1.acceleration + parent2.acceleration) / 2),
    variance: "±0-10 on each stat"
  }
}
```

#### StakeManager.tsx

**Staking Dashboard**:
- Available ships list
- Currently staked ships
- Reward accumulation display
- Stake/Unstake buttons
- Total staking earnings

**Reward Calculation**:
```typescript
const calculateRewards = (stakingStartTime: number) => {
  const now = Date.now() / 1000
  const daysStaked = Math.floor((now - stakingStartTime) / 86400)
  return daysStaked * 100 // 100 XP per day
}
```

#### Leaderboard.tsx

**Rankings Display**:
- Global player rankings
- Top scores
- Total wins
- Total earnings
- Player level
- Pagination

### Custom Hooks

#### useFightingContract.ts

```typescript
export const useFightingContract = () => {
  const { data: playerStats } = useContractRead({
    address: FIGHTING_CONTRACT,
    abi: FightingABI,
    functionName: 'getPlayerStats',
    args: [address]
  })

  const { data: playerShips } = useContractRead({
    address: FIGHTING_CONTRACT,
    abi: FightingABI,
    functionName: 'getPlayerShips',
    args: [address]
  })

  const { write: mintStarterShip } = useContractWrite({
    address: FIGHTING_CONTRACT,
    abi: FightingABI,
    functionName: 'mintStarterShip',
    value: parseEther('0.01')
  })

  const { write: submitCombatResult } = useContractWrite({
    address: FIGHTING_CONTRACT,
    abi: FightingABI,
    functionName: 'submitCombatResult'
  })

  return {
    playerStats,
    playerShips,
    mintStarterShip,
    submitCombatResult
  }
}
```

### Web3 Configuration

#### web3Config.ts

```typescript
import { createConfig, http } from 'wagmi'
import { avalancheFuji, avalanche } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [avalancheFuji, avalanche],
  connectors: [
    injected(),
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
    })
  ],
  transports: {
    [avalancheFuji.id]: http(),
    [avalanche.id]: http()
  }
})

export const CONTRACTS = {
  FIGHTING: import.meta.env.VITE_FIGHTING_CONTRACT_ADDRESS,
  TOKEN: import.meta.env.VITE_FIGHTING_TOKEN_ADDRESS,
  TOURNAMENTS: import.meta.env.VITE_TOURNAMENTS_CONTRACT_ADDRESS
}
```

---

## User Guide

### Getting Started

#### Step 1: Install MetaMask

1. Visit https://metamask.io/
2. Install browser extension
3. Create new wallet or import existing
4. Secure your seed phrase

#### Step 2: Add Avalanche Fuji Network

**Automatic** (via game):
- Click "Connect Wallet" in game
- Approve network addition in MetaMask

**Manual**:
1. Open MetaMask
2. Click network dropdown
3. Select "Add Network"
4. Enter details:
   - Network Name: Avalanche Fuji Testnet
   - RPC URL: https://api.avax-test.network/ext/bc/C/rpc
   - Chain ID: 43113
   - Currency Symbol: AVAX
   - Block Explorer: https://testnet.snowtrace.io

#### Step 3: Get Test AVAX

1. Visit https://faucet.avax.network/
2. Select "Fuji (C-Chain)"
3. Enter your wallet address
4. Complete CAPTCHA
5. Receive 2 AVAX (resets daily)

#### Step 4: Launch Game

1. Navigate to game URL
2. Click "Connect Wallet & Launch"
3. Approve connection in MetaMask
4. You're ready to play!

### First Gameplay

#### Minting Your First Ship

1. Upon first connection, you'll see the ship selection screen
2. Choose "Starter Interceptor" (0.01 AVAX)
3. Enter a name for your ship
4. Click "Mint Ship"
5. Approve transaction in MetaMask
6. Wait for confirmation (~2 seconds on Fuji)
7. Your ship appears in the garage

#### Playing Your First Combat

1. From main menu, select "Space Combat"
2. Choose your ship from the list
3. Click "Launch"
4. **Controls**:
   - Move mouse to steer
   - Click/Spacebar to shoot
   - Avoid red obstacles
   - Destroy blue enemies
   - Collect green power-ups
5. Try to survive and score high
6. When game ends, results are submitted to blockchain
7. Earn XP and RACE tokens

#### Joining a Tournament

1. Select "Tournaments" from main menu
2. Browse active tournaments
3. Check entry fee and prize pool
4. Select tournament
5. Choose ship to enter
6. Click "Enter Tournament"
7. Pay entry fee (MetaMask approval)
8. Play combat round
9. Score is submitted automatically
10. Check leaderboard for ranking
11. Claim prize if you win

### Advanced Features

#### Breeding Ships

**Requirements**:
- Own at least 2 ships
- 0.01 AVAX for breeding fee

**Process**:
1. Go to "Breeding" menu
2. Select first parent ship
3. Select second parent ship
4. View predicted offspring stats
5. Enter name for new ship
6. Click "Breed Ships"
7. Approve transaction
8. Receive new ship with inherited traits

**Tips**:
- Breed high-stat ships together
- Consider complementary attributes
- Lower generation = rarer/more valuable
- Track lineages for future breeding

#### Staking Ships

**How to Stake**:
1. Navigate to "Staking" menu
2. View available ships
3. Select ship to stake
4. Click "Stake"
5. Approve transaction
6. Ship begins earning 100 XP/day

**How to Unstake**:
1. Go to "Staking" menu
2. View staked ships
3. See accumulated rewards
4. Click "Unstake" on desired ship
5. Approve transaction
6. Receive ship back + XP rewards

**Strategy**:
- Stake ships you're not using
- Let rewards accumulate
- No penalty for unstaking
- Staked ships can't be used in combat

#### Daily Rewards

1. Visit game once every 24 hours
2. Click "Claim Daily Reward" (if available)
3. Receive 0.001 AVAX
4. Cooldown resets 24 hours after claim

### Wallet Management

#### Checking Balances

**AVAX Balance**:
- Visible in MetaMask
- Shown in game UI

**RACE Token Balance**:
- Add token to MetaMask:
  - Token Address: [VITE_FIGHTING_TOKEN_ADDRESS]
  - Symbol: RACE
  - Decimals: 18
- View in game wallet display

#### Transaction History

- View on Snowtrace: https://testnet.snowtrace.io
- Search your wallet address
- See all transactions, gas costs, contract interactions

### Troubleshooting Common Issues

**Ship Not Appearing After Mint**:
1. Wait 10-15 seconds for blockchain confirmation
2. Refresh page
3. Check transaction on Snowtrace
4. Verify you're on correct wallet

**Transaction Failed**:
- Ensure sufficient AVAX for gas
- Check you haven't already performed action
- Verify contract addresses in settings
- Try increasing gas limit

**Can't Connect Wallet**:
- Update MetaMask to latest version
- Disable other wallet extensions
- Clear browser cache
- Try incognito mode

**3D Game Not Loading**:
- Enable hardware acceleration
- Update graphics drivers
- Use Chrome or Firefox
- Disable heavy extensions

---

## Developer Guide

### Development Environment Setup

#### Prerequisites

```bash
# Required versions
Node.js >= 18.0.0
npm >= 9.0.0
Git >= 2.0.0
```

#### Installation

```bash
# Clone repository
git clone <repository-url>
cd etherlink-racer-game

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

#### Environment Variables

```env
# WalletConnect (get from cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Network
VITE_NETWORK_NAME=Avalanche Fuji Testnet
VITE_CHAIN_ID=43113
VITE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Contracts (auto-filled after deployment)
VITE_FIGHTING_CONTRACT_ADDRESS=0x...
VITE_FIGHTING_TOKEN_ADDRESS=0x...
VITE_TOURNAMENTS_CONTRACT_ADDRESS=0x...

# Deployment (NEVER commit this!)
PRIVATE_KEY=your_private_key_without_0x
```

### Smart Contract Development

#### Compiling Contracts

```bash
# Compile all contracts
npx hardhat compile

# Clean and recompile
npx hardhat clean
npx hardhat compile
```

#### Testing Contracts

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/AvalancheFighting.test.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run with coverage
npx hardhat coverage
```

#### Deploying Contracts

**Local Deployment** (for testing):

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy
npx hardhat run scripts/deploy-avalanche.js --network localhost
```

**Fuji Testnet Deployment**:

```bash
# Ensure PRIVATE_KEY is set in .env
# Ensure wallet has Fuji AVAX from faucet

npx hardhat run scripts/deploy-avalanche.js --network avalancheFuji
```

**Deployment Script** (`scripts/deploy-avalanche.js`):

```javascript
async function main() {
  console.log("Deploying to Avalanche Fuji...")

  // Deploy FightingToken
  const FightingToken = await ethers.getContractFactory("FightingToken")
  const token = await FightingToken.deploy()
  await token.waitForDeployment()
  console.log("FightingToken deployed to:", await token.getAddress())

  // Deploy AvalancheFighting
  const AvalancheFighting = await ethers.getContractFactory("AvalancheFighting")
  const fighting = await AvalancheFighting.deploy(await token.getAddress())
  await fighting.waitForDeployment()
  console.log("AvalancheFighting deployed to:", await fighting.getAddress())

  // Deploy AvalancheTournaments
  const Tournaments = await ethers.getContractFactory("AvalancheTournaments")
  const tournaments = await Tournaments.deploy(
    await fighting.getAddress(),
    await token.getAddress()
  )
  await tournaments.waitForDeployment()
  console.log("Tournaments deployed to:", await tournaments.getAddress())

  // Authorize contracts to mint tokens
  await token.authorizeContract(await fighting.getAddress())
  await token.authorizeContract(await tournaments.getAddress())
  console.log("Contracts authorized")

  // Save deployment info
  const deployment = {
    network: "avalancheFuji",
    fighting: await fighting.getAddress(),
    token: await token.getAddress(),
    tournaments: await tournaments.getAddress(),
    timestamp: new Date().toISOString()
  }

  fs.writeFileSync(
    'deployment-avalanche.json',
    JSON.stringify(deployment, null, 2)
  )

  console.log("\nDeployment complete!")
  console.log("Update your .env file with these addresses:")
  console.log(`VITE_FIGHTING_CONTRACT_ADDRESS=${deployment.fighting}`)
  console.log(`VITE_FIGHTING_TOKEN_ADDRESS=${deployment.token}`)
  console.log(`VITE_TOURNAMENTS_CONTRACT_ADDRESS=${deployment.tournaments}`)
}
```

#### Verifying Contracts

```bash
# Verify on Snowtrace
npx hardhat verify --network avalancheFuji <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Example: Verify FightingToken
npx hardhat verify --network avalancheFuji 0x123...

# Example: Verify AvalancheFighting
npx hardhat verify --network avalancheFuji 0x456... "0xTokenAddress"
```

### Frontend Development

#### Running Dev Server

```bash
# Start development server
npm run dev

# Server runs on http://localhost:5173
# Hot reload enabled
```

#### Building for Production

```bash
# Create optimized build
npm run build

# Output in dist/ folder

# Preview production build locally
npm run preview
```

#### Adding New Components

1. Create component file in `src/components/`
2. Import necessary hooks and types
3. Implement component logic
4. Add to routing/navigation
5. Test functionality

**Example Component**:

```typescript
// src/components/MyComponent.tsx
import { useState, useEffect } from 'react'
import { useAccount, useContractRead } from 'wagmi'
import { CONTRACTS } from '../config/web3Config'
import FightingABI from '../config/FightingABI.json'

export const MyComponent = () => {
  const { address } = useAccount()
  const [data, setData] = useState(null)

  const { data: contractData } = useContractRead({
    address: CONTRACTS.FIGHTING,
    abi: FightingABI,
    functionName: 'getPlayerStats',
    args: [address]
  })

  useEffect(() => {
    if (contractData) {
      setData(contractData)
    }
  }, [contractData])

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">My Component</h2>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}
```

#### Adding Contract Interactions

```typescript
// In your component or hook
import { useContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther } from 'viem'

const { data, write } = useContractWrite({
  address: CONTRACTS.FIGHTING,
  abi: FightingABI,
  functionName: 'mintStarterShip',
  value: parseEther('0.01')
})

const { isLoading, isSuccess } = useWaitForTransaction({
  hash: data?.hash
})

// Call function
const handleMint = () => {
  write({ args: ['My Ship Name'] })
}

// Show status
{isLoading && <p>Transaction pending...</p>}
{isSuccess && <p>Ship minted successfully!</p>}
```

### Testing

#### Unit Tests (Contracts)

**Example Test** (`test/AvalancheFighting.test.js`):

```javascript
const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("AvalancheFighting", function () {
  let fighting, token, owner, addr1

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners()

    const Token = await ethers.getContractFactory("FightingToken")
    token = await Token.deploy()

    const Fighting = await ethers.getContractFactory("AvalancheFighting")
    fighting = await Fighting.deploy(await token.getAddress())

    await token.authorizeContract(await fighting.getAddress())
  })

  it("Should mint starter ship", async function () {
    await fighting.connect(addr1).mintStarterShip("Test Ship", {
      value: ethers.parseEther("0.01")
    })

    const ship = await fighting.getShip(1)
    expect(ship.name).to.equal("Test Ship")
    expect(ship.speed).to.equal(50)
  })

  it("Should breed ships", async function () {
    // Mint two ships
    await fighting.connect(addr1).mintStarterShip("Ship 1", {
      value: ethers.parseEther("0.01")
    })
    await fighting.connect(addr1).mintStarterShip("Ship 2", {
      value: ethers.parseEther("0.01")
    })

    // Breed them
    await fighting.connect(addr1).breedShips(1, 2, "Offspring", {
      value: ethers.parseEther("0.01")
    })

    const offspring = await fighting.getShip(3)
    expect(offspring.generation).to.equal(1)
    expect(offspring.parent1).to.equal(1)
    expect(offspring.parent2).to.equal(2)
  })
})
```

#### Integration Tests (Frontend)

Use Playwright or Cypress for E2E testing:

```bash
# Install Playwright
npm install -D @playwright/test

# Run tests
npx playwright test
```

### Code Style

#### Solidity

```solidity
// Follow Solidity style guide
// Use 4 spaces for indentation
// Functions: camelCase
// State variables: camelCase with underscore prefix for private
// Constants: UPPER_SNAKE_CASE

contract MyContract {
    uint256 private _privateVar;
    uint256 public constant MAX_SUPPLY = 10000;

    function publicFunction() external {
        _internalFunction();
    }

    function _internalFunction() private {
        // Implementation
    }
}
```

#### TypeScript/React

```typescript
// Use functional components
// Use TypeScript for type safety
// Follow Airbnb style guide
// Use 2 spaces for indentation

interface Ship {
  id: number
  name: string
  speed: number
}

export const MyComponent: React.FC = () => {
  const [ships, setShips] = useState<Ship[]>([])

  useEffect(() => {
    // Fetch ships
  }, [])

  return (
    <div className="container">
      {ships.map(ship => (
        <div key={ship.id}>{ship.name}</div>
      ))}
    </div>
  )
}
```

---

## API Reference

### Smart Contract ABIs

#### AvalancheFighting.sol

**Key Functions**:

```json
[
  {
    "name": "mintStarterShip",
    "type": "function",
    "stateMutability": "payable",
    "inputs": [{"name": "_name", "type": "string"}],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "name": "mintSportShip",
    "type": "function",
    "stateMutability": "payable",
    "inputs": [{"name": "_name", "type": "string"}],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "name": "breedShips",
    "type": "function",
    "stateMutability": "payable",
    "inputs": [
      {"name": "_parent1Id", "type": "uint256"},
      {"name": "_parent2Id", "type": "uint256"},
      {"name": "_name", "type": "string"}
    ],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "name": "submitCombatResult",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      {"name": "_shipId", "type": "uint256"},
      {"name": "_score", "type": "uint256"},
      {"name": "_won", "type": "bool"},
      {"name": "_isTournament", "type": "bool"}
    ]
  },
  {
    "name": "stakeShip",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [{"name": "_shipId", "type": "uint256"}]
  },
  {
    "name": "unstakeShip",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [{"name": "_shipId", "type": "uint256"}]
  },
  {
    "name": "getShip",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{"name": "_shipId", "type": "uint256"}],
    "outputs": [{
      "name": "",
      "type": "tuple",
      "components": [
        {"name": "name", "type": "string"},
        {"name": "speed", "type": "uint256"},
        {"name": "handling", "type": "uint256"},
        {"name": "acceleration", "type": "uint256"},
        {"name": "rarity", "type": "uint256"},
        {"name": "wins", "type": "uint256"},
        {"name": "losses", "type": "uint256"},
        {"name": "totalRaces", "type": "uint256"},
        {"name": "experience", "type": "uint256"},
        {"name": "level", "type": "uint256"},
        {"name": "generation", "type": "uint256"},
        {"name": "parent1", "type": "uint256"},
        {"name": "parent2", "type": "uint256"}
      ]
    }]
  }
]
```

### Frontend API

#### Web3 Hooks

**useAccount**:
```typescript
const { address, isConnected, isConnecting } = useAccount()
```

**useContractRead**:
```typescript
const { data, isError, isLoading } = useContractRead({
  address: '0x...',
  abi: [...],
  functionName: 'getShip',
  args: [shipId]
})
```

**useContractWrite**:
```typescript
const { data, write, isLoading, isSuccess } = useContractWrite({
  address: '0x...',
  abi: [...],
  functionName: 'mintStarterShip'
})

// Call function
write({ args: ['Ship Name'], value: parseEther('0.01') })
```

### Gas Costs (Approximate on Fuji)

| Function | Gas Used | Cost (AVAX) |
|----------|----------|-------------|
| mintStarterShip | ~150,000 | ~0.000375 |
| mintSportShip | ~150,000 | ~0.000375 |
| breedShips | ~200,000 | ~0.000500 |
| submitCombatResult | ~100,000 | ~0.000250 |
| stakeShip | ~80,000 | ~0.000200 |
| unstakeShip | ~120,000 | ~0.000300 |
| enterTournament | ~90,000 | ~0.000225 |

*Note: Gas costs vary based on network congestion. Fuji testnet typically has very low gas prices.*

---

## Security

### Smart Contract Security

#### Implemented Protections

**ReentrancyGuard**:
```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

function unstakeShip(uint256 _shipId) external nonReentrant {
    // Protected from reentrancy attacks
}
```

**Access Control**:
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";

function pause() external onlyOwner {
    _pause();
}
```

**Input Validation**:
```solidity
require(_shipId > 0 && _shipId <= _tokenIdCounter, "Invalid ship ID");
require(bytes(_name).length > 0 && bytes(_name).length <= 32, "Invalid name");
require(ownerOf(_parent1Id) == msg.sender, "Not parent 1 owner");
```

**Safe Math**:
```solidity
// Solidity 0.8+ has built-in overflow protection
uint256 total = value1 + value2; // Reverts on overflow
```

#### Security Best Practices

1. **Private Keys**: Never commit private keys to version control
2. **Environment Variables**: Use `.env` files (added to `.gitignore`)
3. **Contract Verification**: Verify all contracts on Snowtrace
4. **Audits**: Consider professional audits before mainnet
5. **Bug Bounties**: Implement bounty program for mainnet
6. **Upgradability**: Consider proxy patterns for critical contracts
7. **Multi-sig**: Use multi-sig wallets for contract ownership

### Frontend Security

**Wallet Connection**:
- Only interact with user-approved contracts
- Validate transaction parameters before submission
- Display clear transaction previews

**Data Validation**:
```typescript
const validateShipName = (name: string): boolean => {
  return name.length > 0 && name.length <= 32
}

const validateAmount = (amount: string): boolean => {
  try {
    const value = parseEther(amount)
    return value > 0
  } catch {
    return false
  }
}
```

**XSS Protection**:
- Sanitize user inputs
- Use React's built-in XSS protection
- Escape special characters in ship names

---

## Deployment

### Testnet Deployment (Fuji)

#### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Contract code reviewed
- [ ] Environment variables set
- [ ] Wallet funded with Fuji AVAX
- [ ] WalletConnect project ID obtained

#### Deployment Steps

```bash
# 1. Compile contracts
npx hardhat compile

# 2. Run tests
npx hardhat test

# 3. Deploy to Fuji
npx hardhat run scripts/deploy-avalanche.js --network avalancheFuji

# 4. Note deployed addresses
# 5. Update .env file
# 6. Verify contracts
npx hardhat verify --network avalancheFuji <FIGHTING_ADDRESS> "<TOKEN_ADDRESS>"
npx hardhat verify --network avalancheFuji <TOKEN_ADDRESS>
npx hardhat verify --network avalancheFuji <TOURNAMENT_ADDRESS> "<FIGHTING_ADDRESS>" "<TOKEN_ADDRESS>"

# 7. Build frontend
npm run build

# 8. Deploy to hosting (Vercel/Netlify)
```

#### Post-deployment

- Test all contract functions on Fuji
- Verify contract source code on Snowtrace
- Test frontend with real wallet interactions
- Create test tournament
- Mint test ships
- Validate breeding
- Check staking rewards

### Mainnet Deployment

#### Pre-mainnet Checklist

- [ ] Extensive testnet testing completed
- [ ] Security audit conducted
- [ ] Bug bounty program prepared
- [ ] Documentation complete
- [ ] Community testing phase finished
- [ ] Multi-sig wallet setup for ownership
- [ ] Emergency pause procedures documented
- [ ] Monitoring and alerts configured

#### Mainnet Deployment Process

```bash
# Update hardhat.config.js with mainnet settings
# Fund deployment wallet with AVAX
# Deploy contracts
npx hardhat run scripts/deploy-avalanche.js --network avalancheMainnet

# Verify immediately
npx hardhat verify --network avalancheMainnet <ADDRESSES>

# Transfer ownership to multi-sig
# Announce contract addresses
# Deploy frontend to production
```

#### Monitoring

- Set up Tenderly for transaction monitoring
- Configure Snowtrace alerts
- Monitor contract balance
- Track daily active users
- Monitor gas usage
- Set up error logging (Sentry)

---

## Troubleshooting

### Common Development Issues

#### Contract Compilation Errors

**Error**: `Solidity file not found`
```bash
# Solution: Check file paths in import statements
import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // Correct
```

**Error**: `Compiler version mismatch`
```bash
# Solution: Match pragma in contracts with hardhat.config.js
// Contract
pragma solidity ^0.8.24;

// hardhat.config.js
solidity: "0.8.24"
```

#### Deployment Issues

**Error**: `Insufficient funds`
```bash
# Solution: Add AVAX to deployment wallet
# Get from faucet: https://faucet.avax.network/
```

**Error**: `Nonce too high`
```bash
# Solution: Reset account in MetaMask
# Settings > Advanced > Reset Account
```

**Error**: `Contract deployment failed`
```bash
# Solution: Check gas limit and network congestion
# Increase gas limit in deployment script:
const contract = await Contract.deploy({
  gasLimit: 5000000
})
```

#### Frontend Issues

**Error**: `Module not found`
```bash
# Solution: Install missing dependencies
npm install <package-name>

# Or reinstall all
rm -rf node_modules package-lock.json
npm install
```

**Error**: `Contract call reverted`
```typescript
// Solution: Check contract function requirements
// Add try-catch and error handling
try {
  await write({ args: [shipId] })
} catch (error) {
  console.error("Transaction failed:", error.message)
  // Display user-friendly error
}
```

**Error**: `Wrong network`
```typescript
// Solution: Add network check
const { chain } = useNetwork()

if (chain?.id !== 43113) {
  return <div>Please switch to Avalanche Fuji Testnet</div>
}
```

### User Issues

See main [Troubleshooting](#troubleshooting) section for user-facing issues.

### Performance Optimization

**Slow Contract Reads**:
```typescript
// Use multicall for batch reads
import { useContractReads } from 'wagmi'

const contracts = shipIds.map(id => ({
  address: FIGHTING_CONTRACT,
  abi: FightingABI,
  functionName: 'getShip',
  args: [id]
}))

const { data } = useContractReads({ contracts })
```

**Slow 3D Rendering**:
```typescript
// Implement level of detail (LOD)
// Reduce polygon count for distant objects
// Use instancing for repeated geometry
// Implement frustum culling
// Limit particle effects
```

---

## Appendix

### Glossary

- **AVAX**: Native cryptocurrency of Avalanche blockchain
- **C-Chain**: Contract chain of Avalanche, EVM-compatible
- **ERC-721**: NFT token standard
- **ERC-20**: Fungible token standard
- **Gas**: Fee paid for blockchain transactions
- **Minting**: Creating new NFTs
- **Staking**: Locking assets to earn rewards
- **XP**: Experience points for progression
- **Breeding**: Combining two NFTs to create offspring
- **Tournament**: Competitive event with prize pool
- **Fuji**: Avalanche testnet
- **Snowtrace**: Avalanche blockchain explorer

### Useful Links

- **Avalanche Docs**: https://docs.avax.network/
- **Hardhat Docs**: https://hardhat.org/docs
- **Wagmi Docs**: https://wagmi.sh/
- **Three.js Docs**: https://threejs.org/docs/
- **OpenZeppelin**: https://docs.openzeppelin.com/
- **Snowtrace**: https://snowtrace.io/
- **Fuji Faucet**: https://faucet.avax.network/

### Version History

- **v1.0.0** (Current): Initial release
  - NFT ship minting
  - 3D space combat
  - Tournament system
  - Breeding mechanics
  - Staking system
  - RACE token integration
  - Leaderboards
  - Daily rewards

### Future Enhancements

- **v1.1.0**: Mobile support, guild system
- **v1.2.0**: Marketplace, ship customization
- **v1.3.0**: PvP combat, story mode
- **v2.0.0**: Mainnet launch, DAO governance

---

## Support & Community

### Getting Help

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Refer to this comprehensive guide
- **Snowtrace**: Verify transactions and contract interactions

### Contributing

Contributions welcome! See [Contributing](#contributing) section in README.md.

### License

MIT License - See LICENSE file for details.

---

*This documentation is maintained by the AVA Space Fleet development team. Last updated: 2025-10-05*
