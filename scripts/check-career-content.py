"""Validate release-specific career facts and preserve the existing work excerpts."""
from pathlib import Path
import hashlib
import html
import json
import re

root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'scripts/resume.json').read_text(encoding='utf-8'))
assert data['employment'] == 'Freelance | February 2023–Present'
assert data['support_employment'] == 'Foundever | August 2020–March 2023'
assert 'April 2021' in data['support_text']
assert [a['company'] for a in data['agencies']] == ['SEO Leads', 'JDS1 Marketing']
assert data['agencies'][0]['relationship'] == 'Current agency engagement (part-time)'
assert data['agencies'][1]['relationship'] == 'Previous agency engagement'
assert data['title'] == 'Digital Marketing & SEO Specialist'
for page in ['index.html', 'experience.html', 'resume.html']:
    text = html.unescape((root / page).read_text(encoding='utf-8'))
    for company in ['SEO Leads', 'JDS1 Marketing', 'Foundever']:
        assert company in text, (page, company)
for path in root.glob('*.html'):
    if path.name == '404.html':
        continue
    text = html.unescape(path.read_text(encoding='utf-8'))
    assert data['title'] in text, path.name
    assert 'SEO & Digital Marketing Operations</span>' not in text
    assert all(term not in text.lower() for term in ['financial insecurity', 'salary expectations', 'millionaire', 'guaranteed income'])
original = {
 'keyword-categorization.csv': '6d3516344b118a2555bd0dbe32c0781b393d992b',
 'campaign-intent-review.csv': '107daae3853044e6a0295ff288430bda4875e87c',
 'email-reporting-excerpt.csv': '6d1afed8f43ca64107b159e515c033720b0f2777',
 'landing-page-planning-excerpt.csv': '8cd472abc14f69393e75cbc9f6c076c357803ac5',
 'lead-tracking-workflow.csv': '26ee6f50d650e3f8b17da506a0792da025dffc46'
}
for filename, sha in original.items():
    content = (root / 'samples' / filename).read_bytes()
    assert hashlib.sha1(b'blob ' + str(len(content)).encode() + bytes([0]) + content).hexdigest() == sha, filename
experience = (root / 'experience.html').read_text(encoding='utf-8')
assert experience.count('class="industry-card"') == 8
assert 'do not imply direct employment or client endorsement' in experience
assert 'independent' in (root / 'case-islaclean.html').read_text(encoding='utf-8').lower()
assert 'noindex' in (root / 'islaclean/index.html').read_text(encoding='utf-8')
print('Career facts, employer attribution, eight anonymous industry examples and five original work excerpts verified.')
