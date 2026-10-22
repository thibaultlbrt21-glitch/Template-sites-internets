# TDS Fermetures — site internet

Site vitrine de **TDS Fermetures** (Tiago Dos Santos) : portes, fenêtres,
volets roulants, portails et clôtures, portes de garage, pergolas,
automatismes et visiophones. Construit sur le modèle « menuisier » de la gamme
Webly, avec **espace client** et **devis envoyé par e-mail**.
HTML / CSS / JavaScript purs, aucune dépendance, aucun build step, aucun CDN.

## Ce qui vient de la carte de visite

Tout ce qui est affiché comme un fait vient de la carte de visite de
l'entreprise — rien n'est inventé :

| Information | Sur le site |
|---|---|
| Nom et logo : TDS Fermetures | En-tête, pied de page, section « L'entreprise », favicon |
| Tiago Dos Santos | Encadré d'accueil, section « L'entreprise », contact, mentions légales |
| 06 58 00 82 26 | Tous les boutons « Appeler » (lien `tel:+33658008226`) |
| tiagotdsfermetures.21@hotmail.com (« Client ») | Contact, et **adresse qui reçoit les devis** |
| sarltdsfermetures.21@hotmail.com (« Fournisseur ») | Contact, ligne « Fournisseurs » |
| Porte, fenêtre, volet, portail, pergola, automatisme, visiophone, porte de garage | Les 8 prestations et le formulaire |
| Accompagnement · Qualité · Pose soignée · SAV réactif | Le bandeau orange |

Le **logo** est redessiné en vectoriel d'après la carte
(`assets/logo/tds-fermetures.svg`, variante claire pour les fonds sombres).
Si le graphiste a le fichier d'origine, il suffit de le déposer à la place.

## Direction artistique — l'orange TDS

L'orange de la marque (`#F39200`) porte tout ce qui agit ou signale : boutons,
bandeau des engagements, filets, numéros, titres d'accent. L'anthracite du
logo sert aux textes et aux grands aplats (devis, pied de page),
le blanc cassé au reste — comme sur la carte.

Contrastes vérifiés : texte anthracite sur orange 7:1 (les boutons orange ont
donc un texte foncé, jamais blanc — blanc sur orange ne fait que 2,3:1) ;
orange foncé `#A85200` pour le texte orange sur fond clair (5:1) ; orange de
marque sur anthracite 6,7:1.

## Haut de page

Texte sur anthracite à gauche (titre, boutons « Demander un devis » et
« Appeler »), **photos en fondu enchaîné à droite**, séparées par un filet
orange, avec l'encadré du dirigeant posé dessus. Pas de parallaxe : la photo défile avec la page, pour rester fluide à 120 Hz. Sous les boutons, un repère
dans le style du formulaire de devis : une jauge par photo (cliquable), la
légende et le crédit de la photo affichée, et un bouton **Pause** (un
contenu qui défile seul doit pouvoir être arrêté). Sous 960 px, la photo
passe en plein fond sous un voile anthracite.

