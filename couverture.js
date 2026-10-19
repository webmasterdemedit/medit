// ============================================================
// couverture.js — CARTE-COUVERTURE PAYSAGE MINIMALE
// Contenu : titre, sous-titre, image, progression, nombre de textes
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

    // nombre de textes — on accepte plusieurs noms de propriété
    var nombreTextes =
      (theme.nombreTextes !== undefined && theme.nombreTextes !== null) ? parseInt(theme.nombreTextes, 10) :
      (theme.nbTextes     !== undefined && theme.nbTextes     !== null) ? parseInt(theme.nbTextes, 10) :
      (theme.nbTextesTotal!== undefined && theme.nbTextesTotal!== null) ? parseInt(theme.nbTextesTotal, 10) :
      0;
    if (isNaN(nombreTextes)) nombreTextes = 0;

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

    // Texte à droite : titre + sous-titre + nombre de textes
    html += '<div class="contenu-theme">';
    html += '<div class="titre-wrapper">';
    html += '<span class="titre-theme">#' + _escapeHtml(titre) + '</span>';
    if (sousTitre) {
      html += '<span class="sous-titre-theme">' + _escapeHtml(sousTitre) + '</span>';
    }
    html += '</div>';

    // Nombre de textes — TEXTE jaune, grand, quasi pleine largeur
    html += '<div class="nombre-textes">';
    html += nombreTextes + (nombreTextes > 1 ? ' textes' : ' texte');
    html += '</div>';

    html += '</div>';

    // Progression
    html += '<div class="progression-theme"><div class="barre" style="width: ' + pourcentage + '%;"></div></div>';

    html += '</' + tag + '>';
    return html;
  }

  window.construireCarteCouverture = construireCarteCouverture;

})();
