"""Deterministically (re)generate the Patina demo document set from manifest.json.

For every vendor in every scenario, renders the three document types with
scenario-specific layouts:
  - Scenario A (CJK): Chinese 营业执照 + Japanese 履歴事項全部証明書, with the ID code
    in a HEADER BAND (the novel position the format-memory must learn). Non-Roman.
  - Scenario B: standard Roman registration; bank account holder is a TRADING NAME
    that differs from the registered entity (the false-flag trap).
  - Scenario C: standard Roman; insurance certificates carry expiry dates relative
    to today (20 Jun 2026) that drive the decay / hard-invalidation beat.

Outputs demo_data/<scenario>/vendor_0N/:
  - a .png render of every document (the vision pipeline consumes images)
  - a .pdf sibling wherever the manifest lists the doc as .pdf (clean-digital case)
  - business_registration_PHOTO.jpg for scenario A vendor_01 (messy phone intake)

manifest.json is the contract: ground_truth fields are rendered verbatim.

    uv run python demo_data/generate.py        # from backend/ venv, run at repo root
    python3 demo_data/generate.py
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "manifest.json"
OUT = ROOT / "demo_data"

# A4 at 150 dpi.
W, H = 1240, 1754
MARGIN = 90
INK = (25, 25, 28)
MUTE = (90, 92, 98)
PAPER = (252, 251, 248)
OFFICIAL_RED = (150, 30, 30)
HEADER_BAND = (232, 236, 244)

_FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",  # CJK + Latin, one file
    "/Library/Fonts/Arial Unicode.ttf",
]
_FONT_PATH = next((p for p in _FONT_CANDIDATES if Path(p).exists()), None)
if _FONT_PATH is None:  # pragma: no cover
    raise SystemExit("Arial Unicode not found — needed for CJK rendering. Update _FONT_CANDIDATES.")

_font_cache: dict[int, ImageFont.FreeTypeFont] = {}


def font(size: int) -> ImageFont.FreeTypeFont:
    if size not in _font_cache:
        _font_cache[size] = ImageFont.truetype(_FONT_PATH, size)
    return _font_cache[size]


def blank() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), PAPER)
    return img, ImageDraw.Draw(img)


def center(d: ImageDraw.ImageDraw, y: int, text: str, size: int, fill=INK) -> int:
    f = font(size)
    w = d.textlength(text, font=f)
    d.text(((W - w) / 2, y), text, font=f, fill=fill)
    return y + size + 10


def line(d: ImageDraw.ImageDraw, x: int, y: int, text: str, size: int, fill=INK) -> int:
    d.text((x, y), text, font=font(size), fill=fill)
    return y + size + 14


def label_value(d: ImageDraw.ImageDraw, y: int, label: str, value: str, size: int = 34) -> int:
    d.text((MARGIN, y), label, font=font(size), fill=MUTE)
    d.text((MARGIN + 360, y), value, font=font(size), fill=INK)
    return y + size + 22


def header_band(d: ImageDraw.ImageDraw, label: str, value: str) -> None:
    """The distinctive ID-in-header layout for scenario A."""
    d.rectangle([0, 0, W, 150], fill=HEADER_BAND)
    d.text((MARGIN, 40), label, font=font(30), fill=MUTE)
    d.text((MARGIN, 82), value, font=font(46), fill=OFFICIAL_RED)


def frame(d: ImageDraw.ImageDraw, color=INK) -> None:
    d.rectangle([40, 40, W - 40, H - 40], outline=color, width=3)


# --- Registration renderers -------------------------------------------------

def reg_zh(v: dict) -> Image.Image:
    gt = v["ground_truth"]
    img, d = blank()
    # ID code (统一社会信用代码) sits in the header band — the novel position.
    header_band(d, "统一社会信用代码", gt["tax_id"])
    frame(d, OFFICIAL_RED)
    y = 210
    y = center(d, y, "营业执照", 72, OFFICIAL_RED)
    y = center(d, y, "（副本）", 34, MUTE) + 30
    y = label_value(d, y, "名　　称", v["entity_name"], 38)
    y = label_value(d, y, "类　　型", "有限责任公司", 34)
    y = label_value(d, y, "法定代表人", gt["rep_native_script"], 34)
    y = label_value(d, y, "成立日期", "2019 年 03 月 12 日", 34)
    y = label_value(d, y, "注册资本", "人民币 5,000 万元", 34)
    y = label_value(d, y, "营业期限", "2019 年至长期", 34)
    y = label_value(d, y, "登记机关", "市场监督管理局", 34)
    d.text((MARGIN, H - 220), "（本执照为示例数据 · 非真实文件）", font=font(24), fill=MUTE)
    return img


def reg_ja(v: dict) -> Image.Image:
    gt = v["ground_truth"]
    img, d = blank()
    # 会社法人等番号 in the header block.
    header_band(d, "会社法人等番号", gt["tax_id"])
    frame(d)
    y = 210
    y = center(d, y, "履歴事項全部証明書", 60, INK) + 30
    y = label_value(d, y, "商　　号", v["entity_name"], 38)
    y = label_value(d, y, "本　　店", "東京都千代田区丸の内一丁目", 32)
    y = label_value(d, y, "会社成立の年月日", "令和元年 五月 十日", 30)
    y = label_value(d, y, "代表取締役", gt["rep_native_script"], 34)
    y = label_value(d, y, "資 本 金", "金 5,000 万円", 34)
    y = label_value(d, y, "発行済株式の総数", "5,000 株", 32)
    y += 20
    y = line(d, MARGIN, y, "これは登記記録に記録されている事項の全部を証明した書面である。", 26, MUTE)
    y = line(d, MARGIN, y, "令和8年 6月 15日", 30)
    d.text((MARGIN, H - 220), "（本証明書は示例データです · 非実在）", font=font(24), fill=MUTE)
    return img


def reg_roman(v: dict) -> Image.Image:
    gt = v["ground_truth"]
    img, d = blank()
    frame(d)
    y = 130
    y = center(d, y, "CERTIFICATE OF REGISTRATION", 46, INK)
    y = center(d, y, "OF A COMPANY", 32, MUTE) + 40
    y = label_value(d, y, "Company Name", v["entity_name"], 36)
    y = label_value(d, y, "Registration No.", gt["tax_id"], 36)
    y = label_value(d, y, "Entity Type", "Private Limited Company", 32)
    y = label_value(d, y, "Date of Incorp.", "12 March 2019", 32)
    y = label_value(d, y, "Registered Office", "Level 8, Commerce Tower", 32)
    y = label_value(d, y, "Status", "Existing / In Good Standing", 32)
    y += 30
    y = line(d, MARGIN, y, "Issued by the Companies Registry.", 28, MUTE)
    d.text((MARGIN, H - 200), "Sample data — not a real document.", font=font(24), fill=MUTE)
    return img


# --- Bank + insurance (English for all scenarios) ---------------------------

def bank_letter(v: dict) -> Image.Image:
    gt = v["ground_truth"]
    img, d = blank()
    y = 120
    y = line(d, MARGIN, y, "MERIDIAN COMMERCIAL BANK", 44, INK)
    y = line(d, MARGIN, y, "Corporate Banking Division", 28, MUTE) + 40
    y = line(d, MARGIN, y, "TO WHOM IT MAY CONCERN", 32, INK) + 20
    y = line(d, MARGIN, y, "This letter confirms that the account below is held with our bank:", 28, INK) + 20
    y = label_value(d, y, "Account Holder", gt["account_holder"], 34)
    y = label_value(d, y, "Account Number", gt["account_no"], 34)
    y = label_value(d, y, "Account Type", "Business Current Account", 32)
    y = label_value(d, y, "Currency", "Local", 32)
    y = label_value(d, y, "Status", "Active / In good standing", 32)
    y += 40
    y = line(d, MARGIN, y, "Issued on 02 June 2026 at the account holder's request.", 28, MUTE)
    y += 60
    y = line(d, MARGIN, y, "Authorised Signatory", 30, INK)
    y = line(d, MARGIN, y, "Meridian Commercial Bank", 26, MUTE)
    d.text((MARGIN, H - 200), "Sample data — not a real document.", font=font(24), fill=MUTE)
    return img


def insurance(v: dict) -> Image.Image:
    gt = v["ground_truth"]
    img, d = blank()
    frame(d)
    y = 120
    y = center(d, y, "CERTIFICATE OF INSURANCE", 46, INK)
    y = center(d, y, "Commercial General Liability", 30, MUTE) + 40
    y = label_value(d, y, "Insured", v["entity_name"], 34)
    y = label_value(d, y, "Policy Number", gt["policy_no"], 34)
    y = label_value(d, y, "Coverage Limit", gt["coverage"], 34)
    y = label_value(d, y, "Policy Type", "Commercial General Liability", 30)
    y = label_value(d, y, "Effective Date", "01 Jan 2026", 32)
    y = label_value(d, y, "Expiry Date", gt["policy_expiry"], 40)
    y += 30
    y = line(d, MARGIN, y, "This certificate is issued as a matter of information only.", 26, MUTE)
    y += 60
    y = line(d, MARGIN, y, "Aegis Underwriters Ltd.", 30, INK)
    d.text((MARGIN, H - 200), "Sample data — not a real document.", font=font(24), fill=MUTE)
    return img


REGISTRATION = {"zh": reg_zh, "ja": reg_ja}


def registration_for(v: dict) -> Image.Image:
    return REGISTRATION.get(v.get("language", ""), reg_roman)(v)


# --- Phone-photo distortion (scenario A vendor_01) --------------------------

def phone_photo(img: Image.Image) -> Image.Image:
    im = img.convert("RGB")
    # warm cast
    r, g, b = im.split()
    r = r.point(lambda p: min(255, int(p * 1.08)))
    b = b.point(lambda p: int(p * 0.9))
    im = Image.merge("RGB", (r, g, b))
    im = im.filter(ImageFilter.GaussianBlur(1.4))  # soft focus
    im = im.rotate(-4, expand=True, fillcolor=(20, 20, 22))  # handheld tilt
    # vignette
    vig = Image.new("L", im.size, 0)
    vd = ImageDraw.Draw(vig)
    vd.ellipse([-im.width * 0.15, -im.height * 0.1, im.width * 1.15, im.height * 1.1], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(180))
    dark = Image.new("RGB", im.size, (0, 0, 0))
    im = Image.composite(im, dark, vig)
    return im


# --- Orchestration ----------------------------------------------------------

def save_doc(img: Image.Image, folder: Path, filename: str) -> None:
    """Save the .png render always; add a .pdf when the manifest lists one."""
    stem = filename.rsplit(".", 1)[0]
    img.save(folder / f"{stem}.png")
    if filename.endswith(".pdf"):
        img.convert("RGB").save(folder / f"{stem}.pdf", "PDF", resolution=150.0)


def main() -> int:
    manifest = json.loads(MANIFEST.read_text())
    count = 0
    for scenario in manifest["scenarios"]:
        sname = scenario["scenario"]
        for v in scenario["vendors"]:
            folder = OUT / sname / f"vendor_{v['seq']:02d}"
            folder.mkdir(parents=True, exist_ok=True)
            renderers = {
                "business_registration": registration_for,
                "bank_letter": lambda vv: bank_letter(vv),
                "insurance_certificate": lambda vv: insurance(vv),
            }
            reg_img = None
            for doc in v["documents"]:
                base = doc.rsplit(".", 1)[0]
                img = renderers[base](v)
                if base == "business_registration":
                    reg_img = img
                save_doc(img, folder, doc)
                count += 1
            # Scenario A vendor_01 → messy phone-photo registration (hard first contact).
            if sname == "A_multilingual_cluster" and v["seq"] == 1 and reg_img is not None:
                phone_photo(reg_img).save(folder / "business_registration_PHOTO.jpg", quality=82)
                count += 1
    print(f"Generated {count} document files under {OUT.relative_to(ROOT)}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
