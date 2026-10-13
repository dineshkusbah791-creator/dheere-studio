from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent

PAGES = {
    "index.html": "homepage.html",
    "about.html": "about.html",
    "search/index.html": "search.html",
    "profile/profile.html": "profile.html",
    "live-profile.html": "live-profile.html",
    "Community/community.html": "community.html",
    "founder.html": "founder.html",
    "shunyavas.html": "shunyavas.html",
}

NAV = re.compile(
    r'<nav\b(?=[^>]*\bclass=["\'][^"\']*\bnavbar\b)'
    r'[^>]*>[\s\S]*?</nav>',
    re.IGNORECASE,
)

APPLY = "--apply" in sys.argv
failed = False

for page_name, template_name in PAGES.items():
    page = ROOT / page_name
    template = ROOT / "Navbar" / "templates" / template_name

    if not page.is_file() or not template.is_file():
        print(f"FAIL: Missing file for {page_name}")
        failed = True
        continue

    source = page.read_text(encoding="utf-8")
    matches = list(NAV.finditer(source))

    if len(matches) != 1:
        print(f"FAIL: Expected one navbar in {page_name}")
        failed = True
        continue

    match = matches[0]
    original = match.group(0)
    updated = template.read_text(encoding="utf-8").strip()

    if original.strip() == updated:
        print(f"OK: {page_name}")
        continue

    if not APPLY:
        print(f"DIFFERENCE: {page_name} (not modified)")
        continue

    line_start = source.rfind("\n", 0, match.start()) + 1
    indent = source[line_start:match.start()]
    replacement = updated




    result = source[:match.start()] + replacement + source[match.end():]
    page.write_text(result, encoding="utf-8")
    print(f"SYNCED: {page_name}")

if failed:
    sys.exit(1)

if APPLY:
    print("Sync operation complete.")
else:
    print("Check complete. No HTML files were modified.")
