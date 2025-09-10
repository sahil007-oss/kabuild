
// Configuration variables
let config = {
    spriteSize: 64,
    levelRows: 32,
    levelCols: 32,
    scale: 1.0,
    playerSprite: '@',
    exportBasePath: 'sprites/'
};

// Make config globally accessible
window.config = config;

let nextChar = 64;
function spritesLoaded(paths) {
    const container = document.getElementById('sprites');
    console.log("Displaying sprites:", paths);
    // container.innerHTML = '';
    paths.forEach((src, i) => {
        const char = String.fromCharCode(nextChar++); // 'A', 'B', 'C', ...
        const div = document.createElement('div');
        div.className = 'sprite';
        div.style.width = `${config.spriteSize}px`;
        div.style.height = `${config.spriteSize}px`;
        // Convert absolute path to file:// URL
        const fileUrl = src.startsWith('file://') ? src : `file://${src.replace(/\\/g, '/')}`;
        div.style.backgroundImage = `url('${fileUrl}')`;
        div.title = char;
        div.dataset.char = char;
        div.addEventListener('click', (e) => {
            const target = e.currentTarget;
            document.querySelectorAll('.sprite').forEach(s => {
                s.className = 'sprite';
            });
            target.className = 'sprite selected';
            // Custom logic here
        });
        // insert an X / delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'X';
        deleteBtn.style.position = 'absolute';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            div.remove();
        });
        div.appendChild(deleteBtn);
        container.appendChild(div);
    });
    highlightPlayerSprite();
}

function highlightPlayerSprite() {
    document.querySelectorAll('.sprite').forEach(s => {
        if (s.dataset.char === config.playerSprite) {
            s.classList.add('highlight');
        } else {
            s.classList.remove('highlight');
        }
    });
}

function exportProject() {
    console.log('Exporting project...');

    const layer = document.getElementById('layer');
    const tiles = layer.querySelectorAll('.sprite');
    let levelData = [];
    // Create an array of strings for each row
    for (let y = 0; y < 32; y++) {
        let row = '';
        for (let x = 0; x < 32; x++) {
            const tile = Array.from(tiles).find(t => parseInt(t.dataset.x, 10) === x && parseInt(t.dataset.y, 10) === y);
            row += tile && tile.dataset.char ? tile.dataset.char : ' ';
        }  
        levelData.push(row);
    }
    const levelString = levelData.join('\n');  
    console.log('Exported Level:\n' + levelString);
    // Create kaboom source for level data
    // start with the sprites definitions
    let kaboomSource = '';
    const spriteDefs = {};
    let n=0;
    document.querySelectorAll('#sprites .sprite').forEach(s => {
        if (s.dataset.char && s.style.backgroundImage) {
            spriteDefs[`sprite_${++n}`] = s.style.backgroundImage;
        }
    });
    Object.entries(spriteDefs).forEach(([key, image]) => {
        kaboomSource += `loadSprite("${key}", ${image});\n`;
    });
    kaboomSource += '\n';
    // now the level definition
    console.log('Kaboom Source:\n' + kaboomSource);
    window.API.saveFile(kaboomSource, levelPath);
}

function loadProject(projectData) {
    try {
        const { sprites, level, config: savedConfig } = JSON.parse(projectData);
        
        // Load configuration if present
        if (savedConfig) {
            config.playerSprite = savedConfig.playerSprite || config.playerSprite;
            config.spriteSize = savedConfig.spriteSize || config.spriteSize;
            config.levelRows = savedConfig.levelRows || config.levelRows;
            config.levelCols = savedConfig.levelCols || config.levelCols;
            config.scale = savedConfig.scale || config.scale;
            config.exportBasePath = savedConfig.exportBasePath || config.exportBasePath;
            
            // Apply the loaded configuration
            applyScale(config.scale);
            rebuildLevel();
            
            console.log('Configuration loaded:', config);
        }
        
        // Clear existing sprites and level
        document.getElementById('sprites').innerHTML = '';
        document.querySelectorAll('#layer .sprite').forEach(tile => {
            tile.style.backgroundImage = '';
            tile.dataset.char = '';
        });
        
        // Load sprites
        if (sprites) {
            sprites.forEach(sprite => {
                const div = document.createElement('div');
                div.className = 'sprite';
                div.style.width = `${config.spriteSize}px`;
                div.style.height = `${config.spriteSize}px`;
                div.style.backgroundImage = sprite.image;
                div.dataset.char = sprite.char;
                div.title = sprite.char;
                div.addEventListener('click', (e) => {
                    const target = e.currentTarget;
                    document.querySelectorAll('.sprite').forEach(s => {
                        s.className = 'sprite';
                    });
                    target.className = 'sprite selected';
                });
                // insert an X / delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.innerText = 'X';
                deleteBtn.style.position = 'absolute';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    div.remove();
                });
                div.appendChild(deleteBtn);
                document.getElementById('sprites').appendChild(div);
            });
        }
        
        // Load level tiles
        if (level) {
            level.forEach(tile => {
                if (tile.char && tile.x !== undefined && tile.y !== undefined) {
                    const layerTile = document.querySelector(`#layer .sprite[data-x="${tile.x}"][data-y="${tile.y}"]`);
                    if (layerTile) {
                        layerTile.style.backgroundImage = tile.image;
                        layerTile.dataset.char = tile.char;
                    }
                }
            });
        }
        
        console.log('Project loaded successfully');
    } catch (error) {
        console.error('Error loading project:', error);
    }
}

