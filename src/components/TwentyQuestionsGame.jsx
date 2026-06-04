import { useState, useCallback, useMemo } from 'react';
import { players } from '../data/players.js';
import { COACHING_ERAS, playerBelongsToEra } from '../data/coaches.js';
import { HOMETOWN_DATA } from '../data/hometownData.js';
import { playerSeasonStatsById } from '../data/playerSeasonStats.js';
import { Trophy, RotateCcw, HelpCircle, ChevronRight, User, Search, Lightbulb } from 'lucide-react';

const MAX_ROUNDS = 20;

function getPlayerCareerStats(playerId) {
  const stats = playerSeasonStatsById[playerId];
  if (!stats) return null;
  let totalPts = 0, totalReb = 0, totalAst = 0, totalStl = 0, totalBlk = 0, totalGames = 0;
  const seasons = Object.keys(stats);
  seasons.forEach(season => {
    const s = stats[season];
    totalPts += (s.pts || 0) * (s.games || 0);
    totalReb += (s.reb || 0) * (s.games || 0);
    totalAst += (s.ast || 0) * (s.games || 0);
    totalStl += (s.stl || 0) * (s.games || 0);
    totalBlk += (s.blk || 0) * (s.games || 0);
    totalGames += s.games || 0;
  });
  if (totalGames === 0) return null;
  return {
    ppg: totalPts / totalGames,
    rpg: totalReb / totalGames,
    apg: totalAst / totalGames,
    spg: totalStl / totalGames,
    bpg: totalBlk / totalGames,
    games: totalGames,
    seasons: seasons.length
  };
}

function getBestSeasonStats(playerId) {
  const stats = playerSeasonStatsById[playerId];
  if (!stats) return null;
  let bestPts = 0, bestReb = 0, bestAst = 0;
  let bestSeason = null;
  Object.entries(stats).forEach(([season, s]) => {
    if (s.pts > bestPts) {
      bestPts = s.pts;
      bestReb = s.reb || 0;
      bestAst = s.ast || 0;
      bestSeason = season;
    }
  });
  return { pts: bestPts, reb: bestReb, ast: bestAst, season: bestSeason };
}

function getPlayersForEra(eraId) {
  const filterFn = (p) => {
    const stats = getPlayerCareerStats(p.id);
    return stats && stats.ppg > 5;
  };
  if (eraId === 'all') return players.filter(filterFn);
  return players.filter(p => filterFn(p) && playerBelongsToEra(p, eraId));
}

