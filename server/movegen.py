import numpy as np
from collections import deque
from tetris_logic import Board, Piece, Player, PieceLocation, mino_coords_dict, wallkicks, i_wallkicks

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
        elif algorithm == 'convolution':
            self._convolution_algorithm(check_rotations)

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

            self.piece.location = piece_location.copy()

            if self._already_checked(piece_location):
                # If placeable and not already in placeable queue, add it
                # Check if this is a placement location
                if not self.player.can_move(self.piece, y_offset=1):
                    if piece_location not in self.placeable_queue:
                        self.placeable_queue.append(piece_location.copy())
                continue

            self._mark_checked(piece_location)

            self.frames.append({
                "kind": "popped",
                "rotation": piece_location.rotation,
                "x": piece_location.x,
                "y": piece_location.y
            })

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

    def _build_validity_maps(self):
        """
        Pre-compute validity maps for all 4 rotations.
        validity_map[r][y][x] = True means piece can exist at origin (x, y) with rotation r.

        Grid dimensions: (width + 4) x (height + 4) to handle origins outside board bounds.
        X offset: +2 (so origin x=-2 maps to index 0)
        Y offset: +2 (so origin y=-2 maps to index 0)
        """
        map_width = self.width + 4
        map_height = self.height + 4
        x_offset = 2
        y_offset = 2

        validity_maps = np.zeros((4, map_height, map_width), dtype=bool)
        piece_type = self.piece.type

        for r in range(4):
            mino_offsets = mino_coords_dict[piece_type][r]  # List of [col, row] offsets

            for map_y in range(map_height):
                for map_x in range(map_width):
                    # Convert map coords to actual piece origin coords
                    origin_x = map_x - x_offset
                    origin_y = map_y - y_offset

                    # Compute mino coordinates and use player.collision for fair counting
                    coords = [[origin_x + col, origin_y + row] for col, row in mino_offsets]
                    validity_maps[r, map_y, map_x] = not self.player.collision(coords)

        return validity_maps, x_offset, y_offset

    def _convolution_algorithm(self, check_rotations):
        """
        Finds all piece placements using pre-computed validity maps.

        Key optimization: Collision checks happen once upfront (building validity maps).
        Movement within a rotation state is just array lookups.
        Wallkicks only happen at edges, not at every cell.
        """
        # Step 1: Build validity maps
        validity_maps, x_off, y_off = self._build_validity_maps()

        # Visited tracking per rotation (separate from validity - tracks exploration)
        visited = np.zeros_like(validity_maps, dtype=bool)

        # Step 2: Get spawn position (already set by _set_starting_position in run())
        spawn_x = self.piece.location.x
        spawn_y = self.piece.location.y
        spawn_r = self.piece.location.rotation

        # Clear the queue since convolution doesn't use it
        self.main_queue.clear()

        # Check if spawn is valid
        if not validity_maps[spawn_r, spawn_y + y_off, spawn_x + x_off]:
            return  # Board is topped out

        # Queue stores (x, y, rotation, rotation_just_occurred, used_last_kick)
        exploration_queue = deque()
        exploration_queue.append((spawn_x, spawn_y, spawn_r, False, False))

        # Get wallkick table for this piece
        kick_table = i_wallkicks if self.piece.type == "I" else wallkicks
        rotations_to_try = [1, 2, 3] if check_rotations else []

        while exploration_queue:
            start_x, start_y, rot, _, _ = exploration_queue.popleft()

            # Skip if already visited
            if visited[rot, start_y + y_off, start_x + x_off]:
                continue

            # Flood-fill within this rotation state
            # Returns list of edge positions: (x, y, is_placeable)
            edges = self._flood_fill_rotation(
                validity_maps, visited, rot, start_x, start_y, x_off, y_off
            )

            # Step 5: Try wallkicks at each edge
            for edge_x, edge_y, is_placeable in edges:
                # Add placeable positions to the queue
                if is_placeable:
                    # For T-spins, we need to track how we got here
                    # Since flood-fill doesn't rotate, rotation_just_occurred = False
                    # unless we entered this region via a kick
                    self.placeable_queue.append(PieceLocation(
                        x=edge_x, y=edge_y, rotation=rot,
                        rotation_just_occurred=False,
                        rotation_just_occurred_and_used_last_tspin_kick=False
                    ))

                # Try rotations at edges
                for kick_dir in rotations_to_try:
                    new_rot = (rot + kick_dir) % 4
                    kicks_to_try = kick_table[rot].get(new_rot, [])

                    for kick_idx, (kick_x, kick_y) in enumerate(kicks_to_try):
                        new_x = edge_x + kick_x
                        new_y = edge_y - kick_y  # Kick table Y is inverted

                        # Check if new position is valid and unvisited
                        map_x = new_x + x_off
                        map_y = new_y + y_off

                        if (0 <= map_x < validity_maps.shape[2] and
                            0 <= map_y < validity_maps.shape[1] and
                            validity_maps[new_rot, map_y, map_x] and
                            not visited[new_rot, map_y, map_x]):

                            # Track T-spin flags
                            used_last_kick = (
                                self.piece.type == "T" and
                                kick_dir != 2 and
                                kick_idx == len(kicks_to_try) - 1
                            )

                            exploration_queue.append((
                                new_x, new_y, new_rot, True, used_last_kick
                            ))
                            break  # First successful kick wins

        # Now handle T-spin detection for placements that came from kicks
        # We need to re-process placeable_queue to find kick-based placements
        self._process_kick_placements(validity_maps, visited, x_off, y_off, kick_table, rotations_to_try)

    def _flood_fill_rotation(self, validity_maps, visited, rot, start_x, start_y, x_off, y_off):
        """
        Flood-fill within a single rotation state.
        Returns list of edge positions: (x, y, is_placeable)

        Visualization: "reached" for interior cells, "popped" for edge cells.
        """
        edges = []
        stack = [(start_x, start_y)]

        while stack:
            x, y = stack.pop()
            map_x, map_y = x + x_off, y + y_off

            # Bounds check
            if not (0 <= map_x < validity_maps.shape[2] and 0 <= map_y < validity_maps.shape[1]):
                continue

            # Skip if invalid or already visited
            if not validity_maps[rot, map_y, map_x] or visited[rot, map_y, map_x]:
                continue

            # Mark visited
            visited[rot, map_y, map_x] = True

            # Check neighbors
            can_left = (map_x > 0 and validity_maps[rot, map_y, map_x - 1] and
                       not visited[rot, map_y, map_x - 1])
            can_right = (map_x < validity_maps.shape[2] - 1 and
                        validity_maps[rot, map_y, map_x + 1] and
                        not visited[rot, map_y, map_x + 1])
            can_down = (map_y < validity_maps.shape[1] - 1 and
                       validity_maps[rot, map_y + 1, map_x] and
                       not visited[rot, map_y + 1, map_x])

            # Add unvisited valid neighbors to stack
            if can_left:
                stack.append((x - 1, y))
            if can_right:
                stack.append((x + 1, y))
            if can_down:
                stack.append((x, y + 1))

            # Check if this is an edge (blocked in any direction)
            blocked_left = map_x == 0 or not validity_maps[rot, map_y, map_x - 1]
            blocked_right = map_x == validity_maps.shape[2] - 1 or not validity_maps[rot, map_y, map_x + 1]
            blocked_down = map_y == validity_maps.shape[1] - 1 or not validity_maps[rot, map_y + 1, map_x]

            is_edge = blocked_left or blocked_right or blocked_down
            is_placeable = blocked_down  # Can't move down = placement spot

            # Generate frame: "reached" for edges, "popped" for interior
            self.frames.append({
                "kind": "reached" if is_edge else "popped",
                "rotation": rot,
                "x": x,
                "y": y
            })

            if is_edge:
                edges.append((x, y, is_placeable))

        return edges

    def _process_kick_placements(self, validity_maps, visited, x_off, y_off, kick_table, rotations_to_try):
        """
        For each existing placement, check if it could also be reached via kick.
        If so, add a T-spin version (with rotation_just_occurred=True).
        """
        new_placements = []

        # Check each existing placement for possible kick paths
        for placement in self.placeable_queue:
            x, y, rot = placement.x, placement.y, placement.rotation

            # Skip if already has rotation flag (already a T-spin version)
            if placement.rotation_just_occurred:
                continue

            # Check if this position could have been reached via kick
            for kick_dir in rotations_to_try:
                from_rot = (rot - kick_dir) % 4
                kicks = kick_table[from_rot].get(rot, [])

                for kick_idx, (kick_x, kick_y) in enumerate(kicks):
                    from_x = x - kick_x
                    from_y = y + kick_y  # Invert back
                    from_map_x = from_x + x_off
                    from_map_y = from_y + y_off

                    # Check if we visited the source position
                    if (0 <= from_map_x < validity_maps.shape[2] and
                        0 <= from_map_y < validity_maps.shape[1] and
                        visited[from_rot, from_map_y, from_map_x]):

                        # This placement could be reached via kick - add T-spin version
                        used_last_kick = (
                            self.piece.type == "T" and
                            kick_dir != 2 and
                            kick_idx == len(kicks) - 1
                        )

                        new_placements.append(PieceLocation(
                            x=x, y=y, rotation=rot,
                            rotation_just_occurred=True,
                            rotation_just_occurred_and_used_last_tspin_kick=used_last_kick
                        ))
                        break  # Found one kick path, that's enough
                else:
                    continue
                break  # Found one kick path, move to next placement

        self.placeable_queue.extend(new_placements)

    def _process_placements(self):
        # Deduplicate by (x, y, rotation), keeping T-spin version if exists
        unique_placements = {}
        for location in self.placeable_queue:
            key = (location.x, location.y, location.rotation)
            if key not in unique_placements or location.rotation_just_occurred:
                unique_placements[key] = location

        for location in unique_placements.values():
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
    """Helper to run an algorithm and return its placement/spin counts and collision checks."""
    board = Board(width, height)
    board.set_grid(board_state)
    piece = Piece(piece_type)
    player = Player(board, piece, ruleset)

    generator = MoveGenerator(player, width, height)

    frames = generator.run(algorithm)

    moves = sum(1 for f in frames if f['kind'] == 'placeable')
    spins = sum(1 for f in frames if f['kind'] == 'tspin')
    collision_checks = player.collision_checks

    if generate_viz_frames:
        return frames, moves, spins, collision_checks
    return None, moves, spins, collision_checks

def generate_frames(board_state, piece_type, algorithm, height=20, width=10, ruleset='s2'):
    # Run 1: Get the visualization frames and "found" counts for the selected algorithm
    frames, found_moves, found_spins, collision_checks = _run_algo_for_accuracy(
        board_state, piece_type, algorithm, height, width, ruleset, generate_viz_frames=True
    )

    # Run 2: Get the "total" counts from the brute-force algorithm (no viz frames needed)
    _, total_moves, total_spins, _ = _run_algo_for_accuracy(
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
        },
        "collisionChecks": collision_checks
    }