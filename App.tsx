
import React, { useState, useRef, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import WorldRenderer from './components/WorldRenderer';
import PixelTile from './components/PixelTile';
import { VIEWPORT_HEIGHT_TILES, VIEWPORT_WIDTH_TILES, TILE_SIZE, QUOTA_TARGET, MAX_DAYS, SPRITES, PALETTE } from './constants';
import { Direction, GameStatus, ToolType, TileType } from './types';
import { audioManager } from './services/audioService';

const App: React.FC = () => {
  const { gameState, movePlayer, interact, plant, selectSeed, selectTool, acquireTool, advanceDay, resetGame } = useGameEngine();
  const [showInventory, setShowInventory] = useState(false);
  const [showShed, setShowShed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const keysPressed = useRef<Set<string>>(new Set());

  const width = VIEWPORT_WIDTH_TILES * TILE_SIZE;
  const height = VIEWPORT_HEIGHT_TILES * TILE_SIZE;

  // Handle first interaction for Audio
  useEffect(() => {
    const startAudio = () => {
      if (!isMuted) {
        audioManager.startCrickets();
      }
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
    window.addEventListener('click', startAudio);
    window.addEventListener('keydown', startAudio);
    return () => {
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
  }, [isMuted]);

  useEffect(() => {
    audioManager.toggle(!isMuted);
  }, [isMuted]);

  useEffect(() => {
    const tick = () => {
      if (gameState.gameStatus !== GameStatus.PLAYING) return;
      const keys = keysPressed.current;
      if (keys.has('arrowup') || keys.has('w')) movePlayer(0, -1, Direction.UP);
      else if (keys.has('arrowdown') || keys.has('s')) movePlayer(0, 1, Direction.DOWN);
      else if (keys.has('arrowleft') || keys.has('a')) movePlayer(-1, 0, Direction.LEFT);
      else if (keys.has('arrowright') || keys.has('d')) movePlayer(1, 0, Direction.RIGHT);
    };
    const interval = window.setInterval(tick, 150);
    return () => window.clearInterval(interval);
  }, [movePlayer, gameState.gameStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        if (!e.repeat) {
            switch(key) {
                case 'e': 
                    const {x, y, facing} = gameState.player;
                    const currentTile = gameState.grid[y][x];
                    let fx = x, fy = y;
                    if (facing === Direction.UP) fy--;
                    else if (facing === Direction.DOWN) fy++;
                    else if (facing === Direction.LEFT) fx--;
                    else if (facing === Direction.RIGHT) fx++;
                    const facedTile = gameState.grid[fy]?.[fx];
                    const isAtDoor = 
                        currentTile.type === TileType.BARN_BL || 
                        currentTile.type === TileType.BARN_BR ||
                        (facedTile && (facedTile.type === TileType.BARN_BL || facedTile.type === TileType.BARN_BR));
                    if (isAtDoor) setShowShed(true);
                    else interact();
                    break;
                case 'f': plant(); break;
                case 'i': setShowInventory(prev => !prev); break;
                case 'm': setIsMuted(prev => !prev); break;
                case '1': if (gameState.inventory.tools.includes('HOE')) selectTool('HOE'); break;
                case '2': if (gameState.inventory.tools.includes('SCYTHE')) selectTool('SCYTHE'); break;
                case '3': if (gameState.inventory.tools.includes('CAN')) selectTool('CAN'); break;
                case 'escape': 
                    setShowInventory(false); 
                    setShowShed(false); 
                    setShowHelp(false); 
                    break;
            }
        }
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) keysPressed.current.add(key);
    };
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [interact, plant, gameState, selectTool]);

  const handleSleep = () => {
      advanceDay();
      setShowShed(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-950 text-red-100 font-mono">
      
      <header className="mb-4 text-center select-none z-10 relative w-full max-w-lg">
        <h1 className="text-4xl text-red-900 mb-1 font-black tracking-tighter shadow-red-500/10 shadow-lg uppercase">The Tithe</h1>
        <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">Harvest {QUOTA_TARGET} to survive.</p>
        
        {/* Audio Toggle */}
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 p-2 border border-zinc-900 rounded hover:bg-zinc-900 transition-colors"
          title="Toggle Audio (M)"
        >
          {isMuted ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-700"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-900"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          )}
        </button>
      </header>

      <div 
        className="relative bg-[#020202] border-[12px] border-zinc-900 shadow-[0_0_60px_rgba(0,0,0,1)] rounded-sm overflow-hidden touch-none"
        style={{ width, height }}
      >
        <WorldRenderer gameState={gameState} />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-40">
          <div className="bg-black/90 p-3 border border-red-950/50 rounded shadow-xl">
             <span className="text-zinc-600 uppercase text-[8px] block mb-1 font-bold">Season</span>
             <div className="text-sm font-bold">DAY {gameState.day} <span className="text-zinc-700">/ {MAX_DAYS}</span></div>
          </div>
          <div className="bg-black/90 p-3 border border-red-950/50 rounded shadow-xl">
             <span className="text-zinc-600 uppercase text-[8px] block mb-1 font-bold">Tithe Progress</span>
             <div className="flex items-baseline gap-2">
                 <span className={`text-2xl font-black ${gameState.harvestedTotal >= QUOTA_TARGET ? 'text-green-600' : 'text-red-700'}`}>
                    {gameState.harvestedTotal}
                 </span>
                 <span className="text-zinc-700 text-xs">/ {QUOTA_TARGET}</span>
             </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-40">
            {(['HOE', 'SCYTHE', 'CAN'] as ToolType[]).map((tool, idx) => {
                const has = gameState.inventory.tools.includes(tool);
                const active = gameState.selectedTool === tool;
                return (
                    <button
                        key={tool}
                        disabled={!has}
                        onClick={() => selectTool(tool)}
                        className={`w-12 h-12 border-2 flex flex-col items-center justify-center transition-all relative ${has ? 'opacity-100 cursor-pointer' : 'opacity-20 grayscale pointer-events-none'} ${active ? 'border-red-900 bg-red-950/40' : 'border-zinc-800 bg-black/60'}`}
                    >
                        <div className="w-8 h-8">
                             <PixelTile sprite={SPRITES[tool]} colorMap={{'w': PALETTE.WHITE, 'b': PALETTE.WATER_SHORE}} />
                        </div>
                        <span className="text-[6px] absolute bottom-0.5 right-1 text-zinc-600 font-bold">{idx + 1}</span>
                        {tool === 'CAN' && has && (
                             <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${gameState.canIsFull ? 'bg-blue-600 shadow-[0_0_5px_blue]' : 'bg-zinc-800'}`} />
                        )}
                    </button>
                );
            })}
        </div>

        {gameState.gameStatus !== GameStatus.PLAYING && (
            <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
                <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter">
                    {gameState.gameStatus === GameStatus.WON ? 'SPARED' : 'SACRIFICED'}
                </h2>
                <p className="text-zinc-500 text-xs mb-12 uppercase tracking-widest">{gameState.gameStatus === GameStatus.WON ? 'The cycle continues.' : 'The harvest was insufficient.'}</p>
                <button onClick={resetGame} className="border-4 border-red-900 px-8 py-4 font-bold uppercase hover:bg-red-900/10 active:scale-95 transition-all">Restart Cycle</button>
            </div>
        )}

        {showShed && (
             <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center backdrop-blur-sm pointer-events-auto">
                <div className="bg-zinc-900 border-4 border-zinc-800 p-8 w-80 shadow-2xl relative">
                    <h2 className="text-center text-zinc-500 mb-8 text-[10px] tracking-[0.3em] uppercase font-bold">The Barn</h2>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2">
                            <span className="text-[7px] uppercase text-zinc-600 mb-1 font-bold">Toolshed</span>
                            {(['HOE', 'SCYTHE', 'CAN'] as ToolType[]).map(tool => (
                                <button
                                    key={tool}
                                    onClick={() => acquireTool(tool)}
                                    className={`p-3 border-2 flex items-center justify-between transition-all ${gameState.inventory.tools.includes(tool) ? 'border-zinc-800 bg-zinc-950/20 opacity-50' : 'border-red-900 bg-red-950/10 hover:bg-red-950/20'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5">
                                            <PixelTile sprite={SPRITES[tool]} colorMap={{'w': PALETTE.WHITE, 'b': PALETTE.WATER_SHORE}} />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{tool}</span>
                                    </div>
                                    <span className="text-[7px] text-zinc-600 font-bold uppercase">{gameState.inventory.tools.includes(tool) ? 'Owned' : 'Take'}</span>
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-zinc-800">
                             <button 
                                onClick={handleSleep} 
                                className="w-full bg-red-950/20 border-2 border-red-950/50 hover:bg-red-950/40 text-red-700 py-4 text-[10px] uppercase font-bold tracking-widest transition-colors"
                             >
                                Rest for the Night
                             </button>
                             <p className="text-[6px] text-center text-zinc-600 mt-2 uppercase">Advances to Day {gameState.day + 1}</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowShed(false)} 
                        className="mt-6 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-2 text-[8px] uppercase font-bold"
                    >
                        Back to Fields
                    </button>
                </div>
            </div>
        )}

        {showInventory && (
            <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center backdrop-blur-sm pointer-events-auto">
                <div className="bg-zinc-900 border-4 border-zinc-800 p-8 w-80 shadow-2xl">
                    <h2 className="text-center text-zinc-500 mb-8 border-b border-zinc-800 pb-4 text-[10px] uppercase font-bold">Seed Pouches</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {(['WHEAT', 'CORN'] as const).map(seed => (
                            <button
                                key={seed}
                                onClick={() => { selectSeed(seed); setShowInventory(false); }}
                                className={`p-4 border-2 flex items-center justify-between ${gameState.selectedSeed === seed ? 'border-red-900 bg-red-950/20' : 'border-zinc-800 hover:border-zinc-700'}`}
                            >
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">{seed}</span>
                                <span className="text-[10px] text-zinc-600 font-bold">x{gameState.inventory.seeds[seed]}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowInventory(false)} className="mt-8 w-full bg-zinc-800 py-3 text-[10px] uppercase font-bold">Close</button>
                </div>
            </div>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 max-w-lg w-full z-10">
        <div className="flex items-center gap-4 w-full">
            <button onClick={interact} className="flex-1 bg-red-950/10 hover:bg-red-950/30 text-red-900 py-6 border-2 border-red-950/40 transition-all font-black uppercase text-xs active:scale-95 shadow-lg">[E] USE ITEM</button>
            <button onClick={plant} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 py-6 border-2 border-zinc-800 transition-all font-black uppercase text-xs active:scale-95 shadow-lg">[F] PLANT</button>
        </div>
        
        <div className="flex gap-4 w-full opacity-60 hover:opacity-100 transition-opacity">
            <button onClick={() => setShowInventory(true)} className="flex-1 bg-black py-3 border border-zinc-900 text-zinc-700 text-[10px] font-bold uppercase tracking-widest">[I] INVENTORY</button>
            <button onClick={() => setShowHelp(!showHelp)} className="flex-1 bg-black py-3 border border-zinc-900 text-zinc-700 text-[10px] font-bold uppercase tracking-widest">Controls</button>
        </div>

        {showHelp && (
            <div className="bg-black/50 p-6 rounded border border-zinc-900 text-[8px] uppercase text-zinc-600 font-bold text-center leading-relaxed animate-fadeIn">
                <p className="mb-1 text-zinc-400">1, 2, 3 : Quick-switch Tools</p>
                <p className="mb-1 text-zinc-400">E : Use Current Tool / Open Barn Door</p>
                <p className="mb-1 text-zinc-400">F : Sow Selected Seed</p>
                <p className="mb-1 text-zinc-400">M : Toggle Ambient Night (Audio)</p>
                <p className="mb-1 text-zinc-400">Stand near water with Can to Refill</p>
                <p className="text-red-900">Watered crops grow 3x faster.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;
