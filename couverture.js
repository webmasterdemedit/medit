// ============================================================
// couverture.js — GÉNÉRATION CENTRALISÉE DES LIGNES-THÈMES
// Une seule fonction : construireCarteCouverture(theme, options)
// Utilisée par : les-thèmes.html, theme.html, texte.html
// → rendu "ligne éditoriale" (pas de carte/livret)
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

  function _pad2(n) {
    n = parseInt(n) || 0;
    return n < 10 ? '0' + n : String(n);
  }

  // Compteur global pour la numérotation auto (01, 02, 03…)
  var _compteurLignes = 0;
  function _resetCompteur() { _compteurLignes = 0; }
  window.resetCompteurCouvertures = _resetCompteur;

  // ---------- Fonction principale ----------
  /**
   * Construit le HTML d'une ligne-thème (format éditorial, non "livret").
   *
   * @param {Object} theme - Objet contenant les infos du thème :
   *   { titre, couleur, sousTitre, auteur, date, niveau,
   *     pourcentage, couverture, verrouille, disponible,
   *     textes, textesValides }
   * @param {Object} options (optionnel) :
   *   - actuel     : true si c'est la page courante (rend un <div> au lieu de <a>)
   *   - lien       : URL personnalisée (sinon /medit/thème.html?cat=...)
   *   - cliquable  : true (défaut) — si false, pas de href
   *   - badgeNiveau: true (défaut) — afficher ou non le badge
   *   - numero     : numéro manuel (sinon auto-incrémenté)
   *   - showImage  : ignoré (conservé pour compat, mais sans effet)
   *
   * @returns {string} HTML complet de la ligne
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
    var textes      = parseInt(theme.textes) || 0;
    var valides     = parseInt(theme.textesValides) || 0;
    var verrouille  = theme.verrouille || theme.disponible === false;

    var estActuel    = !!options.actuel;
    var cliquable    = options.cliquable !== false;
    var badgeNiveau  = options.badgeNiveau !== false;

    // Numérotation : manuelle si fournie, sinon auto
    var numero;
    if (options.numero !== undefined) {
      numero = _pad2(options.numero);
    } else {
      _compteurLignes += 1;
      numero = _pad2(_compteurLignes);
    }

    var dateFormatee = _formatDateMoisAnnee(date);
    var lien = options.lien || ('/medit/thème.html?cat=' + encodeURIComponent(titre));

    var tag = (estActuel || !cliquable) ? 'div' : 'a';
    var attrs = '';
    if (tag === 'a') {
      attrs = ' href="' + lien + '" title="' + _escapeHtml(titre) + '"';
    }

    var classes = 'ligne-theme';
    if (verrouille) classes += ' verrouille';
    if (estActuel)  classes += ' actuelle';

    var html = '';
    html += '<' + tag + ' class="' + classes + '"' + attrs + '>';
    html += '  <span class="ligne-numero" aria-hidden="true">' + numero + '</span>';
    html += '  <div class="ligne-corps">';

    // Ligne 1 : titre + éventuel auteur
    html += '    <div class="ligne-titre-wrap">';
    html += '      <span class="ligne-titre">#' + _escapeHtml(titre) + '</span>';
    if (auteur) {
      html += '      <span class="ligne-auteur">' + _escapeHtml(auteur) + '</span>';
    }
    html += '    </div>';

    // Ligne 2 : sous-titre / méta
    var metaParts = [];
    if (sousTitre)    metaParts.push(_escapeHtml(sousTitre));
    if (dateFormatee) metaParts.push(dateFormatee);
    if (metaParts.length) {
      html += '    <div class="ligne-sous-titre">' + metaParts.join(' · ') + '</div>';
    }

    // Ligne 3 : progression + compteur
    if (textes > 0) {
      html += '    <div class="ligne-progression">';
      html += '      <div class="ligne-barre"><div class="ligne-barre-remplie" style="width:' + pourcentage + '%; background:' + couleur + ';"></div></div>';
      html += '      <span class="ligne-compteur">' + valides + '/' + textes + ' · ' + pourcentage + '%</span>';
      html += '    </div>';
    }

    html += '  </div>'; // .ligne-corps

    // Colonne de droite : badge niveau + cadenas/flèche
    html += '  <div class="ligne-droite">';
    if (badgeNiveau && niveau > 0) {
      html += '    <span class="ligne-badge-niveau" style="color:' + couleur + '; border-color:' + couleur + ';">Niv. ' + niveau + '</span>';
    }
    if (verrouille) {
      html += '    <span class="ligne-cadenas" aria-hidden="true">🔒</span>';
    } else {
      html += '    <span class="ligne-fleche" aria-hidden="true">→</span>';
    }
    html += '  </div>';

    html += '</' + tag + '>';
    return html;
  }

  // ---------- Exposition globale ----------
  window.construireCarteCouverture = construireCarteCouverture;

})();
