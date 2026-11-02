/* Ackerman Communications: menu, dropdowns, a gentle fade-in, and the contact form. No dependencies. */
(function () {
  "use strict";

  // Where the contact forms send. Set one of these to connect them:
  // formEndpoint: a form service URL (Formspree, Basin or your own; also add its host to connect-src in vercel.json),
  // email: opens the visitor's mail app.
  var CONTACT = { formEndpoint: "", email: "" };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Mobile menu */
  var menu = $(".top__menu");
  var nav = $("#nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", open ? "true" : "false");
    menu.textContent = open ? "Close" : "Menu";
  }
  if (menu && nav) {
    menu.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  }

  /* Dropdowns: click or keyboard everywhere, and hover with a mouse (in the stylesheet) */
  var drops = $$(".dd");
  function closeDrops(except) {
    drops.forEach(function (d) {
      if (d !== except) {
        d.classList.remove("is-open");
        $(".dd__btn", d).setAttribute("aria-expanded", "false");
      }
    });
  }
  drops.forEach(function (d) {
    var b = $(".dd__btn", d);
    b.addEventListener("click", function () {
      var open = !d.classList.contains("is-open");
      closeDrops(d);
      d.classList.toggle("is-open", open);
      b.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".dd")) closeDrops(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var openDrop = $(".dd.is-open");
    closeDrops();
    if (openDrop) $(".dd__btn", openDrop).focus();
    else if (nav && nav.classList.contains("is-open")) { setMenu(false); menu.focus(); }
  });

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Split marked headlines into words, keeping the text whole for screen readers and copying */
  $$("[data-words]").forEach(function (host) {
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 1) return walk(c);
        if (c.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(" "));
          var s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          s.style.setProperty("--w", Math.min(n++, 34));
          frag.appendChild(s);
        });
        node.replaceChild(frag, c);
      });
    })(host);
    host.classList.add("is-split");
  });

  /* Stagger neighbours that arrive together, by a small amount */
  $$(".fade").forEach(function (el) {
    var i = Array.prototype.indexOf.call(el.parentNode.children, el);
    if (i > 0) el.style.setProperty("--d", (i % 4) * 0.08 + "s");
  });

  /* Reveal each piece once as it comes into view */
  var reveal = $$(".fade, [data-words]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-seen");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    reveal.forEach(function (el) { io.observe(el); });
  } else {
    reveal.forEach(function (el) { el.classList.add("is-seen"); });
  }

  /* Scroll-linked touches: header state, reading progress, and a very slight parallax on large screens */
  var top = $(".top");
  var bar = $(".progress i");
  var pls = !reduce && window.matchMedia("(min-width: 861px)").matches ? $$(".pl") : [];
  var ticking = false;
  function onFrame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    if (top) top.classList.toggle("is-scrolled", y > 12);
    if (bar) {
      var total = document.documentElement.scrollHeight - vh;
      bar.style.transform = "scaleX(" + (total > 0 ? Math.min(1, y / total) : 0) + ")";
    }
    pls.forEach(function (p) {
      var r = p.parentNode.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40) return;
      var off = (r.top + r.height / 2 - vh / 2) / vh;
      p.style.setProperty("--py", (off * -r.height * 0.07).toFixed(1) + "px");
    });
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onFrame);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onFrame();
  window.__ackReady = true;

  var year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  /* Contact forms */
  $$(".contact-form").forEach(function (form) {
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
  });
})();
