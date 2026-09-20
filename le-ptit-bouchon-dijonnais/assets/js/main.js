(function () {
  "use strict";

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

  /* ---------- Reveal on scroll ---------- */
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

      // Filet de sécurité : si un élément n'a jamais croisé le viewport
      // (capture plein écran automatisée, robot d'indexation qui ne
      // simule pas le défilement, erreur JS ailleurs sur la page...),
      // on le révèle quand même après un court délai pour ne jamais
      // laisser de contenu durablement invisible.
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

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
