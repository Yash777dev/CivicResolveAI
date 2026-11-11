import os
import re
import json
import joblib
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
MODEL_PATH = BASE_DIR / "backend" / "models_storage" / "category_classifier.joblib"
TAXONOMY_PATH = BASE_DIR / "data" / "category_taxonomy.json"

class CategoryClassificationService:
    """
    Multilingual category classification service with transparent rule baseline
    and optional scikit-learn TF-IDF + Logistic Regression trained model.
    """

    def __init__(self):
        self.taxonomy = self._load_taxonomy()
        self.ml_model = self._load_ml_model()

    def _load_taxonomy(self) -> Dict[str, Any]:
        if TAXONOMY_PATH.exists():
            try:
                with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"categories": []}

    def _load_ml_model(self):
        if MODEL_PATH.exists():
            try:
                return joblib.load(MODEL_PATH)
            except Exception:
                return None
        return None

    def predict_category(self, text: str) -> Dict[str, Any]:
        """
        Predict category for given complaint text.
        If ML model exists, runs inference with probability confidence;
        Otherwise, falls back cleanly to explainable keyword matching.
        """
        normalized_text = (text or "").lower().strip()
        if not normalized_text:
            return {
                "category_code": "OTHER_REVIEW",
                "method": "default_fallback",
                "confidence": 0.0,
                "reason": "Empty complaint text provided; flagged for manual review."
            }

        # Check if a trained ML model exists on disk
        if self.ml_model is not None:
            try:
                pipeline = self.ml_model.get("pipeline")
                classes = pipeline.classes_
                probs = pipeline.predict_proba([normalized_text])[0]
                max_idx = probs.argmax()
                best_class = classes[max_idx]
                confidence = float(probs[max_idx])

                if confidence >= 0.45:
                    return {
                        "category_code": best_class,
                        "method": "tfidf_logistic_regression",
                        "confidence": round(confidence, 3),
                        "model_version": self.ml_model.get("version", "1.0.0"),
                        "reason": f"Trained ML classifier predicted {best_class} with {round(confidence * 100, 1)}% confidence."
                    }
            except Exception:
                pass # Fall back to rule baseline

        # Deterministic keyword baseline
        best_match_code = "OTHER_REVIEW"
        max_matches = 0
        matched_words = []

        categories = self.taxonomy.get("categories", [])
        for cat in categories:
            cat_code = cat.get("code")
            kws = cat.get("keywords", [])
            matches = [w for w in kws if w.lower() in normalized_text]
            if len(matches) > max_matches:
                max_matches = len(matches)
                best_match_code = cat_code
                matched_words = matches

        if max_matches > 0:
            return {
                "category_code": best_match_code,
                "method": "rule_based_keyword_match",
                "confidence": min(0.9, 0.4 + (max_matches * 0.15)),
                "matched_keywords": matched_words[:3],
                "reason": f"Rule-based category suggestion matched keywords: {', '.join(matched_words[:3])}."
            }

        return {
            "category_code": "OTHER_REVIEW",
            "method": "manual_triage_recommended",
            "confidence": 0.2,
            "reason": "No strong keyword signals found; routed to General Administration for manual triage."
        }
