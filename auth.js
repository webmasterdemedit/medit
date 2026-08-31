// ============================================================
// auth.js - Gestion de l'authentification
// ============================================================

window.deconnecter = function() {
  if (confirm('Se déconnecter ?')) {
    localStorage.removeItem('etudiant_id');
    localStorage.removeItem('etudiant_nom');
    localStorage.removeItem('etudiant_niveau');
    window.location.href = '/medit/index.html';
  }
};

function estConnecte() {
  return localStorage.getItem('etudiant_id') !== null;
}

function estAdmin() {
  return localStorage.getItem('etudiant_id') === 'admin';
}

function getEtudiantId() {
  return localStorage.getItem('etudiant_id');
}
