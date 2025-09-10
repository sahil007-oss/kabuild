const { contextBridge, Notification, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('API', {
    onSpritesLoaded: (callback) => {
        ipcRenderer.on('sprites-loaded', (event, paths) => {
            callback(paths);
        });
    },
    onProjectLoaded: (callback) => {
        ipcRenderer.on('project-loaded', (event, projectData) => {
            callback(projectData);
        });
    },
    onExportProject: (callback) => {
        ipcRenderer.on('export-project', (event, filePath) => {
            callback(filePath);
        });
    },
    onShowConfiguration: (callback) => {
        ipcRenderer.on('show-configuration', () => {
            callback();
        });
    },
    saveProject: (callback) => {
        ipcRenderer.on('save-project', (event, path) => {
            callback(path);
        });
    },
    saveFile: (data, defaultPath) => {
        ipcRenderer.send('save-file', { data, defaultPath });
    },
    writeFile: (data, filePath) => {
        ipcRenderer.send('write-file', { data, filePath });
    }
});

function paint(tile) {
    if (tile.classList.contains('sprite') && tile.dataset.x !== undefined && tile.dataset.y !== undefined) {
        const x = parseInt(tile.dataset.x, 10);
        const y = parseInt(tile.dataset.y, 10);
        // load the selected sprite onto this tile
        const selected = document.querySelector('.sprite.selected');    
        if (selected) {
            tile.dataset.char = selected.dataset.char;
            tile.style.backgroundImage = selected.style.backgroundImage;
            tile.style.backgroundSize = 'cover';
        }
    }
}

function erase(tile) {
    if (tile.classList.contains('sprite') && tile.dataset.x !== undefined && tile.dataset.y !== undefined) {
        tile.innerHTML = '';
        tile.style.backgroundImage = '';
        delete tile.dataset.char;
    }
}

function setupLayer() {
    // Create a grid of divs to hold the sprites
    const layer = document.getElementById('layer');
    // Get config from window or use defaults
    const spriteSize = window.config?.spriteSize || 64;
    const rows = window.config?.levelRows || 32;
    const cols = window.config?.levelCols || 32;
    
    layer.innerHTML = '';
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const tile = document.createElement('div');
            tile.className = 'sprite';
            tile.style.position = 'absolute';
            tile.style.width = `${spriteSize}px`;
            tile.style.height = `${spriteSize}px`;
            tile.style.left = `${x * spriteSize}px`;
            tile.style.top = `${y * spriteSize}px`;
            tile.dataset.x = x;
            tile.dataset.y = y;
            layer.appendChild(tile);
        }
    }
    // delete a tile on right click
    // Event delegation for tile clicks
    let mouseState = { left: false, right: false };
    layer.addEventListener('mousedown', (e) => {
        mouseState.right = e.button === 2;
        mouseState.left = e.button === 0;
        e.button === 0 && paint(e.target);
        e.button === 2 && erase(e.target);
    });
    layer.addEventListener('mouseup', (e) => {
        mouseState.right = e.button === 2 ? false : mouseState.right;
        mouseState.left = e.button === 0 ? false : mouseState.left;
    });
    layer.addEventListener('mousemove', (e) => {
        mouseState.left && paint(e.target);
        mouseState.right && erase(e.target);
    });


}


// after dom is loaded
window.addEventListener('DOMContentLoaded', () => {
    setupLayer();
    // Expose a safe API to the renderer process    
});