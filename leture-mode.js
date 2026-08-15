// ============================================================
// MODE LECTURE - Version ultra simple AVEC EXPOSITION GLOBALE
// ============================================================

var MODE_LECTURE_KEY = 'qiraat_mode_lecture';

// ============================================================
// Initialisation
// ============================================================
function initLectureMode() {
    var mode = localStorage.getItem(MODE_LECTURE_KEY);
    var toggle = document.getElementById('toggleLecture');
    
    if (mode === 'true') {
        document.body.classList.add('mode-lecture');
        if (toggle) {
            toggle.textContent = '📖';
            toggle.title = 'Désactiver le mode lecture';
        }
    } else {
        document.body.classList.remove('mode-lecture');
        if (toggle) {
            toggle.textContent = '🌙';
            toggle.title = 'Activer le mode lecture';
        }
    }
}

// ============================================================
// Basculer le mode - EXPOSÉ GLOBALEMENT
// ============================================================
window.toggleLectureMode = function() {
    var isActive = document.body.classList.contains('mode-lecture');
    var toggle = document.getElementById('toggleLecture');
    
    console.log('🔄 Clic sur le bouton ! Mode actif :', isActive);
    
    if (isActive) {
        document.body.classList.remove('mode-lecture');
        localStorage.setItem(MODE_LECTURE_KEY, 'false');
        if (toggle) {
            toggle.textContent = '🌙';
            toggle.title = 'Activer le mode lecture';
        }
        console.log('✅ Mode lecture DÉSACTIVÉ');
    } else {
        document.body.classList.add('mode-lecture');
        localStorage.setItem(MODE_LECTURE_KEY, 'true');
        if (toggle) {
            toggle.textContent = '📖';
            toggle.title = 'Désactiver le mode lecture';
        }
        console.log('✅ Mode lecture ACTIVÉ');
    }
};

// ============================================================
// Démarrer
// ============================================================
function demarrerLectureMode() {
    console.log('📖 Mode Lecture : initialisation...');
    initLectureMode();
}

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrerLectureMode);
} else {
    demarrerLectureMode();
}
