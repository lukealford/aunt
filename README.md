

# Aussiebb Aussie usage notification tool(AUNT)

# Version 1.0.0 Released!, See [GitHub releases](https://github.com/lukealford/aussiebb_tray/releases) 

Aussiebb AUNT is a small app to display current usage for the month.

Aussiebb AUNT is cross platform and is tested on, windows, osx and linux before each release.

## Dev Installation

    git clone https://github.com/lukealford/aussiebb_tray
    cd aussiebb_tray
    npm install

## Dev Run

    npm start

## Build

    npm run package-win
    npm run package-mac
    npm run package-linux
    
## Precompiled Version
See [GitHub releases](https://github.com/lukealford/aussiebb_tray/releases) for latest version.

## Linux Usage
You need to run the following commands to include all the dependancies and execute the application

Note these are for Ubuntu 18.04:

    sudo apt install libgconf-2-4 libcanberra-gtk-module libappindicator1
    chmod +x aussiebb_aunt
    ./aussiebb_aunt

## Usage

![AussieBB AUNT Demo](https://i.imgur.com/purVdaZ.gif)

Look for the AussieBB icon in the system tray.

Click the icon to open the login window

Hover your mouse cursor over it to see your usage.

Left-click to show a full overview of your month.

Right-click to bring up the context menu. 
* Choose **Update** to request a update. 
* Choose **Logout** to logout of the application.
* Choose **Quit** to quit the application .



## License



The MIT License

Copyright 2018 Luke Alford

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


## Credit 
Aussie Broadband icons(Tray icon and logo) are owned by https://www.aussiebroadband.com.au/ check them out for awesome internet!

Thanks to @akadrac for the huge help without asking! and thanks for the aussie staff for being so helpful!
