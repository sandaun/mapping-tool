

IN700-485 Series
## INTESIS PROTOCOL TRANSLATOR WITH SERIAL AND IP SUPPORT
## USER MANUAL
## Version 1.4.6
Publication date 2024-05-16
## ENGLISH

## Copyright © 2022 Intesis
## Disclaimer
The information in this document is for informational purposes only. Please inform HMS Networks of any
inaccuracies or omissions found in this document. HMS Networks disclaims any responsibility or liability for any
errors that may appear in this document.
HMS Networks reserves the right to modify its products in line with its policy of continuous product
development. The information in this document shall therefore not be construed as a commitment on the
part of HMS Networks and is subject to change without notice. HMS Networks makes no commitment to update
or keep current the information in this document.
The data, examples and illustrations found in this document are included for illustrative purposes and are only
intended to help improve understanding of the functionality and handling of the product. In view of the wide
range of possible applications of the product, and because of the many variables and requirements associated
with any particular implementation, HMS Networks cannot assume responsibility or liability for actual use
based on the data, examples or illustrations included in this document nor for any damages incurred during
installation of the product. Those responsible for the use of the product must acquire sufficient knowledge in
order to ensure that the product is used correctly in their specific application and that the application meets all
performance and safety requirements including any applicable laws, regulations, codes and standards. Further,
HMS Networks will under no circumstances assume liability or responsibility for any problems that may arise as
a result from the use of undocumented features or functional side effects found outside the documented scope
of the product. The effects caused by any direct or indirect use of such aspects of the product are undefined and
may include e.g. compatibility issues and stability issues.

Table of Contents
- Description and Order Codes ..................................................................................................... 1
- General Information ................................................................................................................ 2
2.1. Intended Use of the User Manual ........................................................................................ 2
2.2. General Safety Information  ................................................................................................ 2
2.3. Admonition Messages and Symbols ..................................................................................... 2
- General Introduction ................................................................................................................ 4
- Modbus Master to BACnet Server .............................................................................................. 5
4.1. Specific Gateway Introduction ............................................................................................. 5
4.2. Functionality  ................................................................................................................... 5
- BACnet Client to Modbus Server ................................................................................................ 6
5.1. Specific Gateway Introduction ............................................................................................. 6
5.2. Functionality  ................................................................................................................... 6
- BACnet Client to ASCII .............................................................................................................. 7
6.1. Specific Gateway Introduction ............................................................................................. 7
6.2. Functionality  ................................................................................................................... 7
- Gateway Capacity .................................................................................................................... 8
- BACnet Interface ..................................................................................................................... 9
8.1. General Description  .......................................................................................................... 9
8.2. BACnet Client ................................................................................................................. 10
8.2.1. Description ............................................................................................................. 10
8.2.2. Points Definition ...................................................................................................... 11
8.3. BACnet Server ................................................................................................................. 12
8.3.1. Description ............................................................................................................. 12
8.3.2. BACnet/IP ............................................................................................................... 13
8.3.3. BACnet MS/TP ......................................................................................................... 13
- Modbus Interface ................................................................................................................... 14
9.1. General Description  ......................................................................................................... 14
9.2. Modbus Server Interface ................................................................................................... 14
9.2.1. Description ............................................................................................................. 14
9.2.2. Functions Supported ................................................................................................ 14
9.2.3. Modbus RTU ........................................................................................................... 15
9.2.4. Modbus TCP ........................................................................................................... 15
9.2.5. Modbus Server Interface Points Definition .................................................................... 16
9.3. Modbus Client Interface ................................................................................................... 16
9.3.1. Description ............................................................................................................. 16
9.3.2. Points Definition ...................................................................................................... 17
- ASCII Interface ..................................................................................................................... 18
10.1. Description ................................................................................................................... 18
10.2. ASCII Serial ................................................................................................................... 18
10.3. ASCII TCP ...................................................................................................................... 18
10.4. Address Map ................................................................................................................ 18
10.5. Points Definition ............................................................................................................ 19
10.6. Messages ..................................................................................................................... 20
IN700-485 Series
USER MANUAL Version 1.4.6

- Mounting ............................................................................................................................ 21
- Connections ......................................................................................................................... 22
12.1. Power Supply ................................................................................................................ 22
12.2. Connection Diagrams for each Application .......................................................................... 24
12.3. Connection to Modbus ................................................................................................... 27
12.4. Connection to BACnet .................................................................................................... 28
12.5. Connection to ASCII ........................................................................................................ 29
12.6. Console and USB Connections .......................................................................................... 30
- LED Indicators ...................................................................................................................... 31
- Buttons ............................................................................................................................... 32
14.1. Factory Reset ................................................................................................................ 35
- Set-up Process with the Configuration Tool ............................................................................... 36
15.1. Prerequisites ................................................................................................................. 36
15.2. Intesis MAPS: Configuration and Monitoring Tool ................................................................. 36
15.2.1. Introduction .......................................................................................................... 36
15.2.2. Template Selection  ................................................................................................. 37
15.2.3. Connection Tab    ...................................................................................................... 38
15.2.4. Configuration Tab    ................................................................................................... 39
15.2.5. Signals Tab ............................................................................................................ 40
15.2.6. Receive/Send Tab ................................................................................................... 40
15.2.7. Diagnostic Tab     ....................................................................................................... 42
- Technical Specifications ......................................................................................................... 44
- Dimensions .......................................................................................................................... 45
IN700-485 Series
USER MANUAL Version 1.4.6

- Description and Order Codes
## ORDER CODELEGACY ORDER CODE
## IN7004851000000INMBSBAC1000000INBACMBM1000000-
## IN7004852500000INMBSBAC2500000INBACMBM2500000-
## IN7004856000000INMBSBAC6000000INBACMBM6000000INASCBAC6000000
## IN7004851K20000INMBSBAC1K20000INBACMBM1K20000-
## IN7004853K00000INMBSBAC3K00000INBACMBM3K00000INASCBAC3K00000
## PRODUCT NAMEORDER CODEDESCRIPTIONINTESIS MAPS TEMPLATEAPPLICATION
## IN700-485IN700485⁎⁎⁎0000
## 1
## Intesis Protocol Translator
with Serial and IP Support
IN-BAC-MBMModbus master to BACnet server
IN-MBS-BACBACnet client to Modbus server
IN-ASCII-BACBACnet client to ASCII
## 1
⁎⁎⁎ defines the Intesis gateway capacity.
Description and Order CodesIN700-485 Series
USER MANUAL Version 1.4.6Page 1 of 45

## 2. General Information
2.1. Intended Use of the User Manual
This manual contains the main features of this Intesis gateway and the instructions for its appropriate
installation, configuration, and operation.
The contents of this manual should be brought to the attention of any person who installs, configures, or
operates this gateway or any associated equipment.
Keep this manual for future reference during the installation, configuration, and operation.
## 2.2. General Safety Information
## IMPORTANT
Follow these instructions carefully. Improper work may seriously harm your health and damage the
gateway and/or any other equipment connected to it.
Only technical personnel, following these instructions and the country legislation for installing electrical
equipment, can install and manipulate this gateway.
Install this gateway indoors, in a restricted access location, avoiding exposure to direct solar radiation, water, high
relative humidity, or dust.
All wires (for communication and power supply, if needed) must only be connected to networks with indoor
wiring. All communication ports are considered for indoor use and must only be connected to SELV circuits.
Disconnect all systems from power before manipulating and connecting them to the gateway.
Use a circuit breaker before the power supply. Rating: 250 V, 6 A.
Supply always a correct voltage to power the gateway. See Technical Specifications (page 44).
Respect the expected polarity of power and communication cables when connecting them to the gateway.
## CAUTION
Only an authorized installer is allowed to replace the battery. There's a risk of explosion if the battery
is replaced by an incorrect type. Dispose of used batteries according to local legislation.
Safety instructions in other languages can be found at https://intesis.com/docs/manuals/v6-safety
2.3. Admonition Messages and Symbols
## DANGER
Instructions that must be followed to avoid an imminently hazardous situation that, if not avoided,
will result in death or severe injury.
## WARNING
Instructions that must be followed to avoid a potentially hazardous situation that, if not avoided,
could result in death or severe injury.
IN700-485 SeriesGeneral Information
Page 2 of 45USER MANUAL Version 1.4.6

