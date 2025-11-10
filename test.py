import os
import json
import base64
import datetime
from pathlib import Path
from urllib.parse import urlparse
from firecrawl import Firecrawl


def _get_val(obj, key):
    if hasattr(obj, key):
        return getattr(obj, key)
    if isinstance(obj, dict):
        return obj.get(key)
    return None


def save_doc(doc, out_dir="browsertool/evidence/12306_index_scrape", base_name=None):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    if base_name is None:
        url = _get_val(doc, "url") or ""
        netloc = urlparse(url).netloc or "page"
        base_name = netloc.replace(":", "_").replace(".", "_")
    prefix = f"{base_name}_{ts}"

    md = _get_val(doc, "markdown")
    if md:
        (out / f"{prefix}.md").write_text(md, encoding="utf-8")

    html = _get_val(doc, "html") or _get_val(doc, "rawHtml")
    if html:
        (out / f"{prefix}.html").write_text(html, encoding="utf-8")

    screenshot = _get_val(doc, "screenshot")
    if screenshot:
        p = out / f"{prefix}.png"
        if isinstance(screenshot, bytes):
            p.write_bytes(screenshot)
        elif isinstance(screenshot, str):
            if screenshot.startswith("data:image/") and ";base64," in screenshot:
                b64 = screenshot.split(";base64,", 1)[1]
                p.write_bytes(base64.b64decode(b64))
            else:
                p.write_bytes(base64.b64decode(screenshot))

    links = _get_val(doc, "links")
    if links:
        with open(out / f"{prefix}_links.json", "w", encoding="utf-8") as f:
            json.dump(links, f, ensure_ascii=False, indent=2)

    summary = {}
    for key in ["title", "url", "meta", "summary", "changeTracking", "branding"]:
        val = _get_val(doc, key)
        if val is not None:
            summary[key] = val
    with open(out / f"{prefix}_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    api_key = os.getenv("FIRECRAWL_API_KEY", "fc-d391212e98864253816f4b5677755622")
    print(api_key)
    firecrawl = Firecrawl(api_key=api_key)
    target_url = "https://www.12306.cn/index/"
    doc = firecrawl.scrape(
        target_url,
        formats=["markdown", "html"]
    )
    save_doc(doc, base_name="index")