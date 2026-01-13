

## Configuration Guide
## FOR KNX SYSTEM TO BACNET SERVER INTEGRATION
## Version 1.0.2
Publication date 2024-09-16
## ENGLISH

## Copyright © 2024 Intesis
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
- Introduction to Intesis MAPS ..................................................................................................... 1
- Prerequisites .......................................................................................................................... 2
- Installation ............................................................................................................................. 3
- First steps in Intesis MAPS ........................................................................................................ 4
4.1. Getting Started ................................................................................................................ 4
4.2. Latest News and Updates ................................................................................................... 6
- Create a New Project from a Template ........................................................................................ 8
- Saving, Opening, Importing, and Exporting the Project .................................................................. 9
- Main Menu Overview ............................................................................................................. 12
- Connection Tab ...................................................................................................................... 13
- Configuration Tab ................................................................................................................... 15
9.1. General Configuration Menu ............................................................................................. 15
9.1.1. General Configuration ............................................................................................... 15
9.1.2. Connection ............................................................................................................. 16
9.1.3. Conversions ............................................................................................................ 17
9.1.3.1. Enabling Conversions in a Signal .......................................................................... 19
9.1.4. USB Host ................................................................................................................ 22
9.1.5. Time Configuration ................................................................................................... 24
9.1.6. Security ................................................................................................................. 25
9.1.7. Secondary BMS Protocol ........................................................................................... 25
9.1.8. Wiring Diagram ....................................................................................................... 27
9.2. BMS Protocol: BACnet ...................................................................................................... 28
9.2.1. BACnet Server General Configuration  .......................................................................... 28
9.2.2. Gateway Mode ........................................................................................................ 29
9.2.3. BACnet Advanced Configuration  ................................................................................. 29
9.2.3.1. Notification Class ............................................................................................. 30
9.2.3.2. Calendars ........................................................................................................ 33
9.2.3.3. Schedules ....................................................................................................... 34
9.2.3.4. Trend Logs ...................................................................................................... 38
9.3. Device Protocol Configuration ............................................................................................ 40
9.3.1. Device Protocol: KNX ................................................................................................ 40
9.3.1.1. Device Configuration ......................................................................................... 40
- Signals Tab ........................................................................................................................... 41
- Receive/Send Tab ................................................................................................................. 45
- Diagnostic Tab ...................................................................................................................... 46
## Configuration Guide
## Version 1.0.2

- Introduction to Intesis MAPS
Intesis MAPS
## ©
is a software tool for configuring and monitoring the Intesis® gateways. Intesis MAPS has been
designed and developed in-house, assuring an up-to-date tool to get all the potential of Intesis gateways.
## NOTE
Intesis MAPS is compatible with Windows® 7 and higher.
The design of this configuration tool focuses on four main pillars:
## •
A user-friendly interface.
## •
Multiple ways to create your project:
## –
From scratch, using a template.
## –
Importing data from your computer.
## –
Downloading the settings from an already configured gateway.
## •
Full linkage between the control system and the device installation signals.
## •
Real-time monitoring of the device network.
Introduction to Intesis MAPSConfiguration Guide
Version 1.0.2Page 1 of 48

## 2. Prerequisites
To configure the gateway, you need:
## •
The items supplied by HMS Networks:
## –
Intesis IN701KNX⁎⁎⁎0000 gateway
## NOTE
⁎⁎⁎ defines the Intesis gateway capacity.
## –
Gateway documentation:
## •
Installation guide
## •
User manual
## –
USB Mini-B type to USB A type cable to connect the gateway and the computer.
## NOTE
You can use an Ethernet cable instead (not included).
## •
A computer to run the configuration tool Intesis MAPS.
## NOTE
## Requirements:
## –
Windows 7 or higher
## –
Hard disk free space: 1 GB
## –
## RAM: 4 GB
Configuration GuidePrerequisites
Page 2 of 48Version 1.0.2

## 3. Installation
Downloading the software
-  Enter the Intesis MAPS webpage.
-  Click the Download now button. The page will scroll down to the download form.
-  Fill out the form.
## NOTE
You can review the privacy policy section for more information about how HMS processes the
form data.
-  Click the Download button.
-  A .zip file will be downloaded to your computer.
Installing the software
-  Click the .zip file to open it.
-  Double-click the EXE file.
-  The Intesis MAPS Setup Wizard will guide you through the steps required to install Intesis MAPS on your
computer:
a.  Read the license agreement and select I Agree.
b.  Select the installation folder.
-  Once the installation is completed, click the Close button.
InstallationConfiguration Guide
Version 1.0.2Page 3 of 48

- First steps in Intesis MAPS
Upon launching Intesis MAPS, you will be greeted with the home screen. This window is divided into two
sections: The Getting Started column on the left and the Latest News and Updates section in the main body.
Figure 1. Intesis MAPS home screen
## 4.1. Getting Started
This section allows direct access to some of the most commonly used features of Intesis MAPS. These are:
## •
## News:
## –
Latest News and Updates: Allows you to return to the Home section after moving to another section.
## •
## Start:
## –
Create New Project: Leads to the New Project section.
## NOTE
To know more about creating a new project, consult the Create a New Project from a Template
## (page 8).
## –
Load Project: Opens a file browser to select an Intesis MAPS project file (.ibmaps file) to load.
## NOTE
For more information about file managing, consult the Saving, Opening, Importing, and
Exporting the Project (page 9) section.
Configuration GuideFirst steps in Intesis MAPS
Page 4 of 48Version 1.0.2

