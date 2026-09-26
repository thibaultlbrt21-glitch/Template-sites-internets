/* =========================================================================
   VISUALISEUR 3D — WebGL écrit à la main, sans aucune librairie
   -------------------------------------------------------------------------
   Pourquoi pas three.js : le template ne doit dépendre d'aucun CDN. Une
   bibliothèque 3D pèse plusieurs centaines de kilo-octets et tombe avec son
   hébergeur ; ce fichier ne dépend de rien.

   Ce qu'il montre : une fenêtre PVC deux vantaux oscillo-battante, aux cotes
   réelles d'un produit du commerce (105 x 108 cm) —
     - dormant, ouvrants au profil mouluré, arêtes adoucies ;
     - joint de vitrage, double vitrage d'un seul tenant par vantail ;
     - poignée centrale articulée, paumelles, têtières métalliques sur les
       chants, compas d'oscillo qui retient le vantail basculé.

   Deux scènes partagent ce moteur :
     - demarre()      : le comparateur de matériaux, en lumière de studio ;
     - demarreIntro() : l'entrée du site. Une chambre baignée de jour, un
       jardin derrière la vitre. Au défilement, la poignée se relève, le
       vantail bascule en oscillo, se referme, s'ouvre à la française, le
       semi-fixe suit, et l'on passe au travers.

   Réalisme : ce qui trahit le plus une image de synthèse, ce sont les
   arêtes vives et la lumière uniforme. Chaque pièce a donc ses arêtes
   adoucies, et la chambre est éclairée par la fenêtre elle-même : le jour
   entre, tombe sur les meubles, rebondit sur les murs, et fait briller les
   chants des profilés et le métal de la quincaillerie.

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

  // Rotation r autour d'un axe passant par (x, y, z).
  function autour(x, y, z, r) {
    return multiplie(translation(x, y, z), multiplie(r, translation(-x, -y, -z)));
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

  // Matrice qui étire une pièce unitaire (le long de x, de 0 à 1) entre les
  // points a et b : sert au compas d'oscillo, dont les deux attaches bougent.
  function entre(a, b) {
    var x = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    var l = Math.sqrt(x[0] * x[0] + x[1] * x[1] + x[2] * x[2]) || 1e-6;
    var ux = [x[0] / l, x[1] / l, x[2] / l];
    var y = [-ux[0] * ux[1], 1 - ux[1] * ux[1], -ux[2] * ux[1]];   // « haut » rendu perpendiculaire
    var ly = Math.sqrt(y[0] * y[0] + y[1] * y[1] + y[2] * y[2]) || 1;
    y = [y[0] / ly, y[1] / ly, y[2] / ly];
    var z = [ux[1] * y[2] - ux[2] * y[1], ux[2] * y[0] - ux[0] * y[2], ux[0] * y[1] - ux[1] * y[0]];
    var m = identite();
    m[0] = x[0]; m[1] = x[1]; m[2] = x[2];
    m[4] = y[0]; m[5] = y[1]; m[6] = y[2];
    m[8] = z[0]; m[9] = z[1]; m[10] = z[2];
    m[12] = a[0]; m[13] = a[1]; m[14] = a[2];
    return m;
  }

  function appliquePoint(m, p) {
    return [
      m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
      m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
      m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]
    ];
  }

  // Inverse-transposée de la partie 3x3 : indispensable pour que les
  // normales restent perpendiculaires après rotation ou étirement.
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

  // Générateur pseudo-aléatoire à graine fixe : les fleurs du bouquet sont
  // « au hasard », mais le même hasard à chaque visite.
  function hasard(graine) {
    var a = graine >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------------------------------------------------------------------
     Géométrie
     --------------------------------------------------------------------- */

  function geometrie() { return { positions: [], normales: [], uvs: [], indices: [] }; }

  // Un pavé, sommet par sommet, à arêtes vives. Réservé au verre, au fond
  // et aux pièces si fines qu'un arrondi ne se verrait pas.
  function pave(cx, cy, cz, lx, ly, lz, echelleUV) {
    var x = lx / 2, y = ly / 2, z = lz / 2, s = echelleUV || 1;
    var g = geometrie();
    var faces = [
      [[-x,-y, z], [1,0,0], [0,1,0], [ 0, 0, 1], lx, ly],
      [[ x,-y,-z], [-1,0,0],[0,1,0], [ 0, 0,-1], lx, ly],
      [[ x,-y, z], [0,0,-1],[0,1,0], [ 1, 0, 0], lz, ly],
      [[-x,-y,-z], [0,0,1], [0,1,0], [-1, 0, 0], lz, ly],
      [[-x, y, z], [1,0,0], [0,0,-1],[ 0, 1, 0], lx, lz],
      [[-x,-y,-z], [1,0,0], [0,0,1], [ 0,-1, 0], lx, lz]
    ];
    faces.forEach(function (f) {
      var o = f[0], u = f[1], v = f[2], n = f[3], lu = f[4], lv = f[5];
      var base = g.positions.length / 3;
      for (var j = 0; j < 2; j++) for (var i = 0; i < 2; i++) {
        g.positions.push(cx + o[0] + u[0] * lu * i + v[0] * lv * j,
                         cy + o[1] + u[1] * lu * i + v[1] * lv * j,
                         cz + o[2] + u[2] * lu * i + v[2] * lv * j);
        g.normales.push(n[0], n[1], n[2]);
        g.uvs.push(i * lu * s, j * lv * s);
      }
      g.indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
    });
    return g;
  }

  // Un panneau face à la pièce, UV de 0 à 1 : pour les images du jardin.
  function panneau(cx, cy, cz, lx, ly) {
    var g = geometrie(), x = lx / 2, y = ly / 2;
    [[-x, -y, 0, 0], [x, -y, 1, 0], [-x, y, 0, 1], [x, y, 1, 1]].forEach(function (s) {
      g.positions.push(cx + s[0], cy + s[1], cz);
      g.normales.push(0, 0, 1);
      g.uvs.push(s[2], s[3]);
    });
    g.indices.push(0, 1, 2, 2, 1, 3);
    return g;
  }

  // Un bloc aux arêtes adoucies : les douze arêtes sont abattues d'un rayon
  // r, et chaque chanfrein reprend les normales des deux faces qu'il relie.
  // L'interpolation entre les deux donne l'aspect d'un congé arrondi : un
  // fin liseré de lumière le long des arêtes, comme sur un vrai profilé.
  // Le fil de la matière suit la plus grande longueur de la pièce.
  function bloc(cx, cy, cz, lx, ly, lz, r, echelleUV) {
    var h = [lx / 2, ly / 2, lz / 2];
    var L = [lx, ly, lz];
    r = Math.max(0, Math.min(r || 0, h[0] * 0.45, h[1] * 0.45, h[2] * 0.45));
    var s = echelleUV || 1;
    var decal = (cx * 1.73 + cy * 2.31 + cz * 0.71) % 1;
    var g = geometrie();

    function sommet(p, axe, sens) {
      var n = [0, 0, 0]; n[axe] = sens;
      var a = (axe + 1) % 3, b = (axe + 2) % 3;
      if (L[b] > L[a]) { var t = a; a = b; b = t; }
      g.positions.push(cx + p[0], cy + p[1], cz + p[2]);
      g.normales.push(n[0], n[1], n[2]);
      g.uvs.push((p[a] + h[a]) * s + decal, (p[b] + h[b]) * s);
      return g.positions.length / 3 - 1;
    }

    // Six faces principales, réduites du rayon sur leurs bords.
    for (var ax = 0; ax < 3; ax++) {
      for (var sg = -1; sg <= 1; sg += 2) {
        var a = (ax + 1) % 3, b = (ax + 2) % 3;
        var coins = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (c) {
          var p = [0, 0, 0];
          p[ax] = sg * h[ax];
          p[a] = c[0] * (h[a] - r);
          p[b] = c[1] * (h[b] - r);
          return sommet(p, ax, sg);
        });
        g.indices.push(coins[0], coins[1], coins[2], coins[0], coins[2], coins[3]);
      }
    }
    if (r <= 0) return g;

    // Douze chanfreins, le long de chaque arête.
    for (var i = 0; i < 3; i++) {
      for (var j = i + 1; j < 3; j++) {
        var k = 3 - i - j;
        for (var si = -1; si <= 1; si += 2) {
          for (var sj = -1; sj <= 1; sj += 2) {
            var v = [];
            for (var sk = -1; sk <= 1; sk += 2) {
              var p1 = [0, 0, 0]; p1[i] = si * h[i]; p1[j] = sj * (h[j] - r); p1[k] = sk * (h[k] - r);
              var p2 = [0, 0, 0]; p2[i] = si * (h[i] - r); p2[j] = sj * h[j]; p2[k] = sk * (h[k] - r);
              v.push(sommet(p1, i, si), sommet(p2, j, sj));
            }
            g.indices.push(v[0], v[2], v[3], v[0], v[3], v[1]);
          }
        }
      }
    }

    // Huit coins, un triangle chacun.
    for (var sx = -1; sx <= 1; sx += 2) {
      for (var sy = -1; sy <= 1; sy += 2) {
        for (var sz = -1; sz <= 1; sz += 2) {
          var sgn = [sx, sy, sz];
          var t3 = [0, 1, 2].map(function (axe) {
            var p = [sx * (h[0] - r), sy * (h[1] - r), sz * (h[2] - r)];
            p[axe] = sgn[axe] * h[axe];
            return sommet(p, axe, sgn[axe]);
          });
          g.indices.push(t3[0], t3[1], t3[2]);
        }
      }
    }
    return g;
  }

  // Surface de révolution autour de l'axe vertical : vases, pieds, abat-jour,
  // globe. Le profil est une liste de [rayon, hauteur], de bas en haut.
  function revolution(profil, segments, cx, cy, cz) {
    var g = geometrie(), n = profil.length;
    var nrm = profil.map(function (p, i) {
      var a = profil[Math.max(0, i - 1)], b = profil[Math.min(n - 1, i + 1)];
      var dr = b[0] - a[0], dy = b[1] - a[1];
      var l = Math.sqrt(dr * dr + dy * dy) || 1;
      return [dy / l, -dr / l];
    });
    for (var s = 0; s <= segments; s++) {
      var t = s / segments * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
      for (var i = 0; i < n; i++) {
        g.positions.push(cx + profil[i][0] * c, cy + profil[i][1], cz + profil[i][0] * sn);
        g.normales.push(nrm[i][0] * c, nrm[i][1], nrm[i][0] * sn);
        g.uvs.push(s / segments * 2, profil[i][1] * 4);
      }
    }
    for (var s2 = 0; s2 < segments; s2++) {
      for (var i2 = 0; i2 < n - 1; i2++) {
        var a0 = s2 * n + i2, b0 = (s2 + 1) * n + i2;
        g.indices.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1);
      }
    }
    return g;
  }

  function cylindre(cx, cy, cz, r, h, segments) {
    return revolution([[0, 0], [r, 0], [r, 0.0001], [r, h - 0.0001], [r, h], [0, h]], segments || 16, cx, cy, cz);
  }

  function ellipsoide(cx, cy, cz, rx, ry, rz, segments, anneaux) {
    var profil = [];
    for (var i = 0; i <= anneaux; i++) {
      var phi = -Math.PI / 2 + Math.PI * i / anneaux;
      profil.push([Math.cos(phi), Math.sin(phi)]);
    }
    var g = revolution(profil, segments, 0, 0, 0);
    for (var k = 0; k < g.positions.length; k += 3) {
      g.positions[k] = cx + g.positions[k] * rx;
      g.positions[k + 1] = cy + g.positions[k + 1] * ry;
      g.positions[k + 2] = cz + g.positions[k + 2] * rz;
      var nx = g.normales[k] / rx, ny = g.normales[k + 1] / ry, nz = g.normales[k + 2] / rz;
      var l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      g.normales[k] = nx / l; g.normales[k + 1] = ny / l; g.normales[k + 2] = nz / l;
    }
    return g;
  }

  // Déplace et tourne une géométrie (rotation + translation uniquement).
  function transforme(g, m) {
    for (var k = 0; k < g.positions.length; k += 3) {
      var p = appliquePoint(m, [g.positions[k], g.positions[k + 1], g.positions[k + 2]]);
      g.positions[k] = p[0]; g.positions[k + 1] = p[1]; g.positions[k + 2] = p[2];
      var nx = g.normales[k], ny = g.normales[k + 1], nz = g.normales[k + 2];
      g.normales[k]     = m[0] * nx + m[4] * ny + m[8] * nz;
      g.normales[k + 1] = m[1] * nx + m[5] * ny + m[9] * nz;
      g.normales[k + 2] = m[2] * nx + m[6] * ny + m[10] * nz;
    }
    return g;
  }

  function assemble(pieces) {
    var positions = [], normales = [], uvs = [], indices = [], decalage = 0;
    pieces.forEach(function (p) {
      Array.prototype.push.apply(positions, p.positions);
      Array.prototype.push.apply(normales, p.normales);
      Array.prototype.push.apply(uvs, p.uvs);
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

  // Un cadre de quatre pièces à arêtes adoucies : deux traverses pleine
  // largeur, deux montants entre elles.
  function anneau(pieces, x0, x1, y0, y1, retrait, largeur, zc, epaisseur, rayon) {
    var a = x0 + retrait, b = x1 - retrait, c = y0 + retrait, d = y1 - retrait;
    var mx = (a + b) / 2, my = (c + d) / 2, lx = b - a, ly = d - c, l = largeur, r = rayon || 0;
    pieces.push(bloc(mx, d - l / 2, zc, lx, l, epaisseur, r, 1.2));
    pieces.push(bloc(mx, c + l / 2, zc, lx, l, epaisseur, r, 1.2));
    pieces.push(bloc(a + l / 2, my, zc, l, ly - 2 * l, epaisseur, r, 1.2));
    pieces.push(bloc(b - l / 2, my, zc, l, ly - 2 * l, epaisseur, r, 1.2));
  }

  // Un biseau à coupes d'onglet : quatre trapèzes inclinés vers le vitrage.
  // Chaque face penche d'un côté différent, donc prend une lumière
  // différente : c'est ce qui dessine les diagonales aux coins d'un ouvrant
  // mouluré, et fait lire la moulure même vue de face.
  function biseau(x0, x1, y0, y1, retrait, largeur, zHaut, zBas) {
    var a = x0 + retrait, b = x1 - retrait, c = y0 + retrait, d = y1 - retrait;
    var ia = a + largeur, ib = b - largeur, ic = c + largeur, id = d - largeur;
    var cotes = [
      { q: [[a, d], [b, d], [ib, id], [ia, id]], enX: true },
      { q: [[b, c], [a, c], [ia, ic], [ib, ic]], enX: true },
      { q: [[a, c], [a, d], [ia, id], [ia, ic]], enX: false },
      { q: [[b, d], [b, c], [ib, ic], [ib, id]], enX: false }
    ];
    var g = geometrie();
    cotes.forEach(function (cote) {
      var q = cote.q;
      var P = [[q[0][0], q[0][1], zHaut], [q[1][0], q[1][1], zHaut],
               [q[2][0], q[2][1], zBas],  [q[3][0], q[3][1], zBas]];
      var e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]];
      var e2 = [P[3][0] - P[0][0], P[3][1] - P[0][1], P[3][2] - P[0][2]];
      var n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      var l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
      var sens = n[2] < 0 ? -1 : 1;
      n = [n[0] / l * sens, n[1] / l * sens, n[2] / l * sens];
      var base = g.positions.length / 3;
      P.forEach(function (v) {
        g.positions.push(v[0], v[1], v[2]);
        g.normales.push(n[0], n[1], n[2]);
        g.uvs.push(cote.enX ? v[0] * 1.2 : v[1] * 1.2, cote.enX ? v[1] * 1.2 : v[0] * 1.2);
      });
      g.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    });
    return g;
  }

  /* ---------------------------------------------------------------------
     La fenêtre — cotes réelles d'une fenêtre PVC deux vantaux du commerce :
     105 cm de large, 108 cm de haut, hors tout.
     --------------------------------------------------------------------- */

  var COTES = {
    L: 1.05, H: 1.08,        // hors-tout du dormant
    d: 0.034,                // face vue du dormant
    ed: 0.07,                // profondeur du dormant
    r: 0.010,                // recouvrement de l'ouvrant sur le dormant
    o: 0.064,                // face vue du profil d'ouvrant
    m: 0.017,                // largeur de la moulure, côté vitrage
    zAv: 0.078,              // face avant de l'ouvrant (en saillie côté pièce)
    zAr: 0.012,              // face arrière de l'ouvrant
    zV: 0.040,               // plan du vitrage
    j: 0.007                 // joint de vitrage
  };

  function fenetre() {
    var K = COTES;
    var dormant = { opaque: [] };
    var gauche = { opaque: [], joint: [], verre: [], metal: [] };
    var droite = { opaque: [], poignee: [], joint: [], verre: [], metal: [] };

    // --- Dormant ---
    anneau(dormant.opaque, -K.L / 2, K.L / 2, -K.H / 2, K.H / 2, 0, K.d, 0, K.ed, 0.003);

    var W = K.L - 2 * K.d;                 // largeur de l'ouverture en tableau
    var ym = K.H / 2 - K.d + K.r;          // demi-hauteur d'un vantail
    var vg = { x0: -W / 2 - K.r, x1: 0 };
    var vd = { x0: 0, x1: W / 2 + K.r };
    var ep = K.zAv - K.zAr, zc = (K.zAv + K.zAr) / 2;

    // --- Un vantail : profil, moulure, joint, vitrage ---
    function vantail(g, v) {
      anneau(g.opaque, v.x0, v.x1, -ym, ym, 0, K.o - K.m, zc, ep, 0.005);
      var creux = 0.016;
      anneau(g.opaque, v.x0, v.x1, -ym, ym, K.o - K.m, K.m, zc - creux / 2, ep - creux, 0);
      g.opaque.push(biseau(v.x0, v.x1, -ym, ym, K.o - K.m, K.m, K.zAv, K.zAv - creux));
      anneau(g.joint, v.x0, v.x1, -ym, ym, K.o, K.j, K.zV, 0.03, 0.002);
      var gx0 = v.x0 + K.o + K.j * 0.5, gx1 = v.x1 - K.o - K.j * 0.5;
      var gy = ym - K.o - K.j * 0.5;
      g.verre.push(pave((gx0 + gx1) / 2, 0, K.zV, gx1 - gx0, 2 * gy, 0.024, 1));
    }

    vantail(gauche, vg);   // vantail semi-fixe
    vantail(droite, vd);   // vantail principal, oscillo-battant

    // --- Têtières : la bande métallique de la crémone, sur le chant de
    // chaque vantail côté battement. On ne la voit qu'une fois ouvert. ---
    var hTetiere = 2 * ym * 0.88;
    droite.metal.push(bloc(vd.x0 - 0.0016, 0, zc, 0.003, hTetiere, 0.016, 0.001, 1));
    gauche.metal.push(bloc(vg.x1 + 0.0016, 0, zc, 0.003, hTetiere, 0.016, 0.001, 1));

    // --- Paumelles, aux angles extérieurs des deux vantaux ---
    [vg.x0 - 0.006, vd.x1 + 0.006].forEach(function (x) {
      [ym - 0.13, -ym + 0.13].forEach(function (y) {
        dormant.opaque.push(bloc(x, y, K.zAr + 0.03, 0.014, 0.07, 0.02, 0.005, 1));
      });
    });

    // --- Poignée centrale, sur le montant du vantail principal ---
    // La rosace est fixe ; le levier tourne sur le carré.
    var xp = vd.x0 + (K.o - K.m) / 2;
    var yp = -0.02;
    droite.opaque.push(bloc(xp, yp, K.zAv + 0.006, 0.028, 0.074, 0.012, 0.005, 1));        // rosace
    droite.opaque.push(bloc(xp, yp, K.zAv + 0.019, 0.013, 0.013, 0.018, 0.003, 1));        // carré
    droite.poignee.push(bloc(xp, yp - 0.062, K.zAv + 0.03, 0.02, 0.14, 0.015, 0.006, 1));  // levier

    function prepare(parties) {
      var sortie = {};
      Object.keys(parties).forEach(function (k) { sortie[k] = assemble(parties[k]); });
      return sortie;
    }

    return {
      dormant: prepare(dormant),
      gauche: prepare(gauche),
      droite: prepare(droite),
      // Le bras du compas : une pièce unitaire, étirée à chaque image.
      compas: assemble([pave(0.5, 0, 0, 1, 0.006, 0.012, 1)]),
      pivots: {
        oscillo:  { y: -ym, z: K.zAr },                       // pied du vantail principal
        battant:  { x: vd.x1, z: K.zAr },                     // paumelles du principal
        semiFixe: { x: vg.x0, z: K.zAr },                     // paumelles du semi-fixe
        poignee:  { x: xp, y: yp, z: K.zAv + 0.019 },         // carré de manœuvre
        // Attaches du compas : l'une sur le dormant, l'autre sur l'ouvrant.
        compasDormant: [vd.x1 - 0.12, K.H / 2 - K.d - 0.004, K.zAr + 0.012],
        compasOuvrant: [vd.x1 - 0.36, ym - 0.004, K.zAr + 0.012]
      }
    };
  }

  // Vantail principal : bascule (oscillo) puis rotation (battant).
  function transformePrincipal(pivots, bascule, rotation) {
    var o = pivots.oscillo, b = pivots.battant;
    return multiplie(autour(b.x, 0, b.z, rotationY(rotation)),
                     autour(0, o.y, o.z, rotationX(bascule)));
  }

  // Le levier : 0 = vers le bas (fermée), PI/2 = horizontal (à la
  // française), PI = vers le haut (oscillo) — la convention des oscillo-
  // battants.
  function transformePoignee(pivots, angle) {
    var q = pivots.poignee;
    return autour(q.x, q.y, q.z, rotationZ(angle));
  }

  // Vantail semi-fixe : il ne s'ouvre qu'à la française, vers la pièce.
  function transformeSemiFixe(pivots, rotation) {
    var s = pivots.semiFixe;
    return autour(s.x, 0, s.z, rotationY(-rotation));
  }

  // Le compas ne se voit qu'en oscillo : il relie le dormant au haut du
  // vantail basculé. Fermé, il est rangé dans la feuillure.
  function transformeCompas(pivots, mPrincipal) {
    var b = appliquePoint(mPrincipal, pivots.compasOuvrant);
    return entre(pivots.compasDormant, b);
  }

  /* ---------------------------------------------------------------------
     La chambre — recréée d'après l'ambiance d'une photo de référence :
     mur clair, chevet en noyer, bouquet d'hortensias, applique, lampe globe
     posée sur un tabouret, jardin derrière la fenêtre.
     Repère : la fenêtre est centrée à l'origine, la pièce du côté z > 0.
     --------------------------------------------------------------------- */

  var PIECE = {
    zMur: 0.11,            // face intérieure du mur de la fenêtre
    zExt: -0.34,           // face extérieure (mur de 45 cm, maison ancienne)
    sol: -1.49,            // l'appui est à 95 cm du sol
    plafond: 1.02
  };

  function chambre() {
    var K = COTES, P = PIECE, E = 7;
    var aleatoire = hasard(1905);
    var parties = {
      mur: [], plafond: [], sol: [], plinthe: [],
      noyer: [], laiton: [], ceramique: [], fleurs: [], feuilles: [],
      livreCreme: [], livreVert: [], livreBlanc: [], bougie: [],
      cable: [], abatJour: [], lueur: [], globe: [], assise: []
    };
    var L = K.L, H = K.H, ep = P.zMur - P.zExt, zc = (P.zMur + P.zExt) / 2;

    // --- Le mur, percé aux cotes du dormant. Arêtes vives : un arrondi sur
    // ces pavés dessinerait des filets clairs en travers du mur. ---
    parties.mur.push(pave(0,  (H / 2 + E) / 2, zc, 2 * E, E - H / 2, ep, 1));
    parties.mur.push(pave(0, -(H / 2 + E) / 2, zc, 2 * E, E - H / 2, ep, 1));
    parties.mur.push(pave(-(L / 2 + E) / 2, 0, zc, E - L / 2, H, ep, 1));
    parties.mur.push(pave( (L / 2 + E) / 2, 0, zc, E - L / 2, H, ep, 1));

    parties.plafond.push(pave(0, P.plafond + 0.05, P.zMur + 4, 2 * E, 0.1, 8, 1));
    parties.sol.push(pave(0, P.sol - 0.05, P.zMur + 4, 2 * E, 0.1, 8, 1.4));
    parties.plinthe.push(bloc(0, P.sol + 0.04, P.zMur + 0.008, 2 * E, 0.08, 0.016, 0.003, 1));

    // --- Le chevet en noyer, à gauche sous la fenêtre ---
    var cx = -0.96, cz = P.zMur + 0.2, dessus = P.sol + 0.6;
    parties.noyer.push(bloc(cx, dessus - 0.235, cz, 0.5, 0.47, 0.38, 0.012, 1.6));      // caisson
    [0.12, -0.11].forEach(function (dy) {                                                // tiroirs
      parties.noyer.push(bloc(cx, dessus - 0.235 + dy, cz + 0.19 + 0.006, 0.462, 0.205, 0.012, 0.004, 1.6));
      parties.laiton.push(ellipsoide(cx, dessus - 0.235 + dy, cz + 0.2 + 0.018, 0.013, 0.013, 0.013, 12, 8));
    });
    [[-0.21, -0.15], [0.21, -0.15], [-0.21, 0.15], [0.21, 0.15]].forEach(function (p) {  // pieds fuselés
      parties.noyer.push(revolution([[0.009, 0], [0.018, 0.13]], 12, cx + p[0], P.sol, cz + p[1]));
    });

    // Livres et bougeoir sur le chevet.
    parties.livreCreme.push(bloc(cx - 0.1, dessus + 0.019, cz - 0.02, 0.25, 0.038, 0.18, 0.004, 1));
    parties.livreVert.push(bloc(cx - 0.11, dessus + 0.052, cz - 0.03, 0.22, 0.028, 0.16, 0.004, 1));
    parties.livreBlanc.push(bloc(cx - 0.09, dessus + 0.078, cz - 0.02, 0.2, 0.024, 0.15, 0.003, 1));
    parties.laiton.push(revolution([[0.03, 0], [0.03, 0.006], [0.008, 0.012], [0.006, 0.07], [0.016, 0.08], [0.016, 0.085]],
      16, cx - 0.14, dessus + 0.09, cz - 0.02));
    parties.bougie.push(cylindre(cx - 0.14, dessus + 0.175, cz - 0.02, 0.011, 0.11, 12));

    // Le vase et son bouquet d'hortensias.
    var vx = cx + 0.12, vz = cz + 0.02;
    parties.ceramique.push(revolution(
      [[0, 0], [0.045, 0], [0.058, 0.03], [0.068, 0.08], [0.06, 0.13], [0.04, 0.17], [0.036, 0.19], [0.042, 0.2], [0.034, 0.2]],
      24, vx, dessus, vz));
    var centres = [[0, 0.33, 0], [-0.1, 0.27, 0.03], [0.09, 0.28, -0.02], [0.02, 0.25, 0.08]];
    centres.forEach(function (c, n) {
      var R = n === 0 ? 0.095 : 0.075;
      for (var f = 0; f < (n === 0 ? 70 : 50); f++) {
        // Des fleurettes réparties sur une demi-sphère : la boule d'hortensia.
        var u = aleatoire(), v = aleatoire();
        var theta = u * Math.PI * 2, phi = Math.acos(1 - v * 1.3);
        var rr = R * (0.85 + aleatoire() * 0.2);
        var fx = vx + c[0] + rr * Math.sin(phi) * Math.cos(theta);
        var fy = dessus + c[1] + rr * Math.cos(phi) * 0.8;
        var fz = vz + c[2] + rr * Math.sin(phi) * Math.sin(theta);
        parties.fleurs.push(ellipsoide(fx, fy, fz, 0.017, 0.012, 0.017, 6, 4));
      }
    });
    for (var fe = 0; fe < 9; fe++) {
      var ang = fe / 9 * Math.PI * 2 + aleatoire() * 0.4;
      var feuille = ellipsoide(0, 0, 0, 0.055, 0.007, 0.03, 8, 5);
      transforme(feuille, multiplie(translation(vx + Math.cos(ang) * 0.09, dessus + 0.22 + aleatoire() * 0.05, vz + Math.sin(ang) * 0.09),
                                    multiplie(rotationY(-ang), rotationZ(-0.35 - aleatoire() * 0.3))));
      parties.feuilles.push(feuille);
    }

    // --- L'applique, suspendue en haut à gauche ---
    var ax = -1.1, az = P.zMur + 0.26, ay = 0.3;
    parties.cable.push(cylindre(ax, ay + 0.06, az, 0.004, P.plafond - ay - 0.06, 8));
    parties.laiton.push(cylindre(ax, ay, az, 0.022, 0.07, 16));
    parties.abatJour.push(revolution([[0.024, 0.0], [0.13, -0.15], [0.132, -0.152]], 32, ax, ay, az));
    parties.lueur.push(revolution([[0.02, -0.004], [0.126, -0.148]], 32, ax, ay, az));
    parties.lueur.push(ellipsoide(ax, ay - 0.07, az, 0.03, 0.035, 0.03, 12, 8));

    // --- Le tabouret à droite, avec des livres et la lampe globe ---
    var tx = 1.0, tz = P.zMur + 0.22, assise = P.sol + 0.47;
    parties.assise.push(bloc(tx, assise - 0.025, tz, 0.4, 0.05, 0.34, 0.014, 3));
    [[-0.17, -0.14], [0.17, -0.14], [-0.17, 0.14], [0.17, 0.14]].forEach(function (p) {
      parties.noyer.push(bloc(tx + p[0], P.sol + (assise - 0.05 - P.sol) / 2, tz + p[1], 0.03, assise - 0.05 - P.sol, 0.03, 0.006, 1.6));
    });
    parties.noyer.push(bloc(tx, P.sol + 0.12, tz, 0.34, 0.022, 0.022, 0.005, 1.6));
    parties.livreBlanc.push(bloc(tx - 0.02, assise + 0.02, tz, 0.3, 0.04, 0.22, 0.004, 1));
    parties.livreCreme.push(bloc(tx - 0.03, assise + 0.055, tz + 0.01, 0.26, 0.03, 0.19, 0.004, 1));
    parties.laiton.push(revolution([[0.05, 0], [0.05, 0.09], [0.035, 0.1], [0.02, 0.105]], 24, tx + 0.02, assise + 0.07, tz));
    parties.globe.push(ellipsoide(tx + 0.02, assise + 0.07 + 0.1 + 0.095, tz, 0.1, 0.1, 0.1, 28, 18));

    var sortie = {};
    Object.keys(parties).forEach(function (k) { sortie[k] = assemble(parties[k]); });
    return sortie;
  }

  // Couleurs de la chambre (en linéaire) et réglages de matière.
  var MATIERES = {
    mur:        { mode: 3, couleur: [0.78, 0.69, 0.63], brillance: 0.04 },
    plafond:    { mode: 3, couleur: [0.82, 0.80, 0.78], brillance: 0 },
    sol:        { mode: 0, couleur: [0.78, 0.62, 0.47], brillance: 0.25, texture: "bois" },
    plinthe:    { mode: 3, couleur: [0.80, 0.79, 0.77], brillance: 0.2 },
    noyer:      { mode: 0, couleur: [0.50, 0.35, 0.26], brillance: 0.35, texture: "bois" },
    laiton:     { mode: 4, couleur: [1.0, 0.74, 0.40] },
    ceramique:  { mode: 3, couleur: [0.85, 0.84, 0.81], brillance: 0.6 },
    fleurs:     { mode: 3, couleur: [0.86, 0.87, 0.80], brillance: 0.05 },
    feuilles:   { mode: 3, couleur: [0.10, 0.20, 0.07], brillance: 0.3 },
    livreCreme: { mode: 3, couleur: [0.84, 0.78, 0.66], brillance: 0.1 },
    livreVert:  { mode: 3, couleur: [0.05, 0.075, 0.05], brillance: 0.15 },
    livreBlanc: { mode: 3, couleur: [0.86, 0.86, 0.84], brillance: 0.1 },
    bougie:     { mode: 3, couleur: [0.88, 0.86, 0.80], brillance: 0.2 },
    cable:      { mode: 3, couleur: [0.015, 0.015, 0.015], brillance: 0.3 },
    abatJour:   { mode: 3, couleur: [0.84, 0.84, 0.82], brillance: 0.5 },
    lueur:      { mode: 6, couleur: [1.0, 0.95, 0.86] },
    globe:      { mode: 3, couleur: [0.92, 0.91, 0.88], brillance: 0.8 },
    assise:     { mode: 3, couleur: [0.52, 0.40, 0.26], brillance: 0.05 }
  };

  // Positions d'ouverture du comparateur : [bascule, rotation, poignée].
  var OUVERTURES = {
    fermee:  [0, 0, 0],
    oscillo: [0.17, 0, Math.PI],
    battant: [0, 1.05, Math.PI / 2]
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

  // uMode : 0 matière texturée, 1 vitrage, 2 joint, 3 couleur unie,
  //         4 métal, 5 image (le jardin), 6 lumière émise.
  // uAmbiance : 0 studio (comparateur), 1 chambre (intro).
  var FRAGMENT = [
    "precision mediump float;",
    "uniform sampler2D uTexture;",
    "uniform vec3 uOeil;",
    "uniform float uMode;",
    "uniform float uAmbiance;",
    "uniform vec3 uCouleur;",
    "uniform float uBrillance;",
    "uniform float uExposition;",
    "varying vec3 vNorm, vPos;",
    "varying vec2 vUv;",
    "",
    // Studio : exposition puis compression à point blanc.
    "vec3 developpeStudio(vec3 c) {",
    "  c *= 1.6;",
    "  c = c * (1.0 + c / 4.84) / (1.0 + c);",
    "  return pow(c, vec3(1.0 / 2.2));",
    "}",
    // Chambre : courbe filmique (ACES) — des hautes lumières qui se tassent
    // doucement, comme sur une photo d'intérieur bien exposée.
    "vec3 developpeChambre(vec3 c) {",
    "  c *= uExposition;",
    "  c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);",
    "  return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));",
    "}",
    "",
    "vec3 lumiereStudio(vec3 base, vec3 N, vec3 V, float brillance) {",
    "  vec3 Lc = normalize(vec3(-0.5, 0.8, 0.9));",
    "  vec3 Lr = normalize(vec3(0.9, 0.2, 0.4));",
    "  vec3 H = normalize(Lc + V);",
    "  float dc = max(dot(N, Lc), 0.0);",
    "  float dr = max(dot(N, Lr), 0.0) * 0.35;",
    "  float spec = pow(max(dot(N, H), 0.0), 36.0) * brillance;",
    "  return base * 0.22 + base * dc * vec3(1.04, 1.0, 0.94) + base * dr * vec3(0.80, 0.88, 1.0) + vec3(spec);",
    "}",
    "",
    // La chambre n'a qu'une source : la fenêtre, centrée à l'origine, qui
    // n'éclaire que vers la pièce. Trois apports :
    //  - le jour direct, qui décroît avec la distance à l'ouverture ;
    //  - le ciel, pour ce qui est dans l'embrasure (chants des profilés,
    //    tableaux) : c'est ce qui les fait briller ;
    //  - la lumière rebondie, chaude, qui éclaire tout le reste en douceur,
    //    un peu plus sombre au ras du sol et sous le plafond.
    // Ombre douce au pied d'un meuble, sur le mur ou le sol seulement : une
    // occlusion qui décroît avec la distance à la boîte du meuble.
    "float ombreMeuble(vec3 P, vec3 mini, vec3 maxi) {",
    "  vec3 d = max(max(mini - P, P - maxi), vec3(0.0));",
    "  return 1.0 - 0.42 * exp(-length(d) * 11.0);",
    "}",
    "",
    "vec3 lumiereChambre(vec3 base, vec3 N, vec3 V, vec3 P, float brillance) {",
    "  vec3 versF = -P;",
    "  float d2 = dot(versF, versF);",
    "  vec3 L = versF * inversesqrt(d2 + 0.0001);",
    "  float sortie = clamp(-L.z * 1.3, 0.0, 1.0);",
    "  float jour = sortie * max(dot(N, L), 0.0) / (0.35 + d2 * 0.55);",
    "  float pres = smoothstep(0.28, -0.04, P.z);",
    "  float ciel = pres * clamp(0.5 + 0.5 * dot(N, vec3(0.0, 0.3, -0.954)), 0.0, 1.0);",
    "  float rebond = 0.58 + 0.14 * N.y + 0.06 * N.z;",
    "  float occ = (0.55 + 0.45 * smoothstep(-1.49, -1.05, P.y)) * (1.0 - 0.22 * smoothstep(0.6, 1.02, P.y));",
    // La lumière rebondie faiblit loin de la fenêtre : le fond de la pièce
    // et les coins restent un peu plus sombres.
    "  float recul = 0.62 + 0.38 / (1.0 + 0.3 * d2);",
    "  float fond = step(0.9, N.z) * step(P.z, 0.116) + step(0.9, N.y) * step(P.y, -1.485);",
    "  if (fond > 0.5) {",
    "    occ *= ombreMeuble(P, vec3(-1.21, -1.49, 0.11), vec3(-0.71, -0.89, 0.50));",
    "    occ *= ombreMeuble(P, vec3(0.80, -1.49, 0.16), vec3(1.20, -1.02, 0.50));",
    "  }",
    // L'applique : une lueur chaude qui tombe sous l'abat-jour et un halo
    // sur le mur autour.
    "  vec3 versA = vec3(-1.1, 0.21, 0.37) - P;",
    "  float da2 = dot(versA, versA);",
    "  vec3 La = versA * inversesqrt(da2 + 0.0001);",
    "  float cone = smoothstep(0.35, 0.8, La.y);",
    "  float applique = max(dot(N, La), 0.0) * (cone * 0.16 / (0.04 + da2) + 0.012 / (0.01 + da2 * 3.0));",
    "  vec3 lumiere = vec3(1.0, 1.0, 1.03) * (jour * 1.9 + ciel * 1.3)",
    "               + vec3(1.0, 0.93, 0.86) * rebond * 0.62 * occ * recul",
    "               + vec3(1.0, 0.70, 0.42) * applique;",
    "  vec3 H = normalize(L + V);",
    "  float spec = pow(max(dot(N, H), 0.0), 48.0) * brillance * (jour * 3.0 + ciel * 0.8 + 0.08);",
    "  return base * lumiere + vec3(spec);",
    "}",
    "",
    "vec3 eclaire(vec3 base, vec3 N, vec3 V, float brillance) {",
    "  if (uAmbiance > 0.5) return developpeChambre(lumiereChambre(base, N, V, vPos, brillance));",
    "  return developpeStudio(lumiereStudio(base, N, V, brillance));",
    "}",
    "",
    "void main() {",
    "  vec3 N = normalize(vNorm);",
    "  vec3 V = normalize(uOeil - vPos);",
    "",
    "  if (uMode > 5.5) {",                                  // lumière émise
    "    gl_FragColor = vec4(uCouleur, 1.0);",
    "    return;",
    "  }",
    "  if (uMode > 4.5) {",                                  // le jardin
    "    vec4 t = texture2D(uTexture, vUv);",
    "    if (t.a < 0.5) discard;",
    // Dehors est plus lumineux que dedans : une photo exposée pour la
    // pièce voit le jardin un peu brûlé, légèrement voilé.
    "    gl_FragColor = vec4(min(mix(t.rgb, vec3(0.97, 0.98, 1.0), 0.1) * 1.07, vec3(1.0)), 1.0);",
    "    return;",
    "  }",
    "  if (uMode > 3.5) {",                                  // métal poli
    "    vec3 R = reflect(-V, N);",
    "    vec3 env = uAmbiance > 0.5",
    "      ? mix(vec3(0.60, 0.55, 0.50), vec3(2.4, 2.4, 2.45), smoothstep(0.05, 0.8, -R.z))",
    "      : mix(vec3(0.05), vec3(1.5), smoothstep(-0.2, 0.9, R.y));",
    "    vec3 c = env * uCouleur * 0.9 + uCouleur * 0.04;",
    "    gl_FragColor = vec4(uAmbiance > 0.5 ? developpeChambre(c) : developpeStudio(c), 1.0);",
    "    return;",
    "  }",
    "  if (uMode > 2.5) {",                                  // couleur unie
    "    gl_FragColor = vec4(eclaire(uCouleur, N, V, uBrillance), 1.0);",
    "    return;",
    "  }",
    "  if (uMode > 1.5) {",                                  // joint de vitrage
    "    gl_FragColor = vec4(eclaire(vec3(0.02, 0.021, 0.023), N, V, 0.25), 1.0);",
    "    return;",
    "  }",
    "  if (uMode > 0.5) {",                                  // vitrage
    "    float fresnel = pow(1.0 - abs(dot(N, V)), uAmbiance > 0.5 ? 4.0 : 3.0);",
    "    if (uAmbiance > 0.5) {",
    // Vu de la chambre, le verre est presque invisible : un voile très
    // léger, et le reflet de la pièce qui monte aux angles rasants.
    "      gl_FragColor = vec4(vec3(0.86, 0.82, 0.78), 0.05 + fresnel * 0.55);",
    "      return;",
    "    }",
    "    vec3 H = normalize(normalize(vec3(-0.5, 0.8, 0.9)) + V);",
    "    vec3 vitre = mix(vec3(0.24, 0.30, 0.33), vec3(0.62, 0.72, 0.80), fresnel);",
    "    vitre += vec3(pow(max(dot(N, H), 0.0), 90.0) * 0.85);",
    "    vitre = pow(vitre / (vitre + vec3(1.1)), vec3(1.0 / 2.2));",
    "    gl_FragColor = vec4(vitre, 0.30 + fresnel * 0.50);",
    "    return;",
    "  }",
    // Matière texturée : la texture est en sRGB, on la ramène en linéaire
    // avant d'éclairer, puis on la teinte (le noyer est un bois teinté).
    "  vec3 base = pow(texture2D(uTexture, vUv).rgb, vec3(2.2)) * uCouleur;",
    "  gl_FragColor = vec4(eclaire(base, N, V, uBrillance), 1.0);",
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
     Socle commun : contexte, programme, tampons, textures
     --------------------------------------------------------------------- */

  function prepareGL(canvas, transparent, ambiance) {
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

    var u = {};
    ["uProj", "uVue", "uModele", "uNorm", "uOeil", "uTexture", "uMode", "uAmbiance",
     "uCouleur", "uBrillance", "uExposition"].forEach(function (nom) {
      u[nom] = gl.getUniformLocation(programme, nom);
    });
    gl.uniform1f(u.uAmbiance, ambiance || 0);
    gl.uniform1f(u.uExposition, 1.3);
    gl.uniform1i(u.uTexture, 0);

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

    function groupes(parties) {
      var sortie = {};
      Object.keys(parties).forEach(function (k) { sortie[k] = groupe(parties[k]); });
      return sortie;
    }

    // --- Textures ---
    function texture(pixel) {
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array(pixel || [230, 228, 222, 255]));
      return { gl: t, jeton: 0 };
    }

    // WebGL 1 n'autorise la répétition et les mipmaps qu'en puissance de
    // deux : on redessine chaque image sur un canevas aux bonnes
    // dimensions. La matière se répète le long des profils au lieu d'être
    // étirée, et le jardin reste net sans scintiller.
    function charge(t, src, options, fait) {
      var jeton = ++t.jeton;
      var o = options || {};
      var img = new Image();
      img.onload = function () {
        if (jeton !== t.jeton) return;           // une autre image a été demandée entre-temps
        var toile = document.createElement("canvas");
        toile.width = o.largeur || 512;
        toile.height = o.hauteur || 512;
        toile.getContext("2d").drawImage(img, 0, 0, toile.width, toile.height);
        gl.bindTexture(gl.TEXTURE_2D, t.gl);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, toile);
        var mode = o.repete === false ? gl.CLAMP_TO_EDGE : gl.REPEAT;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mode);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (fait) fait();
      };
      img.onerror = function () { console.warn("[Webly 3D] image introuvable :", src); };
      img.src = src;
    }

    var BLANC = [1, 1, 1];
    // o : { mode, modele, couleur, brillance, texture }
    function dessine(g, o) {
      if (!g || !g.nombre) return;
      gl.uniform1f(u.uMode, o.mode || 0);
      gl.uniform3fv(u.uCouleur, o.couleur || BLANC);
      gl.uniform1f(u.uBrillance, o.brillance === undefined ? 0.2 : o.brillance);
      if (o.texture) gl.bindTexture(gl.TEXTURE_2D, o.texture.gl);
      gl.uniformMatrix4fv(u.uModele, false, o.modele);
      gl.uniformMatrix3fv(u.uNorm, false, normale3x3(o.modele));
      gl.bindBuffer(gl.ARRAY_BUFFER, g.pos);
      gl.vertexAttribPointer(attr.pos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.norm);
      gl.vertexAttribPointer(attr.norm, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.uv);
      gl.vertexAttribPointer(attr.uv, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.indices);
      gl.drawElements(gl.TRIANGLES, g.nombre, gl.UNSIGNED_SHORT, 0);
    }

    function camera(proj, vue, oeil) {
      gl.uniformMatrix4fv(u.uProj, false, proj);
      gl.uniformMatrix4fv(u.uVue, false, vue);
      gl.uniform3fv(u.uOeil, oeil);
      gl.activeTexture(gl.TEXTURE0);
    }

    function exposition(e) { gl.uniform1f(u.uExposition, e); }

    gl.enable(gl.DEPTH_TEST);
    // Couleur et alpha mélangés séparément : sur un calque transparent,
    // l'alpha doit s'accumuler, sinon la page apparaîtrait à travers le mur.
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    function passeOpaque() { gl.disable(gl.BLEND); gl.depthMask(true); }
    function passeVerre() { gl.enable(gl.BLEND); gl.depthMask(false); }
    function finPasses() { gl.depthMask(true); }

    return {
      gl: gl, groupe: groupe, groupes: groupes, dessine: dessine,
      texture: texture, charge: charge, camera: camera, exposition: exposition,
      passeOpaque: passeOpaque, passeVerre: passeVerre, finPasses: finPasses
    };
  }

  // Dessine la fenêtre complète dans sa position du moment. Commun aux deux
  // scènes, pour qu'elles montrent exactement le même ouvrage.
  function dessineFenetre(ctx, G, geo, mFixe, etat, matiere) {
    var mPrincipal = multiplie(mFixe, transformePrincipal(geo.pivots, etat.bascule, etat.rotation));
    var mPoignee = multiplie(mPrincipal, transformePoignee(geo.pivots, etat.poignee));
    var mSemiFixe = multiplie(mFixe, transformeSemiFixe(geo.pivots, etat.semiFixe || 0));
    var CHROME = [0.86, 0.87, 0.9];

    ctx.dessine(G.dormant.opaque, { mode: 0, modele: mFixe, texture: matiere, brillance: 0.35 });
    ctx.dessine(G.gauche.opaque,  { mode: 0, modele: mSemiFixe, texture: matiere, brillance: 0.35 });
    ctx.dessine(G.droite.opaque,  { mode: 0, modele: mPrincipal, texture: matiere, brillance: 0.35 });
    ctx.dessine(G.droite.poignee, { mode: 0, modele: mPoignee, texture: matiere, brillance: 0.5 });
    ctx.dessine(G.gauche.joint,   { mode: 2, modele: mSemiFixe });
    ctx.dessine(G.droite.joint,   { mode: 2, modele: mPrincipal });
    ctx.dessine(G.gauche.metal,   { mode: 4, modele: mSemiFixe, couleur: CHROME });
    ctx.dessine(G.droite.metal,   { mode: 4, modele: mPrincipal, couleur: CHROME });

    // Le compas n'apparaît qu'en oscillo pur.
    if (etat.bascule > 0.002 && etat.rotation < 0.002) {
      var mCompas = multiplie(mFixe, transformeCompas(geo.pivots,
        transformePrincipal(geo.pivots, etat.bascule, 0)));
      ctx.dessine(G.compas, { mode: 4, modele: mCompas, couleur: CHROME });
    }
    return { principal: mPrincipal, semiFixe: mSemiFixe };
  }

  function dessineVitrages(ctx, G, m) {
    ctx.dessine(G.gauche.verre, { mode: 1, modele: m.semiFixe });
    ctx.dessine(G.droite.verre, { mode: 1, modele: m.principal });
  }

  function groupesFenetre(ctx, geo) {
    return {
      dormant: ctx.groupes(geo.dormant),
      gauche: ctx.groupes(geo.gauche),
      droite: ctx.groupes(geo.droite),
      compas: ctx.groupe(geo.compas)
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
    var ctx = prepareGL(canvas, false, 0);
    if (!ctx) {
      // Pas de WebGL : le repli CSS est déjà dans la page, on l'affiche.
      scene.classList.add("sans-webgl");
      return null;
    }
    var gl = ctx.gl;
    gl.clearColor(0.118, 0.141, 0.153, 1);

    var geo = fenetre();
    var G = groupesFenetre(ctx, geo);
    var matiere = ctx.texture();

    function chargeTexture(src) {
      ctx.charge(matiere, src, { largeur: 512, hauteur: 512 }, function () {
        scene.setAttribute("data-texture", "chargee");
      });
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

    var distance = 2.9;
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

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      ctx.camera(perspective(Math.PI / 4.6, largeur / hauteur, 0.1, 100), vue, oeil);

      ctx.passeOpaque();
      var m = dessineFenetre(ctx, G, geo, mFixe, ouverture, matiere);
      ctx.passeVerre();
      dessineVitrages(ctx, G, m);
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

    var ctx = prepareGL(canvas, true, 1);
    if (!ctx) return null;
    var gl = ctx.gl;
    gl.clearColor(0, 0, 0, 0);
    ctx.exposition(1.3);

    var geo = fenetre();
    var G = groupesFenetre(ctx, geo);
    var decor = ctx.groupes(chambre());
    var fond = {
      ciel: ctx.groupe(assemble([panneau(0, 0.3, -14, 32, 16)])),
      haie: ctx.groupe(assemble([panneau(0.4, -0.2, -5.5, 12, 6)]))
    };

    // Textures : la matière de la fenêtre, le bois des meubles, le jardin.
    var grand = window.innerWidth > 900;
    var tex = {
      matiere: ctx.texture(),
      bois: ctx.texture([150, 110, 80, 255]),
      ciel: ctx.texture([222, 232, 236, 255]),
      haie: ctx.texture([0, 0, 0, 0])
    };
    var attendues = 4, recues = 0;
    function recue() {
      recues++;
      if (recues === attendues) scene.setAttribute("data-texture", "chargee");
      rendu(true);
    }
    ctx.charge(tex.matiere, options.texture || "assets/images/materiau-pvc.svg", {}, recue);
    ctx.charge(tex.bois, options.bois || "assets/images/materiau-bois.svg", {}, recue);
    ctx.charge(tex.ciel, "assets/images/jardin-ciel.svg",
      { largeur: grand ? 2048 : 1024, hauteur: grand ? 1024 : 512, repete: false }, recue);
    ctx.charge(tex.haie, "assets/images/jardin-haie.svg",
      { largeur: grand ? 2048 : 1024, hauteur: grand ? 1024 : 512, repete: false }, recue);

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

      var etat = {
        poignee: Math.PI * lisse(0.02, 0.07, p) - (Math.PI / 2) * lisse(0.38, 0.41, p),
        bascule: 0.2 * (lisse(0.08, 0.26, p) - lisse(0.30, 0.38, p)),
        rotation: 1.50 * lisse(0.42, 0.60, p),
        semiFixe: 1.45 * lisse(0.50, 0.68, p)
      };
      var avance = lisse(0.56, 0.97, p);

      // Cadrage : la fenêtre occupe un peu plus de la moitié de la hauteur
      // d'écran — assez pour laisser voir la chambre autour — et jamais plus
      // de 80 % de la largeur : sur un téléphone en portrait, c'est la
      // largeur qui commande.
      var aspect = largeur / hauteur;
      var fov0 = Math.PI / 4, t = Math.tan(fov0 / 2);
      // En portrait, la fenêtre laisse un peu plus de place : le chevet et
      // son bouquet doivent rester dans l'image.
      var portrait = aspect < 1;
      var d0 = Math.max((COTES.H / 0.5) / (2 * t), (COTES.L / (portrait ? 0.62 : 0.8)) / (2 * t * aspect));
      var zCam = d0 + (-0.8 - d0) * avance;
      var biais = 1 - lisse(0.36, 0.64, p);
      // Trois-quarts à gauche et en hauteur, comme sur la photo de
      // référence : c'est de là qu'on voit le vantail basculé se décaler du
      // semi-fixe. Le décalage est proportionnel à la largeur de la fenêtre.
      var xCam = -0.49 * biais, yCam = 0.02 + 0.23 * biais;
      var oeil = [xCam, yCam, zCam];

      // Au départ on regarde le centre de la fenêtre ; à mesure que le biais
      // s'efface, on regarde droit devant — la caméra peut alors traverser
      // le plan de la fenêtre sans se retourner.
      var l = Math.sqrt(xCam * xCam + yCam * yCam + zCam * zCam) || 1;
      // Le regard vise un peu sous la fenêtre : le chevet et son bouquet
      // entrent dans l'image, comme sur la photo.
      var xVise = (portrait ? -0.2 : 0) * biais, yVise = (portrait ? -0.4 : -0.26) * biais;
      l = Math.sqrt((xCam - xVise) * (xCam - xVise) + (yCam - yVise) * (yCam - yVise) + zCam * zCam) || 1;
      var dir = [-(xCam - xVise) / l * biais, -(yCam - yVise) / l * biais, -zCam / l * biais - (1 - biais)];
      var cible = [xCam + dir[0], yCam + dir[1], zCam + dir[2]];

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      ctx.camera(perspective(fov0 + avance * 0.25, aspect, 0.02, 60), regarde(oeil, cible), new Float32Array(oeil));

      ctx.passeOpaque();
      // La chambre.
      Object.keys(MATIERES).forEach(function (nom) {
        var m = MATIERES[nom];
        ctx.dessine(decor[nom], {
          mode: m.mode, modele: I, couleur: m.couleur, brillance: m.brillance,
          texture: m.texture === "bois" ? tex.bois : null
        });
      });
      // La fenêtre.
      var mats = dessineFenetre(ctx, G, geo, I, etat, tex.matiere);
      // Le jardin en dernier : le mur l'a déjà masqué presque partout, le
      // test de profondeur écarte ces pixels avant tout calcul — c'est ce
      // qui garde l'intro fluide sur un petit processeur graphique.
      ctx.dessine(fond.haie, { mode: 5, modele: I, texture: tex.haie });
      ctx.dessine(fond.ciel, { mode: 5, modele: I, texture: tex.ciel });

      ctx.passeVerre();
      dessineVitrages(ctx, G, mats);
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
