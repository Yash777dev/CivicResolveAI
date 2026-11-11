import os
import sys
import json
import joblib
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app
from app.extensions import db
from app.models.rules import ModelEvaluation

# Extended multilingual dataset for training
DATASET = [
    ("Main water pipe burst and drinking water leaking into street", "WATER_SUPPLY"),
    ("Low water pressure in municipal tap for two days", "WATER_SUPPLY"),
    ("Contaminated muddy tap water coming in kitchen", "WATER_SUPPLY"),
    ("Borewell motor damaged and no water in sector 5", "WATER_SUPPLY"),
    ("குடிநீர் குழாய் உடைந்து தண்ணீர் வீணாகிறது", "WATER_SUPPLY"),
    ("தெருவில் குடிநீர் வரவில்லை பொதுமக்கள் அவதி", "WATER_SUPPLY"),
    
    ("Live electric wire hanging down from pole after storm", "ELEC_STREETLIGHTS"),
    ("Transformer exploded sparks flying across street", "ELEC_STREETLIGHTS"),
    ("Streetlights not functioning on entire main road pitch dark", "ELEC_STREETLIGHTS"),
    ("Frequent power tripping and voltage fluctuation burning appliances", "ELEC_STREETLIGHTS"),
    ("மின் கம்பி அறுந்து விழுந்து தீப்பொறி பறக்கிறது", "ELEC_STREETLIGHTS"),
    ("தெருவிளக்குகள் எரியவில்லை விபத்து அபாயம்", "ELEC_STREETLIGHTS"),

    ("Deep dangerous pothole on bridge causing accidents", "ROADS_INFRA"),
    ("Road dug up for pipeline and left unpaved for weeks", "ROADS_INFRA"),
    ("Cracked pedestrian pavement slabs elderly tripping", "ROADS_INFRA"),
    ("Speed breaker not painted invisible at night", "ROADS_INFRA"),
    ("சாலையில் பெரிய பள்ளம் விபத்து ஏற்படுகிறது", "ROADS_INFRA"),
    ("நடைபாதை உடைந்து நடக்க முடியவில்லை", "ROADS_INFRA"),

    ("Decaying garbage heap overflowing from community bin foul stench", "SANITATION_GARBAGE"),
    ("Sanitation workers have not collected door to door waste this week", "SANITATION_GARBAGE"),
    ("Dead stray dog lying on roadside decomposing", "SANITATION_GARBAGE"),
    ("Plastic waste burned openly creating toxic smoke", "SANITATION_GARBAGE"),
    ("குப்பை மேடு சுத்தம் செய்யப்படவில்லை துர்நாற்றம்", "SANITATION_GARBAGE"),
    ("கழிவு பொருட்கள் தெருவில் வீசப்பட்டுள்ளன", "SANITATION_GARBAGE"),

    ("Sewage water overflowing into residential compound", "DRAINAGE_FLOODING"),
    ("Open manhole on market street extreme hazard for children", "DRAINAGE_FLOODING"),
    ("Blocked stormwater drain causing artificial flood after rain", "DRAINAGE_FLOODING"),
    ("Gutter clogged with silt and breeding flies", "DRAINAGE_FLOODING"),
    ("சாக்கடை நீர் சாலையில் பெருக்கெடுத்து ஓடுகிறது", "DRAINAGE_FLOODING"),
    ("மழைநீர் வடிகால் அடைப்பு ஏற்பட்டுள்ளது", "DRAINAGE_FLOODING"),

    ("Severe mosquito infestation and dengue cases in layout", "PUBLIC_HEALTH"),
    ("Stagnant green pond in vacant plot health risk", "PUBLIC_HEALTH"),
    ("Stray dog menace and biting pedestrians", "PUBLIC_HEALTH"),
    ("Uninspected street vendor selling spoiled food near school", "PUBLIC_HEALTH"),
    ("கொசு தொல்லை அதிகமாக உள்ளது டெங்கு பரவும் அபாயம்", "PUBLIC_HEALTH"),
    ("தேங்கிய நீரில் கொசுக்கள் உற்பத்தியாகின்றன", "PUBLIC_HEALTH"),

    ("Ration shop dealer refusing to disburse monthly rice quota", "PDS_RATION"),
    ("Biometric machine fingerprint sensor constantly failing", "PDS_RATION"),
    ("Poor quality rotten wheat supplied at fair price shop", "PDS_RATION"),
    ("Ration card address update pending for six months", "PDS_RATION"),
    ("நியாயவிலைக்கடை ஊழியர் ரேஷன் அரிசி தர மறுக்கிறார்", "PDS_RATION"),
    ("கைரேகை இயந்திரம் வேலை செய்யவில்லை", "PDS_RATION"),

    ("City bus route 45 cancelled without notification commuters stranded", "PUBLIC_TRANSPORT"),
    ("Broken bus shelter roof dangling over passengers", "PUBLIC_TRANSPORT"),
    ("Government bus driver driving recklessly jumping signal", "PUBLIC_TRANSPORT"),
    ("பேருந்து சரியான நேரத்திற்கு வருவதில்லை", "PUBLIC_TRANSPORT"),

    ("Delay in issuing birth certificate submitted two months ago", "MUNICIPAL_SERVICES"),
    ("Property tax receipt not generated after online payment", "MUNICIPAL_SERVICES"),
    ("Illegal commercial shop encroachment on public sidewalk", "MUNICIPAL_SERVICES"),
    ("நகராட்சி அலுவலகத்தில் சான்றிதழ் தாமதம்", "MUNICIPAL_SERVICES"),
]

def train_and_evaluate():
    app = create_app()
    with app.app_context():
        print("[*] Preparing dataset...")
        texts = [d[0] for d in DATASET]
        labels = [d[1] for d in DATASET]

        # Stratified train/test split (80/20)
        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=0.25, random_state=42, stratify=labels
        )

        print("[*] Training TF-IDF + LogisticRegression pipeline...")
        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=1000)),
            ("clf", LogisticRegression(max_iter=1000, C=1.0, random_state=42))
        ])

        pipeline.fit(X_train, y_train)

        # Evaluation
        y_pred = pipeline.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted", zero_division=0)
        cm = confusion_matrix(y_test, y_pred, labels=pipeline.classes_).tolist()

        print(f"[+] Evaluation Results:")
        print(f"    Accuracy:  {acc * 100:.2f}%")
        print(f"    Precision: {precision:.4f}")
        print(f"    Recall:    {recall:.4f}")
        print(f"    F1 Score:  {f1:.4f}")

        # Save model artifact
        storage_dir = backend_dir / "models_storage"
        storage_dir.mkdir(parents=True, exist_ok=True)
        model_file = storage_dir / "category_classifier.joblib"

        model_payload = {
            "pipeline": pipeline,
            "version": "1.0.0",
            "classes": pipeline.classes_.tolist()
        }
        joblib.dump(model_payload, model_file)
        print(f"[+] Model saved to {model_file}")

        # Record evaluation in DB
        eval_record = ModelEvaluation(
            model_name="TF-IDF + Logistic Regression Category Classifier",
            version="1.0.0",
            accuracy=float(acc),
            precision=float(precision),
            recall=float(recall),
            f1_score=float(f1),
            test_dataset_size=len(X_test),
            confusion_matrix_json=json.dumps(cm)
        )
        db.session.add(eval_record)
        db.session.commit()
        print("[+] Model evaluation metrics recorded in database.")

if __name__ == "__main__":
    train_and_evaluate()
