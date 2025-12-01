// board.js - Управление игровым полем и плитками
window.Board = {
    size: 4,
    cells: [],
    tiles: [],
    tileContainer: null,
    gridContainer: null,
    cellSize: 100,
    gapSize: 15,
    boardPadding: 15,

    // Инициализация игрового поля
    init(containerId) {
        const container = document.getElementById(containerId);
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        // Создаем сетку ячеек
        this.gridContainer = document.createElement('div');
        this.gridContainer.className = 'grid';
        
        // Создаем контейнер для плиток
        this.tileContainer = document.createElement('div');
        this.tileContainer.className = 'tiles-container';
        
        // Заполняем сетку ячейками
        for (let row = 0; row < this.size; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Устанавливаем абсолютные размеры
                cell.style.width = this.cellSize + 'px';
                cell.style.height = this.cellSize + 'px';
                
                this.gridContainer.appendChild(cell);
                this.cells[row][col] = null;
            }
        }
        
        container.appendChild(this.gridContainer);
        container.appendChild(this.tileContainer);
        
        // Инициализируем пустые ячейки
        this.reset();
    },

    // Сброс игрового поля
    reset() {
        // Удаляем все плитки
        this.tiles.forEach(tile => {
            if (tile.element && tile.element.parentNode) {
                tile.element.parentNode.removeChild(tile.element);
            }
        });
        
        // Сбрасываем массивы
        this.cells = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.tiles = [];
    },

    // Добавление новой плитки
    addTile(value, row, col, isNew = true) {
        // Проверяем, что ячейка свободна
        if (this.cells[row][col]) {
            console.warn('Ячейка уже занята, плитка не добавлена:', row, col);
            return null;
        }
        
        const tile = {
            value: value,
            row: row,
            col: col,
            element: this.createTileElement(value, row, col),
            mergedFrom: null,
            id: Date.now() + Math.random(),
            wasMerged: false, // Флаг для отслеживания слияния в текущем ходе
            isNew: isNew
        };
        
        this.tiles.push(tile);
        this.cells[row][col] = tile;
        this.tileContainer.appendChild(tile.element);
        
        // Анимация появления
        if (isNew) {
            tile.element.classList.add('tile-new');
            setTimeout(() => {
                tile.element.classList.remove('tile-new');
            }, 200);
        }
        
        return tile;
    },

    // Создание элемента плитки
    createTileElement(value, row, col) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        if (value > 2048) tile.classList.add('tile-super');
        
        tile.textContent = value;
        tile.dataset.value = value;
        tile.dataset.row = row;
        tile.dataset.col = col;
        tile.dataset.id = Date.now() + Math.random();
        
        // Устанавливаем абсолютные размеры
        tile.style.width = this.cellSize + 'px';
        tile.style.height = this.cellSize + 'px';
        
        // Устанавливаем позицию
        this.setTilePosition(tile, row, col);
        
        return tile;
    },

    // Установка позиции плитки
    setTilePosition(tileElement, row, col, animate = false) {
        // Вычисляем позицию с учетом отступов
        const x = col * (this.cellSize + this.gapSize) + this.boardPadding;
        const y = row * (this.cellSize + this.gapSize) + this.boardPadding;
        
        if (animate) {
            // Сохраняем текущую позицию
            const currentX = parseInt(tileElement.style.left) || x;
            const currentY = parseInt(tileElement.style.top) || y;
            
            // Устанавливаем переменные для анимации
            tileElement.style.setProperty('--start-x', `${currentX}px`);
            tileElement.style.setProperty('--start-y', `${currentY}px`);
            tileElement.style.setProperty('--end-x', `${x}px`);
            tileElement.style.setProperty('--end-y', `${y}px`);
            
            // Добавляем класс анимации
            tileElement.classList.add('tile-moving');
            
            // Убираем класс анимации после завершения
            setTimeout(() => {
                tileElement.classList.remove('tile-moving');
                tileElement.style.left = `${x}px`;
                tileElement.style.top = `${y}px`;
            }, 150);
        } else {
            tileElement.style.left = `${x}px`;
            tileElement.style.top = `${y}px`;
        }
        
        // Обновляем данные в DOM
        tileElement.dataset.row = row;
        tileElement.dataset.col = col;
    },

    // Получение случайной пустой ячейки
    getRandomEmptyCell() {
        const emptyCells = [];
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (!this.cells[row][col]) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        return emptyCells.length > 0 ? 
            emptyCells[Math.floor(Math.random() * emptyCells.length)] : 
            null;
    },

    // Добавление случайной плитки
    addRandomTile() {
        const emptyCell = this.getRandomEmptyCell();
        if (!emptyCell) return null;
        
        const value = Math.random() < 0.9 ? 2 : 4;
        return this.addTile(value, emptyCell.row, emptyCell.col, true);
    },

    // Подготовка к движению
    prepareForMove() {
        this.tiles.forEach(tile => {
            tile.wasMerged = false; // Сбрасываем флаг слияния
            tile.previousPosition = { row: tile.row, col: tile.col };
        });
    },

    // Перемещение плитки
    moveTile(tile, newRow, newCol) {
        // Если позиция не изменилась, ничего не делаем
        if (tile.row === newRow && tile.col === newCol) {
            return false;
        }
        
        // Освобождаем старую ячейку
        if (this.cells[tile.row][tile.col] === tile) {
            this.cells[tile.row][tile.col] = null;
        }
        
        // Проверяем, что новая ячейка свободна
        if (this.cells[newRow][newCol]) {
            console.warn('Новая ячейка уже занята:', newRow, newCol);
            return false;
        }
        
        // Занимаем новую ячейку
        this.cells[newRow][newCol] = tile;
        tile.row = newRow;
        tile.col = newCol;
        
        // Анимируем движение
        this.setTilePosition(tile.element, newRow, newCol, true);
        return true;
    },

    // Объединение двух плиток
    mergeTiles(sourceTile, targetTile) {
        // Проверяем, что плитки существуют и не были объединены в этом ходе
        if (!sourceTile || !targetTile || sourceTile.wasMerged || targetTile.wasMerged) {
            return null;
        }
        
        // Проверяем, что значения совпадают
        if (sourceTile.value !== targetTile.value) {
            return null;
        }
        
        // Создаем новую плитку с объединенным значением
        const newValue = sourceTile.value * 2;
        
        // Используем позицию targetTile для новой плитки
        const newRow = targetTile.row;
        const newCol = targetTile.col;
        
        // Удаляем исходные плитки
        this.removeTile(sourceTile);
        this.removeTile(targetTile);
        
        // Создаем новую плитку
        const mergedTile = this.addTile(newValue, newRow, newCol, false);
        
        // Помечаем новую плитку как результат слияния
        mergedTile.wasMerged = true;
        
        // Анимация слияния
        mergedTile.element.classList.add('tile-merged');
        setTimeout(() => {
            if (mergedTile.element) {
                mergedTile.element.classList.remove('tile-merged');
            }
        }, 300);
        
        return mergedTile;
    },

    // Удаление плитки
    removeTile(tile) {
        // Находим индекс плитки в массиве
        const index = this.tiles.indexOf(tile);
        if (index === -1) {
            return; // Плитка уже удалена
        }
        
        // Удаляем из массива плиток
        this.tiles.splice(index, 1);
        
        // Освобождаем ячейку, только если она все еще принадлежит этой плитке
        if (tile.row >= 0 && tile.col >= 0 && 
            tile.row < this.size && tile.col < this.size &&
            this.cells[tile.row] && this.cells[tile.row][tile.col] === tile) {
            this.cells[tile.row][tile.col] = null;
        }
        
        // Удаляем элемент из DOM
        if (tile.element && tile.element.parentNode) {
            tile.element.parentNode.removeChild(tile.element);
        }
    },

    // Проверка, можно ли переместить плитку
    canMoveTile(tile, direction) {
        const { row, col } = tile;
        
        switch (direction) {
            case 'up':
                return row > 0 && !this.cells[row - 1][col];
            case 'down':
                return row < this.size - 1 && !this.cells[row + 1][col];
            case 'left':
                return col > 0 && !this.cells[row][col - 1];
            case 'right':
                return col < this.size - 1 && !this.cells[row][col + 1];
            default:
                return false;
        }
    },

    // Проверка, можно ли объединить плитку
    canMergeTile(tile, direction) {
        const { row, col } = tile;
        let neighborTile = null;
        
        switch (direction) {
            case 'up':
                neighborTile = row > 0 ? this.cells[row - 1][col] : null;
                break;
            case 'down':
                neighborTile = row < this.size - 1 ? this.cells[row + 1][col] : null;
                break;
            case 'left':
                neighborTile = col > 0 ? this.cells[row][col - 1] : null;
                break;
            case 'right':
                neighborTile = col < this.size - 1 ? this.cells[row][col + 1] : null;
                break;
        }
        
        return neighborTile && neighborTile.value === tile.value && !neighborTile.wasMerged;
    },

    // Получение состояния доски
    getBoardState() {
        const state = [];
        for (let row = 0; row < this.size; row++) {
            state[row] = [];
            for (let col = 0; col < this.size; col++) {
                state[row][col] = this.cells[row][col] ? this.cells[row][col].value : 0;
            }
        }
        return state;
    },

    // Восстановление состояния доски
    restoreBoardState(state) {
        this.reset();
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (state[row][col] > 0) {
                    this.addTile(state[row][col], row, col, false);
                }
            }
        }
    },

    // Проверка на наличие доступных ходов
    hasMoves() {
        // Проверяем наличие пустых ячеек
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (!this.cells[row][col]) {
                    return true;
                }
            }
        }
        
        // Проверяем возможность слияния
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const tile = this.cells[row][col];
                if (tile) {
                    // Проверяем соседей
                    if (col < this.size - 1 && this.cells[row][col + 1] && 
                        this.cells[row][col + 1].value === tile.value) {
                        return true;
                    }
                    if (row < this.size - 1 && this.cells[row + 1][col] && 
                        this.cells[row + 1][col].value === tile.value) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    },
    
    // Отладочная информация
    debugState() {
        console.log('=== BOARD STATE ===');
        console.log('Всего плиток:', this.tiles.length);
        
        console.log('Состояние ячеек:');
        for (let row = 0; row < this.size; row++) {
            const rowValues = [];
            for (let col = 0; col < this.size; col++) {
                rowValues.push(this.cells[row][col] ? this.cells[row][col].value : 0);
            }
            console.log(`  ${row}: [${rowValues.join(', ')}]`);
        }
        
        console.log('Плитки:');
        this.tiles.forEach((tile, i) => {
            console.log(`  ${i}: ${tile.value} at (${tile.row}, ${tile.col})`);
        });
        
        console.log('==================');
    }
};