"""
Cafeteria Menu API
==================

A minimal FastAPI backend that uses a local Excel file (menu.xlsx) as its
database. No external database is required, so it runs for free on platforms
like Render. The Excel file persists on the server's disk between requests.

Excel columns (sheet 1): id | category | name | price | description

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --reload

Routes:
    GET    /                -> health check
    GET    /api/items       -> list all menu items
    PUT    /api/items/{id}  -> update one item (name, price, description, category)
    POST   /api/import      -> replace the whole menu from an uploaded .xlsx
    GET    /api/export      -> download the current menu as menu.xlsx
"""

import io
import os
from typing import Optional

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

# Path to the Excel "database". Keep it next to this file so it is easy to find.
EXCEL_PATH = os.path.join(os.path.dirname(__file__), "menu.xlsx")

# The columns every menu spreadsheet must contain.
COLUMNS = ["id", "category", "name", "price", "description"]

# --------------------------------------------------------------------------- #
# App + CORS
# --------------------------------------------------------------------------- #

app = FastAPI(title="Cafeteria Menu API", version="1.0.0")

# CORS is pre-configured so a GitHub Pages frontend can call this backend.
# "*" is the simplest setting for a public, read-mostly menu. To lock it down,
# replace allow_origins with your exact Pages URL, e.g.
#   allow_origins=["https://yourname.github.io"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------- #
# Models
# --------------------------------------------------------------------------- #


class ItemUpdate(BaseModel):
    """Fields the admin can edit inline. All optional so partial edits work."""

    category: Optional[str] = None
    name: Optional[str] = None
    price: Optional[int] = None  # Vietnamese Dong (VND) — whole numbers
    description: Optional[str] = None

    @field_validator("price")
    @classmethod
    def price_not_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("price cannot be negative")
        return v


# --------------------------------------------------------------------------- #
# Excel helpers
# --------------------------------------------------------------------------- #


def _seed_dataframe() -> pd.DataFrame:
    """A small starter menu used the first time the server runs."""
    rows = [
        (1, "Breakfast", "Avocado Toast", 75000, "Sourdough, smashed avocado, chili flakes"),
        (2, "Breakfast", "Greek Yogurt Bowl", 60000, "Yogurt, granola, honey, seasonal fruit"),
        (3, "Sandwiches", "Turkey Club", 95000, "Turkey, bacon, lettuce, tomato on ciabatta"),
        (4, "Sandwiches", "Caprese Panini", 85000, "Mozzarella, tomato, basil, balsamic glaze"),
        (5, "Salads", "Caesar Salad", 80000, "Romaine, parmesan, croutons, Caesar dressing"),
        (6, "Salads", "Quinoa Power Bowl", 98000, "Quinoa, chickpeas, kale, lemon tahini"),
        (7, "Drinks", "Iced Latte", 45000, "Double espresso over ice with milk"),
        (8, "Drinks", "Fresh Lemonade", 35000, "House-made, lightly sweetened"),
        (9, "Desserts", "Chocolate Brownie", 38000, "Fudgy, walnuts, sea salt"),
        (10, "Desserts", "Fruit Tart", 45000, "Pastry cream, glazed seasonal fruit"),
    ]
    return pd.DataFrame(rows, columns=COLUMNS)


def _validate_columns(df: pd.DataFrame) -> None:
    """Ensure the dataframe has the required columns (case-insensitive)."""
    incoming = {c.strip().lower(): c for c in df.columns}
    missing = [c for c in COLUMNS if c not in incoming]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Spreadsheet is missing required column(s): {', '.join(missing)}. "
                   f"Expected columns: {', '.join(COLUMNS)}.",
        )


def _normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Coerce types and clean up a raw dataframe into the canonical schema."""
    # Map columns case-insensitively to the canonical names.
    rename = {c: c.strip().lower() for c in df.columns}
    df = df.rename(columns=rename)
    df = df[COLUMNS].copy()

    # Clean / coerce each column.
    df["id"] = pd.to_numeric(df["id"], errors="coerce")
    df = df.dropna(subset=["id"])
    df["id"] = df["id"].astype(int)

    df["category"] = df["category"].fillna("Uncategorized").astype(str).str.strip()
    df["name"] = df["name"].fillna("").astype(str).str.strip()
    # Prices are in Vietnamese Dong (VND) — whole numbers, no decimals.
    # Strip any currency symbol or separators (e.g. "75.000 ₫" or "75,000") to digits.
    price_clean = df["price"].astype(str).str.replace(r"[^0-9]", "", regex=True)
    df["price"] = pd.to_numeric(price_clean, errors="coerce").fillna(0).round(0).astype(int)
    df["description"] = df["description"].fillna("").astype(str).str.strip()

    # Drop rows without a name and remove duplicate ids (keep first).
    df = df[df["name"] != ""]
    df = df.drop_duplicates(subset=["id"], keep="first")
    df = df.reset_index(drop=True)
    return df


def load_menu() -> pd.DataFrame:
    """Read the menu from disk, creating a seed file if none exists."""
    if not os.path.exists(EXCEL_PATH):
        df = _seed_dataframe()
        save_menu(df)
        return df
    df = pd.read_excel(EXCEL_PATH, engine="openpyxl")
    _validate_columns(df)
    return _normalize(df)


def save_menu(df: pd.DataFrame) -> None:
    """Write the menu back to disk."""
    df.to_excel(EXCEL_PATH, index=False, engine="openpyxl")


def menu_records(df: pd.DataFrame) -> list[dict]:
    """Convert a dataframe to a clean list of JSON-friendly dicts."""
    return df.to_dict(orient="records")


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #


@app.get("/")
def root():
    """Simple health check."""
    return {"status": "ok", "service": "Cafeteria Menu API"}


@app.get("/api/items")
def get_items():
    """Return every menu item."""
    df = load_menu()
    return {"items": menu_records(df)}


@app.put("/api/items/{item_id}")
def update_item(item_id: int, payload: ItemUpdate):
    """Update a single item by id. Only provided fields are changed."""
    df = load_menu()
    mask = df["id"] == item_id
    if not mask.any():
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found")

    fields = payload.model_dump(exclude_none=True)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    for key, value in fields.items():
        if key == "price":
            value = int(value)
        elif isinstance(value, str):
            value = value.strip()
        df.loc[mask, key] = value

    save_menu(df)
    updated = df.loc[mask].iloc[0].to_dict()
    return {"item": updated}


@app.post("/api/import")
async def import_excel(file: UploadFile = File(...)):
    """Replace the entire menu with the contents of an uploaded .xlsx file."""
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Please upload an .xlsx file")

    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read spreadsheet: {exc}")

    _validate_columns(df)
    df = _normalize(df)
    if df.empty:
        raise HTTPException(status_code=400, detail="Spreadsheet contained no valid rows")

    save_menu(df)
    return {"items": menu_records(df), "count": len(df)}


@app.get("/api/export")
def export_excel():
    """Stream the current menu back as a downloadable menu.xlsx file."""
    df = load_menu()
    buffer = io.BytesIO()
    df.to_excel(buffer, index=False, engine="openpyxl")
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=menu.xlsx"},
    )
