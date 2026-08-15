// ============================================================
// article.js - VERSION COMPLÈTE AVEC DATAMANAGER + CACHE LOCAL + "J'ai lu" + QCF4 + ANNOTATION
// ============================================================

var slidesData = [];
var slideIndex = 0;
var totalSlides = 0;
var quizValide = false;
var reponseValidee = false;
var quizVerrouille = false;
var tempsDebut = Date.now();
var postId = '';
var postTitre = '';
var hasQuiz = false;
var hasQuestion = false;

// Stocker les données du quiz pour la sauvegarde finale
var quizData = {
  choixQcm: [],
  bonnes: 0,
  total: 0
};

var chargementEnCours = false;
var reponsesExistantes = null;

// ============================================================
// MAPPING PAGE → POLICE QCF4
// ============================================================
var fontMap = null;
var chargementFontMap = false;

function chargerFontMap() {
  if (fontMap !== null) return Promise.resolve(fontMap);
  if (chargementFontMap) {
    return new Promise(function(resolve, reject) {
      var check = setInterval(function() {
        if (fontMap !== null) {
          clearInterval(check);
          resolve(fontMap);
        }
      }, 100);
    });
  }
  
  chargementFontMap = true;
  return fetch('/medit/font/font-map.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      fontMap = data;
      chargementFontMap = false;
      return fontMap;
    })
    .catch(function() {
      chargementFontMap = false;
      return null;
    });
}

// ============================================================
// CHARGEMENT AVEC DATAMANAGER
// ============================================================
function chargerArticle() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  var loader = document.getElementById('loader');
  var erreur = document.getElementById('erreur');
  var articleCharge = document.getElementById('article-charge');

  if (!id) {
    loader.style.display = 'none';
    erreur.style.display = 'block';
    return;
  }

  postId = id;

  var nom = localStorage.getItem('etudiant_id');
  if (!nom) {
    window.location.href = '/medit/index.html';
    return;
  }

  // Utiliser DataManager
  DataManager.charger()
    .then(function(data) {
      // Chercher l'article dans le cache
      var article = null;
      if (data.articlesComplets && data.articlesComplets[id]) {
        article = data.articlesComplets[id];
      }
      
      if (article) {
        // Article trouvé dans le cache !
        console.log('📦 Article trouvé dans le cache');
        loader.style.display = 'none';
        articleCharge.style.display = 'block';
        afficherArticle(article);
        return;
      }
      
      // Article pas dans le cache, le charger depuis le serveur
      console.log('🌐 Chargement de l\'article depuis le serveur');
      var url = CONFIG.SCRIPT_URL + '?action=getPost&id=' + encodeURIComponent(id);
      return fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(dataPost) {
          loader.style.display = 'none';
          if (dataPost.success && dataPost.post) {
            articleCharge.style.display = 'block';
            afficherArticle(dataPost.post);
            
            // Sauvegarder pour la prochaine fois
            if (!data.articlesComplets) data.articlesComplets = {};
            data.articlesComplets[id] = dataPost.post;
            DataManager.setCache(nom, data);
          } else {
            erreur.style.display = 'block';
          }
        });
    })
    .catch(function() {
      // Erreur : essayer le cache forcé
      var cache = DataManager.getCacheForce(nom);
      if (cache && cache.articlesComplets && cache.articlesComplets[id]) {
        loader.style.display = 'none';
        articleCharge.style.display = 'block';
        afficherArticle(cache.articlesComplets[id]);
        afficherNotification('⚠️ Version en cache (hors ligne)');
      } else {
        loader.style.display = 'none';
        erreur.style.display = 'block';
      }
    });
}

// ============================================================
// NOTIFICATION
// ============================================================
function afficherNotification(message) {
  var notif = document.getElementById('notificationArticle');
  if (notif) {
    notif.remove();
  }
  
  notif = document.createElement('div');
  notif.id = 'notificationArticle';
  notif.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2d6a4f;color:#fff;padding:10px 24px;border-radius:30px;font-size:14px;font-family:Segoe UI,sans-serif;box-shadow:0 4px 15px rgba(0,0,0,0.15);z-index:9999;opacity:0;transition:opacity 0.5s ease;';
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(function() { notif.style.opacity = '1'; }, 50);
  setTimeout(function() {
    notif.style.opacity = '0';
    setTimeout(function() { notif.remove(); }, 500);
  }, 3000);
}

