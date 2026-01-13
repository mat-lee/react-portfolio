# FastAPI server that matches your Visualizer's expectations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from movegen import generate_frames

app = FastAPI()

# CORS configuration for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",          # Vite dev server
        "http://localhost:3000",          # Docusaurus dev server
        "https://codebymatthewlee.com",   # Production portfolio
        "https://labs.codebymatthewlee.com",  # Production labs
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

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
