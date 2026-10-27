// data-manager.js
// - Navigation normale  → cache
// - Reload (F5 / Ctrl+R / Ctrl+Shift+R) → Sheet
// - Images → cache conservé
// - MODE INVITÉ : accès aux textes + quiz sans compte
// - Les textes "(...)" sont EXCLUS de tousLesTextes (affichage)
//   mais conservés dans tousLesTextesComplets (pour l'impression)
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
// DÉTECTION DES VERSIONS ALTERNATIVES "(...)"
// ============================================================
function estVersionAlternative(titre) {
    if (!titre) return false;
    return /\s*\([^)]*\)\s*$/.test(titre);
}

// ============================================================
// MODE INVITÉ
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

function getIdUtilisateur() {
    return localStorage.getItem('etudiant_id') || getSessionInvite();
}

function estConnecte() {
    return !!localStorage.getItem('etudiant_id');
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

                // === SÉPARATION : filtré (affichage) / complet (impression) ===
                var tousComplets = data.tousLesTextes.slice();
                var tousFiltres = tousComplets.filter(function(t) {
                    return !estVersionAlternative(t.titre);
                });

                data.tousLesTextesComplets = tousComplets;
                data.tousLesTextes = tousFiltres;

                // textes (par niveau) : on filtre aussi
                data.textes = (data.textes || []).filter(function(t) {
                    return !estVersionAlternative(t.titre);
                });

                self._dernierChargement = data;
                self._dernierNom = id;
                self._ecrireCache(id, data);

                console.log('✅ Données chargées depuis le Sheet');
                console.log('📚 ' + data.themes.length + ' thèmes');
                console.log('📖 ' + data.tousLesTextes.length + ' textes (affichage)');
                console.log('📖 ' + data.tousLesTextesComplets.length + ' textes (dont alternatives)');

                return data;
            })
            .catch(function(error) {
                console.error('❌ Erreur:', error);
                throw error;
            });
    },

    // ============================================================
    // CHARGEMENT PUBLIC (invités)
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

            var textesComplets = (textesData.textes || []);
            var textesFiltres = textesComplets.filter(function(t) {
                return !estVersionAlternative(t.titre);
            });

            var data = {
                niveau: 999,
                description: '',
                mdp: '',
                contact: '',
                dateInscription: '',
                messagePerso: '',
                disciplines: '',
                themes: themesData.themes || [],
                textes: textesFiltres,
                tousLesTextes: textesFiltres,
                tousLesTextesComplets: textesComplets,
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
    // GETTER ASYNCHRONE d'un texte complet
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
            var data = JSON.parse(json);

            // Compatibilité : si le cache n'a pas tousLesTextesComplets, on le reconstitue
            if (!data.tousLesTextesComplets) {
                var tous = data.tousLesTextes || [];
                data.tousLesTextesComplets = tous.slice();
                data.tousLesTextes = tous.filter(function(t) {
                    return !estVersionAlternative(t.titre);
                });
            }

            return data;
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
    // GETTERS
    // ============================================================
    getTexte: function(texteId) {
        var cache = this._dernierChargement;
        if (cache && cache.textesComplets && cache.textesComplets[texteId]) {
            return cache.textesComplets[texteId];
        }
        // Si pas en cache, chercher dans les complets (inclut les alternatives)
        if (cache && cache.tousLesTextesComplets) {
            for (var i = 0; i < cache.tousLesTextesComplets.length; i++) {
                if (String(cache.tousLesTextesComplets[i].id) === String(texteId)) {
                    return cache.tousLesTextesComplets[i];
                }
            }
        }
        return null;
    },

    getTexteComplet: function(texteId) {
        return this.getTexte(texteId);
    },

    getTextes: function() {
        return (this._dernierChargement && this._dernierChargement.textes) || [];
    },

    // Renvoie les textes FILTRÉS (sans les alternatives) — pour l'affichage
    getTousLesTextes: function() {
        return (this._dernierChargement && this._dernierChargement.tousLesTextes) || [];
    },

    // Renvoie TOUS les textes (avec les alternatives) — pour l'impression
    getTousLesTextesComplets: function() {
        return (this._dernierChargement && this._dernierChargement.tousLesTextesComplets) || [];
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
    // IMAGES D'UN THÈME
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
    // SAUVEGARDES
    // ============================================================
    sauvegarderOrdre: function(texteId, titre, ordreDonne, bonnes, total, tempsPasse) {
        var id = getIdUtilisateur();
        var url = CONFIG.SCRIPT_URL + '?action=saveOrdre' +
            '&nom=' + encodeURIComponent(id) +
            '&texteId=' + encodeURIComponent(texteId) +
            '&titre=' + encodeURIComponent(titre) +
            '&ordreDonne=' + encodeURIComponent(ordreDonne) +
            '&bonnes=' + encodeURIComponent(bonnes) +
            '&total=' + encodeURIComponent(total) +
            '&tempsPasse=' + encodeURIComponent(tempsPasse);
        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) { if (data.success) return data; else throw new Error(data.message || 'Erreur'); });
    },

    sauvegarderCarte: function(texteId, titre, cartes, bonnes, total, tempsPasse) {
        var id = getIdUtilisateur();
        var url = CONFIG.SCRIPT_URL + '?action=saveCarte' +
            '&nom=' + encodeURIComponent(id) +
            '&texteId=' + encodeURIComponent(texteId) +
            '&titre=' + encodeURIComponent(titre) +
            '&cartes=' + encodeURIComponent(cartes) +
            '&bonnes=' + encodeURIComponent(bonnes) +
            '&total=' + encodeURIComponent(total) +
            '&tempsPasse=' + encodeURIComponent(tempsPasse);
        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) { if (data.success) return data; else throw new Error(data.message || 'Erreur'); });
    },

    sauvegarderAnnotation: function(texteId, slide, annotation) {
        var id = getIdUtilisateur();
        var url = CONFIG.SCRIPT_URL + '?action=saveAnnotation' +
            '&nom=' + encodeURIComponent(id) +
            '&texteId=' + encodeURIComponent(texteId) +
            '&slide=' + encodeURIComponent(slide) +
            '&annotation=' + encodeURIComponent(annotation);
        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) { if (data.success) return data; else throw new Error(data.message || 'Erreur'); });
    },

    sauvegarderReponseOuverte: function(texteId, reponse) {
        var id = getIdUtilisateur();
        var url = CONFIG.SCRIPT_URL + '?action=saveReponseOuverte' +
            '&nom=' + encodeURIComponent(id) +
            '&texteId=' + encodeURIComponent(texteId) +
            '&reponseOuverte=' + encodeURIComponent(reponse);
        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) { if (data.success) return data; else throw new Error(data.message || 'Erreur'); });
    },

    sauvegarderQuiz: function(texteId, titre, choixQcm, bonnes, total, tempsPasse) {
        var id = getIdUtilisateur();
        var url = CONFIG.SCRIPT_URL + '?action=saveQuiz' +
            '&nom=' + encodeURIComponent(id) +
            '&texteId=' + encodeURIComponent(texteId) +
            '&titre=' + encodeURIComponent(titre) +
            '&choixQcm=' + encodeURIComponent(choixQcm) +
            '&bonnes=' + encodeURIComponent(bonnes) +
            '&total=' + encodeURIComponent(total) +
            '&tempsPasse=' + encodeURIComponent(tempsPasse);
        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) { if (data.success) return data; else throw new Error(data.message || 'Erreur'); });
    },

    sauvegarderLecture: function(texteId, titre) {
        var id = getIdUtilisateur();
        var url = CONFIG.SCRIPT_URL + '?action=saveLecture' +
            '&nom=' + encodeURIComponent(id) +
            '&texteId=' + encodeURIComponent(texteId) +
            '&titre=' + encodeURIComponent(titre);
        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) { if (data.success) return data; else throw new Error(data.message || 'Erreur'); });
    },

    marquerRevise: function(texteId, revise) {
        var id = getIdUtilisateur();
        var url = CONFIG.SCRIPT_URL + '?action=markRevised' +
            '&nom=' + encodeURIComponent(id) +
            '&texteId=' + encodeURIComponent(texteId) +
            '&revise=' + encodeURIComponent(revise ? '1' : '0');
        return fetch(url).then(function(r) { return r.json(); })
            .then(function(data) { if (data.success) return data; else throw new Error(data.message || 'Erreur'); });
    },

    // ============================================================
    // GET ANNOTATIONS / REVISE
    // ============================================================
    getAnnotations: function(texteId) {
        var reponses = this.getReponses();
        for (var i = 0; i < reponses.length; i++) {
            if (reponses[i].texteId === texteId) {
                return reponses[i].annotations || '';
            }
        }
        return '';
    },

    getReviseStatus: function(texteId) {
        var reponses = this.getReponses();
        for (var i = 0; i < reponses.length; i++) {
            if (reponses[i].texteId === texteId) {
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
