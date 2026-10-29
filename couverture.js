// ============================================================
// couverture.js — CARTE-COUVERTURE PAYSAGE MINIMALE
// Contenu : titre, sous-titre, image, progression
// + Couleur du titre/sous-titre via theme.couleurTitre
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

  function _couleurValide(c) {
    if (!c) return '';
    var v = String(c).trim();
    if (!v) return '';
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return v;
    if (/^(rgb|rgba|hsl|hsla)\s*\(/i.test(v)) return v;
    if (/^[a-zA-Z]+$/.test(v)) return v;
    return '';
  }

  function construireCarteCouverture(theme, options) {
    theme = theme || {};
    options = options || {};

    var titre        = theme.titre || theme.nom || '';
    var couleur      = theme.couleur || '#f5f5f5';
    var couleurTitre = _couleurValide(theme.couleurTitre || theme.couleur_texte || theme.couleurTitreCarte);
    var sousTitre    = theme.sousTitre || '';
    var pourcentage  = theme.pourcentage || 0;
    var couverture   = theme.couverture || '';
    var verrouille   = theme.verrouille || theme.disponible === false;

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

    var styleTitre = couleurTitre ? ' style="color:' + couleurTitre + ';"' : '';

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
    html += '<span class="titre-theme"' + styleTitre + '>' + _escapeHtml(titre) + '</span>';
    if (sousTitre) {
      html += '<span class="sous-titre-theme"' + styleTitre + '>' + _escapeHtml(sousTitre) + '</span>';
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
