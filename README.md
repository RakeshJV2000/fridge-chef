# What Can I Cook?

Upload a photo of your fridge → AI identifies ingredients → finds recipes → shows what to buy.

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| Vision AI | LLaVA 7B via Ollama (runs locally) |
| Recipes | Spoonacular API |

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
