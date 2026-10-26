// data-manager.js
// - Navigation normale  → cache
// - Reload (F5 / Ctrl+R / Ctrl+Shift+R) → Sheet
// - Images → cache conservé
// - MODE INVITÉ : accès aux textes + quiz sans compte
// - 🆕 PSEUDO SIMPLE : sauvegarde des tentatives sous un pseudo
// ============================================================

// Clés de cache
var CLE_CACHE          = 'qiraat_data_v1';
var CLE_TIMESTAMP      = 'qiraat_data_ts';
var CLE_NOM            = 'qiraat_data_nom';
var CLE_IMAGES         = 'qiraat_images_v2_';
var CLE_SESSION_INVITE = 'qiraat_session_invite';

// ✅ Détecter un reload (F5 / Ctrl+R / Ctrl+Shift+R)
var PERF_NAV = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || performance.navigation || {};
var EST_RELOAD = PERF_NAV.type === 'reload' || PERF_NAV.type === 1;

if (EST_RELOAD) {
    try { localStorage.setItem(CLE_TIMESTAMP, '0'); } catch(e) {}
}

// ============================================================
// MODE INVITÉ : identifiant persistant pour les non-connectés
// ============================================================
function genererSessionInvite() {
    return 'invite_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
}

function getSessionInvite() {
    var sid = localStorage.getItem(CLE_SESSION_INVITE);
    if (!sid) {
        sid = genererSessionInvite();
        localStorage.setItem(CLE_SESSION_INVITE, sid);
    }
    return sid;
}

// Retourne l'identifiant à utiliser pour TOUTE action (chargement ou sauvegarde)
// - pseudo saisi → pseudo
// - sinon        → session invite
function getIdUtilisateur() {
    if (typeof AUTH !== 'undefined' && AUTH.getIdUtilisateur) {
        return AUTH.getIdUtilisateur();
    }
    // Fallback si auth.js n'est pas chargé
    return localStorage.getItem('qiraat_pseudo') || getSessionInvite();
}

function estConnecte() {
    if (typeof AUTH !== 'undefined' && AUTH.aUnPseudo) {
        return AUTH.aUnPseudo();
    }
    return !!localStorage.getItem('qiraat_pseudo');
}

