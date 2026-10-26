// ============================================================
// CONFIGURATION CENTRALISÉE
// ============================================================

var CONFIG = {
  // L'URL de ton script Google Apps (À METTRE À JOUR APRÈS DÉPLOIEMENT)
  SCRIPT_URL: '// ============================================================
// CODE GOOGLE APPS SCRIPT - VERSION COMPLÈTE
// + Support images (img:nom:position:taille)
// + Support Thèmes (colonne A de la feuille Thèmes)
// + Support Couverture (colonne K de la feuille Thèmes)
// + MODE INVITÉ : les non-connectés peuvent passer les quiz
// + Feuille "Tentatives" : une ligne par tentative complète
// + Action "saveTentative" : enregistre tout en une requête
// + Action "getTentativeUtilisateur" : meilleure tentative d'un utilisateur
// + Action "getTentativesUtilisateur" : toutes les tentatives (page "Mes essais")
// + Feuille "Annotations" : notes libres par (nom, texteId)
// + Actions "saveAnnotation" / "getAnnotation" / "getAnnotationsUtilisateur"
// + Feuille "Favoris" : thèmes favoris par utilisateur
// + Actions "saveFavori" / "getFavorisUtilisateur" / "getFavoriUtilisateur"
// ============================================================

// === CONSTANTES GLOBALES ===
var ID_DOSSIER_DRIVE  = '192WN3SpluqWWQukovRgBd4IPEKKasAve';
var ID_FEUILLE_SHEETS = '1nC91nsGBRAxpHSuFnWT8OYTgsOAmewwkHOF9RSHUsdU';

// ============================================================
// doGet — POINT D'ENTRÉE HTTP
// ============================================================
function doGet(e) {
  var action = e.parameter.action;

  // ============================================================
  // DEMANDE D'INSCRIPTION
  // ============================================================
  if (action === 'registerDemande') {
    var nom = e.parameter.nom;
    var contact = e.parameter.contact;
    var disciplines = e.parameter.disciplines || '';
    var niveau = e.parameter.niveau || '';
    var message = e.parameter.message || '';

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inscrits');
    if (!sheet) {
      return reponse(false, 'Feuille "Inscrits" introuvable');
    }

    var data = sheet.getDataRange().getValues();
    var nomNormalise = normaliserChaine(nom);

    for (var i = 1; i < data.length; i++) {
      var existant = data[i][0] || '';
      if (normaliserChaine(existant) === nomNormalise) {
        return reponse(false, 'Cet identifiant existe déjà');
      }
    }

    sheet.appendRow([
      nom, '', niveau, contact, new Date(), message, disciplines
    ]);

    return reponse(true, 'Demande envoyée avec succès');
  }

  // ============================================================
  // CONNEXION
  // ============================================================
  if (action === 'login') {
    var id = e.parameter.id;
    var mdp = e.parameter.mdp;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inscrits');

    if (!sheet) {
      return reponse(false, 'Feuille "Inscrits" introuvable');
    }

    var data = sheet.getDataRange().getValues();
    var idNormalise = normaliserChaine(id);
    var mdpNormalise = normaliserChaine(mdp);

    for (var i = 1; i < data.length; i++) {
      var idExistant = data[i][0] || '';
      var mdpExistant = data[i][1] || '';

      if (normaliserChaine(idExistant) === idNormalise &&
          normaliserChaine(mdpExistant) === mdpNormalise) {
        var niveau = data[i][2] || 0;
        return reponse(true, 'Connexion réussie', { id: data[i][0], niveau: niveau });
      }
    }
    return reponse(false, 'Identifiant ou mot de passe incorrect');
  }

  // ============================================================
  // getNiveau
  // ============================================================
  if (action === 'getNiveau') {
    var id = e.parameter.id;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inscrits');

    if (!sheet) return reponse(false, 'Feuille "Inscrits" introuvable');

    var data = sheet.getDataRange().getValues();
    var idNormalise = normaliserChaine(id);

    for (var i = 1; i < data.length; i++) {
      var existant = data[i][0] || '';
      if (normaliserChaine(existant) === idNormalise) {
        var niveau = data[i][2] || 0;
        return reponse(true, '', { niveau: niveau });
      }
    }
    return reponse(false, 'Utilisateur introuvable');
  }

  // ============================================================
  // getTextes (par niveau)
  // ============================================================
  if (action === 'getTextes') {
    var niveau = parseInt(e.parameter.niveau) || 0;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Textes');

    if (!sheet) return reponse(false, 'Feuille "Textes" introuvable');

    var data = sheet.getDataRange().getValues();
    var textes = [];

    for (var i = 1; i < data.length; i++) {
      var id = data[i][0] || '';
      var date = data[i][1] || '';
      var categorie = data[i][2] || '';
      var niveauTexte = parseInt(data[i][3]) || 0;
      var titre = data[i][4] || '';
      var statut = data[i][5] || 'publie';

      if (niveauTexte <= niveau && titre) {
        var tagsBrut = data[i][15] || '';
        var tags = tagsBrut
          ? tagsBrut.split(',').map(function(x) { return x.trim(); }).filter(function(x) { return x !== ''; })
          : [];

        textes.push({
          id: id, titre: titre, date: date,
          categorie: categorie, niveau: niveauTexte, statut: statut,
          tags: tags
        });
      }
    }

    textes.sort(function(a, b) {
      if (a.date && b.date) return new Date(b.date) - new Date(a.date);
      return 0;
    });

    return reponse(true, '', { textes: textes });
  }

  // ============================================================
  // getTextesTous
  // ============================================================
  if (action === 'getTextesTous') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Textes');
    if (!sheet) return reponse(false, 'Feuille "Textes" introuvable');

    var data = sheet.getDataRange().getValues();
    var textes = [];

    for (var i = 1; i < data.length; i++) {
      var id = data[i][0] || '';
      var date = data[i][1] || '';
      var categorie = data[i][2] || '';
      var niveauTexte = parseInt(data[i][3]) || 0;
      var titre = data[i][4] || '';
      var statut = data[i][5] || 'publie';

      if (titre && statut !== 'brouillon') {
        var tagsBrut = data[i][15] || '';
        var tags = tagsBrut
          ? tagsBrut.split(',').map(function(x) { return x.trim(); }).filter(function(x) { return x !== ''; })
          : [];

        textes.push({
          id: id, titre: titre, date: date,
          categorie: categorie, niveau: niveauTexte, statut: statut,
          tags: tags
        });
      }
    }

    textes.sort(function(a, b) {
      if (a.date && b.date) return new Date(b.date) - new Date(a.date);
      return 0;
    });

    return reponse(true, '', { textes: textes });
  }

  // ============================================================
  // getTexte (un seul, avec contenu)
  // ============================================================
  if (action === 'getTexte') {
    var texteId = e.parameter.id;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Textes');

    if (!sheet) return reponse(false, 'Feuille "Textes" introuvable');

    var data = sheet.getDataRange().getValues();
    var texte = null;

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == texteId) {

        var contenuComplet = '';
        var colonnesContenu = [8, 9, 10, 11, 12, 13, 17, 18, 20];
        for (var ci = 0; ci < colonnesContenu.length; ci++) {
          var col = colonnesContenu[ci];
          var val = data[i][col] || '';
          if (val.trim() !== '') {
            if (contenuComplet) contenuComplet += ' | ';
            contenuComplet += val.trim();
          }
        }

        var vocabulaireBrut = data[i][14] || '';
        var tagsBrut = data[i][15] || '';
        var aRetenirBrut = data[i][16] || '';

        var vocabulaire = vocabulaireBrut
          ? vocabulaireBrut.split('\n').map(function(x) { return x.trim(); }).filter(function(x) { return x !== ''; })
          : [];
        var tags = tagsBrut
          ? tagsBrut.split(',').map(function(x) { return x.trim(); }).filter(function(x) { return x !== ''; })
          : [];
        var aRetenir = aRetenirBrut
          ? aRetenirBrut.split('\n').map(function(x) { return x.trim(); }).filter(function(x) { return x !== ''; })
          : [];

        var ordreBlocsBrut = data[i][19] || '';
        var ordreBlocs = ordreBlocsBrut
          ? ordreBlocsBrut.split(',').map(function(x) { return x.trim(); }).filter(function(x) { return x !== ''; })
          : [];

        texte = {
          id: data[i][0] || '',
          date: data[i][1] || '',
          categorie: data[i][2] || '',
          niveau: data[i][3] || 0,
          titre: data[i][4] || '',
          statut: data[i][5] || 'publie',
          versions: parseInt(data[i][6]) || 1,
          dateModif: data[i][7] || data[i][1] || '',
          contenu: contenuComplet,
          vocabulaire: vocabulaire,
          tags: tags,
          aRetenir: aRetenir,
          ordreBlocs: ordreBlocs,
          copier: data[i][20] || ''
        };
        break;
      }
    }

    if (texte) return reponse(true, '', { texte: texte });
    else return reponse(false, 'Texte introuvable');
  }

  // ============================================================
  // getNiveauEtDescription
  // ============================================================
  if (action === 'getNiveauEtDescription') {
    var nom = e.parameter.nom;

    var userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inscrits');
    if (!userSheet) return reponse(false, 'Feuille "Inscrits" introuvable');

    var userData = userSheet.getDataRange().getValues();
    var niveau = 0;
    var nomNormalise = normaliserChaine(nom);

    for (var i = 1; i < userData.length; i++) {
      if (normaliserChaine(userData[i][0]) === nomNormalise) {
        niveau = parseInt(userData[i][2]) || 0; break;
      }
    }

    var descSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Niveaux');
    var description = '';
    if (descSheet) {
      var descData = descSheet.getDataRange().getValues();
      for (var j = 1; j < descData.length; j++) {
        if (parseInt(descData[j][0]) === niveau) {
          description = descData[j][1] || ''; break;
        }
      }
    }

    return reponse(true, '', { niveau: niveau, description: description });
  }

  // ============================================================
  // getDashboard
  // ============================================================
  if (action === 'getDashboard') {
    var nom = e.parameter.nom;
    var userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inscrits');
    var niveau = 0;
    var userData = userSheet.getDataRange().getValues();
    var nomNormalise = normaliserChaine(nom);

    for (var i = 1; i < userData.length; i++) {
      if (normaliserChaine(userData[i][0]) === nomNormalise) {
        niveau = parseInt(userData[i][2]) || 0; break;
      }
    }

    var texteSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Textes');
    var textes = [];
    if (texteSheet) {
      var texteData = texteSheet.getDataRange().getValues();
      for (var j = 1; j < texteData.length; j++) {
        var niveauTexte = parseInt(texteData[j][3]) || 0;
        if (niveauTexte <= niveau && texteData[j][4]) {
          textes.push({
            id: texteData[j][0] || '',
            titre: texteData[j][4] || '',
            date: texteData[j][1] || '',
            categorie: texteData[j][2] || '',
            niveau: niveauTexte,
            statut: texteData[j][5] || 'publie'
          });
        }
      }
    }

    textes.sort(function(a, b) {
      if (a.date && b.date) return new Date(b.date) - new Date(a.date);
      return 0;
    });

    return reponse(true, '', {
      niveau: niveau, textes: textes
    });
  }

  // ============================================================
  // getComplet (infos utilisateur)
  // ============================================================
  if (action === 'getComplet') {
    var nom = e.parameter.nom;
    var nomNormalise = normaliserChaine(nom);

    var userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inscrits');
    var userData = userSheet.getDataRange().getValues();
    var userInfo = null;

    for (var i = 1; i < userData.length; i++) {
      if (normaliserChaine(userData[i][0]) === nomNormalise) {
        userInfo = {
          mdp: userData[i][1] || '',
          niveau: parseInt(userData[i][2]) || 0,
          contact: userData[i][3] || '',
          dateInscription: userData[i][4] || '',
          messagePerso: userData[i][5] || '',
          disciplines: userData[i][6] || ''
        };
        break;
      }
    }

    if (!userInfo) return reponse(false, 'Utilisateur introuvable');

    var descSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Niveaux');
    var description = '';
    if (descSheet) {
      var descData = descSheet.getDataRange().getValues();
      for (var j = 1; j < descData.length; j++) {
        if (parseInt(descData[j][0]) === userInfo.niveau) {
          description = descData[j][1] || ''; break;
        }
      }
    }

    return reponse(true, '', {
      mdp: userInfo.mdp,
      niveau: userInfo.niveau,
      contact: userInfo.contact,
      dateInscription: userInfo.dateInscription,
      messagePerso: userInfo.messagePerso,
      disciplines: userInfo.disciplines,
      description: description
    });
  }

  // ============================================================
  // getTout (TOUT EN UNE FOIS)
  // ============================================================
  if (action === 'getTout') {
    var nom = e.parameter.nom;
    var nomNormalise = normaliserChaine(nom);

    var userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inscrits');
    if (!userSheet) return reponse(false, 'Feuille "Inscrits" introuvable');

    var userData = userSheet.getDataRange().getValues();
    var userInfo = null;
    var niveau = 0;

    for (var i = 1; i < userData.length; i++) {
      if (normaliserChaine(userData[i][0]) === nomNormalise) {
        niveau = parseInt(userData[i][2]) || 0;
        userInfo = {
          mdp: userData[i][1] || '',
          niveau: niveau,
          contact: userData[i][3] || '',
          dateInscription: userData[i][4] || '',
          messagePerso: userData[i][5] || '',
          disciplines: userData[i][6] || ''
        };
        break;
      }
    }

    if (!userInfo) return reponse(false, 'Utilisateur introuvable');

    var descSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Niveaux');
    var description = '';
    if (descSheet) {
      var descData = descSheet.getDataRange().getValues();
      for (var j = 1; j < descData.length; j++) {
        if (parseInt(descData[j][0]) === niveau) {
          description = descData[j][1] || ''; break;
        }
      }
    }

    // === TEXTES ===
    var texteSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Textes');
    var tousLesTextes = [];
    var textesParNiveau = [];
    var textesComplets = {};

    if (texteSheet) {
      var texteData = texteSheet.getDataRange().getValues();

      for (var j = 1; j < texteData.length; j++) {
        var niveauTexte = parseInt(texteData[j][3]) || 0;
        var titre = texteData[j][4] || '';
        var statut = texteData[j][5] || 'publie';

        if (titre && statut !== 'brouillon') {
          var texteId = texteData[j][0] || '';
          var versions = parseInt(texteData[j][6]) || 1;
          var dateModif = texteData[j][7] || texteData[j][1] || '';

          var contenuComplet = '';
          var colonnesContenu = [8, 9, 10, 11, 12, 13, 17, 18, 20];
          for (var ci = 0; ci < colonnesContenu.length; ci++) {
            var col = colonnesContenu[ci];
            var val = texteData[j][col] || '';
            if (val.trim() !== '') {
              if (contenuComplet) contenuComplet += ' | ';
              contenuComplet += val.trim();
            }
          }

          var quiz = texteData[j][9] || '';
          var question = texteData[j][10] || '';

          var mots = 0;
          if (contenuComplet) {
            mots = contenuComplet.split(/\s+/).filter(function(w) { return w.length > 0; }).length;
          }

          var vocabulaireBrut = texteData[j][14] || '';
          var tagsBrut = texteData[j][15] || '';
          var aRetenirBrut = texteData[j][16] || '';

          var vocabulaire = vocabulaireBrut
            ? vocabulaireBrut.split('\n').map(function(x) { return x.trim(); }).filter(function(x) { return x !== ''; })
            : [];
          var tags = tagsBrut
            ? tagsBrut.split(',').map(function(x) { return x.trim(); }).filter(function(x) { return x !== ''; })
            : [];
          var aRetenir = aRetenirBrut
            ? aRetenirBrut.split('\n').map(function(x) { return x.trim(); }).filter(function(x) { return x !== ''; })
            : [];

          var ordreBlocsBrut = texteData[j][19] || '';
          var ordreBlocs = ordreBlocsBrut
            ? ordreBlocsBrut.split(',').map(function(x) { return x.trim(); }).filter(function(x) { return x !== ''; })
            : [];

          var texteObj = {
            id: texteId,
            titre: titre,
            date: texteData[j][1] || '',
            categorie: texteData[j][2] || '',
            niveau: niveauTexte,
            hasQuiz: (quiz && quiz.trim() !== ''),
            hasQuestion: (question && question.trim() !== ''),
            mots: mots,
            nbQuiz: (quiz && quiz.trim() !== '') ? 1 : 0,
            nbQuestion: (question && question.trim() !== '') ? 1 : 0,
            statut: statut,
            contenu: contenuComplet,
            question_ouverte: question,
            ordre: parseInt(texteData[j][11]) || 0,
            versions: versions,
            dateModif: dateModif,
            vocabulaire: vocabulaire,
            tags: tags,
            aRetenir: aRetenir,
            ordreBlocs: ordreBlocs,
            copier: texteData[j][20] || ''
          };

          tousLesTextes.push(texteObj);
          if (niveauTexte <= niveau) textesParNiveau.push(texteObj);

          textesComplets[texteId] = texteObj;
        }
      }
    }

    // === THÈMES (avec Infos JSON) ===
    var themeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Thèmes');
    var themes = [];
    if (themeSheet) {
      var themeData = themeSheet.getDataRange().getValues();
      for (var l = 1; l < themeData.length; l++) {
        var theme = themeData[l][0] || '';
        var titreTheme = themeData[l][1] || '';
        if (titreTheme) {
          var infosJson = themeData[l][11] || '{}';
          var infos = {};
          try { infos = JSON.parse(infosJson) || {}; } catch(ex) { infos = {}; }

          themes.push({
            theme: theme,
            titre: titreTheme,
            niveau: parseInt(themeData[l][2]) || 0,
            description: themeData[l][3] || '',
            nbChapitres: parseInt(themeData[l][4]) || 0,
            couleur: themeData[l][5] || '#2d6a4f',
            sousTitre: themeData[l][6] || '',
            date: themeData[l][7] || '',
            preRequis: themeData[l][8] || '',
            auteur: themeData[l][9] || '',
            couverture: themeData[l][10] || '',
            infos: infos
          });
        }
      }
    }

    return reponse(true, '', {
      mdp: userInfo.mdp,
      niveau: niveau,
      contact: userInfo.contact,
      dateInscription: userInfo.dateInscription,
      messagePerso: userInfo.messagePerso,
      disciplines: userInfo.disciplines,
      description: description,
      textes: textesParNiveau,
      tousLesTextes: tousLesTextes,
      textesComplets: textesComplets,
      reponses: [],
      historique: [],
      themes: themes
    });
  }

  // ============================================================
  // getThemes
  // ============================================================
  if (action === 'getThemes') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Thèmes');
    if (!sheet) return reponse(true, '', { themes: [] });

    var data = sheet.getDataRange().getValues();
    var themes = [];

    for (var i = 1; i < data.length; i++) {
      var theme = data[i][0] || '';
      var titre = data[i][1] || '';
      if (titre) {
        var infosJson = data[i][11] || '{}';
        var infos = {};
        try { infos = JSON.parse(infosJson) || {}; } catch(ex) { infos = {}; }

        themes.push({
          theme: theme,
          titre: titre,
          niveau: parseInt(data[i][2]) || 0,
          description: data[i][3] || '',
          nbChapitres: parseInt(data[i][4]) || 0,
          couleur: data[i][5] || '#2d6a4f',
          sousTitre: data[i][6] || '',
          date: data[i][7] || '',
          preRequis: data[i][8] || '',
          auteur: data[i][9] || '',
          couverture: data[i][10] || '',
          infos: infos
        });
      }
    }

    return reponse(true, '', { themes: themes });
  }

  // ============================================================
  // getImages : images d'un thème
  // ============================================================
  if (action === 'getImages') {
    var theme = e.parameter.theme || '';
    if (!theme) return reponse(false, 'Paramètre theme manquant');

    var images = getImagesPourTheme(theme);
    return reponse(true, '', { images: images });
  }

  // ============================================================
  // TENTATIVES
  // ============================================================
  if (action === 'saveTentative')             return actionSaveTentative(e);
  if (action === 'getTentativeUtilisateur')   return actionGetTentativeUtilisateur(e);
  if (action === 'getTentativesUtilisateur')  return actionGetTentativesUtilisateur(e);

  // ============================================================
  // ANNOTATIONS
  // ============================================================
  if (action === 'saveAnnotation')            return actionSaveAnnotation(e);
  if (action === 'getAnnotation')             return actionGetAnnotation(e);
  if (action === 'getAnnotationsUtilisateur') return actionGetAnnotationsUtilisateur(e);

  // ============================================================
  // FAVORIS
  // ============================================================
  if (action === 'saveFavori')                return actionSaveFavori(e);
  if (action === 'getFavorisUtilisateur')     return actionGetFavorisUtilisateur(e);
  if (action === 'getFavoriUtilisateur')      return actionGetFavoriUtilisateur(e);

  return reponse(false, 'Action inconnue: ' + action);
}