// ============================================================
// AFFICHAGE
// ============================================================
function afficherArticle(post) {
  postTitre = post.titre || 'Sans titre';
  hasQuiz = post.hasQuiz || (post.quiz && post.quiz.trim() !== '');
  hasQuestion = post.hasQuestion || (post.question_ouverte && post.question_ouverte.trim() !== '');

  // === GESTION DES COULEURS SELON LA CATÉGORIE ===
  var isSpecial = post.categorie && post.categorie.toLowerCase() === 'apprendre à lire';
  var carte = document.querySelector('.blog-article');
  var titre = document.getElementById('article-titre');

  if (isSpecial) {
    carte.style.background = 'rgb(105, 179, 242)';
    titre.style.color = 'rgb(255, 241, 116)';
  } else {
    carte.style.background = '#ffffff';
    titre.style.color = '#1a2a2e';
  }

  // === LABEL SPÉCIAL ===
  if (post.categorie) {
    var label = document.getElementById('postLabel');
    label.textContent = post.categorie;
    if (isSpecial) {
      label.classList.add('special');
    } else {
      label.classList.remove('special');
    }
  }

  document.getElementById('article-titre').textContent = postTitre;

  if (post.date) {
    var d = new Date(post.date);
    document.getElementById('postDate').textContent = d.toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  var slides = [];
  var questionsQuiz = [];

  if (post.contenu) {
    var blocs = post.contenu.split(/\n\s*\n/).filter(function(s) { return s.trim().length > 0; });
    blocs.forEach(function(bloc) {
      slides.push({ type: 'text', data: { contenu: bloc } });
    });
  }

  if (post.quiz && post.quiz.trim() !== '') {
    var quizBlocs = post.quiz.split(/\n\s*\n/).filter(function(s) { return s.trim().length > 0; });
    quizBlocs.forEach(function(bloc) {
      var match = bloc.match(/^([^\n]*?)\s*RV\.\s*([^\n]*?)\s*RF\.\s*([^\n]*?)$/);
      if (match) {
        var question = match[1].trim();
        var bonne = match[2].trim();
        var mauvaise = match[3].trim();
        if (question && bonne) {
          var options = [bonne];
          if (mauvaise) options.push(mauvaise);
          else options.push('Je ne sais pas');
          while (options.length < 3) {
            var fake = ['Peut-être', 'Pas sûr', 'Autre chose'][Math.floor(Math.random() * 3)];
            if (options.indexOf(fake) === -1) options.push(fake);
          }
          questionsQuiz.push({ question: question, options: options, bonneReponse: bonne });
        }
      }
    });
    if (questionsQuiz.length > 0) {
      slides.push({ type: 'quiz', data: { questions: questionsQuiz } });
    }
  }

  if (post.question_ouverte && post.question_ouverte.trim()) {
    slides.push({ type: 'question-ouverte', data: { question: post.question_ouverte } });
  }

  if (post.retenir && post.retenir.trim()) {
    slides.push({ type: 'memo', data: { texte: post.retenir } });
  }

  if (slides.length === 0) {
    slides.push({ type: 'text', data: { contenu: 'Contenu non disponible.' } });
  }

  slidesData = slides;
  totalSlides = slides.length;
  slideIndex = 0;
  quizValide = false;
  reponseValidee = false;
  quizVerrouille = false;
  quizData = { choixQcm: [], bonnes: 0, total: 0 };

  var wrapper = document.getElementById('slideWrapper');
  wrapper.innerHTML = '';

  slides.forEach(function(slide, index) {
    var div = document.createElement('div');
    div.className = 'paragraphe-item';
    div.dataset.index = index;

    if (slide.type === 'quiz') {
      div.id = 'slideQuiz';
      div.style.display = 'block';
      div.innerHTML = genererSlideQuiz(slide.data);
    } else if (slide.type === 'question-ouverte') {
      div.innerHTML = genererSlideQuestionOuverte(slide.data);
    } else if (slide.type === 'memo') {
      div.className += ' slide-memo';
      div.innerHTML = genererSlideMemo(slide.data);
    } else {
      div.innerHTML = genererSlideTexte(slide.data);
    }
    wrapper.appendChild(div);
  });

  genererDots();
  updateSlides();
  
  // ============================================================
  // AJOUT : INITIALISER LE SYSTÈME D'ANNOTATION
  // ============================================================
  setTimeout(function() {
    initAnnotationSystem();
    chargerAnnotation();
    updateAnnotationButtonColor();
  }, 500);
}

// ============================================================
// GÉNÉRATION DES SLIDES
// ============================================================
function genererSlideTexte(data) {
  var contenu = data.contenu;
  
  // === DÉTECTION TABLEAU ===
  var lignes = contenu.split('\n').filter(function(l) { return l.trim().length > 0; });
  var estTableau = false;
  var tableauHtml = '';
  
  if (lignes.length > 0) {
    var nbPipe = lignes[0].split('|').length - 1;
    if (nbPipe > 0) {
      var toutesOntPipe = true;
      for (var i = 0; i < lignes.length; i++) {
        if (lignes[i].split('|').length - 1 !== nbPipe) {
          toutesOntPipe = false;
          break;
        }
      }
      if (toutesOntPipe) {
        estTableau = true;
        tableauHtml = '<div class="tableau-container">';
        tableauHtml += '<table class="tableau-slide" dir="rtl">';
        for (var j = 0; j < lignes.length; j++) {
          var cellules = lignes[j].split('|').map(function(c) { return c.trim(); });
          tableauHtml += '<tr>';
          for (var k = 0; k < cellules.length; k++) {
            var isArabic = /[\u0600-\u06FF]/.test(cellules[k]);
            var classe = isArabic ? ' class="cellule-arabe"' : '';
            tableauHtml += '<td' + classe + '>' + cellules[k] + '</td>';
          }
          tableauHtml += '</tr>';
        }
        tableauHtml += '</table>';
        tableauHtml += '</div>';
      }
    }
  }
  
  if (estTableau) {
    return tableauHtml;
  }
  
  // === DÉTECTION QCF4 (caractère arabe suivi d'un nombre) ===
  var matchQCF = contenu.match(/^([\uF000-\uF8FF]+)(\d{1,3})$/);
  if (matchQCF) {
    var caractere = matchQCF[1];
    var page = parseInt(matchQCF[2]);
    
    // Utiliser font-map pour trouver la bonne police
    var police = 'QCF4_Hafs_01'; // fallback
    if (fontMap && fontMap[page]) {
      police = fontMap[page];
    }
    
    var classe = 'contenu-slide arabic qcf4-page-' + page;
    return '<div class="' + classe + '" style="font-family:\'' + police + '\', \'Amiri Quran\', serif;">' + caractere + '</div>';
  }
  
  // === TRAITEMENT NORMAL ===
  var isArabic = /[\u0600-\u06FF]/.test(contenu);
  var contenuBr = contenu.replace(/\n/g, '<br>');
  var classe = isArabic ? ' class="contenu-slide arabic"' : ' class="contenu-slide"';
  return '<div' + classe + '>' + contenuBr + '</div>';
}

function genererSlideQuiz(data) {
  var html = '<div class="quiz-container"><h3>📝 Quiz</h3>';
  data.questions.forEach(function(q, idx) {
    var qId = 'q' + (idx + 1);
    html += '<div class="quiz-question" data-question="' + qId + '" data-index="' + idx + '">';
    html += '<p><strong>' + (idx + 1) + '. ' + q.question + '</strong></p>';
    q.options.forEach(function(opt) {
      var isCorrect = (opt === q.bonneReponse) ? 'data-correct="true"' : '';
      html += '<label><input type="radio" name="' + qId + '" value="' + opt + '" ' + isCorrect + '>' + opt + '</label>';
    });
    html += '<div class="quiz-feedback" id="feedback_' + qId + '"></div>';
    html += '</div>';
  });
  html += '<div id="quiz-result"><p><strong>Score :</strong> <span id="quiz-score">0</span> / <span id="quiz-total">' + data.questions.length + '</span></p><p id="quiz-message"></p></div>';
  html += '</div>';
  return html;
}

function genererSlideQuestionOuverte(data) {
  return '<div id="openQuestion" style="display:block;"><h3>✍️ Question ouverte</h3><h4>' + data.question + '</h4><p><label>Votre réponse :<br /><textarea id="reponse-mailto" placeholder="écrivez ici votre réponse..." rows="3" style="width:100%;padding:12px 16px;border:1px solid #e2e0db;border-radius:10px;font-size:15px;font-family:Georgia,serif;resize:vertical;min-height:100px;background:#faf9f7;color:#2d3748;"></textarea></label></p><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;"><button class="btn-nav" onclick="validerReponse()">Enregistrer</button></div><div id="form-message-mailto" style="margin-top:6px;"></div></div>';
}

function genererSlideMemo(data) {
  var html = '<div class="slide-memo">';
  html += '<div class="confirmation-fin">✏ Vous avez fini ! ✏</div>';
  html += '<span class="memo-label">📌 À retenir</span>';
  html += '<div class="contenu-memo">' + data.texte + '</div>';
  
  if (!hasQuiz && !hasQuestion) {
    html += '<button class="btn-appris" onclick="marquerCommeLu()" style="margin-top:16px;">📖 J\'ai lu</button>';
  }
  
  html += '</div>';
  return html;
}

// ============================================================
// DOTS & NAVIGATION
// ============================================================
function genererDots() {
  var container = document.getElementById('dotsContainerOutside');
  if (!container) {
    // Si le conteneur n'existe pas encore, le créer
    container = document.createElement('div');
    container.id = 'dotsContainerOutside';
    container.className = 'dots-container-outside';
    var pageArticle = document.querySelector('.page-article');
    if (pageArticle) {
      pageArticle.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
  }
  container.innerHTML = '';
  
  slidesData.forEach(function(slide, idx) {
    var dot = document.createElement('span');
    dot.className = 'dot';
    if (slide.type === 'quiz') dot.classList.add('quiz-dot');
    if (slide.type === 'memo') dot.classList.add('memo-dot');
    if (slide.type === 'question-ouverte') dot.classList.add('question-dot');
    if (idx === 0) dot.classList.add('active');
    dot.dataset.index = idx;
    dot.onclick = function() { allerSlide(idx); };
    container.appendChild(dot);
  });
}

function isSlideAccessible(index) {
  if (index === 0) return true;
  for (var i = 0; i < index; i++) {
    var slide = slidesData[i];
    if (slide.type === 'quiz' && !quizValide) return false;
    if (slide.type === 'question-ouverte' && !reponseValidee) return false;
  }
  return true;
}

function updateSlides() {
  var wrapper = document.getElementById('slideWrapper');
  if (slidesData.length === 0) return;
  
  var items = wrapper.querySelectorAll('.paragraphe-item');
  items.forEach(function(item, idx) {
    item.classList.remove('active');
  });
  if (items[slideIndex]) {
    items[slideIndex].classList.add('active');
  }
  
  document.getElementById('compteur').textContent = (slideIndex + 1) + ' / ' + slidesData.length;

  var dots = document.querySelectorAll('.dots-container-outside .dot');
  dots.forEach(function(dot, idx) {
    dot.classList.remove('active', 'done', 'locked');
    if (idx === slideIndex) dot.classList.add('active');
    else if (idx < slideIndex) dot.classList.add('done');
    if (!isSlideAccessible(idx) && idx > slideIndex) dot.classList.add('locked');
  });

  var msg = document.getElementById('lockMessage');
  var current = slidesData[slideIndex];
  if (current && current.type === 'quiz') {
    if (quizValide) msg.textContent = 'Quiz validé.';
    else msg.textContent = 'Répondez au quiz pour continuer.';
  } else if (current && current.type === 'question-ouverte') {
    if (reponseValidee) msg.textContent = 'Réponse enregistrée.';
    else msg.textContent = 'Écrivez votre réponse.';
  } else if (current && current.type === 'memo') {
    msg.textContent = 'Méditation terminée.';
  } else {
    msg.textContent = '';
  }

  var oldBtn = document.getElementById('btnAppris');
  if (oldBtn) oldBtn.remove();
  var oldMsg = document.getElementById('finMessage');
  if (oldMsg) oldMsg.remove();

  if (current && current.type === 'memo') {
    ajouterBoutonAppris();
  } else if (slideIndex === slidesData.length - 1 && current && current.type !== 'memo' && reponseValidee) {
    afficherMessageFin();
  }

  // ============================================================
  // AJOUT : METTRE À JOUR L'URL AVEC LE NUMÉRO DE SLIDE
  // ============================================================
  var url = new URL(window.location.href);
  url.searchParams.set('slide', slideIndex);
  window.history.replaceState({}, '', url);

  // ============================================================
  // AJOUT : CHARGER L'ANNOTATION DE LA SLIDE ACTUELLE
  // ============================================================
  chargerAnnotation();
  updateAnnotationButtonColor();

  // Si le popup est ouvert, fermer proprement
  if (annotationPopupOpen) {
    closeAnnotationPopup();
  }
}

function ajouterBoutonAppris() {}

function afficherMessageFin() {
  if (document.getElementById('finMessage')) return;

  var finMsg = document.createElement('div');
  finMsg.id = 'finMessage';
  finMsg.innerHTML = '✅ Vous avez fini !';
  finMsg.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2d6a4f;color:#fff;padding:12px 30px;border-radius:30px;font-size:16px;font-family:Georgia,serif;box-shadow:0 4px 15px rgba(0,0,0,0.15);z-index:9999;opacity:0;transition:opacity 0.5s ease;';
  document.body.appendChild(finMsg);
  setTimeout(function() { finMsg.style.opacity = '1'; }, 50);

  setTimeout(function() {
    window.location.href = '/medit/mes-textes.html';
  }, 2500);
}

function slideSuivant() {
  if (slideIndex < slidesData.length - 1 && isSlideAccessible(slideIndex + 1)) {
    slideIndex++;
    updateSlides();
  } else {
    var current = slidesData[slideIndex];
    if (current && current.type === 'quiz' && !quizValide) {
      document.getElementById('lockMessage').textContent = 'Répondez au quiz.';
    } else if (current && current.type === 'question-ouverte' && !reponseValidee) {
      document.getElementById('lockMessage').textContent = 'Écrivez votre réponse.';
    } else {
      document.getElementById('lockMessage').textContent = 'Complétez d\'abord cette étape.';
    }
  }
}

function slidePrecedent() {
  if (slideIndex > 0) { slideIndex--; updateSlides(); }
}

function allerSlide(index) {
  if (isSlideAccessible(index)) { slideIndex = index; updateSlides(); }
  else {
    document.getElementById('lockMessage').textContent = 'Cette section est verrouillée.';
  }
}

// ============================================================
// SAUVEGARDER LE QUIZ
// ============================================================
function sauvegarderQuiz() {
  var nom = localStorage.getItem('etudiant_id');
  if (!nom) {
    console.error('Non connecté');
    return;
  }

  var tempsPasse = Math.round((Date.now() - tempsDebut) / 1000) + 's';

  var url = CONFIG.SCRIPT_URL + '?action=saveQuiz&nom=' + encodeURIComponent(nom) +
    '&articleId=' + encodeURIComponent(postId) +
    '&titre=' + encodeURIComponent(postTitre) +
    '&choixQcm=' + encodeURIComponent(quizData.choixQcm.join('|')) +
    '&bonnes=' + encodeURIComponent(quizData.bonnes) +
    '&total=' + encodeURIComponent(quizData.total) +
    '&tempsPasse=' + encodeURIComponent(tempsPasse);

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        console.log('Quiz sauvegardé');
        miseAJourCacheLocal(nom, postId, quizData.bonnes, quizData.total);
      } else {
        console.error('Erreur :', data.message);
      }
    })
    .catch(function() {
      console.error('Erreur réseau');
    });
}

