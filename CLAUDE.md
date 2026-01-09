# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website with React frontend and Python FastAPI backend. The backend handles computational tasks (currently Tetris move generation algorithms).

## Commands

### Frontend (Vite + React)
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (proxies /api to localhost:8000)
npm run build        # Production build
npm run lint         # ESLint
```

### Backend (FastAPI)
```bash
cd server
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload    # Starts on localhost:8000
```

**Both servers must run simultaneously** - Vite proxies `/api/*` to the FastAPI backend.

## Architecture

### Frontend (`src/`)
- **App.jsx**: Main portfolio page with navigation, projects, contact
- **LabPage.jsx**: Dynamic renderer for interactive lab experiments
  - Parses `<COMPONENT:Name/>` tags to embed React components
  - Renders KaTeX math (inline `$...$` and block `$$...$$`)
- **components/**: Reusable components (TetrisMoveVisualizer, PiecePicker, etc.)
- **data/**: JSON files for projects and labs metadata

### Backend (`server/`)
- **app.py**: FastAPI app with `/api/generate` endpoint
- **movegen.py**: Move generation algorithms (brute-force, harddrop, faster-but-loss)
- **tetris_logic.py**: Core Tetris game logic (pieces, wallkicks, collision)

### Adding New Lab Components
1. Create component in `src/components/`
2. Register in `LAB_COMPONENTS` object in `LabPage.jsx`
3. Add lab entry to `src/data/labs.json` with `<COMPONENT:ComponentName/>` in content
