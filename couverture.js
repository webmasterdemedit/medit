// ============================================================
// couverture.js — CARTE-COUVERTURE PAYSAGE OLD SCHOOL
// Le style "old school" est posé en inline dans le JS.
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

    // ------------------------------------------------------------
    // STYLE OLD SCHOOL (inline)
    // ------------------------------------------------------------
    var styleInline = [
      'position: relative',
      'display: flex',
      'align-items: center',
      'gap: 12px',
      'padding: 12px 14px',
      'background: ' + couleur,
      'border: 2px solid #2b2b2b',
      'border-radius: 3px',
      'color: #fff',
      "font-family: Georgia, 'Times New Roman', serif",
      'text-decoration: none',
      'overflow: hidden',
      // ombre dure + liseré interne = effet tampon/imprimé
      'box-shadow: 4px 4px 0 rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.12)',
      // halo sombre pour garantir le titre blanc lisible
      'background-image: linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.05) 100%), radial-gradient(rgba(0,0,0,0.18) 1px, transparent 1px)',
      'background-size: 100% 100%, 4px 4px'
    ].join('; ') + ';';

    var classeVerrou = verrouille ? ' verrouille' : '';

    // Style inline du titre : BLANC + ombre portée
    var styleTitre = [
      'font-size: 1.15rem',
      'font-weight: 700',
      'letter-spacing: 0.03em',
      'color: #ffffff',
      'text-shadow: 1px 1px 0 rgba(0,0,0,0.85), 0 0 6px rgba(0,0,0,0.5)',
      'white-space: nowrap',
      'overflow: hidden',
      'text-overflow: ellipsis'
    ].join('; ') + ';';

    var styleSousTitre = [
      'font-size: 0.85rem',
      'font-style: italic',
      'color: #f0ede6',
      'text-shadow: 1px 1px 0 rgba(0,0,0,0.75)',
      'white-space: nowrap',
      'overflow: hidden',
      'text-overflow: ellipsis'
    ].join('; ') + ';';

    var styleImageBox = [
      'flex: 0 0 auto',
      'width: 64px',
      'height: 64px',
      'border: 2px solid #1c1c1c',
      'border-radius: 2px',
      'background: #ddd',
      'overflow: hidden',
      'box-shadow: 2px 2px 0 rgba(0,0,0,0.35)'
    ].join('; ') + ';';

    var styleImage = [
      'width: 100%',
      'height: 100%',
      'object-fit: cover',
      'display: block',
      'filter: sepia(0.15) contrast(1.05)'
    ].join('; ') + ';';

    var styleProgression = [
      'position: absolute',
      'left: 0',
      'right: 0',
      'bottom: 0',
      'height: 6px',
      'background: rgba(0,0,0,0.55)',
      'border-top: 1px solid rgba(255,255,255,0.25)'
    ].join('; ') + ';';

    // Barre de progression hachurée façon ruban ancien
    var styleBarre = [
      'height: 100%',
      'width: ' + pourcentage + '%',
      'background: repeating-linear-gradient(45deg, #e8d9a8, #e8d9a8 6px, #c9b47a 6px, #c9b47a 12px)',
      'box-shadow: inset 0 -1px 0 rgba(0,0,0,0.35)',
      'transition: width 0.25s ease'
    ].join('; ') + ';';

    var styleCadenas = [
      'position: absolute',
      'top: 6px',
      'right: 8px',
      'font-size: 1rem',
      'filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.8))',
      'z-index: 2'
    ].join('; ') + ';';

    var styleContenu = [
      'flex: 1 1 auto',
      'min-width: 0',
      'position: relative',
      'z-index: 1'
    ].join('; ') + ';';

    var styleTitreWrapper = [
      'display: flex',
      'flex-direction: column',
      'gap: 2px'
    ].join('; ') + ';';

    // ------------------------------------------------------------
    // HTML
    // ------------------------------------------------------------
    var html = '';
    html += '<' + tag + ' class="carte-couverture' + classeVerrou + (estActuel ? ' actuelle' : '') + '"';
    html += ' style="' + styleInline + '"' + attrs + '>';

    if (verrouille) {
      html += '<div class="cadenas-verrou" style="' + styleCadenas + '">🔒︎︎︎</div>';
    }

    // Image à gauche
    if (showImage && couverture) {
      html += '<div class="couverture-image" style="' + styleImageBox + '">';
      html += '<img src="' + couverture + '" alt="" loading="lazy" style="' + styleImage + '">';
      html += '</div>';
    }

    // Texte à droite : titre + sous-titre
    html += '<div class="contenu-theme" style="' + styleContenu + '">';
    html += '<div class="titre-wrapper" style="' + styleTitreWrapper + '">';
    html += '<span class="titre-theme" style="' + styleTitre + '">' + _escapeHtml(titre) + '</span>';
    if (sousTitre) {
      html += '<span class="sous-titre-theme" style="' + styleSousTitre + '">' + _escapeHtml(sousTitre) + '</span>';
    }
    html += '</div>';
    html += '</div>';

    // Progression
    html += '<div class="progression-theme" style="' + styleProgression + '">';
    html += '<div class="barre" style="' + styleBarre + '"></div>';
    html += '</div>';

    html += '</' + tag + '>';
    return html;
  }

  window.construireCarteCouverture = construireCarteCouverture;

})();
