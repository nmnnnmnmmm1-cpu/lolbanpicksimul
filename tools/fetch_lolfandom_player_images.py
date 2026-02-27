#!/usr/bin/env python3
import json
import re
import ssl
import time
import html
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLAYERS_JSON = ROOT / "data" / "players.json"
ASSET_DIR = ROOT / "assets" / "players"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
SSL_CTX = ssl._create_unverified_context()
API = "https://lol.fandom.com/api.php"

# Nickname alias for ambiguous titles on Fandom.
TITLE_ALIAS_BY_NICK = {
    "PerfecT": "Perfect",
    "DuDu": "Dudu",
    "Junjia": "JunJia",
}


# Force a specific LOL Fandom page title per player id when needed.
# Example: "t1_faker": "Faker (Lee Sang-hyeok)"
PLAYER_TITLE_OVERRIDES = {
}


def fetch_text(url: str, accept: str = "application/json") -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    with urllib.request.urlopen(req, timeout=20, context=SSL_CTX) as res:
        data = res.read()
    return data.decode("utf-8", errors="ignore")


def fetch_json(url: str):
    return json.loads(fetch_text(url))


def fetch_bytes(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25, context=SSL_CTX) as res:
        data = res.read()
        ctype = res.headers.get("Content-Type", "")
    return data, ctype


def ext_from(ctype: str, url: str) -> str:
    c = (ctype or "").lower()
    if "png" in c:
        return ".png"
    if "webp" in c:
        return ".webp"
    if "jpeg" in c or "jpg" in c:
        return ".jpg"
    path = urllib.parse.urlparse(url).path.lower()
    for ext in [".png", ".webp", ".jpg", ".jpeg"]:
        if path.endswith(ext):
            return ".jpg" if ext == ".jpeg" else ext
    return ".jpg"


def clean_image_url(url: str) -> str:
    if not url:
        return ""
    if url.startswith("//"):
        url = "https:" + url
    if "/revision/" in url:
        if "/revision/latest" in url:
            return url.split("/revision/latest")[0] + "/revision/latest"
        return url.split("/revision/")[0]
    return url


def is_bad_image(url: str) -> bool:
    low = (url or "").lower()
    bad_tokens = [
        "fandom-logo",
        "wiki.png",
        "favicon",
        "social-default-image",
        "site-logo",
    ]
    return any(tok in low for tok in bad_tokens)


