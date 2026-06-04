import { useState, useCallback, useEffect } from 'react';
import { players } from '../data/players.js';
import { COACHING_ERAS, playerBelongsToEra } from '../data/coaches.js';
import { HOMETOWN_DATA, STATE_CITIES_MAP } from '../data/hometownData.js';
import { Trophy, RotateCcw, MapPin, ChevronRight, User, Home } from 'lucide-react';

const ROUNDS = 10;

// Memoize the data processing to avoid infinite loops
let ALL_STATE_CITIES = null;
let ALL_STATES = null;

function initializeData() {
  if (ALL_STATE_CITIES === null) {
    console.log('Initializing HometownGame data...');
    ALL_STATE_CITIES = {};
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
    ALL_STATES = Object.keys(ALL_STATE_CITIES).sort();
    console.log('HometownGame data initialized');
  }
}

function getPlayersForEra(eraId) {
  if (!ALL_STATE_CITIES) initializeData();
  return players.filter(p => HOMETOWN_DATA[p.id] && playerBelongsToEra(p, eraId));
}

function getRandom(arr, exclude = []) {
  const filtered = arr.filter(item => !exclude.includes(item));
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function generateWrongStates(correctState) {
  if (!ALL_STATES) initializeData();
  const wrong = new Set();
  while (wrong.size < 3) {
    const state = ALL_STATES[Math.floor(Math.random() * ALL_STATES.length)];
    if (state !== correctState) wrong.add(state);
  }
  return Array.from(wrong);
}

function generateWrongCities(correctCity, correctState) {
  if (!ALL_STATE_CITIES) initializeData();
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

function HometownGameFixed({ onBack }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('menu'); // menu, playing, finished
  const [selectedEra, setSelectedEra] = useState('all');
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [correctState, setCorrectState] = useState('');
  const [correctCity, setCorrectCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [roundResults, setRoundResults] = useState([]);
  const [usedPlayers, setUsedPlayers] = useState(new Set());

  // Initialize data on component mount
  useEffect(() => {
    initializeData();
  }, []);

  const startGame = useCallback(() => {
    setCurrentRound(1);
    setScore(0);
    setGameState('playing');
    setRoundResults([]);
    setUsedPlayers(new Set());
    nextQuestion();
  }, []);

  const nextQuestion = useCallback(() => {
    if (!ALL_STATE_CITIES) initializeData();
    
    const availablePlayers = getPlayersForEra(selectedEra).filter(p => !usedPlayers.has(p.id));
    if (availablePlayers.length === 0) {
      setGameState('finished');
      return;
    }

    const player = getRandom(availablePlayers);
    const hometown = HOMETOWN_DATA[player.id];
    
    setCurrentPlayer(player);
    setCorrectState(hometown.state);
    setCorrectCity(hometown.city);
    setSelectedState('');
    setSelectedCity('');
    setShowResult(false);
    
    setUsedPlayers(prev => new Set([...prev, player.id]));
  }, [selectedEra, usedPlayers]);

  const submitAnswer = useCallback(() => {
    const stateCorrect = selectedState === correctState;
    const cityCorrect = selectedCity === correctCity;
    const points = (stateCorrect ? 1 : 0) + (cityCorrect ? 1 : 0);
    
    setScore(prev => prev + points);
    setRoundResults(prev => [...prev, {
      player: currentPlayer,
      correctState,
      correctCity,
      selectedState,
      selectedCity,
      points
    }]);
    
    setShowResult(true);
    
    setTimeout(() => {
      if (currentRound >= ROUNDS) {
        setGameState('finished');
      } else {
        setCurrentRound(prev => prev + 1);
        nextQuestion();
      }
    }, 2000);
  }, [selectedState, selectedCity, correctState, correctCity, currentPlayer, currentRound, nextQuestion]);

  if (gameState === 'menu') {
    return (
      <div style={{ padding: '20px', backgroundColor: '#0033A0', color: 'white', minHeight: '100vh' }}>
        <h1>Hometown Game</h1>
        <p>Test your knowledge of Kentucky basketball players' hometowns!</p>
        <div style={{ marginTop: '20px' }}>
          <label>Select Era: </label>
          <select 
            value={selectedEra} 
            onChange={(e) => setSelectedEra(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            {COACHING_ERAS.filter(era => era.id !== 'all').map(era => (
              <option key={era.id} value={era.id}>{era.name}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={startGame}
          style={{ 
            marginTop: '20px', 
            padding: '15px 30px', 
            backgroundColor: 'white', 
            color: '#0033A0', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Start Game
        </button>
        <button 
          onClick={onBack}
          style={{ 
            marginTop: '20px', 
            padding: '10px 20px', 
            backgroundColor: 'transparent', 
            color: 'white', 
            border: '1px solid white',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
      </div>
    );
  }

  if (gameState === 'playing' && currentPlayer) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#0033A0', color: 'white', minHeight: '100vh' }}>
        <h2>Round {currentRound} of {ROUNDS}</h2>
        <p>Score: {score}</p>
        
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderRadius: '8px' 
        }}>
          <h3>Where is {currentPlayer.fullName} from?</h3>
          
          <div style={{ marginTop: '20px' }}>
            <label>State: </label>
            <select 
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              disabled={showResult}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="">Select a state</option>
              {generateWrongStates(correctState).concat(correctState).sort().map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <label>City: </label>
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={showResult}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="">Select a city</option>
              {generateWrongCities(correctCity, correctState).concat(correctCity).sort().map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          {!showResult && (
            <button 
              onClick={submitAnswer}
              disabled={!selectedState || !selectedCity}
              style={{ 
                marginTop: '20px', 
                padding: '10px 20px', 
                backgroundColor: 'white', 
                color: '#0033A0', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Submit Answer
            </button>
          )}
          
          {showResult && (
            <div style={{ marginTop: '20px' }}>
              <p><strong>Answer:</strong> {correctCity}, {correctState}</p>
              <p><strong>Your answer:</strong> {selectedCity}, {selectedState}</p>
              <p><strong>Points:</strong> {(selectedState === correctState ? 1 : 0) + (selectedCity === correctCity ? 1 : 0)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div style={{ padding: '20px', backgroundColor: '#0033A0', color: 'white', minHeight: '100vh' }}>
        <h1>Game Over!</h1>
        <p>Final Score: {score} out of {ROUNDS * 2}</p>
        
        <div style={{ marginTop: '20px' }}>
          <h3>Results:</h3>
          {roundResults.map((result, index) => (
            <div key={index} style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: '5px' 
            }}>
              <p>{result.player.fullName}</p>
              <p>Correct: {result.correctCity}, {result.correctState}</p>
              <p>Your answer: {result.selectedCity}, {result.selectedState}</p>
              <p>Points: {result.points}</p>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={startGame}
            style={{ 
              padding: '15px 30px', 
              backgroundColor: 'white', 
              color: '#0033A0', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Play Again
          </button>
          <button 
            onClick={onBack}
            style={{ 
              marginLeft: '20px',
              padding: '15px 30px', 
              backgroundColor: 'transparent', 
              color: 'white', 
              border: '1px solid white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default HometownGameFixed;
