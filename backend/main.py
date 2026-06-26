import json
import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ollama import AsyncClient
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Fridge Chef API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")

ollama = AsyncClient()

INGREDIENT_PROMPT = (
    "Look at this fridge or pantry photo and list every food ingredient you can see. "
    "Return ONLY a valid JSON array of ingredient name strings — no explanation, no markdown, no code blocks. "
    "Use common names (e.g. 'cheddar cheese', 'whole milk', 'cherry tomatoes'). "
    'Example: ["eggs", "cheddar cheese", "cherry tomatoes", "whole milk"]'
)


class IngredientsRequest(BaseModel):
    ingredients: list[str]


@app.post("/analyze-fridge")
async def analyze_fridge(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    contents = await image.read()

    response = await ollama.chat(
        model="llava:7b",
        messages=[{
            "role": "user",
            "content": INGREDIENT_PROMPT,
            "images": [contents],
        }],
    )

    raw = response.message.content.strip()

    if "```" in raw:
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        ingredients = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Could not parse ingredients from AI response.")

    if not isinstance(ingredients, list):
        raise HTTPException(status_code=500, detail="Unexpected AI response format.")

    return {"ingredients": [str(i) for i in ingredients]}


@app.post("/find-recipes")
async def find_recipes(request: IngredientsRequest):
    if not request.ingredients:
        raise HTTPException(status_code=400, detail="Ingredients list is empty.")

    ingredients_str = ",+".join(request.ingredients)

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            "https://api.spoonacular.com/recipes/findByIngredients",
            params={
                "ingredients": ingredients_str,
                "number": 3,
                "ranking": 1,
                "ignorePantry": False,
                "apiKey": SPOONACULAR_API_KEY,
            },
        )

    if resp.status_code == 402:
        raise HTTPException(status_code=402, detail="Spoonacular API quota exceeded.")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch recipes from Spoonacular.")

    raw_recipes = resp.json()

    recipes = []
    for r in raw_recipes:
        recipes.append(
            {
                "id": r["id"],
                "title": r["title"],
                "image": r.get("image", ""),
                "have": [
                    {
                        "name": i["name"],
                        "amount": f"{i.get('amount', '')} {i.get('unit', '')}".strip(),
                    }
                    for i in r.get("usedIngredients", [])
                ],
                "missing": [
                    {
                        "name": i["name"],
                        "amount": f"{i.get('amount', '')} {i.get('unit', '')}".strip(),
                    }
                    for i in r.get("missedIngredients", [])
                ],
            }
        )

    return {"recipes": recipes}
