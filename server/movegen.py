import numpy as np
from collections import deque
from tetris_logic import Board, Piece, Player, PieceLocation

# ==========================================================================================
# Main logic adapted for visualization
# ==========================================================================================
class MoveGenerator:
    """Handles piece movement generation with multiple algorithms."""

    def __init__(self, player, width, height):
        self.player = player
        self.piece = player.piece
        self.width = width
        self.height = height

        self.main_queue = deque()
        self.placeable_queue = []
        self.checked_list = np.zeros((width + 4, height + 4, 4), dtype=bool) # x, y, rot
        self.frames = []

    def run(self, algorithm='brute-force'):
        if self.piece is None:
            return []

        self._set_starting_position()
        check_rotations = self.piece.type != "O"

        if algorithm == 'brute-force':
            self._brute_force_algorithm(check_rotations)
        elif algorithm == 'harddrop':
            self._harddrop_algorithm(check_rotations)
        elif algorithm == 'faster-but-loss':
            self._faster_but_loss_algorithm(check_rotations)

        self._process_placements()
        return self.frames

    def _set_starting_position(self):
        # Simplified spawn logic for visualizer (top of board)
        spawn_x = 3 if self.piece.type != "O" else 4
        spawn_y = 0
        self.piece.location = PieceLocation(x=spawn_x, y=spawn_y)

        # Add initial state
        self._add_state_to_queue(self.piece.location.copy())

    def _add_state_to_queue(self, piece_location):
        """Adds a new state to the queue if it hasn't been checked, generating a 'reachable' frame."""
        self.main_queue.append(piece_location)

        # Generate frames
        if not self._already_checked(piece_location):
            self.frames.append({
                "kind": "reached",
                "rotation": piece_location.rotation,
                "x": piece_location.x,
                "y": piece_location.y
            })

    def _already_checked(self, piece_location):
        x, y, r = piece_location.x, piece_location.y, piece_location.rotation
        # The spin flags are irrelevant for checking if a state has been visited.
        return self.checked_list[x + 2, y, r]

    def _mark_checked(self, piece_location):
        x, y, r = piece_location.x, piece_location.y, piece_location.rotation
        # The spin flags are irrelevant for marking a state as visited.
        self.checked_list[x + 2, y, r] = True

    def _brute_force_algorithm(self, check_rotations):
        while len(self.main_queue) > 0:
            piece_location = self.main_queue.popleft()

            if self._already_checked(piece_location):
                continue

            self._mark_checked(piece_location)

            self.frames.append({
                "kind": "popped",
                "rotation": piece_location.rotation,
                "x": piece_location.x,
                "y": piece_location.y
            })

            self.piece.location = piece_location.copy()

            # Check if this is a placement location
            if not self.player.can_move(self.piece, y_offset=1):
                self.placeable_queue.append(piece_location.copy())

            for move in [[1, 0], [-1, 0], [0, 1]]:
                if self.player.can_move(self.piece, x_offset=move[0], y_offset=move[1]):
                    new_location = self.piece.location.copy()
                    new_location.x += move[0]
                    new_location.y += move[1]
                    new_location.rotation_just_occurred = False
                    new_location.rotation_just_occurred_and_used_last_tspin_kick = False
                    self._add_state_to_queue(new_location)

            if check_rotations:
                for i in range(1, 4):
                    self.piece.location = piece_location.copy() # Reset for each kick attempt
                    if self.player.try_wallkick(i):
                        new_location = self.piece.location.copy()
                        if new_location.y >= 0:
                            self._add_state_to_queue(new_location)
    
    def _harddrop_algorithm(self, check_rotations):
        """Simple algorithm that only considers hard drops from every column/rotation."""
        rotations_to_check = range(4) if check_rotations else [0]
        
        for r in rotations_to_check:
            # Try every column
            for x in range(-2, self.width):
                # Set piece at top
                self.piece.location = PieceLocation(x=x, y=0, rotation=r)

                self.frames.append({
                    "kind": "reached",
                    "rotation": self.piece.location.rotation,
                    "x": self.piece.location.x,
                    "y": self.piece.location.y
                })
                
                # Check if this starting position is valid
                if self.player.collision(self.piece.get_self_coords()):
                    continue

                # Simulate hard drop
                y = 0
                while self.player.can_move(self.piece, y_offset=1):
                    self.piece.location.y += 1
                    y = self.piece.location.y

                # The final landing spot is a placement
                final_location = self.piece.location.copy()
                self.placeable_queue.append(final_location)

    def _faster_but_loss_algorithm(self, check_rotations):
        """A faster, phased algorithm adapted from the reference code."""
        # This algorithm works in phases, populating queues for the next phase.

        # --- Phase 1: Get initial rotations ---
        # The main_queue starts with one item from _set_starting_position
        if not self.main_queue:
            return

        initial_rotations_q = deque()
        spawn_loc = self.main_queue.popleft() # The single spawn location
        initial_rotations_q.append(spawn_loc.copy())
        # Don't mark the spawn location itself, as it's the starting point.

        if check_rotations:
            for i in range(1, 4):
                self.piece.location = spawn_loc.copy()
                if self.player.try_wallkick(i):
                    rotated_pos = self.piece.location.copy()
                    initial_rotations_q.append(rotated_pos)
                    self._mark_checked(rotated_pos)

        # --- Phase 2: Horizontal movement for each rotation ---
        horizontal_scan_q = deque()
        while len(initial_rotations_q) > 0:
            loc = initial_rotations_q.popleft()
            horizontal_scan_q.append(loc.copy())

            for x_dir in [-1, 1]:
                current_loc = loc.copy()
                self.piece.location = current_loc
                while self.player.can_move(self.piece, x_offset=x_dir):
                    self.piece.location.x += x_dir
                    self._mark_checked(self.piece.location.copy())
                    horizontal_scan_q.append(self.piece.location.copy())

        # --- Phase 3: Vertical movement (soft drop) and visualization ---
        # At this point, self.main_queue is empty. We will now populate it with
        # the final landing spots for the next phase.
        while len(horizontal_scan_q) > 0:
            loc = horizontal_scan_q.popleft()
            self.piece.location = loc.copy()

            # Soft drop, marking the path and generating 'popped' frames.
            # The key is to mark the current spot *before* trying to move down.
            while self.player.can_move(self.piece, y_offset=1):
                current_drop_loc = self.piece.location.copy()
                self._mark_checked(current_drop_loc)
                self.frames.append({
                    "kind": "popped",
                    "rotation": current_drop_loc.rotation,
                    "x": current_drop_loc.x,
                    "y": current_drop_loc.y
                })
                self.piece.location.y += 1

            # The final landing spot is a starting point for the brute-force search.
            # We use _add_state_to_queue because it handles the visited check and
            # also generates the 'reached' frame for the landing spot.
            self._add_state_to_queue(self.piece.location.copy())
            # self.placeable_queue.append(self.piece.location.copy())

        # --- Phase 4: Use brute force on the collected landing spots ---
        # self.main_queue now contains only the landing spots. The _brute_force_algorithm
        # will process them, and because the air above has been marked as visited,
        # the search will be correctly constrained.
        self._brute_force_algorithm(check_rotations)

    def _process_placements(self):
        for location in self.placeable_queue:
            self.frames.append({
                "kind": "placeable",
                "rotation": location.rotation,
                "x": location.x,
                "y": location.y
            })

            spin_type = self.player.check_spin(location)
            if spin_type:
                # New mapping: T-Spin -> 2 (Pink), T-Spin Mini -> 1 (Purple)
                type_map = {"tspin": 2, "tspin-mini": 1, "mini": 3}
                numeric_type = type_map.get(spin_type)
                if numeric_type is not None:
                    self.frames.append({
                        "kind": "tspin",
                        "rotation": location.rotation,
                        "x": location.x,
                        "y": location.y,
                        "type": numeric_type
                    })

