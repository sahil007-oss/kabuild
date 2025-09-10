const { dialog, BrowserWindow, Menu, app } = require('electron');
const fs = require('fs');

function loadProject() {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        dialog.showOpenDialog(win, {
            title: 'Select Project File',
            properties: ['openFile'],
            filters: [
                { name: 'JSON', extensions: ['json'] }
            ]
        }).then(result => {
            if (!result.canceled && result.filePaths.length > 0) {
                try {
                    const projectData = fs.readFileSync(result.filePaths[0], 'utf8');
                    win.webContents.send('project-loaded', projectData);
                } catch (error) {
                    console.error('Error reading project file:', error);
                }
            }   
        });
    }
}

function loadSprites() {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        dialog.showOpenDialog(win, {
            title: 'Select Sprite Images',
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
            ]
        }).then(result => {
            if (!result.canceled && result.filePaths.length > 0) {
                win.webContents.send('sprites-loaded', result.filePaths);
            }
        });
    }
}

function exportProject() {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        dialog.showSaveDialog(win, {
            title: 'Export Project As',
            defaultPath: 'project.js',    
            filters: [
                { name: 'JavaScript', extensions: ['js'] }
            ]
        }).then(result => {
            if (!result.canceled && result.filePath) {
                console.log('Exporting project to:', result.filePath);
                win.webContents.send('export-project', result.filePath);
            }
        });
    }   
}

function showConfiguration() {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.webContents.send('show-configuration');
    }
}

function buildMenu() {
    const win = BrowserWindow.getFocusedWindow();
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Load Sprite(s)',
                    click: () => {
                        loadSprites();
                    }
                },
                {
                    label: 'Load Project', role: 'load-project',
                    click: loadProject
                },
                {
                    label: 'Save Project', role: 'save-project',
                    click: () => {
                        console.log('Menu Save Project clicked');
                        win.webContents.send('save-project');
                    }
                },
                { label: 'Export Project', role: 'export-project',
                    click: () => {
                        console.log('Menu Export Project clicked');
                        exportProject();
                    }
                 },
                { label: 'Quit', role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Configuration',
                    click: () => {
                        showConfiguration();
                    }
                }
            ]
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    app.on('ready', () => {
        Menu.setApplicationMenu(menu);
    });
}

module.exports = {
    buildMenu,
    exportProject,
    loadSprites
};