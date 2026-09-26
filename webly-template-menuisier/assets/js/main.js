(function () {
  "use strict";

  /* =========================================================
     CONFIG — tout se règle ici (ou demandez à Claude)
     ========================================================= */
  var SITE_CONFIG = {
    // Adresse qui reçoit les demandes de devis.
    // Elle peut aussi être renseignée depuis l'espace client, qui l'emporte.
    devisEmail: "contact@votre-menuiserie-a-renseigner.fr",

    // Passez à true une fois vos vraies photos déposées dans assets/images/
    // (hero-fond.jpg, real-escalier.jpg...). Voir assets/images/README.md.
    // Si une photo manque, le visuel d'origine reprend sa place.
    usePhotos: false
  };

  function boot() {

  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pointeurFin = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Bascule vers les vraies photos ---------- */
  if (SITE_CONFIG.usePhotos) {
    document.querySelectorAll("img[data-photo]").forEach(function (img) {
      var origine = img.getAttribute("src");
      img.addEventListener("error", function reprise() {
        img.removeEventListener("error", reprise);
        img.src = origine;
      });
      img.src = img.getAttribute("data-photo");
    });
  }

  var entete = document.getElementById("entete");
  var hero = document.querySelector(".hero");

  /* ---------- Intro : entrer dans le site par la fenêtre ----------
     Uniquement si WebGL répond et que le visiteur n'a pas demandé moins
     d'animations. Sinon le haut de page reste classique, rien ne manque.

     La section s'allonge tout de suite (pas de saut de mise en page), mais
     la 3D ne démarre qu'à la toute fin de boot() : si la carte graphique est
     lente, le menu, le formulaire et les apparitions sont déjà en place. */
  var intro = null;
  var sceneIntro = hero ? hero.querySelector(".intro") : null;
  var introPossible = !!(hero && sceneIntro && !reduit &&
                         window.WEBLY_VISEUR && window.WEBLY_VISEUR.demarreIntro);
  if (introPossible) hero.classList.add("hero--intro");

  function introActive() {
    return !!(hero && hero.classList.contains("hero--intro"));
  }

  // Longueur de défilement occupée par l'intro (0 sans intro).
  function courseIntro() {
    if (!introActive()) return 0;
    return Math.max(0, hero.offsetHeight - window.innerHeight);
  }

  function renonceIntro() {
    if (intro && intro.arrete) intro.arrete();
    intro = null;
    if (!hero) return;
    hero.classList.remove("hero--intro");
    hero.style.removeProperty("--intro");
    auDefilement();
  }

  // Au-delà de ce temps de démarrage, l'appareil rend la 3D en logiciel ou
  // presque : l'animation au défilement saccaderait. On garde le haut de
  // page classique. (Sur une machine ordinaire, le démarrage prend ~50 ms.)
  var DEMARRAGE_MAX = 1000;

  function demarreIntro() {
    if (!introPossible) return;
    var premiereMatiere = document.querySelector(".matiere");
    var t0 = window.performance ? performance.now() : Date.now();
    intro = window.WEBLY_VISEUR.demarreIntro({
      zone: hero,
      scene: sceneIntro,
      texture: premiereMatiere ? premiereMatiere.getAttribute("data-texture") : null,
      surProgression: function (p) { hero.style.setProperty("--intro", p.toFixed(3)); },
      surPerte: renonceIntro
    });
    var duree = (window.performance ? performance.now() : Date.now()) - t0;
    if (!intro || duree > DEMARRAGE_MAX) renonceIntro();
  }

  // Le contenu du haut de page est invisible pendant l'intro : un visiteur
  // au clavier qui y arrive est amené directement à la fin, pour ne jamais
  // avoir le focus sur un bouton qu'il ne voit pas.
  if (introPossible) {
    hero.addEventListener("focusin", function () {
      if (!introActive()) return;
      var c = courseIntro();
      if (window.scrollY < c - 2) window.scrollTo({ top: c, behavior: "instant" });
    });
    var evitement = document.querySelector(".skip-link");
    var titre = document.getElementById("titrePrincipal");
    if (evitement && titre) {
      evitement.addEventListener("click", function (e) {
        if (!introActive()) return;          // sans intro, le lien fait son travail normal
        e.preventDefault();
        window.scrollTo({ top: courseIntro(), behavior: "instant" });
        titre.focus({ preventScroll: true });
      });
    }
  }

  /* ---------- En-tête ---------- */
  function auDefilement() {
    var y = window.scrollY;
    var c = courseIntro();
    if (entete) entete.classList.toggle("est-pose", y > c + 40);
    var hauteurHero = hero ? (c ? window.innerHeight : hero.offsetHeight) : window.innerHeight;
    document.body.classList.toggle("est-descendu", y > c + hauteurHero * 0.6);
  }
  auDefilement();
  window.addEventListener("scroll", auDefilement, { passive: true });

  /* ---------- Menu mobile ---------- */
  var burger = document.getElementById("burger");
  var menuMobile = document.getElementById("menuMobile");
  var fermerMenu = document.getElementById("fermerMenu");

  function fermeMenu() {
    if (!menuMobile) return;
    menuMobile.classList.remove("est-ouvert");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  function ouvreMenu() {
    menuMobile.classList.add("est-ouvert");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    var premier = menuMobile.querySelector("a");
    if (premier) premier.focus();
  }
  if (burger && menuMobile) {
    burger.addEventListener("click", function () {
      if (menuMobile.classList.contains("est-ouvert")) fermeMenu(); else ouvreMenu();
    });
    if (fermerMenu) fermerMenu.addEventListener("click", function () { fermeMenu(); burger.focus(); });
    menuMobile.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", fermeMenu); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuMobile.classList.contains("est-ouvert")) { fermeMenu(); burger.focus(); }
    });
  }

  /* ---------- Apparitions au défilement (+ filet de sécurité) ---------- */
  var aReveler = document.querySelectorAll(".apparait");
  if (aReveler.length) {
    if (reduit || !("IntersectionObserver" in window)) {
      aReveler.forEach(function (el) { el.classList.add("est-visible"); });
    } else {
      var io = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("est-visible"); io.unobserve(e.target); }
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
      aReveler.forEach(function (el) { io.observe(el); });

      // Si le défilement n'est jamais simulé (capture automatique, robot
      // d'indexation, erreur JS ailleurs), on révèle quand même.
      window.setTimeout(function () {
        aReveler.forEach(function (el) { el.classList.add("est-visible"); });
        io.disconnect();
      }, 2600);
    }
  }

  /* ---------- Étapes du processus ---------- */
  var etapes = document.querySelectorAll(".etape");
  if (etapes.length && "IntersectionObserver" in window && !reduit) {
    var ioEtapes = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("est-vue"); ioEtapes.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    etapes.forEach(function (el) { ioEtapes.observe(el); });
    window.setTimeout(function () { etapes.forEach(function (el) { el.classList.add("est-vue"); }); }, 2600);
  } else {
    etapes.forEach(function (el) { el.classList.add("est-vue"); });
  }

  /* ---------- Parallaxe du hero ---------- */
  var couches = Array.prototype.slice.call(document.querySelectorAll("[data-profondeur]"));
  if (couches.length && !reduit) {
    var enAttente = false;
    var applique = function () {
      // La parallaxe ne démarre qu'après l'intro : pendant l'ouverture de
      // la fenêtre, le haut de page est collé à l'écran et ne doit pas glisser.
      var y = Math.max(0, window.scrollY - courseIntro());
      couches.forEach(function (el) {
        var p = parseFloat(el.getAttribute("data-profondeur")) || 0;
        el.style.transform = "translate3d(0," + (y * p).toFixed(1) + "px,0)";
      });
      enAttente = false;
    };
    var demande = function () {
      if (!enAttente) { enAttente = true; window.requestAnimationFrame(applique); }
    };
    applique();
    window.addEventListener("scroll", demande, { passive: true });
  }

  /* ---------- Cartes en relief ---------- */
  // Le basculement suit le curseur : c'est ce qui donne l'impression que la
  // carte est un objet posé, pas une image. Désactivé au doigt et en
  // mouvement réduit, où l'effet n'apporte rien.
  if (pointeurFin && !reduit) {
    document.querySelectorAll("[data-tilt]").forEach(function (carte) {
      var cadre = null;
      carte.addEventListener("pointermove", function (e) {
        if (cadre) return;
        cadre = window.requestAnimationFrame(function () {
          cadre = null;
          var r = carte.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          carte.style.transform =
            "perspective(900px) rotateY(" + (x * 7).toFixed(2) + "deg) rotateX(" +
            (-y * 7).toFixed(2) + "deg) translateZ(6px)";
        });
      });
      carte.addEventListener("pointerleave", function () {
        carte.style.transform = "";
      });
    });
  }

  /* =========================================================
     RÉALISATIONS — filtres et visionneuse
     ========================================================= */
  var galerie = document.getElementById("galerie");
  var oeuvres = galerie ? Array.prototype.slice.call(galerie.querySelectorAll(".oeuvre")) : [];
  var filtres = Array.prototype.slice.call(document.querySelectorAll(".filtre"));

  function oeuvresVisibles() {
    return oeuvres.filter(function (o) { return !o.classList.contains("est-masquee"); });
  }

  filtres.forEach(function (bouton) {
    bouton.addEventListener("click", function () {
      var choix = bouton.getAttribute("data-filtre");
      filtres.forEach(function (b) { b.setAttribute("aria-pressed", String(b === bouton)); });
      oeuvres.forEach(function (o) {
        var garde = choix === "tout" || o.getAttribute("data-categorie") === choix;
        o.classList.toggle("est-masquee", !garde);
      });
    });
  });

  var visionneuse = document.getElementById("visionneuse");
  var vueImage = document.getElementById("visionneuseImage");
  var vueLegende = document.getElementById("visionneuseLegende");
  var focusAvant = null;
  var positionVue = 0;

  function montreVue(position) {
    var liste = oeuvresVisibles();
    if (!liste.length) return;
    positionVue = (position + liste.length) % liste.length;
    var oeuvre = liste[positionVue];
    var img = oeuvre.querySelector("img");
    var titre = oeuvre.querySelector(".oeuvre__titre");
    var meta = oeuvre.querySelector(".oeuvre__meta");
    vueImage.src = img.getAttribute("src");
    vueImage.alt = img.getAttribute("alt") || "";
    vueLegende.textContent = [titre && titre.textContent, meta && meta.textContent]
      .filter(Boolean).join(" · ");
  }

  function ouvreVue(oeuvre) {
    focusAvant = document.activeElement;
    montreVue(oeuvresVisibles().indexOf(oeuvre));
    visionneuse.classList.add("est-ouverte");
    document.body.style.overflow = "hidden";
    visionneuse.querySelector("[data-fermer-visionneuse]").focus();
  }
  function fermeVue() {
    visionneuse.classList.remove("est-ouverte");
    document.body.style.overflow = "";
    if (focusAvant) focusAvant.focus();
  }

  if (visionneuse && oeuvres.length) {
    oeuvres.forEach(function (o) {
      o.addEventListener("click", function () { ouvreVue(o); });
    });
    visionneuse.querySelector("[data-fermer-visionneuse]").addEventListener("click", fermeVue);
    visionneuse.querySelector("[data-visionneuse-prec]").addEventListener("click", function () { montreVue(positionVue - 1); });
    visionneuse.querySelector("[data-visionneuse-suiv]").addEventListener("click", function () { montreVue(positionVue + 1); });
    visionneuse.addEventListener("click", function (e) { if (e.target === visionneuse) fermeVue(); });

    document.addEventListener("keydown", function (e) {
      if (!visionneuse.classList.contains("est-ouverte")) return;
      if (e.key === "Escape") { fermeVue(); return; }
      if (e.key === "ArrowLeft") { montreVue(positionVue - 1); return; }
      if (e.key === "ArrowRight") { montreVue(positionVue + 1); return; }
      if (e.key === "Tab") {
        var cibles = visionneuse.querySelectorAll("button");
        var premier = cibles[0], dernier = cibles[cibles.length - 1];
        if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
        else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
      }
    });
  }

  /* =========================================================
     VISUALISEUR 3D
     ========================================================= */
  var scene = document.getElementById("scene3d");
  var viseur = null;
  if (scene && window.WEBLY_VISEUR) {
    viseur = window.WEBLY_VISEUR.demarre({ scene: scene, ouverture: "oscillo" });
  }

  var boutonsMatiere = Array.prototype.slice.call(document.querySelectorAll(".matiere"));
  function appliqueMatiere(bouton) {
    boutonsMatiere.forEach(function (b) { b.setAttribute("aria-pressed", String(b === bouton)); });
    if (viseur) viseur.changeTexture(bouton.getAttribute("data-texture"));
    var champs = {
      ficheNom: bouton.textContent.trim(),
      ficheEntretien: bouton.getAttribute("data-entretien"),
      ficheIsolation: bouton.getAttribute("data-isolation"),
      ficheDuree: bouton.getAttribute("data-duree"),
      ficheBudget: bouton.getAttribute("data-budget")
    };
    Object.keys(champs).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && champs[id]) el.textContent = champs[id];
    });
  }
  boutonsMatiere.forEach(function (b) {
    b.addEventListener("click", function () { appliqueMatiere(b); });
  });

  // Positions d'ouverture : sans WebGL, le repli CSS ne sait pas les
  // montrer — on retire les boutons plutôt que d'en laisser d'inopérants.
  var groupeOuverture = document.querySelector(".ouvertures");
  var boutonsOuverture = Array.prototype.slice.call(document.querySelectorAll(".ouverture"));
  if (groupeOuverture && !viseur) groupeOuverture.hidden = true;
  boutonsOuverture.forEach(function (b) {
    b.addEventListener("click", function () {
      boutonsOuverture.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      if (viseur) viseur.changeOuverture(b.getAttribute("data-ouverture"));
    });
  });
  if (boutonsMatiere.length) {
    var actif = boutonsMatiere.filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })[0]
      || boutonsMatiere[0];
    appliqueMatiere(actif);
  }

  /* =========================================================
     DEVIS — formulaire par étapes
     Validation réelle puis ouverture de la messagerie avec la
     demande pré-rédigée. Aucun backend fabriqué : pour brancher un
     vrai service (Formspree, Brevo...), remplacez envoieDevis().
     ========================================================= */
  var form = document.getElementById("formDevis");
  if (form) {
    var volets = Array.prototype.slice.call(form.querySelectorAll(".volet"));
    var jauge = Array.prototype.slice.call(form.querySelectorAll(".devis__jauge span"));
    var btnPrec = document.getElementById("precedent");
    var btnSuiv = document.getElementById("suivant");
    var btnEnvoi = document.getElementById("envoyer");
    var etat = document.getElementById("etatDevis");
    var annonce = document.getElementById("etapeCourante");
    var courante = 0;

    // « focalise » : seulement quand le visiteur change lui-même d'étape.
    // Au chargement, déplacer le focus dans le formulaire volerait la
    // première touche Tab et ferait démarrer un lecteur d'écran en milieu
    // de page.
    function montreVolet(position, focalise) {
      courante = Math.max(0, Math.min(volets.length - 1, position));
      volets.forEach(function (v, i) { v.classList.toggle("est-active", i === courante); });
      jauge.forEach(function (s, i) { s.classList.toggle("est-faite", i <= courante); });
      btnPrec.hidden = courante === 0;
      btnSuiv.hidden = courante === volets.length - 1;
      btnEnvoi.hidden = courante !== volets.length - 1;
      if (annonce) annonce.textContent = "Étape " + (courante + 1) + " sur " + volets.length;
      etat.textContent = "";
      etat.className = "devis__etat";
      var premier = volets[courante].querySelector("input, select, textarea");
      if (focalise && premier) premier.focus({ preventScroll: true });
    }

    function messageErreur(champ) {
      if (champ.validity.valueMissing) return "Champ obligatoire.";
      if (champ.validity.typeMismatch && champ.type === "email") return "Adresse email invalide.";
      if (champ.validity.patternMismatch && champ.type === "tel") return "Numéro invalide.";
      return "";
    }

    function valideVolet(position) {
      var volet = volets[position];
      var ok = true;

      // Étape 1 : un choix d'ouvrage est nécessaire pour chiffrer quoi que ce soit.
      var radios = volet.querySelectorAll('input[type="radio"][required]');
      if (radios.length) {
        var coche = volet.querySelector('input[type="radio"]:checked');
        var err = document.getElementById("ouvrageErreur");
        if (err) err.textContent = coche ? "" : "Choisissez un type d'ouvrage.";
        if (!coche) ok = false;
      }

      volet.querySelectorAll("input[required], select[required]").forEach(function (champ) {
        if (champ.type === "radio") return;
        var err = document.getElementById(champ.id + "Erreur");
        var message = messageErreur(champ);
        if (err) err.textContent = message;
        if (message) ok = false;
      });
      return ok;
    }

    // Efface l'erreur dès que le visiteur corrige : pas de rouge qui s'incruste.
    form.querySelectorAll("input, select").forEach(function (champ) {
      var evenement = champ.type === "radio" ? "change" : "input";
      champ.addEventListener(evenement, function () {
        if (champ.type === "radio") {
          var err = document.getElementById("ouvrageErreur");
          if (err) err.textContent = "";
          return;
        }
        var e = document.getElementById(champ.id + "Erreur");
        if (e && e.textContent) e.textContent = messageErreur(champ);
      });
    });

    btnSuiv.addEventListener("click", function () {
      if (!valideVolet(courante)) {
        etat.textContent = "Merci de compléter cette étape.";
        etat.className = "devis__etat est-ko";
        return;
      }
      montreVolet(courante + 1, true);
    });
    btnPrec.addEventListener("click", function () { montreVolet(courante - 1, true); });

    function valeur(id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : "";
    }

    function envoieDevis() {
      var contenu = window.WEBLY_CONTENT;
      var destinataire = (contenu && contenu.devis && contenu.devis.email_reception)
        || SITE_CONFIG.devisEmail;

      var ouvrage = form.querySelector('input[name="ouvrage"]:checked');
      ouvrage = ouvrage ? ouvrage.value : "Non précisé";

      var sujet = "Demande de devis — " + ouvrage;
      var corps = [
        "Nouvelle demande de devis depuis le site :",
        "",
        "— LE CHANTIER —",
        "Type : " + ouvrage,
        valeur("quantite") ? "Quantité ou surface : " + valeur("quantite") : null,
        "Matériau souhaité : " + valeur("materiau"),
        "Type de pose : " + valeur("typePose"),
        "Âge du logement : " + valeur("anciennete"),
        valeur("details") ? "Description : " + valeur("details") : null,
        "",
        "— BUDGET ET DÉLAI —",
        "Budget : " + valeur("budget"),
        "Délai : " + valeur("delai"),
        valeur("adresseChantier") ? "Commune : " + valeur("adresseChantier") : null,
        "",
        "— CONTACT —",
        "Nom : " + valeur("nom"),
        "Email : " + valeur("courriel"),
        "Téléphone : " + valeur("telephone")
      ].filter(function (l) { return l !== null; }).join("\n");

      window.location.href = "mailto:" + encodeURIComponent(destinataire) +
        "?subject=" + encodeURIComponent(sujet) +
        "&body=" + encodeURIComponent(corps);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // On revalide toutes les étapes : le visiteur a pu revenir en arrière
      // et vider un champ déjà validé.
      for (var i = 0; i < volets.length; i++) {
        if (!valideVolet(i)) {
          montreVolet(i, true);
          etat.textContent = "Merci de compléter cette étape.";
          etat.className = "devis__etat est-ko";
          return;
        }
      }

      envoieDevis();
      etat.textContent = "Votre messagerie s'ouvre avec la demande pré-rédigée.";
      etat.className = "devis__etat est-ok";
    });

    montreVolet(0, false);
  }

  /* ---------- Intro 3D : en dernier, pour ne rien bloquer ---------- */
  if (introPossible) window.setTimeout(demarreIntro, 0);

  /* ---------- Année ---------- */
  var annee = document.getElementById("annee");
  if (annee) annee.textContent = new Date().getFullYear();

  } /* fin de boot() */

  /* =========================================================
     Départ — on attend content.js sans jamais le laisser bloquer
     la page : au-delà de 1,5 s, on démarre avec le contenu du HTML.
     ========================================================= */
  var pret = window.WEBLY_CONTENT_READY;
  if (pret && typeof pret.then === "function") {
    var delai = new Promise(function (resoudre) { window.setTimeout(resoudre, 1500); });
    Promise.race([pret, delai]).then(boot, boot);
  } else {
    boot();
  }
})();
