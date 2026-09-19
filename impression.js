// ============================================================
// IMPRESSION - Qiraat
// Fichier autonome : génère une page imprimable pour un chapitre
// Dépend de : DataManager (data-manager.js)
// ============================================================

// ============================================================
// POINT D'ENTRÉE
// ============================================================
function imprimerChapitre(chapitreId, titre, chapitresData) {
  if (typeof chapitresData === 'undefined' || chapitresData === null) {
    chapitresData = (typeof window !== 'undefined' && window.chapitresData) ? window.chapitresData : [];
  }

  var chapitre = null;
  if (chapitresData && chapitresData.length > 0) {
    for (var i = 0; i < chapitresData.length; i++) {
      if (chapitresData[i].id === chapitreId) {
        chapitre = chapitresData[i];
        break;
      }
    }
  }

  if (!chapitre) {
    var tousLesChapitres = DataManager.getTousLesChapitres();
    for (var i = 0; i < tousLesChapitres.length; i++) {
      if (tousLesChapitres[i].id === chapitreId) {
        chapitre = tousLesChapitres[i];
        break;
      }
    }
  }

  if (!chapitre) {
    alert('Chapitre "' + titre + '" non trouvé.');
    return;
  }

  var contenu = chapitre.contenu || '';
  if (!contenu) {
    alert('Ce chapitre ne contient pas de texte à imprimer.');
    return;
  }

  genererImpression(chapitre, contenu);
}

// ============================================================
// PARSEURS
// ============================================================
function parserQuizsPourImpression(quizTexte) {
  var lignes = quizTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  var quizs = [];
  var currentQuiz = null;
  var lettres = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (var i = 0; i < lignes.length; i++) {
    var ligne = lignes[i];
    if (ligne.match(/^q:/i)) {
      if (currentQuiz && currentQuiz.reponses.length > 0) {
        quizs.push(currentQuiz);
      }
      currentQuiz = {
        question: ligne.replace(/^q:\s*/i, '').trim() || 'Question',
        reponses: []
      };
    } else if (currentQuiz) {
      var texteRep = ligne;
      if (/^v\s/i.test(ligne) || /^-v-\s*/.test(ligne)) {
        texteRep = ligne.replace(/^v\s+|-v-\s*/i, '').trim();
      } else if (/^f\s/i.test(ligne) || /^-f-\s*/.test(ligne)) {
        texteRep = ligne.replace(/^f\s+|-f-\s*/i, '').trim();
      }
      if (texteRep) {
        currentQuiz.reponses.push({
          texte: texteRep || 'Réponse',
          lettre: lettres[currentQuiz.reponses.length] || '?'
        });
      }
    }
  }

  if (currentQuiz && currentQuiz.reponses.length > 0) {
    quizs.push(currentQuiz);
  }
  return quizs;
}

function parserOrdrePourImpression(ordreTexte) {
  var lignes = ordreTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  var elements = [];
  var consigne = 'Remettre dans l\'ordre';

  for (var i = 0; i < lignes.length; i++) {
    var ligne = lignes[i];
    var match = ligne.match(/^(\d+)\s+(.+)/);
    if (match) {
      elements.push(match[2]);
    } else if (elements.length === 0 && ligne.length > 0) {
      consigne = ligne.replace(/^o:\s*/i, '').trim() || consigne;
    }
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
  var lignes = relierTexte.split('\n')
    .map(function(l) { return l.trim(); })
    .filter(function(l) { return l !== ''; });

  if (lignes.length === 0) return null;

  var consigne = lignes[0].replace(/^l:\s*/i, '').trim() || 'Relie les éléments';
  var paires = [];

  for (var i = 1; i < lignes.length; i++) {
    var idx = lignes[i].indexOf('-');
    if (idx === -1) continue;
    var gauche = lignes[i].substring(0, idx).trim();
    var droite = lignes[i].substring(idx + 1).trim();
    if (gauche && droite) {
      paires.push({ gauche: gauche, droite: droite });
    }
  }

  if (paires.length === 0) return null;

  var compteParDroite = {};
  paires.forEach(function(p) {
    compteParDroite[p.droite] = (compteParDroite[p.droite] || 0) + 1;
  });

  var droitesUniques = [];
  var dejaVues = {};
  paires.forEach(function(p) {
    if (!dejaVues[p.droite]) {
      dejaVues[p.droite] = true;
      droitesUniques.push({
        droite: p.droite,
        partagee: compteParDroite[p.droite] > 1
      });
    }
  });

  for (var j = droitesUniques.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var tmp = droitesUniques[j];
    droitesUniques[j] = droitesUniques[k];
    droitesUniques[k] = tmp;
  }

  return { consigne: consigne, paires: paires, droitesMelangees: droitesUniques };
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
    var avant = contenu.substring(0, idx).trim();
    var apres = contenu.substring(idx + mot.length + 2).trim();
    resultats.push({ avant: avant, mot: mot, apres: apres });
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
    questions.push(question);
  });

  return questions;
}

