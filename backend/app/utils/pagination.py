from flask import request

def paginate_query(query, default_per_page=15, max_per_page=100):
    """
    Paginate a SQLAlchemy query using 'page' and 'per_page' query parameters.
    Returns: {
        "items": [...],
        "total": int,
        "page": int,
        "per_page": int,
        "total_pages": int
    }
    """
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (ValueError, TypeError):
        page = 1

    try:
        per_page = int(request.args.get("per_page", default_per_page))
        per_page = max(1, min(per_page, max_per_page))
    except (ValueError, TypeError):
        per_page = default_per_page

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        "items": pagination.items,
        "total": pagination.total,
        "page": page,
        "per_page": per_page,
        "total_pages": pagination.pages or 1
    }
