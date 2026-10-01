/* Демо «PRIME»: скролл-история, каталог с фильтрами, быстрый просмотр,
   поиск-палитра, 3D-карта оплаты, превью услуг за курсором */
(function () {
  var D = MS.data, fmt = MS.fmt;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches && !MS.reduced;

  /* ---------- шапка ---------- */
  var header = $('.header'), hero = $('.hero');
  function onScroll() { header.classList.toggle('solid', scrollY > hero.offsetHeight - 120); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var mnav = $('.mnav');
  function menu(on) { mnav.classList.toggle('open', on); mnav.setAttribute('aria-hidden', String(!on)); document.documentElement.classList.toggle('ms-lock', on); }
  $('.burger').addEventListener('click', function () { menu(true); });
  $('.mnav-x').addEventListener('click', function () { menu(false); });
  $$('.mnav a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });

  /* ---------- курсор ---------- */
  if (finePointer) {
    var cur = $('.cursor'), cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); });
    document.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
    document.addEventListener('mouseover', function (e) { cur.classList.toggle('big', !!e.target.closest('a, button, select, input, label')); });
    (function loop() { cx += (tx - cx) * .2; cy += (ty - cy) * .2; cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(loop); })();
  }

  /* ---------- поиск: общая выдача ---------- */
  function norm(s) { return s.toLowerCase().replace(/[\s.,\-\/]/g, ''); }
  function search(q) {
    q = norm(q); if (!q) return [];
    return D.products.filter(function (p) { return norm(p.name + p.size + p.brand + p.axle + p.cat).indexOf(q) > -1; });
  }
  function resHtml(list, q) {
    if (!list.length) return '<div class="res-empty">По запросу «' + q.replace(/</g, '') + '» ничего нет — привезём под заказ. <button type="button" class="link" data-callback="Заказ под размер: ' + q.replace(/[<"]/g, '') + '">Оставить заявку</button></div>';
    return '<div class="res-title">Найдено: ' + list.length + '</div>' + list.slice(0, 7).map(function (p) {
      return '<div class="res-item" data-qv="' + p.id + '"><img src="' + MS.img(p) + '" alt=""><div><b>' + p.name + '</b><small>' + p.size + ' · ' + p.axle + '</small></div>' +
        '<span class="res-price">' + fmt(p.price) + '</span><button type="button" class="res-add" data-add="' + p.id + '" aria-label="В корзину"><svg class="i"><use href="#i-cart"/></svg></button></div>';
    }).join('');
  }
  // поиск в hero
  var hs = $('[data-hero-search]'), hsRes = $('.hs-res');
  function heroSearch() {
    var q = hs.value.trim();
    hsRes.hidden = !q; if (q) hsRes.innerHTML = resHtml(search(q), q);
  }
  hs.addEventListener('input', heroSearch);
  hs.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applySearch(hs.value); } });
  $('[data-hero-go]').addEventListener('click', function () { applySearch(hs.value); });
  $$('[data-hint]').forEach(function (b) { b.addEventListener('click', function () { hs.value = b.getAttribute('data-hint'); heroSearch(); hs.focus(); }); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.hero-search')) hsRes.hidden = true; });

  // палитра
  var pal = $('.palette'), palIn = $('.palette input'), palRes = $('[data-res]');
  function palette(on) {
    pal.classList.toggle('open', on); pal.setAttribute('aria-hidden', String(!on)); document.documentElement.classList.toggle('ms-lock', on);
    if (on) { palIn.value = ''; palRes.innerHTML = popular(); setTimeout(function () { palIn.focus(); }, 50); }
  }
  function popular() {
    var hits = D.products.filter(function (p) { return p.tag === 'Хит'; });
    return '<div class="res-title">Популярное</div>' + resHtml(hits, '').replace(/<div class="res-title">[^<]*<\/div>/, '');
  }
  $$('[data-palette]').forEach(function (b) { b.addEventListener('click', function () { palette(true); }); });
  pal.addEventListener('click', function (e) { if (e.target === pal) palette(false); });
  palIn.addEventListener('input', function () { palRes.innerHTML = palIn.value.trim() ? resHtml(search(palIn.value), palIn.value) : popular(); });
  palIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { applySearch(palIn.value); palette(false); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { palette(false); qvClose(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette(true); }
  });

  /* ---------- скролл-история ---------- */
  var range = $('.range'), tire = $('.ptire'), panels = $$('.rpanel'), imgs = $$('.stage-img'), bar = $('.stage-bar'), num = $('[data-stage-num]');
  var active = 0;
  function setActive(i) {
    if (i === active) return; active = i;
    panels.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
    imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
    num.textContent = '0' + (i + 1);
  }
  function rangeScroll() {
    var r = range.getBoundingClientRect(), total = r.height - innerHeight;
    var p = Math.min(Math.max(-r.top / (total || 1), 0), 1);
    tire.style.setProperty('--rot', (p * 900) + 'deg');
    bar.style.setProperty('--p', p);
    var mid = innerHeight * .55, best = 0, bestD = Infinity;
    panels.forEach(function (pn, k) { var b = pn.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mid); if (d < bestD) { bestD = d; best = k; } });
    setActive(best);
  }
  addEventListener('scroll', rangeScroll, { passive: true }); rangeScroll();

  /* ---------- каталог ---------- */
  var st = { cat: 'all', brands: [], diam: '', max: 4600000, sort: 'pop', q: '', view: 'grid', limit: 9 };
  var grid = $('[data-grid]');
  function catCount(id) { return D.products.filter(function (p) { return id === 'all' || p.cat === id; }).length; }
  function uniq(a) { return a.filter(function (v, i) { return v && a.indexOf(v) === i; }); }
  function buildFilters() {
    $('[data-f-cats]').innerHTML = [{ id: 'all', title: 'Все товары' }].concat(D.categories).map(function (c) {
      return '<button type="button" data-fcat="' + c.id + '" class="' + (st.cat === c.id ? 'is-on' : '') + '">' + c.title + '<span>' + catCount(c.id) + '</span></button>';
    }).join('');
    var pool = D.products.filter(function (p) { return st.cat === 'all' || p.cat === st.cat; });
    $('[data-f-brands]').innerHTML = uniq(pool.map(function (p) { return p.brand; })).map(function (b) {
      var n = pool.filter(function (p) { return p.brand === b; }).length;
      return '<label><input type="checkbox" value="' + b + '"' + (st.brands.indexOf(b) > -1 ? ' checked' : '') + '>' + b + '<small>' + n + '</small></label>';
    }).join('');
    $('[data-f-diams]').innerHTML = uniq(pool.map(function (p) { return p.diam; })).sort().map(function (d) {
      return '<button type="button" data-fdiam="' + d + '" class="' + (st.diam === d ? 'is-on' : '') + '">' + d + '</button>';
    }).join('') || '<small class="muted">—</small>';
  }
  function results() {
    var qn = norm(st.q);
    var l = D.products.filter(function (p) {
      return (st.cat === 'all' || p.cat === st.cat) && (!st.brands.length || st.brands.indexOf(p.brand) > -1) &&
        (!st.diam || p.diam === st.diam) && p.price <= st.max && (!qn || norm(p.name + p.size + p.brand + p.axle).indexOf(qn) > -1);
    });
    var pop = function (p) { return (p.tag === 'Хит' ? 1000 : 0) + p.reviews; };
    return l.sort(function (a, b) {
      return st.sort === 'cheap' ? a.price - b.price : st.sort === 'exp' ? b.price - a.price : st.sort === 'rate' ? b.rating - a.rating : pop(b) - pop(a);
    });
  }
  function card(p, i) {
    var tag = p.tag ? '<span class="pc-tag ' + (p.tag === 'Новинка' ? 't-new' : p.tag === 'Скидка' ? 't-sale' : '') + '">' + p.tag + '</span>' : '';
    return '<article class="pcard" data-card data-reveal data-delay="' + (i % 3) * 80 + '">' +
      '<div class="pc-media">' + tag + '<img src="' + MS.img(p) + '" alt="' + p.name + ' ' + p.size + '" loading="lazy">' +
      '<button type="button" class="pc-qv" data-qv="' + p.id + '"><svg class="i"><use href="#i-eye"/></svg>Быстрый просмотр</button></div>' +
      '<div class="pc-body"><div class="pc-meta"><span class="pc-brand">' + p.brand + '</span><span class="pc-rate"><svg class="i"><use href="#i-star"/></svg>' + p.rating.toFixed(1).replace('.', ',') + '</span></div>' +
      '<h3 class="pc-name">' + p.name + '</h3><p class="pc-desc">' + p.desc + '</p>' +
      '<div class="pc-specs"><span>' + p.size + '</span><span>' + p.axle + '</span></div>' +
      '<span class="pc-stock">● В наличии: ' + p.stock + ' шт</span>' +
      '<div class="pc-foot"><div class="pc-price"><b>' + fmt(p.price) + '</b>' + (p.old ? '<s>' + fmt(p.old) + '</s>' : '') + '</div>' +
      '<button type="button" class="pc-add" data-add="' + p.id + '"><svg class="i"><use href="#i-cart"/></svg>В корзину</button></div></div></article>';
  }
  function render() {
    var l = results();
    grid.classList.toggle('list', st.view === 'list');
    $('.r-more').hidden = l.length <= st.limit;
    grid.innerHTML = l.length ? l.slice(0, st.limit).map(card).join('') : '<div class="r-empty"><b>Ничего не найдено</b>Измените фильтры или оставьте заявку — привезём под заказ.</div>';
    $('[data-r-count]').innerHTML = 'Найдено <b>' + l.length + '</b> ' + plural(l.length) + (st.q ? ' по запросу «' + st.q.replace(/</g, '') + '»' : '');
    MS.render(); MS.reveal(grid);
  }
  function plural(n) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? 'товар' : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? 'товара' : 'товаров'; }
  function update() { st.limit = 9; buildFilters(); render(); }
  $('[data-more]').addEventListener('click', function () { st.limit += 9; render(); });

  var fBox = $('.filters');
  fBox.addEventListener('click', function (e) {
    var c = e.target.closest('[data-fcat]'), d = e.target.closest('[data-fdiam]');
    if (c) { st.cat = c.getAttribute('data-fcat'); st.brands = []; st.diam = ''; update(); }
    if (d) { var v = d.getAttribute('data-fdiam'); st.diam = st.diam === v ? '' : v; update(); }
    if (e.target.closest('[data-f-reset]')) { st = Object.assign(st, { cat: 'all', brands: [], diam: '', max: 4600000, q: '' }); price.value = st.max; priceOut(); update(); }
  });
  fBox.addEventListener('change', function (e) {
    if (e.target.type === 'checkbox') { st.brands = $$('[data-f-brands] input:checked').map(function (x) { return x.value; }); update(); }
  });
  var price = $('[data-f-price]');
  function priceOut() {
    $('[data-f-price-out]').textContent = fmt(+price.value);
    price.style.setProperty('--fill', ((price.value - price.min) / (price.max - price.min) * 100) + '%');
  }
  price.addEventListener('input', function () { st.max = +price.value; priceOut(); render(); });
  $('[data-sort]').addEventListener('change', function (e) { st.sort = e.target.value; render(); });
  $$('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () { st.view = b.getAttribute('data-view'); $$('[data-view]').forEach(function (x) { x.classList.toggle('is-on', x === b); }); render(); });
  });
  // мобильная панель фильтров
  $('[data-f-toggle]').addEventListener('click', function (e) { e.stopPropagation(); fBox.classList.add('open'); });
  document.addEventListener('click', function (e) { if (fBox.classList.contains('open') && !e.target.closest('.filters')) fBox.classList.remove('open'); });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-filter]'); if (!a) return;
    st.cat = a.getAttribute('data-filter'); st.brands = []; st.diam = ''; st.q = ''; update();
  });
  function applySearch(q) {
    st.q = q.trim(); st.cat = 'all'; st.brands = []; st.diam = ''; hsRes.hidden = true; update();
    $('#catalog').scrollIntoView({ behavior: 'smooth' });
  }

  /* ---------- быстрый просмотр ---------- */
  var qv = $('.qv');
  function qvOpen(id) {
    var p = MS.byId(id); if (!p) return;
    var cat = D.categories.find(function (c) { return c.id === p.cat; });
    $('.qv-body').innerHTML = '<div class="qv-media"><img src="' + MS.img(p) + '" alt="' + p.name + '"></div>' +
      '<div class="qv-info"><span class="pc-brand">' + p.brand + ' · ' + cat.title + '</span><h3>' + p.name + '</h3><p>' + p.desc + '.</p>' +
      '<dl class="qv-specs"><dt>Размер</dt><dd>' + p.size + '</dd><dt>Назначение</dt><dd>' + p.axle + '</dd>' + (p.diam ? '<dt>Диаметр</dt><dd>' + p.diam + '</dd>' : '') +
      '<dt>Рейтинг</dt><dd>★ ' + p.rating.toFixed(1).replace('.', ',') + ' · ' + p.reviews + ' отзывов</dd><dt>Наличие</dt><dd style="color:#12a86b">' + p.stock + ' шт на складе</dd></dl>' +
      '<div class="qv-price">' + fmt(p.price) + (p.old ? '<s>' + fmt(p.old) + '</s>' : '') + '</div>' +
      '<div class="qv-btns"><button type="button" class="btn btn-grad" data-add="' + p.id + '"><svg class="i"><use href="#i-cart"/></svg><span>В корзину</span></button>' +
      '<button type="button" class="btn btn-line" data-buy="' + p.id + '"><span>Купить в 1 клик</span></button></div></div>';
    qv.classList.add('open'); qv.setAttribute('aria-hidden', 'false'); document.documentElement.classList.add('ms-lock');
  }
  function qvClose() { if (!qv.classList.contains('open')) return; qv.classList.remove('open'); qv.setAttribute('aria-hidden', 'true'); document.documentElement.classList.remove('ms-lock'); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-qv]');
    if (t && !e.target.closest('[data-add]')) { palette(false); hsRes.hidden = true; qvOpen(+t.getAttribute('data-qv')); }
    if (e.target.closest('[data-qv-close]')) qvClose();
    if (e.target.closest('.qv [data-buy]')) qvClose();
  });

  /* ---------- превью услуг за курсором ---------- */
  var prev = $('.svc-preview'), prevImg = $('.svc-preview img');
  if (finePointer) {
    $$('.svc-row').forEach(function (row) {
      row.addEventListener('mouseenter', function () { prevImg.src = row.getAttribute('data-img'); prev.classList.add('on'); });
      row.addEventListener('mouseleave', function () { prev.classList.remove('on'); });
      row.addEventListener('mousemove', function (e) { prev.style.left = (e.clientX + 170) + 'px'; prev.style.top = e.clientY + 'px'; });
    });
  }

  /* ---------- 3D-карта оплаты ---------- */
  var c3 = $('.card3d'), c3w = $('.card3d-wrap');
  if (finePointer) {
    c3w.addEventListener('mousemove', function (e) {
      var r = c3.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c3.style.setProperty('--ry', (x * 26) + 'deg'); c3.style.setProperty('--rx', (y * -20) + 'deg'); c3.style.setProperty('--shine', (x * 120) + '%');
    });
    c3w.addEventListener('mouseleave', function () { c3.style.removeProperty('--ry'); c3.style.removeProperty('--rx'); c3.style.removeProperty('--shine'); });
  }

  /* ---------- отзывы ---------- */
  var qs = $('[data-quotes]'), qi = 0, qt;
  qs.innerHTML = D.reviews.map(function (r, i) {
    return '<blockquote class="quote' + (i === 0 ? ' is-on' : '') + '" style="margin:0"><p>' + r.text + '</p><div class="q-who"><span class="q-ava">' + r.name[0] + '</span><div><b>' + r.name + '</b><small>' + r.role + '</small></div><span class="q-stars">★★★★★</span></div></blockquote>';
  }).join('');
  function qgo(n) {
    qi = (n + D.reviews.length) % D.reviews.length;
    $$('.quote', qs).forEach(function (q, k) { q.classList.toggle('is-on', k === qi); });
    $('[data-qnum]').textContent = '0' + (qi + 1) + ' / 0' + D.reviews.length;
    clearTimeout(qt); qt = setTimeout(function () { qgo(qi + 1); }, 7000);
  }
  $('[data-qprev]').addEventListener('click', function () { qgo(qi - 1); });
  $('[data-qnext]').addEventListener('click', function () { qgo(qi + 1); });
  qgo(0);

  /* ---------- шоурумы ---------- */
  $('[data-shops]').innerHTML = D.company.showrooms.map(function (s, i) {
    return '<div class="shop-c" data-reveal data-delay="' + i * 100 + '"><svg class="i"><use href="#i-pin"/></svg><b>' + s.title + '</b><span>' + s.address + '</span><small>' + s.hours + '</small></div>';
  }).join('');

  priceOut(); update(); MS.reveal();
})();
