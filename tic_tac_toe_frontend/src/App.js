import React, { useState } from 'react';
import './App.css';

// Theme color mapping as per requirements
const COLORS = {
  accent: '#ff9800',
  primary: '#1976d2',
  secondary: '#424242',
  bg: '#fff',
  lightGray: '#f4f4f4',
  shadow: 'rgba(33,33,33,0.09)'
};
const BOARD_SIZE = 3;

function getInitialBoard() {
  return Array(BOARD_SIZE * BOARD_SIZE).fill(null);
}

function calculateWinner(cells) {
  // Returns {winner: 'X'|'O', line: [idxs], draw: true|false} or null
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6],         // diagonals
  ];
  for (let [a, b, c] of lines) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c])
      return { winner: cells[a], line: [a,b,c], draw: false };
  }
  if (cells.every(cell => cell)) return { winner: null, line: [], draw: true };
  return null;
}

// PUBLIC_INTERFACE
function App() {
  // Player opts: X=1st, O=2nd
  const [mode, setMode] = useState('human'); // 'human' | 'computer'
  const [playerSymbol, setPlayerSymbol] = useState('X');
  const [board, setBoard] = useState(getInitialBoard());
  const [current, setCurrent] = useState('X');
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null); // {winner/null, draw}
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // PUBLIC_INTERFACE
  function startNewGame(newMode=mode, player='X') {
    setMode(newMode);
    setPlayerSymbol(player);
    setBoard(getInitialBoard());
    setCurrent('X');
    setResult(null);
    setHistory([]);
    setSidebarOpen(false);
  }

  // PUBLIC_INTERFACE
  function handleClick(idx) {
    if (board[idx] || result) return;
    // If playing vs computer, only allow player's moves on their turn
    if (mode === 'computer' && current !== playerSymbol) return;

    const newBoard = board.slice();
    newBoard[idx] = current;
    const win = calculateWinner(newBoard);
    setHistory(h => [...h, {move: idx, by: current, board: newBoard}]);
    setBoard(newBoard);
    if (win) {
      setResult(win);
      let scoreCopy = { ...score };
      if (win.draw) scoreCopy.draws += 1;
      else scoreCopy[win.winner] += 1;
      setScore(scoreCopy);
    } else {
      setCurrent(c => c === 'X' ? 'O' : 'X');
    }
  }

  // COMPUTER MOVE LOGIC: plays after human
  React.useEffect(() => {
    if (
      mode === 'computer' &&
      !result &&
      current !== playerSymbol
    ) {
      // Small delay for UX
      const timer = setTimeout(() => {
        const move = bestMove(board, current);
        if (move !== null) handleClick(move);
      }, 600);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [board, current, result, mode, playerSymbol]);

  // PUBLIC_INTERFACE
  function bestMove(b, comp) {
    // Naive AI: tries to win, blocks player, else random.
    const empty = b.map((v, i) => v ? null : i).filter(v => v !== null);
    // Try win
    for (let i of empty) {
      const copy = b.slice();
      copy[i] = comp;
      if (calculateWinner(copy)?.winner === comp) return i;
    }
    // Block opponent
    const opp = comp === 'X' ? 'O' : 'X';
    for (let i of empty) {
      const copy = b.slice();
      copy[i] = opp;
      if (calculateWinner(copy)?.winner === opp) return i;
    }
    // Next, take middle
    if (empty.includes(4)) return 4;
    // Random
    return empty[Math.floor(Math.random() * empty.length)] ?? null;
  }

  // BOARD UI RENDER
  function renderCell(idx) {
    let winHighlight = result && result.line.includes(idx);
    return (
      <button
        key={idx}
        className="ttt-cell"
        style={{
          color:
            board[idx] === 'X'
              ? COLORS.primary
              : board[idx] === 'O'
              ? COLORS.secondary
              : COLORS.accent,
          fontWeight: winHighlight ? 700 : 500,
          background: winHighlight ? COLORS.accent+'20' : COLORS.bg
        }}
        disabled={!!board[idx] || !!result}
        aria-label={`cell ${idx} ${board[idx] ?? "empty"}`}
        onClick={() => handleClick(idx)}
      >
        {board[idx]}
      </button>
    );
  }

  // STATUS
  function renderStatus() {
    if (result) {
      if (result.draw) return <span style={{color: COLORS.secondary, fontWeight: 700}}>It's a Draw!</span>;
      return (
        <span style={{color: board[result.line[0]] === 'X' ? COLORS.primary : COLORS.secondary, fontWeight: 700}}>
          Winner: {result.winner}
        </span>
      );
    }
    return (
      <>
        {mode === 'computer'
          ? (
            <span>
              {current === playerSymbol
                ? "Your move" : "Computer's move"}
            </span>
          )
          : (
            <span>{"Current turn: "}<span style={{color: current === 'X' ? COLORS.primary : COLORS.secondary}}>
                {current}
              </span>
            </span>
          )
        }
      </>
    );
  }

  // SIDEBAR: For settings (select mode, symbol)
  function Sidebar() {
    return (
      <aside className="sidebar" style={{
        right: sidebarOpen ? 0 : -260,
        background: '#fff',
        boxShadow: sidebarOpen ? `-2px 0 14px ${COLORS.shadow}` : 'none'
      }}>
        <h2 style={{color: COLORS.primary, marginTop: 22, fontWeight: 600, fontSize: '1.2rem'}}>Game Settings</h2>
        <div style={{ margin: '28px 0 10px 0', padding: '0 5px' }}>
          <label className="input-label">
            Game Mode:
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="human">Two Players</option>
              <option value="computer">Play vs Computer</option>
            </select>
          </label>
        </div>
        {mode === 'computer'
          ? (
            <div style={{marginBottom: 14, padding: '0 5px'}}>
              <label className="input-label">
                Your symbol:
                <select value={playerSymbol} onChange={e => setPlayerSymbol(e.target.value)}>
                  <option value="X">X (goes first)</option>
                  <option value="O">O (goes second)</option>
                </select>
              </label>
            </div>
          ) : null}
        <button
          className="btn-accent"
          style={{marginTop: 20, width: '100%'}}
          onClick={() => startNewGame(mode, playerSymbol)}
        >Start New Game</button>
      </aside>
    );
  }

  return (
    <div className="main-bg">
      <Sidebar />
      <div className="game-root">
        {/* Header */}
        <header className="header" style={{background: COLORS.primary, color:"#fff"}}>
          <h1 style={{fontWeight: 700, marginBottom: 0}}>Tic Tac Toe</h1>
          <span style={{fontSize:16, opacity:.96}}>A web game - Modern Light Theme</span>
          <span style={{
            fontSize:14, color:COLORS.accent, marginLeft:8,letterSpacing:'.2em',marginTop:6
          }}>
            {mode === 'computer' ? 'vs Computer' : '2P mode'}
          </span>
        </header>
        {/* Settings button */}
        <button className="sidebar-toggle" onClick={()=>setSidebarOpen(!sidebarOpen)}
          style={{
            color: COLORS.accent, border: `1.2px solid ${COLORS.accent}`,
            background: "#fff", marginTop:12
          }}
          aria-label="Open game settings"
        >⚙️ Settings</button>
        {/* Game Board */}
        <div className="game-area">
          <div className="score-bar"
            style={{
              background: COLORS.lightGray,
              borderBottom: `1px solid ${COLORS.border}`,
              boxShadow: `0 2px 7px ${COLORS.shadow}`
            }}
          >
            <span style={{ color: COLORS.primary, fontWeight: 700 }}>X&nbsp;{score.X}</span>
            <span style={{ color: COLORS.secondary, fontWeight: 700 }}>O&nbsp;{score.O}</span>
            <span style={{ color: COLORS.accent, fontWeight: 600 }}>Draws&nbsp;{score.draws}</span>
          </div>
          <div className="ttt-board-container">
            <div className="ttt-board">
              {Array.from({length: 9}, (_, i) => renderCell(i))}
            </div>
          </div>
          <div className="status-area" style={{
            margin: '22px auto 10px auto', color:COLORS.secondary, fontSize: '1.15rem'
          }}>
            {renderStatus()}
          </div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', margin: '0 0 7px 0' }}>
            <button className="btn-accent" onClick={() => startNewGame(mode, playerSymbol)}>
              Restart Game
            </button>
            <button className="btn-outline" onClick={()=>setSidebarOpen(true)}>
              Change Settings
            </button>
          </div>
        </div>
        {/* Footer */}
        <footer className="footer" style={{
          marginTop: '28px',
          fontSize: 14,
          color: COLORS.secondary
        }}>
          <span>
            &copy; 2024 — Tic Tac Toe App with React. | Light Theme | 
            <a href="https://reactjs.org" style={{ color: COLORS.primary, textDecoration: 'none'}} target="_blank" rel="noopener noreferrer">
              Learn React
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;
