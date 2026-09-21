# La Table Dijonnaise — Template de site vitrine restaurant (Dijon)

Template **réutilisable et modifiable** de site vitrine pour restaurant à Dijon.
Projet **indépendant** du site `le-ptit-bouchon-dijonnais/` du dépôt — pas de
fichier partagé entre les deux. HTML5 / CSS3 / JavaScript vanilla, aucune
dépendance, aucun build step.

## Ce qui différencie ce projet du premier

- **Une vraie identité visuelle distincte** : crème / vert sapin / moutarde de
  Dijon (au lieu du bordeaux du premier site), pour ne pas être un simple reskin.
- **Un vrai formulaire de réservation fonctionnel** (voir plus bas), pas de
  boutons désactivés.
- Pensé comme un **template de base à personnaliser à la demande** : demandez
  à Claude de changer le nom, les couleurs, les textes, d'ajouter une section...
  toute la structure (variables CSS, config JS, contenu clairement identifié)
  est faite pour que ce soit rapide.

## Comment fonctionne la réservation (en toute légalité)

Sans base de données ni serveur, il est impossible de stocker de vraies
réservations sans **fabriquer** un faux système. Voici donc ce qui est
réellement livré et pourquoi :

1. **Par défaut** (`contact.html` + `assets/js/main.js`) : le formulaire valide
   les champs (nom, email, téléphone, date, heure, nombre de personnes), puis
   ouvre le client mail du visiteur avec un email pré-rempli à destination du
   restaurant. C'est honnête, ça fonctionne immédiatement, sans compte ni
   inscription, et **aucune donnée n'est envoyée à un serveur tiers**.
2. **Pour aller plus loin** (recommandé si vous recevez beaucoup de demandes),
   deux options légitimes et gratuites, documentées en commentaire dans
   `assets/js/main.js` (fonction `submitReservation`) :
   - [Formspree](https://formspree.io) — créez un compte gratuit, remplacez
     l'appel `mailto:` par le `fetch()` en exemple (déjà écrit, à décommenter).
   - Un widget de réservation existant (TheFork, Zenchef...) si vous avez déjà
     un compte chez l'un de ces prestataires — remplacez la section réservation
     par leur bouton/iframe officiel.

**Ne connectez jamais un faux système qui prétendrait confirmer une réservation
sans réellement la transmettre à quelqu'un** — ce serait trompeur pour vos clients.

## Adresse email de réservation

À définir dans `assets/js/main.js`, tout en haut du fichier :

```js
var SITE_CONFIG = {
  reservationEmail: "reservation@votre-restaurant-a-renseigner.fr",
};
```

## Structure

```
template-restaurant-dijon/
├── index.html                      Accueil
├── carte.html                      La carte (entrées / plats / desserts / vins)
├── restaurant.html                 Storytelling, savoir-faire, avis clients
├── galerie.html                    Galerie photo (grille + lightbox accessible)
├── contact.html                    Réservation (formulaire réel) + localisation
├── mentions-legales.html
├── politique-de-confidentialite.html
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/style.css               Design system (couleurs, typographie, composants)
    └── js/main.js                  Nav, reveal au scroll, lightbox, onglets carte, réservation
```

## ⚠️ À compléter avant mise en ligne

Cherchez `à renseigner` / `à venir` / `à compléter` dans le code :

- Coordonnées (adresse, téléphone, email, horaires)
- Adresse email de réservation (`SITE_CONFIG.reservationEmail`)
- Vraie carte et tarifs (`carte.html`, aperçu sur `index.html`)
- Vraies photos (remplacer les `.placeholder-image` par des `<img>`)
- Avis clients réels uniquement (`restaurant.html`)
- Liens réseaux sociaux
- Nom de domaine dans les balises SEO, `sitemap.xml`, `robots.txt`
- Horaires réels dans les créneaux du sélecteur d'heure (`contact.html`)

## Personnaliser rapidement (palette, nom, textes)

Tout est centralisé :

- **Couleurs** : variables `:root` en haut de `assets/css/style.css`.
- **Nom du restaurant / textes** : présents directement dans chaque page HTML
  (pas de système de template côté serveur — c'est un choix pour rester
  100% statique et déployable n'importe où).
- **Config réservation** : `SITE_CONFIG` en haut de `assets/js/main.js`.

Le plus simple reste de demander directement les changements dans la
conversation (couleurs, nom, sections à ajouter/retirer, ton du texte...).

## Aperçu local

```bash
cd template-restaurant-dijon
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```
