# Excel Protocol Mapping Tool — Project Context v2.0

> **Last Updated:** January 2026  
> **Status:** Active Development (Refactoring Phase Complete, Feature Enhancement Phase)

---

## Project Overview

A **Next.js-based tool** for building automation engineers that converts multi-protocol device signals (BACnet, Modbus, KNX) into structured Excel workbooks for gateway configuration software (MAPS).

The tool follows a **two-phase workflow:**
1. **BUILD mode:** Import sources, define devices, run pipeline
2. **FINALIZE mode:** Review, manually edit, and export

---

## Core Principles

### 1. Deterministic Code is the Source of Truth
- All signal generation is **deterministic and repeatable**
- AI is **only** an assisted reasoning layer (parsing, suggestions, validation)
- Manual edits are tracked as explicit **Overrides** (never mutate generated output)

### 2. Excel Structure is Sacred
- Preserve sheet names, column names, and column order at all costs
- Templates define the exact structure expected by MAPS software
- RAW JSON layer ensures lossless import/export

### 3. Two-Layer Data Model
- **RAW workbook:** Lossless representation (headers + rows per sheet)
- **Canonical signals:** Normalized, type-safe signal objects for logic

### 4. KISS & Modern UX
- Simple, intuitive workflows
- Modern UI components (drag & drop, visual feedback)
- Clear separation of concerns

---

## Project Model

### Project Structure

```
Project
  ├─ Template (selected once, defines output schema)
  ├─ Sources (0..n CSV/PDF/Excel inputs)
  │   └─ SignalSets (parsed signals per Source)
  ├─ Devices (N instances per SignalSet)
  ├─ GeneratedOutput (deterministic, immutable)
  ├─ Overrides (manual user edits)
  ├─ OutputTable (GeneratedOutput + Overrides)
  └─ ValidationReport (AI-detected warnings)
```

### Templates

**6 Gateway Types Currently Supported:**
1. BACnet Server ← Modbus Master
2. Modbus Slave ← BACnet Client
3. KNX ← Modbus Master
4. KNX ← BACnet Client
5. BACnet Server ← KNX
6. Modbus Slave ← KNX

Each template:
- Defines output Excel structure (sheets, columns, order)
- Specifies allowed protocol mappings
- Determines AI parsing strategy

Templates are stored in `public/templates/` and loaded automatically.

---

## Two-Phase Workflow

### BUILD MODE

**User can:**
- Select Template (once per project)
- Add Sources (CSV, Excel, PDF)
  - CSV/Excel → parse directly with `parseDeviceSignalsCSV`
  - PDF → AI-assisted parsing (extract tables from manuals)
- Define N Devices per Source
  - Example: Source "Termostat.csv" (10 signals) → 3 Devices → 30 rows
- Configure naming strategy per Device (optional)

**Primary action: "Run Pipeline"**

When user clicks **[Run Pipeline]:**

```
▶ Step 1: Parse all Sources (if not yet parsed)
   ├─ CSV → parseDeviceSignalsCSV()
   └─ PDF → AI parse with confidence scoring

▶ Step 2: AI Semantic Suggestions (optional, user review)
   ├─ Suggest BACnet Units based on signal name
   ├─ Suggest KNX DPT
   └─ User accepts/rejects suggestions

▶ Step 3: Generate Signals (deterministic)
   ├─ For each Source:
   │   For each Device (1..N):
   │     Call generateXXX(signalSet, rawWorkbook, policy)
   ├─ Apply allocation policy (addresses, instances)
   ├─ Apply naming strategy
   └─ Create GeneratedOutput (immutable)

▶ Step 4: AI Semantic Validation (automatic)
   ├─ Detect R/W mismatches
   ├─ Detect address conflicts
   ├─ Detect invalid unit/type combinations
   └─ Create ValidationReport

▶ Step 5: Results & Transition
   ├─ Show GeneratedOutput (N signals)
   ├─ Show ValidationReport (warnings)
   └─ → Switch to FINALIZE mode (pipeline locked)
```

