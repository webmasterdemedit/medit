// ============================================================
// data-manager.js - OPTIMISÉ (1 REQUÊTE)
// ============================================================

var DataManager = {

    // ============================================================
    // CHARGER - Une seule requête getTout
    // ============================================================
    charger: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        console.log('🌐 Chargement depuis le serveur (1 requête)...');
        var url = CONFIG.SCRIPT_URL + '?action=getTout&nom=' + encodeURIComponent(id);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    // S'assurer que toutes les propriétés existent
                    data.livrets = data.livrets || [];
                    data.chapitres = data.chapitres || [];
                    data.tousLesChapitres = data.tousLesChapitres || [];
                    data.chapitresComplets = data.chapitresComplets || {};
                    data.reponses = data.reponses || [];
                    data.niveau = data.niveau || 0;
                    data.description = data.description || '';
                    data.mdp = data.mdp || '';
                    data.contact = data.contact || '';
                    data.auteur = data.auteur || '';
                    data.dateInscription = data.dateInscription || '';
                    data.messagePerso = data.messagePerso || '';
                    data.disciplines = data.disciplines || '';
                    data.historique = data.historique || [];
                    
                    console.log('✅ Données chargées en 1 requête');
                    console.log('📚 ' + data.livrets.length + ' livrets');
                    console.log('📖 ' + data.tousLesChapitres.length + ' chapitres (tous)');
                    console.log('📖 ' + data.chapitres.length + ' chapitres (niveau ' + data.niveau + ')');
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
    // RÉCUPÉRER LES DONNÉES (depuis le cache)
    // ============================================================
    getChapitre: function(chapitreId) {
        // Récupère depuis le cache du dernier chargement
        var cache = this._dernierChargement;
        if (cache && cache.chapitresComplets && cache.chapitresComplets[chapitreId]) {
            return cache.chapitresComplets[chapitreId];
        }
        return null;
    },

    getChapitres: function() {
        var cache = this._dernierChargement;
        if (cache && cache.chapitres) {
            return cache.chapitres;
        }
        return [];
    },

    getTousLesChapitres: function() {
        var cache = this._dernierChargement;
        if (cache && cache.tousLesChapitres) {
            return cache.tousLesChapitres;
        }
        return [];
    },

    getLivrets: function() {
        var cache = this._dernierChargement;
        if (cache && cache.livrets) {
            return cache.livrets;
        }
        return [];
    },

    getReponses: function() {
        var cache = this._dernierChargement;
        if (cache && cache.reponses) {
            return cache.reponses;
        }
        return [];
    },

    getNiveau: function() {
        var cache = this._dernierChargement;
        if (cache && cache.niveau !== undefined) {
            return cache.niveau;
        }
        return 0;
    },

    getDescriptionNiveau: function() {
        var cache = this._dernierChargement;
        if (cache && cache.description) {
            return cache.description;
        }
        return '';
    },

    getDateInscription: function() {
        var cache = this._dernierChargement;
        if (cache && cache.dateInscription) {
            return cache.dateInscription;
        }
        return null;
    },

    getContact: function() {
        var cache = this._dernierChargement;
        if (cache && cache.contact) {
            return cache.contact;
        }
        return '';
    },

    getMessagePerso: function() {
        var cache = this._dernierChargement;
        if (cache && cache.messagePerso) {
            return cache.messagePerso;
        }
        return '';
    },

    getDisciplines: function() {
        var cache = this._dernierChargement;
        if (cache && cache.disciplines) {
            return cache.disciplines;
        }
        return '';
    },

    getMdp: function() {
        var cache = this._dernierChargement;
        if (cache && cache.mdp) {
            return cache.mdp;
        }
        return '';
    },

    getHistorique: function() {
        var cache = this._dernierChargement;
        if (cache && cache.historique) {
            return cache.historique;
        }
        return [];
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
    // GET ANNOTATIONS
    // ============================================================
    getAnnotations: function(chapitreId) {
        var reponses = this.getReponses();
        for (var i = 0; i < reponses.length; i++) {
            if (reponses[i].chapitreId === chapitreId) {
                return reponses[i].annotations || '';
            }
        }
        return '';
    },

    // ============================================================
    // GET REVISE STATUS
    // ============================================================
    getReviseStatus: function(chapitreId) {
        var reponses = this.getReponses();
        for (var i = 0; i < reponses.length; i++) {
            if (reponses[i].chapitreId === chapitreId) {
                return reponses[i].revise || '0';
            }
        }
        return '0';
    },

    // ============================================================
    // CACHE
    // ============================================================
    _dernierChargement: null,

    // ============================================================
    // UTILITAIRES
    // ============================================================
    rafraichir: function() {
        this._dernierChargement = null;
        return this.charger();
    },

    invalider: function() {
        this._dernierChargement = null;
        console.log('🗑️ Cache vidé');
    },

    aUnCache: function() {
        return this._dernierChargement !== null;
    },

    getCacheForce: function(id) {
        // Pour compatibilité avec l'ancien code
        return this._dernierChargement;
    }
};

// ============================================================
// FONCTIONS GLOBALES (compatibilité)
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
