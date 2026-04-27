# AC065 & AC063 User Guide (Application Data Tab)

This guide explains what `AC065` and `AC063` mean, why they often show `0`, and how to make them non-zero for testing and validation.

---

## What These Two Rows Mean

### AC065 — Net Changes in Application Amount

- This is a **dollar adjustment row** in the pipeline section.
- It represents the net effect of changes in application amounts that are not fully explained by the standard pipeline movement rows.
- Think of it as a balancing amount line for pipeline dollars.

### AC063 — Net Application Changes

- This is a **count adjustment row** in the pipeline section.
- It represents the net effect of application count changes that are not fully explained by standard pipeline movement rows.
- Think of it as a balancing count line for pipeline volume.

---

## Why AC065 and AC063 Are Often 0

In normal clean data flow, pipeline movement is already fully explained by:

- beginning pipeline
- applications received
- approved-not-accepted
- denied
- withdrawn
- closed for incompleteness
- closed/funded
- ending pipeline

When those movements reconcile cleanly, both adjustment lines naturally stay `0`.

So `0` is usually not an error by itself.

---

## How to Change AC065/AC063 to Non-Zero

You have two practical methods:

## Method A (Operational / Real-data behavior)

Create a period scenario where pipeline movement and ending snapshot do not perfectly reconcile.

Practical examples:

- Move applications across statuses inside the same quarter while also changing loan amount values.
- Create/update records near period boundaries so beginning/ending snapshots differ from movement rows.
- Change application amounts after earlier pipeline events have already occurred in the same period.

Expected result:

- `AC065` may become non-zero (amount adjustment),
- `AC063` may become non-zero (count adjustment).

This method is realistic, but less deterministic and may take several scenario attempts.

---

## Method B (Deterministic QA override from UI)

Use the built-in QA override controls in the `Lender > MCR Reports` page.

### Steps

1. Open `Lender > MCR Reports`.
2. In the generate panel, find:
   - `QA: pipeline plug overrides (AC065 / AC063)`
3. Enable:
   - `Apply overrides on Generate`
4. Enter values:
   - `AC065 amount ($)` (example: `50000`)
   - `AC063 count` (example: `2`)
5. Click `Generate Report`.
6. Verify in `Application Data` tab:
   - `AC065` shows your override amount
   - `AC063` shows your override count

### Important

- This is intended for QA/testing validation.
- If you turn override off and regenerate, values return to normal computed behavior.

---

## Suggested Test Cases

### Case 1 — Simple Non-Zero Check

- AC065 = `25000`
- AC063 = `1`

Generate and verify both rows move from `0`.

### Case 2 — Count-Only Change

- AC065 = `0`
- AC063 = `3`

Generate and verify only AC063 moves.

### Case 3 — Amount-Only Change

- AC065 = `90000`
- AC063 = `0`

Generate and verify only AC065 moves.

---

## Business Interpretation Tips

- Positive AC065: net upward adjustment in pipeline dollars.
- Negative AC065: net downward adjustment in pipeline dollars.
- Positive AC063: net increase in pipeline counts.
- Negative AC063: net decrease in pipeline counts.

Use these as reconciliation indicators, not standalone production KPI drivers.

