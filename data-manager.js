// ============================================================
// DATA-MANAGER.JS - Gestion centralisée des données
// ============================================================

var DataManager = (function() {
    'use strict';

    var URL_API = 'https://script.google.com/macros/s/AKfycbzZk0N8gCWR2l7duId1oGgP_srqO8m38lB5YhQPQYoeQwJ7YhFnSWaZ88JIVFJxVgR8/exec';
    var cache = null;
    var dernierAppel = 0;
    var DELAI_MIN = 500;

    function getUrl() {
        return URL_API;
    }

    function setUrl(url) {
        URL_API = url;
        console.log('🔧 URL API mise à jour:', url);
    }

    function getCacheForce(id) {
        if (cache && cache.id === id) {
            return cache.data;
        }
        return null;
    }

    function getCache() {
        return cache ? cache.data : null;
    }

    function charger() {
        return new Promise(function(resolve, reject) {
            var id = localStorage.getItem('etudiant_id');
            if (!id) {
                reject(new Error('Utilisateur non connecté'));
                return;
            }

            var maintenant = Date.now();
            if (cache && cache.id === id && (maintenant - cache.timestamp) < 30000) {
                console.log('📦 Données en cache (30s)');
                resolve(cache.data);
                return;
            }

            if (maintenant - dernierAppel < DELAI_MIN) {
                console.log('⏳ Attente du délai minimum...');
                setTimeout(function() {
                    charger().then(resolve).catch(reject);
                }, DELAI_MIN - (maintenant - dernierAppel));
                return;
            }

            dernierAppel = maintenant;

            var params = 'action=getTout&nom=' + encodeURIComponent(id);
            var url = URL_API + '?' + params;

            console.log('📡 Chargement des données depuis le serveur...');

            fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Erreur HTTP: ' + response.status);
                }
                return response.json();
            })
            .then(function(result) {
                if (result.success) {
                    console.log('✅ Données chargées avec succès');

                    // Construire la map des réponses
                    var reponsesMap = {};
                    if (result.reponses) {
                        result.reponses.forEach(function(r) {
                            reponsesMap[r.chapitreId] = r;
                        });
                    }

                    // Ajouter la validation aux chapitres
                    if (result.chapitres) {
                        result.chapitres.forEach(function(chapitre) {
                            var reponse = reponsesMap[chapitre.id];
                            if (reponse) {
                                var quizOk = reponse.quiz === '1';
                                var ordreOk = reponse.ordre === '1';
                                var carteOk = reponse.carte === '1';
                                var aUneActivite = reponse.quiz || reponse.ordre || reponse.carte;
                                
                                if (aUneActivite && quizOk && ordreOk && carteOk) {
                                    chapitre.valide = true;
                                } else {
                                    chapitre.valide = false;
                                }
                            } else {
                                chapitre.valide = false;
                            }
                        });
                    }

                    // Mettre en cache
                    cache = {
                        id: id,
                        data: result,
                        timestamp: maintenant
                    };

                    resolve(result);
                } else {
                    reject(new Error(result.message || 'Erreur inconnue'));
                }
            })
            .catch(function(error) {
                console.error('❌ Erreur de chargement:', error);
                reject(error);
            });
        });
    }

    function sauvegarder(action, params) {
        return new Promise(function(resolve, reject) {
            var id = localStorage.getItem('etudiant_id');
            if (!id) {
                reject(new Error('Utilisateur non connecté'));
                return;
            }

            params.nom = id;
            params.action = action;

            var url = URL_API + '?' + Object.keys(params)
                .map(function(key) {
                    return key + '=' + encodeURIComponent(params[key]);
                })
                .join('&');

            console.log('💾 Sauvegarde:', action, params);

            fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Erreur HTTP: ' + response.status);
                }
                return response.json();
            })
            .then(function(result) {
                if (result.success) {
                    console.log('✅ Sauvegarde réussie:', action);
                    // Invalider le cache
                    cache = null;
                    resolve(result);
                } else {
                    reject(new Error(result.message || 'Erreur lors de la sauvegarde'));
                }
            })
            .catch(function(error) {
                console.error('❌ Erreur de sauvegarde:', error);
                reject(error);
            });
        });
    }

    // Méthodes spécifiques
    function saveQuiz(chapitreId, bonnes, total) {
        return sauvegarder('saveQuiz', {
            chapitreId: chapitreId,
            bonnes: bonnes,
            total: total
        });
    }

    function saveOrdre(chapitreId, bonnes, total) {
        return sauvegarder('saveOrdre', {
            chapitreId: chapitreId,
            bonnes: bonnes,
            total: total
        });
    }

    function saveCarte(chapitreId, bonnes, total) {
        return sauvegarder('saveCarte', {
            chapitreId: chapitreId,
            bonnes: bonnes,
            total: total
        });
    }

    function saveReponseOuverte(chapitreId, reponse) {
        return sauvegarder('saveReponseOuverte', {
            chapitreId: chapitreId,
            reponseOuverte: reponse
        });
    }

    function saveAnnotation(chapitreId, slide, annotation) {
        return sauvegarder('saveAnnotation', {
            chapitreId: chapitreId,
            slide: slide,
            annotation: annotation
        });
    }

    function saveLecture(chapitreId) {
        return sauvegarder('saveLecture', {
            chapitreId: chapitreId
        });
    }

    function markRevised(chapitreId, revise) {
        return sauvegarder('markRevised', {
            chapitreId: chapitreId,
            revise: revise
        });
    }

    function getValidationGlobale(chapitreId) {
        return new Promise(function(resolve, reject) {
            var id = localStorage.getItem('etudiant_id');
            if (!id) {
                reject(new Error('Utilisateur non connecté'));
                return;
            }

            var params = 'action=getValidationGlobale&nom=' + encodeURIComponent(id) + 
                         '&chapitreId=' + encodeURIComponent(chapitreId);
            var url = URL_API + '?' + params;

            fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Erreur HTTP: ' + response.status);
                }
                return response.json();
            })
            .then(function(result) {
                if (result.success) {
                    resolve(result.validation);
                } else {
                    reject(new Error(result.message || 'Erreur'));
                }
            })
            .catch(function(error) {
                reject(error);
            });
        });
    }

    function rafraichir() {
        cache = null;
        return charger();
    }

    // Fonction utilitaire pour normaliser
    function normaliserChaine(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    // API publique
    return {
        getUrl: getUrl,
        setUrl: setUrl,
        getCache: getCache,
        getCacheForce: getCacheForce,
        charger: charger,
        sauvegarder: sauvegarder,
        saveQuiz: saveQuiz,
        saveOrdre: saveOrdre,
        saveCarte: saveCarte,
        saveReponseOuverte: saveReponseOuverte,
        saveAnnotation: saveAnnotation,
        saveLecture: saveLecture,
        markRevised: markRevised,
        getValidationGlobale: getValidationGlobale,
        rafraichir: rafraichir,
        normaliserChaine: normaliserChaine,
        estChapitreValide: function(chapitre, reponsesMap) {
            var reponse = reponsesMap ? reponsesMap[chapitre.id] : null;
            if (!reponse) return false;
            
            var quizOk = reponse.quiz === '1';
            var ordreOk = reponse.ordre === '1';
            var carteOk = reponse.carte === '1';
            var aUneActivite = reponse.quiz || reponse.ordre || reponse.carte;
            
            if (!aUneActivite) return false;
            return quizOk && ordreOk && carteOk;
        }
    };
})();

// Exposer DataManager globalement
window.DataManager = DataManager;
