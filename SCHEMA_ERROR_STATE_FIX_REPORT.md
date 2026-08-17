# Schema Error State Fix Report

**Date:** 2026-08-13
**Defect ID:** SMOKE-01

---

## Original Failure

| Field | Value |
|-------|-------|
| **Test** | `smoke.spec.ts` > "invalid schema input produces error state" |
| **Route** | `/schema` |
| **Input** | `this is not valid JSON { broken [` |
| **Expected** | Visible text matching `/error\|invalid\|failed\|unable/i` |
| **Actual** | No error message rendered. Status showed "Analyzed 0 fields" |

## Root Cause

`SchemaDetector.parseJsonSchema()` catches `JSON.parse` errors internally and returns `{ fields: [], source: "json-schema" }` instead of throwing. The `handleAnalyze` function's catch block was never reached. The analysis "succeeded" with zero fields, displaying the misleading status "Analyzed 0 fields" instead of an error.

## Fix Applied

**File:** `src/app/(app)/schema/page.tsx`

1. Added `analysisError` state variable
2. In `handleAnalyze`: after `detector.detect()` returns, check if `schema.fields.length === 0`. If so, set `analysisError` with the message: "Unable to analyze this schema. Check that the input is valid JSON, JSON Schema, CSV, or a supported SQL CREATE TABLE statement."
3. On error: clear previous `analysis` and `results` state to prevent showing stale data
4. In the catch block: set `analysisError` with the exception message
5. Rendered the error with `role="alert"` and destructive styling (border, icon, text)
6. Error clears automatically when a new analysis or generation starts (`setAnalysisError("")`)
7. Status message is hidden while an error is displayed (`!analysisError` guard)

## Behavior After Fix

| Scenario | Result |
|----------|--------|
| Invalid JSON input → Analyze | Error banner: "Unable to analyze this schema..." |
| Valid JSON input → Analyze | Error clears, analysis results shown |
| Exception during analysis | Error banner with exception message |
| Invalid input → Generate | Generate button is disabled (requires analysis first) |
| User corrects input → Analyze | Error clears on new attempt |

## Test Evidence

```
ok [chromium] › e2e/smoke.spec.ts:123:7 › Smoke tests › invalid schema input produces error state (3.5s)
```

**Final status:** FIXED
