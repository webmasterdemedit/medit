// ============================================================
// cartes-textes.js — LA carte de texte, commune à tout le site
//   [ vignette = miniature de la version imprimable ] [ contenu ]
// Contenu : n° doré · titre · #thème · niveau · exercices · mots
//           · date · validé
//
// Modifier CE fichier change la carte partout où elle apparaît
// (accueil, page thème, liste des textes…).
//
// Utilisation dans une page :
//   <script src="/medit/impression.js"></script>
//   <script src="/medit/cartes-textes.js"></script>
//   html += CartesTextes.carte(texte, { valide: true, dateValidation: '…' });
//   conteneur.innerHTML = html;
//   CartesTextes.remplirVignettes(listeDesTextes);
// ============================================================

(function() {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function aUnNiveau(n) { return n !== '' && n !== null && n !== undefined; }
  function numero(t) { var m = String(t || '').match(/^\s*(\d+)\s+/); return m ? parseInt(m[1], 10) : null; }
  function sansNumero(t) { return String(t || '').replace(/^\s*\d+\s+/, '').trim(); }

  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
              'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function dateCourte(d) {
    if (!d) return '';
    var x = new Date(d);
    if (isNaN(x.getTime())) return '';
    return x.getDate() + ' ' + MOIS[x.getMonth()] + ' ' + x.getFullYear();
  }

  function compterExercices(t) {
    var types = ['quiz:', 'qc:', 'open:', 'ordre:', 'carte:', 'relier:', 'tt:', 'vf:', 'copier:', 'point:', 'col:'];
    var ob = t.ordreBlocs || [], n = 0;
    if (typeof ob === 'string') ob = ob.split(',');
    if (ob.length) {
      ob.forEach(function(o) {
        o = String(o).trim();
        for (var i = 0; i < types.length; i++) if (o.indexOf(types[i]) === 0) { n++; return; }
      });
    } else {
      if (t.hasQuiz) n++;
      if (t.hasQuestion) n++;
    }
    return n;
  }

  /* ---------------- STYLES ---------------- */
  function injecterStyles() {
    if (document.getElementById('styleCartesTextes')) return;
    if (!document.getElementById('policesCartesTextes')) {
      var l = document.createElement('link');
      l.id = 'policesCartesTextes'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Cormorant+SC:wght@500;600&display=swap';
      document.head.appendChild(l);
    }
    var st = document.createElement('style');
    st.id = 'styleCartesTextes';
    st.textContent = ''
      + '.ct-carte{display:flex;align-items:center;gap:22px;padding:16px 6px;border-bottom:0.5px solid #d9cfba;'
      +   'text-decoration:none;color:inherit;cursor:pointer;transition:background .15s;font-family:"EB Garamond",Garamond,serif;}'
      + '.ct-carte:hover{background:var(--bg-hover);}'
      + '.ct-carte:hover .ct-titre{text-decoration:underline;text-decoration-thickness:.5px;text-underline-offset:4px;}'
      + '.ct-vignette{flex:0 0 104px;width:104px;height:147px;overflow:hidden;position:relative;'
      +   'background:#fffdf8;border:1px solid var(--border,#d9cfba);box-shadow:0 1px 5px rgba(60,45,25,.14);}'
      + '.ct-corps{flex:1;min-width:0;display:flex;align-items:baseline;gap:16px;}'
      + '.ct-num{flex:0 0 36px;font-family:"Cormorant SC","EB Garamond",serif;font-size:26px;line-height:1;color:#9a7b3c;text-align:center;}'
      + '.ct-texte{flex:1;min-width:0;}'
      + '.ct-theme{font-family:"Cormorant SC","EB Garamond",serif;font-size:14.5px;letter-spacing:1.5px;color:#2d6a4f;}'
      + '.ct-theme .d{color:#e6b400;}'
      + '.ct-titre{font-weight:600;font-size:21px;line-height:1.25;margin:1px 0 4px;color:var(--text,#1a1712);}'
      + '.ct-meta{display:flex;flex-wrap:wrap;gap:3px 14px;font-style:italic;font-size:15px;color:#7a705f;}'
      + '.ct-valide{color:#2d6a4f;font-style:normal;}'
      + '.ct-extrait{margin-top:6px;font-size:15.5px;line-height:1.45;color:var(--text-secondary,#5a5244);'
      +   'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}'
      + '@media(max-width:700px){.ct-carte{gap:14px;padding:14px 2px;}.ct-vignette{flex-basis:74px;width:74px;height:105px;}'
      +   '.ct-num{display:none;}.ct-titre{font-size:18px;}.ct-meta{font-size:14px;}}';
    document.head.appendChild(st);
  }

  /* ---------------- CARTE ----------------
     options : { valide, dateValidation, sansTheme, extrait } */
  function carte(t, options) {
    injecterStyles();
    options = options || {};
    var n = numero(t.titre);
    var nbExo = compterExercices(t);
    var meta = [];
    if (aUnNiveau(t.niveau)) meta.push('<span>niveau ' + esc(t.niveau) + '</span>');
    if (nbExo) meta.push('<span>' + nbExo + ' exercice' + (nbExo > 1 ? 's' : '') + '</span>');
    if (t.mots) meta.push('<span>' + t.mots + ' mots</span>');
    if (t.date) meta.push('<span>' + esc(dateCourte(t.date)) + '</span>');
    if (options.valide) meta.push('<span class="ct-valide">validé ✓' + (options.dateValidation ? ' le ' + esc(options.dateValidation) : '') + '</span>');
    var extrait = options.extrait || t.description || t.extrait || '';
    if (extrait.length > 220) extrait = extrait.substring(0, 220).replace(/\s+\S*$/, '') + '…';

    return '<a class="ct-carte" href="/medit/texte.html?id=' + encodeURIComponent(t.id) + '">'
      + '<div class="ct-vignette" data-id="' + esc(t.id) + '"></div>'
      + '<div class="ct-corps">'
      +   '<div class="ct-num">' + (n !== null ? n : '❧') + '</div>'
      +   '<div class="ct-texte">'
      +     ((t.categorie && !options.sansTheme) ? '<div class="ct-theme"><span class="d">#</span>' + esc(t.categorie) + '</div>' : '')
      +     '<div class="ct-titre">' + esc(sansNumero(t.titre)) + '</div>'
      +     (meta.length ? '<div class="ct-meta">' + meta.join('') + '</div>' : '')
      +     (extrait ? '<div class="ct-extrait">' + esc(extrait) + '</div>' : '')
      +   '</div>'
      + '</div>'
      + '</a>';
  }

  /* ---------------- VIGNETTES (miniature de la version imprimable) ---------------- */
  var LARGEUR_A4 = 794, HAUTEUR_A4 = 1123;
  var imagesParTheme = {};

  function imagesDuTheme(cat) {
    if (!imagesParTheme[cat]) {
      var p = (typeof chargerImagesTheme === 'function')
        ? chargerImagesTheme(cat).catch(function() { return {}; })
        : Promise.resolve({});
      var delai = new Promise(function(res) { setTimeout(function() { res({}); }, 2500); });
      imagesParTheme[cat] = Promise.race([p, delai]).then(function(i) { return i || {}; });
    }
    return imagesParTheme[cat];
  }

  function arabiserDoc(doc) {
    var walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
    var noeuds = [], n;
    while ((n = walker.nextNode())) { if (/[؀-ۿ]/.test(n.nodeValue || '')) noeuds.push(n); }
    noeuds.forEach(function(t) {
      var parent = t.parentNode;
      if (!parent || !parent.classList) return;
      if (parent.classList.contains('arabe') || parent.classList.contains('copier-mot') ||
          parent.classList.contains('copier-mot-pointille') || parent.classList.contains('copier-mot-kfg')) return;
      var parts = t.nodeValue.split(/([؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+)/g);
      var frag = doc.createDocumentFragment();
      parts.forEach(function(part) {
        if (part === '') return;
        if (/[؀-ۿ]/.test(part)) {
          var sp = doc.createElement('span');
          sp.className = 'arabe'; sp.setAttribute('lang', 'ar'); sp.textContent = part;
          frag.appendChild(sp);
        } else frag.appendChild(doc.createTextNode(part));
      });
      parent.replaceChild(frag, t);
    });
  }

  function dessiner(v, texte) {
    if (v._fait) return;
    v._fait = true;
    var cat = texte.categorie || '';
    var couverture = (typeof recupererCouvertureTheme === 'function') ? recupererCouvertureTheme(cat) : '';
    imagesDuTheme(cat).then(function(images) {
      var html = '';
      try {
        html = genererImpression(texte, texte.contenu || '', images, couverture, 'complet', { retournerHtml: true });
      } catch (e) { console.error('Vignette :', e); return; }
      if (!html) return;
      var echelle = v.clientWidth / LARGEUR_A4;
      var iframe = document.createElement('iframe');
      iframe.setAttribute('tabindex', '-1');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText = 'width:' + LARGEUR_A4 + 'px;height:' + HAUTEUR_A4 + 'px;border:0;'
        + 'transform:scale(' + echelle + ');transform-origin:0 0;pointer-events:none;background:#fffdf8;';
      v.appendChild(iframe);
      var doc = iframe.contentWindow.document;
      doc.open();
      doc.write(html.replace('</head>', '<style>body{padding:40px 46px !important;overflow:hidden !important;}</style></head>'));
      doc.close();
      setTimeout(function() { try { arabiserDoc(doc); } catch (e) {} }, 400);
    });
  }

  function remplirVignettes(textes, racine) {
    if (typeof genererImpression !== 'function') return;
    var parId = {};
    (textes || []).forEach(function(t) { parId[String(t.id)] = t; });

    function lancer(v) {
      var t = parId[v.getAttribute('data-id')];
      if (!t) return;
      if (t.contenu) { dessiner(v, t); return; }
      if (typeof DataManager !== 'undefined' && typeof DataManager.getTexteAsync === 'function') {
        DataManager.getTexteAsync(t.id).then(function(complet) {
          if (complet && complet.contenu) dessiner(v, Object.assign({}, t, complet));
        }).catch(function() {});
      }
    }

    var vignettes = (racine || document).querySelectorAll('.ct-vignette[data-id]');
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function(entrees) {
        entrees.forEach(function(e) { if (e.isIntersecting) { obs.unobserve(e.target); lancer(e.target); } });
      }, { rootMargin: '200px' });
      vignettes.forEach(function(v) { obs.observe(v); });
    } else {
      vignettes.forEach(lancer);
    }
  }

  window.CartesTextes = { carte: carte, remplirVignettes: remplirVignettes, compterExercices: compterExercices };
})();
