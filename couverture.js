// ============================================================
// couverture.js — CARTE-COUVERTURE PAYSAGE MINIMALE
// Contenu : titre, sous-titre, image, progression
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
    var couleur     = theme.couleur || '#f5f5f5';
    var sousTitre   = theme.sousTitre || '';
    var pourcentage = theme.pourcentage || 0;
    var couverture  = theme.couverture || '';
    var verrouille  = theme.verrouille || theme.disponible === false;

    var estActuel   = !!options.actuel;
    var cliquable   = options.cliquable !== false;
    var showImage   = options.showImage !== false;

    var lien = options.lien || ('/medit/thème.html?cat=' + encodeURIComponent(titre));

    var tag = (estActuel || !cliquable) ? 'div' : 'a';
    var attrs = '';
    if (tag === 'a') {
      attrs = ' href="' + lien + '" title="' + _escapeHtml(titre) + '"';
    }

    var styleInline = 'background: ' + couleur + '; border-color: ' + couleur + ';';
    var classeVerrou = verrouille ? ' verrouille' : '';

    var html = '';
    html += '<' + tag + ' class="carte-couverture' + classeVerrou + (estActuel ? ' actuelle' : '') + '"';
    html += ' style="' + styleInline + '"' + attrs + '>';

    if (verrouille) {
      html += '<div class="cadenas-verrou">🔒︎︎︎</div>';
    }

    // Image à gauche
    if (showImage && couverture) {
      html += '<div class="couverture-image"><img src="' + couverture + '" alt="" loading="lazy"></div>';
    }

    // Texte à droite : titre + sous-titre
    html += '<div class="contenu-theme">';
    html += '<div class="titre-wrapper">';
    html += '<span class="titre-theme">#' + _escapeHtml(titre) + '</span>';
    if (sousTitre) {
      html += '<span class="sous-titre-theme">' + _escapeHtml(sousTitre) + '</span>';
    }
    html += '</div>';
    html += '</div>';

    // Progression
    html += '<div class="progression-theme"><div class="barre" style="width: ' + pourcentage + '%;"></div></div>';

    html += '</' + tag + '>';
    return html;
  }

  window.construireCarteCouverture = construireCarteCouverture;

})();
