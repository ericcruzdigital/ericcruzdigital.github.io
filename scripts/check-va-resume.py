import json, re, zipfile, xml.etree.ElementTree as ET
from pathlib import Path
from pypdf import PdfReader
root = Path(__file__).resolve().parents[1]
d = json.loads((root/"scripts/va-resume.json").read_text())
out = root/"qa-va"
out.mkdir(exist_ok=True)
docx = root/"downloads/Eric_John_Cruz_Virtual_Assistant_Resume.docx"
pdf = root/"downloads/Eric_John_Cruz_Virtual_Assistant_Resume.pdf"
ns = {"w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
with zipfile.ZipFile(docx) as z:
    xml = ET.fromstring(z.read("word/document.xml"))
    doc_text = " ".join(n.text or "" for n in xml.findall(".//w:t", ns))
    assert not xml.findall(".//w:tbl", ns), "Resume must use a single text column, no tables"
    assert not xml.findall(".//w:drawing", ns), "No images in ATS resume"
    assert not xml.findall(".//w:ins", ns) and not xml.findall(".//w:del", ns)
reader = PdfReader(pdf)
assert 1 <= len(reader.pages) <= 2, f"Unexpected page count: {len(reader.pages)}"
pdf_text = "\n".join(p.extract_text() for p in reader.pages)
html = (root/"virtual-assistant/resume.html").read_text()
def normalize(s):
    return re.sub(r"\s+", " ", s).replace("\u2013","-").strip()
facts = [d["name"],d["headline"],d["subtitle"],d["summary"],d["email"]]
for e in d["experience"]:
    facts += [e["title"], e["company"], e["dates"], *e["bullets"]]
    if "engagements" in e: facts.append(e["engagements"])
facts += [text for _,text in d["skills"]] + [text for _,text in d["tools"]] + [d["work"]]
import html as htmlmodule
html_text = htmlmodule.unescape(re.sub("<[^>]+>", " ", html))
for fact in facts:
    for name, text in [("Word", doc_text), ("PDF", pdf_text), ("online", html_text)]:
        assert normalize(fact) in normalize(text), f"{name} missing fact: {fact}"
for pattern in [r"JDS1", r"\$\d", "Electrical Engineer", "cold calling", "Salesforce", "HubSpot", "Zapier"]:
    assert not re.search(pattern, doc_text, re.I), f"Unverified or out-of-scope content: {pattern}"
report={"pages":len(reader.pages),"sharedFacts":len(facts),"formats":["Word","PDF","online"],"tables":0,"images":0,"selectableText":True,"result":"passed"}
(out/"resume-report.json").write_text(json.dumps(report,indent=2))
(out/"resume-text.txt").write_text(pdf_text)
print(json.dumps(report))
