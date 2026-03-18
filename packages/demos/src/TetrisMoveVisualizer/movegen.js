// Port of server/movegen.py
import { Board, Piece, Player, makePieceLocation, copyPieceLocation, mino_coords_dict, wallkicks, i_wallkicks } from './tetris_logic.js';

// ==========================================================================================
// 3D array helpers (replaces numpy)
// ==========================================================================================

function make3DArray(d0, d1, d2) {
  // [d0][d1][d2] - indexed as [rotation][y][x]
  return Array.from({ length: d0 }, () =>
    Array.from({ length: d1 }, () => new Uint8Array(d2))
  );
}

// ==========================================================================================
// MoveGenerator
// ==========================================================================================

class MoveGenerator {
  constructor(player, width, height) {
    this.player = player;
    this.piece = player.piece;
    this.width = width;
    this.height = height;

    this.mainQueue = []; // Used as FIFO queue (shift = popleft)
    this.placeableQueue = [];
    // checkedList[r][y][x+2]
    this.checkedList = make3DArray(4, height + 4, width + 4);
    this.frames = [];
  }

  run(algorithm = 'brute-force') {
    if (this.piece === null) return [];

    this._setStartingPosition();
    const checkRotations = this.piece.type !== 'O';

    if (algorithm === 'brute-force') {
      this._bruteForcAlgorithm(checkRotations);
    } else if (algorithm === 'harddrop') {
      this._harddropAlgorithm(checkRotations);
    } else if (algorithm === 'faster-but-loss') {
      this._fasterButLossAlgorithm(checkRotations);
    } else if (algorithm === 'convolution') {
      this._convolutionAlgorithm(checkRotations);
    }

    this._processPlacements();
    return this.frames;
  }

  _setStartingPosition() {
    const spawnX = this.piece.type !== 'O' ? 3 : 4;
    const spawnY = 0;
    this.piece.location = makePieceLocation(spawnX, spawnY);
    this._addStateToQueue(copyPieceLocation(this.piece.location));
  }

  _addStateToQueue(pieceLocation) {
    this.mainQueue.push(pieceLocation);
    if (!this._alreadyChecked(pieceLocation)) {
      this.frames.push({
        kind: 'reached',
        rotation: pieceLocation.rotation,
        x: pieceLocation.x,
        y: pieceLocation.y,
      });
    }
  }

  _alreadyChecked(pieceLocation) {
    const { x, y, rotation: r } = pieceLocation;
    return this.checkedList[r][y][x + 2] !== 0;
  }

  _markChecked(pieceLocation) {
    const { x, y, rotation: r } = pieceLocation;
    this.checkedList[r][y][x + 2] = 1;
  }

