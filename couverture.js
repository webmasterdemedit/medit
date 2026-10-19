/* ============================================================
   CARTE-COUVERTURE — BANDEAU BAS ET LARGE
   Image en haut, titre + sous-titre en dessous, progression en bas
   ============================================================ */

.carte-couverture {
  position: relative;
  width: 100%;
  max-width: 420px;
  /* plus large que haut : ratio 4:1 → vraiment bas */
  aspect-ratio: 4 / 1;
  height: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;          /* ← colonne : image puis texte */
  align-items: stretch;
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
  color: #1a1a1a;
  border: 1px solid var(--border);
  border-radius: 0;
  margin: 0 auto;
  box-shadow: none;
  transition: border-color 0.2s ease;
}

.carte-couverture:hover {
  border-color: var(--border-hover);
}

.carte-couverture.verrouille {
  filter: opacity(0.45);
  cursor: not-allowed;
  pointer-events: none;
}

.carte-couverture *,
.carte-couverture .contenu-theme,
.carte-couverture .contenu-theme * {
  background: transparent;
  color: inherit;
  border-color: transparent;
}

/* ===== IMAGE EN HAUT ===== */
.carte-couverture .couverture-image {
  order: 0;
  flex: 0 0 60%;                    /* 60% de la hauteur pour l'image */
  width: 100%;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden;
  background: transparent !important;
}

.carte-couverture .couverture-image img {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  margin: 0 !important;
  padding: 0 !important;
  filter: none !important;           /* couleurs conservées */
}

/* ===== TEXTE EN DESSOUS ===== */
.carte-couverture .contenu-theme {
  position: relative;
  z-index: 2;
  order: 1;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
  padding: 6px 12px;
  overflow: hidden;
  text-align: left;
}

.carte-couverture .contenu-theme::before {
  content: none;
}

.carte-couverture .titre-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1px;
  width: 100%;
  margin: 0;
  overflow: hidden;
}

/* ===== TITRE ===== */
.carte-couverture .titre-theme {
  display: block;
  overflow: hidden;
  color: #1a1a1a !important;
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 700;
  font-size: clamp(12px, 2.2vw, 16px);
  text-align: left;
  line-height: 1.1;
  letter-spacing: 0.2px;
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin: 0;
  padding: 0;
  border: none;
  width: 100%;
}

/* ===== SOUS-TITRE ===== */
.carte-couverture .sous-titre-theme {
  display: block;
  overflow: hidden;
  color: rgba(26, 26, 26, 0.7) !important;
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: 10px;
  text-align: left;
  line-height: 1.15;
  letter-spacing: 0.1px;
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin: 0;
}

/* ===== PROGRESSION ===== */
.carte-couverture .progression-theme {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.3) !important;
  z-index: 3;
  overflow: hidden;
}
.carte-couverture .progression-theme .barre {
  height: 100%;
  background: rgba(255, 255, 255, 0.9) !important;
  transition: width 0.6s ease;
}

/* ===== CADENAS ===== */
.carte-couverture .cadenas-verrou {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  font-size: 24px;
  opacity: 0.7;
  pointer-events: none;
}

/* ===== GRILLE DE COUVERTURES ===== */
.grille-couvertures {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)) !important;
  gap: 18px !important;
  justify-items: center !important;
}

.grille-couvertures .carte-couverture {
  width: 100% !important;
  max-width: 420px !important;
  aspect-ratio: 4 / 1 !important;
  height: auto !important;
  margin: 0 auto !important;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .grille-couvertures {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }
  .grille-couvertures .carte-couverture {
    max-width: 100% !important;
    aspect-ratio: 4 / 1 !important;
  }
  .carte-couverture .contenu-theme {
    padding: 5px 10px;
  }
  .carte-couverture .titre-theme {
    font-size: clamp(11px, 3.2vw, 14px);
  }
  .carte-couverture .sous-titre-theme {
    font-size: 9px;
  }
}

@media (max-width: 400px) {
  .carte-couverture .titre-theme {
    font-size: 11px;
  }
  .carte-couverture .sous-titre-theme {
    font-size: 8px;
  }
}
