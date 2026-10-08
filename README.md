# Eric John Cruz | SEO & Digital Marketing Operations

Public portfolio: https://ericcruzdigital.github.io/

Static HTML, CSS and JavaScript. The career package covers search/content, local SEO support, analytics/reporting, marketing operations, campaign planning, client content review and publishing, and practical CRM work. The résumé presents freelance experience from February 2023 and the documented Foundever support-role dates. Education remains a supporting credential.

## Evidence and factual scope

- The content publishing case describes topic research, preparation, client communication, requested revisions, approval and publishing. It claims contribution to those stages, not sole authorship or ownership of the full strategy. Private client drafts and review messages are excluded.
- Five original CSV excerpts are preserved. They are condensed, anonymized or reformatted from existing work; they are not full account exports.
- Three new blank templates illustrate operations handoffs, local SEO review and SEO reporting. They are explicitly labeled and do not pretend to be completed client records.
- IslaClean is a fictional independent project with ten noindex pages, AI-assisted implementation and a browser-only demo form. It is excluded from the portfolio sitemap.
- Public content claims no attributable revenue, ranking gains, paid-media returns, advanced technical SEO, specialist AI-search outcomes, advanced software development or CRM automation engineering.
- Names, title, dates, employment type, résumé bullets, tools and education are shared between the website and Word résumé. Private campaign data, contact records, compensation strategy and client documents must remain private.

## Editing and rebuilding

The site is committed as static output and needs no build step on GitHub Pages.

1. Edit `scripts/resume.json` for shared résumé facts and tools.
2. Edit `scripts/build-career.py` for career-page content. Run `python scripts/build-career.py` to rebuild the ten career pages, labeled templates and sitemap.
3. Run `node scripts/build-resume.cjs` with the `docx` package available to rebuild the Word résumé.
4. Shared presentation lives in `styles.css` and `script.js`. The independent practice website remains in `islaclean/`.

`scripts/refine-site.py` records the focused accessibility and styling upgrade. It is not a required deployment step.

## Validation

`node scripts/check-site.cjs` serves the static files locally and checks all 21 HTML pages at desktop, tablet and mobile widths. It requires Playwright, axe-core and a Playwright Chromium installation. Set `CAREER_QA_BROWSER_CHANNEL=msedge` to use Microsoft Edge. Set `CAREER_QA_NODE_MODULES` if dependencies are outside the normal module path; set `CAREER_QA_OUTPUT` to keep screenshots and test reports outside the repository. Use `--live` to check the deployed site and compare downloads with local artifacts.

The Word résumé is single-column selectable text with standard headings and conventional bullets. Render it in Word after content changes, and inspect page count and layout before publishing. Text extraction and document-structure checks are useful ATS compatibility checks, not a guarantee about every applicant-tracking platform.

## Publishing and recovery

Updates go through a feature branch and pull request. GitHub Pages serves main at the repository root. Preserve the existing branch rules and require a successful deployment before calling an update live.

Recovery rollback point: `86b986dcf3a8684f036980a9c98ee7fed4270897`, preserved on `backup/pre-recovery-20261008`. The previous upgrade was already merged through PR #8 and successfully deployed before the recovery.

Pre-upgrade rollback point: `26307f6021596ca0cdb9da6fc75007a871a5bc73`, preserved on `backup/pre-career-upgrade-20261007`. Restore through a new reviewed commit or revert; do not force-push main.
