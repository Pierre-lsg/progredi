# Progredi - Guidelines de Développement

Ce document définit les standards techniques et esthétiques pour le développement d'applications au sein de l'écosystème Progredi.

## 1. Stack Technique
- **Framework** : Svelte 5 (obligatoire pour l'usage des Runes `$state`, `$derived`, `$effect`).
- **Langage** : TypeScript (strict).
- **Styles** : CSS natif avec variables CSS pour le thémage.
- **Icônes** : Lucide-Svelte.

## 2. Design System (Charte Graphique)

### Principes Visuels
- **Glassmorphism** : Utilisation de fonds semi-transparents (`rgba`) avec `backdrop-filter: blur(12px)`.
- **Bordures** : Bordures fines (1px) et semi-transparentes pour délimiter les zones sans alourdir.
- **Rayons (Border Radius)** :
  - Cartes/Panels : `1rem` à `1.25rem`.
  - Boutons/Inputs : `0.75rem`.
  - Éléments compacts : `0.5rem`.

### Système de Thèmes
Toute couleur doit être une variable CSS définie dans `app.css`. Ne jamais utiliser de couleurs "hard-codées" dans les composants.
- `--bg-primary` : Fond principal.
- `--bg-secondary` : Fond des éléments secondaires (cartes, inputs).
- `--accent-primary` : Couleur d'action principale.
- `--text-primary` / `--text-secondary` : Hiérarchie de lecture.

### Composants Partagés
Utilisez toujours les classes globales définies dans `app.css` pour garantir la cohérence :
- `.icon-btn` : Pour les petits boutons d'action avec icône.
- `.input-sub` : Pour les champs de saisie et selects.
- `.panel-header` / `.panel-body` : Pour la structure des écrans modaux.
- `.glass` : Pour l'effet de transparence floutée.

## 3. Architecture du Code

### Gestion d'État (Stores)
- Les données persistantes (Objectifs, Logs, Paramètres) doivent résider dans des stores personnalisés dans `src/lib/stores/`.
- Chaque store doit gérer sa propre persistance dans le `localStorage`.

### Composants Svelte 5
- **Runes** : Utilisez `$state` pour les variables réactives locales et `$derived` pour les calculs dépendants.
- **Props** : Déclarez les props via `let { prop1, prop2 }: Props = $props();`.
- **Logic vs Style** : Gardez les blocs `<style>` au minimum en privilégiant les classes globales. Si un style dépasse 5 lignes et se retrouve dans 3 composants, il doit être déplacé dans `app.css`.

## 4. Expérience Utilisateur (UX)
- **Feedback Haptique** : Utilisez `navigator.vibrate(50)` pour les actions de succès.
- **Animations** : Utilisez les transitions natives de Svelte (`fade`, `fly`) pour les ouvertures de modales et l'apparition d'éléments.
- **Accessibilité (a11y)** : 
  - Toujours inclure un `aria-label` sur les boutons iconiques.
  - S'assurer que les zones interactives (comme la date) sont de véritables éléments `<button>`.

## 5. Internationalization (i18n)
- Aucun texte en dur dans le HTML. Utilisez le store `$t` : `{$t.maClef}`.
- Les nouvelles clefs doivent être ajoutées dans `src/lib/i18n/translations.ts` pour toutes les langues supportées.

---
*Progredi Dev Guidelines - v1.0*
