import React, { useState, useRef, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import WorldRenderer from './components/WorldRenderer';
import { VIEWPORT_HEIGHT_TILES, VIEWPORT_WIDTH_TILES, TILE_SIZE, QUOTA_TARGET, MAX_DAYS } from './constants';
import { Direction, GameStatus } from './types';

const App: React.FC = () => {
  const { gameState, manualSave, movePlayer, till, plant, selectSeed, resetGame } = useGameEngine();
  const [showInventory, setShowInventory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Pointer/Touch Logic Refs
  const moveIntervalRef = useRef<number | null>(null);

  // Calculate container size (Viewport only)
  const width = VIEWPORT_WIDTH_TILES * TILE_SIZE;
  const height = VIEWPORT_HEIGHT_TILES * TILE_SIZE;

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return;
        
        switch(e.key.toLowerCase()) {
            case 'e': till(); break;
            case 'f': plant(); break;
            case 'd': setShowInventory(prev => !prev); break;
        }

        switch(e.key) {
            case 'ArrowUp': movePlayer(0, -1, Direction.UP); break;
            case 'ArrowDown': movePlayer(0, 1, Direction.DOWN); break;
            case 'ArrowLeft': movePlayer(-1, 0, Direction.LEFT); break;
            case 'ArrowRight': movePlayer(1, 0, Direction.RIGHT); break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, till, plant]);


  // Mouse Movement Logic (Grid by Grid)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only Right Click (button 2) triggers movement
    if (e.button !== 2) return;
    if (gameState.gameStatus !== GameStatus.PLAYING) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const executeMove = () => {
        const rect = e.currentTarget.getBoundingClientRect();
        // Recalculate based on current mouse pos is tricky in interval without ref tracking
        // But for grid movement, let's just use the initial direction or current mouse pos?
        // Let's use current mouse pos to allow steering while holding
        // We need a ref for mouse pos
    };
    
    // We'll use a simpler interval that reads a ref
    startMoving(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
  };

  const mousePosRef = useRef<{x: number, y: number} | null>(null);

  const startMoving = (x: number, y: number, rect: DOMRect) => {
      mousePosRef.current = { x, y };
      
      // Execute immediate move
      moveTowardsMouse(rect);

      // Start interval for held movement (slower than before to lock to grid feel)
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = window.setInterval(() => {
         moveTowardsMouse(rect);
      }, 200); // 200ms feels like a deliberate step
  };

  const moveTowardsMouse = (rect: DOMRect) => {
      if (!mousePosRef.current) return;
      
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = mousePosRef.current.x - centerX;
      const dy = mousePosRef.current.y - centerY;

      if (Math.hypot(dx, dy) < 20) return; // Deadzone

      // Strongest axis wins
      if (Math.abs(dx) > Math.abs(dy)) {
          movePlayer(dx > 0 ? 1 : -1, 0, dx > 0 ? Direction.RIGHT : Direction.LEFT);
      } else {
          movePlayer(0, dy > 0 ? 1 : -1, dy > 0 ? Direction.DOWN : Direction.UP);
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (moveIntervalRef.current) {
          mousePosRef.current = { x: e.clientX, y: e.clientY };
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.button === 2) {
        e.preventDefault();
        if (moveIntervalRef.current) {
            clearInterval(moveIntervalRef.current);
            moveIntervalRef.current = null;
        }
        mousePosRef.current = null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-red-100">
      
      {/* Header */}
      <header className="mb-4 text-center select-none z-10">
        <h1 className="text-3xl text-red-700 mb-1 drop-shadow-md font-bold tracking-widest">THE TITHE</h1>
        <p className="text-xs text-zinc-600">The Beast demands <span className="text-red-500">{QUOTA_TARGET}</span> souls... I mean crops.</p>
      </header>

      {/* Game Container */}
      <div 
        className="relative bg-[#050505] border-4 border-zinc-900 shadow-[0_0_30px_rgba(100,0,0,0.3)] rounded-sm overflow-hidden touch-none cursor-crosshair"
        style={{ width, height }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()} 
      >
        <WorldRenderer gameState={gameState} />
        
        {/* Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none z-30 bg-[radial-gradient(circle,transparent_40%,#000000_100%)] opacity-80"></div>
        {/* Day 7 Red Tint */}
        {gameState.day === MAX_DAYS && (
             <div className="absolute inset-0 pointer-events-none z-20 bg-red-900/10 mix-blend-overlay animate-pulse"></div>
        )}


        {/* HUD Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 pointer-events-none z-40">
          <div className="bg-black/80 p-2 rounded text-xs border border-red-900/30 text-red-100">
             <span className="text-zinc-500 uppercase text-[10px] block mb-1">Deadline</span>
             Day {gameState.day} / {MAX_DAYS}
          </div>
          <div className="bg-black/80 p-2 rounded text-xs border border-red-900/30">
             <span className="text-zinc-500 uppercase text-[10px] block mb-1">Quota</span>
             <div className="flex items-end gap-1">
                 <span className={`text-xl ${gameState.harvestedTotal >= QUOTA_TARGET ? 'text-green-500' : 'text-red-500'}`}>
                    {gameState.harvestedTotal}
                 </span>
                 <span className="text-zinc-500">/ {QUOTA_TARGET}</span>
             </div>
          </div>
        </div>

        {/* Selected Seed HUD */}
        <div className="absolute top-2 right-2 pointer-events-none z-40 bg-black/80 p-2 rounded text-xs border border-zinc-800">
             <span className="text-zinc-500 uppercase text-[10px] block mb-1">Current Seed</span>
             {gameState.selectedSeed} ({gameState.inventory.seeds[gameState.selectedSeed]})
        </div>

        {/* Game Over / Win Screens */}
        {gameState.gameStatus === GameStatus.LOST && (
            <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
                <h2 className="text-4xl text-red-600 font-bold mb-4 tracking-widest">CONSUMED</h2>
                <p className="text-zinc-500 text-xs mb-8">You failed to meet the quota. The barn doors open...</p>
                <button onClick={resetGame} className="border border-red-900 text-red-500 px-4 py-2 hover:bg-red-900/20">TRY AGAIN</button>
            </div>
        )}
        {gameState.gameStatus === GameStatus.WON && (
            <div className="absolute inset-0 z-50 bg-zinc-900 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
                <h2 className="text-4xl text-yellow-600 font-bold mb-4 tracking-widest">SURVIVED</h2>
                <p className="text-zinc-400 text-xs mb-8">The beast is satiated... for this season.</p>
                <button onClick={resetGame} className="border border-yellow-900 text-yellow-500 px-4 py-2 hover:bg-yellow-900/20">PLAY AGAIN</button>
            </div>
        )}


        {/* Inventory Modal */}
        {showInventory && gameState.gameStatus === GameStatus.PLAYING && (
            <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center pointer-events-auto">
                <div className="bg-zinc-900 border border-zinc-700 p-6 w-3/4 max-w-sm shadow-2xl">
                    <h2 className="text-center text-zinc-400 mb-6 border-b border-zinc-800 pb-2 text-xs tracking-widest uppercase">Inventory</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {(['WHEAT', 'CORN'] as const).map(seed => (
                            <button
                                key={seed}
                                onClick={() => selectSeed(seed)}
                                className={`p-4 border flex flex-col items-center gap-2 transition-all ${gameState.selectedSeed === seed ? 'border-red-800 bg-red-900/10' : 'border-zinc-800 hover:border-zinc-600'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${seed === 'WHEAT' ? 'bg-yellow-700' : 'bg-orange-700'}`}></div>
                                <span className="text-[10px] text-zinc-300">{seed}</span>
                                <span className="text-[10px] text-zinc-500">x{gameState.inventory.seeds[seed]}</span>
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setShowInventory(false)}
                        className="mt-6 w-full border border-zinc-700 hover:bg-zinc-800 text-zinc-400 py-2 text-[10px] uppercase"
                    >
                        Close
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Controls / Footer */}
      <div className="mt-6 flex flex-col items-center gap-4 max-w-lg w-full z-10">
        
        <div className="grid grid-cols-2 gap-4 w-full">
            <button 
                onClick={manualSave}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500 py-3 px-4 rounded border border-zinc-800 transition-all text-[10px] uppercase tracking-wider"
            >
                Save Progress
            </button>
            <button 
                onClick={() => setShowHelp(!showHelp)}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500 py-3 px-4 rounded border border-zinc-800 transition-all text-[10px] uppercase tracking-wider"
            >
                {showHelp ? 'Hide Controls' : 'Show Controls'}
            </button>
        </div>

        {showHelp && (
            <div className="bg-zinc-950 p-4 rounded border border-zinc-900 text-[10px] leading-loose w-full select-none text-zinc-500">
                <p><span className="text-red-800">HOLD RIGHT CLICK</span> : Move Farmer (Grid Step)</p>
                <p><span className="text-red-800">E</span> : Till Dirt / Harvest / Interact (At Feet)</p>
                <p><span className="text-red-800">F</span> : Plant Selected Seed (At Feet)</p>
                <p><span className="text-red-800">D</span> : Inventory</p>
                <p className="mt-2 text-zinc-700 italic">Face the Barn door and press E to Sleep and advance the day.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;