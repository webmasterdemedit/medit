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
