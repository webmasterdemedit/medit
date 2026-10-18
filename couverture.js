// ============================================================
// couverture.js — CARTE-COUVERTURE (format carré, style blog)
// Une seule fonction : construireCarteCouverture(theme, options)
// ============================================================

(function() {
  'use strict';

  function _escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function construireCarteCouverture(theme, options) {
    theme = theme || {};
    options = options || {};

    var titre       = theme.titre || theme.nom || '';
    var couleur     = theme.couleur || '#2d6a4f';
    var sousTitre   = theme.sousTitre || '';
    var auteur      = theme.auteur || '';
    var niveau      = parseInt(theme.niveau) || 0;
    var pourcentage = theme.pourcentage || 0;
    var couverture  = theme.couverture || '';
    var verrouille  = theme.verrouille || theme.disponible === false;

    var estActuel   = !!options.actuel;
    var cliquable   = options.cliquable !== false;
    var badgeNiveau = options.badgeNiveau !== false;
    var showImage   = options.showImage !== false && !!couverture;

    var lien = options.lien || ('/medit/thème.html?cat=' + encodeURIComponent(titre));
    var tag = (estActuel || !cliquable) ? 'div' : 'a';
    var attrs = (tag === 'a')
      ? ' href="' + lien + '" title="' + _escapeHtml(titre) + '"'
      : '';

    var classes = 'carte-couverture';
    if (verrouille) classes += ' verrouille';
    if (estActuel)  classes += ' actuelle';

    var html = '';
    html += '<' + tag + ' class="' + classes + '"' + attrs + '>';

    if (verrouille) {
      html += '<div class="cadenas-verrou">🔒</div>';
    }

    if (badgeNiveau && niveau > 0) {
      html += '<span class="badge-niveau">Niv. ' + niveau + '</span>';
    }

    html += '<div class="contenu-theme">';

    // Image (cercle) en haut
    if (showImage) {
      html += '<div class="couverture-image"><img src="' + _escapeHtml(couverture) + '" alt="" loading="lazy"></div>';
    }

    // Auteur
    if (auteur) {
      html += '<span class="auteur-theme">' + _escapeHtml(auteur) + '</span>';
    }

    // Titre
    html += '<span class="titre-theme">#' + _escapeHtml(titre) + '</span>';

    // Sous-titre
    if (sousTitre) {
      html += '<span class="sous-titre-theme">' + _escapeHtml(sousTitre) + '</span>';
    }

    html += '</div>';

    // Barre de progression en bas
    html += '<div class="progression-theme"><div class="barre" style="width: ' + pourcentage + '%;"></div></div>';

    html += '</' + tag + '>';
    return html;
  }

  window.construireCarteCouverture = construireCarteCouverture;
})();
