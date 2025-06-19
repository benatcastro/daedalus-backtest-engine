class LeanDataFormatError(ValueError):
    """Raised when Lean data files don't match expected format or structure."""

    pass


class UnexpectedZipContentError(LeanDataFormatError):
    """Raised when ZIP file contains unexpected files or structure."""

    pass
