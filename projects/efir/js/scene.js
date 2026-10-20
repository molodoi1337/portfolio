/* ЭФИР — WebGL-сцена.
   Каждая частица знает четыре позиции: планета → звуковые волны → наушники → галактика.
   Прокрутка двигает uScene от 0 до 3, шейдер перетекает между формами. */
(function () {
  'use strict';

  const canvas = document.getElementById('scene');
  const gl = canvas && canvas.getContext('webgl', {
    alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance',
  });
  if (!gl) { document.documentElement.classList.add('no-webgl'); return; }

  const coarse = matchMedia('(pointer: coarse)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = coarse || innerWidth < 760 ? 9000 : 18000;
  const STARS = coarse ? 1400 : 2600;
  const DUST = 220;

  const TAU = Math.PI * 2;
  const rnd = Math.random;
  const gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * rnd()); };

  /* ---------- формы ---------- */

  function planet(o, j) {
    if (rnd() < 0.7) {
      const u = rnd() * 2 - 1, th = rnd() * TAU, s = Math.sqrt(1 - u * u);
      const band = Math.sin(Math.asin(u) * 9 + Math.sin(th * 3) * 0.9);
      const r = 1.55 * (1 + band * 0.028 + (rnd() - 0.5) * 0.03);
      o[j] = s * Math.cos(th) * r; o[j + 1] = u * r; o[j + 2] = s * Math.sin(th) * r;
    } else {
      let r = 2.15 + Math.pow(rnd(), 0.9) * 0.8;
      if (r > 2.55 && r < 2.64) r += 0.1; // щель в кольце
      const a = rnd() * TAU;
      o[j] = Math.cos(a) * r; o[j + 1] = gauss() * 0.015; o[j + 2] = Math.sin(a) * r;
    }
  }

  function waves(o, j) {
    if (rnd() < 0.1) {
      const u = rnd() * 2 - 1, th = rnd() * TAU, s = Math.sqrt(1 - u * u), r = 0.3 * Math.cbrt(rnd());
      o[j] = s * Math.cos(th) * r; o[j + 1] = u * r; o[j + 2] = s * Math.sin(th) * r;
    } else {
      const k = Math.floor(Math.sqrt(rnd()) * 13);
      const r = 0.55 + k * 0.22 + gauss() * 0.012, a = rnd() * TAU;
      o[j] = Math.cos(a) * r; o[j + 1] = 0; o[j + 2] = Math.sin(a) * r;
    }
  }

  function phones(o, j) {
    const S = 1.18, q = rnd();
    let x, y, z;
    if (q < 0.3) { // оголовье
      const th = Math.PI * (0.06 + rnd() * 0.88);
      const R = 1.25 + (rnd() - 0.5) * 0.09;
      z = rnd() < 0.4 ? (rnd() < 0.5 ? -0.2 : 0.2) : (rnd() - 0.5) * 0.4;
      x = Math.cos(th) * R; y = 0.25 + Math.sin(th) * R * 1.08;
    } else if (q < 0.4) { // вилки
      const side = rnd() < 0.5 ? -1 : 1, fz = rnd() < 0.5 ? -1 : 1, t = rnd();
      x = side * (1.23 + t * 0.1) + gauss() * 0.012;
      y = 0.5 - t * 0.95;
      z = fz * (0.2 + 0.32 * Math.sin(t * Math.PI / 2)) + gauss() * 0.012;
    } else { // чашки
      const side = rnd() < 0.5 ? -1 : 1, cx = side * 1.33, cy = -0.55;
      const a = rnd() * TAU, part = rnd();
      if (part < 0.38) { // внешняя крышка: концентрические кольца-«решётка»
        const rr = rnd() < 0.7 ? Math.round(Math.sqrt(rnd()) * 6) / 6 : Math.sqrt(rnd());
        x = cx + side * 0.22; y = cy + Math.sin(a) * 0.62 * rr; z = Math.cos(a) * 0.5 * rr;
      } else if (part < 0.72) { // стенка
        const t = rnd();
        x = cx + side * (0.22 - t * 0.4); y = cy + Math.sin(a) * 0.62; z = Math.cos(a) * 0.5;
      } else { // амбушюра-тор
        const tb = rnd() * TAU;
        x = cx - side * (0.28 + Math.sin(tb) * 0.11);
        y = cy + Math.sin(a) * (0.48 + Math.cos(tb) * 0.11);
        z = Math.cos(a) * (0.38 + Math.cos(tb) * 0.11);
      }
    }
    o[j] = x * S; o[j + 1] = (y - 0.21) * S; o[j + 2] = z * S;
  }

  function galaxy(o, j, i) {
    const arm = i % 3;
    const r = Math.pow(rnd(), 1.6) * 3.6 + 0.05;
    const a = arm / 3 * TAU + r * 1.35 + gauss() * 0.3 / (0.5 + r * 0.5);
    o[j] = Math.cos(a) * r + gauss() * 0.07 * r;
    o[j + 1] = gauss() * 0.1 * (1.2 - r / 3.6);
    o[j + 2] = Math.sin(a) * r + gauss() * 0.07 * r;
  }

  const A = new Float32Array(N * 3), B = new Float32Array(N * 3), C = new Float32Array(N * 3), D = new Float32Array(N * 3);
  const R = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const j = i * 3;
    planet(A, j); waves(B, j); phones(C, j); galaxy(D, j, i);
    R[i * 4] = rnd();                                        // задержка перехода
    R[i * 4 + 1] = rnd() < 0.03 ? 1.5 + rnd() : rnd();      // размер (редкие — искры)
    // выбор цвета: кольцо — розово-циановое, планета — в основном фиолетовая
    R[i * 4 + 2] = Math.hypot(A[j], A[j + 2]) > 2 ? 0.48 + rnd() * 0.52 : rnd();
    R[i * 4 + 3] = rnd();                                    // фаза
  }

  const SP = new Float32Array((STARS + DUST) * 3), ST = new Float32Array((STARS + DUST) * 3);
  for (let i = 0; i < STARS + DUST; i++) {
    const j = i * 3, dust = i >= STARS;
    if (dust) {
      SP[j] = (rnd() - 0.5) * 8; SP[j + 1] = (rnd() - 0.5) * 10; SP[j + 2] = 1.5 + rnd() * 3;
      ST[j + 2] = 4 + rnd() * 3;
    } else {
      SP[j] = (rnd() - 0.5) * 90; SP[j + 1] = (rnd() - 0.5) * 80; SP[j + 2] = -55 + rnd() * 55;
      ST[j + 2] = 0.5 + Math.pow(rnd(), 3) * 1.8;
    }
    ST[j] = 0.6 + rnd() * 2.4; ST[j + 1] = rnd() * TAU;
  }

  /* ---------- шейдеры ---------- */

  const VS = `
attribute vec3 aA;
attribute vec3 aB;
attribute vec3 aC;
attribute vec3 aD;
attribute vec4 aR;
uniform mat4 uProj;
uniform mat4 uView;
uniform float uTime;
uniform float uScene;
uniform float uIntro;
uniform float uPulse;
uniform float uSize;
uniform float uRot;
uniform float uTilt;
uniform vec3 uOffset;
uniform vec2 uMouse;
uniform float uMouseF;
uniform float uAspect;
uniform vec2 uFog;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
varying vec3 vColor;
varying float vAlpha;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float stage(float s, float i, float d) {
  float t = clamp((s - i - d * 0.35) / 0.65, 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

void main() {
  float d = aR.x;
  float s0 = stage(uScene, 0.0, d);
  float s1 = stage(uScene, 1.0, d);
  float s2 = stage(uScene, 2.0, d);
  vec3 p = mix(mix(mix(aA, aB, s0), aC, s1), aD, s2);

  float wB = s0 * (1.0 - s1);
  float rad = length(p.xz);
  p.y += sin(rad * 4.2 - uTime * 2.4) * (0.16 + uPulse * 0.22) * wB * smoothstep(0.2, 0.8, rad);

  float tr = sin(s0 * 3.14159) + sin(s1 * 3.14159) + sin(s2 * 3.14159);
  p += vec3(sin(d * 40.0 + uTime), cos(aR.w * 30.0 + uTime * 0.8), sin(aR.z * 50.0 - uTime * 0.7)) * tr * 0.35;

  float ph = aR.w * 6.2831;
  p += vec3(sin(uTime * 0.9 + ph), cos(uTime * 0.7 + ph * 1.3), sin(uTime * 0.8 + ph * 0.7)) * 0.012;
  p *= 1.0 + uPulse * (0.03 + 0.06 * aR.w) * (1.0 - s1 * 0.6);

  float it = clamp(uIntro * 1.6 - d * 0.6, 0.0, 1.0);
  it = 1.0 - pow(1.0 - it, 3.0);
  vec3 far = normalize(aA + vec3(0.001)) * (6.0 + aR.w * 10.0);
  p = mix(far, p, it);

  p.xz = rot(uRot) * p.xz;
  p.yz = rot(uTilt) * p.yz;
  p += uOffset;

  // освещение планеты: свет сверху-слева, тёмная сторона и светящийся край
  vec3 n = normalize(aA + vec3(0.0001));
  n.xz = rot(uRot) * n.xz;
  n.yz = rot(uTilt) * n.yz;
  float isSphere = step(length(aA), 1.8);
  float lit = max(dot(n, normalize(vec3(-0.6, 0.55, 0.6))), 0.0);
  float rim = pow(1.0 - abs(n.z), 3.0);
  float shade = mix(1.0, 0.14 + 1.1 * lit + 0.7 * rim, isSphere * (1.0 - s0) * it);

  vec4 mv = uView * vec4(p, 1.0);
  vec4 pos = uProj * mv;

  vec2 dd = pos.xy / pos.w - uMouse;
  dd.x *= uAspect;
  float l = length(dd);
  float f = smoothstep(0.32, 0.0, l) * uMouseF;
  vec2 push = dd / (l + 0.0001) * f * 0.09;
  push.x /= uAspect;
  pos.xy += push * pos.w;
  gl_Position = pos;

  float depth = -mv.z;
  float sz = 0.55 + aR.y;
  gl_PointSize = depth > 0.05 ? clamp(uSize * sz * (1.0 + uPulse * 0.35) / depth, 0.0, 48.0) : 0.0;

  float k = aR.z;
  vec3 c = k < 0.48 ? uC1 : (k < 0.78 ? uC2 : uC3);
  c = mix(c, vec3(1.0), step(1.4, aR.y) * 0.5 + f * 0.4);
  vColor = c;
  float fog = 1.0 - smoothstep(uFog.x, uFog.y, depth) * 0.8;
  vAlpha = fog * shade * (0.6 + 0.3 * aR.y + uPulse * 0.3) * (0.35 + 0.65 * it);
}`;

  const FS = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float a = 1.0 - smoothstep(0.0, 0.5, r);
  a *= a;
  vec3 col = mix(vColor, vec3(1.0), (1.0 - smoothstep(0.0, 0.12, r)) * 0.25);
  float al = a * vAlpha;
  gl_FragColor = vec4(col * al, al);
}`;

  const STAR_VS = `
