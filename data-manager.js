// ============================================================
// data-manager.js - Gestion centralisée des données
// ============================================================

var DataManager = {
    // === CONFIGURATION ===
    DUREE_CACHE: 60, // 1 heure

    // === CHARGER LES DONNÉES ===
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
                    DataManager.setCache(id, data);
                    console.log('✅ Données chargées et mises en cache');
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur de chargement');
                }
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

    // === LIRE LE CACHE ===
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

    // === LIRE LE CACHE MÊME EXPIRÉ ===
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

    // === SAUVEGARDER LE CACHE ===
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

    // === FORCER LE RAFRAÎCHISSEMENT ===
    rafraichir: function() {
        return this.charger(true);
    },

    // === VIDER LE CACHE ===
    invalider: function() {
        var id = localStorage.getItem('etudiant_id');
        if (id) {
            localStorage.removeItem('cache_complet_' + id);
            console.log('🗑️ Cache vidé');
        }
    },

    // === VÉRIFIER SI LE CACHE EXISTE ===
    aUnCache: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return false;
        var cache = localStorage.getItem('cache_complet_' + id);
        return cache !== null;
    },

    // === RÉCUPÉRER UN ARTICLE SPÉCIFIQUE ===
    getArticle: function(articleId) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return null;

        var cache = this.getCacheForce(id);
        if (cache && cache.articlesComplets) {
            return cache.articlesComplets[articleId] || null;
        }
        return null;
    },

    // === RÉCUPÉRER LES POSTS DU NIVEAU ===
    getPosts: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return [];

        var cache = this.getCacheForce(id);
        if (cache && cache.posts) {
            return cache.posts;
        }
        return [];
    },

    // === RÉCUPÉRER LES RÉPONSES ===
    getReponses: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return [];

        var cache = this.getCacheForce(id);
        if (cache && cache.reponses) {
            return cache.reponses;
        }
        return [];
    },

    // === RÉCUPÉRER LE NIVEAU ===
    getNiveau: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return 0;

        var cache = this.getCacheForce(id);
        if (cache && cache.niveau !== undefined) {
            return cache.niveau;
        }
        return 0;
    },

    // === AJOUTER UN POST (admin) ===
    ajouterPost: function(titre, niveau, categorie, contenu, question) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        var url = CONFIG.SCRIPT_URL + '?action=addPost' +
            '&titre=' + encodeURIComponent(titre) +
            '&niveau=' + encodeURIComponent(niveau) +
            '&categorie=' + encodeURIComponent(categorie) +
            '&contenu=' + encodeURIComponent(contenu) +
            '&question=' + encodeURIComponent(question);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    DataManager.invalider();
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur lors de la création');
                }
            });
    },

    // === MODIFIER UN POST (admin) ===
    modifierPost: function(id, titre, niveau, categorie, contenu, question, statut) {
        var userId = localStorage.getItem('etudiant_id');
        if (!userId) {
            return Promise.reject('Non connecté');
        }

        var url = CONFIG.SCRIPT_URL + '?action=updatePost' +
            '&id=' + encodeURIComponent(id) +
            '&titre=' + encodeURIComponent(titre) +
            '&niveau=' + encodeURIComponent(niveau) +
            '&categorie=' + encodeURIComponent(categorie) +
            '&contenu=' + encodeURIComponent(contenu) +
            '&question=' + encodeURIComponent(question) +
            '&statut=' + encodeURIComponent(statut);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    DataManager.invalider();
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur lors de la modification');
                }
            });
    },

    // === SUPPRIMER UN POST (admin) ===
    supprimerPost: function(id) {
        var userId = localStorage.getItem('etudiant_id');
        if (!userId) {
            return Promise.reject('Non connecté');
        }

        var url = CONFIG.SCRIPT_URL + '?action=deletePost&id=' + encodeURIComponent(id);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    DataManager.invalider();
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur lors de la suppression');
                }
            });
    }
};

// ============================================================
// FONCTIONS UTILITAIRES POUR LES PAGES
// ============================================================

function chargerDonnees(force) {
    return DataManager.charger(force);
}

function getArticlesDuNiveau() {
    return DataManager.getPosts();
}

function getReponsesEtudiant() {
    return DataManager.getReponses();
}

function getNiveauEtudiant() {
    return DataManager.getNiveau();
}