function saveProject() {
    const sprites = [];
    const level = [];
    document.querySelectorAll('#sprites .sprite').forEach(s => {
        sprites.push({
            char: s.dataset.char,
            image: s.style.backgroundImage
        });
    });
    document.querySelectorAll('#layer .sprite').forEach(s => {
        if (s.dataset.char) {
            level.push({
                char: s.dataset.char,
                image: s.style.backgroundImage,
                x: s.dataset.x,
                y: s.dataset.y
            });
        }
    });

    const projectData = { 
        sprites, 
        level, 
        config: {
            spriteSize: config.spriteSize,
            levelRows: config.levelRows,
            levelCols: config.levelCols,
            scale: config.scale,
            exportBasePath: config.exportBasePath
        }
    };
    const projectJson = JSON.stringify(projectData, null, 2);
    window.API.saveFile(projectJson, 'project.json');
}

function exportProject(filePath) {
    console.log('Exporting project to:', filePath);
    
    const layer = document.getElementById('layer');
    const tiles = layer.querySelectorAll('.sprite');

    let spriteDefs = {};
    document.querySelectorAll('#sprites .sprite').forEach(s => {
        if (s.dataset.char && s.style.backgroundImage) {
            // Extract filename from background image URL
            const bgImage = s.style.backgroundImage;
            const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
            if (urlMatch) {
                const fullPath = urlMatch[1];
                // Extract just the filename from the full path
                const filename = fullPath.split(/[/\\]/).pop();
                // Apply the configured base path
                const spritePath = config.exportBasePath + filename;
                spriteDefs[s.dataset.char] = spritePath;
            }
        }
    });

    let levelData = [];
    // Create an array of strings for each row
    for (let y = 0; y < config.levelRows; y++) {
        let row = '';
        for (let x = 0; x < config.levelCols; x++) {
            const tile = Array.from(tiles).find(t => parseInt(t.dataset.x, 10) === x && parseInt(t.dataset.y, 10) === y);
            row += tile && tile.dataset.char ? tile.dataset.char : ' ';
        }  
        levelData.push(`"${row}"`);
    }

    const spriteLines = Object.entries(spriteDefs).map(([char, spritePath]) => {
        return `k.loadSprite("${char}", "${spritePath}");`;
    });

    const spriteString = spriteLines.join('\n');

    const levelString = `const level = [\n    ${levelData.join(',\n    ')}\n];`;
    console.log('Exported Level Code:\n' + levelString);


    delete spriteDefs[config.playerSprite]; // Remove player sprite from tile map entries
    // Create tile map entries
    const tileMapEntries = Object.entries(spriteDefs).map(([char, spritePath]) => {
        return `        "${char}": () => [sprite("${char}"), area(), body({isStatic: true}), "${char}"]`;
    });


    const fullSource = `// Auto-generated by Kabuild
// Base path: ${config.exportBasePath}

${spriteString}

${levelString}

const gameLevel = addLevel(level, {
    tileWidth: ${config.spriteSize},
    tileHeight: ${config.spriteSize},
    tiles: {
    "${config.playerSprite}": () => [ sprite("player"), area(), body(), anchor("bot"), "player" ],
${tileMapEntries.join(',\n')}
    }
});`;
    
    // Write the JavaScript code directly to the file (no dialog)
    window.API.writeFile(fullSource, filePath);
}

