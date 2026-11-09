/* ============================================================
   CARTE-COUVERTURE — version "thème" (aucun cadre)
   ============================================================ */
.carte-couverture.carte-theme-lien,
.carte-couverture.carte-theme-lien:hover,
.carte-couverture.carte-theme-lien:focus {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  width: auto !important;
  max-width: none !important;
  height: auto !important;
  aspect-ratio: auto !important;
  padding: 2px 4px !important;
  margin: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0 !important;
  overflow: visible !important;
}

.carte-couverture.carte-theme-lien .titre-theme {
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  text-decoration: none !important;
}

.carte-couverture.carte-theme-lien:hover .titre-theme {
  text-decoration: underline !important;
}

.carte-couverture.carte-theme-lien.verrouille {
  opacity: .45 !important;
  pointer-events: none !important;
}
