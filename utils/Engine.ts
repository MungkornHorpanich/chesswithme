// utils/Engine.ts
class Engine {
  stockfish: Worker;

  constructor() {
    this.stockfish = new Worker("/stockfish/stockfish.js");
    this.sendMessage("uci");
    this.sendMessage("isready");
  }

  onMessage(callback: (bestMove: string) => void) {
    this.stockfish.addEventListener("message", (e) => {
      const bestMove = e.data?.match(/bestmove\s+(\S+)/)?.[1];
      callback(bestMove);
    });
  }

  sendMessage(message: string) {
    this.stockfish.postMessage(message);
  }

  evaluatePosition(fen: string, depth: number) {
    this.sendMessage(`position fen ${fen}`);
    this.sendMessage(`go depth ${depth}`);
  }

  stop() {
    this.sendMessage("stop");
  }

  quit() {
    this.sendMessage("quit");
  }
}

export default Engine;
