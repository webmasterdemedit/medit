// ============================================================
// couverture.js — Lien-thème minimal : #Titre
// # jaune + titre coloré (couleur du thème)
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
    var estActuel  = !!options.actuel;
    var cliquable  = options.cliquable !== false;

    var lien = options.lien || ('/medit/thème.html?cat=' + encodeURIComponent(titre));
    var tag = (estActuel || !cliquable) ? 'div' : 'a';

    var attrs = '';
    if (tag === 'a') attrs = ' href="' + lien + '" title="' + _escapeHtml(titre) + '"';

    var html = '';
    html += '<' + tag + ' class="lien-theme' + (verrouille ? ' verrouille' : '') + (estActuel ? ' actuelle' : '') + '"' + attrs + '>';
    if (verrouille) html += '<span class="lien-theme-cadenas">🔒︎</span>';
    html += '<span class="lien-theme-hashtag">#</span>';
    html += '<span class="lien-theme-titre" style="color:' + couleur + '!important;">' + _escapeHtml(titre) + '</span>';
    html += '</' + tag + '>';
    return html;
  }

  window.construireCarteCouverture = construireCarteCouverture;

})();
