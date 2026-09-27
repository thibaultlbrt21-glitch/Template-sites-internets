# Images — passer aux vraies photos

Les fichiers `.svg` livrés sont des **ambiances générées**, pas des
photographies : dégradés de bois, veinage produit par turbulence fractale,
lumière rasante et géométrie de l'ouvrage. Ils permettent de montrer le
template immédiatement, sans photo et sans problème de droits.

Ils ne représentent aucun chantier réel. **Ne les présentez jamais comme des
réalisations de TDS Fermetures.** Le logo est dans `assets/logo/`.

## Deux façons de mettre de vraies photos

**Par l'espace client** (ce que fait TDS Fermetures) : on téléverse ses photos
depuis `/admin/`, sans toucher aux noms de fichiers. Ce qui y est choisi
l'emporte sur tout le reste. Voir `ADMIN.md`.

**Par les fichiers** (ce que vous faites avant la livraison) : déposez vos
photos ici avec **exactement ces noms**, puis passez `usePhotos: true` en haut
de `assets/js/main.js`. Si une photo manque, le visuel d'origine reprend sa
place — jamais d'image cassée.

| Fichier attendu | Sujet | Format conseillé |
|---|---|---|
| `hero-fond.jpg` | Chantier ou façade, vue large — **arrière-plan d'accueil** | paysage, ≥ 2000 px |
| `real-fenetres.jpg` | Fenêtres posées — **l'avant/après est le plus vendeur** | portrait 4:5 |
| `real-volets.jpg` | Volets roulants | portrait 4:5 |
| `real-porte.jpg` | Porte d'entrée posée | portrait 4:5 |
| `real-garage.jpg` | Porte de garage | portrait 4:5 |
| `real-portail.jpg` | Portail et clôture (visiophone si possible) | portrait 4:5 |
| `real-pergola.jpg` | Pergola | portrait 4:5 |


## Droits d'usage

Les photos de chantier appartiennent à l'entreprise : demandez-les. En
rénovation, un avant/après vaut dix photos de catalogue — et pensez à demander
l'accord du client avant de publier l'intérieur de chez lui.

À défaut, Unsplash et Pexels sont utilisables gratuitement, y compris pour un
site commercial. **Ne reprenez jamais les photos du site d'un concurrent** :
c'est une contrefaçon, et ça se voit.

## Poids

Compressez avant de déposer : visez 200 à 350 ko par image en 2000 px de large
(Squoosh, TinyPNG, ou `cwebp -q 78`). Les `.svg` livrés pèsent 8 ko chacun ;
ne perdez pas ce bénéfice avec des photos de 4 Mo sorties d'un reflex.
