# Le P'tit Bouchon Dijonnais — Site du restaurant

Site vitrine premium pour un bouchon bourguignon fictif/à personnaliser, « Le P'tit
Bouchon Dijonnais » (Dijon). Livré en **HTML5 / CSS3 / JavaScript vanilla, sans
dépendance ni build step**.

## Pourquoi pas Next.js / TypeScript / Tailwind ?

C'est la stack qui avait été demandée par défaut. Elle a été scaffoldée mais
l'installation a échoué : la politique réseau de l'environnement où ce site a été
généré bloque `registry.npmjs.org`, `fonts.googleapis.com` et les CDN (`unpkg.com`,
`cdn.jsdelivr.net`…) — seul `github.com` était accessible. Impossible d'installer
Next.js, React, Tailwind ou les polices Google Fonts.

Ce site livre le **même résultat visuel et fonctionnel** (design, animations,
accessibilité, SEO, performance) sans aucune dépendance externe — donc encore plus
rapide à charger, et utilisable immédiatement sans `npm install`.

### Migrer vers Next.js / TypeScript / Tailwind plus tard

Si vous avez un accès npm complet :

```bash
npx create-next-app@latest le-ptit-bouchon-dijonnais-next --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Puis reportez le contenu (textes, structure des sections, palette de couleurs,
copy SEO) de ce dossier HTML dans des composants React. La palette et les polices
recommandées dans le brief d'origine (Cormorant Garamond / Jost via
`next/font/google`) peuvent être branchées directement une fois l'accès réseau
disponible.

## Structure

```
le-ptit-bouchon-dijonnais/
├── index.html                      Accueil (hero, intro, spécialités, aperçu carte, réservation)
├── carte.html                      La carte complète (entrées / plats / desserts / vins)
├── restaurant.html                 Le restaurant (storytelling, savoir-faire, avis clients)
├── galerie.html                    Galerie photo (grille + lightbox accessible)
├── contact.html                    Réservation + localisation + horaires
├── mentions-legales.html
├── politique-de-confidentialite.html
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/style.css               Design system (couleurs, typographie, composants)
    └── js/main.js                  Nav mobile, header au scroll, reveal au scroll, onglets carte, lightbox
```

## ⚠️ Informations à compléter avant mise en ligne

Aucune donnée factuelle n'a été inventée. Cherchez `à renseigner` / `à venir` /
`à compléter` dans le code pour repérer chaque emplacement à personnaliser :

- **Coordonnées** : adresse, téléphone, email, horaires (`contact.html`, footer de
  chaque page, `mentions-legales.html`).
- **Réservation** : les boutons « Appeler » / « Écrire par email » sont désactivés
  tant que le téléphone/email ne sont pas renseignés (`contact.html`). Si vous
  utilisez un outil comme TheFork ou Zenchef, remplacez le bloc de réservation par
  un lien vers votre widget.
- **Carte / menu** : tous les plats affichés sont des exemples de mise en page
  (`« Nom du plat » — description — XX €`) à remplacer par la vraie carte et les
  tarifs (`carte.html`, aperçu sur `index.html`).
- **Photos** : aucune photo réelle n'est utilisée. Les visuels sont des
  illustrations SVG stylisées avec légende explicite (« photo à venir »). Pour
  intégrer de vraies photos, remplacez le composant `.placeholder-image` par une
  balise `<img>` (avec `loading="lazy"`, `width`/`height` et un `alt` descriptif)
  dans `index.html`, `restaurant.html` et `galerie.html`.
- **Avis clients** : la section « Avis clients » (`restaurant.html`) est une
  structure vide avec placeholders — n'y insérez que des avis réels et vérifiés.
- **Réseaux sociaux** : liens Instagram/Facebook du footer pointent vers `#`.
- **SEO** : remplacez `https://votre-domaine-a-renseigner.fr` par le vrai nom de
  domaine dans les balises `<link rel="canonical">`, `og:url`, `sitemap.xml` et
  `robots.txt`. Complétez `streetAddress`, `telephone`, `openingHoursSpecification`
  et `geo` dans le JSON-LD de `index.html` une fois les informations disponibles.

## Points techniques

- **Accessibilité** : HTML sémantique, lien d'évitement, focus visible, aria-labels,
  navigation clavier complète (menu mobile et lightbox avec piège de focus et
  fermeture `Échap`), contrastes conformes.
- **Performance** : zéro dépendance externe, zéro requête réseau bloquante, CSS/JS
  minimaux, polices système (pas de web font à charger).
- **Animations** : apparition progressive au scroll (IntersectionObserver),
  micro-interactions sur boutons/cartes, entièrement désactivées si
  `prefers-reduced-motion: reduce`.
- **Responsive** : mobile-first, menu hamburger accessible, CTA de réservation
  flottant sur mobile, grille de galerie qui se réadapte.

## Aperçu local

Aucun outil requis :

```bash
cd le-ptit-bouchon-dijonnais
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```
