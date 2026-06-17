from pathlib import Path
import os


# Destination root for downloaded data, in the QuantConnect Lean folder layout.
# Override with the LEAN_DATA_FOLDER environment variable; otherwise default to
# $HOME/Workspace/algotrading/lean/data.
_default = Path(os.environ.get("HOME", ""), "Workspace", "algotrading", "lean", "data")
LEAN_DATA_FOLDER = Path(os.environ.get("LEAN_DATA_FOLDER") or _default)
