// couverture.js — carte de thème, toujours en vert par défaut (aucune couleur personnalisée)
(function () {
  function esc(s) {
    if (s === undefined || s === null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  window.construireCarteCouverture = function (t, options) {
    t = t || {};
    options = options || {};
    var titre = t.titre || t.nom || '';
    var min = isFinite(t.niveauMin) ? t.niveauMin : (t.niveau || 1);
    var max = isFinite(t.niveauMax) ? t.niveauMax : min;
    var niveau = (min === max) ? 'Niveau ' + min : 'Niveau ' + min + '–' + max;
    var pct = Math.max(0, Math.min(100, parseInt(t.pourcentage) || 0));
    var cliquable = options.cliquable !== false && !t.verrouille;

    var interieur = ''
      + '<span class="badge-niveau">' + esc(niveau) + '</span>'
      + '<div class="contenu-theme">'
      +   (t.couverture ? '<div class="couverture-image"><img src="' + esc(t.couverture) + '" alt="" loading="lazy"></div>' : '')
      +   '<div class="titre-wrapper">'
      +     (t.auteur ? '<span class="auteur-theme">' + esc(t.auteur) + '</span>' : '')
      +     '<span class="titre-theme">' + esc(titre) + '</span>'
      +     (t.sousTitre ? '<span class="sous-titre-theme">' + esc(t.sousTitre) + '</span>' : '')
      +   '</div>'
      +   '<div class="edition-info">'
      +     (t.date ? '<span class="edition-date">' + esc(t.date) + '</span>' : '')
      +   '</div>'
      + '</div>'
      + '<div class="progression-theme"><div class="barre" style="width:' + pct + '%"></div></div>'
      + (cliquable || options.actuel ? '' : '<span class="cadenas-verrou">🔒</span>');

    if (cliquable && options.lien) {
      return '<a class="carte-couverture" href="' + esc(options.lien) + '">' + interieur + '</a>';
    }
    return '<div class="carte-couverture' + (cliquable || options.actuel ? '' : ' verrouille') + '">' + interieur + '</div>';
  };
})();
