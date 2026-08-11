// ============================================================
// AUTH.JS - Gestion de la connexion pour tout le site
// ============================================================

// Vérifier que config.js est chargé
if (typeof CONFIG === 'undefined') {
  console.error('❌ config.js n\'est pas chargé !');
}

var SCRIPT_URL = CONFIG.SCRIPT_URL;

// ============================================================
// GESTION DES UTILISATEURS
// ============================================================

function getPrenom() {
  return localStorage.getItem('etudiant_prenom') || null;
}

function setPrenom(prenom) {
  localStorage.setItem('etudiant_prenom', prenom);
}

function viderToutLeCache() {
  localStorage.removeItem('etudiant_prenom');
  localStorage.removeItem('historique_cache');
  localStorage.removeItem('profil_cache');
  localStorage.removeItem('messages_cache');
  var keys = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key && key.indexOf('notif_') === 0) {
      keys.push(key);
    }
  }
  for (var j = 0; j < keys.length; j++) {
    localStorage.removeItem(keys[j]);
  }
}

// ============================================================
// CONNEXION / DÉCONNEXION
// ============================================================

function seConnecter() {
  var nom = document.getElementById('inputNom').value.trim();
  var mdp = document.getElementById('inputMdp').value.trim();
  var msg = document.getElementById('messageConnexion');
  
  if (!nom || !mdp) {
    msg.textContent = '⚠️ Remplissez tous les champs.';
    msg.className = 'message-erreur';
    return;
  }
  
  msg.textContent = 'Connexion en cours...';
  msg.className = 'message-erreur';
  msg.style.color = '#64748b';
  viderToutLeCache();
  
  var url = SCRIPT_URL + '?action=login&nom=' + encodeURIComponent(nom) + '&mdp=' + encodeURIComponent(mdp);
  
  fetch(url)
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.success) {
        setPrenom(data.prenom || nom);
        msg.textContent = 'Connecté !';
        msg.className = 'message-succes';
        setTimeout(function() {
          fermerConnexion();
          location.reload();
        }, 600);
      } else {
        msg.textContent = data.message || 'Erreur de connexion';
        msg.className = 'message-erreur';
      }
    })
    .catch(function(error) {
      msg.textContent = '❌ Erreur réseau. Vérifiez votre connexion.';
      msg.className = 'message-erreur';
      console.error('Erreur:', error);
    });
}

function creerCompte() {
  var nom = document.getElementById('inputNom').value.trim();
  var mdp = document.getElementById('inputMdp').value.trim();
  var msg = document.getElementById('messageConnexion');
  
  if (!nom || !mdp) {
    msg.textContent = '⚠️ Remplissez tous les champs.';
    msg.className = 'message-erreur';
    return;
  }
  if (nom.length < 2) {
    msg.textContent = '⚠️ Nom trop court (2+).';
    msg.className = 'message-erreur';
    return;
  }
  if (mdp.length < 3) {
    msg.textContent = '⚠️ Mot de passe trop court (3+).';
    msg.className = 'message-erreur';
    return;
  }
  
  msg.textContent = 'Création du compte...';
  msg.className = 'message-erreur';
  msg.style.color = '#64748b';
  viderToutLeCache();
  
  var url = SCRIPT_URL + '?action=register&nom=' + encodeURIComponent(nom) + '&mdp=' + encodeURIComponent(mdp);
  
  fetch(url)
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.success) {
        setPrenom(data.prenom || nom);
        msg.textContent = 'Compte créé avec succès !';
        msg.className = 'message-succes';
        setTimeout(function() {
          fermerConnexion();
          location.reload();
        }, 600);
      } else {
        msg.textContent = data.message || '❌ Erreur de création';
        msg.className = 'message-erreur';
      }
    })
    .catch(function(error) {
      msg.textContent = '❌ Erreur réseau. Vérifiez votre connexion.';
      msg.className = 'message-erreur';
      console.error('Erreur:', error);
    });
}

// ============================================================
// MODAL DE CONNEXION
// ============================================================

function fermerConnexion() {
  var overlay = document.getElementById('connexion-overlay');
  if (overlay) {
    overlay.classList.remove('visible');
    overlay.style.display = 'none';
  }
}

function ouvrirConnexion() {
  var overlay = document.getElementById('connexion-overlay');
  if (overlay) {
    overlay.classList.add('visible');
    overlay.style.display = 'flex';
  }
  var inputNom = document.getElementById('inputNom');
  var inputMdp = document.getElementById('inputMdp');
  var msg = document.getElementById('messageConnexion');
  if (inputNom) inputNom.value = '';
  if (inputMdp) inputMdp.value = '';
  if (msg) {
    msg.textContent = '';
    msg.className = 'message-erreur';
  }
  setTimeout(function() {
    if (inputNom) inputNom.focus();
  }, 300);
}

// ============================================================
// BARRE SUPÉRIEURE
// ============================================================

function mettreAJourBarre() {
  var prenom = getPrenom();
  var btn = document.getElementById('btnDeconnexion');
  var span = document.getElementById('topBarPrenom');
  var btnMonEspace = document.getElementById('btnMonEspace');
  var btnTableauBord = document.getElementById('btnTableauBord');

  if (prenom) {
    if (span) span.textContent = prenom + ' | Connecté(e)';
    if (btnMonEspace) btnMonEspace.classList.remove('hidden');
    if (btnTableauBord) btnTableauBord.classList.remove('hidden');
    if (btn) {
      btn.classList.remove('hidden');
      btn.textContent = '🔓 Se déconnecter';
      btn.onclick = deconnecter;
    }
  } else {
    if (span) span.textContent = 'Simple lecteur - Vous n\'êtes connecté à aucun compte étudiant.';
    if (btnMonEspace) btnMonEspace.classList.add('hidden');
    if (btnTableauBord) btnTableauBord.classList.add('hidden');
    if (btn) {
      btn.classList.remove('hidden');
      btn.textContent = '👤 E-learning';
      btn.onclick = ouvrirConnexion;
    }
  }
}

// ============================================================
// DÉCONNEXION (utilisée par le header)
// ============================================================
function deconnecter() {
  if (confirm('Se déconnecter ?')) {
    localStorage.removeItem('etudiant_id');
    localStorage.removeItem('etudiant_niveau');
    location.reload();
  }
}
