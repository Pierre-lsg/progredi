# Progredi - Documentation de l'Application (v0.0.2)

Progredi est une application web progressive (PWA) de suivi d'objectifs et de routines, conçue pour être simple, élégante et centrée sur la vie privée.

## 1. Philosophie
- **Vie Privée** : Toutes les données sont stockées localement dans votre navigateur (LocalStorage). Rien n'est envoyé sur un serveur.
- **Flexibilité** : Gérez aussi bien des habitudes quotidiennes que des tâches ponctuelles ou annuelles.
- **Esthétique** : Une interface "Glassmorphism" moderne avec des thèmes dynamiques.

## 2. Fonctionnalités Principales

### Gestion des Objectifs
- **Création flexible** : Ajoutez des objectifs avec différents types de fréquences :
  - **Quotidien** : Chaque jour.
  - **Hebdomadaire** : Choisissez les jours spécifiques de la semaine.
  - **Mensuel** : Un jour fixe du mois.
  - **Annuel** : Une date spécifique chaque année.
  - **Ponctuel** : Une seule fois à une date précise.
- **Priorités** : Marquez vos tâches comme Basse, Moyenne ou Haute importance (code couleur visuel).
- **Catégories** : Organisez vos tâches (Général, Santé, Travail, etc.).
- **Favoris** : Épinglez vos objectifs les plus importants.

### Tableau de Bord (Dashboard)
- **Navigation Temporelle** : 
  - Changez de jour via les flèches, le **swipe tactile** (sur mobile) ou en cliquant directement sur la date pour ouvrir un **calendrier**.
  - Les tâches créées un jour J n'apparaissent pas rétroactivement dans le passé.
- **Actions Rapides** :
  - **Valider** : Marquer comme terminé (avec retour haptique et son de succès).
  - **Reporter (Skip)** : Si une tâche hebdomadaire est reportée, elle est **automatiquement replanifiée** pour le lendemain en tant que tâche ponctuelle.
- **Filtres et Recherche** : Recherchez par nom, filtrez par catégorie, fréquence, ou masquez les tâches terminées.
- **Réorganisation** : Glissez-déposez vos objectifs pour changer leur ordre d'affichage.

### Statistiques et Suivi
- **Vue d'ensemble** : Taux de complétion global, total de tâches terminées et séries en cours (streaks).
- **Activité Hebdomadaire** : Graphique en barres montrant votre assiduité sur les 7 derniers jours.
- **Répartition** : Graphique en anneau (Donut chart) par catégorie.
- **Séries (Streaks)** : Visualisez vos séries de succès consécutifs avec une animation "flamme" pour vos meilleures routines.

### Protection de l'Historique
- **Intégrité des données** : Si vous modifiez le nom, la catégorie ou la fréquence d'une tâche déjà validée par le passé, Progredi archive automatiquement l'ancienne version et crée une nouvelle tâche. Cela permet de garder vos statistiques historiques intactes.

## 3. Personnalisation et Réglages
- **Thèmes Dynamiques** : 5 ambiances visuelles au choix :
  - **Light** : Clair et épuré.
  - **Dark** : Sombre et reposant.
  - **Cyber** : Futuriste et contrasté.
  - **Paper** : Doux et organique.
  - **Ocean** : Calme et profond.
- **Multilingue** : Support complet du Français, Anglais, Espagnol, Allemand et Italien.
- **Notifications** : Possibilité d'activer des rappels (selon support navigateur) et un résumé du soir.

## 4. Gestion des Données
- **Export** : Sauvegardez l'intégralité de vos données dans un fichier JSON.
- **Import** : Restaurez vos données depuis une sauvegarde précédente.
- **Réinitialisation** : Option pour supprimer définitivement toutes les données.

---
*Progredi v0.0.2 - Développé avec Svelte 5*