// ============================================================
// GÉNÉRATION IMPRESSION
// ============================================================
function genererImpression(chapitre, contenu) {
  var ordreBlocs = chapitre.ordreBlocs || [];

  // --- 1) Parser chaque type séparément ---
  var parts = contenu.split(' | ');

  var slidesArray = [];
  var quizTexte = '';
  var openTexte = '';
  var ordreTexte = '';
  var carteTexte = '';
  var relierTexte = '';
  var ttTexte = '';
  var vfTexte = '';

  parts.forEach(function(part) {
    part = part.trim();

    if (part.startsWith('q:')) {
      quizTexte = quizTexte ? quizTexte + '\n\n' + part : part;
    } else if (part.startsWith('qs:')) {
      openTexte = openTexte ? openTexte + '\n\n' + part : part;
    } else if (part.startsWith('o:')) {
      ordreTexte = ordreTexte ? ordreTexte + '\n\n' + part : part;
    } else if (part.startsWith('r:')) {
      carteTexte = carteTexte ? carteTexte + '\n\n' + part : part;
    } else if (part.startsWith('l:')) {
      relierTexte = relierTexte ? relierTexte + '\n\n' + part : part;
    } else if (part.startsWith('tt:')) {
      ttTexte = ttTexte ? ttTexte + '\n' + part : part;
    } else if (part.startsWith('vf:')) {
      vfTexte = vfTexte ? vfTexte + '\n' + part : part;
    } else {
      var cleanText = part.replace(/\r\n/g, '\n').trim();
      if (cleanText) {
        var subSlides = cleanText.split(/\n\s*\n/).filter(function(s) { return s.trim() !== ''; });
        subSlides.forEach(function(sub) {
          slidesArray.push(sub.trim());
        });
      }
    }
  });

  // --- 2) Parser les exos en tableaux indexés ---
  var quizsParsed = quizTexte ? parserQuizsPourImpression(quizTexte) : [];
  var opensParsed = [];
  if (openTexte) {
    openTexte.split('\n\n').forEach(function(bloc) {
      var t = bloc.replace(/^qs:\s*/i, '').trim();
      if (t) opensParsed.push(t);
    });
  }
  var ordresParsed = [];
  if (ordreTexte) {
    ordreTexte.split('\n\n').forEach(function(bloc) {
      var p = parserOrdrePourImpression(bloc);
      if (p && p.elements.length > 0) ordresParsed.push(p);
    });
  }
  var cartesParsed = carteTexte ? parserCartesPourImpression(carteTexte) : [];
  var reliersParsed = [];
  if (relierTexte) {
    relierTexte.split('\n\n').forEach(function(bloc) {
      var p = parserRelierPourImpression(bloc);
      if (p && p.paires.length > 0) reliersParsed.push(p);
    });
  }
  var ttsParsed = ttTexte ? parserTextesTrousPourImpression(ttTexte) : [];
  var vfsParsed = vfTexte ? parserVraiFauxPourImpression(vfTexte) : [];

  // --- 3) Construire la liste ordonnée des blocs ---
  var blocsOrdonnes = [];

  if (ordreBlocs.length > 0) {
    ordreBlocs.forEach(function(item) {
      var p = item.split(':');
      var type = p[0];
      var idx = p.length > 1 ? parseInt(p[1]) : 0;

      if (type === 'slide' && slidesArray[idx] !== undefined) {
        blocsOrdonnes.push({ type: 'slide', data: slidesArray[idx] });
      } else if (type === 'quiz' && quizsParsed[idx]) {
        blocsOrdonnes.push({ type: 'quiz', data: quizsParsed[idx] });
      } else if (type === 'open' && opensParsed[idx] !== undefined) {
        blocsOrdonnes.push({ type: 'open', data: opensParsed[idx] });
      } else if (type === 'ordre' && ordresParsed[idx]) {
        blocsOrdonnes.push({ type: 'ordre', data: ordresParsed[idx] });
      } else if (type === 'carte' && cartesParsed[idx]) {
        blocsOrdonnes.push({ type: 'carte', data: cartesParsed[idx] });
      } else if (type === 'relier' && reliersParsed[idx]) {
        blocsOrdonnes.push({ type: 'relier', data: reliersParsed[idx] });
      } else if (type === 'tt' && ttsParsed[idx]) {
        blocsOrdonnes.push({ type: 'tt', data: ttsParsed[idx] });
      } else if (type === 'vf' && vfsParsed.length > 0) {
        blocsOrdonnes.push({ type: 'vf', data: vfsParsed });
      }
    });
  } else {
    slidesArray.forEach(function(s) { blocsOrdonnes.push({ type: 'slide', data: s }); });
    quizsParsed.forEach(function(q) { blocsOrdonnes.push({ type: 'quiz', data: q }); });
    opensParsed.forEach(function(o) { blocsOrdonnes.push({ type: 'open', data: o }); });
    ttsParsed.forEach(function(t) { blocsOrdonnes.push({ type: 'tt', data: t }); });
    if (vfsParsed.length > 0) blocsOrdonnes.push({ type: 'vf', data: vfsParsed });
    ordresParsed.forEach(function(o) { blocsOrdonnes.push({ type: 'ordre', data: o }); });
    cartesParsed.forEach(function(c) { blocsOrdonnes.push({ type: 'carte', data: c }); });
    reliersParsed.forEach(function(r) { blocsOrdonnes.push({ type: 'relier', data: r }); });
  }

  // Calculer le nombre total de questions
  var nbTotalQuestions = 0;
  blocsOrdonnes.forEach(function(bloc) {
    if (bloc.type === 'quiz') nbTotalQuestions++;
    else if (bloc.type === 'open') nbTotalQuestions++;
    else if (bloc.type === 'tt') nbTotalQuestions++;
    else if (bloc.type === 'carte') nbTotalQuestions++;
    else if (bloc.type === 'ordre') nbTotalQuestions++;
    else if (bloc.type === 'relier') nbTotalQuestions++;
    else if (bloc.type === 'vf') nbTotalQuestions += bloc.data.length;
  });

  // --- MÉMO ---
  var aRetenirClean = (chapitre.aRetenir || [])
    .map(function(x) { return String(x).trim(); })
    .filter(function(x) { return x !== ''; });

  var vocabClean = [];
  (chapitre.vocabulaire || []).forEach(function(item) {
    String(item).split(',').forEach(function(mot) {
      var m = mot.trim();
      if (m !== '') vocabClean.push(m);
    });
  });

  var tagsClean = (chapitre.tags || [])
    .map(function(x) { return String(x).trim(); })
    .filter(function(x) { return x !== ''; });

  // DATES
  var dateCreation = chapitre.date || '';
  var dateCreationStr = '';
  if (dateCreation) {
    var d = new Date(dateCreation);
    if (!isNaN(d.getTime())) {
      dateCreationStr = d.toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    }
  }

  var dateImpression = new Date();
  var dateImpressionStr = dateImpression.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  var heureImpressionStr = dateImpression.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit'
  });

  var printHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${chapitre.titre || 'Lecture'}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
