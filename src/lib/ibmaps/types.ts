export type IbmapsDevice = {
  index: number;
  name: string;
  slaveNum: number;
  manufacturer?: string;
  baseRegister?: number;
  timeout?: number;
  enabled?: boolean;
};

// -----------------------------------------------------
// Modbus configuration (shared between BACnet and KNX)
// -----------------------------------------------------
export type ModbusConfig = {
  deviceIndex: number;
  slaveNum: number;
  description?: string;
  address: number;
  readFunc: number;
  writeFunc: number;
  regType?: number;
  dataType?: number;
  lenBits?: number;
  format?: number;
  byteOrder?: number;
  bit?: number;
  numOfBits?: number;
  deadband?: number;
  scanPeriod?: number;
  virtual: boolean;
  fixed?: boolean;
  enable?: boolean;
  extraAttrs: Record<string, string>;
};

// -----------------------------------------------------
// KNX → Modbus Master signal type
// -----------------------------------------------------
export type KNXRawSignal = {
  idxExternal: number;
  name: string;
  direction: 'KNX->Modbus';

  knx: {
    description: string;
    active: boolean;
    dptValue: number;
    dptString?: string;
    groupAddress: string;
    groupAddressValue: number;
    additionalAddresses?: string;
    flags: {
      u: boolean;
      t: boolean;
      ri: boolean;
      w: boolean;
      r: boolean;
    };
    priority: number;
    virtual: boolean;
    fixed?: boolean;
    extraAttrs: Record<string, string>;
  };

  modbus: ModbusConfig;

  isCommError?: boolean;
};

// -----------------------------------------------------
// BACnet → Modbus Master signal type (legacy name kept)
// -----------------------------------------------------
export type RawSignal = {
  /** Join key between Internal and External protocol objects */
  idxExternal: number;
  /** Human readable name (usually BACName) */
  name: string;
  /** Direction of the mapping (fixed for this PoC) */
  direction: 'BACnet->Modbus';

  /** BACnet Server side configuration (InternalProtocol) */
  bacnet: {
    bacName: string;
    type: number; // @Type (e.g., 0=AI, 1=AO, etc.)
    instance: number; // @Instance
    units?: number; // @Units (as integer ID, e.g. 62)

    // StatusFlags parsing might be needed, but sticking to text/structure preservation
    statusFlags?: string;

    // Mapping configuration (the <MAP> child node)
    map: {
      address: number; // @Address
      regType: number; // @RegType
      dataType: number; // @DataType
      readFunc: number; // @ReadFunc
      writeFunc: number; // @WriteFunc
      pollPriority?: number; // @PollPriority

      // Preservation of unknown attributes
      extraAttrs: Record<string, string>;
    };

    // Preservation of unknown attributes for BACnetObject
    extraAttrs: Record<string, string>;
  };

  /** Modbus Master side configuration (ExternalProtocol) */
  modbus: {
    deviceIndex: number; // @DeviceIndex
    slaveNum: number; // Derived from Device config for convenience
    description?: string; // @Description

    // Core Modbus definition (redundant with MAP but required by IBMAPS structure)
    address: number; // @Address
    readFunc: number; // @ReadFunc
    writeFunc: number; // @WriteFunc
    regType?: number; // @RegType (sometimes redundant or missing on Signal side depending on implicit rules)
    dataType?: number; // @DataType

    lenBits?: number; // @LenBits
    format?: number; // @Format
    byteOrder?: number; // @ByteOrder
    bit?: number; // @Bit
    numOfBits?: number; // @NumOfBits
    deadband?: number; // @Deadband

    scanPeriod?: number; // @ScanPeriod

    // Virtual configs
    virtual: boolean; // True if <Virtual Status="True">
    fixed?: boolean; // Virtual@Fixed
    enable?: boolean; // Virtual@Enable

    // Preservation of unknown attributes for Signal
    extraAttrs: Record<string, string>;
  };

  /** Heuristics or flags */
  isCommError?: boolean;
};

// -----------------------------------------------------
// Modbus Slave configuration (for MBS-KNX and MBS-BAC)
// -----------------------------------------------------
export type ModbusSlaveConfig = {
  description: string;
  /** Data Length in bits: 16, 32, etc. */
  dataLength: number;
  /** Format code: 0=Unsigned, 1=Signed, 2=Binary, 3=Float, 4=Bitfield, 5=String */
  format: number;
  /** Modbus register address (0-based) */
  address: number;
  /** Bit position for bitfield access, -1 if not used */
  bit: number;
  /** ReadWrite mode: 0=Read, 1=Write, 2=Read/Write */
  readWrite: number;
  /** String length, -1 if not a string type */
  stringLength: number;
  /** Whether this signal is enabled */
  isEnabled: boolean;
  /** Virtual signal configuration */
  virtual: boolean;
  fixed?: boolean;
  /** Extra attributes for preservation */
  extraAttrs: Record<string, string>;
};