attribute vec3 aP;
attribute vec3 aT;
uniform mat4 uProj;
uniform mat4 uView;
uniform float uTime;
uniform float uScroll;
uniform float uDpr;
varying float vA;
varying vec3 vC;
void main() {
  vec3 p = aP;
  float dust = step(3.0, aT.z);
  float span = mix(80.0, 10.0, dust);
  p.y = mod(p.y + uScroll * mix(1.0, 2.2, dust) + span * 0.5, span) - span * 0.5;
  vec4 mv = uView * vec4(p, 1.0);
  gl_Position = uProj * mv;
  float depth = max(-mv.z, 0.1);
  gl_PointSize = clamp(aT.z * uDpr * 26.0 / depth, 1.0, 90.0);
  float tw = 0.55 + 0.45 * sin(uTime * aT.x + aT.y);
  vA = mix(tw * (1.0 - smoothstep(25.0, 75.0, depth)), 0.025 + 0.025 * tw, dust);
  vec3 tint = fract(aT.y * 3.7) > 0.6 ? vec3(0.36, 0.88, 0.9) : vec3(1.0, 0.6, 0.9);
  vC = mix(vec3(0.85, 0.83, 1.0), tint, 0.35 * step(0.6, fract(aT.y * 1.3)));
}`;

  const STAR_FS = `