// ============================================================
// SAUVEGARDER LA RÉPONSE OUVERTE
// ============================================================
function validerReponse() {
  var nom = localStorage.getItem('etudiant_id');
  if (!nom) {
    document.getElementById('form-message-mailto').innerHTML = '<span style="color:#c62828;">Veuillez vous reconnecter.</span>';
    return;
  }

  var reponse = document.getElementById('reponse-mailto').value.trim();
  if (!reponse) {
    document.getElementById('form-message-mailto').innerHTML = '<span style="color:#c62828;">Écrivez quelque chose.</span>';
    return;
  }

  var btn = document.querySelector('#openQuestion .btn-nav');
  var msgContainer = document.getElementById('form-message-mailto');
  
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-btn"></span> Envoi...';
  btn.style.opacity = '0.6';
  msgContainer.innerHTML = '<span style="color:#94a3b8;">Envoi en cours...</span>';

  var url = CONFIG.SCRIPT_URL + '?action=saveReponseOuverte&nom=' + encodeURIComponent(nom) +
    '&articleId=' + encodeURIComponent(postId) +
    '&reponseOuverte=' + encodeURIComponent(reponse);

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        btn.textContent = '✅ Envoyé !';
        btn.style.background = '#2d6a4f';
        btn.style.opacity = '1';
        msgContainer.innerHTML = '<span style="color:#2d6a4f;">✅ Réponse enregistrée !</span>';
        
        reponseValidee = true;
        document.getElementById('reponse-mailto').disabled = true;
        updateSlides();
        miseAJourCacheReponse(nom, postId);
        
        if (slideIndex === slidesData.length - 1) {
          setTimeout(function() { afficherMessageFin(); }, 800);
        } else {
          setTimeout(function() {
            if (slideIndex < slidesData.length - 1) { slideIndex++; updateSlides(); }
          }, 1000);
        }
      } else {
        btn.textContent = '❌ Réessayer';
        btn.style.background = '#c62828';
        btn.style.opacity = '1';
        btn.disabled = false;
        msgContainer.innerHTML = '<span style="color:#c62828;">❌ Erreur : ' + (data.message || '') + '</span>';
      }
    })
    .catch(function() {
      btn.textContent = '❌ Réessayer';
      btn.style.background = '#c62828';
      btn.style.opacity = '1';
      btn.disabled = false;
      msgContainer.innerHTML = '<span style="color:#c62828;">❌ Erreur réseau. Vérifiez votre connexion.</span>';
    });
}