## CAUTION
Instruction that must be followed to avoid a potentially hazardous situation that, if not avoided,
could result in minor or moderate injury.
## IMPORTANT
Instruction that must be followed to avoid a risk of reduced functionality and/or damage to the
equipment or to avoid a network security risk.
## NOTE
Additional information which may facilitate installation and/or operation.
## TIP
Helpful advice and suggestions.
## NOTICE
## Remarkable Information.
Admonition Messages and SymbolsIN700-485 Series
USER MANUAL Version 1.4.6Page 3 of 45

## 3. General Introduction
This Intesis® gateway allows you to integrate Serial and IP protocols easily.
This document describes the available applications for this gateway:
- Modbus® TCP & RTU Client to BACnet®/IP & MS/TP Server.
- BACnet/IP & MS/TP Client to Modbus TCP & RTU Server.
- BACnet/IP & MS/TP Client to ASCII IP & Serial.
## IMPORTANT
This document assumes that the user is familiar with BACnet, Modbus, and ASCII technologies and
their technical terms.
## NOTE
Some sections provide general information common to all applications, while others highlight
specific differences, capacities, or limitations.
In general terms, you must have a BACnet, Modbus, or ASCII control and monitoring system on one side and a
Modbus or BACnet installation or device on the other side (only one at a time).
## IMPORTANT
The Intesis gateway can act as a server or client for BACnet and Modbus but only as a server for
## ASCII.
As always, the configuration process is fast and easy:
-  Launch the configuration tool.
-  Select the template.
-  Connect the Intesis gateway to the PC.
-  Adjust the configuration and signals to your project.
-  Send the configuration to the gateway.
And you are ready to go!
IN700-485 SeriesGeneral Introduction
Page 4 of 45USER MANUAL Version 1.4.6

- Modbus Master to BACnet Server
## 4.1. Specific Gateway Introduction
This section describes the integration of Modbus RTU and/or Modbus TCP devices into BACnet/IP or MS/TP
installations using the Modbus master to BACnet server application.
This integration allows a BACnet control system to access the signals and resources of Modbus devices as if they
were part of the BACnet system itself and vice versa.
The gateway configuration is carried out through the configuration tool.
## 4.2. Functionality
From the Modbus point of view, the gateway continuously polls the installation or devices, storing in its memory
the values of the points that you previously configured to be read. On the other hand, from the BACnet point of
view, the control and monitoring system reads and writes those stored points.
This is possible because, inside the gateway, all Modbus registers of the server devices are associated with
BACnet objects. This makes the BACnet control and monitoring system perceive the Modbus installation (all the
server devices) as if it were a single BACnet device.
When the gateway polls the Modbus devices, if a non-response is detected, the corresponding virtual signal
inside the gateway will be activated, indicating the communication error to the BACnet system.
The gateway has two EIA-485 ports for Modbus RTU integration: Port A and Port B. This function allows you to
integrate up to 64 devices (32 in each port) with no additional repeaters in the network.
This functionality is disabled when BACnet MS/TP is selected in Intesis MAPS, leaving only Port A available for
Modbus RTU connectivity and Port B for BACnet MS/TP devices.
By default, Port A is configured for Modbus RTU and Port B for BACnet MS/TP.
Modbus Master to BACnet ServerIN700-485 Series
USER MANUAL Version 1.4.6Page 5 of 45

- BACnet Client to Modbus Server
## 5.1. Specific Gateway Introduction
This section describes the integration of BACnet MS/TP and BACnet/IP devices into Modbus RTU or TCP
installations using the BACnet client to Modbus server application of the Intesis gateway.
This integration allows a Modbus control system to access the signals and resources of BACnet devices as if they
were part of the Modbus system itself and vice versa.
The gateway configuration is carried out through the configuration tool.
## 5.2. Functionality
From the BACnet point of view, the gateway continuously polls the installation or devices, storing in its memory
the values of the points that you previously configured to be read. With the change of value (COV) system, the
gateway can also subscribe to configured BACnet points, automatically receiving their values when they change.
On the other hand, from the Modbus point of view, the control and monitoring system reads and writes those
stored points.
This is possible because, inside the gateway, all BACnet objects of the server devices are associated with Modbus
registers. This makes the Modbus control and monitoring system perceive the BACnet installation (all the server
devices) as if it were a single Modbus device.
When the gateway polls the BACnet devices, if a non-response is detected, the corresponding virtual signal inside
the gateway will be activated, indicating the communication error to the Modbus system as error registers.
IN700-485 SeriesBACnet Client to Modbus Server
Page 6 of 45USER MANUAL Version 1.4.6

- BACnet Client to ASCII
## 6.1. Specific Gateway Introduction
This section describes the integration of BACnet/IP and MS/TP devices into ASCII IP or Serial installations using
the BACnet client to ASCII application.
This integration allows any ASCII system to access the signals and resources of BACnet devices as if they were
part of the system itself and vice versa.
The gateway configuration is carried out through the configuration tool.
## 6.2. Functionality
From the BACnet point of view, the gateway continuously polls the installation or devices, storing in its memory
the values of the points that you previously configured to be read. On the other hand, from the ASCII point of
view, the control and monitoring system reads and writes those stored points.
This is possible because, inside the gateway, all BACnet objects of the server devices are associated with ASCII
objects. This makes the ASCII control and monitoring system perceive the BACnet installation (all the server
devices) as if it were a single ASCII device.
When the gateway polls the BACnet devices, if a non-response is detected, the corresponding virtual signal inside
the gateway will be activated, indicating the communication error to the ASCII system.
BACnet Client to ASCIIIN700-485 Series
USER MANUAL Version 1.4.6Page 7 of 45

## 7. Gateway Capacity
Table 1. For Modbus master to BACnet server
Supported elements
## IN700485100
## 0000
## IN700485250
## 0000
## IN700485600
## 0000
## IN7004851K2
## 0000
## IN7004853K0
## 0000
100 version250 version600 version1200 version3000 version
Type of BACnet devicesThose supporting communication with BACnet/IP and MS/TP
Maximum number of BACnet objects10025060012003000
Maximum number of BACnet Subscriptions (COV)
requests
## 200500120024006000
Type of Modbus server devicesThose supporting communication over Modbus TCP/IP and RTU (EIA-485)
Number of Modbus server nodes and devices
supported
TCP: Up to 5 Modbus TCP nodes and up to 254 devices per TCP node
RTU: Up to 254 Modbus RTU devices
Table 2. For BACnet client to Modbus server
Supported elements
## IN700485100
## 0000
## IN700485250
## 0000
## IN700485600
## 0000
## IN7004851K2
## 0000
## IN7004853K0
## 0000
100 version250 version600 version1200 version3000 version
Type of BACnet devicesThose supporting communication with BACnet/IP and MS/TP
Maximum number of BACnet devices256
Maximum number of Modbus Registers10025060012003000
Modbus link layersThose supporting communication over Modbus TCP/IP and RTU (EIA-485)
Number of Modbus client nodes and devices supported
TCP: Up to 5 TCP nodes
RTU: One client device per RTU node
Table 3. For BACnet client to ASCII
Supported elements
## IN700485100
## 0000
## IN700485250
## 0000
## IN700485600
## 0000
## IN7004851K2
## 0000
## IN7004853K0
## 0000
100 version250 version600 version1200 version3000 version
Type of BACnet devicesThose supporting communication with BACnet/IP and MS/TP
Maximum number of BACnet devices256
Maximum number of ASCII Registers10025060012003000
ASCII link layers
Those supporting communication with ASCII client with simple messages through a
TCP/IP or serial (EIA-232/EIA-485) connection
IN700-485 SeriesGateway Capacity
Page 8 of 45USER MANUAL Version 1.4.6

