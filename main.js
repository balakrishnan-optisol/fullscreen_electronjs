const { app, BrowserWindow, ipcMain, globalShortcut, dialog, screen } = require('electron');
const path = require('path');

const createWindow = () => {

    const displays = screen.getAllDisplays()
    const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0
    });

    const mainWindow = new BrowserWindow({
        title: "Full screen",
        frame: false,
        x: 'a',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    if (externalDisplay) {
        console.log('externalDisplay');
        mainWindow.setPosition(externalDisplay.bounds.x + 50, externalDisplay.bounds.y + 50, true);
    }

    mainWindow.on('show', () => {
        setTimeout(() => {
            mainWindow.focus();
        }, 200);
    });

    //close
    let manualClose = false;
    mainWindow.webContents.once('dom-ready', () => {
        ipcMain.once("close_window", () => {
            console.log('manual close');
            manualClose = true;
            mainWindow.close();
        });

        ipcMain.on("confirm_fullscreen", () => {
            let response = dialog.showMessageBoxSync(mainWindow, {
                type: 'question',
                buttons: ['Yes', 'No'],
                title: 'Confirm',
                message: 'Are you sure you want to go full screen? Once enter full screen you will not be able to access other app or windows'
            });
            console.log('confirm_fullscreen response - ', response);
            if (!response) {
                updateToFullScreenRestriction(mainWindow);
                // mainWindow.setFullScreen(true);
                // //normal - 2ND,  screen-saver - 1ST, pop-up-menu - 1ST
                // mainWindow.setAlwaysOnTop(true, 'pop-up-menu', 1);
                // mainWindow.setFocusable(true);
                // mainWindow.setSkipTaskbar(true);

                // mainWindow.setResizable(false);
                // mainWindow.setMovable(false);
                // mainWindow.setMinimizable(false);
            }
        });

        ipcMain.on("confirm_normal_screen", () => {
            let response = dialog.showMessageBoxSync(mainWindow, {
                type: 'question',
                buttons: ['Yes', 'No'],
                title: 'Confirm',
                message: 'Are you sure you want to go normal screen?'
            });
            console.log('confirm_normal_screen response - ', response);
            if (!response) {
                updateToNormalScreen(mainWindow);
            }
        });
    });

    mainWindow.on('close', (event) => {
        console.log('close event');
        if (!manualClose) {
            event.preventDefault();
        }
    });
    //close

    mainWindow.loadFile('index.html');
};

function updateToFullScreenRestriction(mainWindow) {
    try {
        mainWindow.setFullScreen(true);
        //normal - 2ND,  screen-saver - 1ST, pop-up-menu - 1ST
        mainWindow.setAlwaysOnTop(true, 'pop-up-menu', 1);
        mainWindow.setFocusable(true);
        mainWindow.setSkipTaskbar(true);
        mainWindow.setVisibleOnAllWorkspaces(true, {
            skipTransformProcessType: true,
            visibleOnFullScreen: true
        });

        mainWindow.setResizable(false);
        mainWindow.setMovable(false);
        mainWindow.setMinimizable(false);
    } catch (error) {
        console.log('updateToFullScreenRestriction - ', mainWindow);
    }
}

function updateToNormalScreen(mainWindow) {
    try {
        mainWindow.setFullScreen(false);
        //normal - 2ND,  screen-saver - 1ST, pop-up-menu - 1ST
        mainWindow.setAlwaysOnTop(false, 'pop-up-menu', 1);
        mainWindow.setFocusable(true);
        mainWindow.setSkipTaskbar(false);
        mainWindow.setVisibleOnAllWorkspaces(false);

        mainWindow.setResizable(true);
        mainWindow.setMovable(true);
        mainWindow.setMinimizable(true);
    } catch (error) {
        console.log('updateToFullScreenRestriction - ', mainWindow);
    }
}

app.on('browser-window-focus', () => {
    console.log('app browser-window-focus');
});

app.on('browser-window-blur', (event) => {
    event.preventDefault()
    console.log('app browser-window-blur');
});

app.on('will-quit', () => {
    // Unregister all shortcuts.
    console.log('will-quit unregisterAll');
    globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
    console.log('window-all-closed - ');
    if (process.platform !== 'darwin') {
        console.log('window-all-closed - not darwin');
        app.quit()
    }
});

app.whenReady().then(() => {
    globalShortcut.register("CommandOrControl+R", () => {
        console.log("CommandOrControl+R is pressed: Shortcut Disabled");
    });
    globalShortcut.register("F5", () => {
        console.log("F5 is pressed: Shortcut Disabled");
    });
    globalShortcut.register("Alt+Tab", () => {
        console.log("alt+tab is pressed: Shortcut Disabled");
    });
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
});