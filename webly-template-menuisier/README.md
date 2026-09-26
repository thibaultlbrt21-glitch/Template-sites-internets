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

## Le visualiseur 3D

`assets/js/viseur3d.js` — un moteur WebGL écrit à la main, **sans three.js ni
aucune librairie**. Une fenêtre à deux vantaux — dormant, ouvrants, traverse,
poignée — construite par le code, habillée du matériau choisi et éclairée en
Blinn-Phong avec deux sources : une clé chaude et un remplissage froid.

Un vantail est entrebâillé : c'est ce qui la fait lire comme une fenêtre au
premier coup d'œil plutôt que comme un cadre. Le **vitrage est rendu en
seconde passe**, en transparence et sans écriture de profondeur — sans quoi il
masquerait les montants situés derrière lui.

- Rotation au doigt, à la souris, **et au clavier** (la scène est focusable,
  les flèches la font tourner)
- Inertie après le relâchement, rotation lente au repos
- Changement de matériau en direct (PVC, alu, bois, mixte), avec fiche
  technique synchronisée : entretien, isolation, durée de vie, budget
- Ne calcule rien quand la section est hors écran
- **Replis en cascade** : si WebGL manque, si la compilation échoue, si le
  contexte est perdu, ou si `prefers-reduced-motion` est actif → un volume en
  CSS 3D prend la place, sans page cassée

Pourquoi pas three.js : une librairie 3D pèse plusieurs centaines de kilo-octets
et dépend d'un CDN qui peut tomber. Ce fichier fait 15 ko et ne dépend de rien.

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
| Section Aides | 4 dispositifs, critères techniques, RGE, renvoi France Rénov', **aucune somme en euros** |
| Repli sans WebGL | volume CSS 3D affiché |
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
    ├── js/viseur3d.js            Moteur WebGL, sans dépendance (fenêtre + vitrage)
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
