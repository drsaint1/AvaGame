// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IFightingToken {
    function mintRaceReward(address player, uint256 score, bool isTournament) external;
    function getRewardEstimate(uint256 score, bool isTournament) external view returns (uint256);
    function getDailyChallengeReward() external view returns (uint256);
    function getDailyChallengeRewardCustom(uint256 rewardAmount) external view returns (uint256);
    function mint(address to, uint256 amount) external;
}




contract AvalancheFighting is ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    struct SpaceShip {
        uint256 speed;
        uint256 handling;
        uint256 acceleration;
        uint256 rarity;       
        uint256 experience;   
        uint256 wins;
        uint256 races;
        uint256 generation;
        uint256 birthTime;
        bool isStaked;
        uint256 stakedTime;
        string name; 
    }
    
    struct RaceResult {
        address player;
        uint256 shipId;
        uint256 score;
        uint256 distance;
        uint256 obstaclesAvoided;
        uint256 bonusCollected;
        uint256 timestamp;
        uint256 tournamentId; 
    }
    
    mapping(uint256 => SpaceShip) public spaceShips;
    mapping(address => uint256[]) public playerShips;
    mapping(address => uint256) public playerLevel;
    mapping(address => uint256) public playerXP;
    mapping(address => uint256) public playerEarnings;
    mapping(address => uint256) public playerBestScore;
    mapping(address => uint256) public lastDailyReward;
    mapping(address => uint256) public tokenBalance;
    mapping(address => uint256) public pendingTokens;
    
    uint256 public nextShipId = 1;
    uint256 public totalSupply = 0;
    address[] public allPlayers;
    mapping(address => bool) public isRegisteredPlayer;
    uint256 public dailyRewardAmount = 0.001 ether;
    uint256 public totalPrizePool = 0;
    
    IFightingToken public fightingToken;
    address public tournamentContract;
    
    uint256 public constant STARTER_COST = 0.01 ether;
    uint256 public constant SPORT_COST = 0.05 ether;
    uint256 public constant RACING_BEAST_COST = 0.08 ether;
    uint256 public constant BREEDING_COST = 0.01 ether;
    uint256 public constant DAILY_REWARD = 0.001 ether;
    uint256 public constant XP_PER_LEVEL = 1000;
    uint256 public constant STAKE_REWARD_RATE = 100;
    
    event ShipMinted(address indexed player, uint256 indexed shipId, uint256 rarity);
    event CombatCompleted(address indexed player, uint256 indexed shipId, uint256 score, uint256 xpGained);
    event ShipStaked(uint256 indexed shipId, address indexed owner);
    event ShipUnstaked(uint256 indexed shipId, address indexed owner, uint256 rewardXP);
    event DailyRewardClaimed(address indexed player, uint256 amount);
    event LevelUp(address indexed player, uint256 newLevel);
    event TokensEarned(address indexed player, uint256 amount, uint256 score);
    event TokensMinted(address indexed player, uint256 amount);
    
    constructor() ERC721("Avalanche Space Fleet", "ASF") Ownable(msg.sender) {
        _registerPlayer(msg.sender);
    }
    
  
    
    
    function _registerPlayer(address player) internal {
        if (!isRegisteredPlayer[player]) {
            allPlayers.push(player);
            isRegisteredPlayer[player] = true;
        }
    }
    
    function _updatePlayerBestScore(address player, uint256 score) internal {
        if (score > playerBestScore[player]) {
            playerBestScore[player] = score;
        }
    }
    
   
    
    function mintStarterShip() external payable whenNotPaused {
        require(msg.value >= STARTER_COST, "Insufficient payment");
        
        _registerPlayer(msg.sender);
        
        uint256 shipId = nextShipId++;
        totalSupply++;
        
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, shipId)));
        uint256 baseSpeed = 30 + (seed % 20);     
        uint256 baseHandling = 35 + ((seed >> 8) % 20);   
        uint256 baseAccel = 40 + ((seed >> 16) % 15);    
        uint256 rarity = _calculateRarity(seed);
        
        spaceShips[shipId] = SpaceShip({
            speed: baseSpeed,
            handling: baseHandling,
            acceleration: baseAccel,
            rarity: rarity,
            experience: 0,
            wins: 0,
            races: 0,
            generation: 1,
            birthTime: block.timestamp,
            isStaked: false,
            stakedTime: 0,
            name: "Interceptor"
        });
        
        playerShips[msg.sender].push(shipId);
        _mint(msg.sender, shipId);
        _setTokenURI(shipId, _generateTokenURI(spaceShips[shipId], shipId));
        
        emit ShipMinted(msg.sender, shipId, rarity);
    }
    
    function mintDestroyer() external payable whenNotPaused {
        require(msg.value >= SPORT_COST, "Insufficient payment");
        
        _registerPlayer(msg.sender);
        
        uint256 shipId = nextShipId++;
        totalSupply++;
        
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, shipId)));
        uint256 baseSpeed = 50 + (seed % 25);      
        uint256 baseHandling = 45 + ((seed >> 8) % 25);   
        uint256 baseAccel = 55 + ((seed >> 16) % 20);     
        uint256 rarity = _calculatePremiumRarity(seed);
        
        spaceShips[shipId] = SpaceShip({
            speed: baseSpeed,
            handling: baseHandling,
            acceleration: baseAccel,
            rarity: rarity,
            experience: 0,
            wins: 0,
            races: 0,
            generation: 1,
            birthTime: block.timestamp,
            isStaked: false,
            stakedTime: 0,
            name: "Destroyer"
        });
        
        playerShips[msg.sender].push(shipId);
        _mint(msg.sender, shipId);
        _setTokenURI(shipId, _generateTokenURI(spaceShips[shipId], shipId));
        
        emit ShipMinted(msg.sender, shipId, rarity);
    }
    
    function mintBattlecruiser() external payable whenNotPaused {
        require(msg.value >= RACING_BEAST_COST, "Insufficient payment");
        
        _registerPlayer(msg.sender);
        
        uint256 shipId = nextShipId++;
        totalSupply++;
        
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, shipId)));
        uint256 baseSpeed = 70 + (seed % 25);      
        uint256 baseHandling = 60 + ((seed >> 8) % 25);   
        uint256 baseAccel = 75 + ((seed >> 16) % 20);     
        uint256 rarity = _calculatePremiumRarity(seed);
        
        spaceShips[shipId] = SpaceShip({
            speed: baseSpeed,
            handling: baseHandling,
            acceleration: baseAccel,
            rarity: rarity,
            experience: 0,
            wins: 0,
            races: 0,
            generation: 1,
            birthTime: block.timestamp,
            isStaked: false,
            stakedTime: 0,
            name: "Battlecruiser"
        });
        
        playerShips[msg.sender].push(shipId);
        _mint(msg.sender, shipId);
        _setTokenURI(shipId, _generateTokenURI(spaceShips[shipId], shipId));
        
        emit ShipMinted(msg.sender, shipId, rarity);
    }
    
   
    function mintPremiumShip() external payable whenNotPaused {
        require(msg.value >= SPORT_COST, "Insufficient payment");
        
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, nextShipId)));
        
        if (seed % 2 == 0) {
            _registerPlayer(msg.sender);
            
            uint256 shipId = nextShipId++;
            totalSupply++;
            
            uint256 baseSpeed = 50 + (seed % 25);
            uint256 baseHandling = 45 + ((seed >> 8) % 25);
            uint256 baseAccel = 55 + ((seed >> 16) % 20);
            uint256 rarity = _calculatePremiumRarity(seed);
            
            spaceShips[shipId] = SpaceShip({
                speed: baseSpeed,
                handling: baseHandling,
                acceleration: baseAccel,
                rarity: rarity,
                experience: 0,
                wins: 0,
                races: 0,
                generation: 1,
                birthTime: block.timestamp,
                isStaked: false,
                stakedTime: 0,
                name: "Destroyer"
            });
            
            playerShips[msg.sender].push(shipId);
            _mint(msg.sender, shipId);
            _setTokenURI(shipId, _generateTokenURI(spaceShips[shipId], shipId));
            
            emit ShipMinted(msg.sender, shipId, rarity);
        } else {
            require(msg.value >= RACING_BEAST_COST, "Insufficient payment for Fighting Beast upgrade");
            
            _registerPlayer(msg.sender);
            
            uint256 shipId = nextShipId++;
            totalSupply++;
            
            uint256 baseSpeed = 70 + (seed % 25);
            uint256 baseHandling = 60 + ((seed >> 8) % 25);
            uint256 baseAccel = 75 + ((seed >> 16) % 20);
            uint256 rarity = _calculatePremiumRarity(seed);
            
            spaceShips[shipId] = SpaceShip({
                speed: baseSpeed,
                handling: baseHandling,
                acceleration: baseAccel,
                rarity: rarity,
                experience: 0,
                wins: 0,
                races: 0,
                generation: 1,
                birthTime: block.timestamp,
                isStaked: false,
                stakedTime: 0,
                name: "Battlecruiser"
            });
            
            playerShips[msg.sender].push(shipId);
            _mint(msg.sender, shipId);
            _setTokenURI(shipId, _generateTokenURI(spaceShips[shipId], shipId));
            
            emit ShipMinted(msg.sender, shipId, rarity);
        }
    }
    
   

    function submitRaceResult(
        address player,
        uint256 shipId,
        uint256 score,
        uint256 distance,
        uint256 obstaclesAvoided,
        uint256 bonusCollected,
        uint256 tournamentId
    ) external whenNotPaused {
        _submitRaceResult(player, shipId, score, distance, obstaclesAvoided, bonusCollected, tournamentId, false);
    }
    
    function submitRaceResultWithTokens(
        address player,
        uint256 shipId,
        uint256 score,
        uint256 distance,
        uint256 obstaclesAvoided,
        uint256 bonusCollected,
        uint256 tournamentId,
        bool mintTokens
    ) external whenNotPaused {
        _submitRaceResult(player, shipId, score, distance, obstaclesAvoided, bonusCollected, tournamentId, mintTokens);
    }
    
    function _submitRaceResult(
        address player,
        uint256 shipId,
        uint256 score,
        uint256 distance,
        uint256 obstaclesAvoided,
        uint256 bonusCollected,
        uint256 tournamentId,
        bool mintTokens
    ) internal {
        require(ownerOf(shipId) == player, "Not ship owner");
        require(!spaceShips[shipId].isStaked, "Ship is staked");
        
        spaceShips[shipId].races++;
        spaceShips[shipId].experience += score / 100;
        
        _registerPlayer(player);
        _updatePlayerBestScore(player, score);
        
        uint256 xpGained = score / 10;
        playerXP[player] += xpGained;
        
        uint256 newLevel = (playerXP[player] / XP_PER_LEVEL) + 1;
        if (newLevel > playerLevel[player]) {
            playerLevel[player] = newLevel;
            emit LevelUp(player, newLevel);
        }
        
       
        if (address(fightingToken) != address(0)) {
            
            if (tournamentId >= 1000) {
                try fightingToken.getDailyChallengeRewardCustom(tournamentId - 1000) returns (uint256 tokenAmount) {
                    fightingToken.mint(player, tokenAmount);
                    tokenBalance[player] += tokenAmount;
                    emit TokensEarned(player, tokenAmount, score);
                } catch {
                  
                    try fightingToken.mintRaceReward(player, score, true) {
                        uint256 rewardAmount = fightingToken.getRewardEstimate(score, true);
                        tokenBalance[player] += rewardAmount;
                        emit TokensEarned(player, rewardAmount, score);
                    } catch {
                        
                    }
                }
            } else {
               
                try fightingToken.mintRaceReward(player, score, tournamentId > 0) {
                    uint256 rewardAmount = fightingToken.getRewardEstimate(score, tournamentId > 0);
                    tokenBalance[player] += rewardAmount;
                    emit TokensEarned(player, rewardAmount, score);
                } catch {
                    
                }
            }
        }
        
        
        if (score > 15000) { 
            spaceShips[shipId].wins++;
            
            uint256 earnings = score * 0.001 ether / 1000; 
            playerEarnings[player] += earnings;
        }
        
        emit CombatCompleted(player, shipId, score, xpGained);
    }
    
   
    
    function stakeShip(uint256 shipId) external whenNotPaused {
        require(ownerOf(shipId) == msg.sender, "Not ship owner");
        require(!spaceShips[shipId].isStaked, "Ship already staked");
        
        spaceShips[shipId].isStaked = true;
        spaceShips[shipId].stakedTime = block.timestamp;
        
        emit ShipStaked(shipId, msg.sender);
    }
    
    function unstakeShip(uint256 shipId) external whenNotPaused {
        require(ownerOf(shipId) == msg.sender, "Not ship owner");
        require(spaceShips[shipId].isStaked, "Ship not staked");
        
        uint256 stakingDuration = block.timestamp - spaceShips[shipId].stakedTime;
        uint256 rewardXP = (stakingDuration * STAKE_REWARD_RATE) / 1 days;
        
        spaceShips[shipId].isStaked = false;
        spaceShips[shipId].stakedTime = 0;
        spaceShips[shipId].experience += rewardXP;
        playerXP[msg.sender] += rewardXP;
        
        emit ShipUnstaked(shipId, msg.sender, rewardXP);
    }
    
    
    
    
    function claimDailyReward() external whenNotPaused nonReentrant {
        require(isRegisteredPlayer[msg.sender], "Not a registered player");
        require(block.timestamp >= lastDailyReward[msg.sender] + 1 days, "Daily reward already claimed");
        
        lastDailyReward[msg.sender] = block.timestamp;
        
        payable(msg.sender).transfer(dailyRewardAmount);
        
        
        if (address(fightingToken) != address(0)) {
            try fightingToken.getDailyChallengeReward() returns (uint256 tokenAmount) {
                fightingToken.mint(msg.sender, tokenAmount);
                tokenBalance[msg.sender] += tokenAmount;
                emit TokensMinted(msg.sender, tokenAmount);
            } catch {
                
            }
        }
        
        emit DailyRewardClaimed(msg.sender, dailyRewardAmount);
    }
    
   

    
    function getPlayerShips(address player) external view returns (uint256[] memory) {
        return playerShips[player];
    }
    
    function getShipDetails(uint256 shipId) external view returns (SpaceShip memory) {
        return spaceShips[shipId];
    }
    
    function getPlayerStats(address player) external view returns (
        uint256 level,
        uint256 totalXP,
        uint256 earnings,
        uint256 shipCount,
        uint256 lastReward
    ) {
        return (
            playerLevel[player],
            playerXP[player],
            playerEarnings[player],
            playerShips[player].length,
            lastDailyReward[player]
        );
    }
    
    function getLeaderboard(uint256 limit) external view returns (
        address[] memory players,
        uint256[] memory scores,
        uint256[] memory levels,
        uint256[] memory totalXPs,
        uint256[] memory shipCounts
    ) {
        uint256 playerCount = allPlayers.length;
        if (playerCount == 0) {
            return (new address[](0), new uint256[](0), new uint256[](0), new uint256[](0), new uint256[](0));
        }
        
        
        address[] memory tempPlayers = new address[](playerCount);
        uint256[] memory tempScores = new uint256[](playerCount);
        uint256[] memory tempLevels = new uint256[](playerCount);
        uint256[] memory tempXPs = new uint256[](playerCount);
        uint256[] memory tempShipCounts = new uint256[](playerCount);
        
        
        for (uint256 i = 0; i < playerCount; i++) {
            address player = allPlayers[i];
            tempPlayers[i] = player;
            tempScores[i] = playerBestScore[player];
            tempLevels[i] = playerLevel[player];
            tempXPs[i] = playerXP[player];
            tempShipCounts[i] = playerShips[player].length;
        }
        
       
        for (uint256 i = 1; i < playerCount; i++) {
            uint256 currentScore = tempScores[i];
            address currentPlayer = tempPlayers[i];
            uint256 currentLevel = tempLevels[i];
            uint256 currentXP = tempXPs[i];
            uint256 currentShipCount = tempShipCounts[i];
            
            uint256 j = i;
            while (j > 0 && tempScores[j - 1] < currentScore) {
                tempScores[j] = tempScores[j - 1];
                tempPlayers[j] = tempPlayers[j - 1];
                tempLevels[j] = tempLevels[j - 1];
                tempXPs[j] = tempXPs[j - 1];
                tempShipCounts[j] = tempShipCounts[j - 1];
                j--;
            }
            
            tempScores[j] = currentScore;
            tempPlayers[j] = currentPlayer;
            tempLevels[j] = currentLevel;
            tempXPs[j] = currentXP;
            tempShipCounts[j] = currentShipCount;
        }
        
        
        uint256 resultCount = playerCount < limit ? playerCount : limit;
        players = new address[](resultCount);
        scores = new uint256[](resultCount);
        levels = new uint256[](resultCount);
        totalXPs = new uint256[](resultCount);
        shipCounts = new uint256[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            players[i] = tempPlayers[i];
            scores[i] = tempScores[i];
            levels[i] = tempLevels[i];
            totalXPs[i] = tempXPs[i];
            shipCounts[i] = tempShipCounts[i];
        }
        
        return (players, scores, levels, totalXPs, shipCounts);
    }
    
    function getAllPlayers() external view returns (address[] memory) {
        return allPlayers;
    }
    
    function getTotalPlayers() external view returns (uint256) {
        return allPlayers.length;
    }
    
    function getPlayerRank(address player) external view returns (uint256) {
        uint256 playerScore = playerBestScore[player];
        uint256 rank = 1;
        
        for (uint256 i = 0; i < allPlayers.length; i++) {
            if (playerBestScore[allPlayers[i]] > playerScore) {
                rank++;
            }
        }
        
        return rank;
    }
    
    function getTokenBalance(address player) external view returns (uint256) {
        return tokenBalance[player];
    }
    
    function getPendingTokens(address player) external view returns (uint256) {
        return pendingTokens[player];
    }
    
    function claimRaceTokens(address player) external whenNotPaused {
        uint256 amount = pendingTokens[player];
        require(amount > 0, "No pending tokens");
        
        pendingTokens[player] = 0;
        tokenBalance[player] += amount;
        
        emit TokensMinted(player, amount);
    }
    
   
    
    
    function _calculateRarity(uint256 seed) internal pure returns (uint256) {
        uint256 random = seed % 100;
        if (random < 60) return 1;    
        if (random < 80) return 2;      
        if (random < 93) return 3;      
        if (random < 99) return 4;      
        return 5;                      
    }
    
    function _calculatePremiumRarity(uint256 seed) internal pure returns (uint256) {
        uint256 random = seed % 100;
        if (random < 30) return 2;     
        if (random < 60) return 3;      
        if (random < 85) return 4;      
        return 5;                       
    }
    
    function _generateTokenURI(SpaceShip memory ship, uint256 tokenId) internal pure returns (string memory) {
        
        return string(abi.encodePacked("https://api.avaxfighting.com/metadata/", _toString(tokenId)));
    }
    
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    function _max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
   
    
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        uint256 reserveAmount = dailyRewardAmount * 100;
        uint256 withdrawAmount = balance > reserveAmount ? balance - reserveAmount : 0;
        
        require(withdrawAmount > 0, "No excess funds to withdraw");
        payable(owner()).transfer(withdrawAmount);
    }
    
    function setDailyReward(uint256 newReward) external onlyOwner {
        dailyRewardAmount = newReward;
    }
    
    function setFightingToken(address _fightingToken) external onlyOwner {
        fightingToken = IFightingToken(_fightingToken);
    }
    
    function setTournamentContract(address _tournamentContract) external onlyOwner {
        tournamentContract = _tournamentContract;
    }
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    receive() external payable {
        totalPrizePool += msg.value;
    }
}