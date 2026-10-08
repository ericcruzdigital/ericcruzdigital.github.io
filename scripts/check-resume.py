"""Check shared facts, OOXML reading order and the rendered resume."""
from pathlib import Path
from zipfile import ZipFile
import html
import json
import re
import subprocess
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
data = json.loads((root / "scripts/resume.json").read_text())
path = root / "downloads/Eric_John_Cruz_Resume.docx"
ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
with ZipFile(path) as z:
    assert z.testzip() is None, "Damaged ZIP member"
    doc = ET.fromstring(z.read("word/document.xml"))
    styles = ET.fromstring(z.read("word/styles.xml"))
    paragraphs = ["".join(p.itertext()) for p in doc.findall(".//w:body/w:p", ns)]
    text = "\n".join(paragraphs)
    expected = [data[k] for k in ["name", "title", "location", "summary", "role", "employment", "support_role", "support_employment", "support_text", "education", "credential"]]
    expected += data["bullets"]
    expected += [s for pair in data["tools"] for s in pair]
    expected += [v for work in data["work"] for k,v in work.items() if k != "path"]
    for item in expected:
        assert item in text, "Missing Word content: " + item
    online = html.unescape(re.sub(r"<[^>]*>", " ", (root / "resume.html").read_text()))
    online = re.sub(r"\s+", " ", online)
    for item in expected:
        assert re.sub(r"\s+", " ", item) in online, "Missing online content: " + item
    assert not doc.findall(".//w:tbl", ns), "ATS reading-order risk: table"
    assert not doc.findall(".//w:txbxContent", ns), "ATS reading-order risk: text box"
    assert len(doc.findall(".//w:numPr", ns)) == len(data["bullets"]) + len(data["work"]), "Use real bullets"
    for col in doc.findall(".//w:cols", ns):
        assert col.get("{"+ns["w"]+"}num", "1") == "1", "Multiple columns"
    style_ids = [s.get("{"+ns["w"]+"}styleId") for s in styles.findall("./w:style",ns)]
    assert len(style_ids) == len(set(style_ids)), "Duplicate style IDs"
    for style_id in ["Title", "Heading1"]:
        style = styles.find(".//w:style[@w:styleId='"+style_id+"']",ns)
        assert style is not None
        color = style.find("./w:rPr/w:color",ns)
        assert color is not None and color.get("{"+ns["w"]+"}val") == "000000"
    forbidden = ["Ahrefs", "Semrush", "Screaming Frog", "Sitebulb", "HubSpot", "Shopify", "Merchant Center"]
    assert all(x.lower() not in text.lower() for x in forbidden), "Unexpected private name or unsupported tool"
    for name in z.namelist():
        if name.startswith("word/") and any(part in name for part in ["comments", "header", "footer"]) and name.endswith(".xml"):
            assert not ET.fromstring(z.read(name)).findall(".//w:t", ns), "Unexpected text outside the main body"

pdf = root / "qa-output/resume/Eric_John_Cruz_Resume.pdf"
info = subprocess.check_output(["pdfinfo", str(pdf)], text=True)
pages = int(re.search(r"Pages:\s+(\d+)", info).group(1))
assert 1 <= pages <= 2, "Resume exceeds two pages"
extracted = subprocess.check_output(["pdftotext", str(pdf), "-"], text=True)
# PDF extraction may remove a hyphen at a wrapped line. OOXML above is checked verbatim.
normalize = lambda s: re.sub(r"[\s\u00ad\-\u2010\u2011]+", "", s)
(root / "qa-output/resume/rendered-text.txt").write_text(extracted)

for item in expected:
    assert normalize(item) in normalize(extracted), "Missing rendered text: " + item
assert len(list(pdf.parent.glob("page-*.png"))) == pages
report = {"pages": pages, "bytes": path.stat().st_size, "sharedFactChecks": len(expected), "singleColumn": True, "realBullets": True, "noTablesOrTextBoxes": True, "renderedTextComplete": True}
(root / "qa-output/resume-report.json").write_text(json.dumps(report, indent=2))
print(json.dumps(report))
