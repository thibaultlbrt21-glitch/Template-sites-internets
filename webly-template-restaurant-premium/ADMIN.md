# Espace client — guide d'activation

Ce template embarque un **espace d'administration** : le restaurateur se
connecte sur `votre-site.fr/admin/`, modifie sa carte, ses horaires, ses
photos, ses coordonnées — et le site se met à jour tout seul, sans passer
par vous.

Ce document explique comment l'activer. Comptez **15 à 30 minutes** la
première fois, **5 minutes** pour les clients suivants.

---

## 1. Comment ça marche

Il n'y a **ni serveur, ni base de données, ni abonnement**. Le site reste
un site statique, aussi rapide et aussi fiable qu'avant.

```
Le client ouvre /admin/  →  il se connecte (compte GitHub)
                         →  il modifie un champ, il clique « Publish »
                         →  un commit est écrit dans content/site.json
                         →  GitHub Actions redéploie le site (~1 à 2 min)
                         →  la modification est en ligne
```

Trois fichiers portent tout le mécanisme :

| Fichier | Rôle |
|---|---|
| `content/site.json` | Le contenu modifiable. C'est la source de vérité. |
| `assets/js/content.js` | Injecte ce contenu dans la page au chargement. |
| `admin/config.yml` | Décrit les champs affichés dans l'espace client. |

L'interface elle-même est **Decap CMS**, un logiciel libre (licence MIT),
gratuit et sans limite d'usage.

### Pourquoi le site reste lisible même si tout casse

Le HTML de `index.html` contient déjà un contenu complet. `content.js` ne
fait que le **remplacer** quand le JSON est disponible. Si le fichier est
absent, corrompu, ou que le réseau échoue, la page s'affiche telle quelle :
rien ne disparaît, le référencement n'en souffre pas, et les navigateurs
sans JavaScript voient un site complet. *(Vérifié : voir § 7.)*

---

## 2. Avant de commencer — spécifique à CE dépôt

> **La branche publiée n'est pas encore `main`.**
>
> Aujourd'hui, le site en ligne est déployé depuis la branche
> `claude/everything-claude-code-t5ohfd`, parce que la Pull Request #1
> n'est pas encore fusionnée.
>
> **Fusionnez la PR #1** (bouton « Merge pull request » sur GitHub) avant
> d'activer l'espace client. Sinon, les modifications du client partiraient
> sur `main`, qui ne contient pas encore les sites.
>
> Si vous préférez ne pas fusionner tout de suite, changez la ligne
> `branch:` de `admin/config.yml` pour y mettre le nom de la branche
> réellement publiée.

---

## 3. Activation — deux chemins possibles

Decap a besoin qu'un service tiers valide la connexion GitHub (GitHub
impose un « secret » qui ne peut pas être écrit dans une page publique).
Deux solutions, toutes les deux gratuites.

### Chemin A — héberger le site sur Netlify *(le plus simple)*

Netlify fournit ce service d'authentification tel quel. C'est la voie que
je recommande pour un vrai client.

