// Builds every page of the site from content.mjs, so the header, footer and SEO stay consistent. Run: node tools/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LINE, CAPABILITIES, FAQ, STEPS, WAYS, ARTICLES } from "./content.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://ackermancommunications.com";
const UPDATED = "November 2026";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&rsquo;");
const HEIGHTS = { brick: 409, tower: 506, news: 596, lighthouse: 588, voice: 675, work: 601, london: 601, marking: 601 };
const rawImg = (name, alt, sizes, eager) =>
  `<img src="/assets/img/${name}-900.webp" srcset="/assets/img/${name}-900.webp 900w, /assets/img/${name}-1800.webp 1800w" sizes="${sizes}" width="900" height="${HEIGHTS[name] || 600}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}>`;
// Every photo sits in a box that handles its reveal and hover zoom. Parallax adds one inner layer.
const img = (name, alt, sizes, eager = false, parallax = false) =>
  `<span class="imgbox">${parallax ? `<span class="pl">${rawImg(name, alt, sizes, eager)}</span>` : rawImg(name, alt, sizes, eager)}</span>`;

const COMPANY = [["About us", "/about"], ["Why Ackerman", "/why-ackerman"], ["Our approach", "/approach"], ["How we work", "/how-we-work"], ["FAQ", "/faq"]];
const LEGAL = [["Privacy policy", "/privacy"], ["Terms of use", "/terms"], ["Cookies", "/cookies"], ["Accessibility", "/accessibility"]];

function header(current) {
  const on = (key) => (current === key ? ' aria-current="page"' : "");
  const capLinks = CAPABILITIES.map((c) => `<a href="/capabilities/${c.slug}">${esc(c.name)}</a>`).join("");
  return `<header class="top">
  <div class="wrap top__in">
    <a class="top__logo" href="/" aria-label="Ackerman Communications, home"><img src="/assets/ackerman-logo-ink.svg" alt="" width="439" height="88"></a>
    <button class="top__menu" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="top__nav" id="nav" aria-label="Main">
      <div class="dd">
        <button class="dd__btn" type="button" aria-expanded="false"${current === "capabilities" ? ' data-current="true"' : ""}>Capabilities<i aria-hidden="true"></i></button>
        <div class="dd__menu dd__menu--wide"><a class="dd__all" href="/capabilities">All capabilities</a>${capLinks}</div>
      </div>
      <div class="dd">
        <button class="dd__btn" type="button" aria-expanded="false"${current === "company" ? ' data-current="true"' : ""}>Company<i aria-hidden="true"></i></button>
        <div class="dd__menu">${COMPANY.map(([n, h]) => `<a href="${h}">${n}</a>`).join("")}</div>
      </div>
      <a class="top__link" href="/insights"${on("insights")}>Insights</a>
      <a class="btn btn--small" href="/contact">Let&rsquo;s talk</a>
    </nav>
  </div>
</header>`;
}

const FOOTER = `<footer class="foot">
  <div class="wrap">
    <div class="foot__grid">
      <div class="foot__brand">
        <img class="foot__logo" src="/assets/ackerman-logo-white.svg" alt="Ackerman Communications" width="439" height="88" loading="lazy">
        <p class="foot__tag">Build Authority. Earn Visibility. Protect Your Reputation.</p>
        <p class="foot__where">Strategic communications across the USA &amp; UK</p>
        <a class="btn btn--light" href="/contact">Let&rsquo;s talk</a>
      </div>
      <div><h2>Capabilities</h2><ul>${CAPABILITIES.map((c) => `<li><a href="/capabilities/${c.slug}">${esc(c.name)}</a></li>`).join("")}</ul></div>
      <div>
        <h2>Company</h2><ul>${COMPANY.map(([n, h]) => `<li><a href="${h}">${n}</a></li>`).join("")}<li><a href="/insights">Insights</a></li><li><a href="/contact">Contact</a></li></ul>
        <h2 class="foot__h2b">Legal</h2><ul>${LEGAL.map(([n, h]) => `<li><a href="${h}">${n}</a></li>`).join("")}</ul>
      </div>
    </div>
    <div class="foot__row"><span>&copy; <span data-year>2026</span> Ackerman Communications. All rights reserved.</span><a href="#main">Back to top</a></div>
  </div>
</footer>`;

