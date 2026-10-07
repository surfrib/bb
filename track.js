/* Affiliate UX: outbound click tracking + sticky CTA reveal.

   Click tracking uses Simple Analytics custom events.
   Without this there is no way to measure click-through per product, per page
   or per placement -- which makes every layout change unmeasurable guesswork.

   Events fire as amazon_<placement> with the product slug as metadata:
     amazon_destaque | amazon_grelha | amazon_tabela | amazon_artigo | amazon_sticky
*/
(function () {
  'use strict';

  // Documented Simple Analytics pattern: queue events fired before the
  // analytics script finishes loading, so early clicks are not lost.
  window.sa_event = window.sa_event || function () {
    var args = [].slice.call(arguments);
    (window.sa_event.q = window.sa_event.q || []).push(args);
  };

  function slug(text) {
    return (text || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  function productName(link) {
    var scope = link.closest('.product-card, .article-product-card, tr, .sticky-cta');
    var name = scope && scope.querySelector('.product-name, .apc-name, .ct-product, .sticky-cta-label');
    if (!name) return link.textContent.trim();

    // In the comparison table the brand lives in a nested <small>, which would
    // otherwise run straight into the product name with no separator.
    var copy = name.cloneNode(true);
    var small = copy.querySelector('small');
    if (small) small.remove();

    return copy.textContent
      .replace(/^\s*A nossa escolha:\s*/i, '')  // sticky bar carries a label prefix
      .replace(/\s+/g, ' ')
      .trim();
  }

  function placement(link) {
    if (link.closest('.sticky-cta')) return 'sticky';
    if (link.closest('.compare-table')) return 'tabela';
    if (link.closest('.product-card--featured')) return 'destaque';
    if (link.closest('.article-product-card')) return 'artigo';
    if (link.closest('.product-card')) return 'grelha';
    return 'outro';
  }

  // Covers the Associates short domain plus the link.amazon and storefront
  // forms, so a change of link format does not silently stop measurement.
  var OUTBOUND = 'a[href*="amzn.to"], a[href*="amzn.eu"], a[href*="link.amazon"], a[href*="amazon.es"], a[href*="amazon.pt"]';

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest(OUTBOUND);
    if (!link) return;
    window.sa_event('amazon_' + placement(link), {
      produto: slug(productName(link)),
      pagina: location.pathname
    });
  }, true);
})();

/* Sticky CTA reveal.
   The bar stays off-screen until the hero has scrolled away, so it never
   competes with the primary hero call to action on the first screen.
   A passive scroll listener rather than IntersectionObserver: the toggle is a
   single class and this behaves predictably in every rendering context. */
(function () {
  'use strict';
  var bar = document.querySelector('.sticky-cta');
  var hero = document.querySelector('.hero, .page-hero, .article-hero');
  if (!bar || !hero) return;

  var queued = false;

  function update() {
    queued = false;
    var past = hero.getBoundingClientRect().bottom <= 40;
    bar.classList.toggle('is-visible', past);
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();

/* Comparison table starts collapsed on phones.
   The `open` attribute ships in the HTML so crawlers and no-JS visitors get the
   full table; this only closes it where the stacked rows would otherwise add
   thousands of pixels of scroll on top of the product cards below. */
(function () {
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(max-width: 600px)').matches) return;
  document.querySelectorAll('.compare-collapse[open]').forEach(function (el) {
    el.removeAttribute('open');
  });
})();
