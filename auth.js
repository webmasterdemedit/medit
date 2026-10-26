// ============================================================
// auth.js - Pseudo simple
// L'utilisateur entre un pseudo, ses tentatives sont enregistrées
// sous ce pseudo. Il les retrouve en retapant le même pseudo.
// ============================================================

var AUTH = {
  CLE_PSEUDO:  'qiraat_pseudo',
  CLE_INVITE:  'qiraat_session_invite',

  getPseudo: function() {
    return (localStorage.getItem(this.CLE_PSEUDO) || '').trim();
  },

  setPseudo: function(pseudo) {
    var p = (pseudo || '').trim();
    if (!p) localStorage.removeItem(this.CLE_PSEUDO);
    else localStorage.setItem(this.CLE_PSEUDO, p);
  },

  aUnPseudo: function() {
    return this.getPseudo() !== '';
  },

  getInviteId: function() {
    var sid = localStorage.getItem(this.CLE_INVITE);
    if (!sid) {
      sid = 'invite_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
      localStorage.setItem(this.CLE_INVITE, sid);
    }
    return sid;
  },

  // Identifiant utilisé pour TOUTES les sauvegardes :
  // - pseudo si saisi
  // - sinon invite_xxx (localStorage)
  getIdUtilisateur: function() {
    return this.getPseudo() || this.getInviteId();
  }
};

// ============================================================
// Compatibilité avec l'ancien code
// ============================================================
function getIdUtilisateur() { return AUTH.getIdUtilisateur(); }
function estConnecte()      { return AUTH.aUnPseudo(); }
function estAdmin()         { return false; }
function getEtudiantId()    { return AUTH.getPseudo(); }
function getEtudiantNom()   { return AUTH.getPseudo(); }
