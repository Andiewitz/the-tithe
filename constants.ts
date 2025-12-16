import { Direction, TileType, Inventory } from './types';

export const GRID_WIDTH = 40; 
export const GRID_HEIGHT = 40;
export const VIEWPORT_WIDTH_TILES = 15;
export const VIEWPORT_HEIGHT_TILES = 10;

export const TILE_SIZE = 48; 
export const AUTO_SAVE_INTERVAL_MS = 5 * 60 * 1000; 

export const QUOTA_TARGET = 50;
export const MAX_DAYS = 7;

// Horror Palette
export const PALETTE = {
  TRANSPARENT: 'transparent',
  GRASS_BASE: '#1a261a', // Darker, gloomy grass
  GRASS_LIGHT: '#2d3e2d',
  DIRT_BASE: '#4a3c31', // Desaturated dirt
  WATER_BASE: '#1a2e3a', // Dark water
  WOOD_DARK: '#2d1e1e',
  WOOD_LIGHT: '#4a3232',
  RED_BARN: '#6e1a1a', // Blood red barn
  WHITE: '#a0a0a0', // Dim white
  SKIN: '#b08d74',
  OVERALLS: '#203c50',
  SHIRT: '#6e1a1a',
  HAT: '#8f684b',
  BLACK: '#050505',
  STONE: '#3d3d3d',
  STONE_LIGHT: '#525252',
  WHEAT: '#bfa143', // Dull gold
  CORN: '#c29219',
  PLANT_GREEN: '#365c36' // Dark green crops
};

export const SPRITES: Record<string, string[]> = {
  FARMER_DOWN: [
    "................",
    ".....xxxxxx.....",
    "....xxxxxxxx....",
    "....xxxxxxxx....",
    "...xxxxxxxxxx...",
    "...xxxxxxxxxx...",
    "....oooooooo....",
    "....oooooooo....",
    "....oooooooo....",
    "...yyyyyyyyyy...",
    "...yyyyyyyyyy...",
    "...zzzzzzzzzz...",
    "...zzzzzzzzzz...",
    "...zz..zz..zz...",
    "...zz..zz..zz...",
    "................"
  ],
  FARMER_UP: [
    "................",
    ".....xxxxxx.....",
    "....xxxxxxxx....",
    "....xxxxxxxx....",
    "...xxxxxxxxxx...",
    "...xxxxxxxxxx...",
    "...xxxxxxxxxx...",
    "....yyyyyyyy....",
    "...yyyyyyyyyy...",
    "...yyyyyyyyyy...",
    "...yyyyyyyyyy...",
    "...zzzzzzzzzz...",
    "...zzzzzzzzzz...",
    "...zz..zz..zz...",
    "...zz..zz..zz...",
    "................"
  ],
  FARMER_SIDE: [
    "................",
    ".....xxxxxx.....",
    "....xxxxxxxx....",
    "....xxxxxxxx....",
    "....xxxxxxxxxx..",
    "....xxxxxxxxxx..",
    ".....oooooo.....",
    ".....oooooo.....",
    "....yyyyyyyy....",
    "...yyyyyyyyyy...",
    "...yyyyyyyyyy...",
    "...zzzzzzzzzz...",
    "...zzzzzzzzzz...",
    "....zzzz........",
    "....zzzz........",
    "................"
  ],
  GRASS: [
    "gggggggggggggggg",
    "gggghggggggggggg",
    "ggghghgggggggggg",
    "gggggggggggggggg",
    "ggggggggggghgggg",
    "ggggggggggghhggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gghggggggggggggg",
    "ghhhgggggggggggg",
    "gggggggggggggggg",
    "ggggggggggghgggg",
    "gggggggggghhgggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg"
  ],
  ROCK: [
    "................",
    "................",
    "......ssss......",
    "....ssssssss....",
    "...ssssssssss...",
    "..ssssllssssss..",
    "..sssslllsssss..",
    "..ssssllssssss..",
    "..ssssssssssss..",
    "...ssssssssss...",
    "....ssssssss....",
    ".....ssssss.....",
    "................",
    "................",
    "................",
    "................"
  ],
  STUMP: [
    "................",
    "................",
    "................",
    "......w..w......",
    ".....wwwwww.....",
    "....wwwwwwww....",
    "....wwwwwwww....",
    "....wwwwwwww....",
    "....wwwwwwww....",
    ".....wwwwww.....",
    ".....wwwwww.....",
    "....wwwwwwww....",
    "................",
    "................",
    "................",
    "................"
  ],
  CROP_0: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".......g........",
    "......ggg.......",
    ".......g........",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................"
  ],
  CROP_1: [
    "................",
    "................",
    "................",
    "................",
    ".......gg.......",
    "......gggg......",
    ".......gg.......",
    ".......gg.......",
    ".......gg.......",
    ".......gg.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................"
  ],
  CROP_2: [
    "................",
    "................",
    ".......yy.......",
    "......yyyy......",
    ".......yy.......",
    ".......gg.......",
    "......gggg......",
    ".......gg.......",
    ".......gg.......",
    ".......gg.......",
    ".......gg.......",
    "................",
    "................",
    "................",
    "................",
    "................"
  ],
  CROP_3: [
    "................",
    ".......yy.......",
    "......yyyy......",
    ".....yyyyyy.....",
    "......yyyy......",
    ".......gg.......",
    "......gggg......",
    ".....gggggg.....",
    "......gggg......",
    ".......gg.......",
    ".......gg.......",
    ".......gg.......",
    "................",
    "................",
    "................",
    "................"
  ]
};

export const INITIAL_PLAYER = {
  x: 20,
  y: 20,
  facing: Direction.DOWN,
  energy: 100
};

export const INITIAL_INVENTORY: Inventory = {
  seeds: {
    WHEAT: 25,
    CORN: 25
  },
  crops: {
    WHEAT: 0,
    CORN: 0
  }
};