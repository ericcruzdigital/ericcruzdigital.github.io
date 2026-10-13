# Virtual Assistant portfolio

Public URL: https://ericcruzdigital.github.io/virtual-assistant/

This additive section uses static HTML and its own CSS. Existing marketing pages, samples and résumé remain unchanged. No engineering repository is involved.

## Content scope

Positioning: marketing and operations virtual assistance, supported by administrative coordination, reporting and content work. Past job titles remain Digital Marketing & SEO (freelance, February 2023–Present) and Subject Matter Expert / Customer Support (Foundever, August 2020–March 2023; SME progression in April 2021). Individual agency dates and employment hours are not inferred.

Sources reviewed at release 586f167cf6886b43a6ac7a0b1c7330c01466c218:
- scripts/resume.json and experience.html for public career facts and contact methods
- case-reporting.html and samples/email-reporting-excerpt.csv
- case-operations.html and samples/operations-handoff-template.csv
- case-keyword-content.html and samples/keyword-categorization.csv

The operations sample is a blank illustrative template. Reporting and keyword samples are previously published anonymized excerpts, not raw account exports. No attributable commercial improvement is claimed. Previous agency names are omitted in VA content. No salary, private tracker, work email, internal document or named agency client is introduced.

## Hiring research

Reviewed October 13, 2026:
- Marketing and Reporting Virtual Assistant, LoudMouse, updated May 12, 2026: https://www.onlinejobs.ph/jobseekers/job/Marketing-and-Reporting-Virtual-Assistant-Full-Time-1513905
- Operations & Project Coordination VA, LookUp Media, updated September 8, 2026: https://www.onlinejobs.ph/jobseekers/job/virtual-assistant-operations-project-coordination-remote-full-time-1725639
- WordPress, research and social media VA, updated September 28, 2026: https://www.onlinejobs.ph/jobseekers/job/ongoing-virtual-assistant-for-wordpress-books-research-and-social-media-1739697
- MyOutDesk current careers: https://www.myoutdesk.ph/career/

These advertisements support emphasis on reporting accuracy, task follow-ups, research, CMS work and written communication. Listing availability can change. Requirements are hiring signals, not claims about the applicant.

Unverified requirements excluded: executive calendar and travel management, bookkeeping, advanced Excel models, Salesforce, HubSpot, Zapier, and independent automation engineering. Availability and time-zone overlap must be discussed for each role.

## Maintenance

- Edit virtual-assistant HTML and CSS directly.
- scripts/va-resume.json is the common factual source for Word and PDF and must stay consistent with virtual-assistant/resume.html.
- Run python scripts/build-va-resume.py with python-docx.
- Render with the repository's scripts/qa/render_docx.py, inspect every page, copy the emitted PDF into downloads, then run python scripts/check-va-resume.py.
- Run node scripts/check-va-site.cjs, or add --live after deployment.
- Preserve the three VA sitemap entries if rebuilding the main career package.
- Both dedicated download filenames begin Eric_John_Cruz_Virtual_Assistant_Resume.

The VA workflow builds and checks on its feature branch. Generated résumés are committed only to that branch after a guarded head check. Screenshots and reports are kept on a separate QA branch and as workflow artifacts. Main-branch checks compare published HTML and file bytes before reporting success.
