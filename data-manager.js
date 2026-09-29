// ============================================================
// data-manager.js - OPTIMISÉ (cache localStorage instantané)
// + Support images par livret
// ============================================================

// Clés de cache
var CLE_CACHE      = 'qiraat_data_v1';
var CLE_TIMESTAMP  = 'qiraat_data_ts';
var CLE_NOM        = 'qiraat_data_nom';
var CLE_IMAGES     = 'qiraat_images_'; // suffixé par nom du livret
var DUREE_CACHE_MS = 30 * 60 * 1000;   // 30 min

var DataManager = {

    // ============================================================
    // CHARGER - cache localStorage instantané + refresh arrière-plan
    // ============================================================
    charger: function(forceRefresh) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        // 1. Cache mémoire déjà prêt
        if (!forceRefresh && this._dernierChargement && this._dernierNom === id) {
            return Promise.resolve(this._dernierChargement);
        }

        // 2. Cache localStorage
        if (!forceRefresh) {
            var cache = this._lireCache(id);
            if (cache) {
                this._dernierChargement = cache;
                this._dernierNom = id;

                // Rafraîchir en arrière-plan si périmé
                if (this._cachePerime()) {
                    this._refreshArrierePlan(id);
                }
                return Promise.resolve(cache);
            }
        }

        // 3. Appel API
        console.log('🌐 Chargement depuis le serveur...');
        var url = CONFIG.SCRIPT_URL + '?action=getTout&nom=' + encodeURIComponent(id);
        var self = this;

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    data.livrets            = data.livrets || [];
                    data.chapitres          = data.chapitres || [];
                    data.tousLesChapitres   = data.tousLesChapitres || [];
                    data.chapitresComplets  = data.chapitresComplets || {};
                    data.reponses           = data.reponses || [];
                    data.niveau             = data.niveau || 0;
                    data.description        = data.description || '';
                    data.mdp                = data.mdp || '';
                    data.contact            = data.contact || '';
                    data.auteur             = data.auteur || '';
                    data.dateInscription    = data.dateInscription || '';
                    data.messagePerso       = data.messagePerso || '';
                    data.disciplines        = data.disciplines || '';
                    data.historique         = data.historique || [];

                    self._dernierChargement = data;
                    self._dernierNom = id;
                    self._ecrireCache(id, data);

                    console.log('✅ Données chargées');
                    console.log('📚 ' + data.livrets.length + ' livrets');
                    console.log('📖 ' + data.tousLesChapitres.length + ' chapitres');
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
    // CACHE INTERNE
    // ============================================================
    _dernierChargement: null,
    _dernierNom: null,
    _cacheImages: {},

    _lireCache: function(id) {
        try {
            var nomStocke = localStorage.getItem(CLE_NOM);
            if (nomStocke !== id) return null;
            var json = localStorage.getItem(CLE_CACHE);
            if (!json) return null;
            return JSON.parse(json);
        } catch(e) {
            console.warn('⚠️ Erreur lecture cache:', e);
            return null;
        }
    },

    _ecrireCache: function(id, data) {
        try {
            localStorage.setItem(CLE_CACHE, JSON.stringify(data));
            localStorage.setItem(CLE_TIMESTAMP, Date.now().toString());
            localStorage.setItem(CLE_NOM, id);
        } catch(e) {
            console.warn('⚠️ Erreur écriture cache (quota ?):', e);
        }
    },

    _cachePerime: function() {
        var ts = localStorage.getItem(CLE_TIMESTAMP);
        if (!ts) return true;
        return (Date.now() - parseInt(ts)) > DUREE_CACHE_MS;
    },

    _refreshArrierePlan: function(id) {
        var self = this;
        var url = CONFIG.SCRIPT_URL + '?action=getTout&nom=' + encodeURIComponent(id);
        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    data.livrets            = data.livrets || [];
                    data.chapitres          = data.chapitres || [];
                    data.tousLesChapitres   = data.tousLesChapitres || [];
                    data.chapitresComplets  = data.chapitresComplets || {};
                    data.reponses           = data.reponses || [];
                    data.niveau             = data.niveau || 0;
                    self._dernierChargement = data;
                    self._ecrireCache(id, data);
                    console.log('🔄 Cache rafraîchi en arrière-plan');
                }
            })
            .catch(function(err) {
                console.warn('⚠️ Échec refresh arrière-plan:', err);
            });
    },

    // ============================================================
    // GETTERS (depuis cache mémoire)
    // ============================================================
    getChapitre: function(chapitreId) {
        var cache = this._dernierChargement;
        if (cache && cache.chapitresComplets && cache.chapitresComplets[chapitreId]) {
            return cache.chapitresComplets[chapitreId];
        }
        return null;
    },

    getChapitreComplet: function(chapitreId) {
        return this.getChapitre(chapitreId);
    },

    getChapitres: function() {
        return (this._dernierChargement && this._dernierChargement.chapitres) || [];
    },

    getTousLesChapitres: function() {
        return (this._dernierChargement && this._dernierChargement.tousLesChapitres) || [];
    },

    getLivrets: function() {
        return (this._dernierChargement && this._dernierChargement.livrets) || [];
    },

    getReponses: function() {
        return (this._dernierChargement && this._dernierChargement.reponses) || [];
    },

    getNiveau: function() {
        return (this._dernierChargement && this._dernierChargement.niveau) || 0;
    },

    getDescriptionNiveau: function() {
        return (this._dernierChargement && this._dernierChargement.description) || '';
    },

    getDateInscription: function() {
        return (this._dernierChargement && this._dernierChargement.dateInscription) || null;
    },

    getContact: function() {
        return (this._dernierChargement && this._dernierChargement.contact) || '';
    },

    getMessagePerso: function() {
        return (this._dernierChargement && this._dernierChargement.messagePerso) || '';
    },

    getDisciplines: function() {
        return (this._dernierChargement && this._dernierChargement.disciplines) || '';
    },

    getMdp: function() {
        return (this._dernierChargement && this._dernierChargement.mdp) || '';
    },

    getHistorique: function() {
        return (this._dernierChargement && this._dernierChargement.historique) || [];
    },

    // ============================================================
    // 🖼️ IMAGES D'UN LIVRET (cache mémoire + localStorage)
    // ============================================================
    chargerImages: function(nomLivret) {
        var self = this;
        if (this._cacheImages[nomLivret]) {
            return Promise.resolve(this._cacheImages[nomLivret]);
        }

        // Cache localStorage
        try {
            var cachedJson = localStorage.getItem(CLE_IMAGES + nomLivret);
            if (cachedJson) {
                var cached = JSON.parse(cachedJson);
                this._cacheImages[nomLivret] = cached;
                return Promise.resolve(cached);
            }
        } catch(e) {}

        var url = CONFIG.SCRIPT_URL + '?action=getImages&livret=' + encodeURIComponent(nomLivret);
        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success && data.images) {
                    self._cacheImages[nomLivret] = data.images;
                    try {
                        localStorage.setItem(CLE_IMAGES + nomLivret, JSON.stringify(data.images));
                    } catch(e) {}
                    return data.images;
                }
                return {};
            })
            .catch(function() { return {}; });
    },

    getImagesCache: function(nomLivret) {
        return this._cacheImages[nomLivret] || {};
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

        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) return data;
                else throw new Error(data.message || 'Erreur');
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

        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) return data;
                else throw new Error(data.message || 'Erreur');
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

        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) return data;
                else throw new Error(data.message || 'Erreur');
            });
    },

    sauvegarderReponseOuverte: function(chapitreId, reponse) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return Promise.reject('Non connecté');

        var url = CONFIG.SCRIPT_URL + '?action=saveReponseOuverte' +
            '&nom=' + encodeURIComponent(id) +
            '&chapitreId=' + encodeURIComponent(chapitreId) +
            '&reponseOuverte=' + encodeURIComponent(reponse);

        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) return data;
                else throw new Error(data.message || 'Erreur');
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

        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) return data;
                else throw new Error(data.message || 'Erreur');
            });
    },

    sauvegarderLecture: function(chapitreId, titre) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return Promise.reject('Non connecté');

        var url = CONFIG.SCRIPT_URL + '?action=saveLecture' +
            '&nom=' + encodeURIComponent(id) +
            '&chapitreId=' + encodeURIComponent(chapitreId) +
            '&titre=' + encodeURIComponent(titre);

        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) return data;
                else throw new Error(data.message || 'Erreur');
            });
    },

    marquerRevise: function(chapitreId, revise) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return Promise.reject('Non connecté');

        var url = CONFIG.SCRIPT_URL + '?action=markRevised' +
            '&nom=' + encodeURIComponent(id) +
            '&chapitreId=' + encodeURIComponent(chapitreId) +
            '&revise=' + encodeURIComponent(revise ? '1' : '0');

        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) return data;
                else throw new Error(data.message || 'Erreur');
            });
    },

    // ============================================================
    // GET ANNOTATIONS / REVISE
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
    // UTILITAIRES
    // ============================================================
    rafraichir: function() {
        this._dernierChargement = null;
        return this.charger(true);
    },

    invalider: function() {
        this._dernierChargement = null;
        this._dernierNom = null;
        console.log('🗑️ Cache mémoire vidé');
    },

    viderTout: function() {
        this._dernierChargement = null;
        this._dernierNom = null;
        this._cacheImages = {};
        try {
            localStorage.removeItem(CLE_CACHE);
            localStorage.removeItem(CLE_TIMESTAMP);
            localStorage.removeItem(CLE_NOM);
            // Vider toutes les images
            for (var i = localStorage.length - 1; i >= 0; i--) {
                var key = localStorage.key(i);
                if (key && key.indexOf(CLE_IMAGES) === 0) {
                    localStorage.removeItem(key);
                }
            }
        } catch(e) {}
        console.log('🗑️ Cache complet vidé');
    },

    aUnCache: function() {
        return this._dernierChargement !== null;
    },

    getCacheForce: function(id) {
        // Retourne le cache mémoire OU le cache localStorage
        if (this._dernierChargement) return this._dernierChargement;
        if (id) return this._lireCache(id);
        return null;
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

function chargerImagesLivret(nomLivret) { return DataManager.chargerImages(nomLivret); }
function getImagesLivretCache(nomLivret) { return DataManager.getImagesCache(nomLivret); }

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
