/* ==========================================================================
   No Road Through — main.js
   Vanilla JS. No dependencies.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");

  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Nav scroll state ---------- */
  var nav = document.querySelector(".site-nav");
  var onScroll = function () {
    if (window.scrollY > 40) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute(
        "aria-label",
        open ? "סגירת תפריט" : "פתיחת תפריט"
      );
    });

    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Active section tracking ---------- */
  var sectionIds = ["premise", "factions", "practical", "rules", "register", "location"];
  var navAnchors = {};
  sectionIds.forEach(function (id) {
    var a = document.querySelector('.nav-links a[href="#' + id + '"]');
    if (a) navAnchors[id] = a;
  });

  /* A reference line a third of the way down decides the current section.
     The old IntersectionObserver used threshold 0.4, which a section can only
     reach if it is short enough to fill 40% of the observer band — so tall
     sections never fired, and whichever short one fired last kept .is-active
     forever. Measuring against a line works at any section height. */
  var sections = sectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  function updateActiveSection() {
    var line = window.innerHeight * 0.35;
    var current = null;
    sections.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) current = el.id;
    });
    Object.keys(navAnchors).forEach(function (id) {
      if (id === current) navAnchors[id].classList.add("is-active");
      else navAnchors[id].classList.remove("is-active");
    });
  }

  if (sections.length) {
    var navTicking = false;
    var onNavScroll = function () {
      if (navTicking) return;
      navTicking = true;
      window.requestAnimationFrame(function () {
        updateActiveSection();
        navTicking = false;
      });
    };
    window.addEventListener("scroll", onNavScroll, { passive: true });
    window.addEventListener("resize", onNavScroll);
    updateActiveSection();
  }

  /* ---------- Countdown to event ---------- */
  var target = new Date("2026-11-21T10:00:00+02:00").getTime();
  var cdDays = document.getElementById("cdDays");
  var cdHours = document.getElementById("cdHours");
  var cdMinutes = document.getElementById("cdMinutes");
  var cdSeconds = document.getElementById("cdSeconds");

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function updateCountdown() {
    var now = Date.now();
    var diff = target - now;

    if (diff <= 0) {
      if (cdDays) cdDays.textContent = "00";
      if (cdHours) cdHours.textContent = "00";
      if (cdMinutes) cdMinutes.textContent = "00";
      if (cdSeconds) cdSeconds.textContent = "00";
      return;
    }

    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);

    if (cdDays) cdDays.textContent = d > 99 ? String(d) : pad(d);
    if (cdHours) cdHours.textContent = pad(h);
    if (cdMinutes) cdMinutes.textContent = pad(m);
    if (cdSeconds) cdSeconds.textContent = pad(s);
  }

  if (cdDays) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  /* ---------- Location reveal ---------- */
  var locBtn = document.getElementById("locationReveal");
  var locDetails = document.getElementById("locationDetails");

  if (locBtn && locDetails) {
    locBtn.addEventListener("click", function () {
      var open = locDetails.classList.toggle("is-open");
      locBtn.setAttribute("aria-expanded", open ? "true" : "false");
      locDetails.setAttribute("aria-hidden", open ? "false" : "true");
      locBtn.textContent = open ? "הסתרת הפרטים" : "פרטי המיקום וההגעה";
    });
  }
})();
