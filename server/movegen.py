# Replace this with your real algorithm.
# IMPORTANT: Return the "frames" schema used by the frontend.

def generate_frames_for_board(board, piece):
    # --- Example: minimal 3-step fake animation to prove wiring ---
    frames = []
    # rotation 0: mark some reachable cells
    frames.append({
        "rotation": 0,
        "reached": [[3,16],[4,16],[5,16]],
        "placeable": [],
        "tspins": []
    })
    # rotation 1: mark some placeable cells
    frames.append({
        "rotation": 1,
        "reached": [],
        "placeable": [[4,15],[5,15]],
        "tspins": []
    })
    # rotation 2: show a T-spin candidate if piece == "T"
    frames.append({
        "rotation": 2,
        "reached": [],
        "placeable": [],
        "tspins": [{"pos": [4,15], "type": 1}] if piece == "T" else []
    })
    return frames