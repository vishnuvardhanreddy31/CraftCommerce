from __future__ import annotations

from typing import Any


def doc_to_response(doc: dict) -> dict[str, Any]:
    """Convert a MongoDB document to an API-friendly dict.

    - Converts ``_id`` ObjectId to a string ``id`` field.
    - Recursively converts nested ObjectIds.
    """
    from bson import ObjectId

    result: dict[str, Any] = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, dict):
            result[key] = doc_to_response(value)
        elif isinstance(value, list):
            result[key] = [
                doc_to_response(v) if isinstance(v, dict) else (str(v) if isinstance(v, ObjectId) else v)
                for v in value
            ]
        else:
            result[key] = value
    return result


def slugify(text: str) -> str:
    """Simple slugify: lowercase and replace spaces/special chars with hyphens."""
    import re

    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")
