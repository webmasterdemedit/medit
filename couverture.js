/* ===== LIGNES-THÈMES (format éditorial, non "livret") ===== */

.ligne-theme {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  text-decoration: none;
  color: var(--text);
  transition: background 0.15s, padding-left 0.15s;
  position: relative;
}

.ligne-theme:first-child { border-top: 1px solid var(--border); }

.ligne-theme:hover {
  background: var(--bg-hover);
  padding-left: 24px;
}

.ligne-theme.verrouille {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.ligne-theme.actuelle {
  background: var(--bg-hover);
  border-left: 3px solid var(--text);
  padding-left: 21px;
}

/* Numéro */
.ligne-numero {
  flex: 0 0 auto;
  font-family: 'Georgia', serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--text-muted);
  letter-spacing: 1px;
  min-width: 28px;
}

/* Corps central */
.ligne-corps {
  flex: 1 1 auto;
  min-width: 0;
}

.ligne-titre-wrap {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 3px;
}

.ligne-titre {
  font-family: 'Georgia', serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.3px;
}

.ligne-auteur {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

.ligne-sous-titre {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 300;
  margin-bottom: 8px;
  line-height: 1.4;
}

/* Progression */
.ligne-progression {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ligne-barre {
  flex: 1 1 auto;
  max-width: 220px;
  height: 3px;
  background: var(--border);
  overflow: hidden;
}

.ligne-barre-remplie {
  height: 100%;
  transition: width 0.3s ease;
}

.ligne-compteur {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* Colonne droite */
.ligne-droite {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ligne-badge-niveau {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 2px;
  white-space: nowrap;
}

.ligne-fleche {
  font-size: 18px;
  color: var(--text-muted);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.15s, transform 0.15s;
}

.ligne-theme:hover .ligne-fleche {
  opacity: 1;
  transform: translateX(0);
  color: var(--text);
}

.ligne-cadenas {
  font-size: 14px;
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 700px) {
  .ligne-theme {
    padding: 14px 14px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .ligne-theme:hover { padding-left: 14px; }
  .ligne-numero { min-width: 22px; font-size: 12px; }
  .ligne-titre { font-size: 15px; }
  .ligne-sous-titre { font-size: 12px; }
  .ligne-badge-niveau { display: none; }
  .ligne-barre { max-width: 100%; }
  .ligne-droite { gap: 6px; }
}
