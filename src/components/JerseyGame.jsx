import { useState, useCallback, useMemo } from 'react';
import { players } from '../data/players.js';
import { COACHING_ERAS, playerBelongsToEra } from '../data/coaches.js';
import { Trophy, RotateCcw, Hash, Keyboard, ChevronRight, User } from 'lucide-react';

const ROUNDS = 10;

// Get players with jersey numbers for a specific era
function getPlayersForEra(eraId) {
  return players.filter(p => p.jerseyNumber && playerBelongsToEra(p, eraId));
}

function getRandom(arr, exclude = []) {
  const filtered = arr.filter(item => !exclude.includes(item.id));
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function generateWrongOptions(correctNumber) {
  const wrong = new Set();
  const correct = parseInt(correctNumber, 10);
  
  while (wrong.size < 3) {
    // Generate numbers near the correct one or random common jersey numbers
    let num;
    if (Math.random() < 0.5 && !isNaN(correct)) {
      // Near the correct number
      const offset = Math.floor(Math.random() * 10) - 5;
      num = correct + offset;
      if (num < 0) num = Math.abs(num);
      if (num > 99) num = 99;
    } else {
      // Random common jersey
      const common = [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 15, 20, 21, 23, 24, 25, 30, 32, 33, 34, 35, 40, 44, 50, 55];
      num = common[Math.floor(Math.random() * common.length)];
    }
    
    if (num !== correct && num >= 0 && num <= 99) {
      wrong.add(num.toString());
    }
  }
  
  return Array.from(wrong);
}

function JerseyGame({ onBack }) {
  const [phase, setPhase] = useState('era-select'); // 'era-select', 'mode-select', 'playing', 'finished'
  const [mode, setMode] = useState(null); // 'multiple', 'fill'
  const [selectedEra, setSelectedEra] = useState(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'answered', 'finished'
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [fillInput, setFillInput] = useState('');
  const [usedPlayers, setUsedPlayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);

  const selectEra = useCallback((eraId) => {
    setSelectedEra(eraId);
    const playersForEra = getPlayersForEra(eraId);
    setAvailablePlayers(playersForEra);
    setPhase('mode-select');
  }, []);

  const startGame = useCallback((gameMode) => {
    setMode(gameMode);
    setPhase('playing');
    setRound(1);
    setScore(0);
    setGameState('playing');
    setUsedPlayers([]);
    setHistory([]);
    
    // Pick first player from available players for this era
    const player = getRandom(availablePlayers);
    setCurrentPlayer(player);
    setUsedPlayers([player.id]);
    
    if (gameMode === 'multiple') {
      const wrong = generateWrongOptions(player.jerseyNumber);
      const allOptions = [...wrong, player.jerseyNumber].sort(() => Math.random() - 0.5);
      setOptions(allOptions);
    }
  }, [availablePlayers]);

  const nextRound = useCallback(() => {
    if (round >= ROUNDS) {
      setGameState('finished');
      return;
    }
    
    const player = getRandom(availablePlayers, usedPlayers);
    setCurrentPlayer(player);
    setUsedPlayers(prev => [...prev, player.id]);
    setRound(prev => prev + 1);
    setGameState('playing');
    setSelectedAnswer(null);
    setFillInput('');
    
    if (mode === 'multiple') {
      const wrong = generateWrongOptions(player.jerseyNumber);
      const allOptions = [...wrong, player.jerseyNumber].sort(() => Math.random() - 0.5);
      setOptions(allOptions);
    }
  }, [round, mode, usedPlayers, availablePlayers]);

  const handleMultipleChoice = useCallback((answer) => {
    if (gameState !== 'playing') return;
    
    const correct = answer === currentPlayer.jerseyNumber;
    setSelectedAnswer(answer);
    setGameState('answered');
    
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    setHistory(prev => [...prev, {
      player: currentPlayer,
      correct,
      yourAnswer: answer,
      round: history.length + 1
    }]);
  }, [gameState, currentPlayer, history]);

  const handleFillSubmit = useCallback(() => {
    if (gameState !== 'playing' || !fillInput) return;
    
    const normalizedInput = fillInput.trim().toLowerCase();
    const normalizedAnswer = currentPlayer.jerseyNumber.toString().toLowerCase();
    const correct = normalizedInput === normalizedAnswer || 
                   (normalizedInput === '0' && normalizedAnswer === '00') ||
                   (normalizedInput === '00' && normalizedAnswer === '0');
    
    setGameState('answered');
    
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    setHistory(prev => [...prev, {
      player: currentPlayer,
      correct,
      yourAnswer: fillInput,
      round: history.length + 1
    }]);
  }, [gameState, fillInput, currentPlayer, history]);

  const resetGame = useCallback(() => {
    setPhase('era-select');
    setMode(null);
    setSelectedEra(null);
    setRound(0);
    setScore(0);
    setGameState('playing');
    setCurrentPlayer(null);
    setOptions([]);
    setSelectedAnswer(null);
    setFillInput('');
    setUsedPlayers([]);
    setHistory([]);
    setAvailablePlayers([]);
  }, []);

  // Era selection screen
  if (phase === 'era-select') {
    const eraStats = COACHING_ERAS.map(era => ({
      ...era,
      playerCount: getPlayersForEra(era.id).length
    })).filter(e => e.playerCount >= 5); // Only show eras with enough players

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 text-center animate-fadeIn">
        <div>
          <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
            <Hash className="w-4 h-4" /> Jersey Guesser
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            PICK AN <span className="text-purple-400">ERA</span>
          </h1>
          <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
            Choose a coaching era or play with players from all of Kentucky history.
          </p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Select Coaching Era</div>
          
          {eraStats.map((era) => (
            <button
              key={era.id}
              onClick={() => selectEra(era.id)}
              disabled={era.playerCount < 10}
              className={`flex items-center gap-3 w-full py-3 px-3 rounded-xl transition-all duration-150 text-left ${
                era.playerCount < 10 
                  ? 'opacity-40 cursor-not-allowed bg-white/5' 
                  : 'bg-white/5 hover:bg-white/10 border border-white/15'
              }`}
            >
              <div 
                className="w-3 h-10 rounded flex-shrink-0"
                style={{ backgroundColor: era.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate">{era.name}</div>
                <div className="text-gray-400 text-xs">
                  {era.startYear}-{era.endYear} • {era.playerCount} players
                  {era.championships && (
                    <span className="text-yellow-400 ml-1">🏆 {era.championships.length}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
            </button>
          ))}
        </div>

        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Back to Main Menu
        </button>
      </div>
    );
  }

  // Mode selection screen
  if (phase === 'mode-select') {
    const selectedEraData = COACHING_ERAS.find(e => e.id === selectedEra);
    
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 text-center animate-fadeIn">
        <div>
          <div 
            className="inline-flex items-center gap-2 border text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
            style={{ 
              borderColor: selectedEraData?.color + '60',
              backgroundColor: selectedEraData?.color + '20',
              color: selectedEraData?.color 
            }}
          >
            <User className="w-4 h-4" /> {selectedEraData?.name}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            GUESS THE <span style={{ color: selectedEraData?.color }}>NUMBER</span>
          </h1>
          <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
            {availablePlayers.length} players available • 10 rounds
          </p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left flex flex-col gap-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Choose Mode</div>
          
          <button
            onClick={() => startGame('multiple')}
            className="flex items-center gap-3 w-full py-4 px-4 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl transition-all duration-150 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-300 font-bold text-sm">A B</span>
            </div>
            <div>
              <div className="text-white font-semibold">Multiple Choice</div>
              <div className="text-gray-400 text-xs">Pick from 4 options</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 ml-auto" />
          </button>
          
          <button
            onClick={() => startGame('fill')}
            className="flex items-center gap-3 w-full py-4 px-4 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl transition-all duration-150 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
              <Keyboard className="w-5 h-5 text-green-300" />
            </div>
            <div>
              <div className="text-white font-semibold">Type It In</div>
              <div className="text-gray-400 text-xs">Enter the jersey number</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 ml-auto" />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setPhase('era-select')}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Change Era
          </button>
          <span className="text-gray-600">|</span>
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Main Menu
          </button>
        </div>
      </div>
    );
  }

  // Finished screen
  if (gameState === 'finished') {
    const finishedEraData = COACHING_ERAS.find(e => e.id === selectedEra);
    const percentage = Math.round((score / ROUNDS) * 100);
    let message = '';
    if (percentage === 100) message = 'Perfect! You are a true Kentucky historian!';
    else if (percentage >= 80) message = 'Excellent! You know your Wildcats!';
    else if (percentage >= 60) message = 'Good job! Keep studying those jerseys!';
    else if (percentage >= 40) message = 'Not bad, but there\'s room for improvement!';
    else message = 'Keep watching those games - you\'ll get there!';

    return (
      <div className="w-full max-w-xl mx-auto flex flex-col gap-6 animate-fadeIn">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div 
              className="inline-flex items-center gap-2 border text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3"
              style={{ 
                borderColor: finishedEraData?.color + '60',
                backgroundColor: finishedEraData?.color + '20',
                color: finishedEraData?.color 
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: finishedEraData?.color }} />
              {finishedEraData?.name}
            </div>
          </div>
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{score} / {ROUNDS}</div>
          <div className="text-purple-300 text-sm mt-1">{percentage}% Correct</div>
          <p className="text-gray-400 text-sm mt-3 max-w-sm mx-auto">{message}</p>
        </div>

        {/* History */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Round Summary</div>
          <div className="grid grid-cols-10 gap-1">
            {history.map((h, i) => (
              <div
                key={i}
                className={`aspect-square rounded flex items-center justify-center text-xs font-bold ${
                  h.correct ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}
                title={`${h.player.fullName} #${h.player.jerseyNumber} - You said: ${h.yourAnswer}`}
              >
                {h.correct ? '✓' : '✗'}
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            {history.filter(h => !h.correct).map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-red-400">✗</span>
                <span className="text-white">{h.player.fullName}</span>
                <span className="text-gray-500">•</span>
                <span className="text-green-400">#{h.player.jerseyNumber}</span>
                <span className="text-gray-500">(you said #{h.yourAnswer})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={resetGame}
            className="flex items-center justify-center gap-2 flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold rounded-xl transition-all duration-150"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all duration-150"
          >
            Main Menu
          </button>
        </div>
      </div>
    );
  }

  // Game screen
  const selectedEraData = COACHING_ERAS.find(e => e.id === selectedEra);
  
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: selectedEraData?.color }}
          />
          <span className="text-xs text-gray-500 uppercase tracking-widest">
            {selectedEraData?.name}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          Round <span className="text-white font-bold">{round}</span> of {ROUNDS}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < history.length
                ? history[i].correct
                  ? 'bg-green-500'
                  : 'bg-red-500'
                : i === history.length
                ? 'bg-purple-500'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Score */}
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-widest">Score</div>
        <div className="text-2xl font-black text-white">{score}</div>
      </div>

      {/* Player card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">
          {currentPlayer?.seasons?.[0] || 'Kentucky'}
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white leading-tight">
          {currentPlayer?.fullName}
        </div>
        <div className="text-sm text-gray-400 mt-2">
          {currentPlayer?.primaryPosition}
        </div>
        
        {gameState === 'answered' && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className={`text-lg font-bold ${
              selectedAnswer === currentPlayer?.jerseyNumber || 
              fillInput === currentPlayer?.jerseyNumber ||
              (fillInput === '0' && currentPlayer?.jerseyNumber === '00') ||
              (fillInput === '00' && currentPlayer?.jerseyNumber === '0')
                ? 'text-green-400' : 'text-red-400'
            }`}>
              {selectedAnswer === currentPlayer?.jerseyNumber || 
               fillInput === currentPlayer?.jerseyNumber ||
               (fillInput === '0' && currentPlayer?.jerseyNumber === '00') ||
               (fillInput === '00' && currentPlayer?.jerseyNumber === '0')
                ? 'Correct!' : 'Wrong!'}
            </div>
            <div className="text-white text-xl mt-1">
              Jersey #{currentPlayer?.jerseyNumber}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      {mode === 'multiple' ? (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = opt === currentPlayer?.jerseyNumber;
            const showCorrect = gameState === 'answered' && isCorrect;
            const showWrong = gameState === 'answered' && isSelected && !isCorrect;
            
            return (
              <button
                key={opt}
                onClick={() => handleMultipleChoice(opt)}
                disabled={gameState !== 'playing'}
                className={`py-4 px-4 rounded-xl font-bold text-lg transition-all duration-150 ${
                  showCorrect
                    ? 'bg-green-500/20 border-2 border-green-500 text-green-300'
                    : showWrong
                    ? 'bg-red-500/20 border-2 border-red-500 text-red-300'
                    : isSelected
                    ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-300'
                    : 'bg-white/5 border border-white/15 text-white hover:bg-white/10'
                }`}
              >
                #{opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={fillInput}
              onChange={(e) => setFillInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              onKeyDown={(e) => e.key === 'Enter' && handleFillSubmit()}
              disabled={gameState !== 'playing'}
              placeholder="##"
              className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-4 text-center text-2xl font-bold text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
            <button
              onClick={handleFillSubmit}
              disabled={gameState !== 'playing' || !fillInput}
              className="px-6 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
            >
              Go
            </button>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Enter the jersey number (0-99)
          </div>
        </div>
      )}

      {/* Next button */}
      {gameState === 'answered' && (
        <button
          onClick={nextRound}
          className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all animate-pulse"
        >
          {round >= ROUNDS ? 'See Results' : 'Next Round'}
        </button>
      )}

      {/* Give up / Skip */}
      {gameState === 'playing' && (
        <button
          onClick={() => {
            if (mode === 'multiple') {
              handleMultipleChoice('wrong');
            } else {
              setFillInput('wrong');
              handleFillSubmit();
            }
          }}
          className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          Skip this player →
        </button>
      )}
    </div>
  );
}

export default JerseyGame;
