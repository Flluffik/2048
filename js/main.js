// main.js - Главный файл для инициализации приложения

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
    
    UI.init();
    
    setTimeout(() => {
        UI.showMessage('Добро пожаловать в игру 2048! Управление: стрелки клавиатуры или свайпы', 'info');
    }, 500);
    
    const updateMobileControls = () => {
        const mobileControls = document.querySelector('.mobile-controls');
        if (mobileControls) {
            if (window.innerWidth <= 600) {
                mobileControls.style.display = 'flex';
            } else {
                mobileControls.style.display = 'none';
            }
        }
    };
    
    window.addEventListener('resize', updateMobileControls);
    
    updateMobileControls();
});
