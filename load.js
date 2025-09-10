const { app, ipcMain, BrowserWindow, dialog } = require('electron/main');
const fs = require('fs');
const path = require('path');
const { buildMenu } = require('./menu');

function createMainWindow() {

    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Optional: for context isolation
            nodeIntegration: true, 
            contextIsolation: true 
        }
    });

    mainWindow.loadFile('index.html'); // Load your HTML file

    mainWindow.webContents.once('did-finish-load', () => {
    // after the window is ready, you can start your app logic
        // show dev tools for debugging
        mainWindow.webContents.openDevTools();            

    });

        // Listen for menu event to load sprites
        ipcMain.on('open-sprite-dialog', async (event) => {
            const result = await dialog.showOpenDialog(mainWindow, {
                title: 'Select Sprite Images',
                properties: ['openFile', 'multiSelections'],
                filters: [
                    { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
                ]
            });
            if (!result.canceled && result.filePaths.length > 0) {
                mainWindow.webContents.send('sprites-loaded', result.filePaths);
            }
        });

        // Listen for load project event and read file content
        mainWindow.webContents.on('ipc-message', (event, channel, filePath) => {
            if (channel === 'project-loaded') {
                try {
                    const projectData = fs.readFileSync(filePath, 'utf8');
                    mainWindow.webContents.send('project-loaded', projectData);
                } catch (error) {
                    console.error('Error reading project file:', error);
                }
            }
        });    ipcMain.on('save-project', async (event, { data, defaultPath }) => {
        console.log('Received save-project event with path:', defaultPath);
        const win = BrowserWindow.getFocusedWindow();
        const result = await dialog.showSaveDialog(win, {
            defaultPath,
            filters: [{ name: 'JSON', extensions: ['json'] }]
        });
        if (!result.canceled && result.filePath) {
            fs.writeFileSync(result.filePath, data, 'utf8');
        }
    });

    ipcMain.on('save-file', async (event, { data, defaultPath }) => {
        const win = BrowserWindow.getFocusedWindow();
        const result = await dialog.showSaveDialog(win, {
            defaultPath,
            filters: [{ name: 'JSON', extensions: ['json'] }]
        });
        if (!result.canceled && result.filePath) {
            try {
                fs.writeFileSync(result.filePath, data, 'utf8');
                console.log('File saved:', result.filePath);
            } catch (err) {
                console.error('Error saving file:', err);
            }
        }
    });

    // Write file directly without dialog
    ipcMain.on('write-file', (event, { data, filePath }) => {
        try {
            fs.writeFileSync(filePath, data, 'utf8');
            console.log('File written:', filePath);
        } catch (err) {
            console.error('Error writing file:', err);
        }
    });
}

app.whenReady().then(
    function() {
        createMainWindow();
        buildMenu();
    }
);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