function generateAllClues(player) {
  const hometown = HOMETOWN_DATA[player.id];
  const careerStats = getPlayerCareerStats(player.id);
  const bestStats = getBestSeasonStats(player.id);
  const seasons = player.seasons || [];
  const firstSeason = seasons[0];
  const lastSeason = seasons[seasons.length - 1];
  const yearsPlayed = seasons.length;
  const clues = [];

  if (careerStats) {
    const isSingleSeason = careerStats.seasons === 1;
    const careerLabel = isSingleSeason ? 'Season' : 'Career';
    const seasonText = isSingleSeason ? '1 season' : `${careerStats.seasons} seasons`;
    
    clues.push({ type: 'stat', text: `${careerLabel}: ${careerStats.ppg.toFixed(1)} PPG, ${careerStats.rpg.toFixed(1)} RPG`, difficulty: 'hard' });
    clues.push({ type: 'stat', text: `Played ${careerStats.games} games over ${seasonText}`, difficulty: 'hard' });
    if (careerStats.apg >= 3) {
      clues.push({ type: 'stat', text: `Averaged ${careerStats.apg.toFixed(1)} APG`, difficulty: 'hard' });
    } else if (careerStats.bpg >= 1) {
      clues.push({ type: 'stat', text: `Averaged ${careerStats.bpg.toFixed(1)} BPG`, difficulty: 'hard' });
    } else {
      clues.push({ type: 'stat', text: `Averaged ${careerStats.spg.toFixed(1)} SPG`, difficulty: 'hard' });
    }
    clues.push({ type: 'stat', text: `${careerLabel}: ${careerStats.ppg.toFixed(1)} PPG / ${careerStats.rpg.toFixed(1)} RPG / ${careerStats.apg.toFixed(1)} APG`, difficulty: 'hard' });
  } else {
    clues.push({ type: 'stat', text: `Played ${yearsPlayed} season${yearsPlayed > 1 ? 's' : ''} at Kentucky`, difficulty: 'hard' });
    clues.push({ type: 'stat', text: `First season: ${firstSeason}`, difficulty: 'hard' });
    clues.push({ type: 'stat', text: `Jersey #${player.jerseyNumber || '?'}`, difficulty: 'hard' });
    clues.push({ type: 'stat', text: `Last season: ${lastSeason}`, difficulty: 'hard' });
  }

  if (bestStats && bestStats.pts > 0) {
    clues.push({ type: 'peak', text: `Best season: ${bestStats.pts.toFixed(1)} PPG (${bestStats.season})`, difficulty: 'medium' });
    clues.push({ type: 'peak', text: `Peak: ${bestStats.pts.toFixed(1)} PPG, ${bestStats.reb.toFixed(1)} RPG`, difficulty: 'medium' });
  } else {
    clues.push({ type: 'era', text: `Active: ${firstSeason} to ${lastSeason}`, difficulty: 'medium' });
    clues.push({ type: 'era', text: `${yearsPlayed} years in program`, difficulty: 'medium' });
  }
  clues.push({ type: 'position', text: `Position: ${player.primaryPosition}`, difficulty: 'medium' });

  if (player.height) {
    clues.push({ type: 'physical', text: `Height: ${Math.floor(player.height / 12)}'${player.height % 12}"`, difficulty: 'medium' });
  } else {
    clues.push({ type: 'era', text: `Era: ${firstSeason.split('-')[0]}s`, difficulty: 'medium' });
  }
  clues.push({ type: 'era', text: `Played ${firstSeason} to ${lastSeason}`, difficulty: 'medium' });
  if (player.jerseyNumber) {
    clues.push({ type: 'number', text: `Wore jersey #${player.jerseyNumber}`, difficulty: 'medium' });
  } else {
    clues.push({ type: 'era', text: `${yearsPlayed} season${yearsPlayed > 1 ? 's' : ''}`, difficulty: 'medium' });
  }

  if (hometown) {
    clues.push({ type: 'hometown', text: `From ${hometown.state}`, difficulty: 'easy' });
    clues.push({ type: 'hometown', text: `Hometown: ${hometown.state}`, difficulty: 'easy' });
    clues.push({ type: 'hometown', text: `From ${hometown.city} area`, difficulty: 'easy' });
    clues.push({ type: 'hometown', text: `Hometown: ${hometown.city}, ${hometown.state}`, difficulty: 'easy' });
  } else {
    clues.push({ type: 'position', text: `Primary: ${player.primaryPosition}`, difficulty: 'easy' });
    clues.push({ type: 'era', text: `Era: ${firstSeason}`, difficulty: 'easy' });
    clues.push({ type: 'era', text: `Final: ${lastSeason}`, difficulty: 'easy' });
    clues.push({ type: 'era', text: `${yearsPlayed} seasons`, difficulty: 'easy' });
  }

  const firstName = player.fullName.split(' ')[0];
  const lastName = player.fullName.split(' ').pop();
  clues.push({ type: 'name', text: `First name has ${firstName.length} letters`, difficulty: 'very-easy' });
  clues.push({ type: 'name', text: `Last name starts with "${lastName[0]}"`, difficulty: 'very-easy' });
  clues.push({ type: 'name', text: `First name starts with "${firstName[0]}"`, difficulty: 'very-easy' });
  clues.push({ type: 'name', text: `Last: ${lastName.substring(0, 2)}...`, difficulty: 'very-easy' });
  clues.push({ type: 'name', text: `First: ${firstName.substring(0, 2)}...`, difficulty: 'very-easy' });
  clues.push({ type: 'name', text: `${firstName[0]}. ${lastName[0]}...`, difficulty: 'very-easy' });

  return clues.slice(0, MAX_ROUNDS);
}

