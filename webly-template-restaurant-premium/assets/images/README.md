# Images — comment mettre vos vraies photos

Les visuels livrés (`.svg`) sont des **ambiances art-dirigées** générées à la
main (dégradés chauds, flou, grain), pas des photographies. Ils servent à ce
que le template soit montrable immédiatement.

> **Deux façons de changer les photos.** Le client, lui, passe par
> l'espace `/admin/` : il téléverse ses images sans toucher aux noms de
> fichiers, et ce qu'il choisit l'emporte sur tout ce qui suit. La méthode
> ci-dessous reste la plus rapide quand c'est vous qui préparez le site
> avant la livraison. Voir `ADMIN.md`.

## Passer aux vraies photos (2 minutes)

1. Déposez vos photos dans ce dossier avec **exactement ces noms** :

| Fichier attendu | Sujet | Format conseillé |
|---|---|---|
| `hero.jpg` | Salle en soirée / façade — **plein écran d'accueil** | paysage, ≥ 1920×1080 |
| `salle.jpg` | La salle, tables dressées | portrait ou 4:5 |
| `chef.jpg` | Le chef / la brigade | portrait 4:5 |
| `plat-1.jpg` … `plat-6.jpg` | Plats (entrée, plat, fromage, dessert…) | carré ou 3:4 |
| `cave.jpg` | La cave à vins | portrait 3:4 |
| `detail.jpg` | Détail de dressage | portrait 3:4 |
| `ambiance.jpg` | Ambiance du soir (bandeau réservation) | paysage large |

2. Ouvrez `assets/js/main.js` et passez la config à `true` :

```js
var SITE_CONFIG = {
  usePhotos: true,   // <— ici
};
```

C'est tout. Si une photo manque, le visuel d'origine reprend automatiquement
sa place — le site n'affiche jamais d'image cassée.

## Où trouver des photos (usage commercial autorisé)

- **Unsplash** (unsplash.com) et **Pexels** (pexels.com) : licences gratuites
  couvrant l'usage commercial, y compris pour une maquette client.
- **Les photos du restaurant lui-même** : toujours la meilleure option pour un
  site livré — demandez-les au client, ou faites appel à un photographe.

⚠️ N'utilisez pas de photos récupérées sur le site, la page Google ou les
réseaux d'un autre restaurant : c'est du contenu protégé, et présenter la
salle d'un tiers comme étant celle de votre client induit ses visiteurs en
erreur. Pour une maquette de démonstration, la banque d'images libre suffit.

## Optimisation

Avant mise en ligne, compressez les JPEG (~200–400 Ko pour le hero, ~100–200 Ko
pour les autres). Les dimensions ci-dessus sont des maximums utiles : inutile
de livrer du 6000 px.
