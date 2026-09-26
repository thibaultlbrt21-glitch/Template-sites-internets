/* =========================================================================
   VISUALISEUR 3D — WebGL écrit à la main, sans aucune librairie
   -------------------------------------------------------------------------
   Pourquoi pas three.js : le template ne doit dépendre d'aucun CDN. Une
   bibliothèque 3D pèse plusieurs centaines de kilo-octets et tombe avec son
   hébergeur ; ce fichier ne dépend de rien.

   Ce qu'il montre : une fenêtre deux vantaux oscillo-battante, modélisée
   d'après des photos de menuiserie réelle —
     - dormant, ouvrants au profil mouluré (un gradin vers le vitrage),
     - joint de vitrage noir, double vitrage d'un seul tenant par vantail,
     - poignée centrale sur le vantail principal, paumelles apparentes.
   Le vantail principal prend trois positions, animées : fermée, oscillo
   (basculé par le haut) et à la française (ouvert sur ses paumelles).

   Deux scènes partagent ce moteur :
     - demarre()      : le comparateur de matériaux, qu'on fait tourner ;
     - demarreIntro() : l'entrée du site. Au défilement, la fenêtre bascule
       en oscillo, se referme, s'ouvre en grand, et l'on passe au travers.
       Le mur est dessiné sur un calque transparent : à travers la vitre,
       c'est le vrai haut de page qu'on voit, pas une image qui l'imite.

   Rendu en passes : la menuiserie et le mur, le joint, puis le vitrage en
   transparence et sans écriture de profondeur — sans quoi il masquerait les
   montants situés derrière lui.

   Si WebGL manque, si la carte graphique refuse, ou si le contexte est
   perdu : on n'insiste pas, le repli CSS prend la main.
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

  // x' = x cos + z sin ; z' = -x sin + z cos
  function rotationY(a) {
    var m = identite(), c = Math.cos(a), s = Math.sin(a);
    m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
    return m;
  }

  // x' = x cos - y sin ; y' = x sin + y cos
  function rotationZ(a) {
    var m = identite(), c = Math.cos(a), s = Math.sin(a);
    m[0] = c; m[1] = s; m[4] = -s; m[5] = c;
    return m;
  }

  // y' = y cos - z sin ; z' = y sin + z cos
  function rotationX(a) {
    var m = identite(), c = Math.cos(a), s = Math.sin(a);
    m[5] = c; m[6] = s; m[9] = -s; m[10] = c;
    return m;
  }

  function borne(x, a, b) { return Math.max(a, Math.min(b, x)); }

  // Interpolation douce entre deux seuils : 0 avant a, 1 après b.
  function lisse(a, b, x) {
    var t = borne((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  // Matrice de vue d'une caméra placée en « oeil » et tournée vers « cible ».
  function regarde(oeil, cible) {
    var zx = oeil[0] - cible[0], zy = oeil[1] - cible[1], zz = oeil[2] - cible[2];
    var l = Math.sqrt(zx * zx + zy * zy + zz * zz) || 1;
    zx /= l; zy /= l; zz /= l;
    var xx = zz, xy = 0, xz = -zx;                    // haut (0, 1, 0) × z
    l = Math.sqrt(xx * xx + xz * xz) || 1;
    xx /= l; xz /= l;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    var m = new Float32Array(16);
    m[0] = xx; m[4] = xy; m[8] = xz;  m[12] = -(xx * oeil[0] + xy * oeil[1] + xz * oeil[2]);
    m[1] = yx; m[5] = yy; m[9] = yz;  m[13] = -(yx * oeil[0] + yy * oeil[1] + yz * oeil[2]);
    m[2] = zx; m[6] = zy; m[10] = zz; m[14] = -(zx * oeil[0] + zy * oeil[1] + zz * oeil[2]);
    m[15] = 1;
    return m;
  }

  // Rotation r autour d'un axe passant par (x, y, z).
  function autour(x, y, z, r) {
    return multiplie(translation(x, y, z), multiplie(r, translation(-x, -y, -z)));
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
     Géométrie
     --------------------------------------------------------------------- */

  // Un pavé, sommet par sommet, avec ses normales et ses UV.
  // Le fil de la matière suit toujours la grande longueur de chaque pièce,
  // comme sur une vraie menuiserie : sur un montant vertical, le veinage du
  // bois monte ; sur une traverse, il court à l'horizontale.
  function pave(cx, cy, cz, lx, ly, lz, echelleUV) {
    var x = lx / 2, y = ly / 2, z = lz / 2;
    var s = echelleUV || 1;
    // Décalage propre à chaque pièce : deux montants voisins ne montrent pas
    // exactement le même motif.
    var decal = (cx * 1.73 + cy * 2.31 + cz * 0.71) % 1;
    var positions = [], normales = [], uvs = [], indices = [];

    // face : origine, axe u, axe v, normale, longueur u, longueur v
    var faces = [
      [[-x,-y, z], [1,0,0], [0,1,0], [ 0, 0, 1], lx, ly],   // devant
      [[ x,-y,-z], [-1,0,0],[0,1,0], [ 0, 0,-1], lx, ly],   // derrière
      [[ x,-y, z], [0,0,-1],[0,1,0], [ 1, 0, 0], lz, ly],   // droite
      [[-x,-y,-z], [0,0,1], [0,1,0], [-1, 0, 0], lz, ly],   // gauche
      [[-x, y, z], [1,0,0], [0,0,-1],[ 0, 1, 0], lx, lz],   // dessus
      [[-x,-y,-z], [1,0,0], [0,0,1], [ 0,-1, 0], lx, lz]    // dessous
    ];

    faces.forEach(function (f) {
      var o = f[0], u = f[1], v = f[2], n = f[3], lu = f[4], lv = f[5];
      var enLong = lv > lu;
      var base = positions.length / 3;
      for (var j = 0; j < 2; j++) {
        for (var i = 0; i < 2; i++) {
          positions.push(
            cx + o[0] + u[0] * lu * i + v[0] * lv * j,
            cy + o[1] + u[1] * lu * i + v[1] * lv * j,
            cz + o[2] + u[2] * lu * i + v[2] * lv * j
          );
          normales.push(n[0], n[1], n[2]);
          if (enLong) uvs.push(j * lv * s + decal, i * lu * s);
          else        uvs.push(i * lu * s + decal, j * lv * s);
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

  // Un cadre de quatre pièces : deux traverses pleine largeur, deux montants
  // entre elles. `retrait` décale le cadre vers l'intérieur du rectangle.
  function anneau(pieces, x0, x1, y0, y1, retrait, largeur, zc, epaisseur) {
    var a = x0 + retrait, b = x1 - retrait, c = y0 + retrait, d = y1 - retrait;
    var mx = (a + b) / 2, my = (c + d) / 2, lx = b - a, ly = d - c, l = largeur;
    pieces.push(pave(mx, d - l / 2, zc, lx, l, epaisseur, 0.8));           // traverse haute
    pieces.push(pave(mx, c + l / 2, zc, lx, l, epaisseur, 0.8));           // traverse basse
    pieces.push(pave(a + l / 2, my, zc, l, ly - 2 * l, epaisseur, 0.8));   // montant gauche
    pieces.push(pave(b - l / 2, my, zc, l, ly - 2 * l, epaisseur, 0.8));   // montant droit
  }

  // Un biseau à coupes d'onglet : quatre trapèzes inclinés vers le vitrage.
  // Chaque face penche d'un côté différent, donc prend une lumière
  // différente : c'est ce qui dessine les diagonales aux quatre coins d'un
  // ouvrant mouluré, et fait lire la moulure même vue de face.
  function biseau(x0, x1, y0, y1, retrait, largeur, zHaut, zBas) {
    var a = x0 + retrait, b = x1 - retrait, c = y0 + retrait, d = y1 - retrait;
    var ia = a + largeur, ib = b - largeur, ic = c + largeur, id = d - largeur;
    // Chaque côté : deux sommets sur l'arête extérieure (haute), deux sur
    // l'arête intérieure (basse, côté vitrage). « enLong » : le côté court
    // en x ou en y, pour orienter le fil de la matière.
    var cotes = [
      { q: [[a, d], [b, d], [ib, id], [ia, id]], enX: true },    // haut
      { q: [[b, c], [a, c], [ia, ic], [ib, ic]], enX: true },    // bas
      { q: [[a, c], [a, d], [ia, id], [ia, ic]], enX: false },   // gauche
      { q: [[b, d], [b, c], [ib, ic], [ib, id]], enX: false }    // droit
    ];
    var positions = [], normales = [], uvs = [], indices = [];
    cotes.forEach(function (cote) {
      var q = cote.q;
      var P = [
        [q[0][0], q[0][1], zHaut], [q[1][0], q[1][1], zHaut],
        [q[2][0], q[2][1], zBas],  [q[3][0], q[3][1], zBas]
      ];
      var e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]];
      var e2 = [P[3][0] - P[0][0], P[3][1] - P[0][1], P[3][2] - P[0][2]];
      var n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      var l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
      var sens = n[2] < 0 ? -1 : 1;              // toujours tournée vers la pièce
      n = [n[0] / l * sens, n[1] / l * sens, n[2] / l * sens];

      var base = positions.length / 3;
      P.forEach(function (v) {
        positions.push(v[0], v[1], v[2]);
        normales.push(n[0], n[1], n[2]);
        uvs.push(cote.enX ? v[0] * 0.8 : v[1] * 0.8, cote.enX ? v[1] * 0.8 : v[0] * 0.8);
      });
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    });
    return { positions: positions, normales: normales, uvs: uvs, indices: indices };
  }

  // Cotes, en unités de scène (1 unité ≈ 1 mètre). Proportions relevées sur
  // une fenêtre PVC deux vantaux standard : profils d'ouvrant larges,
  // dormant fin, ouvrants en saillie sur le dormant.
  var COTES = {
    L: 1.30, H: 1.44,        // hors-tout du dormant
    d: 0.055,                // face vue du dormant
    ed: 0.11,                // profondeur du dormant
    r: 0.014,                // recouvrement de l'ouvrant sur le dormant
    o: 0.088,                // face vue du profil d'ouvrant
    m: 0.022,                // largeur de la moulure, côté vitrage
    zAv: 0.098,              // face avant de l'ouvrant (en saillie)
    zAr: 0.022,              // face arrière de l'ouvrant
    zV: 0.050,               // plan du vitrage
    j: 0.009                 // joint de vitrage
  };

  function fenetre() {
    var K = COTES;
    var dormant = { opaque: [] };
    var gauche = { opaque: [], joint: [], verre: [] };
    var droite = { opaque: [], poignee: [], joint: [], verre: [] };

    // --- Dormant ---
    anneau(dormant.opaque, -K.L / 2, K.L / 2, -K.H / 2, K.H / 2, 0, K.d, 0, K.ed);

    var W = K.L - 2 * K.d;                 // largeur de l'ouverture en tableau
    var ym = K.H / 2 - K.d + K.r;          // demi-hauteur d'un vantail
    var vg = { x0: -W / 2 - K.r, x1: 0 };
    var vd = { x0: 0, x1: W / 2 + K.r };

    // --- Un vantail : profil, moulure, joint, vitrage ---
    function vantail(g, v) {
      var ep = K.zAv - K.zAr, zc = (K.zAv + K.zAr) / 2;
      // Profil principal.
      anneau(g.opaque, v.x0, v.x1, -ym, ym, 0, K.o - K.m, zc, ep);
      // Moulure : un socle plus bas côté vitrage, coiffé d'un biseau à
      // coupes d'onglet qui descend du profil vers le joint.
      var creux = 0.02;
      anneau(g.opaque, v.x0, v.x1, -ym, ym, K.o - K.m, K.m, zc - creux / 2, ep - creux);
      g.opaque.push(biseau(v.x0, v.x1, -ym, ym, K.o - K.m, K.m, K.zAv, K.zAv - creux));
      // Joint noir autour du vitrage.
      anneau(g.joint, v.x0, v.x1, -ym, ym, K.o, K.j, K.zV, 0.034);
      // Double vitrage, d'un seul tenant.
      var gx0 = v.x0 + K.o + K.j * 0.5, gx1 = v.x1 - K.o - K.j * 0.5;
      var gy = ym - K.o - K.j * 0.5;
      g.verre.push(pave((gx0 + gx1) / 2, 0, K.zV, gx1 - gx0, 2 * gy, 0.024, 1));
    }

    vantail(gauche, vg);   // vantail semi-fixe
    vantail(droite, vd);   // vantail principal, oscillo-battant

    // --- Paumelles, aux angles extérieurs des deux vantaux ---
    [vg.x0 - 0.007, vd.x1 + 0.007].forEach(function (x) {
      [ym - 0.17, -ym + 0.17].forEach(function (y) {
        dormant.opaque.push(pave(x, y, K.zAr + 0.034, 0.016, 0.078, 0.022, 1));
      });
    });

    // --- Poignée centrale, sur le montant du vantail principal ---
    // La rosace et le carré sont fixes ; le levier tourne sur le carré.
    var xp = vd.x0 + (K.o - K.m) / 2;
    var yp = -0.03;
    droite.opaque.push(pave(xp, yp, K.zAv + 0.007, 0.030, 0.080, 0.014, 1));          // rosace
    droite.opaque.push(pave(xp, yp, K.zAv + 0.022, 0.014, 0.014, 0.020, 1));          // carré
    droite.poignee.push(pave(xp, yp - 0.070, K.zAv + 0.036, 0.022, 0.150, 0.016, 1)); // levier, vers le bas

    function prepare(parties) {
      var sortie = {};
      Object.keys(parties).forEach(function (k) { sortie[k] = assemble(parties[k]); });
      return sortie;
    }

    return {
      dormant: prepare(dormant),
      gauche: prepare(gauche),
      droite: prepare(droite),
      pivots: {
        oscillo:  { y: -ym, z: K.zAr },    // axe horizontal, pied du vantail principal
        battant:  { x: vd.x1, z: K.zAr },  // axe vertical, paumelles du vantail principal
        semiFixe: { x: vg.x0, z: K.zAr },  // axe vertical, paumelles du semi-fixe
        poignee:  { x: xp, y: yp, z: K.zAv + 0.022 }  // axe du carré de manœuvre
      }
    };
  }

  // Vantail principal : bascule (oscillo) puis rotation (battant).
  function transformePrincipal(pivots, bascule, rotation) {
    var o = pivots.oscillo, b = pivots.battant;
    return multiplie(autour(b.x, 0, b.z, rotationY(rotation)),
                     autour(0, o.y, o.z, rotationX(bascule)));
  }

  // Le levier de la poignée, dans le repère du vantail principal.
  // 0 = vers le bas (fermée), PI/2 = horizontal (à la française),
  // PI = vers le haut (oscillo) — la convention des oscillo-battants.
  function transformePoignee(pivots, angle) {
    var q = pivots.poignee;
    return autour(q.x, q.y, q.z, rotationZ(angle));
  }

  // Vantail semi-fixe : il ne s'ouvre qu'à la française, vers la pièce.
  function transformeSemiFixe(pivots, rotation) {
    var s = pivots.semiFixe;
    return autour(s.x, 0, s.z, rotationY(-rotation));
  }

  // Le mur autour de la fenêtre, et la tablette sous l'appui : le décor de
  // l'intro. Le mur est percé exactement aux cotes du dormant.
  function murEtTablette() {
    var K = COTES, E = 25, L = K.L, H = K.H, zc = 0.02, ep = 0.28;
    return {
      mur: assemble([
        pave(0,  (H / 2 + E) / 2, zc, 2 * E, E - H / 2, ep, 1),
        pave(0, -(H / 2 + E) / 2, zc, 2 * E, E - H / 2, ep, 1),
        pave(-(L / 2 + E) / 2, 0, zc, E - L / 2, H, ep, 1),
        pave( (L / 2 + E) / 2, 0, zc, E - L / 2, H, ep, 1)
      ]),
      tablette: assemble([pave(0, -H / 2 - 0.025, 0.26, L + 0.36, 0.05, 0.30, 1)])
    };
  }

  // Positions d'ouverture du comparateur : [bascule, rotation, poignée].
  var OUVERTURES = {
    fermee:  [0, 0, 0],
    oscillo: [0.17, 0, Math.PI],        // ~10 degrés : l'entrebâillement d'aération
    battant: [0, 1.05, Math.PI / 2]     // ~60 degrés : ouverte à la française
  };

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

  // Deux sources : une clé chaude en haut à gauche, un remplissage froid à
  // droite. uMode : 0 = matière texturée, 1 = vitrage, 2 = joint,
  // 3 = couleur unie (mur et tablette de l'intro).
  var FRAGMENT = [
    "precision mediump float;",
    "uniform sampler2D uTexture;",
    "uniform vec3 uOeil;",
    "uniform float uMode;",
    "uniform vec3 uCouleur;",
    "varying vec3 vNorm, vPos;",
    "varying vec2 vUv;",
    "",
    // Exposition puis compression à point blanc : un PVC blanc reste blanc
    // satiné au lieu de virer au gris, sans brûler les reflets.
    "vec3 developpe(vec3 c) {",
    "  c *= 1.6;",
    "  c = c * (1.0 + c / 4.84) / (1.0 + c);",
    "  return pow(c, vec3(1.0 / 2.2));",
    "}",
    "",
    "void main() {",
    "  vec3 N = normalize(vNorm);",
    "  vec3 V = normalize(uOeil - vPos);",
    "  vec3 Lc = normalize(vec3(-0.5, 0.8, 0.9));",
    "  vec3 Lr = normalize(vec3(0.9, 0.2, 0.4));",
    "  vec3 H = normalize(Lc + V);",
    "  float dc = max(dot(N, Lc), 0.0);",
    "  float dr = max(dot(N, Lr), 0.0) * 0.35;",
    "",
    "  if (uMode > 2.5) {",
    // Mur et tablette : couleur unie, éclairée par le jour qui entre par la
    // fenêtre — plus claire près de l'ouverture, plus sombre au loin.
    "    float jour = exp(-dot(vPos.xy, vPos.xy) * 0.6);",
    "    vec3 c = uCouleur * (0.25 + dc * 0.55 + dr) + uCouleur * jour * 2.2 * vec3(1.1, 1.0, 0.88);",
    "    gl_FragColor = vec4(developpe(c), 1.0);",
    "    return;",
    "  }",
    "",
    "  if (uMode > 1.5) {",
    // Joint : caoutchouc noir, légèrement satiné.
    "    vec3 noir = vec3(0.016, 0.017, 0.019);",
    "    float s = pow(max(dot(N, H), 0.0), 24.0) * 0.10;",
    "    gl_FragColor = vec4(developpe(noir * (0.35 + dc + dr) + vec3(s)), 1.0);",
    "    return;",
    "  }",
    "",
    "  if (uMode > 0.5) {",
    // Vitrage : teinte froide, reflet rasant (Fresnel), très transparent de
    // face. C'est le reflet qui fait lire le verre.
    "    float fresnel = pow(1.0 - abs(dot(N, V)), 3.0);",
    "    vec3 ciel = vec3(0.62, 0.72, 0.80);",
    "    vec3 teinte = vec3(0.24, 0.30, 0.33);",
    "    float miroir = pow(max(dot(N, H), 0.0), 90.0);",
    "    vec3 vitre = mix(teinte, ciel, fresnel) + vec3(miroir * 0.85);",
    "    vitre = pow(vitre / (vitre + vec3(1.1)), vec3(1.0 / 2.2));",
    "    gl_FragColor = vec4(vitre, 0.30 + fresnel * 0.50);",
    "    return;",
    "  }",
    "",
    // La texture est en sRGB : on la ramène en linéaire avant d'éclairer,
    // sinon la correction gamma finale la délaverait une seconde fois.
    "  vec3 base = pow(texture2D(uTexture, vUv).rgb, vec3(2.2));",
    "  float spec = pow(max(dot(N, H), 0.0), 36.0) * 0.16;",
    "  vec3 couleur = base * 0.22",
    "               + base * dc * vec3(1.04, 1.0, 0.94)",
    "               + base * dr * vec3(0.80, 0.88, 1.0)",
    "               + vec3(spec);",
    "  gl_FragColor = vec4(developpe(couleur), 1.0);",
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
     Socle commun : contexte, programme, tampons, texture
     --------------------------------------------------------------------- */

  function prepareGL(canvas, transparent) {
    var gl = null;
    var reglages = { antialias: true, alpha: !!transparent, premultipliedAlpha: true };
    try {
      gl = canvas.getContext("webgl", reglages) || canvas.getContext("experimental-webgl", reglages);
    } catch (e) { gl = null; }
    if (!gl) return null;

    var programme = gl.createProgram();
    var vs = compile(gl, gl.VERTEX_SHADER, SOMMET);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return null;
    gl.attachShader(programme, vs);
    gl.attachShader(programme, fs);
    gl.linkProgram(programme);
    if (!gl.getProgramParameter(programme, gl.LINK_STATUS)) {
      console.warn("[Webly 3D] édition de liens :", gl.getProgramInfoLog(programme));
      return null;
    }
    gl.useProgram(programme);

    var attr = {
      pos: gl.getAttribLocation(programme, "aPos"),
      norm: gl.getAttribLocation(programme, "aNorm"),
      uv: gl.getAttribLocation(programme, "aUv")
    };
    gl.enableVertexAttribArray(attr.pos);
    gl.enableVertexAttribArray(attr.norm);
    gl.enableVertexAttribArray(attr.uv);

    var u = {
      proj: gl.getUniformLocation(programme, "uProj"),
      vue: gl.getUniformLocation(programme, "uVue"),
      modele: gl.getUniformLocation(programme, "uModele"),
      norm: gl.getUniformLocation(programme, "uNorm"),
      oeil: gl.getUniformLocation(programme, "uOeil"),
      texture: gl.getUniformLocation(programme, "uTexture"),
      mode: gl.getUniformLocation(programme, "uMode"),
      couleur: gl.getUniformLocation(programme, "uCouleur")
    };

    // Un groupe = un jeu de tampons prêt à dessiner.
    function groupe(donnees) {
      function tampon(tableau) {
        var b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, tableau, gl.STATIC_DRAW);
        return b;
      }
      var indices = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, donnees.indices, gl.STATIC_DRAW);
      return {
        pos: tampon(donnees.positions),
        norm: tampon(donnees.normales),
        uv: tampon(donnees.uvs),
        indices: indices,
        nombre: donnees.indices.length
      };
    }

    // Les parties d'un ouvrage (opaque, joint, verre) en groupes.
    function groupes(parties) {
      var sortie = {};
      Object.keys(parties).forEach(function (k) { sortie[k] = groupe(parties[k]); });
      return sortie;
    }

    function dessine(g, mode, modele, couleur) {
      if (!g || !g.nombre) return;
      gl.uniform1f(u.mode, mode);
      if (couleur) gl.uniform3fv(u.couleur, couleur);
      gl.uniformMatrix4fv(u.modele, false, modele);
      gl.uniformMatrix3fv(u.norm, false, normale3x3(modele));
      gl.bindBuffer(gl.ARRAY_BUFFER, g.pos);
      gl.vertexAttribPointer(attr.pos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.norm);
      gl.vertexAttribPointer(attr.norm, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.uv);
      gl.vertexAttribPointer(attr.uv, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.indices);
      gl.drawElements(gl.TRIANGLES, g.nombre, gl.UNSIGNED_SHORT, 0);
    }

    // Texture : un pixel neutre en attendant la vraie, pour qu'il n'y ait
    // pas de clignotement au premier rendu.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([230, 228, 222, 255]));
    gl.uniform1i(u.texture, 0);

    var chargementEnCours = 0;
    function chargeTexture(src, fait) {
      var jeton = ++chargementEnCours;
      var img = new Image();
      img.onload = function () {
        if (jeton !== chargementEnCours) return;   // une autre matière a été demandée entre-temps
        // WebGL 1 n'autorise la répétition d'une texture qu'en puissance de
        // deux. On redessine donc l'image sur un canevas 512 x 512 : la
        // matière se répète le long des profils au lieu d'être étirée.
        var toile = document.createElement("canvas");
        toile.width = toile.height = 512;
        toile.getContext("2d").drawImage(img, 0, 0, 512, 512);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, toile);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (fait) fait();
      };
      img.onerror = function () {
        console.warn("[Webly 3D] texture de matériau introuvable :", src);
      };
      img.src = src;
    }

    function camera(proj, vue, oeil) {
      gl.uniformMatrix4fv(u.proj, false, proj);
      gl.uniformMatrix4fv(u.vue, false, vue);
      gl.uniform3fv(u.oeil, oeil);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    }

    gl.enable(gl.DEPTH_TEST);
    // Couleur et alpha mélangés séparément : sur un calque transparent,
    // l'alpha doit s'accumuler, sinon la page apparaîtrait à travers le mur.
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // Les deux passes de rendu : opaque (menuiserie, joint, décor), puis
    // vitrage en transparence sans écriture de profondeur.
    function passeOpaque() { gl.disable(gl.BLEND); gl.depthMask(true); }
    function passeVerre() { gl.enable(gl.BLEND); gl.depthMask(false); }
    function finPasses() { gl.depthMask(true); }

    return {
      gl: gl, groupe: groupe, groupes: groupes, dessine: dessine,
      chargeTexture: chargeTexture, camera: camera,
      passeOpaque: passeOpaque, passeVerre: passeVerre, finPasses: finPasses
    };
  }

  /* ---------------------------------------------------------------------
     Scène 1 — le comparateur de matériaux
     --------------------------------------------------------------------- */

  function demarre(options) {
    var scene = options.scene;
    var canvas = scene.querySelector("canvas");
    if (!canvas) return null;

    var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ctx = prepareGL(canvas, false);
    if (!ctx) {
      // Pas de WebGL : le repli CSS est déjà dans la page, on l'affiche.
      scene.classList.add("sans-webgl");
      return null;
    }
    var gl = ctx.gl;
    gl.clearColor(0.118, 0.141, 0.153, 1);

    var geo = fenetre();
    var G = { dormant: ctx.groupes(geo.dormant), gauche: ctx.groupes(geo.gauche), droite: ctx.groupes(geo.droite) };

    function chargeTexture(src) {
      ctx.chargeTexture(src, function () { scene.setAttribute("data-texture", "chargee"); });
    }

    /* ---- Ouverture du vantail principal ---- */
    var ouverture = { bascule: 0, rotation: 0, poignee: 0, cible: "oscillo" };
    if (options.ouverture && OUVERTURES[options.ouverture]) ouverture.cible = options.ouverture;

    function avanceOuverture() {
      var cible = OUVERTURES[ouverture.cible];
      if (reduit) {
        ouverture.bascule = cible[0];
        ouverture.rotation = cible[1];
        ouverture.poignee = cible[2];
      } else {
        // Comme sur une vraie quincaillerie : le vantail ne bouge que si la
        // poignée est dans la bonne position, et la poignée ne tourne que
        // vantail fermé. Changer de position referme donc d'abord, tourne
        // la poignée, puis ouvre — jamais bascule et pivot à la fois.
        var poigneeEnPlace = Math.abs(ouverture.poignee - cible[2]) < 0.02;
        var viseB = poigneeEnPlace ? cible[0] : 0;
        var viseR = poigneeEnPlace ? cible[1] : 0;
        ouverture.bascule += (viseB - ouverture.bascule) * 0.09;
        ouverture.rotation += (viseR - ouverture.rotation) * 0.07;
        var ferme = ouverture.bascule < 0.004 && ouverture.rotation < 0.004;
        if (ferme && !poigneeEnPlace) ouverture.poignee += (cible[2] - ouverture.poignee) * 0.16;
        if (poigneeEnPlace) ouverture.poignee = cible[2];
      }
      var atteinte = Math.abs(ouverture.bascule - cible[0]) < 0.003 &&
                     Math.abs(ouverture.rotation - cible[1]) < 0.003 &&
                     Math.abs(ouverture.poignee - cible[2]) < 0.02;
      scene.setAttribute("data-ouverture-atteinte", atteinte ? "oui" : "non");
    }

    function changeOuverture(nom) {
      if (!OUVERTURES[nom]) return;
      ouverture.cible = nom;
      scene.setAttribute("data-ouverture", nom);
    }
    scene.setAttribute("data-ouverture", ouverture.cible);

    /* ---- Manipulation ----
       Au repos, la fenêtre se balance doucement autour d'un trois-quarts,
       comme sur un présentoir : elle ne passe jamais de profil ou de dos
       sans qu'on le lui demande. */
    var repos = typeof options.angle === "number" ? options.angle : 0.5;
    var phase = 0, angleY = repos;
    var angleX = typeof options.inclinaison === "number" ? options.inclinaison : 0.08;
    var manipule = false, dernierX = 0, dernierY = 0, elan = 0;

    function saisit() {
      repos = angleY;
      phase = 0;
      scene.classList.add("est-manipulee");
    }

    function pointeurBas(e) {
      manipule = true;
      elan = 0;
      dernierX = e.clientX; dernierY = e.clientY;
      saisit();
      if (scene.setPointerCapture) scene.setPointerCapture(e.pointerId);
    }
    function pointeurBouge(e) {
      if (!manipule) return;
      var dx = e.clientX - dernierX, dy = e.clientY - dernierY;
      dernierX = e.clientX; dernierY = e.clientY;
      angleY += dx * 0.0085;
      repos = angleY;
      elan = dx * 0.0085;
      angleX = borne(angleX + dy * 0.006, -0.7, 0.7);
      e.preventDefault();
    }
    function pointeurHaut(e) {
      manipule = false;
      if (scene.hasPointerCapture && e.pointerId !== undefined && scene.hasPointerCapture(e.pointerId)) {
        scene.releasePointerCapture(e.pointerId);
      }
    }

    scene.addEventListener("pointerdown", pointeurBas);
    scene.addEventListener("pointermove", pointeurBouge, { passive: false });
    scene.addEventListener("pointerup", pointeurHaut);
    scene.addEventListener("pointercancel", pointeurHaut);
    scene.addEventListener("pointerleave", pointeurHaut);

    // Accessible au clavier : la scène est focusable, les flèches tournent.
    scene.addEventListener("keydown", function (e) {
      var pas = 0.18;
      if (e.key === "ArrowLeft")       { saisit(); angleY -= pas; }
      else if (e.key === "ArrowRight") { saisit(); angleY += pas; }
      else if (e.key === "ArrowUp")    { saisit(); angleX = borne(angleX - pas / 2, -0.7, 0.7); }
      else if (e.key === "ArrowDown")  { saisit(); angleX = borne(angleX + pas / 2, -0.7, 0.7); }
      else return;
      repos = angleY;
      e.preventDefault();
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

    var distance = 3.7;
    var vue = translation(0, 0, -distance);
    var oeil = new Float32Array([0, 0, distance]);
    var enMarche = true;
    var visible = true;

    function dessine() {
      if (!enMarche) return;
      window.requestAnimationFrame(dessine);
      if (!visible) return;

      redimensionne();

      if (!manipule) {
        repos += elan;
        elan *= 0.94;
        if (Math.abs(elan) < 0.0002) elan = 0;
        if (!reduit) phase += 0.006;
        angleY = repos + Math.sin(phase) * 0.3;
      }
      avanceOuverture();

      var mFixe = multiplie(rotationY(angleY), rotationX(angleX));
      var mPrincipal = multiplie(mFixe, transformePrincipal(geo.pivots, ouverture.bascule, ouverture.rotation));
      var mPoignee = multiplie(mPrincipal, transformePoignee(geo.pivots, ouverture.poignee));

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      ctx.camera(perspective(Math.PI / 4.6, largeur / hauteur, 0.1, 100), vue, oeil);

      ctx.passeOpaque();
      ctx.dessine(G.dormant.opaque, 0, mFixe);
      ctx.dessine(G.gauche.opaque, 0, mFixe);
      ctx.dessine(G.droite.opaque, 0, mPrincipal);
      ctx.dessine(G.droite.poignee, 0, mPoignee);
      ctx.dessine(G.gauche.joint, 2, mFixe);
      ctx.dessine(G.droite.joint, 2, mPrincipal);

      ctx.passeVerre();
      ctx.dessine(G.gauche.verre, 1, mFixe);
      ctx.dessine(G.droite.verre, 1, mPrincipal);
      ctx.finPasses();
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
      changeTexture: chargeTexture,
      changeOuverture: changeOuverture,
      arrete: function () { enMarche = false; }
    };
  }

  /* ---------------------------------------------------------------------
     Scène 2 — l'intro : entrer dans le site par la fenêtre

     Pilotée uniquement par le défilement : aucune boucle d'animation, on
     ne redessine que quand la page bouge. La progression p va de 0 (haut de
     page) à 1 (fin de l'intro) :

       0,02 → 0,07  la poignée se relève
       0,08 → 0,26  le vantail principal bascule en oscillo
       0,30 → 0,38  il se referme (il ne peut pas pivoter en restant basculé)
       0,38 → 0,41  la poignée passe à l'horizontale
       0,42 → 0,60  le vantail s'ouvre à la française
       0,50 → 0,68  le semi-fixe s'ouvre à son tour
       0,56 → 0,97  la caméra avance et passe par l'ouverture
     --------------------------------------------------------------------- */

  function demarreIntro(options) {
    var zone = options.zone, scene = options.scene;
    var canvas = scene && scene.querySelector("canvas");
    if (!zone || !canvas) return null;

    var ctx = prepareGL(canvas, true);
    if (!ctx) return null;
    var gl = ctx.gl;
    gl.clearColor(0, 0, 0, 0);            // transparent : la page se voit par l'ouverture

    var geo = fenetre();
    var G = { dormant: ctx.groupes(geo.dormant), gauche: ctx.groupes(geo.gauche), droite: ctx.groupes(geo.droite) };
    var decor = murEtTablette();
    var mur = ctx.groupe(decor.mur), tablette = ctx.groupe(decor.tablette);
    var TEINTE_MUR = new Float32Array([0.012, 0.0125, 0.013]);      // pièce dans la pénombre, en linéaire
    var TEINTE_TABLETTE = new Float32Array([0.30, 0.285, 0.26]);    // pierre claire
    var I = identite();

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var largeur = 0, hauteur = 0;
    function redimensionne() {
      var r = scene.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width * dpr));
      var h = Math.max(1, Math.round(r.height * dpr));
      if (w === largeur && h === hauteur) return false;
      largeur = w; hauteur = h;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      return true;
    }

    function progression() {
      var r = zone.getBoundingClientRect();
      var course = zone.offsetHeight - window.innerHeight;
      if (course <= 0) return 1;
      return borne(-r.top / course, 0, 1);
    }

    var derniere = -1, demande = false, enMarche = true;

    function rendu(force) {
      demande = false;
      if (!enMarche) return;
      var p = progression();
      var retaille = redimensionne();
      if (!force && !retaille && Math.abs(p - derniere) < 0.0005) return;
      derniere = p;
      scene.setAttribute("data-progression", p.toFixed(3));
      if (options.surProgression) options.surProgression(p);

      var poignee = Math.PI * lisse(0.02, 0.07, p) - (Math.PI / 2) * lisse(0.38, 0.41, p);
      var bascule = 0.2 * (lisse(0.08, 0.26, p) - lisse(0.30, 0.38, p));
      var rotPrincipal = 1.50 * lisse(0.42, 0.60, p);
      var rotSemiFixe = 1.45 * lisse(0.50, 0.68, p);
      var avance = lisse(0.56, 0.97, p);

      // Distance de départ : la fenêtre occupe environ 60 % de la hauteur
      // d'écran, et jamais plus de 80 % de sa largeur — sur un téléphone en
      // portrait, c'est la largeur qui commande.
      var aspect = largeur / hauteur;
      var fov0 = Math.PI / 4, t = Math.tan(fov0 / 2);
      var d0 = Math.max((COTES.H / 0.62) / (2 * t), (COTES.L / 0.8) / (2 * t * aspect));
      var zCam = d0 + (-0.8 - d0) * avance;
      var biais = 1 - lisse(0.36, 0.64, p);
      var xCam = -0.6 * biais, yCam = 0.02 + 0.28 * biais;
      var oeil = [xCam, yCam, zCam];

      // Au départ on regarde le centre de la fenêtre ; à mesure que le biais
      // s'efface, on regarde droit devant — la caméra peut alors traverser
      // le plan de la fenêtre sans se retourner.
      var versCentre = [-xCam, -yCam, -zCam];
      var l = Math.sqrt(versCentre[0] * versCentre[0] + versCentre[1] * versCentre[1] + versCentre[2] * versCentre[2]) || 1;
      var dir = [versCentre[0] / l * biais, versCentre[1] / l * biais, versCentre[2] / l * biais - (1 - biais)];
      var cible = [xCam + dir[0], yCam + dir[1], zCam + dir[2]];

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      ctx.camera(perspective(fov0 + avance * 0.25, aspect, 0.03, 60),
                 regarde(oeil, cible),
                 new Float32Array(oeil));

      var mPrincipal = transformePrincipal(geo.pivots, bascule, rotPrincipal);
      var mPoignee = multiplie(mPrincipal, transformePoignee(geo.pivots, poignee));
      var mSemiFixe = transformeSemiFixe(geo.pivots, rotSemiFixe);

      ctx.passeOpaque();
      ctx.dessine(mur, 3, I, TEINTE_MUR);
      ctx.dessine(tablette, 3, I, TEINTE_TABLETTE);
      ctx.dessine(G.dormant.opaque, 0, I);
      ctx.dessine(G.gauche.opaque, 0, mSemiFixe);
      ctx.dessine(G.droite.opaque, 0, mPrincipal);
      ctx.dessine(G.droite.poignee, 0, mPoignee);
      ctx.dessine(G.gauche.joint, 2, mSemiFixe);
      ctx.dessine(G.droite.joint, 2, mPrincipal);

      ctx.passeVerre();
      ctx.dessine(G.gauche.verre, 1, mSemiFixe);
      ctx.dessine(G.droite.verre, 1, mPrincipal);
      ctx.finPasses();
    }

    function planifie() {
      if (demande) return;
      demande = true;
      window.requestAnimationFrame(function () { rendu(false); });
    }

    window.addEventListener("scroll", planifie, { passive: true });
    window.addEventListener("resize", function () {
      window.requestAnimationFrame(function () { rendu(true); });
    });

    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      enMarche = false;
      if (options.surPerte) options.surPerte();
    });

    ctx.chargeTexture(options.texture || "assets/images/materiau-pvc.svg", function () {
      scene.setAttribute("data-texture", "chargee");
      rendu(true);
    });
    rendu(true);

    return {
      progression: progression,
      redessine: function () { rendu(true); },
      // Abandon (appareil trop lent, contexte perdu) : on cesse d'écouter
      // le défilement, le haut de page classique reprend la main.
      arrete: function () {
        enMarche = false;
        window.removeEventListener("scroll", planifie);
      }
    };
  }

  return { demarre: demarre, demarreIntro: demarreIntro };
})();
