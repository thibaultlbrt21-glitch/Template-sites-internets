# Images — passer aux vraies photos

Les fichiers `.svg` livrés sont des **ambiances générées**, pas des
photographies : dégradés de bois, veinage produit par turbulence fractale,
lumière rasante et géométrie de l'ouvrage. Ils permettent de montrer le
template immédiatement, sans photo et sans problème de droits.

Ils ne représentent aucun atelier réel. **Ne les présentez jamais comme les
réalisations d'un menuisier.**

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
| `hero-fond.jpg` | Atelier, vue large — **arrière-plan d'accueil** | paysage, ≥ 2000 px |
| `hero-avant.jpg` | Détail au premier plan (copeaux, établi, outil) | paysage, ≥ 2000 px |
| `atelier.jpg` | L'atelier, le menuisier au travail | portrait 4:5 |
| `detail.jpg` | Gros plan d'assemblage, tenon-mortaise, finition | portrait 4:5 |
| `real-escalier.jpg` | Escalier réalisé | portrait 4:5 |
| `real-bibliotheque.jpg` | Bibliothèque / rangement sur mesure | portrait 4:5 |
| `real-cuisine.jpg` | Cuisine, plan de travail | portrait 4:5 |
| `real-dressing.jpg` | Dressing, placards | portrait 4:5 |
| `real-porte.jpg` | Porte, fenêtre, menuiserie extérieure | portrait 4:5 |
| `real-parquet.jpg` | Parquet posé | portrait 4:5 |
| `real-terrasse.jpg` | Terrasse, bardage | portrait 4:5 |
| `real-agencement.jpg` | Agencement de commerce ou de bureau | portrait 4:5 |
| `essence-chene.jpg` | Échantillon de chêne, à plat | carré, ≥ 800 px |
| `essence-noyer.jpg` | Échantillon de noyer | carré |
| `essence-frene.jpg` | Échantillon de frêne | carré |
| `essence-chataignier.jpg` | Échantillon de châtaignier | carré |

Les quatre échantillons d'essences servent aussi de **texture au visualiseur
3D** : prenez-les bien à plat, bien éclairés, sans reflet, le fil du bois à
l'horizontale. C'est ce qui donne un rendu crédible une fois plaqué sur le
volume.

## Droits d'usage

Les photos du menuisier lui appartiennent : demandez-les, c'est toujours mieux
que n'importe quelle banque d'images, et c'est ce qui vend son travail.

À défaut, Unsplash et Pexels sont utilisables gratuitement, y compris pour un
site commercial. **Ne reprenez jamais les photos du site d'un concurrent** :
c'est une contrefaçon, et ça se voit.

## Poids

Compressez avant de déposer : visez 200 à 350 ko par image en 2000 px de large
(Squoosh, TinyPNG, ou `cwebp -q 78`). Les `.svg` livrés pèsent 8 ko chacun ;
ne perdez pas ce bénéfice avec des photos de 4 Mo sorties d'un reflex.
