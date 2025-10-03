import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useAccount, useWriteContract } from "wagmi";
import { useFightingContract, ShipNFT } from "../hooks/useFightingContract";

interface SpaceshipNFT {
  id: number;
  speed: number;
  handling: number;
  acceleration: number;
  rarity: number;
  experience: number;
  wins: number;
  races: number;
  name: string;
  color?: string;
  enginePower: number;    // speed
  maneuverability: number; // handling
  boostCapacity: number;   // acceleration
  shieldStrength: number;  // rarity-based
}

interface GameState {
  health: number;
  score: number;
  energy: number;
  enemiesDestroyed: number;
  asteroidsDestroyed: number;
  resourcesCollected: number;
  currentWave: number;
}

interface SpaceFleetGameProps {
  onClose?: () => void;
  activeTournamentId?: number | null;
  onTournamentCompleted?: (tournamentId: number) => void;
  onNavigateToTournaments?: () => void;
  onNavigateToMenu?: () => void;
  practiceMode?: boolean;
}

const SpaceFleetGame: React.FC<SpaceFleetGameProps> = ({
  onClose,
  // activeTournamentId,
  // onTournamentCompleted,
  onNavigateToTournaments,
  onNavigateToMenu,
  practiceMode = false
}) => {
  const { /* address, */ isConnected } = useAccount();
  // const { writeContractAsync } = useWriteContract();
  const {
    selectedShip: contractSelectedShip,
    playerShips: contractPlayerShips,
    submitCombatResult,
    stakeShip,
    unstakeShip,
    isConnected: contractConnected,
  } = useFightingContract();

  const [selectedShip, setSelectedShip] = useState<ShipNFT | null>(null);
  const [playerShips, setPlayerShips] = useState<ShipNFT[]>([]);
  const [stakeTxStatus, setStakeTxStatus] = useState("");
  const [stakeTxMessage, setStakeTxMessage] = useState("");
  const [loadingShipId, setLoadingShipId] = useState<number | null>(null);

  // Update ships from contract
  useEffect(() => {
    if (contractPlayerShips && contractPlayerShips.length > 0) {
      setPlayerShips(contractPlayerShips);
    }
  }, [contractPlayerShips]);

  useEffect(() => {
    if (contractSelectedShip) {
      setSelectedShip(contractSelectedShip);
    }
  }, [contractSelectedShip]);

  const selectedShipRef = useRef(null);

  const handleStakeShip = async (shipId: number, shipName: string) => {
    try {
      setLoadingShipId(shipId);
      setStakeTxStatus("pending");
      setStakeTxMessage(`Staking ${shipName}...`);

      const txHash = await stakeShip(shipId);

      setStakeTxStatus("success");
      setStakeTxMessage(`✅ ${shipName} staked successfully! Transaction: ${txHash}`);

      setTimeout(() => {
        setStakeTxStatus("");
        setStakeTxMessage("");
        setLoadingShipId(null);
      }, 5000);
    } catch (error: any) {
      setLoadingShipId(null);
      setStakeTxStatus("error");
      setStakeTxMessage(`❌ Failed to stake ${shipName}: ${error.message}`);

      setTimeout(() => {
        setStakeTxStatus("");
        setStakeTxMessage("");
        setLoadingShipId(null);
      }, 5000);
    }
  };

  const handleUnstakeShip = async (shipId: number, shipName: string) => {
    try {
      setLoadingShipId(shipId);
      setStakeTxStatus("pending");
      setStakeTxMessage(`Unstaking ${shipName}...`);

      const txHash = await unstakeShip(shipId);

      setStakeTxStatus("success");
      setStakeTxMessage(`✅ ${shipName} unstaked successfully! Transaction: ${txHash}`);

      setTimeout(() => {
        setStakeTxStatus("");
        setStakeTxMessage("");
        setLoadingShipId(null);
      }, 5000);
    } catch (error: any) {
      setLoadingShipId(null);
      setStakeTxStatus("error");
      setStakeTxMessage(`❌ Failed to unstake ${shipName}: ${error.message}`);

      setTimeout(() => {
        setStakeTxStatus("");
        setStakeTxMessage("");
        setLoadingShipId(null);
      }, 5000);
    }
  };

  useEffect(() => {
    selectedShipRef.current = selectedShip;
  }, [selectedShip]);

  const [gameRunning, setGameRunning] = useState(false);

  const gameRunningRef = useRef(false);

  useEffect(() => {
    gameRunningRef.current = gameRunning;
  }, [gameRunning]);
  const [gameOver, setGameOver] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    health: 100,
    score: 0,
    energy: 100,
    enemiesDestroyed: 0,
    asteroidsDestroyed: 0,
    resourcesCollected: 0,
    currentWave: 1,
  });

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const spaceshipRef = useRef<THREE.Group | null>(null);
  const enemiesRef = useRef<THREE.Group[]>([]);
  const asteroidsRef = useRef<THREE.Group[]>([]);
  const projectilesRef = useRef<THREE.Group[]>([]);
  const resourcesRef = useRef<THREE.Group[]>([]);
  const healthPickupsRef = useRef<THREE.Group[]>([]);
  const starsRef = useRef<THREE.Points | null>(null);
  const animationIdRef = useRef<number>(0);

  // const [screenEffects, setScreenEffects] = useState({
  //   hit: false,
  //   shake: false,
  //   sparks: false,
  // });

  const screenEffectsRef = useRef({
    cameraShake: 0,
    shakeIntensity: 0,
    hitFlashTimer: 0,
  });

  const keysRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    shift: false,
  });

  const gameStateRef = useRef({
    spaceshipPosition: { x: 0, y: 0, z: 0 },
    lastShotTime: 0,
    shotCooldown: 200,
    lastEnemySpawn: 0,
    enemySpawnRate: 1000,
    gameSpeed: 1.0,
    waveTimer: 0,
    waveDuration: 30000,
    currentWave: 1,
    lastHealthPickup: 0,
    healthPickupInterval: 60000, // 1 minute
  });

  // Create explosion effect at a position
  const createExplosion = useCallback((position: THREE.Vector3, size: number = 1) => {
    if (!sceneRef.current) return;

    const explosionGroup = new THREE.Group();
    const particleCount = 15 + Math.random() * 10; // 15-25 particles

    // Create explosion particles
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Group();

      // Random particle shape - sometimes sphere, sometimes cube
      const isRound = Math.random() > 0.5;
      let geometry, material;

      if (isRound) {
        geometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.15);
        material = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0xff4400 : 0xffaa00,
          emissive: 0xff2200,
          transparent: true,
          opacity: 0.8 + Math.random() * 0.2
        });
      } else {
        geometry = new THREE.BoxGeometry(0.1 + Math.random() * 0.2, 0.1 + Math.random() * 0.2, 0.1 + Math.random() * 0.2);
        material = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0xff6600 : 0xff0000,
          emissive: 0x442200,
          transparent: true,
          opacity: 0.7 + Math.random() * 0.3
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      particle.add(mesh);

      // Random starting position around explosion center
      particle.position.copy(position);
      particle.position.x += (Math.random() - 0.5) * size * 0.5;
      particle.position.y += (Math.random() - 0.5) * size * 0.5;
      particle.position.z += (Math.random() - 0.5) * size * 0.5;

      // Random velocity - particles fly outward
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      );

      (particle as any).velocity = velocity;
      (particle as any).life = 1.0; // Full life
      (particle as any).decay = 0.02 + Math.random() * 0.03; // How fast it fades

      explosionGroup.add(particle);
    }

    sceneRef.current.add(explosionGroup);

    // Animate explosion particles
    const animateExplosion = () => {
      const particles = explosionGroup.children;
      let aliveParticles = 0;

      particles.forEach(particle => {
        const velocity = (particle as any).velocity;
        const life = (particle as any).life;
        const decay = (particle as any).decay;

        if (life > 0) {
          // Move particle
          particle.position.add(velocity);

          // Fade out
          (particle as any).life -= decay;
          const mesh = particle.children[0] as THREE.Mesh;
          if (mesh && mesh.material) {
            (mesh.material as THREE.Material & { opacity: number }).opacity = Math.max(0, life);
          }

          // Slow down
          velocity.multiplyScalar(0.98);

          aliveParticles++;
        }
      });

      if (aliveParticles > 0) {
        requestAnimationFrame(animateExplosion);
      } else {
        // Remove explosion when all particles are dead
        if (sceneRef.current) {
          sceneRef.current.remove(explosionGroup);
        }
      }
    };

    animateExplosion();
  }, []);

  // Create health pickup box
  const createHealthPickup = useCallback(() => {
    if (!sceneRef.current || !spaceshipRef.current) return;

    const healthPickup = new THREE.Group();

    // Main white box
    const boxGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const boxMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: 0x222222
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    healthPickup.add(box);

    // Red cross - vertical bar
    const verticalBarGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.05);
    const redMaterial = new THREE.MeshLambertMaterial({
      color: 0xff0000,
      emissive: 0x440000
    });
    const verticalBar = new THREE.Mesh(verticalBarGeometry, redMaterial);
    verticalBar.position.z = 0.31;
    healthPickup.add(verticalBar);

    // Red cross - horizontal bar
    const horizontalBarGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.05);
    const horizontalBar = new THREE.Mesh(horizontalBarGeometry, redMaterial);
    horizontalBar.position.z = 0.31;
    healthPickup.add(horizontalBar);

    // Position ahead of player, moving towards them
    const playerPosition = new THREE.Vector3();
    spaceshipRef.current.getWorldPosition(playerPosition);

    // Spawn ahead and slightly to the side
    healthPickup.position.set(
      playerPosition.x + (Math.random() - 0.5) * 10,
      playerPosition.y + (Math.random() - 0.5) * 8,
      playerPosition.z - 80 // Spawn ahead
    );

    // Add movement towards player
    const directionToPlayer = new THREE.Vector3()
      .subVectors(playerPosition, healthPickup.position)
      .normalize()
      .multiplyScalar(0.03); // Slow approach speed

    (healthPickup as any).velocity = directionToPlayer;
    (healthPickup as any).rotationSpeed = 0.02;
    (healthPickup as any).healAmount = 0.5; // 50% heal
    (healthPickup as any).isHealthPickup = true;

    sceneRef.current.add(healthPickup);
    healthPickupsRef.current.push(healthPickup);
  }, []);

  const triggerHitEffect = useCallback((intensity: number = 1) => {
    screenEffectsRef.current.cameraShake = 10 * intensity;
    screenEffectsRef.current.shakeIntensity = 0.5 * intensity;
    screenEffectsRef.current.hitFlashTimer = 15;

    setScreenEffects({
      hit: true,
      shake: true,
      sparks: true,
    });

    setTimeout(() => {
      setScreenEffects({
        hit: false,
        shake: false,
        sparks: false,
      });
    }, 200);
  }, []);

  const getSpaceshipStats = useCallback((ship: any): SpaceshipNFT => {
    // Map actual gameplay characteristics for each ship
    const shipStatsMap: { [key: string]: any } = {
      "Interceptor": {
        enginePower: 75,
        maneuverability: 85,
        boostCapacity: 60,
        shieldStrength: 100,
        health: 100,
        energy: 50,
        weapons: "Single Laser",
        specialAbility: "Fast & Agile"
      },
      "Destroyer": {
        enginePower: 65,
        maneuverability: 70,
        boostCapacity: 85,
        shieldStrength: 150,
        health: 150,
        energy: 70,
        weapons: "3D Missiles + Scope",
        specialAbility: "Precision Targeting"
      },
      "Battlecruiser": {
        enginePower: 80,
        maneuverability: 95,
        boostCapacity: 90,
        shieldStrength: 200,
        health: 200,
        energy: 90,
        weapons: "Conical Blast + Scope",
        specialAbility: "Heavy Firepower"
      },
      "Dreadnought": {
        enginePower: 100,
        maneuverability: 100,
        boostCapacity: 100,
        shieldStrength: 300,
        health: 300,
        energy: 100,
        weapons: "Dual Wing Cannons",
        specialAbility: "Ultimate Destroyer"
      }
    };

    const stats = shipStatsMap[ship.name] || {
      enginePower: ship.speed,
      maneuverability: ship.handling,
      boostCapacity: ship.acceleration,
      shieldStrength: ship.rarity * 25
    };

    return {
      ...ship,
      ...stats
    };
  }, []);

  // Get ship health based on ship type
  const getShipHealth = useCallback((ship: any): number => {
    if (!ship) return 100;

    const baseHealth = 100;
    switch (ship.name) {
      case "Destroyer":
        return Math.floor(baseHealth * 1.5); // 150 health (+50%)
      case "Battlecruiser":
        return baseHealth * 2; // 200 health (+100%)
      case "Dreadnought":
        return baseHealth * 3; // 300 health (+200%)
      case "Interceptor":
      default:
        return baseHealth; // 100 health (base)
    }
  }, []);

  // Get ship energy based on ship type
  const getShipEnergy = useCallback((ship: any): number => {
    if (!ship) return 100;

    switch (ship.name) {
      case "Interceptor":
        return 50; // Lowest energy - fast but limited boost
      case "Destroyer":
        return 70; // Medium energy - balanced
      case "Battlecruiser":
        return 90; // Highest energy - powerful with good endurance
      case "Dreadnought":
        return 100; // Maximum energy - ultimate endurance
      default:
        return 100;
    }
  }, []);

  const getCurrentShip = useCallback(() => {
    const demoShips = [
      { id: 1, name: "Interceptor", color: "#00ffff" },
      { id: 2, name: "Destroyer", color: "#ff6b6b" },
      { id: 3, name: "Battlecruiser", color: "#ffd700" },
      { id: 4, name: "Dreadnought", color: "#8a2be2" }
    ];
    const availableShips = isConnected && playerShips.length > 0 ? playerShips : demoShips;

    const currentSelection = selectedShip || selectedShipRef.current;

    if (currentSelection) {
      let found = availableShips.find(ship => ship.name === currentSelection.name);

      if (!found) {
        found = availableShips.find(ship => ship.id === currentSelection.id);
      }

      if (found) {
        return found;
      } else {
      }
    }

    const fallback = availableShips.length > 0 ? availableShips[0] : null;
    return fallback;
  }, [selectedShip, isConnected, playerShips]);

  const initScene = useCallback(() => {
    if (!mountRef.current) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const starsGeometry = new THREE.BufferGeometry();
    const starsVertices = [];
    for (let i = 0; i < 2000; i++) {
      starsVertices.push(
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 2000
      );
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    starsRef.current = stars;
    scene.add(stars);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const shipToUse = getCurrentShip();
    setTimeout(() => {
      createSpaceship(shipToUse);
    }, 100);

    renderer.render(scene, camera);

    const startAnimation = () => {
      animate();
    };
    setTimeout(startAnimation, 100);

    const nebulaGeometry = new THREE.PlaneGeometry(100, 100);
    const nebulaMaterial = new THREE.MeshBasicMaterial({
      color: 0x4400ff,
      transparent: true,
      opacity: 0.1,
    });
    const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    nebula.position.z = -50;
    scene.add(nebula);
  }, []);

  // Create spaceship model
  const createSpaceship = useCallback((shipToRender?: any) => {
    const currentShip = shipToRender;

    if (!sceneRef.current) return;

    if (!currentShip) {
      return;
    }

    // Remove existing ship if it exists
    if (spaceshipRef.current) {
      sceneRef.current.remove(spaceshipRef.current);
      spaceshipRef.current = null;
    }

    const ship = new THREE.Group();
    const shipName = currentShip?.name || "";

    if (shipName === "Destroyer") {
      // Destroyer - Heavy battleship design
      // Main hull - thick, armored appearance
      const hullGeometry = new THREE.BoxGeometry(1.2, 0.6, 3.5);
      const hullMaterial = new THREE.MeshLambertMaterial({
        color: currentShip?.color || "#ff6b6b"
      });
      const hull = new THREE.Mesh(hullGeometry, hullMaterial);
      ship.add(hull);

      // Armored front section
      const frontArmorGeometry = new THREE.BoxGeometry(1.0, 0.5, 1.0);
      const frontArmorMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      const frontArmor = new THREE.Mesh(frontArmorGeometry, frontArmorMaterial);
      frontArmor.position.set(0, 0, 1.8);
      ship.add(frontArmor);

      // Pointed nose/ram
      const noseGeometry = new THREE.ConeGeometry(0.4, 1.2, 8);
      const noseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      const nose = new THREE.Mesh(noseGeometry, noseMaterial);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 0, 2.8);
      ship.add(nose);

      // Heavy duty wings - thick and angular
      const wingGeometry = new THREE.BoxGeometry(3.0, 0.25, 1.2);
      const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
      const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
      leftWing.position.set(-1.2, 0, -0.2);
      leftWing.rotation.z = -0.15;
      ship.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
      rightWing.position.set(1.2, 0, -0.2);
      rightWing.rotation.z = 0.15;
      ship.add(rightWing);

      // Wing weapon mounts
      const weaponMountGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.8);
      const weaponMountMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
      const leftWeaponMount = new THREE.Mesh(weaponMountGeometry, weaponMountMaterial);
      leftWeaponMount.position.set(-1.8, 0, 0.2);
      ship.add(leftWeaponMount);

      const rightWeaponMount = new THREE.Mesh(weaponMountGeometry, weaponMountMaterial);
      rightWeaponMount.position.set(1.8, 0, 0.2);
      ship.add(rightWeaponMount);

      // Triple engine setup - massive thrust
      const engineGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.4);
      const engineMaterial = new THREE.MeshLambertMaterial({ color: 0x0066ff });
      const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
      leftEngine.position.set(-0.8, 0, -2.2);
      ship.add(leftEngine);

      const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
      rightEngine.position.set(0.8, 0, -2.2);
      ship.add(rightEngine);

      // Massive center engine
      const mainEngineGeometry = new THREE.CylinderGeometry(0.5, 0.6, 1.8);
      const mainEngineColor = new THREE.MeshLambertMaterial({ color: 0xff0066 });
      const mainEngine = new THREE.Mesh(mainEngineGeometry, mainEngineColor);
      mainEngine.position.set(0, 0, -2.5);
      ship.add(mainEngine);

      // Command tower/bridge
      const bridgeGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.8);
      const bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
      const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
      bridge.position.set(0, 0.5, 0.5);
      ship.add(bridge);

      // Advanced targeting scope - MUCH larger and more visible
      const scopeBaseGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.6);
      const scopeBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
      const scopeBase = new THREE.Mesh(scopeBaseGeometry, scopeBaseMaterial);
      scopeBase.position.set(0, 1.0, 0.8);
      ship.add(scopeBase);

      // Scope barrel - MUCH bigger and more prominent
      const scopeBarrelGeometry = new THREE.CylinderGeometry(0.15, 0.2, 2.0);
      const scopeBarrelMaterial = new THREE.MeshLambertMaterial({ color: 0x00aa00 });
      const scopeBarrel = new THREE.Mesh(scopeBarrelGeometry, scopeBarrelMaterial);
      scopeBarrel.position.set(0, 1.0, 2.0);
      scopeBarrel.rotation.x = Math.PI / 2;
      ship.add(scopeBarrel);

      // Targeting lens - MUCH larger and more prominent
      const lensGeometry = new THREE.CircleGeometry(0.25, 16);
      const lensMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 1.0,
        emissive: 0x004488
      });
      const lens = new THREE.Mesh(lensGeometry, lensMaterial);
      lens.position.set(0, 1.0, 3.1);
      lens.rotation.x = Math.PI / 2;
      ship.add(lens);

      // Scope crosshair - MUCH bigger
      const crosshairGeometry = new THREE.RingGeometry(0.1, 0.15, 8);
      const crosshairMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 1.0
      });
      const crosshair = new THREE.Mesh(crosshairGeometry, crosshairMaterial);
      crosshair.position.set(0, 1.0, 3.15);
      crosshair.rotation.x = Math.PI / 2;
      ship.add(crosshair);

      // Add scope support struts for better visibility
      const strutGeometry = new THREE.BoxGeometry(0.1, 0.6, 0.1);
      const strutMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      const leftStrut = new THREE.Mesh(strutGeometry, strutMaterial);
      leftStrut.position.set(-0.2, 0.7, 1.5);
      ship.add(leftStrut);

      const rightStrut = new THREE.Mesh(strutGeometry, strutMaterial);
      rightStrut.position.set(0.2, 0.7, 1.5);
      ship.add(rightStrut);

      // Side armor plating
      const armorGeometry = new THREE.BoxGeometry(0.2, 0.3, 2.0);
      const armorMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
      const leftArmor = new THREE.Mesh(armorGeometry, armorMaterial);
      leftArmor.position.set(-0.7, 0, 0);
      ship.add(leftArmor);

      const rightArmor = new THREE.Mesh(armorGeometry, armorMaterial);
      rightArmor.position.set(0.7, 0, 0);
      ship.add(rightArmor);

      // Store scope reference for targeting
      (ship as any).hasScope = true;
      (ship as any).scopeRef = scopeBarrel;
      (ship as any).lensRef = lens;
      (ship as any).crosshairRef = crosshair;

    } else if (shipName === "Interceptor") {
      // Interceptor - Fast, agile design
      // Main body
      const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
      const bodyMaterial = new THREE.MeshLambertMaterial({
        color: currentShip?.color || "#00ffff"
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.rotation.x = Math.PI / 2;
      ship.add(body);

      // Wings
      const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.5);
      const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
      const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
      leftWing.position.set(-0.8, 0, -0.5);
      ship.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
      rightWing.position.set(0.8, 0, -0.5);
      ship.add(rightWing);

      // Engines
      const engineGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8);
      const engineMaterial = new THREE.MeshLambertMaterial({ color: 0xff4400 });
      const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
      leftEngine.position.set(-0.8, 0, -1.2);
      ship.add(leftEngine);

      const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
      rightEngine.position.set(0.8, 0, -1.2);
      ship.add(rightEngine);

      (ship as any).hasScope = false;

    } else if (shipName === "Battlecruiser") {

      // Main body - larger than Interceptor
      const bodyGeometry = new THREE.BoxGeometry(1.0, 0.5, 2.8);
      const bodyMaterial = new THREE.MeshLambertMaterial({
        color: currentShip?.color || "#ffd700"
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      ship.add(body);

      // Front command section
      const commandGeometry = new THREE.ConeGeometry(0.4, 1.2, 8);
      const commandMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
      const command = new THREE.Mesh(commandGeometry, commandMaterial);
      command.rotation.x = Math.PI / 2;
      command.position.set(0, 0, 1.8);
      ship.add(command);

      // Large wings - more substantial than Interceptor
      const wingGeometry = new THREE.BoxGeometry(2.8, 0.2, 1.0);
      const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
      const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
      leftWing.position.set(-1.1, 0, -0.4);
      ship.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
      rightWing.position.set(1.1, 0, -0.4);
      ship.add(rightWing);

      // Triple engine setup - powerful
      const engineGeometry = new THREE.CylinderGeometry(0.25, 0.35, 1.2);
      const engineMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa00 });

      const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
      leftEngine.position.set(-0.7, 0, -1.8);
      ship.add(leftEngine);

      const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
      rightEngine.position.set(0.7, 0, -1.8);
      ship.add(rightEngine);

      const centerEngine = new THREE.Mesh(engineGeometry, engineMaterial);
      centerEngine.position.set(0, 0, -1.8);
      ship.add(centerEngine);

      // Side weapon pods
      const weaponGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.8);
      const weaponMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

      const leftWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
      leftWeapon.position.set(-1.3, 0, 0.5);
      ship.add(leftWeapon);

      const rightWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
      rightWeapon.position.set(1.3, 0, 0.5);
      ship.add(rightWeapon);

      // Central targeting crosshair for single weapon system
      const crosshairGeometry = new THREE.RingGeometry(0.3, 0.35, 16);
      const crosshairMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700, // Gold color matching Battlecruiser
        transparent: true,
        opacity: 0.8
      });

      // Center targeting crosshair
      const centerTargetCircle = new THREE.Mesh(crosshairGeometry, crosshairMaterial);
      centerTargetCircle.position.set(0, 0, -12); // Center position, far forward
      centerTargetCircle.rotation.x = Math.PI / 2;
      ship.add(centerTargetCircle);

      // Center crosshair lines
      const lineGeometry = new THREE.BoxGeometry(0.6, 0.04, 0.04);
      const lineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700, // Gold color
        transparent: true,
        opacity: 0.8
      });

      // Horizontal crosshair line
      const centerHLine = new THREE.Mesh(lineGeometry, lineMaterial);
      centerHLine.position.set(0, 0, -12);
      ship.add(centerHLine);

      // Vertical crosshair line
      const centerVLine = new THREE.Mesh(lineGeometry, lineMaterial);
      centerVLine.position.set(0, 0, -12);
      centerVLine.rotation.z = Math.PI / 2;
      ship.add(centerVLine);

      (ship as any).hasScope = false;

    } else if (shipName === "Dreadnought") {
      // Dreadnought - Ultimate ship design
      // Massive main body - larger than all others
      const bodyGeometry = new THREE.BoxGeometry(1.4, 0.8, 4.0);
      const bodyMaterial = new THREE.MeshLambertMaterial({
        color: currentShip?.color || "#8a2be2"
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      ship.add(body);

      // Command bridge - elevated and armored
      const bridgeGeometry = new THREE.BoxGeometry(0.8, 0.6, 1.2);
      const bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
      const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
      bridge.position.set(0, 0.7, 0.8);
      ship.add(bridge);

      // Front command tower
      const towerGeometry = new THREE.ConeGeometry(0.5, 1.5, 8);
      const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      const tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.rotation.x = Math.PI / 2;
      tower.position.set(0, 0, 2.5);
      ship.add(tower);

      // Massive wings with dual weapon mounts
      const wingGeometry = new THREE.BoxGeometry(3.5, 0.3, 1.5);
      const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x9932cc });
      const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
      leftWing.position.set(-1.4, 0, -0.5);
      ship.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
      rightWing.position.set(1.4, 0, -0.5);
      ship.add(rightWing);

      // Wing weapon barrels for dual shooting
      const weaponGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1.0);
      const weaponMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });

      // Left wing weapons
      const leftWeapon1 = new THREE.Mesh(weaponGeometry, weaponMaterial);
      leftWeapon1.position.set(-2.0, 0, 0.3);
      ship.add(leftWeapon1);

      const leftWeapon2 = new THREE.Mesh(weaponGeometry, weaponMaterial);
      leftWeapon2.position.set(-1.6, 0, 0.3);
      ship.add(leftWeapon2);

      // Right wing weapons
      const rightWeapon1 = new THREE.Mesh(weaponGeometry, weaponMaterial);
      rightWeapon1.position.set(2.0, 0, 0.3);
      ship.add(rightWeapon1);

      const rightWeapon2 = new THREE.Mesh(weaponGeometry, weaponMaterial);
      rightWeapon2.position.set(1.6, 0, 0.3);
      ship.add(rightWeapon2);

      // Quad engine setup - maximum power
      const engineGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.6);
      const engineMaterial = new THREE.MeshLambertMaterial({ color: 0x4b0082 });

      const leftEngine1 = new THREE.Mesh(engineGeometry, engineMaterial);
      leftEngine1.position.set(-1.0, 0, -2.5);
      ship.add(leftEngine1);

      const leftEngine2 = new THREE.Mesh(engineGeometry, engineMaterial);
      leftEngine2.position.set(-0.5, 0, -2.5);
      ship.add(leftEngine2);

      const rightEngine1 = new THREE.Mesh(engineGeometry, engineMaterial);
      rightEngine1.position.set(0.5, 0, -2.5);
      ship.add(rightEngine1);

      const rightEngine2 = new THREE.Mesh(engineGeometry, engineMaterial);
      rightEngine2.position.set(1.0, 0, -2.5);
      ship.add(rightEngine2);

      // Armor plating
      const armorGeometry = new THREE.BoxGeometry(0.3, 0.4, 3.0);
      const armorMaterial = new THREE.MeshLambertMaterial({ color: 0x2e2e2e });
      const leftArmor = new THREE.Mesh(armorGeometry, armorMaterial);
      leftArmor.position.set(-0.85, 0, 0);
      ship.add(leftArmor);

      const rightArmor = new THREE.Mesh(armorGeometry, armorMaterial);
      rightArmor.position.set(0.85, 0, 0);
      ship.add(rightArmor);

      // Dual targeting crosshairs aligned with weapon firing directions
      const crosshairGeometry = new THREE.RingGeometry(0.25, 0.3, 16);
      const crosshairMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.9
      });

      // Left weapon targeting crosshair (aligned with left weapon position)
      const leftTargetCircle = new THREE.Mesh(crosshairGeometry, crosshairMaterial);
      leftTargetCircle.position.set(-2.0, 0, -15); // Same X as left weapon, far forward
      leftTargetCircle.rotation.x = Math.PI / 2;
      ship.add(leftTargetCircle);

      // Right weapon targeting crosshair (aligned with right weapon position)
      const rightTargetCircle = new THREE.Mesh(crosshairGeometry, crosshairMaterial);
      rightTargetCircle.position.set(2.0, 0, -15); // Same X as right weapon, far forward
      rightTargetCircle.rotation.x = Math.PI / 2;
      ship.add(rightTargetCircle);

      // Crosshair lines for both targeting systems
      const lineGeometry = new THREE.BoxGeometry(0.5, 0.03, 0.03);
      const lineMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.9
      });

      // Left crosshair lines
      const leftHLine = new THREE.Mesh(lineGeometry, lineMaterial);
      leftHLine.position.set(-2.0, 0, -15);
      ship.add(leftHLine);

      const leftVLine = new THREE.Mesh(lineGeometry, lineMaterial);
      leftVLine.position.set(-2.0, 0, -15);
      leftVLine.rotation.z = Math.PI / 2;
      ship.add(leftVLine);

      // Right crosshair lines
      const rightHLine = new THREE.Mesh(lineGeometry, lineMaterial);
      rightHLine.position.set(2.0, 0, -15);
      ship.add(rightHLine);

      const rightVLine = new THREE.Mesh(lineGeometry, lineMaterial);
      rightVLine.position.set(2.0, 0, -15);
      rightVLine.rotation.z = Math.PI / 2;
      ship.add(rightVLine);

      // Store wing weapon positions for dual shooting
      (ship as any).hasScope = false;
      (ship as any).hasDualWeapons = true;
      (ship as any).leftWeaponPos = [-2.0, 0, 0.3];
      (ship as any).rightWeaponPos = [2.0, 0, 0.3];

    } else {

      const bodyGeometry = new THREE.ConeGeometry(0.3, 1.5, 6);
      const bodyMaterial = new THREE.MeshLambertMaterial({
        color: currentShip?.color || "#cccccc"
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.rotation.x = Math.PI / 2;
      ship.add(body);

      (ship as any).hasScope = false;
    }

    ship.position.set(0, 0, 0);
    sceneRef.current.add(ship);
    spaceshipRef.current = ship;
  }, [isConnected, playerShips, selectedShip]);

  // Create/recreate spaceship when selection changes or scene becomes available
  useEffect(() => {
    if (showMenu || !sceneRef.current) {
      return;
    }

    const shipToUse = getCurrentShip();
    createSpaceship(shipToUse);
  }, [selectedShip, showMenu, getCurrentShip, createSpaceship]);


  // Create enemy ship
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createEnemy = useCallback(() => {
    if (!sceneRef.current) {
      return;
    }

    const enemy = new THREE.Group();

    // Main enemy ship body (cone pointing forward)
    const bodyGeometry = new THREE.ConeGeometry(0.4, 1.5, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = -Math.PI / 2; // Point forward
    enemy.add(body);

    // Enemy wings
    const wingGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.3);
    const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x880000 });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.6, 0, 0.3);
    enemy.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.6, 0, 0.3);
    enemy.add(rightWing);

    // Enemy engines
    const engineGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.5);
    const engineMaterial = new THREE.MeshLambertMaterial({ color: 0xff4400 });
    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.position.set(-0.6, 0, 0.8);
    enemy.add(leftEngine);

    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.position.set(0.6, 0, 0.8);
    enemy.add(rightEngine);

    // Spawn enemies far ahead of player
    enemy.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 15,
      -80  // Much farther away so players see them approaching
    );

    // Add movement properties
    (enemy as any).health = 3;
    (enemy as any).speed = 0.08 + Math.random() * 0.03; // Slower so they stay visible longer
    (enemy as any).lastShot = 0;

    sceneRef.current.add(enemy);
    enemiesRef.current.push(enemy);
  }, []);

  // Create asteroid
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createAsteroid = useCallback(() => {
    if (!sceneRef.current) return;

    const asteroid = new THREE.Group();

    const geometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 1);
    const material = new THREE.MeshLambertMaterial({ color: 0xcd853f }); // Light brown color
    const mesh = new THREE.Mesh(geometry, material);
    asteroid.add(mesh);

    asteroid.position.set(
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 20,
      -60  // Spawn farther ahead like enemies
    );

    (asteroid as any).rotationSpeed = {
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02,
    };
    (asteroid as any).health = 2;

    sceneRef.current.add(asteroid);
    asteroidsRef.current.push(asteroid);
  }, []);

  // Create projectile
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createProjectile = useCallback((position: THREE.Vector3, direction: THREE.Vector3, isPlayer: boolean = true) => {
    if (!sceneRef.current) return;

    const projectile = new THREE.Group();

    const geometry = new THREE.SphereGeometry(0.25);
    const material = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0x00ff00 : 0xff0000,
      emissive: isPlayer ? 0x004400 : 0x440000
    });
    const mesh = new THREE.Mesh(geometry, material);
    projectile.add(mesh);

    projectile.position.copy(position);
    (projectile as any).velocity = direction.clone().multiplyScalar(0.5);
    (projectile as any).isPlayer = isPlayer;
    (projectile as any).damage = isPlayer ? 1 : 10;

    sceneRef.current.add(projectile);
    projectilesRef.current.push(projectile);
  }, []);

  // Create resource pickup
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createResource = useCallback(() => {
    if (!sceneRef.current) return;

    const resource = new THREE.Group();

    const geometry = new THREE.OctahedronGeometry(0.3);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0x444400
    });
    const mesh = new THREE.Mesh(geometry, material);
    resource.add(mesh);

    resource.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 15,
      -50  // Spawn farther ahead like enemies
    );

    (resource as any).rotationSpeed = 0.05;
    (resource as any).value = 10;

    sceneRef.current.add(resource);
    resourcesRef.current.push(resource);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          keysRef.current.left = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          keysRef.current.right = true;
          break;
        case 'ArrowUp':
        case 'KeyW':
          keysRef.current.up = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          keysRef.current.down = true;
          break;
        case 'Space':
        case 'SpaceBar':
          event.preventDefault();
          keysRef.current.space = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.current.shift = true;
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          keysRef.current.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          keysRef.current.right = false;
          break;
        case 'ArrowUp':
        case 'KeyW':
          keysRef.current.up = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          keysRef.current.down = false;
          break;
        case 'Space':
        case 'SpaceBar':
          keysRef.current.space = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.current.shift = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Create demo ships if no wallet connected or no NFTs
  const demoShips = [
    {
      id: 1,
      speed: 75,
      handling: 60,
      acceleration: 80,
      rarity: 3,
      experience: 100,
      wins: 5,
      races: 8,
      name: "Interceptor",
      color: "#00ffff"
    },
    {
      id: 2,
      speed: 90,
      handling: 85,
      acceleration: 70,
      rarity: 4,
      experience: 250,
      wins: 12,
      races: 15,
      name: "Destroyer",
      color: "#ff6b6b"
    },
    {
      id: 3,
      speed: 65,
      handling: 95,
      acceleration: 90,
      rarity: 5,
      experience: 500,
      wins: 25,
      races: 30,
      name: "Battlecruiser",
      color: "#ffd700"
    },
    {
      id: 4,
      speed: 100,
      handling: 100,
      acceleration: 100,
      rarity: 6,
      experience: 1000,
      wins: 50,
      races: 50,
      name: "Dreadnought",
      color: "#8a2be2"
    }
  ];

  const availableShips = isConnected && playerShips.length > 0 ? playerShips : demoShips;

  let currentSelectedShip = getCurrentShip();


  // Game loop
  const animate = useCallback(() => {
    if (!spaceshipRef.current || !rendererRef.current || !cameraRef.current) {
      return;
    }

    // Check if game should end due to health being 0 or if game is over
    if (gameState.health <= 0 && gameRunning) {
      endGame();
      return;
    }

    // Don't continue if game is over
    if (gameOver) {
      return;
    }

    // Always run animation, but only update game logic if gameRunning is true

    const now = Date.now();
    const ship = spaceshipRef.current;


    // ALWAYS RUN GAME LOGIC FOR INDEFINITE GAMEPLAY
    // Removed gameRunning check to ensure continuous spawning

    const currentShip = getCurrentShip();
    const shipStats = currentShip ? getSpaceshipStats(currentShip) : null;

    // Always update spaceship movement with fast responsive controls
    const moveSpeed = (shipStats?.maneuverability || 50) * 0.003; // Faster movement for better control
    const isBoostingAndHasEnergy = keysRef.current.shift && gameState.energy > 0;
    const boostMultiplier = isBoostingAndHasEnergy ? (shipStats?.boostCapacity || 50) * 0.08 : 1; // Enhanced boost

    let isMoving = false;

    if (keysRef.current.left && ship.position.x > -35) {
      ship.position.x -= moveSpeed * boostMultiplier;
      isMoving = true;
    }
    if (keysRef.current.right && ship.position.x < 35) {
      ship.position.x += moveSpeed * boostMultiplier;
      isMoving = true;
    }
    if (keysRef.current.up && ship.position.y < 25) {
      ship.position.y += moveSpeed * boostMultiplier;
      isMoving = true;
    }
    if (keysRef.current.down && ship.position.y > -25) {
      ship.position.y -= moveSpeed * boostMultiplier;
      isMoving = true;
    }

    // Consume energy when boosting
    if (isBoostingAndHasEnergy && isMoving) {
      setGameState(prev => ({
        ...prev,
        energy: Math.max(0, prev.energy - 0.3)
      }));
    }

    // Add forward motion - ship is always moving forward through space
    const forwardSpeed = 0.05;
    ship.position.z -= forwardSpeed;

    // Update camera to follow ship's forward motion with shake effect
    if (cameraRef.current) {
      let cameraX = ship.position.x;
      let cameraY = ship.position.y + 5;
      let cameraZ = ship.position.z + 10;

      // Apply camera shake
      if (screenEffectsRef.current.cameraShake > 0) {
        const shake = screenEffectsRef.current.shakeIntensity;
        cameraX += (Math.random() - 0.5) * shake;
        cameraY += (Math.random() - 0.5) * shake;
        cameraZ += (Math.random() - 0.5) * shake * 0.5;
        screenEffectsRef.current.cameraShake--;
      }

      cameraRef.current.position.set(cameraX, cameraY, cameraZ);
      cameraRef.current.lookAt(ship.position.x, ship.position.y, ship.position.z);

      if ((ship as any).hasScope) {
        const scopeRef = (ship as any).scopeRef;
        const lensRef = (ship as any).lensRef;
        const crosshairRef = (ship as any).crosshairRef;

        // Find closest enemy for targeting
        let closestEnemy = null;
        let closestDistance = Infinity;
        enemiesRef.current.forEach(enemy => {
          const distance = enemy.position.distanceTo(ship.position);
          if (distance < closestDistance && distance < 60) { // Extended targeting range
            closestDistance = distance;
            closestEnemy = enemy;
          }
        });

        // Update scope targeting
        if (closestEnemy && scopeRef && lensRef) {
          // Scope barrel points towards closest enemy
          scopeRef.lookAt(closestEnemy.position);

          // Enhanced targeting visuals
          const targetingIntensity = Math.max(0.4, 1 - (closestDistance / 40));
          lensRef.material.opacity = targetingIntensity;

          if (closestDistance < 15) {
            lensRef.material.color.setHex(0xff0000); // Red when very close - optimal kill range
            if (lensRef.material.emissive) lensRef.material.emissive.setHex(0x330000);
            if (crosshairRef) {
              crosshairRef.material.color.setHex(0xff0000);
              crosshairRef.material.opacity = 1.0;
            }
          } else if (closestDistance < 30) {
            lensRef.material.color.setHex(0xffff00); // Yellow when in good range
            if (lensRef.material.emissive) lensRef.material.emissive.setHex(0x333300);
            if (crosshairRef) {
              crosshairRef.material.color.setHex(0xffff00);
              crosshairRef.material.opacity = 0.8;
            }
          } else if (closestDistance < 50) {
            lensRef.material.color.setHex(0x00ff00); // Green when in range
            if (lensRef.material.emissive) lensRef.material.emissive.setHex(0x003300);
            if (crosshairRef) {
              crosshairRef.material.color.setHex(0x00ff00);
              crosshairRef.material.opacity = 0.6;
            }
          } else {
            lensRef.material.color.setHex(0x00ffff); // Cyan default
            if (lensRef.material.emissive) lensRef.material.emissive.setHex(0x002244);
            if (crosshairRef) {
              crosshairRef.material.color.setHex(0x00ffff);
              crosshairRef.material.opacity = 0.4;
            }
          }

          // Scope glint effect when locked on
          if (closestDistance < 25) {
            const glintIntensity = (Math.sin(Date.now() * 0.01) + 1) * 0.3;
            lensRef.material.opacity = Math.min(1.0, targetingIntensity + glintIntensity);
          }

        } else if (lensRef) {
          // No target - dim the scope
          lensRef.material.opacity = 0.4;
          lensRef.material.color.setHex(0x00ffff);
          if (lensRef.material.emissive) lensRef.material.emissive.setHex(0x001122);
          if (crosshairRef) {
            crosshairRef.material.opacity = 0.3;
            crosshairRef.material.color.setHex(0x666666);
          }
        }
      }

      // Move starfield to follow camera for infinite background
      if (starsRef.current) {
        starsRef.current.position.set(
          Math.floor(cameraX / 100) * 100,  // Snap to grid to avoid jarring movement
          Math.floor(cameraY / 100) * 100,
          Math.floor(cameraZ / 100) * 100
        );
      }
    }

    // Always run game logic for demo purposes
    // Shooting
    if (keysRef.current.space && now - gameStateRef.current.lastShotTime > gameStateRef.current.shotCooldown) {
      const shipPosition = new THREE.Vector3();
      ship.getWorldPosition(shipPosition);
      // Check if current ship is destroyer by checking the ship object directly
      const isDestroyer = (ship as any).hasScope === true;
      const currentShip = getCurrentShip();
      const isBattlecruiser = currentShip?.name === "Battlecruiser";
      const isDreadnought = currentShip?.name === "Dreadnought";

      if (sceneRef.current) {
        // Handle Dreadnought dual weapon system
        if (isDreadnought && (ship as any).hasDualWeapons) {
          const leftWeaponPos = (ship as any).leftWeaponPos;
          const rightWeaponPos = (ship as any).rightWeaponPos;

          // Create two conical bullets from wing positions
          [leftWeaponPos, rightWeaponPos].forEach((weaponPos) => {
            const projectile = new THREE.Group();
            const bulletSize = 0.5;
            const bulletColor = 0x8a2be2; // Purple for Dreadnought

            // Conical bullet like battlecruiser but bigger
            const coneGeometry = new THREE.ConeGeometry(bulletSize * 0.9, bulletSize * 3.5);
            const coneMaterial = new THREE.MeshLambertMaterial({
              color: bulletColor,
              emissive: 0x440044
            });
            const coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
            coneMesh.rotation.x = Math.PI / 2; // Point forward
            projectile.add(coneMesh);

            // Position bullet at wing weapon position
            const worldWeaponPos = new THREE.Vector3();
            ship.getWorldPosition(worldWeaponPos);
            worldWeaponPos.add(new THREE.Vector3(weaponPos[0], weaponPos[1], weaponPos[2]));
            projectile.position.copy(worldWeaponPos);

            (projectile as any).velocity = new THREE.Vector3(0, 0, -1).multiplyScalar(0.7);
            (projectile as any).isPlayer = true;
            (projectile as any).damage = 10; // One-shot kill damage - highest in game
            (projectile as any).isDreadnought = true;

            sceneRef.current.add(projectile);
            projectilesRef.current.push(projectile);
          });
        } else {
          // Original single weapon system for other ships
          const projectile = new THREE.Group();
          const bulletSize = isDestroyer ? 0.6 : (isBattlecruiser ? 0.4 : 0.25);
          const bulletColor = isDestroyer ? 0xff6600 : (isBattlecruiser ? 0xffd700 : 0x00ff00);

        if (isDestroyer) {
          // Create 3D missile-like bullet for destroyer
          const bulletGroup = new THREE.Group();

          // Main body - cylindrical (50% smaller)
          const bodyGeometry = new THREE.CylinderGeometry(bulletSize * 0.5, bulletSize * 0.6, bulletSize * 2.5);
          const bodyMaterial = new THREE.MeshLambertMaterial({
            color: bulletColor,
            emissive: 0x442200
          });
          const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
          bodyMesh.rotation.x = Math.PI / 2;
          bulletGroup.add(bodyMesh);

          // Pointed nose (50% smaller)
          const noseGeometry = new THREE.ConeGeometry(bulletSize * 0.5, bulletSize * 1.0);
          const noseMaterial = new THREE.MeshLambertMaterial({
            color: bulletColor,
            emissive: 0x442200
          });
          const noseMesh = new THREE.Mesh(noseGeometry, noseMaterial);
          noseMesh.rotation.x = Math.PI / 2;
          noseMesh.position.z = -bulletSize * 1.5;
          bulletGroup.add(noseMesh);

          // Fins (50% smaller)
          const finGeometry = new THREE.BoxGeometry(bulletSize * 0.9, bulletSize * 0.15, bulletSize * 0.5);
          const finMaterial = new THREE.MeshLambertMaterial({
            color: bulletColor,
            emissive: 0x442200
          });

          // Four fins
          for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.z = bulletSize * 1.0;
            fin.rotation.z = (Math.PI / 2) * i;
            bulletGroup.add(fin);
          }

          projectile.add(bulletGroup);
        } else if (isBattlecruiser) {
          // Conical bullet for battlecruiser - one-shot kill
          const coneGeometry = new THREE.ConeGeometry(bulletSize * 0.8, bulletSize * 3);
          const coneMaterial = new THREE.MeshLambertMaterial({
            color: bulletColor,
            emissive: 0x443300
          });
          const coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
          coneMesh.rotation.x = Math.PI / 2; // Point forward
          projectile.add(coneMesh);
        } else {
          // Simple sphere for interceptor
          const geometry = new THREE.SphereGeometry(bulletSize);
          const material = new THREE.MeshStandardMaterial({
            color: bulletColor,
            emissive: 0x002200
          });
          const mesh = new THREE.Mesh(geometry, material);
          projectile.add(mesh);
        }

          projectile.position.copy(shipPosition);
          (projectile as any).velocity = new THREE.Vector3(0, 0, -1).multiplyScalar(0.6); // Destroyer bullets are faster
          (projectile as any).isPlayer = true;
          (projectile as any).damage = isDestroyer ? 2 : (isBattlecruiser ? 5 : 1); // Battlecruiser one-shot kills (5 damage), Destroyer does 2, Interceptor does 1
          (projectile as any).isDestroyer = isDestroyer;
          (projectile as any).isBattlecruiser = isBattlecruiser;

          sceneRef.current.add(projectile);
          projectilesRef.current.push(projectile);

          // Scope targeting effect for Destroyer
          if (isDestroyer && (ship as any).hasScope) {
            const scopeRef = (ship as any).scopeRef;
            const lensRef = (ship as any).lensRef;
            if (scopeRef && lensRef) {
              // Brief scope flash when shooting
              lensRef.material.color.setHex(0xffff00);
              setTimeout(() => {
                if (lensRef.material) lensRef.material.color.setHex(0x00ffff);
              }, 100);
            }
          }
        }
      }

      gameStateRef.current.lastShotTime = now;
    }

    const shouldSpawn = now - gameStateRef.current.lastEnemySpawn > gameStateRef.current.enemySpawnRate;

    if (shouldSpawn) {

      // Create enemy directly inline to avoid closure issues
      if (sceneRef.current) {
        const enemy = new THREE.Group();

        // Main enemy ship body (cone pointing forward) - VERY BRIGHT colors for dark space
        const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0080 }); // Bright hot pink
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2; // Point forward
        enemy.add(body);

        // Enemy wings - BRIGHT color for maximum visibility
        const wingGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.6);
        const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xff00ff }); // Bright magenta
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.6, 0, 0.3);
        enemy.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.6, 0, 0.3);
        enemy.add(rightWing);

        // Enemy engines - SUPER BRIGHT for maximum visibility in dark space
        const engineGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.5);
        const engineMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 }); // Bright yellow
        const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        leftEngine.position.set(-0.6, 0, 0.8);
        enemy.add(leftEngine);

        const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        rightEngine.position.set(0.6, 0, 0.8);
        enemy.add(rightEngine);

        // Spawn enemies to ensure no hiding spots - track player position
        const shipX = spaceshipRef.current?.position.x || 0;
        const shipY = spaceshipRef.current?.position.y || 0;
        const shipZ = spaceshipRef.current?.position.z || 0;

        // Spawn enemies in a reasonable area around the player's current position
        enemy.position.set(
          shipX + (Math.random() - 0.5) * 30,  // Moderate X spread around player
          shipY + (Math.random() - 0.5) * 20,  // Moderate Y spread around player
          shipZ - (90 + Math.random() * 20)  // Varied Z distance: 90-110 units ahead
        );

        (enemy as any).health = 3;
        (enemy as any).speed = 0.04 + Math.random() * 0.02; // Slower speed for better targeting
        (enemy as any).lastShot = 0;

        sceneRef.current.add(enemy);
        enemiesRef.current.push(enemy);
      }

      // Create asteroid inline - reduced frequency
      if (Math.random() < 0.15 && sceneRef.current) {
        const asteroid = new THREE.Group();
        const geometry = new THREE.DodecahedronGeometry(1.5);
        const material = new THREE.MeshLambertMaterial({ color: 0xcd853f }); // Light brown color
        const mesh = new THREE.Mesh(geometry, material);
        asteroid.add(mesh);

        // Spawn asteroids around player position
        const shipX = spaceshipRef.current?.position.x || 0;
        const shipY = spaceshipRef.current?.position.y || 0;
        const shipZ = spaceshipRef.current?.position.z || 0;

        asteroid.position.set(
          shipX + (Math.random() - 0.5) * 25,  // Moderate X spread around player
          shipY + (Math.random() - 0.5) * 18,  // Moderate Y spread around player
          shipZ - (70 + Math.random() * 30)  // Varied Z distance: 70-100 units ahead
        );

        (asteroid as any).rotationSpeed = {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02,
        };
        (asteroid as any).health = 2;

        sceneRef.current.add(asteroid);
        asteroidsRef.current.push(asteroid);
      }

      // Create resource inline - reduced frequency
      if (Math.random() < 0.05 && sceneRef.current) {
        const resource = new THREE.Group();
        const geometry = new THREE.OctahedronGeometry(0.3);
        const material = new THREE.MeshBasicMaterial({
          color: 0xffff00
        });
        const mesh = new THREE.Mesh(geometry, material);
        resource.add(mesh);

        // Spawn resources around player position
        const shipX = spaceshipRef.current?.position.x || 0;
        const shipY = spaceshipRef.current?.position.y || 0;
        const shipZ = spaceshipRef.current?.position.z || 0;

        resource.position.set(
          shipX + (Math.random() - 0.5) * 35,  // Wide X spread around player
          shipY + (Math.random() - 0.5) * 25,  // Wide Y spread around player
          shipZ - (60 + Math.random() * 25)  // Varied Z distance: 60-85 units ahead
        );

        (resource as any).rotationSpeed = 0.05;
        (resource as any).value = 10;

        sceneRef.current.add(resource);
        resourcesRef.current.push(resource);
      }

      gameStateRef.current.lastEnemySpawn = now;
    }

    if (enemiesRef.current.length === 0 && now - gameStateRef.current.lastEnemySpawn > 5000) {

      if (sceneRef.current) {
        const enemy = new THREE.Group();

        // Main enemy ship body (cone pointing forward) - VERY BRIGHT for dark space
        const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0080 }); // Bright hot pink
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2; // Point forward
        enemy.add(body);

        // Spawn emergency enemy around player position
        const shipX = spaceshipRef.current?.position.x || 0;
        const shipY = spaceshipRef.current?.position.y || 0;
        const shipZ = spaceshipRef.current?.position.z || 0;

        enemy.position.set(
          shipX + (Math.random() - 0.5) * 25,  // Moderate X spread around player
          shipY + (Math.random() - 0.5) * 18,  // Moderate Y spread around player
          shipZ - 100
        );
        (enemy as any).health = 3;
        (enemy as any).speed = 0.04; // Slower speed for better targeting
        (enemy as any).lastShot = 0;

        sceneRef.current.add(enemy);
        enemiesRef.current.push(enemy);
        gameStateRef.current.lastEnemySpawn = now;
      }
    }

    // Health pickup spawning - every 1 minute
    if (now - gameStateRef.current.lastHealthPickup > gameStateRef.current.healthPickupInterval) {
      createHealthPickup();
      gameStateRef.current.lastHealthPickup = now;
    }

    // Update enemies
    enemiesRef.current.forEach((enemy, index) => {
      enemy.position.z += (enemy as any).speed;

      // Enemy shooting - only when in front of player (approaching)
      const distanceFromPlayer = enemy.position.z - ship.position.z;
      const canShoot = distanceFromPlayer < -5; // Only shoot when enemy is ahead of player

      if (canShoot && now - (enemy as any).lastShot > 2000 && Math.random() < 0.015) {
        const enemyPosition = new THREE.Vector3();
        enemy.getWorldPosition(enemyPosition);

        // Aim towards player ship
        const playerPosition = new THREE.Vector3();
        ship.getWorldPosition(playerPosition);

        const direction = new THREE.Vector3()
          .subVectors(playerPosition, enemyPosition)
          .normalize()
          .multiplyScalar(0.3);

        // Create enemy projectile inline
        if (sceneRef.current) {
          const projectile = new THREE.Group();
          const geometry = new THREE.SphereGeometry(0.15);
          const material = new THREE.MeshStandardMaterial({
            color: 0xff4500, // Fire orange color
            emissive: 0x441100 // Fire glow effect
          });
          const mesh = new THREE.Mesh(geometry, material);
          projectile.add(mesh);

          projectile.position.copy(enemyPosition);
          (projectile as any).velocity = direction.clone().multiplyScalar(0.5);
          (projectile as any).isPlayer = false;
          (projectile as any).damage = 10;

          sceneRef.current.add(projectile);
          projectilesRef.current.push(projectile);
        }

        (enemy as any).lastShot = now;
      }

      const distance = enemy.position.distanceTo(ship.position);
      if (distance < 3) {
        const newHealth = Math.max(0, gameState.health - 15);
        triggerHitEffect(2);
        setGameState(prev => ({
          ...prev,
          health: Math.max(0, prev.health - 15)
        }));

        if (newHealth <= 0) {
          setTimeout(() => endGame(), 100);
        }

        // Remove the enemy that hit player
        sceneRef.current?.remove(enemy);
        enemiesRef.current.splice(index, 1);
        return; // Exit early to avoid processing this enemy further
      }

      if (enemy.position.z > ship.position.z + 50) {
        sceneRef.current?.remove(enemy);
        enemiesRef.current.splice(index, 1);
      }
    });

    // Update asteroids
    asteroidsRef.current.forEach((asteroid, index) => {
      asteroid.position.z += 0.07; // Slower to match enemy speed
      asteroid.rotation.x += (asteroid as any).rotationSpeed.x;
      asteroid.rotation.y += (asteroid as any).rotationSpeed.y;
      asteroid.rotation.z += (asteroid as any).rotationSpeed.z;

      const distance = asteroid.position.distanceTo(ship.position);
      if (distance < 1.5) {
        const newHealth = Math.max(0, gameState.health - 20);
        triggerHitEffect(1.8);
        setGameState(prev => ({
          ...prev,
          health: Math.max(0, prev.health - 20)
        }));

        if (newHealth <= 0) {
          setTimeout(() => endGame(), 100);
        }

        // Remove the asteroid that hit player
        sceneRef.current?.remove(asteroid);
        asteroidsRef.current.splice(index, 1);
        return; // Exit early to avoid processing this asteroid further
      }

      if (asteroid.position.z > ship.position.z + 50) {
        sceneRef.current?.remove(asteroid);
        asteroidsRef.current.splice(index, 1);
      }
    });

    // Update projectiles
    projectilesRef.current.forEach((projectile, index) => {
      const velocity = (projectile as any).velocity;
      projectile.position.add(velocity);

      // Check collisions
      if ((projectile as any).isPlayer) {
        // Check enemy collisions - increased range for better hit detection
        enemiesRef.current.forEach((enemy, enemyIndex) => {
          const distance = projectile.position.distanceTo(enemy.position);
          if (distance < 2.5) {  // Increased collision range
            const damage = (projectile as any).damage || 1;
            const isDestroyer = (projectile as any).isDestroyer || false;
            const isBattlecruiser = (projectile as any).isBattlecruiser || false;

            (enemy as any).health -= damage;
            sceneRef.current?.remove(projectile);
            projectilesRef.current.splice(index, 1);

            if ((enemy as any).health <= 0) {
              // Create explosion effect at enemy position
              const enemyPosition = new THREE.Vector3();
              enemy.getWorldPosition(enemyPosition);
              createExplosion(enemyPosition, 2.0);

              sceneRef.current?.remove(enemy);
              enemiesRef.current.splice(enemyIndex, 1);
              setGameState(prev => ({
                ...prev,
                score: prev.score + (isBattlecruiser ? 200 : (isDestroyer ? 150 : 100)), // Destroyer gets bonus points
                enemiesDestroyed: prev.enemiesDestroyed + 1
              }));
            }
          }
        });

        // Check asteroid collisions - increased range for better hit detection
        asteroidsRef.current.forEach((asteroid, asteroidIndex) => {
          const distance = projectile.position.distanceTo(asteroid.position);
          if (distance < 2.8) {
            (asteroid as any).health--;
            sceneRef.current?.remove(projectile);
            projectilesRef.current.splice(index, 1);

            if ((asteroid as any).health <= 0) {
              // Create explosion effect at asteroid position
              const asteroidPosition = new THREE.Vector3();
              asteroid.getWorldPosition(asteroidPosition);
              createExplosion(asteroidPosition, 1.5);

              sceneRef.current?.remove(asteroid);
              asteroidsRef.current.splice(asteroidIndex, 1);
              setGameState(prev => ({
                ...prev,
                score: prev.score + 50,
                asteroidsDestroyed: prev.asteroidsDestroyed + 1
              }));
            }
          }
        });
      } else {
        // Enemy projectile hitting player
        const distance = projectile.position.distanceTo(ship.position);
        if (distance < 1) {
          const damage = (projectile as any).damage || 5;
          const newHealth = Math.max(0, gameState.health - damage);
          triggerHitEffect(1.5);
          setGameState(prev => ({
            ...prev,
            health: Math.max(0, prev.health - damage)
          }));

          if (newHealth <= 0) {
            setTimeout(() => endGame(), 100);
          }

          sceneRef.current?.remove(projectile);
          projectilesRef.current.splice(index, 1);
        }
      }

      // Remove projectiles that are too far (relative to player position)
      if (projectile.position.z < ship.position.z - 60 || projectile.position.z > ship.position.z + 60) {
        sceneRef.current?.remove(projectile);
        projectilesRef.current.splice(index, 1);
      }
    });

    // Update resources
    resourcesRef.current.forEach((resource, index) => {
      resource.position.z += 0.05;
      resource.rotation.y += (resource as any).rotationSpeed;

      // Check collection
      if (resource.position.distanceTo(ship.position) < 1.5) {
        const currentShip = getCurrentShip();
        const maxEnergy = getShipEnergy(currentShip);

        setGameState(prev => ({
          ...prev,
          score: prev.score + (resource as any).value,
          energy: Math.min(maxEnergy, prev.energy + 5),
          resourcesCollected: prev.resourcesCollected + 1
        }));
        sceneRef.current?.remove(resource);
        resourcesRef.current.splice(index, 1);
      }

      if (resource.position.z > ship.position.z + 50) {
        sceneRef.current?.remove(resource);
        resourcesRef.current.splice(index, 1);
      }
    });

    // Update health pickups
    healthPickupsRef.current.forEach((healthPickup, index) => {
      // Move towards player
      const velocity = (healthPickup as any).velocity;
      if (velocity) {
        healthPickup.position.add(velocity);
      }

      // Rotate for visual effect
      healthPickup.rotation.x += (healthPickup as any).rotationSpeed || 0;
      healthPickup.rotation.y += (healthPickup as any).rotationSpeed || 0;

      // Check collection by player
      if (healthPickup.position.distanceTo(ship.position) < 1.5) {
        const healAmount = (healthPickup as any).healAmount || 0.5;
        const currentHealth = gameState.health;
        const healValue = Math.floor(currentHealth * healAmount);
        const currentShip = getCurrentShip();
        const maxHealth = getShipHealth(currentShip);
        const newHealth = Math.min(maxHealth, currentHealth + healValue);

        setGameState(prev => ({
          ...prev,
          health: newHealth
        }));

        sceneRef.current?.remove(healthPickup);
        healthPickupsRef.current.splice(index, 1);
      }

      // Remove if too far behind player
      if (healthPickup.position.z > ship.position.z + 50) {
        sceneRef.current?.remove(healthPickup);
        healthPickupsRef.current.splice(index, 1);
      }
    });

    if (gameState.health <= 0) {
      endGame();
      return;
    }

    gameStateRef.current.waveTimer += 16;
    if (gameStateRef.current.waveTimer > gameStateRef.current.waveDuration) {
      gameStateRef.current.waveTimer = 0;
      gameStateRef.current.enemySpawnRate = Math.max(500, gameStateRef.current.enemySpawnRate - 50);
    }

    rendererRef.current.render(sceneRef.current!, cameraRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  }, [gameState.health, gameRunning, gameOver]);

  // Start game
  const startGame = useCallback(() => {
    const currentShip = getCurrentShip();
    if (!currentShip) {
      alert("Please select a spaceship first!");
      return;
    }

    setShowMenu(false);
    setGameRunning(true);
    setGameOver(false);
    setGameState({
      health: getShipHealth(currentShip),
      score: 0,
      energy: getShipEnergy(currentShip),
      enemiesDestroyed: 0,
      asteroidsDestroyed: 0,
      resourcesCollected: 0,
      currentWave: 1,
    });

    gameStateRef.current = {
      spaceshipPosition: { x: 0, y: 0, z: 0 },
      lastShotTime: 0,
      shotCooldown: 200,
      lastEnemySpawn: 0,
      enemySpawnRate: 2000,
      gameSpeed: 1.0,
      waveTimer: 0,
      waveDuration: 30000,
      currentWave: 1,
      lastHealthPickup: Date.now(),
      healthPickupInterval: 60000,
    };

    animate();
  }, [getCurrentShip, animate]);

  // End game
  const endGame = useCallback(async () => {
    setGameRunning(false);
    setGameOver(true);
    cancelAnimationFrame(animationIdRef.current);

    // Submit combat result to contract if connected, has selected ship, and NOT in practice mode
    if (!practiceMode && contractConnected && contractSelectedShip && submitCombatResult) {
      try {
        await submitCombatResult(
          contractSelectedShip.id,          // shipId
          gameState.score,                   // score
          gameState.enemiesDestroyed,        // distance (using enemies destroyed)
          gameState.asteroidsDestroyed,      // obstaclesAvoided (using asteroids destroyed)
          gameState.resourcesCollected,      // bonusCollected
          0                                   // tournamentId (0 for no tournament)
        );
      } catch (error) {
        console.error("Failed to submit combat result:", error);
      }
    }

    // Clear all game objects
    enemiesRef.current.forEach(enemy => sceneRef.current?.remove(enemy));
    asteroidsRef.current.forEach(asteroid => sceneRef.current?.remove(asteroid));
    projectilesRef.current.forEach(projectile => sceneRef.current?.remove(projectile));
    resourcesRef.current.forEach(resource => sceneRef.current?.remove(resource));
    healthPickupsRef.current.forEach(healthPickup => sceneRef.current?.remove(healthPickup));

    enemiesRef.current = [];
    asteroidsRef.current = [];
    projectilesRef.current = [];
    resourcesRef.current = [];
    healthPickupsRef.current = [];
  }, [contractConnected, contractSelectedShip, submitCombatResult, gameState.score, gameState.enemiesDestroyed, gameState.resourcesCollected]);

  // Restart game with same ship
  const restartGame = useCallback(() => {
    const currentShip = getCurrentShip();
    if (!currentShip) return;

    setGameOver(false);
    setGameRunning(true);
    setGameState({
      health: getShipHealth(currentShip),
      score: 0,
      energy: getShipEnergy(currentShip),
      enemiesDestroyed: 0,
      asteroidsDestroyed: 0,
      resourcesCollected: 0,
      currentWave: 1,
    });

    gameStateRef.current = {
      spaceshipPosition: { x: 0, y: 0, z: 0 },
      lastShotTime: 0,
      shotCooldown: 200,
      lastEnemySpawn: 0,
      enemySpawnRate: 2000,
      gameSpeed: 1.0,
      waveTimer: 0,
      waveDuration: 30000,
      currentWave: 1,
      lastHealthPickup: Date.now(),
      healthPickupInterval: 60000,
    };

    // Reset camera shake effects
    screenEffectsRef.current = {
      cameraShake: 0,
      shakeIntensity: 0,
      hitFlashTimer: 0,
    };

    // Reset ship position
    if (spaceshipRef.current) {
      spaceshipRef.current.position.set(0, 0, 0);
      spaceshipRef.current.rotation.set(0, 0, 0);
    }

    animate();
  }, [getCurrentShip, animate]);

  // Initialize scene when component mounts
  useEffect(() => {
    if (showMenu) return;

    initScene();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [showMenu, initScene]);

  // Auto-start game when not in menu and ship is selected
  useEffect(() => {
    const currentShip = getCurrentShip();
    if (showMenu || gameOver || !currentShip) return;

    if (!gameRunningRef.current) {
      setGameRunning(true);
    }
  }, [showMenu, gameOver, getCurrentShip]);

  // Ensure animation loop keeps running when animate function changes
  useEffect(() => {
    if (showMenu || gameOver || !gameRunningRef.current) return;

    cancelAnimationFrame(animationIdRef.current);
    animate();
  }, [animate, showMenu, gameOver]);


  if (showMenu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
          {practiceMode && (
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
          )}
        </div>

        {/* Stars background */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 p-3 py-4 space-y-4 h-screen overflow-y-auto">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-space text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              🚀 Space Fleet Combat
              {practiceMode && (
                <span className="block text-lg text-amber-400 font-game mt-1">Practice Mode - Train Without Risk!</span>
              )}
            </h1>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              {practiceMode
                ? 'Perfect your combat skills in a risk-free environment. No rewards, no penalties - just pure training!'
                : 'Command your NFT spaceships in epic space battles and earn real rewards!'}
            </p>

            {/* Connection Status */}
            <div className="inline-flex items-center px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700/50 backdrop-blur-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm font-medium text-gray-300">
                {isConnected ? 'Wallet Connected' : 'Demo Mode - Connect Wallet for Full Features'}
              </span>
            </div>
          </div>

          {/* Transaction Status */}
          {stakeTxMessage && (
            <div className={`fixed top-6 right-6 max-w-sm p-4 rounded-xl backdrop-blur-sm border z-50 ${
              stakeTxStatus === "success" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
              : stakeTxStatus === "error" ? "bg-red-500/20 border-red-500/50 text-red-300"
              : "bg-amber-500/20 border-amber-500/50 text-amber-300"
            }`}>
              {stakeTxMessage}
            </div>
          )}

          {/* No Ship Selected Message */}
          {!currentSelectedShip && (
            <div className="max-w-md mx-auto mb-6">
              <div className="bg-amber-500/20 backdrop-blur-sm border border-amber-500/50 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">⚠️</div>
                <h3 className="text-lg font-bold text-amber-400 mb-2">No Ship Selected</h3>
                <p className="text-amber-300 text-sm mb-3">
                  You need to select a ship before starting combat. Go to the Select Ship page to choose your ship.
                </p>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-lg hover:bg-amber-500/40 transition-colors"
                  >
                    ← Back to Select Ship
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Current Ship Display */}
          {currentSelectedShip && (
            <div className="max-w-sm mx-auto mb-6">
              <div className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-3">
                  <div className="text-2xl">🚀</div>
                  <div className="text-center">
                    <div className="text-sm text-emerald-400 font-medium">Selected Ship</div>
                    <h4 className="text-lg font-bold text-white">{currentSelectedShip.name}</h4>
                  </div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {/* Ship Selection Section */}
          <div className="space-y-4 max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Choose Your Spaceship
                {!isConnected && <span className="text-sm text-amber-400 ml-2">(Demo Mode)</span>}
              </h2>
              <div className="text-xs text-gray-400">
                {availableShips.length} Ships Available
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableShips.map((ship) => {
                const spaceshipStats = getSpaceshipStats(ship);
                const isSelected = currentSelectedShip?.id === ship.id;
                const isLoading = loadingShipId === ship.id;
                return (
                  <div
                    key={ship.id}
                    onClick={() => setSelectedShip(ship)}
                    className={`group bg-gray-900/60 backdrop-blur-sm border-2 rounded-lg p-2 cursor-pointer transition-all duration-300 hover:scale-105 relative overflow-hidden ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/25'
                        : 'border-gray-700/50 hover:border-gray-600/80'
                    }`}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}

                    {/* Ship header */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold" style={{ color: ship.color || '#10b981' }}>
                        {ship.name}
                      </h3>
                      <div className="text-lg group-hover:scale-110 transition-transform duration-300">
                        🚀
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-1 mb-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span>🚀</span>
                        <span className="text-gray-400">Engine:</span>
                        <span className="text-white font-semibold">{spaceshipStats.enginePower}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>🎯</span>
                        <span className="text-gray-400">Agility:</span>
                        <span className="text-white font-semibold">{spaceshipStats.maneuverability}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>⚡</span>
                        <span className="text-gray-400">Boost:</span>
                        <span className="text-white font-semibold">{spaceshipStats.boostCapacity}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>🛡️</span>
                        <span className="text-gray-400">Shield:</span>
                        <span className="text-white font-semibold">{spaceshipStats.shieldStrength}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>❤️</span>
                        <span className="text-gray-400">Health:</span>
                        <span className="text-white font-semibold">{spaceshipStats.health}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>⚡</span>
                        <span className="text-gray-400">Energy:</span>
                        <span className="text-white font-semibold">{spaceshipStats.energy}</span>
                      </div>
                    </div>

                    {/* Weapons and special ability */}
                    <div className="space-y-0.5 mb-2">
                      <div className="text-xs font-semibold text-orange-400">
                        🔫 {spaceshipStats.weapons}
                      </div>
                      <div className="text-xs text-emerald-400">
                        ✨ {spaceshipStats.specialAbility}
                      </div>
                    </div>

                    {/* Ship stats */}
                    <div className="text-xs text-gray-500 mb-2">
                      Wins: {ship.wins} • Combats: {ship.combats} • XP: {ship.experience}
                    </div>

                    {/* Staking status */}
                    <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${
                      ship.isStaked
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {ship.isStaked ? '🔒 STAKED' : '🔓 AVAILABLE'}
                    </div>

                    {/* Stake/Unstake buttons */}
                    {isConnected && contractConnected && contractPlayerShips.length > 0 && (
                      <div className="flex gap-2">
                        {ship.isStaked ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnstakeShip(ship.id, ship.name);
                            }}
                            disabled={isLoading}
                            className="flex-1 py-1 px-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white text-xs font-semibold rounded transition-colors duration-200 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Processing...' : 'Unstake'}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStakeShip(ship.id, ship.name);
                            }}
                            disabled={isLoading}
                            className="flex-1 py-1 px-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-black disabled:text-gray-400 text-xs font-semibold rounded transition-colors duration-200 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Processing...' : 'Stake Ship'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Show message when staking not available */}
                    {!isConnected && (
                      <div className="text-xs text-amber-400 text-center mt-2 italic">
                        Connect wallet to stake/unstake ships
                      </div>
                    )}

                    {isConnected && (!contractConnected || contractPlayerShips.length === 0) && (
                      <div className="text-xs text-amber-400 text-center mt-2 italic">
                        Purchase NFT ships to unlock staking
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Launch Mission Section */}
          <div className="text-center space-x-4">
            <button
              onClick={startGame}
              disabled={!currentSelectedShip}
              className={`px-6 py-3 text-lg font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                currentSelectedShip
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-black cursor-pointer shadow-lg'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentSelectedShip ? '🚀 Launch Mission' : '⚠️ Select Ship First'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-8 py-4 text-lg font-semibold bg-transparent text-white border-2 border-gray-600 hover:border-gray-500 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105"
              >
                ← Back to Menu
              </button>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="mt-8 flex gap-6 justify-center">
            {onNavigateToTournaments && (
              <button
                onClick={onNavigateToTournaments}
                className="px-6 py-3 text-base font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105"
              >
                🏆 Tournaments
              </button>
            )}
            {onNavigateToMenu && (
              <button
                onClick={onNavigateToMenu}
                className="px-6 py-3 text-base font-semibold bg-gray-600 hover:bg-gray-700 text-white rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105"
              >
                🏠 Main Menu
              </button>
            )}
          </div>

          {/* Controls Section */}
          <div className="mt-6 text-xs opacity-70">
            <h3 className="text-base font-semibold text-gray-300 mb-3">🎮 Controls:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-gray-400">
              <div className="flex items-center space-x-2">
                <span className="text-emerald-400">⌨️</span>
                <span>WASD / Arrow Keys: Move</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-cyan-400">🔫</span>
                <span>Space: Shoot</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">⚡</span>
                <span>Shift: Boost</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-red-400">🎯</span>
                <span>Destroy enemies and asteroids</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-amber-400">💎</span>
                <span>Collect energy crystals</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">🛡️</span>
                <span>Avoid enemy fire</span>
              </div>
            </div>
          </div>
        </div>

        {/* CSS animations for Tailwind */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }

          @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }


  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Compact Game HUD */}
      <div className="absolute top-3 left-3 z-50 space-y-2">
        {/* Main Stats Panel - Compact */}
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-lg p-2 w-[200px] shadow-xl">
          <div className="space-y-2">
            {/* Health & Energy - Horizontal */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <div className="text-red-400 text-sm">🛡️</div>
                  <span className="text-red-300 text-xs">{gameState.health}%</span>
                </div>
                <div className="flex-1 mx-2 bg-gray-800/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
                    style={{ width: `${gameState.health}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <div className="text-cyan-400 text-sm">⚡</div>
                  <span className="text-cyan-300 text-xs">{gameState.energy}%</span>
                </div>
                <div className="flex-1 mx-2 bg-gray-800/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${gameState.energy}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Score and Wave - Compact */}
            <div className="flex items-center justify-between bg-amber-500/20 border border-amber-500/30 rounded p-1">
              <div className="flex items-center space-x-1">
                <div className="text-amber-400 text-sm">🎯</div>
                <span className="text-white font-bold text-sm">{gameState.score.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-amber-300 text-xs">W</span>
                <span className="text-white font-bold text-sm">{gameState.currentWave}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Combat Stats Panel - Compact */}
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-lg p-2 w-[200px] shadow-xl">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-red-400 text-sm">💥</div>
              <div className="text-white font-bold text-sm">{gameState.enemiesDestroyed}</div>
            </div>
            <div className="text-center">
              <div className="text-orange-400 text-sm">🪨</div>
              <div className="text-white font-bold text-sm">{gameState.asteroidsDestroyed}</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 text-sm">💎</div>
              <div className="text-white font-bold text-sm">{gameState.resourcesCollected}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Back Button */}
      <div className="absolute top-3 right-3 z-50">
        <button
          onClick={() => {
            setGameRunning(false);
            setShowMenu(true);
            setGameOver(false);
            // Reset game state
            setGameState({
              health: 100,
              score: 0,
              energy: 100,
              enemiesDestroyed: 0,
              asteroidsDestroyed: 0,
              resourcesCollected: 0,
              currentWave: 1,
            });
          }}
          className="bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/70 rounded-lg p-2 shadow-xl transition-all duration-300 group hover:scale-105"
        >
          <div className="flex items-center space-x-1 text-gray-300 group-hover:text-white">
            <div className="text-sm">←</div>
            <span className="font-medium text-xs">Exit</span>
          </div>
        </button>
      </div>

      {/* Modern Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="text-center space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <h2 className="font-space text-4xl font-bold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
                  Mission Failed! 💥
                </h2>
                <p className="text-gray-400 text-lg">Your ship couldn't withstand the assault</p>
              </div>

              {/* Final Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4">
                  <div className="text-amber-400 text-2xl">🎯</div>
                  <div className="text-white font-bold text-xl">{gameState.score.toLocaleString()}</div>
                  <div className="text-amber-300 text-sm">Final Score</div>
                </div>
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-purple-400 text-2xl">🌊</div>
                  <div className="text-white font-bold text-xl">{gameState.currentWave}</div>
                  <div className="text-purple-300 text-sm">Wave Reached</div>
                </div>
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                  <div className="text-red-400 text-2xl">💥</div>
                  <div className="text-white font-bold text-xl">{gameState.enemiesDestroyed}</div>
                  <div className="text-red-300 text-sm">Enemies Defeated</div>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
                  <div className="text-emerald-400 text-2xl">💎</div>
                  <div className="text-white font-bold text-xl">{gameState.resourcesCollected}</div>
                  <div className="text-emerald-300 text-sm">Resources</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={restartGame}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  🔄 Play Again
                </button>
                <button
                  onClick={() => {
                    setGameOver(false);
                    setShowMenu(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  🚀 New Mission
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-transparent border-2 border-gray-600 hover:border-gray-500 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    ← Main Menu
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Three.js Mount Point */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default SpaceFleetGame;
