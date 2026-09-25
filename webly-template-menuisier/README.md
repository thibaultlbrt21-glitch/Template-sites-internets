# Webly Menuisier — Atelier Bois &amp; Trait

Cinquième template de la gamme « Webly », le plus abouti à ce jour : site
vitrine pour menuisier, ébéniste ou agenceur, avec **espace client** et
**visualiseur 3D en WebGL**. HTML / CSS / JavaScript purs, aucune dépendance,
aucun build step, aucun CDN.

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
| Conversion | — | Formulaire | Formulaire | Modale | **Devis en 4 étapes** |
| 3D | — | — | — | — | **WebGL écrit à la main** |
| Espace client | — | — | — | Oui | **Oui** |

Aucun fichier partagé entre les cinq projets : chacun est autonome.

## Le visualiseur 3D

`assets/js/viseur3d.js` — un moteur WebGL écrit à la main, **sans three.js ni
aucune librairie**. Un meuble (caisson, tablettes, pieds) construit par le code,
texturé avec l'échantillon de bois choisi, éclairé en Blinn-Phong avec deux
sources : une clé chaude et un remplissage froid.

- Rotation au doigt, à la souris, **et au clavier** (la scène est focusable,
  les flèches la font tourner)
- Inertie après le relâchement, rotation lente au repos
- Changement d'essence en direct, avec fiche technique synchronisée
- Ne calcule rien quand la section est hors écran
- **Replis en cascade** : si WebGL manque, si la compilation échoue, si le
  contexte est perdu, ou si `prefers-reduced-motion` est actif → un volume en
  CSS 3D prend la place, sans page cassée

Pourquoi pas three.js : une librairie 3D pèse plusieurs centaines de kilo-octets
et dépend d'un CDN qui peut tomber. Ce fichier fait 15 ko et ne dépend de rien.

## Le reste des fonctionnalités

- **Devis en quatre étapes** avec jauge de progression, validation par étape,
  re-validation complète à l'envoi (le visiteur peut revenir en arrière et
  vider un champ), annonce de l'étape aux lecteurs d'écran
- **Galerie filtrable** par catégorie + **visionneuse** au clavier
  (`←` `→` `Échap`, piège de focus). La navigation suit le filtre actif
- **Cartes en relief** qui suivent le curseur — désactivées au doigt, où
  l'effet n'apporte rien
- **Parallaxe à deux couches** sur l'accueil
- **Espace client** : voir `ADMIN.md`
- Tout est désactivé sous `prefers-reduced-motion: reduce`

## Les images

Les visuels livrés sont des **ambiances générées** : le veinage du bois vient
d'une turbulence fractale très anisotrope, déplacée par un second bruit — ce
sont de vraies fibres, pas un dégradé. Chaque réalisation a sa propre
composition (marches, lattes, étagères, point de Hongrie) : de loin on lit
l'objet, de près on lit la matière.

Ils ne représentent aucun atelier réel. 👉 **Pour mettre de vraies photos :
voir `assets/images/README.md`.**

## Le formulaire

Il valide puis ouvre la messagerie du visiteur avec la demande pré-rédigée.
Aucune donnée n'est stockée sur le site — c'est honnête, fonctionnel
immédiatement et sans compte tiers. Pour brancher un vrai service (Formspree,
Brevo…), remplacez `envoieDevis()` dans `assets/js/main.js`.

L'adresse de réception se renseigne dans l'espace client
(*Demande de devis → Email qui reçoit les demandes*), ou à défaut en haut de
`assets/js/main.js`. La valeur du CMS l'emporte.

## ⚠️ À compléter avant livraison client

- Coordonnées réelles : adresse, téléphone, email, horaires, zone
- **Mentions légales** : SIRET, RCS ou Répertoire des métiers, directeur de
  publication, hébergeur, **garantie décennale**, médiateur de la consommation
- Photos réelles des chantiers (voir ci-dessus)
- Réalisations : ne garder que des ouvrages réellement exécutés
- Avis : emplacements vides, à connecter à Google Avis ou Houzz
- Engagements du devis : n'annoncer que ce qui est tenu
- Nom de domaine dans les balises SEO, `sitemap.xml`, `robots.txt`
- Schema.org : `streetAddress`, `telephone`, `geo`, `areaServed`

## Ce qui a été vérifié

Mesuré dans Chromium, pas estimé.

| Vérification | Résultat |
|---|---|
| Contrastes WCAG AA | 19 combinaisons calculées, toutes ≥ 4,5:1 |
| Hydratation depuis `site.json` | textes, images et 10 listes |
| Repli sans `site.json` | page complète et identique |
| Liste vidée | section masquée, lien de menu masqué, contenu retiré du DOM |
| WebGL | rendu, rotation souris, rotation clavier, changement d'essence |
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
    ├── js/viseur3d.js            Moteur WebGL, sans dépendance
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
