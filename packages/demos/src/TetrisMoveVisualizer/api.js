import { generateFrames } from './movegen.js';

export function generateMoves(board, piece, algorithm) {
  return generateFrames(board, piece, algorithm);
}
