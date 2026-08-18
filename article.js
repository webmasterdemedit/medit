// ============================================================
// article.js - Affichage des articles avec slides, quiz, questions ouvertes
// ============================================================

var articleData = null;
var slides = [];
var quizData = [];
var questionOuverte = '';
var currentSlide = 0;
var reponsesQuiz = {};
var annotations = {};

// ============================================================
// CHARGER L'ARTICLE
// ============================================================
function chargerArticle() {
    var urlParams = new URLSearchParams(window.location.search);
    var id = urlParams.get('id');
    
    if (!id) {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('erreur').style.display = 'block';
        return;
    }

    DataManager.charger()
        .then(function(data) {
            var post = data.articlesComplets ? data.articlesComplets[id] : null;
            if (!post) {
                post = data.posts ? data.posts.find(function(p) { return p.id === id; }) : null;
            }
            
            if (!post) {
                document.getElementById('loader').style.display = 'none';
                document.getElementById('erreur').style.display = 'block';
                return;
            }
            
            articleData = post;
            afficherArticle(post);
        })
        .catch(function(error) {
            console.error('Erreur:', error);
            document.getElementById('loader').style.display = 'none';
            document.getElementById('erreur').style.display = 'block';
        });
}

// ============================================================
// AFFICHER L'ARTICLE
// ============================================================
function afficherArticle(post) {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('article-charge').style.display = 'block';
    
    // Titre
    document.getElementById('article-titre').innerHTML = post.titre || 'Sans titre';
    document.getElementById('postLabel').textContent = post.categorie || 'Méditation';
    
    // Date
    if (post.date) {
        var d = new Date(post.date);
        if (!isNaN(d.getTime())) {
            document.getElementById('postDate').textContent = d.toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric'
            });
        }
    }
    
    // Parser le contenu
    var contenu = post.contenu || '';
    parserContenu(contenu);
    
    // Afficher la première slide
    afficherSlide(0);
}

// ============================================================
// PARSER LE CONTENU
// ============================================================
function parserContenu(contenu) {
    slides = [];
    quizData = [];
    questionOuverte = '';
    reponsesQuiz = {};
    annotations = {};
    
    if (!contenu) {
        slides.push('Contenu vide');
        return;
    }
    
    // Découper par " | "
    var elements = contenu.split(' | ');
    var quizCourant = null;
    
    for (var i = 0; i < elements.length; i++) {
        var ligne = elements[i].trim();
        if (!ligne) continue;
        
        if (ligne.startsWith('-s-')) {
            slides.push(ligne.replace('-s-', '').trim());
        } else if (ligne.startsWith('-q-')) {
            quizCourant = {
                question: ligne.replace('-q-', '').trim(),
                reponses: []
            };
            quizData.push(quizCourant);
        } else if (ligne.startsWith('-v-')) {
            if (quizCourant) {
                quizCourant.reponses.push({
                    texte: ligne.replace('-v-', '').trim(),
                    correct: true
                });
            }
        } else if (ligne.startsWith('-f-')) {
            if (quizCourant) {
                quizCourant.reponses.push({
                    texte: ligne.replace('-f-', '').trim(),
                    correct: false
                });
            }
        } else if (ligne.startsWith('-qs-')) {
            questionOuverte = ligne.replace('-qs-', '').trim();
        }
    }
    
    if (slides.length === 0) {
        slides.push('Contenu vide');
    }
    
    // Charger les annotations existantes
    chargerAnnotations();
}

