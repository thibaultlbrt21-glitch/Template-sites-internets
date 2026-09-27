# TDS Fermetures — site internet

Site vitrine de **TDS Fermetures** (Tiago Dos Santos) : portes, fenêtres,
volets roulants, portails et clôtures, portes de garage, pergolas,
automatismes et visiophones. Construit sur le modèle « menuisier » de la gamme
Webly, avec **espace client**, **intro animée** et **visualiseur 3D en WebGL**.
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
logo sert aux textes et aux grands aplats (devis, fenêtre 3D, pied de page),
le blanc cassé au reste — comme sur la carte.

Contrastes vérifiés : texte anthracite sur orange 7:1 (les boutons orange ont
donc un texte foncé, jamais blanc — blanc sur orange ne fait que 2,3:1) ;
orange foncé `#A85200` pour le texte orange sur fond clair (5:1) ; orange de
marque sur anthracite 6,7:1.

## L'intro : entrer dans le site par la fenêtre

Le visiteur arrive face à une **vraie photo** : une fenêtre bois deux
vantaux à petits bois, dans une embrasure en pierre, un paysage derrière.
Au défilement, et uniquement au défilement :

1. la **poignée** se relève et le vantail principal (à droite) **bascule en
   oscillo** — la caméra glisse de trois quarts pour qu'on le voie basculer ;
2. il se referme, la poignée passe à l'horizontale, la caméra revient dans
   l'axe ;
3. il **s'ouvre à la française**, puis le semi-fixe s'ouvre à son tour ;
4. la caméra **passe par l'ouverture**, vers le paysage — le haut de page
   apparaît en fondu.

### Comment une photo peut s'ouvrir

La photo est **reprojetée** sur un volume simple — mur, embrasure, appui,
linteau, dormant, vantaux — depuis l'endroit exact d'où elle a été prise.
Chaque surface reçoit les pixels de la photo qui la montrent. Tant que la
caméra reste au point de prise de vue, l'écran montre la photo telle quelle ;
quand elle se déplace un peu, l'embrasure et la fenêtre prennent du relief.

- Les **vantaux** sont découpés dans la photo : ce sont ses pixels qui
  pivotent, avec leur épaisseur (chants en bois) ; leurs **vitrages** sont
  rendus transparents.
- Derrière, le **paysage** est reconstitué à partir de ce qu'on voit par les
  vitres : petits bois et montants effacés, bords prolongés et floutés.
- Le **levier de poignée** est détouré à part et tourne dans le plan du
  vantail ; la platine reste en place.
- Le plan de la fenêtre est **déduit de la photo** : ses bords haut et bas
  convergent vers l'horizon, ce qui donne son inclinaison ; la largeur réelle
  des vantaux donne l'échelle.

Fichiers :

| Fichier | Rôle |
|---|---|
| `tools/intro-photo-source.webp` | La photo d'origine : la source du script, la page ne la charge pas |
| `assets/images/intro-fenetre.json` | Coordonnées relevées sur la photo : vantaux, dormant, embrasure, vitrages, poignée |
| `tools/prepare-intro-photo.js` | Fabrique les trois images ci-dessous à partir de la photo et du JSON |
| `assets/images/intro-fenetre.webp` | La photo, vitrages transparents, levier effacé |
| `assets/images/intro-poignee.webp` | Le levier détouré |
| `assets/images/intro-dehors.webp` | Le paysage reconstitué |

**Droits** : la photo a été fournie comme libre de droits. **Notez le lien de
la page d'origine** ici avant la mise en ligne — c'est la preuve de la
licence : _lien à compléter_. Ce n'est pas une réalisation de l'entreprise :
ne la présentez pas comme telle.

**Changer de photo** : il faut une fenêtre vue de face, entière, fermée. On
relève les coordonnées dans le JSON (en pixels, sur la photo), puis on
relance `node tools/prepare-intro-photo.js` (Playwright et un serveur local,
voir l'en-tête du script). Sans l'attribut `data-photo` sur `.intro` dans
`index.html`, l'intro reprend la **chambre dessinée en 3D** (fenêtre PVC
blanche 105 × 108 cm, chevet, hortensias, jardin illustré), toujours
disponible dans `demarreIntro()`.

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