1. **Créer une application OAuth chez GitHub**
   `github.com` → votre photo → *Settings* → *Developer settings* →
   *OAuth Apps* → **New OAuth App**
   - *Application name* : le nom du restaurant
   - *Homepage URL* : l'adresse du site
   - *Authorization callback URL* : `https://api.netlify.com/auth/done`
     (exactement cette adresse, c'est Netlify qui reçoit la réponse)
   → **Register application**, puis **Generate a new client secret**.
   Gardez le *Client ID* et le *Client Secret* sous la main.

2. **Publier le site sur Netlify**
   `netlify.com` → *Add new site* → *Import an existing project* → GitHub
   → choisissez le dépôt.
   - *Build command* : laissez vide (le site n'a rien à compiler)
   - *Publish directory* : `webly-template-restaurant-premium`

3. **Brancher l'authentification**
   Sur le site Netlify → *Site configuration* → *Access & security* →
   *OAuth* → **Install provider** → GitHub → collez le *Client ID* et le
   *Client Secret* de l'étape 1.

4. **C'est fini.** Ouvrez `https://votre-site.netlify.app/admin/`,
   cliquez « Login with GitHub ». Dans `admin/config.yml`, laissez la
   ligne `base_url` commentée : c'est la valeur par défaut de Decap.

### Chemin B — rester sur GitHub Pages

Le site reste là où il est ; vous déployez vous-même un petit service
d'authentification (une centaine de lignes, gratuit).

1. Créez l'application OAuth GitHub comme au chemin A, mais avec
   *Authorization callback URL* = `https://<votre-service>/callback`.

2. Déployez un proxy OAuth. Les deux options éprouvées :
   - **Cloudflare Workers** (gratuit, pas de carte bancaire) :
     le worker `sveltia-cms-auth` est compatible Decap.
   - **Vercel / Render** : le projet `decap-cms-github-oauth-provider`.

   Dans les deux cas, renseignez `GITHUB_CLIENT_ID` et
   `GITHUB_CLIENT_SECRET` dans les variables d'environnement du service.

3. Dans `admin/config.yml`, décommentez et complétez :
   ```yaml
   base_url: https://votre-service.workers.dev
   ```

4. Ouvrez `https://votre-site.fr/admin/`.

---

## 4. Donner l'accès au restaurateur

L'identité du client, c'est **son compte GitHub**. Deux façons de faire :

**Le client a déjà un compte GitHub** → invitez-le sur le dépôt :
*Settings* → *Collaborators* → *Add people* → rôle **Write**.

**Le client n'a pas de compte** → créez-en un avec lui, avec son adresse
email professionnelle, puis invitez-le de la même façon. Comptez 3 minutes.

### La question du mot de passe

Le client change son mot de passe **sur github.com**
(*Settings* → *Password and authentication*), pas sur le site. C'est une
bonne nouvelle, pas un contournement :

- vous ne stockez aucun mot de passe, donc vous n'en êtes pas responsable ;
- GitHub gère l'authentification à deux facteurs et la récupération de
  compte, ce qu'un mot de passe maison ne ferait pas ;
- si le client part ou change de gérant, vous révoquez l'accès en un clic
  dans *Collaborators* — sans toucher au site.

**À dire au client, honnêtement :** « votre accès passe par un compte
GitHub, la plateforme qui héberge le code de votre site. Votre mot de
passe se change là-bas, et je peux vous le montrer en deux minutes. »
Ne lui promettez pas un mot de passe « du site » : il n'y en a pas.

> Un vrai espace de connexion indépendant (email + mot de passe gérés par
> vous) demanderait un service d'identité et un petit serveur, donc un coût
> mensuel et de la maintenance. C'est faisable, mais ce n'est pas ce que
> livre ce template.

---

## 5. Ce que le client peut modifier

Tout est en français dans l'interface, avec une aide sous chaque champ.

- **Bandeau d'accueil** : accroche, texte d'introduction
- **Photos principales** : accueil, salle, cuisine, ambiance
- **Textes** des sections « La maison » et « En cuisine »
- **La carte** : ajouter, supprimer, réordonner les plats
  (nom, description, prix, photo) — la numérotation se refait toute seule
- **La galerie** : images, légendes, descriptions d'accessibilité
- **Chiffres clés** et la mention qui les accompagne
- **Avis clients** : note, texte, auteur, source
- **Bandeau de réservation** : titre, texte, **email qui reçoit les demandes**
- **Infos pratiques** : adresse, téléphone, email, horaires

### Vider une liste masque sa section

C'est volontaire. Si le client supprime tous les avis, la section « Avis »
disparaît entièrement du site — plutôt que d'afficher des emplacements
vides à ses propres clients. Même chose pour la carte (le lien du menu
disparaît aussi) et la galerie. Les mentions « Chiffres d'exemple… » et
« Emplacements réservés… » disparaissent dès que le client vide le champ
correspondant.

### Le rappel légal, à passer au client

L'interface affiche déjà l'avertissement, mais dites-le de vive voix :
**on ne publie que des avis réellement reçus, avec leur source**, et des
chiffres exacts. Un faux avis est une pratique commerciale trompeuse
(articles L121-2 et suivants du code de la consommation). Ce template ne
contient aucun avis inventé : les trois cartes livrées portent le texte
« Avis client à intégrer », précisément pour qu'on ne puisse pas les
confondre avec de vrais témoignages.

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

Et deux chemins, si vous renommez le dossier du site :

```yaml
media_folder: "nom-du-dossier/assets/images"
file: "nom-du-dossier/content/site.json"
```

Si le site est déployé seul, à la racine de son dépôt, enlevez simplement
le préfixe :

```yaml
media_folder: "assets/images"
file: "content/site.json"
```

Pensez aussi à renseigner, dans `content/site.json`, le champ
`reservation.email_reception` : c'est l'adresse qui reçoit les demandes de
réservation. Tant qu'elle vaut
`reservation@votre-restaurant-a-renseigner.fr`, le formulaire ouvre un mail
vers une adresse qui n'existe pas.

---

## 7. Ce que j'ai vérifié, et ce que je n'ai pas pu vérifier

Autant être précis, vous allez vendre ce travail.

**Testé dans un vrai navigateur (Chromium), avec succès :**

- le contenu de `content/site.json` remplace bien celui du HTML
  (textes, photos, plats, galerie, chiffres, avis, horaires, coordonnées) ;
- la numérotation des plats se recalcule (01, 02, 03…) ;
- vider la carte masque la section **et** son lien dans le menu ;
- vider les avis, la galerie ou les chiffres masque la section concernée ;
- vider une mention facultative la fait disparaître ;
- **le repli** : réseau coupé sur `content/site.json`, la page reste
  complète et identique, avec un simple avertissement dans la console ;
- les animations, l'aperçu des plats au survol et les compteurs
  fonctionnent sur le contenu injecté (le script attend le chargement du
  contenu, avec un garde-fou de 1,5 s pour ne jamais bloquer la page) ;
- la page `/admin/` affiche un message d'explication lisible si
  l'interface ne peut pas se charger.

**Non testé ici, à vérifier de votre côté :**

- **la connexion elle-même** et l'interface Decap. L'environnement où j'ai
  travaillé n'a pas accès aux CDN ni à l'authentification GitHub. Le
  fichier `admin/config.yml` est valide et ses champs correspondent
  exactement à `content/site.json` (vérifié champ par champ), mais je n'ai
  pas pu cliquer dans l'interface.
- **le déploiement automatique après une modification du client** : il
  repose sur le workflow `.github/workflows/deploy-pages.yml`, déjà en
  place et déjà fonctionnel, dont le filtre `paths:` couvre bien
  `webly-template-restaurant-premium/**`.

Faites un essai complet sur un dépôt de test avant la première livraison
client. Comptez 20 minutes.

---

## 8. Annexe — essayer l'interface en local

`admin/config.yml` contient déjà `local_backend: true`. Sur votre machine :

```bash
# Terminal 1 — le pont vers les fichiers locaux
npx decap-server

# Terminal 2 — le site
cd webly-template-restaurant-premium
python3 -m http.server 8080
```

Puis ouvrez `http://localhost:8080/admin/`. L'interface écrit directement
dans vos fichiers, sans GitHub, sans connexion. C'est la bonne façon de
montrer l'espace client à un prospect sans rien configurer.

---

## 9. Ce que ça coûte

| Poste | Coût |
|---|---|
| Decap CMS | 0 € (logiciel libre) |
| Hébergement GitHub Pages ou Netlify | 0 € |
| Service d'authentification (Cloudflare Worker / Netlify) | 0 € |
| Compte GitHub du client | 0 € |
| Nom de domaine | ~10 à 15 € / an |

Aucun abonnement récurrent n'est nécessaire pour faire fonctionner
l'espace client.
