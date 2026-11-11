import sys
import joblib
from pathlib import Path
from sklearn.metrics import classification_report

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from scripts.train_classifier import DATASET

def evaluate():
    model_path = backend_dir / "models_storage" / "category_classifier.joblib"
    if not model_path.exists():
        print("[-] Model not found. Please run train_classifier.py first.")
        return

    payload = joblib.load(model_path)
    pipeline = payload["pipeline"]

    X = [d[0] for d in DATASET]
    y = [d[1] for d in DATASET]

    y_pred = pipeline.predict(X)
    print("=" * 60)
    print("CIVICRESOLVE AI - ML MODEL EVALUATION REPORT")
    print(f"Model: TF-IDF + Logistic Regression (v{payload.get('version')})")
    print("=" * 60)
    print(classification_report(y, y_pred, zero_division=0))

if __name__ == "__main__":
    evaluate()
