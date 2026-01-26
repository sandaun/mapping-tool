# Excel Protocol Mapping Tool — Project Context v3.0

> **Last Updated:** January 2026  
> **Status:** Active Development - IBMAPS Integration Phase  
> **Previous:** v2.0 focused on Excel-only workflow

---

## Project Overview

A **Next.js-based tool** for building automation engineers that converts multi-protocol device signals (BACnet, Modbus, KNX) into **IBMAPS projects** (native MAPS software format) or Excel workbooks for gateway configuration.

The tool follows a **two-phase workflow:**
1. **BUILD mode:** Import sources, define devices, run pipeline
2. **FINALIZE mode:** Review, manually edit, and export

---

## Key Evolution: IBMAPS as Single Source of Truth

### What are IBMAPS files?

**IBMAPS** (`.ibmaps`) are the **native XML project format** used by Intesis MAPS gateway configuration software.

**Structure:**
```xml
<Project InternalProtocol="Modbus Slave" ExternalProtocol="BACnet Client">
  <Columns>...</Columns>          <!-- Table structure -->
  <IBOX>                          <!-- Gateway config -->
    <Conversions>...</Conversions> <!-- Default conversions -->
  </IBOX>
  <InternalProtocol>...</InternalProtocol>  <!-- Protocol settings -->
  <ExternalProtocol>...</ExternalProtocol>  <!-- Protocol settings -->
  <Signals>
    <Signal ID="0">...</Signal>   <!-- Each signal -->
  </Signals>
</Project>
```

**Why IBMAPS > Excel:**
- ✅ Contains **everything:** signals + config + protocol settings
- ✅ **Direct import** to MAPS (no manual steps)
- ✅ Single source of truth
- ✅ Richer metadata (conversions, device config, etc.)

### Dual Export Strategy

**Users can choose export format:**

1. **IBMAPS (recommended):**
   - Full project file (`.ibmaps`)
   - Import directly to MAPS software
   - Includes all configuration and signals

2. **Excel (legacy/backup):**
   - Signals-only table (`.xlsx`)
   - Manual import to MAPS "Signals" tab
   - Useful for incremental signal additions

**Template system:**
- IBMAPS files serve as **base templates** (6 gateway types)
- Excel templates remain for backwards compatibility

---

## Core Principles

### 1. Deterministic Code is the Source of Truth
- All signal generation is **deterministic and repeatable**
- AI is **only** an assisted reasoning layer (parsing, suggestions, validation)
- Manual edits are tracked as explicit **Overrides** (never mutate generated output)

### 2. Structure Preservation
- IBMAPS: Preserve XML structure, protocol config, conversions
- Excel: Preserve sheet names, column names, and column order
- Templates define exact structure expected by MAPS software

### 3. Two-Layer Data Model
- **RAW format:** Lossless representation (IBMAPS XML or Excel RAW JSON)
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
  ├─ Template (IBMAPS base - selected once, defines everything)
  ├─ Sources (0..n CSV/PDF/Excel inputs)
  │   └─ SignalSets (parsed signals per Source)
  ├─ Devices (N instances per SignalSet)
  ├─ GeneratedOutput (deterministic, immutable)
  ├─ Overrides (manual user edits)
  ├─ OutputTable (GeneratedOutput + Overrides)
  └─ ValidationReport (AI-detected warnings)