@page { margin: 1.2cm 1.5cm 1.2cm 1.5cm; size: A4; }
body { font-family:'Times New Roman', Times, serif; background:white; color:#1a1a1a; font-size:11pt; line-height:1.35; }

.arabe, [lang="ar"] {
  font-family: 'Janna LT Bold', 'Traditional Arabic', serif !important;
  font-size: 1.7em;
  line-height: 1;
  vertical-align: middle;
}

.page { max-width:100%; }

/* ============================================================ */
/* BANDEAU TITRE                                                 */
/* ============================================================ */
.bandeau-titre {
  background: #f5f3ee;
  border-radius: 3px;
  padding: 10px 14px 9px;
  margin-bottom: 8px;
}
.bandeau-titre .ligne-titre {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
  text-align: center;
}
.bandeau-titre .ligne-meta-haut {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 8.5pt;
  color: #6b5a48;
  margin-bottom: 2px;
}
.bandeau-titre .ligne-meta-haut .sep-meta {
  color: #b8a888;
}
.bandeau-titre h1 {
  font-family: 'Georgia', serif;
  font-size: 16pt;
  font-weight: bold;
  color: #2b1f14;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  line-height: 1.15;
  margin: 0;
}
.bandeau-titre .meta-droite {
  font-size: 8.5pt;
  color: #6b5a48;
  text-align: right;
  white-space: nowrap;
}
.bandeau-titre .sous-titre {
  font-size: 10pt;
  font-style: italic;
  color: #6b5a48;
  margin-top: 2px;
}

/* ============================================================ */
/* ENCART ÉLÈVE                                                  */
/* ============================================================ */
.entete-eleve {
  margin-bottom: 10px;
  padding: 6px 10px;
  background: #fafaf7;
  border: 0.5px solid #d8d2c4;
  border-radius: 3px;
  font-size: 9.5pt;
}
.entete-eleve .ligne-eleve {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.entete-eleve span { white-space: nowrap; }
.entete-eleve strong { font-weight: 600; color: #3a2e22; }

/* ============================================================ */
/* CHIPS TAGS + VOCABULAIRE                                      */
/* ============================================================ */
.tags-haut {
  margin-top: 4px;
  margin-bottom: 4px;
  text-align: center;
}
.tags-haut .memo-tag {
  display: inline-block;
  padding: 1px 9px;
  margin: 1px 3px;
  background: #f0ede6;
  border-radius: 10px;
  font-size: 8.5pt;
  color: #5a4a3a;
  font-style: italic;
}

.vocab-haut {
  margin-top: 3px;
  margin-bottom: 8px;
  text-align: center;
}
.vocab-haut .titre-memo {
  display: inline;
  font-weight: 600;
  font-size: 8.5pt;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #5a4a3a;
  margin-right: 6px;
}
.vocab-haut .memo-mot {
  display: inline-block;
  padding: 1px 9px;
  margin: 1px 3px;
  background: #faf8f4;
  border: 0.5px solid #c8bfa8;
  border-radius: 10px;
  font-size: 9pt;
  color: #3a2e22;
  line-height: 1.35;
}

/* ============================================================ */
/* SLIDES (pleine largeur, PAS dans les colonnes)                */
/* ============================================================ */
.slides-zone {
  margin-top: 16px;
  margin-bottom: 20px;
}
.slide { margin-bottom: 8px; break-inside: auto; page-break-inside: auto; }
.slide p { font-size: 14.3pt; margin-bottom: 4px; text-align: justify; text-indent: 1.2em; }

/* ============================================================ */
/* CORPS EN 2 COLONNES (exercices + à retenir)                   */
/* ============================================================ */
.corps-2col {
  column-count: 2;
  column-gap: 14px;
  column-rule: 1px solid #e0dccf;
  font-size: 10pt;
  line-height: 1.3;
}

.titre-questions {
  font-family: 'Georgia', serif;
  font-size: 13pt;
  font-weight: bold;
  color: #2b1f14;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid #d8d2c4;
  column-span: all;
}

.zone-exercices { margin-top:0; padding-top:0; font-size:9.5pt; line-height:1.35; color:#1a1a1a; }

.exo {
  margin-bottom:9px;
  padding-bottom:7px;
  border-bottom: 0.5px dotted #d8d2c4;
  break-inside: avoid;
  page-break-inside: avoid;
}
.exo:last-child {
  border-bottom: none;
  margin-bottom: 4px;
  padding-bottom: 0;
}

.consigne-exo {
  font-size: 8.5pt;
  font-weight: 600;
  color: #5a4a3a;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 3px;
  margin-top: 2px;
  padding: 2px 8px;
  background: #faf8f4;
  border-left: 2.5px solid #a89878;
  border-radius: 2px;
}
.consigne-exo::before {
  content: "◆ ";
  color: #a89878;
  font-size: 7pt;
  margin-right: 2px;
}

.exo-ligne {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 2px;
}

.exo-num-inline {
  display: inline-block;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  background: #5a4a3a;
  color: #ffffff;
  border-radius: 50%;
  font-weight: bold;
  font-size: 8.5pt;
  flex-shrink: 0;
}
.exo-texte {
  flex: 1;
  font-size: 9.5pt;
  line-height: 1.35;
}

/* Quiz */
.quiz-reponses { margin-left: 24px; margin-top: 2px; }
.quiz-rep { display:block; margin-bottom:1px; font-size:9.5pt; }
.quiz-case {
  display:inline-block;
  width:9px;
  height:9px;
  border:0.8px solid #5a4a3a;
  margin-right:4px;
  vertical-align:middle;
  background:white;
  border-radius: 1px;
}

/* Open */
.open-lignes { margin-top:3px; margin-left: 24px; }
.open-ligne { border-bottom:0.5px dotted #999; height:14px; margin-bottom:4px; }

/* Carte : demi-ligne pointillée */
.carte-ligne-courte {
  margin-top: 3px;
  margin-left: 24px;
  width: 50%;
  border-bottom: 0.5px dotted #999;
  height: 14px;
}

/* Ordre */
.ordre-grille {
  margin: 3px 0 3px 24px;
  display: grid;
  grid-template-columns: auto auto;
  column-gap: 10px;
  row-gap: 2px;
  font-size: 9.5pt;
}
.ordre-cell-texte { white-space: nowrap; }
.ordre-cell-pointille { white-space: nowrap; color: #333; align-self: center; font-size: 9pt; }
.ordre-lettre { font-weight: bold; color: #5a4a3a; }

/* Textes à trous */
.tt-phrase-print { flex: 1; font-size: 10pt; line-height: 1.5; }
.tt-phrase-print .tt-trou {
  display: inline-block;
  min-width: 80px;
  border-bottom: 0.8px solid #5a4a3a;
  text-align: center;
  padding: 0 4px;
}

/* Vrai/Faux */
.exo-texte-vf { font-size: 9.5pt; line-height: 1.35; flex: 1; }
.vf-ligne .vf-cases { font-size: 9pt; white-space: nowrap; margin-left: 4px; flex-shrink: 0; }

/* Relier */
.relier-zone-lignes { position: relative; margin: 4px 0 4px 24px; max-width: 100%; }
.relier-lignes-grid { display: flex; justify-content: space-between; align-items: center; gap: 60px; }
.relier-col-lignes { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.relier-ligne-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9.5pt;
  padding: 1px 0;
  min-height: 14px;
}
.relier-col-lignes.gauche .relier-ligne-item { justify-content: flex-end; text-align: right; }
.relier-col-lignes.droite .relier-ligne-item { justify-content: flex-start; text-align: left; }
.relier-point {
  width: 7px;
  height: 7px;
  border: 1px solid #5a4a3a;
  border-radius: 50%;
  background: white;
  flex-shrink: 0;
  box-sizing: border-box;
}
.relier-point.relier-point-partage { border-radius: 0; }

/* ============================================================ */
/* ZONE MÉMO "À RETENIR"                                         */
/* ============================================================ */
.zone-memo {
  margin-top:10px;
  padding: 7px 10px 8px;
  background: #fdf9ef;
  border: 0.5px solid #e0d4b8;
  border-left: 3px solid #c8a860;
  border-radius: 3px;
  break-inside: avoid;
  page-break-inside: avoid;
}
.zone-memo .titre-memo {
  font-weight:600;
  font-size:8.5pt;
  text-transform:uppercase;
  letter-spacing:1px;
  color:#7a5a1e;
  margin-bottom:4px;
}
.zone-memo .titre-memo::before {
  content: "✦ ";
  color: #c8a860;
  margin-right: 2px;
}
.zone-memo .memo-bloc { margin-bottom:5px; }
.zone-memo .memo-bloc:last-child { margin-bottom:0; }
.zone-memo .memo-liste { list-style:none; padding:0; margin:0; }
.zone-memo .memo-liste li {
  font-size:9.5pt;
  margin-bottom:2px;
  padding-left:13px;
  position:relative;
  line-height: 1.35;
}
.zone-memo .memo-liste li::before {
  content: "●";
  position: absolute;
  left: 0;
  color: #c8a860;
  font-size: 6pt;
  top: 4px;
}

/* ============================================================ */
/* BLOC FINAL                                                    */
/* ============================================================ */
.zone-note-finale {
  margin-top: 14px;
  padding: 7px 12px;
  background: #fafaf7;
  border: 0.5px solid #5a4a3a;
  border-radius: 3px;
  page-break-inside: avoid;
  break-inside: avoid;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.zone-note-finale .note-ligne {
  font-size: 10pt;
  white-space: nowrap;
  color: #2b1f14;
}
.zone-note-finale .note-ligne strong { font-weight: 600; }
.zone-note-finale .note-ligne-appreciation {
  font-size: 10pt;
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: #2b1f14;
}
.zone-note-finale .note-ligne-appreciation strong { font-weight: 600; }
.zone-note-finale .note-ligne-appreciation .ligne-pointillee {
  display: inline-block;
  flex: 1;
  border-bottom: 0.5px dotted #666;
  height: 12px;
}

/* ============================================================ */
/* PIED DE PAGE                                                  */
/* ============================================================ */
.pied-page {
  text-align: center;
  font-size: 8pt;
  color: #666;
  margin-top: 10px;
  padding-top: 5px;
  border-top: 0.5px solid #d8d2c4;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
}
.pied-page .pied-centre {
  font-style: italic;
  color: #5a4a3a;
}
.pied-page .pied-ecrit {
  font-style: italic;
  font-size: 7.5pt;
  color: #999;
}
.pied-page .imprime-le {
  font-style: italic;
  font-size: 7.5pt;
  color: #999;
}
</style>
</head>
<body>
<div class="page">

<!-- ENCART ÉLÈVE -->
<div class="entete-eleve">
  <div class="ligne-eleve">
    <span><strong>Nom et prénom :</strong> ....................................................</span>
    <span><strong>Date :</strong> ......... / ......... / .........</span>
    <span><strong>Feuille n° :</strong> .........</span>
  </div>
</div>

<!-- BANDEAU TITRE -->
<div class="bandeau-titre">
  <div class="ligne-titre">
    <h1>${chapitre.titre || 'Lecture'}</h1>
       <div class="meta-droite">
      Niveau ${chapitre.niveau || 0}
    </div>
  </div>
  ${chapitre.categorie ? '<div class="sous-titre">' + chapitre.categorie + '</div>' : ''}
</div>

${tagsClean.length > 0 ? '<div class="tags-haut">' + tagsClean.map(function(t) { return '<span class="memo-tag">#' + t + '</span>'; }).join('') + '</div>' : ''}

${vocabClean.length > 0 ? '<div class="vocab-haut"><span class="titre-memo">Vocabulaire</span>' + vocabClean.map(function(m) { return '<span class="memo-mot">' + m + '</span>'; }).join('') + '</div>' : ''}

<div class="slides-zone">
`;

  var exoNum = 0;
  var hasExercice = false;
  var zoneExercicesOuverte = false;
  var slidesZoneFermee = false;

  function ouvrirZoneExercices() {
    // Fermer la zone des slides si encore ouverte
    if (!slidesZoneFermee) {
      printHtml += '</div>'; // ferme .slides-zone
      printHtml += '<div class="corps-2col">'; // ouvre la zone 2 colonnes
      printHtml += '<div class="titre-questions">Questions</div>';
      slidesZoneFermee = true;
    }
    if (!zoneExercicesOuverte) {
      printHtml += '<div class="zone-exercices">';
      zoneExercicesOuverte = true;
    }
  }

  // ============================================================
  // PRÉ-CALCUL DES CONSIGNES (gestion singulier / pluriel)
  // + Fusion open / carte : les deux partagent le même groupe
  // ============================================================
  function typeLogique(t) {
    if (t === 'carte') return 'open';
    return t;
  }

  var consignesBase = {
    quiz:   { sing: 'Cochez la bonne réponse :',  plur: 'Cochez la bonne réponse :' },
    open:   { sing: 'Répondez à la question :',   plur: 'Répondez aux questions :' },
    tt:     { sing: 'Complétez la phrase :',      plur: 'Complétez les phrases :' },
    vf:     { sing: 'Cochez Vrai ou Faux :',      plur: 'Cochez Vrai ou Faux :' },
    ordre:  { sing: 'Remettez dans l\'ordre :',   plur: 'Remettez dans l\'ordre :' },
    relier: { sing: 'Reliez les éléments :',      plur: 'Reliez les éléments :' }
  };

  var iGroupe = 0;
  while (iGroupe < blocsOrdonnes.length) {
    var blocCourant = blocsOrdonnes[iGroupe];
    var typeCourant = typeLogique(blocCourant.type);
    if (typeCourant === 'slide') {
      iGroupe++;
      continue;
    }

    var nbConsecutifs = 1;
    var jGroupe = iGroupe + 1;
    while (jGroupe < blocsOrdonnes.length && typeLogique(blocsOrdonnes[jGroupe].type) === typeCourant) {
      nbConsecutifs++;
      jGroupe++;
    }

    if (typeCourant === 'vf') {
      nbConsecutifs = (nbConsecutifs - 1) + blocCourant.data.length;
    }

    var base = consignesBase[typeCourant];
    if (base) {
      var consigneFinale = (nbConsecutifs > 1) ? base.plur : base.sing;
      blocCourant._consigne = consigneFinale;
      for (var kGroupe = iGroupe + 1; kGroupe < jGroupe; kGroupe++) {
        blocsOrdonnes[kGroupe]._consigne = '';
      }
    }

    iGroupe = jGroupe;
  }

  function afficherConsigne(bloc) {
    if (bloc._consigne) {
      printHtml += '<div class="consigne-exo">' + bloc._consigne + '</div>';
    }
  }

  blocsOrdonnes.forEach(function(bloc) {
    if (bloc.type === 'slide') {
      printHtml += '<div class="slide">';
      var paragraphs = bloc.data.split('\n').filter(function(p) { return p.trim() !== ''; });
      paragraphs.forEach(function(p) {
        printHtml += '<p>' + p.trim() + '</p>';
      });
      printHtml += '</div>';
    } else if (bloc.type === 'quiz') {
      ouvrirZoneExercices();
      hasExercice = true;
      var q = bloc.data;
      exoNum++;
      printHtml += '<div class="exo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte">' + q.question + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="quiz-reponses">';
      q.reponses.forEach(function(rep) {
        printHtml += '<span class="quiz-rep"><span class="quiz-case"></span> ' + rep.lettre + '. ' + rep.texte + '</span>';
      });
      printHtml += '</div></div>';
    } else if (bloc.type === 'open') {
      ouvrirZoneExercices();
      hasExercice = true;
      exoNum++;
      printHtml += '<div class="exo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte">' + bloc.data + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="open-lignes">';
      printHtml += '<div class="open-ligne"></div>';
      printHtml += '<div class="open-ligne"></div>';
      printHtml += '</div></div>';
    } else if (bloc.type === 'tt') {
      ouvrirZoneExercices();
      hasExercice = true;
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
      printHtml += '</span>';
      printHtml += '</div>';
      printHtml += '</div>';
    } else if (bloc.type === 'vf') {
      ouvrirZoneExercices();
      hasExercice = true;
      bloc.data.forEach(function(question, idxVf) {
        exoNum++;
        printHtml += '<div class="exo">';
        // Consigne affichée UNIQUEMENT sur la première question VF du bloc
        if (idxVf === 0) {
          afficherConsigne(bloc);
        }
        printHtml += '<div class="exo-ligne vf-ligne">';
        printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
        printHtml += '<span class="exo-texte-vf">' + question + '</span>';
        printHtml += '<span class="vf-cases">☐ V   ☐ F</span>';
        printHtml += '</div>';
        printHtml += '</div>';
      });
    } else if (bloc.type === 'ordre') {
      ouvrirZoneExercices();
      hasExercice = true;
      var ordreData = bloc.data;
      var items = ordreData.elements || [];
      var consigne = ordreData.consigne || 'Remettez dans l\'ordre';

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
        printHtml += '<div class="ordre-cell-texte">';
        printHtml += '<span class="ordre-lettre">' + lettres[i] + '.</span> ';
        printHtml += item;
        printHtml += '</div>';
        printHtml += '<div class="ordre-cell-pointille">n° ..........</div>';
      });
      printHtml += '</div>';
      printHtml += '</div>';
    } else if (bloc.type === 'carte') {
      // Carte : même groupe que open pour la consigne, mais garde sa demi-ligne
      ouvrirZoneExercices();
      hasExercice = true;
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
    } else if (bloc.type === 'relier') {
      ouvrirZoneExercices();
      hasExercice = true;
      var relierData = bloc.data;
      exoNum++;
      printHtml += '<div class="exo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte">' + relierData.consigne + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="relier-zone-lignes">';
      printHtml += '<div class="relier-lignes-grid">';

      printHtml += '<div class="relier-col-lignes gauche">';
      for (var rg = 0; rg < relierData.paires.length; rg++) {
        printHtml += '<div class="relier-ligne-item">';
        printHtml += '<span>' + relierData.paires[rg].gauche + '</span>';
        printHtml += '<span class="relier-point"></span>';
        printHtml += '</div>';
      }
      printHtml += '</div>';

      printHtml += '<div class="relier-col-lignes droite">';
      for (var rd = 0; rd < relierData.droitesMelangees.length; rd++) {
        var dItem = relierData.droitesMelangees[rd];
        var classePoint = dItem.partagee ? 'relier-point relier-point-partage' : 'relier-point';
        printHtml += '<div class="relier-ligne-item">';
        printHtml += '<span class="' + classePoint + '"></span>';
        printHtml += '<span>' + dItem.droite + '</span>';
        printHtml += '</div>';
      }
      printHtml += '</div>';

      printHtml += '</div>';
      printHtml += '</div>';
      printHtml += '</div>';
    }
  });

  if (zoneExercicesOuverte) {
    printHtml += '</div>';
  }

  // ZONE MÉMO (dans les colonnes)
  if (aRetenirClean.length > 0) {
    printHtml += '<div class="zone-memo">';
    printHtml += '<div class="memo-bloc">';
    printHtml += '<div class="titre-memo">À retenir</div>';
    printHtml += '<ul class="memo-liste">';
    aRetenirClean.forEach(function(phrase) {
      printHtml += '<li>' + phrase + '</li>';
    });
    printHtml += '</ul></div>';
    printHtml += '</div>';
  }

  // Fermer la zone 2 colonnes (ou la zone slides si aucun exo)
  if (slidesZoneFermee) {
    printHtml += '</div>'; // ferme .corps-2col
  } else {
    printHtml += '</div>'; // ferme .slides-zone
  }

  // ENCADRÉ NOTE FINAL
  printHtml += '<div class="zone-note-finale">';
  printHtml += '<div class="note-ligne"><strong>Note :</strong> ......... / ' + nbTotalQuestions + '</div>';
  printHtml += '<div class="note-ligne-appreciation"><strong>Appréciation :</strong> <span class="ligne-pointillee"></span></div>';
  printHtml += '</div>';

    printHtml += `
    <div class="pied-page">
      <span class="pied-centre">Qiraat &mdash; W. Khan</span>
      <span class="pied-ecrit">Écrit le ${dateCreationStr || '—'}</span>
      <span class="imprime-le">Imprimé le ${dateImpressionStr} à ${heureImpressionStr}</span>
    </div>
  </div>
</body>
</html>`;

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

    var walker = iframeDoc2.createTreeWalker(
      iframeDoc2.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    var noeuds = [];
    var n;
    while ((n = walker.nextNode())) {
      if (/[\u0600-\u06FF]/.test(n.nodeValue || '')) {
        noeuds.push(n);
      }
    }

    noeuds.forEach(function(texteNode) {
      var parent = texteNode.parentNode;
      if (!parent) return;
      if (parent.classList && parent.classList.contains('arabe')) return;

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

    iframe.contentWindow.print();
    setTimeout(function() {
      document.body.removeChild(iframe);
    }, 1000);
  }, 1500);
}
