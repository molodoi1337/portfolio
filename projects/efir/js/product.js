/* ЭФИР — иллюстрация наушников в SVG.
   Цвета приходят либо как CSS-переменные (--hp-*: плавно перетекают при смене цвета),
   либо как конкретные hex — для миниатюр в корзине. */
(function () {
  'use strict';

  const VARS = {
    main: 'var(--hp-main)', light: 'var(--hp-light)', dark: 'var(--hp-dark)',
    metal: 'var(--hp-metal)', pad: 'var(--hp-pad)', accent: 'var(--hp-accent)',
  };
  let seq = 0;

  function headphones(c = VARS) {
    const u = 'hp' + (++seq);
    const stop = (o, col, a = 1) => `<stop offset="${o}" style="stop-color:${col};stop-opacity:${a}"/>`;
    return `
<svg class="hp" viewBox="0 0 440 440" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${u}-shellL" x1="0" x2="1">
      ${stop(0, c.dark)}${stop(0.22, c.main)}${stop(0.5, c.light)}${stop(0.78, c.main)}${stop(1, c.dark)}
    </linearGradient>
    <linearGradient id="${u}-shellR" x1="1" x2="0">
      ${stop(0, c.dark)}${stop(0.22, c.main)}${stop(0.5, c.light)}${stop(0.78, c.main)}${stop(1, c.dark)}
    </linearGradient>
    <linearGradient id="${u}-shellV" x1="0" y1="0" x2="0" y2="1">
      ${stop(0, '#fff', 0.35)}${stop(0.18, '#fff', 0)}${stop(0.8, '#000', 0)}${stop(1, '#000', 0.4)}
    </linearGradient>
    <linearGradient id="${u}-metal" x1="0" x2="1">
      ${stop(0, c.dark)}${stop(0.25, c.metal)}${stop(0.5, '#ffffff')}${stop(0.75, c.metal)}${stop(1, c.dark)}
    </linearGradient>
    <linearGradient id="${u}-metalV" x1="0" y1="0" x2="0" y2="1">
      ${stop(0, '#ffffff')}${stop(0.5, c.metal)}${stop(1, c.dark)}
    </linearGradient>
    <linearGradient id="${u}-canopy" x1="0" y1="0" x2="0" y2="1">
      ${stop(0, c.light)}${stop(0.55, c.main)}${stop(1, c.dark)}
    </linearGradient>
    <linearGradient id="${u}-padL" x1="0" x2="1">
      ${stop(0, '#000', 0.6)}${stop(0.35, c.pad)}${stop(0.7, c.pad)}${stop(1, c.main, 0.55)}
    </linearGradient>
    <linearGradient id="${u}-padR" x1="1" x2="0">
      ${stop(0, '#000', 0.6)}${stop(0.35, c.pad)}${stop(0.7, c.pad)}${stop(1, c.main, 0.55)}
    </linearGradient>
    <pattern id="${u}-mesh" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.1" fill="#fff" fill-opacity="0.09"/>
    </pattern>
    <filter id="${u}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="${u}-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>

  <ellipse cx="220" cy="422" rx="170" ry="10" fill="#000" opacity="0.55" filter="url(#${u}-blur)"/>

  <!-- рама и подушка оголовья -->
  <path d="M62 176 C 54 22, 386 22, 378 176" fill="none" stroke="url(#${u}-metalV)" stroke-width="8" stroke-linecap="round"/>
  <path d="M90 184 C 98 74, 342 74, 350 184" fill="none" stroke="url(#${u}-canopy)" stroke-width="19" stroke-linecap="round"/>
  <path d="M90 184 C 98 74, 342 74, 350 184" fill="none" stroke="url(#${u}-mesh)" stroke-width="19" stroke-linecap="round"/>
  <path d="M104 150 C 124 88, 316 88, 336 150" fill="none" stroke="#fff" stroke-opacity="0.22" stroke-width="2" stroke-linecap="round"/>

  <!-- телескопические штанги и шарниры -->
  <rect x="58" y="160" width="8" height="78" rx="4" fill="url(#${u}-metal)"/>
  <rect x="374" y="160" width="8" height="78" rx="4" fill="url(#${u}-metal)"/>
  <rect x="46" y="226" width="32" height="14" rx="6" fill="url(#${u}-metal)"/>
  <rect x="362" y="226" width="32" height="14" rx="6" fill="url(#${u}-metal)"/>

  <!-- амбушюры (видны с внутренней стороны чашек) -->
  <rect x="84" y="246" width="40" height="146" rx="16" fill="url(#${u}-padL)"/>
  <rect x="84" y="246" width="40" height="146" rx="16" fill="url(#${u}-mesh)"/>
  <rect x="316" y="246" width="40" height="146" rx="16" fill="url(#${u}-padR)"/>
  <rect x="316" y="246" width="40" height="146" rx="16" fill="url(#${u}-mesh)"/>

  <!-- чашки: корпус + внешняя крышка -->
  <rect x="26" y="236" width="70" height="166" rx="24" fill="url(#${u}-shellL)"/>
  <rect x="26" y="236" width="70" height="166" rx="24" fill="url(#${u}-shellV)"/>
  <rect x="26" y="240" width="16" height="158" rx="8" fill="${c.dark}" opacity="0.55"/>
  <rect x="344" y="236" width="70" height="166" rx="24" fill="url(#${u}-shellR)"/>
  <rect x="344" y="236" width="70" height="166" rx="24" fill="url(#${u}-shellV)"/>
  <rect x="398" y="240" width="16" height="158" rx="8" fill="${c.dark}" opacity="0.55"/>
  <rect x="52" y="256" width="5" height="124" rx="2.5" fill="#fff" opacity="0.32"/>
  <rect x="381" y="256" width="5" height="124" rx="2.5" fill="#fff" opacity="0.2"/>
  <path d="M42 244 h44" stroke="#fff" stroke-opacity="0.18" stroke-width="1.5"/>
  <path d="M354 244 h44" stroke="#fff" stroke-opacity="0.14" stroke-width="1.5"/>

  <!-- колёсико и индикатор -->
  <rect x="384" y="222" width="22" height="12" rx="5" fill="url(#${u}-metal)"/>
  <rect x="388" y="224" width="14" height="3" rx="1.5" fill="${c.accent}" opacity="0.9"/>
  <circle cx="68" cy="384" r="6" fill="${c.accent}" opacity="0.7" filter="url(#${u}-glow)"/>
  <circle cx="68" cy="384" r="2.6" fill="${c.accent}"/>
</svg>`;
  }

  window.EfirProduct = { headphones, VARS };
})();