– Get Project from Device: Obtain the project file directly from a gateway, which is what device stands for in
this case. To do so, connect the gateway to your PC and click the Import Project button.
## NOTE
For more information on connecting the gateway to your PC, consult the Connection Tab (page
13) section.
–Config IP settings: This section lists the discovered devices in the network. Select a gateway from the list to
check its properties and to gain direct access to the Identify and Edit functions.
## NOTE
These two functions are covered in the Connection Tab (page 13) section.
– Update Gateway Firmware: Connect to the gateway and update its firmware.
## NOTE
For more information on connecting the gateway to your PC, consult the Connection Tab (page
13) section.
## NOTE
Once a project has been loaded, a firmware manager is also available through the Tools -
Firmware option in the top menu.
– Import Project From USB Host: Opens a file browser to select an Intesis MAPS project file in USB MAPS
Project format (.exmaps) to load.
## NOTE
For more information about file managing, consult the Saving, Opening, Importing, and
Exporting the Project (page 9) section.
•Recent: A list of up to the last five projects loaded is available here. To load one of these last projects, click on
its name.
•Import:
– Import Project From Linkbox: This special function allows the use of old LinkBox projects in Intesis MAPS. A
list of supported Linkbox projects is available through the Available Linkbox Projects button. If the Linkbox
project you want to import is supported, click the Browse button to locate its corresponding folder and then
click the Select Folder button. The dialog will show the project information, including its status as an Intesis
MAPS-supported project. Click the Open button to import the project.
•Language:
– Select language: There are different language options available for the Intesis MAPS interface. To change the
language, select it and click the Save button. To apply the new language configuration, close and reopen
Intesis MAPS.
Getting StartedConfiguration Guide
Version 1.0.2Page 5 of 48

4.2. Latest News and Updates
This section contains useful information related to Intesis MAPS.
Through this section, you can:
- Get access to an Intesis MAPS online course in the top section.
- Get information about features under consideration for implementation, planned, or recently launched in the
features board of the middle section.
Figure 2. Intesis MAPS Features board
## NOTE
Click a feature to expand it and rate it. To share a feature, expand it, click the  icon, and click on
Copy private link.
Configuration GuideLatest News and Updates
Page 6 of 48Version 1.0.2

This board also gives the option to submit ideas and suggestions for future features. To submit an idea, click
the  button and fill out the form.
Figure 3. Intesis MAPS feedback form
## •
You can also enter the HMS Support Portal by clicking the HMS Support Portal button at the bottom section.
Latest News and UpdatesConfiguration Guide
Version 1.0.2Page 7 of 48

- Create a New Project from a Template
-  Open Intesis MAPS.
-  Click Create New Project in the Getting started menu on the left.
You can create a project from scratch using a template. To find the appropriate template, filter the search
by:
## •
Clicking BACnet on the protocol logos.
## •
Typing the order code IN701KNXxxx0000 in the Order Code field.
## NOTE
The order code is printed on the silver label placed on the gateway's right side.
## •
Looking for the Project Name on the list: IN-BAC-KNX.
Figure 4. Three possibilities for the template selection
-  Select the desired template.
-  Click Next or double-click the template on the list.
## NOTE
Templates are just a starting point for your integration. Depending on the type of integration, you
may have to modify some parameters.
Configuration GuideCreate a New Project from a Template
Page 8 of 48Version 1.0.2

- Saving, Opening, Importing, and Exporting the Project
## NOTE
This topic describes processes regarding Intesis MAPS files and the Intesis MAPS software.
Alternatively, it is also possible to load an Intesis MAPS project from a USB flash drive to the gateway
or load the configuration of a gateway to a USB flash drive by configuring and using the gateway's
buttons. For more information, see USB Host (page 22).
While working on your project with Intesis MAPS, an asterisk appears on the Configuration tab, as shown in this
picture below:
Figure 5. The Configuration tab showing an asterisk
This asterisk reminds you that you have made changes to the project but have not saved them or sent the project
to the gateway yet. To know how to send your project to the gateway, see Receive/Send Tab (page 45).
## •SAVING YOUR INTESIS MAPS PROJECT
## IMPORTANT
Remember to save your project periodically to keep your changes.
## 1.  Click Project.
Figure 6. Project tab from the top menu
-  Click Save or Save As.
## TIP
Instead, you can use the shortcut Ctrl+S (Save) or Ctrl+Alt+S (Save As).
Saving, Opening, Importing, and Exporting the ProjectConfiguration Guide
Version 1.0.2Page 9 of 48

-  On the Save file menu, type a File name and select where to save the file.
## 4.  Click Save.
## NOTE
The file extension when saving your Intesis MAPS project is .ibmaps. This .ibmaps file must be
opened with Intesis MAPS; it cannot be loaded directly into the gateway.
## •
## OPENING AN INTESIS MAPS PROJECT FROM YOUR COMPUTER
## TIP
Double-click a .ibmaps file saved in your computer to automatically open it in Intesis MAPS.
## 1.  Click Project.
## 2.  Click Load.
-  On the emergent window, select the desired file from your computer.
## 4.  Click Open.
## •
## EXPORTING YOUR INTESIS MAPS PROJECT TO A USB FLASH DRIVE
## NOTE
Save your project as explained in the
Saving your Intesis MAPS (page 9) section above before
exporting. Otherwise, you will be prompted to do so when beginning the export process.
## 1.  Click Project.
-  Click Export as USB Host Project.
-  On the Save file dialog window, type a File name and select your USB flash drive.
## 4.  Click Save.
## NOTICE
When exporting your Intesis MAPS project to a USB flash drive, the file extension is .expmaps.
This .expmaps file can be either opened with Intesis MAPS or loaded directly into the gateway.
Configuration GuideSaving, Opening, Importing, and Exporting the Project
Page 10 of 48Version 1.0.2

## •
## IMPORTING A USB HOST PROJECT FROM A USB FLASH DRIVE TO INTESIS MAPS
## 1.  Click Project.
-  Click Import a USB Host Project.
-  On the Open file dialog window, select the desired .expmaps file from your USB flash drive.
## 4.  Click Open.
-  You will be prompted to save a .ibmaps file associated with the USB host project.
## NOTE
This .ibmaps file contains the USB host project information. If a saved project is already open
in MAPS, you will be prompted to save the .ibmaps project file associated with the imported
USB host project as a new file, or to overwrite the currently open .ibmaps file instead.
## NOTICE
When using a USB device to export or import your project, take into consideration:
## •
The gateway only supports USB flash drives. External HDDs are not supported.
## •
The gateway supports USB flash drives with FAT32 and exFAT file systems.
Saving, Opening, Importing, and Exporting the ProjectConfiguration Guide
Version 1.0.2Page 11 of 48

