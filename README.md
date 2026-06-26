# What Can I Cook?

Upload a photo of your fridge → AI identifies ingredients → finds recipes → shows what to buy.

![Flow: upload photo → ingredients → recipes](https://placehold.co/800x200?text=Upload+→+Ingredients+→+Recipes)

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| Vision AI | LLaVA 7B via Ollama (runs locally) |
| Recipes | Spoonacular API |

## Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) installed
- A [Spoonacular API key](https://spoonacular.com/food-api) (free tier works)

## Setup

### 1. Pull the vision model

```bash
ollama pull llava:7b
```

This is a one-time ~4GB download.

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Copy the env file and add your Spoonacular key:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```
SPOONACULAR_API_KEY=your_key_here
```

### 3. Frontend

```bash
cd frontend
npm install
```

## Running

You need three terminals:

```bash
# Terminal 1 — Ollama (vision model server)
ollama serve

# Terminal 2 — Backend
cd backend && source .venv/bin/activate && uvicorn main:app --reload

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

## How It Works

1. **Upload** — drag and drop or click to select a fridge photo
2. **AI scan** — image is sent to LLaVA 7B running locally via Ollama; returns a JSON list of ingredients
3. **Review** — edit the ingredient list (add/remove anything the AI missed)
4. **Recipes** — ingredient list is sent to Spoonacular `/findByIngredients`; top 3 matches returned
5. **Results** — each recipe shows what you have (green) and what you're missing (orange)
6. **Shopping list** — deduplicated list of missing ingredients with a copy button

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/analyze-fridge` | Upload image → `{ ingredients: string[] }` |
| POST | `/find-recipes` | `{ ingredients: string[] }` → `{ recipes: Recipe[] }` |

## Project Structure

```
fridge-chef/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx          # Single-page React app
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    └── package.json
```

## Notes

- Vision inference runs **entirely on your machine** — no image data is sent to any cloud service
- First inference after starting Ollama takes ~5–10 seconds on Apple Silicon; subsequent calls are faster
- Spoonacular free tier allows 150 requests/day
