# Webly Premium — Comptoir des Ducs (template restaurant, Dijon)

Quatrième template de la gamme "Webly", positionné **haut de gamme** :
expérience cinématographique sombre, photo plein écran dès l'arrivée,
animations orchestrées, interactions signature. HTML / CSS / JS vanilla,
aucune dépendance, aucun build step.

## Ce qui le distingue des trois autres

| | bouchon | webly-template-restaurant | mini | **premium** |
|---|---|---|---|---|
| Ambiance | Bordeaux chaleureux | Vert / moutarde | Ivoire minimal | **Noir & laiton, cinéma** |
| Accueil | Hero dégradé | Hero dégradé | Hero clair typographique | **Photo plein écran + Ken Burns** |
| Animations | Reveal simple | Reveal simple | Reveal simple | **Rideau, masques, parallaxe, compteurs** |
| Réservation | Placeholder | Formulaire inline | Formulaire compact | **Modale accessible** |
| Signature | — | — | — | **Aperçu photo au survol de la carte** |

Aucun fichier partagé entre les quatre projets : chacun est autonome.

## Interactions et animations

- **Rideau d'ouverture** (nom de la maison) puis entrée du hero — filet de
  sécurité intégré : le rideau ne peut pas rester bloqué.
- **Hero plein écran** avec zoom lent (Ken Burns) et titres révélés par masque.
- **En-tête** transparent sur la photo, opaque au défilement.
- **Parallaxe** sur les visuels + **rideau d'apparition** (clip-path).
- **Aperçu photo qui suit le curseur** au survol des plats (desktop).
- **Galerie horizontale** à défilement avec accroche magnétique.
- **Compteurs animés** sur les chiffres clés.
- **Modale de réservation** accessible : piège de focus, `Échap`, retour du
  focus au bouton d'origine.
- Tout est désactivé si `prefers-reduced-motion: reduce`.

## Les images

Les visuels livrés sont des **ambiances SVG art-dirigées** (dégradés chauds,
flou, grain), pas des photographies — l'environnement de génération n'avait pas
accès aux banques d'images.

👉 **Pour mettre de vraies photos : voir `assets/images/README.md`** (déposer
les fichiers aux bons noms + passer `usePhotos: true` dans
`assets/js/main.js`). Si une photo manque, le visuel d'origine reprend sa
place : jamais d'image cassée.

## Réservation

Le formulaire valide les champs puis ouvre le client mail du visiteur avec la
demande pré-remplie. Aucune donnée n'est stockée sur le site — c'est honnête,
fonctionnel immédiatement, et sans compte tiers. Pour brancher un vrai backend
(Formspree, TheFork, Zenchef...), remplacez `submitReservation()` dans
`assets/js/main.js` — voir le README de `webly-template-restaurant/` pour le
détail.

Adresse de réception à définir en haut de `assets/js/main.js` :

```js
var SITE_CONFIG = {
  reservationEmail: "reservation@votre-restaurant-a-renseigner.fr",
  usePhotos: false,
};
```

## ⚠️ À compléter avant livraison client

- Coordonnées (adresse, téléphone, email, horaires réels)
- Carte réelle et tarifs — **la carte actuelle est un exemple** (classiques
  bourguignons génériques, clairement signalés comme tels sur la page)
- Chiffres clés (section "Couverts / Références en cave...") — exemples
- Avis clients : emplacements vides, à connecter à Google Avis / TripAdvisor.
  Aucun avis n'est inventé.
- Photos réelles (voir ci-dessus)
- Nom de domaine dans les balises SEO, `sitemap.xml`, `robots.txt`
- Créneaux horaires du sélecteur de réservation

## Structure

```
webly-template-restaurant-premium/
├── index.html                      Page unique (hero, maison, carte, galerie, chef, chiffres, avis, réservation, infos)
├── mentions-legales.html
├── politique-de-confidentialite.html
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/style.css               Design system noir & laiton
    ├── js/main.js                  Preloader, reveals, parallaxe, aperçu carte, compteurs, modale, formulaire
    └── images/                      Visuels d'ambiance + README pour les vraies photos
```

## Aperçu local

```bash
cd webly-template-restaurant-premium
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```
