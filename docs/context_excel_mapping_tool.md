# VSCode / Copilot Context — Gateway Mapping Tool (MVP)

## Project description

This project is a **Next.js** tool to help engineers build **protocol gateways**, initially focused on **BACnet ↔ Modbus**.

The tool imports a **Signals Excel file** whose structure is critical (it is consumed by external software). The goal is to **automatically populate and modify the Signals table** based on real device signal lists, allow the user to review the result, and export the Excel **with the exact same structure**.

The project intentionally separates:

- **Structure (Excel format)** — fixed and authoritative
- **Device signals (points)** — variable and imported
- **Automation rules (policies)** — deterministic
- **AI assistance** — interpretation and selection, not final writing

---

## Current state (already implemented)

- Import `.xlsx` using **SheetJS (xlsx)**
- Parse all sheets as RAW JSON (headers + rows, lossless)
- Display the JSON
- Export back to `.xlsx` preserving:

  - sheet names
  - column names
  - column order

---

## MVP goal (where we want to arrive)

For BACnet → Modbus gateways:

1. Import the **Signals Excel** to understand:

   - structure
   - column semantics
   - protocol metadata already present in the file

2. Import or paste a **BACnet point list** (signals of one or more devices, e.g. 8 thermostats).

3. Automatically:

   - classify points (analog / binary / multistate)
   - select relevant points (rules + optional AI help)
   - generate Modbus mappings using deterministic policies
   - write rows into the Signals table following the exact Excel structure

4. Let the user:

   - review and validate the table
   - see warnings (duplicate addresses, incompatible formats, etc.)

5. Export the updated Excel.

---

## What the Signals Excel represents

The `Signals` sheet is **NOT a device inventory**.

It is the **final mapping table** that describes how signals are exposed between protocols.

Therefore:

- The Excel does not tell us which devices exist
- The Excel tells us **how signals must be written** for the target software

---

## How devices are introduced into the system

Devices are introduced **implicitly through their signals**, not as explicit objects.

A "device" is treated as:

- a group of signals
- repeated N times
- identified by a `deviceId` or similar prefix

### Minimal required input for devices

A structured list of signals, for example via CSV / JSON:

```
deviceId,signalName,objectType,instance,units,description
T01,RoomTemperature,AI,1,°C,Room temperature
T01,Setpoint,AV,2,°C,Room setpoint
T01,Mode,MSV,3,,Operating mode
T02,RoomTemperature,AI,1,°C,Room temperature
...
```

This input may come from:

- BACnet discovery (online)
- Manufacturer point list (CSV / Excel)
- Copy-pasted text (parsed with AI)

---

## Role of AI (very important)

AI is **NOT** responsible for writing Excel rows directly.

AI is used only for:

- parsing unstructured text into structured signal lists
- assisting with signal classification when metadata is incomplete
- suggesting which signals are relevant (e.g. "core thermostat points")

All table modifications are performed by **deterministic code**, not AI.

---

## Deterministic automation (core of the system)

Automation is rule-based and repeatable.

### Example rules

- Analog BACnet objects → Modbus Holding Registers
- Binary BACnet objects → Modbus Coils
- Multistate BACnet objects → Modbus Holding Registers (uint16)

### Address allocation policy (example)

- Coils start at address 0
- Analog Holding Registers start at address 0
- Multistate Holding Registers start at address 2000
- Address increments depend on data length (16/32 bit)

These policies are configurable but **never guessed**.

---

## Internal data layers

1. **RAW workbook** (lossless)

   - headers + rows per sheet
   - used for export

2. **Canonical signals** (derived)

   - normalized signal objects
   - used for validation, filtering, mapping

All changes must be written back to RAW before export.

---

## Actions (automation units)

Actions are pure functions that modify the RAW workbook.

Signature:

```
action(rawWorkbook, deviceSignals, policy) => { updatedWorkbook, warnings }
```

Examples:

- Generate Signals rows from BACnet point list
- Auto-assign Modbus addresses
- Normalize units and formats

---

## Stack (fixed for MVP)

- **Next.js (App Router)**
- **React + TypeScript**
- **SheetJS (xlsx)** for Excel import/export
- Optional:

  - Zod (validation)
  - TanStack Table (editable UI)

---

## Engineering principles

- Preserve Excel structure at all costs
- Prefer simple, explicit code over abstractions
- Changes must be previewable and reviewable
- Automation must be reproducible
- No magic, no guessing

---

## MVP roadmap

1. Import Signals Excel (done)
2. Import device signal list (CSV / JSON / text)
3. Normalize signals into canonical form
4. Apply deterministic mapping rules
5. Write rows into Signals
6. Validate and warn
7. Export Excel

---

## Key sentence (mental model)

> Excel defines the language. Device signals provide the vocabulary. Policies define the grammar. AI only helps with translation, not writing.

This document must be treated as **authoritative context** by VSCode agents (Copilot, Cursor, Continue, etc.).