  _bruteForcAlgorithm(checkRotations) {
    while (this.mainQueue.length > 0) {
      const pieceLocation = this.mainQueue.shift();
      this.piece.location = copyPieceLocation(pieceLocation);

      if (this._alreadyChecked(pieceLocation)) {
        if (!this.player.canMove(this.piece, 0, 1)) {
          const key = `${pieceLocation.x},${pieceLocation.y},${pieceLocation.rotation}`;
          if (!this._placeableQueueHasKey(key)) {
            this.placeableQueue.push(copyPieceLocation(pieceLocation));
          }
        }
        continue;
      }

      this._markChecked(pieceLocation);

      this.frames.push({
        kind: 'popped',
        rotation: pieceLocation.rotation,
        x: pieceLocation.x,
        y: pieceLocation.y,
      });

      if (!this.player.canMove(this.piece, 0, 1)) {
        this.placeableQueue.push(copyPieceLocation(pieceLocation));
      }

      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1]]) {
        if (this.player.canMove(this.piece, dx, dy)) {
          const newLoc = copyPieceLocation(pieceLocation);
          newLoc.x += dx;
          newLoc.y += dy;
          newLoc.rotationJustOccurred = false;
          newLoc.rotationJustOccurredAndUsedLastTspinKick = false;
          this._addStateToQueue(newLoc);
        }
      }

      if (checkRotations) {
        for (let i = 1; i <= 3; i++) {
          this.piece.location = copyPieceLocation(pieceLocation);
          if (this.player.tryWallkick(i)) {
            const newLoc = copyPieceLocation(this.piece.location);
            if (newLoc.y >= 0) {
              this._addStateToQueue(newLoc);
            }
          }
        }
      }
    }
  }

  _placeableQueueHasKey(key) {
    for (const loc of this.placeableQueue) {
      if (`${loc.x},${loc.y},${loc.rotation}` === key) return true;
    }
    return false;
  }

  _harddropAlgorithm(checkRotations) {
    const rotationsToCheck = checkRotations ? [0, 1, 2, 3] : [0];

    for (const r of rotationsToCheck) {
      for (let x = -2; x < this.width; x++) {
        this.piece.location = makePieceLocation(x, 0, r);

        this.frames.push({
          kind: 'reached',
          rotation: this.piece.location.rotation,
          x: this.piece.location.x,
          y: this.piece.location.y,
        });

        if (this.player.collision(this.piece.getSelfCoords())) {
          continue;
        }

        while (this.player.canMove(this.piece, 0, 1)) {
          this.piece.location.y += 1;
        }

        this.placeableQueue.push(copyPieceLocation(this.piece.location));
      }
    }
  }

  _fasterButLossAlgorithm(checkRotations) {
    if (this.mainQueue.length === 0) return;

    const initialRotationsQ = [];
    const spawnLoc = this.mainQueue.shift();
    initialRotationsQ.push(copyPieceLocation(spawnLoc));

    if (checkRotations) {
      for (let i = 1; i <= 3; i++) {
        this.piece.location = copyPieceLocation(spawnLoc);
        if (this.player.tryWallkick(i)) {
          const rotatedPos = copyPieceLocation(this.piece.location);
          initialRotationsQ.push(rotatedPos);
          this._markChecked(rotatedPos);
        }
      }
    }

    const horizontalScanQ = [];
    while (initialRotationsQ.length > 0) {
      const loc = initialRotationsQ.shift();
      horizontalScanQ.push(copyPieceLocation(loc));

      for (const xDir of [-1, 1]) {
        const currentLoc = copyPieceLocation(loc);
        this.piece.location = currentLoc;
        while (this.player.canMove(this.piece, xDir, 0)) {
          this.piece.location.x += xDir;
          this._markChecked(copyPieceLocation(this.piece.location));
          horizontalScanQ.push(copyPieceLocation(this.piece.location));
        }
      }
    }

    while (horizontalScanQ.length > 0) {
      const loc = horizontalScanQ.shift();
      this.piece.location = copyPieceLocation(loc);

      while (this.player.canMove(this.piece, 0, 1)) {
        const currentDropLoc = copyPieceLocation(this.piece.location);
        this._markChecked(currentDropLoc);
        this.frames.push({
          kind: 'popped',
          rotation: currentDropLoc.rotation,
          x: currentDropLoc.x,
          y: currentDropLoc.y,
        });
        this.piece.location.y += 1;
      }

      this._addStateToQueue(copyPieceLocation(this.piece.location));
    }

    this._bruteForcAlgorithm(checkRotations);
  }

  _buildValidityMaps() {
    const mapWidth = this.width + 4;
    const mapHeight = this.height + 4;
    const xOffset = 2;
    const yOffset = 2;

    // validityMaps[r][mapY][mapX]
    const validityMaps = make3DArray(4, mapHeight, mapWidth);
    const pieceType = this.piece.type;

    for (let r = 0; r < 4; r++) {
      const minoOffsets = mino_coords_dict[pieceType][r];
      for (let mapY = 0; mapY < mapHeight; mapY++) {
        for (let mapX = 0; mapX < mapWidth; mapX++) {
          const originX = mapX - xOffset;
          const originY = mapY - yOffset;
          const coords = minoOffsets.map(([col, row]) => [originX + col, originY + row]);
          validityMaps[r][mapY][mapX] = this.player.collision(coords) ? 0 : 1;
        }
      }
    }

    return { validityMaps, xOffset, yOffset };
  }

  _convolutionAlgorithm(checkRotations) {
    const { validityMaps, xOffset: xOff, yOffset: yOff } = this._buildValidityMaps();
    const mapHeight = this.height + 4;
    const mapWidth = this.width + 4;

    const visited = make3DArray(4, mapHeight, mapWidth);

    const spawnX = this.piece.location.x;
    const spawnY = this.piece.location.y;
    const spawnR = this.piece.location.rotation;

    this.mainQueue = [];

    if (!validityMaps[spawnR][spawnY + yOff][spawnX + xOff]) return;

    const explorationQueue = [[spawnX, spawnY, spawnR, false, false]];

    const kickTable = this.piece.type === 'I' ? i_wallkicks : wallkicks;
    const rotationsToTry = checkRotations ? [1, 2, 3] : [];

    while (explorationQueue.length > 0) {
      const [startX, startY, rot, rotJustOccurred, usedLastKick] = explorationQueue.shift();

      // If arrived via kick and immediately stuck, record kick-flagged placement
      // before the visited check — flood-fill may have already visited this position
      // via sliding, but we still need the kick-flagged version for T-spin detection.
      if (rotJustOccurred) {
        const mapYBelow = startY + yOff + 1;
        const stuck = mapYBelow >= mapHeight || !validityMaps[rot][mapYBelow][startX + xOff];
        if (stuck) {
          this.placeableQueue.push(makePieceLocation(startX, startY, rot, true, usedLastKick));
        }
      }

      if (visited[rot][startY + yOff][startX + xOff]) continue;

      const edges = this._floodFillRotation(validityMaps, visited, rot, startX, startY, xOff, yOff);

      for (const [edgeX, edgeY, isPlaceable] of edges) {
        if (isPlaceable) {
          this.placeableQueue.push(makePieceLocation(edgeX, edgeY, rot, false, false));
        }

        for (const kickDir of rotationsToTry) {
          const newRot = (rot + kickDir) % 4;
          const kicksToTry = (kickTable[rot] && kickTable[rot][newRot]) || [];

          for (let kickIdx = 0; kickIdx < kicksToTry.length; kickIdx++) {
            const [kickX, kickY] = kicksToTry[kickIdx];
            const newX = edgeX + kickX;
            const newY = edgeY - kickY;
            const mapX = newX + xOff;
            const mapY = newY + yOff;

            if (
              mapX >= 0 && mapX < mapWidth &&
              mapY >= 0 && mapY < mapHeight &&
              validityMaps[newRot][mapY][mapX]
            ) {
              const newUsedLastKick = (
                this.piece.type === 'T' &&
                kickDir !== 2 &&
                kickIdx === kicksToTry.length - 1
              );

              if (newY < 0) break;

              if (!visited[newRot][mapY][mapX]) {
                explorationQueue.push([newX, newY, newRot, true, newUsedLastKick]);
              } else {
                // Already visited via sliding; still record kick-flagged placement
                // if stuck (for T-spin detection).
                const mapYBelow = mapY + 1;
                if (mapYBelow >= mapHeight || !validityMaps[newRot][mapYBelow][mapX]) {
                  this.placeableQueue.push(makePieceLocation(newX, newY, newRot, true, newUsedLastKick));
                }
              }
              break;
            }
          }
        }
      }
    }
  }

  _floodFillRotation(validityMaps, visited, rot, startX, startY, xOff, yOff) {
    const mapHeight = validityMaps[0].length;
    const mapWidth = validityMaps[0][0].length;
    const edges = [];
    const stack = [[startX, startY]];

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const mapX = x + xOff;
      const mapY = y + yOff;

      if (mapX < 0 || mapX >= mapWidth || mapY < 0 || mapY >= mapHeight) continue;
      if (!validityMaps[rot][mapY][mapX] || visited[rot][mapY][mapX]) continue;

      visited[rot][mapY][mapX] = 1;

      const canLeft = mapX > 0 && validityMaps[rot][mapY][mapX - 1] && !visited[rot][mapY][mapX - 1];
      const canRight = mapX < mapWidth - 1 && validityMaps[rot][mapY][mapX + 1] && !visited[rot][mapY][mapX + 1];
      const canDown = mapY < mapHeight - 1 && validityMaps[rot][mapY + 1][mapX] && !visited[rot][mapY + 1][mapX];

      if (canLeft) stack.push([x - 1, y]);
      if (canRight) stack.push([x + 1, y]);
      if (canDown) stack.push([x, y + 1]);

      const blockedLeft = mapX === 0 || !validityMaps[rot][mapY][mapX - 1];
      const blockedRight = mapX === mapWidth - 1 || !validityMaps[rot][mapY][mapX + 1];
      const blockedDown = mapY === mapHeight - 1 || !validityMaps[rot][mapY + 1][mapX];

      const isEdge = blockedLeft || blockedRight || blockedDown;
      const isPlaceable = blockedDown;

      this.frames.push({
        kind: isEdge ? 'reached' : 'popped',
        rotation: rot,
        x,
        y,
      });

      if (isEdge) {
        edges.push([x, y, isPlaceable]);
      }
    }

    return edges;
  }

  _processPlacements() {
    const uniquePlacements = new Map();
    for (const location of this.placeableQueue) {
      const key = `${location.x},${location.y},${location.rotation}`;
      if (!uniquePlacements.has(key) || location.rotationJustOccurred) {
        uniquePlacements.set(key, location);
      }
    }

    for (const location of uniquePlacements.values()) {
      this.frames.push({
        kind: 'placeable',
        rotation: location.rotation,
        x: location.x,
        y: location.y,
      });

      const spinType = this.player.checkSpin(location);
      if (spinType) {
        const typeMap = { tspin: 2, 'tspin-mini': 1, mini: 3 };
        const numericType = typeMap[spinType];
        if (numericType !== undefined) {
          this.frames.push({
            kind: 'tspin',
            rotation: location.rotation,
            x: location.x,
            y: location.y,
            type: numericType,
          });
        }
      }
    }
  }
}

