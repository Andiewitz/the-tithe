import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, TileType, Direction, TileData, GameStatus } from '../types';
import { GRID_HEIGHT, GRID_WIDTH, INITIAL_PLAYER, AUTO_SAVE_INTERVAL_MS, INITIAL_INVENTORY, QUOTA_TARGET, MAX_DAYS } from '../constants';
import { loadGame, saveGame, clearSave } from '../services/storageService';

const createInitialGrid = (): TileData[][] => {
  const grid: TileData[][] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      let type = TileType.GRASS;
      let isCollidable = false;

      // Outer Fences
      if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
        type = TileType.FENCE;
        isCollidable = true;
      }
      
      // Barn (Sleep Spot)
      if (y === 5 && x === 8) { type = TileType.BARN_TL; isCollidable = true; }
      if (y === 5 && x === 9) { type = TileType.BARN_TR; isCollidable = true; }
      if (y === 6 && x === 8) { type = TileType.BARN_BL; isCollidable = true; }
      if (y === 6 && x === 9) { type = TileType.BARN_BR; isCollidable = true; }

      // Pond
      if (y > 30 && y < 35 && x > 30 && x < 36) {
          type = TileType.WATER;
          isCollidable = true;
      }

      // Debris
      if (type === TileType.GRASS && Math.random() < 0.08) {
          if (Math.abs(x - 20) > 3 || Math.abs(y - 20) > 3) {
             if (Math.random() > 0.5) {
                type = TileType.ROCK;
                isCollidable = true;
             } else {
                type = TileType.STUMP;
                isCollidable = true;
             }
          }
      }

      row.push({ type, isCollidable });
    }
    grid.push(row);
  }
  return grid;
};