var DataManager = {

    // ============================================================
    // CHARGER
    // ============================================================
    charger: function(forceRefresh) {
        var id = getIdUtilisateur();

        if (EST_RELOAD || forceRefresh) {
            console.log('🔄 Reload détecté → chargement depuis le Sheet');
            return this._fetchDepuisSheet(id);
        }

        if (this._dernierChargement && this._dernierNom === id) {
            console.log('⚡ Cache mémoire utilisé');
            return Promise.resolve(this._dernierChargement);
        }

        var cache = this._lireCache(id);
        if (cache) {
            this._dernierChargement = cache;
            this._dernierNom = id;
            console.log('⚡ Cache localStorage utilisé');
            return Promise.resolve(cache);
        }

        console.log('🌐 Pas de cache → chargement depuis le Sheet');
        return this._fetchDepuisSheet(id);
    },

    // ============================================================
    // APPEL API SHEET
    // ============================================================
    _fetchDepuisSheet: function(id) {
        var self = this;

        // Si pas de pseudo → actions publiques (pas de compte requis)
        if (!estConnecte()) {
            return this._fetchInvite();
        }

        var url = CONFIG.SCRIPT_URL + '?action=getTout&nom=' + encodeURIComponent(id);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (!data.success) {
                    throw new Error(data.message || 'Erreur de chargement');
                }

                data.themes            = data.themes || [];
                data.textes            = data.textes || [];
                data.tousLesTextes     = data.tousLesTextes || [];
                data.textesComplets    = data.textesComplets || {};
                data.reponses          = data.reponses || [];
                data.niveau            = data.niveau || 0;
                data.description       = data.description || '';
                data.mdp               = data.mdp || '';
                data.contact           = data.contact || '';
                data.auteur            = data.auteur || '';
                data.dateInscription   = data.dateInscription || '';
                data.messagePerso      = data.messagePerso || '';
                data.disciplines       = data.disciplines || '';
                data.historique        = data.historique || [];

                self._dernierChargement = data;
                self._dernierNom = id;
                self._ecrireCache(id, data);

                console.log('✅ Données chargées depuis le Sheet');
                console.log('📚 ' + data.themes.length + ' thèmes');
                console.log('📖 ' + data.tousLesTextes.length + ' textes');

                return data;
            })
            .catch(function(error) {
                console.error('❌ Erreur:', error);
                throw error;
            });
    },

    // ============================================================
    // CHARGEMENT PUBLIC (invités) : textes + thèmes, sans niveau
    // ============================================================
    _fetchInvite: function() {
        var self = this;
        var urlTextes = CONFIG.SCRIPT_URL + '?action=getTextesTous';
        var urlThemes = CONFIG.SCRIPT_URL + '?action=getThemes';

        return Promise.all([
            fetch(urlTextes).then(function(r) { return r.json(); }),
            fetch(urlThemes).then(function(r) { return r.json(); })
        ]).then(function(results) {
            var textesData = results[0];
            var themesData = results[1];

            var textes = (textesData.textes || []);

            var data = {
                niveau: 999,
                description: '',
                mdp: '',
                contact: '',
                dateInscription: '',
                messagePerso: '',
                disciplines: '',
                themes: themesData.themes || [],
                textes: textes,
                tousLesTextes: textes,
                textesComplets: {},
                reponses: [],
                historique: []
            };

            self._dernierChargement = data;
            self._dernierNom = getIdUtilisateur();
            return data;
        });
    },

    // ============================================================
    // GETTER ASYNCHRONE d'un texte complet (utile aux invités)
    // ============================================================
    getTexteAsync: function(texteId) {
        if (this._dernierChargement && this._dernierChargement.textesComplets &&
            this._dernierChargement.textesComplets[texteId]) {
            return Promise.resolve(this._dernierChargement.textesComplets[texteId]);
        }
        var url = CONFIG.SCRIPT_URL + '?action=getTexte&id=' + encodeURIComponent(texteId);
        var self = this;
        return fetch(url).then(function(r) { return r.json(); }).then(function(data) {
            if (data.success && data.texte) {
                if (self._dernierChargement) {
                    self._dernierChargement.textesComplets[texteId] = data.texte;
                }
                return data.texte;
            }
            throw new Error(data.message || 'Texte introuvable');
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

    // ============================================================
    // GETTERS (depuis cache mémoire)
    // ============================================================
    getTexte: function(texteId) {
        var cache = this._dernierChargement;
        if (cache && cache.textesComplets && cache.textesComplets[texteId]) {
            return cache.textesComplets[texteId];
        }
        return null;
    },

    getTexteComplet: function(texteId) {
        return this.getTexte(texteId);
    },

    getTextes: function() {
        return (this._dernierChargement && this._dernierChargement.textes) || [];
    },

    getTousLesTextes: function() {
        return (this._dernierChargement && this._dernierChargement.tousLesTextes) || [];
    },

    getThemes: function() {
        return (this._dernierChargement && this._dernierChargement.themes) || [];
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
    // 🖼️ IMAGES D'UN THÈME (cache mémoire + localStorage)
    // ============================================================
    chargerImagesTheme: function(nomTheme) {
        var self = this;
        if (this._cacheImages[nomTheme]) {
            return Promise.resolve(this._cacheImages[nomTheme]);
        }

        try {
            var cachedJson = localStorage.getItem(CLE_IMAGES + nomTheme);
            if (cachedJson) {
                var cached = JSON.parse(cachedJson);
                this._cacheImages[nomTheme] = cached;
                return Promise.resolve(cached);
            }
        } catch(e) {}

        var url = CONFIG.SCRIPT_URL + '?action=getImages&theme=' + encodeURIComponent(nomTheme);
        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success && data.images) {
                    self._cacheImages[nomTheme] = data.images;
                    try {
                        localStorage.setItem(CLE_IMAGES + nomTheme, JSON.stringify(data.images));
                    } catch(e) {}
                    return data.images;
                }
                return {};
            })
            .catch(function() { return {}; });
    },

    getImagesThemeCache: function(nomTheme) {
        return this._cacheImages[nomTheme] || {};
    },

    // ============================================================
    // SAUVEGARDE UNIFIÉE (1 appel = 1 tentative)
    // ============================================================
    sauvegarderTentative: function(texteId, typeExo, details, bonnes, total) {
        var url = CONFIG.SCRIPT_URL + '?action=saveTentative' +
            '&id='       + encodeURIComponent(AUTH.getIdUtilisateur()) +
            '&texteId='  + encodeURIComponent(texteId) +
            '&typeExo='  + encodeURIComponent(typeExo) +
            '&bonnes='   + encodeURIComponent(bonnes) +
            '&total='    + encodeURIComponent(total) +
            '&details='  + encodeURIComponent(JSON.stringify(details || {}));
        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) return data;
                throw new Error(data.message || 'Erreur sauvegarde');
            });
    },

    // ============================================================
    // LIRE LES TENTATIVES
    // ============================================================
    getTentatives: function(texteId) {
        var url = CONFIG.SCRIPT_URL + '?action=getTentatives' +
            '&id='      + encodeURIComponent(AUTH.getIdUtilisateur()) +
            (texteId ? '&texteId=' + encodeURIComponent(texteId) : '');
        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) return data.tentatives || [];
                return [];
            })
            .catch(function() { return []; });
    },

    // ============================================================
    // WRAPPERS DE COMPATIBILITÉ (anciens noms → sauvegarderTentative)
    // ============================================================
    sauvegarderQuiz: function(t, titre, choixQcm, b, tot) {
        return this.sauvegarderTentative(t, 'quiz', { choixQcm: choixQcm }, b, tot);
    },
    sauvegarderReponseOuverte: function(t, rep) {
        return this.sauvegarderTentative(t, 'ouverte', { texte: rep }, 0, 0);
    },
    sauvegarderAnnotation: function(t, slide, ann) {
        return this.sauvegarderTentative(t, 'annotation', { slide: slide, texte: ann }, 0, 0);
    },
    sauvegarderCarte: function(t, titre, cartes, b, tot) {
        return this.sauvegarderTentative(t, 'carte', { cartes: cartes }, b, tot);
    },
    sauvegarderOrdre: function(t, titre, ordreDonne, b, tot) {
        return this.sauvegarderTentative(t, 'ordre', { ordre: ordreDonne }, b, tot);
    },
    sauvegarderLecture: function() { return Promise.resolve(); },
    marquerRevise:      function() { return Promise.resolve(); },

    // ============================================================
    // GET ANNOTATIONS / REVISE (anciens getters, conservés vides)
    // ============================================================
    getAnnotations: function(texteId) {
        return '';
    },

    getReviseStatus: function(texteId) {
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
        if (this._dernierChargement) return this._dernierChargement;
        if (id) return this._lireCache(id);
        return null;
    }
};