## 7. Main Menu Overview
Figure 7. Intesis MAPS main menu
The following sections provide an overview of the five tabs that compose the Intesis MAPS main menu. Through
these options, you will configure your project, send it to the gateway, and monitor that everything works fine
using the Diagnostic tab.
## TIP
Tooltip: Hover the cursor over a field, and a message will appear indicating the purpose of the
parameter.
Figure 8. Example of a tooltip
Configuration GuideMain Menu Overview
Page 12 of 48Version 1.0.2

## 8. Connection Tab
Figure 9. Connection tab window
-  Connect the gateway to your PC. Two possibilities are available:
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
Connection TabConfiguration Guide
Version 1.0.2Page 13 of 48

## 4.  Click Connect.
When selecting IP as the connection type, two additional buttons will appear:
## •
Identify: Click the Identify button to make the gateway's LEDs blink for 10 seconds.
## •
Edit: Click the Edit button to open the Config IP settings window.
You can edit the IP Address, NetMask, and Default Gateway IP.
## NOTE
These parameters can also be edited in the Configuration tab. See Connection (page 16).
Configuration GuideConnection Tab
Page 14 of 48Version 1.0.2

## 9. Configuration Tab
Find a menu with three options on the left side of the Configuration tab:
## •
General: Configure the general parameters of the gateway.
## •
BACnet Server: Configure the parameters for the building
management system (BMS) protocol.
## •
KNX: Configure the parameters for the device protocol.
## 9.1. General Configuration Menu
Figure 10. General configuration menu on the Configuration tab
Use this menu to configure some general parameters of the gateway.
## 9.1.1. General Configuration
•Gateway Name: Type a descriptive name for your gateway (max. 32 characters).
•Project Description: Type a short description of your project (max. 255 characters).
Configuration TabConfiguration Guide
Version 1.0.2Page 15 of 48

## 9.1.2. Connection
## NOTE
When commissioning the gateway for the first time, DHCP will be enabled for 30 seconds. During
that time, an IP address will be automatically assigned to the gateway if there is a DHCP server. After
that time, the default IP address 192.168.100.246 will be automatically set.
You can find this default IP address written in the installation guide.
## •
Enable DHCP: Use this option for networks that have a DHCP server.
Uncheck this option to unlock the following parameters:
## –
IP Address: Assign a fixed IP address for the gateway.
## –
Net Mask: Set the gateway IP netmask.
## –
Default Gateway: Type the IP for the default gateway.
## NOTE
The Default Gateway parameter is a networking concept not related to the Intesis gateway.
It refers to the IP address of the device (usually a router) that serves as the access point for
sending data from the local network to other networks, including the Internet. Therefore, this
field only needs to be filled in if the Intesis gateway to be configured is connected outside the
local network.
## •
Password. Follow these instructions to set a new password for the gateway:
-  Click the Change button.
-  Type a new password.
-  Go to the Receive/Send tab.
-  In the Send menu, click the Send button.
-  Go to the Connection tab.
-  Select the gateway from the Discovered Gateways window.
## 7.  Click Connect.
Configuration GuideGeneral Configuration Menu
Page 16 of 48Version 1.0.2

## 9.1.3. Conversions
Click the Edit button to open the Conversions Manager.
Use this menu to create and configure filters and operations to be applied to any signal later.
## Filters:
By default, five filters appear listed:
## •
Limit to 0-100
## •
Limit to 0-255
## •
Is not 0
## •
Is higher than 100
## •
Only positive values
Click the  button to add more filters.
Select a filter and click the  button to delete it.
For each filter, you can set:
## •
Filter Name: Type a name for the filter.
## •
Type: Select the filter type.
## –
## Comparison
## –
## Non-limited Filter
## –
## Limited Filter
General Configuration MenuConfiguration Guide
Version 1.0.2Page 17 of 48

•Comp. Type: Set the comparison type for this filter and set the value(s) to complete each formula.
–Equal: X== Set a value
–Different: X != Set a value
–Less: X < Set a value
–Greater: X > Set a value
–InRange: Set a value ≤ X ≤ Set a value
–OutOfRange: X < Set a value or X > Set a value
## Operations:
By default, 10 operations appear listed:
•Celsius to Fahrenheit
•Fahrenheit to Celsius
## •x 10
## •/ 10
## •x 100
## •/ 100
## •x 1000
## •/ 1000
•0-100 to 0-255
•0-255 to 0-100
Click the
button to add more operations.
Select an operation and click the  button to delete it.
For each operation, you can set:
•Operation Name: Type a Name for the operation.
•Type: Choose Scale or Arithmetic.
## Scale
Set the Values for:
–minimum Input / maximum Input
–minimum Output / maximum Output
## Arithmetic
Considering the Definition formula y = x × B × (10
## A
) + C, set the Values for:
## –A
## –B
## –C
Click Save to save the changes.
Configuration GuideGeneral Configuration Menu
Page 18 of 48Version 1.0.2

9.1.3.1. Enabling Conversions in a Signal
## NOTICE
To better understand this topic on conversions, we are moving from the Configuration tab to the
Signals tab.
Once the needed filters and operations are created and configured, follow these steps to enable them in a signal:
-  Go to the Signals tab.
-  Click the Edit Columns button placed at the bottom of the window.
-  In the Select Visible Columns window, enable the Conversions parameter.
## 4.  Click Save.
Now, the signals table shows the Conversions column at the end.
General Configuration MenuConfiguration Guide
Version 1.0.2Page 19 of 48

-  Choose the signal you want to apply the conversion to and click the  button at the end.
The Select Conversions window appears:
-  Use the BACnet Server and KNX dropdown menus to choose the needed filters and operations.
## NOTICE
The direction of the conversion depends on the type of the selected object and is indicated by
the black arrows:
•Left to right for BACnet Server output and value objects.
- Right to left for BACnet Server input objects.
This also determines the active text input in the Test section.
Configuration GuideGeneral Configuration Menu
Page 20 of 48Version 1.0.2

