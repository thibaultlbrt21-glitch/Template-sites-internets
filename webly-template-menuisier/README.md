# Webly Menuisier — Atelier Bois &amp; Trait

Cinquième template de la gamme « Webly », le plus abouti à ce jour : site
vitrine pour un **menuisier du bâtiment** — celui qui pose des fenêtres, des
portes, des volets et des escaliers, pas celui qui fabrique des meubles. Avec
**espace client** et **visualiseur 3D en WebGL**. HTML / CSS / JavaScript purs,
aucune dépendance, aucun build step, aucun CDN.

## Direction artistique — « le plan et le bois »

Le site alterne deux registres : la **matière** (bois plein cadre, lumière
rasante) et le **trait technique** (annotations en monospace, grille de plan,
cartouche à la manière d'un plan d'architecte). C'est ce contraste qui donne au
site sa signature — et qui le distingue des quatre autres templates.

| | bouchon | restaurant | mini | premium | **menuisier** |
|---|---|---|---|---|---|
| Ambiance | Bordeaux | Vert / moutarde | Ivoire minimal | Noir & laiton | **Bois & trait de plan** |
| Typographie | Serif | Serif | Serif fin | Serif | **Sans grasse + monospace** |
| Accueil | Dégradé | Dégradé | Typographique | Photo plein écran | **Parallaxe à deux couches** |
| Conversion | — | Formulaire | Formulaire | Modale | **Devis de chantier en 4 étapes** |
| 3D | — | — | — | — | **WebGL écrit à la main** |
| Espace client | — | — | — | Oui | **Oui** |

Aucun fichier partagé entre les cinq projets : chacun est autonome.

## L'intro : entrer dans le site par la fenêtre

Le visiteur arrive dans une **chambre claire**, face à une fenêtre PVC
blanche oscillo-battante deux vantaux, aux cotes d'un modèle du commerce
(**105 × 108 cm**, vantail principal à droite, poignée centrale). La scène
est **recréée** d'après l'ambiance d'une photo de référence — elle ne la
reprend pas : mur beige, chevet en noyer, bouquet d'hortensias, livres et
bougeoir, suspension à abat-jour blanc, lampe globe sur un tabouret, et un
jardin derrière la vitre (haie, arbre, pelouse). Au défilement, et
uniquement au défilement :

1. la **poignée** se relève et le vantail principal **bascule en oscillo** ;
2. il se referme, la poignée passe à l'horizontale ;
3. il **s'ouvre à la française**, puis le semi-fixe s'ouvre à son tour ;
4. la caméra, partie d'un trois-quarts en hauteur, se recentre et **passe
   par l'ouverture** — le haut de page apparaît.

L'éclairage imite une photo d'intérieur de jour : la fenêtre est la source
principale (jour direct qui décroît avec la distance, ciel sur les chants
des profilés), une lumière rebondie chaude éclaire le reste, plus sombre dans
les coins et au pied des meubles ; la suspension pose un halo chaud sur le
mur. Courbe filmique (ACES) pour des hautes lumières douces, jardin
légèrement surexposé comme sur une vraie photo exposée pour la pièce.

Détails de quincaillerie visibles : **têtières** métal sur les chants des
vantaux, **compas d'oscillo** qui apparaît quand le vantail bascule,
paumelles, arêtes des profilés arrondies.

Le jardin (`assets/images/jardin-ciel.svg`, `jardin-haie.svg`) est une
illustration générée, en deux plans pour la parallaxe. En passant
l'ouverture, on entre dans ce jardin, puis le haut de page du site apparaît
en fondu. En portrait (téléphone), le cadrage s'élargit pour garder le chevet
et son bouquet dans l'image.

Garde-fous :

- **pas d'intro** sous `prefers-reduced-motion`, ni sans WebGL : le haut de
  page est alors classique, rien ne manque ;
