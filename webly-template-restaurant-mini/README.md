# Webly Mini — Racine, template restaurant sobre & premium (Dijon)

Troisième template de la gamme "Webly", positionné comme l'offre **d'entrée
de gamme ("Mini")** : une seule page, direction artistique volontairement
différente des deux autres — sobre, épurée, premium. HTML5 / CSS3 /
JavaScript vanilla, aucune dépendance, aucun build step.

## Ce qui différencie ce template des deux autres

| | `le-ptit-bouchon-dijonnais` | `webly-template-restaurant` | `webly-template-restaurant-mini` |
|---|---|---|---|
| Ambiance | Bouchon bourguignon, chaleureux | Bistrot vert/moutarde | **Minimaliste, épuré, boutique** |
| Palette | Bordeaux / ivoire | Vert sapin / moutarde | **Ivoire / graphite / argile** |
| Structure | 5 pages | 5 pages | **1 page (ancres)** |
| Réservation | Placeholder | Formulaire complet (stepper) | **Formulaire compact** |
| Positionnement | — | Offre complète | **Offre "Mini"** |

Aucun fichier n'est partagé entre ces trois projets — chacun est autonome
et peut être personnalisé sans risque d'impacter les autres.

## Réservation (identique en principe aux autres templates)

Le formulaire valide les champs (nom, email, date, nombre de personnes),
puis ouvre le client mail du visiteur avec la demande pré-remplie —
aucune donnée n'est envoyée à un serveur. Adresse email à définir dans
`assets/js/main.js` :

```js
var SITE_CONFIG = {
  reservationEmail: "reservation@votre-restaurant-a-renseigner.fr",
};
```

Pour connecter un vrai backend (Formspree, widget TheFork/Zenchef...),
voir le README de `webly-template-restaurant/` qui détaille la marche à
suivre — le principe est identique ici.

## Structure

```
webly-template-restaurant-mini/
├── index.html                      Page unique (hero, à propos, carte, galerie, réservation)
├── mentions-legales.html
├── politique-de-confidentialite.html
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/style.css               Design system sobre (ivoire / graphite / argile)
    └── js/main.js                  Nav, reveal au scroll, lightbox, réservation
```

## ⚠️ À compléter avant mise en ligne

Cherchez `à renseigner` / `à venir` / `à compléter` dans le code :
coordonnées, adresse email de réservation, vraie carte et tarifs,
vraies photos (remplacer `.placeholder-image` par des `<img>`), nom de
domaine dans les balises SEO.

## Personnaliser rapidement

- **Couleurs** : variables `:root` en haut de `assets/css/style.css`.
- **Nom du restaurant / textes** : directement dans `index.html`.
- **Config réservation** : `SITE_CONFIG` en haut de `assets/js/main.js`.

Le plus simple reste de demander les changements directement dans la
conversation.

## Aperçu local

```bash
cd webly-template-restaurant-mini
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```
