import { useState, useCallback, useEffect } from 'react';
import { players } from '../data/players.js';
import { COACHING_ERAS, playerBelongsToEra } from '../data/coaches.js';
import { HOMETOWN_DATA, STATE_CITIES_MAP } from '../data/hometownData.js';
import { Trophy, RotateCcw, MapPin, ChevronRight, User, Home } from 'lucide-react';

const ROUNDS = 10;

// Build comprehensive state->cities map from imported data
const ALL_STATE_CITIES = {};
Object.values(HOMETOWN_DATA).forEach(h => {
  if (!ALL_STATE_CITIES[h.state]) {
    ALL_STATE_CITIES[h.state] = new Set();
  }
  ALL_STATE_CITIES[h.state].add(h.city);
});
// Convert sets to arrays
Object.keys(ALL_STATE_CITIES).forEach(state => {
  ALL_STATE_CITIES[state] = [...ALL_STATE_CITIES[state]];
});

// All unique states from data
const ALL_STATES = Object.keys(ALL_STATE_CITIES).sort();

function getPlayersForEra(eraId) {
  return players.filter(p => HOMETOWN_DATA[p.id] && playerBelongsToEra(p, eraId));
}

function getRandom(arr, exclude = []) {
  const filtered = arr.filter(item => !exclude.includes(item.id));
  if (filtered.length === 0) {
    return undefined;
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function generateWrongStates(correctState) {
  const wrong = new Set();
  while (wrong.size < 3) {
    const state = ALL_STATES[Math.floor(Math.random() * ALL_STATES.length)];
    if (state !== correctState) wrong.add(state);
  }
  return Array.from(wrong);
}

function generateWrongCities(correctCity, correctState) {
  const wrong = new Set();
  // First try to get cities from the same state
  const sameStateCities = ALL_STATE_CITIES[correctState] || [];
  const otherCities = sameStateCities.filter(c => c !== correctCity);
  
  // Add cities from same state first
  while (wrong.size < 3 && otherCities.length > 0) {
    const city = otherCities[Math.floor(Math.random() * otherCities.length)];
    if (city !== correctCity && !wrong.has(city)) {
      wrong.add(city);
    }
  }
  
  // If we need more, get from other states
  if (wrong.size < 3) {
    const allCities = Object.values(ALL_STATE_CITIES).flat();
    while (wrong.size < 3) {
      const city = allCities[Math.floor(Math.random() * allCities.length)];
      if (city !== correctCity && !wrong.has(city)) {
        wrong.add(city);
      }
    }
  }
  
  return Array.from(wrong);
}

function HometownGame({ onBack }) {
  const [phase, setPhase] = useState('era-select');
  const [selectedEra, setSelectedEra] = useState(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'answered', 'finished'
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [usedPlayers, setUsedPlayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [roundScore, setRoundScore] = useState({ state: 0, city: 0 });

  const selectEra = useCallback((eraId) => {
    setSelectedEra(eraId);
    const playersForEra = getPlayersForEra(eraId);
    console.log('Selected era:', eraId, 'Players found:', playersForEra.length);
    setAvailablePlayers(playersForEra);
    setPhase('mode-select');
  }, []);

  const setupRound = useCallback((player) => {
    const hometown = HOMETOWN_DATA[player.id];
    const wrongStates = generateWrongStates(hometown.state);
    const wrongCities = generateWrongCities(hometown.city, hometown.state);
    
    setStateOptions([...wrongStates, hometown.state].sort(() => Math.random() - 0.5));
    setCityOptions([...wrongCities, hometown.city].sort(() => Math.random() - 0.5));
    setSelectedState(null);
    setSelectedCity(null);
    setRoundScore({ state: 0, city: 0 });
    setGameState('playing');
  }, []);

  const startGame = useCallback(() => {
    if (availablePlayers.length === 0) {
      console.error('No available players for this era');
      return;
    }
    
    setPhase('playing');
    setRound(1);
    setScore(0);
    setUsedPlayers([]);
    setHistory([]);
    
    const player = getRandom(availablePlayers);
    if (!player) {
      console.error('Failed to get random player');
      return;
    }
    
    setCurrentPlayer(player);
    setUsedPlayers([player.id]);
    setupRound(player);
  }, [availablePlayers, setupRound]);

  const nextRound = useCallback(() => {
    if (round >= ROUNDS) {
      setGameState('finished');
      return;
    }
    
    const player = getRandom(availablePlayers, usedPlayers);
    if (!player) {
      console.error('No more available players for next round');
      setGameState('finished');
      return;
    }
    
    setCurrentPlayer(player);
    setUsedPlayers(prev => [...prev, player.id]);
    setRound(prev => prev + 1);
    setupRound(player);
  }, [round, availablePlayers, usedPlayers, setupRound]);

  const handleStateAnswer = useCallback((answer) => {
    if (gameState !== 'playing' || selectedState !== null) return;
    
    const hometown = HOMETOWN_DATA[currentPlayer.id];
    const correct = answer === hometown.state;
    
    setSelectedState(answer);
    if (correct) {
      setRoundScore(prev => ({ ...prev, state: 1 }));
      setScore(prev => prev + 1);
    }
    
    // Check if both answered
    if (selectedCity !== null || (selectedCity === null && correct)) {
      // Will check in useEffect or handle separately
    }
  }, [gameState, selectedState, selectedCity, currentPlayer]);

  const handleCityAnswer = useCallback((answer) => {
    if (gameState !== 'playing' || selectedCity !== null) return;
    
    const hometown = HOMETOWN_DATA[currentPlayer.id];
    const correct = answer === hometown.city;
    
    setSelectedCity(answer);
    if (correct) {
      setRoundScore(prev => ({ ...prev, city: 2 }));
      setScore(prev => prev + 2);
    }
  }, [gameState, selectedCity, currentPlayer]);

  // Effect to check when both are answered
  useEffect(() => {
    if (selectedState !== null && selectedCity !== null && gameState === 'playing') {
      setGameState('answered');
      
      const hometown = HOMETOWN_DATA[currentPlayer.id];
      const stateCorrect = selectedState === hometown.state;
      const cityCorrect = selectedCity === hometown.city;
      
      setHistory(prev => [...prev, {
        player: currentPlayer,
        stateCorrect,
        cityCorrect,
        yourState: selectedState,
        yourCity: selectedCity,
        correctState: hometown.state,
        correctCity: hometown.city,
        roundScore: (stateCorrect ? 1 : 0) + (cityCorrect ? 2 : 0)
      }]);
    }
  }, [selectedState, selectedCity, gameState, currentPlayer]);

  const resetGame = useCallback(() => {
    setPhase('era-select');
    setSelectedEra(null);
    setRound(0);
    setScore(0);
    setGameState('playing');
    setCurrentPlayer(null);
    setStateOptions([]);
    setCityOptions([]);
    setSelectedState(null);
    setSelectedCity(null);
    setUsedPlayers([]);
    setHistory([]);
    setAvailablePlayers([]);
    setRoundScore({ state: 0, city: 0 });
  }, []);

  const selectedEraData = COACHING_ERAS.find(e => e.id === selectedEra);
  const hometown = currentPlayer ? HOMETOWN_DATA[currentPlayer.id] : null;

  // Era selection screen
  if (phase === 'era-select') {
    const eraStats = COACHING_ERAS.map(era => ({
      ...era,
      playerCount: getPlayersForEra(era.id).length
    })).filter(e => e.playerCount >= 5);

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 text-center animate-fadeIn">
        <div>
          <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-500/30 text-green-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
            <MapPin className="w-4 h-4" /> Hometown Guesser
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            PICK AN <span className="text-green-400">ERA</span>
          </h1>
          <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
            Guess where Kentucky players are from. First the state, then the city!
          </p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Select Coaching Era</div>
          {eraStats.map((era) => (
            <button
              key={era.id}
              onClick={() => selectEra(era.id)}
              disabled={era.playerCount < 10}
              className={`flex items-center gap-3 w-full py-3 px-3 rounded-xl transition-all text-left ${
                era.playerCount < 10 ? 'opacity-40 cursor-not-allowed bg-white/5' : 'bg-white/5 hover:bg-white/10 border border-white/15'
              }`}
            >
              <div className="w-3 h-10 rounded flex-shrink-0" style={{ backgroundColor: era.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate">{era.name}</div>
                <div className="text-gray-400 text-xs">
                  {era.startYear}-{era.endYear} • {era.playerCount} players
                  {era.championships && <span className="text-yellow-400 ml-1">🏆 {era.championships.length}</span>}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-500 text-center max-w-sm">
          Hometown data sourced from bigbluehistory.net
        </div>

        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back to Main Menu
        </button>
      </div>
    );
  }

  // Start screen
  if (phase === 'mode-select') {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 text-center animate-fadeIn">
        <div>
          <div className="inline-flex items-center gap-2 border text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
               style={{ borderColor: selectedEraData?.color + '60', backgroundColor: selectedEraData?.color + '20', color: selectedEraData?.color }}>
            <User className="w-4 h-4" /> {selectedEraData?.name}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            HOMETOWN <span style={{ color: selectedEraData?.color }}>GUESSER</span>
          </h1>
          <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
            {availablePlayers.length} players • 10 rounds • 1pt state, 2pts city
          </p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Home className="w-5 h-5 text-green-300" />
            </div>
            <div>
              <div className="text-white font-semibold">How It Works</div>
              <div className="text-gray-400 text-xs">Two-part guessing game</div>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">1.</span>
              <span>Guess the <strong>state/country</strong> first</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">2.</span>
              <span>Then guess the <strong>city</strong> (revealed after state)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">3.</span>
              <span><strong>1 point</strong> for state, <strong>2 points</strong> for city • Max 3 points per player</span>
            </div>
          </div>
        </div>

        <button
          onClick={startGame}
          className="w-full py-4 px-6 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/30"
        >
          Start Game
        </button>

        <button onClick={() => setPhase('era-select')} className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Change Era
        </button>
      </div>
    );
  }

  // Finished screen
  if (gameState === 'finished') {
    const maxScore = ROUNDS * 3;
    const percentage = Math.round((score / maxScore) * 100);
    let message = percentage === 100 ? 'Perfect! Geography master!' : percentage >= 70 ? 'Great job! You know your Wildcats!' : percentage >= 40 ? 'Not bad, keep learning!' : 'Time to study those hometowns!';

    return (
      <div className="w-full max-w-xl mx-auto flex flex-col gap-6 animate-fadeIn">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 border text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3"
               style={{ borderColor: selectedEraData?.color + '60', backgroundColor: selectedEraData?.color + '20', color: selectedEraData?.color }}>
            {selectedEraData?.name}
          </div>
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{score} / {maxScore}</div>
          <div className="text-green-300 text-sm mt-1">{percentage}% Correct</div>
          <p className="text-gray-400 text-sm mt-3 max-w-sm mx-auto">{message}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Round Summary</div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {h.roundScore === 3 ? (
                  <span className="text-green-400">✓</span>
                ) : h.roundScore === 0 ? (
                  <span className="text-red-400">✗</span>
                ) : (
                  <span className="text-yellow-400">◐</span>
                )}
                <span className="text-white">{h.player.fullName}</span>
                <span className="text-gray-500">•</span>
                <span className="text-green-400">+{h.roundScore} pts</span>
                {(h.roundScore < 3) && (
                  <span className="text-gray-500">
                    ({h.correctCity}, {h.correctState})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={resetGame} className="flex items-center justify-center gap-2 flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold rounded-xl transition-all">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <button onClick={onBack} className="flex items-center justify-center gap-2 flex-1 py-3 px-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all">
            Main Menu
          </button>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedEraData?.color }} />
          <span className="text-xs text-gray-500 uppercase tracking-widest">{selectedEraData?.name}</span>
        </div>
        <div className="text-xs text-gray-400">
          Round {round} of {ROUNDS}
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {Array.from({ length: ROUNDS }).map((_, i) => {
          const roundComplete = i < history.length;
          const roundScore = roundComplete ? history[i]?.roundScore : 0;
          const isCurrent = i === history.length;
          return (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${roundComplete ? (roundScore === 3 ? 'bg-green-500' : roundScore === 0 ? 'bg-red-500' : 'bg-yellow-500') : isCurrent ? 'bg-green-500' : 'bg-white/10'}`} />
          );
        })}
      </div>

      {/* Score */}
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-widest">Score</div>
        <div className="text-2xl font-black text-white">{score} <span className="text-gray-500 text-sm">/ {ROUNDS * 3}</span></div>
      </div>

      {/* Player card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">
          {currentPlayer?.seasons?.[0] || 'Kentucky'}
        </div>
        <div className="text-2xl font-black text-white leading-tight">
          {currentPlayer?.fullName}
        </div>
        <div className="text-sm text-gray-400 mt-2">
          {currentPlayer?.primaryPosition}
        </div>
        
        {gameState === 'answered' && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-sm text-gray-400 mb-2">
              {hometown?.city}, {hometown?.state}
            </div>
            <div className="flex justify-center gap-4">
              <div className={`text-sm font-bold ${selectedState === hometown?.state ? 'text-green-400' : 'text-red-400'}`}>
                State/Country: {selectedState === hometown?.state ? '✓ +1' : '✗ 0'}
              </div>
              <div className={`text-sm font-bold ${selectedCity === hometown?.city ? 'text-green-400' : 'text-red-400'}`}>
                City: {selectedCity === hometown?.city ? '✓ +2' : '✗ 0'}
              </div>
            </div>
            <div className="text-green-400 font-bold text-lg mt-2">
              +{roundScore.state + roundScore.city} points
            </div>
          </div>
        )}
      </div>

      {/* State Question */}
      <div className={`bg-white/5 border rounded-2xl p-4 ${gameState === 'answered' && selectedState !== hometown?.state ? 'border-red-500/30' : 'border-white/10'}`}>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="text-blue-400 font-bold">1.</span> State/Country <span className="text-gray-600">(1 point)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stateOptions.map((opt) => {
            const isCorrect = opt === hometown?.state;
            const isSelected = selectedState === opt;
            const showCorrect = gameState === 'answered' && isCorrect;
            const showWrong = gameState === 'answered' && isSelected && !isCorrect;
            const disabled = gameState !== 'playing' || selectedState !== null;
            
            return (
              <button
                key={opt}
                onClick={() => handleStateAnswer(opt)}
                disabled={disabled}
                className={`py-3 px-3 rounded-lg font-semibold text-sm transition-all duration-150 ${
                  showCorrect
                    ? 'bg-green-500/20 border-2 border-green-500 text-green-300'
                    : showWrong
                    ? 'bg-red-500/20 border-2 border-red-500 text-red-300'
                    : isSelected
                    ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-300'
                    : 'bg-white/5 border border-white/15 text-white hover:bg-white/10'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {selectedState !== null && selectedState !== hometown?.state && (
          <div className="mt-3 text-sm text-center">
            <span className="text-gray-400">Correct: </span>
            <span className="text-green-400 font-bold">{hometown?.state}</span>
          </div>
        )}
      </div>

      {/* City Question */}
      {selectedState !== null && (
        <div className={`bg-white/5 border rounded-2xl p-4 ${gameState === 'answered' && selectedCity !== hometown?.city ? 'border-red-500/30' : 'border-white/10'}`}>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="text-purple-400 font-bold">2.</span> City <span className="text-gray-600">(2 points)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {cityOptions.map((opt) => {
              const isCorrect = opt === hometown?.city;
              const isSelected = selectedCity === opt;
              const showCorrect = gameState === 'answered' && isCorrect;
              const showWrong = gameState === 'answered' && isSelected && !isCorrect;
              const disabled = gameState !== 'playing' || selectedCity !== null;
              
              return (
                <button
                  key={opt}
                  onClick={() => handleCityAnswer(opt)}
                  disabled={disabled}
                  className={`py-3 px-3 rounded-lg font-semibold text-sm transition-all duration-150 ${
                    showCorrect
                      ? 'bg-green-500/20 border-2 border-green-500 text-green-300'
                      : showWrong
                      ? 'bg-red-500/20 border-2 border-red-500 text-red-300'
                      : isSelected
                      ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-300'
                      : 'bg-white/5 border border-white/15 text-white hover:bg-white/10'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
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
    </div>
  );
}

export default HometownGame;