// ============================================================
// AFFICHER UNE SLIDE
// ============================================================
function afficherSlide(index) {
    if (index < 0 || index >= slides.length) return;
    currentSlide = index;
    
    var wrapper = document.getElementById('slideWrapper');
    var slideText = slides[index] || 'Slide vide';
    
    // Nettoyer le texte
    slideText = slideText.replace(/\n/g, '<br>');
    slideText = slideText.replace(/"/g, '&quot;');
    
    wrapper.innerHTML = '<div class="paragraphe-item"><div class="slide-content">' + slideText + '</div></div>';
    
    document.getElementById('compteur').textContent = (index + 1) + ' / ' + slides.length;
    mettreAJourDots();
    verifierAnnotation(index);
    
    // Afficher le quiz et la question ouverte UNIQUEMENT sur la dernière slide
    var slideQuiz = document.getElementById('slideQuiz');
    if (index === slides.length - 1) {
        slideQuiz.style.display = 'block';
        if (quizData.length > 0) afficherQuiz();
        if (questionOuverte) afficherQuestionOuverte();
    } else {
        slideQuiz.style.display = 'none';
    }
}

// ============================================================
// METTRE À JOUR LES POINTS (DOTS)
// ============================================================
function mettreAJourDots() {
    var container = document.getElementById('dotsContainerOutside');
    if (!container) return;
    
    var html = '';
    for (var i = 0; i < slides.length; i++) {
        var activeClass = (i === currentSlide) ? ' active' : '';
        html += '<span class="dot' + activeClass + '" onclick="afficherSlide(' + i + ')"></span>';
    }
    container.innerHTML = html;
}

// ============================================================
// NAVIGATION (flèches clavier)
// ============================================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentSlide < slides.length - 1) {
            afficherSlide(currentSlide + 1);
        }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentSlide > 0) {
            afficherSlide(currentSlide - 1);
        }
    }
});

// ============================================================
// ANNOTATIONS
// ============================================================
function chargerAnnotations() {
    var id = localStorage.getItem('etudiant_id');
    if (!id) return;
    
    var reponses = DataManager.getReponses();
    for (var i = 0; i < reponses.length; i++) {
        if (reponses[i].articleId === articleData.id) {
            var ann = reponses[i].annotations || '';
            if (ann) {
                var parts = ann.split('|');
                for (var j = 0; j < parts.length; j++) {
                    var kv = parts[j].split(':');
                    if (kv.length === 2) {
                        annotations[kv[0]] = kv[1];
                    }
                }
            }
            break;
        }
    }
}

function verifierAnnotation(slideIndex) {
    var btn = document.getElementById('btnAnnotate');
    var icon = document.getElementById('annotateIcon');
    var key = 'slide' + slideIndex;
    if (annotations[key]) {
        icon.textContent = '✏️';
        btn.style.opacity = '1';
    } else {
        icon.textContent = '✏';
        btn.style.opacity = '0.5';
    }
}

document.getElementById('btnAnnotate').addEventListener('click', function() {
    ouvrirAnnotation(currentSlide);
});

function ouvrirAnnotation(slideIndex) {
    var popup = document.getElementById('annotatePopup');
    var textarea = document.getElementById('annotateTextarea');
    var slideNum = document.getElementById('annotateSlideNum');
    
    slideNum.textContent = slideIndex + 1;
    var key = 'slide' + slideIndex;
    textarea.value = annotations[key] || '';
    popup.style.display = 'block';
    textarea.focus();
}

document.getElementById('annotateClose').addEventListener('click', function() {
    sauvegarderAnnotation();
    document.getElementById('annotatePopup').style.display = 'none';
});

document.getElementById('annotateTextarea').addEventListener('input', function() {
    sauvegarderAnnotation();
});

function sauvegarderAnnotation() {
    var textarea = document.getElementById('annotateTextarea');
    var slideNum = parseInt(document.getElementById('annotateSlideNum').textContent) - 1;
    var key = 'slide' + slideNum;
    var texte = textarea.value.trim();
    
    if (texte) {
        annotations[key] = texte;
    } else {
        delete annotations[key];
    }
    
    var status = document.getElementById('annotateStatus');
    status.textContent = '✓ Sauvegardé';
    status.style.color = '#2d6a4f';
    setTimeout(function() {
        status.textContent = '';
    }, 1500);
    
    var articleId = articleData.id;
    DataManager.sauvegarderAnnotation(articleId, slideNum, texte)
        .then(function() {
            verifierAnnotation(slideNum);
        })
        .catch(function(err) {
            console.error('Erreur sauvegarde annotation:', err);
            status.textContent = '❌ Erreur';
            status.style.color = '#e74c3c';
        });
}

