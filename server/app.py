# FastAPI server that matches your Visualizer's expectations
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
from movegen import generate_frames

app = FastAPI()

class Payload(BaseModel):
    board: List[List[int]]  # HEIGHT x WIDTH, 0 empty / 1 filled
    piece: str              # "I","O","T","S","Z","J","L"
    algorithm: str          # "brute-force", "harddrop", etc.

@app.post("/api/generate")  # use /api/* so Vite proxy can forward cleanly
def generate(payload: Payload) -> Dict[str, Any]:
    results = generate_frames(
        board_state=payload.board,
        piece_type=payload.piece,
        algorithm=payload.algorithm,
        ruleset='s2'
    )
    return results