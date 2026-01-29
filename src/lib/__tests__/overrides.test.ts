import { describe, it, expect } from 'vitest';
import { applyOverrides, applyOverridesToWorkbook, extractSignalsFromWorkbook } from '../overrides';
import type { Override, EditableRow } from '@/types/overrides';
import type { RawWorkbook } from '../excel/raw';

describe('overrides', () => {
  const mockRows: EditableRow[] = [
    { id: '1', Name: 'Signal A', Value: 10 },
    { id: '2', Name: 'Signal B', Value: 20 },
    { id: '3', Name: 'Signal C', Value: 30 },
  ];

  describe('applyOverrides', () => {
    it('should handle delete overrides', () => {
      const overrides: Override[] = [
        { type: 'delete', signalId: '2' },
      ];
      
      const result = applyOverrides(mockRows, overrides);
      
      expect(result).toHaveLength(2);
      expect(result.find(r => r.id === '2')).toBeUndefined();
      expect(result.find(r => r.id === '1')).toBeDefined();
    });

    it('should handle edit overrides', () => {
      const overrides: Override[] = [
        { type: 'edit', signalId: '1', field: 'Name', value: 'Edited A' },
        { type: 'edit', signalId: '3', field: 'Value', value: 99 },
      ];

      const result = applyOverrides(mockRows, overrides);

      expect(result).toHaveLength(3);
      expect(result.find(r => r.id === '1')?.Name).toBe('Edited A');
      expect(result.find(r => r.id === '3')?.Value).toBe(99);
      // Ensure immutability
      expect(mockRows[0].Name).toBe('Signal A');
    });

    it('should handle combined overrides (delete then edit)', () => {
      // Note: order matters in the array, but logic handles them sequentially
      // Editing a deleted row should do nothing effectively if delete processed first? 
      // Actually my implementation processes sequentially. 
      // If I delete ID 2, then try to edit ID 2, it won't be found.
      
      const overrides: Override[] = [
        { type: 'delete', signalId: '2' },
        { type: 'edit', signalId: '2', field: 'Name', value: 'Zombie' },
      ];

      const result = applyOverrides(mockRows, overrides);
      
      expect(result).toHaveLength(2);
      expect(result.find(r => r.id === '2')).toBeUndefined();
    });
  });

  describe('applyOverridesToWorkbook', () => {
    const mockWorkbook: RawWorkbook = {
      sheets: [
        {
          name: 'Signals',
          rows: [
            ['Name', 'Value', 'ID'], // Headers
            ['Sig A', 10, 'A'],
            ['Sig B', 20, 'B'],
          ],
        },
      ],
    };

    it('should update the workbook correctly', () => {
        // First, check extraction logic since ID generation depends on it
        // In the mock, we have columns Name, Value, ID. 
        // Our extractor tries to find "Name" or "Signal Name". 
        // ID generation: name_type_instance_index. 
        // Here type/instance missing. ID will be "Sig A___0" roughly.
        
        const extracted = extractSignalsFromWorkbook(mockWorkbook);
        const targetId = extracted[0].id; // Should be first data row

        const overrides: Override[] = [
            { type: 'edit', signalId: targetId, field: 'Value', value: 999 }
        ];

        const newWorkbook = applyOverridesToWorkbook(mockWorkbook, overrides);
        
        // Row 0 is header. Row 1 is data. 
        // Column 'Value' is index 1.
        expect(newWorkbook.sheets[0].rows[1][1]).toBe(999);
    });

    it('should delete rows from workbook', () => {
        const extracted = extractSignalsFromWorkbook(mockWorkbook);
        const targetId = extracted[1].id; // 'Sig B'

        const overrides: Override[] = [
            { type: 'delete', signalId: targetId }
        ];

        const newWorkbook = applyOverridesToWorkbook(mockWorkbook, overrides);

        expect(newWorkbook.sheets[0].rows).toHaveLength(2); // Header + 1 row
        expect(newWorkbook.sheets[0].rows[1][0]).toBe('Sig A'); // Sig B gone
    });
  });
});
