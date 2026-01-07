# Copilot Instructions — Excel Protocol Mapping Tool

## Project

A Next.js (App Router) tool that imports an Excel workbook (e.g. sheets: `Signals`, `BACnet Server`, `Conversions`), converts it into a RAW JSON model for editing and automation, and exports back to XLSX preserving the exact tabular structure (same sheets, same columns, same column order).

## Current state

- Import XLSX using SheetJS `xlsx` => RAW JSON (headers + rows per sheet).
- Display JSON.
- Export RAW back to XLSX with the same structure.

## Goal

On import, the tool MUST detect the mapping direction (protocols) by reading the Excel metadata already present in `Signals`:

- `Signals!B4` = Internal Protocol (e.g. "BACnet Server")
- `Signals!B5` = External Protocol (e.g. "Modbus Master")

Then the user can run “Actions” (automations) that update the table (RAW + derived canonical model), and export a new XLSX.

## Stack

- Next.js + React + TypeScript
- SheetJS `xlsx` for reading/writing Excel (tabular focus, no styles required)
- Optional: Zod for schema validation
- Optional: TanStack Table for editable tables

## Data model rules (important)

- Excel is the source of truth.
- Maintain sheet names and header order; never rename columns.
- Use 2 layers:
  1. RAW (lossless): headers + rows
  2. Canonical (derived): normalized signals for validation/mapping
- All modifications must be applied back into RAW so export stays correct.

## Automations (“Actions”)

Implement actions as pure functions:

- input: { rawWorkbook, protocolsMetadata, actionParams }
- output: updated rawWorkbook + warnings

Examples:

- Generate Modbus columns from BACnet definitions (or vice versa)
- Apply/assign Conversion IDs
- Normalize units/states fields
- Allocate Modbus addresses according to a user-defined policy (no guessing)

## AI usage

AI can help interpret unclear text or propose mappings, but the final table changes must be deterministic, validated, and user-reviewable (diff/preview).
