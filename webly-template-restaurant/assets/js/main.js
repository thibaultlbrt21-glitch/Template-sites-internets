(function () {
  "use strict";

  /* =========================================================
     CONFIG — à modifier ici (ou demandez à Claude de le faire)
     ========================================================= */
  var SITE_CONFIG = {
    // Email qui recevra les demandes de réservation (voir formulaire
    // plus bas). Remplacez par la vraie adresse du restaurant.
    reservationEmail: "reservation@votre-restaurant-a-renseigner.fr",
  };

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: compact on scroll ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  var mobileMenuClose = document.getElementById("mobileMenuClose");

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    var firstLink = mobileMenu.querySelector("a");
    if (firstLink) firstLink.focus();
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.contains("is-open");
      if (isOpen) closeMobileMenu(); else openMobileMenu();
    });
    if (mobileMenuClose) mobileMenuClose.addEventListener("click", closeMobileMenu);
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMobileMenu);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mobileMenu.classList.contains("is-open")) {
        closeMobileMenu();
        navToggle.focus();
      }
    });
  }

  /* ---------- Reveal on scroll (avec filet de sécurité) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach(function (el) { observer.observe(el); });

      window.setTimeout(function () {
        revealEls.forEach(function (el) { el.classList.add("is-visible"); });
        observer.disconnect();
      }, 2500);
    }
  }

  /* ---------- Menu tabs (La carte) ---------- */
  var tabs = document.querySelectorAll(".menu-tab");
  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var targetId = tab.getAttribute("data-target");
        tabs.forEach(function (t) { t.setAttribute("aria-selected", "false"); });
        tab.setAttribute("aria-selected", "true");
        document.querySelectorAll(".menu-category").forEach(function (cat) {
          cat.hidden = cat.id !== targetId;
        });
      });
    });
  }

  /* ---------- Lightbox (galerie) ---------- */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  var lightbox = document.getElementById("lightbox");

  if (galleryItems.length && lightbox) {
    var lightboxImage = lightbox.querySelector(".lightbox-image");
    var lightboxCaption = lightbox.querySelector(".lightbox-caption");
    var lightboxClose = lightbox.querySelector(".lightbox-close");
    var lightboxPrev = lightbox.querySelector(".lightbox-nav.prev");
    var lightboxNext = lightbox.querySelector(".lightbox-nav.next");
    var currentIndex = 0;
    var lastFocused = null;

    function renderSlide(index) {
      var item = galleryItems[index];
      var caption = item.getAttribute("data-caption") || "";
      var svg = item.querySelector(".placeholder-image svg");
      lightboxImage.innerHTML = svg ? svg.outerHTML : "";
      lightboxCaption.textContent = caption;
    }

    function openLightbox(index) {
      currentIndex = index;
      renderSlide(currentIndex);
      lastFocused = document.activeElement;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lightboxClose.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    function showNext(step) {
      currentIndex = (currentIndex + step + galleryItems.length) % galleryItems.length;
      renderSlide(currentIndex);
    }

    galleryItems.forEach(function (item, index) {
      item.addEventListener("click", function () { openLightbox(index); });
    });

    lightboxClose.addEventListener("click", closeLightbox);
    lightboxPrev.addEventListener("click", function () { showNext(-1); });
    lightboxNext.addEventListener("click", function () { showNext(1); });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (event) {
      if (!lightbox.classList.contains("is-open")) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowRight") showNext(1);
      if (event.key === "ArrowLeft") showNext(-1);
      if (event.key === "Tab") {
        var focusable = lightbox.querySelectorAll("button");
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* =========================================================
     RÉSERVATION — formulaire réel, sans backend fabriqué.
     Fonctionnement honnête et fonctionnel dès la livraison :
     valide les champs puis ouvre le client mail de la personne
     avec un message pré-rempli à destination du restaurant.

     Pour brancher un vrai service de stockage/notification
     (recommandé si vous recevez beaucoup de demandes), deux
     options gratuites et légitimes, sans rien inventer :
       1) Formspree (https://formspree.io) : créez un compte,
          récupérez votre endpoint, et remplacez la fonction
          submitReservation() ci-dessous par un fetch() POST
          vers cet endpoint (exemple en commentaire plus bas).
       2) Un widget de réservation existant (TheFork, Zenchef...)
          si vous avez déjà un compte chez l'un de ces services :
          remplacez cette section par leur bouton/iframe officiel.
     ========================================================= */
  var reservationForm = document.getElementById("reservationForm");

  if (reservationForm) {
    var partyInput = document.getElementById("resGuests");
    var partyOutput = document.getElementById("resGuestsOutput");
    var partyMinus = document.getElementById("resGuestsMinus");
    var partyPlus = document.getElementById("resGuestsPlus");
    var formStatus = document.getElementById("resFormStatus");
    var dateInput = document.getElementById("resDate");

    // Empêche de choisir une date dans le passé.
    if (dateInput) {
      var today = new Date();
      var iso = today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");
      dateInput.setAttribute("min", iso);
    }

    function updatePartyOutput() {
      var value = parseInt(partyInput.value, 10);
      partyOutput.textContent = value + (value > 1 ? " personnes" : " personne");
    }

    if (partyInput && partyOutput) {
      updatePartyOutput();
      if (partyMinus) {
        partyMinus.addEventListener("click", function () {
          var value = Math.max(parseInt(partyInput.min, 10), parseInt(partyInput.value, 10) - 1);
          partyInput.value = value;
          updatePartyOutput();
        });
      }
      if (partyPlus) {
        partyPlus.addEventListener("click", function () {
          var value = Math.min(parseInt(partyInput.max, 10), parseInt(partyInput.value, 10) + 1);
          partyInput.value = value;
          updatePartyOutput();
        });
      }
    }

    // Marque chaque champ comme "touché" pour n'afficher les erreurs
    // qu'après une première tentative d'interaction, pas au chargement.
    reservationForm.querySelectorAll("input, select, textarea").forEach(function (field) {
      field.addEventListener("blur", function () { field.setAttribute("data-touched", "true"); });
    });

    function getFieldError(field) {
      if (field.validity.valueMissing) return "Ce champ est obligatoire.";
      if (field.validity.typeMismatch && field.type === "email") return "Adresse email invalide.";
      if (field.validity.patternMismatch && field.type === "tel") return "Numéro de téléphone invalide.";
      if (field.validity.rangeUnderflow || field.validity.rangeOverflow) return "Valeur hors limites.";
      return "";
    }

    function validateForm() {
      var valid = true;
      reservationForm.querySelectorAll("input[required], select[required]").forEach(function (field) {
        field.setAttribute("data-touched", "true");
        var errorEl = document.getElementById(field.id + "Error");
        var message = getFieldError(field);
        if (errorEl) errorEl.textContent = message;
        if (message) valid = false;
      });
      return valid;
    }

    reservationForm.querySelectorAll("input, select").forEach(function (field) {
      field.addEventListener("input", function () {
        if (field.getAttribute("data-touched") !== "true") return;
        var errorEl = document.getElementById(field.id + "Error");
        if (errorEl) errorEl.textContent = getFieldError(field);
      });
    });

    function buildReservationEmail(data) {
      var subject = "Demande de réservation — " + data.date + " à " + data.time + " (" + data.guests + " pers.)";
      var lines = [
        "Nouvelle demande de réservation depuis le site :",
        "",
        "Nom : " + data.name,
        "Email : " + data.email,
        "Téléphone : " + data.phone,
        "Date souhaitée : " + data.date,
        "Heure souhaitée : " + data.time,
        "Nombre de personnes : " + data.guests,
        data.message ? ("Message : " + data.message) : null,
      ].filter(Boolean);
      return { subject: subject, body: lines.join("\n") };
    }

    function submitReservation(data) {
      var email = buildReservationEmail(data);
      var mailto = "mailto:" + encodeURIComponent(SITE_CONFIG.reservationEmail) +
        "?subject=" + encodeURIComponent(email.subject) +
        "&body=" + encodeURIComponent(email.body);
      window.location.href = mailto;

      /* Exemple d'alternative avec Formspree (décommentez et adaptez) :
      fetch("https://formspree.io/f/VOTRE_ID_FORMSPREE", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(function (res) { if (!res.ok) throw new Error("Envoi échoué"); })
        .catch(function () {
          formStatus.textContent = "L'envoi a échoué, merci de nous appeler directement.";
          formStatus.className = "form-status is-error";
        });
      */
    }

    reservationForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!validateForm()) {
        formStatus.textContent = "Merci de corriger les champs en rouge avant d'envoyer.";
        formStatus.className = "form-status is-error";
        var firstInvalid = reservationForm.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var data = {
        name: document.getElementById("resName").value.trim(),
        email: document.getElementById("resEmail").value.trim(),
        phone: document.getElementById("resPhone").value.trim(),
        date: dateInput.value,
        time: document.getElementById("resTime").value,
        guests: partyInput.value,
        message: document.getElementById("resMessage").value.trim(),
      };

      submitReservation(data);

      formStatus.textContent = "Votre client mail va s'ouvrir avec la demande pré-remplie — il ne reste plus qu'à l'envoyer.";
      formStatus.className = "form-status is-success";
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
