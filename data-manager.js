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
                    // === NOUVEAU : Ajouter la feuille "Livrets" si elle existe ===
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
                    // === NOUVEAU : Ajouter la feuille "Livrets" si elle existe ===
                    return DataManager.ajouterLivrets(data);
                } else {
                    throw new Error(data.message || 'Erreur de chargement');
                }
            })
            .then(function(data) {
                console.log('✅ Données admin chargées');
                return data;
            })
            .catch(function(error) {
                console.error('❌ Erreur:', error);
                throw error;
            });
    },

    // ============================================================
    // NOUVEAU : AJOUTER LES LIVRETS DEPUIS LA FEUILLE DÉDIÉE
    // ============================================================
    ajouterLivrets: function(data) {
        // Si data contient déjà des livrets (feuille "Livrets"), on les garde
        if (data.livrets) {
            return Promise.resolve(data);
        }

        // Sinon, on va chercher la feuille "Livrets" séparément
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            data.livrets = [];
            return Promise.resolve(data);
        }

        var url = CONFIG.SCRIPT_URL + '?action=getLivrets&nom=' + encodeURIComponent(id);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(result) {
                if (result.success && result.livrets) {
                    data.livrets = result.livrets;
                    console.log('📚 ' + data.livrets.length + ' livrets chargés');
                } else {
                    data.livrets = [];
                    console.log('📚 Aucune feuille "Livrets" trouvée');
                }
                return data;
            })
            .catch(function() {
                data.livrets = [];
                return data;
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

    // ============================================================
    // RÉCUPÉRER UN CHAPITRE
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

    // ============================================================
    // RÉCUPÉRER LES CHAPITRES
    // ============================================================
    getChapitres: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) return [];
        var cache = this.getCacheForce(id);
        if (cache && cache.chapitres) {
            return cache.chapitres;
        }
        return [];
    },

    // ============================================================
    // NOUVEAU : RÉCUPÉRER LES LIVRETS
    // ============================================================
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

    // ============================================================
    // DONNÉES DE LA FEUILLE "Inscrits"
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
    // MESSAGERIE
    // ============================================================

    envoyerMessage: function(sujet, message) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        var email = DataManager.getContact() || '';

        var url = CONFIG.SCRIPT_URL + '?action=sendMessage' +
            '&nom=' + encodeURIComponent(id) +
            '&email=' + encodeURIComponent(email) +
            '&sujet=' + encodeURIComponent(sujet) +
            '&message=' + encodeURIComponent(message);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    return data;
                } else {
                    throw new Error(data.message || 'Erreur lors de l\'envoi');
                }
            });
    },

    getMessages: function() {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        var url = CONFIG.SCRIPT_URL + '?action=getMessages&nom=' + encodeURIComponent(id);

        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    return data.messages || [];
                } else {
                    throw new Error(data.message || 'Erreur de chargement des messages');
                }
            });
    },

    // ============================================================
    // SAUVEGARDER ORDRE
    // ============================================================
    sauvegarderOrdre: function(chapitreId, titre, ordreDonne, bonnes, total, tempsPasse) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

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
                    throw new Error(data.message || 'Erreur lors de la sauvegarde de l\'ordre');
                }
            });
    },

    // ============================================================
    // SAUVEGARDER CARTES ANKI
    // ============================================================
    sauvegarderCarte: function(chapitreId, titre, cartes, bonnes, total, tempsPasse) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

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
                    throw new Error(data.message || 'Erreur lors de la sauvegarde des cartes');
                }
            });
    },

    // ============================================================
    // ANNOTATIONS & QUIZ
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
                return reponses[i].revise === '1' || reponses[i].revise === 1 || reponses[i].revise === true;
            }
        }
        return false;
    },

    marquerRevise: function(chapitreId, revise) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

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
                    throw new Error(data.message || 'Erreur lors de la mise à jour');
                }
            });
    },

    // ============================================================
    // GESTION DES CHAPITRES
    // ============================================================

    ajouterChapitre: function(titre, niveau, categorie, contenu, question) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

        var elements = contenu.split(' | ');
        
        var params = {
            titre: titre,
            niveau: niveau,
            categorie: categorie,
            question: question || ''
        };

        for (var i = 0; i < elements.length; i++) {
            var key = 'col' + (i + 1);
            params[key] = elements[i] || '';
        }

        var url = CONFIG.SCRIPT_URL + '?action=addChapitre' +
            '&titre=' + encodeURIComponent(params.titre) +
            '&niveau=' + encodeURIComponent(params.niveau) +
            '&categorie=' + encodeURIComponent(params.categorie) +
            '&question=' + encodeURIComponent(params.question);

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

    modifierChapitre: function(id, titre, niveau, categorie, contenu, question, statut) {
        var userId = localStorage.getItem('etudiant_id');
        if (!userId) {
            return Promise.reject('Non connecté');
        }

        var url = CONFIG.SCRIPT_URL + '?action=updateChapitre' +
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

    supprimerChapitre: function(id) {
        var userId = localStorage.getItem('etudiant_id');
        if (!userId) {
            return Promise.reject('Non connecté');
        }

        var url = CONFIG.SCRIPT_URL + '?action=deleteChapitre&id=' + encodeURIComponent(id);

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
    // SAUVEGARDES
    // ============================================================

    sauvegarderAnnotation: function(chapitreId, slide, annotation) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

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
                    throw new Error(data.message || 'Erreur lors de la sauvegarde');
                }
            });
    },

    sauvegarderReponseOuverte: function(chapitreId, reponse) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

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
                    throw new Error(data.message || 'Erreur lors de la sauvegarde');
                }
            });
    },

    sauvegarderQuiz: function(chapitreId, titre, choixQcm, bonnes, total, tempsPasse) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

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
                    throw new Error(data.message || 'Erreur lors de la sauvegarde du quiz');
                }
            });
    },

    sauvegarderLecture: function(chapitreId, titre) {
        var id = localStorage.getItem('etudiant_id');
        if (!id) {
            return Promise.reject('Non connecté');
        }

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
                    throw new Error(data.message || 'Erreur lors de la sauvegarde');
                }
            });
    }
};

// ============================================================
// FONCTIONS UTILITAIRES GLOBALES
// ============================================================

function chargerDonnees(force) {
    return DataManager.charger(force);
}

function getChapitresDuNiveau() {
    return DataManager.getChapitres();
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
// NOUVELLES FONCTIONS UTILITAIRES POUR LES LIVRETS
// ============================================================

function getLivrets() {
    return DataManager.getLivrets();
}

function envoyerMessage(sujet, message) {
    return DataManager.envoyerMessage(sujet, message);
}

function getMessages() {
    return DataManager.getMessages();
}

function sauvegarderOrdre(chapitreId, titre, ordreDonne, bonnes, total, tempsPasse) {
    return DataManager.sauvegarderOrdre(chapitreId, titre, ordreDonne, bonnes, total, tempsPasse);
}

function sauvegarderCarte(chapitreId, titre, cartes, bonnes, total, tempsPasse) {
    return DataManager.sauvegarderCarte(chapitreId, titre, cartes, bonnes, total, tempsPasse);
}

function getAnnotations(chapitreId) {
    return DataManager.getAnnotations(chapitreId);
}

function getReviseStatus(chapitreId) {
    return DataManager.getReviseStatus(chapitreId);
}

function marquerRevise(chapitreId, revise) {
    return DataManager.marquerRevise(chapitreId, revise);
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
