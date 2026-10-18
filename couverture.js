// ============================================================
// couverture.js — GÉNÉRATION CENTRALISÉE DES CARTES-COUVERTURES
// Une seule fonction : construireCarteCouverture(theme, options)
// Utilisée par : les-thèmes.html, theme.html, texte.html
// ============================================================

(function() {
  'use strict';

  // ---------- Utilitaires internes ----------
  function _escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _formatDateMoisAnnee(dateStr) {
    if (!dateStr) return '';
    try {
      var d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      var mois = ['Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
      return mois[d.getMonth()] + ' ' + d.getFullYear();
    } catch(e) { return ''; }
  }

  // ---------- Fonction principale ----------
  /**
   * Construit le HTML d'une carte-couverture.
   *
   * @param {Object} theme - Objet contenant les infos du thème :
   *   { titre, couleur, sousTitre, auteur, date, niveau,
   *     pourcentage, couverture, verrouille, disponible }
   * @param {Object} options (optionnel) :
   *   - actuel     : true si c'est la page courante (rend un <div> au lieu de <a>)
   *   - lien       : URL personnalisée (sinon /medit/thème.html?cat=...)
   *   - cliquable  : true (défaut) — si false, pas de href
   *   - badgeNiveau: true (défaut) — afficher ou non le badge
   *   - showImage  : true (défaut) — afficher l'image de couverture
   *
   * @returns {string} HTML complet de la carte
   */
  function construireCarteCouverture(theme, options) {
    theme = theme || {};
    options = options || {};

    var titre       = theme.titre || theme.nom || '';
    var couleur     = theme.couleur || '#2d6a4f';
    var sousTitre   = theme.sousTitre || '';
    var auteur      = theme.auteur || '';
    var date        = theme.date || '';
    var niveau      = parseInt(theme.niveau) || 0;
    var pourcentage = theme.pourcentage || 0;
    var couverture  = theme.couverture || '';
    var verrouille  = theme.verrouille || theme.disponible === false;

    var estActuel    = !!options.actuel;
    var cliquable    = options.cliquable !== false;
    var showImage    = options.showImage !== false;
    var badgeNiveau  = options.badgeNiveau !== false;

    var dateFormatee = _formatDateMoisAnnee(date);
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

    // Cadenas si verrouillé
    if (verrouille) {
      html += '<div class="cadenas-verrou">🔒︎︎︎</div>';
    }

    // Badge niveau (bande verticale jaune à gauche)
    if (badgeNiveau) {
      html += '<span class="badge-niveau">Niv. ' + niveau + '</span>';
    }

    // Contenu principal
    html += '<div class="contenu-theme">';

    html += '<div class="titre-wrapper">';
    if (auteur)     html += '<span class="auteur-theme">' + _escapeHtml(auteur) + '</span>';
    html += '<span class="titre-theme">#' + _escapeHtml(titre) + '</span>';
    if (sousTitre)  html += '<span class="sous-titre-theme">' + _escapeHtml(sousTitre) + '</span>';
    html += '</div>';

    // Image de couverture (au-dessus de Qiraat Édition)
    if (showImage && couverture) {
      html += '<div class="couverture-image"><img src="' + couverture + '" alt="" loading="lazy"></div>';
    }

    html += '<div class="edition-info">';
    html += '<span class="edition-nom">Qiraat Édition</span>';
    if (dateFormatee) html += '<span class="edition-date">' + dateFormatee + '</span>';
    html += '</div>';

    html += '</div>';

    // Barre de progression
    html += '<div class="progression-theme"><div class="barre" style="width: ' + pourcentage + '%;"></div></div>';

    html += '</' + tag + '>';
    return html;
  }

  // ---------- Exposition globale ----------
  window.construireCarteCouverture = construireCarteCouverture;

})();
