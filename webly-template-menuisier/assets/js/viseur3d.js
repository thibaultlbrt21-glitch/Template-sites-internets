/* =========================================================================
   VISUALISEUR 3D — WebGL écrit à la main, sans aucune librairie
   -------------------------------------------------------------------------
   Pourquoi pas three.js : le template ne doit dépendre d'aucun CDN. Une
   bibliothèque 3D pèse 600 ko et tombe avec son hébergeur ; ce fichier fait
   quelques kilo-octets et ne dépend de rien.

   Ce qu'il fait : un meuble (caisson + étagères + pieds) construit par le
   code, texturé avec l'échantillon de bois choisi, éclairé en Blinn-Phong,
   que le visiteur fait tourner au doigt ou à la souris.

   Si WebGL manque, si la carte graphique refuse, ou si le visiteur demande
   moins d'animations : on n'insiste pas, le repli CSS prend la main.
   ========================================================================= */

window.WEBLY_VISEUR = (function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Algèbre — juste ce dont on a besoin, en colonnes (convention WebGL)
     --------------------------------------------------------------------- */

  function identite() {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  }

  function multiplie(a, b) {
    var out = new Float32Array(16);
    for (var c = 0; c < 4; c++) {
      for (var l = 0; l < 4; l++) {
        var somme = 0;
        for (var k = 0; k < 4; k++) somme += a[k * 4 + l] * b[c * 4 + k];
        out[c * 4 + l] = somme;
      }
    }
    return out;
  }

  function perspective(fovy, aspect, proche, loin) {
    var f = 1 / Math.tan(fovy / 2);
    var out = new Float32Array(16);
    out[0] = f / aspect; out[5] = f;
    out[10] = (loin + proche) / (proche - loin); out[11] = -1;
    out[14] = (2 * loin * proche) / (proche - loin);
    return out;
  }

  function translation(x, y, z) {
    var m = identite();
    m[12] = x; m[13] = y; m[14] = z;
    return m;
  }

  function rotationY(a) {
    var m = identite(), c = Math.cos(a), s = Math.sin(a);
    m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
    return m;
  }

  function rotationX(a) {
    var m = identite(), c = Math.cos(a), s = Math.sin(a);
    m[5] = c; m[6] = s; m[9] = -s; m[10] = c;
    return m;
  }

  // Inverse-transposée de la partie 3x3 : indispensable pour que les
  // normales restent perpendiculaires après rotation.
  function normale3x3(m) {
    var a00=m[0],a01=m[1],a02=m[2], a10=m[4],a11=m[5],a12=m[6], a20=m[8],a21=m[9],a22=m[10];
    var b01 =  a22*a11 - a12*a21,
        b11 = -a22*a10 + a12*a20,
        b21 =  a21*a10 - a11*a20;
    var det = a00*b01 + a01*b11 + a02*b21;
    if (!det) return new Float32Array([1,0,0, 0,1,0, 0,0,1]);
    det = 1 / det;
    return new Float32Array([
      b01*det, (-a22*a01 + a02*a21)*det, ( a12*a01 - a02*a11)*det,
      b11*det, ( a22*a00 - a02*a20)*det, (-a12*a00 + a02*a10)*det,
      b21*det, (-a21*a00 + a01*a20)*det, ( a11*a00 - a01*a10)*det
    ]);
  }

  /* ---------------------------------------------------------------------
     Géométrie — un pavé, sommet par sommet, avec ses UV.
     Le meuble est un assemblage de pavés : c'est exactement ainsi qu'on
     dessine un meuble sur un plan.
     --------------------------------------------------------------------- */

  function pave(cx, cy, cz, lx, ly, lz, echelleUV) {
    var x = lx / 2, y = ly / 2, z = lz / 2;
    var s = echelleUV || 1;
    var positions = [], normales = [], uvs = [], indices = [];

    // face: origine, axe u, axe v, normale, largeur u, largeur v
    var faces = [
      [[-x,-y, z], [1,0,0], [0,1,0], [ 0, 0, 1], lx, ly],  // devant
      [[ x,-y,-z], [-1,0,0],[0,1,0], [ 0, 0,-1], lx, ly],  // derrière
      [[ x,-y, z], [0,0,-1],[0,1,0], [ 1, 0, 0], lz, ly],  // droite
      [[-x,-y,-z], [0,0,1], [0,1,0], [-1, 0, 0], lz, ly],  // gauche
      [[-x, y, z], [1,0,0], [0,0,-1],[ 0, 1, 0], lx, lz],  // dessus
      [[-x,-y,-z], [1,0,0], [0,0,1], [ 0,-1, 0], lx, lz]   // dessous
    ];

    faces.forEach(function (f) {
      var o = f[0], u = f[1], v = f[2], n = f[3], lu = f[4], lv = f[5];
      var base = positions.length / 3;
      for (var j = 0; j < 2; j++) {
        for (var i = 0; i < 2; i++) {
          positions.push(
            cx + o[0] + u[0] * lu * i + v[0] * lv * j,
            cy + o[1] + u[1] * lu * i + v[1] * lv * j,
            cz + o[2] + u[2] * lu * i + v[2] * lv * j
          );
          normales.push(n[0], n[1], n[2]);
          uvs.push(i * lu * s, j * lv * s);
        }
      }
      indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
    });

    return { positions: positions, normales: normales, uvs: uvs, indices: indices };
  }

  function assemble(pieces) {
    var positions = [], normales = [], uvs = [], indices = [], decalage = 0;
    pieces.forEach(function (p) {
      positions.push.apply(positions, p.positions);
      normales.push.apply(normales, p.normales);
      uvs.push.apply(uvs, p.uvs);
      for (var i = 0; i < p.indices.length; i++) indices.push(p.indices[i] + decalage);
      decalage += p.positions.length / 3;
    });
    return {
      positions: new Float32Array(positions),
      normales: new Float32Array(normales),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }

  // Un meuble-bibliothèque : deux montants, un fond, trois tablettes,
  // un socle. Les proportions sont celles d'un meuble réel.
  function meuble() {
    var H = 2.0, L = 1.5, P = 0.42, e = 0.07;
    var pieces = [
      pave(-L/2 + e/2, 0, 0, e, H, P, 1.1),          // montant gauche
      pave( L/2 - e/2, 0, 0, e, H, P, 1.1),          // montant droit
      pave(0, 0, -P/2 + e/3, L - e*2, H, e/1.5, 1),  // fond
      pave(0, -H/2 + e/2, 0, L, e, P, 1),            // socle
      pave(0,  H/2 - e/2, 0, L, e, P, 1)             // dessus
    ];
    [-0.42, 0.02, 0.46].forEach(function (y) {        // tablettes
      pieces.push(pave(0, y * H / 2 * 1.02, 0, L - e * 2, e * 0.8, P - e / 2, 1));
    });
    [-1, 1].forEach(function (s) {                    // pieds
      [-1, 1].forEach(function (t) {
        pieces.push(pave(s * (L / 2 - 0.12), -H / 2 - 0.07, t * (P / 2 - 0.1), 0.06, 0.14, 0.06, 1));
      });
    });
    return assemble(pieces);
  }

  /* ---------------------------------------------------------------------
     Nuanceurs
     --------------------------------------------------------------------- */

  var SOMMET = [
    "attribute vec3 aPos;",
    "attribute vec3 aNorm;",
    "attribute vec2 aUv;",
    "uniform mat4 uProj, uVue, uModele;",
    "uniform mat3 uNorm;",
    "varying vec3 vNorm, vPos;",
    "varying vec2 vUv;",
    "void main() {",
    "  vec4 monde = uModele * vec4(aPos, 1.0);",
    "  vPos = monde.xyz;",
    "  vNorm = normalize(uNorm * aNorm);",
    "  vUv = aUv;",
    "  gl_Position = uProj * uVue * monde;",
    "}"
  ].join("\n");

  // Deux sources : une clé chaude en haut à gauche (la verrière de
  // l'atelier), un remplissage froid à droite. C'est ce contraste qui
  // donne du volume plutôt qu'un aplat.
  var FRAGMENT = [
    "precision mediump float;",
    "uniform sampler2D uTexture;",
    "uniform vec3 uOeil;",
    "varying vec3 vNorm, vPos;",
    "varying vec2 vUv;",
    "void main() {",
    "  vec3 N = normalize(vNorm);",
    "  vec3 V = normalize(uOeil - vPos);",
    // La texture est en sRGB : on la ramène en linéaire avant d'éclairer,
    // sinon la correction gamma finale la délaverait une seconde fois.
    "  vec3 base = pow(texture2D(uTexture, vUv).rgb, vec3(2.2));",
    "",
    "  vec3 Lc = normalize(vec3(-0.55, 0.85, 0.7));",
    "  vec3 Lr = normalize(vec3(0.9, 0.15, 0.35));",
    "",
    "  float dc = max(dot(N, Lc), 0.0);",
    "  float dr = max(dot(N, Lr), 0.0) * 0.32;",
    "",
    "  vec3 H = normalize(Lc + V);",
    "  float spec = pow(max(dot(N, H), 0.0), 42.0) * 0.20;",
    "",
    "  vec3 ambiant = base * 0.14;",
    "  vec3 cle = base * dc * vec3(1.06, 0.98, 0.86);",
    "  vec3 remplissage = base * dr * vec3(0.72, 0.82, 0.95);",
    "",
    "  vec3 couleur = ambiant + cle + remplissage + vec3(spec);",
    "  couleur = couleur / (couleur + vec3(1.35));",         // compression douce
    "  couleur = pow(couleur, vec3(1.0 / 2.2));",            // correction gamma
    "  gl_FragColor = vec4(couleur, 1.0);",
    "}"
  ].join("\n");

  function compile(gl, type, source) {
    var s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("[Webly 3D] compilation :", gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  /* ---------------------------------------------------------------------
     Mise en route
     --------------------------------------------------------------------- */

  function demarre(options) {
    var scene = options.scene;
    var canvas = scene.querySelector("canvas");
    if (!canvas) return null;

    var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var gl = null;
    try {
      gl = canvas.getContext("webgl", { antialias: true, alpha: false })
        || canvas.getContext("experimental-webgl", { antialias: true, alpha: false });
    } catch (e) { gl = null; }

    if (!gl) {
      // Pas de WebGL : le repli CSS est déjà dans la page, on l'affiche.
      scene.classList.add("sans-webgl");
      return null;
    }

    var programme = gl.createProgram();
    var vs = compile(gl, gl.VERTEX_SHADER, SOMMET);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) { scene.classList.add("sans-webgl"); return null; }
    gl.attachShader(programme, vs);
    gl.attachShader(programme, fs);
    gl.linkProgram(programme);
    if (!gl.getProgramParameter(programme, gl.LINK_STATUS)) {
      console.warn("[Webly 3D] édition de liens :", gl.getProgramInfoLog(programme));
      scene.classList.add("sans-webgl");
      return null;
    }
    gl.useProgram(programme);

    var geo = meuble();

    function tampon(donnees, nom, taille) {
      var b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, donnees, gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(programme, nom);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, taille, gl.FLOAT, false, 0, 0);
    }
    tampon(geo.positions, "aPos", 3);
    tampon(geo.normales, "aNorm", 3);
    tampon(geo.uvs, "aUv", 2);

    var tamponIndices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tamponIndices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);

    var u = {
      proj: gl.getUniformLocation(programme, "uProj"),
      vue: gl.getUniformLocation(programme, "uVue"),
      modele: gl.getUniformLocation(programme, "uModele"),
      norm: gl.getUniformLocation(programme, "uNorm"),
      oeil: gl.getUniformLocation(programme, "uOeil"),
      texture: gl.getUniformLocation(programme, "uTexture")
    };

    // Texture : un pixel de bois en attendant que l'échantillon arrive,
    // pour que rien ne clignote au premier rendu.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([185, 138, 82, 255]));
    gl.uniform1i(u.texture, 0);

    var chargementEnCours = 0;
    function chargeTexture(src) {
      var jeton = ++chargementEnCours;
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        if (jeton !== chargementEnCours) return;   // une autre essence a été demandée entre-temps
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        // Les SVG rendus ne sont pas garantis en puissance de deux :
        // on reste en CLAMP + LINEAR, qui n'exige rien.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        scene.setAttribute("data-texture", "chargee");
      };
      img.onerror = function () {
        console.warn("[Webly 3D] échantillon introuvable :", src);
      };
      img.src = src;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.118, 0.141, 0.153, 1);

    /* ---- Manipulation ---- */
    var angleY = -0.62, angleX = -0.16;
    var vitesse = reduit ? 0 : 0.0035;
    var manipule = false, dernierX = 0, dernierY = 0, elan = 0;

    function pointeurBas(e) {
      manipule = true;
      elan = 0;
      dernierX = e.clientX; dernierY = e.clientY;
      scene.classList.add("est-manipulee");
      scene.setPointerCapture && scene.setPointerCapture(e.pointerId);
    }
    function pointeurBouge(e) {
      if (!manipule) return;
      var dx = e.clientX - dernierX, dy = e.clientY - dernierY;
      dernierX = e.clientX; dernierY = e.clientY;
      angleY += dx * 0.0085;
      elan = dx * 0.0085;
      angleX = Math.max(-0.75, Math.min(0.75, angleX + dy * 0.006));
      e.preventDefault();
    }
    function pointeurHaut(e) {
      manipule = false;
      scene.releasePointerCapture && e.pointerId !== undefined &&
        scene.hasPointerCapture && scene.hasPointerCapture(e.pointerId) &&
        scene.releasePointerCapture(e.pointerId);
    }

    scene.addEventListener("pointerdown", pointeurBas);
    scene.addEventListener("pointermove", pointeurBouge, { passive: false });
    scene.addEventListener("pointerup", pointeurHaut);
    scene.addEventListener("pointercancel", pointeurHaut);
    scene.addEventListener("pointerleave", pointeurHaut);

    // Accessible au clavier : la scène est focusable, les flèches tournent.
    scene.addEventListener("keydown", function (e) {
      var pas = 0.18;
      if (e.key === "ArrowLeft")       { angleY -= pas; e.preventDefault(); }
      else if (e.key === "ArrowRight") { angleY += pas; e.preventDefault(); }
      else if (e.key === "ArrowUp")    { angleX = Math.max(-0.75, angleX - pas / 2); e.preventDefault(); }
      else if (e.key === "ArrowDown")  { angleX = Math.min(0.75, angleX + pas / 2); e.preventDefault(); }
      else return;
      scene.classList.add("est-manipulee");
    });

    /* ---- Rendu ---- */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var largeur = 0, hauteur = 0;

    function redimensionne() {
      var r = scene.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width * dpr));
      var h = Math.max(1, Math.round(r.height * dpr));
      if (w === largeur && h === hauteur) return;
      largeur = w; hauteur = h;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    var vue = translation(0, 0, -4.6);
    var oeil = new Float32Array([0, 0, 4.6]);
    var enMarche = true;
    var visible = true;

    function dessine() {
      if (!enMarche) return;
      window.requestAnimationFrame(dessine);
      if (!visible) return;

      redimensionne();

      if (!manipule) {
        angleY += vitesse + elan;
        elan *= 0.94;
        if (Math.abs(elan) < 0.0002) elan = 0;
      }

      var modele = multiplie(rotationY(angleY), rotationX(angleX));
      var proj = perspective(Math.PI / 4.6, largeur / hauteur, 0.1, 100);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(u.proj, false, proj);
      gl.uniformMatrix4fv(u.vue, false, vue);
      gl.uniformMatrix4fv(u.modele, false, modele);
      gl.uniformMatrix3fv(u.norm, false, normale3x3(modele));
      gl.uniform3fv(u.oeil, oeil);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.drawElements(gl.TRIANGLES, geo.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    // Hors écran, on ne calcule rien : inutile de chauffer le téléphone
    // d'un visiteur pour une scène qu'il ne regarde pas.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entrees) {
        visible = entrees[0].isIntersecting;
      }, { threshold: 0.05 }).observe(scene);
    }

    // Le contexte peut être repris par le navigateur (mémoire, onglet en
    // arrière-plan). On ne laisse pas une zone noire : on bascule au repli.
    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      enMarche = false;
      scene.classList.add("sans-webgl");
    });

    window.addEventListener("resize", redimensionne);
    redimensionne();
    dessine();

    return {
      changeEssence: chargeTexture,
      arrete: function () { enMarche = false; }
    };
  }

  return { demarre: demarre };
})();