document.getElementById('annotatePopup').addEventListener('click', function(e) {
    if (e.target === this) {
        sauvegarderAnnotation();
        this.style.display = 'none';
    }
});

// ============================================================
// QUIZ - TOUS LES QUIZ AFFICHÉS ENSEMBLE
// ============================================================
function afficherQuiz() {
    var container = document.getElementById('quizQuestionsContainer');
    if (!container) return;
    
    if (quizData.length === 0) {
        container.innerHTML = '<p>Aucun quiz pour ce texte.</p>';
        return;
    }
    
    var html = '';
    quizData.forEach(function(q, qi) {
        html += '<div class="quiz-item" data-quiz="' + qi + '">';
        html += '<p class="quiz-question">' + q.question + '</p>';
        html += '<div class="quiz-options">';
        q.reponses.forEach(function(r, ri) {
            var checked = reponsesQuiz[qi] === ri ? 'checked' : '';
            html += '<label class="quiz-option">';
            html += '<input type="radio" name="quiz_' + qi + '" value="' + ri + '" ' + checked + ' onchange="repondreQuiz(' + qi + ', ' + ri + ')">';
            html += r.texte;
            html += '</label>';
        });
        html += '</div>';
        html += '</div>';
    });
    container.innerHTML = html;
}

function repondreQuiz(qi, ri) {
    reponsesQuiz[qi] = ri;
    verifierQuiz();
}

function verifierQuiz() {
    var bonnes = 0;
    var total = quizData.length;
    
    quizData.forEach(function(q, qi) {
        var reponseChoisie = reponsesQuiz[qi];
        if (reponseChoisie !== undefined) {
            if (q.reponses[reponseChoisie].correct) {
                bonnes++;
            }
        }
    });
    
    document.getElementById('quiz-score').textContent = bonnes;
    document.getElementById('quiz-total').textContent = total;
    
    var message = document.getElementById('quiz-message');
    if (total > 0 && bonnes >= Math.ceil(total / 2)) {
        message.textContent = '✅ Bravo ! Vous avez validé ce quiz !';
        message.style.color = '#2d6a4f';
    } else if (total > 0) {
        message.textContent = '📖 Revoyez le texte et réessayez.';
        message.style.color = '#6b7a8a';
    }
}

// ============================================================
// QUESTION OUVERTE
// ============================================================
function afficherQuestionOuverte() {
    var container = document.getElementById('questionOuverteTexte');
    if (!container) return;
    container.textContent = questionOuverte || 'Qu\'est-ce que ce texte vous a inspiré ?';
    
    var reponses = DataManager.getReponses();
    for (var i = 0; i < reponses.length; i++) {
        if (reponses[i].articleId === articleData.id) {
            var rep = reponses[i].reponseOuverte || '';
            if (rep) {
                document.getElementById('reponse-mailto').value = rep;
            }
            break;
        }
    }
}

function validerReponse() {
    var reponse = document.getElementById('reponse-mailto').value.trim();
    if (!reponse) {
        document.getElementById('form-message-mailto').textContent = 'Veuillez écrire une réponse.';
        document.getElementById('form-message-mailto').style.color = '#e74c3c';
        return;
    }
    
    DataManager.sauvegarderReponseOuverte(articleData.id, reponse)
        .then(function() {
            document.getElementById('form-message-mailto').textContent = '✅ Réponse enregistrée avec succès !';
            document.getElementById('form-message-mailto').style.color = '#2d6a4f';
        })
        .catch(function(err) {
            document.getElementById('form-message-mailto').textContent = '❌ Erreur : ' + err.message;
            document.getElementById('form-message-mailto').style.color = '#e74c3c';
        });
}

// ============================================================
// INIT
// ============================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', chargerArticle);
} else {
    chargerArticle();
}
