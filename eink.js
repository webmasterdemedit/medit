// ============================================================
// EFFET E-INK REFRESH
// ============================================================

// Fonction pour déclencher le refresh e-ink
function triggerEinkRefresh() {
  // Retirer la classe si déjà présente
  document.body.classList.remove('eink-refresh');
  
  // Forcer un reflow pour réinitialiser l'animation
  void document.body.offsetHeight;
  
  // Ajouter la classe pour démarrer l'animation
  document.body.classList.add('eink-refresh');
  
  // Retirer la classe après l'animation
  setTimeout(() => {
    document.body.classList.remove('eink-refresh');
  }, 400);
}

// ============================================================
// DÉCLENCHER AU CHANGEMENT DE PAGE
// ============================================================

// Exécuter au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  
  // 1. Pour tous les liens qui changent de page
  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', function(e) {
      // Ne pas capturer les liens qui ouvrent dans un nouvel onglet
      if (this.target === '_blank') return;
      
      // Ne pas capturer les ancres internes (#)
      if (this.getAttribute('href').startsWith('#')) return;
      
      // Déclencher le refresh
      triggerEinkRefresh();
    });
  });
  
  // 2. Pour les boutons de navigation
  document.querySelectorAll('.btn-nav, .btn-entrer, .btn-lire, .btn-submit').forEach(btn => {
    btn.addEventListener('click', function() {
      triggerEinkRefresh();
    });
  });
  
  // 3. Observer les changements de contenu (pour les SPA)
  const mainContainer = document.querySelector('main') || document.querySelector('.page') || document.body;
  
  const contentObserver = new MutationObserver(() => {
    // Petit délai pour laisser le contenu se charger
    setTimeout(triggerEinkRefresh, 50);
  });
  
  contentObserver.observe(mainContainer, {
    childList: true,
    subtree: true
  });
});
