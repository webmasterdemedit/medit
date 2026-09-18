// ============================================================
// IMPRESSION - Qiraat
// Fichier autonome : génère une page imprimable pour un chapitre
// Dépend de : DataManager (data-manager.js)
// ============================================================

// ============================================================
// POINT D'ENTRÉE
// ============================================================
function imprimerChapitre(chapitreId, titre, chapitresData) {
  // Si chapitresData n'est pas passé, on tente de le récupérer globalement
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
@page { margin: 1.5cm 2cm 1.5cm 2cm; size: A4; }
body { font-family:'Times New Roman', Times, serif; background:white; color:black; font-size:12pt; line-height:1.6; }

.arabe, [lang="ar"] {
  font-family: 'Janna LT Bold', 'Traditional Arabic', serif !important;
  font-size: 2.25em;
  line-height: 1.2;
  vertical-align: middle;
}

.page { max-width:100%; min-height:100vh; display:flex; flex-direction:column; }
h1 { font-size:19pt; font-weight:bold; text-align:center; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:4px; }
.sous-titre { text-align:center; font-size:11pt; font-style:italic; margin-bottom:4px; color:#444; }
.meta-ligne { text-align:center; font-size:10pt; color:#555; margin-bottom:16px; border-bottom:1px solid #ccc; padding-bottom:8px; }
.meta-ligne span { margin:0 8px; }
.meta-ligne .sep { color:#ccc; }

.entete-eleve {
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ccc;
  font-size: 10.5pt;
}
.entete-eleve .ligne-eleve {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.entete-eleve span { white-space: nowrap; }
.entete-eleve strong { font-weight: 600; }

.slide { margin-bottom:12px; }
.slide p { font-size:12.5pt; margin-bottom:6px; text-align:justify; text-indent:2em; }

.zone-exercices { margin-top:16px; padding-top:14px; border-top:1px solid #b8a888; font-size:10.5pt; line-height:1.6; color:#1a1a1a; }

.exo { margin-bottom:14px; page-break-inside:avoid; }

.consigne-exo {
  font-size: 10pt;
  font-weight: 600;
  color: #5a4a3a;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 3px;
}

.exo-ligne {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 2px;
}
.exo-num-inline {
  font-weight: bold;
  font-size: 11pt;
  min-width: 22px;
  flex-shrink: 0;
}
.exo-texte {
  flex: 1;
  font-size: 10.5pt;
  line-height: 1.6;
}

.tags-haut {
  margin-top: 10px;
  margin-bottom: 8px;
  font-size: 10pt;
  font-style: italic;
  color: #444;
  text-align: center;
}
.tags-haut .memo-tag { display: inline-block; margin: 0 6px; font-style: italic; }
.vocab-haut { margin-top: 6px; margin-bottom: 16px; text-align: center; }
.vocab-haut .titre-memo {
  font-weight: 600;
  font-size: 9.5pt;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #5a4a3a;
  margin-bottom: 4px;
}
.vocab-haut .memo-mot {
  display: inline-block;
  padding: 1px 8px;
  margin: 2px 4px;
  border: 1px solid #999;
  font-size: 10pt;
}

.quiz-reponses { margin-left: 30px; margin-top: 3px; }
.quiz-rep { display:inline-block; margin-right:20px; font-size:10.5pt; }
.quiz-case { display:inline-block; width:11px; height:11px; border:1px solid #000; margin-right:4px; vertical-align:middle; background:white; }

.open-lignes { margin-top:4px; margin-left: 30px; }
.open-ligne { border-bottom:1px dotted #666; height:20px; margin-bottom:6px; }

.ordre-grille {
  margin: 4px 0 6px 30px;
  display: inline-grid;
  grid-template-columns: auto auto;
  column-gap: 16px;
  row-gap: 6px;
  font-size: 11pt;
}
.ordre-cell-texte { white-space: nowrap; }
.ordre-cell-pointille { white-space: nowrap; color: #333; align-self: center; }
.ordre-lettre { font-weight: bold; }

.carte-ligne-courte {
  margin-top: 6px;
  margin-left: 30px;
  width: 50%;
  border-bottom: 1px dotted #666;
  height: 18px;
}

.tt-phrase-print { flex: 1; font-size: 11pt; line-height: 1.8; }
.tt-phrase-print .tt-trou {
  display: inline-block;
  min-width: 140px;
  border-bottom: 1px solid #000;
  text-align: center;
  padding: 0 6px;
}

.exo-texte-vf { font-size: 10.5pt; line-height: 1.6; }
.vf-ligne .vf-cases { font-size: 10.5pt; white-space: nowrap; margin-left: 8px; flex-shrink: 0; }

.relier-zone-lignes { position: relative; margin: 8px 0 6px 30px; max-width: 500px; }
.relier-lignes-grid { display: flex; justify-content: space-between; align-items: center; gap: 40px; }
.relier-col-lignes { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.relier-ligne-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5pt;
  padding: 2px 0;
  min-height: 16px;
}
.relier-col-lignes.gauche .relier-ligne-item { justify-content: flex-end; text-align: right; }
.relier-col-lignes.droite .relier-ligne-item { justify-content: flex-start; text-align: left; }
.relier-point {
  width: 8px;
  height: 8px;
  border: 1.2px solid #000;
  border-radius: 50%;
  background: white;
  flex-shrink: 0;
  box-sizing: border-box;
}
.relier-point.relier-point-partage { border-radius: 0; }

.zone-memo { margin-top:20px; padding-top:14px; border-top:1px solid #b8a888; page-break-inside:avoid; }
.zone-memo .titre-memo { font-weight:600; font-size:9.5pt; text-transform:uppercase; letter-spacing:1.5px; color:#5a4a3a; margin-bottom:6px; }
.zone-memo .memo-bloc { margin-bottom:12px; }
.zone-memo .memo-bloc:last-child { margin-bottom:0; }
.zone-memo .memo-liste { list-style:none; padding:0; margin:0; }
.zone-memo .memo-liste li { font-size:10.5pt; margin-bottom:3px; padding-left:14px; position:relative; }
.zone-memo .memo-liste li::before { content:"—"; position:absolute; left:0; color:#666; }

.zone-note-finale {
  margin-top: 24px;
  padding: 12px 14px;
  border: 1.5px solid #000;
  page-break-inside: avoid;
}
.zone-note-finale .note-titre {
  font-weight: 600;
  font-size: 10pt;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: #5a4a3a;
  margin-bottom: 8px;
}
.zone-note-finale .note-ligne {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  font-size: 10.5pt;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.zone-note-finale .note-ligne-appreciation { font-size: 10.5pt; margin-bottom: 6px; }
.zone-note-finale .note-appreciation-lignes { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
.zone-note-finale .note-appreciation-ligne { border-bottom: 1px dotted #666; height: 18px; }

.pied-page { text-align:center; font-size:9pt; color:#666; margin-top:16px; padding-top:8px; border-top:1px solid #ddd; }
.pied-page .imprime-le { font-style:italic; font-size:8pt; color:#999; margin-top:2px; }
</style>
</head>
<body>
<div class="page">

<div class="entete-eleve">
  <div class="ligne-eleve">
    <span><strong>Nom et prénom :</strong> ....................................................</span>
    <span><strong>Date :</strong> ......... / ......... / .........</span>
    <span><strong>Feuille n° :</strong> .........</span>
  </div>
</div>

<h1>${chapitre.titre || 'Lecture'}</h1>
<div class="sous-titre">${chapitre.categorie || 'Sans catégorie'}</div>
<div class="meta-ligne">
  <span>Créé le : ${dateCreationStr || '—'}</span>
  <span class="sep">|</span>
  <span>Niveau ${chapitre.niveau || 0}</span>
</div>

${tagsClean.length > 0 ? '<div class="tags-haut">' + tagsClean.map(function(t) { return '<span class="memo-tag">#' + t + '</span>'; }).join('') + '</div>' : ''}

${vocabClean.length > 0 ? '<div class="vocab-haut"><div class="titre-memo">Vocabulaire</div>' + vocabClean.map(function(m) { return '<span class="memo-mot">' + m + '</span>'; }).join('') + '</div>' : ''}

<div class="zone-lecture">
`;

  var exoNum = 0;
  var hasExercice = false;
  var zoneExercicesOuverte = false;

  function ouvrirZoneExercices() {
    if (!zoneExercicesOuverte) {
      printHtml += '<div class="zone-exercices">';
      zoneExercicesOuverte = true;
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
      printHtml += '<div class="consigne-exo">Cochez la bonne réponse :</div>';
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '.</span>';
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
      printHtml += '<div class="consigne-exo">Répondez à la question :</div>';
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '.</span>';
      printHtml += '<span class="exo-texte">' + bloc.data + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="open-lignes">';
      printHtml += '<div class="open-ligne"></div>';
      printHtml += '<div class="open-ligne"></div>';
      printHtml += '<div class="open-ligne"></div>';
      printHtml += '</div></div>';
    } else if (bloc.type === 'tt') {
      ouvrirZoneExercices();
      hasExercice = true;
      var tt = bloc.data;
      exoNum++;
      printHtml += '<div class="exo">';
      printHtml += '<div class="consigne-exo">Complétez la phrase :</div>';
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '.</span>';
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
      bloc.data.forEach(function(question) {
        exoNum++;
        printHtml += '<div class="exo">';
        printHtml += '<div class="consigne-exo">Cochez Vrai ou Faux :</div>';
        printHtml += '<div class="exo-ligne vf-ligne">';
        printHtml += '<span class="exo-num-inline">' + exoNum + '.</span>';
        printHtml += '<span class="exo-texte-vf">' + question + '</span>';
        printHtml += '<span class="vf-cases">☐ Vrai   ☐ Faux</span>';
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
      printHtml += '<div class="consigne-exo">Remettez dans l\'ordre :</div>';
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '.</span>';
      printHtml += '<span class="exo-texte">' + consigne + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="ordre-grille">';
      itemsMelanges.forEach(function(item, i) {
        printHtml += '<div class="ordre-cell-texte">';
        printHtml += '<span class="ordre-lettre">' + lettres[i] + '.</span> ';
        printHtml += item;
        printHtml += '</div>';
        printHtml += '<div class="ordre-cell-pointille">n° ..................</div>';
      });
      printHtml += '</div>';
      printHtml += '</div>';
    } else if (bloc.type === 'carte') {
      ouvrirZoneExercices();
      hasExercice = true;
      var c = bloc.data;
      exoNum++;
      printHtml += '<div class="exo">';
      printHtml += '<div class="consigne-exo">Répondez à la question :</div>';
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '.</span>';
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
      printHtml += '<div class="consigne-exo">Reliez les éléments :</div>';
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '.</span>';
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

  // ZONE MÉMO
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

  // ENCADRÉ NOTE FINAL
  printHtml += '<div class="zone-note-finale">';
  printHtml += '<div class="note-titre">Correction</div>';
  printHtml += '<div class="note-ligne">';
  printHtml += '<span><strong>Nombre total de questions :</strong> ' + nbTotalQuestions + '</span>';
  printHtml += '<span><strong>Note :</strong> ......... / ' + nbTotalQuestions + '</span>';
  printHtml += '</div>';
  printHtml += '<div class="note-ligne-appreciation">';
  printHtml += '<strong>Appréciation :</strong>';
  printHtml += '</div>';
  printHtml += '<div class="note-appreciation-lignes">';
  printHtml += '<div class="note-appreciation-ligne"></div>';
  printHtml += '<div class="note-appreciation-ligne"></div>';
  printHtml += '<div class="note-appreciation-ligne"></div>';
  printHtml += '</div>';
  printHtml += '</div>';

  printHtml += `
    <div class="pied-page">
      <div>Qiraat - W. Khan </div>
      <div class="imprime-le">Imprimé le ${dateImpressionStr} à ${heureImpressionStr}</div>
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

  // Détection arabe
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
