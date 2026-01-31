export type OverrideType = 'delete' | 'reorder' | 'edit';

export type DeleteOverride = {
  type: 'delete';
  signalId: string;
};

export type ReorderOverride = {
  type: 'reorder';
  fromIndex: number;
  toIndex: number;
};

export type EditOverride = {
  type: 'edit';
  signalId: string;
  field: string;
  value: string | number | boolean;
};

export type Override = DeleteOverride | ReorderOverride | EditOverride;

/**
 * Generic row interface for the editable table.
 * It must have a unique identifier to track overrides.
 */
export interface EditableRow {
  id: string; // Unique ID (e.g., "Device1_SignalName")
  [key: string]: unknown;
}
