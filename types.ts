export enum TileType {
  GRASS = 'GRASS',
  DIRT = 'DIRT',
  WATER = 'WATER',
  BARN_TL = 'BARN_TL', // Top Left
  BARN_TR = 'BARN_TR', // Top Right
  BARN_BL = 'BARN_BL', // Bottom Left
  BARN_BR = 'BARN_BR', // Bottom Right
  FENCE = 'FENCE',
  ROCK = 'ROCK',
  STUMP = 'STUMP'
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export enum GameStatus {
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST'
}

export interface Player {
  x: number;
  y: number;
  facing: Direction;
  energy: number;
}

export interface Crop {
  type: 'WHEAT' | 'CORN';
  growthStage: number; // 0-3
  plantedAt: number;
}

export interface TileData {
  type: TileType;
  crop?: Crop;
  isCollidable: boolean;
}

export interface Inventory {
  seeds: {
    WHEAT: number;
    CORN: number;
  };
  crops: {
    WHEAT: number;
    CORN: number;
  }
}

export interface GameState {
  grid: TileData[][];
  player: Player;
  inventory: Inventory;
  selectedSeed: 'WHEAT' | 'CORN';
  day: number;
  harvestedTotal: number;
  gameStatus: GameStatus;
  lastSaved: number;
}

export type PixelMap = string[];