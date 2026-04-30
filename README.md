# Todo Vacances

Une petite application web en une seule page pour préparer une liste de choses à ne pas oublier avant de partir en vacances.

Le site permet de créer plusieurs catégories, par exemple :

- César
- Miu
- Papa
- Maman
- Plage
- Voiture

Chaque catégorie possède sa propre liste d'items et sa propre barre de progression.

## Fonctionnalités

- Ajouter des items dans une catégorie
- Cocher les items déjà préparés
- Supprimer un item
- Créer une nouvelle catégorie
- Supprimer une catégorie complète
- Voir la progression de chaque catégorie
- Copier un lien partagé contenant toutes les données

## Comment utiliser le site

1. Ouvrir la page du site.
2. Créer une catégorie si besoin, par exemple `César` ou `Miu`.
3. Ajouter les choses à préparer dans chaque catégorie.
4. Cocher les éléments quand ils sont faits.
5. Copier le lien partagé pour retrouver ou envoyer la liste.

## Partage et sauvegarde

Les données ne sont pas stockées sur un serveur.

Toute la liste est encodée directement dans l'URL, dans le paramètre `d`.

Cela veut dire que :

- le lien contient toutes les catégories et tous les items ;
- si tu partages le lien, l'autre personne voit la même liste ;
- si tu modifies la liste, il faut recopier le nouveau lien pour partager la version à jour.

## Structure du projet

Le projet est volontairement très simple :

```text
.
├── index.html
└── README.md
```

Tout le code HTML, CSS et JavaScript se trouve dans `index.html`.

## Déploiement

Le site peut être hébergé facilement avec GitHub Pages ou n'importe quel hébergement statique.

Avec GitHub Pages :

1. Aller dans les paramètres du dépôt.
2. Ouvrir la section **Pages**.
3. Choisir la branche `main`.
4. Sélectionner le dossier racine `/`.
5. Enregistrer.

## Notes

Cette application est pensée pour être simple, rapide et utilisable sur téléphone.