// ============================================================
// MISE À JOUR DU CACHE LOCAL
// ============================================================
function miseAJourCacheLocal(nom, articleId, bonnes, total) {
  var cache = DataManager.getCacheForce(nom);
  if (!cache) return;
  
  var reponseExistante = false;
  if (cache.reponses) {
    for (var i = 0; i < cache.reponses.length; i++) {
      if (cache.reponses[i].articleId === articleId) {
        cache.reponses[i].bonnes = bonnes;
        cache.reponses[i].total = total;
        cache.reponses[i].date = new Date().toISOString();
        reponseExistante = true;
        break;
      }
    }
  }
  
  if (!reponseExistante) {
    if (!cache.reponses) cache.reponses = [];
    cache.reponses.push({
      articleId: articleId,
      titre: postTitre || 'Méditation',
      bonnes: bonnes,
      total: total,
      date: new Date().toISOString(),
      temps: '',
      reponseOuverte: '',
      dateEnvoi: '',
      dureeTotale: ''
    });
  }
  
  if (cache.historique) {
    var histoExistante = false;
    for (var j = 0; j < cache.historique.length; j++) {
      if (cache.historique[j].titre === postTitre || cache.historique[j].titre === 'Méditation') {
        cache.historique[j].bonnes = bonnes;
        cache.historique[j].total = total;
        cache.historique[j].date = new Date().toISOString();
        cache.historique[j].valide = (total > 0 && bonnes >= Math.ceil(total / 2));
        histoExistante = true;
        break;
      }
    }
    if (!histoExistante) {
      cache.historique.push({
        date: new Date().toISOString(),
        titre: postTitre || 'Méditation',
        bonnes: bonnes,
        total: total,
        valide: (total > 0 && bonnes >= Math.ceil(total / 2)),
        temps: '',
        reponseOuverte: '',
        dateEnvoi: '',
        dureeTotale: ''
      });
    }
  }
  
  DataManager.setCache(nom, cache);
  console.log('✅ Cache local mis à jour pour le quiz');
}

