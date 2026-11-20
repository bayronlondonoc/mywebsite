/* =============================================================
   PORTAFOLIO — movimientos de cada sección.
   Los efectos de scroll usan "position: sticky" + el avance real de
   cada sección (getBoundingClientRect en cada cuadro), así nunca se
   salen de su sección aunque cambie el alto de la página (fuentes,
   imágenes, zoom o ventana pequeña). Sin JS o con "reducir
   movimiento", la página queda estática y legible.
   ============================================================= */
(function () {
  "use strict";

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[portafolio:" + name + "]", e); }
  }

  /* --- Motor de escenas: cada escena recibe su avance (0 → 1) --- */
  var scenes = [];
  var layouts = [];
  var queued = false;

  // Avance de un bloque alto con un hijo "sticky": 0 cuando su borde superior
  // toca la parte de arriba de la pantalla, 1 cuando su borde inferior llega abajo.
  function progressOf(el) {
    var r = el.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    if (total <= 0) return r.top <= 0 ? 1 : 0;
    return clamp(-r.top / total, 0, 1);
  }
  function near(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > -window.innerHeight && r.top < window.innerHeight * 2;
  }
  function frame() {
    queued = false;
    scenes.forEach(function (s) { if (near(s.el)) s.update(progressOf(s.el)); });
  }
  function request() {
    if (!queued) { queued = true; requestAnimationFrame(frame); }
  }
  function relayout() {
    layouts.forEach(function (fn) { fn(); });
    request();
  }
  function addScene(el, update, layout) {
    scenes.push({ el: el, update: update });
    if (layout) layouts.push(layout);
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

  /* --- 01 Hoteles: la sección se queda quieta y el riel avanza en horizontal --- */
  function initHoteles() {
    var scene = $("[data-po-hscroll]");
    var track = $("[data-po-track]");
    var vp = $(".po-h-viewport");
    var bar = $("[data-po-progress]");
    if (!scene || !track || !vp) return;
    var desktop = matchMedia("(min-width: 900px)");
    var overflow = 0;

    function setBar(p) { if (bar) bar.style.transform = "scaleX(" + Math.max(0.08, p) + ")"; }

    // Celular / sin movimiento: el riel se desliza con el dedo.
    vp.addEventListener("scroll", function () {
      if (document.documentElement.classList.contains("po-motion")) return;
      var max = vp.scrollWidth - vp.clientWidth;
      setBar(max ? vp.scrollLeft / max : 1);
    }, { passive: true });

    function layout() {
      var on = desktop.matches && !reduced;
      document.documentElement.classList.toggle("po-motion", on);
      if (!on) { scene.style.height = ""; track.style.transform = ""; return; }
      overflow = Math.max(0, track.scrollWidth - vp.clientWidth);
      // Alto del bloque = una pantalla + lo que hay que recorrer en horizontal.
      scene.style.height = (window.innerHeight + overflow) + "px";
    }
    addScene(scene, function (p) {
      if (!document.documentElement.classList.contains("po-motion")) return;
      track.style.transform = "translate3d(" + (-overflow * p).toFixed(1) + "px,0,0)";
      setBar(p);
    }, layout);
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(relayout).observe(track);
  }

  /* --- 02 Spa: el sitio completo se recorre dentro del portátil --- */
  function initSpa() {
    var tour = $("[data-po-tour]");
    var img = $("[data-po-tour-img]");
    var screen = $("[data-po-screen]");
    var phone = $(".po-tour-phone");
    if (!tour || !img || !screen || reduced) return;
    var travel = 0;
    function layout() { travel = Math.max(0, img.offsetHeight - screen.clientHeight); }
    img.addEventListener("load", relayout);
    addScene(tour, function (p) {
      img.style.transform = "translate3d(0," + (-travel * p).toFixed(1) + "px,0)";
      if (phone) phone.style.transform = "translate3d(0," + lerp(60, -40, p).toFixed(1) + "px,0)";
    }, layout);
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
    if (reduced) return;
    var box = $("[data-po-stack]");
    var cards = $$(".po-stack-card");
    if (!box || cards.length < 2) return;
    scenes.push({
      el: box,
      update: function () {
        var vh = window.innerHeight;
        cards.forEach(function (card, i) {
          var next = cards[i + 1];
          if (!next) return;
          var t = clamp((vh - next.getBoundingClientRect().top) / (vh * 0.7), 0, 1);
          card.style.transform = "scale(" + (1 - 0.07 * t).toFixed(4) + ")";
          card.style.filter = t > 0 ? "brightness(" + (1 - 0.06 * t).toFixed(3) + ")" : "";
        });
      }
    });
  }

  /* --- 05 Turismo: la imagen se abre hasta llenar la pantalla --- */
  function initExpand() {
    var box = $("[data-po-expand]");
    var fig = $("[data-po-expand-fig]");
    var img = fig && $("img", fig);
    var head = $(".po-expand-head");
    var text = $("[data-po-expand-text]");
    if (!box || !fig || reduced) return;
    var from = [38, 22, 12, 22, 28];
    function layout() {
      from = matchMedia("(max-width: 719px)").matches ? [40, 8, 16, 8, 22] : [38, 22, 12, 22, 28];
    }
    addScene(box, function (p) {
      var t = clamp(p / 0.85, 0, 1);
      var e = 1 - Math.pow(1 - t, 2);
      fig.style.clipPath = "inset(" + lerp(from[0], 0, e).toFixed(2) + "% " + lerp(from[1], 0, e).toFixed(2) + "% " +
        lerp(from[2], 0, e).toFixed(2) + "% " + lerp(from[3], 0, e).toFixed(2) + "% round " + lerp(from[4], 0, e).toFixed(1) + "px)";
      if (img) img.style.transform = "scale(" + lerp(1.2, 1, e).toFixed(4) + ")";
      if (head) {
        var h = clamp((p - 0.1) / 0.25, 0, 1);
        head.style.opacity = (1 - h).toFixed(3);
        head.style.transform = "translate3d(0," + (-30 * h).toFixed(1) + "px,0)";
      }
      if (text) {
        var k = clamp((p - 0.62) / 0.3, 0, 1);
        text.style.opacity = k.toFixed(3);
        text.style.transform = "translate3d(0," + (30 * (1 - k)).toFixed(1) + "px,0)";
      }
    }, layout);
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
    relayout();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", relayout);
    window.addEventListener("load", relayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