**Pipeline Progress Messages (modern UX):**
```
🔄 Connecting the dots...
📄 Parsing "HVAC_Manual.pdf" with AI...
✅ 15 signals extracted (2 low confidence)
🤖 Running semantic suggestions...
⚙️  Generating Device 1 (Termostat)...
⚙️  Generating Device 2 (Medidor)...
✅ 70 signals generated
🔍 Validating output...
⚠️  3 warnings detected
✅ Pipeline complete! Ready for review.
```

---

### FINALIZE MODE

**Pipeline is locked:**
- No new Sources can be added
- No re-parsing allowed
- No re-generation allowed

**User can:**
- Review OutputTable in editable table
- Perform manual actions (creates Overrides):
  - **Delete rows** (multi-select with Ctrl/Cmd)
  - **Reorder rows** (drag & drop)
  - **Edit row values** (with explicit warning: "Manual edits are risky")
- **Undo last action** (remove last override)
- **Reset all changes** (clear all overrides)
- **Export Excel** (applies overrides to GeneratedOutput)

**Overrides System:**

```typescript
type Override = 
  | { type: 'delete', rowId: string }
  | { type: 'reorder', fromIndex: number, toIndex: number }
  | { type: 'edit', rowId: string, changes: Record<string, CellValue> }

// Apply overrides (pure function)
OutputTable = applyOverrides(GeneratedOutput, overrides)
```

**Key properties:**
- GeneratedOutput is **never mutated**
- Overrides are simple action records
- Enable undo/redo and reset
- No override reapplication across pipeline reruns (pipeline is locked)

---

## AI Responsibilities (Strictly Limited)

### 1. Assisted Parsing (PDFs/Complex CSVs)

**Use case:** Extract signal tables from poorly structured PDFs

**Process:**
1. User uploads PDF
2. System extracts text/images
3. AI reconstructs table structure
4. AI returns structured signals with confidence scores

**Output:**
```typescript
{
  signals: DeviceSignal[],
  warnings: string[],
  lowConfidenceFields: Array<{
    signalIndex: number,
    field: string,
    value: any,
    confidence: number, // 0-1
    evidence: string
  }>
}
```

**UI Flow:**
- Show parsed signals with confidence indicators (🟢🟡🔴)
- Allow user to review/edit low-confidence fields
- User explicitly accepts or discards

**AI must NOT:**
- Invent data
- Make assumptions without evidence
- Skip low-confidence warnings

---

### 2. Semantic Suggestions

**Use case:** Suggest protocol-specific values based on signal semantics

**Examples:**
```
Signal: "RoomTemp"
→ Suggest BACnet Unit: 62 (degC), confidence: 0.95
→ Suggest KNX DPT: 9.001 (temperature)

Signal: "CO2Level"
→ Suggest BACnet Unit: 96 (ppm), confidence: 0.88
→ Suggest KNX DPT: 9.008 (ppm)
```

**When applied:**
- After parsing, before generation
- User reviews and accepts/rejects suggestions
- Deterministic rules run first, AI only resolves ambiguity

---

### 3. Semantic Validation

**Use case:** Detect inconsistencies in GeneratedOutput

**Examples:**
```
⚠️  Signal "Setpoint" (AO): Read-only mode but Write function assigned
⚠️  Signal "Temperature" (Float32): Unit is "-1" but dataType suggests engineering unit
⚠️  Signals "Temp_1" and "Temp_2": Duplicate address (conflict)
```

**When applied:**
- Automatically after generation
- Before showing FINALIZE mode
- Results shown in ValidationReport

**AI must NOT:**
- Auto-fix issues
- Modify GeneratedOutput
- Apply changes without user consent

---

## Technology Stack

### Core Framework
- **Next.js 14+** (App Router)
- **React 18+** with TypeScript (strict mode)
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components

### Excel Processing
- **SheetJS (xlsx)** - Import/export with lossless RAW JSON

