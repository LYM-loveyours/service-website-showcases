# QA evidence · 1 October 2026

54 Playwright checks: all 22 pages plus the collection at 1440×1000 and 390×844 in Chromium; automated WCAG 2 A/AA and 2.1 AA checks, one H1, no horizontal overflow, no browser exceptions or failed page assets; recursive local-link checks; property-filter state; successful enquiry demo without a POST. Separate form checks passed in Chromium, Firefox and WebKit. Viewport screenshots are in `screenshots/`.

Design review used actual desktop/mobile viewport captures, compared with LYM’s light editorial direction. It is an internal design assessment, not an independent panel score.

`npm audit`: zero known vulnerabilities at the recorded check. See `PROVENANCE.json` for source hashes and sanitisation. The original private Git history was not copied or audited for publication.

Not tested: physical devices, assistive-technology user testing, production hosting, live delivery, load/performance under real traffic or GitHub-hosted CI. Automated accessibility checks are not certification. No measured commercial results are claimed. Nothing deployed.
