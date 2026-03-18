// Port of server/tetris_logic.py

// ==========================================================================================
// Constants
// ==========================================================================================

export const MINOS = "ZLOSIJT";

export const piece_dict = {
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  L: [[0, 0, 2], [2, 2, 2], [0, 0, 0]],
  O: [[3, 3], [3, 3]],
  S: [[0, 4, 4], [4, 4, 0], [0, 0, 0]],
  I: [[0, 0, 0, 0], [5, 5, 5, 5], [0, 0, 0, 0], [0, 0, 0, 0]],
  J: [[6, 0, 0], [6, 6, 6], [0, 0, 0]],
  T: [[0, 7, 0], [7, 7, 7], [0, 0, 0]],
};

export const wallkicks = {
  0: {
    1: [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    3: [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    2: [[0, 0], [0, 1], [1, 1], [-1, 1], [1, 0], [-1, 0]],
  },
  1: {
    0: [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    2: [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    3: [[0, 0], [1, 0], [1, 2], [1, 1], [0, 2], [0, 1]],
  },
  2: {
    1: [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    3: [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    0: [[0, 0], [0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0]],
  },
  3: {
    2: [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    0: [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    1: [[0, 0], [-1, 0], [-1, 2], [-1, 1], [0, 2], [0, 1]],
  },
};

export const i_wallkicks = {
  0: {
    1: [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    3: [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    2: [[0, 0], [0, 1]],
  },
  1: {
    0: [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    2: [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    3: [[0, 0], [1, 0]],
  },
  2: {
    1: [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    3: [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    0: [[0, 0], [0, -1]],
  },
  3: {
    2: [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    0: [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    1: [[0, 0], [-1, 0]],
  },
};

export const mino_coords_dict = {
  Z: {
    0: [[0, 0], [1, 0], [1, 1], [2, 1]],
    1: [[1, 1], [1, 2], [2, 0], [2, 1]],
    2: [[0, 1], [1, 1], [1, 2], [2, 2]],
    3: [[0, 1], [0, 2], [1, 0], [1, 1]],
  },
  L: {
    0: [[0, 1], [1, 1], [2, 0], [2, 1]],
    1: [[1, 0], [1, 1], [1, 2], [2, 2]],
    2: [[0, 1], [0, 2], [1, 1], [2, 1]],
    3: [[0, 0], [1, 0], [1, 1], [1, 2]],
  },
  O: {
    0: [[0, 0], [0, 1], [1, 0], [1, 1]],
    1: [[0, 0], [0, 1], [1, 0], [1, 1]],
    2: [[0, 0], [0, 1], [1, 0], [1, 1]],
    3: [[0, 0], [0, 1], [1, 0], [1, 1]],
  },
  S: {
    0: [[0, 1], [1, 0], [1, 1], [2, 0]],
    1: [[1, 0], [1, 1], [2, 1], [2, 2]],
    2: [[0, 2], [1, 1], [1, 2], [2, 1]],
    3: [[0, 0], [0, 1], [1, 1], [1, 2]],
  },
  I: {
    0: [[0, 1], [1, 1], [2, 1], [3, 1]],
    1: [[2, 0], [2, 1], [2, 2], [2, 3]],
    2: [[0, 2], [1, 2], [2, 2], [3, 2]],
    3: [[1, 0], [1, 1], [1, 2], [1, 3]],
  },
  J: {
    0: [[0, 0], [0, 1], [1, 1], [2, 1]],
    1: [[1, 0], [1, 1], [1, 2], [2, 0]],
    2: [[0, 1], [1, 1], [2, 1], [2, 2]],
    3: [[0, 2], [1, 0], [1, 1], [1, 2]],
  },
  T: {
    0: [[0, 1], [1, 0], [1, 1], [2, 1]],
    1: [[1, 0], [1, 1], [1, 2], [2, 1]],
    2: [[0, 1], [1, 1], [1, 2], [2, 1]],
    3: [[0, 1], [1, 0], [1, 1], [1, 2]],
  },
};

// ==========================================================================================
// Core Classes
// ==========================================================================================

export function makePieceLocation(x, y, rotation = 0, rotationJustOccurred = false, rotationJustOccurredAndUsedLastTspinKick = false) {
  return { x, y, rotation, rotationJustOccurred, rotationJustOccurredAndUsedLastTspinKick };
}

export function copyPieceLocation(loc) {
  return { ...loc };
}

export class Piece {
  constructor(pieceType, x = 0, y = 0) {
    this.type = pieceType;
    this.location = makePieceLocation(x, y);
  }

  getSelfCoords() {
    return Piece.getMinoCoords(this.location.x, this.location.y, this.location.rotation, this.type);
  }

  static getMinoCoords(x0, y0, rotation, type) {
    const coordList = mino_coords_dict[type][rotation];
    return coordList.map(([col, row]) => [x0 + col, y0 + row]);
  }

  copy() {
    const newPiece = new Piece(this.type, this.location.x, this.location.y);
    newPiece.location = copyPieceLocation(this.location);
    return newPiece;
  }
}

export class Board {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () => new Array(width).fill(0));
  }

  setGrid(newGrid) {
    this.grid = newGrid;
  }

  copy() {
    const newBoard = new Board(this.width, this.height);
    newBoard.grid = this.grid.map(row => [...row]);
    return newBoard;
  }
}

export class Stats {
  constructor(ruleset) {
    this.ruleset = ruleset;
    this.b2b = 0;
    this.combo = 0;
    this.pieces = 0;
  }
}

export class Player {
  constructor(board, piece, ruleset = 's2') {
    this.board = board;
    this.piece = piece;
    this.stats = new Stats(ruleset);
    this.ruleset = ruleset;
    this.collisionChecks = 0;
  }

  collision(coords) {
    this.collisionChecks++;
    for (const [col, row] of coords) {
      if (!(0 <= row && row < this.board.height && 0 <= col && col < this.board.width)) {
        return true;
      }
      if (this.board.grid[row][col] !== 0) {
        return true;
      }
    }
    return false;
  }

  canMove(piece, xOffset = 0, yOffset = 0) {
    const coords = Piece.getMinoCoords(
      piece.location.x + xOffset,
      piece.location.y + yOffset,
      piece.location.rotation,
      piece.type
    );
    return !this.collision(coords);
  }

  tryWallkick(dir) {
    const piece = this.piece;
    const initialRotation = piece.location.rotation;
    const finalRotation = (initialRotation + dir) % 4;

    const kickTable = piece.type === 'I' ? i_wallkicks : wallkicks;
    const kicksToTry = kickTable[initialRotation][finalRotation];

    for (const kick of kicksToTry) {
      const rotatedCoords = Piece.getMinoCoords(
        piece.location.x + kick[0],
        piece.location.y - kick[1], // Kick table Y is inverted
        finalRotation,
        piece.type
      );
      if (!this.collision(rotatedCoords)) {
        piece.location.x += kick[0];
        piece.location.y -= kick[1];
        piece.location.rotation = finalRotation;

        piece.location.rotationJustOccurred = true;
        piece.location.rotationJustOccurredAndUsedLastTspinKick = false;
        if (piece.type === 'T' && dir !== 2 && kick === kicksToTry[kicksToTry.length - 1]) {
          piece.location.rotationJustOccurredAndUsedLastTspinKick = true;
        }
        return true;
      }
    }
    return false;
  }

  checkSpin(pieceLocation) {
    const piece = this.piece;
    piece.location = pieceLocation;

    // --- T-Spin Logic ---
    let isTspin = false;
    let isMini = false;
    if (piece.type === 'T' && piece.location.rotationJustOccurred) {
      const corners = [[0, 0], [2, 0], [2, 2], [0, 2]];
      let cornerFilledCount = 0;
      const filledCorners = [false, false, false, false];

      for (let i = 0; i < corners.length; i++) {
        const [cx, cy] = corners[i];
        const row = cy + pieceLocation.y;
        const col = cx + pieceLocation.x;
        if (!(0 <= row && row < this.board.height && 0 <= col && col < this.board.width) || this.board.grid[row][col] !== 0) {
          cornerFilledCount++;
          filledCorners[i] = true;
        }
      }

      if (cornerFilledCount >= 3) {
        isTspin = true;
        const rotation = piece.location.rotation;
        if (!(filledCorners[rotation] && filledCorners[(rotation + 1) % 4]) && !piece.location.rotationJustOccurredAndUsedLastTspinKick) {
          isMini = true;
        }
        if (isTspin) {
          return isMini ? 'tspin-mini' : 'tspin';
        }
      }
    }

    // --- All-Spin Logic (for non-T pieces) ---
    if (this.ruleset === 's2' && piece.type !== 'T') {
      const tempPiece = piece.copy();
      tempPiece.location = pieceLocation;

      const canMoveLaterally = this.canMove(tempPiece, 1, 0) || this.canMove(tempPiece, -1, 0);
      const canMoveVertically = this.canMove(tempPiece, 0, -1);

      if (!canMoveLaterally && !canMoveVertically) {
        return 'mini';
      }
    }

    return null;
  }
}
