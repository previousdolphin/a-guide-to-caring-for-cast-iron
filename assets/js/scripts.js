/* Cast & Care — hero canvas, navigation state, tabs, charts. No frameworks. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js-ready");

  var hero = document.querySelector(".hero");
  var landing = document.querySelector(".landing");
  var header = document.querySelector(".site-header");
  var sideToc = document.querySelector(".side-toc");
  var footer = document.querySelector(".site-footer");
  var cue = document.querySelector(".cue");

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function heroProgress() {
    if (!hero) return 1;
    var span = hero.offsetHeight - window.innerHeight;
    return span > 0 ? clamp(window.scrollY / span, 0, 1) : 0;
  }

  /* ------------------------------------------------------------
     Hero canvas: a skillet seen from above, words orbiting the rim,
     embers drifting up from the burner.
     ------------------------------------------------------------ */
  var canvas = document.getElementById("hero-canvas");
  var drawHero = function () {};

  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, DPR = 1, R = 0, panImg = null, textBox = null;
    var WORDS = [
      "seasoning", "polymer", "iron", "heat", "oil", "patience", "soap",
      "water", "rust", "carbon", "smoke point", "grapeseed", "sear",
      "dry it", "wipe it back", "bake", "450°F", "every cook is a coat",
      "skillet", "cornbread", "chainmail", "steam", "lye", "surfactant",
      "flaxseed", "cast", "care", "½ tsp", "one minute", "Sunday eggs"
    ];
    var words = [];
    var embers = [];
    var seed = 7;
    function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

    words = WORDS.map(function (text, i) {
      var depth = rand();
      return {
        text: text,
        angle: (i / WORDS.length) * Math.PI * 2 + rand() * 0.3,
        orbit: 1.12 + depth * 0.95,
        speed: (0.012 + rand() * 0.02) * (rand() > 0.5 ? 1 : -1) * 0.6,
        size: 12 + (1 - depth) * 14,
        alpha: 0.18 + (1 - depth) * 0.42,
        italic: rand() > 0.45,
        tilt: (rand() - 0.5) * 0.18
      };
    });

    function makeEmber(initial) {
      return {
        x: rand(),
        y: initial ? rand() : 1.05 + rand() * 0.1,
        vy: 0.0006 + rand() * 0.0016,
        drift: (rand() - 0.5) * 0.0006,
        r: 0.6 + rand() * 1.8,
        life: rand() * Math.PI * 2,
        flick: 2 + rand() * 4
      };
    }
    for (var e = 0; e < 70; e++) embers.push(makeEmber(true));

    function renderPan() {
      // Pre-render the pan (with its speckled iron texture) once per resize.
      var size = Math.ceil(R * 3.2 * DPR);
      var off = document.createElement("canvas");
      off.width = off.height = size;
      var c = off.getContext("2d");
      var cx = size / 2, cy = size / 2, r = R * DPR;
      c.translate(cx, cy);

      // Handle, down and to the right
      c.save();
      c.rotate(Math.PI * 0.2);
      var hg = c.createLinearGradient(0, -r * 0.12, 0, r * 0.12);
      hg.addColorStop(0, "#26241f");
      hg.addColorStop(0.5, "#3a3630");
      hg.addColorStop(1, "#1a1816");
      c.fillStyle = hg;
      roundRect(c, r * 0.9, -r * 0.11, r * 0.66, r * 0.22, r * 0.11);
      c.fill();
      c.globalCompositeOperation = "destination-out";
      c.beginPath(); c.arc(r * 1.43, 0, r * 0.045, 0, Math.PI * 2); c.fill();
      c.globalCompositeOperation = "source-over";
      // Helper handle opposite
      c.fillStyle = "#24221e";
      roundRect(c, -r * 1.2, -r * 0.13, r * 0.26, r * 0.26, r * 0.09);
      c.fill();
      c.restore();

      // Rim
      var rim = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.2, 0, 0, r * 1.05);
      rim.addColorStop(0, "#4a4640");
      rim.addColorStop(0.7, "#2c2925");
      rim.addColorStop(1, "#141311");
      c.fillStyle = rim;
      c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();

      // Cooking surface
      var floor = c.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.05, 0, 0, r * 0.9);
      floor.addColorStop(0, "#2a2724");
      floor.addColorStop(0.6, "#191816");
      floor.addColorStop(1, "#0f0e0d");
      c.fillStyle = floor;
      c.beginPath(); c.arc(0, 0, r * 0.86, 0, Math.PI * 2); c.fill();

      // Iron grain
      c.save();
      c.beginPath(); c.arc(0, 0, r * 0.99, 0, Math.PI * 2); c.clip();
      var count = Math.floor(r * r * 0.02);
      for (var i = 0; i < count; i++) {
        var a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r;
        c.fillStyle = rand() > 0.5 ? "rgba(255,245,230,0.035)" : "rgba(0,0,0,0.25)";
        c.fillRect(Math.cos(a) * d, Math.sin(a) * d, DPR, DPR);
      }
      c.restore();

      // Inner wall shadow
      c.strokeStyle = "rgba(0,0,0,0.55)";
      c.lineWidth = r * 0.03;
      c.beginPath(); c.arc(0, 0, r * 0.875, 0, Math.PI * 2); c.stroke();
      // Rim highlight
      c.strokeStyle = "rgba(242,237,228,0.12)";
      c.lineWidth = Math.max(1, DPR);
      c.beginPath(); c.arc(0, 0, r * 0.995, Math.PI * 1.05, Math.PI * 1.65); c.stroke();

      panImg = off;
    }

    function roundRect(c, x, y, w, h, rr) {
      c.beginPath();
      c.moveTo(x + rr, y);
      c.arcTo(x + w, y, x + w, y + h, rr);
      c.arcTo(x + w, y + h, x, y + h, rr);
      c.arcTo(x, y + h, x, y, rr);
      c.arcTo(x, y, x + w, y, rr);
      c.closePath();
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      R = Math.min(W * 0.36, H * 0.34);
      seed = 11;
      renderPan();
      // Words passing behind the title and contents are dimmed so the text stays legible.
      var cr = canvas.getBoundingClientRect();
      var boxes = Array.prototype.map.call(landing.querySelectorAll(".eyebrow, .hero-title, .hero-sub, .toc"), function (n) { return n.getBoundingClientRect(); });
      textBox = {
        l: Math.min.apply(null, boxes.map(function (b) { return b.left; })) - cr.left - 40,
        r: Math.max.apply(null, boxes.map(function (b) { return b.right; })) - cr.left + 40,
        t: Math.min.apply(null, boxes.map(function (b) { return b.top; })) - cr.top - 24,
        b: Math.max.apply(null, boxes.map(function (b) { return b.bottom; })) - cr.top + 24
      };
    }

    var t0 = performance.now();
    drawHero = function (now) {
      var t = ((now || performance.now()) - t0) / 1000;
      var p = heroProgress();
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);

      var cx = W / 2, cy = H * 0.52;
      var zoom = 1 + p * 0.9;
      var fade = 1 - clamp((p - 0.55) / 0.45, 0, 1);

      // Burner glow under the pan
      var pulse = 0.85 + Math.sin(t * 1.3) * 0.08;
      var glow = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.9 * zoom);
      glow.addColorStop(0, "rgba(217,119,87," + (0.2 * pulse * fade) + ")");
      glow.addColorStop(0.5, "rgba(217,119,87," + (0.06 * fade) + ")");
      glow.addColorStop(1, "rgba(217,119,87,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Pan
      ctx.save();
      ctx.globalAlpha = 0.95 * fade;
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(t * 0.08) * 0.03 - p * 0.25);
      ctx.scale(zoom, zoom);
      var s = panImg.width / DPR;
      ctx.drawImage(panImg, -s / 2, -s / 2, s, s);

      // Oil sheen drifting across the surface
      var sx = Math.cos(t * 0.21) * R * 0.35, sy = Math.sin(t * 0.17) * R * 0.3;
      var sheen = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.6);
      sheen.addColorStop(0, "rgba(242,237,228,0.075)");
      sheen.addColorStop(1, "rgba(242,237,228,0)");
      ctx.fillStyle = sheen;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.86, 0, Math.PI * 2); ctx.fill();

      // Heat shimmer rings
      ctx.lineWidth = 1;
      for (var k = 0; k < 3; k++) {
        var ph = ((t * 0.12 + k / 3) % 1);
        ctx.strokeStyle = "rgba(217,119,87," + (0.1 * (1 - ph)) + ")";
        ctx.beginPath(); ctx.arc(0, 0, R * (0.15 + ph * 0.7), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();

      // Orbiting words
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        var ang = w.angle + (reduceMotion ? 0 : t * w.speed) + p * w.speed * 20;
        var orbit = R * w.orbit * (1 + p * 1.1);
        var x = cx + Math.cos(ang) * orbit;
        var y = cy + Math.sin(ang) * orbit * 0.82;
        if (x < -200 || x > W + 200 || y < -60 || y > H + 60) continue;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(w.tilt);
        var behind = textBox && landing.style.visibility !== "hidden" &&
          x > textBox.l && x < textBox.r && y > textBox.t && y < textBox.b;
        ctx.globalAlpha = w.alpha * fade * (behind ? 0.22 : 1);
        ctx.fillStyle = "#f2ede4";
        ctx.font = (w.italic ? "italic " : "") + "400 " + (w.size * (1 + p * 0.4)).toFixed(1) + "px 'Source Serif 4', Georgia, serif";
        ctx.fillText(w.text, 0, 0);
        ctx.restore();
      }

      // Embers
      for (var j = 0; j < embers.length; j++) {
        var m = embers[j];
        if (!reduceMotion) {
          m.y -= m.vy;
          m.x += m.drift + Math.sin(t * 0.8 + m.life) * 0.0003;
          if (m.y < -0.05) embers[j] = m = makeEmber(false);
        }
        var fl = 0.5 + 0.5 * Math.sin(t * m.flick + m.life);
        var ex = m.x * W, ey = m.y * H;
        var a = (0.25 + fl * 0.6) * clamp(m.y * 1.4, 0, 1) * fade;
        var g = ctx.createRadialGradient(ex, ey, 0, ex, ey, m.r * 5);
        g.addColorStop(0, "rgba(255,180,120," + a + ")");
        g.addColorStop(0.3, "rgba(217,119,87," + (a * 0.5) + ")");
        g.addColorStop(1, "rgba(217,119,87,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(ex, ey, m.r * 5, 0, Math.PI * 2); ctx.fill();
      }
    };

    resize();
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resize(); drawHero(); }, 120);
    });

    var heroVisible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible && !reduceMotion) requestAnimationFrame(loop);
      }).observe(hero);
    }
    function loop(now) {
      drawHero(now);
      if (heroVisible && !reduceMotion) requestAnimationFrame(loop);
    }
    // Wait for the serif so the orbiting words render in it.
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
      if (reduceMotion) drawHero(); else requestAnimationFrame(loop);
    });
  }

  /* ------------------------------------------------------------
     Scroll state: landing fade, header theme, side contents.
     ------------------------------------------------------------ */
  var tocLinks = sideToc ? Array.prototype.slice.call(sideToc.querySelectorAll("a")) : [];
  var tocTargets = tocLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); });

  function onScroll() {
    var p = heroProgress();
    if (landing) {
      var o = clamp(1 - p * 2.2, 0, 1);
      landing.style.opacity = o;
      landing.style.transform = reduceMotion ? "" : "translateY(" + (-p * 60).toFixed(1) + "px)";
      landing.style.visibility = o === 0 ? "hidden" : "visible";
    }
    if (reduceMotion && drawHero) drawHero();

    var heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
    header.setAttribute("data-on", heroBottom <= 65 ? "light" : "dark");
    if (cue) cue.style.opacity = clamp(1 - p * 4, 0, 1);

    if (sideToc) {
      var footTop = footer.getBoundingClientRect().top;
      sideToc.classList.toggle("is-visible", heroBottom < window.innerHeight * 0.4 && footTop > window.innerHeight * 0.7);
      var active = -1, line = window.innerHeight * 0.35;
      tocTargets.forEach(function (el, i) { if (el && el.getBoundingClientRect().top < line) active = i; });
      tocLinks.forEach(function (a, i) {
        a.classList.toggle("is-active", i === active);
        if (i === active) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    }
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { onScroll(); ticking = false; }); }
  }, { passive: true });
  onScroll();

  /* ------------------------------------------------------------
     Tabs (charts, case files, old-vs-method comparison)
     ------------------------------------------------------------ */
  Array.prototype.forEach.call(document.querySelectorAll('[role="tablist"]'), function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      var panel = document.getElementById(tab.getAttribute("aria-controls"));
      if (panel) animateCharts(panel);
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (ev) {
        var n = null;
        if (ev.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        else if (ev.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (ev.key === "Home") n = tabs[0];
        else if (ev.key === "End") n = tabs[tabs.length - 1];
        if (n) { ev.preventDefault(); select(n, true); }
      });
    });
  });

  /* ------------------------------------------------------------
     Charts (SVG, drawn from data)
     ------------------------------------------------------------ */
  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs, text) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  function smokeChart(host) {
    var data = [
      { name: "Avocado, refined", f: 520, rec: false },
      { name: "Sunflower, refined", f: 450, rec: true },
      { name: "Peanut, refined", f: 450, rec: false },
      { name: "Grapeseed", f: 420, rec: true },
      { name: "Canola, refined", f: 400, rec: true },
      { name: "Olive, extra virgin", f: 390, rec: false },
      { name: "Lard", f: 370, rec: false },
      { name: "Vegetable shortening", f: 360, rec: true },
      { name: "Flaxseed", f: 225, rec: false }
    ];
    var Wd = chartWidth(host), narrow = Wd < 560;
    var left = narrow ? 138 : 170, right = 44, top = 28, row = 36, Hd = top + data.length * row + 34;
    var max = 600;
    function x(v) { return left + (v / max) * (Wd - left - right); }
    var svg = el("svg", { viewBox: "0 0 " + Wd + " " + Hd, "aria-hidden": "true" });

    // Seasoning oven band
    svg.appendChild(el("rect", { x: x(450), y: top - 10, width: x(500) - x(450), height: data.length * row + 10, fill: "#d9775722" }));
    svg.appendChild(el("line", { x1: x(450), x2: x(450), y1: top - 10, y2: top + data.length * row, stroke: "#d97757", "stroke-dasharray": "3 3" }));
    svg.appendChild(el("line", { x1: x(500), x2: x(500), y1: top - 10, y2: top + data.length * row, stroke: "#d97757", "stroke-dasharray": "3 3" }));
    svg.appendChild(el("text", { x: x(475), y: top - 16, "text-anchor": "middle", "font-size": 12, fill: "#b85a3c" }, "Seasoning oven"));

    // Grid + axis
    (narrow ? [0, 200, 400, 600] : [0, 100, 200, 300, 400, 500, 600]).forEach(function (v) {
      svg.appendChild(el("line", { x1: x(v), x2: x(v), y1: top - 4, y2: top + data.length * row, stroke: "#14141314" }));
      svg.appendChild(el("text", { x: x(v), y: Hd - 12, "text-anchor": "middle", "font-size": 12, class: "val" }, v + "°F"));
    });

    data.forEach(function (d, i) {
      var y = top + i * row;
      svg.appendChild(el("text", { x: left - 14, y: y + row / 2 + 1, "text-anchor": "end", "dominant-baseline": "middle", class: "lab" }, d.name));
      svg.appendChild(el("rect", {
        class: "bar", x: left, y: y + 8, height: row - 16, width: x(d.f) - left, rx: 3,
        fill: d.rec ? "#d97757" : "#b0aea5",
        style: "transition-delay:" + (i * 0.05) + "s"
      }));
      svg.appendChild(el("text", { x: x(d.f) + 8, y: y + row / 2 + 1, "dominant-baseline": "middle", class: "val" }, d.f + "°"));
    });
    host.appendChild(svg);
  }

  function heatChart(host) {
    // k: thermal conductivity (W/m·K); cv: J/cm³·K; t: typical wall (cm)
    var data = [
      { name: "Cast iron", k: 52, cv: 3.31, t: 0.45, hi: true },
      { name: "Carbon steel", k: 50, cv: 3.85, t: 0.25 },
      { name: "Stainless, clad", k: 16, cv: 4.0, t: 0.26 },
      { name: "Aluminium", k: 237, cv: 2.42, t: 0.3 },
      { name: "Copper", k: 400, cv: 3.45, t: 0.25 }
    ];
    var Wd = chartWidth(host), narrow = Wd < 560;
    var Hd = narrow ? 360 : 420, l = narrow ? 52 : 64, r = 16, tp = 24, b = 60;
    var xmin = Math.log10(10), xmax = Math.log10(600), ymax = 1.8;
    function x(v) { return l + (Math.log10(v) - xmin) / (xmax - xmin) * (Wd - l - r); }
    function y(v) { return tp + (1 - v / ymax) * (Hd - tp - b); }
    var svg = el("svg", { viewBox: "0 0 " + Wd + " " + Hd, "aria-hidden": "true" });

    [0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8].forEach(function (v) {
      svg.appendChild(el("line", { x1: l, x2: Wd - r, y1: y(v), y2: y(v), stroke: "#14141314" }));
      svg.appendChild(el("text", { x: l - 10, y: y(v), "text-anchor": "end", "dominant-baseline": "middle", class: "val" }, v.toFixed(1)));
    });
    (narrow ? [10, 50, 200, 500] : [10, 20, 50, 100, 200, 500]).forEach(function (v) {
      svg.appendChild(el("line", { x1: x(v), x2: x(v), y1: tp, y2: Hd - b, stroke: "#14141314" }));
      svg.appendChild(el("text", { x: x(v), y: Hd - b + 20, "text-anchor": "middle", class: "val" }, String(v)));
    });
    svg.appendChild(el("text", { x: (l + Wd - r) / 2, y: Hd - 12, "text-anchor": "middle", "font-size": 13 }, narrow ? "Spreads heat → W/m·K (log)" : "Spreads heat → thermal conductivity, W/m·K (log scale)"));
    var yl = el("text", { x: 0, y: 0, "text-anchor": "middle", "font-size": 13, transform: "translate(14 " + ((tp + Hd - b) / 2) + ") rotate(-90)" }, narrow ? "Stores heat → J/cm²·K" : "Stores heat → J/cm²·K at typical thickness");
    svg.appendChild(yl);

    data.forEach(function (d, i) {
      var stored = d.cv * d.t;
      var px = x(d.k), py = y(stored);
      var g = el("g", { class: "dot", style: "transform-origin:" + px + "px " + py + "px; transition-delay:" + (i * 0.07) + "s" });
      if (d.hi) g.appendChild(el("circle", { cx: px, cy: py, r: 18, fill: "#d9775726" }));
      g.appendChild(el("circle", { cx: px, cy: py, r: d.hi ? 8 : 6, fill: d.hi ? "#d97757" : "#141413" }));
      var anchorRight = d.k > 150;
      g.appendChild(el("text", {
        x: px + (anchorRight ? -14 : 14), y: py + (d.name === "Carbon steel" ? 18 : d.name === "Copper" && narrow ? -18 : 0),
        "text-anchor": anchorRight ? "end" : "start", "dominant-baseline": "middle",
        class: "lab", "font-weight": d.hi ? 600 : 400
      }, d.name + "  " + stored.toFixed(2)));
      svg.appendChild(g);
    });
    host.appendChild(svg);
  }

  // Charts draw at the container's real width so labels stay readable on phones.
  function chartWidth(host) {
    var w = host.clientWidth || (host.closest(".charts") || document.body).clientWidth - 48;
    return Math.max(300, Math.min(880, Math.round(w)));
  }
  var charts = [
    { host: document.getElementById("chart-smoke"), draw: smokeChart },
    { host: document.getElementById("chart-heat"), draw: heatChart }
  ].filter(function (c) { return c.host; });
  function drawCharts() {
    charts.forEach(function (c) { c.host.textContent = ""; c.draw(c.host); });
  }
  drawCharts();
  var lastW = window.innerWidth, chartTimer;
  window.addEventListener("resize", function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(chartTimer);
    chartTimer = setTimeout(drawCharts, 150);
  });

  // Bars grow and dots pop in the first time a chart is shown.
  var style = document.createElement("style");
  style.textContent =
    ".js-ready .chart .bar{transform:scaleX(0);transform-box:fill-box;transform-origin:left center;transition:transform .9s cubic-bezier(.25,1,.5,1)}" +
    ".js-ready .chart.in .bar{transform:none}" +
    ".js-ready .chart .dot{transform:scale(0);opacity:0}" +
    ".js-ready .chart.in .dot{transform:none;opacity:1}";
  document.head.appendChild(style);

  function animateCharts(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll(".chart"), function (c) {
      if (reduceMotion) { c.classList.add("in"); return; }
      requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add("in"); }); });
    });
  }

  /* ------------------------------------------------------------
     Example arguments fill the form's text box
     ------------------------------------------------------------ */
  var disputeBox = document.getElementById("dispute");
  Array.prototype.forEach.call(document.querySelectorAll("[data-example]"), function (btn) {
    btn.addEventListener("click", function () {
      if (!disputeBox) return;
      disputeBox.value = btn.getAttribute("data-example");
      disputeBox.focus();
    });
  });

  /* ------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------ */
  var revealables = document.querySelectorAll(".block .reading, .block .reading-wide, .glance, .ask-inner");
  Array.prototype.forEach.call(revealables, function (n) { n.classList.add("reveal"); });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(revealables, function (n) { n.classList.add("is-visible"); });
    animateCharts(document);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          var visiblePanel = entry.target.querySelector(".chart-panel:not([hidden])");
          if (visiblePanel) animateCharts(visiblePanel);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    Array.prototype.forEach.call(revealables, function (n) { io.observe(n); });
  }
})();
