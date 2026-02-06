# Copilot Instructions — Excel Protocol Mapping Tool

## Project Overview

Next.js (App Router) tool for industrial protocol mapping that imports Excel/ibmaps workbooks, converts to RAW JSON for editing and automation, and exports back preserving exact tabular structure. Supports BACnet, Modbus, and KNX protocol conversions with AI-assisted signal parsing.

**Protocol Detection:** Reads metadata from Excel (`Signals!B4`=Internal, `Signals!B5`=External) but uses template selection for gateway behavior.

## Stack

- **Framework:** Next.js 16.1 (App Router) + React 19 + TypeScript 5
- **Excel:** SheetJS `xlsx` (tabular focus, lossless round-trip)
- **AI:** Vercel AI SDK + Cerebras/Groq/OpenAI providers
- **UI:** TanStack Table + Radix UI + Tailwind CSS
- **Testing:** Vitest + React Testing Library + jsdom
- **Validation:** Zod (partial, expanding)

## Architecture

### Data Flow
```
File upload → /api/import → workbookArrayBufferToRaw() → RawWorkbook
    ↓
User adds signals → generateBACnetFromModbus() → Updated RawWorkbook
    ↓
User exports → applyOverridesToWorkbook() → /api/export → XLSX Buffer
```

### RAW vs Canonical Models

**RAW (src/lib/excel/raw.ts)** - Lossless Excel representation:
```typescript
type RawWorkbook = { sheets: RawSheet[] };
type RawSheet = { name: string; headers: (string|null)[]; rows: CellValue[][] };
```
- Preserves sheet order, column order, empty cells, metadata rows
- Single source of truth for import/export

**Canonical (src/lib/overrides.ts)** - UI-friendly editing model:
```typescript
type EditableRow = { id: string; [key: string]: CellValue };
```
- Derived from RAW via `extractSignalsFromWorkbook()`
- Applied back via `applyOverridesToWorkbook()`
- Flow: RAW → EditableRow[] → Override[] → RAW

### Key Components

- **[page.tsx](src/app/page.tsx)** - Orchestrates hooks (useFileImport, useTemplateManager, useSignalsWorkflow)
- **[raw.ts](src/lib/excel/raw.ts)** - Core import/export + RawWorkbook type
- **[overrides.ts](src/lib/overrides.ts)** - RAW↔Canonical conversion + edit application
- **[deviceSignals.ts](src/lib/deviceSignals.ts)** - Signal types + CSV parsing + type guards
- **[actions/](src/lib/actions/)** - Protocol generation functions (pure)
- **[ibmaps/parser.ts](src/lib/ibmaps/parser.ts)** - XML parsing for .ibmaps format

## Code Style & Patterns

### TypeScript

**Use type guards, never `as` assertions:**
```typescript
// ✅ CORRECT (src/lib/deviceSignals.ts)
export function isModbusSignal(signal: DeviceSignal): signal is ModbusSignal {
  return 'registerType' in signal && 'address' in signal;
}
const modbusSignals = signals.filter(isModbusSignal); // Type-safe

// ❌ NEVER DO THIS
const modbusSignals = signals.filter(s => 'address' in s) as ModbusSignal[];
```

**Discriminated unions for protocols:**
```typescript
type DeviceSignal = ModbusSignal | BACnetSignal | KNXSignal;
```

**Custom error classes with domain data:**
```typescript
export class ExcelContractError extends Error {
  readonly missingSheets: string[];
  constructor(message: string, missingSheets: string[]) { ... }
}
```

### React

**Hook composition pattern** - hooks return state + actions (never JSX):
```typescript
// ✅ CORRECT (src/hooks/useSignalsWorkflow.ts)
export const useSignalsWorkflow = (template, raw, setRaw) => {
  return { csvInput, deviceSignals, parseAndAddSignals, generateWithSignals };
};
```

**State management:**
- Local `useState` for UI state
- Props drilling avoided via hook composition
- Deep cloning for immutability: `JSON.parse(JSON.stringify(rawWorkbook))`

### Actions (Automations)

**Pure function pattern** - always return result type (src/types/actions.ts):
```typescript
export function generateBACnetFromModbus(
  deviceSignals: DeviceSignal[],
  rawWorkbook: RawWorkbook,
  policy: AllocationPolicy = 'simple',
): GenerateSignalsResult {
  const warnings: string[] = [];
  const updatedWorkbook = JSON.parse(JSON.stringify(rawWorkbook)); // Deep clone
  const ctx = createSheetContext(signalsSheet); // Use helper
  
  // ... mutation logic
  
  return { updatedWorkbook, rowsAdded, warnings };
}
```

