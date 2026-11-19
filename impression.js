// ============================================================
// IMPRESSION - Qiraat (V22)
// qcm: multi-réponses | q: simple avec lignes (1l, 2l...)
// m: mémorisation 4 cases | $ vocab arabe après texte
// ============================================================

function imprimerTexte(texteId, titre, textesData, mode) {
  mode = mode || 'complet';
  if (typeof textesData === 'undefined' || textesData === null) {
    textesData = (typeof window !== 'undefined' && window.textesData) ? window.textesData : [];
  }
  var texte = null;
  if (textesData && textesData.length > 0) {
    for (var i = 0; i < textesData.length; i++) {
      if (textesData[i].id === texteId) { texte = textesData[i]; break; }
    }
  }
  if (!texte) {
    var tous = DataManager.getTousLesTextes();
    for (var i = 0; i < tous.length; i++) {
      if (tous[i].id === texteId) { texte = tous[i]; break; }
    }
  }
  if (!texte) { alert('Texte "' + titre + '" non trouvé.'); return; }
  var contenu = texte.contenu || '';
  if (!contenu) { alert('Ce texte ne contient pas de contenu à imprimer.'); return; }
  var couvertureTheme = recupererCouvertureTheme(texte.categorie);
  chargerImagesTheme(texte.categorie).then(function(images) {
    genererImpression(texte, contenu, images || {}, couvertureTheme, mode);
  }).catch(function() {
    genererImpression(texte, contenu, {}, couvertureTheme, mode);
  });
}

function imprimerContenuAlternatif(texteOriginal, contenuAlternatif, suffixe, mode) {
  mode = mode || 'complet';
  if (!texteOriginal) { alert('Texte original introuvable.'); return; }
  if (!contenuAlternatif) { alert('Contenu alternatif vide.'); return; }
  var couvertureTheme = recupererCouvertureTheme(texteOriginal.categorie);
  var texteCopie = Object.assign({}, texteOriginal);
  texteCopie.contenu = contenuAlternatif;
  if (suffixe) texteCopie.titre = (texteOriginal.titre || '') + ' (' + suffixe + ')';
  chargerImagesTheme(texteOriginal.categorie).then(function(images) {
    genererImpression(texteCopie, contenuAlternatif, images || {}, couvertureTheme, mode);
  }).catch(function() {
    genererImpression(texteCopie, contenuAlternatif, {}, couvertureTheme, mode);
  });
}

function recupererCouvertureTheme(categorie) {
  if (!categorie) return '';
  try {
    if (typeof DataManager !== 'undefined' && typeof DataManager.getTousLesThemes === 'function') {
      var themes = DataManager.getTousLesThemes() || [];
      for (var i = 0; i < themes.length; i++) {
        if (themes[i].titre === categorie) return themes[i].couverture || '';
      }
    }
  } catch (e) {}
  try {
    if (typeof window !== 'undefined' && window.themesData && window.themesData[categorie]) {
      return window.themesData[categorie].couverture || '';
    }
  } catch (e) {}
  return '';
}

function recupererSectionTheme(categorie) {
  if (!categorie) return '';
  try {
    if (typeof DataManager !== 'undefined' && typeof DataManager.getTousLesThemes === 'function') {
      var themes = DataManager.getTousLesThemes() || [];
      for (var i = 0; i < themes.length; i++) {
        if (themes[i].titre === categorie) return (themes[i].theme || '').trim();
      }
    }
  } catch (e) {}
  try {
    if (typeof window !== 'undefined' && window.themesData && window.themesData[categorie]) {
      return (window.themesData[categorie].theme || '').trim();
    }
  } catch (e) {}
  return '';
}

function extraireNumeroTexte(titre) {
  if (!titre) return Infinity;
  var match = titre.match(/^\s*(\d+)\s+/);
  return match ? parseInt(match[1], 10) : Infinity;
}

function extraireTitreSansNumero(titre) {
  if (!titre) return '';
  return titre.replace(/^\s*\d+\s+/, '').trim();
}

function appliquerGrasItalique(texte) {
  if (!texte || texte.indexOf('*') === -1) return texte;
  texte = texte.replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  texte = texte.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  texte = texte.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  return texte;
}

function embellirFormulesReligieuses(texte) {
  if (!texte) return texte;
  texte = texte.replace(/\b(saws|sws|sallallahu alayhi wa sallam|صلى الله عليه وسلم)\b/gi, 'ﷺ');
  texte = texte.replace(/\b(swt|jjl|subhanahou wa ta'ala|subhanahu wa ta'ala|jalla jalaluhou)\b/gi, 'ﷻ');
  texte = texte.replace(/\b(ra|rda|radi Allahou anhou|radhi Allahou anhou)\b/gi, 'ؓ');
  return texte;
}

function rendreSources(texte) {
  if (!/\[[^\]]+\]/.test(texte)) return texte;
  var matchSource = texte.match(/\[([^\]]+)\]\.?/);
  if (!matchSource) return texte;
  var contenuSource = matchSource[1].trim();
  var texteSansSource = texte.replace(/\[[^\]]+\]\.?/, '').trim();
  var idxDerniere = Math.max(texteSansSource.lastIndexOf('.'), texteSansSource.lastIndexOf('!'), texteSansSource.lastIndexOf('?'));
  var idxDebutPhrase = 0;
  if (idxDerniere !== -1) {
    var avant = texteSansSource.substring(0, idxDerniere);
    var idxPrec = Math.max(avant.lastIndexOf('.'), avant.lastIndexOf('!'), avant.lastIndexOf('?'));
    idxDebutPhrase = idxPrec + 1;
  }
  var avantPhrase = texteSansSource.substring(0, idxDebutPhrase);
  var phrase = texteSansSource.substring(idxDebutPhrase);
  return avantPhrase + '<span class="source-marge">' + contenuSource + '</span>' + phrase;
}

function rendreSourcesDiscretes(texte) {
  if (!texte) return texte;
  return texte.replace(/\(source:\s*([^)]+)\)/gi, function(m, contenu) {
    return '<span class="source-discrete">' + contenu.trim() + '</span>';
  });
}

function rendreCitations(texte) {
  if (!texte) return texte;
  if (texte.indexOf('"') === -1 && texte.indexOf('“') === -1 && texte.indexOf('”') === -1 && texte.indexOf('«') === -1) return texte;
  texte = texte.replace(/["“]([\s\S]+?)["”]/g, '<em>« $1 »</em>');
  texte = texte.replace(/«\s*([\s\S]+?)\s*»/g, '<em>« $1 »</em>');
  return texte;
}