function showConfiguration() {
    console.log('showConfiguration called');
    // Create configuration dialog
    const dialog = document.createElement('div');
    dialog.id = 'config-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid #333;
        padding: 20px;
        z-index: 10000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        min-width: 300px;
    `;
    
    let playerSpriteOptions = '';
    for (let i = 32; i < 127; i++) {
        const char = String.fromCharCode(i);
        const selected = (char === config.playerSprite) ? 'selected' : '';
        playerSpriteOptions += `<option value="${char}" ${selected}>${char}</option>`;
    }
    dialog.innerHTML = `
        <h3>Configuration</h3>
        <div>
            <label>Player Sprite Character: 
                <select id="player-sprite">
                    ${playerSpriteOptions}
                </select>
            </label>
        </div>
        <div>
            <label>Sprite Size: 
                <input type="number" id="sprite-size" value="${config.spriteSize}" min="16" max="128" step="16">
            </label>
        </div>
        <div style="margin-top: 10px;">
            <label>Level Rows: 
                <input type="number" id="level-rows" value="${config.levelRows}" min="10" max="100">
            </label>
        </div>
        <div style="margin-top: 10px;">
            <label>Level Columns: 
                <input type="number" id="level-cols" value="${config.levelCols}" min="10" max="100">
            </label>
        </div>
        <div style="margin-top: 10px;">
            <label>Scale: 
                <input type="range" id="scale-slider" value="${config.scale}" min="0.25" max="3.0" step="0.25" style="width: 150px;">
                <span id="scale-value">${config.scale}x</span>
            </label>
        </div>
        <div style="margin-top: 10px;">
            <label>Export Base Path: 
                <input type="text" id="export-basepath" value="${config.exportBasePath}" placeholder="sprites/" style="width: 200px;">
            </label>
            <div style="font-size: 12px; color: #666; margin-top: 2px;">Base path for sprite files in exported code</div>
        </div>
        <div style="margin-top: 15px;">
            <button id="apply-config">Apply</button>
            <button id="cancel-config">Cancel</button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Update scale value display when slider changes
    const scaleSlider = document.getElementById('scale-slider');
    const scaleValue = document.getElementById('scale-value');
    scaleSlider.addEventListener('input', (e) => {
        scaleValue.textContent = e.target.value + 'x';
    });
    
    // Handle apply button
    document.getElementById('apply-config').addEventListener('click', () => {
        const newSpriteSize = parseInt(document.getElementById('sprite-size').value);
        const newRows = parseInt(document.getElementById('level-rows').value);
        const newCols = parseInt(document.getElementById('level-cols').value);
        const newScale = parseFloat(document.getElementById('scale-slider').value);
        const newBasePath = document.getElementById('export-basepath').value;
        
        applyConfiguration(newSpriteSize, newRows, newCols, newScale, newBasePath);
        document.body.removeChild(dialog);
    });
    
    // Handle cancel button
    document.getElementById('cancel-config').addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
}

function applyConfiguration(spriteSize, rows, cols, scale, basePath) {
    config.spriteSize = spriteSize;
    config.levelRows = rows;
    config.levelCols = cols;
    config.scale = scale;
    config.exportBasePath = basePath;
    
    // Apply scale to the entire workspace
    applyScale(scale);
    
    // Update sprite display sizes
    document.querySelectorAll('#sprites .sprite').forEach(sprite => {
        sprite.style.width = `${spriteSize}px`;
        sprite.style.height = `${spriteSize}px`;
    });
    
    // Rebuild the level grid with new dimensions
    rebuildLevel();
    highlightPlayerSprite();
    console.log('Configuration applied:', config);
}

function applyScale(scale) {
    // Apply scale to the layer container
    const layer = document.getElementById('layer');
    
    layer.style.transform = `scale(${scale})`;
    layer.style.transformOrigin = 'top left';
    
    // Adjust container size to accommodate scaling
    if (scale !== 1.0) {
        layer.style.position = 'absolute';
        layer.style.top = '80px';
        layer.style.left = '0';
    }
    
    // Update or create scale indicator
    let scaleIndicator = document.getElementById('scale-indicator');
    if (!scaleIndicator) {
        scaleIndicator = document.createElement('div');
        scaleIndicator.id = 'scale-indicator';
        scaleIndicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-family: monospace;
            z-index: 1000;
        `;
        document.body.appendChild(scaleIndicator);
    }
    scaleIndicator.textContent = `Scale: ${scale}x`;
}

function rebuildLevel() {
    const layer = document.getElementById('layer');
    layer.innerHTML = '';
    
    for (let y = 0; y < config.levelRows; y++) {
        for (let x = 0; x < config.levelCols; x++) {
            const tile = document.createElement('div');
            tile.className = 'sprite';
            tile.style.position = 'absolute';
            tile.style.width = `${config.spriteSize}px`;
            tile.style.height = `${config.spriteSize}px`;
            tile.style.left = `${x * config.spriteSize}px`;
            tile.style.top = `${y * config.spriteSize}px`;
            tile.dataset.x = x;
            tile.dataset.y = y;
            layer.appendChild(tile);
        }
    }
}



if (window.API) {
    console.log('Setting up API event listeners');
    window.API.onSpritesLoaded(spritesLoaded);
    window.API.onProjectLoaded(loadProject);
    window.API.onExportProject(exportProject);
    window.API.onShowConfiguration(() => {
        console.log('Configuration event received');
        showConfiguration();
    });
    window.API.saveProject((projectPath) => {
        saveProject(projectPath);
    });
} else {
    console.log('window.API not available');
}