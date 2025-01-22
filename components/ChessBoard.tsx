"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, Move } from "chess.js";

class Engine {
  private stockfish: Worker;

  constructor() {
    this.stockfish = new Worker("/stockfish.js");

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
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (!move) return false; // Illegal move

    setChessBoardPosition(game.fen());

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
        const moveObj: Move = {
          from: bestMove.substring(0, 2),
          to: bestMove.substring(2, 4),
        };

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
