
import { Direction, Inventory } from './types';

export const GRID_WIDTH = 40; 
export const GRID_HEIGHT = 40;
export const VIEWPORT_WIDTH_TILES = 15;
export const VIEWPORT_HEIGHT_TILES = 10;

export const TILE_SIZE = 48; 
export const AUTO_SAVE_INTERVAL_MS = 60 * 1000; // Save every minute

export const QUOTA_TARGET = 40;
export const MAX_DAYS = 7;

// Horror Palette
export const PALETTE = {
  TRANSPARENT: 'transparent',
  GRASS_BASE: '#1a261a', 
  GRASS_LIGHT: '#2d3e2d',
  DIRT_BASE: '#3a2e25', 
  DIRT_LIGHT: '#4a3c31',
  DIRT_WATERED: '#1f1813',
  WATER_BASE: '#0f1a24', 
  WATER_SHORE: '#1a2e3a',
  WOOD_DARK: '#2d1e1e',
  WOOD_LIGHT: '#4a3232',
  RED_BARN: '#5e1515', 
  RED_BARN_BRIGHT: '#8b1e1e',
  WHITE: '#d1d1d1', 
  SKIN: '#9e7a61',
  OVERALLS: '#1a2b3c',
  SHIRT: '#4e1212',
  HAT: '#705139',
  BLACK: '#050505',
  STONE: '#3d3d3d',
  STONE_LIGHT: '#525252',
  WHEAT: '#a68a37', 
  CORN: '#bfa02a',
  PLANT_GREEN: '#2a4d2a' 
};

export const SPRITES: Record<string, string[]> = {
  // 16x16 Entities
  FARMER_DOWN: [
    "................",
    ".....xxxxxx.....",
    "....xxxxxxxx....",
    "....xxxxxxxx....",
    "...xxxxxxxxxx...",
    "...xxxxxxxxxx...",
    "....oooooooo....",
    "....o.oo.o.o....",
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
    ".....ooooooo....",
    ".....o.oooo.....",
    "....yyyyyyyy....",
    "...yyyyyyyyyy...",
    "...yyyyyyyyyy...",
    "...zzzzzzzzzz...",
    "...zzzzzzzzzz...",
    "....zzzz........",
    "....zzzz........",
    "................"
  ],
  
  // 8x8 Tiles
  GRASS: [
    "ghgggggg",
    "gggggggg",
    "ggggghgg",
    "gggggggg",
    "gghggggg",
    "gggggggg",
    "gggggghg",
    "gggggggg"
  ],
  DIRT: [
    "dddddddd",
    "dldddddd",
    "dddddddd",
    "ddddddld",
    "dddddddd",
    "dldddddd",
    "dddddddd",
    "dddddddd"
  ],
  ROCK: [
    "........",
    "..ssss..",
    ".ssllss.",
    ".slllls.",
    ".ssllss.",
    "..ssss..",
    "........",
    "........"
  ],
  STUMP: [
    "........",
    "...ww...",
    "..wwww..",
    ".wwwwww.",
    ".wwwwww.",
    "..wwww..",
    "........",
    "........"
  ],
  CROP_0: [
    "........",
    "........",
    "........",
    "........",
    "....g...",
    "...ggg..",
    "....g...",
    "........"
  ],
  CROP_1: [
    "........",
    "....g...",
    "...ggg..",
    "....g...",
    "....g...",
    "....g...",
    "....g...",
    "........"
  ],
  CROP_2: [
    "....y...",
    "...yyy..",
    "....y...",
    "....g...",
    "...ggg..",
    "....g...",
    "....g...",
    "........"
  ],
  CROP_3: [
    "...yyy..",
    "..yyyyy.",
    "...yyy..",
    "....g...",
    "...ggg..",
    "..ggggg.",
    "...ggg..",
    "....g..."
  ],
  
  // Barn Tiles
  BARN_TL: [
    "........",
    "....wwww",
    "..wwwwww",
    ".wwwwwww",
    "wwwwwwww",
    "rrrrrrrr",
    "rbrrrrrr",
    "rbrrrrrr"
  ],
  BARN_TR: [
    "........",
    "wwww....",
    "wwwwww..",
    "wwwwwww.",
    "wwwwwwww",
    "rrrrrrrr",
    "rrrrrrbr",
    "rrrrrrbr"
  ],
  BARN_BL: [
    "rbrrrrrr",
    "rrrrrrrr",
    "rrdddddd",
    "rrdxdddd",
    "rrddxddd",
    "rrdddxdd",
    "rrddddxd",
    "rrdddddd"
  ],
  BARN_BR: [
    "rrrrrrbr",
    "rrrrrrrr",
    "ddddddrr",
    "ddddxdrr",
    "dddxddrr",
    "ddxdddrr",
    "dxddddrr",
    "ddddddrr"
  ],

  // Tools
  HOE: [
    "........",
    "....www.",
    "....w.w.",
    "...w....",
    "...w....",
    "..w.....",
    "..w.....",
    "........"
  ],
  SCYTHE: [
    "........",
    "..wwww..",
    ".w......",
    ".w......",
    "..w.....",
    "..w.....",
    "...w....",
    "........"
  ],
  CAN: [
    "........",
    "...bbb..",
    "..bbbbb.",
    "wbbbbbb.",
    "wbbbbbb.",
    "..bbbbb.",
    "........",
    "........"
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
    WHEAT: 20,
    CORN: 20
  },
  crops: {
    WHEAT: 0,
    CORN: 0
  },
  tools: []
};
