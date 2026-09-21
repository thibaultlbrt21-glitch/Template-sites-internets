(function () {
  "use strict";

  /* =========================================================
     CONFIG — tout se règle ici (ou demandez à Claude)
     ========================================================= */
  var SITE_CONFIG = {
    // Email qui reçoit les demandes de réservation.
    reservationEmail: "reservation@votre-restaurant-a-renseigner.fr",

    // Passez à true une fois vos vraies photos déposées dans
    // assets/images/ (hero.jpg, plat-1.jpg, salle.jpg...).
    // Voir assets/images/README.md pour la liste exacte des noms.
    // Si une photo manque, le visuel d'origine reprend sa place.
    usePhotos: false,
  };

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Bascule photos réelles ---------- */
  if (SITE_CONFIG.usePhotos) {
    document.querySelectorAll("img[data-photo]").forEach(function (img) {
      var original = img.getAttribute("src");
      img.addEventListener("error", function handler() {
        img.removeEventListener("error", handler);
        img.src = original;
      });
      img.src = img.getAttribute("data-photo");
    });
  }

  /* ---------- Preloader + entrée du hero ---------- */
  var preloader = document.getElementById("preloader");
  var hero = document.querySelector(".hero");

  function startHero() {
    if (hero) hero.classList.add("is-ready");
    document.body.classList.add("is-loaded");
  }

  if (preloader) {
    var dismiss = function () {
      preloader.classList.add("is-done");
      startHero();
    };
    if (reduced) {
      dismiss();
    } else {
      window.setTimeout(dismiss, 1250);
      // Filet de sécurité : jamais de rideau bloqué.
      window.setTimeout(function () { preloader.classList.add("is-done"); startHero(); }, 3500);
    }
  } else {
    startHero();
  }

  /* ---------- Header ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-solid", window.scrollY > 60);
      // Le CTA flottant mobile n'apparaît qu'une fois le hero dépassé.
      var heroHeight = hero ? hero.offsetHeight : window.innerHeight;
      document.body.classList.toggle("is-past-hero", window.scrollY > heroHeight * 0.75);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Menu mobile ---------- */
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  var mobileClose = document.getElementById("mobileMenuClose");

  function closeMobile() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  function openMobile() {
    mobileMenu.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    var first = mobileMenu.querySelector("a");
    if (first) first.focus();
  }
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      if (mobileMenu.classList.contains("is-open")) closeMobile(); else openMobile();
    });
    if (mobileClose) mobileClose.addEventListener("click", closeMobile);
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMobile);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) { closeMobile(); navToggle.focus(); }
    });
  }

  /* ---------- Révélations au scroll (+ filet de sécurité) ---------- */
  var revealEls = document.querySelectorAll(".reveal, .media--wipe, .line-mask[data-observe]");
  if (revealEls.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
      revealEls.forEach(function (el) { io.observe(el); });

      // Si le défilement n'est jamais simulé (capture auto, robot
      // d'indexation, erreur JS ailleurs), on révèle quand même.
      window.setTimeout(function () {
        revealEls.forEach(function (el) { el.classList.add("is-visible"); });
        io.disconnect();
      }, 2600);
    }
  }

  /* ---------- Parallaxe ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll(".media--parallax"));
  if (parallaxEls.length && !reduced) {
    var ticking = false;
    var applyParallax = function () {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        var progress = (rect.top + rect.height / 2 - vh / 2) / vh; // -1 .. 1
        var img = el.querySelector("img");
        if (img) img.style.transform = "translate3d(0," + (progress * -26).toFixed(2) + "px,0) scale(1.12)";
      });
      ticking = false;
    };
    var requestParallax = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(applyParallax); }
    };
    applyParallax();
    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", requestParallax);
  }

  /* ---------- Aperçu photo au survol de la carte ---------- */
  var preview = document.getElementById("menuPreview");
  var menuRows = document.querySelectorAll(".menu-row[data-preview]");
  if (preview && menuRows.length && finePointer && !reduced) {
    var previewImg = preview.querySelector("img");
    var moveHandler = function (e) {
      preview.style.left = e.clientX + "px";
      preview.style.top = e.clientY + "px";
    };
    menuRows.forEach(function (row) {
      row.addEventListener("mouseenter", function () {
        var src = row.getAttribute("data-preview");
        if (previewImg.getAttribute("src") !== src) previewImg.setAttribute("src", src);
        preview.classList.add("is-active");
      });
      row.addEventListener("mouseleave", function () { preview.classList.remove("is-active"); });
    });
    document.addEventListener("mousemove", moveHandler, { passive: true });
  }

  /* ---------- Compteurs ---------- */
  var figures = document.querySelectorAll("[data-count]");
  if (figures.length) {
    var runCount = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduced) { el.textContent = target + suffix; return; }
      var start = null;
      var duration = 1400;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) {
      figures.forEach(runCount);
    } else {
      var countIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { runCount(entry.target); countIO.unobserve(entry.target); }
        });
      }, { threshold: 0.4 });
      figures.forEach(function (el) { countIO.observe(el); });
      window.setTimeout(function () { figures.forEach(function (el) { if (!el.textContent.trim()) runCount(el); }); }, 2600);
    }
  }

  /* =========================================================
     MODALE DE RÉSERVATION
     Formulaire réel, sans backend fabriqué : validation puis
     ouverture du client mail avec la demande pré-remplie.
     Pour brancher un vrai service (Formspree, TheFork,
     Zenchef...), remplacez submitReservation() ci-dessous.
     ========================================================= */
  var modal = document.getElementById("reservationModal");
  var openers = document.querySelectorAll("[data-open-reservation]");
  var lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var firstField = modal.querySelector("input, select, button");
    if (firstField) firstField.focus();
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  if (modal && openers.length) {
    openers.forEach(function (btn) {
      btn.addEventListener("click", function (e) { e.preventDefault(); openModal(); });
    });
    modal.querySelectorAll("[data-close-modal]").forEach(function (btn) {
      btn.addEventListener("click", closeModal);
    });
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key === "Tab") {
        var focusables = modal.querySelectorAll("input, select, textarea, button, a[href]");
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Formulaire ---------- */
  var form = document.getElementById("reservationForm");
  if (form) {
    var status = document.getElementById("formStatus");
    var dateInput = document.getElementById("resDate");

    if (dateInput) {
      var now = new Date();
      dateInput.setAttribute("min", now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0"));
    }

    form.querySelectorAll("input, select, textarea").forEach(function (f) {
      f.addEventListener("blur", function () { f.setAttribute("data-touched", "true"); });
    });

    function fieldError(f) {
      if (f.validity.valueMissing) return "Champ obligatoire.";
      if (f.validity.typeMismatch && f.type === "email") return "Adresse email invalide.";
      if (f.validity.patternMismatch && f.type === "tel") return "Numéro invalide.";
      if (f.validity.rangeUnderflow || f.validity.rangeOverflow) return "Valeur hors limites.";
      return "";
    }

    form.querySelectorAll("input, select").forEach(function (f) {
      f.addEventListener("input", function () {
        if (f.getAttribute("data-touched") !== "true") return;
        var err = document.getElementById(f.id + "Error");
        if (err) err.textContent = fieldError(f);
      });
    });

    function validate() {
      var ok = true;
      form.querySelectorAll("input[required], select[required]").forEach(function (f) {
        f.setAttribute("data-touched", "true");
        var err = document.getElementById(f.id + "Error");
        var msg = fieldError(f);
        if (err) err.textContent = msg;
        if (msg) ok = false;
      });
      return ok;
    }

    function submitReservation(data) {
      var subject = "Demande de réservation — " + data.date + " à " + data.time + " (" + data.guests + " pers.)";
      var body = [
        "Nouvelle demande de réservation depuis le site :",
        "",
        "Nom : " + data.name,
        "Email : " + data.email,
        "Téléphone : " + data.phone,
        "Date : " + data.date,
        "Heure : " + data.time,
        "Couverts : " + data.guests,
        data.message ? ("Message : " + data.message) : null
      ].filter(Boolean).join("\n");

      window.location.href = "mailto:" + encodeURIComponent(SITE_CONFIG.reservationEmail) +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        status.textContent = "Merci de corriger les champs indiqués.";
        status.className = "form-status is-error";
        var firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      submitReservation({
        name: document.getElementById("resName").value.trim(),
        email: document.getElementById("resEmail").value.trim(),
        phone: document.getElementById("resPhone").value.trim(),
        date: dateInput.value,
        time: document.getElementById("resTime").value,
        guests: document.getElementById("resGuests").value,
        message: document.getElementById("resMessage").value.trim()
      });
      status.textContent = "Votre client mail s'ouvre avec la demande pré-remplie.";
      status.className = "form-status is-success";
    });
  }

  /* ---------- Année ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
