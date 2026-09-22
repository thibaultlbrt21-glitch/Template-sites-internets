(function () {
  "use strict";

  /* CONFIG — à modifier ici (ou demandez à Claude) */
  var SITE_CONFIG = {
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
     RÉSERVATION — formulaire compact, réel, sans backend fabriqué.
     Valide puis ouvre le client mail avec la demande pré-remplie.
     Voir le premier template pour l'option Formspree en commentaire.
     ========================================================= */
  var reservationForm = document.getElementById("miniReservationForm");

  if (reservationForm) {
    var formStatus = document.getElementById("miniFormStatus");
    var dateInput = document.getElementById("miniDate");

    if (dateInput) {
      var today = new Date();
      var iso = today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");
      dateInput.setAttribute("min", iso);
    }

    reservationForm.querySelectorAll("input, textarea").forEach(function (field) {
      field.addEventListener("blur", function () { field.setAttribute("data-touched", "true"); });
    });

    function getFieldError(field) {
      if (field.validity.valueMissing) return "Champ obligatoire.";
      if (field.validity.typeMismatch && field.type === "email") return "Email invalide.";
      if (field.validity.rangeUnderflow || field.validity.rangeOverflow) return "Valeur hors limites.";
      return "";
    }

    function validateForm() {
      var valid = true;
      reservationForm.querySelectorAll("input[required], textarea[required]").forEach(function (field) {
        field.setAttribute("data-touched", "true");
        var errorEl = document.getElementById(field.id + "Error");
        var message = getFieldError(field);
        if (errorEl) errorEl.textContent = message;
        if (message) valid = false;
      });
      return valid;
    }

    reservationForm.querySelectorAll("input, textarea").forEach(function (field) {
      field.addEventListener("input", function () {
        if (field.getAttribute("data-touched") !== "true") return;
        var errorEl = document.getElementById(field.id + "Error");
        if (errorEl) errorEl.textContent = getFieldError(field);
      });
    });

    function submitReservation(data) {
      var subject = "Demande de réservation — " + data.date + " (" + data.guests + " pers.)";
      var lines = [
        "Nouvelle demande de réservation depuis le site :",
        "",
        "Nom : " + data.name,
        "Email : " + data.email,
        "Date souhaitée : " + data.date,
        "Nombre de personnes : " + data.guests,
        data.message ? ("Message : " + data.message) : null,
      ].filter(Boolean);
      var body = lines.join("\n");
      var mailto = "mailto:" + encodeURIComponent(SITE_CONFIG.reservationEmail) +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      window.location.href = mailto;
    }

    reservationForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!validateForm()) {
        formStatus.textContent = "Merci de corriger les champs indiqués.";
        formStatus.className = "mini-form-status is-error";
        var firstInvalid = reservationForm.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var data = {
        name: document.getElementById("miniName").value.trim(),
        email: document.getElementById("miniEmail").value.trim(),
        date: dateInput.value,
        guests: document.getElementById("miniGuests").value,
        message: document.getElementById("miniMessage").value.trim(),
      };

      submitReservation(data);

      formStatus.textContent = "Votre client mail va s'ouvrir avec la demande pré-remplie.";
      formStatus.className = "mini-form-status is-success";
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
