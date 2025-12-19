
import React from 'react';
import { GameState, TileType, Direction, TileData } from '../types';
import { TILE_SIZE, SPRITES, PALETTE, GRID_WIDTH, GRID_HEIGHT, VIEWPORT_WIDTH_TILES, VIEWPORT_HEIGHT_TILES } from '../constants';
import PixelTile from './PixelTile';

interface WorldRendererProps {
  gameState: GameState;
}

const WorldRenderer: React.FC<WorldRendererProps> = ({ gameState }) => {
  const { grid, player } = gameState;

  const viewportWidthPx = VIEWPORT_WIDTH_TILES * TILE_SIZE;
  const viewportHeightPx = VIEWPORT_HEIGHT_TILES * TILE_SIZE;
  const mapWidthPx = GRID_WIDTH * TILE_SIZE;
  const mapHeightPx = GRID_HEIGHT * TILE_SIZE;

  let camX = (player.x * TILE_SIZE) + (TILE_SIZE / 2) - (viewportWidthPx / 2);
  let camY = (player.y * TILE_SIZE) + (TILE_SIZE / 2) - (viewportHeightPx / 2);

  camX = Math.max(0, Math.min(camX, mapWidthPx - viewportWidthPx));
  camY = Math.max(0, Math.min(camY, mapHeightPx - viewportHeightPx));

  const renderTile = (type: TileType, x: number, y: number, tileData: TileData) => {
    let sprite: string[] | undefined = SPRITES.GRASS;
    let colorMap: Record<string, string> = { 'g': PALETTE.GRASS_BASE, 'h': PALETTE.GRASS_LIGHT };
    let baseColor = PALETTE.GRASS_BASE;

    switch (type) {
      case TileType.DIRT:
        baseColor = PALETTE.DIRT_BASE;
        colorMap = { 'g': PALETTE.DIRT_BASE, 'h': PALETTE.DIRT_BASE }; 
        break;
      case TileType.WATER:
        baseColor = PALETTE.WATER_BASE;
        colorMap = { 'g': PALETTE.WATER_BASE, 'h': '#1e3a4a' };
        break;
      case TileType.BARN_TL:
      case TileType.BARN_TR:
      case TileType.BARN_BL:
      case TileType.BARN_BR:
        baseColor = PALETTE.RED_BARN; 
        sprite = undefined; 
        break;
      case TileType.FENCE:
        baseColor = PALETTE.WOOD_DARK;
        sprite = undefined;
        break;
      case TileType.ROCK:
        baseColor = PALETTE.GRASS_BASE;
        sprite = SPRITES.ROCK;
        colorMap = { 's': PALETTE.STONE, 'l': PALETTE.STONE_LIGHT };
        break;
      case TileType.STUMP:
        baseColor = PALETTE.GRASS_BASE;
        sprite = SPRITES.STUMP;
        colorMap = { 'w': PALETTE.WOOD_DARK };
        break;
    }

    let cropElement = null;
    if (tileData.crop) {
        const stage = Math.min(3, tileData.crop.growthStage);
        const cropSprite = SPRITES[`CROP_${stage}`];
        
        let cropColor = PALETTE.PLANT_GREEN;
        if (stage >= 2 && tileData.crop.type === 'WHEAT') cropColor = PALETTE.WHEAT;
        if (stage >= 2 && tileData.crop.type === 'CORN') cropColor = PALETTE.CORN;

        const cropMap = { 'g': PALETTE.PLANT_GREEN, 'y': cropColor };
        
        cropElement = (
            <div className="absolute inset-0 z-10 pointer-events-none">
                <PixelTile sprite={cropSprite} colorMap={cropMap} baseColor={PALETTE.TRANSPARENT} />
            </div>
        );
    }

    return (
      <div 
        key={`tile-${x}-${y}`}
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          position: 'absolute',
          left: x * TILE_SIZE,
          top: y * TILE_SIZE,
        }}
      >
        <PixelTile 
            sprite={sprite} 
            colorMap={colorMap} 
            baseColor={baseColor}
        />
        {cropElement}

        {(type === TileType.BARN_TL) && <div className="absolute inset-0 bg-white/10 border-t-4 border-l-4 border-white/20" />}
        {(type === TileType.BARN_TR) && <div className="absolute inset-0 bg-white/10 border-t-4 border-r-4 border-white/20" />}
        {(type === TileType.BARN_BL) && <div className="absolute inset-0 bg-black/40 border-l-4 border-white/20 text-[10px] flex items-center justify-center font-bold text-red-300 tracking-widest">SLEEP</div>}
        {(type === TileType.BARN_BR) && <div className="absolute inset-0 bg-black/40 border-r-4 border-white/20" />}
      </div>
    );
  };

  const getPlayerSprite = () => {
    const map = {
      'x': PALETTE.HAT,
      'y': PALETTE.SHIRT,
      'o': PALETTE.SKIN,
      'z': PALETTE.OVERALLS
    };
    
    switch (player.facing) {
      case Direction.UP: return { sprite: SPRITES.FARMER_UP, map };
      case Direction.RIGHT: return { sprite: SPRITES.FARMER_SIDE, map };
      case Direction.LEFT: return { sprite: SPRITES.FARMER_SIDE, map };
      case Direction.DOWN: 
      default: return { sprite: SPRITES.FARMER_DOWN, map };
    }
  };

  const { sprite: playerSprite, map: playerColorMap } = getPlayerSprite();

  return (
    <div 
        className="relative transition-transform duration-200 ease-out will-change-transform"
        style={{
            width: mapWidthPx,
            height: mapHeightPx,
            transform: `translate(${-camX}px, ${-camY}px)`
        }}
    >
      {grid.map((row, y) => row.map((tile, x) => renderTile(tile.type, x, y, tile)))}

      <div
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          position: 'absolute',
          left: player.x * TILE_SIZE,
          top: player.y * TILE_SIZE,
          transition: 'top 0.15s steps(8), left 0.15s steps(8)',
          transform: player.facing === Direction.LEFT ? 'scaleX(-1)' : 'none'
        }}
        className="z-20"
      >
        <PixelTile 
            sprite={playerSprite} 
            colorMap={playerColorMap} 
            baseColor={PALETTE.TRANSPARENT} 
        />
      </div>

       <div 
         className="absolute pointer-events-none z-30 mix-blend-hard-light"
         style={{
            top: (player.y * TILE_SIZE) - 300,
            left: (player.x * TILE_SIZE) - 300,
            width: 600 + TILE_SIZE,
            height: 600 + TILE_SIZE,
            background: 'radial-gradient(circle, rgba(255,200,100,0.15) 0%, rgba(0,0,0,0) 60%)'
         }}
       />
    </div>
  );
};

export default WorldRenderer;