function miseAJourCacheReponse(nom, articleId) {
  var cache = DataManager.getCacheForce(nom);
  if (!cache) return;
  
  if (cache.reponses) {
    for (var i = 0; i < cache.reponses.length; i++) {
      if (cache.reponses[i].articleId === articleId) {
        cache.reponses[i].reponseOuverte = document.getElementById('reponse-mailto').value.trim();
        cache.reponses[i].dateEnvoi = new Date().toISOString();
        break;
      }
    }
  }
  
  if (cache.historique) {
    for (var j = 0; j < cache.historique.length; j++) {
      if (cache.historique[j].titre === postTitre || cache.historique[j].titre === 'Méditation') {
        cache.historique[j].reponseOuverte = document.getElementById('reponse-mailto').value.trim();
        cache.historique[j].dateEnvoi = new Date().toISOString();
        break;
      }
    }
  }
  
  DataManager.setCache(nom, cache);
  console.log('✅ Cache local mis à jour pour la réponse ouverte');
}

function miseAJourCacheLecture(nom, articleId) {
  var cache = DataManager.getCacheForce(nom);
  if (!cache) return;
  
  var reponseExistante = false;
  if (cache.reponses) {
    for (var i = 0; i < cache.reponses.length; i++) {
      if (cache.reponses[i].articleId === articleId) {
        cache.reponses[i].bonnes = 1;
        cache.reponses[i].total = 1;
        cache.reponses[i].date = new Date().toISOString();
        cache.reponses[i].reponseOuverte = 'Lu';
        cache.reponses[i].dateEnvoi = new Date().toISOString();
        reponseExistante = true;
        break;
      }
    }
  }
  
  if (!reponseExistante) {
    if (!cache.reponses) cache.reponses = [];
    cache.reponses.push({
      articleId: articleId,
      titre: postTitre || 'Méditation',
      bonnes: 1,
      total: 1,
      date: new Date().toISOString(),
      temps: '',
      reponseOuverte: 'Lu',
      dateEnvoi: new Date().toISOString(),
      dureeTotale: ''
    });
  }
  
  if (cache.historique) {
    var histoExistante = false;
    for (var j = 0; j < cache.historique.length; j++) {
      if (cache.historique[j].titre === postTitre || cache.historique[j].titre === 'Méditation') {
        cache.historique[j].bonnes = 1;
        cache.historique[j].total = 1;
        cache.historique[j].date = new Date().toISOString();
        cache.historique[j].valide = true;
        cache.historique[j].reponseOuverte = 'Lu';
        cache.historique[j].dateEnvoi = new Date().toISOString();
        histoExistante = true;
        break;
      }
    }
    if (!histoExistante) {
      cache.historique.push({
        date: new Date().toISOString(),
        titre: postTitre || 'Méditation',
        bonnes: 1,
        total: 1,
        valide: true,
        temps: '',
        reponseOuverte: 'Lu',
        dateEnvoi: new Date().toISOString(),
        dureeTotale: ''
      });
    }
  }
  
  DataManager.setCache(nom, cache);
  console.log('✅ Cache local mis à jour pour "J\'ai lu"');
}

