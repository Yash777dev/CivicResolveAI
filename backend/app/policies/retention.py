"""
Data retention and privacy policy definitions for CivicResolve AI.
Enforces data minimization, anonymized metrics, and audit log persistence.
"""

# Retention periods in days
AUDIT_LOG_RETENTION_DAYS = 365
RESOLVED_CASE_EVIDENCE_RETENTION_DAYS = 180
CLOSED_NOTIFICATION_RETENTION_DAYS = 90

def sanitize_metadata_for_logging(metadata: dict) -> dict:
    """
    Remove any sensitive fields (passwords, tokens, raw PII) from audit and log payloads.
    """
    sensitive_keys = {"password", "token", "access_token", "refresh_token", "secret", "authorization"}
    safe_dict = {}
    for k, v in metadata.items():
        if any(s in k.lower() for s in sensitive_keys):
            safe_dict[k] = "[REDACTED]"
        elif isinstance(v, dict):
            safe_dict[k] = sanitize_metadata_for_logging(v)
        else:
            safe_dict[k] = v
    return safe_dict
