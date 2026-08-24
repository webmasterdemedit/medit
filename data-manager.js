// ============================================================
// data-manager.js - Gestion centralisée des données
// ============================================================

var DataManager = {
    DUREE_CACHE: 60,

    // ============================================================
    // CHARGER - Détection automatique de l'admin
    // ============================================================
    charger: function(force) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        // === SI ADMIN : charger sans cache ===
        if (id === 'admin') {
            return this.chargerAdmin();
        }
        // ===================================

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

    // ============================================================
    // CHARGER POUR ADMIN - PAS DE CACHE, TOUS LES NIVEAUX
    // ============================================================
    chargerAdmin: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id || id !== 'admin') {
            return Promise.reject('Accès réservé à l\'administrateur');
        }

        console.log('🌐 Chargement admin (sans cache)...');
        var url = CONFIG.SCRIPT_URL + '?action=getToutAdmin&nom=' + encodeURIComponent(id);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    console.log('✅ Données admin chargées');
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

    getArticle: function(articleId) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return null;
        var cache = this.getCacheForce(id);
        if (cache && cache.articlesComplets) {
            return cache.articlesComplets[articleId] || null;
        }
        return null;
    },

    getPosts: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return [];
        var cache = this.getCacheForce(id);
        if (cache && cache.posts) {
            return cache.posts;
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

    // ============================================================
    // NOUVELLES MÉTHODES - DONNÉES DE LA FEUILLE "Inscrits"
    // ============================================================

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
    // FIN NOUVELLES MÉTHODES
    // ============================================================

    getAnnotations: function(articleId) {
        var reponses = this.getReponses();
        for (var i = 0; i < reponses.length; i++) {
            if (reponses[i].articleId === articleId) {
                return reponses[i].annotations || '';
            }
        }
        return '';
    },

    getReviseStatus: function(articleId) {
        var reponses = this.getReponses();
        for (var i = 0; i < reponses.length; i++) {
            if (reponses[i].articleId === articleId) {
                return reponses[i].revise === '1' || reponses[i].revise === 1 || reponses[i].revise === true;
            }
        }
        return false;
    },

    marquerRevise: function(articleId, revise) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        var url = CONFIG.SCRIPT_URL + '?action=markRevised' +
            '&nom=' + encodeURIComponent(id) +
            '&articleId=' + encodeURIComponent(articleId) +
            '&revise=' + encodeURIComponent(revise ? '1' : '0');

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    DataManager.invalider();
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur lors de la mise à jour');
                }
            });
    },

    // ============================================================
    // AJOUTER UN POST - CHAQUE ÉLÉMENT DANS SA PROPRE COLONNE
    // ============================================================
    ajouterPost: function(titre, niveau, categorie, contenu, question) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        // Découper le contenu séparé par " | "
        var elements = contenu.split(' | ');
        
        // Préparer les paramètres pour chaque colonne
        var params = {
            titre: titre,
            niveau: niveau,
            categorie: categorie,
            question: question || ''
        };

        // Ajouter chaque élément comme paramètre séparé
        for (var i = 0; i < elements.length; i++) {
            var key = 'col' + (i + 1);
            params[key] = elements[i] || '';
        }

        // Construire l'URL
        var url = CONFIG.SCRIPT_URL + '?action=addPost' +
            '&titre=' + encodeURIComponent(params.titre) +
            '&niveau=' + encodeURIComponent(params.niveau) +
            '&categorie=' + encodeURIComponent(params.categorie) +
            '&question=' + encodeURIComponent(params.question);

        // Ajouter les colonnes
        for (var i = 0; i < elements.length; i++) {
            var key = 'col' + (i + 1);
            url += '&' + key + '=' + encodeURIComponent(params[key] || '');
        }

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

    // ============================================================
    // MODIFIER UN POST
    // ============================================================
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

    // ============================================================
    // SUPPRIMER UN POST
    // ============================================================
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
    },

    // ============================================================
    // SAUVEGARDER UNE ANNOTATION
    // ============================================================
    sauvegarderAnnotation: function(articleId, slide, annotation) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        var url = CONFIG.SCRIPT_URL + '?action=saveAnnotation' +
            '&nom=' + encodeURIComponent(id) +
            '&articleId=' + encodeURIComponent(articleId) +
            '&slide=' + encodeURIComponent(slide) +
            '&annotation=' + encodeURIComponent(annotation);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    DataManager.invalider();
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur lors de la sauvegarde');
                }
            });
    },

    // ============================================================
    // SAUVEGARDER UNE RÉPONSE OUVERTE
    // ============================================================
    sauvegarderReponseOuverte: function(articleId, reponse) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        var url = CONFIG.SCRIPT_URL + '?action=saveReponseOuverte' +
            '&nom=' + encodeURIComponent(id) +
            '&articleId=' + encodeURIComponent(articleId) +
            '&reponseOuverte=' + encodeURIComponent(reponse);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    DataManager.invalider();
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur lors de la sauvegarde');
                }
            });
    },

    // ============================================================
    // SAUVEGARDER UN QUIZ
    // ============================================================
    sauvegarderQuiz: function(articleId, titre, choixQcm, bonnes, total, tempsPasse) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        var url = CONFIG.SCRIPT_URL + '?action=saveQuiz' +
            '&nom=' + encodeURIComponent(id) +
            '&articleId=' + encodeURIComponent(articleId) +
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
                    throw new Error(data.message || 'Erreur lors de la sauvegarde du quiz');
                }
            });
    },

    // ============================================================
    // SAUVEGARDER UNE LECTURE
    // ============================================================
    sauvegarderLecture: function(articleId, titre) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        var url = CONFIG.SCRIPT_URL + '?action=saveLecture' +
            '&nom=' + encodeURIComponent(id) +
            '&articleId=' + encodeURIComponent(articleId) +
            '&titre=' + encodeURIComponent(titre);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    DataManager.invalider();
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur lors de la sauvegarde');
                }
            });
    }
};

// ============================================================
// FONCTIONS UTILITAIRES
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

function getDescriptionNiveau() {
    return DataManager.getDescriptionNiveau();
}

// ============================================================
// NOUVELLES FONCTIONS UTILITAIRES
// ============================================================

function getDateInscription() {
    return DataManager.getDateInscription();
}

function getContact() {
    return DataManager.getContact();
}

function getMessagePerso() {
    return DataManager.getMessagePerso();
}

function getDisciplines() {
    return DataManager.getDisciplines();
}

function getMdp() {
    return DataManager.getMdp();
}

// ============================================================

function getAnnotations(articleId) {
    return DataManager.getAnnotations(articleId);
}

function getReviseStatus(articleId) {
    return DataManager.getReviseStatus(articleId);
}

function marquerRevise(articleId, revise) {
    return DataManager.marquerRevise(articleId, revise);
}

function sauvegarderAnnotation(articleId, slide, annotation) {
    return DataManager.sauvegarderAnnotation(articleId, slide, annotation);
}

function sauvegarderReponseOuverte(articleId, reponse) {
    return DataManager.sauvegarderReponseOuverte(articleId, reponse);
}

function sauvegarderQuiz(articleId, titre, choixQcm, bonnes, total, tempsPasse) {
    return DataManager.sauvegarderQuiz(articleId, titre, choixQcm, bonnes, total, tempsPasse);
}

function sauvegarderLecture(articleId, titre) {
    return DataManager.sauvegarderLecture(articleId, titre);
}
