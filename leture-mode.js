// ============================================================
// MODE LECTURE - Système de basculement
// ============================================================

var MODE_LECTURE_KEY = 'qiraat_mode_lecture';

// ============================================================
// Initialisation
// ============================================================
function initLectureMode() {
    var mode = localStorage.getItem(MODE_LECTURE_KEY);
    if (mode === 'true') {
        document.body.classList.add('mode-lecture');
        updateToggleIcon(true);
    } else {
        document.body.classList.remove('mode-lecture');
        updateToggleIcon(false);
    }
}

// ============================================================
// Basculer le mode
// ============================================================
function toggleLectureMode() {
    var isActive = document.body.classList.contains('mode-lecture');
    
    if (isActive) {
        document.body.classList.remove('mode-lecture');
        localStorage.setItem(MODE_LECTURE_KEY, 'false');
        updateToggleIcon(false);
    } else {
        document.body.classList.add('mode-lecture');
        localStorage.setItem(MODE_LECTURE_KEY, 'true');
        updateToggleIcon(true);
    }
}

// ============================================================
// Mettre à jour l'icône du toggle
// ============================================================
function updateToggleIcon(active) {
    var toggle = document.getElementById('toggleLecture');
    if (!toggle) return;
    
    if (active) {
        toggle.textContent = '📖';
        toggle.title = 'Désactiver le mode lecture';
    } else {
        toggle.textContent = '🌙';
        toggle.title = 'Activer le mode lecture';
    }
}

// ============================================================
// Créer le toggle s'il n'existe pas (avec retry)
// ============================================================
function ajouterToggleLecture() {
    var nav = document.getElementById('headerNav');
    if (!nav) {
        // Si le nav n'existe pas encore, réessayer dans 200ms
        setTimeout(ajouterToggleLecture, 200);
        return;
    }
    
    // Vérifier si le toggle existe déjà
    if (document.getElementById('toggleLecture')) return;
    
    var toggle = document.createElement('button');
    toggle.id = 'toggleLecture';
    toggle.className = 'toggle-lecture';
    toggle.setAttribute('aria-label', 'Mode lecture');
    toggle.onclick = toggleLectureMode;
    
    // Insérer en premier dans le nav
    nav.insertBefore(toggle, nav.firstChild);
    
    // Mettre à jour l'icône
    var isActive = document.body.classList.contains('mode-lecture');
    updateToggleIcon(isActive);
}

// ============================================================
// Démarrer
// ============================================================
function demarrerLectureMode() {
    initLectureMode();
    ajouterToggleLecture();
}

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrerLectureMode);
} else {
    demarrerLectureMode();
}
