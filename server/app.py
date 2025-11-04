# FastAPI server that matches your Visualizer's expectations
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
from movegen import generate_frames_for_board  # you'll implement this

app = FastAPI()

class Payload(BaseModel):
    board: List[List[int]]  # HEIGHT x WIDTH, 0 empty / 1 filled
    piece: str              # "I","O","T","S","Z","J","L"

@app.post("/api/generate")  # use /api/* so Vite proxy can forward cleanly
def generate(payload: Payload) -> List[Dict[str, Any]]:
    # Produce frames in the schema TetrisMoveVisualizer expects
    frames = generate_frames_for_board(payload.board, payload.piece)
    # Each element: { "rotation": int, "reached":[[x,y]...], "placeable":[[x,y]...], "tspins":[{"pos":[x,y],"type":1|2|3}] }
    return frames