Les photos se changent depuis l'espace client (*Bandeau d'accueil → Photos*).
Liste vide : l'accueil redevient un bandeau de texte seul, sans trou.
L'ancienne fenêtre 3D et l'animation d'ouverture restent dans l'historique
Git (commit « l'intro ouvre une vraie photo de fenêtre »).

## Le reste des fonctionnalités

- **Section « TVA réduite »** (l'entreprise n'est pas RGE) : TVA 10 % et 5,5 %,
  primes réservées aux entreprises RGE ; anciennement MaPrimeRénov', CEE, TVA 5,5 %,
  éco-PTZ, avec les critères techniques opposables (Uw ≤ 1,3 W/m²·K, Sw ≥ 0,3,
  RGE obligatoire) et **aucun montant promis** — voir plus bas
- **Devis en quatre étapes** : projet (9 choix, SAV compris), quantité ou
  dimensions, motorisation, type de projet, âge du logement (qui conditionne
  les aides), délai, budget, commune. Jauge de progression, validation par
  étape, re-validation complète à l'envoi, annonce de l'étape aux lecteurs
  d'écran — et **envoi direct par e-mail** (voir plus bas)
- **Bandeau orange des engagements** : les quatre mots de la carte de visite
- **Boutons « Appeler »** partout (en-tête, accueil, contact, barre mobile)
- **Galerie « En images » en mosaïque**, filtrable par catégorie : une photo
  en largeur prend deux cases, le format est lu sur l'image elle-même.
  **Visionneuse** au clavier (`←` `→` `Échap`, piège de focus), avec le
  crédit de la photo. La navigation suit le filtre actif
- **Cartes en relief** qui suivent le curseur — désactivées au doigt, où
  l'effet n'apporte rien
- **Espace client** : voir `ADMIN.md`
- Tout est désactivé sous `prefers-reduced-motion: reduce`

## Les images

Les photos en place sont des **photos du fabricant FenêtréA**, transmises par
TDS Fermetures : fenêtres, baies coulissantes et portes d'entrée. Ce ne sont
**pas des chantiers de l'entreprise**, et le site ne les présente jamais
comme tels : crédit « Photo FenêtréA » dans la légende de l'accueil et dans
la visionneuse, mention sous la galerie et sous la fenêtre de la section
Aides. Métadonnées retirées, détail dans `assets/images/README.md`.

👉 **Dès que les photos de chantiers arrivent**, les ajouter en tête de
galerie et de l'accueil depuis l'espace client, et adapter la mention sous la
galerie.

## Le formulaire de devis — il arrive dans la boîte mail de Tiago

Quatre étapes (projet, détail, délai et commune, coordonnées), validées une à
une. À l'envoi, la demande part **directement par e-mail** à
`tiagotdsfermetures.21@hotmail.com`, sous forme de tableau lisible, avec
l'adresse du client en « répondre à » : Tiago répond d'un clic.

L'envoi passe par **FormSubmit** (formsubmit.co), gratuit et sans compte, qui
transforme le formulaire en e-mail — un site statique ne peut pas envoyer
d'e-mail lui-même.

### ⚠️ Activation, une seule fois

La **toute première** demande envoyée depuis le site en ligne déclenche un
e-mail de FormSubmit à `tiagotdsfermetures.21@hotmail.com`, intitulé
« Action Required: Activate FormSubmit ». **Il faut cliquer sur « Activate
Form »** : à partir de là, toutes les demandes arrivent. Pensez à regarder
dans les courriers indésirables.

Le plus simple : dès la mise en ligne, faire soi-même une demande de test,
puis faire cliquer Tiago sur le lien d'activation.

### Si l'envoi échoue

Formulaire pas encore activé, service injoignable, réseau coupé : la demande
n'est jamais perdue. Le site affiche « L'envoi automatique n'a pas abouti » et
propose **« Envoyer par ma messagerie »** (le mail est déjà rédigé, adressé à
Tiago) ou **« Appeler »**.

Autres protections : un **champ piège** invisible écarte les robots (une
demande qui le remplit n'est pas envoyée), et l'envoi est abandonné après
15 secondes sans réponse.

### Réglages

- Adresse de réception : espace client, *Demande de devis → Email qui reçoit
  les demandes* (elle l'emporte), ou `devisEmail` en haut de
  `assets/js/main.js`.
- `serviceEnvoi: ""` dans `assets/js/main.js` pour revenir à l'ancien
  fonctionnement (ouverture de la messagerie du visiteur).
- Après activation, FormSubmit propose une adresse d'envoi masquée (une
  chaîne aléatoire à la place de l'e-mail) : on peut la mettre dans
  `devisEmail` pour que l'adresse n'apparaisse plus dans le code.

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

## Informations reçues de l'entreprise (réponse du 21 octobre 2026)

| Sujet | Réponse / document | Sur le site |
|---|---|---|
| Zone d'intervention | « Côte-d'Or » | Contact, texte d'accueil, titre de page, données structurées |
| Raison sociale, forme, capital | Kbis : TDS FERMETURES, SARL à associé unique, 5 000 € | Mentions légales, pied de page |
| Siège | Kbis : 24 rue Lavoisier, 21000 Dijon | Contact (« Siège »), mentions, confidentialité |
| RCS, SIRET, APE | RCS Dijon 108 023 805 ; SIRET 108 023 805 00014 ; 4332A | Mentions légales, pied de page |
| TVA intracommunautaire | FR 53 108 023 805 | Mentions légales, données structurées |
| Gérant | Tiago Tomé Dos Santos (Kbis) | Directeur de la publication |
| Décennale | ACM IARD SA, contrat Acajou Décennale I7 1001920, France métropolitaine, **du 01/09/2026 au 01/01/2027** | Mentions légales (avec les activités couvertes) |
| RGE | « Pas de certificat » | Section devenue « TVA réduite » |
| Photos de chantier | « Déjà envoyé » (photos FenêtréA) | Galerie et accueil, avec crédit |
| Avis | « Pas d'avis » | Section masquée |
| Réseaux | « Facebook TDS FERMETURES », sans lien | Pied de page, en texte |
| Horaires | Non communiqués | Rien d'affiché |

Données du Kbis volontairement **non publiées** : date et lieu de
naissance, nationalité du gérant.

## ⚠️ Reste à régler avant la mise en ligne définitive

- **Médiateur de la consommation** : obligatoire (L612-1 du code de la
  consommation), seul champ encore « à renseigner » des mentions légales
- **Décennale** : l'attestation expire le **01/01/2027** ; elle couvre les
  menuiseries extérieures **bois et PVC** et la vitrerie, pas l'aluminium,
  et ne cite ni pergolas, ni portes de garage, ni automatismes
- **Activer FormSubmit** et faire une demande de test
- **Nom de domaine** : balises SEO, `sitemap.xml`, `robots.txt`
- Lien de la page Facebook, horaires, photos de chantiers, avis réels

## Ce qui a été vérifié

Mesuré dans Chromium, pas estimé.

| Vérification | Résultat |
|---|---|
| Contrastes WCAG AA | 19 combinaisons calculées, toutes ≥ 4,5:1 |
| Hydratation depuis `site.json` | textes, images et 11 listes (engagements compris) |
| Repli sans `site.json` | page complète et identique |
| Liste vidée | section masquée, lien de menu masqué, contenu retiré du DOM |
| Contrastes de la charte orange | anthracite sur orange 7:1, orange foncé sur clair 5:1, orange sur anthracite 6,7:1 |
| Section TVA réduite | 3 cartes, critères techniques, pas de RGE dit clairement, renvoi France Rénov', **aucune somme en euros** |
| Fluidité (60 / 120 / 144 Hz) | en plein défilement : 1 recalcul de mise en page au lieu de 72 à 135 ; aucune parallaxe, aucun zoom continu, une seule passe de composition par image (au lieu de 4), en-tête de taille fixe, aucun flou d'arrière-plan, diaporama en pause hors écran |
| Affichage | 360, 390, 768, 1024, 1280, 1440, 1920 px : aucun débordement, aucune erreur JS, menu burger sous 1100 px, cibles tactiles ≥ 24 px |
| Parcours | menu mobile, devis complet avec envoi simulé à l'adresse de Tiago, liens « Appeler », mentions légales |
| Devis 4 étapes | cas valides et invalides, retour arrière |
| Envoi du devis (FormSubmit simulé) | adresse de Tiago, tous les champs, remerciement ; secours si non activé, erreur 500 ou coupure ; robot écarté — 24 contrôles |
| Liens de contact | tous les « Appeler » en `tel:+33658008226`, e-mails client et fournisseurs, mis à jour depuis l'espace client |
| Galerie | 12 photos, 4 en largeur détectées, filtres (catégorie vide masquée), crédit dans la visionneuse |
| Accueil | défilement, pause, choix par la jauge, arrêt en mouvement réduit, liste vide → texte seul |
| Largeurs | 390 px et 1440 px, sans scroll horizontal |
| Erreurs JavaScript | aucune |

**Non vérifiable ici** : l'envoi réel par FormSubmit (aucun faux devis n'a été
envoyé à Tiago : le service est simulé dans les tests), l'interface Decap réelle
et la connexion GitHub — les CDN et le registre npm sont inaccessibles depuis
l'environnement de génération.
`admin/demo.html` permet malgré tout de montrer l'espace client.

## Structure

```
tds-fermetures/
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
    ├── favicon.svg               La maison du logo
    ├── logo/                     Logo TDS Fermetures (et variante claire)
    ├── css/style.css             Charte orange TDS
    ├── js/content.js             Injecte site.json dans la page
    ├── js/main.js                Navigation, filtres, visionneuse, devis (envoi e-mail)
    └── images/                   Photos FenêtréA + README
```

## Aperçu local

```bash
cd tds-fermetures
python3 -m http.server 8080
# puis http://localhost:8080
```

Pour montrer l'espace client à un prospect, sans rien installer :
`http://localhost:8080/admin/demo.html`.
