# Espace client — guide d'activation

Ce template embarque un **espace d'administration** : le menuisier se connecte
sur `votre-site.fr/admin/`, modifie ses chantiers, ses matériaux, ses
horaires et ses coordonnées — et le site se met à jour tout seul, sans passer
par vous.

Comptez **15 à 30 minutes** la première fois, **5 minutes** pour les clients
suivants.

---

## 1. Comment ça marche

Ni serveur, ni base de données, ni abonnement. Le site reste statique, donc
rapide et robuste.

```
Le client ouvre /admin/  →  il se connecte (compte GitHub)
                         →  il modifie un champ, il clique « Publish »
                         →  un commit est écrit dans content/site.json
                         →  GitHub Actions redéploie le site (~1 à 2 min)
                         →  la modification est en ligne
```

| Fichier | Rôle |
|---|---|
| `content/site.json` | Le contenu modifiable. C'est la source de vérité. |
| `assets/js/content.js` | Injecte ce contenu dans la page au chargement. |
| `admin/config.yml` | Décrit les champs affichés dans l'espace client. |
| `admin/index.html` | L'espace client réel (Decap CMS, logiciel libre, MIT). |
| `admin/demo.html` | Aperçu autonome du même espace, généré depuis `config.yml`. |

### Pourquoi le site reste lisible même si tout casse

`index.html` contient déjà un contenu complet. `content.js` ne fait que le
**remplacer** quand le JSON est disponible. Si le fichier manque, est corrompu
ou que le réseau échoue, la page s'affiche telle quelle : rien ne disparaît, le
référencement n'en souffre pas, et les navigateurs sans JavaScript voient un
site entier. *(Vérifié — voir § 7.)*

---

## 2. Avant de commencer — vérifier la branche

`admin/config.yml` indique à l'espace client sur quelle branche écrire :

```yaml
backend:
  branch: main
```

Cette valeur doit être **la branche que GitHub Pages publie**. Vérifiez-le sur
chaque nouveau dépôt client : un espace qui écrit sur une branche non publiée
donne l'impression que « ça ne marche pas », alors que les modifications sont
bien enregistrées — ailleurs.

---

## 3. Activation — deux chemins

GitHub impose un « secret » qui ne peut pas figurer dans une page publique : il
faut donc un service tiers pour valider la connexion. Les deux sont gratuits.

### Chemin A — héberger sur Netlify *(le plus simple)*