// ============================================================
// 🖼️ RÉCUPÉRER LES IMAGES D'UN THÈME (dossier Drive)
// ============================================================
function getImagesPourTheme(nomTheme) {
  try {
    var rootFolder = DriveApp.getFolderById(ID_DOSSIER_DRIVE);

    var dossierImages = null;
    var sousDossiers = rootFolder.getFolders();
    while (sousDossiers.hasNext()) {
      var d = sousDossiers.next();
      if (d.getName().trim().toUpperCase() === 'IMAGES') {
        dossierImages = d;
        break;
      }
    }

    if (!dossierImages) {
      Logger.log('⚠️ Dossier IMAGES introuvable à la racine');
      return {};
    }

    var images = {};
    var fichiers = dossierImages.getFiles();
    while (fichiers.hasNext()) {
      var f = fichiers.next();
      var mime = f.getMimeType();
      if (mime.indexOf('image/') === 0) {
        var nomSansExt = f.getName().replace(/\.[^.]+$/, '');
        images[nomSansExt] = 'https://lh3.googleusercontent.com/d/' + f.getId();
      }
    }

    Logger.log('🖼️ ' + Object.keys(images).length + ' image(s) chargée(s) pour ' + nomTheme);
    return images;

  } catch(e) {
    Logger.log('❌ Erreur getImagesPourTheme: ' + e.message);
    return {};
  }
}

