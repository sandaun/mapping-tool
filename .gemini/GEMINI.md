# Excel Protocol Mapping Tool — Project Rules

These rules are project-specific and must always be respected.

---

## Project Context

This is a Next.js (App Router) tool that imports Excel workbooks
(`Signals`, `BACnet Server`, `Conversions`), converts them into a RAW JSON
model, allows controlled transformations, and exports back to XLSX
preserving the exact structure.

---

## Source of Truth (CRITICAL)

Excel is the source of truth.

Rules:
- Sheet names MUST be preserved
- Column headers MUST NOT be renamed
- Column order MUST remain identical
- Empty cells MUST be preserved
- Exported Excel must be round-trip safe

---

## Data Model Layers

There are exactly two layers.

### 1. RAW (lossless)
- Mirrors Excel exactly
- Headers and rows as-is
- No normalization
- No derived fields

### 2. Canonical (derived)
- Normalized and validated representation
- Used only for reasoning and validation
- NEVER exported directly

All automations must update RAW so exports remain correct.

---

## Actions (Automations)

Actions are pure, deterministic functions.

Type definition:

- Input:
  - rawWorkbook
  - protocolsMetadata
  - actionParams

- Output:
  - updatedRawWorkbook
  - warnings

Rules:
- No guessing
- No hidden defaults
- All changes must be explainable
- Always produce a preview or diff before applying

---

## Protocol Detection

Mapping direction MUST be detected from Excel metadata.

Rules:
- `Signals!B4` → Internal protocol
- `Signals!B5` → External protocol
- Never infer protocols implicitly
- If metadata is missing, stop and ask

---

## Testing & Validation (Project)

Testing rules:
- Use real Excel templates from `public/templates/`
- Always test round-trip:
  Import → Modify → Export → Re-import

Validation checklist:
- Sheet names preserved
- Column order unchanged
- No data loss
- Deterministic output
- Protocol constraints respected

---

## AI-Assisted Logic (IMPORTANT)

Rules:
- AI may assist with interpretation only
- Final transformations must be deterministic
- User must always be able to review and approve changes
- If information is missing, ask instead of assuming