// -----------------------------------------------------
// KNX configuration (shared for KNX external protocol)
// -----------------------------------------------------
export type KNXExternalConfig = {
  description: string;
  active: boolean;
  dptValue: number;
  dptString?: string;
  groupAddress: string;
  groupAddressValue: number;
  additionalAddresses?: string;
  flags: {
    u: boolean;
    t: boolean;
    ri: boolean;
    w: boolean;
    r: boolean;
  };
  priority: number;
  virtual: boolean;
  fixed?: boolean;
  extraAttrs: Record<string, string>;
};

// -----------------------------------------------------
// Modbus Slave → KNX signal type
// -----------------------------------------------------
export type MBSKNXRawSignal = {
  /** Join key between Internal and External protocol objects */
  idxExternal: number;
  /** Human readable name (usually Description) */
  name: string;
  /** Direction of the mapping */
  direction: 'Modbus Slave->KNX';

  /** Modbus Slave side configuration (InternalProtocol) */
  modbusSlave: ModbusSlaveConfig;

  /** KNX side configuration (ExternalProtocol) */
  knx: KNXExternalConfig;

  /** Heuristics or flags */
  isCommError?: boolean;
};

// -----------------------------------------------------
// KNX configuration (shared for BACnet-KNX mappings)
// -----------------------------------------------------
export type KNXConfig = {
  description: string;
  active: boolean;
  dptValue: number;
  dptString?: string;
  groupAddress: string;
  groupAddressValue: number;
  additionalAddresses?: string;
  flags: {
    u: boolean;
    t: boolean;
    ri: boolean;
    w: boolean;
    r: boolean;
  };
  priority: number;
  virtual: boolean;
  fixed?: boolean;
  extraAttrs: Record<string, string>;
};

// -----------------------------------------------------
// BACnet configuration (for BACnet Server side)
// -----------------------------------------------------
export type BACnetConfig = {
  bacName: string;
  description: string;
  type: number; // BACType (0=AI, 1=AO, 2=AV, 3=BI, 4=BO, 5=BV, 13=MI, 14=MO, 19=MV)
  instance: number;
  objectId: number;
  units?: number;
  cov?: number;
  relinquish?: number;
  numOfStates?: number;
  active: boolean;
  lut?: number;
  polarity?: boolean;
  virtual: boolean;
  fixed?: boolean;
  extraAttrs: Record<string, string>;
};

// -----------------------------------------------------
// BACnet Server ↔ KNX signal type
// -----------------------------------------------------
export type BACKNXRawSignal = {
  idxExternal: number;
  name: string;
  direction: 'BACnet->KNX';

  bacnet: BACnetConfig;
  knx: KNXConfig;

  isCommError?: boolean;
};

// -----------------------------------------------------
// BACnet Client configuration (for external protocol)
// -----------------------------------------------------
export type BACnetClientConfig = {
  /** Device index reference */
  deviceIndex: number;
  /** Device name (resolved from BACnetDevices) */
  deviceName: string;
  /** BACnet object type (0=AI, 1=AO, 2=AV, 3=BI, 4=BO, 5=BV, 13=MI, 14=MO, 19=MV) */
  bacType: number;
  /** BACnet instance number */
  bacInstance: number;
  /** Combined ObjectID */
  objectId: number;
  /** Whether this object is active */
  active: boolean;
  /** Virtual signal configuration */
  virtual: boolean;
  fixed?: boolean;
  /** Extra attributes for preservation */
  extraAttrs: Record<string, string>;
};

// -----------------------------------------------------
// BACnet Client Device (for BACnetDevices section)
// -----------------------------------------------------
export type BACnetClientDevice = {
  index: number;
  name: string;
  enabled: boolean;
  ip: string;
  port: number;
  objInstance: number;
};

// -----------------------------------------------------
// KNX ← BACnet Client signal type
// -----------------------------------------------------
export type KNXBACRawSignal = {
  idxExternal: number;
  name: string;
  direction: 'KNX->BACnet Client';

  /** KNX side configuration (InternalProtocol) */
  knx: KNXConfig;

  /** BACnet Client side configuration (ExternalProtocol) */
  bacnetClient: BACnetClientConfig;

  isCommError?: boolean;
};

// -----------------------------------------------------
// Modbus Slave ← BACnet Client signal type
// -----------------------------------------------------
export type MBSBACRawSignal = {
  idxExternal: number;
  name: string;
  direction: 'Modbus Slave->BACnet Client';

  /** Modbus Slave side configuration (InternalProtocol) */
  modbusSlave: ModbusSlaveConfig;

  /** BACnet Client side configuration (ExternalProtocol) */
  bacnetClient: BACnetClientConfig;

  isCommError?: boolean;
};