// ============================================================
// NORMALISATION
// ============================================================
function normaliserChaine(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// ============================================================
// ⚡ RÉSOLUTION DU NOM : invités = id unique
// ============================================================
function resoudreNom(nomFourni) {
  var n = (nomFourni || '').trim();
  var nn = normaliserChaine(n);
  if (n === '') {
    return 'invite_' + new Date().getTime() + '_' + Math.floor(Math.random() * 100000);
  }
  if (nn === 'anonyme' || nn === 'invite') {
    return 'invite_' + new Date().getTime() + '_' + Math.floor(Math.random() * 100000);
  }
  if (nn.indexOf('invite_') === 0) return n;
  return n;
}

// ============================================================
// RÉPONSE JSON
// ============================================================
function reponse(success, message, data) {
  var result = { success: success };
  if (message) result.message = message;
  if (data) {
    for (var key in data) {
      result[key] = data[key];
    }
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// FEUILLE TENTATIVES (une ligne par tentative complète)
// ============================================================
function getFeuilleTentatives() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tentatives');
  if (!sheet) {
    sheet = ss.insertSheet('Tentatives');
    sheet.appendRow([
      'Date', 'Nom', 'TexteId', 'Titre', 'Niveau',
      'Bonnes', 'Total', 'Pourcentage',
      'Connecté', 'Détails JSON', 'ChoixQcm', 'RéponseOuverte'
    ]);
    sheet.getRange(1, 1, 1, 12).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ============================================================
// FEUILLE ANNOTATIONS (une ligne par nom + texteId)
// ============================================================
function getFeuilleAnnotations() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Annotations');
  if (!sheet) {
    sheet = ss.insertSheet('Annotations');
    sheet.appendRow(['Date', 'Nom', 'TexteId', 'Titre', 'Annotation']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ============================================================
// FEUILLE FAVORIS (une ligne par nom + theme)
// ============================================================
function getFeuilleFavoris() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Favoris');
  if (!sheet) {
    sheet = ss.insertSheet('Favoris');
    sheet.appendRow(['Date', 'Nom', 'Theme']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ============================================================
// ACTION UNIFIÉE : saveTentative
// ============================================================
function actionSaveTentative(e) {
  try {
    var nom = resoudreNom(e.parameter.nom);
    var texteId = e.parameter.texteId || '';
    var titre = e.parameter.titre || '';
    var bonnes = parseInt(e.parameter.bonnes) || 0;
    var total = parseInt(e.parameter.total) || 0;
    var choixQcm = e.parameter.choixQcm || '';
    var reponseOuverte = e.parameter.reponseOuverte || '';
    var detailsJson = e.parameter.details || '{}';

    var nomNormalise = normaliserChaine(nom);
    var estConnecte = false;
    var niveau = 0;

    try {
      var userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inscrits');
      if (userSheet) {
        var userData = userSheet.getDataRange().getValues();
        for (var i = 1; i < userData.length; i++) {
          if (normaliserChaine(userData[i][0]) === nomNormalise) {
            estConnecte = true;
            niveau = parseInt(userData[i][2]) || 0;
            break;
          }
        }
      }
    } catch(ex) {}

    var niveauTexte = 0;
    try {
      var texteSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Textes');
      if (texteSheet) {
        var texteData = texteSheet.getDataRange().getValues();
        for (var j = 1; j < texteData.length; j++) {
          if (String(texteData[j][0]) === String(texteId)) {
            niveauTexte = parseInt(texteData[j][3]) || 0;
            if (!titre) titre = texteData[j][4] || '';
            break;
          }
        }
      }
    } catch(ex) {}

    var pourcentage = total > 0 ? Math.round((bonnes / total) * 100) : 0;

    var sheet = getFeuilleTentatives();
    sheet.appendRow([
      new Date(),
      nom,
      texteId,
      titre,
      niveauTexte,
      bonnes,
      total,
      pourcentage,
      estConnecte ? 'OUI' : 'NON',
      detailsJson,
      choixQcm,
      reponseOuverte
    ]);

    return reponse(true, 'Tentative enregistrée', {
      nom: nom,
      connecte: estConnecte,
      niveau: niveau,
      bonnes: bonnes,
      total: total,
      pourcentage: pourcentage
    });

  } catch(err) {
    Logger.log('❌ actionSaveTentative: ' + err.message);
    return reponse(false, 'Erreur: ' + err.message);
  }
}

// ============================================================
// Récupère la meilleure tentative d'un utilisateur sur un texte
// ============================================================
function actionGetTentativeUtilisateur(e) {
  try {
    var texteId = e.parameter.texteId || '';
    if (!texteId) return reponse(false, 'Paramètre texteId manquant');

    var nomBrut = (e.parameter.nom || '').trim();
    var nom = resoudreNom(nomBrut);
    var nomNormalise = normaliserChaine(nom);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tentatives');
    if (!sheet) {
      return reponse(true, '', { valide: false, date: '', pourcentage: 0 });
    }

    var data = sheet.getDataRange().getValues();

    var meilleure = null;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][2]) !== String(texteId)) continue;
      if (normaliserChaine(data[i][1]) !== nomNormalise) continue;

      var pct = parseFloat(data[i][7]) || 0;
      var dateVal = data[i][0];

      if (!meilleure || pct > meilleure.pourcentage) {
        meilleure = { pourcentage: pct, date: dateVal };
      }
    }

    if (!meilleure) {
      return reponse(true, '', { valide: false, date: '', pourcentage: 0 });
    }

    var valide = (meilleure.pourcentage >= 65);

    var dateStr = '';
    if (meilleure.date instanceof Date) {
      dateStr = formaterDateHeure(meilleure.date);
    } else if (meilleure.date) {
      var d = new Date(meilleure.date);
      if (!isNaN(d.getTime())) dateStr = formaterDateHeure(d);
    }

    return reponse(true, '', {
      valide: valide,
      date: dateStr,
      pourcentage: meilleure.pourcentage
    });

  } catch (err) {
    Logger.log('❌ actionGetTentativeUtilisateur: ' + err.message);
    return reponse(false, 'Erreur: ' + err.message);
  }
}

// ============================================================
// Récupère TOUTES les tentatives d'un utilisateur
// ============================================================
function actionGetTentativesUtilisateur(e) {
  try {
    var nomBrut = (e.parameter.nom || '').trim();
    var nom = resoudreNom(nomBrut);
    var nomNormalise = normaliserChaine(nom);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tentatives');
    if (!sheet) return reponse(true, '', { tentatives: [] });

    var data = sheet.getDataRange().getValues();
    var tentatives = [];

    for (var i = 1; i < data.length; i++) {
      if (normaliserChaine(data[i][1]) !== nomNormalise) continue;

      var dateVal = data[i][0];
      var dateStr = '';
      if (dateVal instanceof Date) {
        dateStr = formaterDateHeure(dateVal);
      } else if (dateVal) {
        var d = new Date(dateVal);
        if (!isNaN(d.getTime())) dateStr = formaterDateHeure(d);
      }

      tentatives.push({
        date: dateStr,
        texteId: data[i][2] || '',
        titre: data[i][3] || '',
        niveau: parseInt(data[i][4]) || 0,
        bonnes: parseInt(data[i][5]) || 0,
        total: parseInt(data[i][6]) || 0,
        pourcentage: parseFloat(data[i][7]) || 0,
        connecte: data[i][8] || 'NON'
      });
    }

    tentatives.sort(function(a, b) {
      var da = a.date ? new Date(a.date.split(' ')[0].split('/').reverse().join('-') + 'T' + (a.date.split(' ')[1] || '00:00:00')).getTime() : 0;
      var db = b.date ? new Date(b.date.split(' ')[0].split('/').reverse().join('-') + 'T' + (b.date.split(' ')[1] || '00:00:00')).getTime() : 0;
      return db - da;
    });

    return reponse(true, '', { tentatives: tentatives });

  } catch (err) {
    Logger.log('❌ actionGetTentativesUtilisateur: ' + err.message);
    return reponse(false, 'Erreur: ' + err.message);
  }
}

// ============================================================
// ANNOTATIONS
// ============================================================

// Enregistre / met à jour l'annotation d'un utilisateur sur un texte
function actionSaveAnnotation(e) {
  try {
    var nom = resoudreNom(e.parameter.nom);
    var texteId = e.parameter.texteId || '';
    var titre = e.parameter.titre || '';
    var annotation = e.parameter.annotation || '';

    if (!texteId) return reponse(false, 'Paramètre texteId manquant');

    var nomNormalise = normaliserChaine(nom);
    var sheet = getFeuilleAnnotations();
    var data = sheet.getDataRange().getValues();
    var ligne = -1;

    for (var i = 1; i < data.length; i++) {
      if (normaliserChaine(data[i][1]) === nomNormalise &&
          String(data[i][2]) === String(texteId)) {
        ligne = i + 1;
        break;
      }
    }

    if (ligne === -1) {
      if (annotation.trim() === '') {
        return reponse(true, 'Rien à enregistrer');
      }
      sheet.appendRow([new Date(), nom, texteId, titre, annotation]);
    } else {
      if (annotation.trim() === '') {
        sheet.deleteRow(ligne);
        return reponse(true, 'Annotation supprimée');
      }
      sheet.getRange(ligne, 1).setValue(new Date());
      sheet.getRange(ligne, 4).setValue(titre);
      sheet.getRange(ligne, 5).setValue(annotation);
    }

    return reponse(true, 'Annotation enregistrée');

  } catch (err) {
    Logger.log('❌ actionSaveAnnotation: ' + err.message);
    return reponse(false, 'Erreur: ' + err.message);
  }
}

// Récupère l'annotation d'un utilisateur sur un texte
function actionGetAnnotation(e) {
  try {
    var nom = resoudreNom(e.parameter.nom);
    var texteId = e.parameter.texteId || '';
    if (!texteId) return reponse(false, 'Paramètre texteId manquant');

    var nomNormalise = normaliserChaine(nom);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Annotations');
    if (!sheet) return reponse(true, '', { annotation: '' });

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (normaliserChaine(data[i][1]) === nomNormalise &&
          String(data[i][2]) === String(texteId)) {
        return reponse(true, '', { annotation: data[i][4] || '' });
      }
    }
    return reponse(true, '', { annotation: '' });

  } catch (err) {
    Logger.log('❌ actionGetAnnotation: ' + err.message);
    return reponse(false, 'Erreur: ' + err.message);
  }
}

// Récupère TOUTES les annotations d'un utilisateur
function actionGetAnnotationsUtilisateur(e) {
  try {
    var nom = resoudreNom(e.parameter.nom);
    var nomNormalise = normaliserChaine(nom);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Annotations');
    if (!sheet) return reponse(true, '', { annotations: [] });

    var data = sheet.getDataRange().getValues();
    var annotations = [];

    for (var i = 1; i < data.length; i++) {
      if (normaliserChaine(data[i][1]) !== nomNormalise) continue;

      var dateVal = data[i][0];
      var dateStr = '';
      if (dateVal instanceof Date) {
        dateStr = formaterDateHeure(dateVal);
      } else if (dateVal) {
        var d = new Date(dateVal);
        if (!isNaN(d.getTime())) dateStr = formaterDateHeure(d);
      }

      annotations.push({
        date: dateStr,
        texteId: data[i][2] || '',
        titre: data[i][3] || '',
        annotation: data[i][4] || ''
      });
    }

    annotations.sort(function(a, b) {
      var da = a.date ? new Date(a.date.split(' ')[0].split('/').reverse().join('-') + 'T' + (a.date.split(' ')[1] || '00:00:00')).getTime() : 0;
      var db = b.date ? new Date(b.date.split(' ')[0].split('/').reverse().join('-') + 'T' + (b.date.split(' ')[1] || '00:00:00')).getTime() : 0;
      return db - da;
    });

    return reponse(true, '', { annotations: annotations });

  } catch (err) {
    Logger.log('❌ actionGetAnnotationsUtilisateur: ' + err.message);
    return reponse(false, 'Erreur: ' + err.message);
  }
}

// ============================================================
// FAVORIS
// ============================================================

// Ajoute ou retire un thème favori. Renvoie { favori: bool }
function actionSaveFavori(e) {
  try {
    var nom = resoudreNom(e.parameter.nom);
    var theme = (e.parameter.theme || '').trim();
    if (!theme) return reponse(false, 'Paramètre theme manquant');

    var nomNormalise = normaliserChaine(nom);
    var sheet = getFeuilleFavoris();
    var data = sheet.getDataRange().getValues();
    var ligne = -1;

    for (var i = 1; i < data.length; i++) {
      if (normaliserChaine(data[i][1]) === nomNormalise &&
          String(data[i][2]) === String(theme)) {
        ligne = i + 1;
        break;
      }
    }

    if (ligne === -1) {
      sheet.appendRow([new Date(), nom, theme]);
      return reponse(true, 'Ajouté aux favoris', { favori: true });
    } else {
      sheet.deleteRow(ligne);
      return reponse(true, 'Retiré des favoris', { favori: false });
    }
  } catch (err) {
    Logger.log('❌ actionSaveFavori: ' + err.message);
    return reponse(false, 'Erreur: ' + err.message);
  }
}

// Renvoie la liste des thèmes favoris d'un utilisateur
function actionGetFavorisUtilisateur(e) {
  try {
    var nom = resoudreNom(e.parameter.nom);
    var nomNormalise = normaliserChaine(nom);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Favoris');
    if (!sheet) return reponse(true, '', { favoris: [] });

    var data = sheet.getDataRange().getValues();
    var favoris = [];

    for (var i = 1; i < data.length; i++) {
      if (normaliserChaine(data[i][1]) === nomNormalise) {
        favoris.push(data[i][2] || '');
      }
    }
    return reponse(true, '', { favoris: favoris });
  } catch (err) {
    Logger.log('❌ actionGetFavorisUtilisateur: ' + err.message);
    return reponse(false, 'Erreur: ' + err.message);
  }
}

// Renvoie le statut favori d'un thème pour un utilisateur
function actionGetFavoriUtilisateur(e) {
  try {
    var nom = resoudreNom(e.parameter.nom);
    var theme = (e.parameter.theme || '').trim();
    if (!theme) return reponse(false, 'Paramètre theme manquant');

    var nomNormalise = normaliserChaine(nom);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Favoris');
    if (!sheet) return reponse(true, '', { favori: false });

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (normaliserChaine(data[i][1]) === nomNormalise &&
          String(data[i][2]) === String(theme)) {
        return reponse(true, '', { favori: true });
      }
    }
    return reponse(true, '', { favori: false });
  } catch (err) {
    Logger.log('❌ actionGetFavoriUtilisateur: ' + err.message);
    return reponse(false, 'Erreur: ' + err.message);
  }
}

// Formate une Date en "JJ/MM/AAAA HH:MM:SS"
function formaterDateHeure(d) {
  function p(n) { return n < 10 ? '0' + n : '' + n; }
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear()
       + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

// ============================================================
// SYNCHRONISATION DES THÈMES DEPUIS GOOGLE DRIVE VERS SHEETS
// ============================================================
function synchroniserThemes() {
  try {
    Logger.log('🚀 Début synchronisation des thèmes...');

    var rootFolder = DriveApp.getFolderById(ID_DOSSIER_DRIVE);
    var ss = SpreadsheetApp.openById(ID_FEUILLE_SHEETS);
    var sheet = ss.getSheetByName('Thèmes');

    if (!sheet) {
      sheet = ss.insertSheet('Thèmes');
      sheet.appendRow([
        'Thème', 'Titre', 'Niveau', 'Description', 'Nb textes', 'Couleur',
        'Sous-titre', 'Date', 'Pré-requis', 'Auteur', 'Couverture', 'Infos JSON'
      ]);
      Logger.log('📄 Feuille "Thèmes" créée');
    }

    var existingData = {};
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var range = sheet.getRange(2, 1, lastRow - 1, 12);
      var values = range.getValues();
      for (var i = 0; i < values.length; i++) {
        var row = values[i];
        var theme = (row[0] || '').toString().trim();
        var titre = (row[1] || '').toString().trim();
        if (titre) {
          var cle = theme + '|||' + titre;
          existingData[cle] = {
            theme: theme, titre: titre,
            niveau: row[2], description: row[3], nbTextes: row[4],
            couleur: row[5], sousTitre: row[6], date: row[7],
            preRequis: row[8], auteur: row[9], couverture: row[10],
            infosJson: row[11] || ''
          };
        }
      }
      Logger.log('📖 ' + Object.keys(existingData).length + ' thèmes existants chargés');
    }

    var themes = rootFolder.getFolders();
    var categoriesFromDrive = {};
    var totalThemes = 0, totalCategories = 0, totalIgnores = 0;

    while (themes.hasNext()) {
      var themeFolder = themes.next();
      var nomTheme = themeFolder.getName().trim();

      if (nomTheme.toUpperCase() === 'IMAGES') {
        Logger.log('⏭️ Dossier IMAGES ignoré à la racine');
        continue;
      }

      totalThemes++;
      Logger.log('📂 Thème : ' + nomTheme);

      var livrets = themeFolder.getFolders();
      while (livrets.hasNext()) {
        var livretFolder = livrets.next();
        var nomLivretBrut = livretFolder.getName().trim();
        totalCategories++;

        if (nomLivretBrut.indexOf('_') !== -1) {
          Logger.log('  ⏭️ Livret ignoré (_) : ' + nomLivretBrut);
          totalIgnores++;
          continue;
        }

        var niveau = extraireNiveauLivret(nomLivretBrut);
        if (niveau === null) {
          Logger.log('  ⏭️ Livret ignoré (pas de niveau) : ' + nomLivretBrut);
          totalIgnores++;
          continue;
        }

        var titre = nettoyerTitreLivret(nomLivretBrut);
        Logger.log('  📁 Catégorie : ' + titre + ' (Niveau ' + niveau + ')');

        var infos = lireFichierInfos(livretFolder);
        var champs = (infos && infos.champs) ? infos.champs : {};

        var description = infos && infos.description ? infos.description : null;
        var couleur     = infos && infos.couleur     ? infos.couleur     : null;
        var sousTitre   = infos && infos.sousTitre   ? infos.sousTitre   : null;
        var date        = infos && infos.date        ? infos.date        : null;
        var preRequis   = infos && infos.preRequis   ? infos.preRequis   : null;
        var auteur      = infos && infos.auteur      ? infos.auteur      : null;

        var nbTextes = compterChapitres(livretFolder);
        var couverture = recupererCouvertureLivret(livretFolder);

        if (!couleur) couleur = '#2d6a4f';
        if (!description) description = 'Ce thème explore les sujets de ' + titre + ' à travers ' + nbTextes + ' textes.';
        if (!sousTitre) sousTitre = '';
        if (!date) date = '';
        if (!preRequis) preRequis = '';
        if (!auteur) auteur = '';

        var cle = nomTheme + '|||' + titre;
        categoriesFromDrive[cle] = {
          theme: nomTheme,
          titre: titre,
          niveau: niveau,
          description: description,
          nbTextes: nbTextes,
          couleur: couleur,
          sousTitre: sousTitre,
          date: date,
          preRequis: preRequis,
          auteur: auteur,
          couverture: couverture,
          infosJson: JSON.stringify(champs)
        };
      }
    }

    var categoriesToAdd = [], categoriesToUpdate = [], categoriesToDelete = [];

    for (var cle in categoriesFromDrive) {
      var drive = categoriesFromDrive[cle];
      if (existingData[cle]) {
        var existing = existingData[cle];
        if (drive.niveau !== existing.niveau ||
            drive.description !== existing.description ||
            drive.nbTextes !== existing.nbTextes ||
            drive.couleur !== existing.couleur ||
            drive.sousTitre !== existing.sousTitre ||
            drive.date !== existing.date ||
            drive.preRequis !== existing.preRequis ||
            drive.auteur !== existing.auteur ||
            drive.couverture !== existing.couverture ||
            drive.infosJson !== existing.infosJson) {
          categoriesToUpdate.push({ cle: cle, data: drive });
        }
      } else {
        categoriesToAdd.push({ cle: cle, data: drive });
      }
    }
    for (var existingCle in existingData) {
      if (!categoriesFromDrive[existingCle]) categoriesToDelete.push(existingCle);
    }

    if (categoriesToAdd.length > 0) {
      Logger.log('➕ Ajout de ' + categoriesToAdd.length + ' catégorie(s)');
      for (var a = 0; a < categoriesToAdd.length; a++) {
        var item = categoriesToAdd[a];
        sheet.appendRow([
          item.data.theme, item.data.titre, item.data.niveau,
          item.data.description, item.data.nbTextes, item.data.couleur,
          item.data.sousTitre, item.data.date, item.data.preRequis,
          item.data.auteur, item.data.couverture || '',
          item.data.infosJson || '{}'
        ]);
        Logger.log('  ✅ Ajouté : [' + item.data.theme + '] ' + item.data.titre);
      }
    } else {
      Logger.log('📭 Aucun ajout');
    }

    if (categoriesToUpdate.length > 0) {
      Logger.log('🔄 Mise à jour de ' + categoriesToUpdate.length + ' catégorie(s)');
      var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12);
      var valuesMaj = dataRange.getValues();

      for (var u = 0; u < categoriesToUpdate.length; u++) {
        var update = categoriesToUpdate[u];
        var data = update.data;

        for (var j = 0; j < valuesMaj.length; j++) {
          var rowTheme = (valuesMaj[j][0] || '').toString().trim();
          var rowTitre = (valuesMaj[j][1] || '').toString().trim();
          if ((rowTheme + '|||' + rowTitre) === update.cle) {
            var rowNum = j + 2;
            sheet.getRange(rowNum, 1).setValue(data.theme);
            sheet.getRange(rowNum, 2).setValue(data.titre);
            sheet.getRange(rowNum, 3).setValue(data.niveau);
            sheet.getRange(rowNum, 4).setValue(data.description);
            sheet.getRange(rowNum, 5).setValue(data.nbTextes);
            sheet.getRange(rowNum, 6).setValue(data.couleur);
            sheet.getRange(rowNum, 7).setValue(data.sousTitre);
            sheet.getRange(rowNum, 8).setValue(data.date);
            sheet.getRange(rowNum, 9).setValue(data.preRequis);
            sheet.getRange(rowNum, 10).setValue(data.auteur);
            sheet.getRange(rowNum, 11).setValue(data.couverture || '');
            sheet.getRange(rowNum, 12).setValue(data.infosJson || '{}');
            Logger.log('  ✅ Mis à jour : ' + update.cle);
            break;
          }
        }
      }
    } else {
      Logger.log('📭 Aucune mise à jour');
    }

    if (categoriesToDelete.length > 0) {
      Logger.log('🗑️ Suppression de ' + categoriesToDelete.length + ' catégorie(s)');
      var dataRangeSup = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12);
      var valuesSup = dataRangeSup.getValues();
      var rowsToDelete = [];

      for (var d = 0; d < categoriesToDelete.length; d++) {
        var cleSup = categoriesToDelete[d];
        for (var k = 0; k < valuesSup.length; k++) {
          var rowThemeS = (valuesSup[k][0] || '').toString().trim();
          var rowTitreS = (valuesSup[k][1] || '').toString().trim();
          if ((rowThemeS + '|||' + rowTitreS) === cleSup) {
            rowsToDelete.push(k + 2);
            Logger.log('  🗑️ Supprimé : ' + cleSup);
            break;
          }
        }
      }
      rowsToDelete.sort(function(a, b) { return b - a; });
      for (var r = 0; r < rowsToDelete.length; r++) sheet.deleteRow(rowsToDelete[r]);
    } else {
      Logger.log('📭 Aucune suppression');
    }

    Logger.log('✅ Synchronisation terminée !');
    Logger.log('  📂 ' + totalThemes + ' thèmes');
    Logger.log('  📚 ' + totalCategories + ' catégories (' + totalIgnores + ' ignorées)');
    Logger.log('  ➕ ' + categoriesToAdd.length + ' ajoutées');
    Logger.log('  🔄 ' + categoriesToUpdate.length + ' mises à jour');
    Logger.log('  🗑️ ' + categoriesToDelete.length + ' supprimées');

  } catch(e) {
    Logger.log('❌ Erreur synchroniserThemes: ' + e.message);
    throw e;
  }
}