def page_thumb_by_title(title: str) -> str:
    params = {
        "action": "query",
        "titles": title,
        "prop": "pageimages",
        "pithumbsize": "1200",
        "redirects": "1",
        "format": "json",
        "origin": "*",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    data = fetch_json(url)
    pages = (data.get("query") or {}).get("pages") or {}
    for page in pages.values():
        thumb = page.get("thumbnail") or {}
        src = clean_image_url(thumb.get("source", ""))
        if src and not is_bad_image(src):
            return src
    return ""


def fetch_parsed_page_html(title: str) -> str:
    params = {
        "action": "parse",
        "page": title,
        "prop": "text",
        "redirects": "1",
        "formatversion": "2",
        "format": "json",
        "origin": "*",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    data = fetch_json(url)
    return (data.get("parse") or {}).get("text") or ""


def get_infobox_block(page_html: str) -> str:
    if not page_html:
        return ""
    m = re.search(r"<aside[^>]*class=\"[^\"]*(portable-infobox|pi-theme)[^\"]*\"[\s\S]*?</aside>", page_html, flags=re.IGNORECASE)
    if m:
        return m.group(0)
    t = re.search(r"<table[^>]*class=\"[^\"]*infobox[^\"]*\"[\s\S]*?</table>", page_html, flags=re.IGNORECASE)
    if t:
        return t.group(0)
    return ""


def strip_tags(html_text: str) -> str:
    txt = re.sub(r"<[^>]+>", " ", html_text or "")
    return re.sub(r"\s+", " ", html.unescape(txt)).strip().lower()


def is_player_infobox(block: str) -> bool:
    low = strip_tags(block)
    if not low:
        return False
    hit = 0
    for token in ["role", "team", "residency", "real name", "status", "birthday", "country"]:
        if token in low:
            hit += 1
    return hit >= 2


def extract_infobox_image(page_html: str) -> str:
    block = get_infobox_block(page_html)
    if not block:
        return ""
    for attr in ["data-src", "srcset", "src"]:
        mm = re.search(rf"{attr}\\s*=\\s*\"([^\"]+)\"", block, flags=re.IGNORECASE)
        if not mm:
            continue
        raw = html.unescape(mm.group(1)).strip()
        if attr == "srcset":
            raw = raw.split(",")[0].strip().split(" ")[0].strip()
        src = clean_image_url(raw)
        if src and not is_bad_image(src):
            return src
    return ""


def search_titles(nick: str, limit: int = 10):
    params = {
        "action": "query",
        "list": "search",
        "srsearch": f'"{nick}"',
        "srlimit": str(limit),
        "format": "json",
        "origin": "*",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    data = fetch_json(url)
    results = (data.get("query") or {}).get("search") or []
    titles = []
    for r in results:
        t = (r.get("title") or "").strip()
        if not t:
            continue
        low = t.lower()
        if "disambiguation" in low:
            continue
        if t not in titles:
            titles.append(t)
    return titles


def build_candidate_titles(pid: str, nick: str):
    n = (nick or "").strip()
    if not n:
        return []
    out = []
    alias = TITLE_ALIAS_BY_NICK.get(n)
    base = [n, n.replace("_", " "), re.sub(r"\s+", " ", n)]
    if alias:
        base.extend([alias, alias.replace("_", " ")])
    for c in base:
        c = c.strip()
        if c and c not in out:
            out.append(c)
    for c in list(out):
        tagged = f"{c} (player)"
        if tagged not in out:
            out.append(tagged)
    return out


def resolve_player_image(pid: str, nick: str) -> str:
    forced = PLAYER_TITLE_OVERRIDES.get(pid)
    if forced:
        try:
            page = fetch_parsed_page_html(forced)
            block = get_infobox_block(page)
            if block and is_player_infobox(block):
                src = extract_infobox_image(page) or page_thumb_by_title(forced)
                if src and not is_bad_image(src):
                    return src
        except Exception:
            pass

    for cand in build_candidate_titles(pid, nick):
        try:
            page = fetch_parsed_page_html(cand)
            block = get_infobox_block(page)
            if block and is_player_infobox(block):
                src = extract_infobox_image(page)
                if src:
                    return src
        except Exception:
            pass

    for title in search_titles(nick, limit=10):
        try:
            page = fetch_parsed_page_html(title)
            block = get_infobox_block(page)
            if not block or not is_player_infobox(block):
                continue
            src = extract_infobox_image(page) or page_thumb_by_title(title)
            if src and not is_bad_image(src):
                return src
        except Exception:
            continue

    for cand in build_candidate_titles(pid, nick):
        try:
            src = page_thumb_by_title(cand)
            if src and not is_bad_image(src):
                return src
        except Exception:
            pass

    return ""


def main():
    if not PLAYERS_JSON.exists():
        raise SystemExit(f"players.json not found: {PLAYERS_JSON}")

    with PLAYERS_JSON.open("r", encoding="utf-8") as f:
        players = json.load(f)

    ASSET_DIR.mkdir(parents=True, exist_ok=True)

    total = len(players)
    ok = 0
    fail = 0

    for p in players:
        pid = p.get("id", "")
        nick = p.get("nick", "")
        if not pid or not nick:
            fail += 1
            print(f"[SKIP] invalid row: id={pid}, nick={nick}")
            continue

        try:
            image_url = resolve_player_image(pid, nick)
            if not image_url:
                fail += 1
                print(f"[FAIL] {nick} ({pid}) - image not found")
                time.sleep(0.06)
                continue

            img_bytes, ctype = fetch_bytes(image_url)
            ext = ext_from(ctype, image_url)
            out_path = ASSET_DIR / f"{pid}{ext}"
            with out_path.open("wb") as f:
                f.write(img_bytes)

            for e in [".png", ".jpg", ".webp"]:
                other = ASSET_DIR / f"{pid}{e}"
                if other != out_path and other.exists():
                    other.unlink()

            rel = out_path.relative_to(ROOT).as_posix()
            p["photo"] = rel
            ok += 1
            print(f"[OK] {nick} -> {rel}")
        except Exception as e:
            fail += 1
            print(f"[ERR] {nick} ({pid}) - {e}")

        time.sleep(0.05)

    with PLAYERS_JSON.open("w", encoding="utf-8") as f:
        json.dump(players, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print("\n=== SUMMARY ===")
    print(f"total: {total}, ok: {ok}, fail: {fail}")


if __name__ == "__main__":
    main()
