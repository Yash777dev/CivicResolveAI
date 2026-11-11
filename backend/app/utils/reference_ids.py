import secrets
from datetime import datetime, timezone

def generate_reference_number() -> str:
    """
    Generate an unguessable, human-readable public reference code.
    Format: CR-YYYYMMDD-XXXX (e.g. CR-20261025-A7K9)
    Uses cryptographically secure random uppercase characters.
    """
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" # Exclude ambiguous characters (O, 0, I, 1)
    suffix = "".join(secrets.choice(chars) for _ in range(4))
    return f"CR-{date_str}-{suffix}"
