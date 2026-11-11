"""
Multilingual translation adapter service.
Supports Tamil and English text preservation, keyword translations,
and an extensible adapter interface for external translation engines.
"""

# Common civic term mappings for demonstration and offline fallback
TAMIL_ENGLISH_GLOSSARY = {
    "குடிநீர்": "Drinking water",
    "கசிவு": "Leakage",
    "குழாய்": "Pipeline / Tap",
    "மின்சாரம்": "Electricity",
    "மின்தடை": "Power outage",
    "தெருவிளக்கு": "Streetlight",
    "மின்கம்பி": "Electric wire",
    "சாலை": "Road",
    "குழி": "Pothole",
    "நடைபாதை": "Footpath / Pavement",
    "குப்பை": "Garbage / Waste",
    "சாக்கடை": "Sewage drain",
    "வடிகால்": "Storm drain",
    "வெள்ளம்": "Flooding",
    "சுகாதாரம்": "Sanitation / Health",
    "கொசு": "Mosquitoes",
    "மருத்துவமனை": "Hospital",
    "ரேஷன்": "Ration / Fair price",
    "அரிசி": "Rice",
    "பேருந்து": "Public bus",
}

class TranslationService:
    """
    Multilingual service preserving original Unicode text.
    Provides local offline glossary mapping and fallback handling.
    """

    @staticmethod
    def get_supported_languages() -> list:
        return [
            {"code": "en", "name": "English", "native_name": "English"},
            {"code": "ta", "name": "Tamil", "native_name": "தமிழ்"}
        ]

    @staticmethod
    def get_glossary_term(tamil_word: str) -> str:
        return TAMIL_ENGLISH_GLOSSARY.get(tamil_word.strip(), None)

    @staticmethod
    def translate_preview(text: str, target_lang: str = "en") -> dict:
        """
        Translates known keywords if available, preserving original complaint verbatim.
        """
        if not text:
            return {"original": "", "translated": "", "provider": "verbatim_fallback"}

        # If already English or no external translation API key configured:
        # We maintain absolute authenticity without pretending external neural translation occurred
        words = text.split()
        annotated_terms = []
        for w in words:
            if w in TAMIL_ENGLISH_GLOSSARY:
                annotated_terms.append(f"{w} ({TAMIL_ENGLISH_GLOSSARY[w]})")

        return {
            "original_text": text,
            "detected_language": "ta" if any(ord(c) >= 0x0B80 and ord(c) <= 0x0BFF for c in text) else "en",
            "annotated_civic_terms": annotated_terms,
            "provider": "local_civic_glossary",
            "status": "verbatim_preserved"
        }