const INITIAL_STATE: GameState = {
  grid: createInitialGrid(),
  player: INITIAL_PLAYER,
  inventory: INITIAL_INVENTORY,
  selectedSeed: 'WHEAT',
  day: 1,
  harvestedTotal: 0,
  gameStatus: GameStatus.PLAYING,
  lastSaved: 0,
};

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const loaded = loadGame();
    return loaded || INITIAL_STATE;
  });

  const stateRef = useRef(gameState);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  const movePlayer = useCallback((dx: number, dy: number, direction: Direction) => {
    setGameState(prev => {
      if (prev.gameStatus !== GameStatus.PLAYING) return prev;

      const newX = prev.player.x + dx;
      const newY = prev.player.y + dy;

      if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) {
        return { ...prev, player: { ...prev.player, facing: direction } };
      }

      if (!prev.grid[newY] || !prev.grid[newY][newX]) {
        return { ...prev, player: { ...prev.player, facing: direction } };
      }

      // Check collision
      if (prev.grid[newY][newX].isCollidable) {
         // Special case: If walking into barn door area (bottom center), trigger Sleep?
         // For simplicity, collision with barn is hard, sleep must be triggered by action
         return { ...prev, player: { ...prev.player, facing: direction } };
      }

      return {
        ...prev,
        player: {
          ...prev.player,
          x: newX,
          y: newY,
          facing: direction
        }
      };
    });
  }, []);

  // Actions now happen AT THE FEET
  const till = useCallback(() => {
    setGameState(prev => {
      if (prev.gameStatus !== GameStatus.PLAYING) return prev;

      const { x, y } = prev.player;
      
      if (!prev.grid[y] || !prev.grid[y][x]) return prev;

      const targetTile = prev.grid[y][x];
      const newGrid = prev.grid.map(row => [...row]);
      let newInventory = { ...prev.inventory };
      let newHarvestedTotal = prev.harvestedTotal;

      // 1. Harvest Crop (Priority)
      if (targetTile.crop && targetTile.crop.growthStage >= 3) {
          const cropType = targetTile.crop.type;
          newGrid[y][x] = { ...targetTile, crop: undefined };
          newInventory.crops = { 
              ...newInventory.crops, 
              [cropType]: newInventory.crops[cropType] + 1 
          };
          newHarvestedTotal += 1;
          
          // Seed return chance
          if (Math.random() > 0.4) {
              newInventory.seeds = {
                  ...newInventory.seeds,
                  [cropType]: newInventory.seeds[cropType] + 1
              };
          }
          return { ...prev, grid: newGrid, inventory: newInventory, harvestedTotal: newHarvestedTotal };
      }

      // 2. Clear Debris (If standing on it? No, debris is collidable, must face it)
      // Since we changed to "at feet", we can't clear collidable debris we are standing on (impossible).
      // Re-introducing "Face Action" ONLY for Debris/Barn
      let faceX = x, faceY = y;
      switch (prev.player.facing) {
          case Direction.UP: faceY--; break;
          case Direction.DOWN: faceY++; break;
          case Direction.LEFT: faceX--; break;
          case Direction.RIGHT: faceX++; break;
      }
      const facedTile = prev.grid[faceY]?.[faceX];
      
      if (facedTile) {
          // Sleep at Barn
          if ([TileType.BARN_BL, TileType.BARN_BR, TileType.BARN_TL, TileType.BARN_TR].includes(facedTile.type)) {
              return sleep(prev);
          }
          // Clear Obstacle
          if (facedTile.type === TileType.STUMP || facedTile.type === TileType.ROCK) {
              newGrid[faceY][faceX] = { ...facedTile, type: TileType.GRASS, isCollidable: false };
              return { ...prev, grid: newGrid };
          }
      }

      // 3. Till Grass -> Dirt (At Feet)
      if (targetTile.type === TileType.GRASS) {
         newGrid[y][x] = { ...targetTile, type: TileType.DIRT };
         return { ...prev, grid: newGrid };
      }

      return prev;
    });
  }, []);

  const plant = useCallback(() => {
    setGameState(prev => {
      if (prev.gameStatus !== GameStatus.PLAYING) return prev;

      const { x, y } = prev.player; // At feet
      const targetTile = prev.grid[y][x];
      const seedType = prev.selectedSeed;
      const seedCount = prev.inventory.seeds[seedType];

      if (targetTile.type === TileType.DIRT && !targetTile.crop && seedCount > 0) {
        const newGrid = prev.grid.map(row => [...row]);
        const newInventory = { ...prev.inventory };

        newGrid[y][x] = {
            ...targetTile,
            crop: {
                type: seedType,
                growthStage: 0,
                plantedAt: Date.now()
            }
        };

        newInventory.seeds = {
            ...newInventory.seeds,
            [seedType]: seedCount - 1
        };

        return { ...prev, grid: newGrid, inventory: newInventory };
      }

      return prev;
    });
  }, []);

  const sleep = (currentState: GameState): GameState => {
      const nextDay = currentState.day + 1;
      let newStatus = GameStatus.PLAYING;

      // Check Doom Condition
      if (nextDay > MAX_DAYS) {
          if (currentState.harvestedTotal >= QUOTA_TARGET) {
              newStatus = GameStatus.WON;
          } else {
              newStatus = GameStatus.LOST;
          }
      }

      // Grow Crops heavily on sleep
      const newGrid = currentState.grid.map(row => row.map(tile => {
          if (tile.crop && tile.crop.growthStage < 3) {
               // 80% chance to grow 1 stage, 20% to grow 2 stages
               const growth = Math.random() < 0.2 ? 2 : 1;
               return {
                   ...tile,
                   crop: { ...tile.crop, growthStage: Math.min(3, tile.crop.growthStage + growth) }
               };
          }
          return tile;
      }));

      saveGame({
          ...currentState,
          day: nextDay,
          grid: newGrid,
          gameStatus: newStatus
      });

      return {
          ...currentState,
          day: nextDay,
          grid: newGrid,
          gameStatus: newStatus
      };
  };

  const selectSeed = (seed: 'WHEAT' | 'CORN') => {
      setGameState(prev => ({ ...prev, selectedSeed: seed }));
  };

  const resetGame = () => {
      clearSave();
      window.location.reload();
  };

  // Minor passive growth (optional, keeping it slow for realism)
  useEffect(() => {
    if (gameState.gameStatus !== GameStatus.PLAYING) return;
    const growInterval = setInterval(() => {
        setGameState(prev => {
            let changed = false;
            const newGrid = prev.grid.map(row => row.map(tile => {
                if (tile.crop && tile.crop.growthStage < 3) {
                    if (Math.random() < 0.05) { // Very slow real-time growth
                        changed = true;
                        return {
                            ...tile,
                            crop: { ...tile.crop, growthStage: tile.crop.growthStage + 1 }
                        };
                    }
                }
                return tile;
            }));
            return changed ? { ...prev, grid: newGrid } : prev;
        });
    }, 2000); 
    return () => clearInterval(growInterval);
  }, [gameState.gameStatus]);

  // Auto-Save
  useEffect(() => {
    const intervalId = setInterval(() => {
        if (stateRef.current.gameStatus === GameStatus.PLAYING) {
            saveGame(stateRef.current);
        }
    }, AUTO_SAVE_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  const manualSave = () => {
      saveGame(stateRef.current);
      setGameState(prev => ({...prev, lastSaved: Date.now()}));
  };

  return {
    gameState,
    manualSave,
    movePlayer,
    till,
    plant,
    selectSeed,
    resetGame
  };
};