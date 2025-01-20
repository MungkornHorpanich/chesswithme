"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

// Engine class for Stockfish interaction
class Engine {
  private stockfish: Worker;

  constructor() {
    this.stockfish = new Worker("./stockfish.js");

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
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      // No promotion for regular moves, only for pawn promotion
      promotion: "q", // Default to queen if it's a pawn promotion
    });

    if (!move) return false; // Illegal move

    setChessBoardPosition(game.fen());

    // Trigger Stockfish to find its best move
    findBestMove();
    return true;
  };

  const findBestMove = () => {
    const depth = 10; // Fixed depth for Stockfish
    engine.evaluatePosition(game.fen(), depth);
    engine.onMessage(({ bestMove }) => {
      if (bestMove) {
        const moveObj: { from: string; to: string; promotion?: string } = {
          from: bestMove.substring(0, 2),
          to: bestMove.substring(2, 4),
        };

        // If the best move is a promotion (i.e., last rank and a pawn), we add promotion
        if (bestMove.length === 5) {
          moveObj["promotion"] = bestMove[4];
        }

        game.move(moveObj);
        setChessBoardPosition(game.fen());
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