// ============================================================
// BOUTON "J'AI LU"
// ============================================================
function marquerCommeLu() {
  var nom = localStorage.getItem('etudiant_id');
  if (!nom) {
    afficherNotification('⚠️ Veuillez vous reconnecter.');
    return;
  }

  var cache = DataManager.getCacheForce(nom);
  if (cache && cache.reponses) {
    for (var i = 0; i < cache.reponses.length; i++) {
      if (cache.reponses[i].articleId === postId) {
        if (cache.reponses[i].bonnes === 1 && cache.reponses[i].total === 1) {
          afficherNotification('📖 Déjà marqué comme lu.');
          return;
        }
      }
    }
  }

  var url = CONFIG.SCRIPT_URL + '?action=saveLecture&nom=' + encodeURIComponent(nom) +
    '&articleId=' + encodeURIComponent(postId) +
    '&titre=' + encodeURIComponent(postTitre);

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        afficherNotification('📖 Lecture enregistrée !');
        miseAJourCacheLecture(nom, postId);
        quizValide = true;
        reponseValidee = true;
        updateSlides();
        setTimeout(function() { window.location.href = '/medit/mes-textes.html'; }, 1500);
      } else {
        afficherNotification('⚠️ Erreur : ' + (data.message || ''));
      }
    })
    .catch(function() {
      afficherNotification('⚠️ Erreur réseau.');
    });
}

