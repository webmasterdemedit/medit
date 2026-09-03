// ============================================================
// data-manager.js - SANS CACHE (toujours frais)
// ============================================================

var DataManager = {

    // ============================================================
    // CHARGER - Toujours depuis le serveur
    // ============================================================
    charger: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        console.log('🌐 Chargement depuis le serveur...');
        var url = CONFIG.SCRIPT_URL + '?action=getTout&nom=' + encodeURIComponent(id);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    return DataManager.ajouterLivrets(data);
                } else {
                    throw new Error(data.message || 'Erreur de chargement');
                }
            })
            .then(function(data) {
                // === RÉCUPÉRER TOUS LES CHAPITRES (sans filtre niveau) ===
                return DataManager.ajouterTousChapitres(data);
            })
            .then(function(data) {
                console.log('✅ Données chargées');
                return data;
            })
            .catch(function(error) {
                console.error('❌ Erreur:', error);
                throw error;
            });
    },

    // ============================================================
    // AJOUTER LES LIVRETS
    // ============================================================
    ajouterLivrets: function(data) {
        if (data.livrets && data.livrets.length > 0) {
            console.log('📚 ' + data.livrets.length + ' livrets déjà présents');
            return Promise.resolve(data);
        }

        var url = CONFIG.SCRIPT_URL + '?action=getLivrets';

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(result) {
                if (result.success && result.livrets) {
                    data.livrets = result.livrets;
                    console.log('📚 ' + data.livrets.length + ' livrets chargés');
                } else {
                    data.livrets = [];
                    console.log('📚 Aucun livret trouvé');
                }
                return data;
            })
            .catch(function(err) {
                console.warn('⚠️ Erreur chargement livrets:', err);
                data.livrets = [];
                return data;
            });
    },

    // ============================================================
    // AJOUTER TOUS LES CHAPITRES (sans filtre niveau)
    // ============================================================
    ajouterTousChapitres: function(data) {
        var url = CONFIG.SCRIPT_URL + '?action=getChapitresTous';

        console.log('📡 Récupération de tous les chapitres...');
        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(result) {
                if (result.success && result.chapitres) {
                    // On garde les chapitres filtrés dans data.chapitres (pour la logique existante)
                    // Et on ajoute data.tousLesChapitres pour les livrets verrouillés
                    data.tousLesChapitres = result.chapitres;
                    console.log('📚 ' + result.chapitres.length + ' chapitres (tous niveaux) chargés');
                } else {
                    data.tousLesChapitres = [];
                    console.log('📚 Aucun chapitre trouvé');
                }
                return data;
            })
            .catch(function(err) {
                console.warn('⚠️ Erreur chargement tous les chapitres:', err);
                data.tousLesChapitres = [];
                return data;
            });
    },

    // ============================================================
    // RÉCUPÉRER LES DONNÉES
    // ============================================================
    getChapitre: function(chapitreId) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return null;
        return null;
    },

    getChapitres: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return [];
        return [];
    },

    getLivrets: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return [];
        return [];
    },

    getReponses: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return [];
        return [];
    },

    getNiveau: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return 0;
        return 0;
    },

    getDescriptionNiveau: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return '';
        return '';
    },

    getDateInscription: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return null;
        return null;
    },

    getContact: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return '';
        return '';
    },

    getMessagePerso: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return '';
        return '';
    },

    getDisciplines: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return '';
        return '';
    },

    getMdp: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return '';
        return '';
    },

    // ============================================================
    // SAUVEGARDES
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
        console.log('🗑️ Cache vidé (plus utilisé)');
    },

    aUnCache: function() {
        return false;
    }
};

// ============================================================
// FONCTIONS GLOBALES
// ============================================================

function chargerDonnees() { return DataManager.charger(); }
function getChapitresDuNiveau() { return DataManager.getChapitres(); }
function getReponsesEtudiant() { return DataManager.getReponses(); }
function getNiveauEtudiant() { return DataManager.getNiveau(); }
function getDescriptionNiveau() { return DataManager.getDescriptionNiveau(); }
function getDateInscription() { return DataManager.getDateInscription(); }
function getContact() { return DataManager.getContact(); }
function getMessagePerso() { return DataManager.getMessagePerso(); }
function getDisciplines() { return DataManager.getDisciplines(); }
function getMdp() { return DataManager.getMdp(); }
function getLivrets() { return DataManager.getLivrets(); }

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
function getAnnotations(chapitreId) {
    return DataManager.getAnnotations(chapitreId);
}
function getReviseStatus(chapitreId) {
    return DataManager.getReviseStatus(chapitreId);
}
