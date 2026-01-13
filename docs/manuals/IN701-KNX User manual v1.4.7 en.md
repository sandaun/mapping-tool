IN701-KNX Series
INTESIS PROTOCOL TRANSLATOR WITH KNX, SERIAL, AND IP SUPPORT
USER MANUAL
Version 1.4.7
Publication date 2024-05-16
ENGLISHCopyright © 2022 Intesis
Disclaimer
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
1. Description and Order Codes ..................................................................................................... 1
2. General Information ................................................................................................................ 2
2.1. Intended Use of the User Manual ........................................................................................ 2
2.2. General Safety Information ................................................................................................ 2
2.3. Admonition Messages and Symbols ..................................................................................... 2
3. General Introduction ................................................................................................................ 4
4. KNX TP to Modbus Server ......................................................................................................... 5
4.1. Specific Introduction ......................................................................................................... 5
4.2. Functionality ................................................................................................................... 5
5. Modbus Client to KNX .............................................................................................................. 6
5.1. Specific Introduction ......................................................................................................... 6
5.2. Functionality ................................................................................................................... 6
6. KNX to BACnet Server .............................................................................................................. 7
6.1. Specific Introduction ......................................................................................................... 7
6.2. Functionality ................................................................................................................... 7
7. BACnet Client to KNX ............................................................................................................... 8
7.1. Specific Introduction ......................................................................................................... 8
7.2. Functionality ................................................................................................................... 8
8. KNX to ASCII ........................................................................................................................... 9
8.1. Specific Introduction ......................................................................................................... 9
8.2. Functionality ................................................................................................................... 9
9. Gateway Capacity ................................................................................................................... 10
10. KNX Interface ....................................................................................................................... 11
10.1. Description ................................................................................................................... 11
10.2. Points Definition ............................................................................................................ 11
11. Modbus Interface ................................................................................................................. 12
11.1. General Description ....................................................................................................... 12
11.2. Modbus Server Interface ................................................................................................. 12
11.2.1. Description ........................................................................................................... 12
11.2.2. Functions Supported ............................................................................................... 12
11.2.3. Modbus RTU ......................................................................................................... 13
11.2.4. Modbus TCP .......................................................................................................... 13
11.2.5. Modbus Server Interface Points Definition .................................................................. 14
11.3. Modbus Client Interface .................................................................................................. 14
11.3.1. Description ........................................................................................................... 14
11.3.2. Points Definition .................................................................................................... 15
12. BACnet Interface .................................................................................................................. 16
12.1. General Description ....................................................................................................... 16
12.2. BACnet Client ................................................................................................................ 17
12.2.1. Description ........................................................................................................... 17
12.2.2. Points Definition .................................................................................................... 18
12.3. BACnet Server ............................................................................................................... 19
IN701-KNX Series
USER MANUAL Version 1.4.7
12.3.1. Description ........................................................................................................... 19
12.3.2. BACnet/IP ............................................................................................................. 20
12.3.3. BACnet MS/TP ....................................................................................................... 20
13. ASCII Interface ..................................................................................................................... 21
13.1. Description ................................................................................................................... 21
13.2. ASCII Serial ................................................................................................................... 21
13.3. ASCII TCP ...................................................................................................................... 21
13.4. Address Map ................................................................................................................ 21
13.5. Points Definition ............................................................................................................ 22
13.6. Messages ..................................................................................................................... 23
14. Mounting ............................................................................................................................ 24
15. Connections ......................................................................................................................... 25
15.1. Power Supply ................................................................................................................ 25
15.2. Connection Diagrams for each Application .......................................................................... 27
15.3. Connection to KNX ......................................................................................................... 32
15.4. Connection to BACnet .................................................................................................... 32
15.5. Connection to Modbus ................................................................................................... 34
15.6. Connection to ASCII ........................................................................................................ 35
15.7. Console and USB Connections .......................................................................................... 36
16. Set-up Process with the Configuration Tool ............................................................................... 37
16.1. Prerequisites ................................................................................................................. 37
16.2. Intesis MAPS: Configuration and Monitoring Tool ................................................................. 37
16.2.1. Introduction .......................................................................................................... 37
16.2.2. Template Selection ................................................................................................. 38
16.2.3. Connection Tab ...................................................................................................... 39
16.2.4. Configuration Tab ................................................................................................... 40
16.2.5. Signals Tab ............................................................................................................ 41
16.2.6. Receive/Send Tab ................................................................................................... 41
16.2.7. Diagnostic Tab ....................................................................................................... 43
17. Technical Specifications ......................................................................................................... 45
18. Dimensions .......................................................................................................................... 46
IN701-KNX Series
USER MANUAL Version 1.4.7
1. Description and Order Codes
ORDER CODE LEGACY ORDER CODE
IN701KNX1000000 INMBSKNX1000000 INKNXMBM1000000 INBACKNX1000000 INKNXBAC1000000 -
IN701KNX2500000 INMBSKNX2500000 INKNXMBM2500000 INBACKNX2500000 INKNXBAC2500000 -
IN701KNX6000000 INMBSKNX6000000 INKNXMBM6000000 INBACKNX6000000 INKNXBAC6000000 INASCKNX6000000
IN701KNX1K20000 INMBSKNX1K20000 INKNXMBM1K20000 INBACKNX1K20000 INKNXBAC1K20000 -
IN701KNX3K00000 INMBSKNX3K00000 INKNXMBM3K00000 INBACKNX3K00000 INKNXBAC3K00000 INASCKNX3K00000
PRODUCT NAME ORDER CODE DESCRIPTION INTESIS MAPS TEMPLATE APPLICATION
IN701-KNX IN701KNX⁎⁎⁎00001
Intesis Protocol Translator
with KNX, Serial, and IP
Support
IN-MBS-KNX KNX to Modbus server
IN-KNX-MBM Modbus client to KNX
IN-BAC-KNX KNX to BACnet server
IN-KNX-BAC BACnet client to KNX
IN-ASCII-KNX KNX to ASCII
1 ⁎⁎⁎ defines the Intesis gateway capacity.
Description and Order Codes IN701-KNX Series
USER MANUAL Version 1.4.7 Page 1 of 46
2. General Information
2.1. Intended Use of the User Manual
This manual contains the main features of this Intesis gateway and the instructions for its appropriate
installation, configuration, and operation.
The contents of this manual should be brought to the attention of any person who installs, configures, or
operates this gateway or any associated equipment.
Keep this manual for future reference during the installation, configuration, and operation.
2.2. General Safety Information
IMPORTANT
Follow these instructions carefully. Improper work may seriously harm your health and damage the
gateway and/or any other equipment connected to it.
Only technical personnel, following these instructions and the country legislation for installing electrical
equipment, can install and manipulate this gateway.
Install this gateway indoors, in a restricted access location, avoiding exposure to direct solar radiation, water, high
relative humidity, or dust.
```
All wires (for communication and power supply, if needed) must only be connected to networks with indoor
```
wiring. All communication ports are considered for indoor use and must only be connected to SELV circuits.
Disconnect all systems from power before manipulating and connecting them to the gateway.
```
Use SELV-rated NEC class 2 or limited power source (LPS) power supply.
```
Use a circuit breaker before the power supply. Rating: 250 V, 6 A.
Respect the expected polarity of power and communication cables when connecting them to the gateway.
CAUTION
Only an authorized installer is allowed to replace the battery. There's a risk of explosion if the battery
is replaced by an incorrect type. Dispose of used batteries according to local legislation.
Safety instructions in other languages can be found at https://intesis.com/docs/manuals/v6-safety
2.3. Admonition Messages and Symbols
DANGER
Instructions that must be followed to avoid an imminently hazardous situation that, if not avoided,
will result in death or severe injury.
WARNING
Instructions that must be followed to avoid a potentially hazardous situation that, if not avoided,
could result in death or severe injury.
IN701-KNX Series General Information
Page 2 of 46 USER MANUAL Version 1.4.7
CAUTION
Instruction that must be followed to avoid a potentially hazardous situation that, if not avoided,
could result in minor or moderate injury.
IMPORTANT
Instruction that must be followed to avoid a risk of reduced functionality and/or damage to the
equipment or to avoid a network security risk.
NOTE
Additional information which may facilitate installation and/or operation.
TIP
Helpful advice and suggestions.
NOTICE
Remarkable Information.
Admonition Messages and Symbols IN701-KNX Series
USER MANUAL Version 1.4.7 Page 3 of 46
3. General Introduction
This Intesis® gateway allows you to integrate Serial and IP protocols to KNX easily.
This document describes the available applications for this gateway:
• KNX TP to Modbus® TCP & RTU Server.
• Modbus TCP & RTU Client to KNX TP.
• KNX TP to BACnet®/IP & MS/TP Server.
• BACnet/IP & MS/TP Client to KNX TP.
• KNX TP to ASCII IP & Serial Server.
IMPORTANT
This document assumes that the user is familiar with KNX, BACnet, Modbus, and ASCII technologies
and their technical terms.
NOTE
Some sections provide general information common to all applications, while others highlight
specific differences, capacities, or limitations.
In general terms, you must have a KNX installation or device on one side and a BACnet, Modbus, or ASCII
```
installation or device on the other side (only one at a time).
```
IMPORTANT
The Intesis gateway can act as a server or client for BACnet and Modbus but only as a server for
ASCII.
As always, the configuration process is fast and easy:
1. Launch the configuration tool.
2. Select the template.
3. Connect the Intesis gateway to the PC.
4. Adjust the configuration and signals to your project.
5. Send the configuration to the gateway.
And you are ready to go!
IN701-KNX Series General Introduction
Page 4 of 46 USER MANUAL Version 1.4.7
4. KNX TP to Modbus Server
4.1. Specific Introduction
This section describes the integration of KNX systems into Modbus RTU and/or Modbus TCP systems using the
KNX TP to Modbus TCP & RTU server application of the Intesis gateway.
This integration allows a Modbus installation to access the groups, objects, and associated devices of KNX devices
as if they were part of the Modbus system itself and vice versa.
The gateway acts as a Modbus TCP or RTU server device in its Modbus interface, allowing read/write points from
the Modbus client devices, and offering these points' values through its KNX interface, acting as one more KNX
device of the system.
The gateway configuration is carried out through the configuration tool.
Figure 1. Integration of KNX TP devices into Modbus RTU or Modbus TCP control and monitor systems
4.2. Functionality
From the KNX system point of view, after starting the gateway or performing a KNX bus reset, the Intesis gateway
polls the KNX signals and stores the received values in its memory, ready to be served to the Modbus system
when requested. It also listens for any KNX telegram related to the internal points configured in it and acts
accordingly to the configuration of the related points.
From the Modbus system point of view, after starting it, the gateway listens for any read or write request, serves
any read request, or performs any writing request of its internal points received from the Modbus system. The
values received from Modbus become available to be read by the KNX system and vice versa.
In the gateway, each Modbus point is associated with a KNX group address so that the KNX system sees
the whole Modbus system as if it was one more KNX device with the same configuration and operation
characteristics.
When a Modbus point changes, the gateway sends a write telegram to the associated group address in the KNX
bus.
When the gateway receives a telegram from a KNX group address associated with a Modbus point, it sends a
message to the corresponding Modbus device to perform the related action.
KNX TP to Modbus Server IN701-KNX Series
USER MANUAL Version 1.4.7 Page 5 of 46
5. Modbus Client to KNX
5.1. Specific Introduction
This section describes the integration of Modbus RTU devices into KNX installations using the Modbus TCP & RTU
client to KNX TP application of the Intesis gateway.
This integration allows a KNX installation to access the signals and resources of Modbus devices as if they were
part of the KNX system and vice versa.
The gateway acts as a Modbus TCP or RTU client device in its Modbus interface, reading/writing points from the
Modbus server devices by automatic continuous polling. The gateway offers these points' values through its KNX
interface, acting as one more KNX device of the system.
The gateway configuration is carried out through the configuration tool.
Figure 2. Integration of Modbus TCP or RTU devices into KNX control and monitoring systems
5.2. Functionality
From the Modbus system point of view, after starting it, the Intesis gateway continuously reads the Modbus RTU
service devices, updating all the points' values received in its memory.
From the KNX system point of view, after starting the gateway or performing a KNX bus reset, the Intesis gateway
polls the KNX signals and stores the received values in its memory, ready to be served to the Modbus system
when requested. It also listens for any KNX telegram related to the internal points configured in it and acts
accordingly to the configuration of the related points.
In the gateway, each Modbus point is associated with a KNX group address so that the KNX system sees
the whole Modbus system as if it was one more KNX device with the same configuration and operation
characteristics.
When a Modbus point changes, the gateway sends a write telegram to the associated group address in the KNX
bus.
When the gateway receives a telegram from a KNX group address associated with a Modbus point, it sends a
message to the corresponding Modbus device to perform the related action.
When polling the Modbus devices, if a non-response is detected, the corresponding virtual signal inside the
gateway will be activated to indicate the communication error as a KNX group address.
IN701-KNX Series Modbus Client to KNX
Page 6 of 46 USER MANUAL Version 1.4.7
6. KNX to BACnet Server
6.1. Specific Introduction
This section describes the integration of KNX devices into BACnet MS/TP or BACnet/IP installations using the KNX
TP to BACnet server application of the Intesis gateway.
This integration allows a BACnet installation to access the signals and resources of KNX devices as if they were
part of the BACnet system itself and vice versa.
The gateway acts as a BACnet/IP server or BACnet MS/TP device in its BACnet interface, allowing other BACnet
```
devices to perform subscription (COV) requests and readings/writings to its internal points. From the KNX point
```
of view, the gateway emulates a KNX device.
The gateway configuration is carried out through the configuration tool.
Figure 3. Integration of KNX devices into BACnet/IP or BACnet MS/TP control and monitoring systems
6.2. Functionality
From the KNX system point of view, after starting the gateway or performing a KNX bus reset, the Intesis gateway
polls the KNX signals and stores the received values in its memory, ready to be served to the BACnet system
when requested. It also listens for any KNX telegram related to the internal points configured in it and acts
accordingly to the configuration of the related points.
```
From the BACnet system point of view, after starting it, the gateway listens for any subscription (COV) request,
```
serves any polling request, or performs any writing request of its internal points received from the BACnet
system. The values received from BACnet are immediately written in the associated KNX communication object if
allowed by the KNX settings.
In the KNX part, one main group address and different listening group addresses can be defined for every point.
This way, every point can be addressed using its main group address and the other specified listening addresses.
```
Any change in a point in the gateway with the “T” flag activated (in the KNX part) will force the transmission of
```
this point value with the corresponding telegram to the KNX system.
```
Any point with the “W” flag activated (in the KNX part) can be written from the KNX system at any moment.
```
```
Any point with the “R” flag activated (in the KNX part) can be read from the KNX system at any moment.
```
```
Any point with the “Ri” flag activated (in the KNX part) will be read after every reset of the gateway.
```
KNX to BACnet Server IN701-KNX Series
USER MANUAL Version 1.4.7 Page 7 of 46
7. BACnet Client to KNX
7.1. Specific Introduction
This section describes the integration of BACnet MS/TP and BACnet/IP devices into KNX installations using the
BACnet client to KNX application of the Intesis gateway.
This integration allows a KNX installation to access the signals and resources of BACnet devices as if they were
part of the KNX system itself and vice versa.
```
From the BACnet point of view, the gateway acts as a BACnet client device, so it can subscribe (COV) or perform
```
periodic polling and writings on configured BACnet objects. The BACnet points’ values are available through its
KNX interface, acting in the KNX system as one more KNX device.
The gateway configuration is carried out through the configuration tool.
Figure 4. Integration of BACnet/IP or MS/TP devices into KNX control and monitoring systems
7.2. Functionality
From the BACnet system point of view, after starting it, the gateway subscribes to configured BACnet points or
reads them continuously from their respective BACnet server devices, updating in its memory the received value
of their Present_Value property.
Each Present_Value is associated with a KNX group object that, in turn, is associated with one or more KNX group
addresses.
When a KNX object changes, it is transmitted to the KNX system with its corresponding group address.
Likewise, when a change is received in a write-enabled KNX group object, the change is written to the
```
Present_Value property of the corresponding BACnet object associated with it (using the WriteProperty BACnet
```
```
service).
```
Therefore, the Intesis gateway performs as a single KNX device in the KNX system, offering communication
objects to access the BACnet objects of the configured external BACnet devices.
When polling BACnet server devices, if a non-response is detected, the corresponding virtual signal inside the
gateway will be activated to indicate the communication error to the KNX system as a KNX group object.
IN701-KNX Series BACnet Client to KNX
Page 8 of 46 USER MANUAL Version 1.4.7
8. KNX to ASCII
8.1. Specific Introduction
```
This section describes the integration of KNX devices into ASCII serial (EIA-232 or EIA-485) or ASCII IP installations
```
using the KNX to ASCII server application of the Intesis gateway.
This integration aims to make the signals and resources of KNX devices accessible from any programmable
system capable of reading/writing simple text messages through EIA-232 or EIA-485 serial port or Ethernet
```
TCP/IP port (for example, Extron, LiteTouch systems).
```
In its KNX interface, the Intesis gateway acts as a KNX device, reading/writing points from other KNX devices and
offering these points' values through its ASCII interface using simple ASCII messages.
The gateway configuration is carried out through the configuration tool.
Figure 5. Integration of KNX devices into ASCII IP or ASCII serial control and monitoring systems
8.2. Functionality
From the KNX system point of view, after starting the gateway or performing a KNX bus reset, the Intesis gateway
polls the KNX signals and stores the received values in its memory, ready to be served to the ASCII system when
requested. It also listens for any KNX telegram related to its configured internal points and acts accordingly to the
configuration of the related point.
From the ASCII system point of view, after starting it, the gateway listens for any read or write request, serves any
read request, or performs any writing request of its internal points received from the ASCII system. The values
received from ASCII become available to be read by the KNX system and vice versa.
In the gateway, each ASCII point is associated with a KNX group address, so the KNX system sees the whole ASCII
system as if it was one more KNX device, with the same configuration and operation characteristics.
When an ASCII point changes, the gateway sends a write telegram to the associated group address in the KNX
bus.
When the gateway receives a telegram from a KNX group address associated with an ASCII point, it sends a
message to the corresponding ASCII device to perform the related action.
KNX to ASCII IN701-KNX Series
USER MANUAL Version 1.4.7 Page 9 of 46
9. Gateway Capacity
Table 1. For KNX to Modbus server
Element 100 version 250 version 600 version 1200 version 3000 version
Maximum number of KNX communication objects 100 250 600 1200 3000
Maximum number of KNX main group addresses 100 250 600 1200 3000
Maximum number of KNX associations 200 500 1200 2400 6000
```
Type of Modbus client devices supported Those supporting Modbus protocol communication over TCP/IP and RTU (EIA-485 andEIA-232)
```
Number of Modbus client nodes and devices supported TCP: Up to 5 TCP nodesRTU: one client device per RTU node
Table 2. For Modbus Client to KNX
Element 100 version 250 version 600 version 1200 version 3000 version
Maximum number of KNX communication objects 100 250 600 1200 3000
Maximum number of KNX main group addresses 100 250 600 1200 3000
Maximum number of possible KNX associations 200 500 1200 2400 6000
```
Type of Modbus server devices supported Those supporting Modbus protocol communication over TCP/IP and RTU (EIA-485)
```
Number of Modbus server nodes and devices
supported
```
TCP: Up to 5 Modbus TCP nodes and up to 254 devices per TCP node
```
```
RTU: Up to 254 Modbus RTU devices
```
Table 3. For KNX to BACnet server
Element 100 version 250 version 600 version 1200 version 3000 version
Maximum number of BACnet objects 100 250 600 1200 3000
```
Maximum number of BACnet subscriptions (COV)
```
requests 200 500 1200 2400 6000
Maximum number of KNX main group addresses 100 250 600 1200 3000
Maximum number of KNX associations 200 500 1200 2400 6000
Type of BACnet devices supported Those supporting communication with BACnet/IP and MS/TP
Table 4. For BACnet Client to KNX
Element 100version250version600version1200version3000version
Maximum number of communication objects 100 250 600 1200 3000
Maximum number of main group addresses 100 250 600 1200 3000
Maximum number of KNX associations 200 500 1200 2400 6000
Type of BACnet devices supported Those supporting communication with BACnet/IP and MS/TP
Maximum number of BACnet devices 256
Table 5. For KNX to ASCII
Element 100 version 250 version 600 version 1200 version 3000 version
Maximum number of KNX main group addresses 100 250 600 1200 3000
Maximum number of KNX associations 200 500 1200 2400 6000
Maximum number of ASCII registers 100 250 600 1200 3000
```
ASCII link layers supported Those supporting communication with ASCII client with simple messages through aTCP/IP or serial connection (EIA-232 and EIA-485)
```
IN701-KNX Series Gateway Capacity
Page 10 of 46 USER MANUAL Version 1.4.7
10. KNX Interface
10.1. Description
The KNX interface of the gateway connects directly to the KNX bus performing as one more device in the KNX
system. In this way, the gateway can receive, manage, and send all telegrams related to its configuration to the
KNX bus.
When the gateway receives write telegrams of KNX group addresses associated with internal datapoints, it sends
the corresponding messages to the internal system, keeping both systems synchronized at every moment.
When the gateway detects a change in a signal of the other side's protocol, it sends a write telegram to the KNX
```
bus (addressed with the group address associated with the corresponding group object), keeping both systems
```
synchronized at every moment.
Since the gateway continuously checks the KNX bus status, if a bus drop-down is detected, for example, due to a
failure in the bus power supply, once the KNX bus is restored, the gateway will send read telegrams to all group
objects marked with "Ri." The behavior of each point in the gateway is determined by the flags configured for the
point.
10.2. Points Definition
Every internal communication object has the following KNX properties:
Property Description
Description Descriptive information about the communication object or signal.
```
Signal Signal description. Only for informative purposes (it facilitates the identification of the signal).
```
DPT KNX Datapoint Types used to code the signal value. It will depend on the type of signal associated with the external system inevery case. In some integrations, it is selectable while, in others, it is fixed due to the intrinsic characteristics of the signal.
```
Group KNX group to which the point is associated. It is also the group to which the read (R), write (W), transmit (T), update (U), andread on init (Ri) flags are applied. It is the sending group.
```
Additional
addresses Addresses allowed to write on the group object, apart from the main group address.
R Read. If this flag is activated, read telegrams of this group address will be accepted.
```
Ri Read on Init. If this flag is activated, the object will trigger the corresponding read request (on the associated group address)on initialization.
```
W Write. If this flag is activated, write telegrams on this group object will be accepted.
T Transmit. If this flag is activated, when the group object value changes due to a change in the external system, a write telegramof the associated group address will be sent to the KNX bus.
```
U Update. If this flag is activated, update telegrams (response to read telegrams) on this group object will be accepted.
```
```
Active If activated, the point will be active in the Intesis gateway; if not, its behavior will be as if it was not defined. This propertyallows deactivating points without deleting them, keeping them for future use if needed.
```
KNX Interface IN701-KNX Series
USER MANUAL Version 1.4.7 Page 11 of 46
11. Modbus Interface
11.1. General Description
The Modbus protocol is an application-layer messaging protocol developed by Modicon in 1979. It is used to
establish master-slave/client-server communication between intelligent devices over different types of buses or
networks. The Intesis gateway supports Modbus TCP and RTU.
Modbus is a request/reply protocol and offers services specified by function codes. Modbus function codes are
```
elements of Modbus request/reply PDUs (Protocol Data Unit).
```
11.2. Modbus Server Interface
11.2.1. Description
The gateway acts as a server device in its Modbus interface, which can be:
• The Ethernet port for Modbus TCP.
• The EIA-485/EIA-232 ports for Modbus RTU.
NOTICE
Modbus RTU and TCP modes can be active in the gateway one at a time or both simultaneously.
To access the gateway's points and resources from a Modbus client device, you must specify as Modbus register
addresses those configured inside the gateway corresponding to the signals on the field device protocol.
11.2.2. Functions Supported
NOTICE
This part is common for both Modbus TCP and Modbus RTU.
Table 6. Modbus functions
# Function Read/Write
01 Read Coils R
02 Read Discrete Inputs R
03 Read Holding Registers R
04 Read Input Registers R
05 Write Single Coil W
06 Write Single Register W
15 Write Multiple Coils W
16 Write Multiple Registers W
If poll records are used to read or write more than one register, the range of addresses requested must contain
```
valid addresses; if not, the Intesis gateway will return the corresponding Modbus error code.
```
All registers are of 2 bytes, even if they are associated with signals of bit type on theKNX side. Its content is
expressed in MSB .. LSB.1
Modbus error codes are fully supported. They are sent whenever a non-valid Modbus action or address is
required.
```
1MSB: most significant bit; LSB: less significant bit
```
IN701-KNX Series Modbus Interface
Page 12 of 46 USER MANUAL Version 1.4.7
11.2.3. Modbus RTU
Using the configuration tool, you can set these parameters:
• Baud rate: 1200, 2400, 4800, 9600, 19200, 38400, 56700 and 115200 bps.
• Data Bits: 8 bits.
• Parity: none, even, or odd.
• Stop Bits: 1 and 2 bits.
• Modbus server address.
```
• Physical connection (EIA-232 or EIA-485).
```
IMPORTANT
• EIA-232 connector uses RX, TX, and GND lines.
• EIA-485 connector uses B-, A+, and SNGD.
11.2.4. Modbus TCP
Modbus TCP communication is characterized basically by the embedding of the Modbus RTU protocol into
TCP/IP frames, which allows faster communication and a longer distance between client and server devices in
comparison with RTU communication over a serial line. Another benefit is using common TCP/IP infrastructure in
buildings and transmitting over WAN or the internet. It also allows the coexistence of one or more clients and, of
course, one or more server devices in a given network, all interconnected through a TCP/IP-based network.
```
Use the configuration tool to configure the IP settings of the gateway (DHCP status, own IP, netmask, and default
```
```
gateway) and the TCP port.
```
NOTE
The default port is 502.
Modbus Server Interface IN701-KNX Series
USER MANUAL Version 1.4.7 Page 13 of 46
11.2.5. Modbus Server Interface Points Definition
```
The Modbus registers are fully configurable through the configuration tool; any point in the gateway can be
```
freely configured with the desired Modbus register address.
Every point defined in the gateway has the following Modbus features associated with it:
Feature Description
#Bits
• 1 bit
• 16 bits
• 32 bits
Data Coding
Format
• 16/32 unsigned
```
• 16/32 bits signed (one's complement – C1)
```
```
• 16/32 bits signed (two's complement – C2)
```
• 16/32 bits Float
• 16/32 bits Bitfields
• Error comm.
Byte Order
• Big Endian
• Little Endian
• Word Inverted Big Endian
• Word Inverted Little Endian
Register Address The Modbus register address inside the server device for the point.
Bit inside the
register
```
Bit inside the Modbus register (optional). The Intesis gateway allows bit decoding from generic
```
16 bits input/holding Modbus registers.
Some devices use the bit coding into 16 bits input/holding Modbus registers to encode digital
```
values. These registers are generally accessible using Modbus function codes 03 and 04 (read
```
```
holding/input registers).
```
Read/Write
0: Read
1: Write
2: Trigger
11.3. Modbus Client Interface
11.3.1. Description
The Intesis gateway acts as a client device in the Modbus TCP network, Modbus RTU client, or both.
IMPORTANT
Other Modbus devices connected to the network communicating with the gateway must always be
server devices.
The gateway supports communication with up to five Modbus TCP server devices.
For every defined point belonging to a particular Modbus TCP server device, a server address from 0 to 255
can also be freely configured. This feature offers great flexibility for installations. For example, when integrating
several Modbus RTU server devices connected in a serial line, with an RTU/TCP converter on top of this
serial line, it enables access to the RTU server points through TCP/IP. In this case, the RTU/TCP converter
```
communicating in TCP identifies the destination of the point (server address in the RTU network) by the contents
```
of the server address field.
Modbus TCP server devices are characterized by their IP address and predefined registers address map. This
address map specifies the address, type, and characteristics of the Modbus server device's internal points
```
(commonly called registers). These registers are accessible using the Modbus TCP protocol.
```
```
Communication parameters of the Intesis gateway (IP address, netmask, default router address, and TCP port)
```
are fully configurable to adapt to any IP network and server device.
IN701-KNX Series Modbus Client Interface
Page 14 of 46 USER MANUAL Version 1.4.7
The Modbus TCP protocol defines different function code types to read/write different register types from the
Modbus devices. It also defines different data formats to encode values.
```
Also, the data encoding used for 16 bits registers (big-endian or little-endian) can be configured in the Intesis
```
```
gateway. This is the byte order for data encoding (MSB..LSB or LSB..MSB)2. Although specified as big-endian in
```
the Modbus protocol specification, this data encoding varies depending on the manufacturer/type of server.
11.3.2. Points Definition
Every point defined in the Intesis gateway has the following Modbus features associated with it:
Feature Description
Modbus device
Modbus TCP device to which belongs the point, from a list of Modbus TCP server devices that can
```
be defined in the Intesis gateway (up to 5).
```
For every defined Modbus TCP server device, a virtual signal is automatically created in the Intesis
gateway to report the communication with the device. Like the rest of the points, this signal is
also available from the field device interface.
Function code
Read func.
Write func.
01 Read Coils
02 Read Discrete Inputs
03 Read Holding Registers
04 Read Input Registers
05 Write Single Coil
15 Write Single Register
06 Write Multiple Coils
16 Write Multiple Register
#Bits Number of bits to be used by this signal.
Data coding
format
• 16/32/48/64 bits unsigned
```
• 16/32/48/64 bits signed (one’s complement – C1)
```
```
• 16/32/48/64 bits signed (two’s complement – C2)
```
• 16/32/48/64 bits Float
• 16/32/48/64 bits Bitfields
• Error comm
Byte order
• Big-endian
• Little-endian
• Word inverted big-endian
• Word inverted little-endian
Register
address The Modbus register address inside the server device for the point.
Bit inside the
register
```
Bit inside the Modbus register (optional). The Intesis gateway allows bit decoding from generic 16
```
bits input/holding Modbus registers.
NOTICE
Some devices use the bit coding into 16 bit input/holding Modbus register to
encode digital values. These registers are generally accessible using Modbus
```
function codes 03 and 04 (read holding/input registers).
```
```
2MSB: most significant bit; LSB: less significant bit
```
Modbus Client Interface IN701-KNX Series
USER MANUAL Version 1.4.7 Page 15 of 46
12. BACnet Interface
12.1. General Description
BACnet is a solid standard with many detailed concepts, but for this manual purposes, we will focus on the two
most fundamental concepts:
• BACnet client, which is the device that sends service requests to the server.
• BACnet server, which is the device that performs the requested service and reports the result back to the
client.
BACnet server devices are represented in the form of devices holding objects. Usually, every physical device
corresponds to a logical one. The objects can be of different types depending on the data and functionality they
```
represent: Analog input, Analog output, Digital input, etc.
```
NOTE
• Output objects are meant to be written from the BACnet network to the device.
• Input objects are meant to offer status information on the BACnet device.
• Value objects are bidirectional.
Every object has different properties. The most meaningful one is the Present_Value property, which indicates
the real value of the object. Also, the gateway uses this property to read and write values. Every object of the
same type in a device is identified with its associated object instance.
IN701-KNX Series BACnet Interface
Page 16 of 46 USER MANUAL Version 1.4.7
12.2. BACnet Client
12.2.1. Description
The gateway implements a single BACnet object of its own: its BACnet Device Object, which contains its BACnet
```
Device Identifier and basic properties of the gateway as a BACnet device (name, firmware version, etc.).
```
NOTICE
When acting as a client device, the Intesis gateway is classified under the device profile of a BACnet
```
Application Specific Controller (B-ASC). For further details, check out the product website for the
```
BACnet client PIC statements.
The gateway emulates a client device in the BACnet system.
These are the possible BACnet objects supported by the Intesis gateway:
Object Type Property Description
Analog Input Present Value Analog signal, for example, Ambient temperature
Analog Output Present Value Analog signal
Analog Value Present Value Analog signal, for example, Temperature set pointvalue
Binary Input Present Value Digital signal, for example, ON/OFF status
Binary Output Present Value Digital signal, for example, ON/OFF command
Binary Value Present Value Digital signal, for example, ON/OFF status/command
Multistate
Input Present Value
Multistate signal, for example, Working mode
status
Multistate
Output Present Value Multistate signal
Multistate
Value Present Value
Multistate signal, for example, Working mode
command
Accumulator Present Value
Loop Present Value
Every signal is identified with its associated Device + Object Type + Object Instance.
IMPORTANT
Though BACnet/IP and BACnet MS/TP physical layers are supported, only one physical layer can be
used at a time, i.e., if communicating to BACnet using BACnet/IP, BACnet MS/TP cannot be used, and
vice versa.
NOTE
Using the configuration tool, it’s possible to scan the BACnet network for available devices and
their objects, which can later be directly added to your configuration. This feature facilitates the
configuration process, avoiding entering them manually.
BACnet Client IN701-KNX Series
USER MANUAL Version 1.4.7 Page 17 of 46
12.2.2. Points Definition
Every point defined in the Intesis gateway has the following BACnet features associated with it:
Feature Description
BACnet Device
```
BACnet device to which the point belongs (a list of 256
```
```
BACnet devices can be defined in the Intesis gateway).
```
For every BACnet device defined, a virtual signal is
created automatically in the gateway to report the
communication status with the BACnet device. Like the
rest of the points, this signal is also available from the
KNX interface.
BACnet object type
• AI: Analog Input
• AO: Analog Output
• AV: Analog Value
• DI: Digital Input
• DO: Digital Output
• DV: Digital Value
• MI: Multistate Input
• MO: Multistate Output
• MV: Multistate Value
• LOOP: Loop
• ACUM: Accumulator
IMPORTANT
Please read the documentation of
the BACnet devices you're willing to
integrate to know their object types.
BACnet object instance
BACnet object instance for the point on the external
BACnet device.
IMPORTANT
Please read the documentation of
the BACnet devices you're willing to
integrate to know their object types.
IN701-KNX Series BACnet Client
Page 18 of 46 USER MANUAL Version 1.4.7
12.3. BACnet Server
12.3.1. Description
NOTICE
When the Intesis gateway acts as a server device, it is classified under the device profile of a BACnet
```
Advanced Application Controller (B-AAC). For further details, check out the product website for the
```
BACnet client PIC statements.
Using the Intesis MAPS configuration tool, you can configure the object type associated with the signal on the
other protocol.
To facilitate the translation towards BACnet, the following object type options are available:
Object Type ID
Analog-Input 0
Analog-Output 1
Analog-Value 2
Binary-Input 3
Binary-Output 4
Binary-Value 5
Calendar 6
Device 8
Multistate-Input 13
Multistate-Output 14
Multistate-Value 19
Notification-Class 15
Schedule 17
Trend-Log 20
Trend-Log-Multiple 27
Every signal of the Intesis gateway can have several objects. These objects and their properties can be configured
with the configuration tool.
Depending on the field device protocol, you can define the signals using one of the following options:
• Configuring them manually for each or multiple signals at the time.
• Importing a file with the signals of the field devices.
• Scanning the network of the devices if this is supported.
Example 1. Signals compatibility
You can choose an object from the BACnet server column that is compatible with this signal. For example, a write
```
signal in a KNX field device can be an input object type on the BACnet server side; a read and write object can be
```
a value object type, etc.
NOTICE
The configuration tool provides default templates that make this signals assignment process easier.
Also, you only have to click the Check table button on the bottom right corner of the window to
know if everything is correct or if there's some mistake. The project is also automatically checked
before you transfer it to the gateway.
BACnet Server IN701-KNX Series
USER MANUAL Version 1.4.7 Page 19 of 46
All objects definition, BIBBs, and details about the implementation can be found on the BACnet server PICS on
the product website.
12.3.2. BACnet/IP
```
The UDP communication port is the main setup parameter for BACnet/IP, besides basic IP settings (IP, netmask,
```
```
default gateway). The Intesis gateway uses the 47808 (0xBAC0) port by default, which you can change through
```
the configuration tool.
When using BACnet/IP, the gateway can also act as a foreign device to communicate with devices in another
```
network domain. Alternatively, you can set it as a BBMD (Bacnet/IP Broadcast Management Device). This
```
functionality facilitates the communication of devices placed in other networks with the devices in the gateway
network.
IMPORTANT
BACnet/IP and BACnet MS/TP communication can not be used simultaneously.
12.3.3. BACnet MS/TP
```
When you choose BACnet MS/TP (serial communication), you have to use the Intesis MAPS configuration tool to
```
associate the gateway with a MAC address within the MS/TP network segment.
```
Baud rates supported for MS/TP line are: 9600, 19200, 38400, 76800, 115200, or Autobauding (autodetect).
```
Standard wiring guidelines for EIA-485 apply to the BACnet MS/TP line.
IMPORTANT
BACnet MS/TP and BACnet/IP communication cannot be used simultaneously.
IN701-KNX Series BACnet Server
Page 20 of 46 USER MANUAL Version 1.4.7
13. ASCII Interface
13.1. Description
```
The Intesis gateway can be connected to any ASCII-enabled device via its EIA-232, EIA-485, or TCP/IP (Ethernet)
```
connectors, supervising and controlling its internal points through this interface by using simple ASCII messages.
When the gateway receives a new value for a point from the other protocol system, its ASCII interface sends the
corresponding message indicating the new value to the ASCII system.
IMPORTANT
• This functionality is only possible if the point is configured to send these "spontaneous messages."
If it doesn't, the new value will remain available in the gateway for a later poll of the ASCII system.
• You can configure this behavior for every gateway point through the configuration tool.
13.2. ASCII Serial
The ASCII interface and the ASCII master device serial connection type must be the same.
13.3. ASCII TCP
The Intesis gateway allows the configuration of:
```
• TCP port (5000 by default).
```
• IP address.
• Subnet mask.
• Default router address.
13.4. Address Map
```
The ASCII address map is fully configurable; any point in the gateway can be freely configured with the desired
```
internal register address.
ASCII Interface IN701-KNX Series
USER MANUAL Version 1.4.7 Page 21 of 46
13.5. Points Definition
Every point defined in the gateway has the following ASCII features associated with it:
Feature Description
Signal Signal or point description. Only for information purposes at the user level.
ASCII string Defines the ASCII string that will be used to access this register.Max. length: 32 characters
Read/Write
```
Defines the current function (read, write, or both) to be used from the ASCII side with this
```
register. It can’t be configured as it is directly set when selecting the current BACnet type
object.
Function Read Write Read/Write
BACnet object
Analog input
Binary input
Multistate input
Loop
Accumulator
Analog output
Binary output
Multistate output
Analog value
Binary value
Multistate value
Spontaneous Determines the creation and sending of an ASCII message when any point from the BACnetside changes its value.
A/D
```
(Analog/
```
```
Digital)
```
Defines the current variable type for this register from the ASCII side. It can’t be configured
as it is directly set when selecting the current BACnet type object.
Type Analog Digital
BACnet object
Analog input
Analog output
Analog value
Multistate input
Multistate output
Multistate value
Loop
Accumulator
Binary input
Binary output
Binary value
IN701-KNX Series Points Definition
Page 22 of 46 USER MANUAL Version 1.4.7
13.6. Messages
The ASCII side communicates through simple ASCII messages.
NOTE
You can configure these messages to match the ASCII master device using the configuration tool.
The ASCII messages used to read/write points have the following format:
Message to read a point value:
ASCII_String?\r Where:
• ASCII_String is the string indicating the point address inside the Intesis gateway.
```
• ? is the character used to indicate that this is a reading message (configurable with
```
```
Intesis MAPS).
```
```
• \r is the carriage return character (HEX 0x0D, DEC 13).
```
Message to write a point value:
```
ASCII_String=vv\r Where:
```
• ASCII_String is the string indicating the point address inside the Intesis gateway.
```
• = is the character used to indicate that this is a reading message (configurable with
```
```
Intesis MAPS).
```
• vv is the current point value.
```
• \r is the carriage return character (HEX 0x0D, DEC 13).
```
Message about a point value: sent spontaneously when the Intesis gateway receives a change from the BACnet
side or in response to a previous poll for the point.
```
ASCII_String=vv\r Where:
```
• ASCII_String is the string indicating the point address inside the Intesis gateway.
• = is the character used to indicate where the point data starts.
• vv is the current point value.
```
• \r is the carriage return character (HEX 0x0D, DEC 13).
```
Messages IN701-KNX Series
USER MANUAL Version 1.4.7 Page 23 of 46
14. Mounting
IMPORTANT
Before mounting, please ensure that the chosen installation place preserves the gateway from direct
solar radiation, water, high relative humidity, or dust.
IMPORTANT
Ensure the gateway has sufficient clearances for all connections when mounted. See Dimensions.
NOTE
Mount the gateway over a DIN rail, preferably inside a grounded metallic industrial cabinet.
DIN rail mounting
1. Fit the gateway’s top-side clips in the upper edge of the DIN rail.
2. Press the low side of the gateway gently to lock it in the DIN rail.
3. Make sure the gateway is firmly fixed.
NOTE
For some DIN rails, to complete step 2, you may need a small screwdriver or similar to pull the
bottom clip down.
IN701-KNX Series Mounting
Page 24 of 46 USER MANUAL Version 1.4.7
15. Connections
Please find in the following table the gateway's ports and their use depending on the configuration.
Configuration Port A Port B EIA-485 Port B EIA-232 Ethernet
IN-MBS-KNX KNX Modbus RTU Modbus RTU Modbus TCP andConsole*
IN-KNX-MBM KNX Modbus RTU NA Modbus TCP andConsole*
IN-BAC-KNX KNX BACnet MS/TP NA BACnet/IP and Console*
IN-KNX-BAC KNX BACnet MS/TP NA BACnet/IP and Console*
IN-ASCII-KNX KNX ASCII ASCII ASCII TCP and Console*
*Console: you can use the Ethernet port to connect the gateway to the PC for configuration purposes.
The following table shows the pinout correspondence for each serial port.
Port A Pin-out Port B Pin-out
A4 - B1 A+
A3 + B2 B-
A1 and A2 NA B3 SNGD
15.1. Power Supply
NOTE
The way to supply power to the gateway is the same for all applications.
CAUTION
Before manipulating any equipment, including this gateway, ensure the system is disconnected from
the power source.
```
The power supply connector is a green pluggable terminal block (three poles) labeled as Power.
```
IMPORTANT
```
• Use SELV-rated NEC class 2 or limited power source (LPS) power supply.
```
• Connect the gateway's ground terminal to the installation grounding.
• A wrong connection may cause earth loops that can damage the Intesis gateway and/or any other
system equipment.
Apply the voltage within the admitted range and of enough power:
• For DC: 9 .. 36 VDC, Max: 260 mA
```
• For AC: 24 VAC (+/-10 %), 50-60 Hz, Max: 70 mA
```
Recommended voltage: 24 VDC, Max: 70 mA
Connections IN701-KNX Series
USER MANUAL Version 1.4.7 Page 25 of 46
IMPORTANT
• When using a DC power supply: Respect the polarity labeled on the power connector for the
positive and negative wires.
• When using an AC power supply: Ensure the same power supply is not powering any other
device.
Once powered, the Run LED of the gateway will turn on.
IN701-KNX Series Power Supply
Page 26 of 46 USER MANUAL Version 1.4.7
15.2. Connection Diagrams for each Application
Look for the appropriate diagram depending on your application:
Figure 6. KNX to Modbus server
Connection Diagrams for each Application IN701-KNX Series
USER MANUAL Version 1.4.7 Page 27 of 46
Figure 7. Modbus client to KNX
IN701-KNX Series Connection Diagrams for each Application
Page 28 of 46 USER MANUAL Version 1.4.7
Figure 8. KNX to BACnet server
Connection Diagrams for each Application IN701-KNX Series
USER MANUAL Version 1.4.7 Page 29 of 46
Figure 9. BACnet client to KNX
IN701-KNX Series Connection Diagrams for each Application
Page 30 of 46 USER MANUAL Version 1.4.7
Figure 10. KNX to ASCII
Connection Diagrams for each Application IN701-KNX Series
USER MANUAL Version 1.4.7 Page 31 of 46
15.3. Connection to KNX
NOTE
The way to connect the KNX bus to the gateway is the same for all applications.
• Port A / KNX
```
Connect the KNX bus to connectors A3 (+) and A4 (-) of the gateway's Port A.
```
IMPORTANT
Respect polarity.
15.4. Connection to BACnet
• Ethernet connection for BACnet/IP:
Connect the BACnet/IP network to the Ethernet port of the gateway. The correct cable to use depends on
where the gateway is connected:
– Connecting directly to a BACnet/IP device: use a crossover Ethernet UTP/FTP CAT5 or higher cable.
– Connecting to a hub or switch of the LAN of the building: use a straight Ethernet UTP/FTP CAT5 or higher
cable.
IMPORTANT
If there is no response from the BACnet devices to the frames sent by the gateway:
– Check that they are operative and reachable from the network connection used by the gateway.
– Check the gateway Ethernet interface sending Pings to its IP address using a PC connected to
the same Ethernet network.
– Contact the network admin to be sure there are no limitations regarding UDP communication or
ports blocked.
IMPORTANT
If communicating through the LAN of the building, contact the network administrator and make
sure traffic on the used port is allowed through all LAN paths.
NOTE
After powering up the Intesis gateway for the first time, DHCP will be enabled for 30 seconds.
After that time, if a DHCP server provides no IP, the default IP 192.168.100.246 will be set.
• Port B EIA-485 connection for BACnet MS/TP:
```
Connect the EIA-485 bus to connectors B1 (A+), B2 (B-), and B3 (SNGD) to the Port B of the gateway.
```
IMPORTANT
Respect the polarity.
IN701-KNX Series Connection to KNX
Page 32 of 46 USER MANUAL Version 1.4.7
IMPORTANT
Remember the characteristics of the standard EIA-485 bus:
– Maximum distance of 1200 meters.
– Maximum of 32 devices connected to the bus.
– A termination resistor of 120 Ω is needed at each end of the bus. The gateway has an internal
bus biasing circuit already incorporating the termination resistor. It can be enabled using the
DIP switches:
• Position 1:
```
ON: 120 Ω termination active.
```
```
OFF: 120 Ω termination inactive.
```
• Position 2 and 3:
```
ON: Polarization active.
```
```
OFF: Polarization inactive.
```
IMPORTANT
If the termination resistor is enabled and you install the gateway at one of the ends of the bus, do
not install an additional termination resistor at that end.
Connection to BACnet IN701-KNX Series
USER MANUAL Version 1.4.7 Page 33 of 46
15.5. Connection to Modbus
• Ethernet port for Modbus TCP and Console connection:
Connect the communication cable from the Modbus TCP network to the Ethernet port of the gateway.
IMPORTANT
Use a straight Ethernet UTP/FTP CAT5 or higher cable.
IMPORTANT
If communicating through the LAN of the building, contact the network administrator and make
sure traffic on the used port is allowed through all LAN paths.
NOTE
After powering up the Intesis gateway for the first time, DHCP will be enabled for 30 seconds.
After that time, if a DHCP server provides no IP, the default IP 192.168.100.246 will be set.
• Port B EIA-485 connection for Modbus RTU:
```
Connect the EIA-485 bus to connectors B1 (A+), B2 (B-), and B3 (SNGD) of the gateway's Port B.
```
IMPORTANT
Respect the polarity.
IMPORTANT
Remember the characteristics of the standard EIA-485 bus:
– Maximum distance of 1200 meters.
– Maximum of 32 devices connected to the bus.
– A termination resistor of 120 Ω is needed at each end of the bus. The gateway has an internal
bus biasing circuit already incorporating the termination resistor. It can be enabled using the
DIP switches:
• Position 1
```
ON: 120 Ω termination active.
```
```
OFF: 120 Ω termination inactive.
```
• Position 2 and 3
```
ON: Polarization active.
```
```
OFF: Polarization inactive.
```
– If the termination resistor is enabled and you install the gateway at one of the ends of the bus,
do not install an additional termination resistor at that end.
• Port B EIA-232:
Connect the serial cable EIA-232 from the external serial device to the EIA-232 connector of the gateway Port
B.
NOTE
```
This is a DB9 male (DTE) connector that only uses the TX, RX, and GND.
```
IMPORTANT
Respect the maximum distance of 15 meters.
IN701-KNX Series Connection to Modbus
Page 34 of 46 USER MANUAL Version 1.4.7
15.6. Connection to ASCII
• Ethernet port for ASCII TCP:
Connect the communication cable from the ASCII TCP network to the Ethernet port of the gateway.
IMPORTANT
Use a straight Ethernet UTP/FTP CAT5 or higher cable.
IMPORTANT
If communicating through the LAN of the building, contact the network administrator and make
sure traffic on the used port is allowed through all LAN paths.
NOTE
After powering up the Intesis gateway for the first time, DHCP will be enabled for 30 seconds.
After that time, if a DHCP server provides no IP, the default IP 192.168.100.246 will be set.
• Port B EIA-485 connection for ASCII serial:
```
Connect the EIA-485 bus to connectors B1 (A+), B2 (B-), and B3 (SNGD) to the Port B of the gateway.
```
IMPORTANT
Respect the polarity.
IMPORTANT
Remember the characteristics of the standard EIA-485 bus:
– Maximum distance of 1200 meters.
– Maximum of 32 devices connected to the bus.
– A termination resistor of 120 Ω is needed at each end of the bus. The gateway has an internal
bus biasing circuit already incorporating the termination resistor. It can be enabled using the
DIP switches:
• Position 1:
```
ON: 120 Ω termination active.
```
```
OFF: 120 Ω termination inactive.
```
• Position 2 and 3:
```
ON: Polarization active.
```
```
OFF: Polarization inactive.
```
– If the termination resistor is enabled and you install the gateway at one of the ends of the bus,
do not install an additional termination resistor at that end.
• Port B EIA-232 for ASCII serial:
Connect the serial cable EIA-232 from the external serial device to the EIA-232 connector of the gateway Port
B.
NOTE
```
This is a DB9 male (DTE) connector that only uses the TX, RX, and GND.
```
IMPORTANT
Respect the maximum distance of 15 meters.
Connection to ASCII IN701-KNX Series
USER MANUAL Version 1.4.7 Page 35 of 46
15.7. Console and USB Connections
• Console port:
Connect a USB Mini-B type cable from the gateway console port to a computer running the configuration tool.
NOTICE
With this software tool, you can configure and monitor the gateway.
NOTE
If your computer has an Ethernet port, you can also use the Ethernet port of the gateway to
connect both.
• USB port:
TIP
You can connect a USB storage device to the USB port of the gateway to store logs.
IMPORTANT
The USB port doesn't support HDD devices.
IN701-KNX Series Console and USB Connections
Page 36 of 46 USER MANUAL Version 1.4.7
16. Set-up Process with the Configuration Tool
16.1. Prerequisites
For this integration, you need:
• The items delivered by HMS Networks:
– The Intesis IN701KNX⁎⁎⁎0000 protocol translator gateway.
– A mini-type B USB to USB cable.
– Link to download the configuration tool.
– Product documentation.
• An operative KNX installation or device well connected to the KNX port A of the Intesis gateway.
• The respective client or server devices connected to either the EIA-485/EIA-232 Port B or to the Ethernet port.
16.2. Intesis MAPS: Configuration and Monitoring Tool
16.2.1. Introduction
To configure the gateway, you need a PC running Intesis MAPS. You can download this configuration tool from
```
https://www.intesis.com/products/intesis-maps#download.
```
Intesis MAPS is a Windows® compatible software explicitly developed to monitor and configure Intesis gateways.
NOTE
The following sections provide some primary and general information to configure this gateway.
Although Intesis MAPS is an easy-to-manage user-friendly tool, you may need more specific and
comprehensive information about the different parameters and how to configure them. If so, please
refer to these specific Intesis MAPS user manuals depending on the protocol you are working with:
• KNX
• BACnet
• Modbus
NOTICE
The Intesis MAPS user manual referring to ASCII protocol will come soon.
Set-up Process with the Configuration Tool IN701-KNX Series
USER MANUAL Version 1.4.7 Page 37 of 46
16.2.2. Template Selection
When opening the software, you will see the main window, called Getting started. Here you can select the
template for your application:
1. Click Create New Project in the left menu.
2. Select the appropriate template for your application. To filter the selection:
• Click on the protocol logos.
• Type the order code in the Order Code field,
• Check out the list to find the template you need.
Figure 11. The three possibilities for the template selection
3. Select the template and click Next or double-click it in the list.
IN701-KNX Series Intesis MAPS: Configuration and Monitoring Tool
Page 38 of 46 USER MANUAL Version 1.4.7
16.2.3. Connection Tab
1. Connect the gateway to your PC.
• Use the gateway's Ethernet port and an Ethernet CAT5 or higher cable.
• Use the Console port and a USB Mini-B type to USB A type cable.
2. On the Connection Type parameter, select the way you connected the gateway to your PC:
• Select IP if you are using the Ethernet port of the Intesis gateway.
NOTICE
The default password when connecting via IP is admin.
IMPORTANT
Make sure you have an internet connection.
NOTE
When using the IP connection, the gateway's name appears:
– In black: It is compatible with the selected template.
– In red: It is not compatible with the selected template.
• Select USB Port if you are using the Console port of the gateway.
NOTICE
No password is needed when connecting via USB.
3. Select your gateway from the Discovered Gateways list on the left.
4. Click Connect.
NOTE
If your Intesis gateway firmware doesn't match the selected template, a pop-up window will prompt
you to download the correct firmware.
When selecting IP as the connection type, two additional buttons will appear:
• Identify: Click the Identify button to make the gateway's LEDs blink for 10 seconds.
• Edit: Click the Edit button to open the Config IP settings window.
You can edit the IP Address, NetMask, and Default Gateway IP.
NOTE
These parameters can also be edited in the Configuration tab. See Connection.
Intesis MAPS: Configuration and Monitoring Tool IN701-KNX Series
USER MANUAL Version 1.4.7 Page 39 of 46
16.2.4. Configuration Tab
In the Configuration tab, you can configure general parameters and parameters for both protocol interfaces of
the Intesis gateway.
On the left side of the window, three submenus are shown:
• Submenu 1: General configuration parameters for the gateway.
• Submenus 2 and 3: BMS and Device respective protocols configuration parameters.
IN701-KNX Series Intesis MAPS: Configuration and Monitoring Tool
Page 40 of 46 USER MANUAL Version 1.4.7
16.2.5. Signals Tab
This menu lists all available KNX signals and the parameters for the other side's protocol.
NOTE
You can find more information on every parameter and how to configure it in the Intesis MAPS user
```
manual:
```
• Modbus
• KNX
• BACnet
Below the list of signals, these options are available:
• Active signals: Number of active signals in the list / Total number of signals in the list.
```
• Hide Disabled signals: Hide all disabled signals from the list (disabled by default).
```
• Edit Columns: Click this button to hide/show any column of the list.
• Import: Click this button to import the signals' configuration from an XLSX file. These signals can be added to
the existing ones or replace them.
• Export: Click this button to export the current signals' configuration to an XLSX file.
• AA: Increases or decreases the font size.
• Click the Check table button to review the signals' configuration.
NOTE
If any parameter on any signal is wrong, a message will pop up with specific information about the
error.
16.2.6. Receive/Send Tab
```
Send:
```
Once you have finished setting the parameters, you have to send the configuration to the gateway:
1. Click the Send button.
a. If the gateway is still factory-set, you will be prompted to save the project on your PC. Once saved, the
configuration is automatically sent to the gateway.
b. If you have already saved the project, the configuration is automatically sent to the gateway.
2. Connect again with the gateway after sending the file.
NOTICE
The gateway reboots automatically once the new configuration is loaded. This process may take
a few seconds.
Intesis MAPS: Configuration and Monitoring Tool IN701-KNX Series
USER MANUAL Version 1.4.7 Page 41 of 46
```
Receive:
```
Use this function to load the configuration of a gateway to Intesis MAPS.
TIP
This function may be helpful when you need to change some parameters of an already configured
gateway.
Once the configuration is completed and sent, the gateway is already operative. Even so, you should review that
everything works correctly by entering the Diagnostic tab.
IN701-KNX Series Intesis MAPS: Configuration and Monitoring Tool
Page 42 of 46 USER MANUAL Version 1.4.7
16.2.7. Diagnostic Tab
IMPORTANT
Connection with the gateway is required to use the diagnostic tools.
Figure 12. Diagnostic tab window. Find the ToolBox between the upper tabs bar and the Console view. Below it,
```
from left to right: Console viewer, Protocol viewers (one above the other), and the Signals viewer
```
```
ToolBox:
```
Use the tools section to:
• Microprocessor icon: Check the current hardware status of the gateway.
• LOG: Set Intesis MAPS in logging mode to record all the information present in the viewers and save it in a .zip
file.
• INFO?: Get some gateway information.
• RESET: Reset the gateway.
Intesis MAPS: Configuration and Monitoring Tool IN701-KNX Series
USER MANUAL Version 1.4.7 Page 43 of 46
NOTE
Depending on your screen resolution, the ToolBox icons may appear partially hidden behind the
Viewers window.
```
Viewers:
```
Intesis MAPS provides several viewers:
• A generic console viewer for general information about communications and the gateway status.
• A viewer for both protocols to check their current status.
• A signals viewers to simulate the BMS behavior or check the system's current values.
The layout of these viewers can be modified:
• Using the Select Diagnostics View option from the View menu:
NOTE
Layouts 3 and 4 offer two different tabbed options:
– Fixed console to the left and tabbed browser for the other viewers
– Full tabbed browser
• Clicking and dragging the border of a viewer. To do so, place the cursor over the edge of a viewer. On the
vertical edges, the cursor changes to to allow the adjustment of the width, and on the horizontal edges, the
cursor changes to to allow the adjustment of the height.
IN701-KNX Series Intesis MAPS: Configuration and Monitoring Tool
Page 44 of 46 USER MANUAL Version 1.4.7
17. Technical Specifications
```
Housing Plastic, type ABS (UL 94 V-0) / Color: light grey. RAL 7035
```
Mounting DIN rail EN60715 TH35
Terminal blocks
wiring
```
Solid wires or stranded wires (twisted or with ferrule) are allowed. Per terminal:
```
```
Millimeters: One core: 0.5 .. 2.5 mm2 / Two cores: 0.5 .. 1.5 mm2 / Three cores: not
```
allowed
```
Gauge: One core: 24 .. 11 AWG / Two cores: 24 .. 15 AWG / Three cores: not allowed
```
```
Power 1 x green pluggable terminal block (3 poles)
```
Ground, negative, and positive
• For DC: 9 to 36 VDC, Max: 180 mA
• For AC: 24 VAC +/-10 %, 50-60 Hz, Max: 70 mA
```
Recommended: 24 VDC, Max: 70 mA
```
Ethernet 1 x Ethernet RJ45 10/100BASE-T
```
Port A 1 x KNX orange pluggable terminal block (2 poles)
```
• A+, B-
2500 VDC isolation from other ports / KNX power consumption: 5 mA / Voltage rating: 29
VDC
```
1 x green pluggable terminal block (2 poles) (reserved for future use)
```
```
SW A 1 x DIP switch for Port A configuration (reserved for future use)
```
Port B 1 x serial EIA-232 DB9 male
```
Pinout from a DTE device / 1500 VDC isolation from other ports (except Port B: EIA-485)
```
```
1 x serial EIA-485 green pluggable terminal block (3 poles)
```
```
• A+, B-, SGND (reference ground or shield)
```
```
1500 VDC isolation from other ports (except Port B: EIA-232)
```
```
SW B 1 x DIP switch (3 position) for serial EIA-485 configuration:
```
Position 1:
• ON: 120 Ω termination active
• OFF: 120 Ω termination inactive
Position 2 and 3:
• ON: polarization active
```
• OFF: polarization inactive (default)
```
```
Battery Type: Manganese Dioxide Lithium button battery / Size: 20 mm x 3.2 mm (0.79" x 0.13") /
```
Capacity 3 V - 255 mA
Console port USB Mini-B type 2.0 compliant / 1500 VDC isolation
```
USB port USB A type 2.0 compliant / Only for USB flash storage devices (USB pen drive) / HDD
```
connection not allowed / Power consumption limited to 150 mA
Push buttons A and B buttons: Factory reset
Operational
conditions
Before serial number 000R05920, Temperature: 0… 60°C / 32.. 140°F
```
After serial number 000R05920 (included), Temperature: -10… 60°C / 14.. 140°F
```
```
Humidity: 5 .. 95% (No condensation)
```
LED indicators 10 x Onboard LED indicators:
1 x Power / 1 x Error / 2 x Ethernet / 2 x Port A / 2 x Port B / 1 x Button A / 1 x Button B
Technical Specifications IN701-KNX Series
USER MANUAL Version 1.4.7 Page 45 of 46
18. Dimensions
```
• Net dimensions (HxWxD)
```
```
Millimeters: 90 x 88 x 58 mm
```
```
Inches: 3.54 x 3.46 x 2.28"
```
IMPORTANT
Leave enough clear space to wire the gateway easily and for the subsequent manipulation of
elements.
IN701-KNX Series Dimensions
Page 46 of 46 USER MANUAL Version 1.4.7