const CONTACT_FORM = (id = "contact-form") => `<form class="form contact-form" id="${id}" novalidate>
        <div class="field"><label for="${id}-name">Your name</label><input id="${id}-name" name="name" type="text" autocomplete="name" required></div>
        <div class="field"><label for="${id}-email">Work email</label><input id="${id}-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="${id}-msg">How can we help?</label><textarea id="${id}-msg" name="message" rows="4" required></textarea></div>
        <button class="btn" type="submit">Send message</button>
        <p class="form__consent">We&rsquo;ll only use your details to reply to you. See our <a href="/privacy">privacy policy</a>.</p>
        <p class="form__note" role="status" aria-live="polite"></p>
      </form>`;

const CTA = `<section class="cta">
    <div class="wrap cta__in">
      <h2>Have something important to say?</h2>
      <p>Let&rsquo;s make sure the right audience hears it, and understands why it matters.</p>
      <a class="btn btn--light" href="/contact">Start a conversation</a>
    </div>
  </section>`;

const pages = [];
function page({ route, title, desc, current = "", crumbs = null, body, jsonld = [], image = "/assets/og.png" }) {
  const canonical = SITE_URL + (route === "/" ? "/" : route);
  const fullTitle = route === "/" ? title : `${title} | Ackerman Communications`;
  const trail = crumbs
    ? `<nav class="crumbs" aria-label="Breadcrumb"><div class="wrap"><ol><li><a href="/">Home</a></li>${crumbs.map(([n, h]) => (h ? `<li><a href="${h}">${esc(n)}</a></li>` : `<li aria-current="page">${esc(n)}</li>`)).join("")}</ol></div></nav>`
    : "";
  const data = [...jsonld];
  if (crumbs) {
    data.push({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [["Home", "/"], ...crumbs].map(([n, h], i) => ({ "@type": "ListItem", position: i + 1, name: n, ...(h ? { item: SITE_URL + h } : {}) })),
    });
  }
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle).replace(/&rsquo;/g, "'")}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#F8F5EF">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ackerman Communications">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/ackerman-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/ackerman-icon-180.png">
<link rel="preload" href="/assets/fonts/newsreader.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/schibsted.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/style.css">
<script src="/js/early.js"></script>
${data.map((d) => `<script type="application/ld+json">${JSON.stringify(d)}</script>`).join("\n")}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${header(current)}
${trail}
<main id="main">
${body}
</main>
${FOOTER}
<script src="/js/main.js" defer></script>
</body>
</html>
`;
  const file = route === "/" ? "index.html" : route.slice(1) + ".html";
  const out = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  if (route !== "/404") pages.push(route);
}

const pageHead = (eyebrow, h1, lede) => `<section class="ph">
    <div class="wrap">
      <p class="eyebrow">${eyebrow}</p>
      <h1 data-words>${h1}</h1>
      ${lede ? `<p class="lede">${lede}</p>` : ""}
    </div>
  </section>`;

const stepList = (list, start = 1) => `<ol class="steps"${start > 1 ? ` start="${start}"` : ""}>${list.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join("")}</ol>`;
const approachGrid = `<div class="approach__grid">
        <div class="fade"><p class="approach__phase">We start with</p>${stepList(STEPS.start)}</div>
        <div class="fade"><p class="approach__phase">We then develop</p>${stepList(STEPS.develop, 5)}</div>
      </div>`;
const articleCard = (a, _i, _all, level = 3) => `<article class="card fade"><a href="/insights/${a.slug}">${img(a.image, a.alt, "(max-width: 800px) 100vw, 33vw")}<h${level}>${esc(a.title)}</h${level}><p>${esc(a.summary)}</p><span class="more">Read article</span></a></article>`;
const reachGrid = `<div class="reach__grid">
        <figure class="fade">${img("nyc", "The Manhattan skyline at dusk, seen across the East River", "(max-width: 700px) 100vw, 50vw", false, true)}<figcaption>United States</figcaption></figure>
        <figure class="fade">${img("london", "Tower Bridge in London at dusk", "(max-width: 700px) 100vw, 50vw", false, true)}<figcaption>United Kingdom</figcaption></figure>
      </div>`;

/* Home */
page({
  route: "/", title: "Ackerman Communications | Build Authority. Earn Visibility. Protect Your Reputation.",
  desc: `${LINE} We work across the USA and UK.`,
  jsonld: [{ "@context": "https://schema.org", "@type": "Organization", name: "Ackerman Communications", url: SITE_URL, description: "Strategic communications and public relations across the USA and UK.", areaServed: ["United States", "United Kingdom"], logo: `${SITE_URL}/assets/ackerman-icon-180.png` }],
  body: `<section class="hero">
    <div class="wrap hero__in">
      <div class="hero__text">
        <p class="eyebrow">Strategic communications &amp; PR &middot; USA &amp; UK</p>
        <h1 data-words>Your reputation is working before you ever enter <em>the room.</em></h1>
        <p class="lede">${LINE}</p>
        <div class="hero__cta">
          <a class="btn" href="/contact">Start a conversation</a>
          <a class="link" href="/capabilities">See our capabilities</a>
        </div>
      </div>
      <figure class="hero__img">
