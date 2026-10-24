// ============================================================
// IMPRESSION - Qiraat
// Fichier autonome : génère une page imprimable pour un texte
// Dépend de : DataManager (data-manager.js)
// ============================================================

function imprimerTexte(texteId, titre, textesData) {
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
    var tousLesTextes = DataManager.getTousLesTextes();
    for (var i = 0; i < tousLesTextes.length; i++) {
      if (tousLesTextes[i].id === texteId) { texte = tousLesTextes[i]; break; }
    }
  }

  if (!texte) { alert('Texte "' + titre + '" non trouvé.'); return; }

  var contenu = texte.contenu || '';
  if (!contenu) { alert('Ce texte ne contient pas de contenu à imprimer.'); return; }

  var couvertureTheme = recupererCouvertureTheme(texte.categorie);

  chargerImagesTheme(texte.categorie).then(function(images) {
    genererImpression(texte, contenu, images || {}, couvertureTheme);
  }).catch(function() {
    genererImpression(texte, contenu, {}, couvertureTheme);
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

function extraireNumeroTexte(titre) {
  if (!titre) return Infinity;
  var match = titre.match(/^\s*(\d+)\s+/);
  return match ? parseInt(match[1], 10) : Infinity;
}

function extraireTitreSansNumero(titre) {
  if (!titre) return '';
  return titre.replace(/^\s*\d+\s+/, '').trim();
}

function rendreSources(texte) {
  if (!/\[[^\]]+\]/.test(texte)) return texte;
  var matchSource = texte.match(/\[([^\]]+)\]\.?/);
  if (!matchSource) return texte;
  var contenuSource = matchSource[1].trim();
  var texteSansSource = texte.replace(/\[[^\]]+\]\.?/, '').trim();
  var idxDerniere = Math.max(
    texteSansSource.lastIndexOf('.'),
    texteSansSource.lastIndexOf('!'),
    texteSansSource.lastIndexOf('?')
  );
  var idxDebutPhrase = 0;
  if (idxDerniere !== -1) {
    var avant = texteSansSource.substring(0, idxDerniere);
    var idxPrec = Math.max(
      avant.lastIndexOf('.'),
      avant.lastIndexOf('!'),
      avant.lastIndexOf('?')
    );
    idxDebutPhrase = idxPrec + 1;
  }
  var avantPhrase = texteSansSource.substring(0, idxDebutPhrase);
  var phrase = texteSansSource.substring(idxDebutPhrase);
  return avantPhrase + '<span class="source-marge">' + contenuSource + '</span>' + phrase;
}

function rendreCitations(texte) {
  if (!texte) return texte;
  if (texte.indexOf('"') === -1 && texte.indexOf('“') === -1 && texte.indexOf('”') === -1 && texte.indexOf('«') === -1) return texte;
  texte = texte.replace(/["“]([\s\S]+?)["”]/g, '<em>« $1 »</em>');
  texte = texte.replace(/«\s*([\s\S]+?)\s*»/g, '<em>« $1 »</em>');
  return texte;
}

