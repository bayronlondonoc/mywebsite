(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* --- Nav: se solidifica al hacer scroll + menú móvil --- */
  function initNav() {
    var nav = $("[data-nav]");
    if (!nav || nav.dataset.bound) return;
    nav.dataset.bound = "1";

    var onScroll = function () {
      nav.classList.toggle("is-solid", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var toggle = $("[data-nav-toggle]", nav);
    var links = $("[data-nav-links]", nav);
    if (!toggle || !links) return;

    var close = function () {
      links.classList.remove("is-open");
      nav.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      nav.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
  }

  /* --- Scroll suave en anclas con offset del nav --- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* --- Reveals (fade + cortina) con IntersectionObserver + red de seguridad --- */
  function initReveals() {
    var targets = $$(".reveal, .rule, .curtain");
    if (!targets.length) return;

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -4% 0px" });

    targets.forEach(function (el) { io.observe(el); });

    // Seguridad: a los 6s, revela lo que siga oculto dentro del viewport
    setTimeout(function () {
      $$(".reveal:not(.is-visible), .rule:not(.is-visible), .curtain:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* --- Pastilla "Ver" que sigue al cursor (solo desktop) --- */
  function initViewPill() {
    var pill = $("[data-view-pill]");
    if (!pill || pill.dataset.bound) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    pill.dataset.bound = "1";

    document.addEventListener("mousemove", function (e) {
      pill.style.left = e.clientX + "px";
      pill.style.top = e.clientY + "px";
    }, { passive: true });

    $$("[data-view]").forEach(function (el) {
      el.addEventListener("mouseover", function (e) {
        if (!el.contains(e.relatedTarget)) pill.classList.add("is-on");
      });
      el.addEventListener("mouseout", function (e) {
        if (!el.contains(e.relatedTarget)) pill.classList.remove("is-on");
      });
    });
  }

  /* --- Lightbox minimalista con <dialog> --- */
  function initLightbox() {
    var dialog = $("[data-lightbox]");
    if (!dialog || dialog.dataset.bound) return;
    dialog.dataset.bound = "1";
    var img = $("img", dialog);
    var pill = $("[data-view-pill]");

    document.addEventListener("click", function (e) {
      var item = e.target.closest("[data-lightbox-item]");
      if (!item) return;
      e.preventDefault();
      var src = item.getAttribute("href");
      var alt = $("img", item) ? $("img", item).alt : "";
      img.src = src;
      img.alt = alt;
      if (pill) pill.classList.remove("is-on");
      if (typeof dialog.showModal === "function") dialog.showModal();
      else window.open(src, "_blank");
    });

    var close = $("[data-lightbox-close]", dialog);
    if (close) close.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });
  }

  /* --- "Ver más": revela los elementos ocultos de una galería --- */
  function initVerMas() {
    $$("[data-more]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        var grid = document.querySelector(btn.getAttribute("data-more"));
        if (!grid) return;
        $$(".is-hidden", grid).forEach(function (item) {
          item.classList.remove("is-hidden");
          item.classList.add("is-visible");
          var c = $(".curtain", item);
          if (c) c.classList.add("is-visible");
        });
        btn.parentElement.style.display = "none";
      });
    });
  }

  /* --- Malla de nodos (constelación IA) sobre canvas[data-mesh] --- */
  function initNodeMesh() {
    $$("[data-mesh]").forEach(function (canvas) {
      if (canvas.dataset.bound) return;
      canvas.dataset.bound = "1";
      var ctx = canvas.getContext && canvas.getContext("2d");
      if (!ctx) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = 0, h = 0, nodes = [], raf = 0;
      var CYAN = "111,230,206";

      function build() {
        var r = canvas.getBoundingClientRect();
        w = r.width; h = r.height;
        if (w < 2 || h < 2) return;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var count = Math.max(16, Math.min(48, Math.round((w * h) / 17000)));
        nodes = [];
        for (var i = 0; i < count; i++) {
          nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22 });
        }
      }
      function draw() {
        ctx.clearRect(0, 0, w, h);
        var i, j;
        for (i = 0; i < nodes.length; i++) {
          var n = nodes[i];
          if (!reduced) { n.x += n.vx; n.y += n.vy; }
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
        for (i = 0; i < nodes.length; i++) {
          for (j = i + 1; j < nodes.length; j++) {
            var a = nodes[i], b = nodes[j];
            var dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
            if (d < 135) {
              ctx.strokeStyle = "rgba(" + CYAN + "," + (0.18 * (1 - d / 135)).toFixed(3) + ")";
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
        }
        ctx.fillStyle = "rgba(" + CYAN + ",0.65)";
        for (i = 0; i < nodes.length; i++) {
          ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        if (!reduced) raf = requestAnimationFrame(draw);
      }
      build();
      draw();
      var rt;
      window.addEventListener("resize", function () {
        clearTimeout(rt);
        rt = setTimeout(function () { if (raf) cancelAnimationFrame(raf); build(); draw(); }, 200);
      });
    });
  }

  /* --- Parallax sutil en hero (1 capa, GSAP) --- */
  function initHeroParallax() {
    var media = $("[data-hero-media]");
    if (!media || !window.gsap || !window.ScrollTrigger) return;
    if (matchMedia("(max-width: 719px)").matches) return;
    gsap.to(media, {
      yPercent: 9,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.8
      }
    });
  }

  /* --- Contacto: WhatsApp e Instagram solo si hay dato --- */
  function initContact() {
    var c = data.contact || {};
    var wa = $("[data-whatsapp]");
    if (wa && c.whatsapp) {
      var text = encodeURIComponent(c.whatsappGreeting || "");
      wa.href = "https://wa.me/" + c.whatsapp + (text ? "?text=" + text : "");
      wa.target = "_blank";
      wa.rel = "noopener";
      wa.hidden = false;
    }
    var ig = $("[data-instagram]");
    if (ig && c.instagram) {
      ig.href = c.instagram;
      ig.hidden = false;
    }
  }

  /* --- Año del footer --- */
  function initYear() {
    var el = $("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function boot() {
    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
    }
    safe(initNav, "initNav");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initReveals, "initReveals");
    safe(initHeroParallax, "initHeroParallax");
    safe(initViewPill, "initViewPill");
    safe(initLightbox, "initLightbox");
    safe(initVerMas, "initVerMas");
    safe(initNodeMesh, "initNodeMesh");
    safe(initContact, "initContact");
    safe(initYear, "initYear");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