<span class="imgbox"><span class="pl"><img src="/assets/img/room-1800.webp" srcset="/assets/img/room-900.webp 900w, /assets/img/room-1800.webp 1800w" sizes="(max-width: 960px) 100vw, 50vw" width="1800" height="1200" alt="A bright, empty boardroom with a long table and tall windows" fetchpriority="high"></span></span>
      </figure>
    </div>
  </section>

  <section class="belief">
    <div class="wrap wrap--narrow fade">
      <p class="eyebrow">What we believe</p>
      <p class="belief__text" data-words>We believe PR should do more than generate media mentions. It should strengthen credibility, shape perception, position leaders as trusted voices, and create meaningful visibility around the moments that matter.</p>
    </div>
  </section>

  <section class="pillars">
    <div class="wrap">
      <div class="pillars__grid">
        <article class="pillar fade">${img("voice", "A classic steel microphone against a dark background", "(max-width: 800px) 100vw, 33vw")}<h2>Build Authority.</h2><p>Position leaders as trusted voices, with a point of view people want to hear.</p></article>
        <article class="pillar fade">${img("news", "A person in a suit opening the business section of a newspaper", "(max-width: 800px) 100vw, 33vw")}<h2>Earn Visibility.</h2><p>Meaningful presence around the moments that matter, not media volume for its own sake.</p></article>
        <article class="pillar fade">${img("lighthouse", "A lighthouse standing firm beneath a stormy sky", "(max-width: 800px) 100vw, 33vw")}<h2>Protect Your Reputation.</h2><p>Shape perception before it hardens, and be ready when the story turns.</p></article>
      </div>
    </div>
  </section>

  <section class="caps">
    <div class="wrap">
      <div class="head fade">
        <p class="eyebrow eyebrow--light">Capabilities</p>
        <h2>How we help.</h2>
      </div>
      <ol class="caps__list">${CAPABILITIES.map((c) => `<li><a href="/capabilities/${c.slug}"><h3>${esc(c.name)}</h3><p>${esc(c.short)}</p></a></li>`).join("")}</ol>
    </div>
  </section>

  <section class="approach">
    <div class="wrap">
      <div class="head fade">
        <p class="eyebrow">Our approach</p>
        <h2>It starts with your business.</h2>
      </div>
      ${approachGrid}
    </div>
  </section>

  <section class="why">
    <div class="wrap why__in">
      <figure class="why__img fade">${img("work", "A consultant working at a laptop at a wooden table beside a window", "(max-width: 960px) 100vw, 45vw")}</figure>
      <div class="why__text fade">
        <p class="eyebrow">Why Ackerman</p>
        <h2>Senior-level expertise, without the cost and complexity of a large in-house department.</h2>
        <p>We work as a flexible extension of your team, providing strategic counsel, communications expertise, media relationships, and campaign execution when and where you need it.</p>
        <ul class="ticks">
          <li>Business-first</li>
          <li>Research-led</li>
          <li>Proactive and reactive</li>
          <li>Focused on relevance, credibility and long-term reputation, rather than media volume alone</li>
        </ul>
        <a class="link why__more" href="/why-ackerman">Why clients choose a flexible partner</a>
      </div>
    </div>
  </section>

  <section class="reach">
    <div class="wrap">
      <div class="head fade">
        <p class="eyebrow">Where we work</p>
        <h2>Across the USA and UK.</h2>
        <p class="reach__note">Helping organizations turn expertise and important business moments into opportunities for greater visibility, credibility, and influence.</p>
      </div>
      ${reachGrid}
    </div>
  </section>

  <section class="insights-strip">
    <div class="wrap">
      <div class="head head--row fade">
        <div><p class="eyebrow">Insights</p><h2>Thinking on reputation.</h2></div>
        <a class="link" href="/insights">All insights</a>
      </div>
      <div class="cards">${ARTICLES.map(articleCard).join("")}</div>
    </div>
  </section>

  <section class="contact">
    <div class="wrap contact__in">
      <div class="contact__ask">
        <p class="eyebrow eyebrow--light">Let&rsquo;s talk</p>
        <h2>Have something important to say?</h2>
        <p>Let&rsquo;s make sure the right audience hears it, and understands why it matters.</p>
      </div>
      ${CONTACT_FORM("home-form")}
    </div>
  </section>`,
});

/* About */
page({
  route: "/about", title: "About us", current: "company", crumbs: [["About us"]],
  desc: "Ackerman Communications helps organizations build authority, earn visibility, and protect their reputation across the USA and UK.",
  body: `${pageHead("About us", "Your reputation is working before you ever enter <em>the room.</em>", LINE)}
  <section class="split">
    <div class="wrap split__in">
      <figure class="fade">${img("brick", "A meeting table and chairs in a warm room with tall arched windows beyond", "(max-width: 960px) 100vw, 50vw", true)}</figure>
      <div class="prose fade">
        <h2>What we believe</h2>
        <p>We believe PR should do more than generate media mentions. It should strengthen credibility, shape perception, position leaders as trusted voices, and create meaningful visibility around the moments that matter.</p>
        <p>We work across the USA and UK, helping organizations turn expertise and important business moments into opportunities for greater visibility, credibility, and influence.</p>
      </div>
    </div>
  </section>
  <section class="values">
    <div class="wrap">
      <div class="head fade"><p class="eyebrow">How we think</p><h2>What guides our work.</h2></div>
      <div class="values__grid">
        <div class="fade"><h3>Business-first</h3><p>Communications should serve what the business is trying to achieve, so that's where we start.</p></div>
        <div class="fade"><h3>Research-led</h3><p>We look at your audience, market and reputation before we recommend anything.</p></div>
        <div class="fade"><h3>Proactive and reactive</h3><p>We plan ahead for the moments that matter, and respond when the unexpected arrives.</p></div>
        <div class="fade"><h3>Relevance over volume</h3><p>We focus on relevance, credibility and long-term reputation, rather than media volume alone.</p></div>
      </div>
    </div>
  </section>
  <section class="reach">
    <div class="wrap">
      <div class="head fade"><p class="eyebrow">Where we work</p><h2>Across the USA and UK.</h2></div>
      ${reachGrid}
    </div>
  </section>
  ${CTA}`,
});

/* Why Ackerman */
page({
  route: "/why-ackerman", title: "Why Ackerman", current: "company", crumbs: [["Why Ackerman"]],
  desc: "Senior-level strategic communications expertise, without the cost and complexity of building a large in-house communications department.",
  body: `${pageHead("Why Ackerman", "Senior-level expertise, without the cost and complexity.", "You get senior-level strategic communications expertise without the cost and complexity of building a large in-house communications department.")}
  <section class="split">
    <div class="wrap split__in">
      <figure class="fade">${img("office", "A person working at a desk in a bright, characterful office", "(max-width: 960px) 100vw, 50vw", true)}</figure>
      <div class="prose fade">
        <h2>A flexible extension of your team</h2>
        <p>We provide what you need, when and where you need it:</p>
        <ul class="ticks">
          <li>Strategic counsel</li>
          <li>Communications expertise</li>
          <li>Media relationships</li>
          <li>Campaign execution</li>
        </ul>
      </div>
    </div>
  </section>
  <section class="values">
    <div class="wrap">
      <div class="head fade"><p class="eyebrow">Our approach</p><h2>What makes us different.</h2></div>
      <div class="values__grid">
        <div class="fade"><h3>Business-first</h3><p>We start with what the business needs, not with a list of outlets.</p></div>
        <div class="fade"><h3>Research-led</h3><p>Our recommendations come from understanding your audience, market and reputation.</p></div>
        <div class="fade"><h3>Proactive and reactive</h3><p>We help you plan for important moments and respond quickly to unexpected ones.</p></div>
        <div class="fade"><h3>Long-term focus</h3><p>We care about relevance, credibility and long-term reputation, rather than media volume alone.</p></div>
      </div>
    </div>
  </section>
  ${CTA}`,
});

/* Approach */
page({
  route: "/approach", title: "Our approach", current: "company", crumbs: [["Our approach"]],
  desc: "Our approach starts with your business objectives, audience, market and reputation goals. We then develop the right narrative, positioning, strategy and media opportunities.",
  body: `${pageHead("Our approach", "It starts with your business.", "Our approach starts with your business objectives, audience, market, and reputation goals. We then develop the right narrative, positioning, communications strategy, and media opportunities around them.")}
  <section class="approach"><div class="wrap">${approachGrid.replace(/<p class="approach__phase">([^<]+)<\/p>/g, '<h2 class="approach__phase">$1</h2>')}</div></section>
  ${CTA}`,
});

/* How we work */
page({
  route: "/how-we-work", title: "How we work", current: "company", crumbs: [["How we work"]],
  desc: "Work with Ackerman Communications as a flexible extension of your team: ongoing counsel, focused campaigns and launches, or support when something goes wrong.",
  body: `${pageHead("How we work", "Support that fits what you need.", "We work as a flexible extension of your team, providing strategic counsel, communications expertise, media relationships, and campaign execution when and where you need it.")}
  <section class="pillars">
    <div class="wrap">
      <div class="pillars__grid">${WAYS.map(([t, d, im], i) => `<article class="pillar fade">${img(im, t, "(max-width: 800px) 100vw, 33vw", i === 0)}<h2>${esc(t)}</h2><p>${esc(d)}</p></article>`).join("")}</div>
    </div>
  </section>
  <section class="values">
    <div class="wrap wrap--narrow prose fade">
      <h2>Talk to us about scope</h2>
      <p>Every engagement starts from your objectives, so we scope and quote each one individually. Tell us what you're working on, and we'll suggest what would make sense.</p>
      <a class="btn" href="/contact">Start a conversation</a>
    </div>
  </section>`,
});

/* Capabilities index and details */
page({
  route: "/capabilities", title: "Capabilities", current: "capabilities", crumbs: [["Capabilities"]],
  desc: "Strategic communications, media relations, thought leadership, corporate communications, reputation management, crisis communications, storytelling, digital PR, reactive communications and launch PR.",
  body: `${pageHead("Capabilities", "How we help.", "From long-term reputation to the moment a story breaks, here's what we do.")}
  <section class="capgrid">
    <div class="wrap">
      <div class="cards cards--cap">${CAPABILITIES.map((c, i) => `<article class="card fade"><a href="/capabilities/${c.slug}">${img(c.image, c.alt, "(max-width: 800px) 100vw, 33vw", i < 3)}<span class="card__tag">${c.pillar === "Protect" ? "Protect" : c.pillar}</span><h2>${esc(c.name)}</h2><p>${esc(c.short)}</p><span class="more">Learn more</span></a></article>`).join("")}</div>
    </div>
  </section>
  ${CTA}`,
});
CAPABILITIES.forEach((c, i) => {
  const others = CAPABILITIES.filter((o) => o !== c && o.pillar === c.pillar).slice(0, 3);
  page({
    route: `/capabilities/${c.slug}`, title: c.name, current: "capabilities", crumbs: [["Capabilities", "/capabilities"], [c.name]],
    desc: `${c.short} ${c.intro}`.slice(0, 158),
    jsonld: [{ "@context": "https://schema.org", "@type": "Service", name: c.name, description: c.intro, serviceType: "Public relations", provider: { "@type": "Organization", name: "Ackerman Communications", url: SITE_URL }, areaServed: ["United States", "United Kingdom"] }],
    body: `<section class="ph ph--split">
    <div class="wrap ph__in">
      <div>
        <p class="eyebrow">${c.pillar === "Protect" ? "Protect your reputation" : c.pillar === "Authority" ? "Build authority" : "Earn visibility"}</p>
        <h1 data-words>${esc(c.name)}</h1>
        <p class="lede">${esc(c.intro)}</p>
        <a class="btn ph__btn" href="/contact">Talk to us about this</a>
      </div>
      <figure>${img(c.image, c.alt, "(max-width: 960px) 100vw, 50vw", true)}</figure>
    </div>
  </section>
  <section class="values">
    <div class="wrap twocol">
      <div class="fade"><h2>What it covers</h2><ul class="ticks">${c.covers.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="fade"><h2>When it helps</h2><ul class="ticks">${c.when.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    </div>
  </section>
  <section class="related">
    <div class="wrap">
      <div class="head head--row fade"><h2>Related capabilities</h2><a class="link" href="/capabilities">All capabilities</a></div>
      <div class="cards">${(others.length ? others : CAPABILITIES.filter((o) => o !== c).slice(0, 3)).map((o) => `<article class="card fade"><a href="/capabilities/${o.slug}">${img(o.image, o.alt, "(max-width: 800px) 100vw, 33vw")}<h3>${esc(o.name)}</h3><p>${esc(o.short)}</p></a></article>`).join("")}</div>
    </div>
  </section>
  ${CTA}`,
  });
});

/* Insights */
page({
  route: "/insights", title: "Insights", current: "insights", crumbs: [["Insights"]],
  desc: "Thinking on reputation, media and strategic communications from Ackerman Communications.",
  body: `${pageHead("Insights", "Thinking on reputation.", "Practical perspectives on media, reputation and communicating when it matters.")}
  <section class="capgrid"><div class="wrap"><div class="cards">${ARTICLES.map((a) => articleCard(a, 0, 0, 2)).join("")}</div></div></section>
  ${CTA}`,
});
ARTICLES.forEach((a) => {
  const others = ARTICLES.filter((o) => o !== a);
  page({
    route: `/insights/${a.slug}`, title: a.title, current: "insights", crumbs: [["Insights", "/insights"], [a.title]], desc: a.summary,
    jsonld: [{ "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.summary, publisher: { "@type": "Organization", name: "Ackerman Communications" }, author: { "@type": "Organization", name: "Ackerman Communications" } }],
    body: `<div class="progress" aria-hidden="true"><i></i></div>
  <article class="article">
    <header class="wrap wrap--read article__head">
      <p class="eyebrow">Insights</p>
      <h1 data-words>${esc(a.title)}</h1>
      <p class="lede">${esc(a.summary)}</p>
    </header>
    <figure class="wrap article__img">${img(a.image, a.alt, "(max-width: 1280px) 100vw, 1200px", true)}</figure>
    <div class="wrap wrap--read prose">${a.body.map(([t, s]) => `<${t}>${esc(s)}</${t}>`).join("")}</div>
  </article>
  <section class="related">
    <div class="wrap">
      <div class="head head--row fade"><h2>Keep reading</h2><a class="link" href="/insights">All insights</a></div>
      <div class="cards cards--two">${others.map(articleCard).join("")}</div>
    </div>
  </section>
  ${CTA}`,
  });
});

/* FAQ */
page({
  route: "/faq", title: "Frequently asked questions", current: "company", crumbs: [["FAQ"]],
  desc: "Answers to common questions about working with Ackerman Communications, including where we work and how we start.",
  jsonld: [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }],
  body: `${pageHead("FAQ", "Frequently asked questions.", "")}
  <section class="faq"><div class="wrap wrap--read">${FAQ.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></section>
  ${CTA}`,
});

/* Contact */
page({
  route: "/contact", title: "Contact us", crumbs: [["Contact"]],
  desc: "Have something important to say? Get in touch with Ackerman Communications about strategic communications and public relations across the USA and UK.",
  body: `<section class="contact contact--page">
    <div class="wrap contact__in">
      <div class="contact__ask">
        <p class="eyebrow eyebrow--light">Contact</p>
        <h1 data-words>Have something important to say?</h1>
        <p>Let&rsquo;s make sure the right audience hears it, and understands why it matters.</p>
        <dl class="contact__facts">
          <div><dt>Where we work</dt><dd>USA and UK</dd></div>
          <div><dt>Common questions</dt><dd><a href="/faq">Read our FAQ</a></dd></div>
        </dl>
      </div>
      ${CONTACT_FORM()}
    </div>
  </section>`,
});

/* Legal */
const legal = (route, title, desc, html) => page({ route, title, desc, crumbs: [[title]], body: `${pageHead("Legal", esc(title), `Last updated: ${UPDATED}`)}<section class="faq"><div class="wrap wrap--read prose">${html}</div></section>` });

legal("/privacy", "Privacy policy", "How Ackerman Communications handles personal information submitted through this website.", `
<p>This policy explains how Ackerman Communications (&ldquo;we&rdquo;) handles personal information when you use this website.</p>
<h2>What we collect</h2>
<p>We collect the information you choose to send us through our contact form: your name, work email address, and your message. We don&rsquo;t use this website to collect anything else about you, and we don&rsquo;t use analytics or advertising trackers on it.</p>
<h2>How we use it</h2>
<p>We use your details to reply to your enquiry and to keep a record of our correspondence with you. We don&rsquo;t sell your information, or use it for marketing without your permission.</p>
<h2>Legal basis (UK)</h2>
<p>Under UK data protection law, we rely on our legitimate interests in responding to enquiries or, where relevant, on steps you ask us to take before entering into a contract.</p>
<h2>Who can see it</h2>
<p>We only share your information with service providers who help us run this website and manage correspondence, such as our hosting provider, or where the law requires it.</p>
<h2>How long we keep it</h2>
<p>We keep enquiries only for as long as we need them for the purposes above, then delete them.</p>
<h2>Your rights</h2>
<p>Depending on where you live, including the UK and certain US states, you may have the right to access, correct, or delete your personal information, and to object to how we use it. UK residents may also complain to the Information Commissioner&rsquo;s Office. To make a request, please use our <a href="/contact">contact page</a>.</p>
<h2>Changes</h2>
<p>We may update this policy from time to time. The date at the top of this page shows when it last changed.</p>`);

legal("/terms", "Terms of use", "The terms that apply when you use the Ackerman Communications website.", `
<p>By using this website, you agree to these terms.</p>
<h2>Information on this site</h2>
<p>The content here is general information about our services and perspectives. It isn&rsquo;t professional or legal advice for your particular situation, and it doesn&rsquo;t create a client relationship. Any engagement with us will be covered by a separate written agreement.</p>
<h2>Intellectual property</h2>
<p>The text, design and branding on this website belong to Ackerman Communications or those who license them to us. Please don&rsquo;t reproduce them without our permission, except for your own personal reference or as the law allows.</p>
<h2>Using this site</h2>
<p>Please don&rsquo;t misuse the site, attempt to disrupt it, or use it for anything unlawful.</p>
<h2>Liability</h2>
<p>We work to keep this website accurate and available, but we can&rsquo;t promise it will always be complete or uninterrupted. To the extent the law allows, we aren&rsquo;t liable for losses arising from your use of it. Nothing here limits liability that can&rsquo;t be limited by law.</p>
<h2>Changes</h2>
<p>We may update these terms from time to time. The date at the top of this page shows when they last changed.</p>`);

legal("/cookies", "Cookies", "This website does not set cookies or use tracking technologies.", `
<p><strong>This website doesn&rsquo;t set cookies.</strong> We don&rsquo;t use analytics, advertising or social media trackers, and our fonts are served from this site rather than a third party. That&rsquo;s why you don&rsquo;t see a cookie banner.</p>
<p>If that changes, we&rsquo;ll update this page and ask for your consent where the law requires it.</p>`);

legal("/accessibility", "Accessibility", "Ackerman Communications wants this website to be usable by everyone.", `
<p>We want this website to be usable by as many people as possible, and we aim to follow the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA.</p>
<h2>What we&rsquo;ve done</h2>
<ul>
<li>The site can be navigated by keyboard, with a skip link and visible focus</li>
<li>Images have text descriptions</li>
<li>Pages use clear headings and can be resized</li>
<li>Animation is minimal, and switches off if your device asks for reduced motion</li>
</ul>
<h2>Tell us about a problem</h2>
<p>If anything on this site is difficult to use, please let us know through our <a href="/contact">contact page</a>, and we&rsquo;ll do our best to help.</p>`);

/* 404 */
page({
  route: "/404", title: "Page not found", desc: "The page you're looking for couldn't be found.",
  body: `<section class="ph ph--404">
    <div class="wrap">
      <p class="eyebrow">Page not found</p>
      <h1 data-words>That page isn&rsquo;t in <em>the room.</em></h1>
      <p class="lede">It may have moved, or the link may be out of date.</p>
      <div class="hero__cta"><a class="btn" href="/">Back to home</a><a class="link" href="/capabilities">See our capabilities</a></div>
    </div>
  </section>`,
});

/* Sitemap */
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((r) => `  <url><loc>${SITE_URL}${r}</loc></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`${pages.length} pages built`);
