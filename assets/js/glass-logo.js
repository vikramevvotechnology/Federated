/* =========================================================
   Federated.One — 3D glass logo
   The Federated mark (assets/img/federated-mark.svg) is extruded and rendered
   with a custom glass shader: chromatic refraction, Fresnel reflection and
   thin-film iridescence of a hidden studio-light environment. Nothing but the
   logo is drawn — the page background stays pure black, like the reference
   site's glass orbit ring — and it is choreographed by scroll.
   ========================================================= */
(async function () {
  'use strict';

  var canvas = document.getElementById('glass-canvas');
  var stage = document.querySelector('.stage');
  var root = document.documentElement;

  function fail(err) {
    if (err) console.warn('[glass-logo] falling back to static mark:', err);
    root.classList.add('no-webgl');
    document.dispatchEvent(new CustomEvent('federated:glass-ready'));
  }

  if (!canvas || !window.FEDERATED_MARK_SVG) return fail('missing canvas or mark data');
  if (!document.createElement('canvas').getContext('webgl2')) return fail('WebGL2 not available');

  var THREE, SVGLoader, mergeVertices;
  try {
    var base = 'https://cdn.jsdelivr.net/npm/three@0.170.0';
    var mods = await Promise.all([
      import(base + '/+esm'),
      import(base + '/examples/jsm/loaders/SVGLoader.js/+esm'),
      import(base + '/examples/jsm/utils/BufferGeometryUtils.js/+esm')
    ]);
    THREE = mods[0];
    SVGLoader = mods[1].SVGLoader;
    mergeVertices = mods[2].mergeVertices;
  } catch (e) {
    return fail(e);
  }

  try {
    init();
  } catch (e) {
    fail(e);
  }

  function init() {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var snap = /[?&]glass-snap/.test(location.search);   // debug: jump straight to scroll poses

    /* ---------- Renderer / scene / camera ---------- */
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 11);

    /* ---------- Hidden studio environment (only ever seen *in* the glass) ---------- */
    var envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(50, 48, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: [
          'varying vec3 vDir;',
          'void main(){',
          '  float y = vDir.y;',
          '  vec3 top = vec3(0.05, 0.055, 0.07);',
          '  vec3 mid = vec3(0.003, 0.003, 0.005);',
          '  vec3 col = mix(mid, top, smoothstep(0.0, 0.9, y));',
          '  col = mix(col, vec3(0.004), smoothstep(0.0, -0.6, y));',
          // faint brand tint left (blue) / right (red)
          '  col += vec3(0.004, 0.01, 0.03) * smoothstep(0.2, -1.0, vDir.x);',
          '  col += vec3(0.03, 0.004, 0.006) * smoothstep(0.2, 1.0, vDir.x);',
          '  gl_FragColor = vec4(col, 1.0);',
          '}'
        ].join('\n')
      })
    ));

    function light(w, h, rgb, pos) {
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(rgb[0], rgb[1], rgb[2]), side: THREE.DoubleSide, toneMapped: false })
      );
      m.position.copy(pos);
      m.lookAt(0, 0, 0);
      envScene.add(m);
      return m;
    }
    // Large key softbox overhead + a ring of thin strip lights (the crisp streaks)
    light(16, 3, [0.9, 0.9, 0.95], new THREE.Vector3(0, 12, 3));
    for (var s = 0; s < 16; s++) {
      var a = (s / 16) * Math.PI * 2 + 0.2;
      var wide = s % 4 === 0 ? 0.6 : 0.2;
      var lum = s % 4 === 0 ? 1.5 : 0.7;
      light(wide, 24, [lum, lum, lum * 1.05], new THREE.Vector3(Math.cos(a) * 13, 0, Math.sin(a) * 13));
    }
    // two horizontal light bands for crossing highlights on the flat faces
    [-3.5, 4.5].forEach(function (y) {
      var band = new THREE.Mesh(new THREE.TorusGeometry(12.5, 0.12, 8, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 0.6, 0.65), toneMapped: false }));
      band.rotation.x = Math.PI / 2;
      band.position.y = y;
      envScene.add(band);
    });
    // Brand-coloured strips so the reflections carry the logo's blue and red
    light(0.8, 24, [0.15, 0.3, 1.3], new THREE.Vector3(-12, 0, 5));
    light(0.8, 24, [1.3, 0.12, 0.15], new THREE.Vector3(11, 0, -6));
    light(10, 0.4, [0.35, 0.3, 0.45], new THREE.Vector3(0, -10, -6));
    light(1.6, 1.6, [4, 4, 4], new THREE.Vector3(6, 7, 9));

    var cubeRT = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    var cubeCam = new THREE.CubeCamera(0.1, 100, cubeRT);
    cubeCam.update(renderer, envScene);

    /* ---------- Glass shader ---------- */
    var glassVertex = [
      'attribute vec3 color;',
      'varying vec3 vWorldPos;',
      'varying vec3 vNormal;',
      'varying vec3 vColor;',
      'void main(){',
      '  vec4 wp = modelMatrix * vec4(position, 1.0);',
      '  vWorldPos = wp.xyz;',
      '  vNormal = normalize(mat3(modelMatrix) * normal);',
      '  vColor = color;',
      '  gl_Position = projectionMatrix * viewMatrix * wp;',
      '}'
    ].join('\n');

    var glassFragment = [
      'uniform samplerCube uEnv;',
      'uniform mat3 uEnvRot;',
      'uniform float uTime;',
      'uniform float uIor;',
      'uniform float uDispersion;',
      'uniform float uIrid;',
      'uniform float uBody;',
      'uniform float uLayer;',   // 0 = back faces (inner), 1 = front faces
      'uniform float uGain;',
      'varying vec3 vWorldPos;',
      'varying vec3 vNormal;',
      'varying vec3 vColor;',
      'vec3 env(vec3 d){ return textureCube(uEnv, uEnvRot * d).rgb; }',
      'void main(){',
      '  vec3 N = normalize(vNormal);',
      '  if (uLayer < 0.5) N = -N;',
      '  vec3 V = normalize(cameraPosition - vWorldPos);',
      '  vec3 I = -V;',
      '  float NdV = clamp(abs(dot(N, V)), 0.0, 1.0);',
      // chromatic refraction — one IOR per channel
      '  vec3 refr;',
      '  refr.r = env(refract(I, N, 1.0 / (uIor - uDispersion))).r;',
      '  refr.g = env(refract(I, N, 1.0 / uIor)).g;',
      '  refr.b = env(refract(I, N, 1.0 / (uIor + uDispersion))).b;',
      '  refr *= mix(vec3(1.0), vColor, 0.5);',
      // Fresnel reflection
      '  vec3 refl = env(reflect(I, N));',
      '  float F0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);',
      '  float F = F0 + (1.0 - F0) * pow(1.0 - NdV, 5.0);',
      // thin-film iridescence (angle dependent hue shift)
      '  float film = (1.0 - NdV) * 2.2 + uTime * 0.04;',
      '  vec3 irid = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + film));',
      '  float edge = pow(1.0 - NdV, 1.3);',
      '  vec3 col = refr * (1.0 - F) * mix(0.28, 1.25, edge) + refl * mix(vec3(1.0), irid, uIrid) * F * 1.8;',
      '  col += irid * vColor * pow(1.0 - NdV, 3.0) * 0.1;',  // faint rainbow rim
      '  col += vColor * uBody;',                           // keep the brand colour readable
      '  if (uLayer < 0.5) col *= 0.4;',
      '  col *= uGain;',
      // Glass on black is light, not paint: blend additively so dark areas stay see-through
      '  gl_FragColor = vec4(col, 1.0);',
      '  #include <tonemapping_fragment>',
      '  #include <colorspace_fragment>',
      '  gl_FragColor.a = clamp(max(max(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b), 0.0, 1.0);',
      '}'
    ].join('\n');

    var envRot = new THREE.Matrix3();
    var sharedUniforms = {
      uEnv: { value: cubeRT.texture },
      uEnvRot: { value: envRot },
      uTime: { value: 0 },
      uIor: { value: 1.62 },
      uDispersion: { value: 0.03 },
      uIrid: { value: 0.25 },
      uBody: { value: 0.035 },
      uGain: { value: 1 }
    };
    function glassMaterial(layer) {
      return new THREE.ShaderMaterial({
        uniforms: Object.assign({ uLayer: { value: layer } }, sharedUniforms),
        vertexShader: glassVertex,
        fragmentShader: glassFragment,
        side: layer ? THREE.FrontSide : THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendEquation: THREE.AddEquation
      });
    }
    var backMat = glassMaterial(0);
    var frontMat = glassMaterial(1);

    /* ---------- The Federated mark geometry ---------- */
    var data = new SVGLoader().parse(window.FEDERATED_MARK_SVG);

    // Colours follow the SVG: [left stroke, top bar, diagonal, red bar]
    var parts = [
      { stops: [[0, '#6f97ff']], x0: 0, x1: 1, z: 0 },
      { stops: [[0, '#5b7fe0'], [0.58, '#7fa4ff'], [1, '#9dbaff']], x0: 93.28, x1: 324.51, z: 7 },
      { stops: [[0, '#6f8ee8'], [0.43, '#6f8ee8'], [0.66, '#c2508c'], [1, '#ff4a4d']], x0: 76.88, x1: 209.23, z: 3.5 },
      { stops: [[0, '#ff4649']], x0: 0, x1: 1, z: 7 }
    ];
    function sampleStops(stops, t) {
      if (t <= stops[0][0]) return new THREE.Color(stops[0][1]);
      for (var i = 0; i < stops.length - 1; i++) {
        var a = stops[i], b = stops[i + 1];
        if (t <= b[0]) return new THREE.Color(a[1]).lerp(new THREE.Color(b[1]), (t - a[0]) / (b[0] - a[0]));
      }
      return new THREE.Color(stops[stops.length - 1][1]);
    }

    // The source SVG is made of hundreds of micro-curves. Sample every curve
    // densely, then drop duplicate and collinear points: the outline stays
    // faithful to the SVG while the mesh stays light.
    function cleanPoints(pts) {
      var out = [];
      for (var i = 0; i < pts.length; i++) {
        if (!out.length || pts[i].distanceTo(out[out.length - 1]) >= 0.8) out.push(pts[i].clone());
      }
      if (out.length > 3 && out[0].distanceTo(out[out.length - 1]) < 0.8) out.pop();
      var res = [];
      for (var j = 0; j < out.length; j++) {
        var p = out[(j - 1 + out.length) % out.length], c = out[j], n = out[(j + 1) % out.length];
        if (c.clone().sub(p).normalize().dot(n.clone().sub(c).normalize()) < 0.99995) res.push(c);
      }
      return res.length > 2 ? res : out;
    }
    function cleanShape(shape) {
      var s = new THREE.Shape(cleanPoints(shape.getPoints(24)));
      s.holes = shape.holes.map(function (h) { return new THREE.Path(cleanPoints(h.getPoints(24))); });
      return s;
    }

    var logo = new THREE.Group();       // choreographed by scroll
    var tilt = new THREE.Group();       // mouse parallax, idle float, spin
    logo.add(tilt);
    scene.add(logo);

    var S = 1 / 105, CX = 164.36, CY = 164.83;
    data.paths.forEach(function (path, idx) {
      var cfg = parts[idx] || parts[0];
      var geo = new THREE.ExtrudeGeometry(SVGLoader.createShapes(path).map(cleanShape), {
        depth: 30,
        bevelEnabled: true,
        bevelThickness: 8,
        bevelSize: 1.6,
        bevelOffset: -0.8,
        bevelSegments: 6,
        curveSegments: 1
      });
      geo.deleteAttribute('normal');
      geo.deleteAttribute('uv');
      geo = mergeVertices(geo, 0.01);

      // Vertex colours reproduce the SVG gradients (computed in SVG space)
      var pos = geo.attributes.position;
      var col = new Float32Array(pos.count * 3);
      for (var v = 0; v < pos.count; v++) {
        var t = (pos.getX(v) - cfg.x0) / (cfg.x1 - cfg.x0);
        var c = sampleStops(cfg.stops, Math.min(1, Math.max(0, t)));
        col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

      // SVG space (y down) → centred world space (y up); the mirror flips winding
      geo.translate(-CX, -CY, -15 + cfg.z);
      geo.scale(S, -S, S);
      var idxArr = geo.index.array;
      for (var f = 0; f < idxArr.length; f += 3) {
        var tmp = idxArr[f + 1]; idxArr[f + 1] = idxArr[f + 2]; idxArr[f + 2] = tmp;
      }
      geo.computeVertexNormals();

      var back = new THREE.Mesh(geo, backMat);
      var front = new THREE.Mesh(geo, frontMat);
      front.renderOrder = 1;
      tilt.add(back, front);
    });

    /* ---------- Scroll choreography ---------- */
    // fx / fy: fraction of half the visible width / height. z: depth (camera at 11).
    // s: scale. rx/ry/rz: rotation (rad). spin: continuous turn speed (rad/s).
    function P(fx, fy, z, s, rx, ry, rz, spin) { return { fx: fx, fy: fy, z: z, s: s, rx: rx, ry: ry, rz: rz, spin: spin || 0 }; }
    var POSES_DESKTOP = {
      hero:         P(0.5,   0.02,  0,    1.1,  -0.12,  -0.42, 0.04),
      why:          P(0.62,  0.2,   -1.2, 0.8,   0.2,    0.7,  -0.1),
      statement:    P(0,     0,     1.2,  1.45,  0,      0,     0),
      statementOut: P(0.05,  -0.08, 11.6, 1.45, -0.3,    0.2,   0.1), // flies through the camera
      does:         P(-0.66, -0.25, -1.5, 0.9,  -0.2,    0.9,   0.2),
      numbers:      P(0.62,  -0.6,  -1.5, 0.6,   0.1,   -0.8,  -0.1),
      serve:        P(0.5,   -0.12, -2.2, 0.95,  0.3,   -1.3,   0.1),
      solutions:    P(-0.62, -0.66, -1,   0.62, -0.15,   0.55, -0.05),
      landlord:     P(0.5,   -0.05, -1.5, 1.05,  0.1,   -0.5,   0.08),
      cta:          P(0,     0.02,  -2,   1.45,  0,      6.283, 0),
      footer:       P(0,     0.08,  2.6,  2.2,   0.12,   6.283, 0,   0.3),
      // Platform page
      'p-hero':     P(0.52,  0.0,   0,    1.05, -0.1,   -0.5,   0.04),
      'p-how':      P(0.72,  0.52,  -2.2, 0.55,  0.2,    0.8,  -0.1),
      'p-arch':     P(0.42,  0.0,   -3,   1.15,  0.15,  -0.35,  0.05),
      'p-caps':     P(0.42,  -0.25, -3.2, 1.0,  -0.15,   0.7,   0.1),
      'p-gov':      P(0,     -0.1,  -3.2, 1.35,  0.05,   6.283, 0,   0.12),
      'p-deploy':   P(-0.42, 0.0,   -2.8, 1.05, -0.1,    0.5,  -0.05),
      'p-compare':  P(0.72,  -0.55, -2,   0.6,   0.1,   -0.8,  -0.1),
      // Solutions page
      's-hero':     P(0.55,  0.12,  0,    1.0,  -0.1,   -0.45,  0.04),
      's-infra':    P(0.5,   0.0,   -3,   1.05,  0.1,   -0.5,   0.05),
      's-gov':      P(-0.5,  0.0,   -3,   1.05,  0.1,    0.5,  -0.05),
      's-cap':      P(0.5,   0.0,   -3,   1.05, -0.1,   -0.7,   0.05),
      's-apps':     P(-0.5,  0.0,   -3,   1.05, -0.1,    0.7,  -0.05),
      's-fit':      P(0.78,  0.5,   -2.5, 0.6,   0.2,   -0.9,  -0.1),
      // Industries page
      'i-hero':     P(0.55,  0.1,   0,    1.0,  -0.1,   -0.45,  0.04),
      'i-matrix':   P(0.72,  0.5,   -2.5, 0.6,   0.2,   -0.8,  -0.1),
      'i-gov':      P(0.42,  0.0,   -3.2, 1.1,   0.1,   -0.5,   0.05),
      'i-bank':     P(-0.42, 0.0,   -3.2, 1.1,   0.1,    0.5,  -0.05),
      'i-ent':      P(0.42,  0.0,   -3.2, 1.1,  -0.1,   -0.7,   0.05),
      'i-isv':      P(-0.42, 0.0,   -3.2, 1.1,  -0.1,    0.7,  -0.05),
      'i-token':    P(0.42,  0.0,   -3.2, 1.1,   0.15,  -0.4,   0.05),
      // Partner page
      'pt-hero':     P(0.55,  0.1,   0,    1.0,  -0.1,   -0.45,  0.04),
      'pt-model':    P(0,     -0.32, -3.4, 1.15,  0.05,   6.283, 0,   0.12),
      'pt-server':   P(0.5,   -0.05, -1.5, 1.05,  0.1,   -0.5,   0.08),
      'pt-benefits': P(-0.3,  -0.1,  -3.4, 1.25,  0.1,    0.6,  -0.05),
      'pt-types':    P(0,     -0.05, -3.4, 1.3,  -0.05,   6.283, 0,   0.12),
      'pt-journey':  P(0.72,  0.5,   -2.5, 0.6,   0.2,   -0.8,  -0.1),
      // Contact page
      'c-hero':      P(0.55,  0.12,  0,    0.95, -0.1,   -0.45,  0.04),
      'c-form':      P(-0.28, 0.0,   -3.4, 1.25,  0.1,    0.5,  -0.05),
      'c-locations': P(0,     -0.1,  -3.4, 1.25,  0.05,   6.283, 0,   0.12),
      'c-faq':       P(0.35,  0.0,   -3.4, 1.2,  -0.1,   -0.6,   0.05)
    };
    var POSES_MOBILE = {
      hero:         P(0.32,  0.5,   -0.5, 0.58, -0.1,   -0.35,  0.03),
      why:          P(0.45,  0.55,  -1.5, 0.5,   0.2,    0.7,  -0.1),
      statement:    P(0,     0,     1,    0.95,  0,      0,     0),
      statementOut: P(0.05,  -0.08, 11.6, 0.95, -0.3,    0.2,   0.1),
      does:         P(-0.4,  0.5,   -2,   0.55, -0.2,    0.9,   0.2),
      numbers:      P(0.4,   0.5,   -2,   0.5,   0.1,   -0.8,  -0.1),
      serve:        P(0.4,   0.55,  -2,   0.5,   0.3,   -1.3,   0.1),
      solutions:    P(-0.4,  0.5,   -2,   0.55, -0.15,   0.55, -0.05),
      landlord:     P(0.3,   0.5,   -2,   0.6,   0.1,   -0.5,   0.08),
      cta:          P(0,     0.45,  -1,   0.8,   0,      6.283, 0),
      footer:       P(0,     0.3,   1.5,  1.2,   0.12,   6.283, 0,   0.3),
      'p-hero':     P(0.32,  0.5,   -0.5, 0.58, -0.1,   -0.35,  0.03),
      'p-how':      P(0.78,  0.62,  -2.5, 0.45,  0.2,    0.8,  -0.1),
      'p-arch':     P(0.78,  0.62,  -2.5, 0.45,  0.15,  -0.35,  0.05),
      'p-caps':     P(0.78,  0.62,  -2.5, 0.45, -0.2,    0.9,   0.15),
      'p-gov':      P(0,     0.1,   -3,   0.8,   0.05,   6.283, 0,   0.12),
      'p-deploy':   P(0.78,  0.62,  -2.5, 0.45, -0.1,    0.5,  -0.05),
      'p-compare':  P(0.78,  0.62,  -2.5, 0.45,  0.1,   -0.8,  -0.1),
      's-hero':     P(0.32,  0.5,   -0.5, 0.58, -0.1,   -0.35,  0.03),
      's-infra':    P(0.78,  0.62,  -2.5, 0.45,  0.1,   -0.5,   0.05),
      's-gov':      P(0.78,  0.62,  -2.5, 0.45,  0.1,    0.5,  -0.05),
      's-cap':      P(0.78,  0.62,  -2.5, 0.45, -0.1,   -0.7,   0.05),
      's-apps':     P(0.78,  0.62,  -2.5, 0.45, -0.1,    0.7,  -0.05),
      's-fit':      P(0.78,  0.62,  -2.5, 0.45,  0.2,   -0.9,  -0.1),
      'i-hero':     P(0.32,  0.5,   -0.5, 0.58, -0.1,   -0.35,  0.03),
      'i-matrix':   P(0.78,  0.62,  -2.5, 0.45,  0.2,   -0.8,  -0.1),
      'i-gov':      P(0.78,  0.62,  -2.5, 0.45,  0.1,   -0.5,   0.05),
      'i-bank':     P(0.78,  0.62,  -2.5, 0.45,  0.1,    0.5,  -0.05),
      'i-ent':      P(0.78,  0.62,  -2.5, 0.45, -0.1,   -0.7,   0.05),
      'i-isv':      P(0.78,  0.62,  -2.5, 0.45, -0.1,    0.7,  -0.05),
      'i-token':    P(0.78,  0.62,  -2.5, 0.45,  0.15,  -0.4,   0.05),
      'pt-hero':     P(0.32,  0.5,   -0.5, 0.58, -0.1,   -0.35,  0.03),
      'pt-model':    P(0.78,  0.62,  -2.5, 0.45,  0.05,   0.5,   0),
      'pt-server':   P(0.78,  0.62,  -2.5, 0.45,  0.1,   -0.5,   0.08),
      'pt-benefits': P(0.78,  0.62,  -2.5, 0.45,  0.1,    0.6,  -0.05),
      'pt-types':    P(0.78,  0.62,  -2.5, 0.45, -0.05,  -0.5,   0),
      'pt-journey':  P(0.78,  0.62,  -2.5, 0.45,  0.2,   -0.8,  -0.1),
      'c-hero':      P(0.32,  0.5,   -0.5, 0.58, -0.1,   -0.35,  0.03),
      'c-form':      P(0.78,  0.62,  -2.5, 0.45,  0.1,    0.5,  -0.05),
      'c-locations': P(0.78,  0.62,  -2.5, 0.45,  0.05,   0.4,   0),
      'c-faq':       P(0.78,  0.62,  -2.5, 0.45, -0.1,   -0.6,   0.05)
    };

    var firstEl = document.querySelector('[data-scene]');
    var firstScene = firstEl ? firstEl.getAttribute('data-scene') : 'hero';
    var anchors = [];
    function measure() {
      anchors = Array.prototype.map.call(document.querySelectorAll('[data-scene]'), function (el) {
        var r = el.getBoundingClientRect();
        return { name: el.getAttribute('data-scene'), y: r.top + window.scrollY + r.height / 2 };
      }).sort(function (a, b) { return a.y - b.y; });
    }

    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function lerp(a, b, t) { return a + (b - a) * t; }

    function targetPose() {
      var poses = window.innerWidth < 720 ? POSES_MOBILE : POSES_DESKTOP;
      var probe = window.scrollY + window.innerHeight / 2;
      if (!anchors.length) return poses[firstScene] || poses.hero;
      if (probe <= anchors[0].y) return (poses[anchors[0].name] || poses.hero);
      for (var i = 0; i < anchors.length - 1; i++) {
        var a = anchors[i], b = anchors[i + 1];
        if (probe <= b.y) {
          var pa = (poses[a.name] || poses.hero), pb = (poses[b.name] || poses.hero);
          var raw = (probe - a.y) / (b.y - a.y);
          // the fly-through is linear so the close pass past the camera lasts
          var t = pb.z > 10 ? Math.pow(raw, 0.8) : ease(raw);
          // After flying through the camera, re-enter from below the viewport
          if (pa.z > 10) pa = Object.assign({}, pb, { fy: -2.4, rx: pb.rx + 0.8 });
          var out = {};
          for (var k in pa) out[k] = lerp(pa[k], pb[k], t);
          return out;
        }
      }
      return (poses[anchors[anchors.length - 1].name] || poses.hero);
    }

    /* ---------- Resize ---------- */
    var viewW = 1, viewH = 1;
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 720 ? 1.5 : 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      viewH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      viewW = viewH * camera.aspect;
      measure();
    }
    window.addEventListener('resize', resize);
    window.addEventListener('load', measure);
    resize();

    /* ---------- Pointer parallax ---------- */
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('pointermove', function (e) {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    /* ---------- Loop ---------- */
    var cur = Object.assign({}, POSES_DESKTOP[firstScene] || POSES_DESKTOP.hero);
    var intro = 0;           // 0 → 1 entrance
    var started = false;
    var spinAngle = 0;
    document.addEventListener('federated:start', function () { started = true; });

    var clock = new THREE.Clock();
    var running = true;
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) { clock.getDelta(); requestAnimationFrame(frame); }
    });

    var rotY = new THREE.Matrix4(), rotX = new THREE.Matrix4();

    function frame() {
      if (!running) return;
      var dt = Math.min(clock.getDelta(), 0.05);
      var time = clock.elapsedTime;
      var motion = reduceMotion ? 0 : 1;

      var tp = targetPose();
      if (Math.abs(tp.z - cur.z) > 8) Object.assign(cur, tp);   // hidden jump (behind camera → below screen)
      var k = snap ? 1 : 1 - Math.pow(0.0025, dt);               // frame-rate independent damping
      for (var key in tp) cur[key] = lerp(cur[key], tp[key], k);

      if (started || snap) intro = snap ? 1 : Math.min(1, intro + dt * 0.55);
      var ie = 1 - Math.pow(1 - intro, 3);

      mouse.x = lerp(mouse.x, mouse.tx, 1 - Math.pow(0.02, dt));
      mouse.y = lerp(mouse.y, mouse.ty, 1 - Math.pow(0.02, dt));
      spinAngle += dt * cur.spin * motion;

      logo.position.set(cur.fx * viewW / 2, cur.fy * viewH / 2, cur.z);
      logo.scale.setScalar(cur.s * lerp(0.55, 1, ie));
      logo.rotation.set(cur.rx, cur.ry + (1 - ie) * -2.4, cur.rz);

      tilt.rotation.x = motion * (Math.sin(time * 0.6) * 0.06 + mouse.y * 0.16);
      tilt.rotation.y = motion * (Math.sin(time * 0.4) * 0.12 + mouse.x * 0.26) + spinAngle;
      tilt.position.y = motion * Math.sin(time * 0.8) * 0.06;

      // Slowly orbit the hidden studio lights so highlights sweep across the glass
      rotY.makeRotationY(time * 0.18 * motion);
      rotX.makeRotationX(Math.sin(time * 0.13) * 0.25 * motion);
      envRot.setFromMatrix4(rotY.multiply(rotX));
      sharedUniforms.uTime.value = time;
      // dim the glass as it passes the camera so the statement stays readable
      sharedUniforms.uGain.value = (1 - THREE.MathUtils.smoothstep(cur.z, 5, 10.5) * 0.55)
        * (1 - THREE.MathUtils.smoothstep(cur.s, 1.5, 2.2) * 0.4);   // softer behind the footer

      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }

    // Compile shaders without blocking the main thread, then reveal
    var compiled = renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve(renderer.compile(scene, camera));
    compiled.catch(function () {}).then(function () {
      renderer.render(scene, camera);
      stage.classList.add('is-ready');
      document.dispatchEvent(new CustomEvent('federated:glass-ready'));
      requestAnimationFrame(frame);
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    setTimeout(measure, 1500);
  }
})();
