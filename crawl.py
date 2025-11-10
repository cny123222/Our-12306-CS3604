import os
import re
import json
import base64
import datetime
from pathlib import Path
from urllib.parse import urlparse
from firecrawl import Firecrawl


def get_any(obj, keys, default=None):
    if isinstance(obj, dict):
        for k in keys:
            if k in obj and obj[k] is not None:
                return obj[k]
    else:
        for k in keys:
            if hasattr(obj, k):
                v = getattr(obj, k)
                if v is not None:
                    return v
    return default


def normalize_pages(resp):
    if isinstance(resp, list):
        return resp
    if isinstance(resp, dict):
        for key in ["pages", "data", "results", "items"]:
            v = resp.get(key)
            if isinstance(v, list):
                return v
        single = resp.get("page")
        if single:
            return [single]
    return []


def safe_slug(url, max_len=80):
    try:
        p = urlparse(url or "")
        s = f"{p.netloc}{p.path}".strip("/").replace("/", "_") or "index"
        s = re.sub(r"[^A-Za-z0-9._-]", "_", s)
        return s[:max_len]
    except Exception:
        return "page"


def save_crawl_response(resp, out_dir="browsertool/evidence/12306_crawl"):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    pages = normalize_pages(resp)
    for i, page in enumerate(pages, start=1):
        url = get_any(page, ["url", "href"]) or ""
        slug = safe_slug(url or f"page_{i}")
        prefix = f"{ts}_{i:03d}_{slug}"

        md = get_any(page, ["markdown", "md", "content"])
        if md:
            (out / f"{prefix}.md").write_text(md, encoding="utf-8")

        json_payload = get_any(page, ["json", "data", "extracted", "structured", "structuredData", "schema"])
        if json_payload:
            with open(out / f"{prefix}.json", "w", encoding="utf-8") as f:
                json.dump(json_payload, f, ensure_ascii=False, indent=2, default=lambda o: str(o))

        html = get_any(page, ["html", "rawHtml"])
        if html:
            (out / f"{prefix}.html").write_text(html, encoding="utf-8")

        screenshot = get_any(page, ["screenshot"])
        if screenshot:
            sp = out / f"{prefix}.png"
            try:
                if isinstance(screenshot, bytes):
                    sp.write_bytes(screenshot)
                elif isinstance(screenshot, str):
                    if screenshot.startswith("data:image/") and ";base64," in screenshot:
                        b64 = screenshot.split(";base64,", 1)[1]
                        sp.write_bytes(base64.b64decode(b64))
                    else:
                        sp.write_bytes(base64.b64decode(screenshot))
            except Exception:
                pass

    print(f"Saved {len(pages)} pages to {out.resolve()}")


if __name__ == "__main__":
    api_key = os.getenv("FIRECRAWL_API_KEY", "fc-d391212e98864253816f4b5677755622")
    firecrawl = Firecrawl(api_key=api_key)

    start_url = "https://www.12306.cn/index/"
    response = firecrawl.crawl(
        start_url,
        limit=8,  # 建议 5–10，这里取 8
        scrape_options={
            "formats": [
                "markdown",
                "html",
                "screenshot",
                {"type": "json", "schema": {"type": "object", "properties": {"title": {"type": "string"}}}},
            ],
            "proxy": "auto",
            "maxAge": 600000,
            "onlyMainContent": True,
        },
    )

    save_crawl_response(response)