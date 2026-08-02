/* Efectos de /propuestafotografia — parallax multicapa, revelados
   por palabra, contadores y profundidad con el cursor.
   Depende de gsap + ScrollTrigger (lib/), pero degrada sin ellos. */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var gsapOk = !!(window.gsap && window.ScrollTrigger);

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[pf:" + name + "]", e); }
  }

  /* --- Titulares que suben palabra por palabra --- */
  function initSplit() {
    $$(".pf-split").forEach(function (el) {
      if (el.dataset.split) return;
      el.dataset.split = "1";

      // Solo partimos nodos de texto: <br> y <em> se conservan intactos.
      (function partir(nodo) {
        Array.prototype.slice.call(nodo.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var partes = n.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            partes.forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              var w = document.createElement("span");
              w.className = "w";
              var i = document.createElement("i");
              i.textContent = p;
              w.appendChild(i);
              frag.appendChild(w);
            });
            nodo.replaceChild(frag, n);
          } else if (n.nodeType === 1 && n.tagName !== "BR") {
            partir(n);
          }
        });
      })(el);

      $$(".w > i", el).forEach(function (i, idx) {
        i.style.transitionDelay = (idx * 0.055) + "s";
      });

      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          obs.unobserve(e.target);
        });
      }, { threshold: 0.05, rootMargin: "0px 0px -6% 0px" });
      io.observe(el);
    });

    // Red de seguridad: nada puede quedarse invisible
    setTimeout(function () {
      $$(".pf-split:not(.is-in)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
      });
    }, 6000);
  }

  /* --- Hero: cinco fotos que rotan cada 5 s --- */
  function initSlides() {
    var slides = $$(".pf-slide");
    if (slides.length < 2) return;

    // Las diapositivas 2..5 solo se descargan cuando el hero ya pintó.
    function cargarResto() {
      $$(".pf-slide [data-srcset]").forEach(function (el) {
        el.srcset = el.getAttribute("data-srcset");
        el.removeAttribute("data-srcset");
      });
      $$(".pf-slide img[data-src]").forEach(function (img) {
        img.src = img.getAttribute("data-src");
        img.removeAttribute("data-src");
      });
    }
    if (document.readyState === "complete") setTimeout(cargarResto, 400);
    else window.addEventListener("load", function () { setTimeout(cargarResto, 400); });

    var i = 0;
    setInterval(function () {
      if (document.hidden) return;
      slides[i].classList.remove("is-on");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-on");
    }, 5000);
  }

  /* --- Hero: fondo y contenido se mueven a distinta velocidad --- */
  function initHero() {
    if (!gsapOk) return;
    var hero = $(".pf-hero");
    if (!hero) return;
    var bg = $(".pf-hero-bg", hero);
    var inner = $(".pf-hero-inner", hero);
    var base = { trigger: hero, start: "top top", end: "bottom top", scrub: 0.7 };

    if (bg) gsap.to(bg, { yPercent: 16, ease: "none", scrollTrigger: base });
    if (inner) gsap.to(inner, { yPercent: -34, opacity: 0, ease: "none", scrollTrigger: base });
  }

  /* --- Parallax dentro de cada marco de foto --- */
  function initFrames() {
    if (!gsapOk) return;
    $$(".pf-frame > img").forEach(function (img) {
      gsap.fromTo(img,
        { yPercent: -5.5 },
        {
          yPercent: 5.5, ease: "none",
          scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6 }
        });
    });
  }

  /* --- Capas de fondo lentas (cierre, número fantasma del precio) --- */
  function initCapas() {
    if (!gsapOk) return;
    $$("[data-slow]").forEach(function (el) {
      var v = parseFloat(el.getAttribute("data-slow")) || 12;
      gsap.fromTo(el,
        { yPercent: -v },
        {
          yPercent: v, ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 0.8 }
        });
    });
  }

  /* --- Contadores --- */
  function initContadores() {
    var nums = $$("[data-count]");
    if (!nums.length) return;
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        obs.unobserve(el);
        var fin = parseFloat(el.getAttribute("data-count"));
        var suf = el.getAttribute("data-suffix") || "";
        var dur = 1500, t0 = 0;
        function paso(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / dur);
          var e2 = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(fin * e2) + suf;
          if (p < 1) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
      });
    }, { threshold: 0.05 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* --- Barra de progreso --- */
  function initProgreso() {
    var bar = $(".pf-progress");
    if (!bar) return;
    var tick = false;
    function pinta() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? window.scrollY / h : 0) + ")";
      tick = false;
    }
    window.addEventListener("scroll", function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(pinta);
    }, { passive: true });
    pinta();
  }

  /* --- Botones magnéticos --- */
  function initIman() {
    if (!fino) return;
    $$("[data-magnet]").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        b.style.transform = "translate(" + (x * 0.22) + "px," + (y * 0.3) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  /* --- Foto flotante que sigue al cursor (profundidad) --- */
  function initFlotante() {
    if (reduced || !fino) return;
    var capas = $$("[data-depth]");
    if (!capas.length) return;
    window.addEventListener("pointermove", function (e) {
      var cx = e.clientX / window.innerWidth - 0.5;
      var cy = e.clientY / window.innerHeight - 0.5;
      capas.forEach(function (l) {
        var d = parseFloat(l.getAttribute("data-depth")) || 0.2;
        l.style.transform = "translate3d(" + (cx * d * -60) + "px," + (cy * d * -46) + "px,0)";
      });
    }, { passive: true });
  }

  function boot() {
    if (gsapOk) { try { gsap.registerPlugin(ScrollTrigger); } catch (_) {} }
    safe(initSplit, "split");
    safe(initSlides, "slides");
    safe(initHero, "hero");
    safe(initFrames, "frames");
    safe(initCapas, "capas");
    safe(initContadores, "contadores");
    safe(initProgreso, "progreso");
    safe(initIman, "iman");
    safe(initFlotante, "flotante");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
