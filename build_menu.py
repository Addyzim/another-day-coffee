"""
build_menu.py — turn the Excel menu into the static JSON the site reads.

The static site (GitHub Pages) has no backend, so the menu lives in
`frontend/menu.json`. Edit `backend/menu.xlsx` in Excel, run this script, and
commit the regenerated `frontend/menu.json` to publish your changes.

    python build_menu.py

Columns:
  Required : id, category, name, price
  Optional : name_vi, category_vi, description
             (name_vi / category_vi power the EN/VI language selector — the
              "name" / "category" columns are the English text.)

(You can also edit the menu live in the browser's Admin mode and use the
"Export menu.json" button there — this script is just the spreadsheet route.)
"""

import json
import os

import pandas as pd

HERE = os.path.dirname(__file__)
EXCEL_PATH = os.path.join(HERE, "backend", "menu.xlsx")
JSON_PATH = os.path.join(HERE, "frontend", "menu.json")

REQUIRED = ["id", "category", "name", "price"]
OPTIONAL = ["name_vi", "category_vi", "description", "image"]


def normalize(df: pd.DataFrame) -> list[dict]:
    """Coerce a raw spreadsheet into a clean list of menu records."""
    df = df.rename(columns={c: c.strip().lower() for c in df.columns})
    missing = [c for c in REQUIRED if c not in df.columns]
    if missing:
        raise SystemExit(
            f"menu.xlsx is missing column(s): {', '.join(missing)}. "
            f"Required: {', '.join(REQUIRED)}."
        )

    df["id"] = pd.to_numeric(df["id"], errors="coerce")
    df = df.dropna(subset=["id"])
    df["id"] = df["id"].astype(int)

    records: list[dict] = []
    seen = set()
    for _, r in df.iterrows():
        if r["id"] in seen:
            continue
        name = str(r.get("name", "")).strip()
        if not name:
            continue
        seen.add(r["id"])

        # Prices are Vietnamese Dong (VND) — whole numbers; strip symbols.
        price_raw = "".join(ch for ch in str(r.get("price", "")) if ch.isdigit())
        rec = {
            "id": int(r["id"]),
            "category": str(r.get("category", "Uncategorized")).strip() or "Uncategorized",
            "name": name,
            "price": int(price_raw) if price_raw else 0,
        }
        for opt in OPTIONAL:
            val = r.get(opt)
            if val is not None and str(val).strip() and str(val).lower() != "nan":
                rec[opt] = str(val).strip()
        records.append(rec)

    return records


def main() -> None:
    df = pd.read_excel(EXCEL_PATH, engine="openpyxl")
    items = normalize(df)
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump({"items": items}, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(items)} items to {os.path.relpath(JSON_PATH, HERE)}")


if __name__ == "__main__":
    main()