- BACnet Interface
## 8.1. General Description
BACnet is a solid standard with many detailed concepts, but for this manual purposes, we will focus on the two
most fundamental concepts:
- BACnet client, which is the device that sends service requests to the server.
- BACnet server, which is the device that performs the requested service and reports the result back to the
client.
BACnet server devices are represented in the form of devices holding objects. Usually, every physical device
corresponds to a logical one. The objects can be of different types depending on the data and functionality they
represent: Analog input, Analog output, Digital input, etc.
## NOTE
- Output objects are meant to be written from the BACnet network to the device.
- Input objects are meant to offer status information on the BACnet device.
- Value objects are bidirectional.
Every object has different properties. The most meaningful one is the Present_Value property, which indicates
the real value of the object. Also, the gateway uses this property to read and write values. Every object of the
same type in a device is identified with its associated object instance.
BACnet InterfaceIN700-485 Series
USER MANUAL Version 1.4.6Page 9 of 45

8.2. BACnet Client
## 8.2.1. Description
The gateway implements a single BACnet object of its own: its BACnet Device Object, which contains its BACnet
Device Identifier and basic properties of the gateway as a BACnet device (name, firmware version, etc.).
## NOTICE
When acting as a client device, the Intesis gateway is classified under the device profile of a BACnet
Application Specific Controller (B-ASC). For further details, check out the product website for the
BACnet client PIC statements.
The gateway emulates a client device in the BACnet system.
These are the possible BACnet objects supported by the Intesis gateway:
Object TypePropertyDescription
Analog InputPresent ValueAnalog signal, for example, Ambient temperature
Analog OutputPresent ValueAnalog signal
Analog ValuePresent Value
Analog signal, for example, Temperature set point
value
Binary InputPresent ValueDigital signal, for example, ON/OFF status
Binary OutputPresent ValueDigital signal, for example, ON/OFF command
Binary ValuePresent Value
Digital signal, for example, ON/OFF status/
command
## Multistate
## Input
## Present Value
Multistate signal, for example, Working mode
status
## Multistate
## Output
Present ValueMultistate signal
## Multistate
## Value
## Present Value
Multistate signal, for example, Working mode
command
AccumulatorPresent Value
LoopPresent Value
Every signal is identified with its associated Device + Object Type + Object Instance.
## IMPORTANT
Though BACnet/IP and BACnet MS/TP physical layers are supported, only one physical layer can be
used at a time, i.e., if communicating to BACnet using BACnet/IP, BACnet MS/TP cannot be used, and
vice versa.
## NOTE
Using the configuration tool, it’s possible to scan the BACnet network for available devices and
their objects, which can later be directly added to your configuration. This feature facilitates the
configuration process, avoiding entering them manually.
IN700-485 SeriesBACnet Client
Page 10 of 45USER MANUAL Version 1.4.6

## 8.2.2. Points Definition
Every point defined in the Intesis gateway has the following BACnet features associated with it:
FeatureDescription
BACnet Device
BACnet device to which the point belongs (a list of 256
BACnet devices can be defined in the Intesis gateway).
For every BACnet device defined, a virtual signal is
created automatically in the gateway to report the
communication status with the BACnet device. Like the
rest of the points, this signal is also available from the
other protocol's interface.
BACnet object type
- AI: Analog Input
- AO: Analog Output
- AV: Analog Value
- DI: Digital Input
- DO: Digital Output
- DV: Digital Value
- MI: Multistate Input
- MO: Multistate Output
- MV: Multistate Value
- LOOP: Loop
- ACUM: Accumulator
## IMPORTANT
Please read the documentation of
the BACnet devices you're willing to
integrate to know their object types.
BACnet object instance
BACnet object instance for the point on the external
BACnet device.
## IMPORTANT
Please read the documentation of
the BACnet devices you're willing to
integrate to know their object types.
BACnet ClientIN700-485 Series
USER MANUAL Version 1.4.6Page 11 of 45

8.3. BACnet Server
## 8.3.1. Description
## NOTICE
When the Intesis gateway acts as a server device, it is classified under the device profile of a BACnet
Advanced Application Controller (B-AAC). For further details, check out the product website for the
BACnet client PIC statements.
Using the Intesis MAPS configuration tool, you can configure the object type associated with the signal on the
other protocol.
To facilitate the translation towards BACnet, the following object type options are available:
Object TypeID
Analog-Input0
Analog-Output1
Analog-Value2
Binary-Input3
Binary-Output4
Binary-Value5
## Calendar6
## Device8
Multistate-Input13
Multistate-Output14
Multistate-Value19
Notification-Class15
## Schedule17
Trend-Log20
Trend-Log-Multiple27
Every signal of the Intesis gateway can have several objects. These objects and their properties can be configured
with the configuration tool.
Depending on the field device protocol, you can define the signals using one of the following options:
•Configuring them manually for each or multiple signals at the time.
•Importing a file with the signals of the field devices.
- Scanning the network of the devices if this is supported.
Example 1. Signals compatibility
You can choose an object from the BACnet server column that is compatible with this signal. For example, a
writable register in the Modbus device can be an output object type on the BACnet server side; a readable and
writable register can be a value object type, etc.
## NOTICE
The configuration tool provides default templates that make this signals assignment process easier.
Also, you only have to click the Check table button on the bottom right corner of the window to
know if everything is correct or if there's some mistake. The project is also automatically checked
before you transfer it to the gateway.
IN700-485 SeriesBACnet Server
Page 12 of 45USER MANUAL Version 1.4.6

All objects definition, BIBBs, and details about the implementation can be found on the BACnet server PICS on
the product website.
8.3.2. BACnet/IP
The UDP communication port is the main setup parameter for BACnet/IP, besides basic IP settings (IP, netmask,
default gateway). The Intesis gateway uses the 47808 (0xBAC0) port by default, which you can change through
the configuration tool.
When using BACnet/IP, the gateway can also act as a foreign device to communicate with devices in another
network domain. Alternatively, you can set it as a BBMD (Bacnet/IP Broadcast Management Device). This
functionality facilitates the communication of devices placed in other networks with the devices in the gateway
network.
## IMPORTANT
BACnet/IP and BACnet MS/TP communication can not be used simultaneously.
8.3.3. BACnet MS/TP
When you choose BACnet MS/TP (serial communication), you have to use the Intesis MAPS configuration tool to
associate the gateway with a MAC address within the MS/TP network segment.
Baud rates supported for MS/TP line are: 9600, 19200, 38400, 76800, 115200, or Autobauding (autodetect).
Standard wiring guidelines for EIA-485 apply to the BACnet MS/TP line.
## IMPORTANT
BACnet MS/TP and BACnet/IP communication cannot be used simultaneously.
BACnet ServerIN700-485 Series
USER MANUAL Version 1.4.6Page 13 of 45