function decouperEnBlocsTexte(buffer) {
  var lignes = buffer.split('\n');
  var blocs = [];
  var courant = '';
  var dansCitation = false;
  function compterGuillemets(ligne) {
    var d = (ligne.match(/"/g) || []).length;
    var a = (ligne.match(/[“”]/g) || []).length;
    var f = (ligne.match(/«/g) || []).length;
    return d + a + f;
  }
  for (var i = 0; i < lignes.length; i++) {
    var ligne = lignes[i].trim();
    if (ligne === '') {
      if (!dansCitation && courant.trim() !== '') { blocs.push(courant.trim()); courant = ''; }
      continue;
    }
    courant = courant === '' ? ligne : courant + '\n' + ligne;
    if (compterGuillemets(ligne) % 2 === 1) dansCitation = !dansCitation;
    if (!dansCitation) { if (courant.trim() !== '') blocs.push(courant.trim()); courant = ''; }
  }
  if (courant.trim() !== '') blocs.push(courant.trim());
  return blocs;
}

// --- Ponctuation automatique ---
function assurerPointFinal(texte) {
  if (!texte) return texte;
  var t = texte.trim();
  if (t === '') return t;
  if (/[.?!…]$/.test(t)) return t;
  return t + '.';
}

function assurerMajuscule(texte) {
  if (!texte) return texte;
  var t = texte.trim();
  if (t === '') return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function ponctuerQuestion(texte) {
  var t = assurerMajuscule(texte);
  if (/[.?!…]$/.test(t)) return t;
  return t + '.';
}

function ponctuerReponse(texte) {
  var t = assurerMajuscule(texte);
  if (/[.?!…]$/.test(t)) return t;
  return t + '.';
}

// --- Parser QCM (multi-réponses) ---
function parserQCMPourImpression(qcmTexte) {
  var lignes = qcmTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  var quizs = [];
  var currentQuiz = null;
  var lettres = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  for (var i = 0; i < lignes.length; i++) {
    var ligne = lignes[i];
    if (ligne.match(/^qcm:/i)) {
      if (currentQuiz && currentQuiz.reponses.length > 0) quizs.push(currentQuiz);
      currentQuiz = { question: ponctuerQuestion(ligne.replace(/^qcm:\s*/i, '').trim() || 'Question'), reponses: [] };
    } else if (currentQuiz) {
      var estVraie = false;
      var texteRep = ligne;
      if (/^v\s/i.test(ligne) || /^-v-\s*/.test(ligne)) { estVraie = true; texteRep = ligne.replace(/^v\s+|-v-\s*/i, '').trim(); }
      else if (/^f\s/i.test(ligne) || /^-f-\s*/.test(ligne)) { estVraie = false; texteRep = ligne.replace(/^f\s+|-f-\s*/i, '').trim(); }
      if (texteRep) {
        currentQuiz.reponses.push({
          texte: ponctuerReponse(texteRep || 'Réponse'),
          lettre: lettres[currentQuiz.reponses.length] || '?',
          estVraie: estVraie
        });
      }
    }
  }
  if (currentQuiz && currentQuiz.reponses.length > 0) quizs.push(currentQuiz);
  // Compte le nombre de vraies réponses par quiz
  quizs.forEach(function(q) {
    q.nbVraies = q.reponses.filter(function(r) { return r.estVraie; }).length;
  });
  return quizs;
}

// --- Parser question simple (q:) avec lignes 1l, 2l... ---
function parserQuestionSimplePourImpression(qTexte) {
  var lignes = qTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  var questions = [];
  for (var i = 0; i < lignes.length; i++) {
    var ligne = lignes[i];
    if (!ligne.match(/^q:/i)) continue;
    var contenu = ligne.replace(/^q:\s*/i, '').trim();
    var nbLignes = 1;
    var matchLignes = contenu.match(/\s(\d+)l\s*$/i);
    if (matchLignes) {
      nbLignes = parseInt(matchLignes[1], 10);
      contenu = contenu.replace(/\s\d+l\s*$/i, '').trim();
    }
    questions.push({ question: ponctuerQuestion(contenu), nbLignes: nbLignes });
  }
  return questions;
}

function parserOrdrePourImpression(ordreTexte) {
  var lignes = ordreTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  var elements = [];
  var consigne = 'Remets dans l\'ordre';
  for (var i = 0; i < lignes.length; i++) {
    var ligne = lignes[i];
    var match = ligne.match(/^(\d+)\s+(.+)/);
    if (match) elements.push(match[2]);
    else if (elements.length === 0 && ligne.length > 0) consigne = ligne.replace(/^o:\s*/i, '').trim() || consigne;
  }
  return { elements: elements, consigne: consigne };
}

function parserCartesPourImpression(carteTexte) {
  var lignes = carteTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  var cartes = [];
  var current = null;
  for (var i = 0; i < lignes.length; i++) {
    var l = lignes[i];
    if (l.toLowerCase().startsWith('r:')) {
      if (current) cartes.push(current);
      current = { recto: l.replace(/^r:\s*/i, '').trim(), verso: '' };
    } else if (l.toLowerCase().startsWith('v:') && current) {
      current.verso = l.replace(/^v:\s*/i, '').trim();
    }
  }
  if (current) cartes.push(current);
  return cartes;
}

function parserRelierPourImpression(relierTexte) {
  var lignes = relierTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  if (lignes.length === 0) return null;
  var consigne = lignes[0].replace(/^l:\s*/i, '').trim() || 'Relie les éléments';
  var paires = [];
  for (var i = 1; i < lignes.length; i++) {
    var idx = lignes[i].indexOf('-');
    if (idx === -1) continue;
    var gauche = lignes[i].substring(0, idx).trim();
    var droite = lignes[i].substring(idx + 1).trim();
    if (gauche && droite) paires.push({ gauche: gauche, droite: droite });
  }
  if (paires.length === 0) return null;
  var compte = {};
  paires.forEach(function(p) { compte[p.droite] = (compte[p.droite] || 0) + 1; });
  var droites = [];
  var vues = {};
  paires.forEach(function(p) {
    if (!vues[p.droite]) { vues[p.droite] = true; droites.push({ droite: p.droite, partagee: compte[p.droite] > 1 }); }
  });
  for (var j = droites.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var tmp = droites[j]; droites[j] = droites[k]; droites[k] = tmp;
  }
  return { consigne: consigne, paires: paires, droitesMelangees: droites };
}

function parserTextesTrousPourImpression(ttTexte) {
  var lignes = ttTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  var resultats = [];
  lignes.forEach(function(ligne) {
    if (!/^tt:/i.test(ligne)) return;
    var contenu = ligne.replace(/^tt:\s*/i, '').trim();
    var match = contenu.match(/\/([^\/]+)\//);
    if (!match) return;
    var mot = match[1].trim();
    var idx = contenu.indexOf('/' + mot + '/');
    resultats.push({
      avant: contenu.substring(0, idx).trim(),
      mot: mot,
      apres: contenu.substring(idx + mot.length + 2).trim()
    });
  });
  return resultats;
}

function parserVraiFauxPourImpression(vfTexte) {
  var lignes = vfTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  var questions = [];
  lignes.forEach(function(ligne) {
    if (!/^vf:/i.test(ligne)) return;
    var contenu = ligne.replace(/^vf:\s*/i, '').trim();
    var match = contenu.match(/\(([vf])\)\s*$/i);
    if (!match) return;
    var question = contenu.replace(/\s*\([vf]\)\s*$/i, '').trim();
    if (question === '') return;
    questions.push(ponctuerQuestion(question));
  });
  return questions;
}

function parserCopierPourImpression(copierTexte) {
  if (!copierTexte) return [];
  var lignes = copierTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  var blocs = [];
  lignes.forEach(function(ligne) {
    var contenu = ligne.replace(/^c:\s*/i, '').trim();
    if (!contenu) return;
    var mots = contenu.split(',').map(function(m) { return m.trim(); }).filter(function(m) { return m !== ''; });
    if (mots.length > 0) blocs.push({ mots: mots });
  });
  return blocs;
}

function parserPointPourImpression(pointTexte) {
  if (!pointTexte) return [];
  var lignes = pointTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  var blocs = [];
  lignes.forEach(function(ligne) {
    var contenu = ligne.replace(/^\s*pnt:\s*/i, '').trim();
    if (!contenu) return;
    blocs.push({ mot: contenu });
  });
  return blocs;
}

function parserMemoPourImpression(memoTexte) {
  if (!memoTexte) return [];
  return memoTexte.split('\n\n').map(function(bloc) {
    var t = bloc.replace(/^m:\s*/i, '').trim();
    return t ? { texte: ponctuerQuestion(t) } : null;
  }).filter(function(x) { return x !== null; });
}

function parserVocabArabe(vocabTexte) {
  if (!vocabTexte) return [];
  var paires = [];
  vocabTexte.split('\n').forEach(function(ligne) {
    var l = ligne.trim();
    if (!l) return;
    // Découpage par virgules (paires multiples)
    var morceaux = l.split(',').map(function(m) { return m.trim(); }).filter(function(m) { return m !== ''; });
    morceaux.forEach(function(m) {
      var idx = m.indexOf(':');
      if (idx === -1) {
        // essayer avec '='
        idx = m.indexOf('=');
      }
      if (idx !== -1) {
        var mot = m.substring(0, idx).trim();
        var trad = m.substring(idx + 1).trim();
        if (mot && trad) paires.push({ mot: mot, trad: trad });
      } else {
        if (m) paires.push({ mot: m, trad: '' });
      }
    });
  });
  return paires;
}

  // ---- Construction du HTML ----
  var printHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playpen+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
@font-face {
  font-family: 'KFGQPC Alphabet Dotted';
  src: url('https://raw.githubusercontent.com/webmasterdemedit/medit/main/fonts/kfgqpc-alphabet-dotted-regular.ttf') format('truetype');
  font-weight: normal; font-style: normal; font-display: swap;
}
* { margin:0; padding:0; box-sizing:border-box; }
@page { margin: 1.6cm 1.7cm 1.6cm 1.7cm; size: A4; }
body { font-family: 'Georgia','Iowan Old Style','Palatino Linotype','Book Antiqua',serif;
  background:#faf7f0; color:#2a241c; font-size:11.5pt; line-height:1.5; }
.arabe, [lang="ar"] { font-family:'Janna LT Bold','Traditional Arabic','Amiri',serif !important;
  font-size:2.1em; line-height:1; vertical-align:middle; }
.page { max-width:100%; padding:0; background:#faf7f0; overflow:visible; }
.entete-eleve { margin-bottom:4px; padding:4px 0 2px; font-size:9.5pt; color:#4a3f31; }
.entete-eleve .ligne-eleve { display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.entete-eleve span { white-space:nowrap; }
.entete-eleve strong { font-weight:600; color:#3a2e22; letter-spacing:0.2px; }
.note-haut { display:flex; justify-content:space-between; align-items:baseline; gap:30px; padding:2px 0 6px; font-size:10pt; }
.note-haut strong { font-weight:600; color:#3a2e22; }
.note-haut .note-haut-droite { flex:1; display:flex; align-items:baseline; gap:4px; }
.note-haut .note-haut-droite .ligne-pointillee { display:inline-block; flex:1; border-bottom:0.6px dotted #b0a48f; height:12px; }
.filet { border:none; border-top:1.6px solid #2a241c; border-bottom:0.6px solid #b0a48f; height:4px; margin:10px 0 14px; }
.temps-lecture-haut { text-align:center; font-size:9pt; color:#8a7d68; font-style:italic; margin-bottom:10px; letter-spacing:0.5px; font-family:'Georgia',serif; }
.temps-lecture-haut::before { content:"❧ "; font-style:normal; color:#a89a80; margin-right:4px; }
.bandeau-titre { padding:6px 0 4px; margin-bottom:6px; }
.bandeau-titre .ligne-titre { display:flex; flex-direction:row; align-items:center; justify-content:center; gap:16px; }
.bandeau-titre .bloc-titre-centre { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; }
.bandeau-titre .meta-niveau { font-family:'Georgia',serif; font-size:9pt; font-style:italic; color:#8a7d68; letter-spacing:0.8px; text-transform:uppercase; margin-bottom:2px; }
.bandeau-titre h1 { font-family:'Georgia','Playfair Display',serif; font-size:20pt; font-weight:700; color:#1f1a13; letter-spacing:1.5px; text-transform:uppercase; line-height:1.15; margin:0; text-align:center; }
.bandeau-titre .meta-droite { font-family:'Georgia',serif; font-style:italic; font-size:10pt; color:#8a7d68; letter-spacing:0.5px; margin-top:2px; }
.sous-titre-filets { display:flex; align-items:center; justify-content:center; gap:10px; margin:6px auto 2px; width:60%; }
.sous-titre-filets::before, .sous-titre-filets::after { content:""; flex:1; border-top:0.7px solid #b0a48f; }
.couverture-mini { display:block; width:58px; height:80px; object-fit:cover; border-radius:1px; border:0.5px solid #b0a48f; box-shadow:0 1px 3px rgba(60,45,25,0.15); flex-shrink:0; }
.numero-texte { display:inline-block; background:#2a241c; color:#faf7f0; font-family:'Georgia',serif; font-size:12pt; font-weight:bold; line-height:1; padding:4px 11px; border-radius:1px; letter-spacing:1px; white-space:nowrap; }
/* Vocabulaire français (en haut) */
.vocab-haut { margin:10px 0 8px; width:100%; padding:8px 12px 10px; background:#f6f1e6; border:0.7px solid #c9bda3; border-left:3px solid #6a5d47; box-shadow:1px 1px 0 #e4dccb; text-align:left; break-inside:avoid; page-break-inside:avoid; }
.vocab-haut .titre-memo { display:block; font-family:'Georgia',serif; font-weight:700; font-size:8pt; text-transform:uppercase; letter-spacing:2px; color:#6a5d47; text-align:left; margin-bottom:5px; padding-bottom:3px; border-bottom:0.5px solid #c9bda3; }
.vocab-haut .titre-memo::before { content:"❧  "; color:#a89a80; font-size:7.5pt; }
.vocab-haut .vocab-liste { list-style:none; padding:0; margin:0; text-align:left; column-count:2; column-gap:14px; column-rule:0.5px dotted #c9bda3; }
.vocab-haut .vocab-liste li { display:block; font-size:8.8pt; line-height:1.4; color:#2a241c; margin-bottom:3px; padding-left:9px; text-indent:-9px; break-inside:avoid; page-break-inside:avoid; }
.vocab-haut .vocab-liste li .vocab-mot { font-style:italic; font-weight:600; color:#2a241c; }
.vocab-haut .vocab-liste li .vocab-def { font-style:normal; color:#5a4f3d; }
/* Vocabulaire arabe (après texte) — style distinct */
.vocab-arabe-bloc { margin:18px 0 10px; padding:10px 14px 12px; background:#eef4f0; border:0.7px solid #9db8a8; border-left:3px solid #4a7a5e; break-inside:avoid; page-break-inside:avoid; }
.vocab-arabe-bloc .titre-vocab-ar { display:block; font-family:'Georgia',serif; font-weight:700; font-size:8pt; text-transform:uppercase; letter-spacing:2px; color:#4a7a5e; margin-bottom:6px; padding-bottom:3px; border-bottom:0.5px solid #9db8a8; }
.vocab-arabe-bloc .titre-vocab-ar::before { content:"✦  "; color:#7a9a88; font-size:7.5pt; }
.vocab-arabe-bloc .vocab-ar-liste { list-style:none; padding:0; margin:0; column-count:2; column-gap:16px; }
.vocab-arabe-bloc .vocab-ar-liste li { display:flex; justify-content:space-between; align-items:baseline; gap:8px; font-size:9.5pt; line-height:1.5; margin-bottom:4px; padding:2px 0; border-bottom:0.4px dotted #c5d6cd; break-inside:avoid; }
.vocab-arabe-bloc .vocab-ar-liste li .vocab-ar-mot { font-family:'Janna LT Bold','Traditional Arabic','Amiri',serif; font-size:1.5em; color:#1f4a30; direction:rtl; font-weight:600; line-height:1; }
.vocab-arabe-bloc .vocab-ar-liste li .vocab-ar-trad { font-style:italic; color:#5a4f3d; text-align:right; }
.corps-contenu { padding:0; }
.texte-zone { margin-top:32px; margin-bottom:10px; }
.paragraphe { margin-bottom:10px; break-inside:auto; page-break-inside:auto; }
.paragraphe p { font-size:12.8pt; margin-bottom:6px; text-align:justify; text-indent:1.4em; line-height:1.6; hyphens:auto; }
.paragraphe p:last-child { margin-bottom:0; }
.paragraphe p.p-avec-source { position:relative; padding-right:130px; }
.source-discrete { position:absolute; top:0; right:0; width:120px; font-family:'Georgia',serif; font-style:italic; font-size:9.5pt; line-height:1.25; color:#6a5d47; text-align:left; white-space:normal; padding-top:2px; border-top:0.5px solid #c9bda3; }
.paragraphe.lettrine p:first-child::first-letter { font-family:'Georgia',serif; font-size:3.1em; float:left; line-height:0.82; padding:4px 8px 0 0; color:#2a241c; font-weight:700; }
.paragraphe p .source-marge, .texte-zone p .source-marge { float:right; display:inline-block; margin:6px 0 6px 16px; padding:4px 0 0 0; font-family:'Georgia',serif; font-size:11pt; font-weight:700; font-style:italic; color:#6a5d47; text-align:right; max-width:23%; line-height:1.25; text-indent:0; white-space:normal; vertical-align:top; border-top:0.5px solid #c9bda3; padding-top:4px; }
.paragraphe p em, .texte-zone p em { font-style:italic; white-space:pre-line; color:#3a2e22; }
.paragraphe::after { content:""; display:table; clear:both; }
.print-img { display:block; height:auto; border:none; margin:12px 0; page-break-inside:avoid; break-inside:avoid; border-radius:1px; box-shadow:0 1px 4px rgba(60,45,25,0.12); }
.print-img-centre { margin-left:auto; margin-right:auto; }
.print-img-gauche { float:left; margin:6px 16px 10px 0; }
.print-img-droite { float:right; margin:6px 0 10px 16px; }
.print-img-petit { max-width:110px; } .print-img-moyen { max-width:180px; } .print-img-grand { max-width:230px; }
.img-manquante { display:block; padding:8px; border:1px dashed #c9bda3; color:#8a7d68; font-size:9pt; text-align:center; margin:8px 0; font-style:italic; }
.zone-exercices { margin-top:22px; }
.zone-exercices .titre-questions { font-family:'Georgia',serif; font-size:13pt; font-weight:700; color:#2a241c; letter-spacing:2px; text-transform:uppercase; text-align:center; margin:0 0 4px; padding:0; }
.zone-exercices .titre-questions-filets { display:flex; align-items:center; justify-content:center; gap:12px; width:55%; margin:0 auto 18px; }
.zone-exercices .titre-questions-filets::before, .zone-exercices .titre-questions-filets::after { content:""; flex:1; border-top:1.2px solid #2a241c; }
.exo { margin-bottom:14px; padding-bottom:10px; border-bottom:0.5px dotted #d6cbb4; break-inside:avoid; page-break-inside:avoid; }
.exo:last-child { border-bottom:none; margin-bottom:0; padding-bottom:0; }
.exo.exo-copier { border-bottom:none; margin-bottom:8px; padding-bottom:2px; }
.exo.exo-copier + .exo.exo-copier { margin-top:0; }
.exo.exo-copier .bloc-copier-inline { margin-top:0; }
.exo.exo-point { border-bottom:none; margin-bottom:8px; padding-bottom:2px; }
.consigne-exo { font-size:8.8pt; font-weight:700; color:#6a5d47; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:5px; margin-top:0; padding:0; page-break-after:avoid; break-after:avoid; font-family:'Georgia',serif; }
.consigne-exo::before { content:"❧  "; color:#a89a80; font-size:8pt; margin-right:2px; }
.exo-ligne { display:flex; align-items:baseline; gap:8px; margin-top:3px; }
.exo-num-inline { display:inline-flex; align-items:center; justify-content:center; width:17px; height:17px; background:transparent; color:#2a241c; border:0.9px solid #2a241c; border-radius:50%; font-weight:700; font-size:8.5pt; flex-shrink:0; font-family:'Georgia',serif; line-height:1; padding-bottom:1.2px; transform:translateY(-0.5px); }
.exo-texte { flex:1; font-size:10.5pt; line-height:1.5; }
/* QCM multi-réponses */
.qcm-reponses { margin-left:26px; margin-top:4px; }
.qcm-rep { display:block; margin-bottom:2px; font-size:10.5pt; }
.qcm-case { display:inline-block; width:10px; height:10px; border:0.9px solid #4a3f31; margin-right:6px; vertical-align:middle; background:#faf7f0; border-radius:1px; }
/* q: question simple — lignes pointillées */
.q-lignes { margin-left:26px; margin-top:6px; }
.q-ligne { border-bottom:0.5px dotted #b0a48f; height:22px; margin-bottom:14px; }
/* open qs: */
.open-lignes { margin-top:4px; margin-left:26px; }
.open-ligne { border-bottom:0.5px dotted #b0a48f; height:24px; margin-bottom:16px; }
.carte-ligne-courte { margin-top:4px; margin-left:26px; width:50%; border-bottom:0.5px dotted #b0a48f; height:16px; }
.ordre-grille { margin:4px 0 4px 26px; display:grid; grid-template-columns:auto auto; column-gap:12px; row-gap:3px; font-size:10.5pt; }
.ordre-cell-texte { white-space:nowrap; }
.ordre-cell-pointille { white-space:nowrap; color:#6a5d47; align-self:center; font-size:9.5pt; font-style:italic; }
.ordre-lettre { font-weight:700; color:#2a241c; }
.tt-phrase-print { flex:1; font-size:10.8pt; line-height:1.6; }
.tt-phrase-print .tt-trou { display:inline-block; min-width:90px; border-bottom:0.9px solid #4a3f31; text-align:center; padding:0 6px; }
.exo-texte-vf { font-size:10.5pt; line-height:1.5; flex:1; }
.vf-ligne .vf-cases { font-size:9.5pt; white-space:nowrap; margin-left:6px; flex-shrink:0; color:#4a3f31; }
.relier-zone-lignes { position:relative; margin:6px 0 6px 26px; max-width:100%; }
.relier-lignes-grid { display:flex; justify-content:space-between; align-items:center; gap:60px; }
.relier-col-lignes { flex:1; display:flex; flex-direction:column; gap:5px; }
.relier-ligne-item { display:flex; align-items:center; gap:6px; font-size:10.5pt; padding:1px 0; min-height:16px; }
.relier-col-lignes.gauche .relier-ligne-item { justify-content:flex-end; text-align:right; }
.relier-col-lignes.droite .relier-ligne-item { justify-content:flex-start; text-align:left; }
.relier-point { width:8px; height:8px; border:1px solid #4a3f31; border-radius:50%; background:#faf7f0; flex-shrink:0; box-sizing:border-box; }
.relier-point.relier-point-partage { border-radius:0; }
.bloc-copier-inline { width:100%; margin-top:4px; }
.copier-ligne-inline { position:relative; display:flex; align-items:flex-end; justify-content:flex-end; gap:10px; min-height:44px; padding-bottom:10px; direction:ltr; }
.copier-ligne-pointillee { position:absolute; left:0; right:0; bottom:6px; height:0; border-bottom:1px dotted #6a5d47; z-index:0; pointer-events:none; }
.copier-fleche-apres { flex:0 0 auto; display:flex; align-items:flex-end; position:relative; z-index:2; background:#faf7f0; padding:0 2px; }
.copier-fleche-apres svg { display:block; width:38px; height:18px; overflow:visible; }
.copier-texte-arabe { font-family:'Playpen Sans Arabic','Janna LT Bold','Traditional Arabic','Amiri',serif; font-size:2.2em; line-height:1; color:#1f1a13; direction:rtl; white-space:nowrap; flex:0 0 auto; position:relative; z-index:2; background:#faf7f0; padding:0 4px; }
.copier-texte-arabe .copier-mot { display:inline-block; white-space:nowrap; direction:rtl; }
.copier-texte-arabe-pointille { flex:0 0 auto; position:relative; z-index:2; display:flex; align-items:flex-end; justify-content:center; background:#faf7f0; padding:0 4px; }
.copier-mot-pointille { font-family:'KFGQPC Alphabet Dotted','Janna LT Bold','Traditional Arabic','Amiri',serif; font-size:2.2em; line-height:1; color:#8a7d68; direction:rtl; white-space:nowrap; }
.copier-ligne-point { position:relative; display:flex; align-items:center; justify-content:flex-start; gap:24px; min-height:48px; direction:rtl; flex-wrap:nowrap; overflow:hidden; max-width:100%; width:100%; }
.copier-mot-kfg { font-family:'KFGQPC Alphabet Dotted','Janna LT Bold','Traditional Arabic','Amiri',serif; font-size:2.7em; line-height:1.05; color:#8a7d68; direction:rtl; white-space:nowrap; flex:0 0 auto; }
.copier-mot-kfg.copier-mot-kfg-modele { color:#000; -webkit-text-stroke:2px #000; text-shadow:0 0 1.5px #000,0 0 1.5px #000,0 0 1.5px #000,0 0 1.5px #000; }
/* Mémorisation */
.exo.exo-memo { break-inside:avoid; page-break-inside:avoid; }
.memo-texte { font-size:11pt; line-height:1.6; font-style:italic; padding:8px 12px; background:#f9f4e8; border-left:3px solid #a89a80; margin:4px 0 8px; }
.memo-consigne { font-size:9.5pt; color:#5a4f3d; font-style:italic; margin-bottom:6px; }
.memo-cases { display:flex; flex-wrap:wrap; gap:14px; margin:4px 0 4px 4px; font-size:10pt; }
.memo-case { display:inline-flex; align-items:center; gap:5px; }
.memo-case .memo-carre { display:inline-block; width:11px; height:11px; border:0.9px solid #4a3f31; background:#faf7f0; border-radius:1px; }
.memo-mention { font-size:8.5pt; font-style:italic; color:#8a7d68; margin-top:4px; }
.zone-memo { margin:20px 0 10px; padding:12px 16px 12px; background:#f4efe3; border-top:0.6px solid #c9bda3; border-bottom:0.6px solid #c9bda3; break-inside:avoid; page-break-inside:avoid; }
.pied-page { text-align:center; font-size:8pt; color:#8a7d68; margin:18px 0 6px; padding-top:8px; border-top:0.6px solid #d6cbb4; display:flex; justify-content:center; align-items:center; gap:16px; }
.pied-page .pied-centre { font-style:italic; color:#6a5d47; letter-spacing:0.5px; }
.pied-page .pied-ecrit, .pied-imprime-le { font-style:italic; font-size:7.5pt; color:#a89a80; }
</style>
</head>
<body>
<div class="page">
<div class="entete-eleve">
  <div class="ligne-eleve">
    <span><strong>Nom et prénom :</strong> .............................                            </span>
    <span><strong>Date :</strong>  ..... / ..... / ........</span>
    <span><strong>Feuille n° :</strong> .....</span>
  </div>
</div>

${noteHtml}

${afficherTexte ? `
<div class="temps-lecture-haut">Temps d'application estimé : ${tempsLecture}</div>

<div class="bandeau-titre">
  <div class="ligne-titre">
    ${couvertureHtml}
    <div class="bloc-titre-centre">
      <div class="meta-niveau">Niveau ${texte.niveau || 0}</div>
      ${numeroHtml}
      <h1>${titreAffiche || 'Lecture'}</h1>
      <div class="sous-titre-filets"></div>
      <div class="meta-droite">${ligneRappel}</div>
    </div>
  </div>
</div>

${vocabClean.length > 0 ? '<div class="vocab-haut"><div class="titre-memo">Vocabulaire</div><ul class="vocab-liste">' + vocabClean.map(function(m) {
  var idxColon = m.indexOf(':');
  var sep = idxColon !== -1 ? idxColon : -1;
  if (sep !== -1) {
    var mot = majPremiereLettre(m.substring(0, sep).trim());
    var def = m.substring(sep + 1).trim();
    return '<li><span class="vocab-mot">' + mot + '</span> : <span class="vocab-def">' + def + '</span></li>';
  }
  return '<li><span class="vocab-mot">' + majPremiereLettre(m) + '</span></li>';
}).join('') + '</ul></div>' : ''}
` : ''}

<div class="corps-contenu">
  <div class="texte-zone">

    var exoNum = 0;
  var zoneExercicesOuverte = false;
  var premierParagraphe = true;

  function ouvrirZoneExercices() {
    if (!zoneExercicesOuverte) {
      printHtml += '</div>'; // ferme .texte-zone
      printHtml += '<div class="zone-exercices">';
      printHtml += '<div class="titre-questions">' + titreZoneExercices + '</div>';
      printHtml += '<div class="titre-questions-filets"></div>';
      zoneExercicesOuverte = true;
    }
  }

  // ---- Consignes groupées ----
  var consignesBase = {
    qcm:    { sing: 'Cochez la bonne réponse :', plur: 'Cochez la ou les bonnes réponses :' },
    q:      { sing: 'Réponds à la question :', plur: 'Réponds aux questions :' },
    open:   { sing: 'Réponds à la question :', plur: 'Réponds aux questions :' },
    tt:     { sing: 'Complète la phrase :', plur: 'Complète les phrases :' },
    vf:     { sing: 'Coche Vrai ou Faux :', plur: 'Coche Vrai ou Faux :' },
    ordre:  { sing: 'Remets dans l\'ordre :', plur: 'Remets dans l\'ordre :' },
    relier: { sing: 'Relie les éléments :', plur: 'Relie les éléments :' },
    copier: { sing: 'Recopie :', plur: 'Recopie :' },
    point:  { sing: 'Trace le mot en pointillé :', plur: 'Trace les mots en pointillé :' },
    memo:   { sing: 'Mémorisation :', plur: 'Mémorisation :' }
  };

  // Pré-calcul des consignes groupées
  var iGroupe = 0;
  while (iGroupe < blocsExercices.length) {
    var blocCourant = blocsExercices[iGroupe];
    var typeCourant = blocCourant.type;
    var nbConsecutifs = 1;
    var jGroupe = iGroupe + 1;
    while (jGroupe < blocsExercices.length && blocsExercices[jGroupe].type === typeCourant) {
      nbConsecutifs++;
      jGroupe++;
    }
    // Pour QCM : le pluriel dépend du nombre de vraies réponses
    if (typeCourant === 'qcm') {
      var nbVraies = (blocCourant.data && blocCourant.data.nbVraies) || 1;
      if (nbVraies > 1) {
        blocCourant._consigne = consignesBase.qcm.plur;
      } else if (nbConsecutifs > 1) {
        blocCourant._consigne = consignesBase.qcm.plur;
      } else {
        blocCourant._consigne = consignesBase.qcm.sing;
      }
    } else if (typeCourant === 'vf') {
      var nbVf = (blocCourant.data && blocCourant.data.length) || 1;
      blocCourant._consigne = nbVf > 1 ? consignesBase.vf.plur : consignesBase.vf.sing;
    } else {
      var base = consignesBase[typeCourant];
      if (base) blocCourant._consigne = (nbConsecutifs > 1) ? base.plur : base.sing;
    }
    for (var kG = iGroupe + 1; kG < jGroupe; kG++) blocsExercices[kG]._consigne = '';
    iGroupe = jGroupe;
  }

  function afficherConsigne(bloc) {
    if (bloc._consigne) printHtml += '<div class="consigne-exo">' + bloc._consigne + '</div>';
  }

  // ============================================================
  // AFFICHAGE DES PARAGRAPHES
  // ============================================================
  blocsTexte.forEach(function(bloc) {
    printHtml += '<div class="paragraphe' + (premierParagraphe ? ' lettrine' : '') + '">';
    premierParagraphe = false;
    var lignesPara = bloc.data.split('\n');
    var bufferTexte = '';

    function flushParagraphe() {
      if (!bufferTexte.trim()) { bufferTexte = ''; return; }
      var blocs = decouperEnBlocsTexte(bufferTexte);
      blocs.forEach(function(b) {
        b = embellirFormulesReligieuses(b);
        var contientSource = /\(source:\s*[^)]+\)/i.test(b);
        var rendu = appliquerGrasItalique(rendreSourcesDiscretes(rendreSources(rendreCitations(b))));
        var classe = contientSource ? ' class="p-avec-source"' : '';
        printHtml += '<p' + classe + '>' + rendu + '</p>';
      });
      bufferTexte = '';
    }
    lignesPara.forEach(function(l) {
      var trimmed = l.trim();
      var imgMatch = trimmed.match(/^img:([^:\s]+)(?::([a-zA-Z]+))?(?::([a-zA-Z]+))?$/i);
      if (imgMatch) {
        flushParagraphe();
        var nomImg = imgMatch[1];
        var opt1 = (imgMatch[2] || '').toLowerCase();
        var opt2 = (imgMatch[3] || '').toLowerCase();
        var position = 'centre', taille = 'moyen';
        [opt1, opt2].forEach(function(o) {
          if (o === 'gauche' || o === 'droite' || o === 'centre') position = o;
          else if (o === 'petit' || o === 'moyen' || o === 'grand') taille = o;
        });
        var url = imagesTheme[nomImg];
        if (!url) printHtml += '<div class="img-manquante">[image manquante : ' + nomImg + ']</div>';
        else printHtml += '<img src="' + url + '" alt="' + nomImg + '" class="print-img print-img-' + position + ' print-img-' + taille + '">';
        return;
      }
      bufferTexte = bufferTexte ? bufferTexte + '\n' + trimmed : trimmed;
    });
    flushParagraphe();
    printHtml += '</div>';
  });

  // ============================================================
  // VOCABULAIRE ARABE (après le texte, avant les exercices)
  // ============================================================
  if (afficherTexte && vocabArabeParsed.length > 0) {
    printHtml += '<div class="vocab-arabe-bloc">';
    printHtml += '<div class="titre-vocab-ar">Vocabulaire arabe</div>';
    printHtml += '<ul class="vocab-ar-liste">';
    vocabArabeParsed.forEach(function(p) {
      printHtml += '<li><span class="vocab-ar-mot">' + p.mot + '</span><span class="vocab-ar-trad">' + p.trad + '</span></li>';
    });
    printHtml += '</ul></div>';
  }

  // ============================================================
  // AFFICHAGE DES EXERCICES
  // ============================================================
  blocsExercices.forEach(function(bloc) {

    if (bloc.type === 'copier') {
      ouvrirZoneExercices();
      exoNum++;
      var mots = bloc.data.mots;
      var motComplet = mots.join(' ');
      printHtml += '<div class="exo exo-copier">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte" style="flex:1;">';
      printHtml += '<div class="bloc-copier-inline"><div class="copier-ligne-inline">';
      printHtml += '<span class="copier-ligne-pointillee"></span>';
      printHtml += '<span class="copier-fleche-apres"><svg viewBox="0 0 38 18" xmlns="http://www.w3.org/2000/svg"><path d="M 35 9 L 4 9 M 11 3 L 4 9 L 11 15" fill="none" stroke="#2a241c" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
      printHtml += '<span class="copier-texte-arabe-pointille"><span class="copier-mot-pointille">' + motComplet + '</span></span>';
      printHtml += '<span class="copier-texte-arabe">';
      for (var cm = 0; cm < mots.length; cm++) {
        printHtml += '<span class="copier-mot">' + mots[cm] + '</span>' + (cm < mots.length - 1 ? ' ' : '');
      }
      printHtml += '</span></div></div></span></div></div>';
      return;
    }

    if (bloc.type === 'point') {
      ouvrirZoneExercices();
      exoNum++;
      var motP = bloc.data.mot;
      var nbRep = 9;
      printHtml += '<div class="exo exo-point">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte" style="flex:1;"><div class="copier-ligne-point">';
      for (var rp = 0; rp < nbRep; rp++) {
        var classe = (rp === 0) ? 'copier-mot-kfg copier-mot-kfg-modele' : 'copier-mot-kfg';
        printHtml += '<span class="' + classe + '">' + motP + '</span>';
      }
      printHtml += '</div></span></div></div>';
      return;
    }

    if (bloc.type === 'qcm') {
      ouvrirZoneExercices();
      var q = bloc.data;
      exoNum++;
      printHtml += '<div class="exo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte">' + q.question + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="qcm-reponses">';
      q.reponses.forEach(function(rep) {
        printHtml += '<span class="qcm-rep"><span class="qcm-case"></span> ' + rep.lettre + '. ' + rep.texte + '</span>';
      });
      printHtml += '</div></div>';
      return;
    }

    if (bloc.type === 'q') {
      ouvrirZoneExercices();
      var qs = bloc.data;
      exoNum++;
      printHtml += '<div class="exo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte">' + qs.question + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="q-lignes">';
      for (var ql = 0; ql < qs.nbLignes; ql++) {
        printHtml += '<div class="q-ligne"></div>';
      }
      printHtml += '</div></div>';
      return;
    }

    if (bloc.type === 'open') {
      ouvrirZoneExercices();
      exoNum++;
      printHtml += '<div class="exo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte">' + bloc.data + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="open-lignes">';
      for (var ol = 0; ol < 3; ol++) printHtml += '<div class="open-ligne"></div>';
      printHtml += '</div></div>';
      return;
    }

    if (bloc.type === 'tt') {
      ouvrirZoneExercices();
      var tt = bloc.data;
      exoNum++;
      printHtml += '<div class="exo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="tt-phrase-print">';
      if (tt.avant) printHtml += tt.avant + ' ';
      printHtml += '<span class="tt-trou"></span>';
      if (tt.apres) printHtml += ' ' + tt.apres;
      printHtml += '</span></div></div>';
      return;
    }

    if (bloc.type === 'vf') {
      ouvrirZoneExercices();
      bloc.data.forEach(function(item, idxVf) {
        exoNum++;
        printHtml += '<div class="exo">';
        if (idxVf === 0) afficherConsigne(bloc);
        printHtml += '<div class="exo-ligne vf-ligne">';
        printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
        printHtml += '<span class="exo-texte-vf">' + item + '</span>';
        printHtml += '<span class="vf-cases">☐ V   ☐ F</span>';
        printHtml += '</div></div>';
      });
      return;
    }

    if (bloc.type === 'ordre') {
      ouvrirZoneExercices();
      var ordreData = bloc.data;
      var items = ordreData.elements || [];
      var consigne = ordreData.consigne || 'Remets dans l\'ordre';
      var itemsMelanges = items.slice();
      for (var m = itemsMelanges.length - 1; m > 0; m--) {
        var k = Math.floor(Math.random() * (m + 1));
        var tmp = itemsMelanges[m]; itemsMelanges[m] = itemsMelanges[k]; itemsMelanges[k] = tmp;
      }
      var lettres = ['A','B','C','D','E','F','G','H'];
      exoNum++;
      printHtml += '<div class="exo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte">' + consigne + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="ordre-grille">';
      itemsMelanges.forEach(function(item, i) {
        printHtml += '<div class="ordre-cell-texte"><span class="ordre-lettre">' + lettres[i] + '.</span> ' + item + '</div>';
        printHtml += '<div class="ordre-cell-pointille">n° ..........</div>';
      });
      printHtml += '</div></div>';
      return;
    }

    if (bloc.type === 'carte') {
      ouvrirZoneExercices();
      var c = bloc.data;
      exoNum++;
      printHtml += '<div class="exo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte">' + c.recto + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="carte-ligne-courte"></div>';
      printHtml += '</div>';
      return;
    }

    if (bloc.type === 'relier') {
      ouvrirZoneExercices();
      var relierData = bloc.data;
      exoNum++;
      printHtml += '<div class="exo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte">' + relierData.consigne + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="relier-zone-lignes"><div class="relier-lignes-grid">';
      printHtml += '<div class="relier-col-lignes gauche">';
      for (var rg = 0; rg < relierData.paires.length; rg++) {
        printHtml += '<div class="relier-ligne-item"><span>' + relierData.paires[rg].gauche + '</span><span class="relier-point"></span></div>';
      }
      printHtml += '</div><div class="relier-col-lignes droite">';
      for (var rd = 0; rd < relierData.droitesMelangees.length; rd++) {
        var dItem = relierData.droitesMelangees[rd];
        var classePoint = dItem.partagee ? 'relier-point relier-point-partage' : 'relier-point';
        printHtml += '<div class="relier-ligne-item"><span class="' + classePoint + '"></span><span>' + dItem.droite + '</span></div>';
      }
      printHtml += '</div></div></div></div>';
      return;
    }

    if (bloc.type === 'memo') {
      ouvrirZoneExercices();
      var memo = bloc.data;
      exoNum++;
      printHtml += '<div class="exo exo-memo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte" style="flex:1;">';
      printHtml += '<div class="memo-texte">' + memo.texte + '</div>';
      printHtml += '<div class="memo-consigne">Mémorise et récite correctement à l\'enseignant au moment de rendre ta copie. L\'enseignant cochera la case correspondante :</div>';
      printHtml += '<div class="memo-cases">';
      printHtml += '<span class="memo-case"><span class="memo-carre"></span> Insuffisant</span>';
      printHtml += '<span class="memo-case"><span class="memo-carre"></span> Fragile</span>';
      printHtml += '<span class="memo-case"><span class="memo-carre"></span> Satisfaisant</span>';
      printHtml += '<span class="memo-case"><span class="memo-carre"></span> Très satisfaisant</span>';
      printHtml += '</div>';
      printHtml += '<div class="memo-mention">(Cette partie sera remplie au passage devant l\'enseignant — 1 point)</div>';
      printHtml += '</span></div></div>';
      return;
    }
  });

  // ---- Fermeture des zones ----
  if (zoneExercicesOuverte) {
    printHtml += '</div>'; // ferme .zone-exercices
  } else {
    printHtml += '</div>'; // ferme .texte-zone
  }
  printHtml += '</div>'; // ferme .corps-contenu

  var idPost = texte.id || '';

  printHtml += `
    <div class="pied-page">
      Association Va.& Vi.e ; PROGRAMME Kitab-wa-hikmat de W. Khan. Écrit le ${dateCreationStr || '—'}, et imprimé le ${dateImpressionStr} à ${heureImpressionStr}. n°${idPost}
    </div>
  </div>
</body>
</html>`;

  // ---- Impression via iframe ----
  var iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  var iframeDoc = iframe.contentWindow.document;
  iframeDoc.write(printHtml);
  iframeDoc.close();

  setTimeout(function() {
    var iframeDoc2 = iframe.contentWindow.document;
    var walker = iframeDoc2.createTreeWalker(iframeDoc2.body, NodeFilter.SHOW_TEXT, null, false);
    var noeuds = [];
    var n;
    while ((n = walker.nextNode())) {
      if (/[\u0600-\u06FF]/.test(n.nodeValue || '')) noeuds.push(n);
    }
    noeuds.forEach(function(texteNode) {
      var parent = texteNode.parentNode;
      if (!parent) return;
      if (parent.classList && (parent.classList.contains('arabe') || parent.classList.contains('copier-mot') || parent.classList.contains('copier-mot-pointille') || parent.classList.contains('copier-mot-kfg') || parent.classList.contains('vocab-ar-mot'))) return;
      if (parent.tagName && parent.tagName.toLowerCase() === 'text') return;
      var txt = texteNode.nodeValue;
      var regex = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+)/g;
      var parts = txt.split(regex);
      var frag = iframeDoc2.createDocumentFragment();
      parts.forEach(function(part) {
        if (part === '') return;
        if (/[\u0600-\u06FF]/.test(part)) {
          var span = iframeDoc2.createElement('span');
          span.className = 'arabe';
          span.setAttribute('lang', 'ar');
          span.textContent = part;
          frag.appendChild(span);
        } else {
          frag.appendChild(iframeDoc2.createTextNode(part));
        }
      });
      parent.replaceChild(frag, texteNode);
    });
    try {
      iframeDoc2.title = nomFichierPdf;
      iframe.contentWindow.document.title = nomFichierPdf;
    } catch (e) {}
    iframe.contentWindow.print();
    setTimeout(function() { document.body.removeChild(iframe); }, 1000);
  }, 1500);
}
