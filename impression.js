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

// ============================================================
// IMPRESSION D'UN CONTENU ALTERNATIF (sans texteId en base)
// Réutilise la même mise en page que imprimerTexte.
// ============================================================
function imprimerContenuAlternatif(texteOriginal, contenuAlternatif, suffixe) {
  if (!texteOriginal) { alert('Texte original introuvable.'); return; }
  if (!contenuAlternatif) { alert('Contenu alternatif vide.'); return; }

  var couvertureTheme = recupererCouvertureTheme(texteOriginal.categorie);

  var texteCopie = Object.assign({}, texteOriginal);
  texteCopie.contenu = contenuAlternatif;
  if (suffixe) {
    texteCopie.titre = (texteOriginal.titre || '') + ' (' + suffixe + ')';
  }

  chargerImagesTheme(texteOriginal.categorie).then(function(images) {
    genererImpression(texteCopie, contenuAlternatif, images || {}, couvertureTheme);
  }).catch(function() {
    genererImpression(texteCopie, contenuAlternatif, {}, couvertureTheme);
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

function appliquerGrasItalique(texte) {
  if (!texte || texte.indexOf('*') === -1) return texte;
  texte = texte.replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  texte = texte.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  texte = texte.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  return texte;
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

      if ((type === 'paragraphe' || type === 'slide' || type === 'texte') && paragraphesArray[idx] !== undefined) {
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
@page { margin: 1.6cm 1.7cm 1.6cm 1.7cm; size: A4; }
body {
  font-family: 'Georgia', 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', serif;
  background:#faf7f0; color:#2a241c; font-size:11.5pt; line-height:1.5;
}

.arabe, [lang="ar"] {
  font-family: 'Janna LT Bold', 'Traditional Arabic', 'Amiri', serif !important;
  font-size: 1.7em; line-height: 1; vertical-align: middle;
}

.page { max-width:100%; padding: 0; background:#faf7f0; overflow: visible; }

/* ---- En-tête élève ---- */
.entete-eleve { margin-bottom: 4px; padding: 4px 0 2px; font-size: 9.5pt; color:#4a3f31; }
.entete-eleve .ligne-eleve { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.entete-eleve span { white-space: nowrap; }
.entete-eleve strong { font-weight: 600; color:#3a2e22; letter-spacing:0.2px; }

.note-haut { display: flex; justify-content: space-between; align-items: baseline; gap: 30px; padding: 2px 0 6px; font-size: 10pt; }
.note-haut strong { font-weight: 600; color:#3a2e22; }
.note-haut .note-haut-droite { flex: 1; display: flex; align-items: baseline; gap: 4px; }
.note-haut .note-haut-droite .ligne-pointillee { display:inline-block; flex:1; border-bottom:0.6px dotted #b0a48f; height:12px; }

.filet { border: none; border-top: 1.6px solid #2a241c; border-bottom: 0.6px solid #b0a48f; height: 4px; margin: 10px 0 14px; }

.temps-lecture-haut { text-align:center; font-size:9pt; color:#8a7d68; font-style:italic; margin-bottom:10px; letter-spacing:0.5px; font-family:'Georgia',serif; }
.temps-lecture-haut::before { content:"❧ "; font-style:normal; color:#a89a80; margin-right:4px; }

.bandeau-titre { text-align:center; padding: 6px 0 4px; margin-bottom: 6px; }
.bandeau-titre .ligne-titre { display:flex; flex-direction:column; align-items:center; gap:6px; }
.bandeau-titre h1 {
  font-family:'Georgia','Playfair Display',serif; font-size:20pt; font-weight:700;
  color:#1f1a13; letter-spacing:1.5px; text-transform:uppercase; line-height:1.15;
  margin:0; text-align:center;
}
.bandeau-titre .meta-droite {
  font-family:'Georgia',serif; font-style:italic; font-size:10pt; color:#8a7d68;
  letter-spacing:0.5px; margin-top:2px;
}
.sous-titre-filets { display:flex; align-items:center; justify-content:center; gap:10px; margin:6px auto 2px; width:60%; }
.sous-titre-filets::before, .sous-titre-filets::after { content:""; flex:1; border-top:0.7px solid #b0a48f; }

.couverture-mini { display:block; width:44px; height:60px; object-fit:cover; border-radius:1px;
  border:0.5px solid #b0a48f; box-shadow:0 1px 3px rgba(60,45,25,0.15); }

.numero-texte { display:inline-block; background:#2a241c; color:#faf7f0; font-family:'Georgia',serif;
  font-size:12pt; font-weight:bold; line-height:1; padding:4px 11px; border-radius:1px;
  letter-spacing:1px; white-space:nowrap; }

.tags-haut { margin-top:6px; margin-bottom:4px; text-align:center; }
.tags-haut .memo-tag { display:inline-block; padding:2px 10px; margin:2px 3px;
  background:transparent; border:0.5px solid #c9bda3; border-radius:12px;
  font-size:9pt; color:#7a6d55; font-style:italic; }

.vocab-haut { margin:6px auto 10px; text-align:center; width:90%; padding:6px 0;
  border-top:0.6px dotted #c9bda3; border-bottom:0.6px dotted #c9bda3; }
.vocab-haut .titre-memo { display:inline; font-weight:600; font-size:8.5pt; text-transform:uppercase;
  letter-spacing:1.5px; color:#8a7d68; margin-right:8px; }
.vocab-haut .memo-mot { display:inline-block; padding:1px 10px; margin:2px 3px;
  background:transparent; font-size:9.5pt; color:#3a2e22; font-style:italic; line-height:1.4; }
.vocab-haut .memo-mot::after { content:","; }
.vocab-haut .memo-mot:last-child::after { content:""; }

.corps-contenu { padding: 0; }

.texte-zone { margin-top: 6px; margin-bottom: 10px; }
.paragraphe { margin-bottom: 10px; break-inside: auto; page-break-inside: auto; }
.paragraphe p {
  font-size: 12.8pt; margin-bottom: 6px; text-align: justify;
  text-indent: 1.4em; line-height: 1.6; hyphens: auto;
}
.paragraphe p:last-child { margin-bottom: 0; }

.paragraphe.lettrine p:first-child::first-letter {
  font-family:'Georgia',serif; font-size:3.1em; float:left; line-height:0.82;
  padding:4px 8px 0 0; color:#2a241c; font-weight:700;
}

.paragraphe p .source-marge, .texte-zone p .source-marge {
  float:right; display:inline-block; margin:6px 0 6px 16px; padding:4px 0 0 0;
  font-family:'Georgia',serif; font-size:11pt; font-weight:700; font-style:italic;
  color:#6a5d47; text-align:right; max-width:23%; line-height:1.25;
  text-indent:0; white-space:normal; vertical-align:top;
  border-top:0.5px solid #c9bda3; padding-top:4px;
}
.paragraphe p em, .texte-zone p em { font-style:italic; white-space:pre-line; }
.paragraphe::after { content:""; display:table; clear:both; }

.paragraphe p em, .texte-zone p em { color:#3a2e22; }

.print-img { display:block; height:auto; border:none; margin:12px 0; page-break-inside:avoid; break-inside:avoid;
  border-radius:1px; box-shadow:0 1px 4px rgba(60,45,25,0.12); }
.print-img-centre { margin-left:auto; margin-right:auto; }
.print-img-gauche { float:left; margin:6px 16px 10px 0; }
.print-img-droite { float:right; margin:6px 0 10px 16px; }
.print-img-petit  { max-width:110px; }
.print-img-moyen  { max-width:180px; }
.print-img-grand  { max-width:230px; }
.img-manquante { display:block; padding:8px; border:1px dashed #c9bda3; color:#8a7d68;
  font-size:9pt; text-align:center; margin:8px 0; font-style:italic; }

.zone-exercices { margin-top: 22px; }
.zone-exercices .titre-questions {
  font-family:'Georgia',serif; font-size:13pt; font-weight:700; color:#2a241c;
  letter-spacing:2px; text-transform:uppercase; text-align:center;
  margin: 0 0 4px; padding: 0;
}
.zone-exercices .titre-questions-filets { display:flex; align-items:center; justify-content:center;
  gap:12px; width:55%; margin:0 auto 18px; }
.zone-exercices .titre-questions-filets::before,
.zone-exercices .titre-questions-filets::after { content:""; flex:1; border-top:1.2px solid #2a241c; }

.exo { margin-bottom:14px; padding-bottom:10px; border-bottom:0.5px dotted #d6cbb4;
  break-inside:avoid; page-break-inside:avoid; }
.exo:last-child { border-bottom:none; margin-bottom:0; padding-bottom:0; }

.consigne-exo { font-size:8.8pt; font-weight:700; color:#6a5d47; text-transform:uppercase;
  letter-spacing:1.2px; margin-bottom:5px; margin-top:0; padding:0;
  page-break-after:avoid; break-after:avoid; font-family:'Georgia',serif; }
.consigne-exo::before { content:"❧  "; color:#a89a80; font-size:8pt; margin-right:2px; }

.exo-ligne { display:flex; align-items:baseline; gap:8px; margin-top:3px; }

.exo-num-inline {
  display:inline-flex; align-items:center; justify-content:center;
  width:17px; height:17px;
  background:transparent; color:#2a241c;
  border:0.9px solid #2a241c; border-radius:50%;
  font-weight:700; font-size:8.5pt; flex-shrink:0;
  font-family:'Georgia',serif;
  line-height:1;
  padding-bottom:1.2px;
  transform: translateY(-0.5px);
}
.exo-texte { flex:1; font-size:10.5pt; line-height:1.5; }

.quiz-reponses { margin-left:26px; margin-top:4px; }
.quiz-rep { display:block; margin-bottom:2px; font-size:10.5pt; }
.quiz-case { display:inline-block; width:10px; height:10px; border:0.9px solid #4a3f31;
  margin-right:6px; vertical-align:middle; background:#faf7f0; border-radius:1px; }

.open-lignes { margin-top:4px; margin-left:26px; }
.open-ligne { border-bottom:0.5px dotted #b0a48f; height:24px; margin-bottom:16px; }

.carte-ligne-courte { margin-top:4px; margin-left:26px; width:50%; border-bottom:0.5px dotted #b0a48f; height:16px; }

.ordre-grille { margin:4px 0 4px 26px; display:grid; grid-template-columns:auto auto;
  column-gap:12px; row-gap:3px; font-size:10.5pt; }
.ordre-cell-texte { white-space:nowrap; }
.ordre-cell-pointille { white-space:nowrap; color:#6a5d47; align-self:center; font-size:9.5pt; font-style:italic; }
.ordre-lettre { font-weight:700; color:#2a241c; }

.tt-phrase-print { flex:1; font-size:10.8pt; line-height:1.6; }
.tt-phrase-print .tt-trou { display:inline-block; min-width:90px; border-bottom:0.9px solid #4a3f31;
  text-align:center; padding:0 6px; }

.exo-texte-vf { font-size:10.5pt; line-height:1.5; flex:1; }
.vf-ligne .vf-cases { font-size:9.5pt; white-space:nowrap; margin-left:6px; flex-shrink:0; color:#4a3f31; }

.relier-zone-lignes { position:relative; margin:6px 0 6px 26px; max-width:100%; }
.relier-lignes-grid { display:flex; justify-content:space-between; align-items:center; gap:60px; }
.relier-col-lignes { flex:1; display:flex; flex-direction:column; gap:5px; }
.relier-ligne-item { display:flex; align-items:center; gap:6px; font-size:10.5pt; padding:1px 0; min-height:16px; }
.relier-col-lignes.gauche .relier-ligne-item { justify-content:flex-end; text-align:right; }
.relier-col-lignes.droite .relier-ligne-item { justify-content:flex-start; text-align:left; }
.relier-point { width:8px; height:8px; border:1px solid #4a3f31; border-radius:50%;
  background:#faf7f0; flex-shrink:0; box-sizing:border-box; }
.relier-point.relier-point-partage { border-radius:0; }

/* ---- Recopier : texte arabe à droite, grosse flèche à sa suite ---- */
.bloc-copier-inline { width:100%; margin-top:4px; }

.copier-ligne-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  direction: ltr;
}

/* Ligne pointillée à gauche */
.copier-ligne-pointillee {
  flex: 1 1 auto;
  display: block;
  height: 20px;
  min-width: 120px;
  border-bottom: 0.8px dotted #8a7d68;
  order: 0;
}

/* Texte arabe */
.copier-texte-arabe {
  font-family: 'Janna LT Bold', 'Traditional Arabic', 'Amiri', serif;
  font-size: 2.6em;
  line-height: 1.05;
  color: #1f1a13;
  direction: rtl;
  white-space: nowrap;
  flex: 0 0 auto;
  order: 1;
}

.copier-texte-arabe .copier-mot {
  display: inline-block;
  white-space: nowrap;
  direction: rtl;
}

/* Grosse flèche en contour, juste après le texte arabe, centrée verticalement */
.copier-fleche-apres {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  order: 2;
}

.copier-fleche-apres svg {
  display: block;
  width: 90px;
  height: 44px;
  overflow: visible;
}

.zone-memo { margin: 20px 0 10px; padding: 12px 16px 12px; background:#f4efe3;
  border-top:0.6px solid #c9bda3; border-bottom:0.6px solid #c9bda3;
  break-inside:avoid; page-break-inside:avoid; }
.zone-memo .titre-memo { font-weight:700; font-size:9pt; text-transform:uppercase;
  letter-spacing:2px; color:#6a5d47; margin-bottom:8px; text-align:center; font-family:'Georgia',serif; }
.zone-memo .titre-memo::before { content:"✦  "; color:#a89a80; margin-right:2px; }
.zone-memo .titre-memo::after { content:"  ✦"; color:#a89a80; margin-left:2px; }
.zone-memo .memo-bloc { margin-bottom:0; }
.zone-memo .memo-liste { list-style:none; padding:0; margin:0; }
.zone-memo .memo-liste li { font-size:10.5pt; margin-bottom:4px; padding-left:16px;
  position:relative; line-height:1.55; }
.zone-memo .memo-liste li::before { content:"❧"; position:absolute; left:0;
  color:#a89a80; font-size:8pt; top:3px; }

.pied-page { text-align:center; font-size:8pt; color:#8a7d68; margin: 18px 0 6px;
  padding-top:8px; border-top:0.6px solid #d6cbb4;
  display:flex; justify-content:center; align-items:center; gap:16px; }
.pied-page .pied-centre { font-style:italic; color:#6a5d47; letter-spacing:0.5px; }
.pied-page .pied-ecrit, .pied-page .imprime-le { font-style:italic; font-size:7.5pt; color:#a89a80; }
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

<hr class="filet">

<div class="temps-lecture-haut">Temps de lecture estimé : ${tempsLecture} min</div>

<div class="bandeau-titre">
  <div class="ligne-titre">
    ${couvertureHtml}
    ${numeroHtml}
    <h1>${titreAffiche || 'Lecture'}</h1>
    <div class="sous-titre-filets"></div>
    <div class="meta-droite">${texte.categorie ? texte.categorie + ' — ' : ''}Niveau ${texte.niveau || 0}</div>
  </div>
</div>

${tagsClean.length > 0 ? '<div class="tags-haut">' + tagsClean.map(function(t) { return '<span class="memo-tag">#' + t + '</span>'; }).join('') + '</div>' : ''}

${vocabClean.length > 0 ? '<div class="vocab-haut"><span class="titre-memo">Vocabulaire</span>' + vocabClean.map(function(m) { return '<span class="memo-mot">' + m + '</span>'; }).join('') + '</div>' : ''}

<div class="corps-contenu">
  <div class="texte-zone">
`;

  var exoNum = 0;
  var zoneExercicesOuverte = false;
  var premierParagraphe = true;

  function ouvrirZoneExercices() {
    if (!zoneExercicesOuverte) {
      printHtml += '</div>';
      printHtml += '<div class="zone-exercices">';
      printHtml += '<div class="titre-questions">Exercices</div>';
      printHtml += '<div class="titre-questions-filets"></div>';
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
      printHtml += '<span class="exo-texte" style="flex:1;">';
      printHtml += '<div class="bloc-copier-inline">';
      printHtml += '  <div class="copier-ligne-inline">';
      printHtml += '    <span class="copier-ligne-pointillee"></span>';
      printHtml += '    <span class="copier-texte-arabe">';
      for (var cm = 0; cm < mots.length; cm++) {
        printHtml += '<span class="copier-mot">' + mots[cm] + '</span>' + (cm < mots.length - 1 ? ' ' : '');
      }
      printHtml += '    </span>';
      printHtml += '    <span class="copier-fleche-apres">';
      printHtml += '      <svg viewBox="0 0 90 44" xmlns="http://www.w3.org/2000/svg">';
      printHtml += '        <path d="M 4 22 L 82 22 M 64 6 L 82 22 L 64 38" fill="none" stroke="#2a241c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
      printHtml += '      </svg>';
      printHtml += '    </span>';
      printHtml += '  </div>';
      printHtml += '</div>';
      printHtml += '</span>';
      printHtml += '</div>';
      printHtml += '</div>';
      return;
    }

    if (bloc.type === 'paragraphe') {
      printHtml += '<div class="paragraphe' + (premierParagraphe ? ' lettrine' : '') + '">';
      premierParagraphe = false;
      var lignesPara = bloc.data.split('\n');
      var bufferTexte = '';

      function flushParagraphe() {
        if (!bufferTexte.trim()) { bufferTexte = ''; return; }
        var blocs = decouperEnBlocsTexte(bufferTexte);
        blocs.forEach(function(bloc) {
          printHtml += '<p>' + appliquerGrasItalique(rendreSources(rendreCitations(bloc))) + '</p>';
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

  if (zoneExercicesOuverte) {
    printHtml += '</div>';
  } else {
    printHtml += '</div>';
  }
  printHtml += '</div>';

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