// ============================================================
// QUIZ
// ============================================================
function verifierQuizAuto() {
  if (quizVerrouille) return;

  var questions = document.querySelectorAll('.quiz-question:not(.verrouille)');
  var total = questions.length;
  var correct = 0;
  var toutesRepondues = true;
  var choixQcm = [];

  questions.forEach(function(q) {
    var qId = q.getAttribute('data-question');
    var radios = q.querySelectorAll('input[type="radio"]');
    var feedback = document.getElementById('feedback_' + qId);
    var labels = q.querySelectorAll('label');
    var selected = null;
    var reponseChoisie = '';

    labels.forEach(function(l) { l.classList.remove('correct', 'incorrect'); });

    radios.forEach(function(r) {
      if (r.checked) {
        selected = r;
        reponseChoisie = r.value;
      }
    });

    choixQcm.push(reponseChoisie);

    if (selected) {
      var isCorrect = selected.getAttribute('data-correct') === 'true';
      if (isCorrect) {
        correct++;
        feedback.className = 'quiz-feedback correct';
        feedback.textContent = '✓ Bonne réponse.';
        labels.forEach(function(l) {
          var r = l.querySelector('input[type="radio"]');
          if (r && r.getAttribute('data-correct') === 'true') l.classList.add('correct');
        });
      } else {
        feedback.className = 'quiz-feedback incorrect';
        feedback.textContent = '✗ Réessayez, relisez le texte.';
        selected.closest('label').classList.add('incorrect');
        labels.forEach(function(l) {
          var r = l.querySelector('input[type="radio"]');
          if (r && r.getAttribute('data-correct') === 'true') l.classList.add('correct');
        });
      }
    } else {
      toutesRepondues = false;
      feedback.className = 'quiz-feedback incorrect';
      feedback.textContent = 'Sélectionnez une réponse.';
    }
  });

  var resultDiv = document.getElementById('quiz-result');
  resultDiv.style.display = 'block';
  document.getElementById('quiz-score').textContent = correct;
  document.getElementById('quiz-total').textContent = total;

  var msg = document.getElementById('quiz-message');
  if (!toutesRepondues) {
    msg.textContent = 'Répondez à toutes les questions.';
    msg.style.color = '#b8956a';
    return;
  }

  quizVerrouille = true;
  questions.forEach(function(q) {
    q.classList.add('verrouille');
    var radios = q.querySelectorAll('input[type="radio"]');
    radios.forEach(function(r) { r.disabled = true; });
  });

  quizData.choixQcm = choixQcm;
  quizData.bonnes = correct;
  quizData.total = total;

  if (correct === total) {
    msg.textContent = 'Parfait !';
    msg.style.color = '#2d6a4f';
    quizValide = true;
    sauvegarderQuiz();
    updateSlides();
    setTimeout(function() {
      if (slideIndex < slidesData.length - 1) { slideIndex++; updateSlides(); }
    }, 1200);
  } else if (correct >= Math.ceil(total / 2)) {
    msg.textContent = 'Pas mal ! Relisez les passages qui vous ont posé problème.';
    msg.style.color = '#b8956a';
    quizValide = true;
    sauvegarderQuiz();
    updateSlides();
    setTimeout(function() {
      if (slideIndex < slidesData.length - 1) { slideIndex++; updateSlides(); }
    }, 1200);
  } else {
    msg.textContent = 'Prenez le temps de relire la méditation.';
    msg.style.color = '#c62828';
  }
}

// ============================================================
// ÉCOUTE DES RADIOS
// ============================================================
document.addEventListener('change', function(e) {
  if (e.target && e.target.type === 'radio' && e.target.name && e.target.name.indexOf('q') === 0) {
    var questions = document.querySelectorAll('.quiz-question:not(.verrouille)');
    var toutesRepondues = true;
    questions.forEach(function(q) {
      var radios = q.querySelectorAll('input[type="radio"]');
      var repondu = false;
      radios.forEach(function(r) { if (r.checked) repondu = true; });
      if (!repondu) toutesRepondues = false;
    });
    if (toutesRepondues && questions.length > 0) {
      setTimeout(verifierQuizAuto, 400);
    }
  }
});

// ============================================================
// SWIPE TACTILE
// ============================================================
var touchStartX = 0;
var touchEndX = 0;

document.addEventListener('touchstart', function(e) {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', function(e) {
  touchEndX = e.changedTouches[0].screenX;
  var diff = touchStartX - touchEndX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      slideSuivant();
    } else {
      slidePrecedent();
    }
  }
}, { passive: true });

// ============================================================
// CLAVIER
// ============================================================
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); slideSuivant(); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); slidePrecedent(); }
});

// ============================================================
// INIT
// ============================================================
function demarrer() {
  var id = localStorage.getItem('etudiant_id');
  if (!id) {
    window.location.href = '/medit/index.html';
    return;
  }
  
  // Charger le font-map pour QCF4
  chargerFontMap();
  
  chargerArticle();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', demarrer);
} else {
  demarrer();
}

// ============================================================
// PARTAGE NATIF
// ============================================================
function partager() {
  var url = window.location.href;
  var titre = document.querySelector('h1')?.textContent || 'Méditation';

  if (navigator.share) {
    navigator.share({
      title: titre,
      text: '📖 ' + titre + ' — sur Qiraat',
      url: url
    }).catch(function() {});
  } else {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() {
        alert('🔗 Lien copié !');
      }).catch(function() {});
    } else {
      var input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert('🔗 Lien copié !');
    }
  }
}