```

### Templates (IBMAPS Base)

**6 Gateway Types:**
1. BACnet Server ← Modbus Master
2. Modbus Slave ← BACnet Client
3. KNX ← Modbus Master
4. KNX ← BACnet Client
5. BACnet Server ← KNX
6. Modbus Slave ← KNX

**Template contents:**
- Protocol configuration (RTU/TCP, baudrate, etc.)
- Default conversions (x10, /10, temperature, etc.)
- Column structure and metadata
- Device network settings (IP, DNS, etc.)
- **NO signals** (added by generation)

**Template locations:**
- Primary: `public/templates/*.ibmaps` (base templates)
- Legacy: `public/templates/*.xlsx` (backwards compatibility)

---

## Two-Phase Workflow

### BUILD MODE

**User can:**
- Select Template (once per project) → loads IBMAPS base
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
   │     Call generateXXX(signalSet, ibmapsBase, policy)
   ├─ Apply allocation policy (addresses, instances)
   ├─ Apply naming strategy
   └─ Create GeneratedOutput (immutable IBMAPS structure)

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
🔄 Loading IBMAPS template...
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
- **Choose export format:**
  - [Export IBMAPS] - Full project (recommended)
  - [Export Excel] - Signals only (legacy)

**Overrides System:**

```typescript
type Override = 
  | { type: 'delete', signalId: string }
  | { type: 'reorder', fromIndex: number, toIndex: number }
  | { type: 'edit', signalId: string, changes: Record<string, any> }

// Apply overrides (pure function)
OutputTable = applyOverrides(GeneratedOutput, overrides)
```

**Key properties:**
- GeneratedOutput is **never mutated**
- Overrides are simple action records
- Enable undo/redo and reset
- No override reapplication across pipeline reruns (pipeline is locked)

---

## Export Formats

### IBMAPS Export (Recommended)

**What's included:**
- ✅ All signals (with overrides applied)
- ✅ Protocol configuration (RTU/TCP, baudrate, etc.)
- ✅ Default conversions
- ✅ Device network settings
- ✅ Gateway metadata

**Import to MAPS:**
- Single-click import
- Everything configured and ready
- No manual steps required

**File:** `ProjectName.ibmaps`

---

### Excel Export (Legacy/Backup)

**What's included:**
- ✅ Signals table only
- ✅ Same structure as current implementation
- ✅ Compatible with MAPS "Import Signals" feature

**Import to MAPS:**
- Manual import via "Signals" tab
- User must configure protocol settings manually
- Good for adding signals to existing projects

**File:** `ProjectName.xlsx`

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

### File Processing
- **SheetJS (xlsx)** - Excel import/export (legacy support)
- **xml2js** or **fast-xml-parser** - IBMAPS (XML) parsing/generation
- **PDF.js** or **pdf-parse** - PDF text extraction (for AI)

### Data Validation
- **Zod** - Schema validation for AI responses and signal types

### UI Components (to add)
- **TanStack Table v8** - Editable table with multi-select, sorting, filtering
- **@dnd-kit** - Modern drag & drop for row reordering and file uploads
- **shadcn/ui additions:**
  - AlertDialog (for edit warnings)
  - Toast (for undo notifications)
  - DropZone (for file uploads)

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

### ✅ Phase 1: Core Generation Logic (COMPLETE)

**Excel Processing:**
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
  - `common.ts` - Generic operations
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
- ✅ Display RAW data
- ✅ Export Excel

---

### 🚧 Phase 2: IBMAPS Integration (CURRENT - 2-3 days)

**Priority: Replace Excel templates with IBMAPS**

**Tasks:**
- [ ] Create IBMAPS base templates (6 gateway types, no signals)
- [ ] Parse IBMAPS XML structure
  - Read protocol config, conversions, metadata
  - Extract columns definition
- [ ] Inject generated signals into IBMAPS
  - Convert DeviceSignal → `<Signal>` XML nodes
  - Maintain proper IDs and indices
- [ ] Export IBMAPS files
  - Apply overrides before export
  - Validate XML structure
- [ ] Dual export UI
  - [Export IBMAPS] button (primary)
  - [Export Excel] button (secondary/legacy)
- [ ] Update actions to work with IBMAPS base
  - Minimal changes (same generation logic)
  - Different template loading

**Why now:**
- Changes template system fundamentally
- Better to migrate before adding complex UI
- Unlocks full MAPS automation (no manual config)

**Expected complexity:** LOW (2-3 days)
- XML parsing is straightforward
- Actions already generate correct data
- Template + inject pattern is simple

---

### 🚧 Phase 3: Editable Table with Overrides (1-2 weeks)

**Goal:** Review and manually edit signals before export

**Components to build:**
- [ ] EditableSignalsTable component (TanStack Table v8)
  - Display all generated signals
  - Multi-row selection (Ctrl/Cmd, Shift)
  - Column sorting and filtering
- [ ] Row actions
  - Delete selected (with confirmation)
  - Drag & drop reordering (@dnd-kit)
  - Edit mode (with warning dialog)
- [ ] Overrides system (`src/lib/overrides.ts`)
  - Track delete/reorder/edit actions
  - `applyOverrides()` pure function
  - Undo last action
  - Reset all changes
- [ ] UI controls
  - [Undo ↶] button
  - [Reset 🔄] button (with confirmation)
  - [Edit Mode 🔴] toggle
- [ ] Confidence indicators
  - 🟢 High confidence (>0.8)
  - 🟡 Medium confidence (0.6-0.8)
  - 🔴 Low confidence (<0.6)

**UX:**
```
[Generated Signals - 70 rows]  [3 selected]

┌─────────────────────────────────────────────────┐
│ # │ Name           │ Type │ Address │ Conf.    │
├─────────────────────────────────────────────────┤
│ 1 │ RoomTemp       │ AI   │ 0       │ 🟢 98%   │ ← Selected
│ 2 │ Setpoint       │ AV   │ 1       │ 🟢 95%   │
│ 3 │ Fan Speed      │ AV   │ 2       │ 🟡 65%   │ ← Selected
│ ... (drag to reorder)                           │
└─────────────────────────────────────────────────┘

[Delete Selected]  [Edit Mode 🔴]  [Undo ↶]  [Reset 🔄]
```

---

### 🚧 Phase 4: Multi-Source & Device Management (2-3 weeks)

**Goal:** Support multiple sources and device instances

**Components to build:**
- [ ] SourceManager component
  - Drag & drop area for files
  - Source list with parsed counts
  - Remove sources
- [ ] SourceUploader component
  - Upload CSV/Excel/PDF
  - Paste CSV text
  - Drag & drop support
- [ ] DeviceManager component
  - Device instances per source
  - Input number + stepper (+/-)
  - Expand to rename/remove devices
  - Total signals preview
- [ ] Multi-source generation logic
  - Merge signals from all sources
  - Maintain proper allocation across devices
- [ ] Project state management
  - Sources array
  - Devices config
  - LocalStorage persistence

**UI:**
```
[Sources] (2 added)

┌─────────────────────────────────────────┐
│ 📄 Termostat.csv                        │
│    ✅ 10 signals parsed                 │
│    Devices: [−] [1] [+] ↓ expand        │
│    [View] [Remove]                      │
├─────────────────────────────────────────┤
│ 📄 Medidor.csv                          │
│    ✅ 15 signals parsed                 │
│    Devices: [−] [4] [+] ↓ expand        │
│    [View] [Remove]                      │
└─────────────────────────────────────────┘

Total signals: 70 (10×1 + 15×4)

[Run Pipeline →]
```

---

### 🚧 Phase 5: AI Integration (1-2 weeks)

**Goal:** Automate PDF parsing and provide semantic assistance

**APIs to build:**
- [ ] `/api/parse-pdf` - Extract signals from PDFs
  - Vercel AI SDK with Groq/OpenAI
  - Return structured signals + confidence
  - Zod schema validation
- [ ] `/api/suggest-mappings` - Semantic suggestions
  - Input: signal names
  - Output: suggested units, DPT, types
- [ ] `/api/validate-signals` - Semantic validation
  - Input: GeneratedOutput
  - Output: ValidationReport with warnings

**AI Models:**
- **Groq:** `llama-3.3-70b-versatile` (free tier, default)
- **OpenAI:** `gpt-4o-mini` (paid, fallback)
- **Ollama:** Local models (optional, for testing)

**UI Integration:**
- [ ] AI parsing progress indicators
- [ ] Confidence indicators in tables
- [ ] ValidationReport display
- [ ] Low-confidence field review modal

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
  factor?: number;
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

Actions are **pure functions** that inject signals into IBMAPS or Excel:

```typescript
type GenerateSignalsResult = {
  updatedWorkbook: RawWorkbook | IBMAPSProject; // Supports both!
  rowsAdded: number;
  warnings: string[];
};

function generateXXX(
  deviceSignals: DeviceSignal[],
  template: RawWorkbook | IBMAPSProject,
  policy: GenerationPolicy = {}
): GenerateSignalsResult;
```

**Implemented actions (work with both formats):**
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
- No "cutres" (no basic checkboxes, no arrow buttons)

### Clear & Informative
- Confidence indicators (🟢🟡🔴) for AI-parsed data
- Warnings clearly visible but not blocking
- Undo/Reset options always available
- Export format choice clearly presented

### Progressive Disclosure
- Simple by default (collapsed device lists, minimal inputs)
- Expand/review when needed (low-confidence fields, device names)

### Trust the User
- Show warnings but don't block actions
- Allow manual edits with explicit warning
- User is responsible for final verification before export

---

## Engineering Principles

1. **Preserve structure at all costs**
   - IBMAPS: XML structure, protocol config, conversions
   - Excel: Columns, sheets, order
   - Never modify template structure

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
- All 6 actions covered (Excel format)
- Type guards tested
- Utility functions tested
- Fixture-based testing with real workbooks

### Integration Tests (to add)
- IBMAPS parsing and generation
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
      /parse-ibmaps       # IBMAPS XML parsing
      /export-ibmaps      # IBMAPS export
      /export             # Excel export (legacy)
      /import             # Excel/IBMAPS import
    page.tsx              # Main UI
    layout.tsx
  /components
    /ui                   # shadcn/ui components
    DeviceSignalsSection.tsx
    EditableTable.tsx     # TanStack Table (Phase 3)
    SourceManager.tsx     # Sources UI (Phase 4)
    DeviceManager.tsx     # Devices UI (Phase 4)
    ...
  /lib
    /actions              # Signal generation actions
      /__tests__          # Test files + fixtures
      /utils              # Shared utilities
      generateXXX.ts
    /excel
      raw.ts              # Excel RAW utilities
    /ibmaps               # NEW: IBMAPS utilities (Phase 2)
      parse.ts            # Parse IBMAPS XML
      generate.ts         # Generate IBMAPS from signals
      types.ts            # IBMAPS TypeScript types
    deviceSignals.ts      # Signal types & guards
    overrides.ts          # Override system (Phase 3)
  /constants
    bacnetUnits.ts
    knxDPTs.ts
    templates.ts          # Update to reference IBMAPS
    generation.ts
  /types
    actions.ts
    ibmaps.ts             # NEW: IBMAPS types (Phase 2)
  /hooks
    useFileImport.ts
    useTheme.ts
    useOverrides.ts       # Override management (Phase 3)
/public
  /templates
    *.ibmaps              # NEW: IBMAPS base templates (Phase 2)
    *.xlsx                # Excel templates (legacy)
/docs
  /context
    excel_mapping_tool.md       # Original
    excel_mapping_tool_v2.md    # BUILD/FINALIZE model
    excel_mapping_tool_v3.md    # This document (IBMAPS integration)
  /examples
    /ibmaps               # Example IBMAPS files
  /manuals                # Protocol documentation
```

---

## Implementation Roadmap

### Phase 0: Current State ✅
- Excel-based workflow
- Single source, single generation
- 6 actions tested and working

### Phase 2: IBMAPS Integration (2-3 days) ⚡ **CURRENT PRIORITY**
- IBMAPS parsing and generation
- Dual export (IBMAPS + Excel)
- Migration from Excel templates to IBMAPS templates

### Phase 3: Editable Table (1-2 weeks)
- TanStack Table + @dnd-kit
- Overrides system
- Undo/Reset functionality

### Phase 4: Multi-Source & Devices (2-3 weeks)
- Sources management UI
- Device instances (N per source)
- LocalStorage persistence

### Phase 5: AI Integration (1-2 weeks)
- PDF parsing
- Semantic suggestions
- Semantic validation

### Phase 6: Polish & Production
- Authentication
- Database persistence
- Advanced features

---

## Key Changes from v2

### What's New in v3
1. **IBMAPS as primary format** (was Excel-only)
2. **Dual export strategy** (IBMAPS + Excel)
3. **Richer templates** (protocol config, conversions, metadata)
4. **Direct MAPS import** (no manual configuration)
5. **Clearer roadmap** (IBMAPS first, then UI enhancements)

### What Stayed the Same
- Two-phase workflow (BUILD → FINALIZE)
- Deterministic generation
- AI responsibilities (parse, suggest, validate)
- Overrides system
- Testing strategy

---

## Mental Model

> **IBMAPS defines the complete language.**  
> **Device signals provide the vocabulary.**  
> **Policies define the grammar.**  
> **AI helps with translation, not writing.**

**Additional:**
> **GeneratedOutput is the author's draft.**  
> **Overrides are the editor's notes.**  
> **Export publishes the final version (IBMAPS or Excel).**

---

## Next Steps

1. **Immediate:** Obtain 6 IBMAPS base templates (no signals)
2. **Phase 2:** Implement IBMAPS parsing and generation
3. **Then:** Follow roadmap phases 3-6

See roadmap document for detailed implementation plan.

This document must be treated as **authoritative context** by development agents (Cursor, Copilot, Continue, etc.).