### Data Validation
- **Zod** - Schema validation for AI responses and signal types

### UI Components (to add)
- **TanStack Table v8** - Editable table with multi-select, sorting, filtering
- **@dnd-kit** - Modern drag & drop for row reordering
- **shadcn/ui additions:**
  - AlertDialog (for edit warnings)
  - Toast (for undo notifications)

### AI Integration
- **Vercel AI SDK** (`ai` package)
- **@ai-sdk/groq** - Groq integration (free tier: `llama-3.3-70b-versatile`)
- **@ai-sdk/openai** - OpenAI integration (paid, optional)
- **Ollama support** (local, optional)

### Persistence
- **LocalStorage** - Save project state (avoid "oops" moments)
- **Future:** Authentication + Database (Vercel Postgres/KV) for multi-device sync

---

## Implementation Status

### ✅ Completed (Refactoring Phase)

**Core Excel Processing:**
- ✅ Import/Export with SheetJS (lossless RAW structure)
- ✅ 6 gateway type actions implemented and tested
- ✅ Type-safe signal filtering with guards (`isModbusSignal`, `isBACnetSignal`, `isKNXSignal`)
- ✅ RAW workbook + Canonical signals two-layer model

**Deterministic Generation:**
- ✅ All 6 actions refactored with KISS principles
- ✅ Centralized types (`src/types/actions.ts`)
- ✅ Centralized constants (`src/constants/generation.ts`)
  - Protocol constants (BACnet units, KNX DPTs)
  - Empty field handling (`EMPTY_BACNET` vs `EMPTY_KNX`)
- ✅ Shared utilities (`src/lib/actions/utils/`)
  - `allocation.ts` - Address/instance allocation
  - `mapping.ts` - Protocol mappings
  - `modbus.ts`, `bacnet.ts`, `knx.ts` - Protocol-specific helpers
  - `common.ts` - Generic sheet operations
  - `signal-filtering.ts` - Type-safe filtering

**Testing:**
- ✅ Vitest setup
- ✅ Comprehensive test suite (50 tests, 100% passing)
- ✅ Fixture generation scripts for all actions
- ✅ TypeScript strict mode compliance

**Current UI:**
- ✅ Template selector
- ✅ CSV paste & parse
- ✅ Generate signals (single source, single pass)
- ✅ Display RAW workbook
- ✅ Export Excel

---

### 🚧 In Progress / Planned

**BUILD Mode (New):**
- [ ] Multi-source management UI
  - Drag & drop area for CSV/PDF/Excel
  - Source list with parsed signal counts
  - Remove sources
- [ ] Device instances UI
  - Input number + stepper (+/-)
  - Expandable device list (rename, remove)
  - Total signals preview
- [ ] Run Pipeline button with progress messages

**AI Integration:**
- [ ] PDF parsing with Vercel AI SDK
  - Extract tables from PDF
  - Return structured signals with confidence
  - Review UI for low-confidence fields
- [ ] Semantic suggestions
  - Auto-suggest BACnet Units
  - Auto-suggest KNX DPT
  - User review & accept/reject
- [ ] Semantic validation
  - Detect R/W mismatches
  - Detect address conflicts
  - ValidationReport UI

**FINALIZE Mode (New):**
- [ ] Editable table with TanStack Table
  - Multi-row selection (Ctrl/Cmd + click)
  - Delete selected rows
  - Drag & drop row reordering (@dnd-kit)
  - Edit mode with warning dialog
- [ ] Overrides system
  - Track delete/reorder/edit actions
  - Undo last action
  - Reset all changes
  - Apply overrides before export
- [ ] Confidence indicators (🟢🟡🔴) for AI-parsed signals
- [ ] ValidationReport display

**Persistence:**
- [ ] LocalStorage for project state
- [ ] Save/Load project
- [ ] Auto-save on changes

**Future Enhancements:**
- [ ] Authentication (security, multi-device)
- [ ] Database persistence (Vercel Postgres/KV)
- [ ] Project sharing
- [ ] Advanced allocation policies (grouped, offset-by-type)
- [ ] Custom conversion tables

