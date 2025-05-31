---
applyTo: 'backtest-backend/**'
---
# Backend Coding Standards and Preferences

- Use Python 3.10+ and type annotations.
- Follow PEP8 style guidelines.
- Structure code using clear modules and classes.
- Prioritize support for Lean engine, but design for extensibility to other engines.
- Use async/await for I/O-bound operations (e.g., FastAPI endpoints, file handling).
- Validate and sanitize all inputs.
- Write docstrings for all public classes and functions.
- Handle exceptions and log errors meaningfully.
- Write unit tests using pytest.
- Ensure efficient processing of large backtest files and data.

## REST API Best Practices
- Use resource-oriented URLs (e.g., `/backtests/{id}`).
- Use standard HTTP methods: GET (retrieve), POST (create), PUT/PATCH (update), DELETE (remove).
- Return appropriate HTTP status codes (e.g., 200, 201, 400, 404, 500).
- Use plural nouns for resource names.
- Support filtering, sorting, and pagination where applicable.
- Use JSON as the default response format.
- Document all endpoints and expected request/response schemas.

## Tech Stack Explanation
- **Python 3.10+**: Modern language features and type safety.
- **FastAPI**: High-performance, async web framework for building RESTful APIs.
- **SQLAlchemy**: ORM for database interactions.
- **Alembic**: Database migrations.
- **Pytest**: Testing framework.
- **Lean Engine**: Primary backtest engine integration.