// ==========================================================================================
// Public API
// ==========================================================================================

function runAlgoForAccuracy(boardState, pieceType, algorithm, height, width, ruleset, generateVizFrames) {
  const board = new Board(width, height);
  board.setGrid(boardState);
  const piece = new Piece(pieceType);
  const player = new Player(board, piece, ruleset);

  const generator = new MoveGenerator(player, width, height);
  const frames = generator.run(algorithm);

  const moves = frames.filter(f => f.kind === 'placeable').length;
  const spins = frames.filter(f => f.kind === 'tspin').length;
  const collisionChecks = player.collisionChecks;

  if (generateVizFrames) {
    return { frames, moves, spins, collisionChecks };
  }
  return { frames: null, moves, spins, collisionChecks };
}

export function generateFrames(boardState, pieceType, algorithm, height = 20, width = 10, ruleset = 's2') {
  const { frames, moves: foundMoves, spins: foundSpins, collisionChecks } = runAlgoForAccuracy(
    boardState, pieceType, algorithm, height, width, ruleset, true
  );

  const { moves: totalMoves, spins: totalSpins } = runAlgoForAccuracy(
    boardState, pieceType, 'brute-force', height, width, ruleset, false
  );

  return {
    frames,
    accuracy: {
      moves: { found: foundMoves, total: totalMoves },
      spins: { found: foundSpins, total: totalSpins },
    },
    collisionChecks,
  };
}