// ============================================================
// FONCTIONS GLOBALES (compatibilité)
// ============================================================

function chargerDonnees() { return DataManager.charger(); }
function getTextesDuNiveau() { return DataManager.getTextes(); }
function getReponsesEtudiant() { return DataManager.getReponses(); }
function getNiveauEtudiant() { return DataManager.getNiveau(); }
function getDescriptionNiveau() { return DataManager.getDescriptionNiveau(); }
function getDateInscription() { return DataManager.getDateInscription(); }
function getContact() { return DataManager.getContact(); }
function getMessagePerso() { return DataManager.getMessagePerso(); }
function getDisciplines() { return DataManager.getDisciplines(); }
function getMdp() { return DataManager.getMdp(); }
function getThemes() { return DataManager.getThemes(); }

function chargerImagesTheme(nomTheme) { return DataManager.chargerImagesTheme(nomTheme); }
function getImagesThemeCache(nomTheme) { return DataManager.getImagesThemeCache(nomTheme); }

// ============================================================
// NOUVELLES FONCTIONS GLOBALES (tentatives)
// ============================================================
function sauvegarderTentative(texteId, typeExo, details, bonnes, total) {
    return DataManager.sauvegarderTentative(texteId, typeExo, details, bonnes, total);
}
function getTentatives(texteId) {
    return DataManager.getTentatives(texteId);
}

// ============================================================
// ANCIENNES FONCTIONS GLOBALES (wrappers)
// ============================================================
function sauvegarderOrdre(texteId, titre, ordreDonne, bonnes, total, tempsPasse) {
    return DataManager.sauvegarderOrdre(texteId, titre, ordreDonne, bonnes, total, tempsPasse);
}
function sauvegarderCarte(texteId, titre, cartes, bonnes, total, tempsPasse) {
    return DataManager.sauvegarderCarte(texteId, titre, cartes, bonnes, total, tempsPasse);
}
function sauvegarderAnnotation(texteId, slide, annotation) {
    return DataManager.sauvegarderAnnotation(texteId, slide, annotation);
}
function sauvegarderReponseOuverte(texteId, reponse) {
    return DataManager.sauvegarderReponseOuverte(texteId, reponse);
}
function sauvegarderQuiz(texteId, titre, choixQcm, bonnes, total, tempsPasse) {
    return DataManager.sauvegarderQuiz(texteId, titre, choixQcm, bonnes, total, tempsPasse);
}
function sauvegarderLecture(texteId, titre) {
    return DataManager.sauvegarderLecture(texteId, titre);
}
function marquerRevise(texteId, revise) {
    return DataManager.marquerRevise(texteId, revise);
}
function getAnnotations(texteId) {
    return DataManager.getAnnotations(texteId);
}
function getReviseStatus(texteId) {
    return DataManager.getReviseStatus(texteId);
}
function getTexteAsync(texteId) {
    return DataManager.getTexteAsync(texteId);
}
