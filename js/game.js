// game.js - Основная игровая логика
window.Game = {
    score: 0,
    bestScore: 0,
    isGameOver: false,
    isGameWon: false,
    moveHistory: [],
    maxHistorySize: 10,
    isProcessing: false, // Флаг для предотвращения повторной обработки

    // Инициализация игры
    init() {
        this.score = 0;
        this.isGameOver = false;
        this.isGameWon = false;
        this.moveHistory = [];
        this.isProcessing = false;
        
        // Загружаем лучший счет
        this.bestScore = Storage.getBestScore() || 0;
        
        // Инициализируем игровое поле
        Board.init('game-board');
        
        // Загружаем сохраненное состояние
        this.loadGame();
        
        // Если игра новая, добавляем начальные плитки
        if (this.moveHistory.length === 0) {
            this.addInitialTiles();
            this.saveMove();
        }
        
        // Обновляем UI
        this.updateScoreDisplay();
    },

    // Добавление начальных плиток
    addInitialTiles() {
        // Добавляем 2 начальные плитки
        for (let i = 0; i < 2; i++) {
            Board.addRandomTile();
        }
    },

    // Сохранение хода
    saveMove() {
        const move = {
            board: Board.getBoardState(),
            score: this.score,
            isGameOver: this.isGameOver,
            tiles: this.getTilesSnapshot()
        };
        
        this.moveHistory.push(move);
        
        // Ограничиваем историю
        if (this.moveHistory.length > this.maxHistorySize) {
            this.moveHistory.shift();
        }
        
        this.saveGame();
    },

    // Снапшот плиток
    getTilesSnapshot() {
        return Board.tiles.map(tile => ({
            value: tile.value,
            row: tile.row,
            col: tile.col
        }));
    },

    // Восстановление из снапшота
    restoreTilesFromSnapshot(tilesSnapshot) {
        if (!tilesSnapshot || !Array.isArray(tilesSnapshot)) return;
        
        Board.reset();
        tilesSnapshot.forEach(tileData => {
            if (tileData && typeof tileData.value === 'number') {
                Board.addTile(tileData.value, tileData.row, tileData.col, false);
            }
        });
    },

    // Отмена хода
    undo() {
        if (this.moveHistory.length > 1 && !this.isGameOver && !this.isProcessing) {
            this.moveHistory.pop();
            const previousMove = this.moveHistory[this.moveHistory.length - 1];
            
            if (previousMove && previousMove.tiles) {
                this.restoreTilesFromSnapshot(previousMove.tiles);
                this.score = previousMove.score || 0;
                this.isGameOver = previousMove.isGameOver || false;
                
                this.updateScoreDisplay();
                this.updateGameOverDisplay();
                this.saveGame();
                
                return true;
            }
        }
        return false;
    },

    // Новая игра
    newGame() {
        if (this.isProcessing) return;
        
        Board.reset();
        this.score = 0;
        this.isGameOver = false;
        this.isGameWon = false;
        this.moveHistory = [];
        this.isProcessing = false;
        
        this.addInitialTiles();
        this.saveMove();
        this.updateScoreDisplay();
        this.updateGameOverDisplay();
        
        // Сброс формы сохранения
        const saveScoreForm = document.getElementById('save-score-form');
        const saveSuccess = document.getElementById('save-success');
        const playerNameInput = document.getElementById('player-name');
        
        if (saveScoreForm) saveScoreForm.style.display = 'flex';
        if (saveSuccess) saveSuccess.style.display = 'none';
        if (playerNameInput) playerNameInput.value = '';
        
        this.saveGame();
    },

    // Основной метод движения
    move(direction) {
        // Проверяем возможность движения
        if (this.isGameOver || this.isProcessing) {
            return { moved: false, scoreAdded: 0 };
        }
        
        this.isProcessing = true;
        
        // Подготавливаем доску к движению
        Board.prepareForMove();
        
        let moved = false;
        let scoreAdded = 0;
        
        // Выполняем движение в зависимости от направления
        switch (direction) {
            case 'up':
                ({ moved, scoreAdded } = this.moveUp());
                break;
            case 'down':
                ({ moved, scoreAdded } = this.moveDown());
                break;
            case 'left':
                ({ moved, scoreAdded } = this.moveLeft());
                break;
            case 'right':
                ({ moved, scoreAdded } = this.moveRight());
                break;
        }
        
        // Если было движение
        if (moved) {
            // Добавляем очки
            this.score += scoreAdded;
            
            // Обновляем лучший счет
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                Storage.saveBestScore(this.score);
            }
            
            // Добавляем новую плитку после небольшой задержки для анимаций
            setTimeout(() => {
                const newTile = Board.addRandomTile();
                
                if (newTile) {
                    // Сохраняем ход
                    this.saveMove();
                    
                    // Проверяем условия игры
                    this.checkWinCondition();
                    if (!Board.hasMoves()) {
                        this.isGameOver = true;
                    }
                    
                    // Обновляем UI
                    this.updateScoreDisplay();
                    this.updateGameOverDisplay();
                }
                
                this.isProcessing = false;
            }, 150);
        } else {
            this.isProcessing = false;
        }
        
        return { moved, scoreAdded };
    },

    // Движение вверх
    moveUp() {
        let moved = false;
        let scoreAdded = 0;
        
        // Обрабатываем каждый столбец
        for (let col = 0; col < Board.size; col++) {
            // Обрабатываем каждую строку сверху вниз
            for (let row = 1; row < Board.size; row++) {
                const tile = Board.cells[row][col];
                if (!tile) continue;
                
                // Пытаемся переместить плитку вверх
                let currentRow = row;
                while (currentRow > 0) {
                    const targetRow = currentRow - 1;
                    const targetTile = Board.cells[targetRow][col];
                    
                    // Если целевая ячейка пуста - перемещаем
                    if (!targetTile) {
                        if (Board.moveTile(tile, targetRow, col)) {
                            moved = true;
                            currentRow = targetRow;
                            continue;
                        }
                    }
                    
                    // Если можно объединить
                    if (targetTile && targetTile.value === tile.value && !targetTile.wasMerged) {
                        const mergedTile = Board.mergeTiles(tile, targetTile);
                        if (mergedTile) {
                            moved = true;
                            scoreAdded += mergedTile.value;
                        }
                        break;
                    }
                    
                    // Если целевая ячейка занята другой плиткой - останавливаемся
                    break;
                }
            }
        }
        
        return { moved, scoreAdded };
    },

    // Движение вниз
    moveDown() {
        let moved = false;
        let scoreAdded = 0;
        
        // Обрабатываем каждый столбец
        for (let col = 0; col < Board.size; col++) {
            // Обрабатываем каждую строку снизу вверх
            for (let row = Board.size - 2; row >= 0; row--) {
                const tile = Board.cells[row][col];
                if (!tile) continue;
                
                // Пытаемся переместить плитку вниз
                let currentRow = row;
                while (currentRow < Board.size - 1) {
                    const targetRow = currentRow + 1;
                    const targetTile = Board.cells[targetRow][col];
                    
                    // Если целевая ячейка пуста - перемещаем
                    if (!targetTile) {
                        if (Board.moveTile(tile, targetRow, col)) {
                            moved = true;
                            currentRow = targetRow;
                            continue;
                        }
                    }
                    
                    // Если можно объединить
                    if (targetTile && targetTile.value === tile.value && !targetTile.wasMerged) {
                        const mergedTile = Board.mergeTiles(tile, targetTile);
                        if (mergedTile) {
                            moved = true;
                            scoreAdded += mergedTile.value;
                        }
                        break;
                    }
                    
                    // Если целевая ячейка занята другой плиткой - останавливаемся
                    break;
                }
            }
        }
        
        return { moved, scoreAdded };
    },

    // Движение влево
    moveLeft() {
        let moved = false;
        let scoreAdded = 0;
        
        // Обрабатываем каждую строку
        for (let row = 0; row < Board.size; row++) {
            // Обрабатываем каждый столбец слева направо
            for (let col = 1; col < Board.size; col++) {
                const tile = Board.cells[row][col];
                if (!tile) continue;
                
                // Пытаемся переместить плитку влево
                let currentCol = col;
                while (currentCol > 0) {
                    const targetCol = currentCol - 1;
                    const targetTile = Board.cells[row][targetCol];
                    
                    // Если целевая ячейка пуста - перемещаем
                    if (!targetTile) {
                        if (Board.moveTile(tile, row, targetCol)) {
                            moved = true;
                            currentCol = targetCol;
                            continue;
                        }
                    }
                    
                    // Если можно объединить
                    if (targetTile && targetTile.value === tile.value && !targetTile.wasMerged) {
                        const mergedTile = Board.mergeTiles(tile, targetTile);
                        if (mergedTile) {
                            moved = true;
                            scoreAdded += mergedTile.value;
                        }
                        break;
                    }
                    
                    // Если целевая ячейка занята другой плиткой - останавливаемся
                    break;
                }
            }
        }
        
        return { moved, scoreAdded };
    },

    // Движение вправо
    moveRight() {
        let moved = false;
        let scoreAdded = 0;
        
        // Обрабатываем каждую строку
        for (let row = 0; row < Board.size; row++) {
            // Обрабатываем каждый столбец справа налево
            for (let col = Board.size - 2; col >= 0; col--) {
                const tile = Board.cells[row][col];
                if (!tile) continue;
                
                // Пытаемся переместить плитку вправо
                let currentCol = col;
                while (currentCol < Board.size - 1) {
                    const targetCol = currentCol + 1;
                    const targetTile = Board.cells[row][targetCol];
                    
                    // Если целевая ячейка пуста - перемещаем
                    if (!targetTile) {
                        if (Board.moveTile(tile, row, targetCol)) {
                            moved = true;
                            currentCol = targetCol;
                            continue;
                        }
                    }
                    
                    // Если можно объединить
                    if (targetTile && targetTile.value === tile.value && !targetTile.wasMerged) {
                        const mergedTile = Board.mergeTiles(tile, targetTile);
                        if (mergedTile) {
                            moved = true;
                            scoreAdded += mergedTile.value;
                        }
                        break;
                    }
                    
                    // Если целевая ячейка занята другой плиткой - останавливаемся
                    break;
                }
            }
        }
        
        return { moved, scoreAdded };
    },

    // Проверка победы
    checkWinCondition() {
        for (let row = 0; row < Board.size; row++) {
            for (let col = 0; col < Board.size; col++) {
                const tile = Board.cells[row][col];
                if (tile && tile.value >= 2048) {
                    this.isGameWon = true;
                    return true;
                }
            }
        }
        return false;
    },

    // Сохранение игры
    saveGame() {
        const gameState = {
            board: Board.getBoardState(),
            score: this.score,
            bestScore: this.bestScore,
            isGameOver: this.isGameOver,
            isGameWon: this.isGameWon,
            moveHistory: this.moveHistory
        };
        
        Storage.saveGameState(gameState);
    },

    // Загрузка игры
    loadGame() {
        const savedState = Storage.loadGameState();
        
        if (savedState) {
            this.score = savedState.score || 0;
            this.bestScore = savedState.bestScore || 0;
            this.isGameOver = savedState.isGameOver || false;
            this.isGameWon = savedState.isGameWon || false;
            this.moveHistory = savedState.moveHistory || [];
            
            if (this.moveHistory.length > 0) {
                const lastMove = this.moveHistory[this.moveHistory.length - 1];
                if (lastMove && lastMove.tiles) {
                    this.restoreTilesFromSnapshot(lastMove.tiles);
                } else {
                    this.addInitialTiles();
                    this.saveMove();
                }
            } else {
                this.addInitialTiles();
                this.saveMove();
            }
            
            return true;
        }
        
        return false;
    },

    // Обновление счета
    updateScoreDisplay() {
        const scoreElement = document.getElementById('score');
        const bestScoreElement = document.getElementById('best-score');
        
        if (scoreElement) {
            scoreElement.textContent = this.score;
            scoreElement.classList.add('score-update');
            setTimeout(() => {
                scoreElement.classList.remove('score-update');
            }, 300);
        }
        
        if (bestScoreElement) {
            bestScoreElement.textContent = this.bestScore;
        }
    },

    // Обновление окончания игры
    updateGameOverDisplay() {
        const gameOverElement = document.getElementById('game-over');
        const finalScoreElement = document.getElementById('final-score');
        
        if (gameOverElement && finalScoreElement) {
            if (this.isGameOver) {
                finalScoreElement.textContent = this.score;
                gameOverElement.style.display = 'flex';
            } else {
                gameOverElement.style.display = 'none';
            }
        }
    },

    // Получение счета
    getScore() {
        return this.score;
    }
};