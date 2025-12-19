
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, TileType, Direction, TileData, GameStatus, Inventory, ToolType } from '../types';
import { GRID_HEIGHT, GRID_WIDTH, INITIAL_PLAYER, AUTO_SAVE_INTERVAL_MS, INITIAL_INVENTORY, QUOTA_TARGET, MAX_DAYS } from '../constants';
import { loadGame, saveGame, clearSave } from '../services/storageService';

const createInitialGrid = (): TileData[][] => {
  const grid: TileData[][] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      let type = TileType.GRASS;
      let isCollidable = false;

      if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
        type = TileType.FENCE;
        isCollidable = true;
      }
      
      if (y === 5 && x === 8) { type = TileType.BARN_TL; isCollidable = true; }
      if (y === 5 && x === 9) { type = TileType.BARN_TR; isCollidable = true; }
      if (y === 6 && x === 8) { type = TileType.BARN_BL; isCollidable = true; }
      if (y === 6 && x === 9) { type = TileType.BARN_BR; isCollidable = true; }

      if (y > 30 && y < 35 && x > 30 && x < 36) {
          type = TileType.WATER;
          isCollidable = true;
      }

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

      row.push({ type, isCollidable, isWatered: false });
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
  selectedTool: 'NONE',
  canIsFull: false,
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

      if (prev.grid[newY][newX].isCollidable) {
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

  const calculateSleep = (currentState: GameState): GameState => {
      const nextDay = currentState.day + 1;
      let newStatus = GameStatus.PLAYING;

      if (nextDay > MAX_DAYS) {
          if (currentState.harvestedTotal >= QUOTA_TARGET) {
              newStatus = GameStatus.WON;
          } else {
              newStatus = GameStatus.LOST;
          }
      }

      const newGrid = currentState.grid.map(row => row.map(tile => {
          let updatedTile = { ...tile, isWatered: false }; // Dries out overnight
          if (tile.crop && tile.crop.growthStage < 3) {
               // Watered crops grow faster
               const growthChance = tile.isWatered ? 0.6 : 0.2;
               const growth = Math.random() < growthChance ? 1 : 0;
               updatedTile.crop = { ...tile.crop, growthStage: Math.min(3, tile.crop.growthStage + growth) };
          }
          return updatedTile;
      }));

      return {
          ...currentState,
          day: nextDay,
          grid: newGrid,
          gameStatus: newStatus
      };
  };

  const interact = useCallback(() => {
    setGameState(prev => {
      if (prev.gameStatus !== GameStatus.PLAYING) return prev;

      const { x, y } = prev.player;
      const targetTile = prev.grid[y][x];
      const newGrid = prev.grid.map(row => [...row]);
      let newInventory: Inventory = { 
        seeds: { ...prev.inventory.seeds },
        crops: { ...prev.inventory.crops },
        tools: [...prev.inventory.tools]
      };
      let newHarvestedTotal = prev.harvestedTotal;
      let newCanIsFull = prev.canIsFull;

      // 1. Tool Logic
      if (prev.selectedTool === 'HOE' && targetTile.type === TileType.GRASS) {
          newGrid[y][x] = { ...targetTile, type: TileType.DIRT };
          return { ...prev, grid: newGrid };
      }

      if (prev.selectedTool === 'SCYTHE' && targetTile.crop && targetTile.crop.growthStage >= 3) {
          const cropType = targetTile.crop.type;
          newGrid[y][x] = { ...targetTile, crop: undefined };
          newInventory.crops[cropType] += 1;
          newHarvestedTotal += 1;
          
          if (Math.random() > 0.4) {
              newInventory.seeds[cropType] += 1;
          }
          return { ...prev, grid: newGrid, inventory: newInventory, harvestedTotal: newHarvestedTotal };
      }

      if (prev.selectedTool === 'CAN') {
          // Check for water source nearby to refill
          let nearWater = false;
          const neighbors = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]];
          for (const [dx, dy] of neighbors) {
              if (prev.grid[y + dy]?.[x + dx]?.type === TileType.WATER) nearWater = true;
          }

          if (nearWater) {
              return { ...prev, canIsFull: true };
          }

          if (prev.canIsFull && (targetTile.type === TileType.DIRT || targetTile.crop)) {
              newGrid[y][x] = { ...targetTile, isWatered: true };
              return { ...prev, grid: newGrid, canIsFull: false };
          }
      }

      // 2. Facing Interactions (Barn, Debris)
      let faceX = x, faceY = y;
      switch (prev.player.facing) {
          case Direction.UP: faceY--; break;
          case Direction.DOWN: faceY++; break;
          case Direction.LEFT: faceX--; break;
          case Direction.RIGHT: faceX++; break;
      }
      const facedTile = prev.grid[faceY]?.[faceX];
      
      if (facedTile) {
          if ([TileType.BARN_BL, TileType.BARN_BR, TileType.BARN_TL, TileType.BARN_TR].includes(facedTile.type)) {
              // Note: Handling Tool shed trigger elsewhere via UI or here
              return calculateSleep(prev);
          }
          // Debris still clearable without tools for now? Or maybe scythe/hoe?
          // Let's make them clearable with Hoe/Scythe
          if ((prev.selectedTool === 'HOE' && facedTile.type === TileType.ROCK) || 
              (prev.selectedTool === 'SCYTHE' && facedTile.type === TileType.STUMP)) {
              newGrid[faceY][faceX] = { ...facedTile, type: TileType.GRASS, isCollidable: false };
              return { ...prev, grid: newGrid };
          }
      }

      return prev;
    });
  }, []);

  const plant = useCallback(() => {
    setGameState(prev => {
      if (prev.gameStatus !== GameStatus.PLAYING) return prev;

      const { x, y } = prev.player;
      const targetTile = prev.grid[y][x];
      const seedType = prev.selectedSeed;
      const seedCount = prev.inventory.seeds[seedType];

      if (targetTile.type === TileType.DIRT && !targetTile.crop && seedCount > 0) {
        const newGrid = prev.grid.map(row => [...row]);
        const newInventory = { 
          seeds: { ...prev.inventory.seeds, [seedType]: seedCount - 1 },
          crops: { ...prev.inventory.crops },
          tools: [...prev.inventory.tools]
        };

        newGrid[y][x] = {
            ...targetTile,
            crop: {
                type: seedType,
                growthStage: 0,
                plantedAt: Date.now()
            }
        };

        return { ...prev, grid: newGrid, inventory: newInventory };
      }

      return prev;
    });
  }, []);

  const selectSeed = (seed: 'WHEAT' | 'CORN') => {
      setGameState(prev => ({ ...prev, selectedSeed: seed }));
  };

  const selectTool = (tool: ToolType) => {
      setGameState(prev => ({ ...prev, selectedTool: tool }));
  };

  const acquireTool = (tool: ToolType) => {
      setGameState(prev => {
          if (prev.inventory.tools.includes(tool)) return prev;
          return {
              ...prev,
              inventory: {
                  ...prev.inventory,
                  tools: [...prev.inventory.tools, tool]
              },
              selectedTool: tool
          };
      });
  };

  const resetGame = () => {
      clearSave();
      window.location.reload();
  };

  useEffect(() => {
    if (gameState.gameStatus !== GameStatus.PLAYING) return;
    const growInterval = setInterval(() => {
        setGameState(prev => {
            let changed = false;
            const newGrid = prev.grid.map(row => row.map(tile => {
                if (tile.crop && tile.crop.growthStage < 3) {
                    // Watered tiles grow way faster
                    const growthChance = tile.isWatered ? 0.15 : 0.05;
                    if (Math.random() < growthChance) {
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

  useEffect(() => {
    const intervalId = setInterval(() => {
        if (stateRef.current.gameStatus === GameStatus.PLAYING) {
            saveGame(stateRef.current);
        }
    }, AUTO_SAVE_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  return {
    gameState,
    movePlayer,
    interact,
    plant,
    selectSeed,
    selectTool,
    acquireTool,
    resetGame
  };
};
