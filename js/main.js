/* Ackerman Communications: scroll choreography, interactions and the contact form. No dependencies. */
(function () {
  "use strict";

  // Where the contact form sends. Set one of these to connect it:
  // formEndpoint: a form service URL (Formspree, Basin or your own), email: opens the visitor's mail app.
  var CONTACT = { formEndpoint: "", email: "" };

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var F = window.AckerField || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  if (reduce) root.classList.add("rm");

  /* Opening curtain */
  function open() {
    root.classList.add("is-in");
  }
  if (reduce) open();
  else {
    var opened = false;
    var go = function () { if (!opened) { opened = true; setTimeout(open, 650); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    else go();
    setTimeout(go, 1800);
  }

  /* Split the belief statement into words, keeping the struck phrase together */
  var wordsHost = $("[data-words]");
  if (wordsHost) {
    var wrap = function (text) {
      var frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(" "));
        else {
          var s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          frag.appendChild(s);
        }
      });
      return frag;
    };
    $$("*", wordsHost).length;
    Array.prototype.slice.call(wordsHost.childNodes).forEach(function (n) {
      if (n.nodeType === 3) wordsHost.replaceChild(wrap(n.textContent), n);
      else {
        var inner = wrap(n.textContent);
        n.textContent = "";
        n.appendChild(inner);
      }
    });
  }
  var words = $$(".w", wordsHost);
  var beliefStrike = wordsHost ? $("[data-strike]", wordsHost) : null;

  /* Scenes the field moves between. The field's coordinates: x and y run about -1..1 on the short side. */
  function layout() { return window.innerWidth < 860 ? "narrow" : "wide"; }
  // Half the screen's width in field units: the mark is placed against it, so it fits any shape of screen.
  function halfW() { return window.innerWidth / Math.min(window.innerWidth, window.innerHeight); }
  var SCENES = {
    hero: function () {
      return layout() === "wide"
        ? { scene: [1, 0, 0, 0], center: [halfW() - 0.74, 0.06], scale: 0.66, dim: 1, mask: 1 }
        : { scene: [1, 0, 0, 0], center: [0.05, 0.62], scale: 0.42, dim: 0.62, mask: 0 };
    },
    belief: function () { return { scene: [0, 0, 1, 0], center: [0, -0.9], scale: 0.5, dim: 0.3, mask: 0 }; },
    pillar0: function () {
      return layout() === "wide"
        ? { scene: [0, 1, 0, 0], center: [halfW() - 0.74, 0], scale: 0.66, dim: 1, mask: 1 }
        : { scene: [0, 1, 0, 0], center: [0.1, 0.7], scale: 0.36, dim: 0.75, mask: 0 };
    },
    pillar1: function () {
      return layout() === "wide"
        ? { scene: [0, 0, 1, 0], center: [halfW() - 0.74, -0.1], scale: 0.42, dim: 0.9, mask: 1 }
        : { scene: [0, 0, 1, 0], center: [0.1, 0.72], scale: 0.26, dim: 0.65, mask: 0 };
    },
    pillar2: function () {
      return layout() === "wide"
        ? { scene: [0, 0, 0, 1], center: [halfW() - 0.82, 0], scale: 0.54, dim: 1, mask: 1 }
        : { scene: [0, 0, 0, 1], center: [0.1, 0.72], scale: 0.26, dim: 0.7, mask: 0 };
    },
    approach: function () { return { scene: [0, 0, 1, 0], center: [0, -1.25], scale: 0.42, dim: 0.26, mask: 0 }; },
    contact: function () {
      return layout() === "wide"
        ? { scene: [0, 0, 1, 0], center: [halfW() * 0.5, -1.2], scale: 0.44, dim: 0.34, mask: 0 }
        : { scene: [0, 0, 1, 0], center: [0, -1.2], scale: 0.3, dim: 0.28, mask: 0 };
    },
  };
  var currentScene = "";
  function setScene(name) {
    if (name === currentScene || !SCENES[name]) return;
    currentScene = name;
    var s = SCENES[name]();
    F.sceneTarget = s.scene;
    F.centerTarget = s.center;
    F.scaleTarget = s.scale;
    F.dimTarget = s.dim;
    F.maskLeftTarget = s.mask;
    if (reduce && F.redraw) setTimeout(F.redraw, 0);
  }

  /* Sticky section progress */
  var belief = $(".belief");
  var pillars = $(".pillars");
  var pillarEls = $$(".pillar");
  var pillarNum = $("[data-pillar-num]");
  var approach = $(".approach");
  var track = $(".approach__track");
  var bar = $(".approach__bar i");
  var hero = $(".hero");
  var contact = $(".contact");
  var solids = $$("[data-solid]");
  var strikes = $$("[data-strike]");

  function progress(el) {
    var r = el.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : (r.top < 0 ? 1 : 0);
  }

  function sizeApproach() {
    if (!approach || !track) return;
    if (window.innerWidth >= 860 && !reduce) {
      var travel = track.scrollWidth - window.innerWidth;
      approach.style.height = travel + window.innerHeight + "px";
    } else {
      approach.style.height = "";
      track.style.transform = "";
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;

    // Which scene owns the middle of the screen
    var mid = vh * 0.5;
    var inView = function (el) { var r = el.getBoundingClientRect(); return r.top <= mid && r.bottom >= mid; };

    if (hero && inView(hero)) setScene("hero");
    if (belief && inView(belief)) setScene("belief");
    if (approach && inView(approach)) setScene("approach");
    if (contact && inView(contact)) setScene("contact");

    // Belief: words light as the reader moves through
    if (belief) {
      var bp = reduce ? 1 : progress(belief);
      var lit = Math.round(clamp(bp / 0.82, 0, 1) * words.length);
      words.forEach(function (w, i) { w.classList.toggle("on", i < lit); });
      if (beliefStrike) beliefStrike.classList.toggle("is-struck", reduce || lit >= words.length * 0.42);
    }

    // Pillars: one at a time, and the field follows
    if (pillars) {
      var pp = reduce ? 0 : progress(pillars);
      var idx = clamp(Math.floor(pp * 3), 0, 2);
      pillarEls.forEach(function (el, i) { el.classList.toggle("is-on", reduce || i === idx); });
      if (pillarNum) pillarNum.textContent = "0" + (idx + 1);
      if (inView(pillars)) {
        setScene("pillar" + idx);
        F.buildTarget = reduce || idx > 0 ? 1 : clamp(pp * 3 * 1.15, 0, 1);
      }
    }

    // Approach: vertical scroll becomes sideways travel
    if (approach && track && window.innerWidth >= 860 && !reduce) {
      var ap = progress(approach);
      var travel = track.scrollWidth - window.innerWidth;
      track.style.transform = "translate3d(" + -ap * travel + "px,0,0)";
      if (bar) bar.style.transform = "scaleX(" + ap + ")";
    }

    // Other strikethroughs draw when they reach the reader
    strikes.forEach(function (s) {
      if (s === beliefStrike) return;
      var r = s.getBoundingClientRect();
      if (r.top < vh * 0.82) s.classList.add("is-struck");
    });

    // Don't spend the GPU on a field nobody can see
    F.covered = solids.some(function (s) {
      var r = s.getBoundingClientRect();
      return r.top <= 0 && r.bottom >= vh;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    currentScene = "";
    sizeApproach();
    update();
  }, { passive: true });
  sizeApproach();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { sizeApproach(); update(); });
  window.addEventListener("load", function () { sizeApproach(); update(); });
  update();

  /* Reveals */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-seen");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-seen"); });
  }

  /* Clocks */
  var clocks = $$("[data-clock]");
  function tick() {
    clocks.forEach(function (c) {
      try {
        c.textContent = new Intl.DateTimeFormat("en-GB", { timeZone: c.getAttribute("data-clock"), hour: "2-digit", minute: "2-digit" }).format(new Date());
      } catch (e) {}
    });
  }
  tick();
  setInterval(tick, 20000);
  var year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  /* Cursor and magnetic elements (mouse only) */
  if (fine && !reduce) {
    root.classList.add("has-cursor");
    var cur = $(".cursor");
    var cx = -100, cy = -100, tx = -100, ty = -100;
    window.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; cur.classList.add("is-live"); }, { passive: true });
    document.addEventListener("pointerleave", function () { cur.classList.remove("is-live"); });
    (function follow() {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      cur.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      requestAnimationFrame(follow);
    })();
    $$("a, button, .cap, input, textarea").forEach(function (el) {
      el.addEventListener("pointerenter", function () { cur.classList.add("is-big"); });
      el.addEventListener("pointerleave", function () { cur.classList.remove("is-big"); });
    });
    $$(".btn, .top__cta").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.16 + "px," + (e.clientY - r.top - r.height / 2) * 0.28 + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* Contact form */
  var form = $("#contact-form");
  if (form) {
    var note = $(".form__note", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      note.className = "form__note";
      if (!form.checkValidity()) {
        note.textContent = "Please add your name, a valid email and a short message.";
        note.classList.add("is-err");
        var bad = form.querySelector(":invalid");
        if (bad) bad.focus();
        return;
      }
      var data = new FormData(form);
      if (CONTACT.formEndpoint) {
        note.textContent = "Sending…";
        fetch(CONTACT.formEndpoint, { method: "POST", headers: { Accept: "application/json" }, body: data })
          .then(function (r) {
            if (!r.ok) throw new Error("bad status");
            form.reset();
            note.textContent = "Thank you. We’ll be in touch.";
          })
          .catch(function () {
            note.textContent = "That didn’t send. Please try again.";
            note.classList.add("is-err");
          });
      } else if (CONTACT.email) {
        var body = data.get("message") + "\n\n" + data.get("name") + "\n" + data.get("email");
        window.location.href = "mailto:" + CONTACT.email + "?subject=" + encodeURIComponent("Enquiry from " + data.get("name")) + "&body=" + encodeURIComponent(body);
      } else {
        note.textContent = "This form isn’t connected yet, so your message hasn’t been sent.";
        note.classList.add("is-err");
      }
    });
  }
})();
