# Pilliard Menuiserie Agencement — site vitrine

Site vitrine d'une page (plus les mentions légales) pour **Pilliard Menuiserie
Agencement** : menuiserie et agencement sur mesure.
HTML / CSS / JavaScript purs : aucune dépendance, aucun build, aucun CDN,
aucune police externe. Il suffit de déposer le dossier chez n'importe quel
hébergeur statique.

## Ce qui rend ce site différent

| Moment | Ce qui se passe |
|---|---|
| Ouverture | Le monogramme PMA s'affiche pendant que le bois est « préparé », puis un trait de scie ouvre la page (une seule fois par visite, ignoré si le visiteur a demandé moins d'animations). |
| Accueil | Un **panneau de bois massif avec le monogramme gravé**, calculé dans le navigateur. Il s'incline et accroche la lumière au passage de la souris. Les boutons d'essence regravent le panneau en chêne, noyer, frêne, douglas, mélèze ou ipé. |
| Partout | Au survol, les boutons se « plaquent » de chêne. Une règle graduée suit la lecture sur grand écran. |
| L'atelier | Le texte d'intention s'écrit au fil de la lecture. |
| Prestations | Au survol d'une ligne, le **plan d'atelier** correspondant se dessine sous la souris. Sur mobile, un toucher ouvre le plan. |
| Méthode | Une **queue d'aronde** s'assemble pendant que l'on fait défiler les 4 étapes (relevé, plan, atelier, pose), jusqu'à un petit nuage de sciure. |
| Réalisations | Chaque projet se dessine trait par trait, puis prend son bois. Le projet terrasse affiche la vraie photo de chantier. |
| Essences | Six échantillons de bois qui s'ouvrent en fiche technique : teinte, densité, dureté, usage. |
| Votre projet | Un formulaire en 4 questions qui remplit en direct un **bon d'atelier**, tamponné « Reçu » à l'envoi. |

Aucune de ces textures n'est une photo : `assets/js/bois.js` les calcule
(bruit simplex, cernes, fibres, pores). Elles ne pèsent rien et restent nettes
à toutes les tailles.

## Ce qui vient du client

- **Logo** : redessiné en vectoriel (`assets/logo/pma.svg`) d'après la photo
  du monogramme. Le P porte la branche de feuillage, le A la lame de scie. La
  photo reçue était recadrée et petite (224 px) : si le client a le fichier
  d'origine, mieux vaut le comparer et ajuster.
- **Photo** : la terrasse en bois exotique (`assets/images/terrasse-bois.jpg`),
  projet n° 01 des réalisations.

Tout le reste (textes, plans, fiches d'essences) est rédigé pour le site et
reste générique. **Rien n'est inventé sur l'entreprise** : ni date de création,
ni chiffres, ni avis clients, ni adresse.

## À compléter avant la mise en ligne

1. **Coordonnées** : tout est dans `assets/js/config.js` (téléphone, e-mail,
   adresse de l'atelier, horaires). Elles sont reportées partout
   automatiquement. Les valeurs actuelles (`06 00 00 00 00`,
   `contact@pilliard-menuiserie.fr`) sont des **exemples**.
2. **Réception des devis** : renseigner `devis.destinataire` dans
   `config.js`. Tant que ce champ est vide, le formulaire tourne en **mode
   démonstration** : il fonctionne entièrement mais n'envoie rien, et le
   précise au visiteur. Une fois l'adresse renseignée, les demandes partent
   par e-mail via FormSubmit (gratuit, sans compte). À la toute première
   demande, FormSubmit envoie un e-mail « Activate Form » : il faut cliquer
   une fois sur le bouton pour activer l'envoi.
   Sans connexion ou en cas d'échec, le visiteur voit un bouton qui ouvre sa
   messagerie avec la demande déjà rédigée.
3. **Mentions légales** (`mentions-legales.html`) : les champs surlignés
   « à compléter » (forme juridique, SIRET, assurance décennale…) sont
   obligatoires.
4. **Domaine** : remplacer `votre-domaine-a-renseigner.fr` dans `robots.txt`
   et `sitemap.xml`. Mettre l'adresse complète dans `og:image`
   (`index.html`) pour l'aperçu sur les réseaux sociaux.

## Ajouter des photos de chantier

Dans `index.html`, section `#realisations`, chaque projet est un
`<article class="projet">`. Pour qu'un projet affiche une vraie photo en
mode « Fini » (au lieu du plan habillé de bois), il suffit de faire comme pour
la terrasse : ajouter dans `.projet__feuille`

```html
<img class="projet__photo" src="assets/images/ma-photo.jpg" alt="Description" loading="lazy">
<span class="projet__tampon">Photo de chantier</span>
```

Format conseillé : paysage 4:3, 1600 px de large, JPEG qualité 80.
On peut aussi modifier le titre, la description et l'essence
(`data-essence="chene"`, `noyer`, `frene`, `douglas`, `meleze` ou `ipe`)
de chaque projet.

## Fichiers

```
index.html               la page
mentions-legales.html    mentions légales, données personnelles, cookies
assets/css/style.css     toute la mise en forme
assets/js/config.js      coordonnées et réception des devis  ← à modifier
assets/js/bois.js        générateur de textures de bois
assets/js/dessins.js     les six plans d'atelier (SVG)
assets/js/main.js        interactions
assets/logo/pma.svg      monogramme vectoriel
assets/favicon.svg       icône d'onglet
assets/images/           photo de la terrasse, image de partage (réseaux sociaux)
tools/generer-dessins.py régénère dessins.js (python3 tools/generer-dessins.py)
```

## Accessibilité et performances

- Contrastes vérifiés (texte courant ≥ 4,5:1 sur tous les fonds).
- Navigation complète au clavier, lien d'évitement, focus visibles.
- `prefers-reduced-motion` respecté : pas d'ouverture, pas de défilement
  automatique, états finaux affichés directement.
- Sans JavaScript, le contenu reste lisible (seules les animations et le
  bois calculé disparaissent).
- Poids total hors photos : environ 180 Ko non compressés, sans aucune requête
  externe.
