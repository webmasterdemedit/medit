// ============================================================
// carnet.js — « Carnet de l'auteur »
// Les écrits d'un thème (fichiers "x ...") présentés comme des
// articles de blog / notes de recherche :
//   - un volet latéral (liste d'articles)
//   - un panneau de lecture qui glisse par-dessus la page
// Utilisé par thème.html (et texte.html ensuite).
//
// Lignes facultatives en tête d'un fichier "x ..." :
//   date: 12/03/2026
//   chapeau: Une phrase qui résume l'article.
//   # mot-clé, autre mot-clé
// Le reste : paragraphes séparés par une ligne vide,
// **gras**, *italique*, « citations », [source].
// ============================================================

(function() {
  'use strict';

  var TITRE_VOLET = 'Carnet de l\'auteur';
  var AUTEUR_DEFAUT = 'W. Khan';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
              'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  function formaterDate(d) {
    if (!d) return '';
    var m = String(d).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return parseInt(m[1], 10) + ' ' + MOIS[parseInt(m[2], 10) - 1] + ' ' + m[3];
    var dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.getDate() + ' ' + MOIS[dt.getMonth()] + ' ' + dt.getFullYear();
    return String(d);
  }

  /* Sépare les lignes d'en-tête (date, chapeau, tags) du corps */
  function analyser(ecrit) {
    var lignes = String(ecrit.contenu || '').replace(/\r\n/g, '\n').split('\n');
    var date = ecrit.date || '', chapeau = '', tags = [], corps = [];
    var enTete = true;
    lignes.forEach(function(l) {
      var t = l.trim();
      if (enTete) {
        if (t === '') return;
        var md = t.match(/^date\s*:\s*(.+)$/i);
        var mc = t.match(/^chapeau\s*:\s*(.+)$/i);
        if (md) { date = md[1].trim(); return; }
        if (mc) { chapeau = mc[1].trim(); return; }
        if (/^#/.test(t)) {
          t.replace(/^#\s*/, '').split(',').forEach(function(x) { x = x.trim(); if (x) tags.push(x); });
          return;
        }
        enTete = false;
      }
      corps.push(l);
    });
    var texteBrut = corps.join('\n').trim();
    var mots = texteBrut.split(/\s+/).filter(function(w) { return w; }).length;
    if (!chapeau) {
      chapeau = texteBrut.replace(/\[[^\]]*\]/g, '').replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
      if (chapeau.length > 180) chapeau = chapeau.substring(0, 180).replace(/\s+\S*$/, '') + '…';
    }
    return {
      titre: ecrit.titre || 'Écrit',
      date: date,
      chapeau: chapeau,
      tags: tags,
      corps: texteBrut,
      minutes: Math.max(1, Math.round(mots / 200))
    };
  }

  /* Mise en forme du corps de l'article */
  function enrichir(t) {
    t = esc(t);
    t = t.replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    t = t.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
    t = t.replace(/&quot;([\s\S]+?)&quot;/g, '<em>« $1 »</em>');
    t = t.replace(/\[([^\]]+)\]\.?/g, '<span class="carnet-source">$1</span>');
    return t;
  }

  function corpsHtml(corps) {
    var blocs = corps.split(/\n\s*\n/).map(function(b) { return b.trim(); }).filter(function(b) { return b; });
    return blocs.map(function(b, i) {
      if (/^>\s*/.test(b)) {
        return '<blockquote class="carnet-exergue">' + enrichir(b.replace(/^>\s*/gm, '')).replace(/\n/g, '<br>') + '</blockquote>';
      }
      if (/^#{1,3}\s+/.test(b)) {
        return '<h3 class="carnet-intertitre">' + enrichir(b.replace(/^#{1,3}\s+/, '')) + '</h3>';
      }
      var html = enrichir(b).replace(/\n/g, '<br>');
      return '<p' + (i === 0 ? ' class="carnet-premier"' : '') + '>' + html + '</p>';
    }).join('');
  }

  /* ---------------- STYLES ---------------- */
  function injecterStyles() {
    if (document.getElementById('styleCarnet')) return;
    if (!document.getElementById('policesCarnet')) {
      var l = document.createElement('link');
      l.id = 'policesCarnet'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Cormorant+SC:wght@500;600;700&display=swap';
      document.head.appendChild(l);
    }
    var st = document.createElement('style');
    st.id = 'styleCarnet';
    st.textContent = ''
      /* Volet */
      + '.carnet-volet{font-family:"EB Garamond",Garamond,serif;color:var(--text);}'
      + '.carnet-entete{text-align:center;padding-bottom:12px;margin-bottom:6px;border-bottom:0.6px solid var(--text);}'
      + '.carnet-orn{display:block;color:#9a7b3c;font-size:16px;line-height:1;margin-bottom:4px;}'
      + '.carnet-titre{font-family:"Cormorant SC","EB Garamond",serif;font-weight:600;font-size:19px;letter-spacing:2.5px;text-transform:lowercase;}'
      + '.carnet-sous{font-style:italic;font-size:14px;color:var(--text-muted);margin-top:2px;}'
      + '.carnet-liste{list-style:none;margin:0;padding:0;}'
      + '.carnet-item{padding:14px 2px;border-bottom:0.5px solid var(--border);cursor:pointer;transition:background .15s;}'
      + '.carnet-item:last-child{border-bottom:none;}'
      + '.carnet-item:hover{background:var(--bg-hover);}'
      + '.carnet-item:hover .carnet-item-titre{text-decoration:underline;text-decoration-thickness:.5px;text-underline-offset:3px;}'
      + '.carnet-meta{font-size:12.5px;color:#9a7b3c;letter-spacing:.3px;margin-bottom:3px;}'
      + '.carnet-item-titre{font-weight:600;font-size:18px;line-height:1.25;margin:0 0 5px;color:var(--text);}'
      + '.carnet-chapeau{font-style:italic;font-size:14.5px;line-height:1.45;color:var(--text-secondary);'
      +   'display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}'
      + '.carnet-lire{display:inline-block;margin-top:6px;font-size:13px;color:#2d6a4f;letter-spacing:.4px;}'
      /* Panneau de lecture */
      + '.carnet-voile{position:fixed;inset:0;z-index:10000;background:rgba(20,16,10,.28);opacity:0;pointer-events:none;transition:opacity .15s;}'
      + '.carnet-voile.ouvert{opacity:1;pointer-events:auto;}'
      + '.carnet-panneau{position:fixed;top:0;right:0;bottom:0;z-index:10001;width:min(760px,100vw);background:#fffdf8;color:#1a1712;'
      +   'box-shadow:-6px 0 30px rgba(40,30,15,.18);transform:translateX(100%);transition:transform .18s ease-out;overflow-y:auto;'
      +   'font-family:"EB Garamond",Garamond,serif;}'
      + '.carnet-panneau.ouvert{transform:translateX(0);}'
      + '.carnet-barre{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;padding:12px 22px;'
      +   'background:rgba(255,253,248,.94);backdrop-filter:blur(4px);border-bottom:0.5px solid #d9cfba;z-index:2;}'
      + '.carnet-barre-titre{font-family:"Cormorant SC","EB Garamond",serif;letter-spacing:2px;text-transform:lowercase;font-size:15px;color:#7a705f;}'
      + '.carnet-fermer{background:none;border:none;font-size:28px;line-height:1;cursor:pointer;color:#7a705f;padding:0 4px;}'
      + '.carnet-fermer:hover{color:#1a1712;}'
      + '.carnet-article{max-width:620px;margin:0 auto;padding:44px 34px 70px;}'
      + '.carnet-article .a-rubrique{text-align:center;font-family:"Cormorant SC","EB Garamond",serif;letter-spacing:2px;font-size:14px;color:#2d6a4f;}'
      + '.carnet-article .a-rubrique .d{color:#e6b400;}'
      + '.carnet-article h1{font-family:"EB Garamond",serif;font-weight:600;font-size:34px;line-height:1.15;text-align:center;margin:10px 0 12px;color:#1a1712;}'
      + '.carnet-article .a-meta{text-align:center;font-style:italic;color:#7a705f;font-size:15px;}'
      + '.carnet-article .a-filet{width:22%;margin:18px auto 22px;border:none;border-top:0.6px solid #9a7b3c;}'
      + '.carnet-article .a-chapeau{font-size:19px;font-style:italic;line-height:1.5;color:#3a3226;text-align:center;margin:0 0 26px;}'
      + '.carnet-article .a-corps p{font-size:18.5px;line-height:1.65;text-align:justify;hyphens:auto;text-indent:1.5em;margin:0;}'
      + '.carnet-article .a-corps p.carnet-premier{text-indent:0;}'
      + '.carnet-article .a-corps p.carnet-premier::first-letter{float:left;font-size:3.6em;line-height:.82;padding:6px 8px 0 0;color:#9a7b3c;}'
      + '.carnet-exergue{margin:22px 0;padding:6px 0 6px 18px;border-left:2px solid #9a7b3c;font-style:italic;font-size:20px;line-height:1.5;color:#3a3226;}'
      + '.carnet-intertitre{font-family:"Cormorant SC","EB Garamond",serif;font-weight:600;font-size:20px;letter-spacing:1.5px;margin:26px 0 8px;}'
      + '.carnet-source{float:right;clear:right;max-width:30%;margin:4px -150px 6px 16px;width:130px;font-size:13px;font-style:italic;'
      +   'line-height:1.3;color:#7a705f;text-indent:0;border-top:0.5px solid #c9bda3;padding-top:3px;}'
      + '@media(max-width:1000px){.carnet-source{float:none;display:inline;margin:0;width:auto;max-width:none;border:none;padding:0;font-size:.85em;}'
      +   '.carnet-source::before{content:" — ";}}'
      + '.carnet-article .a-tags{margin-top:30px;text-align:center;}'
      + '.carnet-article .a-tags span{display:inline-block;margin:3px;padding:1px 10px;border:0.5px solid #c9bda3;border-radius:999px;font-size:13px;color:#7a705f;}'
      + '.carnet-article .a-fin{text-align:center;color:#9a7b3c;margin-top:34px;font-size:18px;}'
      + '.carnet-nav{display:flex;justify-content:space-between;gap:12px;margin-top:30px;padding-top:16px;border-top:0.5px solid #d9cfba;}'
      + '.carnet-nav button{background:none;border:none;cursor:pointer;font-family:inherit;font-size:15px;color:#2d6a4f;padding:0;text-align:left;}'
      + '.carnet-nav button.suiv{text-align:right;margin-left:auto;}'
      + '.carnet-nav small{display:block;font-size:12px;color:#7a705f;letter-spacing:.5px;text-transform:uppercase;}'
      + '@media(max-width:700px){.carnet-article{padding:30px 20px 60px;}.carnet-article h1{font-size:27px;}'
      +   '.carnet-article .a-corps p{font-size:17px;}}';
    document.head.appendChild(st);
  }

  /* ---------------- PANNEAU DE LECTURE ---------------- */
  var panneau = null, voile = null, articlesCourants = [], optionsCourantes = {};

  function creerPanneau() {
    if (panneau) return;
    voile = document.createElement('div');
    voile.className = 'carnet-voile';
    voile.addEventListener('click', fermer);
    panneau = document.createElement('div');
    panneau.className = 'carnet-panneau';
    panneau.setAttribute('role', 'dialog');
    document.body.appendChild(voile);
    document.body.appendChild(panneau);
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') fermer(); });
  }

  function ouvrir(i) {
    creerPanneau();
    var a = articlesCourants[i];
    if (!a) return;
    var o = optionsCourantes;
    var meta = [];
    if (a.date) meta.push(formaterDate(a.date));

    var prec = articlesCourants[i - 1], suiv = articlesCourants[i + 1];
    var html = ''
      + '<div class="carnet-barre"><span class="carnet-barre-titre">' + esc(TITRE_VOLET) + '</span>'
      + '<button class="carnet-fermer" title="Fermer" aria-label="Fermer">×</button></div>'
      + '<article class="carnet-article">'
      +   (o.theme ? '<div class="a-rubrique"><span class="d">#</span>' + esc(o.theme) + '</div>' : '')
      +   '<h1>' + esc(a.titre) + '</h1>'
      +   (meta.length ? '<div class="a-meta">' + meta.map(esc).join(' · ') + '</div>' : '')
      +   '<hr class="a-filet">'
      +   (a.chapeauEcrit ? '<p class="a-chapeau">' + enrichir(a.chapeauEcrit) + '</p>' : '')
      +   '<div class="a-corps">' + corpsHtml(a.corps) + '</div>'
      +   '<div class="a-fin">❧</div>'
      +   (a.tags.length ? '<div class="a-tags">' + a.tags.map(function(t) { return '<span>#' + esc(t) + '</span>'; }).join('') + '</div>' : '')
      +   ((prec || suiv) ? '<nav class="carnet-nav">'
            + (prec ? '<button class="prec" data-i="' + (i - 1) + '"><small>← Précédent</small>' + esc(prec.titre) + '</button>' : '')
            + (suiv ? '<button class="suiv" data-i="' + (i + 1) + '"><small>Suivant →</small>' + esc(suiv.titre) + '</button>' : '')
            + '</nav>' : '')
      + '</article>';
    panneau.innerHTML = html;
    panneau.querySelector('.carnet-fermer').addEventListener('click', fermer);
    panneau.querySelectorAll('.carnet-nav button').forEach(function(b) {
      b.addEventListener('click', function() { ouvrir(parseInt(b.getAttribute('data-i'), 10)); });
    });
    panneau.scrollTop = 0;
    requestAnimationFrame(function() {
      voile.classList.add('ouvert');
      panneau.classList.add('ouvert');
    });
    document.body.style.overflow = 'hidden';
  }

  function fermer() {
    if (!panneau) return;
    /* Fermeture immédiate, sans animation */
    panneau.style.transition = 'none';
    voile.style.transition = 'none';
    panneau.classList.remove('ouvert');
    voile.classList.remove('ouvert');
    document.body.style.overflow = '';
    void panneau.offsetWidth;
    panneau.style.transition = '';
    voile.style.transition = '';
  }

  /* ---------------- VOLET ---------------- */
  function afficher(conteneur, ecrits, options) {
    if (!conteneur) return false;
    options = options || {};
    ecrits = (ecrits || []).filter(function(e) { return e && (e.titre || e.contenu); });
    if (!ecrits.length) { conteneur.innerHTML = ''; return false; }
    injecterStyles();

    articlesCourants = ecrits.map(function(e) {
      var a = analyser(e);
      /* le chapeau n'est affiché dans l'article que s'il a été écrit */
      a.chapeauEcrit = /(^|\n)\s*chapeau\s*:/i.test(String(e.contenu || '')) ? a.chapeau : '';
      return a;
    });
    optionsCourantes = options;

    var n = articlesCourants.length;
    var html = '<div class="carnet-volet">'
      + '<div class="carnet-entete"><span class="carnet-orn">❧</span>'
      +   '<div class="carnet-titre">' + esc(TITRE_VOLET) + '</div>'
      +   '<div class="carnet-sous">' + n + ' note' + (n > 1 ? 's' : '') + '</div>'
      + '</div><ul class="carnet-liste">';
    articlesCourants.forEach(function(a, i) {
      html += '<li class="carnet-item" data-i="' + i + '" tabindex="0">'
        + (a.date ? '<div class="carnet-meta">' + esc(formaterDate(a.date)) + '</div>' : '')
        + '<h4 class="carnet-item-titre">' + esc(a.titre) + '</h4>'
        + (a.chapeau ? '<div class="carnet-chapeau">' + esc(a.chapeau) + '</div>' : '')
        + '<span class="carnet-lire">Lire →</span>'
        + '</li>';
    });
    html += '</ul></div>';
    conteneur.innerHTML = html;

    conteneur.querySelectorAll('.carnet-item').forEach(function(li) {
      var i = parseInt(li.getAttribute('data-i'), 10);
      li.addEventListener('click', function() { ouvrir(i); });
      li.addEventListener('keydown', function(e) { if (e.key === 'Enter') ouvrir(i); });
    });
    return true;
  }

  window.Carnet = { afficher: afficher, ouvrir: ouvrir, fermer: fermer };
})();
