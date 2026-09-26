/* =========================================================================
   WEBLY — Hydratation du contenu éditable
   -------------------------------------------------------------------------
   Lit content/site.json et remplace le contenu correspondant dans la page.
   Le HTML garde des valeurs par défaut complètes : si le fichier est absent,
   illisible, ou que le réseau échoue, la page reste entière — bon pour le
   référencement et pour les navigateurs sans JavaScript.

   Rien n'est inventé ici : un champ vide laisse la valeur du HTML en place,
   et une liste vide masque toute sa section.

   Conventions dans index.html :
     data-cms="chemin.vers.la.valeur"   -> remplace le texte de l'élément
     data-cms-optional                  -> ...et le masque si le champ est vide
     data-cms-image="chemin.vers.image" -> remplace le src de l'image
     data-cms-list="prestations.liste"   -> conteneur reconstruit par un rendu dédié

   Prévisualisation : si sessionStorage contient "webly:preview", son contenu
   est utilisé à la place du fichier. Voir admin/demo.html.
   ========================================================================= */
(function () {
  "use strict";

  var SOURCE = "content/site.json";

  /* ---------- Utilitaires ---------- */

  function get(data, chemin) {
    var parties = String(chemin).split(".");
    var cur = data;
    for (var i = 0; i < parties.length; i++) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[parties[i]];
    }
    return cur;
  }

  function rempli(v) {
    return v !== undefined && v !== null && String(v).trim() !== "";
  }

  // Tout passe par textContent : aucun HTML venu du CMS n'est interprété.
  function el(balise, classe, texte) {
    var n = document.createElement(balise);
    if (classe) n.className = classe;
    if (texte !== null && texte !== undefined) n.textContent = texte;
    return n;
  }

  // Masquer ne suffit pas : le contenu d'exemple resterait lisible dans le
  // code source d'un site client. On vide aussi le conteneur.
  function videEtMasque(cible, noeud) {
    if (cible) cible.textContent = "";
    masque(noeud);
  }

  function masque(noeud) {
    if (!noeud) return;
    noeud.hidden = true;
    if (!noeud.id) return;
    document.querySelectorAll('a[href="#' + noeud.id + '"]').forEach(function (a) {
      var li = a.closest("li");
      (li || a).hidden = true;
    });
  }

  function sectionDe(noeud) { return noeud ? noeud.closest("section") : null; }

  function conteneur(cle) { return document.querySelector('[data-cms-list="' + cle + '"]'); }

  /* ---------- Textes et images ---------- */

  function hydrateTextes(data) {
    document.querySelectorAll("[data-cms]").forEach(function (noeud) {
      var valeur = get(data, noeud.getAttribute("data-cms"));
      var facultatif = noeud.hasAttribute("data-cms-optional");
      if (rempli(valeur)) {
        noeud.textContent = valeur;
        noeud.hidden = false;
      } else if (facultatif) {
        noeud.hidden = true;
      }
    });
  }

  function hydrateImages(data) {
    document.querySelectorAll("[data-cms-image]").forEach(function (img) {
      var src = get(data, img.getAttribute("data-cms-image"));
      if (!rempli(src)) return;
      // Le chemin du CMS fait autorité : on désactive la bascule
      // automatique .svg -> .jpg de main.js pour cette image.
      img.removeAttribute("data-photo");
      img.setAttribute("src", src);
    });
  }

  /* ---------- Rendus dédiés ---------- */

  function rendPrestations(liste) {
    var cible = conteneur("prestations.liste");
    if (!cible) return;
    if (!Array.isArray(liste) || !liste.length) { videEtMasque(cible, document.getElementById("prestations")); return; }

    cible.textContent = "";
    liste.forEach(function (m, i) {
      var carte = el("article", "apparait est-visible metier");
      carte.setAttribute("data-tilt", "");
      var fond = el("div", "metier__profondeur");
      fond.appendChild(el("span", "metier__num", String(i + 1).padStart(2, "0")));
      fond.appendChild(el("h3", null, m.titre || ""));
      if (rempli(m.texte)) fond.appendChild(el("p", null, m.texte));
      carte.appendChild(fond);
      cible.appendChild(carte);
    });
  }

  function rendChantiers(liste) {
    var cible = conteneur("chantiers.ouvrages");
    if (!cible) return;
    if (!Array.isArray(liste) || !liste.length) { videEtMasque(cible, document.getElementById("chantiers")); return; }

    cible.textContent = "";
    var categories = {};
    liste.forEach(function (o, i) {
      var bouton = el("button", "oeuvre" + (i === 0 ? " oeuvre--grande" : ""));
      bouton.type = "button";
      bouton.setAttribute("data-categorie", o.categorie || "tout");
      bouton.setAttribute("data-index", String(i));
      if (rempli(o.categorie)) categories[o.categorie] = true;

      var img = document.createElement("img");
      img.setAttribute("src", o.image || "");
      img.setAttribute("alt", rempli(o.alt) ? o.alt : (o.titre || ""));
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      bouton.appendChild(img);

      var voile = el("span", "oeuvre__voile");
      voile.appendChild(el("span", "oeuvre__titre", o.titre || ""));
      if (rempli(o.meta)) voile.appendChild(el("span", "oeuvre__meta", o.meta));
      bouton.appendChild(voile);

      cible.appendChild(bouton);
    });

    // Un filtre sans aucune réalisation ne sert à rien : on le retire.
    document.querySelectorAll(".filtre").forEach(function (f) {
      var cle = f.getAttribute("data-filtre");
      f.hidden = cle !== "tout" && !categories[cle];
    });
  }

  function rendMatieres(liste) {
    var cible = conteneur("materiaux.liste");
    if (!cible) return;
    if (!Array.isArray(liste) || !liste.length) { videEtMasque(cible, document.getElementById("materiaux")); return; }

    cible.textContent = "";
    liste.forEach(function (e, i) {
      var bouton = el("button", "matiere");
      bouton.type = "button";
      bouton.setAttribute("aria-pressed", String(i === 0));
      bouton.setAttribute("data-texture", e.texture || "");
      bouton.setAttribute("data-entretien", e.entretien || "");
      bouton.setAttribute("data-isolation", e.isolation || "");
      bouton.setAttribute("data-duree", e.duree || "");
      bouton.setAttribute("data-budget", e.budget || "");

      var pastille = el("span", "matiere__pastille");
      pastille.style.background = e.couleur || "#b9793f";
      bouton.appendChild(pastille);
      bouton.appendChild(document.createTextNode(e.nom || ""));
      cible.appendChild(bouton);
    });
  }

  // Les dispositifs d'aide ont la même forme que les prestations, mais leur
  // « numéro » est un nom court (MaPrimeRénov', CEE...) et non un rang.
  function rendDispositifs(liste) {
    var cible = conteneur("aides.dispositifs");
    if (!cible) return;
    if (!Array.isArray(liste) || !liste.length) { videEtMasque(cible, document.getElementById("aides")); return; }

    cible.textContent = "";
    liste.forEach(function (d) {
      var carte = el("article", "metier");
      carte.setAttribute("data-tilt", "");
      var fond = el("div", "metier__profondeur");
      fond.appendChild(el("span", "metier__num", d.sigle || ""));
      fond.appendChild(el("h3", null, d.titre || ""));
      if (rempli(d.texte)) fond.appendChild(el("p", null, d.texte));
      carte.appendChild(fond);
      cible.appendChild(carte);
    });
  }

  function rendEtapes(liste) {
    var cible = conteneur("processus.etapes");
    if (!cible) return;
    if (!Array.isArray(liste) || !liste.length) { videEtMasque(cible, sectionDe(cible)); return; }

    cible.textContent = "";
    liste.forEach(function (e, i) {
      var etape = el("div", "etape");
      etape.appendChild(el("span", "etape__num", "Étape " + String(i + 1).padStart(2, "0")));
      etape.appendChild(el("h3", null, e.titre || ""));
      if (rempli(e.texte)) etape.appendChild(el("p", null, e.texte));
      cible.appendChild(etape);
    });
  }

  function rendGaranties(liste) {
    var cible = conteneur("devis.garanties");
    if (!cible) return;
    if (!Array.isArray(liste) || !liste.length) { cible.textContent = ""; cible.hidden = true; return; }

    cible.textContent = "";
    liste.forEach(function (g, i) {
      var li = document.createElement("li");
      li.appendChild(el("span", null, String(i + 1).padStart(2, "0")));
      var corps = document.createElement("div");
      corps.appendChild(el("strong", null, g.titre || ""));
      if (rempli(g.texte)) corps.appendChild(document.createTextNode(" " + g.texte));
      li.appendChild(corps);
      cible.appendChild(li);
    });
  }

  function rendAvis(liste) {
    var cible = conteneur("avis");
    if (!cible) return;
    // Pas d'avis renseigné = section entièrement masquée. Jamais d'avis
    // inventé, jamais d'emplacement réservé sur un site en ligne.
    if (!Array.isArray(liste) || !liste.length) { videEtMasque(cible, document.getElementById("avis")); return; }

    cible.textContent = "";
    liste.forEach(function (a) {
      var carte = el("article", "avis-carte");
      var note = parseInt(a.note, 10);
      if (!isNaN(note) && note > 0) {
        note = Math.min(note, 5);
        var etoiles = el("div", "avis-carte__etoiles", "★★★★★".slice(0, note));
        etoiles.setAttribute("aria-label", "Note : " + note + " sur 5");
        carte.appendChild(etoiles);
      }
      if (rempli(a.texte)) carte.appendChild(el("p", "avis-carte__texte", "« " + a.texte + " »"));
      var signature = [a.auteur, a.source].filter(rempli).join(" — ");
      if (signature) carte.appendChild(el("p", "avis-carte__nom", signature));
      cible.appendChild(carte);
    });
  }

  function rendHoraires(liste) {
    var table = conteneur("infos.horaires");
    if (!table || !Array.isArray(liste) || !liste.length) return;
    var corps = table.tBodies[0] || table;
    corps.textContent = "";
    liste.forEach(function (h) {
      var tr = document.createElement("tr");
      tr.appendChild(el("td", null, h.jours || ""));
      tr.appendChild(el("td", null, h.horaire || ""));
      corps.appendChild(tr);
    });
  }

  function rendZones(liste) {
    var cible = conteneur("infos.zones");
    if (!cible) return;
    if (!Array.isArray(liste) || !liste.length) { cible.textContent = ""; cible.hidden = true; return; }
    cible.textContent = "";
    liste.forEach(function (z) { cible.appendChild(el("span", null, String(z))); });
  }

  function rendReseaux(liste) {
    var cible = conteneur("pied.reseaux");
    if (!cible) return;
    if (!Array.isArray(liste) || !liste.length) { cible.textContent = ""; cible.hidden = true; return; }
    cible.textContent = "";
    liste.forEach(function (r) {
      var li = document.createElement("li");
      var a = el("a", null, r.nom || "");
      a.setAttribute("href", rempli(r.url) ? r.url : "#");
      if (rempli(r.url)) { a.setAttribute("rel", "noopener"); a.setAttribute("target", "_blank"); }
      li.appendChild(a);
      cible.appendChild(li);
    });
  }

  /* ---------- Orchestration ---------- */

  function hydrate(data) {
    window.WEBLY_CONTENT = data;
    hydrateTextes(data);
    hydrateImages(data);
    rendPrestations(get(data, "prestations.liste"));
    rendChantiers(get(data, "chantiers.ouvrages"));
    rendMatieres(get(data, "materiaux.liste"));
    rendDispositifs(get(data, "aides.dispositifs"));
    rendEtapes(get(data, "processus.etapes"));
    rendGaranties(get(data, "devis.garanties"));
    rendAvis(data.avis);
    rendHoraires(get(data, "infos.horaires"));
    rendZones(get(data, "infos.zones"));
    rendReseaux(get(data, "pied.reseaux"));
    document.body.setAttribute("data-content", "loaded");
  }

  function contenuDeParcours() {
    try {
      var brut = window.sessionStorage.getItem("webly:preview");
      return brut ? JSON.parse(brut) : null;
    } catch (e) {
      // Navigation privée, stockage désactivé : on ignore sans casser la page.
      return null;
    }
  }

  window.WEBLY_CONTENT = null;

  if (!window.Promise || !window.fetch) {
    window.WEBLY_CONTENT_READY = null;
    return;
  }

  var apercu = contenuDeParcours();
  if (apercu) {
    try {
      hydrate(apercu);
      document.body.setAttribute("data-content", "preview");
    } catch (e) {
      console.warn("[Webly] Prévisualisation ignorée :", e);
    }
    window.WEBLY_CONTENT_READY = Promise.resolve(apercu);
    return;
  }

  window.WEBLY_CONTENT_READY = fetch(SOURCE, { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (data) {
      try { hydrate(data); }
      catch (e) { console.warn("[Webly] Hydratation partielle :", e); }
      return data;
    })
    .catch(function (e) {
      // Cas normal en ouverture directe du fichier (file://) : le HTML livré
      // reste affiché tel quel, le site reste lisible.
      console.warn("[Webly] content/site.json non chargé — contenu par défaut du HTML :", e);
      return null;
    });
})();