precision mediump float;
varying float vA;
varying vec3 vC;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  float a = 1.0 - smoothstep(0.0, 0.5, r);
  a *= a * vA;
  gl_FragColor = vec4(vC * a, a);
}`;

  function program(vs, fs) {
    const p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(([type, src]) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) {
      const name = gl.getActiveUniform(p, i).name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  }

  function buffer(data, size) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return { b, size };
  }

  function bind(prog, attrs) {
    gl.useProgram(prog.p);
    for (const name in attrs) {
      const loc = gl.getAttribLocation(prog.p, name);
      if (loc < 0) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, attrs[name].b);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, attrs[name].size, gl.FLOAT, false, 0, 0);
    }
  }

  let parts, stars;
  try {
    parts = program(VS, FS);
    stars = program(STAR_VS, STAR_FS);
  } catch (e) {
    console.error(e);
    document.documentElement.classList.add('no-webgl');
    return;
  }
  const partAttrs = { aA: buffer(A, 3), aB: buffer(B, 3), aC: buffer(C, 3), aD: buffer(D, 3), aR: buffer(R, 4) };
  const starAttrs = { aP: buffer(SP, 3), aT: buffer(ST, 3) };

  /* ---------- матрицы ---------- */

  const FOV = 45 * Math.PI / 180;
  function perspective(aspect, near, far) {
    const f = 1 / Math.tan(FOV / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function lookAt(e, c) {
    let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
    let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = zz, xy = 0, xz = -zx; // cross(up=(0,1,0), z)
    l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1,
    ]);
  }

  /* ---------- раскладка по сценам ----------
     ox/oy — доля от видимой полуширины/полувысоты, z — дистанция камеры */
  const KEYS_WIDE = [
    { ox: 0.40, oy: 0.00, z: 6.6, tilt: 0.40, spin: 0.12 },
    { ox: 0.00, oy: -0.04, z: 6.4, tilt: 0.95, spin: 0.08 },
    { ox: 0.47, oy: 0.02, z: 6.5, tilt: 0.12, spin: 0.22 },
    { ox: 0.00, oy: 0.00, z: 7.2, tilt: 1.05, spin: 0.10 },
  ];
  const KEYS_TALL = [
    { ox: 0, oy: 0.38, z: 6.6, tilt: 0.40, spin: 0.12 },
    { ox: 0, oy: 0.00, z: 6.4, tilt: 0.95, spin: 0.08 },
    { ox: 0, oy: 0.36, z: 5.9, tilt: 0.12, spin: 0.22 },
    { ox: 0, oy: 0.00, z: 7.2, tilt: 1.05, spin: 0.10 },
  ];
  const lerp = (a, b, t) => a + (b - a) * t;
  function keyAt(keys, s) {
    s = Math.max(0, Math.min(3, s));
    const i = Math.min(2, Math.floor(s)), t0 = s - i, t = t0 * t0 * (3 - 2 * t0);
    const a = keys[i], b = keys[i + 1], o = {};
    for (const k in a) o[k] = lerp(a[k], b[k], t);
    return o;
  }

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

  const st = {
    target: 0, scene: 0,
    mouse: [0, 0], smouse: [0, 0], mouseF: 0, mouseFT: 0,
    rot: 0, pulse: 0, scroll: 0,
    pal: [hex('#8A7CFF'), hex('#FF7AD9'), hex('#5CE1E6')],
    palT: null, introStart: null,
  };
  st.palT = st.pal.map((c) => c.slice());

  let dpr = 1, aspect = 1, w = 1, h = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = w / h;
  }
  resize();
  addEventListener('resize', resize);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  function heartbeat(t) {
    const b = (t * 84 / 60) % 1;
    return (Math.exp(-b * 7) + (b > 0.2 ? Math.exp(-(b - 0.2) * 8) * 0.5 : 0)) * 0.5;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;

    st.scene += (st.target - st.scene) * Math.min(1, dt * 2.4);
    st.smouse[0] += (st.mouse[0] - st.smouse[0]) * Math.min(1, dt * 3);
    st.smouse[1] += (st.mouse[1] - st.smouse[1]) * Math.min(1, dt * 3);
    st.mouseF += (st.mouseFT - st.mouseF) * Math.min(1, dt * 4);
    st.mouseFT *= Math.pow(0.35, dt);
    for (let i = 0; i < 3; i++) for (let c = 0; c < 3; c++) st.pal[i][c] += (st.palT[i][c] - st.pal[i][c]) * Math.min(1, dt * 3);

    const lv = window.EfirAudio ? window.EfirAudio.level() : null;
    const pulse = (lv != null ? lv : heartbeat(t)) * (reduce ? 0.3 : 1);
    st.pulse += (pulse - st.pulse) * Math.min(1, dt * 18);

    const tall = aspect < 0.9;
    const zMul = tall ? Math.min(2.2, Math.max(1, 0.9 / aspect)) : 1;
    const k = keyAt(tall ? KEYS_TALL : KEYS_WIDE, st.scene);
    const camZ = k.z * zMul;
    const halfH = camZ * Math.tan(FOV / 2);
    st.rot += dt * k.spin * (reduce ? 0.3 : 1);

    const intro = st.introStart == null ? 0 : reduce ? 1 : Math.min(1, (t - st.introStart) / 2.6);
    const eye = [st.smouse[0] * 0.9, st.smouse[1] * 0.55 + 0.1, camZ];
    const proj = perspective(aspect, 0.1, 120);
    const view = lookAt(eye, [0, 0, 0]);

    gl.clear(gl.COLOR_BUFFER_BIT);

    bind(stars, starAttrs);
    gl.uniformMatrix4fv(stars.u.uProj, false, proj);
    gl.uniformMatrix4fv(stars.u.uView, false, view);
    gl.uniform1f(stars.u.uTime, t);
    gl.uniform1f(stars.u.uScroll, st.scroll);
    gl.uniform1f(stars.u.uDpr, dpr);
    gl.drawArrays(gl.POINTS, 0, STARS + DUST);

    bind(parts, partAttrs);
    const u = parts.u;
    gl.uniformMatrix4fv(u.uProj, false, proj);
    gl.uniformMatrix4fv(u.uView, false, view);
    gl.uniform1f(u.uTime, reduce ? t * 0.3 : t);
    gl.uniform1f(u.uScene, st.scene);
    gl.uniform1f(u.uIntro, intro);
    gl.uniform1f(u.uPulse, st.pulse);
    gl.uniform1f(u.uSize, 17 * dpr * zMul);
    gl.uniform1f(u.uRot, st.rot);
    gl.uniform1f(u.uTilt, k.tilt);
    gl.uniform3f(u.uOffset, k.ox * halfH * aspect, k.oy * halfH, 0);
    gl.uniform2f(u.uMouse, st.mouse[0], st.mouse[1]);
    gl.uniform1f(u.uMouseF, reduce ? 0 : st.mouseF);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform2f(u.uFog, 4 * zMul, 11 * zMul);
    gl.uniform3fv(u.uC1, st.pal[0]);
    gl.uniform3fv(u.uC2, st.pal[1]);
    gl.uniform3fv(u.uC3, st.pal[2]);
    gl.drawArrays(gl.POINTS, 0, N);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.documentElement.classList.add('no-webgl');
  });

  window.EfirScene = {
    start() { if (st.introStart == null) st.introStart = performance.now() / 1000; },
    setTarget(s) { st.target = s; },
    setScroll(y) { st.scroll = y * 0.0045; },
    setMouse(x, y) { st.mouse[0] = x; st.mouse[1] = y; st.mouseFT = 1; },
    releaseMouse() { st.mouseFT = 0; },
    setPalette(list) { st.palT = list.map(hex); },
  };
})();