def _run_algo_for_accuracy(board_state, piece_type, algorithm, height, width, ruleset, generate_viz_frames):
    """Helper to run an algorithm and return just its placement/spin counts."""
    board = Board(width, height)
    board.set_grid(board_state)
    piece = Piece(piece_type)
    player = Player(board, piece, ruleset)

    generator = MoveGenerator(player, width, height)
    
    frames = generator.run(algorithm)
    
    moves = sum(1 for f in frames if f['kind'] == 'placeable')
    spins = sum(1 for f in frames if f['kind'] == 'tspin')

    if generate_viz_frames:
        return frames, moves, spins
    return None, moves, spins

def generate_frames(board_state, piece_type, algorithm, height=20, width=10, ruleset='s2'):
    # Run 1: Get the visualization frames and "found" counts for the selected algorithm
    frames, found_moves, found_spins = _run_algo_for_accuracy(
        board_state, piece_type, algorithm, height, width, ruleset, generate_viz_frames=True
    )

    # Run 2: Get the "total" counts from the brute-force algorithm (no viz frames needed)
    _, total_moves, total_spins = _run_algo_for_accuracy(
        board_state, piece_type, 'brute-force', height, width, ruleset, generate_viz_frames=False
    )

    return {
        "frames": frames,
        "accuracy": {
            "moves": {
                "found": found_moves,
                "total": total_moves
            },
            "spins": {
                "found": found_spins,
                "total": total_spins
            }
        }
    }