La chorégraphie (seuils de défilement, angles) est la même pour les deux
intros : voir `demarreIntroPhoto()` et `demarreIntro()` dans
`assets/js/viseur3d.js`.

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
- **Devis en quatre étapes** : projet (9 choix, SAV compris), quantité ou
  dimensions, motorisation, type de projet, âge du logement (qui conditionne
  les aides), délai, budget, commune. Jauge de progression, validation par
  étape, re-validation complète à l'envoi, annonce de l'étape aux lecteurs
  d'écran — et **envoi direct par e-mail** (voir plus bas)
- **Bandeau orange des engagements** : les quatre mots de la carte de visite
- **Boutons « Appeler »** partout (en-tête, accueil, contact, barre mobile)
- **Galerie de réalisations filtrable** par catégorie + **visionneuse** au clavier
  (`←` `→` `Échap`, piège de focus). La navigation suit le filtre actif
- **Cartes en relief** qui suivent le curseur — désactivées au doigt, où
  l'effet n'apporte rien
- **Espace client** : voir `ADMIN.md`
- Tout est désactivé sous `prefers-reduced-motion: reduce`

## Les images

Les visuels de la galerie « Réalisations » sont des **illustrations
générées** (fenêtres, volets, porte, porte de garage, portail, pergola) : ils
ne représentent aucun chantier réel et la page le dit. 👉 **À remplacer par
les photos des chantiers de TDS Fermetures**, depuis l'espace client ou en
suivant `assets/images/README.md`.

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

## ⚠️ À compléter avant la mise en ligne définitive

Ce que la carte de visite ne dit pas — marqué « à renseigner » sur le site :

- **Activer FormSubmit** (voir plus haut) et faire une demande de test
- Adresse, horaires, **zone d'intervention** (l'« 21 » des adresses e-mail
  laisse penser à la Côte-d'Or, mais ce n'est pas écrit : à confirmer)
- **Mentions légales** : forme juridique et raison sociale (d'après le Kbis),
  SIRET, RCS ou Répertoire des métiers, TVA, **garantie décennale**,
  médiateur de la consommation
- **Qualification RGE** si elle existe (section Aides) — sinon, adapter le
  texte de cette section
- Photos réelles des chantiers à la place des illustrations
- Avis : la section reste **masquée** tant qu'aucun avis réel n'est saisi
- Nom de domaine dans les balises SEO, `sitemap.xml`, `robots.txt`
- Source et licence de la photo de l'intro (voir « L'intro »)

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
| Contrastes de la charte orange | anthracite sur orange 7:1, orange foncé sur clair 5:1, orange sur anthracite 6,7:1 |
| Section Aides | 4 dispositifs, critères techniques, RGE, renvoi France Rénov', **aucune somme en euros** |
| Repli sans WebGL | volume CSS 3D affiché, boutons d'ouverture retirés |
| Devis 4 étapes | cas valides et invalides, retour arrière |
| Envoi du devis (FormSubmit simulé) | adresse de Tiago, tous les champs, remerciement ; secours si non activé, erreur 500 ou coupure ; robot écarté — 24 contrôles |
| Liens de contact | tous les « Appeler » en `tel:+33658008226`, e-mails client et fournisseurs, mis à jour depuis l'espace client |
| Galerie | filtres + visionneuse clavier |
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
│   ├── admin-demo.template.html
│   ├── prepare-intro-photo.js    Prépare les images de l'intro photo
│   └── intro-photo-source.webp   Photo source de l'intro
└── assets/
    ├── favicon.svg               La maison du logo
    ├── logo/                     Logo TDS Fermetures (et variante claire)
    ├── css/style.css             Charte orange TDS
    ├── js/content.js             Injecte site.json dans la page
    ├── js/viseur3d.js            Moteur WebGL, sans dépendance (intro + fenêtre 3D)
    ├── js/main.js                Navigation, filtres, visionneuse, devis (envoi e-mail)
    └── images/                   Illustrations, photo de l'intro + README
```

## Aperçu local

```bash
cd tds-fermetures
python3 -m http.server 8080
# puis http://localhost:8080
```

Pour montrer l'espace client à un prospect, sans rien installer :
`http://localhost:8080/admin/demo.html`.