For example, to define a conversion that changes any given value from degrees Celsius to degrees
Fahrenheit and multiplies the result by ten, this configuration should be used:
In the BACnet Server side:
## •
Filter: Limit to 0-100
## •
Operation: Celsius to Fahrenheit
In the KNX side:
## •
## Operation: ×10
## •
## Filter: None
-  To test this configuration, type a value of 30 in the BACnet Server Value text field of the Test section.
## 8.  Click Check.
The KNX Value parameter shows the final result after applying both operations: 860.00 (30°C = 86°F;
## 86×10=860).
-  Click Save to change the changes.
The Signals table shows the word Enabled in the Conversions column for the signals with an assigned
conversion:
General Configuration MenuConfiguration Guide
Version 1.0.2Page 21 of 48

9.1.4. USB Host
Click the Edit button to open the USB Mode Configuration.
## Button A Functionality
•Auto Capture logs in USB (enabled by default): Save logs to a USB flash drive by pressing the gateway's button
## A.
–Capture Spons (enabled by default): Spontaneous values are logged.
–Capture Communication (enabled by default): Protocol communication is logged.
–Debug Level: Choose the debug level (0 .. 255. Default value: 1).
## NOTE
Keep the Debug Level to 1. Higher levels are only used for technical support issues.
•Save project in USB (enabled by default): Save the project to a USB flash drive by pressing the gateway's
button A.
## Button B Functionality
•Download project to the gateway (enabled by default): Load a project from a USB flash drive to the gateway
by pressing the gateway's button B.
•Download Firmware to the gateway (enabled by default): Load a firmware version from a USB flash drive to
the gateway by pressing the gateway's button B.
Click Apply to save the changes.
Configuration GuideGeneral Configuration Menu
Page 22 of 48Version 1.0.2

## NOTICE
- The gateway only supports USB flash drives. External HDD are not supported.
- The gateway supports USB flash drives with FAT32 and exFAT file systems.
## NOTE
When using Button A and Button B functions related to a USB flash drive, track the process via the
Diagnostic tab's Console viewer.
How to capture logs and save the gateway configuration to a USB flash drive
-  Connect the USB flash drive to the gateway through its USB port.
## NOTE
The Console viewer message "USB: Storage Device Attached" informs that the USB device has
been detected.
-  The LEDs next to the buttons start to blink alternatively for 15 seconds.
## NOTICE
Button A will be active during these 15 seconds. Press it before the LEDs turn off.
## NOTE
The Console viewer message "USB: [some specific USB device information] mounted" informs
that the USB device is ready.
-  Press Button A once to save the current gateway's configuration to the USB flash drive and to start capturing
logs.
The LED of Button A blinks while data is being loaded from the gateway to the USB device.
## NOTE
The Console viewer message "USB: Project written successfully to USB" informs that the project
has been downloaded to the USB device.
## NOTE
The Console viewer message "USB: Writing logs started" informs that logs are being
downloaded to the USB device.
-  Press and hold Button A for five seconds to stop capturing logs.
## NOTE
The Console viewer message "USB: USB logging canceled by user" informs that logs are no
longer being downloaded to the USB device.
-  Disconnect the USB flash drive from the gateway.
## NOTE
The Console viewer message "USB: Storage Device Detached" informs that the USB device has
been disconnected.
General Configuration MenuConfiguration Guide
Version 1.0.2Page 23 of 48

How to load an Intesis MAPS project and a firmware version from the USB flash drive to the gateway
-  Connect the USB flash drive to the gateway through its USB port.
## NOTE
The Console viewer message "USB: Storage Device Attached" informs that the USB device has
been detected.
-  The LEDs next to the buttons start to blink alternatively for 15 seconds.
## NOTICE
Button B will be active during these 15 seconds. Press it before the LEDs turn off.
## NOTE
The Console viewer message "USB: [some specific USB device information] mounted" informs
that the USB device is ready.
-  Press Button B once to load the Intesis MAPS project and the firmware version stored on the USB flash drive
to the gateway.
The LED of Button B blinks while data is being loaded from the USB device to the gateway.
## NOTICE
If more than one project is stored in the USB device, the gateway will load the last saved
project. The project/firmware must be located in the pen drive root directory, not inside a
folder.
## NOTE
The Console viewer message "USB: Saving project from the storage device" informs that the
project has been uploaded to the gateway.
## NOTE
The Console viewer message "FWUPDATE: DONE" informs that the firmware update process has
been successful.
-  Disconnect the USB flash drive from the gateway.
## NOTE
The Console viewer message "USB: Storage Device Detached" informs that the USB device has
been disconnected.
## 9.1.5. Time Configuration
## •
Set current PC time to the gateway: Connect the gateway to your PC and click the Set button to set the
gateway's time with your PC's current time.
## •
Time sync on project download (disabled by default): The gateway's clock is set to your PC time when
downloading the project to the gateway.
Configuration GuideGeneral Configuration Menu
Page 24 of 48Version 1.0.2

## 9.1.6. Security
•Edit Security Configuration: Click the Edit button to open the Security Configuration window.
## IMPORTANT
We recommend keeping the predetermined configuration.
–Disable UPD Discover Service (disabled by default): The gateway is not discoverable through UDP
communication.
–Disable TCP Console Service (disabled by default): The gateway stops communicating with the configuration
and diagnostic software through TCP. This only applies to gateways supporting connection to the PC via both
Ethernet and console ports.
–Disable HTTPS Certificates Auto Update (enabled by default): Automatic updates for the HTTPS certificates
are not allowed.
Click Save to save the changes.
9.1.7. Secondary BMS Protocol
-  Click the Edit button to add a secondary BMS protocol based on Modbus.
-  On the Secondary BMS Protocol Management window, select Modbus Slave.
-  Click Apply to save the changes.
The new option Secondary BMS Protocol MAP appears.
- Click the View button on this second option to view the Extra protocol Map Summary window.
The table lists the signals for the BMS, the secondary BMS, and the device protocols.
•View Internal Columns (enabled by default): Hide/show the BACnet Server column.
•View External Columns (enabled by default): Hide/show the KNX column.
•View Secondary BMS Protocol Columns (enabled by default): Hide/show the Modbus Master column.
## NOTE
Click the Export button to save an Excel copy of the table on your computer.
The menu on the left now shows Modbus Slave (MBS):
General Configuration MenuConfiguration Guide
Version 1.0.2Page 25 of 48

Configuration parameters for the secondary BMS:
## Modbus Configuration
## •
Type: TCP (RTU option is not allowed).
## •
Byte Order 32 bits registers. Choose between:
## –
Big Endian (default value)
## –
## Little Endian
## –
Word Inv BE (word inverted Big Endian)
## –
Word Inv LE (word inverted Little Endian)
## •
Notification on MB Write. Select when the Modbus write notification will be sent to the device protocol:
## –
## Always
## –
On Change of Value (default value)
## •
Select Modbus register base. Choose between:
## –
0 based (default value)
## –
1 based
TCP Configuration
## •
Port: Set the port for communication between the gateway and the Modbus TCP system.
## NOTE
The default port is 502.
## •
Keep Alive: Set the time in minutes before sending a keep-alive message (1 to 1440. Default value: 10
minutes).
## NOTE
Set the parameter to 0 to disable this function.
## •
Slave Number: Set the Modbus Slave Address (1 to 255. Default value: 1).
MBS Summary
## •
View MBS Extra Protocol Summary: Click the View button to open the Extra protocol Map Summary window.
## NOTE
See above for details.
## •
Select registers format. Choose between:
## –
16 bits unsigned (default value)
## –
32 bits float
Configuration GuideGeneral Configuration Menu
Page 26 of 48Version 1.0.2

## 9.1.8. Wiring Diagram
Figure 11. Wiring Diagram on the General configuration section
## •
Check Gateway's Wiring Diagram: Click the View button to open the schematic image on how to wire the
gateway.
General Configuration MenuConfiguration Guide
Version 1.0.2Page 27 of 48

9.2. BMS Protocol: BACnet
For this protocol combination, the gateway acts like a BACnet Server server device.
Figure 12. BACnet configuration parameters
9.2.1. BACnet Server General Configuration
## •
Device Name: Type a descriptive name for your gateway.
## •
Device Instance: Set the BACnet device object instance property. This is a unique identifier for the gateway
inside a single BACnet network segment (0 to 4194302. Default value: 246).
## •
Password: Click the Change button and follow the instructions to set a password for the gateway.
## •
Objects Information: Click Show to see a table with the type of objects available.
## •
Disable BACnet password (not recommended) (parameter disabled by default): Disable the BACnet password.
## IMPORTANT
Keep the BACnet password enabled to ensure the security of the gateway and the installation.
Configuration GuideBMS Protocol: BACnet
Page 28 of 48Version 1.0.2

## 9.2.2. Gateway Mode
## •
Mode: Select the communication type.
## –
IP (default value): IP communication over Ethernet.
## •
UDP Port: Select the UDP port for the BACnet/IP communication (1 .. 65535).
## NOTE
The UDP port is set to 47808 (BAC0 in hexadecimal) by default.
## •
Network Role (disabled by default): Define the gateway behavior regarding other network elements.
## IMPORTANT
If you are unfamiliar with these options, please leave the parameter as Disabled to avoid
issues with the BACnet communication/configuration.
## –
Disabled: The gateway provides no special service regarding network communication or settings.
## –
Foreign Device: The gateway acts as a foreign device from the BACnet network point of view.
## –
BBMD: The gateway acts as a BBMD in the BACnet network.
## –
MS/TP: Serial communication over the EIA-485 bus.
## •
Baudrate: Select the communication speed: Auto, 9600, 19200, 38400, 57600, 76800, or 115200 bps.
## NOTE
The baudrate is set to Auto by default.
## •
Max. Masters: Set the highest master MAC address in the MS/TP network (1 .. 127. Default value: 127).
## •
Max. Info Frames: Set the maximum number of messages that can be sent onto MS/TP network per
token pass (1 .. 100. Default value: 1).
## •
MAC Address: Set the MAC address of the gateway in the MS/TP network (0 .. 127. Default value: 1).
## •
Edit MSTP Timeouts: Click Edit to open the MSTP Timeouts Configuration window.
## –
PFM Timeout: Set the polling for master timeout in milliseconds (20 .. 100 ms. Default value: 60 ms).
## –
TP Timeout: Set the token passing timeout in milliseconds (20 .. 100 ms. Default value: 60 ms).
9.2.3. BACnet Advanced Configuration
Show Advanced Configuration: Open advanced configuration parameters (disabled by default).
## IMPORTANT
These settings are for advanced users only. We recommend leaving the predetermined
configuration.
BMS Protocol: BACnetConfiguration Guide
Version 1.0.2Page 29 of 48

## 9.2.3.1. Notification Class
Click Edit to open the Notification Class Configuration parameters.
Figure 13. Notification Class Configuration window
Click the  button to create up to ten Notification_Class objects. For each one, you can set:
•Object Name: Type a name for the Notification_Class.
•Object Instance: Sets the BACnet object instance for the Notification_Class.
•Recipient List: Click the
button to create eight different BACnet destinations. For each one, you can set:
–Destination Name: Type a descriptive name for the BACnet destination.
–Transitions: Select which transitions will force this Notification_Class to be active:
•Off_Normal (disabled by default): When the status changes from off to normal.
•Fault (disabled by default): When the status changes to fault.
•Normal (disabled by default): When the status changes from fault to normal.
–Recipient Type: Select the type of destination:
•Device (default value): The recipient is a device. Select the device instance number for this device in the
Object Instance text box.
•Address (IP): The recipient is set using the specific address on BACnet/IP. Specify:
–Network Number (0 .. 65535. Default value: 0).
–IP address (192.168.100.10 by default) and Port (47808 by default) for the destination.
– Set the destination as a Global Broadcast (disabled by default).
– Set the destination as a Broadcast (disabled by default).
Configuration GuideBMS Protocol: BACnet
Page 30 of 48Version 1.0.2

•Address (MS/TP): The recipient is set using the specific address on BACnet MS/TP. You'll have to specify:
–Network Number (0 .. 65535. Default value: 0).
–MS/TP MAC Address (0 .. 255. Default value: 0).
– Set the destination as a Global Broadcast (disabled by default).
– Set the destination as a Broadcast (disabled by default).
•Address (Other): The recipient is set using another type of address. You'll have to specify:
–Network Number (0 .. 65535. Default value: 0).
–Other Address (HEX string. Default value: ff).
– Set the destination as a Global Broadcast (disabled by default).
– Set the destination as a Broadcast (disabled by default).
•BACDestination Advanced Options (disabled by default): Check this option to show some advanced options.
–Valid days: Sets the days for receiving the notification.
–From: Sets the starting point for the valid period.
–To: Sets the ending point for the valid period.
–Issue Confirmed Notifications (disabled by default): Determines if notification events are sent as Confirmed
or Unconfirmed to the BACnet destination.
## IMPORTANT
Sending them as Confirmed requires Ack.
•Notification Class Advanced Options (disabled by default): Check this option to show the Ack Required
options.
–Off_Normal (disabled by default): Enable the acknowledgment for the TO_OFF_NORMAL event.
–Fault (disabled by default): Enable the acknowledgment for the TO_FAULT event.
–Normal (disabled by default): Enable the acknowledgment for the TO_NORMAL event.
## NOTE
Set the priority for each parameter (0 .. 255. Default value: 140).
Once you have created and configured the needed Notification_Class objects, the next step is to assign them to
signals:
-  Go to the Signals tab.
-  Click the Edit Columns button from the bottom menu.
-  In the Select Visible Columns window, check NC.
## 4.  Click Save.
A new column named NC is now visible.
-  Look for the signal to which you want to assign the Notification_Class object and click the corresponding cell
in the NC column.
-  Click the
button.
-  In the Select Notification Class window, uncheck the Empty parameter.
BMS Protocol: BACnetConfiguration Guide
Version 1.0.2Page 31 of 48

-  Use the dropdown menu to select the Notification_Class object.
-  Set the rest of the parameters:
## NOTE
These parameters vary depending on the signal type.
## •
Notify Type: Choose if the notification is sent as an Alarm (default) or an Event.
## •
Time Delay: Set the time in seconds before launching the notification (0 .. 65535. Default value: 0
seconds).
## •
Event Enable: Click in the field to enable/disable the following options:
## –
TO_OFF_NORMAL (enabled by default): Enable/disable the TO_OFF_NORMAL event.
## –
TO_FAULT (enabled by default): Enable/disable the TO_FAULT event.
## –
TO_NORMAL (enabled by default): Enable/disable the TO_NORMAL event.
## •
Feedback Value: Choose if the feedback value is Active or Inactive (default).
## •
High Limit (Disabled by default): Enable this parameter to set the high limit for the notification.
## •
Low Limit (Disabled by default): Enable this parameter to set the low limit for the notification (0.00 ..
## 999.00).
## •
Deadband: Set the deadband for the notification.
- Click Save to save the changes.
Once assigned, the instance number of the Notification_Class object appears in the NC column.
Configuration GuideBMS Protocol: BACnet
Page 32 of 48Version 1.0.2

## 9.2.3.2. Calendars
Click Edit to open the Calendars Configuration parameters.
Figure 14. Calendars Configuration window
Click the  button to create up to ten calendars. For each one, you can set:
## •
Object Name: Type a name for this BACnet object.
## •
Object Instance: Set the BACnet object instance for the calendar (0 .. 4194303. Default value: 0).
•Calendar Entries: Click the  button to determine the number of calendar entries (patterns). Create up to 32
different entries per calendar. For each entry, you can set:
## –
Entry Name: Type the calendar entry name.
## –
Type: Set the date type for the calendar:
## •
Date (default value): To select a single day.
## •
Date Range: To select a date range. Set the starting day (From) and the ending day (To).
## •
Week N Day: To set the date by selecting a Month, a Week of the Month, and/or a Day of the Week.
## NOTE
Select an asterisk (*) to apply the rule to all cases.
BMS Protocol: BACnetConfiguration Guide
Version 1.0.2Page 33 of 48

## 9.2.3.3. Schedules
Click Edit to open the Schedules Configuration parameters.
Figure 15. Schedules Configuration window
Click the  button to create up to ten schedules. For each one, you can set:
## •
## General Configuration:
## –
Name: Type a name for this BACnet object.
## –
Object Instance: Set the BACnet object instance for the schedule (0 .. 4194303. Default value: 0).
## –
Schedule Type: Set it as an Analog (default), Binary, or Multistate object.
## –
Priority for Writing: Select the writing priority of the schedule value (1 .. 16. Default value: 16).
## –
Schedule Default: Set the default value for the schedule (0.00 .. 65535.00. Default value: 0.00).
## –
Effective Period: Sets the starting and ending day of the effective period.
Configuration GuideBMS Protocol: BACnet
Page 34 of 48Version 1.0.2

## •
Objects Configuration: Include BACnet objects in a specific schedule.
Figure 16. Objects Configuration window
## –
Schedule Type: It shows the previous Schedule Type object you selected: Analog, Binary, or Multistate.
–List of Object References: Click the  button to open the Objects Selection window, where the available
objects are listed. Select the object and click Save to add it.
## •
## Weekly Schedule Configuration:
Figure 17. Weekly Schedule Configuration window
## –
Select Day: Select which day(s) of the week the schedule applies.
–Time Values: Click the  button to create up to six time periods. For each one, set the Starting Time, the
End Time, and the Value.
BMS Protocol: BACnetConfiguration Guide
Version 1.0.2Page 35 of 48

## •
Exception Events Configuration: Create exceptions to the schedules.
Figure 18. Exception Events Configuration window
–Exception Events List: Click the  button to create up to 16 different exceptions. For each one, you can set:
## •
Name: Type a name for the exception.
## •
Event Priority: Set a priority for the exception (1 [maximum priority] .. 16 [minimum priority]. Default
value: 16).
•Time Values: Click the  button to can create up to six time periods. For each one, set the Starting Time,
the End Time, and the Value.
## •
Exception Type: Set the type of date for the exception:
## –
Date (default): Select a single day.
## –
Date Range: Select a date range. Set the starting day (From) and the ending day (To).
## –
Week N Day: Set the date by selecting a Month, a Week of the Month, and/or a Day of the Week.
## NOTE
Select an asterisk (*) to apply the rule to all cases.
## –
Calendar: Select a Calendar to apply its values to the exception event.
## NOTE
This option is only enabled when at least a Calendar has been created.
Configuration GuideBMS Protocol: BACnet
Page 36 of 48Version 1.0.2

## •
Calendar View: Display a calendar to consult all the configured schedules.
Figure 19. Calendar window
BMS Protocol: BACnetConfiguration Guide
Version 1.0.2Page 37 of 48

## 9.2.3.4. Trend Logs
Click Edit to open the Trend Logs parameters.
Figure 20. Trend Logs Configuration window
Click the  button to create up to five trend logs. For each one, you can set:
## •
Object Name: Type a name for the trend log.
## •
Object Instance: Set the BACnet object instance for the trend log (0 .. 4194303. Default value: 0).
## •
Logging Type: Select the trend log type:
## –
Polled (default value): The trend log is triggered when polling.
Use the Log Interval parameter to set the poll cadence in seconds (1 .. 65535. Default value: 300 sec).
## –
COV: The trend log is triggered when there is a change of value.
Use the Client COV Increment parameter to set (0.00 .. 100000.00. Default value: 0.00).
## –
Triggered: The trend log is triggered by the BACnet system.
## •
Enable (enabled by default): Enable or disable the specific trend log even if the trend log is in the valid time
range.
## •
Stop When Full (enabled by default): If enabled, it will stop the trend log when the buffer is full. If disabled, it
will keep the last 2880 valid values.
## •
Date Time Configuration: Set the period when trend logs are active.
## –
Always (default value).
## –
Range: Use the Start Time and End Time parameters to set a time range.
Configuration GuideBMS Protocol: BACnet
Page 38 of 48Version 1.0.2

•Selected Objects (max 10): Click the  button to include up to ten BACnet objects in a trend log. To remove
previously added objects, use the  button.
Figure 21. BACnet Objects Selection
## NOTE
To select multiple items in both the Selected Objects and the Objects Selection tables, press and
hold the Shift key when clicking for consecutive objects or the Control key for non-consecutive
objects. Objects already added are shown with an orange background.
BMS Protocol: BACnetConfiguration Guide
Version 1.0.2Page 39 of 48

## 9.3. Device Protocol Configuration
9.3.1. Device Protocol: KNX
For this protocol combination, the gateway acts like a KNX client device.
Figure 22. KNX configuration parameters
## 9.3.1.1. Device Configuration
## •
Physical Address: Set the physical address for the gateway.
## NOTE
The address by default is 15.15.255
## •
Extended Addresses: Allow extended addresses (disabled by default). This extends the group address range
from the standard 0/0/1 .. 15/7/255 up to 31/7/255.
## IMPORTANT
This option should only be used in very large projects. Do not enable it unless required.
Configuration GuideDevice Protocol Configuration
Page 40 of 48Version 1.0.2

## 10. Signals Tab
This menu lists all available signals and their parameters for both BMS and Device protocols.
Figure 23. Signals tab
This list is used to define and configure the signals needed for the project. Signals can be added or removed as
necessary, and they can also be enabled accordingly. Once configured, the current configuration can be saved to
an XLSX file to be imported later, helping reduce commissioning time.
The columns shown by default on the Signals table are:
## General:
## •
#: Signal ID. A unique value that is automatically assigned and cannot be edited.
## •
Active: This checkbox allows you to enable or disable each signal individually.
## TIP
In general, there are several ways to select multiple cells:
## –
To select a small group of cells, click a cell and drag the cursor over the other cells.
## –
To select all visible cells in a column, click the first cell and press the Page Down key while
holding down the Shift key.
## –
To select all cells in a column, click the first cell and press the Arrow down key while holding
down the Control and Shift keys. This option does not apply to fields with dropdown lists.
## •
Description: Use a descriptive name to help identify the signal. To edit this field, simply click on it.
## NOTE
Description max length is 255 characters.
Signals TabConfiguration Guide
Version 1.0.2Page 41 of 48

On the BACnet Server side:
## •
Name: BACnet object name to be applied to the signal.
## •
Type: BACnet type of the signal. The available types are:
## –
AI: Analog Input
## –
AO: Analog Output
## –
AV: Analog Value
## –
BI: Binary input
## –
BO: Binary Output
## –
BV: Binary Value
## –
MI: Multistate Input
## –
MO: Multistate Output
## –
MV: Multistate Value
## •
Instance: BACnet Object instance.
## •
Units: If required, units for this signal can be defined (°C, Kg, kW...)
## NOTICE
This only applies to analog objects.
Configuration GuideSignals Tab
Page 42 of 48Version 1.0.2

On the KNX side:
•DPT: KNX Datapoint Type. Select the KNX Datapoint Type to be used for each signal or KNX communication
object.
•Group Address: KNX group address associated with the object. Three formats are supported: Single level, two
levels (P/S), and three levels (P/I/S). An Auto Group Address option is available to define group addresses
automatically. To do so:
-  Click the first cell and then click the last cell while holding the Shift key, scrolling if necessary.
Alternatively, you can click a cell and drag the cursor over the other cells.
-  Click the
symbol that appears on the last selected cell. A window will open.
Figure 24. Auto Group Address window
-  Select the Format,Start Value, and Increment values, then click OK. The column will be automatically
filled according to the entered data.
•Additional Addresses: Use this field to assign additional group addresses to an object. This can be used, for
example, to define a common group address for multiple objects so that they can send or receive the same
command at the same time. When adding multiple addresses, use a comma as a separator.
## NOTICE
Signals with additional addresses assigned must have the U or W flag enabled. See the following
sections for more information.
•U Flag: If enabled, the KNX communication object will be updated on start-up or after a KNX bus reset.
•T Flag: If enabled, the KNX communication object will be updated when transmit telegrams are sent from KNX.
•Ri Flag: If enabled, the KNX communication object will be updated on initialization.
## NOTE
This flag cannot be used together with the R flag.
•W Flag: If enabled, the KNX communication object can be written from KNX.
•R Flag: If enabled, the KNX communication object can be read from KNX.
## NOTE
This flag cannot be used together with the Ri flag.
## NOTE
Some KNX flags may not be selectable depending on the type of the BACnet Server side.
Signals TabConfiguration Guide
Version 1.0.2Page 43 of 48

A Find and Replace tool is available for replacing content from editable fields. To use this tool, press Ctrl+F or
select Tools - Find & Replace on the top menu, and then click on Replace in the dialog box.
Figure 25. Find and replace tool
## NOTICE
Remember: This tool is only functional for editable fields.
Below the list of signals, these options are available:
•Auto BACname  : Check this to automatically add the BAC type and BAC instance as a prefix to the current
name field.
•Auto Enumeration
: Generates all BAC instance numbers automatically, avoiding the risk of
duplicate values.
•Active signals: Number of active signals in the list / Maximum number of active signals allowed. The maximum
number of active signals is 3000.
•Hide Disabled signals  : Hide all disabled signals from the list (disabled by default).
•Edit Columns
: Click this button to hide/show any column of the list.
•Import
: Click this button to import the configuration of the signals from an XLSX file. These signals can
be added to the existing ones or replace them.
•Export  : Click this button to export the current signals configuration to an XLSX file.
•Font size  : Increases or decreases the font size.
•Move Up/Down
: Moves the selected row one position up or down.
•Add Multiple Rows
: Adds new signals to the table. use the text box to specify the number of rows
to be added.
## NOTE
The maximum number of rows to be added at once is 500, and the maximum number of signals
allowed is 5000. The number of active signals, however, cannot exceed 3000.
•Remove  : Delete the selected rows.
•Check table  : Use this button to review the signals' configuration.
## NOTE
If any parameter on any signal is wrong, a message will pop up with specific information about the
error.
Configuration GuideSignals Tab
Page 44 of 48Version 1.0.2

- Receive/Send Tab
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
## Receive:
Use this function to load the configuration of a gateway to Intesis MAPS.
## TIP
This function may be helpful when you need to change some parameters of an already configured
gateway.
Once the configuration is completed and sent, the gateway is already operative. Even so, you should review that
everything works correctly by entering the Diagnostic tab.
Receive/Send TabConfiguration Guide
Version 1.0.2Page 45 of 48

## 12. Diagnostic Tab
## IMPORTANT
Connection with the gateway is required to use the diagnostic tools.
Figure 26. Diagnostic tab window. Find the ToolBox between the upper tabs bar and the Console view. Below it,
from left to right: Console viewer, Protocol viewers (one above the other), and the Signals viewer
## TOOLBOX
From left to right:
•Microprocessor icon: Check the current hardware status of the gateway.
•LOG: Set Intesis MAPS in logging mode to record all the information present in the viewers and save it in a .zip
file.
•INFO?: Get some gateway information.
•RESET: Reset the gateway.
## NOTE
Depending on your screen resolution, the ToolBox icons may appear partially hidden behind the
Viewers window.
Configuration GuideDiagnostic Tab
Page 46 of 48Version 1.0.2

## VIEWERS
Intesis MAPS provides several viewers:
## •
A generic console viewer for general information about communications and the gateway status.
## •
A viewer for both protocols to check their current status.
## •
A signals viewers to simulate the BMS behavior or check the system's current values.
## NOTE
Use the refresh button to get updated values on the signals viewer.
The layout of these viewers can be modified:
## •
Using the Select Diagnostics View option from the View menu:
## NOTE
Layouts 3 and 4 offer two different tabbed options:
## –
Fixed console to the left and tabbed browser for the other viewers
## –
Full tabbed browser
## •
Clicking and dragging the border of a viewer. To do so, place the cursor over the edge of a viewer. On the
vertical edges, the cursor changes to  to adjust the width, and on the horizontal edges, the cursor changes to
to adjust the height.
Viewers can also be arranged manually by clicking and dragging them from their title bar, to use them as
independent windows or to position them in relation to other viewers.
Diagnostic TabConfiguration Guide
Version 1.0.2Page 47 of 48

## FILTERING
A filtering tool is available for the console and the bus viewers to find the desired information more efficiently. To
use this tool, right-click on the viewer.
The options available for this tool are:
•Copy selected to clipboard: It copies the selected text into the clipboard. If no text is selected, this option is
disabled.
•Copy all to clipboard: It copies all the information from the viewer to the clipboard.
•Enable filter: This option enables or disables the configured filter. To use this option, a filter must be defined
beforehand under Filter configuration.
•Filter configuration: The filter itself is defined here, using some additional options:
–Search Condition:
•Filter Type:
–Plain text: It searches all the communication frames that include the text specified in the Search
Condition String below.
–Regular Expression: It searches all the communication frames that match the regular expression
specified in the Search Condition String below.
## NOTE
A regular expression is a sequence of characters that specifies a match pattern in text. If
you are not familiar with regular expressions, use the Plain text option instead.
–Display:
•Visualization Options:
–Filter: It removes all the communication frames that do not fulfill the filter condition specified in the
## Search Condition String.
–Highlight: It highlights the communication frames that fulfill the filter condition specified in the Search
## Condition String.
Configuration GuideDiagnostic Tab
Page 48 of 48Version 1.0.2