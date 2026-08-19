/* ============================================================
   LISEUSE MODE - Snap Scroll + Pagination + Tap
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== 1. ÉLÉMENTS =====
    const wrapper = document.querySelector('.app-snap-wrapper');
    const pagination = document.getElementById('pagination');
    const pageCourante = document.getElementById('page-courante');
    const pageTotal = document.getElementById('page-total');
    const tapZone = document.getElementById('tapZone');
    
    if (!wrapper) {
        console.warn('Liseuse : .app-snap-wrapper introuvable');
        return;
    }
    
    // ===== 2. COMPTER LES PAGES =====
    // Tous les enfants directs du wrapper sont des pages
    const pages = wrapper.children;
    const totalPages = pages.length;
    pageTotal.textContent = totalPages;
    
    // ===== 3. PAGINATION =====
    function updatePagination() {
        const scrollTop = wrapper.scrollTop;
        const wrapperHeight = wrapper.clientHeight;
        const currentIndex = Math.round(scrollTop / wrapperHeight);
        const currentPage = Math.min(currentIndex + 1, totalPages);
        
        pageCourante.textContent = currentPage;
        
        // Cache la pagination après 2s d'inactivité
        clearTimeout(window._paginationTimeout);
        pagination.classList.remove('hidden');
        
        window._paginationTimeout = setTimeout(() => {
            pagination.classList.add('hidden');
        }, 2000);
    }
    
    // ===== 4. SNAP AU SCROLL =====
    wrapper.addEventListener('scroll', function() {
        updatePagination();
    });
    
    // Mise à jour initiale
    setTimeout(updatePagination, 100);
    
    // ===== 5. TAP POUR AVANCER =====
    // Activer la zone de tap
    tapZone.classList.add('active');
    
    tapZone.addEventListener('click', function(e) {
        // Ne pas avancer si on clique sur un bouton, input, etc.
        const target = e.target;
        if (target.closest('button') || 
            target.closest('input') || 
            target.closest('textarea') || 
            target.closest('select') ||
            target.closest('a') ||
            target.closest('.modal-content') ||
            target.closest('.composer-content')) {
            return;
        }
        
        // Avancer d'une page
        goToNextPage();
    });
    
    // ===== 6. FONCTIONS DE NAVIGATION =====
    function goToNextPage() {
        const scrollTop = wrapper.scrollTop;
        const wrapperHeight = wrapper.clientHeight;
        const currentIndex = Math.round(scrollTop / wrapperHeight);
        const nextIndex = Math.min(currentIndex + 1, totalPages - 1);
        
        if (nextIndex !== currentIndex) {
            wrapper.scrollTo({
                top: nextIndex * wrapperHeight,
                behavior: 'smooth'
            });
        }
    }
    
    function goToPrevPage() {
        const scrollTop = wrapper.scrollTop;
        const wrapperHeight = wrapper.clientHeight;
        const currentIndex = Math.round(scrollTop / wrapperHeight);
        const prevIndex = Math.max(currentIndex - 1, 0);
        
        if (prevIndex !== currentIndex) {
            wrapper.scrollTo({
                top: prevIndex * wrapperHeight,
                behavior: 'smooth'
            });
        }
    }
    
    // ===== 7. RACCOURCIS CLAVIER =====
    document.addEventListener('keydown', function(e) {
        // Flèche droite ou espace = page suivante
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
            e.preventDefault();
            goToNextPage();
        }
        
        // Flèche gauche ou PageUp = page précédente
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            goToPrevPage();
        }
        
        // Home = première page
        if (e.key === 'Home') {
            e.preventDefault();
            wrapper.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // End = dernière page
        if (e.key === 'End') {
            e.preventDefault();
            wrapper.scrollTo({ 
                top: (totalPages - 1) * wrapper.clientHeight, 
                behavior: 'smooth' 
            });
        }
    });
    
    // ===== 8. RÉSIZE =====
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // Recalculer la page actuelle après resize
            updatePagination();
        }, 200);
    });
    
    // ===== 9. SCROLL HINT (optionnel) =====
    // Ajoute un petit indicateur "scroll" sur la première page
    const firstPage = pages[0];
    if (firstPage && totalPages > 1) {
        const hint = document.createElement('div');
        hint.className = 'scroll-hint';
        hint.textContent = '↓';
        document.body.appendChild(hint);
        
        // Cache le hint après le premier scroll
        wrapper.addEventListener('scroll', function() {
            hint.classList.add('hidden');
        }, { once: true });
        
        // Cache aussi après 5s si pas de scroll
        setTimeout(() => {
            hint.classList.add('hidden');
        }, 5000);
    }
});
