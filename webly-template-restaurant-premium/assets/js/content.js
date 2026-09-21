/* =========================================================================
   WEBLY — Hydratation du contenu éditable
   -------------------------------------------------------------------------
   Ce fichier lit content/site.json et remplace le contenu correspondant
   dans la page. Le HTML garde des valeurs par défaut lisibles : si le
   fichier JSON est absent, illisible ou que le réseau échoue, la page
   reste complète (bon pour le référencement et pour les navigateurs
   sans JavaScript).

   Le JSON fait autorité quand il est là. Rien n'est inventé ici :
   un champ vide côté CMS laisse simplement la valeur du HTML en place,
   et une liste vide masque toute sa section.

   Conventions dans index.html :
     data-cms="chemin.vers.la.valeur"     -> remplace le texte de l'élément
     data-cms-optional                    -> ...et masque l'élément si le champ est vide
     data-cms-image="chemin.vers.image"   -> remplace le src de l'image
     data-cms-list="carte.plats"          -> conteneur reconstruit par un rendu dédié
   ========================================================================= */
(function () {
  "use strict";

  var SOURCE = "content/site.json";

  /* ---------- Utilitaires ---------- */

  function get(data, path) {
    var parts = String(path).split(".");
    var cur = data;
    for (var i = 0; i < parts.length; i++) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function isFilled(v) {
    return v !== undefined && v !== null && String(v).trim() !== "";
  }

  // Tout passe par textContent : aucun HTML venu du CMS n'est interprété.
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== null && text !== undefined) node.textContent = text;
    return node;
  }

  function setImage(img, src) {
    if (!img || !isFilled(src)) return;
    // Le chemin défini dans le CMS fait autorité : on désactive la
    // bascule automatique .svg -> .jpg de main.js pour cette image.
    img.removeAttribute("data-photo");
    img.setAttribute("src", src);
  }

  // Masque une section vide (et le lien de navigation qui y mène),
  // plutôt que d'afficher un emplacement réservé sur un site en ligne.
  function hideSection(node) {
    if (!node) return;
    node.hidden = true;
    if (!node.id) return;
    document.querySelectorAll('a[href="#' + node.id + '"]').forEach(function (a) {
      var li = a.closest("li");
      (li || a).hidden = true;
    });
  }

  function sectionOf(node) {
    return node ? node.closest("section") : null;
  }

  /* ---------- Textes et images simples ---------- */

  function hydrateText(data) {
    document.querySelectorAll("[data-cms]").forEach(function (node) {
      var value = get(data, node.getAttribute("data-cms"));
      var optional = node.hasAttribute("data-cms-optional");

      if (isFilled(value)) {
        node.textContent = value;
        node.hidden = false;
      } else if (optional) {
        // Champ facultatif vidé dans le CMS : la mention disparaît
        // au lieu de rester affichée sur le site en ligne.
        node.hidden = true;
      }
    });
  }

  function hydrateImages(data) {
    document.querySelectorAll("[data-cms-image]").forEach(function (img) {
      setImage(img, get(data, img.getAttribute("data-cms-image")));
    });
  }

  /* ---------- La carte ---------- */

  function renderCarte(plats) {
    var list = document.querySelector('[data-cms-list="carte.plats"]');
    if (!list) return;

    if (!Array.isArray(plats) || !plats.length) {
      hideSection(document.getElementById("carte"));
      return;
    }

    list.textContent = "";
    plats.forEach(function (plat, index) {
      var row = el("li", "menu-row");
      if (isFilled(plat.image)) row.setAttribute("data-preview", plat.image);

      row.appendChild(el("span", "menu-row__num", String(index + 1).padStart(2, "0")));

      var body = document.createElement("div");
      body.appendChild(el("div", "menu-row__name", plat.nom || ""));
      if (isFilled(plat.description)) {
        body.appendChild(el("p", "menu-row__desc", plat.description));
      }
      row.appendChild(body);

      row.appendChild(el("span", "menu-row__price", plat.prix || ""));
      list.appendChild(row);
    });

    // L'aperçu flottant part du premier plat.
    var previewImg = document.querySelector("#menuPreview img");
    if (previewImg && isFilled(plats[0].image)) previewImg.setAttribute("src", plats[0].image);
  }

  /* ---------- La galerie ---------- */

  function renderGalerie(items) {
    var rail = document.querySelector('[data-cms-list="galerie"]');
    if (!rail) return;

    if (!Array.isArray(items) || !items.length) {
      hideSection(document.getElementById("galerie"));
      return;
    }

    rail.textContent = "";
    items.forEach(function (item) {
      var figure = el("figure", "rail__item");
      figure.style.margin = "0";

      var media = el("div", "media");
      var img = document.createElement("img");
      img.setAttribute("src", item.image || "");
      img.setAttribute("alt", isFilled(item.alt) ? item.alt : (item.legende || ""));
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      media.appendChild(img);
      figure.appendChild(media);

      if (isFilled(item.legende)) figure.appendChild(el("figcaption", null, item.legende));
      rail.appendChild(figure);
    });
  }

  /* ---------- Les chiffres ---------- */

  function renderChiffres(chiffres) {
    var wrap = document.querySelector('[data-cms-list="chiffres"]');
    if (!wrap) return;

    if (!Array.isArray(chiffres) || !chiffres.length) {
      hideSection(sectionOf(wrap));
      return;
    }

    wrap.textContent = "";
    chiffres.forEach(function (item) {
      var figure = el("div", "figure");
      var num = el("span", "figure__num");
      var value = parseFloat(item.valeur);
      num.setAttribute("data-count", isNaN(value) ? "0" : String(value));
      num.setAttribute("data-suffix", item.suffixe || "");
      figure.appendChild(num);
      figure.appendChild(el("span", "figure__label", item.label || ""));
      wrap.appendChild(figure);
    });
  }

  /* ---------- Les avis ---------- */

  function renderAvis(avis) {
    var grid = document.querySelector('[data-cms-list="avis"]');
    if (!grid) return;

    // Pas d'avis renseigné = section entièrement masquée.
    // Jamais d'avis inventé, jamais d'emplacement réservé en ligne.
    if (!Array.isArray(avis) || !avis.length) {
      hideSection(document.getElementById("avis"));
      return;
    }

    grid.textContent = "";
    avis.forEach(function (item) {
      var card = el("article", "quote-card");

      var note = parseInt(item.note, 10);
      if (!isNaN(note) && note > 0) {
        note = Math.min(note, 5);
        var stars = el("div", "quote-card__stars", "★★★★★".slice(0, note));
        stars.setAttribute("aria-label", "Note : " + note + " sur 5");
        card.appendChild(stars);
      }

      if (isFilled(item.texte)) {
        card.appendChild(el("p", "quote-card__text", "« " + item.texte + " »"));
      }

      var signature = [item.auteur, item.source].filter(isFilled).join(" — ");
      if (signature) card.appendChild(el("p", "quote-card__name", signature));

      grid.appendChild(card);
    });
  }

  /* ---------- Les horaires ---------- */

  function renderHoraires(horaires) {
    var table = document.querySelector('[data-cms-list="infos.horaires"]');
    if (!table) return;
    if (!Array.isArray(horaires) || !horaires.length) return;

    var body = table.tBodies[0] || table;
    body.textContent = "";
    horaires.forEach(function (item) {
      var row = document.createElement("tr");
      row.appendChild(el("td", null, item.jours || ""));
      row.appendChild(el("td", null, item.horaire || ""));
      body.appendChild(row);
    });
  }

  /* ---------- Orchestration ---------- */

  function hydrate(data) {
    window.WEBLY_CONTENT = data;
    hydrateText(data);
    hydrateImages(data);
    renderCarte(get(data, "carte.plats"));
    renderGalerie(data.galerie);
    renderChiffres(data.chiffres);
    renderAvis(data.avis);
    renderHoraires(get(data, "infos.horaires"));
    document.body.setAttribute("data-content", "loaded");
  }

  window.WEBLY_CONTENT = null;

  // main.js attend cette promesse (avec un délai de sécurité) avant de
  // brancher ses animations, pour qu'elles s'appliquent au contenu final.
  if (!window.Promise || !window.fetch) {
    window.WEBLY_CONTENT_READY = null;
    return;
  }

  window.WEBLY_CONTENT_READY = fetch(SOURCE, { cache: "no-cache" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (data) {
      try {
        hydrate(data);
      } catch (error) {
        console.warn("[Webly] Hydratation partielle :", error);
      }
      return data;
    })
    .catch(function (error) {
      // Cas normal en ouverture directe du fichier (file://) : le HTML
      // livré reste affiché tel quel, le site reste lisible.
      console.warn("[Webly] content/site.json non chargé — contenu par défaut du HTML :", error);
      return null;
    });
})();
