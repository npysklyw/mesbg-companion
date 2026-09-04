# Source manifest audit

This first-pass pipeline extracts only concise army-composition facts from locally supplied PDFs. PDFs and complete extracted text are never committed, and catalogue JSON is never rewritten.

## Setup

Install Python 3 and `pypdf`, or set `SOURCE_MANIFEST_PYTHON` to a Python executable that already provides `pypdf`.

Place the three PDFs in one local directory. Expected filename fragments are `Lord of the Rings 2024`, `Hobbit 2024`, and `Armies of Middle-Earth`.

```powershell
npm run extract:source-manifest -- C:\path\to\pdfs
npm run audit:source-catalogue
```

The extractor writes candidate facts to `source-manifest/generated.json`, then overlays `source-manifest/overrides.json` into `source-manifest/manifest.json`. Put reviewed corrections in `overrides.json`; regeneration never edits that file. The comparison report is `source-manifest/comparison-report.json`.

`needsReview` means text order, a name, a point value, or another field was not reliable enough to assert. Generated discrepancies remain leads for human review, not proof that the app catalogue is wrong.

## Current scope

The parser looks for army-composition headings, hero-tier sections, warrior sections, base points, and short mandatory-profile/General requirements. It intentionally excludes lore, full rule prose, wargear, profile characteristics, and combat special rules.
