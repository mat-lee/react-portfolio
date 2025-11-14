import random
from dataclasses import dataclass, replace

# ==========================================================================================
# Constants
# ==========================================================================================

MINOS = "ZLOSIJT"

# Piece Matrices (for display/color, not used in logic)
piece_dict = {
    "Z": [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    "L": [[0, 0, 2], [2, 2, 2], [0, 0, 0]],
    "O": [[3, 3], [3, 3]],
    "S": [[0, 4, 4], [4, 4, 0], [0, 0, 0]],
    "I": [[0, 0, 0, 0], [5, 5, 5, 5], [0, 0, 0, 0], [0, 0, 0, 0]],
    "J": [[6, 0, 0], [6, 6, 6], [0, 0, 0]],
    "T": [[0, 7, 0], [7, 7, 7], [0, 0, 0]],
}

# Wallkick tables (SRS)
wallkicks = {
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
}

i_wallkicks = {
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
}

# Returns the coordinates of each piece/rotation at (0, 0)
mino_coords_dict = {
    "Z": {
        0: [[0, 0], [1, 0], [1, 1], [2, 1]],
        1: [[1, 1], [1, 2], [2, 0], [2, 1]],
        2: [[0, 1], [1, 1], [1, 2], [2, 2]],
        3: [[0, 1], [0, 2], [1, 0], [1, 1]],
    },
    "L": {
        0: [[0, 1], [1, 1], [2, 0], [2, 1]],
        1: [[1, 0], [1, 1], [1, 2], [2, 2]],
        2: [[0, 1], [0, 2], [1, 1], [2, 1]],
        3: [[0, 0], [1, 0], [1, 1], [1, 2]],
    },
    "O": {
        0: [[0, 0], [0, 1], [1, 0], [1, 1]],
        1: [[0, 0], [0, 1], [1, 0], [1, 1]],
        2: [[0, 0], [0, 1], [1, 0], [1, 1]],
        3: [[0, 0], [0, 1], [1, 0], [1, 1]],
    },
    "S": {
        0: [[0, 1], [1, 0], [1, 1], [2, 0]],
        1: [[1, 0], [1, 1], [2, 1], [2, 2]],
        2: [[0, 2], [1, 1], [1, 2], [2, 1]],
        3: [[0, 0], [0, 1], [1, 1], [1, 2]],
    },
    "I": {
        0: [[0, 1], [1, 1], [2, 1], [3, 1]],
        1: [[2, 0], [2, 1], [2, 2], [2, 3]],
        2: [[0, 2], [1, 2], [2, 2], [3, 2]],
        3: [[1, 0], [1, 1], [1, 2], [1, 3]],
    },
    "J": {
        0: [[0, 0], [0, 1], [1, 1], [2, 1]],
        1: [[1, 0], [1, 1], [1, 2], [2, 0]],
        2: [[0, 1], [1, 1], [2, 1], [2, 2]],
        3: [[0, 2], [1, 0], [1, 1], [1, 2]],
    },
    "T": {
        0: [[0, 1], [1, 0], [1, 1], [2, 1]],
        1: [[1, 0], [1, 1], [1, 2], [2, 1]],
        2: [[0, 1], [1, 1], [1, 2], [2, 1]],
        3: [[0, 1], [1, 0], [1, 1], [1, 2]],
    },
}

# ==========================================================================================
# Core Classes
# ==========================================================================================

@dataclass
class PieceLocation:
    x: int
    y: int
    rotation: int = 0
    rotation_just_occurred: bool = False
    rotation_just_occurred_and_used_last_tspin_kick: bool = False

    def copy(self) -> 'PieceLocation':
        return replace(self)

class Piece:
    def __init__(self, piece_type, x=0, y=0):
        self.type = piece_type
        self.location = PieceLocation(x=x, y=y)

    def get_self_coords(self):
        return Piece.get_mino_coords(self.location.x, self.location.y, self.location.rotation, self.type)

    @staticmethod
    def get_mino_coords(x_0, y_0, rotation, type):
        coordinate_list = mino_coords_dict[type][rotation]
        return [[x_0 + col, y_0 + row] for col, row in coordinate_list]

    def copy(self):
        new_piece = Piece(self.type, self.location.x, self.location.y)
        new_piece.location = self.location.copy()
        return new_piece

class Board:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.grid = [[0 for _ in range(width)] for _ in range(height)]

    def set_grid(self, new_grid):
        self.grid = new_grid

    def copy(self):
        new_board = Board(self.width, self.height)
        new_board.grid = [row[:] for row in self.grid]
        return new_board

class Stats:
    def __init__(self, ruleset):
        self.ruleset = ruleset
        self.b2b = 0
        self.combo = 0
        self.pieces = 0

class Player:
    def __init__(self, board, piece, ruleset='s2'):
        self.board = board
        self.piece = piece
        self.stats = Stats(ruleset)
        self.ruleset = ruleset

    def collision(self, coords):
        for col, row in coords:
            if not (0 <= row < self.board.height and 0 <= col < self.board.width):
                return True
            if self.board.grid[row][col] != 0:
                return True
        return False

    def can_move(self, piece, x_offset=0, y_offset=0):
        coords = Piece.get_mino_coords(
            piece.location.x + x_offset,
            piece.location.y + y_offset,
            piece.location.rotation,
            piece.type
        )
        return not self.collision(coords)

    def try_wallkick(self, dir) -> bool:
        piece = self.piece
        initial_rotation = piece.location.rotation
        final_rotation = (initial_rotation + dir) % 4

        kick_table = i_wallkicks if piece.type == "I" else wallkicks
        kicks_to_try = kick_table[initial_rotation][final_rotation]

        for kick in kicks_to_try:
            rotated_coords = Piece.get_mino_coords(
                piece.location.x + kick[0],
                piece.location.y - kick[1], # Kick table Y is inverted
                final_rotation,
                piece.type
            )
            if not self.collision(rotated_coords):
                piece.location.x += kick[0]
                piece.location.y -= kick[1]
                piece.location.rotation = final_rotation

                piece.location.rotation_just_occurred = True
                piece.location.rotation_just_occurred_and_used_last_tspin_kick = False
                if piece.type == "T" and dir != 2 and kick == kicks_to_try[-1]:
                    piece.location.rotation_just_occurred_and_used_last_tspin_kick = True
                return True
        return False

    def check_spin(self, piece_location):
        """
        Checks for T-spins and mini-spins based on a given placement location.
        Returns:
            - "tspin"
            - "tspin-mini"
            - "mini"
            - None
        """
        piece = self.piece
        piece.location = piece_location

        # --- T-Spin Logic ---
        is_tspin = False
        is_mini = False
        if piece.type == "T" and piece.location.rotation_just_occurred:
            corners = [[0, 0], [2, 0], [2, 2], [0, 2]] # Relative to piece's 3x3 box
            corner_filled_count = 0
            filled_corners = [False] * 4

            for i, (cx, cy) in enumerate(corners):
                row = cy + piece_location.y
                col = cx + piece_location.x
                if not (0 <= row < self.board.height and 0 <= col < self.board.width) or self.board.grid[row][col] != 0:
                    corner_filled_count += 1
                    filled_corners[i] = True

            if corner_filled_count >= 3:
                is_tspin = True
                rotation = piece.location.rotation
                if not (filled_corners[rotation] and filled_corners[(rotation + 1) % 4]) and not piece.location.rotation_just_occurred_and_used_last_tspin_kick:
                    is_mini = True

            if is_tspin:
                return "tspin-mini" if is_mini else "tspin"

        # --- All-Spin Logic (for non-T pieces, or T-pieces if ruleset is 's2' and not already a t-spin) ---
        if self.ruleset == 's2' and piece.type != 'T':
            # A placement is a mini-spin if it's "stuck" (can't move in any cardinal direction)
            # This check must be done from the final placement location.
            
            # Temporarily place the piece to check its final stuck state
            temp_piece = piece.copy()
            temp_piece.location = piece_location

            # Check if it can move from its final spot.
            can_move_laterally = self.can_move(temp_piece, x_offset=1) or self.can_move(temp_piece, x_offset=-1)
            can_move_vertically = self.can_move(temp_piece, y_offset=-1) # Can it move up?

            if not can_move_laterally and not can_move_vertically:
                return "mini"

        return None