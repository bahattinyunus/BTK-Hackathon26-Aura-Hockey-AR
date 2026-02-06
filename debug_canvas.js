// Test script - Console'da çalıştır
console.log('=== HAND SKELETON DEBUG ===');

// Canvas var mı?
const canvas = document.getElementById('hand-canvas');
console.log('Canvas element:', canvas);

if (canvas) {
    console.log('Canvas width:', canvas.width);
    console.log('Canvas height:', canvas.height);
    console.log('Canvas style:', canvas.className);

    // Test çizimi
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(10, 10, 50, 50);
    console.log('Test square drawn (should see green square)');
} else {
    console.error('❌ Canvas element NOT FOUND!');
}

// Vision module var mı?
console.log('Vision module loaded:', typeof Vision !== 'undefined');

// drawHandSkeleton fonksiyonu var mı?
if (window.game && window.game.vision) {
    console.log('Vision instance:', window.game.vision);
    console.log('drawHandSkeleton method:', typeof window.game.vision.drawHandSkeleton);
}
