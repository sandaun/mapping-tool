# VSCode / Copilot Context — Gateway Mapping Tool (MVP)

## Project description

This project is a **Next.js** tool to help engineers build **protocol gateways**, initially focused on **BACnet ↔ Modbus**.

Instead of requiring the user to upload a Signals Excel file every time, the tool provides **gateway-specific Excel templates** stored in the repository.  
Each template corresponds to a **gateway direction and protocol combination** (e.g. BACnet → Modbus Master, Modbus → BACnet Server, KNX → BACnet, etc.) and defines the exact structure expected by the target software.

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

This MVP supports **multiple gateway types**, each with its own Signals Excel template.

### Gateway types (initial scope)

- **BACnet Client → Modbus Master**
  - A BACnet BMS/SCADA controls real Modbus slave devices.
  - Requires importing **Modbus register maps** (meters, HVAC controllers, PLCs, etc.).
- **Modbus Client → BACnet Server**
  - A Modbus SCADA/BMS controls BACnet devices through a virtual BACnet Server.
  - Requires importing **BACnet point lists** (thermostats, controllers, etc.).

### Target workflow

1. User selects the **gateway type** from a predefined list.
2. The system loads the corresponding **Signals Excel template** from the repository.
3. User imports or pastes **device signal definitions** (Modbus register maps or BACnet point lists).
4. The system automatically:
   - classifies signals (analog / binary / multistate)
   - applies deterministic mapping rules and address allocation policies
   - writes rows into the Signals table following the selected template structure
5. User reviews the generated table and warnings.
6. User exports the updated Excel.

---

## What the Signals Excel represents

The `Signals` sheet is **NOT a device inventory**.

It is the **final mapping table** that describes how signals are exposed between protocols.

Therefore:

- The Excel does not tell us which devices exist
- The Excel tells us **how signals must be written** for the target software

---

## Signals Excel templates

Signals Excel files are treated as **gateway-specific templates**, not generic inputs.

- Each template defines:
  - sheet names
  - column names
  - column order
  - protocol semantics for a specific gateway direction
- Templates are stored in the repository and loaded automatically based on the selected gateway type.
- Users do not manually edit template structure; automation only fills or modifies rows.

Example repository structure:

```
/templates
  /bacnet-to-modbus
    Signals.xlsx
  /modbus-to-bacnet
    Signals.xlsx
  /knx-to-bacnet
    Signals.xlsx
```

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

1. Select gateway type and load Signals template
2. Import device signal list (CSV / JSON / text)
3. Normalize signals into canonical form
4. Apply deterministic mapping rules
5. Write rows into Signals
6. Validate and warn
7. Export Excel

---

## Future enhancements (post-MVP)

### Device management

- **Multiple device instances**: Allow user to specify how many identical devices to generate with the same signal set (e.g., generate 3 devices with the same 10 signals → 30 rows)
- **Custom slave IDs**: Allow manual specification of Modbus slave ID, or auto-increment from last existing device
- **Port and protocol configuration**: Allow selection of RTU vs TCP, and custom port names (currently defaults to "RTU // Port A")

### Policies and automation

- **Grouped allocation**: Allocate addresses grouped by device (e.g., Device 0: 0-99, Device 1: 100-199)
- **Offset-by-type allocation**: Different base addresses for different signal types
- **Custom conversion tables**: User-defined conversion IDs and mappings

### BACnet Units auto-detection

**Post-MVP (keyword matching):**

- **Simple keyword dictionary**: Automatic unit assignment based on signal name patterns
  - Temperature signals → 62 (degrees_Celsius)
  - Humidity signals → 98 (percent_relative_humidity)
  - Pressure signals → 53 (pascals) or 55 (bars)
  - Flow signals → 119 (liters_per_minute) or 135 (cubic_meters_per_hour)
  - Power signals → 132 (watts) or 48 (kilowatts)
  - Current signals → 3 (amperes)
  - CO2/PPM signals → 96 (parts_per_million)
- **Fallback to 95 (no_units)** if no pattern match
- **Multi-language support**: Keywords in English, Spanish, Catalan

**Future (AI-powered):**

- **OpenAI integration**: Interpret non-standard signal names and suggest most probable units
- **Context-aware detection**: Consider device type and industry domain (HVAC, electrical, industrial)
- **Confidence scoring**: Show probability of unit match, allow user to confirm/override
- **Learning from corrections**: Store user corrections to improve future suggestions
- **Batch processing**: Analyze all signals together for better context understanding

### AI-powered parsing

- **OpenAI API integration**: Parse unstructured device documentation (PDFs, manuals) into structured signal lists
- **Text extraction**: Support for EDE files, manufacturer-specific formats

### Validation and preview

- **Signal selection UI**: Interactive table with checkboxes to select which signals to generate
  - Preview all parsed signals before generation
  - Allow user to deselect unwanted signals (debug, duplicates, obsolete)
  - Show signal details (name, type, address, mapped values)
  - Bulk select/deselect options (all, none, by device, by type)
  - Filter and search capabilities
  - Generate only selected signals
- **Canonical layer**: Intermediate normalized representation for validation before writing to Excel
- **Diff preview**: Show before/after comparison of changes
- **Conflict detection**: Warn about duplicate addresses, instances, or signal names
- **Pre-generation validation**: Check for address conflicts, missing required fields, invalid data types

---

## Key sentence (mental model)

> Excel defines the language. Device signals provide the vocabulary. Policies define the grammar. AI only helps with translation, not writing.

This document must be treated as **authoritative context** by VSCode agents (Copilot, Cursor, Continue, etc.).
