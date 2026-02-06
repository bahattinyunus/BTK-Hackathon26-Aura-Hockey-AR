/**
 * UI Controls Handler
 * Manages options panel interactions
 */

// Control Mode Switching
const controlButtons = {
    hand: document.getElementById('control-hand'),
    head: document.getElementById('control-head'),
    mouse: document.getElementById('control-mouse')
};

// Difficulty Switching
const diffButtons = {
    easy: document.getElementById('diff-easy'),
    medium: document.getElementById('diff-medium'),
    hard: document.getElementById('diff-hard')
};

let currentControl = 'hand';
let currentDifficulty = 'medium';

// Control Mode Click Handlers
Object.keys(controlButtons).forEach(mode => {
    const btn = controlButtons[mode];
    if (btn) {
        btn.addEventListener('click', () => {
            // Remove active from all
            Object.values(controlButtons).forEach(b => b?.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            currentControl = mode;

            // Update status text (Optional: can be added to logs or status panel)
            if (window.game) {
                const modeText = {
                    hand: 'Neural Tracking Active',
                    mouse: 'Mouse Control Active'
                };
                window.game.addLog(`CONTROL_MODE: ${modeText[mode] || mode.toUpperCase()}`);
            }

            console.log(`Control mode changed to: ${mode}`);
        });
    }
});

// Difficulty Click Handlers
Object.keys(diffButtons).forEach(diff => {
    const btn = diffButtons[diff];
    if (btn) {
        btn.addEventListener('click', () => {
            // Remove active from all
            Object.values(diffButtons).forEach(b => b?.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            currentDifficulty = diff;

            console.log(`Difficulty changed to: ${diff}`);

            // Update AI speed based on difficulty
            if (window.game && window.game.physics) {
                const speeds = {
                    easy: 0.5,
                    medium: 0.8,
                    hard: 1.2
                };
                window.game.physics.aiSpeed = speeds[diff];
            }
        });
    }
});

// Export for use in other modules
export function getCurrentControl() {
    return currentControl;
}

export function getCurrentDifficulty() {
    return currentDifficulty;
}
