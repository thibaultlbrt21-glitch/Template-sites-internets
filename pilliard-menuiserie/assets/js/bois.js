/* =========================================================================
   PILLIARD MENUISERIE AGENCEMENT — générateur de bois
   Les textures de bois du site ne sont pas des photos : elles sont calculées
   dans le navigateur (bruit simplex + cernes de croissance + fibres + pores),
   pour chaque essence. Elles pèsent 0 octet à télécharger, restent nettes à
   toutes les tailles et ne sont jamais deux fois identiques d'une planche à
   l'autre — comme du vrai bois.

   API :
     Bois.ESSENCES                 → la fiche de chaque essence (couleurs, figure)
     Bois.canvas(essence, w, h, o) → un <canvas> peint (mis en cache)
     Bois.url(essence, w, h, o)    → la même chose en data URL (pour le CSS)
   Options o : { graine, sens: "h" | "v", lames: largeur en px (0 = une pièce),
                 joints: true pour marquer les joints entre lames }
   ========================================================================= */
(function (global) {
  "use strict";

  /* ---- Bruit simplex 2D (algorithme de S. Gustavson), avec graine ---- */
  function creerBruit(graine) {
    var s = (graine >>> 0) || 1;
    function alea() { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }
    var perm = new Uint8Array(256), p = new Uint8Array(512), i, j, t;
    for (i = 0; i < 256; i++) perm[i] = i;
    for (i = 255; i > 0; i--) { j = Math.floor(alea() * (i + 1)); t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    for (i = 0; i < 512; i++) p[i] = perm[i & 255];
    var G = [1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 0, 1, 0, -1];
    var F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;

    return function (xin, yin) {
      var sk = (xin + yin) * F2;
      var i0 = Math.floor(xin + sk), j0 = Math.floor(yin + sk);
      var tt = (i0 + j0) * G2;
      var x0 = xin - (i0 - tt), y0 = yin - (j0 - tt);
      var i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
      var x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
      var x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      var ii = i0 & 255, jj = j0 & 255, n = 0, a, g;
      a = 0.5 - x0 * x0 - y0 * y0;
      if (a > 0) { g = (p[ii + p[jj]] & 7) * 2; a *= a; n += a * a * (G[g] * x0 + G[g + 1] * y0); }
      a = 0.5 - x1 * x1 - y1 * y1;
      if (a > 0) { g = (p[ii + i1 + p[jj + j1]] & 7) * 2; a *= a; n += a * a * (G[g] * x1 + G[g + 1] * y1); }
      a = 0.5 - x2 * x2 - y2 * y2;
      if (a > 0) { g = (p[ii + 1 + p[jj + 1]] & 7) * 2; a *= a; n += a * a * (G[g] * x2 + G[g + 1] * y2); }
      return 70 * n;
    };
  }

  /* ---- Les essences ----
     clair / fonce : bois de printemps / bois d'été (RVB)
     cernes   : nombre de cernes par pixel (plus c'est grand, plus c'est serré)
     expo     : netteté du cerne d'été (grand = trait fin et franc)
     contraste: écart entre bois clair et cerne
     fibre    : force des fibres longues
     pores    : pores visibles (chêne, frêne)
     allong   : étirement des cathédrales (petit = arches longues)
     ondul    : déformation des cernes                                    */
  var ESSENCES = {
    chene: {
      nom: "Chêne", latin: "Quercus robur",
      clair: [216, 182, 138], fonce: [138, 96, 58],
      cernes: 0.05, expo: 3.2, contraste: 0.6, fibre: 0.26, pores: 0.55, allong: 0.05, ondul: 1.0
    },
    noyer: {
      nom: "Noyer", latin: "Juglans regia",
      clair: [138, 98, 68], fonce: [58, 37, 24],
      cernes: 0.03, expo: 2.4, contraste: 0.62, fibre: 0.38, pores: 0.16, allong: 0.06, ondul: 1.25
    },
    frene: {
      nom: "Frêne", latin: "Fraxinus excelsior",
      clair: [236, 220, 192], fonce: [170, 136, 96],
      cernes: 0.045, expo: 4.5, contraste: 0.58, fibre: 0.2, pores: 0.4, allong: 0.045, ondul: 0.9
    },
    douglas: {
      nom: "Douglas", latin: "Pseudotsuga menziesii",
      clair: [226, 172, 120], fonce: [158, 84, 44],
      cernes: 0.058, expo: 6, contraste: 0.8, fibre: 0.18, pores: 0, allong: 0.035, ondul: 0.95
    },
    meleze: {
      nom: "Mélèze", latin: "Larix decidua",
      clair: [218, 162, 104], fonce: [140, 76, 40],
      cernes: 0.08, expo: 5, contraste: 0.72, fibre: 0.2, pores: 0, allong: 0.04, ondul: 1.1
    },
    ipe: {
      nom: "Ipé", latin: "Handroanthus spp.",
      clair: [150, 88, 54], fonce: [92, 48, 28],
      cernes: 0.1, expo: 1.6, contraste: 0.4, fibre: 0.5, pores: 0.12, allong: 0.03, ondul: 0.7
    }
  };

  var cache = {};

  function peindre(ctx, w, h, ess, o) {
    var e = ESSENCES[ess] || ESSENCES.chene;
    var graine = o.graine || 7;
    var bA = creerBruit(graine), bB = creerBruit(graine * 31 + 3), bC = creerBruit(graine * 97 + 11);
    var vertical = o.sens === "v";
    var U = vertical ? h : w, V = vertical ? w : h;           // U : le long du fil
    var lame = o.lames || V;
    var nbLames = Math.ceil(V / lame);

    // Chaque lame a son propre débit : centre de la cathédrale, teinte, décalage.
    var debits = [];
    var s = graine >>> 0;
    function alea() { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; }
    for (var k = 0; k < nbLames; k++) {
      debits.push({
        cu: alea() * U,
        cv: (alea() * 2.2 - 0.6) * lame,
        dec: alea() * 5000,
        teinte: 0.93 + alea() * 0.12,
        allong: e.allong * (0.7 + alea() * 0.7)
      });
    }

    var img = ctx.createImageData(w, h), d = img.data;
    var cl = e.clair, fo = e.fonce;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var u = vertical ? y : x, v = vertical ? x : y;
        var k2 = Math.min(nbLames - 1, Math.floor(v / lame));
        var db = debits[k2];
        var vl = v - k2 * lame, uu = u + db.dec;

        var deform = bA(uu * 0.0009, vl * 0.0042) + 0.22 * bA(uu * 0.0042, vl * 0.016);
        var dx = (u - db.cu) * db.allong, dy = vl - db.cv;
        var r = Math.sqrt(dx * dx + dy * dy) * e.cernes + deform * e.ondul +
                bB(uu * 0.02, vl * 0.07) * 0.03;             // cernes un peu irréguliers
        var f = r - Math.floor(r);
        var ombre = Math.pow(f, e.expo) * e.contraste;
        var lisse = e.cernes * 1.6;                          // anticrénelage du cerne
        if (f > 1 - lisse) ombre *= (1 - f) / lisse;

        var fibre = (bB(uu * 0.003, vl * 0.38) * 0.6 + bC(uu * 0.008, vl * 1.3) * 0.4) * e.fibre * 0.55;
        var val = ombre + fibre + bC(uu * 0.0011, vl * 0.0035) * 0.08;
        if (e.pores) {
          var po = bC(uu * 0.085, vl * 1.5) - 0.42;
          if (po > 0) val += po * e.pores * (0.5 + ombre);
        }
        if (val < 0) val = 0; else if (val > 1) val = 1;

        var tn = db.teinte;
        // Joint entre deux lames : un filet sombre et un liseré clair.
        if (o.joints && nbLames > 1) {
          if (vl < 1.2 && k2 > 0) tn *= 0.55;
          else if (vl < 2.4 && k2 > 0) tn *= 1.07;
        }
        var i4 = (y * w + x) * 4;
        d[i4] = (cl[0] + (fo[0] - cl[0]) * val) * tn;
        d[i4 + 1] = (cl[1] + (fo[1] - cl[1]) * val) * tn;
        d[i4 + 2] = (cl[2] + (fo[2] - cl[2]) * val) * tn;
        d[i4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function canvas(ess, w, h, o) {
    o = o || {};
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    var cle = [ess, w, h, o.graine || 7, o.sens || "h", o.lames || 0, o.joints ? 1 : 0].join("|");
    if (cache[cle]) return cache[cle];
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    peindre(c.getContext("2d"), w, h, ess, o);
    cache[cle] = c;
    return c;
  }

  function url(ess, w, h, o) {
    var c = canvas(ess, w, h, o);
    if (!c._url) c._url = c.toDataURL("image/jpeg", 0.86);
    return c._url;
  }

  global.Bois = { ESSENCES: ESSENCES, canvas: canvas, url: url };
})(window);