## 9. Modbus Interface
## 9.1. General Description
The Modbus protocol is an application-layer messaging protocol developed by Modicon in 1979. It is used to
establish master-slave/client-server communication between intelligent devices over different types of buses or
networks. The Intesis gateway supports Modbus TCP and RTU.
Modbus is a request/reply protocol and offers services specified by function codes. Modbus function codes are
elements of Modbus request/reply PDUs (Protocol Data Unit).
## 9.2. Modbus Server Interface
## 9.2.1. Description
The gateway acts as a server device in its Modbus interface, which can be:
- The Ethernet port for Modbus TCP.
- The EIA-485/EIA-232 ports for Modbus RTU.
## NOTICE
Modbus RTU and TCP modes can be active in the gateway one at a time or both simultaneously.
To access the gateway's points and resources from a Modbus client device, you must specify as Modbus register
addresses those configured inside the gateway corresponding to the signals on the field device protocol.
## 9.2.2. Functions Supported
## NOTICE
This part is common for both Modbus TCP and Modbus RTU.
Table 4. Modbus functions
#FunctionRead/Write
01Read CoilsR
02Read Discrete InputsR
03Read Holding RegistersR
04Read Input RegistersR
05Write Single CoilW
06Write Single RegisterW
15Write Multiple CoilsW
16Write Multiple RegistersW
If poll records are used to read or write more than one register, the range of addresses requested must contain
valid addresses; if not, the Intesis gateway will return the corresponding Modbus error code.
All registers are of 2 bytes, even if they are associated with signals of bit type on the other protocol's side. Its
content is expressed in MSB .. LSB.
## 1
Modbus error codes are fully supported. They are sent whenever a non-valid Modbus action or address is
required.
## 1
MSB: most significant bit; LSB: less significant bit
IN700-485 SeriesModbus Interface
Page 14 of 45USER MANUAL Version 1.4.6

9.2.3. Modbus RTU
Using the configuration tool, you can set these parameters:
- Baud rate: 1200, 2400, 4800, 9600, 19200, 38400, 56700 and 115200 bps.
- Data Bits: 8 bits.
- Parity: none, even, or odd.
- Stop Bits: 1 and 2 bits.
- Modbus server address.
- Physical connection (EIA-232 or EIA-485).
## IMPORTANT
- EIA-232 connector uses RX, TX, and GND lines.
- EIA-485 connector uses B-, A+, and SNGD.
9.2.4. Modbus TCP
Modbus TCP communication is characterized basically by the embedding of the Modbus RTU protocol into
TCP/IP frames, which allows faster communication and a longer distance between client and server devices in
comparison with RTU communication over a serial line. Another benefit is using common TCP/IP infrastructure in
buildings and transmitting over WAN or the internet. It also allows the coexistence of one or more clients and, of
course, one or more server devices in a given network, all interconnected through a TCP/IP-based network.
Use the configuration tool to configure the IP settings of the gateway (DHCP status, own IP, netmask, and default
gateway) and the TCP port.
## NOTE
The default port is 502.
Modbus Server InterfaceIN700-485 Series
USER MANUAL Version 1.4.6Page 15 of 45

