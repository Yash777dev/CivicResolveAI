from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.complaint import Complaint
from app.models.rules import ComplaintSimilarity
from app.extensions import db

class DuplicateDetectionService:
    """
    Lightweight, privacy-preserving duplicate and similarity suggestion engine.
    Uses TF-IDF + cosine similarity over complaint titles and descriptions,
    incorporating category matching and approximate location proximity.
    """

    def __init__(self, threshold: float = 0.55):
        self.threshold = threshold

    def find_and_record_similar(self, new_complaint: Complaint) -> List[Dict[str, Any]]:
        """
        Scan existing active complaints (in same category or overall) and record suggested matches.
        Does not automatically merge or suppress any complaint.
        """
        # Query recent complaints excluding the current one
        candidates = Complaint.query.filter(
            Complaint.id != new_complaint.id,
            Complaint.category_id == new_complaint.category_id
        ).order_by(Complaint.created_at.desc()).limit(50).all()

        if not candidates:
            return []

        # Prepare corpus for TF-IDF
        target_text = f"{new_complaint.title} {new_complaint.description}".lower().strip()
        candidate_texts = [f"{c.title} {c.description}".lower().strip() for c in candidates]
        all_texts = [target_text] + candidate_texts

        vectorizer = TfidfVectorizer(max_features=500, stop_words="english", ngram_range=(1, 2))
        try:
            tfidf_matrix = vectorizer.fit_transform(all_texts)
            sim_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        except Exception:
            return []

        suggestions = []
        for idx, score in enumerate(sim_scores):
            score_val = float(score)
            if score_val >= self.threshold:
                candidate = candidates[idx]
                
                # Check location match bonus if both have approx_location
                loc_bonus = False
                if candidate.approx_location and new_complaint.approx_location:
                    if candidate.approx_location.lower() in new_complaint.approx_location.lower() or \
                       new_complaint.approx_location.lower() in candidate.approx_location.lower():
                        loc_bonus = True

                reason = f"High textual overlap in grievance description ({round(score_val * 100, 1)}% match)"
                if loc_bonus:
                    reason += " and shared geographic neighborhood."

                # Create or update ComplaintSimilarity record
                existing_sim = ComplaintSimilarity.query.filter(
                    ((ComplaintSimilarity.complaint_a_id == new_complaint.id) & (ComplaintSimilarity.complaint_b_id == candidate.id)) |
                    ((ComplaintSimilarity.complaint_a_id == candidate.id) & (ComplaintSimilarity.complaint_b_id == new_complaint.id))
                ).first()

                if not existing_sim:
                    sim_record = ComplaintSimilarity(
                        complaint_a_id=new_complaint.id,
                        complaint_b_id=candidate.id,
                        similarity_score=score_val,
                        reason=reason,
                        status="suggested"
                    )
                    db.session.add(sim_record)
                    suggestions.append({
                        "complaint_id": candidate.id,
                        "reference_number": candidate.reference_number,
                        "title": candidate.title,
                        "similarity_score": round(score_val, 3),
                        "reason": reason,
                        "status": candidate.status,
                    })

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

        return suggestions
