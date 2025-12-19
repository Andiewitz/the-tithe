
import React, { useState, useRef, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import WorldRenderer from './components/WorldRenderer';
import { VIEWPORT_HEIGHT_TILES, VIEWPORT_WIDTH_TILES, TILE_SIZE, QUOTA_TARGET, MAX_DAYS } from './constants';
import { Direction, GameStatus } from './types';

const App: React.FC = () => {
  const { gameState, manualSave, movePlayer, till, plant, selectSeed, resetGame } = useGameEngine();
  const [showInventory, setShowInventory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const moveIntervalRef = useRef<number | null>(null);
  const mousePosRef = useRef<{x: number, y: number} | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());

  const width = VIEWPORT_WIDTH_TILES * TILE_SIZE;
  const height = VIEWPORT_HEIGHT_TILES * TILE_SIZE;

  // Process keyboard movement in an interval for smooth continuous movement
  useEffect(() => {
    const tick = () => {
      if (gameState.gameStatus !== GameStatus.PLAYING) return;
      
      const keys = keysPressed.current;
      // Priority: Up/Down, then Left/Right to prevent diagonal movement issues in grid
      if (keys.has('arrowup') || keys.has('w')) {
        movePlayer(0, -1, Direction.UP);
      } else if (keys.has('arrowdown') || keys.has('s')) {
        movePlayer(0, 1, Direction.DOWN);
      } else if (keys.has('arrowleft') || keys.has('a')) {
        movePlayer(-1, 0, Direction.LEFT);
      } else if (keys.has('arrowright') || keys.has('d')) {
        movePlayer(1, 0, Direction.RIGHT);
      }
    };

    const interval = window.setInterval(tick, 150); // Matches step animation roughly
    return () => window.clearInterval(interval);
  }, [movePlayer, gameState.gameStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        
        // Non-movement single-press actions
        if (!e.repeat) {
            switch(key) {
                case 'e': till(); break;
                case 'f': plant(); break;
                case 'i': setShowInventory(prev => !prev); break;
                case 'escape': setShowInventory(false); setShowHelp(false); break;
            }
        }

        // Add movement keys to set for continuous movement processing
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            keysPressed.current.add(key);
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        keysPressed.current.delete(e.key.toLowerCase());
    };

    const handleBlur = () => {
        keysPressed.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleBlur);
    };
  }, [till, plant]);

  const moveTowardsMouse = (rect: DOMRect) => {
      if (!mousePosRef.current) return;
      
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = mousePosRef.current.x - centerX;
      const dy = mousePosRef.current.y - centerY;

      if (Math.hypot(dx, dy) < 20) return;

      if (Math.abs(dx) > Math.abs(dy)) {
          movePlayer(dx > 0 ? 1 : -1, 0, dx > 0 ? Direction.RIGHT : Direction.LEFT);
      } else {
          movePlayer(0, dy > 0 ? 1 : -1, dy > 0 ? Direction.DOWN : Direction.UP);
      }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only trigger for touch or secondary button (right click) to allow pathing
    if (e.button !== 2 && e.pointerType !== 'touch') return;
    if (gameState.gameStatus !== GameStatus.PLAYING) return;

    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
    
    const rect = target.getBoundingClientRect();
    mousePosRef.current = { x: e.clientX, y: e.clientY };
    
    moveTowardsMouse(rect);

    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    moveIntervalRef.current = window.setInterval(() => {
         moveTowardsMouse(rect);
    }, 180);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (moveIntervalRef.current) {
          mousePosRef.current = { x: e.clientX, y: e.clientY };
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.button === 2 || e.pointerType === 'touch') {
        if (moveIntervalRef.current) {
            clearInterval(moveIntervalRef.current);
            moveIntervalRef.current = null;
        }
        mousePosRef.current = null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-950 text-red-100 font-mono">
      
      <header className="mb-4 text-center select-none z-10">
        <h1 className="text-4xl text-red-900 mb-1 font-black tracking-tighter shadow-red-500/10 shadow-lg">THE TITHE</h1>
        <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">Harvest {QUOTA_TARGET} to survive.</p>
      </header>

      <div 
        className="relative bg-[#020202] border-[12px] border-zinc-900 shadow-[0_0_60px_rgba(0,0,0,1)] rounded-sm overflow-hidden touch-none cursor-crosshair"
        style={{ width, height }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()} 
      >
        <WorldRenderer gameState={gameState} />
        
        {/* HUD Elements */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-40">
          <div className="bg-black/90 p-3 border border-red-950/50 rounded shadow-xl">
             <span className="text-zinc-600 uppercase text-[8px] block mb-1">Season Progress</span>
             <div className="text-sm font-bold">DAY {gameState.day} <span className="text-zinc-700">/ {MAX_DAYS}</span></div>
          </div>
          <div className="bg-black/90 p-3 border border-red-950/50 rounded shadow-xl">
             <span className="text-zinc-600 uppercase text-[8px] block mb-1">Tithe Quota</span>
             <div className="flex items-baseline gap-2">
                 <span className={`text-2xl font-black ${gameState.harvestedTotal >= QUOTA_TARGET ? 'text-green-600' : 'text-red-700'}`}>
                    {gameState.harvestedTotal}
                 </span>
                 <span className="text-zinc-700 text-xs">/ {QUOTA_TARGET}</span>
             </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 pointer-events-none z-40 flex flex-col gap-2 items-end">
            <div className="bg-black/90 p-3 border border-zinc-900 rounded shadow-xl">
                <span className="text-zinc-600 uppercase text-[8px] block mb-1">Active Pouch</span>
                <div className="text-xs font-bold text-zinc-300">
                    {gameState.selectedSeed} <span className="text-zinc-600">({gameState.inventory.seeds[gameState.selectedSeed]})</span>
                </div>
            </div>
        </div>

        {/* Game End States */}
        {gameState.gameStatus === GameStatus.LOST && (
            <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center animate-pulse">
                <h2 className="text-5xl text-red-950 font-black mb-4 uppercase tracking-tighter">SACRIFICED</h2>
                <p className="text-zinc-700 text-xs mb-12 max-w-[200px]">The Beast does not tolerate insufficient yields.</p>
                <button onClick={resetGame} className="border-4 border-red-900 text-red-800 px-8 py-4 font-bold hover:bg-red-950/20 active:scale-95 transition-transform uppercase">Restart Cycle</button>
            </div>
        )}
        {gameState.gameStatus === GameStatus.WON && (
            <div className="absolute inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-5xl text-zinc-300 font-black mb-4 uppercase tracking-tighter">SPARED</h2>
                <p className="text-zinc-500 text-xs mb-12 max-w-[200px]">The Beast sleeps. You have been granted another season.</p>
                <button onClick={resetGame} className="border-4 border-zinc-700 text-zinc-500 px-8 py-4 font-bold hover:bg-zinc-800 transition-colors uppercase">Next Season</button>
            </div>
        )}

        {/* Inventory Modal */}
        {showInventory && gameState.gameStatus === GameStatus.PLAYING && (
            <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center pointer-events-auto backdrop-blur-sm">
                <div className="bg-zinc-900 border-4 border-zinc-800 p-8 w-80 shadow-2xl">
                    <h2 className="text-center text-zinc-500 mb-8 border-b border-zinc-800 pb-4 text-[10px] tracking-[0.3em] uppercase">Storage</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {(['WHEAT', 'CORN'] as const).map(seed => (
                            <button
                                key={seed}
                                onClick={() => { selectSeed(seed); setShowInventory(false); }}
                                className={`p-4 border-2 flex items-center justify-between transition-all ${gameState.selectedSeed === seed ? 'border-red-900 bg-red-950/20' : 'border-zinc-800 hover:border-zinc-700'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 ${seed === 'WHEAT' ? 'bg-yellow-700' : 'bg-orange-700'} shadow-[0_0_5px_rgba(0,0,0,0.5)]`}></div>
                                    <span className="text-xs font-bold text-zinc-400 uppercase">{seed}</span>
                                </div>
                                <span className="text-[10px] text-zinc-600 font-mono">x{gameState.inventory.seeds[seed]}</span>
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setShowInventory(false)}
                        className="mt-8 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-3 text-[10px] uppercase font-bold tracking-widest"
                    >
                        Return
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* On-Screen Mobile/Casual Controls */}
      <div className="mt-8 flex flex-col items-center gap-6 max-w-lg w-full z-10">
        <div className="flex items-center gap-4 w-full">
            <button 
                onClick={till}
                className="flex-1 bg-red-950/10 hover:bg-red-950/30 text-red-900 py-6 px-4 rounded border-2 border-red-950/40 transition-all font-black uppercase text-xs active:scale-95"
            >
                [E] INTERACT
            </button>
            <button 
                onClick={plant}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 py-6 px-4 rounded border-2 border-zinc-800 transition-all font-black uppercase text-xs active:scale-95"
            >
                [F] PLANT
            </button>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full opacity-60 hover:opacity-100 transition-opacity">
            <button onClick={() => setShowInventory(true)} className="bg-black py-3 border border-zinc-900 text-zinc-700 text-[10px] uppercase font-bold tracking-widest">[I] INVENTORY</button>
            <button onClick={() => setShowHelp(!showHelp)} className="bg-black py-3 border border-zinc-900 text-zinc-700 text-[10px] uppercase font-bold tracking-widest">Controls</button>
        </div>

        {showHelp && (
            <div className="bg-black/50 p-6 rounded border-2 border-zinc-900 text-[9px] leading-[1.8] w-full select-none text-zinc-600 uppercase font-bold tracking-wider text-center">
                <p>WASD / Arrows : Walk</p>
                <p>E : Till / Harvest / Sleep (At Barn Door)</p>
                <p>F : SOW SEED</p>
                <p>I : INVENTORY</p>
                <p>Hold Right Click / Touch : Auto-Path</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;
