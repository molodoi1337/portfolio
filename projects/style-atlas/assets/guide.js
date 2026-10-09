/* «Музейная табличка» на каждой странице стиля.
   Живёт в Shadow DOM, чтобы стили страницы и таблички не мешали друг другу. */
(function () {
  var A = window.ATLAS;
  if (!A) return;
  var slug = document.documentElement.getAttribute('data-style');
  var list = A.styles;
  var i = list.findIndex(function (s) { return s.slug === slug; });
  if (i < 0) return;

  var s = list[i];
  var prev = list[(i - 1 + list.length) % list.length];
  var next = list[(i + 1) % list.length];
  var cat = A.categories.find(function (c) { return c.id === s.cat; });
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var esc = function (t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  };
  var INDEX = '../index.html';

  var css = [
    ':host{all:initial;position:fixed;left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px) + var(--guide-offset,0px));z-index:2147483000;display:block}',
    '*{box-sizing:border-box;margin:0;padding:0}',
    '.wrap{font:13px/1.45 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#F2F2F3;-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;align-items:flex-start;gap:8px}',
    '.bar{display:flex;align-items:stretch;background:rgba(17,17,19,.88);-webkit-backdrop-filter:blur(14px) saturate(140%);backdrop-filter:blur(14px) saturate(140%);border:1px solid rgba(255,255,255,.16);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35),0 1px 0 rgba(255,255,255,.06) inset;overflow:hidden;max-width:calc(100vw - 24px)}',
    '.bar a,.bar button{all:unset;box-sizing:border-box;cursor:pointer;display:grid;place-items:center;min-width:40px;height:42px;color:#F2F2F3;transition:background .15s}',
    '.bar a:hover,.bar button:hover{background:rgba(255,255,255,.09)}',
    '.bar a:focus-visible,.bar button:focus-visible,.panel button:focus-visible,.panel a:focus-visible{outline:2px solid #9DB7FF;outline-offset:-2px}',
    '.bar svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '.bar .label{display:flex;align-items:center;gap:10px;padding:0 12px;border-left:1px solid rgba(255,255,255,.1);border-right:1px solid rgba(255,255,255,.1);min-width:0}',
    '.n{font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#A3A3AA;letter-spacing:.06em}',
    '.name{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46vw}',
    '.i{flex:none;width:18px;height:18px;border-radius:50%;border:1px solid rgba(255,255,255,.45);display:grid;place-items:center;font:italic 600 11px/1 Georgia,"Times New Roman",serif}',
    '.label[aria-expanded="true"] .i{background:#F2F2F3;color:#111}',
    '.panel{width:min(392px,calc(100vw - 24px));max-height:min(72vh,calc(100vh - 96px));overflow:auto;overscroll-behavior:contain;background:rgba(17,17,19,.95);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:18px 18px 16px;box-shadow:0 24px 60px rgba(0,0,0,.5);transform-origin:bottom left;animation:pop .22s cubic-bezier(.2,.8,.2,1)}',
    '.panel[hidden]{display:none}',
    '@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){.panel{animation:none}}',
    '.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}',
    '.cat{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#A3A3AA}',
    '.x{all:unset;cursor:pointer;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;color:#C9C9CF;font-size:18px;line-height:1}',
    '.x:hover{background:rgba(255,255,255,.09);color:#fff}',
    'h2{font-size:22px;line-height:1.15;font-weight:700;letter-spacing:-.01em;text-wrap:balance}',
    '.en{color:#A3A3AA;font-size:13px;margin-top:2px}',
    '.desc{margin-top:10px;font-size:14px;color:#E4E4E7}',
    'h3{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#A3A3AA;font-weight:600;margin:16px 0 6px}',
    'ul{list-style:none;display:grid;gap:6px}',
    'li{position:relative;padding-left:16px;color:#E4E4E7}',
    'li::before{content:"";position:absolute;left:2px;top:.62em;width:6px;height:6px;border-radius:50%;background:#9DB7FF}',
    '.sw{display:flex;flex-wrap:wrap;gap:6px}',
    '.chip{display:flex;align-items:center;gap:6px;padding:3px 8px 3px 3px;border-radius:999px;background:rgba(255,255,255,.06);font:500 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#D4D4D8}',
    '.dot{width:16px;height:16px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}',
    'p.small{color:#D4D4D8}',
    '.proj{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1);color:#A3A3AA;font-size:12px}',
    '.foot{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}',
    '.foot a{display:block;text-decoration:none;color:#F2F2F3;background:rgba(255,255,255,.06);border-radius:10px;padding:8px 10px;min-width:0}',
    '.foot a:hover{background:rgba(255,255,255,.11)}',
    '.foot small{display:block;color:#A3A3AA;font-size:11px}',
    '.foot span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}',
    '.foot .nx{text-align:right}',
    '.foot .all{grid-column:1/-1;text-align:center;font-weight:600}',
    '.keys{margin-top:10px;color:#8B8B93;font-size:11px}',
    'kbd{font:600 10px/1 ui-monospace,Menlo,monospace;border:1px solid rgba(255,255,255,.25);border-radius:4px;padding:2px 4px}',
    '@media (max-width:560px){:host{left:10px;right:10px}.bar{width:100%}.bar .label{flex:1}.name{max-width:none}.panel{width:100%}}'
  ].join('\n');

  var icon = {
    grid: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>'
  };

  var traits = s.traits.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
  var swatches = s.palette.map(function (c) {
    return '<span class="chip"><span class="dot" style="background:' + c + '"></span>' + c + '</span>';
  }).join('');

  var html =
    '<div class="wrap">' +
      '<section class="panel" id="panel" role="dialog" aria-label="О стиле: ' + esc(s.name) + '" hidden>' +
        '<div class="top"><span class="cat">' + esc(cat.name) + ' · ' + pad(i + 1) + ' из ' + list.length + '</span>' +
        '<button class="x" type="button" aria-label="Закрыть">×</button></div>' +
        '<h2>' + esc(s.name) + '</h2><p class="en">' + esc(s.en) + '</p>' +
        '<p class="desc">' + esc(s.desc) + '</p>' +
        '<h3>Что посмотреть на странице</h3><ul>' + traits + '</ul>' +
        '<h3>Палитра страницы</h3><div class="sw">' + swatches + '</div>' +
        '<h3>Шрифты</h3><p class="small">' + esc(s.fonts.join(', ')) + '</p>' +
        '<h3>Где встречается</h3><p class="small">' + esc(s.where) + '</p>' +
        '<p class="proj">Проект на странице вымышленный: ' + esc(s.project) + '.</p>' +
        '<div class="foot">' +
          '<a href="' + prev.slug + '.html"><small>← Предыдущий</small><span>' + esc(prev.short || prev.name) + '</span></a>' +
          '<a class="nx" href="' + next.slug + '.html"><small>Следующий →</small><span>' + esc(next.short || next.name) + '</span></a>' +
          '<a class="all" href="' + INDEX + '">Все стили</a>' +
        '</div>' +
        '<p class="keys"><kbd>←</kbd> <kbd>→</kbd> листать стили · <kbd>I</kbd> открыть или закрыть табличку</p>' +
      '</section>' +
      '<nav class="bar" aria-label="Навигация по стилям">' +
        '<a href="' + INDEX + '" title="Все стили" aria-label="Все стили">' + icon.grid + '</a>' +
        '<a href="' + prev.slug + '.html" title="Предыдущий: ' + esc(prev.name) + '" aria-label="Предыдущий стиль: ' + esc(prev.name) + '">' + icon.prev + '</a>' +
        '<button class="label" type="button" aria-expanded="false" aria-controls="panel" title="О стиле">' +
          '<span class="n">' + pad(i + 1) + '</span><span class="name">' + esc(s.short || s.name) + '</span><span class="i">i</span>' +
        '</button>' +
        '<a href="' + next.slug + '.html" title="Следующий: ' + esc(next.name) + '" aria-label="Следующий стиль: ' + esc(next.name) + '">' + icon.next + '</a>' +
      '</nav>' +
    '</div>';

  function mount() {
    var host = document.createElement('div');
    host.id = 'atlas-guide';
    var root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<style>' + css + '</style>' + html;
    document.body.appendChild(host);

    var panel = root.getElementById('panel');
    var label = root.querySelector('.label');
    function setOpen(open) {
      panel.hidden = !open;
      label.setAttribute('aria-expanded', String(open));
    }
    label.addEventListener('click', function () { setOpen(panel.hidden); });
    root.querySelector('.x').addEventListener('click', function () { setOpen(false); label.focus(); });

    // Слушаем на window: обработчики страницы (на document и ниже) успевают отменить событие раньше.
    window.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.composedPath()[0];
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === 'ArrowLeft') location.href = prev.slug + '.html';
      else if (e.key === 'ArrowRight') location.href = next.slug + '.html';
      else if (e.code === 'KeyI') setOpen(panel.hidden);
      else if (e.key === 'Escape' && !panel.hidden) setOpen(false);
    });

    // Первый визит на широком экране: показать табличку раскрытой, дальше — по клику.
    var seen = false;
    try { seen = localStorage.getItem('atlas.guide.seen') === '1'; } catch (err) {}
    if (!seen && window.matchMedia('(min-width: 900px)').matches) {
      setOpen(true);
      try { localStorage.setItem('atlas.guide.seen', '1'); } catch (err) {}
    }
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
