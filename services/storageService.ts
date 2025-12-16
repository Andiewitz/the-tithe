import { GameState, GameStatus } from '../types';
import { INITIAL_INVENTORY } from '../constants';

const STORAGE_KEY = 'PIXEL_FARM_8x8_SAVE_V5';

export const loadGame = (): GameState | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    
    // Simple schema validation
    if (!parsed || !parsed.grid || !parsed.player || typeof parsed.player.x !== 'number') {
        console.warn("Invalid save data found, resetting.");
        return null;
    }

    // Migration
    if (!parsed.gameStatus) parsed.gameStatus = GameStatus.PLAYING;
    if (typeof parsed.harvestedTotal !== 'number') parsed.harvestedTotal = 0;
    if (!parsed.inventory) {
      parsed.inventory = INITIAL_INVENTORY;
      parsed.selectedSeed = 'WHEAT';
    }
    
    return parsed;
  } catch (error) {
    console.error("Failed to load game:", error);
    return null;
  }
};

export const saveGame = (state: GameState): boolean => {
  try {
    const stateToSave = {
      ...state,
      lastSaved: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    return true;
  } catch (error) {
    console.error("Failed to save game:", error);
    return false;
  }
};

export const clearSave = () => {
  localStorage.removeItem(STORAGE_KEY);
};