"""One-time focused improvements to the preserved styles and practice site."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
css=ROOT/'styles.css'
text=css.read_text(encoding='utf-8')
marker='/* Career package refinement */'
text=text.split(marker)[0]
text += '''
/* Career package refinement */
.hero h1{font-size:clamp(2.35rem,4.5vw,3.85rem);line-height:1.08;letter-spacing:-.04em}
.hero-grid{grid-template-columns:minmax(0,1fr) 220px;gap:60px}
.hero{padding:62px 0}.hero-links{display:flex;flex-wrap:wrap;gap:10px 24px;margin-top:20px;font-size:.9rem;color:#dae4e6}
.hero-links a{padding:4px 0}.portrait{padding-left:24px}.portrait img{width:190px}
.capability-band{background:var(--alt);border-bottom:1px solid var(--line);padding:26px 0}
.capability-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:35px}
.capability-grid h2{font-size:1.1rem;letter-spacing:-.02em;margin-bottom:7px}.capability-grid p{font-size:.9rem;color:var(--muted)}
.related-grid{display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-top:30px}
.related-grid>a{padding:26px;border:1px solid var(--line);text-decoration:none}.related-grid .eyebrow{margin-bottom:12px}
.related-grid p:not(.eyebrow){margin:15px 0;color:var(--muted)}.related-grid h3{font-size:1.45rem}.related-grid>a:hover h3{text-decoration:underline}
.case-facts{grid-template-columns:1fr 1fr 1.1fr;max-width:none;gap:30px}
.sample-index{display:flex;flex-wrap:wrap;gap:10px 24px;padding-top:28px;padding-bottom:22px;border-bottom:1px solid var(--line)}
.sample-index a{font-size:.95rem;font-weight:600;padding:5px 0}.evidence-note{padding-top:25px;font-size:.95rem;color:var(--muted)}
.sample-detail{margin-top:20px;border:1px solid var(--line);padding:16px}.sample-detail summary{font-weight:650;cursor:pointer;padding:3px 0}
.sample-detail[open] summary{margin-bottom:15px}.sample-detail .table-scroll{border:0}
tbody th{background:transparent;font-size:inherit;font-weight:600;width:27%}tr:last-child th{border-bottom:0}
.checklist-copy{padding-left:22px;margin:0 0 20px}.checklist-copy li{margin-bottom:12px}
.footer-inner>div:last-child{flex-wrap:wrap}.resume-content p{overflow-wrap:anywhere}
:focus-visible{outline-color:#a33c0c}.site-header :focus-visible,.hero :focus-visible,.case-hero :focus-visible,.site-footer :focus-visible,.contact-section :focus-visible{outline-color:#f6ab7e}
@media(max-width:900px){.hero-grid{grid-template-columns:1fr 180px;gap:32px}.hero h1{font-size:3rem}.brand span{font-size:.72rem}.nav-links{gap:15px}.case-facts{gap:20px}}
@media(max-width:680px){.hero-grid{display:flex;gap:28px}.hero{padding:38px 0}.hero h1{font-size:clamp(2.2rem,9.2vw,3.2rem)}.portrait{padding:20px 0 0}.portrait img{width:76px;height:76px}.capability-grid,.related-grid,.case-facts{grid-template-columns:1fr;gap:22px}.capability-band{padding:24px 0}.nav-links{gap:2px}.nav-links a{display:block;min-height:44px;padding:10px 0}.menu-btn{min-height:44px}.brand{font-size:1rem}.brand span{font-size:.65rem}.footer-inner>div:last-child{gap:12px 22px}.sample-index{gap:5px 20px}.sample-index a{padding:8px 0}.sample-detail{padding:12px}.resume-heading>p:last-child{overflow-wrap:anywhere}}
@media print{.resume-shell{font-size:10pt}.resume-content section{margin-top:12px}.resume-content h2{margin-bottom:7px;padding-bottom:4px}.resume-content p+p{margin-top:4px}.resume-content article{break-inside:auto}.resume-role{margin-bottom:5px}.resume-content ul{margin:7px 0}.resume-heading{padding-bottom:10px}.resume-heading .eyebrow{display:none}.resume-heading>p:last-child{font-size:9pt}.resume-role span{font-size:9pt}}
'''
css.write_text(text,encoding='utf-8')
for f in (ROOT/'islaclean').glob('*.html'):
    s=f.read_text(encoding='utf-8')
    s=re.sub(r'\s*<link[^>]+(?:fonts.googleapis.com|fonts.gstatic.com)[^>]*>','',s)
    s=s.replace('<body>','<body>\n  <a class="skip-link" href="#main">Skip to content</a>') if 'class="skip-link"' not in s else s
    s=s.replace('<main>','<main id="main">')
    s=s.replace('styles.css"','styles.css?v=20261007-career"').replace('script.js"','script.js?v=20261007-career"')
    s=re.sub(r'class="(active|nav-cta active)"(?! aria-current)',r'class="\1" aria-current="page"',s)
    if 'rel="icon"' not in s: s=s.replace('</head>','  <link rel="icon" href="../favicon.svg" type="image/svg+xml">\n</head>')
    if '../case-islaclean.html' not in s: s=s.replace('<div class="footer-links">','<div class="footer-links">\n        <a href="../case-islaclean.html">Back to Eric’s portfolio</a>')
    # Fix H1-to-H3 skips while retaining H3 under actual H2 sections.
    first_h2=s.find('<h2'); prefix=s[:first_h2] if first_h2>=0 else s; tail=s[first_h2:] if first_h2>=0 else ''
    prefix=re.sub(r'<h3>(.*?)</h3>',r'<h2 class="card-title">\1</h2>',prefix,flags=re.S)
    s=prefix+tail
    s=s.replace('<th>','<th scope="col">')
    if f.name=='deep-cleaning.html' and 'class="table-scroll"' not in s:
        s=s.replace('<table aria-label=', '<div class="table-scroll" tabindex="0" role="region" aria-label="Routine versus deep cleaning comparison"><table aria-label=').replace('</table>','</table></div>')
    if f.name=='about.html': s=s.replace('and conversion tracking.', 'and demo interaction handling.')
    if f.name=='contact.html' and 'data-demo-fields' not in s:
        s=s.replace('<form data-demo-form="cleaning_request">','<noscript><p>The demo form requires JavaScript. No information can be submitted while it is disabled.</p></noscript>\n        <form data-demo-form="cleaning_request"><fieldset disabled data-demo-fields>')
        s=s.replace('</form>','</fieldset></form>')
    if f.name=='contact.html':
        s=s.replace('<label>Service\n            <select name="service" required>', '<div class="form-field"><label for="demo-service">Service</label>\n            <select id="demo-service" name="service" required>')
        s=s.replace('</select>\n          </label>', '</select>\n          </div>')
    s=s.replace('<div class="icon-tile">','<div class="icon-tile" aria-hidden="true">')
    f.write_text(s,encoding='utf-8')
f=ROOT/'islaclean/styles.css'; s=f.read_text(encoding='utf-8').split('/* Practice site accessibility */')[0]
s+='''
/* Practice site accessibility */
body{font-family:"Segoe UI",Arial,sans-serif}.skip-link{position:absolute;z-index:60;top:0;left:16px;background:white;padding:12px;transform:translateY(-150%)}.skip-link:focus{transform:translateY(0)}
:focus-visible{outline:3px solid #a33c0c;outline-offset:4px}.feature-panel :focus-visible{outline-color:#a8e1d1}
.card-title{font-size:22px;line-height:1.2;letter-spacing:-.03em;margin:0 0 12px}.feature-panel .card-title{color:white}
.card .kicker{color:#a63c1a}.table-scroll{overflow-x:auto}.table-scroll table{min-width:500px}.breadcrumb a,.prose p a{ text-decoration:underline;text-underline-offset:3px}.form-field{display:grid;gap:7px}
fieldset{border:0;padding:0;margin:0;min-width:0;display:grid;gap:14px}button:disabled{cursor:not-allowed;opacity:.6}
@media(max-width:900px){.site-header{position:static}.nav{flex-wrap:wrap;padding:18px 0;gap:15px}.nav-links{width:100%;gap:6px 18px}.nav-links a:not(.nav-cta){display:inline-flex}.nav-links a{min-height:44px;align-items:center;padding-top:8px;padding-bottom:8px}}
@media(max-width:640px){h1{font-size:clamp(2rem,9vw,2.75rem);overflow-wrap:break-word}.hero-card,.feature-panel{padding:24px}.footer-links a{padding:6px 0}.card-title{font-size:22px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important}.btn:hover{transform:none}}
'''
f.write_text(s,encoding='utf-8')
f=ROOT/'islaclean/script.js';s=f.read_text(encoding='utf-8')
if 'fieldset.disabled' not in s: s += "\n// Enable the browser-only form only after its submit handler is registered.\ndocument.querySelectorAll('[data-demo-fields]').forEach(fieldset => { fieldset.disabled = false; });\n"
f.write_text(s,encoding='utf-8')
(ROOT/'favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#102b35"/><path d="M12 18h18v6H18v5h10v6H18v5h12v6H12Zm40 2-4 5c-6-5-12-1-12 7s6 12 12 7l4 5c-11 9-23 1-23-12s12-21 23-12Z" fill="#f6ab7e"/></svg>\n',encoding='utf-8')
print('Refined shared styles, practice-site accessibility and site identity.')
