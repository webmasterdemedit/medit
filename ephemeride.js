// ============================================================
// ephemeride.js — Éphéméride du jour (style Pléiade)
//   - date du jour en lettres (calendrier grégorien)
//   - date hégirienne (calendrier Umm al-Qura)
//   - une citation du jour (verset ou hadith) tirée de VOS textes :
//     toute citation entre guillemets suivie d'une source [ ... ]
//     La citation change chaque jour, et reste la même toute la journée.
//
// Utilisation : mettre <div id="ephemeride"></div> dans la page,
// puis charger data-manager.js et ce fichier.
// ============================================================

(function() {
  'use strict';

  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
              'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var MOIS_HEGIRE = ['Muharram', 'Safar', 'Rabîʿ al-awwal', 'Rabîʿ ath-thânî',
                     'Joumâdâ al-oûlâ', 'Joumâdâ ath-thâniya', 'Rajab', 'Shaʿbân',
                     'Ramadân', 'Shawwâl', 'Dhoû al-qaʿda', 'Dhoû al-hijja'];

  /* Citation de secours si aucun texte n'a encore de citation sourcée */
  var SECOURS = {
    citation: 'Ne méditent-ils donc pas sur le Coran ? Ou bien se trouve-t-il des cadenas sur leurs cœurs ?',
    source: 'Coran 47:24'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- Dates ---------- */
  function dateGregorienne(d) {
    var j = d.getDate();
    return JOURS[d.getDay()] + ' ' + (j === 1 ? '1er' : j) + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function dateHegirienne(d) {
    try {
      var f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' });
      var parts = {};
      f.formatToParts(d).forEach(function(p) { parts[p.type] = p.value; });
      var jour = parseInt(parts.day, 10), mois = parseInt(parts.month, 10), annee = parseInt(parts.year, 10);
      if (!jour || !mois || !annee) return '';
      return (jour === 1 ? '1er' : jour) + ' ' + MOIS_HEGIRE[mois - 1] + ' ' + annee + ' H.';
    } catch (e) {
      return '';
    }
  }

  /* Numéro du jour : la citation change à minuit */
  function numeroDuJour(d) {
    var debut = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.floor(debut.getTime() / 86400000);
  }

  /* ---------- Citations tirées des textes ----------
     Format reconnu dans vos fichiers :
       ligne arabe
       "traduction" [source]          (la source peut aussi être sur la ligne suivante)
       ou  « traduction » (source: ...)
     Le texte arabe = dernière ligne en arabe juste avant la traduction. */
  function extraireCitations(textes) {
    var liste = [], vus = {};
    var re = /["“«]\s*([^"“”«»]{12,500}?)\s*["”»][^\[\(]{0,80}?(?:\[([^\]]{2,100})\]|\(source:\s*([^)]{2,100})\))/g;
    (textes || []).forEach(function(t) {
      var contenu = String(t.contenu || '');
      var m;
      re.lastIndex = 0;
      while ((m = re.exec(contenu)) !== null) {
        var citation = m[1].replace(/\s+/g, ' ').replace(/\*+/g, '').trim();
        var source = (m[2] || m[3] || '').trim();
        if (!citation || !source) continue;
        var cle = citation.toLowerCase();
        if (vus[cle]) continue;
        vus[cle] = true;
        // Texte arabe : dernière ligne contenant de l'arabe juste avant la citation
        var avant = contenu.substring(Math.max(0, m.index - 600), m.index).split('\n');
        var arabe = '';
        for (var k = avant.length - 1; k >= 0 && k >= avant.length - 4; k--) {
          var l = avant[k].trim();
          if (!l) continue;
          if (/[؀-ۿ]/.test(l)) { arabe = l.replace(/\s*\|\s*$/, '').trim(); break; }
          if (k < avant.length - 1) break;
        }
        liste.push({ citation: citation, source: source, arabe: arabe, texteId: t.id, titre: t.titre || '' });
      }
    });
    return liste;
  }

  /* ---------- Styles ---------- */
  function injecterStyles() {
    if (document.getElementById('styleEphemeride')) return;
    if (!document.getElementById('policesEphemeride')) {
      var l = document.createElement('link');
      l.id = 'policesEphemeride'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Cormorant+SC:wght@500;600&display=swap';
      document.head.appendChild(l);
    }
    var st = document.createElement('style');
    st.id = 'styleEphemeride';
    st.textContent = ''
      + '.ephem{max-width:720px;margin:34px auto 0;padding:22px 30px 20px;text-align:center;'
      +   'font-family:"EB Garamond",Garamond,serif;border-top:0.6px solid #1a1712;border-bottom:0.6px solid #1a1712;position:relative;}'
      + '.ephem::before,.ephem::after{content:"";position:absolute;left:0;right:0;border-top:0.6px solid #1a1712;}'
      + '.ephem::before{top:3px;}.ephem::after{bottom:3px;}'
      + '.ephem-tete{font-family:"Cormorant SC","EB Garamond",serif;font-weight:600;font-size:14px;letter-spacing:4px;'
      +   'text-transform:lowercase;color:#7a705f;}'
      + '.ephem-dates{display:flex;justify-content:center;align-items:baseline;gap:14px;flex-wrap:wrap;margin:6px 0 2px;}'
      + '.ephem-greg{font-size:22px;font-weight:500;color:var(--text,#1a1712);}'
      + '.ephem-greg::first-letter{text-transform:uppercase;}'
      + '.ephem-sep{color:#9a7b3c;font-size:16px;}'
      + '.ephem-hij{font-style:italic;font-size:19px;color:#2d6a4f;}'
      + '.ephem-filet{width:60px;margin:14px auto 14px;border:none;border-top:0.6px solid #9a7b3c;}'
      + '.ephem-cit{font-style:italic;font-size:21px;line-height:1.5;color:#3a3226;margin:0;}'
      + '.ephem-cit::before{content:"« ";color:#9a7b3c;}.ephem-cit::after{content:" »";color:#9a7b3c;}'
      + '.ephem-src{display:block;margin-top:8px;font-family:"Cormorant SC","EB Garamond",serif;font-size:15px;letter-spacing:2px;color:#9a7b3c;}'
      + '.ephem-lien{display:inline-block;margin-top:6px;font-style:italic;font-size:14px;color:#2d6a4f;text-decoration:none;}'
      + '.ephem-lien:hover{text-decoration:underline;}'
      + '.ephem-ar{direction:rtl;font-family:"Janna LT Bold","Traditional Arabic","Amiri",serif;font-size:24px;line-height:1.7;color:#1a1712;margin:0 0 8px;}'
      + '.colonne-laterale .ephem,.zone-basse-mobile .ephem{max-width:100%;margin:0 0 22px;padding:16px 10px 14px;}'
      + '.colonne-laterale .ephem-greg{font-size:16px;}.colonne-laterale .ephem-hij{font-size:14px;}'
      + '.colonne-laterale .ephem-dates{flex-direction:column;gap:2px;}.colonne-laterale .ephem-sep{display:none;}'
      + '.colonne-laterale .ephem-cit{font-size:15.5px;}.colonne-laterale .ephem-ar{font-size:20px;}'
      + '.colonne-laterale .ephem-src{font-size:12.5px;letter-spacing:1.5px;}.colonne-laterale .ephem-tete{font-size:12px;letter-spacing:3px;}'
      + '@media(max-width:700px){.ephem{padding:18px 12px 16px;margin-top:26px;}.ephem-greg{font-size:19px;}'
      +   '.ephem-hij{font-size:16px;}.ephem-cit{font-size:18px;}}';
    document.head.appendChild(st);
  }

  /* ---------- Affichage ---------- */
  function dessiner(zone, choix) {
    var maintenant = new Date();
    var hij = dateHegirienne(maintenant);
    var lien = (choix.texteId)
      ? '<a class="ephem-lien" href="/medit/texte.html?id=' + encodeURIComponent(choix.texteId) + '">lire le texte →</a>'
      : '';
    zone.innerHTML = ''
      + '<div class="ephem">'
      +   '<div class="ephem-tete">éphéméride</div>'
      +   '<div class="ephem-dates">'
      +     '<span class="ephem-greg">' + esc(dateGregorienne(maintenant)) + '</span>'
      +     (hij ? '<span class="ephem-sep">❧</span><span class="ephem-hij">' + esc(hij) + '</span>' : '')
      +   '</div>'
      +   '<hr class="ephem-filet">'
      +   (choix.arabe ? '<p class="ephem-ar" lang="ar">' + esc(choix.arabe) + '</p>' : '')
      +   '<p class="ephem-cit">' + esc(choix.citation) + '</p>'
      +   '<span class="ephem-src">' + esc(choix.source) + '</span>'
      +   lien
      + '</div>';
  }

  function afficher(zone) {
    zone = zone || document.getElementById('ephemeride');
    if (!zone) return;
    injecterStyles();
    dessiner(zone, SECOURS);   /* affichage immédiat, puis citation du jour */

    if (typeof DataManager === 'undefined' || typeof DataManager.charger !== 'function') return;

    // Les citations sont gardées 24 h pour ne pas recharger tous les textes à chaque page
    var CLE = 'ephemeride_citations_v2';
    try {
      var cache = JSON.parse(localStorage.getItem(CLE) || 'null');
      if (cache && cache.liste && cache.liste.length && (Date.now() - cache.date) < 86400000) {
        dessiner(zone, cache.liste[numeroDuJour(new Date()) % cache.liste.length]);
        return;
      }
    } catch (e) {}

    DataManager.charger().then(function(data) {
      var textes = (data && (data.tousLesTextes || data.textes)) || [];
      // En mode invité, la liste ne contient pas le contenu : on charge chaque texte
      var aCharger = textes.filter(function(t) { return !(t.contenu || '').trim(); });
      var complets = textes.filter(function(t) { return (t.contenu || '').trim(); });
      var i = 0;
      function suivant() {
        if (i >= aCharger.length || typeof DataManager.getTexteAsync !== 'function') return Promise.resolve();
        var t = aCharger[i++];
        return DataManager.getTexteAsync(t.id)
          .then(function(full) { if (full && full.contenu) complets.push(Object.assign({}, t, full)); })
          .catch(function() {})
          .then(suivant);
      }
      // 4 chargements en parallèle
      return Promise.all([suivant(), suivant(), suivant(), suivant()]).then(function() {
        var citations = extraireCitations(complets);
        if (window.console) console.log('📜 Éphéméride : ' + citations.length + ' citation(s) trouvée(s) dans ' + complets.length + ' texte(s)');
        if (!citations.length) return;
        try { localStorage.setItem(CLE, JSON.stringify({ date: Date.now(), liste: citations })); } catch (e) {}
        dessiner(zone, citations[numeroDuJour(new Date()) % citations.length]);
      });
    }).catch(function() {});
  }

  window.Ephemeride = { afficher: afficher };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { afficher(); });
  else afficher();
})();
