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

Pour l'instant, un haut de page classique : titre, texte, boutons « Demander
un devis » et « Appeler », encadré avec le dirigeant et le téléphone, fond en
légère parallaxe. L'animation d'ouverture de fenêtre et la fenêtre 3D ont été
retirées à la demande du client, en attendant autre chose ; elles restent dans
l'historique Git (commit « l'intro ouvre une vraie photo de fenêtre ») si on
veut les reprendre.

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

## Ce qui a été vérifié

Mesuré dans Chromium, pas estimé.

| Vérification | Résultat |
|---|---|
| Contrastes WCAG AA | 19 combinaisons calculées, toutes ≥ 4,5:1 |
| Hydratation depuis `site.json` | textes, images et 11 listes (engagements compris) |
| Repli sans `site.json` | page complète et identique |
| Liste vidée | section masquée, lien de menu masqué, contenu retiré du DOM |
| Contrastes de la charte orange | anthracite sur orange 7:1, orange foncé sur clair 5:1, orange sur anthracite 6,7:1 |
| Section Aides | 4 dispositifs, critères techniques, RGE, renvoi France Rénov', **aucune somme en euros** |
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
│   └── admin-demo.template.html
└── assets/
    ├── favicon.svg               La maison du logo
    ├── logo/                     Logo TDS Fermetures (et variante claire)
    ├── css/style.css             Charte orange TDS
    ├── js/content.js             Injecte site.json dans la page
    ├── js/main.js                Navigation, filtres, visionneuse, devis (envoi e-mail)
    └── images/                   Illustrations + README
```

## Aperçu local

```bash
cd tds-fermetures
python3 -m http.server 8080
# puis http://localhost:8080
```

Pour montrer l'espace client à un prospect, sans rien installer :
`http://localhost:8080/admin/demo.html`.