// Regroupe les lignes d'une citation multi-lignes dans un même bloc.
// Chaque autre ligne non vide devient un bloc séparé.
function decouperEnBlocsTexte(buffer) {
  var lignes = buffer.split('\n');
  var blocs = [];
  var courant = '';
  var dansCitation = false;

  function compterGuillemets(ligne) {
    var droits   = (ligne.match(/"/g) || []).length;
    var anglais  = (ligne.match(/[“”]/g) || []).length;
    var francais = (ligne.match(/«/g) || []).length;
    return droits + anglais + francais;
  }

  for (var i = 0; i < lignes.length; i++) {
    var ligne = lignes[i].trim();
    if (ligne === '') {
      if (!dansCitation && courant.trim() !== '') {
        blocs.push(courant.trim());
        courant = '';
      }
      continue;
    }
    courant = courant === '' ? ligne : courant + '\n' + ligne;
    if (compterGuillemets(ligne) % 2 === 1) dansCitation = !dansCitation;
    if (!dansCitation) {
      if (courant.trim() !== '') blocs.push(courant.trim());
      courant = '';
    }
  }
  if (courant.trim() !== '') blocs.push(courant.trim());
  return blocs;
}

function parserQuizsPourImpression(quizTexte) {
  var lignes = quizTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  var quizs = [];
  var currentQuiz = null;
  var lettres = ['A', 'B', 'C', 'D', 'E', 'F'];
  for (var i = 0; i < lignes.length; i++) {
    var ligne = lignes[i];
    if (ligne.match(/^q:/i)) {
      if (currentQuiz && currentQuiz.reponses.length > 0) quizs.push(currentQuiz);
      currentQuiz = { question: ligne.replace(/^q:\s*/i, '').trim() || 'Question', reponses: [] };
    } else if (currentQuiz) {
      var texteRep = ligne;
      if (/^v\s/i.test(ligne) || /^-v-\s*/.test(ligne)) texteRep = ligne.replace(/^v\s+|-v-\s*/i, '').trim();
      else if (/^f\s/i.test(ligne) || /^-f-\s*/.test(ligne)) texteRep = ligne.replace(/^f\s+|-f-\s*/i, '').trim();
      if (texteRep) currentQuiz.reponses.push({ texte: texteRep || 'Réponse', lettre: lettres[currentQuiz.reponses.length] || '?' });
    }
  }
  if (currentQuiz && currentQuiz.reponses.length > 0) quizs.push(currentQuiz);
  return quizs;
}

function parserOrdrePourImpression(ordreTexte) {
  var lignes = ordreTexte.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l !== ''; });
  var elements = [];
  var consigne = 'Remettre dans l\'ordre';
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
  var compteParDroite = {};
  paires.forEach(function(p) { compteParDroite[p.droite] = (compteParDroite[p.droite] || 0) + 1; });
  var droitesUniques = [];
  var dejaVues = {};
  paires.forEach(function(p) {
    if (!dejaVues[p.droite]) {
      dejaVues[p.droite] = true;
      droitesUniques.push({ droite: p.droite, partagee: compteParDroite[p.droite] > 1 });
    }
  });
  for (var j = droitesUniques.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var tmp = droitesUniques[j]; droitesUniques[j] = droitesUniques[k]; droitesUniques[k] = tmp;
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

// ============================================================
// GÉNÉRATION IMPRESSION
// ============================================================
function genererImpression(texte, contenu, imagesTheme, couvertureTheme) {
  imagesTheme = imagesTheme || {};
  couvertureTheme = couvertureTheme || '';
  var ordreBlocs = texte.ordreBlocs || [];
  var parts = contenu.split(' | ');

  var paragraphesArray = [];
  var quizTexte = '';
  var openTexte = '';
  var ordreTexte = '';
  var carteTexte = '';
  var relierTexte = '';
  var ttTexte = '';
  var vfTexte = '';
  var copierTexte = '';

  parts.forEach(function(part) {
    part = part.trim();
    if (part.startsWith('q:')) quizTexte = quizTexte ? quizTexte + '\n\n' + part : part;
    else if (part.startsWith('qs:')) openTexte = openTexte ? openTexte + '\n\n' + part : part;
    else if (part.startsWith('o:')) ordreTexte = ordreTexte ? ordreTexte + '\n\n' + part : part;
    else if (part.startsWith('r:')) carteTexte = carteTexte ? carteTexte + '\n\n' + part : part;
    else if (part.startsWith('l:')) relierTexte = relierTexte ? relierTexte + '\n\n' + part : part;
    else if (part.startsWith('tt:')) ttTexte = ttTexte ? ttTexte + '\n' + part : part;
    else if (part.startsWith('vf:')) vfTexte = vfTexte ? vfTexte + '\n' + part : part;
    else if (part.startsWith('c:')) copierTexte = copierTexte ? copierTexte + '\n' + part : part;
    else {
      var cleanText = part.replace(/\r\n/g, '\n').trim();
      if (cleanText) {
        var subParas = cleanText.split(/\n\s*\n/).filter(function(s) { return s.trim() !== ''; });
        subParas.forEach(function(sub) { paragraphesArray.push(sub.trim()); });
      }
    }
  });

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
  var copiersParsed = copierTexte ? parserCopierPourImpression(copierTexte) : [];

  var blocsOrdonnes = [];

  if (ordreBlocs.length > 0) {
    ordreBlocs.forEach(function(item) {
      var p = item.split(':');
      var type = p[0];
      var idx = p.length > 1 ? parseInt(p[1]) : 0;

      if ((type === 'paragraphe' || type === 'slide') && paragraphesArray[idx] !== undefined) {
        blocsOrdonnes.push({ type: 'paragraphe', data: paragraphesArray[idx] });
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
      } else if (type === 'copier' && copiersParsed[idx]) {
        blocsOrdonnes.push({ type: 'copier', data: copiersParsed[idx] });
      }
    });
  }

  // Fallback : si aucun bloc paragraphe n'a été ajouté (ordreBlocs vide OU mal formé), on met tous les paragraphes avant
  var nbParas = blocsOrdonnes.filter(function(b) { return b.type === 'paragraphe'; }).length;
  if (nbParas === 0) {
    var nouveaux = [];
    paragraphesArray.forEach(function(s) { nouveaux.push({ type: 'paragraphe', data: s }); });
    quizsParsed.forEach(function(q) { nouveaux.push({ type: 'quiz', data: q }); });
    opensParsed.forEach(function(o) { nouveaux.push({ type: 'open', data: o }); });
    ttsParsed.forEach(function(t) { nouveaux.push({ type: 'tt', data: t }); });
    if (vfsParsed.length > 0) nouveaux.push({ type: 'vf', data: vfsParsed });
    ordresParsed.forEach(function(o) { nouveaux.push({ type: 'ordre', data: o }); });
    cartesParsed.forEach(function(c) { nouveaux.push({ type: 'carte', data: c }); });
    reliersParsed.forEach(function(r) { nouveaux.push({ type: 'relier', data: r }); });
    copiersParsed.forEach(function(c) { nouveaux.push({ type: 'copier', data: c }); });
    blocsOrdonnes = nouveaux;
  }

  var nbTotalQuestions = 0;
  blocsOrdonnes.forEach(function(bloc) {
    if (bloc.type === 'quiz') nbTotalQuestions++;
    else if (bloc.type === 'open') nbTotalQuestions++;
    else if (bloc.type === 'tt') nbTotalQuestions++;
    else if (bloc.type === 'carte') nbTotalQuestions++;
    else if (bloc.type === 'ordre') nbTotalQuestions++;
    else if (bloc.type === 'relier') nbTotalQuestions++;
    else if (bloc.type === 'vf') nbTotalQuestions += bloc.data.length;
    else if (bloc.type === 'copier') nbTotalQuestions++;
  });

  var textePourCompter = '';
  blocsOrdonnes.forEach(function(b) { if (b.type === 'paragraphe') textePourCompter += ' ' + b.data; });
  var nbMots = textePourCompter.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length;
  var tempsLecture = Math.max(1, Math.round(nbMots / 14));

  var aRetenirClean = (texte.aRetenir || []).map(function(x) { return String(x).trim(); }).filter(function(x) { return x !== ''; });
  var vocabClean = [];
  (texte.vocabulaire || []).forEach(function(item) {
    String(item).split(',').forEach(function(mot) {
      var m = mot.trim();
      if (m !== '') vocabClean.push(m);
    });
  });
  var tagsClean = (texte.tags || []).map(function(x) { return String(x).trim(); }).filter(function(x) { return x !== ''; });

  var dateCreation = texte.date || '';
  var dateCreationStr = '';
  if (dateCreation) {
    var d = new Date(dateCreation);
    if (!isNaN(d.getTime())) {
      dateCreationStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    }
  }

  var dateImpression = new Date();
  var dateImpressionStr = dateImpression.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  var heureImpressionStr = dateImpression.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  var nomFichierPdf = (texte.titre || 'Lecture') + (texte.categorie ? ' - ' + texte.categorie : '') + ' - Niveau ' + (texte.niveau || 0);
  nomFichierPdf = nomFichierPdf.replace(/[\\/:*?"<>|]/g, '-');

  var numeroTexte = extraireNumeroTexte(texte.titre);
  var titreAffiche = extraireTitreSansNumero(texte.titre);
  var numeroHtml = (numeroTexte !== Infinity) ? '<span class="numero-texte">' + numeroTexte + '</span>' : '';

  var couvertureHtml = '';
  if (couvertureTheme) couvertureHtml = '<img src="' + couvertureTheme + '" alt="Couverture" class="couverture-mini">';

  var printHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${texte.titre || 'Lecture'} - ${texte.categorie || ''} - Niveau ${texte.niveau || 0}</title>
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

/* ENCART ÉLÈVE */
.entete-eleve { margin-bottom: 6px; padding: 6px 10px; font-size: 9.5pt; }
.entete-eleve .ligne-eleve { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.entete-eleve span { white-space: nowrap; }
.entete-eleve strong { font-weight: 600; color: #3a2e22; }

/* NOTE / APPRÉCIATION */
.note-haut { display: flex; justify-content: space-between; align-items: baseline; gap: 30px; padding: 2px 10px 8px; margin-bottom: 8px; font-size: 10pt; color: #1a1a1a; }
.note-haut .note-haut-gauche { white-space: nowrap; }
.note-haut .note-haut-gauche strong { font-weight: 600; }
.note-haut .note-haut-droite { flex: 1; display: flex; align-items: baseline; gap: 4px; }
.note-haut .note-haut-droite strong { font-weight: 600; white-space: nowrap; }
.note-haut .note-haut-droite .ligne-pointillee { display: inline-block; flex: 1; border-bottom: 0.5px dotted #666; height: 12px; }

/* TEMPS DE LECTURE */
.temps-lecture-haut { text-align: center; font-size: 9pt; color: #555; font-style: italic; margin-bottom: 8px; letter-spacing: 0.3px; }
.temps-lecture-haut::before { content: "⏱ "; font-style: normal; color: #777; margin-right: 3px; }

/* BANDEAU TITRE */
.bandeau-titre { background: #f2f2f2; border-radius: 3px; padding: 10px 14px 9px; margin-bottom: 8px; }
.bandeau-titre .ligne-titre { display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 10px; text-align: left; }
.bandeau-titre h1 { font-family: 'Georgia', serif; font-size: 16pt; font-weight: bold; color: #1a1a1a; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.15; margin: 0; flex: 1; }
.bandeau-titre .meta-droite { font-size: 9pt; color: #555; text-align: right; white-space: nowrap; }

.couverture-mini { display: inline-block; width: 38px; height: 52px; object-fit: cover; border-radius: 2px; border: 0.5px solid #ccc; flex-shrink: 0; vertical-align: middle; }

.numero-texte { display: inline-block; background: #1a1a1a; color: #ffffff; font-family: 'Georgia', serif; font-size: 13pt; font-weight: bold; line-height: 1; padding: 4px 10px; border-radius: 3px; letter-spacing: 0.5px; white-space: nowrap; align-self: center; flex-shrink: 0; }

/* CHIPS TAGS + VOCABULAIRE */
.tags-haut { margin-top: 4px; margin-bottom: 4px; text-align: center; }
.tags-haut .memo-tag { display: inline-block; padding: 1px 9px; margin: 1px 3px; background: #f0f0f0; border-radius: 10px; font-size: 9.5pt; color: #444; font-style: normal; }

.vocab-haut { margin-top: 3px; margin-bottom: 8px; text-align: center; }
.vocab-haut .titre-memo { display: inline; font-weight: 600; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 1px; color: #555; margin-right: 6px; }
.vocab-haut .memo-mot { display: inline-block; padding: 1px 9px; margin: 1px 3px; background: #faf8f4; border: 0.5px solid #bbb; border-radius: 10px; font-size: 9pt; color: #3a2e22; line-height: 1.35; }

/* ============================================================ */
/* PARAGRAPHES                                                    */
/* ============================================================ */
.texte-zone { margin-top: 16px; margin-bottom: 20px; }
.paragraphe { margin-bottom: 8px; break-inside: auto; page-break-inside: auto; }
.paragraphe p { font-size: 14.3pt; margin-bottom: 4px; text-align: justify; text-indent: 1.2em; }
.paragraphe p:last-child { margin-bottom: 0; }

.paragraphe p .source-marge,
.texte-zone p .source-marge {
  float: right;
  display: inline-block;
  margin: 6px 0 6px 16px;
  padding: 4px 0 0 0;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 12pt;
  font-weight: 700;
  font-style: normal;
  color: #333;
  text-align: right;
  max-width: 23%;
  line-height: 1.2;
  text-indent: 0;
  white-space: normal;
  vertical-align: top;
}

.paragraphe p em,
.texte-zone p em {
  font-style: italic;
  white-space: pre-line;
}

.paragraphe::after { content: ""; display: table; clear: both; }

.print-img { display: block; height: auto; border: none; margin: 10px 0; page-break-inside: avoid; break-inside: avoid; }
.print-img-centre { margin-left: auto; margin-right: auto; }
.print-img-gauche { float: left; margin: 6px 14px 8px 0; }
.print-img-droite { float: right; margin: 6px 0 8px 14px; }
.print-img-petit  { max-width: 100px; }
.print-img-moyen  { max-width: 170px; }
.print-img-grand  { max-width: 220px; }

.img-manquante { display: block; padding: 8px; border: 1px dashed #999; color: #666; font-size: 9pt; text-align: center; margin: 8px 0; }

/* ============================================================ */
/* CORPS 2 COLONNES                                              */
/* ============================================================ */
.corps-2col { column-count: 2; column-gap: 14px; column-rule: 1px solid #e0dccf; font-size: 10pt; line-height: 1.3; }

.titre-questions { font-family: 'Georgia', serif; font-size: 13pt; font-weight: bold; color: #1a1a1a; letter-spacing: 0.5px; text-transform: uppercase; text-align: center; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #ddd; column-span: all; }

.zone-exercices { margin-top:0; padding-top:0; font-size:9.5pt; line-height:1.35; color:#1a1a1a; }

.exo { margin-bottom:9px; padding-bottom:7px; border-bottom: 0.5px dotted #ddd; break-inside: avoid; page-break-inside: avoid; }
.exo:last-child { border-bottom: none; margin-bottom: 4px; padding-bottom: 0; }

.consigne-exo { font-size: 8.5pt; font-weight: 600; color: #333; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px; margin-top: 2px; padding: 2px 8px; background: #f5f5f5; border-left: 2.5px solid #888; border-radius: 2px; }
.consigne-exo::before { content: "◆ "; color: #888; font-size: 7pt; margin-right: 2px; }

.exo-ligne { display: flex; align-items: baseline; gap: 6px; margin-top: 2px; }

.exo-num-inline { display: inline-block; width: 16px; height: 16px; line-height: 15px; text-align: center; background: transparent; color: #1a1a1a; border: 0.8px solid #1a1a1a; border-radius: 50%; font-weight: bold; font-size: 8.5pt; flex-shrink: 0; }
.exo-texte { flex: 1; font-size: 9.5pt; line-height: 1.35; }

.quiz-reponses { margin-left: 24px; margin-top: 2px; }
.quiz-rep { display:block; margin-bottom:1px; font-size:9.5pt; }
.quiz-case { display:inline-block; width:9px; height:9px; border:0.8px solid #333; margin-right:4px; vertical-align:middle; background:white; border-radius: 1px; }

.open-lignes { margin-top:3px; margin-left: 24px; }
.open-ligne { border-bottom:0.5px dotted #999; height: 22px; margin-bottom: 18px; }

.carte-ligne-courte { margin-top: 3px; margin-left: 24px; width: 50%; border-bottom: 0.5px dotted #999; height: 14px; }

.ordre-grille { margin: 3px 0 3px 24px; display: grid; grid-template-columns: auto auto; column-gap: 10px; row-gap: 2px; font-size: 9.5pt; }
.ordre-cell-texte { white-space: nowrap; }
.ordre-cell-pointille { white-space: nowrap; color: #333; align-self: center; font-size: 9pt; }
.ordre-lettre { font-weight: bold; color: #333; }

.tt-phrase-print { flex: 1; font-size: 10pt; line-height: 1.5; }
.tt-phrase-print .tt-trou { display: inline-block; min-width: 80px; border-bottom: 0.8px solid #333; text-align: center; padding: 0 4px; }

.exo-texte-vf { font-size: 9.5pt; line-height: 1.35; flex: 1; }
.vf-ligne .vf-cases { font-size: 9pt; white-space: nowrap; margin-left: 4px; flex-shrink: 0; }

.relier-zone-lignes { position: relative; margin: 4px 0 4px 24px; max-width: 100%; }
.relier-lignes-grid { display: flex; justify-content: space-between; align-items: center; gap: 60px; }
.relier-col-lignes { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.relier-ligne-item { display: flex; align-items: center; gap: 4px; font-size: 9.5pt; padding: 1px 0; min-height: 14px; }
.relier-col-lignes.gauche .relier-ligne-item { justify-content: flex-end; text-align: right; }
.relier-col-lignes.droite .relier-ligne-item { justify-content: flex-start; text-align: left; }
.relier-point { width: 7px; height: 7px; border: 1px solid #333; border-radius: 50%; background: white; flex-shrink: 0; box-sizing: border-box; }
.relier-point.relier-point-partage { border-radius: 0; }

/* COPIER */
.bloc-copier { margin-top: 4px; width: 100%; }
.copier-mots { text-align: right; direction: rtl; font-family: 'Janna LT Bold', 'Traditional Arabic', 'Amiri', serif; font-size: 2.6em; line-height: 1.1; color: #1a1a1a; padding: 4px 0 0; word-spacing: 16px; position: relative; display: block; margin-bottom: 8px; }
.copier-mots .copier-mot { display: inline-block; white-space: nowrap; direction: rtl; }
.copier-mots::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0.30em; height: 1.2px; background: #000 !important; pointer-events: none; }
.copier-ligne-pointillee { width: 100%; height: 38px; border-bottom: 1px dotted #5a4a3a; margin-top: 4px; }

/* À RETENIR */
.zone-memo { margin-top:10px; padding: 7px 10px 8px; background: #f7f7f7; border: 0.5px solid #ccc; border-left: 3px solid #999; border-radius: 3px; break-inside: avoid; page-break-inside: avoid; }
.zone-memo .titre-memo { font-weight:600; font-size:8.5pt; text-transform:uppercase; letter-spacing:1px; color:#555; margin-bottom:4px; }
.zone-memo .titre-memo::before { content: "✦ "; color: #999; margin-right: 2px; }
.zone-memo .memo-bloc { margin-bottom:5px; }
.zone-memo .memo-bloc:last-child { margin-bottom:0; }
.zone-memo .memo-liste { list-style:none; padding:0; margin:0; }
.zone-memo .memo-liste li { font-size:9.5pt; margin-bottom:2px; padding-left:13px; position:relative; line-height: 1.35; }
.zone-memo .memo-liste li::before { content: "●"; position: absolute; left: 0; color: #999; font-size: 6pt; top: 4px; }

.pied-page { text-align: center; font-size: 8pt; color: #666; margin-top: 10px; padding-top: 5px; border-top: 0.5px solid #ddd; display: flex; justify-content: center; align-items: center; gap: 14px; }
.pied-page .pied-centre { font-style: italic; color: #555; }
.pied-page .pied-ecrit { font-style: italic; font-size: 7.5pt; color: #999; }
.pied-page .imprime-le { font-style: italic; font-size: 7.5pt; color: #999; }
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

<div class="note-haut">
  <div class="note-haut-gauche"><strong>Note :</strong> ......... / ${nbTotalQuestions}</div>
  <div class="note-haut-droite"><strong>Appréciation :</strong> <span class="ligne-pointillee"></span></div>
</div>

<div class="temps-lecture-haut">Temps de lecture estimé : ${tempsLecture} min</div>

<div class="bandeau-titre">
  <div class="ligne-titre">
    ${couvertureHtml}
    ${numeroHtml}
    <h1>${titreAffiche || 'Lecture'}</h1>
    <div class="meta-droite">${texte.categorie ? texte.categorie + ' — ' : ''}Niveau ${texte.niveau || 0}</div>
  </div>
</div>

${tagsClean.length > 0 ? '<div class="tags-haut">' + tagsClean.map(function(t) { return '<span class="memo-tag">#' + t + '</span>'; }).join('') + '</div>' : ''}

${vocabClean.length > 0 ? '<div class="vocab-haut"><span class="titre-memo">Vocabulaire</span>' + vocabClean.map(function(m) { return '<span class="memo-mot">' + m + '</span>'; }).join('') + '</div>' : ''}

<div class="texte-zone">
`;

  var exoNum = 0;
  var zoneExercicesOuverte = false;
  var texteZoneFermee = false;

  function ouvrirZoneExercices() {
    if (!texteZoneFermee) {
      printHtml += '</div>';
      printHtml += '<div class="corps-2col">';
      printHtml += '<div class="titre-questions">Exercices</div>';
      texteZoneFermee = true;
    }
    if (!zoneExercicesOuverte) {
      printHtml += '<div class="zone-exercices">';
      zoneExercicesOuverte = true;
    }
  }

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
    relier: { sing: 'Reliez les éléments :',      plur: 'Reliez les éléments :' },
    copier: { sing: 'Recopiez :',                 plur: 'Recopiez :' }
  };

  var iGroupe = 0;
  while (iGroupe < blocsOrdonnes.length) {
    var blocCourant = blocsOrdonnes[iGroupe];
    var typeCourant = typeLogique(blocCourant.type);
    if (typeCourant === 'paragraphe') { iGroupe++; continue; }

    var nbConsecutifs = 1;
    var jGroupe = iGroupe + 1;
    while (jGroupe < blocsOrdonnes.length && typeLogique(blocsOrdonnes[jGroupe].type) === typeCourant) {
      nbConsecutifs++;
      jGroupe++;
    }
    if (typeCourant === 'vf') nbConsecutifs = (nbConsecutifs - 1) + blocCourant.data.length;
    var base = consignesBase[typeCourant];
    if (base) {
      var consigneFinale = (nbConsecutifs > 1) ? base.plur : base.sing;
      blocCourant._consigne = consigneFinale;
      for (var kGroupe = iGroupe + 1; kGroupe < jGroupe; kGroupe++) blocsOrdonnes[kGroupe]._consigne = '';
    }
    iGroupe = jGroupe;
  }

  function afficherConsigne(bloc) {
    if (bloc._consigne) printHtml += '<div class="consigne-exo">' + bloc._consigne + '</div>';
  }

  blocsOrdonnes.forEach(function(bloc) {

    if (bloc.type === 'copier') {
      ouvrirZoneExercices();
      exoNum++;
      var mots = bloc.data.mots;
      printHtml += '<div class="exo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte">';
      printHtml += '<div class="bloc-copier">';
      printHtml += '<div class="copier-mots">';
      for (var cm = 0; cm < mots.length; cm++) printHtml += '<span class="copier-mot">' + mots[cm] + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="copier-ligne-pointillee"></div>';
      printHtml += '</div>';
      printHtml += '</span>';
      printHtml += '</div>';
      printHtml += '</div>';
      return;
    }

    if (bloc.type === 'paragraphe') {
      printHtml += '<div class="paragraphe">';
      var lignesPara = bloc.data.split('\n');
      var bufferTexte = '';

      function flushParagraphe() {
        if (!bufferTexte.trim()) { bufferTexte = ''; return; }
        var blocs = decouperEnBlocsTexte(bufferTexte);
        blocs.forEach(function(bloc) {
          printHtml += '<p>' + rendreSources(rendreCitations(bloc)) + '</p>';
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
    } else if (bloc.type === 'quiz') {
      ouvrirZoneExercices();
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
      exoNum++;
      printHtml += '<div class="exo">';
      afficherConsigne(bloc);
      printHtml += '<div class="exo-ligne">';
      printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
      printHtml += '<span class="exo-texte">' + bloc.data + '</span>';
      printHtml += '</div>';
      printHtml += '<div class="open-lignes">';
      for (var ol = 0; ol < 5; ol++) printHtml += '<div class="open-ligne"></div>';
      printHtml += '</div></div>';
    } else if (bloc.type === 'tt') {
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
      printHtml += '</span>';
      printHtml += '</div>';
      printHtml += '</div>';
    } else if (bloc.type === 'vf') {
      ouvrirZoneExercices();
      bloc.data.forEach(function(item, idxVf) {
        exoNum++;
        var questionTexte = (item && typeof item === 'object') ? (item.question || '') : item;
        printHtml += '<div class="exo">';
        if (idxVf === 0) afficherConsigne(bloc);
        printHtml += '<div class="exo-ligne vf-ligne">';
        printHtml += '<span class="exo-num-inline">' + exoNum + '</span>';
        printHtml += '<span class="exo-texte-vf">' + questionTexte + '</span>';
        printHtml += '<span class="vf-cases">☐ V   ☐ F</span>';
        printHtml += '</div>';
        printHtml += '</div>';
      });
    } else if (bloc.type === 'ordre') {
      ouvrirZoneExercices();
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
        printHtml += '<div class="ordre-cell-texte"><span class="ordre-lettre">' + lettres[i] + '.</span> ' + item + '</div>';
        printHtml += '<div class="ordre-cell-pointille">n° ..........</div>';
      });
      printHtml += '</div>';
      printHtml += '</div>';
    } else if (bloc.type === 'carte') {
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
    } else if (bloc.type === 'relier') {
      ouvrirZoneExercices();
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
        printHtml += '<div class="relier-ligne-item"><span>' + relierData.paires[rg].gauche + '</span><span class="relier-point"></span></div>';
      }
      printHtml += '</div>';
      printHtml += '<div class="relier-col-lignes droite">';
      for (var rd = 0; rd < relierData.droitesMelangees.length; rd++) {
        var dItem = relierData.droitesMelangees[rd];
        var classePoint = dItem.partagee ? 'relier-point relier-point-partage' : 'relier-point';
        printHtml += '<div class="relier-ligne-item"><span class="' + classePoint + '"></span><span>' + dItem.droite + '</span></div>';
      }
      printHtml += '</div>';
      printHtml += '</div>';
      printHtml += '</div>';
      printHtml += '</div>';
    }
  });

  if (zoneExercicesOuverte) printHtml += '</div>';
  if (texteZoneFermee) printHtml += '</div>';
  else printHtml += '</div>';

  if (aRetenirClean.length > 0) {
    printHtml += '<div class="zone-memo">';
    printHtml += '<div class="memo-bloc">';
    printHtml += '<div class="titre-memo">À retenir</div>';
    printHtml += '<ul class="memo-liste">';
    aRetenirClean.forEach(function(phrase) { printHtml += '<li>' + phrase + '</li>'; });
    printHtml += '</ul></div>';
    printHtml += '</div>';
  }

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
    var walker = iframeDoc2.createTreeWalker(iframeDoc2.body, NodeFilter.SHOW_TEXT, null, false);
    var noeuds = [];
    var n;
    while ((n = walker.nextNode())) {
      if (/[\u0600-\u06FF]/.test(n.nodeValue || '')) noeuds.push(n);
    }
    noeuds.forEach(function(texteNode) {
      var parent = texteNode.parentNode;
      if (!parent) return;
      if (parent.classList && parent.classList.contains('arabe')) return;
      if (parent.classList && parent.classList.contains('copier-mot')) return;
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