1. **Créer une application OAuth chez GitHub**
   `github.com` → votre photo → *Settings* → *Developer settings* →
   *OAuth Apps* → **New OAuth App**
   - *Application name* : le nom de l'entreprise
   - *Homepage URL* : l'adresse du site
   - *Authorization callback URL* : `https://api.netlify.com/auth/done`
     (exactement cette adresse : c'est Netlify qui reçoit la réponse)
   → **Register application**, puis **Generate a new client secret**.
   Gardez le *Client ID* et le *Client Secret*.

2. **Publier le site sur Netlify**
   `netlify.com` → *Add new site* → *Import an existing project* → GitHub.
   - *Build command* : laissez vide (rien à compiler)
   - *Publish directory* : `webly-template-menuisier`

3. **Brancher l'authentification**
   Site Netlify → *Site configuration* → *Access & security* → *OAuth* →
   **Install provider** → GitHub → collez le *Client ID* et le *Client Secret*.

4. **Fini.** Ouvrez `https://votre-site.netlify.app/admin/` et cliquez
   « Login with GitHub ». Laissez la ligne `base_url` commentée dans
   `config.yml` : c'est la valeur par défaut de Decap.

### Chemin B — rester sur GitHub Pages

Le site ne bouge pas ; vous déployez vous-même un petit service
d'authentification.

1. Application OAuth GitHub comme au chemin A, mais avec
   *Authorization callback URL* = `https://<votre-service>/callback`.
2. Déployez un proxy OAuth — **Cloudflare Workers** (gratuit, sans carte
   bancaire) avec `sveltia-cms-auth`, compatible Decap ; ou
   `decap-cms-github-oauth-provider` sur Vercel ou Render. Renseignez
   `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET` dans ses variables
   d'environnement.
3. Dans `admin/config.yml`, décommentez et complétez :
   ```yaml
   base_url: https://votre-service.workers.dev
   ```
4. Ouvrez `https://votre-site.fr/admin/`.

---

## 4. Donner l'accès au menuisier

Son identité, c'est **son compte GitHub**.

**Il en a déjà un** → invitez-le sur le dépôt : *Settings* → *Collaborators* →
*Add people* → rôle **Write**.

**Il n'en a pas** → créez-en un avec lui, avec son adresse professionnelle,
puis invitez-le. Trois minutes.

### La question du mot de passe

Il change son mot de passe **sur github.com** (*Settings* → *Password and
authentication*), pas sur le site. C'est une bonne nouvelle :

- vous ne stockez aucun mot de passe, donc vous n'en êtes pas responsable ;
- GitHub gère la double authentification et la récupération de compte ;
- s'il part ou vend l'entreprise, vous révoquez l'accès en un clic, sans
  toucher au site.

**À lui dire honnêtement :** « votre accès passe par un compte GitHub, la
plateforme qui héberge le code de votre site. Votre mot de passe se change
là-bas, je vous montre en deux minutes. » Ne promettez pas un mot de passe
« du site » : il n'y en a pas.

> Un espace de connexion indépendant (email + mot de passe gérés par vous)
> demanderait un service d'identité et un serveur, donc un coût mensuel et de
> la maintenance. C'est faisable, mais ce n'est pas ce que livre ce template.

---

## 5. Ce que le client peut modifier

Tout est en français, avec une aide sous chaque champ.

- **Nom et signature** de l'entreprise
- **Bandeau d'accueil** : titre en deux lignes, texte, encadré technique
- **Photos principales** : accueil (fond et premier plan), atelier
- **Prestations** : ajouter, supprimer, réordonner — la numérotation se refait
  toute seule
- **Chantiers** : titre, sous-titre, catégorie, photo, texte alternatif.
  Le premier de la liste s'affiche en grand ; un filtre qui n'a plus aucun
  chantier disparaît tout seul
- **Matériaux** : nom, couleur, **texture appliquée à la fenêtre en 3D**,
  entretien, isolation, durée de vie, budget
- **Aides à la rénovation** : dispositifs, conditions, et la **qualification
  RGE** de l'entreprise
- **L'entreprise** et le **déroulé d'un chantier**
- **Devis** : titre, texte, engagements, **email qui reçoit les demandes**
- **Avis clients** : note, texte, auteur, source
- **Infos pratiques** : adresse, téléphone, email, horaires, zone
- **Pied de page** : présentation et réseaux sociaux

### Vider une liste masque sa section

C'est volontaire. Si le menuisier supprime tous les avis, la section disparaît
entièrement — plutôt que d'afficher des emplacements vides à ses propres
clients. Même chose pour les chantiers, les matériaux et les prestations :
la section et son lien de menu disparaissent ensemble, et le contenu d'exemple
est **retiré du code source**, pas seulement masqué.

Les mentions facultatives (« Visuels d'exemple… », « Rendu indicatif… »)
disparaissent dès que leur champ est vidé.

### Les rappels légaux, à passer au client de vive voix

**Les avis.** On ne publie que ceux réellement reçus, avec leur source. Un faux
avis est une pratique commerciale trompeuse (articles L121-2 et suivants du
code de la consommation). Ce template n'en contient aucun : les cartes livrées
portent le texte « Avis client à intégrer », précisément pour qu'on ne puisse
pas les confondre avec de vrais témoignages.

**Les chantiers.** Ne montrer que des ouvrages réellement exécutés. Reprendre
les photos d'un confrère est une contrefaçon — et une publicité trompeuse si
elles sont présentées comme siennes. Pensez aussi à demander l'accord du client
avant de publier l'intérieur de chez lui.

**Les aides.** Le site affiche les conditions, jamais les montants : barèmes et
plafonds changent chaque année et dépendent des revenus du foyer. Annoncer une
somme qu'on ne maîtrise pas, c'est une pratique commerciale trompeuse. Le site
renvoie vers France Rénov', qui fait autorité.

**La qualification RGE.** Le champ doit recevoir l'organisme, le numéro et la
date de validité. Afficher une qualification non détenue est un faux — et prive
le client de toutes les aides, ce qu'il découvrira au pire moment.

**Les engagements.** « Réponse sous 48 h », « devis gratuit », un rayon
d'intervention : tout ce qui est affiché engage l'entreprise. Ne laissez pas un
texte d'exemple promettre ce que le menuisier ne tient pas.

**La garantie décennale.** Obligatoire pour les travaux de construction. Son
absence des mentions légales est une faute, et les clients la vérifient.

---

## 6. Adapter le template à un nouveau client

Trois lignes dans `admin/config.yml` :

```yaml
backend:
  name: github
  repo: proprietaire/depot-du-client   # 1. le dépôt du client
  branch: main                         # 2. la branche publiée
  # base_url: https://...              # 3. seulement pour le chemin B
```

Et deux chemins, si vous renommez le dossier :

```yaml
media_folder: "nom-du-dossier/assets/images"
file: "nom-du-dossier/content/site.json"
```

Site déployé seul à la racine de son dépôt ? Enlevez le préfixe :

```yaml
media_folder: "assets/images"
file: "content/site.json"
```

Pensez aussi à renseigner `devis.email_reception` dans `content/site.json` :
c'est l'adresse qui reçoit les demandes. Tant qu'elle vaut
`contact@votre-menuiserie-a-renseigner.fr`, le formulaire ouvre un mail vers
une adresse qui n'existe pas.

Après toute modification de `admin/config.yml` :

```bash
python3 tools/build-admin-demo.py
```

---

## 7. Ce que j'ai vérifié, et ce que je n'ai pas pu vérifier

**Testé dans un vrai navigateur (Chromium) :** le détail complet, chiffres à
l'appui, est dans `README.md`, section « Ce qui a été vérifié ».

**Non testé ici, à vérifier de votre côté :**

- **la connexion elle-même** et l'interface Decap. L'environnement où j'ai
  travaillé n'a accès ni aux CDN ni à l'authentification GitHub. Le fichier
  `admin/config.yml` est valide et ses champs correspondent exactement à
  `content/site.json` (vérifié champ par champ, automatiquement), mais je n'ai
  pas pu cliquer dans l'interface réelle.
- **le déploiement automatique après une modification du client** : il repose
  sur `.github/workflows/deploy-pages.yml`, déjà en place et fonctionnel, dont
  le filtre `paths:` couvre bien `webly-template-menuisier/**`.

Faites un essai complet sur un dépôt de test avant la première livraison.
Comptez 20 minutes.

---

## 8. Montrer l'espace client sans rien installer

`admin/demo.html` est un **aperçu autonome** : aucune dépendance, aucun compte,
aucune connexion. Il s'ouvre depuis n'importe quel navigateur, y compris sur
iPad.

👉 `votre-site.fr/admin/demo.html`

Mêmes champs, mêmes libellés, mêmes aides que l'espace réel — la page est
**générée depuis `admin/config.yml`**, les deux ne peuvent donc pas diverger.
Le site s'affiche à côté et se met à jour à chaque enregistrement.

Ce que l'aperçu ne fait pas : se connecter à GitHub, ni enregistrer quoi que ce
soit. Les modifications restent dans l'onglet ouvert (le bouton
« Télécharger » récupère le `site.json` produit). C'est un outil de
démonstration, pas l'espace de production.

### Annexe — l'interface Decap en local

`admin/config.yml` contient déjà `local_backend: true`. Sur une machine avec
Node.js :

```bash
# Terminal 1 — le pont vers les fichiers locaux
npx decap-server

# Terminal 2 — le site
cd webly-template-menuisier
python3 -m http.server 8080
```

Puis `http://localhost:8080/admin/`. C'est la vraie interface, mais elle
demande Node.js et un accès au registre npm.

---

## 9. Ce que ça coûte

| Poste | Coût |
|---|---|
| Decap CMS | 0 € (logiciel libre) |
| Hébergement GitHub Pages ou Netlify | 0 € |
| Service d'authentification (Cloudflare Worker / Netlify) | 0 € |
| Compte GitHub du client | 0 € |
| Nom de domaine | ~10 à 15 € / an |

Aucun abonnement récurrent n'est nécessaire.
