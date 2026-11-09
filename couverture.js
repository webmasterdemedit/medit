// ============================================================
// couverture.js — CARTE-COUVERTURE MINIMALE (thème, pas livret)
// Contenu : titre coloré avec # (transparent, sans hauteur)
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

    var titre      = theme.titre || theme.nom || '';
    var couleur    = theme.couleur || '#2d6a4f';
    var verrouille = theme.verrouille || theme.disponible === false;

    var estActuel = !!options.actuel;
    var cliquable = options.cliquable !== false;

    var lien = options.lien || ('/medit/thème.html?cat=' + encodeURIComponent(titre));

    var tag = (estActuel || !cliquable) ? 'div' : 'a';
    var attrs = '';
    if (tag === 'a') {
      attrs = ' href="' + lien + '" title="' + _escapeHtml(titre) + '"';
    }

    var classeVerrou = verrouille ? ' verrouille' : '';

    var html = '';
    html += '<' + tag + ' class="carte-couverture carte-theme-lien' + classeVerrou + (estActuel ? ' actuelle' : '') + '"';
    html += attrs + '>';

    if (verrouille) {
      html += '<span class="cadenas-verrou">🔒︎</span>';
    }

    html += '<span class="titre-theme" style="color:' + couleur + ';">#' + _escapeHtml(titre) + '</span>';

    html += '</' + tag + '>';
    return html;
  }

  window.construireCarteCouverture = construireCarteCouverture;

})();
