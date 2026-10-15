/* =========================================================================
   PILLIARD MENUISERIE AGENCEMENT — interactions
   Dépend de : config.js (coordonnées), bois.js (textures), dessins.js (plans).
   ========================================================================= */
(function () {
  "use strict";

  var C = window.PMA_CONFIG || {};
  var Bois = window.Bois;
  var DESSINS = window.DESSINS || {};
  var doc = document.documentElement;
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var survol = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function borne(v, a, b) { return v < a ? a : v > b ? b : v; }
  function apres(ms, fn) { return window.setTimeout(fn, ms); }
  function auRepos(fn) { (window.requestIdleCallback || function (f) { return apres(30, f); })(fn); }

  /* Exécute fn quand l'élément approche de l'écran (une seule fois). */
  function bientotVisible(el, fn, marge) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entrees) {
      if (entrees[0].isIntersecting) { io.disconnect(); fn(); }
    }, { rootMargin: marge || "400px 0px" });
    io.observe(el);
  }

  /* =======================================================================
     1. Coordonnées (config.js)
     ======================================================================= */
  function lienTelephone(t) {
    var n = String(t || "").replace(/[^\d+]/g, "");
    if (n.charAt(0) === "0") n = "+33" + n.slice(1);
    return "tel:" + n;
  }
  $$("[data-config]").forEach(function (el) {
    var v = C[el.getAttribute("data-config")];
    if (v) el.textContent = v;
  });
  $$('[data-lien="telephone"]').forEach(function (a) { if (C.telephone) a.href = lienTelephone(C.telephone); });
  $$('[data-lien="email"]').forEach(function (a) { if (C.email) a.href = "mailto:" + C.email; });
  var annee = $("#annee");
  if (annee) annee.textContent = new Date().getFullYear();

  /* =======================================================================
     2. Le monogramme en image (pour le graver dans le bois)
     ======================================================================= */
  var logoImg = null, logoAttente = [];
  function logoImage(cb) {
    if (logoImg !== null) { cb(logoImg); return; }
    logoAttente.push(cb);
    if (logoAttente.length > 1) return;
    var masque = document.getElementById("pma-creux"), sym = document.getElementById("pma");
    function fin(img) { logoImg = img; logoAttente.splice(0).forEach(function (f) { f(img); }); }
    if (!masque || !sym) { fin(false); return; }
    var src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 272 120" width="1088" height="480"><defs>' +
      masque.outerHTML + '</defs><g fill="#000">' + sym.innerHTML + "</g></svg>";
    var img = new Image();
    img.onload = function () { fin(img); };
    img.onerror = function () { fin(false); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
  }

  function calque(w, h) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c.getContext("2d");
  }

  /* Ombre portée à l'intérieur d'une gravure : on dessine l'ombre du
     « négatif » (tout sauf le logo) puis on ne garde que l'intérieur. */
  function ombreInterieure(ctx, negatif, masque, W, H, couleur, dx, dy, flou) {
    var c = calque(W, H);
    c.shadowColor = couleur; c.shadowBlur = flou;
    c.shadowOffsetX = dx + W; c.shadowOffsetY = dy;
    c.drawImage(negatif, -W, 0);
    c.shadowColor = "transparent";
    c.globalCompositeOperation = "destination-in";
    c.drawImage(masque, 0, 0);
    ctx.drawImage(c.canvas, 0, 0);
  }

  function espace(t) { return t.split("").join(" "); }

  /* =======================================================================
     3. Le panneau gravé de l'accueil
     ======================================================================= */
  var panneauCanvas = $("#panneauCanvas");
  var panneauBois = $(".panneau__bois");
  var essencePanneau = "chene";

  function graver(ess, cb) {
    if (!panneauCanvas || !Bois) { if (cb) cb(); return; }
    var boite = panneauBois.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = Math.round(boite.width * dpr), H = Math.round(boite.height * dpr);
    if (!W || !H) { if (cb) cb(); return; }

    logoImage(function (logo) {
      var bois = Bois.canvas(ess, W, H, { graine: 21, sens: "v", lames: Math.round(W / 3.4) });
      panneauCanvas.width = W; panneauCanvas.height = H;
      var ctx = panneauCanvas.getContext("2d");
      ctx.drawImage(bois, 0, 0);
      var s = W / 460;

      if (logo) {
        var lw = W * 0.66, lh = lw * 120 / 272, lx = (W - lw) / 2, ly = H * 0.42 - lh / 2;
        var m = calque(W, H);
        m.drawImage(logo, lx, ly, lw, lh);

        // fond de gravure : le même bois, plus sombre (fond de toupie)
        var g = calque(W, H);
        g.drawImage(bois, 0, 0);
        g.fillStyle = "rgba(48, 27, 12, 0.42)";
        g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = "destination-in";
        g.drawImage(m.canvas, 0, 0);
        ctx.drawImage(g.canvas, 0, 0);

        var neg = calque(W, H);
        neg.fillStyle = "#000"; neg.fillRect(0, 0, W, H);
        neg.globalCompositeOperation = "destination-out";
        neg.drawImage(m.canvas, 0, 0);
        ombreInterieure(ctx, neg.canvas, m.canvas, W, H, "rgba(24, 11, 3, 0.9)", 3.5 * s, 5 * s, 6 * s);
        ombreInterieure(ctx, neg.canvas, m.canvas, W, H, "rgba(255, 238, 214, 0.5)", -1.5 * s, -2 * s, 1.5 * s);

        // marque au fer, sous le monogramme
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = "rgba(66, 36, 16, 0.62)";
        ctx.textAlign = "center";
        ctx.font = "600 " + Math.round(15 * s) + "px ui-monospace, Menlo, Consolas, monospace";
        ctx.fillText(espace("PILLIARD"), W / 2, ly + lh + 46 * s);
        ctx.font = Math.round(9.5 * s) + "px ui-monospace, Menlo, Consolas, monospace";
        ctx.fillText(espace("MENUISERIE · AGENCEMENT"), W / 2, ly + lh + 66 * s);
        ctx.fillRect(W / 2 - 18 * s, ly + lh + 80 * s, 36 * s, 1.2 * s);
        ctx.restore();
      }

      // vernis : léger vignettage
      var v = ctx.createRadialGradient(W * 0.5, H * 0.42, W * 0.2, W * 0.5, H * 0.5, W * 0.95);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(34, 17, 6, 0.3)");
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
      if (cb) cb();
    });
  }

  // Inclinaison et reflet qui suivent la souris
  (function () {
    var accueil = $("#accueil");
    if (!accueil || !panneauBois || !survol || reduit) return;
    var cible = null, rafId = 0;
    function applique() {
      rafId = 0;
      if (!cible) {
        panneauBois.style.setProperty("--rx", "0deg");
        panneauBois.style.setProperty("--ry", "0deg");
        panneauBois.style.setProperty("--lx", "28%");
        panneauBois.style.setProperty("--ly", "18%");
        return;
      }
      var r = panneauBois.getBoundingClientRect();
      var x = borne((cible.x - r.left) / r.width, -0.3, 1.3), y = borne((cible.y - r.top) / r.height, -0.3, 1.3);
      panneauBois.style.setProperty("--ry", ((x - 0.5) * 9).toFixed(2) + "deg");
      panneauBois.style.setProperty("--rx", ((0.5 - y) * 7).toFixed(2) + "deg");
      panneauBois.style.setProperty("--lx", (x * 100).toFixed(1) + "%");
      panneauBois.style.setProperty("--ly", (y * 100).toFixed(1) + "%");
    }
    accueil.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      cible = { x: e.clientX, y: e.clientY };
      if (!rafId) rafId = requestAnimationFrame(applique);
    });
    accueil.addEventListener("pointerleave", function () {
      cible = null;
      if (!rafId) rafId = requestAnimationFrame(applique);
    });
  })();

  // Changer d'essence : le nouveau bois arrive comme un coup de rabot
  var NOMS = { chene: "chêne", noyer: "noyer", frene: "frêne", douglas: "douglas", meleze: "mélèze", ipe: "ipé" };
  $$(".essai").forEach(function (b) {
    b.addEventListener("click", function () {
      var ess = b.getAttribute("data-essence");
      if (ess === essencePanneau) return;
      essencePanneau = ess;
      $$(".essai").forEach(function (x) {
        var actif = x === b;
        x.classList.toggle("est-actif", actif);
        x.setAttribute("aria-pressed", actif ? "true" : "false");
      });
      var nom = $("#panneauEssence");
      if (nom) nom.textContent = NOMS[ess] || ess;

      var ancien = document.createElement("canvas");
      ancien.width = panneauCanvas.width; ancien.height = panneauCanvas.height;
      ancien.className = "panneau__ancien";
      ancien.getContext("2d").drawImage(panneauCanvas, 0, 0);
      panneauBois.insertBefore(ancien, panneauCanvas);
      graver(ess, function () {
        panneauBois.classList.remove("est-change");
        void panneauBois.offsetWidth;
        panneauBois.classList.add("est-change");
        apres(reduit ? 0 : 800, function () { if (ancien.parentNode) ancien.parentNode.removeChild(ancien); });
      });
      boisTexte(ess);
    });
  });

  function boisTexte(ess) {
    if (!Bois) return;
    $$(".bois-texte").forEach(function (el) {
      el.style.backgroundImage = "url(" + Bois.url(ess, 520, 200, { graine: 5 }) + ")";
      el.classList.add("a-du-bois");
    });
  }

  /* Petites pastilles de bois (boutons d'essence, formulaire) et placage des boutons */
  function pastilles() {
    if (!Bois) return;
    $$(".essai").forEach(function (b, i) {
      var i2 = $("i", b);
      if (i2) i2.style.backgroundImage = "url(" + Bois.url(b.getAttribute("data-essence"), 72, 72, { graine: 3 + i }) + ")";
    });
    $$("[data-pastille]").forEach(function (el, i) {
      el.style.backgroundImage = "url(" + Bois.url(el.getAttribute("data-pastille"), 72, 72, { graine: 3 + i }) + ")";
    });
    var plaque = "url(" + Bois.url("chene", 520, 180, { graine: 9 }) + ")";
    $$(".bouton, a.carte-contact").forEach(function (b) { b.style.setProperty("--plaque", plaque); });
  }

  /* =======================================================================
     4. Ouverture : le temps de préparer le bois, puis un trait de scie
     ======================================================================= */
  var ouverture = $("#ouverture");
  var dejaVu = false;
  try { dejaVu = sessionStorage.getItem("pma-ouverture") === "1"; } catch (e) { /* stockage indisponible */ }

  function preparer() {
    boisTexte("chene");
    graver("chene");
    pastilles();
  }
  function pret() { doc.classList.add("est-pret"); }

  if (!ouverture || reduit || dejaVu) {
    if (ouverture) ouverture.classList.add("est-fini");
    preparer();
    requestAnimationFrame(pret);
  } else {
    document.body.classList.add("en-ouverture");
    var debut = Date.now(), ouverte = false;
    var ouvrir = function () {
      if (ouverte) return;
      ouverte = true;
      ouverture.classList.add("est-coupe");
      apres(480, function () {
        ouverture.classList.add("est-ouvert");
        document.body.classList.remove("en-ouverture");
        pret();
      });
      apres(1450, function () { ouverture.classList.add("est-fini"); });
    };
    ouverture.addEventListener("click", ouvrir);
    // laisse l'écran d'ouverture s'afficher avant de calculer le bois
    requestAnimationFrame(function () {
      apres(50, function () {
        // Quoi qu'il arrive pendant la préparation, la page doit s'ouvrir.
        try { preparer(); } finally { apres(Math.max(0, 1150 - (Date.now() - debut)), ouvrir); }
      });
    });
    try { sessionStorage.setItem("pma-ouverture", "1"); } catch (e) { /* idem */ }
  }

  /* =======================================================================
     5. En-tête, menu mobile, lien actif
     ======================================================================= */
  var entete = $("#entete"), nav = $("#nav"), burger = $("#burger");
  var dernierY = window.scrollY;

  function fermerMenu() {
    if (!nav) return;
    nav.classList.remove("est-ouverte");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-ouvert");
  }
  if (burger) {
    burger.addEventListener("click", function () {
      var ouvert = !nav.classList.contains("est-ouverte");
      nav.classList.toggle("est-ouverte", ouvert);
      burger.setAttribute("aria-expanded", ouvert ? "true" : "false");
      document.body.classList.toggle("menu-ouvert", ouvert);
      entete.classList.remove("est-cache");
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", fermerMenu); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("est-ouverte")) { fermerMenu(); burger.focus(); }
    });
  }

  // L'en-tête se replie au premier défilement, se cache quand on descend et
  // revient dès qu'on remonte. Le seuil de 6 px évite qu'il clignote quand
  // on fait défiler lentement.
  function majEntete() {
    var y = window.scrollY, ecart = y - dernierY;
    entete.classList.toggle("est-replie", y > 30);
    var menuOuvert = nav && nav.classList.contains("est-ouverte");
    if (y <= 500 || menuOuvert) entete.classList.remove("est-cache");
    else if (ecart > 6) entete.classList.add("est-cache");
    else if (ecart < -6) entete.classList.remove("est-cache");
    if (Math.abs(ecart) > 6 || y <= 500) dernierY = y;
  }
  // Un lien de l'en-tête qui reçoit le focus clavier doit être visible.
  if (entete) entete.addEventListener("focusin", function () { entete.classList.remove("est-cache"); });

  if ("IntersectionObserver" in window) {
    var liens = $$(".nav ul a");
    var ioNav = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        liens.forEach(function (a) { a.classList.toggle("est-courant", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(function (s) { ioNav.observe(s); });
  }

  /* =======================================================================
     6. Manifeste : le texte s'écrit à mesure que l'on lit
     ======================================================================= */
  var manifeste = $("[data-manifeste]"), mots = [];
  if (manifeste) {
    var morceaux = manifeste.textContent.split(/([ \t\n]+)/);
    manifeste.textContent = "";
    morceaux.forEach(function (m) {
      if (/^[ \t\n]+$/.test(m)) { manifeste.appendChild(document.createTextNode(" ")); return; }
      if (!m) return;
      var span = document.createElement("span");
      span.className = "mot";
      span.textContent = m;
      manifeste.appendChild(span);
      mots.push(span);
    });
  }
  function majManifeste() {
    if (!mots.length) return;
    var r = manifeste.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < -vh || r.top > vh * 2) return;
    var p = borne((vh * 0.88 - r.top) / (r.height + vh * 0.3), 0, 1);
    var n = Math.round(p * mots.length);
    for (var i = 0; i < mots.length; i++) mots[i].classList.toggle("est-lu", i < n);
  }

  /* =======================================================================
     7. Révélations au défilement
     ======================================================================= */
  if ("IntersectionObserver" in window) {
    var ioRev = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("est-visible"); ioRev.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    $$(".revele").forEach(function (el) { ioRev.observe(el); });
  } else {
    $$(".revele").forEach(function (el) { el.classList.add("est-visible"); });
  }

  /* =======================================================================
     8. Plans d'atelier : insertion, tracé, habillage bois
     ======================================================================= */
  function inserePlan(el, cle) {
    var d = DESSINS[cle];
    if (!d) return null;
    el.classList.add("plan");
    el.innerHTML = '<svg viewBox="' + (d.vb || "0 0 400 300") + '" role="img" aria-label="Plan : ' + d.titre + '">' + d.svg + "</svg>";
    return el;
  }

  function prepareTrace(el) {
    var traits = $$(".p, .t, .f, .c", el), n = traits.length;
    traits.forEach(function (t, i) {
      var l = 600;
      try { l = Math.ceil(t.getTotalLength()) + 2; } catch (e) { /* forme sans longueur */ }
      t.style.setProperty("--l", l);
      t.style.setProperty("--d", ((i / n) * 0.9).toFixed(3) + "s");
    });
    el.classList.remove("est-trace");
    el.classList.add("a-tracer");
  }
  function trace(el) {
    if (reduit) { el.classList.remove("a-tracer"); return; }
    prepareTrace(el);
    void el.offsetWidth;
    requestAnimationFrame(function () { el.classList.add("est-trace"); });
  }

  var numMotif = 0;
  function habille(el, ess) {
    var svg = $("svg", el);
    if (!svg || !Bois || el.getAttribute("data-habille")) return;
    el.setAttribute("data-habille", "1");
    var ns = "http://www.w3.org/2000/svg", id = "bois-motif-" + (++numMotif);
    var vb = (svg.getAttribute("viewBox") || "0 0 400 300").split(/\s+/), lw = +vb[2], lh = +vb[3];
    var defs = document.createElementNS(ns, "defs");
    var motif = document.createElementNS(ns, "pattern");
    motif.setAttribute("id", id);
    motif.setAttribute("patternUnits", "userSpaceOnUse");
    motif.setAttribute("width", lw);
    motif.setAttribute("height", lh);
    var image = document.createElementNS(ns, "image");
    image.setAttribute("href", Bois.url(ess, Math.round(lw * 1.4), Math.round(lh * 1.4), { graine: numMotif * 13 + 2 }));
    image.setAttribute("width", lw);
    image.setAttribute("height", lh);
    image.setAttribute("preserveAspectRatio", "none");
    motif.appendChild(image);
    defs.appendChild(motif);
    svg.insertBefore(defs, svg.firstChild);
    $$(".p", svg).forEach(function (p, i) {
      p.setAttribute("fill", "url(#" + id + ")");
      p.style.setProperty("--df", (i * 0.035).toFixed(3) + "s");
    });
  }

  $$("[data-dessin]").forEach(function (el) { inserePlan(el, el.getAttribute("data-dessin")); });

  /* =======================================================================
     9. Prestations : accordéon + aperçu qui suit le curseur
     ======================================================================= */
  $$(".ouvrage").forEach(function (li, i) {
    var bouton = $(".ouvrage__ligne", li), plan = $(".ouvrage__plan", li), detail = $(".ouvrage__detail", li);
    if (detail) { detail.id = "ouvrage-detail-" + (i + 1); bouton.setAttribute("aria-controls", detail.id); }
    bouton.addEventListener("click", function () {
      var ouvert = !li.classList.contains("est-ouvert");
      li.classList.toggle("est-ouvert", ouvert);
      bouton.setAttribute("aria-expanded", ouvert ? "true" : "false");
      if (ouvert && plan) trace(plan);
      if (ouvert) cacheApercu();
    });
  });

  if (!survol) {
    var consigne = $(".prestations .entete-section__texte");
    if (consigne) consigne.textContent = "Touchez une ligne pour voir le plan.";
  }
  var apercu = $("#apercu"), feuille = apercu && $(".apercu__feuille", apercu);
  var cleApercu = null;
  function cacheApercu() { if (apercu) apercu.classList.remove("est-visible"); cleApercu = null; }
  (function () {
    var liste = $("#ouvrages");
    if (!liste || !apercu || !survol) return;
    var pos = { x: -999, y: -999 }, cur = { x: -999, y: -999 }, rafId = 0, actif = false;
    function boucle() {
      cur.x += (pos.x - cur.x) * 0.16;
      cur.y += (pos.y - cur.y) * 0.16;
      apercu.style.setProperty("--ax", (cur.x + 28).toFixed(1) + "px");
      apercu.style.setProperty("--ay", (cur.y - 140).toFixed(1) + "px");
      rafId = actif || Math.abs(pos.x - cur.x) > 0.5 ? requestAnimationFrame(boucle) : 0;
    }
    $$(".ouvrage", liste).forEach(function (li) {
      var ligne = $(".ouvrage__ligne", li);
      ligne.addEventListener("mouseenter", function (e) {
        if (li.classList.contains("est-ouvert")) return;
        var cle = li.getAttribute("data-dessin-apercu");
        if (cur.x < -900) { cur.x = e.clientX; cur.y = e.clientY; }
        if (cle !== cleApercu) {
          cleApercu = cle;
          inserePlan(feuille, cle);
          trace(feuille);
        }
        apercu.classList.add("est-visible");
      });
      ligne.addEventListener("mouseleave", cacheApercu);
    });
    liste.addEventListener("mousemove", function (e) {
      pos.x = Math.min(e.clientX, window.innerWidth - 380);
      pos.y = e.clientY;
      actif = true;
      if (!rafId) rafId = requestAnimationFrame(boucle);
    });
    liste.addEventListener("mouseleave", function () { actif = false; cacheApercu(); });
    window.addEventListener("scroll", cacheApercu, { passive: true });
  })();

  /* =======================================================================
     10. Méthode : la queue d'aronde s'assemble au fil du défilement
     ======================================================================= */
  var methode = $("#methode"), arondeB = $("#arondeB"), etapes = $$(".etape");
  var ombreB = $("#aronde-ombre-b"), compteur = $("#methodeEtape");
  var assemble = false;

  if (methode) {
    var grille = $(".aronde__grille", methode), ns = "http://www.w3.org/2000/svg";
    for (var gx = 0; gx <= 520; gx += 40) {
      var l1 = document.createElementNS(ns, "line");
      l1.setAttribute("x1", gx); l1.setAttribute("x2", gx); l1.setAttribute("y1", 0); l1.setAttribute("y2", 640);
      grille.appendChild(l1);
    }
    for (var gy = 0; gy <= 640; gy += 40) {
      var l2 = document.createElementNS(ns, "line");
      l2.setAttribute("y1", gy); l2.setAttribute("y2", gy); l2.setAttribute("x1", 0); l2.setAttribute("x2", 520);
      grille.appendChild(l2);
    }
    bientotVisible(methode, function () {
      if (!Bois) return;
      $("#aronde-img-a").setAttribute("href", Bois.url("chene", 520, 640, { graine: 41, lames: 0 }));
      $("#aronde-img-b").setAttribute("href", Bois.url("chene", 520, 640, { graine: 77, sens: "v" }));
    }, "800px 0px");
  }

  function sciure() {
    var g = $("#sciure");
    if (!g || reduit || !g.animate) return;
    var ns2 = "http://www.w3.org/2000/svg";
    for (var i = 0; i < 34; i++) {
      var c = document.createElementNS(ns2, "circle");
      var y = 228 + Math.random() * 124, x = Math.random() < 0.5 ? 358 : 442;
      if (x > 400 && y > 352) y -= 120;
      c.setAttribute("cx", x); c.setAttribute("cy", y);
      c.setAttribute("r", (0.8 + Math.random() * 2.2).toFixed(2));
      g.appendChild(c);
      var dx = (x < 400 ? -1 : 1) * (20 + Math.random() * 90), dy = -30 + Math.random() * 110;
      c.animate([
        { transform: "translate(0,0)", opacity: 1 },
        { transform: "translate(" + dx + "px," + dy + "px)", opacity: 0 }
      ], { duration: 700 + Math.random() * 700, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" })
        .onfinish = (function (el) { return function () { if (el.parentNode) el.parentNode.removeChild(el); }; })(c);
    }
  }

  function majMethode() {
    if (!methode || !etapes.length) return;
    var vh = window.innerHeight, actif = 0, zone = methode.getBoundingClientRect();
    if (zone.bottom < -vh || zone.top > vh * 2) return;
    etapes.forEach(function (e, i) { if (e.getBoundingClientRect().top < vh * 0.6) actif = i; });
    etapes.forEach(function (e, i) { e.classList.toggle("est-active", i === actif); });
    methode.setAttribute("data-etape", actif);
    if (compteur) compteur.textContent = "0" + (actif + 1);

    // La pièce B : invisible, puis suspendue au-dessus (atelier), puis posée.
    var t = 0;
    if (actif >= 3) t = borne((vh * 0.8 - etapes[3].getBoundingClientRect().top) / (vh * 0.4), 0, 1);
    if (reduit && actif >= 3) t = 1;
    var visible = actif >= 2;
    var k = 1 - t, e2 = k * k;
    arondeB.style.opacity = visible ? 1 : 0;
    arondeB.style.transform = "translate(" + (70 * e2).toFixed(1) + "px," + (-120 * e2).toFixed(1) + "px) rotate(" + (-9 * e2).toFixed(2) + "deg) scale(" + (1 + 0.14 * e2).toFixed(3) + ")";
    if (ombreB) {
      ombreB.setAttribute("dy", (3 + 32 * e2).toFixed(1));
      ombreB.setAttribute("dx", (-2 - 14 * e2).toFixed(1));
      ombreB.setAttribute("stdDeviation", (2.5 + 22 * e2).toFixed(1));
      ombreB.setAttribute("flood-opacity", (0.35 + 0.25 * e2).toFixed(2));
    }
    var maintenant = t >= 0.999;
    if (maintenant && !assemble) sciure();
    assemble = maintenant;
    methode.classList.toggle("est-assemble", maintenant);
  }

  /* =======================================================================
     11. Réalisations : du trait au bois
     ======================================================================= */
  var rail = $("#rail"), projets = $$(".projet");

  function montreFini(projet, fini) {
    var plan = $(".projet__plan", projet), bascule = $(".bascule", projet);
    if (fini) habille(plan, projet.getAttribute("data-essence") || "chene");
    plan.classList.toggle("est-fini", fini);
    projet.classList.toggle("est-fini", fini);
    if (bascule) bascule.setAttribute("aria-pressed", fini ? "true" : "false");
  }

  projets.forEach(function (projet, i) {
    var plan = $(".projet__plan", projet);
    var choixVisiteur = false;
    $(".bascule", projet).addEventListener("click", function () {
      choixVisiteur = true;
      var fini = !projet.classList.contains("est-fini");
      if (!fini) trace(plan);
      montreFini(projet, fini);
    });
    bientotVisible(projet, function () {
      if (choixVisiteur) return;
      trace(plan);
      apres(reduit ? 0 : 1500 + i * 60, function () {
        auRepos(function () { if (!choixVisiteur) montreFini(projet, true); });
      });
    }, "0px -10% 0px 0px");
  });

  if (rail) {
    var prec = $("#railPrec"), suiv = $("#railSuiv"), cpt = $("#railCompteur");
    var deux = function (n) { return ("0" + n).slice(-2); };
    // Position de défilement qui aligne chaque projet sur le bord gauche
    // (les cartes n'ont pas toutes la même largeur : paysage ou portrait).
    var positions = function () {
      var r = rail.getBoundingClientRect().left, marge = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
      return projets.map(function (p) { return p.getBoundingClientRect().left - r + rail.scrollLeft - marge; });
    };
    var maxRail = function () { return rail.scrollWidth - rail.clientWidth; };
    var indexCourant = function () {
      var pos = positions(), x = rail.scrollLeft, meilleur = 0;
      if (x >= maxRail() - 2) return projets.length - 1;
      pos.forEach(function (v, i) { if (Math.abs(v - x) < Math.abs(pos[meilleur] - x)) meilleur = i; });
      return meilleur;
    };
    var allerA = function (i) {
      i = borne(i, 0, projets.length - 1);
      rail.scrollTo({ left: Math.min(positions()[i], maxRail()), behavior: reduit ? "auto" : "smooth" });
    };
    var majRail = function () {
      cpt.textContent = deux(indexCourant() + 1) + " / " + deux(projets.length);
      prec.disabled = rail.scrollLeft <= 2;
      suiv.disabled = rail.scrollLeft >= maxRail() - 2;
    };
    // Précédent / suivant : le premier projet dont le bord est avant / après
    // la position actuelle (fonctionne aussi en butée de fin de rail).
    prec.addEventListener("click", function () {
      var pos = positions(), x = rail.scrollLeft, cible = 0;
      pos.forEach(function (v, i) { if (v < x - 4) cible = i; });
      allerA(cible);
    });
    suiv.addEventListener("click", function () {
      var pos = positions(), x = rail.scrollLeft;
      for (var i = 0; i < pos.length; i++) if (pos[i] > x + 4) { allerA(i); return; }
    });
    var rafRail = 0;
    rail.addEventListener("scroll", function () {
      if (!rafRail) rafRail = requestAnimationFrame(function () { rafRail = 0; majRail(); });
    }, { passive: true });
    window.addEventListener("resize", majRail);
    majRail();

    // Glisser à la souris (sans le « fantôme » de glisser-déposer des images)
    var tire = null;
    rail.addEventListener("dragstart", function (e) { e.preventDefault(); });
    rail.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      tire = { x: e.clientX, gauche: rail.scrollLeft, bouge: false };
    });
    window.addEventListener("pointermove", function (e) {
      if (!tire) return;
      var dx = e.clientX - tire.x;
      if (!tire.bouge && Math.abs(dx) > 6) { tire.bouge = true; rail.classList.add("est-tire"); }
      if (tire.bouge) rail.scrollLeft = tire.gauche - dx;
    });
    var finTire = function () {
      if (!tire) return;
      var bouge = tire.bouge;
      tire = null;
      if (bouge) {
        rail.classList.remove("est-tire");
        allerA(indexCourant());
      }
    };
    window.addEventListener("pointerup", finTire);
    window.addEventListener("pointercancel", finTire);
  }

  /* =======================================================================
     12. Essences : les échantillons
     ======================================================================= */
  var FICHES = [
    { cle: "chene", nom: "Chêne", latin: "Quercus robur, Q. petraea", teinte: "Blond doré à brun clair", densite: "≈ 700 kg/m³", durete: 4, usage: "Intérieur et extérieur", ideal: "Escaliers, parquets, cuisines, mobilier" },
    { cle: "noyer", nom: "Noyer", latin: "Juglans regia", teinte: "Brun chocolat, veinage nuancé", densite: "≈ 650 kg/m³", durete: 3, usage: "Intérieur", ideal: "Mobilier, plateaux, bibliothèques" },
    { cle: "frene", nom: "Frêne", latin: "Fraxinus excelsior", teinte: "Blanc crème, fil droit", densite: "≈ 700 kg/m³", durete: 4, usage: "Intérieur", ideal: "Escaliers, mobilier, pièces cintrées" },
    { cle: "douglas", nom: "Douglas", latin: "Pseudotsuga menziesii", teinte: "Rosé à rouge orangé, cernes francs", densite: "≈ 530 kg/m³", durete: 2, usage: "Extérieur (bois de cœur)", ideal: "Bardages, terrasses, charpente" },
    { cle: "meleze", nom: "Mélèze", latin: "Larix decidua", teinte: "Rouge-brun, cernes serrés", densite: "≈ 600 kg/m³", durete: 3, usage: "Extérieur", ideal: "Bardages, terrasses, menuiseries extérieures" },
    { cle: "ipe", nom: "Ipé", latin: "Handroanthus spp.", teinte: "Brun olive à brun rouge", densite: "≈ 1 050 kg/m³", durete: 5, usage: "Extérieur, très durable", ideal: "Terrasses, bords de piscine" }
  ];

  var boite = $("#echantillons");
  if (boite) {
    FICHES.forEach(function (f, i) {
      var div = document.createElement("div");
      div.className = "echantillon" + (i === 0 ? " est-actif" : "");
      div.setAttribute("data-essence", f.cle);
      var barres = "";
      for (var k = 1; k <= 5; k++) barres += '<i class="' + (k <= f.durete ? "on" : "") + '"></i>';
      div.innerHTML =
        '<button type="button" class="echantillon__bouton" aria-expanded="' + (i === 0) + '" aria-controls="fiche-' + f.cle + '">' +
          '<span class="echantillon__vertical">' + f.nom + "</span></button>" +
        '<div class="fiche" id="fiche-' + f.cle + '">' +
          '<p class="fiche__nom">' + f.nom + '<span class="fiche__latin">' + f.latin + "</span></p>" +
          "<dl>" +
            "<div><dt>Teinte</dt><dd>" + f.teinte + "</dd></div>" +
            "<div><dt>Densité</dt><dd>" + f.densite + "</dd></div>" +
            '<div><dt>Dureté</dt><dd><span class="durete" role="img" aria-label="' + f.durete + ' sur 5">' + barres + "</span></dd></div>" +
            "<div><dt>Usage</dt><dd>" + f.usage + "</dd></div>" +
            "<div><dt>Idéal pour</dt><dd>" + f.ideal + "</dd></div>" +
          "</dl></div>";
      boite.appendChild(div);
    });
    var echs = $$(".echantillon", boite);
    var active = function (div) {
      echs.forEach(function (d) {
        var on = d === div;
        d.classList.toggle("est-actif", on);
        $(".echantillon__bouton", d).setAttribute("aria-expanded", on ? "true" : "false");
      });
    };
    echs.forEach(function (d) {
      $(".echantillon__bouton", d).addEventListener("click", function () { active(d); });
      if (survol) d.addEventListener("mouseenter", function () { active(d); });
    });
    bientotVisible(boite, function () {
      echs.forEach(function (d, i) {
        apres(i * 40, function () {
          auRepos(function () {
            d.style.backgroundImage = "url(" + Bois.url(d.getAttribute("data-essence"), 640, 620, { graine: 50 + i, sens: "v" }) + ")";
          });
        });
      });
    }, "700px 0px");
  }

  /* =======================================================================
     13. Votre projet : formulaire en 4 étapes + bon d'atelier
     ======================================================================= */
  (function () {
    var form = $("#devis");
    if (!form) return;
    var volets = $$(".volet", form), puces = $$(".devis__etapes li", form);
    var btnPrec = $("#devisPrec"), btnSuiv = $("#devisSuiv"), btnEnvoi = $("#devisEnvoi");
    var etat = $("#devisEtat"), bon = $(".bon"), echBon = $("#bonEchantillon");
    var courant = 0;

    var d = new Date();
    var num = $("#bonNumero");
    if (num) num.textContent = "N° " + d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);

    var CLES_ESSENCE = { "Chêne": "chene", "Noyer": "noyer", "Frêne": "frene", "Douglas": "douglas", "Mélèze": "meleze", "Ipé": "ipe" };

    function valeur(nom) {
      var champ = form.elements[nom];
      if (!champ) return "";
      if (champ.length !== undefined && !champ.tagName) {
        for (var i = 0; i < champ.length; i++) if (champ[i].checked) return champ[i].value;
        return "";
      }
      if (champ.type === "checkbox") return champ.checked ? "oui" : "";
      return (champ.value || "").trim();
    }

    function majBon(e) {
      $$("[data-bon]", bon).forEach(function (dd) {
        var v = valeur(dd.getAttribute("data-bon")) || "—";
        if (dd.textContent !== v) {
          dd.textContent = v;
          if (e && v !== "—") { dd.classList.remove("est-rempli"); void dd.offsetWidth; dd.classList.add("est-rempli"); }
        }
      });
      var cle = CLES_ESSENCE[valeur("essence")];
      if (echBon) echBon.style.backgroundImage = cle && Bois ? "url(" + Bois.url(cle, 460, 60, { graine: 88 }) + ")" : "";
    }
    form.addEventListener("input", majBon);
    form.addEventListener("change", majBon);

    function valideVolet(i, signaler) {
      var ok = true, premier = null;
      var noms = {};
      $$("input, textarea", volets[i]).forEach(function (c) {
        if (c.name === "_honey") return;
        if (c.type === "radio") { if (c.required) noms[c.name] = true; return; }
        var bon2 = c.checkValidity();
        if (c.type === "checkbox") {
          c.closest(".accord").classList.toggle("est-invalide", signaler && !bon2);
        } else {
          c.classList.toggle("est-invalide", signaler && !bon2);
        }
        if (!bon2) { ok = false; premier = premier || c; }
      });
      Object.keys(noms).forEach(function (n) {
        if (!valeur(n)) { ok = false; premier = premier || form.elements[n][0]; }
      });
      if (!ok && signaler && premier) premier.focus();
      return ok;
    }

    function message(i) {
      return ["Choisissez le type d'ouvrage.", "Choisissez une essence (ou « Conseillez-moi »).",
        "Indiquez un délai et la commune du chantier.", "Vérifiez vos coordonnées et cochez la case d'accord."][i];
    }

    function montre(i, focus) {
      courant = i;
      volets.forEach(function (v, k) { v.hidden = k !== i; });
      puces.forEach(function (p, k) {
        p.classList.toggle("est-actif", k === i);
        p.classList.toggle("est-fait", k < i);
        if (k === i) p.setAttribute("aria-current", "step"); else p.removeAttribute("aria-current");
      });
      btnPrec.hidden = i === 0;
      btnSuiv.hidden = i === volets.length - 1;
      btnEnvoi.hidden = i !== volets.length - 1;
      etat.textContent = "";
      etat.className = "devis__etat";
      if (focus) {
        var l = $("legend", volets[i]);
        if (l) { l.setAttribute("tabindex", "-1"); l.focus({ preventScroll: true }); }
      }
    }

    btnSuiv.addEventListener("click", function () {
      if (!valideVolet(courant, true)) {
        etat.textContent = message(courant);
        etat.className = "devis__etat est-ko";
        return;
      }
      montre(courant + 1, true);
    });
    btnPrec.addEventListener("click", function () { montre(courant - 1, true); });

    // Un clic (souris ou doigt) sur un ouvrage passe à l'étape suivante.
    // Au clavier (flèches, espace : detail = 0), on laisse parcourir les choix.
    volets[0].addEventListener("click", function (e) {
      if (!e.detail || !e.target.closest("label")) return;
      apres(260, function () { if (courant === 0 && valeur("ouvrage")) montre(1, true); });
    });

    function demande() {
      var lignes = [
        ["Ouvrage", valeur("ouvrage")],
        ["Essence", valeur("essence")],
        ["Dimensions", valeur("dimensions")],
        ["Délai", valeur("delai")],
        ["Commune", valeur("commune")],
        ["Nom", valeur("nom")],
        ["Téléphone", valeur("telephone")],
        ["E-mail", valeur("email")],
        ["Message", valeur("message")]
      ].filter(function (l) { return l[1] !== ""; });
      return { sujet: "Demande de devis — " + valeur("ouvrage") + " — " + valeur("nom"), lignes: lignes };
    }

    function lienMessagerie(dm) {
      var corps = ["Demande de devis envoyée depuis le site :", ""].concat(
        dm.lignes.map(function (l) { return l[0] + " : " + l[1]; })).join("\n");
      return "mailto:" + (C.email || "") + "?subject=" + encodeURIComponent(dm.sujet) + "&body=" + encodeURIComponent(corps);
    }

    var merci = $("#merci"), secours = $("#secours");
    function reussite(demo) {
      form.hidden = true;
      merci.hidden = false;
      $("#merciDemo").hidden = !demo;
      bon.classList.add("est-recu");
      merci.focus({ preventScroll: true });
      merci.scrollIntoView({ block: "center", behavior: reduit ? "auto" : "smooth" });
    }
    function echec(dm) {
      btnEnvoi.disabled = false;
      etat.textContent = "";
      $("#secoursMail").setAttribute("href", lienMessagerie(dm));
      secours.hidden = false;
    }

    function envoie() {
      var dm = demande(), conf = C.devis || {};
      secours.hidden = true;

      // Pas encore d'adresse de réception : démonstration, rien n'est envoyé.
      if (!conf.destinataire) { reussite(true); return; }

      if (!conf.service || !window.fetch) { window.location.href = lienMessagerie(dm); return; }

      var donnees = { _subject: dm.sujet, _template: "table", _captcha: "false", email: valeur("email"), name: valeur("nom") };
      dm.lignes.forEach(function (l) { donnees[l[0]] = l[1]; });

      btnEnvoi.disabled = true;
      etat.textContent = "Envoi en cours…";
      etat.className = "devis__etat";
      var controle = window.AbortController ? new AbortController() : null;
      var minuteur = apres(15000, function () { if (controle) controle.abort(); });

      fetch(conf.service + encodeURIComponent(conf.destinataire), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(donnees),
        signal: controle ? controle.signal : undefined
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          window.clearTimeout(minuteur);
          if (res.ok && String(res.j.success) === "true") reussite(false);
          else echec(dm);
        })
        .catch(function () { window.clearTimeout(minuteur); echec(dm); });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (courant !== volets.length - 1) { btnSuiv.click(); return; }
      var piege = $("#piege");
      if (piege && piege.value) { reussite(false); return; }
      for (var i = 0; i < volets.length; i++) {
        if (!valideVolet(i, true)) {
          if (i !== courant) { montre(i, false); valideVolet(i, true); }
          etat.textContent = message(i);
          etat.className = "devis__etat est-ko";
          return;
        }
      }
      envoie();
    });

    montre(0, false);
    majBon();
  })();

  /* =======================================================================
     14. Règle graduée
     ======================================================================= */
  var regle = $(".regle"), mesure = $(".regle__mesure");
  var regleActive = window.matchMedia("(min-width: 1180px) and (hover: hover)");
  function majRegle() {
    if (!regle || !regleActive.matches) return;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight), y = window.scrollY;
    regle.style.setProperty("--regle", ((y / max) * (window.innerHeight - 2)).toFixed(1) + "px");
    regle.classList.toggle("en-bas", y / max > 0.5);
    if (mesure) mesure.textContent = Math.round(y).toLocaleString("fr-FR") + " mm";
  }

  /* =======================================================================
     15. Boucle de défilement
     ======================================================================= */
  var rafDefile = 0;
  function surDefilement() {
    rafDefile = 0;
    majEntete();
    majManifeste();
    majMethode();
    majRegle();
  }
  window.addEventListener("scroll", function () { if (!rafDefile) rafDefile = requestAnimationFrame(surDefilement); }, { passive: true });
  window.addEventListener("resize", function () { if (!rafDefile) rafDefile = requestAnimationFrame(surDefilement); });
  surDefilement();

  // Si la taille du panneau change beaucoup (rotation d'écran), on regrave.
  var largeurPanneau = panneauBois ? panneauBois.clientWidth : 0;
  window.addEventListener("resize", function () {
    if (!panneauBois) return;
    var l = panneauBois.clientWidth;
    if (Math.abs(l - largeurPanneau) > 60) { largeurPanneau = l; graver(essencePanneau); }
  });
})();