**Available actions:**
- [generateBACnetFromModbus.ts](src/lib/actions/generateBACnetFromModbus.ts)
- [generateModbusFromBACnet.ts](src/lib/actions/generateModbusFromBACnet.ts)
- [generateKNXFromModbus.ts](src/lib/actions/generateKNXFromModbus.ts)
- [generateKNXFromBACnet.ts](src/lib/actions/generateKNXFromBACnet.ts)
- [generateBACnetServerFromKNX.ts](src/lib/actions/generateBACnetServerFromKNX.ts)
- [generateModbusFromKNX.ts](src/lib/actions/generateModbusFromKNX.ts)

**Action utilities:**
- `createSheetContext()` - MUST use for all sheet operations (src/lib/actions/utils/common.ts)
- `findCol()`, `getRow()`, `createEmptyRow()` from context
- Constants from [generation.ts](src/constants/generation.ts) - NO magic strings

### Error Handling

**Return results with warnings, don't throw on bad data:**
```typescript
export type ParseResult = { signals: DeviceSignal[]; warnings: string[] };
```

**Type-safe error checking:**
```typescript
function isErrorResponse(data: unknown): data is { error: unknown } { ... }
```

## Data Model Rules

1. **Excel is the source of truth** - all changes applied to RAW
2. **Preserve structure:**
   - Use `findHeaderRowIndex()` to locate header row (don't assume row 0)
   - Never reorder sheets or columns
   - Maintain empty cells with `null`
3. **Protocol metadata** fixed at `Signals!B4` (internal) and `Signals!B5` (external)
4. **Round-trip preservation:**
   - Import: `workbookArrayBufferToRaw()` with `sheetStubs: true`
   - Export: `rawToXlsxBuffer()` preserves exact layout
5. **Override pattern** for edits:
   - Extract: `extractSignalsFromWorkbook()` → `EditableRow[]`
   - Edit: User modifies → `Override[]` (type: 'delete' | 'edit')
   - Apply: `applyOverridesToWorkbook()` → updated `RawWorkbook`

## Build and Test

### Development
```bash
pnpm dev      # Start dev server at http://localhost:3000
pnpm build    # Production build
pnpm start    # Production server
pnpm lint     # ESLint
```

### Testing
```bash
pnpm test        # Run tests in watch mode
pnpm test:ui     # Open Vitest UI
pnpm test:run    # Run tests once (CI mode)
```

**Test patterns:**
- Unit tests for pure functions (overrides, parsers, actions)
- Mock data approach (no fixture files)
- **Always test immutability explicitly**
- Current coverage: [src/lib/__tests__/overrides.test.ts](src/lib/__tests__/overrides.test.ts)

## Project Conventions

### File Organization

**lib/ structure:**
- `lib/excel/` - Excel processing (raw.ts)
- `lib/ibmaps/` - IBMAPS XML processing (parser.ts, adapter.ts)
- `lib/actions/` - Signal generation (generate*.ts)
- `lib/actions/utils/` - Reusable utilities (allocation.ts, mapping.ts, common.ts)

**types/ structure:**
- `types/page.types.ts` - Page-level types (Template, ProtocolsMetadata)
- `types/actions.ts` - Action return types (GenerateSignalsResult)
- `types/overrides.ts` - Override system (Override, EditableRow)

**Naming conventions:**
- Actions: `generate{Protocol}From{Protocol}.ts`
- Utils: `{domain}.ts` (modbus.ts, bacnet.ts, knx.ts)
- Types: `{feature}.types.ts`

### Protocol Constants

**Always use constants, never hard-code values:**
- [bacnetUnits.ts](src/constants/bacnetUnits.ts) - BACnet unit mappings
- [knxDPTs.ts](src/constants/knxDPTs.ts) - KNX Data Point Types
- [generation.ts](src/constants/generation.ts) - Column names, default values, sheet names

### Validation

- Sheet validation: Throws `ExcelContractError` if expected sheets missing
- Signal validation: Returns warnings array, logs invalid rows but doesn't block
- API routes: Type guards for request/response (Zod schemas expanding)

## AI Usage

AI parses unstructured input (PDFs, text) via [useAIParser.ts](src/hooks/useAIParser.ts) hook. State machine:
```typescript
'idle' → 'uploading' → 'parsing' → 'review' → accept/reject → 'idle'
```

Final changes MUST be:
- Deterministic (same input = same output)
- Validated (type-safe, warnings surfaced)
- User-reviewable (diff preview before apply)

## Git Commit Conventions

- **Format:** `type: description` (max 72 chars, single line)
- **Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`
- **Mood:** Imperative ("Add feature" not "Added feature")
- **Examples:**
  - `feat: add BACnet instance allocation`
  - `fix: correct Modbus address mapping`
  - `refactor: extract common sheet utilities`