---

## Data Model

### DeviceSignal Types

```typescript
type ModbusSignal = {
  deviceId: string;
  signalName: string;
  registerType: string; // HoldingRegister, InputRegister, Coil, DiscreteInput
  address: number;
  dataType: string; // Int16, Float32, Uint16, etc.
  units?: string;
  description?: string;
  mode?: string; // R, W, R/W
  factor?: number; // Scaling factor
};

type BACnetSignal = {
  deviceId: string;
  signalName: string;
  objectType: string; // AI, AO, AV, BI, BO, BV, MI, MO, MV
  instance: number;
  units?: string;
  description?: string;
};

type KNXSignal = {
  signalName: string;
  groupAddress: string; // e.g., "2/1/0"
  dpt: string; // e.g., "1.001", "9.001"
  description?: string;
};

type DeviceSignal = ModbusSignal | BACnetSignal | KNXSignal;
```

### Type Guards

```typescript
function isModbusSignal(signal: DeviceSignal): signal is ModbusSignal;
function isBACnetSignal(signal: DeviceSignal): signal is BACnetSignal;
function isKNXSignal(signal: DeviceSignal): signal is KNXSignal;
```

---

## Actions (Signal Generation)

Actions are **pure functions** that modify the RAW workbook:

```typescript
type GenerateSignalsResult = {
  updatedWorkbook: RawWorkbook;
  rowsAdded: number;
  warnings: string[];
};

function generateXXX(
  deviceSignals: DeviceSignal[],
  rawWorkbook: RawWorkbook,
  policy: GenerationPolicy = {}
): GenerateSignalsResult;
```

**Implemented actions:**
1. `generateBACnetFromModbus` - BACnet Server ← Modbus Master
2. `generateKNXFromModbus` - KNX ← Modbus Master
3. `generateModbusFromBACnet` - Modbus Slave ← BACnet Client
4. `generateKNXFromBACnet` - KNX ← BACnet Client
5. `generateBACnetServerFromKNX` - BACnet Server ← KNX
6. `generateModbusFromKNX` - Modbus Slave ← KNX

All actions follow consistent patterns with shared utilities.

---

## Allocation Policies

### Address Allocation (Modbus)

**Simple (default):**
- Continue incrementing from last used address
- Example: Device 1 → 0-14, Device 2 → 15-29

**Future (grouped):**
- Reserve address blocks per device
- Example: Device 1 → 0-99, Device 2 → 100-199

### Instance Allocation (BACnet)

**Simple (default):**
- Continue incrementing from last used instance
- Example: Device 1 → 100-109, Device 2 → 110-119

### Naming Strategy (Multiple Devices)

**Default:**
- Device 1 → "RoomTemp", "Setpoint"
- Device 2 → "RoomTemp #2", "Setpoint #2"

**With custom device name:**
- Device "Sala 1" → "Sala 1 - RoomTemp", "Sala 1 - Setpoint"

---

## UI/UX Design Principles

### Modern & Usable
- Drag & drop for file uploads and row reordering
- Visual feedback (loading states, progress messages)
- Multi-select with standard OS shortcuts (Ctrl/Cmd, Shift)
- No "cutres" (no basic checkboxes, no arrow buttons for sorting)

### Clear & Informative
- Confidence indicators (🟢🟡🔴) for AI-parsed data
- Warnings clearly visible but not blocking
- Undo/Reset options always available

### Progressive Disclosure
- Simple by default (collapsed device lists, minimal inputs)
- Expand/review when needed (low-confidence fields, device names)

### Trust the User
- Show warnings but don't block actions
- Allow manual edits with explicit warning
- User is responsible for final verification before export

---

## Engineering Principles

1. **Preserve Excel structure at all costs**
   - Never rename columns
   - Never reorder columns
   - Maintain exact sheet structure

