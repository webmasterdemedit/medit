// ============================================================
// MODE LECTURE - Toujours activé
// ============================================================

// ============================================================
// Initialisation - ACTIVÉ TOUJOURS
// ============================================================
function initLectureMode() {
    var toggle = document.getElementById('toggleLecture');
    
    // 🔥 TOUJOURS ACTIVÉ
    document.body.classList.add('mode-lecture');
    
    if (toggle) {
        toggle.textContent = '📖';
        toggle.title = 'Désactiver le mode lecture (temporairement)';
    }
    
    console.log('📖 Mode lecture TOUJOURS activé');
}

// ============================================================
// Basculer le mode (pour test)
// ============================================================
window.toggleLectureMode = function() {
    var isActive = document.body.classList.contains('mode-lecture');
    var toggle = document.getElementById('toggleLecture');
    
    if (isActive) {
        document.body.classList.remove('mode-lecture');
        if (toggle) {
            toggle.textContent = '🌙';
            toggle.title = 'Activer le mode lecture';
        }
        console.log('✅ Mode lecture DÉSACTIVÉ (temporairement)');
    } else {
        document.body.classList.add('mode-lecture');
        if (toggle) {
            toggle.textContent = '📖';
            toggle.title = 'Désactiver le mode lecture';
        }
        console.log('✅ Mode lecture RÉACTIVÉ');
    }
};

// ============================================================
// Démarrer
// ============================================================
function demarrerLectureMode() {
    initLectureMode();
}

// Exécution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrerLectureMode);
} else {
    demarrerLectureMode();
}