// ============================================================
// 🖼️ RÉCUPÉRER L'IMAGE DE COUVERTURE DU LIVRET
// ============================================================
function recupererCouvertureLivret(dossier) {
  try {
    var fichiers = dossier.getFiles();
    while (fichiers.hasNext()) {
      var f = fichiers.next();
      var nomFichier = f.getName();
      if (nomFichier.indexOf('_') !== -1) continue;

      var nomSansExt = nomFichier.toLowerCase().replace(/\.[^.]+$/, '');
      if (nomSansExt === 'couverture' || nomSansExt === 'cover') {
        var mime = f.getMimeType();
        if (mime.indexOf('image/') === 0) {
          return 'https://lh3.googleusercontent.com/d/' + f.getId();
        }
      }
    }
    return '';
  } catch(e) {
    Logger.log('  ❌ Erreur recupererCouvertureLivret: ' + e.message);
    return '';
  }
}

// ============================================================
// EXTRAIRE LE NIVEAU DEPUIS LE NOM DU LIVRET
// ============================================================
function extraireNiveauLivret(nomLivret) {
  var match = nomLivret.match(/^\s*(\d+)\s*[\.\-]?\s+/);
  if (match) {
    var niveau = parseInt(match[1]);
    if (niveau >= 1) return niveau;
  }
  return null;
}