- **appareil trop lent** (plus d'une seconde pour démarrer la 3D, typique
  d'un rendu logiciel) : l'intro est abandonnée plutôt que de saccader ;
- la 3D démarre **en dernier**, une fois menu, formulaire et apparitions en
  place ;
- **aucune boucle d'animation** : on ne redessine que quand la page défile ;
- **clavier** : le lien d'évitement mène au titre, intro passée ; un bouton du
  haut de page qui reçoit le focus fait passer l'intro — jamais de focus sur
  un élément invisible.

La chorégraphie (seuils de défilement, angles) est décrite en tête de
`demarreIntro()` dans `assets/js/viseur3d.js`.

## Le visualiseur 3D

`assets/js/viseur3d.js` — un moteur WebGL écrit à la main, **sans three.js ni
aucune librairie**. Il montre une **fenêtre deux vantaux oscillo-battante**,
modélisée d'après des photos de menuiserie PVC réelle :

- dormant fin, ouvrants larges et **en saillie** sur le dormant ;
- **profil mouluré** : un biseau à coupes d'onglet descend du profil vers le
  vitrage. Chaque face penche d'un côté différent et prend une lumière
  différente — c'est ce qui dessine les diagonales aux quatre coins, et fait
  lire la moulure même vue de face ;
- **joint de vitrage noir**, double vitrage d'un seul tenant par vantail ;
- **poignée centrale** sur le vantail principal, **paumelles** apparentes.

Le vantail principal prend **trois positions, animées** au clic :
**fermée**, **oscillo** (basculé par le haut, la position d'aération) et
**à la française** (ouvert sur ses paumelles). Comme sur une vraie
quincaillerie, **c'est la poignée qui commande** : vers le bas fermée, à
l'horizontale pour la française, vers le haut pour l'oscillo. Le vantail ne
bouge que poignée en place, et la poignée ne tourne que vantail fermé —
passer d'oscillo à la française referme, tourne la poignée, puis ouvre.

Le rendu se fait en trois passes — menuiserie, joint, puis vitrage en
transparence sans écriture de profondeur, sans quoi le verre masquerait les
montants situés derrière lui. La matière suit le **fil de chaque pièce** :
le veinage monte sur les montants et court sur les traverses. Les textures
sont redessinées en 512 × 512 pour pouvoir se répéter le long des profils au
lieu d'être étirées (WebGL 1 n'autorise la répétition qu'en puissance de deux).

- Rotation au doigt, à la souris **et au clavier** (la scène est focusable,
  les flèches la font tourner)
- Au repos, balancement doux autour d'un trois-quarts, comme sur un
  présentoir : la fenêtre ne passe jamais de dos sans qu'on le lui demande
- Changement de matériau en direct (PVC, alu, bois, mixte), avec fiche
  technique synchronisée : entretien, isolation, durée de vie, budget
- Ne calcule rien quand la section est hors écran
- **Replis en cascade** : si WebGL manque, si la compilation échoue, si le
  contexte est perdu → un volume en CSS 3D prend la place, et les boutons
  d'ouverture, inopérants dans ce cas, sont retirés. Sous
  `prefers-reduced-motion`, les positions changent sans animation.

Pourquoi pas three.js : une librairie 3D pèse plusieurs centaines de
kilo-octets et dépend d'un CDN qui peut tomber. Ce fichier ne dépend de rien.

## Le reste des fonctionnalités

- **Section « Aides à la rénovation »** : MaPrimeRénov', CEE, TVA 5,5 %,
  éco-PTZ, avec les critères techniques opposables (Uw ≤ 1,3 W/m²·K, Sw ≥ 0,3,
  RGE obligatoire) et **aucun montant promis** — voir plus bas
- **Devis de chantier en quatre étapes** : type d'ouvrage, nombre d'ouvertures,
  matériau, type de pose, âge du logement (qui conditionne les aides). Jauge de
  progression, validation par étape, re-validation complète à l'envoi, annonce
  de l'étape aux lecteurs d'écran
- **Galerie de chantiers filtrable** par catégorie + **visionneuse** au clavier
  (`←` `→` `Échap`, piège de focus). La navigation suit le filtre actif
- **Cartes en relief** qui suivent le curseur — désactivées au doigt, où
  l'effet n'apporte rien
- **Parallaxe à deux couches** sur l'accueil
- **Espace client** : voir `ADMIN.md`
- Tout est désactivé sous `prefers-reduced-motion: reduce`

## Les images

Les visuels livrés sont des **ambiances générées** : le veinage du bois vient
d'une turbulence fractale très anisotrope, déplacée par un second bruit — ce
sont de vraies fibres, pas un dégradé. Chaque chantier a sa propre composition
(baies vitrées, lames de volet roulant, enfilade de portes, panneaux de porte
de garage, marches, point de Hongrie) : de loin on lit l'ouvrage, de près on
lit la matière.

Ils ne représentent aucun chantier réel. 👉 **Pour mettre de vraies photos :
voir `assets/images/README.md`.**

## Le formulaire

Il valide puis ouvre la messagerie du visiteur avec la demande pré-rédigée.
Aucune donnée n'est stockée sur le site — c'est honnête, fonctionnel
immédiatement et sans compte tiers. Pour brancher un vrai service (Formspree,
Brevo…), remplacez `envoieDevis()` dans `assets/js/main.js`.

L'adresse de réception se renseigne dans l'espace client
(*Demande de devis → Email qui reçoit les demandes*), ou à défaut en haut de
`assets/js/main.js`. La valeur du CMS l'emporte.

## Les aides à la rénovation — parti pris

C'est l'argument commercial numéro un du métier, et le piège juridique numéro
un. Le template affiche donc **les conditions, jamais les montants** :

- les critères techniques (Uw ≤ 1,3 W/m²·K, Sw ≥ 0,3 en métropole,
  remplacement de simple vitrage, logement de plus de 15 ans pour
  MaPrimeRénov', plus de 2 ans pour la TVA 5,5 %) sont stables et vérifiables ;
- les barèmes et plafonds changent chaque année, et dépendent des revenus du
  foyer — les afficher, c'est promettre ce qu'on ne maîtrise pas ;
- le site renvoie donc vers **France Rénov'**, le service public gratuit.

L'aide du CMS le rappelle au client à chaque modification de cette section, et
un contrôle automatique vérifie qu'aucune somme en euros ne s'y est glissée.

Toutes ces aides exigent une entreprise **qualifiée RGE** : le champ prévu doit
recevoir l'organisme, le numéro et la date de validité. Afficher une
qualification non détenue est un faux, et prive le client de ses aides.

## ⚠️ À compléter avant livraison client

- Coordonnées réelles : adresse, téléphone, email, horaires, zone
- **Certification RGE** : organisme, numéro, validité (section Aides)
- **Mentions légales** : SIRET, RCS ou Répertoire des métiers, directeur de
  publication, hébergeur, **garantie décennale**, médiateur de la consommation
- Photos réelles des chantiers, avant/après de préférence (voir ci-dessus)
- Chantiers : ne garder que des ouvrages réellement exécutés
- Avis : emplacements vides, à connecter à Google Avis ou Houzz
- Engagements du devis : n'annoncer que ce qui est tenu
- Nom de domaine dans les balises SEO, `sitemap.xml`, `robots.txt`
- Schema.org : `streetAddress`, `telephone`, `geo`, `areaServed`

## Ce qui a été vérifié

Mesuré dans Chromium, pas estimé.

| Vérification | Résultat |
|---|---|
| Contrastes WCAG AA | 19 combinaisons calculées, toutes ≥ 4,5:1 |
| Hydratation depuis `site.json` | textes, images et 11 listes |
| Repli sans `site.json` | page complète et identique |
| Liste vidée | section masquée, lien de menu masqué, contenu retiré du DOM |
| WebGL | rendu, vitrage transparent, rotation souris et clavier, changement de matériau |
| Ouvertures 3D | fermée, oscillo, à la française — poignée, enchaînements, bouton actif |
| Intro | début et fin, contenu cliquable après, lien d'évitement, focus clavier, 390 px |
| Intro — garde-fous | mouvement réduit, sans WebGL, appareil lent : haut de page classique |
| Navigation sur le haut de page | contraste mesuré sur la capture : 9,7:1 |
| Section Aides | 4 dispositifs, critères techniques, RGE, renvoi France Rénov', **aucune somme en euros** |
| Repli sans WebGL | volume CSS 3D affiché, boutons d'ouverture retirés |
| Devis 4 étapes | cas valides et invalides, retour arrière |
| Galerie | filtres + visionneuse clavier |
| Largeurs | 390 px et 1440 px, sans scroll horizontal |
| Erreurs JavaScript | aucune |

**Non vérifiable ici** : l'interface Decap réelle et la connexion GitHub — les
CDN et le registre npm sont inaccessibles depuis l'environnement de génération.
`admin/demo.html` permet malgré tout de montrer l'espace client.

## Structure

```
webly-template-menuisier/
├── index.html                    Page unique
├── ADMIN.md                      Guide d'activation de l'espace client
├── mentions-legales.html
├── politique-de-confidentialite.html
├── robots.txt
├── sitemap.xml
├── content/
│   └── site.json                 Contenu modifiable (source de vérité)
├── admin/
│   ├── index.html                Espace client (Decap CMS)
│   ├── config.yml                Champs éditables, en français
│   └── demo.html                 Aperçu autonome (généré)
├── tools/
│   ├── build-admin-demo.py       Regénère demo.html depuis config.yml
│   └── admin-demo.template.html
└── assets/
    ├── favicon.svg
    ├── css/style.css             Design system « plan et bois »
    ├── js/content.js             Injecte site.json dans la page
    ├── js/viseur3d.js            Moteur WebGL, sans dépendance (fenêtre oscillo-battante)
    ├── js/main.js                Navigation, filtres, visionneuse, devis
    └── images/                   Ambiances générées + README
```

## Aperçu local

```bash
cd webly-template-menuisier
python3 -m http.server 8080
# puis http://localhost:8080
```

Pour montrer l'espace client à un prospect, sans rien installer :
`http://localhost:8080/admin/demo.html`.
