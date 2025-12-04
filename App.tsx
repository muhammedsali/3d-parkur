
/// <reference lib="dom" />
import React, { useState, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { parseInstagramZip, generateMockParticipants } from './services/instagramService';
import { Participant, GameState, RaceResult, CameraMode, TrackConfig } from './types';
import { COLORS } from './constants';

const App = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [cameraMode, setCameraMode] = useState<CameraMode>(CameraMode.CINEMATIC);
  const [loadingMsg, setLoadingMsg] = useState<string>("");

  // Default Config
  const [trackConfig, setTrackConfig] = useState<TrackConfig>({
    segmentCount: 10,
    steepness: 1.0,
    chaosLevel: 0.5,
    banking: 0.2
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingMsg("Parsing Instagram Data...");
    try {
      const parsed = await parseInstagramZip(file);
      setParticipants(parsed);
      setLoadingMsg("");
    } catch (err) {
      alert("Error parsing ZIP file. Make sure it's the valid Instagram format.");
      setLoadingMsg("");
    }
  };

  const handleGoToEditor = () => {
    if (participants.length === 0) {
      const mocks = generateMockParticipants(15);
      setParticipants(mocks);
    }
    setGameState(GameState.EDITOR);
    setCameraMode(CameraMode.CINEMATIC); // Cinematic view while editing
  };

  const handleStartRace = () => {
    setResults([]);
    setGameState(GameState.RACE);
    setCameraMode(CameraMode.FOLLOW);
  };

  const handleFinish = useCallback((data: { id: string, time: number }) => {
    setResults(prev => {
      if (prev.find(r => r.username === participants.find(p => p.id === data.id)?.username)) return prev;

      const p = participants.find(part => part.id === data.id);
      if (!p) return prev;

      const newResult: RaceResult = {
        username: p.username,
        photoUrl: p.photoUrl,
        time: data.time,
        rank: prev.length + 1
      };
      
      const newResults = [...prev, newResult].sort((a, b) => a.time - b.time);
      return newResults;
    });
  }, [participants]);

  const formatTime = (ms: number) => (ms / 1000).toFixed(2) + 's';

  // --- UI Components for Range Inputs ---
  const RangeControl = ({ label, value, min, max, step, onChange, unit = "" }: any) => (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-cyan-300 mb-1">
        <span>{label}</span>
        <span>{value}{unit}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
      />
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* 3D Layer */}
      <div className="absolute inset-0 z-0">
        <GameCanvas 
          participants={participants} 
          gameState={gameState} 
          onFinish={handleFinish}
          cameraMode={cameraMode}
          trackConfig={trackConfig}
        />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div>
             <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(0,245,255,0.5)] italic">
              MARBLE RACE
            </h1>
            <p className="text-gray-400 text-xs mt-1">INSTAGRAM EDITION</p>
          </div>
          
          {gameState === GameState.RACE && (
            <div className="flex gap-2 bg-black/50 backdrop-blur-md p-2 rounded-lg border border-white/10">
               <button onClick={() => setCameraMode(CameraMode.FOLLOW)} className={`px-3 py-1 text-xs rounded ${cameraMode === CameraMode.FOLLOW ? 'bg-cyan-500 text-black' : 'text-white'}`}>FOLLOW</button>
               <button onClick={() => setCameraMode(CameraMode.FREE)} className={`px-3 py-1 text-xs rounded ${cameraMode === CameraMode.FREE ? 'bg-cyan-500 text-black' : 'text-white'}`}>FREE</button>
               <button onClick={() => setCameraMode(CameraMode.CINEMATIC)} className={`px-3 py-1 text-xs rounded ${cameraMode === CameraMode.CINEMATIC ? 'bg-cyan-500 text-black' : 'text-white'}`}>CINE</button>
            </div>
          )}
        </div>

        {/* Main Menu */}
        {gameState === GameState.MENU && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900/90 border border-cyan-500/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,245,255,0.2)] max-w-md w-full text-center">
              
              <div className="mb-8 space-y-2">
                 <h2 className="text-2xl text-white font-bold">Setup Race</h2>
                 <p className="text-gray-400 text-sm">Upload JSON to play with followers.</p>
              </div>

              <div className="space-y-4">
                <label className="block w-full cursor-pointer group">
                  <div className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 hover:border-cyan-400 hover:bg-cyan-900/20 transition-all">
                    <input type="file" accept=".zip" onChange={handleFileUpload} className="hidden" />
                    <div className="text-cyan-400 group-hover:scale-110 transition-transform mb-2">📂</div>
                    <span className="text-gray-300 text-sm">
                      {participants.length > 0 ? `${participants.length} Racers Loaded` : "Select .zip File"}
                    </span>
                  </div>
                </label>

                {loadingMsg && <p className="text-yellow-400 text-xs animate-pulse">{loadingMsg}</p>}

                <button 
                  onClick={handleGoToEditor}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all"
                >
                  {participants.length > 0 ? "TRACK BUILDER 🛠️" : "TRY DEMO BUILDER 🛠️"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TRACK EDITOR SCREEN */}
        {gameState === GameState.EDITOR && (
          <div className="absolute inset-0 flex items-center justify-end pointer-events-auto">
            <div className="w-80 h-full bg-black/80 backdrop-blur-lg border-l border-cyan-500/30 p-6 flex flex-col animate-in slide-in-from-right">
               <h2 className="text-2xl text-white font-bold mb-6 italic border-b border-gray-700 pb-2">TRACK STUDIO</h2>
               
               <div className="flex-1 overflow-y-auto">
                  <div className="space-y-6">
                    <RangeControl 
                      label="Track Length" 
                      value={trackConfig.segmentCount} min={3} max={25} step={1} unit=" Segments"
                      onChange={(v: number) => setTrackConfig({...trackConfig, segmentCount: v})}
                    />
                    <RangeControl 
                      label="Steepness (Slope)" 
                      value={trackConfig.steepness} min={0.2} max={1.8} step={0.1} 
                      onChange={(v: number) => setTrackConfig({...trackConfig, steepness: v})}
                    />
                    <RangeControl 
                      label="Banking (Right Tilt)" 
                      value={trackConfig.banking} min={0} max={0.5} step={0.05} 
                      onChange={(v: number) => setTrackConfig({...trackConfig, banking: v})}
                    />
                    <RangeControl 
                      label="Chaos Level (Obstacles)" 
                      value={trackConfig.chaosLevel} min={0} max={1} step={0.1} unit="%"
                      onChange={(v: number) => setTrackConfig({...trackConfig, chaosLevel: v})}
                    />
                  </div>
               </div>

               <div className="mt-6 space-y-2">
                 <button 
                    onClick={handleStartRace}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded shadow-[0_0_20px_rgba(0,255,0,0.3)] text-xl"
                  >
                    START RACE 🚀
                  </button>
                  <button 
                    onClick={() => setGameState(GameState.MENU)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded"
                  >
                    Back to Menu
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* Leaderboard (Live) */}
        {(gameState === GameState.RACE || gameState === GameState.FINISHED) && (
          <div className="absolute top-20 right-6 w-64 pointer-events-auto">
             <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-900 to-gray-900 p-3 border-b border-white/10">
                  <h3 className="text-white font-bold text-sm">🏆 LEADERBOARD</h3>
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                   {results.length === 0 && <div className="text-gray-500 text-xs text-center py-4">Waiting for finishers...</div>}
                   {results.map((r) => (
                     <div key={r.rank} className="flex items-center gap-2 bg-white/5 p-2 rounded hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-right-5">
                        <span className={`text-xs font-bold w-4 ${r.rank === 1 ? 'text-yellow-400' : r.rank === 2 ? 'text-gray-300' : r.rank === 3 ? 'text-orange-400' : 'text-gray-500'}`}>#{r.rank}</span>
                        <img src={r.photoUrl} alt="avatar" className="w-6 h-6 rounded-full border border-gray-600" />
                        <span className="text-xs text-white truncate flex-1">{r.username}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">{formatTime(r.time)}</span>
                     </div>
                   ))}
                </div>
             </div>
             
             {results.length > 0 && results.length >= participants.length && (
                <button 
                  onClick={() => setGameState(GameState.MENU)}
                  className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded shadow-lg"
                >
                  RESTART
                </button>
             )}
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
