// ui.js - Управление пользовательским интерфейсом
window.UI = {
    // Инициализация UI
    init() {
        this.bindEvents();
        this.updateLeadersTable();
        this.hideMobileControls();
    },

    // Привязка событий
    bindEvents() {
        // Кнопка новой игры
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                Game.newGame();
                // Сбрасываем форму сохранения рекорда
                const saveScoreForm = document.getElementById('save-score-form');
                const saveSuccess = document.getElementById('save-success');
                const playerNameInput = document.getElementById('player-name');
                
                if (saveScoreForm) saveScoreForm.style.display = 'flex';
                if (saveSuccess) saveSuccess.style.display = 'none';
                if (playerNameInput) playerNameInput.value = '';
            });
        }

        // Кнопка отмены хода
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                if (Game.undo()) {
                    this.showMessage('Ход отменен', 'info');
                } else {
                    this.showMessage('Невозможно отменить ход', 'error');
                }
            });
        }

        // Кнопка таблицы лидеров
        const leadersBtn = document.getElementById('leaders-btn');
        const leadersModal = document.getElementById('leaders-modal');
        const closeLeadersBtn = document.getElementById('close-leaders-btn');
        
        if (leadersBtn && leadersModal) {
            leadersBtn.addEventListener('click', () => {
                this.updateLeadersTable();
                leadersModal.style.display = 'flex';
                this.hideMobileControls();
            });
        }
        
        if (closeLeadersBtn && leadersModal) {
            closeLeadersBtn.addEventListener('click', () => {
                leadersModal.style.display = 'none';
                this.showMobileControls();
            });
        }

        // Закрытие модального окна при клике вне его
        if (leadersModal) {
            leadersModal.addEventListener('click', (e) => {
                if (e.target === leadersModal) {
                    leadersModal.style.display = 'none';
                    this.showMobileControls();
                }
            });
        }

        // Кнопка сохранения счета
        const saveScoreBtn = document.getElementById('save-score-btn');
        const playerNameInput = document.getElementById('player-name');
        const saveScoreForm = document.getElementById('save-score-form');
        const saveSuccess = document.getElementById('save-success');
        const restartBtn = document.getElementById('restart-btn');
        
        if (saveScoreBtn && playerNameInput) {
            saveScoreBtn.addEventListener('click', () => {
                const playerName = playerNameInput.value.trim();
                if (playerName) {
                    const score = Game.getScore();
                    
                    if (Storage.saveScore(playerName, score)) {
                        // Скрываем форму и показываем сообщение об успехе
                        saveScoreForm.style.display = 'none';
                        saveSuccess.style.display = 'block';
                        
                        // Обновляем таблицу лидеров
                        this.updateLeadersTable();
                        
                        this.showMessage('Рекорд сохранен!', 'success');
                    } else {
                        this.showMessage('Ошибка при сохранении рекорда', 'error');
                    }
                } else {
                    this.showMessage('Введите имя', 'error');
                    playerNameInput.focus();
                }
            });
        }

        // Кнопка начала заново
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                Game.newGame();
                saveScoreForm.style.display = 'flex';
                saveSuccess.style.display = 'none';
                playerNameInput.value = '';
            });
        }

        // Кнопка очистки таблицы лидеров
        const clearLeadersBtn = document.getElementById('clear-leaders-btn');
        if (clearLeadersBtn) {
            clearLeadersBtn.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите очистить таблицу лидеров?')) {
                    Storage.clearLeaders();
                    this.updateLeadersTable();
                    this.showMessage('Таблица лидеров очищена', 'info');
                }
            });
        }

        // Мобильные кнопки управления
        const upBtn = document.getElementById('up-btn');
        const downBtn = document.getElementById('down-btn');
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');
        
        if (upBtn) upBtn.addEventListener('click', () => this.handleMove('up'));
        if (downBtn) downBtn.addEventListener('click', () => this.handleMove('down'));
        if (leftBtn) leftBtn.addEventListener('click', () => this.handleMove('left'));
        if (rightBtn) rightBtn.addEventListener('click', () => this.handleMove('right'));

        // Обработка клавиатуры
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName.toLowerCase() === 'input') return;
            
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.handleMove('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.handleMove('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.handleMove('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.handleMove('right');
                    break;
                case 'r':
                case 'R':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        Game.newGame();
                    }
                    break;
                case 'z':
                case 'Z':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        if (Game.undo()) {
                            this.showMessage('Ход отменен', 'info');
                        } else {
                            this.showMessage('Невозможно отменить ход', 'error');
                        }
                    }
                    break;
                case 'd':
                case 'D':
                    if (e.ctrlKey && e.shiftKey) {
                        e.preventDefault();
                        console.log('=== DEBUG MODE ===');
                        console.log('Score:', Game.score);
                        console.log('Best Score:', Game.bestScore);
                        console.log('Game Over:', Game.isGameOver);
                        console.log('Game Won:', Game.isGameWon);
                        console.log('Is Processing:', Game.isProcessing);
                        console.log('Move History Length:', Game.moveHistory.length);
                        Board.debugState();
                    }
                    break;
            }
        });

        // Обработка свайпов для мобильных устройств
        this.setupTouchControls();
    },

    // Обработка движения
    handleMove(direction) {
        const result = Game.move(direction);
        
        if (result.moved) {
            if (result.scoreAdded > 0) {
                this.showMessage(`+${result.scoreAdded}`, 'score');
            }
        } else {
            // Показываем сообщение только если игра не в процессе обработки и не окончена
            if (!Game.isProcessing && !Game.isGameOver) {
                this.showMessage('Невозможно переместить в этом направлении', 'info');
            }
        }
    },

    // Настройка обработки свайпов
    setupTouchControls() {
        const gameBoard = document.getElementById('game-board');
        if (!gameBoard) return;
        
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        gameBoard.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });
        
        gameBoard.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        gameBoard.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
            
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
            e.preventDefault();
        }, { passive: false });
    },

    // Обработка свайпа
    handleSwipe(startX, startY, endX, endY) {
        const dx = endX - startX;
        const dy = endY - startY;
        const minSwipeDistance = 30;
        
        // Определяем направление свайпа
        if (Math.abs(dx) > Math.abs(dy)) {
            // Горизонтальный свайп
            if (Math.abs(dx) > minSwipeDistance) {
                if (dx > 0) {
                    this.handleMove('right');
                } else {
                    this.handleMove('left');
                }
            }
        } else {
            // Вертикальный свайп
            if (Math.abs(dy) > minSwipeDistance) {
                if (dy > 0) {
                    this.handleMove('down');
                } else {
                    this.handleMove('up');
                }
            }
        }
    },

    // Обновление таблицы лидеров
    updateLeadersTable() {
        const leaders = Storage.getLeaders();
        const tableBody = document.getElementById('leaders-table-body');
        
        if (!tableBody) return;
        
        // Очищаем таблицу
        tableBody.innerHTML = '';
        
        // Заполняем таблицу
        leaders.forEach((leader, index) => {
            const row = document.createElement('tr');
            
            // Место
            const placeCell = document.createElement('td');
            placeCell.textContent = index + 1;
            
            // Имя
            const nameCell = document.createElement('td');
            nameCell.textContent = leader.name;
            
            // Счет
            const scoreCell = document.createElement('td');
            scoreCell.textContent = leader.score;
            
            // Дата
            const dateCell = document.createElement('td');
            dateCell.textContent = leader.date;
            
            row.appendChild(placeCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(dateCell);
            
            tableBody.appendChild(row);
        });
        
        // Если таблица пуста
        if (leaders.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.setAttribute('colspan', '4');
            cell.textContent = 'Таблица лидеров пуста';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            cell.style.color = '#999';
            
            row.appendChild(cell);
            tableBody.appendChild(row);
        }
    },

    // Показать сообщение
    showMessage(message, type = 'info') {
        // Создаем элемент сообщения
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;
        
        // Стилизация
        messageElement.style.position = 'fixed';
        messageElement.style.top = '20px';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translateX(-50%)';
        messageElement.style.padding = '10px 20px';
        messageElement.style.borderRadius = '5px';
        messageElement.style.zIndex = '10000';
        messageElement.style.fontWeight = 'bold';
        messageElement.style.transition = 'all 0.3s ease';
        
        // Цвета в зависимости от типа
        switch (type) {
            case 'success':
                messageElement.style.backgroundColor = '#4CAF50';
                messageElement.style.color = 'white';
                break;
            case 'error':
                messageElement.style.backgroundColor = '#f44336';
                messageElement.style.color = 'white';
                break;
            case 'info':
                messageElement.style.backgroundColor = '#2196F3';
                messageElement.style.color = 'white';
                break;
            case 'score':
                messageElement.style.backgroundColor = '#FF9800';
                messageElement.style.color = 'white';
                messageElement.style.fontSize = '24px';
                messageElement.style.padding = '15px 30px';
                break;
        }
        
        // Добавляем на страницу
        document.body.appendChild(messageElement);
        
        // Удаляем через 2 секунды (для score - через 1 секунду)
        setTimeout(() => {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateX(-50%) translateY(-20px)';
            
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, type === 'score' ? 1000 : 2000);
    },

    // Скрыть мобильные элементы управления
    hideMobileControls() {
        const mobileControls = document.querySelector('.mobile-controls');
        if (mobileControls) {
            mobileControls.style.display = 'none';
        }
    },

    // Показать мобильные элементы управления
    showMobileControls() {
        const mobileControls = document.querySelector('.mobile-controls');
        if (mobileControls && window.innerWidth <= 600) {
            mobileControls.style.display = 'flex';
        }
    }
};