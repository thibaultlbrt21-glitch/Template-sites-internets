# Images — passer aux vraies photos

Les fichiers `.svg` livrés sont des **ambiances générées**, pas des
photographies : dégradés de bois, veinage produit par turbulence fractale,
lumière rasante et géométrie de l'ouvrage. Ils permettent de montrer le
template immédiatement, sans photo et sans problème de droits.

Ils ne représentent aucun chantier réel. **Ne les présentez jamais comme des
réalisations de l'entreprise.**

## Deux façons de mettre de vraies photos

**Par l'espace client** (ce que fait le menuisier) : il téléverse ses photos
depuis `/admin/`, sans toucher aux noms de fichiers. Ce qu'il choisit
l'emporte sur tout le reste. Voir `ADMIN.md`.

**Par les fichiers** (ce que vous faites avant la livraison) : déposez vos
photos ici avec **exactement ces noms**, puis passez `usePhotos: true` en haut
de `assets/js/main.js`. Si une photo manque, le visuel d'origine reprend sa
place — jamais d'image cassée.

| Fichier attendu | Sujet | Format conseillé |
|---|---|---|
| `hero-fond.jpg` | Chantier ou façade, vue large — **arrière-plan d'accueil** | paysage, ≥ 2000 px |
| `hero-avant.jpg` | Détail au premier plan (outil, profilé, niveau) | paysage, ≥ 2000 px |
| `atelier.jpg` | L'équipe sur un chantier | portrait 4:5 |
| `detail.jpg` | Gros plan : calfeutrement, quincaillerie, finition | portrait 4:5 |
| `real-fenetres.jpg` | Fenêtres posées — **l'avant/après est le plus vendeur** | portrait 4:5 |
| `real-porte.jpg` | Porte d'entrée posée | portrait 4:5 |
| `real-volets.jpg` | Volets roulants ou battants | portrait 4:5 |
| `real-escalier.jpg` | Escalier posé | portrait 4:5 |
| `real-portes-interieures.jpg` | Portes intérieures, huisseries | portrait 4:5 |
| `real-parquet.jpg` | Parquet posé | portrait 4:5 |
| `real-terrasse.jpg` | Terrasse, pergola ou bardage | portrait 4:5 |
| `real-garage.jpg` | Porte de garage ou portail | portrait 4:5 |
| `materiau-pvc.jpg` | Profilé PVC, à plat | carré, ≥ 800 px |
| `materiau-alu.jpg` | Profilé aluminium | carré |
| `materiau-bois.jpg` | Profilé bois lasuré | carré |
| `materiau-mixte.jpg` | Profilé mixte bois-aluminium | carré |

Exception : `intro-fenetre.webp`, `intro-poignee.webp` et `intro-dehors.webp`
viennent d'une **photo** (fenêtre bois dans une embrasure en pierre), fournie
comme libre de droits et retravaillée pour l'intro animée — voir « L'intro »
dans le README principal, où noter le lien de la licence. C'est une photo
d'ambiance, pas une réalisation de l'entreprise.

Les deux plans du jardin de la chambre dessinée en 3D (l'autre intro,
utilisée sans photo), `jardin-ciel.svg` et `jardin-haie.svg`, sont générés.

Les quatre textures de matériaux servent aussi au **visualiseur 3D** :
photographiez un morceau de profilé bien à plat, bien éclairé, sans reflet.
C'est ce qui donne un rendu crédible une fois plaqué sur la fenêtre.

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
