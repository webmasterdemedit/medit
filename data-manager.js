// ============================================================
// data-manager.js - OPTIMISÉ (1 seule requête)
// ============================================================

var DataManager = {

    charger: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        console.log('🌐 Chargement depuis le serveur...');
        
        // 🔥 UNE SEULE REQUÊTE qui récupère TOUT
        var url = CONFIG.SCRIPT_URL + '?action=getTout&nom=' + encodeURIComponent(id);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    // On s'assure que les données sont complètes
                    data.livrets = data.livrets || [];
                    data.chapitres = data.chapitres || [];
                    data.reponses = data.reponses || [];
                    data.niveau = data.niveau || 0;
                    
                    console.log('✅ Données chargées en 1 requête');
                    console.log('📚 ' + data.livrets.length + ' livrets');
                    console.log('📖 ' + data.chapitres.length + ' chapitres');
                    console.log('✏️ ' + data.reponses.length + ' réponses');
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur de chargement');
                }
            })
            .catch(function(error) {
                console.error('❌ Erreur:', error);
                throw error;
            });
    },

    // ============================================================
    // SAUVEGARDES (inchangées)
    // ============================================================
    sauvegarderOrdre: function(chapitreId, titre, ordreDonne, bonnes, total, tempsPasse) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return Promise.reject('Non connecté');

        var url = CONFIG.SCRIPT_URL + '?action=saveOrdre' +
            '&nom=' + encodeURIComponent(id) +
            '&chapitreId=' + encodeURIComponent(chapitreId) +
            '&titre=' + encodeURIComponent(titre) +
            '&ordreDonne=' + encodeURIComponent(ordreDonne) +
            '&bonnes=' + encodeURIComponent(bonnes) +
            '&total=' + encodeURIComponent(total) +
            '&tempsPasse=' + encodeURIComponent(tempsPasse);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur');
                }
            });
    },

    sauvegarderCarte: function(chapitreId, titre, cartes, bonnes, total, tempsPasse) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return Promise.reject('Non connecté');

        var url = CONFIG.SCRIPT_URL + '?action=saveCarte' +
            '&nom=' + encodeURIComponent(id) +
            '&chapitreId=' + encodeURIComponent(chapitreId) +
            '&titre=' + encodeURIComponent(titre) +
            '&cartes=' + encodeURIComponent(cartes) +
            '&bonnes=' + encodeURIComponent(bonnes) +
            '&total=' + encodeURIComponent(total) +
            '&tempsPasse=' + encodeURIComponent(tempsPasse);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur');
                }
            });
    },

    sauvegarderAnnotation: function(chapitreId, slide, annotation) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return Promise.reject('Non connecté');

        var url = CONFIG.SCRIPT_URL + '?action=saveAnnotation' +
            '&nom=' + encodeURIComponent(id) +
            '&chapitreId=' + encodeURIComponent(chapitreId) +
            '&slide=' + encodeURIComponent(slide) +
            '&annotation=' + encodeURIComponent(annotation);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur');
                }
            });
    },

    sauvegarderReponseOuverte: function(chapitreId, reponse) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return Promise.reject('Non connecté');

        var url = CONFIG.SCRIPT_URL + '?action=saveReponseOuverte' +
            '&nom=' + encodeURIComponent(id) +
            '&chapitreId=' + encodeURIComponent(chapitreId) +
            '&reponseOuverte=' + encodeURIComponent(reponse);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur');
                }
            });
    },

    sauvegarderQuiz: function(chapitreId, titre, choixQcm, bonnes, total, tempsPasse) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return Promise.reject('Non connecté');

        var url = CONFIG.SCRIPT_URL + '?action=saveQuiz' +
            '&nom=' + encodeURIComponent(id) +
            '&chapitreId=' + encodeURIComponent(chapitreId) +
            '&titre=' + encodeURIComponent(titre) +
            '&choixQcm=' + encodeURIComponent(choixQcm) +
            '&bonnes=' + encodeURIComponent(bonnes) +
            '&total=' + encodeURIComponent(total) +
            '&tempsPasse=' + encodeURIComponent(tempsPasse);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur');
                }
            });
    },

    sauvegarderLecture: function(chapitreId, titre) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return Promise.reject('Non connecté');

        var url = CONFIG.SCRIPT_URL + '?action=saveLecture' +
            '&nom=' + encodeURIComponent(id) +
            '&chapitreId=' + encodeURIComponent(chapitreId) +
            '&titre=' + encodeURIComponent(titre);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur');
                }
            });
    },

    marquerRevise: function(chapitreId, revise) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return Promise.reject('Non connecté');

        var url = CONFIG.SCRIPT_URL + '?action=markRevised' +
            '&nom=' + encodeURIComponent(id) +
            '&chapitreId=' + encodeURIComponent(chapitreId) +
            '&revise=' + encodeURIComponent(revise ? '1' : '0');

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur');
                }
            });
    },

    // ============================================================
    // UTILITAIRES
    // ============================================================
    rafraichir: function() {
        return this.charger();
    },

    invalider: function() {
        console.log('🗑️ Cache vidé');
    },

    aUnCache: function() {
        return false;
    }
};

// ============================================================
// FONCTIONS GLOBALES
// ============================================================

function chargerDonnees() { return DataManager.charger(); }
function sauvegarderOrdre(chapitreId, titre, ordreDonne, bonnes, total, tempsPasse) {
    return DataManager.sauvegarderOrdre(chapitreId, titre, ordreDonne, bonnes, total, tempsPasse);
}
function sauvegarderCarte(chapitreId, titre, cartes, bonnes, total, tempsPasse) {
    return DataManager.sauvegarderCarte(chapitreId, titre, cartes, bonnes, total, tempsPasse);
}
function sauvegarderAnnotation(chapitreId, slide, annotation) {
    return DataManager.sauvegarderAnnotation(chapitreId, slide, annotation);
}
function sauvegarderReponseOuverte(chapitreId, reponse) {
    return DataManager.sauvegarderReponseOuverte(chapitreId, reponse);
}
function sauvegarderQuiz(chapitreId, titre, choixQcm, bonnes, total, tempsPasse) {
    return DataManager.sauvegarderQuiz(chapitreId, titre, choixQcm, bonnes, total, tempsPasse);
}
function sauvegarderLecture(chapitreId, titre) {
    return DataManager.sauvegarderLecture(chapitreId, titre);
}
function marquerRevise(chapitreId, revise) {
    return DataManager.marquerRevise(chapitreId, revise);
}
