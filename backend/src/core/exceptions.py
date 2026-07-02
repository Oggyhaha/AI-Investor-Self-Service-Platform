"""Custom exception classes and FastAPI exception handlers.

Provides domain-specific exceptions that are automatically converted
to proper JSON error responses via registered exception handlers.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    """Base application exception.

    All custom exceptions inherit from this class so they can be
    caught by a single exception handler.
    """

    def __init__(self, detail: str, status_code: int = 500):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class NotFoundError(AppException):
    """Raised when a requested resource does not exist."""

    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail=detail, status_code=404)


class UnauthorizedError(AppException):
    """Raised when authentication credentials are missing or invalid."""

    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(detail=detail, status_code=401)


class ForbiddenError(AppException):
    """Raised when the user lacks permission to perform the action."""

    def __init__(self, detail: str = "Forbidden"):
        super().__init__(detail=detail, status_code=403)


class BadRequestError(AppException):
    """Raised when the request data is invalid or incomplete."""

    def __init__(self, detail: str = "Bad request"):
        super().__init__(detail=detail, status_code=400)


class ConflictError(AppException):
    """Raised when the request conflicts with existing data."""

    def __init__(self, detail: str = "Conflict"):
        super().__init__(detail=detail, status_code=409)


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom exception handlers with the FastAPI application.

    Converts AppException subclasses into JSON responses with
    appropriate HTTP status codes.

    Args:
        app: The FastAPI application instance.
    """

    @app.exception_handler(AppException)
    async def app_exception_handler(
        request: Request, exc: AppException
    ) -> JSONResponse:
        """Handle all AppException subclasses."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "type": type(exc).__name__,
                    "detail": exc.detail,
                },
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """Handle unexpected exceptions with a generic 500 response."""
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "type": "InternalServerError",
                    "detail": "An unexpected error occurred. Please try again later.",
                },
            },
        )