// ============================================================
// SYSTÈME D'ANNOTATION - SAUVEGARDE UNIQUEMENT À LA FERMETURE
// ============================================================

var annotationText = '';
var annotationPopupOpen = false;
var annotationSlideIndex = -1;

function initAnnotationSystem() {
  var popup = document.getElementById('annotatePopup');
  if (!popup) return;

  var btn = document.getElementById('btnAnnotate');
  var close = document.getElementById('annotateClose');
  var textarea = document.getElementById('annotateTextarea');

  if (btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleAnnotationPopup();
    });
  }

  if (close) {
    close.addEventListener('click', function() {
      closeAnnotationPopup();
    });
  }

  document.addEventListener('click', function(e) {
    if (annotationPopupOpen && 
        !e.target.closest('.annotate-popup') && 
        !e.target.closest('.btn-annotate')) {
      closeAnnotationPopup();
    }
  });

  if (textarea) {
    textarea.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        closeAnnotationPopup();
      }
      if (e.key === 'Escape') {
        closeAnnotationPopup();
      }
    });
  }

  updateAnnotationButtonColor();
}

function toggleAnnotationPopup() {
  if (annotationPopupOpen) {
    closeAnnotationPopup();
  } else {
    openAnnotationPopup();
  }
}

function openAnnotationPopup() {
  var popup = document.getElementById('annotatePopup');
  var textarea = document.getElementById('annotateTextarea');
  var slideNum = document.getElementById('annotateSlideNum');

  if (!popup) return;

  if (slideNum) {
    slideNum.textContent = slideIndex + 1;
  }

  if (textarea) {
    var nom = localStorage.getItem('etudiant_id');
    var cache = DataManager.getCacheForce(nom);
    if (cache && cache.annotations && cache.annotations[postId] && cache.annotations[postId][slideIndex] !== undefined) {
      annotationText = cache.annotations[postId][slideIndex];
    } else {
      annotationText = '';
    }
    textarea.value = annotationText;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  annotationPopupOpen = true;
  annotationSlideIndex = slideIndex;
  popup.classList.add('open');
}

function closeAnnotationPopup() {
  var popup = document.getElementById('annotatePopup');
  var textarea = document.getElementById('annotateTextarea');

  if (textarea) {
    sauvegarderAnnotation(textarea.value);
  }

  annotationPopupOpen = false;
  if (popup) popup.classList.remove('open');
}

function sauvegarderAnnotation(texte) {
  var nom = localStorage.getItem('etudiant_id');
  if (!nom) return;

  // Mettre à jour l'indicateur (stylo vert)
  var btn = document.getElementById('btnAnnotate');
  if (btn) {
    if (texte && texte.trim().length > 0) {
      btn.classList.add('has-note');
    } else {
      btn.classList.remove('has-note');
    }
  }

  // Sauvegarde locale
  var cache = DataManager.getCacheForce(nom);
  if (!cache) cache = {};
  if (!cache.annotations) cache.annotations = {};
  if (!cache.annotations[postId]) cache.annotations[postId] = {};
  
  // Sauvegarder le texte pour cette slide
  cache.annotations[postId][slideIndex] = texte;
  DataManager.setCache(nom, cache);

  // Sauvegarde serveur (silencieuse, pas de message)
  var url = CONFIG.SCRIPT_URL + '?action=saveAnnotation&nom=' + encodeURIComponent(nom) +
    '&articleId=' + encodeURIComponent(postId) +
    '&slide=' + encodeURIComponent(slideIndex) +
    '&annotation=' + encodeURIComponent(texte);

  fetch(url).catch(function() {});
}

function chargerAnnotation() {
  var nom = localStorage.getItem('etudiant_id');
  if (!nom) {
    annotationText = '';
    return;
  }

  var cache = DataManager.getCacheForce(nom);
  if (cache && cache.annotations && cache.annotations[postId] && cache.annotations[postId][slideIndex] !== undefined) {
    annotationText = cache.annotations[postId][slideIndex];
  } else {
    annotationText = '';
  }

  // Mettre à jour l'indicateur
  var btn = document.getElementById('btnAnnotate');
  if (btn) {
    if (annotationText && annotationText.trim().length > 0) {
      btn.classList.add('has-note');
    } else {
      btn.classList.remove('has-note');
    }
  }

  if (annotationPopupOpen) {
    var textarea = document.getElementById('annotateTextarea');
    if (textarea) {
      textarea.value = annotationText;
    }
  }
}

function updateAnnotationButtonColor() {
  var btn = document.getElementById('btnAnnotate');
  if (!btn) return;
  
  var isSpecial = document.querySelector('.blog-article.special') !== null;
  
  if (isSpecial) {
    btn.classList.add('special');
    btn.classList.remove('default');
  } else {
    btn.classList.add('default');
    btn.classList.remove('special');
  }
}