// ============================================================
// NETTOYER LE TITRE DU LIVRET
// ============================================================
function nettoyerTitreLivret(nomLivret) {
  return nomLivret.replace(/^\s*\d+\s*[\.\-]?\s+/, '').trim();
}

// ============================================================
// COMPTER LES TEXTES
// ============================================================
function compterChapitres(dossier) {
  try {
    var fichiers = dossier.getFilesByType(MimeType.PLAIN_TEXT);
    var count = 0;
    while (fichiers.hasNext()) {
      var f = fichiers.next();
      var nomFichier = f.getName();
      if (nomFichier.indexOf('_') !== -1) continue;
      var nomLower = nomFichier.toLowerCase();
      if (nomLower === 'infos' || nomLower === 'infos.txt') continue;
      count++;
    }
    return count;
  } catch(e) {
    Logger.log('  ❌ Erreur compterChapitres: ' + e.message);
    return 0;
  }
}

// ============================================================
// 📝 LIRE LE FICHIER "infos" — VERSION GÉNÉRIQUE
// ============================================================
function lireFichierInfos(dossier) {
  try {
    var fichiers = dossier.getFiles();
    while (fichiers.hasNext()) {
      var f = fichiers.next();
      var nomFichier = f.getName();
      if (nomFichier.indexOf('_') !== -1) continue;

      var nomLower = nomFichier.toLowerCase();
      if (nomLower === 'infos' || nomLower === 'infos.txt') {
        var contenu = f.getBlob().getDataAsString();
        var champs = {};

        var lignes = contenu.split('\n');
        for (var i = 0; i < lignes.length; i++) {
          var ligne = lignes[i].trim();
          if (ligne === '') continue;
          if (ligne.charAt(0) === '#') continue;

          var idx = ligne.indexOf(':');
          if (idx === -1) continue;

          var cle = ligne.substring(0, idx).trim().toLowerCase();
          var valeur = ligne.substring(idx + 1).trim();

          if (cle === 'sous titre') cle = 'sous-titre';
          if (cle === 'pré-requis') cle = 'pre-requis';

          if (cle && valeur !== '') champs[cle] = valeur;
        }

        return {
          champs: champs,
          couleur:      champs['couleur']      || null,
          description:  champs['description']  || null,
          sousTitre:    champs['sous-titre']   || null,
          date:         champs['date']         || null,
          preRequis:    champs['pre-requis']   || null,
          auteur:       champs['auteur']       || null
        };
      }
    }
    return null;
  } catch(e) {
    Logger.log('  ❌ Erreur lecture infos: ' + e.message);
    return null;
  }
}

// ============================================================
// TEST MANUEL
// ============================================================
function test() {
  synchroniserThemes();
}',
  
  SITE_NAME: 'Méditations islamiques',
  SITE_URL: 'https://webmasterdemedit.github.io/'
};
