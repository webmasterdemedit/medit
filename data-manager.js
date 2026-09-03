// ============================================================
// data-manager.js - Gestion centralisée des données
// ============================================================

var DataManager = {
    DUREE_CACHE: 60,

    // ============================================================
    // CHARGER - Version simplifiée (admin comme les autres)
    // ============================================================
    charger: function(force) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        if (!force) {
            var cache = this.getCache(id);
            if (cache) {
                console.log('📦 Données chargées depuis le cache');
                return Promise.resolve(cache);
            }
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
                DataManager.setCache(id, data);
                console.log('✅ Données chargées et mises en cache');
                return data;
            })
            .catch(function(error) {
                console.error('❌ Erreur:', error);
                var cache = DataManager.getCacheForce(id);
                if (cache) {
                    console.log('⚠️ Utilisation du cache expiré (hors ligne)');
                    return cache;
                }
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
    // CACHE
    // ============================================================
    getCache: function(id) {
        try {
            var cache = localStorage.getItem('cache_complet_' + id);
            if (!cache) return null;
            cache = JSON.parse(cache);
            var age = (Date.now() - cache.timestamp) / 60000;
            if (age > this.DUREE_CACHE) {
                console.log('⏰ Cache expiré (', Math.round(age), 'min)');
                return null;
            }
            return cache.data;
        } catch(e) {
            return null;
        }
    },

    getCacheForce: function(id) {
        try {
            var cache = localStorage.getItem('cache_complet_' + id);
            if (!cache) return null;
            cache = JSON.parse(cache);
            return cache.data;
        } catch(e) {
            return null;
        }
    },

    setCache: function(id, data) {
        try {
            localStorage.setItem('cache_complet_' + id, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch(e) {
            console.warn('Impossible de sauvegarder le cache:', e);
        }
    },

    rafraichir: function() {
        return this.charger(true);
    },

    invalider: function() {
        var id = localStorage.getItem('etudiant_id');
        if (id) {
            localStorage.removeItem('cache_complet_' + id);
            console.log('🗑️ Cache vidé');
        }
    },

    aUnCache: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return false;
        var cache = localStorage.getItem('cache_complet_' + id);
        return cache !== null;
    },

    // ============================================================
    // RÉCUPÉRER LES DONNÉES
    // ============================================================
    getChapitre: function(chapitreId) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return null;
        var cache = this.getCacheForce(id);
        if (cache && cache.chapitresComplets) {
            return cache.chapitresComplets[chapitreId] || null;
        }
        return null;
    },

    getChapitres: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return [];
        var cache = this.getCacheForce(id);
        if (cache && cache.chapitres) {
            return cache.chapitres;
        }
        return [];
    },

    getLivrets: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return [];
        var cache = this.getCacheForce(id);
        if (cache && cache.livrets) {
            return cache.livrets;
        }
        return [];
    },

    getReponses: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return [];
        var cache = this.getCacheForce(id);
        if (cache && cache.reponses) {
            return cache.reponses;
        }
        return [];
    },

    getNiveau: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return 0;
        var cache = this.getCacheForce(id);
        if (cache && cache.niveau !== undefined) {
            return cache.niveau;
        }
        return 0;
    },

    getDescriptionNiveau: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return '';
        var cache = this.getCacheForce(id);
        if (cache && cache.description) {
            return cache.description;
        }
        return '';
    },

    getDateInscription: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return null;
        var cache = this.getCacheForce(id);
        if (cache && cache.dateInscription) {
            return cache.dateInscription;
        }
        return null;
    },

    getContact: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return '';
        var cache = this.getCacheForce(id);
        if (cache && cache.contact) {
            return cache.contact;
        }
        return '';
    },

    getMessagePerso: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return '';
        var cache = this.getCacheForce(id);
        if (cache && cache.messagePerso) {
            return cache.messagePerso;
        }
        return '';
    },

    getDisciplines: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return '';
        var cache = this.getCacheForce(id);
        if (cache && cache.disciplines) {
            return cache.disciplines;
        }
        return '';
    },

    getMdp: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return '';
        var cache = this.getCacheForce(id);
        if (cache && cache.mdp) {
            return cache.mdp;
        }
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
                    DataManager.invalider();
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
                    DataManager.invalider();
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
                    DataManager.invalider();
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
                    DataManager.invalider();
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
                    DataManager.invalider();
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
                    DataManager.invalider();
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
                    DataManager.invalider();
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur');
                }
            });
    }
};

// ============================================================
// FONCTIONS GLOBALES
// ============================================================

function chargerDonnees(force) { return DataManager.charger(force); }
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
