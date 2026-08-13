// ============================================================
// VARIABLES
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

// Stocker les données du quiz pour la sauvegarde finale
var quizData = {
  choixQcm: [],
  bonnes: 0,
  total: 0
};

// ============================================================
// CHARGEMENT
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

  var url = CONFIG.SCRIPT_URL + '?action=getPost&id=' + encodeURIComponent(id);
  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      loader.style.display = 'none';
      if (data.success && data.post) {
        afficherArticle(data.post);
        articleCharge.style.display = 'block';
      } else {
        erreur.style.display = 'block';
      }
    })
    .catch(function() {
      loader.style.display = 'none';
      erreur.style.display = 'block';
    });
}

// ============================================================
// AFFICHAGE
// ============================================================
function afficherArticle(post) {
  postTitre = post.titre || 'Sans titre';

  if (post.categorie) {
    document.getElementById('postLabel').textContent = post.categorie;
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

  if (post.quiz) {
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
}

// ============================================================
// GÉNÉRATION DES SLIDES
// ============================================================
function genererSlideTexte(data) {
  return '<div class="contenu-slide">' + data.contenu.replace(/\n/g, '<br>') + '</div>';
}

function genererSlideQuiz(data) {
  var html = '<div class="quiz-container"><h3>Quiz</h3>';
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
  return '<div id="openQuestion" style="display:block;"><h3>Question ouverte</h3><h4>' + data.question + '</h4><p><label>Votre réponse :<br /><textarea id="reponse-mailto" placeholder="Écrivez ici votre réponse..." rows="3" style="width:100%;padding:12px 16px;border:1px solid #e2e0db;border-radius:10px;font-size:15px;font-family:Georgia,serif;resize:vertical;min-height:100px;background:#faf9f7;color:#2d3748;"></textarea></label></p><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;"><button class="btn-nav" onclick="validerReponse()">Enregistrer</button></div><div id="form-message-mailto" style="margin-top:6px;"></div></div>';
}

function genererSlideMemo(data) {
  var html = '<div class="slide-memo">';
  html += '<div class="confirmation-fin">✧ Vous avez fini ! ✧</div>';
  html += '<span class="memo-label">À retenir</span>';
  html += '<div class="contenu-memo">' + data.texte + '</div>';
  html += '</div>';
  return html;
}

// ============================================================
// DOTS & NAVIGATION
// ============================================================
function genererDots() {
  var container = document.getElementById('dotsContainer');
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
  wrapper.style.transform = 'translateX(-' + (slideIndex * 100) + '%)';
  document.getElementById('compteur').textContent = (slideIndex + 1) + ' / ' + slidesData.length;

  var dots = document.querySelectorAll('.dot');
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

  // Gestion du bouton "J'ai appris" + message de fin
  var oldBtn = document.getElementById('btnAppris');
  if (oldBtn) oldBtn.remove();
  var oldMsg = document.getElementById('finMessage');
  if (oldMsg) oldMsg.remove();

  if (current && current.type === 'memo') {
    ajouterBoutonAppris();
  } else if (slideIndex === slidesData.length - 1 && current && current.type !== 'memo' && reponseValidee) {
    afficherMessageFin();
  }
}

function ajouterBoutonAppris() {
  var btn = document.createElement('button');
  btn.id = 'btnAppris';
  btn.textContent = 'Revenir aux textes';
  btn.className = 'btn-appris';
  btn.onclick = function() {
    window.location.href = '/medit/mes-textes.html';
  };

  var container = document.querySelector('.slide-memo');
  if (container) {
    container.appendChild(btn);
  }
}

function afficherMessageFin() {
  if (document.getElementById('finMessage')) return;

  var finMsg = document.createElement('div');
  finMsg.id = 'finMessage';
  finMsg.innerHTML = '✔ Vous avez fini !';
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
    updateSlides();
    setTimeout(function() {
      if (slideIndex < slidesData.length - 1) { slideIndex++; updateSlides(); }
    }, 1200);
  } else if (correct >= Math.ceil(total / 2)) {
    msg.textContent = 'Pas mal ! Relisez les passages qui vous ont posé problème.';
    msg.style.color = '#b8956a';
    quizValide = true;
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
// SAUVEGARDE FINALE
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

  var retenir = '';
  for (var i = 0; i < slidesData.length; i++) {
    if (slidesData[i].type === 'memo') {
      retenir = slidesData[i].data.texte || '';
      break;
    }
  }

  var tempsPasse = Math.round((Date.now() - tempsDebut) / 1000) + 's';

  var url = CONFIG.SCRIPT_URL + '?action=saveReponse&nom=' + encodeURIComponent(nom) +
    '&articleId=' + encodeURIComponent(postId) +
    '&titre=' + encodeURIComponent(postTitre) +
    '&choixQcm=' + encodeURIComponent(quizData.choixQcm.join('|')) +
    '&bonnes=' + encodeURIComponent(quizData.bonnes) +
    '&total=' + encodeURIComponent(quizData.total) +
    '&reponseOuverte=' + encodeURIComponent(reponse) +
    '&tempsPasse=' + encodeURIComponent(tempsPasse) +
    '&retenir=' + encodeURIComponent(retenir);

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        document.getElementById('form-message-mailto').innerHTML = '<span style="color:#2d6a4f;">✓ Sauvegardé.</span>';
        reponseValidee = true;
        document.getElementById('reponse-mailto').disabled = true;
        var btn = document.querySelector('#openQuestion .btn-nav');
        if (btn) btn.disabled = true;
        updateSlides();
        // Si c'était le dernier slide, on déclenche le message de fin
        if (slideIndex === slidesData.length - 1) {
          setTimeout(function() {
            afficherMessageFin();
          }, 800);
        } else {
          setTimeout(function() {
            if (slideIndex < slidesData.length - 1) { slideIndex++; updateSlides(); }
          }, 1000);
        }
      } else {
        document.getElementById('form-message-mailto').innerHTML = '<span style="color:#c62828;">Erreur : ' + (data.message || '') + '</span>';
      }
    })
    .catch(function() {
      document.getElementById('form-message-mailto').innerHTML = '<span style="color:#c62828;">Erreur réseau.</span>';
    });
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
  chargerArticle();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', demarrer);
} else {
  demarrer();
}
