

# Aussiebb usage notification tool(AUNT)
[![Appveyor - Build status](https://ci.appveyor.com/api/projects/status/u6b5w585gu6q70hy?svg=true)](https://ci.appveyor.com/project/lukealford/aussiebb-tray)
[![dependencies](https://david-dm.org/lukealford/aunt/status.svg)](https://david-dm.org/lukealford/aunt?view=list)

# Version 1.0.5 Released!, See [GitHub releases](https://github.com/lukealford/aussiebb_tray/releases) 

Aussiebb AUNT is a small app to display current usage for the month.

Aussiebb AUNT is cross platform and is tested on, windows, osx and linux before each release.

## Dev Installation

    git clone https://github.com/lukealford/aussiebb_tray
    cd aussiebb_tray
    npm install

## Dev Run

    npm run start

## Build

    npm run package
    
## Make
 
    npm run make 
    
## Precompiled Version
See [GitHub releases](https://github.com/lukealford/aussiebb_tray/releases) for latest version.

## Linux Usage
You need to run the following commands to include all the dependancies and execute the application

Note these are for Ubuntu 18.04:

    sudo apt install libgconf-2-4 libcanberra-gtk-module libappindicator1
    chmod +x aussiebb_aunt
    ./aussiebb_aunt

## Usage

![AussieBB AUNT Demo](https://i.imgur.com/X45YzBY.gif)

* Look for the AussieBB icon in the system tray.
* Click the icon to open the login window
* Hover your mouse cursor over it to see your usage.
* Left-click to show a full overview of your month and other options
* The colour of the circle on the icon in the tray is a reference to how much data you are using in compared to your data left, if green you are doing ok, if orange slow down, if red you are using to much. 



## Credit 
Aussie Broadband icons(Tray icon and logo) are owned by https://www.aussiebroadband.com.au/ check them out for awesome internet!

Thanks to @akadrac for the huge help without asking! and thanks for the aussie staff for being so helpful!
