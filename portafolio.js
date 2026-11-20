/* =============================================================
   PORTAFOLIO — movimientos de cada sección.
   Usa GSAP + ScrollTrigger (lib/) cuando hay; sin ellos o con
   "reducir movimiento", la página queda estática y legible.
   ============================================================= */
(function () {
  "use strict";

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = function () { return !!(window.gsap && window.ScrollTrigger); };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[portafolio:" + name + "]", e); }
  }

  /* --- Menú de categorías: resalta la sección visible --- */
  function initCats() {
    var links = $$("[data-cat]");
    var track = $(".po-cats-track");
    if (!links.length || typeof IntersectionObserver === "undefined") return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = byId[e.target.id];
        if (!a || a === current) return;
        if (current) current.classList.remove("is-active");
        a.classList.add("is-active");
        current = a;
        if (track) {
          var left = a.offsetLeft - (track.clientWidth - a.offsetWidth) / 2;
          track.scrollTo({ left: left, behavior: reduced ? "auto" : "smooth" });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("[data-po-sec]").forEach(function (s) { io.observe(s); });
  }

  /* --- 01 Hoteles: la sección se fija y el riel avanza en horizontal --- */
  function initHoteles() {
    var wrap = $("[data-po-hscroll]");
    var track = $("[data-po-track]");
    var bar = $("[data-po-progress]");
    if (!wrap || !track) return;
    if (reduced || !hasGsap() || !matchMedia("(min-width: 900px)").matches) {
      // Celular: deslizar con el dedo, y la barra sigue el avance.
      var vp = $(".po-h-viewport", wrap);
      if (vp && bar) vp.addEventListener("scroll", function () {
        var max = vp.scrollWidth - vp.clientWidth;
        bar.style.transform = "scaleX(" + Math.max(0.08, max ? vp.scrollLeft / max : 1) + ")";
      }, { passive: true });
      return;
    }
    document.documentElement.classList.add("po-motion");
    var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    gsap.to(track, {
      x: function () { return -distance(); },
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top top",
        end: function () { return "+=" + distance(); },
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: function (self) { if (bar) bar.style.transform = "scaleX(" + Math.max(0.08, self.progress) + ")"; }
      }
    });
  }

  /* --- 02 Spa: el sitio completo se recorre dentro del portátil --- */
  function initSpa() {
    var tour = $("[data-po-tour]");
    var img = $("[data-po-tour-img]");
    var screen = $("[data-po-screen]");
    if (!tour || !img || !screen || reduced || !hasGsap()) return;
    var run = function () {
      gsap.to(img, {
        y: function () { return -Math.max(0, img.offsetHeight - screen.clientHeight); },
        ease: "none",
        scrollTrigger: { trigger: tour, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true }
      });
      gsap.fromTo(".po-tour-phone", { y: 60 }, {
        y: -40, ease: "none",
        scrollTrigger: { trigger: tour, start: "top top", end: "bottom bottom", scrub: 0.6 }
      });
    };
    if (img.complete) run(); else img.addEventListener("load", function () { run(); ScrollTrigger.refresh(); }, { once: true });
  }

  /* --- 03 Marca personal: relieve 3D que sigue al cursor --- */
  function initTilt() {
    if (!finePointer || reduced) return;
    $$("[data-po-tilt]").forEach(function (card) {
      var stage = $(".po-tilt-stage", card);
      if (!stage) return;
      card.addEventListener("mousemove", function (e) {
        var r = stage.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        stage.style.transform = "rotateY(" + ((px - 0.5) * 14).toFixed(2) + "deg) rotateX(" + ((0.5 - py) * 10).toFixed(2) + "deg)";
        stage.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        stage.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      });
      card.addEventListener("mouseleave", function () { stage.style.transform = ""; });
    });
  }

  /* --- 04 Café: cada tarjeta se encoge cuando la siguiente le pasa por encima --- */
  function initStack() {
    if (reduced || !hasGsap()) return;
    var cards = $$(".po-stack-card");
    cards.forEach(function (card, i) {
      var next = cards[i + 1];
      if (!next) return;
      gsap.fromTo(card, { scale: 1, filter: "brightness(1)" }, {
        scale: 0.93, filter: "brightness(0.94)", ease: "none",
        scrollTrigger: { trigger: next, start: "top bottom", end: "top 30%", scrub: true }
      });
    });
  }

  /* --- 05 Turismo: la imagen se abre hasta llenar la pantalla --- */
  function initExpand() {
    var box = $("[data-po-expand]");
    var fig = $("[data-po-expand-fig]");
    var text = $("[data-po-expand-text]");
    if (!box || !fig || reduced || !hasGsap()) return;
    var small = matchMedia("(max-width: 719px)").matches;
    var tl = gsap.timeline({ scrollTrigger: { trigger: box, start: "top top", end: "bottom bottom", scrub: 0.7 } });
    tl.fromTo(fig, { clipPath: small ? "inset(40% 8% 16% 8% round 22px)" : "inset(38% 22% 12% 22% round 28px)" },
      { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", duration: 1 }, 0)
      .fromTo($("img", fig), { scale: 1.2 }, { scale: 1, ease: "none", duration: 1 }, 0)
      .to(".po-expand-head", { opacity: 0, y: -30, ease: "none", duration: 0.25 }, 0.12)
      .to(text, { opacity: 1, y: 0, ease: "none", duration: 0.35 }, 0.65);
  }

  /* --- 06 Inmobiliaria: foco de luz que sigue al cursor (o se pasea solo) --- */
  function initSpot() {
    var spot = $("[data-po-spot]");
    if (!spot) return;
    var hovering = false, t0 = performance.now(), raf = 0;
    var set = function (x, y) { spot.style.setProperty("--x", x + "%"); spot.style.setProperty("--y", y + "%"); };
    if (finePointer) {
      spot.addEventListener("mousemove", function (e) {
        var r = spot.getBoundingClientRect();
        hovering = true;
        set(((e.clientX - r.left) / r.width * 100).toFixed(1), ((e.clientY - r.top) / r.height * 100).toFixed(1));
      });
      spot.addEventListener("mouseleave", function () { hovering = false; t0 = performance.now(); });
    }
    if (reduced) { set(50, 40); return; }
    var visible = false;
    if (typeof IntersectionObserver !== "undefined") {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !raf) loop();
      }).observe(spot);
    } else { visible = true; }
    function loop() {
      raf = 0;
      if (!visible) return;
      if (!hovering) {
        var t = (performance.now() - t0) / 1000;
        set((50 + 30 * Math.sin(t * 0.45)).toFixed(1), (42 + 18 * Math.sin(t * 0.7)).toFixed(1));
      }
      raf = requestAnimationFrame(loop);
    }
    loop();
  }

  /* --- 07 Sistemas: pestañas que cambian solas --- */
  function initSys() {
    var box = $("[data-po-sys]");
    if (!box) return;
    var tabs = $$("[data-sys-tab]", box);
    var panels = $$("[data-sys-panel]", box);
    var TIME = 7000, idx = 0, timer = 0, paused = false;
    box.style.setProperty("--po-sys-time", TIME / 1000 + "s");
    function show(i) {
      idx = i;
      tabs.forEach(function (t, k) { t.setAttribute("aria-selected", k === i ? "true" : "false"); });
      panels.forEach(function (p, k) {
        p.hidden = k !== i;
        p.classList.toggle("is-active", k === i);
      });
      // reinicia la barra de progreso
      var bar = $(".po-sys-bar i", tabs[i]);
      if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (reduced || paused) return;
      timer = setTimeout(function () { show((idx + 1) % tabs.length); }, TIME);
    }
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { show(k); });
      t.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var n = (k + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
        tabs[n].focus(); show(n);
      });
    });
    box.addEventListener("mouseenter", function () { paused = true; box.classList.add("is-paused"); clearTimeout(timer); });
    box.addEventListener("mouseleave", function () { paused = false; box.classList.remove("is-paused"); schedule(); });
    schedule();
  }

  /* --- 08 Moda: la tarjeta y el celular se acercan al cursor --- */
  function initMag() {
    var mag = $("[data-po-mag]");
    if (!mag || !finePointer || reduced) return;
    var layers = $$("[data-mag-layer]", mag);
    var sec = mag.closest(".po-sec") || mag;
    sec.addEventListener("mousemove", function (e) {
      var r = mag.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      layers.forEach(function (l) {
        var k = parseFloat(l.getAttribute("data-mag-layer")) || 1;
        l.style.transform = "translate(" + (dx * 26 * k).toFixed(1) + "px," + (dy * 20 * k).toFixed(1) + "px)";
      });
    });
    sec.addEventListener("mouseleave", function () { layers.forEach(function (l) { l.style.transform = ""; }); });
  }

  /* --- 09 Detalles: voltear la carta --- */
  function initFlip() {
    $$("[data-po-flip]").forEach(function (b) {
      b.addEventListener("click", function () {
        b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
      });
    });
  }

  function boot() {
    if (hasGsap()) { try { gsap.registerPlugin(ScrollTrigger); } catch (_) {} }
    safe(initCats, "cats");
    safe(initHoteles, "hoteles");
    safe(initSpa, "spa");
    safe(initTilt, "tilt");
    safe(initStack, "stack");
    safe(initExpand, "expand");
    safe(initSpot, "spot");
    safe(initSys, "sys");
    safe(initMag, "mag");
    safe(initFlip, "flip");
    if (hasGsap()) window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
