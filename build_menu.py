"""
build_menu.py — turn the Excel menu into the static JSON the site reads.

The static site (GitHub Pages) has no backend, so the menu lives in
`frontend/menu.json`. Edit `backend/menu.xlsx` in Excel, run this script, and
commit the regenerated `frontend/menu.json` to publish your changes.

    python build_menu.py

(You can also edit the menu live in the browser's Admin mode and use the
"Export menu.json" button there — this script is just the spreadsheet route.)
"""

import json
import os

import pandas as pd

HERE = os.path.dirname(__file__)
EXCEL_PATH = os.path.join(HERE, "backend", "menu.xlsx")
JSON_PATH = os.path.join(HERE, "frontend", "menu.json")

COLUMNS = ["id", "category", "name", "price", "description"]


def normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Coerce a raw spreadsheet into the canonical menu schema."""
    df = df.rename(columns={c: c.strip().lower() for c in df.columns})
    missing = [c for c in COLUMNS if c not in df.columns]
    if missing:
        raise SystemExit(
            f"menu.xlsx is missing column(s): {', '.join(missing)}. "
            f"Expected: {', '.join(COLUMNS)}."
        )
    df = df[COLUMNS].copy()

    df["id"] = pd.to_numeric(df["id"], errors="coerce")
    df = df.dropna(subset=["id"])
    df["id"] = df["id"].astype(int)

    df["category"] = df["category"].fillna("Uncategorized").astype(str).str.strip()
    df["name"] = df["name"].fillna("").astype(str).str.strip()
    # Prices are Vietnamese Dong (VND) — whole numbers; strip any symbols/separators.
    price_clean = df["price"].astype(str).str.replace(r"[^0-9]", "", regex=True)
    df["price"] = pd.to_numeric(price_clean, errors="coerce").fillna(0).round(0).astype(int)
    df["description"] = df["description"].fillna("").astype(str).str.strip()

    df = df[df["name"] != ""]
    df = df.drop_duplicates(subset=["id"], keep="first")
    return df.reset_index(drop=True)


def main() -> None:
    df = pd.read_excel(EXCEL_PATH, engine="openpyxl")
    df = normalize(df)
    items = df.to_dict(orient="records")
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump({"items": items}, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(items)} items to {os.path.relpath(JSON_PATH, HERE)}")


if __name__ == "__main__":
    main()
