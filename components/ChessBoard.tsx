"use client";

// @ts-ignore
import React, { useMemo, useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, Move } from "chess.js";

// Engine class for Stockfish interaction
class Engine {
  private stockfish: Worker;

  constructor() {
    // Make sure the stockfish.js is in the public directory
    this.stockfish = new Worker("/stockfish.js");

    // Initialize the Stockfish engine
    this.stockfish.postMessage("uci");
    this.stockfish.postMessage("isready");
  }

  onMessage(callback: (data: { bestMove?: string }) => void) {
    this.stockfish.addEventListener("message", (e) => {
      const bestMove = e.data?.match(/bestmove\s+(\S+)/)?.[1];
      callback({ bestMove });
    });
  }

  evaluatePosition(fen: string, depth: number) {
    this.stockfish.postMessage(`position fen ${fen}`);
    this.stockfish.postMessage(`go depth ${depth}`);
  }

  stop() {
    this.stockfish.postMessage("stop");
  }

  quit() {
    this.stockfish.postMessage("quit");
  }
}

export const PlayAgainstStockfish: React.FC = () => {
  const engine = useMemo(() => new Engine(), []);
  const game = useMemo(() => new Chess(), []);
  const [chessBoardPosition, setChessBoardPosition] = useState(game.fen());

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    // Make a move and include promotion if necessary
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // Default to Queen if promotion is needed
    });

    if (!move) return false; // Illegal move

    setChessBoardPosition(game.fen());

    // Trigger Stockfish to find its best move
    findBestMove();
    return true;
  };

  const findBestMove = () => {
    const depth = 10; // Depth for Stockfish
    engine.evaluatePosition(game.fen(), depth);
    engine.onMessage(({ bestMove }) => {
      interface Move {
        from: string;
        to: string;
        promotion?: string;
      }

      if (bestMove) {
        // Create a move object with promotion handling
        const moveObj: Move = {
          from: bestMove.substring(0, 2),
          to: bestMove.substring(2, 4),
        };

        // If the move includes promotion (e.g., "e7e8q"), add the promotion piece
        if (bestMove.length === 5) {
          moveObj.promotion = bestMove[4] as "q" | "r" | "b" | "n"; // Get the promotion piece (e.g., 'q', 'r', 'b', 'n')
        }

        const move = game.move(moveObj);
        if (move) {
          setChessBoardPosition(game.fen());
        }

        if (game.isGameOver()) {
          alert("Game over");
        }
      }
    });
  };

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      engine.quit();
    };
  }, [engine]);

  return (
    <div className="max-w-3xl mx-auto mt-5">
      <Chessboard position={chessBoardPosition} onPieceDrop={onDrop} />

      <div>
        <button
          onClick={() => {
            game.reset();
            setChessBoardPosition(game.fen());
          }}
        >
          New Game
        </button>
      </div>
    </div>
  );
};