## 9.2.5. Modbus Server Interface Points Definition
The Modbus registers are fully configurable through the configuration tool; any point in the gateway can be
freely configured with the desired Modbus register address.
Every point defined in the gateway has the following Modbus features associated with it:
FeatureDescription
#Bits
- 1 bit
- 16 bits
- 32 bits
## Data Coding
## Format
- 16/32 unsigned
- 16/32 bits signed (one's complement – C1)
- 16/32 bits signed (two's complement – C2)
- 16/32 bits Float
- 16/32 bits Bitfields
- Error comm.
## Byte Order
## • Big Endian
•Little Endian
## • Word Inverted Big Endian
## • Word Inverted Little Endian
Register AddressThe Modbus register address inside the server device for the point.
Bit inside the
register
Bit inside the Modbus register (optional). The Intesis gateway allows bit decoding from generic
16 bits input/holding Modbus registers.
Some devices use the bit coding into 16 bits input/holding Modbus registers to encode digital
values. These registers are generally accessible using Modbus function codes 03 and 04 (read
holding/input registers).
Read/Write
## 0: Read
## 1: Write
## 2: Trigger
## 9.3. Modbus Client Interface
## 9.3.1. Description
The Intesis gateway acts as a client device in the Modbus TCP network, Modbus RTU client, or both.
## IMPORTANT
Other Modbus devices connected to the network communicating with the gateway must always be
server devices.
The gateway supports communication with up to five Modbus TCP server devices.
For every defined point belonging to a particular Modbus TCP server device, a server address from 0 to 255
can also be freely configured. This feature offers great flexibility for installations. For example, when integrating
several Modbus RTU server devices connected in a serial line, with an RTU/TCP converter on top of this
serial line, it enables access to the RTU server points through TCP/IP. In this case, the RTU/TCP converter
communicating in TCP identifies the destination of the point (server address in the RTU network) by the contents
of the server address field.
Modbus TCP server devices are characterized by their IP address and predefined registers address map. This
address map specifies the address, type, and characteristics of the Modbus server device's internal points
(commonly called registers). These registers are accessible using the Modbus TCP protocol.
Communication parameters of the Intesis gateway (IP address, netmask, default router address, and TCP port)
are fully configurable to adapt to any IP network and server device.
IN700-485 SeriesModbus Client Interface
Page 16 of 45USER MANUAL Version 1.4.6

The Modbus TCP protocol defines different function code types to read/write different register types from the
Modbus devices. It also defines different data formats to encode values.
Also, the data encoding used for 16 bits registers (big-endian or little-endian) can be configured in the Intesis
gateway. This is the byte order for data encoding (MSB..LSB or LSB..MSB)
## 2
. Although specified as big-endian in
the Modbus protocol specification, this data encoding varies depending on the manufacturer/type of server.
## 9.3.2. Points Definition
Every point defined in the Intesis gateway has the following Modbus features associated with it:
FeatureDescription
Modbus device
Modbus TCP device to which belongs the point, from a list of Modbus TCP server devices that can
be defined in the Intesis gateway (up to 5).
For every defined Modbus TCP server device, a virtual signal is automatically created in the Intesis
gateway to report the communication with the device. Like the rest of the points, this signal is
also available from the field device interface.
Function code
Read func.
Write func.
## 01 Read Coils
## 02 Read Discrete Inputs
## 03 Read Holding Registers
## 04 Read Input Registers
## 05 Write Single Coil
## 15 Write Single Register
## 06 Write Multiple Coils
## 16 Write Multiple Register
#BitsNumber of bits to be used by this signal.
Data coding
format
- 16/32/48/64 bits unsigned
- 16/32/48/64 bits signed (one’s complement – C1)
- 16/32/48/64 bits signed (two’s complement – C2)
- 16/32/48/64 bits Float
- 16/32/48/64 bits Bitfields
- Error comm
Byte order
## • Big-endian
•Little-endian
- Word inverted big-endian
- Word inverted little-endian
## Register
address
The Modbus register address inside the server device for the point.
Bit inside the
register
Bit inside the Modbus register (optional). The Intesis gateway allows bit decoding from generic 16
bits input/holding Modbus registers.
## NOTICE
Some devices use the bit coding into 16 bit input/holding Modbus register to
encode digital values. These registers are generally accessible using Modbus
function codes 03 and 04 (read holding/input registers).
## 2
MSB: most significant bit; LSB: less significant bit
Modbus Client InterfaceIN700-485 Series
USER MANUAL Version 1.4.6Page 17 of 45

- ASCII Interface
## 10.1. Description
The Intesis gateway can be connected to any ASCII-enabled device via its EIA-232, EIA-485, or TCP/IP (Ethernet)
connectors, supervising and controlling its internal points through this interface by using simple ASCII messages.
When the gateway receives a new value for a point from the other protocol system, its ASCII interface sends the
corresponding message indicating the new value to the ASCII system.
## IMPORTANT
- This functionality is only possible if the point is configured to send these "spontaneous messages."
If it doesn't, the new value will remain available in the gateway for a later poll of the ASCII system.
- You can configure this behavior for every gateway point through the configuration tool.
10.2. ASCII Serial
The ASCII interface and the ASCII master device serial connection type must be the same.
## 10.3. ASCII TCP
The Intesis gateway allows the configuration of:
- TCP port (5000 by default).
- IP address.
- Subnet mask.
- Default router address.
## 10.4. Address Map
The ASCII address map is fully configurable; any point in the gateway can be freely configured with the desired
internal register address.
IN700-485 SeriesASCII Interface
Page 18 of 45USER MANUAL Version 1.4.6

## 10.5. Points Definition
Every point defined in the gateway has the following ASCII features associated with it:
FeatureDescription
SignalSignal or point description. Only for information purposes at the user level.
ASCII string
Defines the ASCII string that will be used to access this register.
Max. length: 32 characters
Read/Write
Defines the current function (read, write, or both) to be used from the ASCII side with this
register. It can’t be configured as it is directly set when selecting the current BACnet type
object.
FunctionReadWriteRead/Write
BACnet object
Analog input
Binary input
Multistate input
## Loop
## Accumulator
Analog output
Binary output
Multistate output
Analog value
Binary value
Multistate value
## Spontaneous
Determines the creation and sending of an ASCII message when any point from the BACnet
side changes its value.
## A/D
(Analog/
## Digital)
Defines the current variable type for this register from the ASCII side. It can’t be configured
as it is directly set when selecting the current BACnet type object.
TypeAnalogDigital
BACnet object
Analog input
Analog output
Analog value
Multistate input
Multistate output
Multistate value
## Loop
## Accumulator
Binary input
Binary output
Binary value
Points DefinitionIN700-485 Series
USER MANUAL Version 1.4.6Page 19 of 45

## 10.6. Messages
The ASCII side communicates through simple ASCII messages.
## NOTE
You can configure these messages to match the ASCII master device using the configuration tool.
The ASCII messages used to read/write points have the following format:
Message to read a point value:
ASCII_String?\rWhere:
•ASCII_String is the string indicating the point address inside the Intesis gateway.
•? is the character used to indicate that this is a reading message (configurable with
Intesis MAPS).
•\r is the carriage return character (HEX 0x0D, DEC 13).
Message to write a point value:
ASCII_String=vv\rWhere:
•ASCII_String is the string indicating the point address inside the Intesis gateway.
•= is the character used to indicate that this is a reading message (configurable with
Intesis MAPS).
•vv is the current point value.
•\r is the carriage return character (HEX 0x0D, DEC 13).
Message about a point value: sent spontaneously when the Intesis gateway receives a change from the BACnet
side or in response to a previous poll for the point.
ASCII_String=vv\rWhere:
•ASCII_String is the string indicating the point address inside the Intesis gateway.
•= is the character used to indicate where the point data starts.
•vv is the current point value.
•\r is the carriage return character (HEX 0x0D, DEC 13).
IN700-485 SeriesMessages
Page 20 of 45USER MANUAL Version 1.4.6

## 11. Mounting
## IMPORTANT
Before mounting, please ensure that the chosen installation place preserves the gateway from direct
solar radiation, water, high relative humidity, or dust.
## IMPORTANT
Ensure the gateway has sufficient clearances for all connections when mounted. See Dimensions.
## NOTE
Mount the gateway over a DIN rail, preferably inside a grounded metallic industrial cabinet.
DIN rail mounting
-  Fit the gateway’s top-side clips in the upper edge of the DIN rail.
-  Press the low side of the gateway gently to lock it in the DIN rail.
-  Make sure the gateway is firmly fixed.
## NOTE
For some DIN rails, to complete step 2, you may need a small screwdriver or similar to pull the
bottom clip down.
MountingIN700-485 Series
USER MANUAL Version 1.4.6Page 21 of 45

## 12. Connections
Please find in the following table the gateway's ports and their use depending on the configuration.
ConfigurationPort A EIA-485Port B EIA-485Port B EIA-232Ethernet
IN-BAC-MBMModbus RTU
Bacnet MS/TP,
Modbus RTU
## NA
Modbus TCP,
BACnet/IP, and
## Console*
IN-MBS-BACBACnet MS/TPModbus RTUModbus RTU
Modbus TCP,
BACnet/IP, and
## Console*
IN-ASCII-BACBACnet MS/TPASCIIASCII
BACnet/IP, ASCII
TCP, and Console*
*Console: you can use the Ethernet port to connect the gateway to the PC for configuration purposes.
The following table shows the pinout correspondence for each serial port.
Port A EIA-485Port B EIA-485Pin-out
## A4B1A+
## A3B2B-
A1 and A2B3SNGD
## 12.1. Power Supply
## NOTE
The way to supply power to the gateway is the same for all applications.
## CAUTION
Before manipulating any equipment, including this gateway, ensure the system is disconnected from
the power source.
The power supply connector is a green pluggable terminal block (three poles) labeled as Power.
## IMPORTANT
- Use SELV-rated NEC class 2 or limited power source (LPS) power supply.
- Connect the gateway's ground terminal to the installation grounding.
- A wrong connection may cause earth loops that can damage the Intesis gateway and/or any other
system equipment.
Apply the voltage within the admitted range and of enough power:
•For DC: 9 .. 36 VDC, Max: 260 mA
•For AC: 24 VAC (+/-10 %), 50-60 Hz, Max: 100 mA
Recommended voltage: 24 VDC, Max: 100 mA
IN700-485 SeriesConnections
Page 22 of 45USER MANUAL Version 1.4.6

## IMPORTANT
•When using a DC power supply: Respect the polarity labeled on the power connector for the
positive and negative wires.
•When using an AC power supply: Ensure the same power supply is not powering any other
device.
Once powered, the Run LED of the gateway will turn on.
Power SupplyIN700-485 Series
USER MANUAL Version 1.4.6Page 23 of 45

12.2. Connection Diagrams for each Application
Look for the appropriate diagram depending on your application:
Figure 1. Modbus master to BACnet server
IN700-485 SeriesConnection Diagrams for each Application
Page 24 of 45USER MANUAL Version 1.4.6

Figure 2. BACnet client to Modbus server
Connection Diagrams for each ApplicationIN700-485 Series
USER MANUAL Version 1.4.6Page 25 of 45

Figure 3. BACnet client to ASCII
IN700-485 SeriesConnection Diagrams for each Application
Page 26 of 45USER MANUAL Version 1.4.6

12.3. Connection to Modbus
•Ethernet port for Modbus TCP and Console connection:
Connect the communication cable from the Modbus TCP network to the Ethernet port of the gateway.
## IMPORTANT
Use a straight Ethernet UTP/FTP CAT5 or higher cable.
## IMPORTANT
If communicating through the LAN of the building, contact the network administrator and make
sure traffic on the used port is allowed through all LAN paths.
## NOTE
After powering up the Intesis gateway for the first time, DHCP will be enabled for 30 seconds.
After that time, if a DHCP server provides no IP, the default IP 192.168.100.246 will be set.
•Port B EIA-485 connection for Modbus RTU:
Connect the EIA-485 bus to connectors B1 (A+), B2 (B-), and B3 (SNGD) of the gateway's Port B.
## IMPORTANT
Respect the polarity.
## IMPORTANT
Remember the characteristics of the standard EIA-485 bus:
– Maximum distance of 1200 meters.
– Maximum of 32 devices connected to the bus.
– A termination resistor of 120 Ω is needed at each end of the bus. The gateway has an internal
bus biasing circuit already incorporating the termination resistor. It can be enabled using the
DIP switches:
•Position 1
ON: 120 Ω termination active.
OFF: 120 Ω termination inactive.
•Position 2 and 3
ON: Polarization active.
OFF: Polarization inactive.
– If the termination resistor is enabled and you install the gateway at one of the ends of the bus,
do not install an additional termination resistor at that end.
## NOTE
Only for the Modbus client to BACnet server application, you can also use Port A for the Modbus
RTU connection (see Figure 4 (page 24)).
•Port B EIA-232:
Connect the serial cable EIA-232 from the external serial device to the EIA-232 connector of the gateway Port
## B.
## NOTE
This is a DB9 male (DTE) connector that only uses the TX, RX, and GND.
## IMPORTANT
Respect the maximum distance of 15 meters.
Connection to ModbusIN700-485 Series
USER MANUAL Version 1.4.6Page 27 of 45

12.4. Connection to BACnet
•Ethernet connection for BACnet/IP:
Connect the BACnet/IP network to the Ethernet port of the gateway. The correct cable to use depends on
where the gateway is connected:
–Connecting directly to a BACnet/IP device: use a crossover Ethernet UTP/FTP CAT5 or higher cable.
–Connecting to a hub or switch of the LAN of the building: use a straight Ethernet UTP/FTP CAT5 or higher
cable.
## IMPORTANT
If there is no response from the BACnet devices to the frames sent by the gateway:
– Check that they are operative and reachable from the network connection used by the gateway.
– Check the gateway Ethernet interface sending Pings to its IP address using a PC connected to
the same Ethernet network.
– Contact the network admin to be sure there are no limitations regarding UDP communication or
ports blocked.
## IMPORTANT
If communicating through the LAN of the building, contact the network administrator and make
sure traffic on the used port is allowed through all LAN paths.
## NOTE
After powering up the Intesis gateway for the first time, DHCP will be enabled for 30 seconds.
After that time, if a DHCP server provides no IP, the default IP 192.168.100.246 will be set.
•Port B EIA-485 connection for BACnet MS/TP:
Connect the EIA-485 bus to connectors B1 (A+), B2 (B-), and B3 (SNGD) to the Port B of the gateway.
## IMPORTANT
Respect the polarity.
## IMPORTANT
Remember the characteristics of the standard EIA-485 bus:
– Maximum distance of 1200 meters.
– Maximum of 32 devices connected to the bus.
– A termination resistor of 120 Ω is needed at each end of the bus. The gateway has an internal
bus biasing circuit already incorporating the termination resistor. It can be enabled using the
DIP switches:
•Position 1:
ON: 120 Ω termination active.
OFF: 120 Ω termination inactive.
•Position 2 and 3:
ON: Polarization active.
OFF: Polarization inactive.
## IMPORTANT
If the termination resistor is enabled and you install the gateway at one of the ends of the bus, do
not install an additional termination resistor at that end.
IN700-485 SeriesConnection to BACnet
Page 28 of 45USER MANUAL Version 1.4.6

12.5. Connection to ASCII
•Ethernet port for ASCII TCP:
Connect the communication cable from the ASCII TCP network to the Ethernet port of the gateway.
## IMPORTANT
Use a straight Ethernet UTP/FTP CAT5 or higher cable.
## IMPORTANT
If communicating through the LAN of the building, contact the network administrator and make
sure traffic on the used port is allowed through all LAN paths.
## NOTE
After powering up the Intesis gateway for the first time, DHCP will be enabled for 30 seconds.
After that time, if a DHCP server provides no IP, the default IP 192.168.100.246 will be set.
•Port B EIA-485 connection for ASCII serial:
Connect the EIA-485 bus to connectors B1 (A+), B2 (B-), and B3 (SNGD) to the Port B of the gateway.
## IMPORTANT
Respect the polarity.
## IMPORTANT
Remember the characteristics of the standard EIA-485 bus:
– Maximum distance of 1200 meters.
– Maximum of 32 devices connected to the bus.
– A termination resistor of 120 Ω is needed at each end of the bus. The gateway has an internal
bus biasing circuit already incorporating the termination resistor. It can be enabled using the
DIP switches:
•Position 1:
ON: 120 Ω termination active.
OFF: 120 Ω termination inactive.
•Position 2 and 3:
ON: Polarization active.
OFF: Polarization inactive.
– If the termination resistor is enabled and you install the gateway at one of the ends of the bus,
do not install an additional termination resistor at that end.
•Port B EIA-232 for ASCII serial:
Connect the serial cable EIA-232 from the external serial device to the EIA-232 connector of the gateway Port
## B.
## NOTE
This is a DB9 male (DTE) connector that only uses the TX, RX, and GND.
## IMPORTANT
Respect the maximum distance of 15 meters.
Connection to ASCIIIN700-485 Series
USER MANUAL Version 1.4.6Page 29 of 45

12.6. Console and USB Connections
•Console port:
Connect a USB Mini-B type cable from the gateway console port to a computer running the configuration tool.
## NOTICE
With this software tool, you can configure and monitor the gateway.
## NOTE
If your computer has an Ethernet port, you can also use the Ethernet port of the gateway to
connect both.
•USB port:
## TIP
You can connect a USB storage device to the USB port of the gateway to store logs.
## IMPORTANT
The USB port doesn't support HDD devices.
IN700-485 SeriesConsole and USB Connections
Page 30 of 45USER MANUAL Version 1.4.6

- LED Indicators
On the front side, ten LEDs indicate the different status of the gateway:
LEDColorDescription
## Run
OffNo power
## Green
The gateway is
connected and running
## Error
OffNo error
RedError
## Eth. Link
OffNo connection
GreenConnection established
## Eth. Spd
OffNo transmission
YellowTransmitting data
Port A TX/RX
OffNo activity
TX blinking green
Data packet
transmitted from the
gateway to the
installation
RX blinking yellow
Data packet received to
the gateway from the
installation
Port B TX/RX
OffNo activity
TX blinking green
Data packet
transmitted from the
gateway to the BMS
RX blinking yellow
Data packet received to
the gateway from the
## BMS
LED for Button A*Blinking green
Transmission of data
from the gateway to
the USB flash drive
LED for Button B*Blinking green
Transmission of data
from the USB flash
drive to the gateway
## NOTE
*Both Button A and Button B LEDs blink alternatively when the gateway detects that a USB flash
drive has been connected and it is ready to be used.
## NOTE
The Console port (USB Mini-B type) has an internal orange LED that turns steady on when
connecting the gateway to the PC with the console cable. The light emitted by this LED reflects
through Button B's own LED. Don't confound this effect with the button's LED activity.
LED IndicatorsIN700-485 Series
USER MANUAL Version 1.4.6Page 31 of 45

## 14. Buttons
Two push buttons, labeled as Button A and Button B, are located on the front panel of the gateway. The function
of these buttons changes based on whether a USB flash drive is connected to the gateway.
•No USB flash drive is connected to the gateway.
–Button A
The function of Button A changes depending on the gateway's protocol combination, being subject to the
protocol of the BMS.
BMS protocolButton A function
BACnetSends an I-Am message
ModbusNo function
ASCIINo function
–Button B
Button B has no function when no USB flash drive is connected to the gateway.
•A USB flash drive is connected to the gateway.
## NOTICE
– The gateway only supports USB flash drives. External HDD are not supported.
– The gateway supports USB flash drives with FAT32 and exFAT file systems.
## NOTE
The function of Button A and Button B can be configured with Intesis MAPS as shown in this
picture below:
IN700-485 SeriesButtons
Page 32 of 45USER MANUAL Version 1.4.6

## NOTE
When using Button A and Button B functions related to a USB flash drive, we recommend
connecting the gateway to a computer running Intesis MAPS to track the process via the
Diagnostic tab's Console viewer.
To know more, see the .
–Button A
By default, it is used to capture logs and save the gateway's configuration on a USB flash drive.
Follow this procedure:
-  Connect the USB flash drive to the gateway through its USB port.
## NOTE
The Console viewer message "USB: Storage Device Attached" informs that the USB device
has been detected.
-  The LEDs next to the buttons start to blink alternatively for 15 seconds.
## NOTICE
Button A will be active during these 15 seconds. Press it before the LEDs turn off.
## NOTE
The Console viewer message "USB: [some specific USB device information] mounted"
informs that the USB device is ready.
-  Press Button A once to save the current gateway's configuration to the USB flash drive and to start
capturing logs.
The LED of Button A blinks while data is being loaded from the gateway to the USB device.
## NOTE
The Console viewer message "USB: Project written successfully to USB" informs that the
project has been downloaded to the USB device.
## NOTE
The Console viewer message "USB: Writing logs started" informs that logs are been
downloaded to the USB device.
-  Press and hold Button A for five seconds to stop capturing logs.
## NOTE
The Console viewer message "USB: USB logging canceled by user" informs that logs are
been downloaded to the USB device.
-  Disconnect the USB flash drive from the gateway.
## NOTE
The Console viewer message "USB: Storage Device Detached" informs that the USB device
has been disconnected.
ButtonsIN700-485 Series
USER MANUAL Version 1.4.6Page 33 of 45

–Button B
By default, it is used to upload an Intesis MAPS project and a firmware version from the USB flash drive to
the gateway.
Follow this procedure:
-  Connect the USB flash drive to the gateway through its USB port.
## NOTE
The Console viewer message "USB: Storage Device Attached" informs that the USB device
has been detected.
-  The LEDs next to the buttons start to blink alternatively for 15 seconds.
## NOTICE
Button B will be active during these 15 seconds. Press it before the LEDs turn off.
## NOTE
The Console viewer message "USB: [some specific USB device information] mounted"
informs that the USB device is ready.
-  Press Button B once to upload the Intesis MAPS project and the firmware version stored on the USB
flash drive to the gateway.
The LED of Button B blinks while data is being loaded from the USB device to the gateway.
## NOTICE
If more than one project is stored in the USB device, the gateway will upload the last saved
project. The project/firmware must be located in the pen drive root memory, not inside a
folder.
## NOTE
The Console viewer message "USB: Saving project from the storage device" informs that
the project has been uploaded to the gateway.
## NOTE
The Console viewer message "FWUPDATE: DONE" informs that the firmware update
process has been successful.
-  Disconnect the USB flash drive from the gateway.
## NOTE
The Console viewer message "USB: Storage Device Detached" informs that the USB device
has been disconnected.
IN700-485 SeriesButtons
Page 34 of 45USER MANUAL Version 1.4.6

## 14.1. Factory Reset
Use Button A + Button B to reset the gateway to the factory settings.
Follow this procedure:
-  Disconnect the gateway from power.
-  Press and hold Button A and Button B simultaneously.
-  Connect the gateway to power again.
-  Wait until the LEDs start to cycle on and off from top to bottom.
-  Release Button A and Button B.
## NOTE
The Console viewer message "Performing reset to factory settings..." informs that the process has
started. Once ended, the Console viewer displays "...done!"
## NOTE
The process could take up to 90 seconds to finish.
Factory ResetIN700-485 Series
USER MANUAL Version 1.4.6Page 35 of 45

- Set-up Process with the Configuration Tool
## 15.1. Prerequisites
For this integration, you need:
- The items delivered by HMS Networks:
– The Intesis IN700485⁎⁎⁎0000 protocol translator gateway.
– A mini-type B USB to USB cable.
– Link to download the configuration tool.
– Product documentation.
- The respective client or server devices connected to either the EIA-485/EIA-232 Port B or to the Ethernet port.
15.2. Intesis MAPS: Configuration and Monitoring Tool
## 15.2.1. Introduction
To configure the gateway, you need a PC running Intesis MAPS. You can download this configuration tool from
https://www.intesis.com/products/intesis-maps#download.
Intesis MAPS is a Windows® compatible software explicitly developed to monitor and configure Intesis gateways.
## NOTE
The following sections provide some primary and general information to configure this gateway.
Although Intesis MAPS is an easy-to-manage user-friendly tool, you may need more specific and
comprehensive information about the different parameters and how to configure them. If so, please
refer to these specific Intesis MAPS user manuals depending on the protocol you are working with:
- BACnet
## • Modbus
## NOTICE
The Intesis MAPS user manual referring to ASCII protocol will come soon.
IN700-485 SeriesSet-up Process with the Configuration Tool
Page 36 of 45USER MANUAL Version 1.4.6

## 15.2.2. Template Selection
When opening the software, you will see the main window, called Getting started. Here you can select the
template for your application:
-  Click Create New Project in the left menu.
-  Select the appropriate template for your application. To filter the selection:
- Click on the protocol logos.
- Type the order code in the Order Code field,
- Check out the list to find the template you need.
Figure 4. The three possibilities for the template selection
-  Select the template and click Next or double-click it in the list.
Intesis MAPS: Configuration and Monitoring ToolIN700-485 Series
USER MANUAL Version 1.4.6Page 37 of 45

## 15.2.3. Connection Tab
-  Connect the gateway to your PC.
- Use the gateway's Ethernet port and an Ethernet CAT5 or higher cable.
- Use the Console port and a USB Mini-B type to USB A type cable.
-  On the Connection Type parameter, select the way you connected the gateway to your PC:
- Select IP if you are using the Ethernet port of the Intesis gateway.
## NOTICE
The default password when connecting via IP is admin.
## IMPORTANT
Make sure you have an internet connection.
## NOTE
When using the IP connection, the gateway's name appears:
–In black: It is compatible with the selected template.
–In red: It is not compatible with the selected template.
- Select USB Port if you are using the Console port of the gateway.
## NOTICE
No password is needed when connecting via USB.
-  Select your gateway from the Discovered Gateways list on the left.
## 4.  Click Connect.
## NOTE
If your Intesis gateway firmware doesn't match the selected template, a pop-up window will prompt
you to download the correct firmware.
When selecting IP as the connection type, two additional buttons will appear:
•Identify: Click the Identify button to make the gateway's LEDs blink for 10 seconds.
•Edit: Click the Edit button to open the Config IP settings window.
You can edit the IP Address, NetMask, and Default Gateway IP.
## NOTE
These parameters can also be edited in the Configuration tab. See Connection.
IN700-485 SeriesIntesis MAPS: Configuration and Monitoring Tool
Page 38 of 45USER MANUAL Version 1.4.6

## 15.2.4. Configuration Tab
In the Configuration tab, you can configure general parameters and parameters for both protocol interfaces of
the Intesis gateway.
On the left side of the window, three submenus are shown:
- Submenu 1: General configuration parameters for the gateway.
- Submenus 2 and 3: BMS and Device respective protocols configuration parameters.
Intesis MAPS: Configuration and Monitoring ToolIN700-485 Series
USER MANUAL Version 1.4.6Page 39 of 45

## 15.2.5. Signals Tab
This menu lists all available signals and their parameters for both protocols.
## NOTE
You can find more information on every parameter and how to configure it in the Intesis MAPS user
manual:
## • Modbus
- BACnet
Below the list of signals, these options are available:
•Active signals: Number of active signals in the list / Total number of signals in the list.
•Hide Disabled signals: Hide all disabled signals from the list (disabled by default).
•Edit Columns: Click this button to hide/show any column of the list.
•Import: Click this button to import the signals' configuration from an XLSX file. These signals can be added to
the existing ones or replace them.
•Export: Click this button to export the current signals' configuration to an XLSX file.
## •
## A
A: Increases or decreases the font size.
- Click the Check table button to review the signals' configuration.
## NOTE
If any parameter on any signal is wrong, a message will pop up with specific information about the
error.
15.2.6. Receive/Send Tab
## Send:
Once you have finished setting the parameters, you have to send the configuration to the gateway:
-  Click the Send button.
a.  If the gateway is still factory-set, you will be prompted to save the project on your PC. Once saved, the
configuration is automatically sent to the gateway.
b.  If you have already saved the project, the configuration is automatically sent to the gateway.
-  Connect again with the gateway after sending the file.
## NOTICE
The gateway reboots automatically once the new configuration is loaded. This process may take
a few seconds.
IN700-485 SeriesIntesis MAPS: Configuration and Monitoring Tool
Page 40 of 45USER MANUAL Version 1.4.6

## Receive:
Use this function to load the configuration of a gateway to Intesis MAPS.
## TIP
This function may be helpful when you need to change some parameters of an already configured
gateway.
Once the configuration is completed and sent, the gateway is already operative. Even so, you should review that
everything works correctly by entering the Diagnostic tab.
Intesis MAPS: Configuration and Monitoring ToolIN700-485 Series
USER MANUAL Version 1.4.6Page 41 of 45

## 15.2.7. Diagnostic Tab
## IMPORTANT
Connection with the gateway is required to use the diagnostic tools.
Figure 5. Diagnostic tab window. Find the ToolBox between the upper tabs bar and the Console view. Below it,
from left to right: Console viewer, Protocol viewers (one above the other), and the Signals viewer
ToolBox:
Use the tools section to:
•Microprocessor icon: Check the current hardware status of the gateway.
•LOG: Set Intesis MAPS in logging mode to record all the information present in the viewers and save it in a .zip
file.
•INFO?: Get some gateway information.
•RESET: Reset the gateway.
IN700-485 SeriesIntesis MAPS: Configuration and Monitoring Tool
Page 42 of 45USER MANUAL Version 1.4.6

## NOTE
Depending on your screen resolution, the ToolBox icons may appear partially hidden behind the
Viewers window.
## Viewers:
Intesis MAPS provides several viewers:
- A generic console viewer for general information about communications and the gateway status.
- A viewer for both protocols to check their current status.
- A signals viewers to simulate the BMS behavior or check the system's current values.
The layout of these viewers can be modified:
- Using the Select Diagnostics View option from the View menu:
## NOTE
Layouts 3 and 4 offer two different tabbed options:
– Fixed console to the left and tabbed browser for the other viewers
– Full tabbed browser
- Clicking and dragging the border of a viewer. To do so, place the cursor over the edge of a viewer. On the
vertical edges, the cursor changes to
to allow the adjustment of the width, and on the horizontal edges, the
cursor changes to  to allow the adjustment of the height.
Intesis MAPS: Configuration and Monitoring ToolIN700-485 Series
USER MANUAL Version 1.4.6Page 43 of 45

## 16. Technical Specifications
HousingPlastic, type ABS (UL 94 V-0) / Color: light grey. RAL 7035
MountingDIN rail EN60715 TH35
Terminal blocks
wiring
Solid wires or stranded wires (twisted or with ferrule) are allowed. Per terminal:
Millimeters: One core: 0.5 .. 2.5 mm2 / Two cores: 0.5 .. 1.5 mm2 / Three cores: not
allowed
Gauge: One core: 24 .. 11 AWG / Two cores: 24 .. 15 AWG / Three cores: not allowed
Power1 x green pluggable terminal block (3 poles)
Ground, negative, and positive
- For DC: 9 to 36 VDC, Max: 260 mA
- For AC: 24 VAC +/-10 %, 50-60 Hz, Max: 100 mA
Recommended: 24 VDC, Max: 100 mA
Ethernet1 x Ethernet RJ45 10/100BASE-T
Port A1 x serial EIA-485 orange pluggable terminal block (2 poles)
## • A+, B-
1 x green pluggable terminal block (2 poles)
- SGND (reference ground or shield)
1500 Vdc isolation from other ports
SW A1 x DIP switch (3 position) for serial EIA-485 configuration:
## Position 1:
- ON: 120 Ω termination active
- OFF: 120 Ω termination inactive
Position 2 and 3
- ON: polarization active
- OFF: polarization inactive (default)
Port B1 x serial EIA-232 DB9 male
Pinout from a DTE device / 1500 VDC isolation from other ports (except Port B: EIA-485)
1 x serial EIA-485 green pluggable terminal block (3 poles)
- A+, B-, SGND (reference ground or shield)
1500 VDC isolation from other ports (except Port B: EIA-232)
SW B1 x DIP switch (3 position) for serial EIA-485 configuration:
## Position 1:
- ON: 120 Ω termination active
- OFF: 120 Ω termination inactive
Position 2 and 3:
- ON: polarization active
- OFF: polarization inactive (default)
BatteryType: Manganese Dioxide Lithium button battery / Size: 20 mm x 3.2 mm (0.79" x 0.13") /
Capacity 3 V - 255 mA
Console portUSB Mini-B type 2.0 compliant / 1500 VDC isolation
USB portUSB A type 2.0 compliant / Only for USB flash storage devices (USB pen drive) / HDD
connection not allowed / Power consumption limited to 150 mA
Push buttonsA and B buttons: Factory reset
## Operational
conditions
Before serial number 000R05920, Temperature: 0... 60°C / 32.. 140°F
After serial number 000R05920 (included), Temperature: -10... 60°C / 14.. 140°F
Humidity: 5 .. 95% (No condensation)
LED indicators10 x Onboard LED indicators:
1 x Power / 1 x Error / 2 x Ethernet / 2 x Port A / 2 x Port B / 1 x Button A / 1 x Button B
IN700-485 SeriesTechnical Specifications
Page 44 of 45USER MANUAL Version 1.4.6

## 17. Dimensions
•Net dimensions (HxWxD)
Millimeters: 90 x 88 x 58 mm
Inches: 3.54 x 3.46 x 2.28"
## IMPORTANT
Leave enough clear space to wire the gateway easily and for the subsequent manipulation of
elements.
DimensionsIN700-485 Series
USER MANUAL Version 1.4.6Page 45 of 45