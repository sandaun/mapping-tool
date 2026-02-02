export type IbmapsDevice = {
  index: number;
  name: string;
  slaveNum: number;
  manufacturer?: string;
  baseRegister?: number;
  timeout?: number;
  enabled?: boolean;
};

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