function getRandom(arr) {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function TwentyQuestionsGame({ onBack }) {
  const [phase, setPhase] = useState('era-select');
  const [selectedEra, setSelectedEra] = useState(null);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [mysteryPlayer, setMysteryPlayer] = useState(null);
  const [allClues, setAllClues] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [guessedCorrectly, setGuessedCorrectly] = useState(false);
  const [finalGuess, setFinalGuess] = useState(null);
  const [wrongGuessIds, setWrongGuessIds] = useState([]);

  const selectEra = useCallback((eraId) => {
    setSelectedEra(eraId);
    const playersForEra = getPlayersForEra(eraId);
    setAvailablePlayers(playersForEra);
    setPhase('mode-select');
  }, []);

  const startGame = useCallback(() => {
    const player = getRandom(availablePlayers);
    if (!player) return;
    
    setMysteryPlayer(player);
    setAllClues(generateAllClues(player));
    setRound(1);
    setScore(0);
    setGameState('playing');
    setSearchQuery('');
    setFeedback(null);
    setGuessedCorrectly(false);
    setFinalGuess(null);
    setWrongGuessIds([]);
    setPhase('playing');
  }, [availablePlayers]);

  const advanceRound = useCallback(() => {
    if (round >= MAX_ROUNDS || guessedCorrectly) {
      if (!guessedCorrectly) {
        setGameState('finished');
      }
      return;
    }
    setRound(prev => prev + 1);
    setFeedback(null); // Clear wrong guess feedback on new round
    setSearchQuery(''); // Clear search
  }, [round, guessedCorrectly]);

  const handleGuess = useCallback((guessedPlayer) => {
    if (gameState !== 'playing' || guessedCorrectly) return;
    
    const correct = guessedPlayer.id === mysteryPlayer.id;
    setFinalGuess(guessedPlayer);
    
    if (correct) {
      const roundPoints = Math.max(1, MAX_ROUNDS - round + 1);
      setScore(roundPoints);
      setGuessedCorrectly(true);
      setFeedback({ correct: true, points: roundPoints });
    } else {
      setWrongGuessIds(prev => [...prev, guessedPlayer.id]);
      setFeedback({ correct: false, guessedName: guessedPlayer.fullName, round });
    }
    
    setShowSuggestions(false);
  }, [gameState, mysteryPlayer, round, guessedCorrectly]);

  const handleSubmitGuess = useCallback(() => {
    if (!searchQuery.trim() || gameState !== 'playing') return;
    const match = availablePlayers.find(p => 
      p.fullName.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (match) {
      handleGuess(match);
    }
  }, [searchQuery, availablePlayers, handleGuess, gameState]);

  const finishGame = useCallback(() => {
    setGameState('finished');
  }, []);

  const resetGame = useCallback(() => {
    setPhase('era-select');
    setSelectedEra(null);
    setRound(1);
    setScore(0);
    setGameState('playing');
    setMysteryPlayer(null);
    setAllClues([]);
    setAvailablePlayers([]);
    setSearchQuery('');
    setShowSuggestions(false);
    setFeedback(null);
    setGuessedCorrectly(false);
    setFinalGuess(null);
    setWrongGuessIds([]);
  }, []);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || !showSuggestions || guessedCorrectly) return [];
    const query = searchQuery.toLowerCase();
    return availablePlayers
      .filter(p => p.fullName.toLowerCase().includes(query) && !wrongGuessIds.includes(p.id))
      .slice(0, 8);
  }, [searchQuery, availablePlayers, showSuggestions, guessedCorrectly, wrongGuessIds]);

  const selectedEraData = COACHING_ERAS.find(e => e.id === selectedEra);
  const visibleClues = allClues.slice(0, round);

  if (phase === 'era-select') {
    const eraStats = COACHING_ERAS.map(era => ({
      ...era,
      playerCount: getPlayersForEra(era.id).length
    })).filter(e => e.playerCount >= 1);

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 text-center animate-fadeIn">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-600/20 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
            <HelpCircle className="w-4 h-4" /> 20 Questions
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            PICK AN <span className="text-amber-400">ERA</span>
          </h1>
          <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
            Guess the mystery player from 20 progressively easier clues!
          </p>
        </div>
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Select Coaching Era</div>
          {eraStats.map((era) => (
            <button
              key={era.id}
              onClick={() => selectEra(era.id)}
              disabled={era.playerCount < 1}
              className={`flex items-center gap-3 w-full py-3 px-3 rounded-xl transition-all text-left ${
                era.playerCount < 1 ? 'opacity-40 cursor-not-allowed bg-white/5' : 'bg-white/5 hover:bg-white/10 border border-white/15'
              }`}
            >
              <div className="w-3 h-10 rounded flex-shrink-0" style={{ backgroundColor: era.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate">{era.name}</div>
                <div className="text-gray-400 text-xs">
                  {era.startYear}-{era.endYear} • {era.playerCount} players (&gt;5 PPG)
                  {era.championships && <span className="text-yellow-400 ml-1">🏆 {era.championships.length}</span>}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
            </button>
          ))}
        </div>
        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back to Main Menu
        </button>
      </div>
    );
  }

  if (phase === 'mode-select') {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 text-center animate-fadeIn">
        <div>
          <div className="inline-flex items-center gap-2 border text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
               style={{ borderColor: selectedEraData?.color + '60', backgroundColor: selectedEraData?.color + '20', color: selectedEraData?.color }}>
            <User className="w-4 h-4" /> {selectedEraData?.name}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            20 <span style={{ color: selectedEraData?.color }}>QUESTIONS</span>
          </h1>
          <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
            {availablePlayers.length} players (career avg &gt;5 PPG)
          </p>
        </div>
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-white font-semibold">How It Works</div>
              <div className="text-gray-400 text-xs">One mystery player, 20 rounds</div>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">1.</span>
              <span>One mystery player from the selected era</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">2.</span>
              <span>Each round reveals a new, easier clue</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">3.</span>
              <span>Guess at any time - earlier = more points!</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">4.</span>
              <span>Round 1 = 20 pts, Round 20 = 1 pt</span>
            </div>
          </div>
        </div>
        <button
          onClick={startGame}
          className="w-full py-4 px-6 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-600/30"
        >
          Start Game
        </button>
        <button onClick={() => setPhase('era-select')} className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Change Era
        </button>
      </div>
    );
  }

  if (gameState === 'finished' || guessedCorrectly) {
    const maxScore = 20;
    return (
      <div className="w-full max-w-xl mx-auto flex flex-col gap-6 animate-fadeIn">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 border text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3"
               style={{ borderColor: selectedEraData?.color + '60', backgroundColor: selectedEraData?.color + '20', color: selectedEraData?.color }}>
            {selectedEraData?.name}
          </div>
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{score} / {maxScore}</div>
          <div className="text-amber-300 text-sm mt-1">
            {guessedCorrectly ? `Guessed on Round ${round}` : 'Did not guess correctly'}
          </div>
          <p className="text-gray-400 text-sm mt-3">
            {guessedCorrectly ? `The player was: ${mysteryPlayer?.fullName}` : `The player was: ${mysteryPlayer?.fullName}`}
          </p>
          <p className="text-amber-400 text-sm mt-1">
            {guessedCorrectly ? 'Great job!' : 'Better luck next time!'}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Clues Revealed ({visibleClues.length})</div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {visibleClues.map((clue, i) => (
              <div key={i} className="text-sm text-gray-300 py-1 border-b border-white/5 last:border-0">
                <span className="text-amber-400 font-bold mr-2">{i + 1}.</span>
                {clue.text}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={resetGame} className="flex items-center justify-center gap-2 flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold rounded-xl transition-all">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <button onClick={onBack} className="flex items-center justify-center gap-2 flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all">
            Main Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedEraData?.color }} />
          <span className="text-xs text-gray-500 uppercase tracking-widest">{selectedEraData?.name}</span>
        </div>
        <div className="text-xs text-gray-400">
          Round <span className="text-white font-bold">{round}</span> of {MAX_ROUNDS}
        </div>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: MAX_ROUNDS }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${
            i < round ? 'bg-amber-500' : 'bg-white/10'
          }`} />
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-2 bg-amber-600/20 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-2">
            <HelpCircle className="w-3 h-3" /> Mystery Player
          </div>
          <div className="text-2xl font-black text-white">?</div>
          <div className="text-xs text-gray-500 mt-1">
            Potential points: <span className="text-amber-400 font-bold">{MAX_ROUNDS - round + 1}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Clues:</div>
          {visibleClues.map((clue, idx) => (
            <div key={idx} className={`flex items-center gap-2 p-2 rounded text-sm ${
              clue.difficulty === 'hard' ? 'bg-red-500/10 text-red-200' :
              clue.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-200' :
              clue.difficulty === 'easy' ? 'bg-green-500/10 text-green-200' :
              'bg-blue-500/10 text-blue-200'
            }`}>
              <span className="text-xs font-bold">{idx + 1}</span>
              <span>{clue.text}</span>
            </div>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl text-center ${feedback.correct ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
          {feedback.correct ? (
            <>
              <div className="text-green-400 font-bold text-lg">Correct! 🎉</div>
              <div className="text-white text-sm mt-1">It was {mysteryPlayer?.fullName}</div>
              <div className="text-green-300 text-sm mt-1">+{feedback.points} points (Round {round})</div>
            </>
          ) : (
            <>
              <div className="text-red-400 font-bold">Wrong guess (Round {feedback.round})</div>
              <div className="text-gray-400 text-xs mt-1">{feedback.guessedName} is not the answer</div>
              <div className="text-gray-500 text-xs mt-1">Blocked from guessing again</div>
            </>
          )}
        </div>
      )}

      {!guessedCorrectly && (
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type player name..."
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/15 rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
                  {suggestions.map(player => (
                    <button
                      key={player.id}
                      onClick={() => handleGuess(player)}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      {player.fullName}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSubmitGuess}
              disabled={!searchQuery.trim()}
              className="px-4 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
            >
              Guess
            </button>
          </div>
        </div>
      )}

      {round < MAX_ROUNDS && !guessedCorrectly && (
        <button
          onClick={advanceRound}
          className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 hover:text-white font-semibold rounded-xl transition-all"
        >
          Next Clue →
        </button>
      )}

      {round >= MAX_ROUNDS && !guessedCorrectly && (
        <button
          onClick={finishGame}
          className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all"
        >
          Give Up / End Game
        </button>
      )}
    </div>
  );
}

export default TwentyQuestionsGame;
