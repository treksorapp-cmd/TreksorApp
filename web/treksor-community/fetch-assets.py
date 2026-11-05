"""Restore the licensed atmospheric photo when checking out the GitHub mirror."""
from pathlib import Path
from urllib.request import urlretrieve

target = Path(__file__).parent / "dist/assets/forest.jpg"
target.parent.mkdir(parents=True, exist_ok=True)
urlretrieve(
    "https://images.unsplash.com/photo-1506292475578-ea4c0a6d6403?auto=format&fit=crop&w=2400&q=85",
    target,
)
print(f"Saved atmospheric photograph to {target}")