2. **Deterministic code over AI magic**
   - AI only for parsing, suggestions, validation
   - All generation logic is deterministic and testable
   - No AI in the critical path (GeneratedOutput)

3. **Immutability for safety**
   - GeneratedOutput is never mutated
   - Overrides are separate, reversible actions
   - Export applies overrides as final step

4. **Type safety everywhere**
   - Strict TypeScript mode
   - Zod schemas for runtime validation
   - Type guards instead of assertions

5. **Simple, explicit code**
   - KISS over clever abstractions
   - DRY but not at the cost of clarity
   - Functions over classes

6. **Changes must be previewable and reviewable**
   - Show before/after
   - Undo/Reset available
   - Clear warnings for risky actions

---

## Testing Strategy

### Unit Tests (Vitest)
- All 6 actions covered
- Type guards tested
- Utility functions tested
- Fixture-based testing with real workbooks

### Integration Tests
- Full pipeline tests (parse → generate → export)
- Multi-device generation
- Override application

### E2E Tests (Future)
- Full user workflows
- AI parsing with mock responses

---

## Security & Future Considerations

### Authentication (Future)
**Why needed:**
- Multi-user support
- Project ownership & sharing
- API rate limiting (AI calls)
- Audit logs

**Proposed solution:**
- NextAuth.js / Clerk
- GitHub/Google OAuth
- Role-based access (viewer, editor, admin)

### Rate Limiting (AI)
- Groq free tier limits
- Cache AI responses (same PDF → same result)
- Fallback to OpenAI if Groq fails

### Data Privacy
- No PII in signals (only technical data)
- LocalStorage encryption (future)
- GDPR compliance for DB persistence

---

## File Organization

```
/src
  /app
    /api
      /parse-pdf          # AI PDF parsing endpoint
      /export             # Excel export
      /import             # Excel import
    page.tsx              # Main UI
    layout.tsx
  /components
    /ui                   # shadcn/ui components
    DeviceSignalsSection.tsx
    EditableTable.tsx     # NEW: TanStack Table
    SourceManager.tsx     # NEW: Sources UI
    DeviceManager.tsx     # NEW: Devices UI
    ...
  /lib
    /actions              # Signal generation actions
      /__tests__          # Test files + fixtures
      /utils              # Shared utilities
      generateXXX.ts
    /excel
      raw.ts              # RAW workbook utilities
    deviceSignals.ts      # Signal types & guards
    overrides.ts          # NEW: Override system
  /constants
    bacnetUnits.ts
    knxDPTs.ts
    templates.ts
    generation.ts
  /types
    actions.ts
  /hooks
    useFileImport.ts
    useTheme.ts
    useOverrides.ts       # NEW: Override management
/public
  /templates              # Excel templates
/docs
  /context
    excel_mapping_tool.md       # Original context
    excel_mapping_tool_v2.md    # This document
  /manuals                # Protocol documentation
```

---

## Key Differences from Original Context

### What Changed
1. **Project Model:** Added BUILD/FINALIZE workflow (was single-shot)
2. **Sources:** Multiple sources support (was single CSV paste)
3. **Devices:** N instances per source (was 1:1)
4. **Overrides:** Explicit override system (was direct edits)
5. **AI:** Three responsibilities clearly defined (was vague)
6. **Persistence:** LocalStorage added (was in-memory only)
7. **UI:** Modern components specified (TanStack Table, dnd-kit)

### What Stayed the Same
- Templates (6 gateway types)
- Excel structure preservation
- Deterministic generation
- Two-layer data model (RAW + Canonical)
- Type safety & testing

---

## Mental Model

> **Excel defines the language.**  
> **Device signals provide the vocabulary.**  
> **Policies define the grammar.**  
> **AI helps with translation, not writing.**

**Additional:**
> **GeneratedOutput is the author's draft.**  
> **Overrides are the editor's notes.**  
> **Export publishes the final version.**

---

## Next Steps

See roadmap document for detailed implementation plan.

This document must be treated as **authoritative context** by development agents (Cursor, Copilot, Continue, etc.).
