/* Prépare les images de l'intro « photo » à partir de la photo source.

   Usage (depuis webly-template-menuisier/, un serveur local lancé sur le
   dossier : python3 -m http.server 8100) :

     node tools/prepare-intro-photo.js

   Il faut Playwright et Chromium : le traitement se fait dans un canevas du
   navigateur, qui sait lire et écrire le WebP.

   Entrées : tools/intro-photo-source.webp et assets/images/intro-fenetre.json
   (coordonnées relevées sur la photo, en pixels).
   Sorties, dans assets/images/ :
   - intro-fenetre.webp : la photo, vitrages des vantaux rendus transparents
     et levier de poignée effacé (il est redessiné à part, pour tourner) ;
   - intro-poignee.webp : le levier seul, détouré ;
   - intro-dehors.webp  : le paysage vu par la fenêtre, reconstitué sans les
     petits bois ni les montants, et prolongé au-delà des vitrages — c'est
     ce qu'on découvre quand les vantaux s'ouvrent.

   Changer de photo : relever les nouvelles coordonnées dans le JSON, puis
   relancer ce script. */

const fs = require("fs");
const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT || "playwright");

const RACINE = path.join(__dirname, "..");
const ADRESSE = process.env.ADRESSE || "http://127.0.0.1:8100/";

(async () => {
  const config = JSON.parse(fs.readFileSync(path.join(RACINE, "assets/images/intro-fenetre.json"), "utf8"));
  const navigateur = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const page = await navigateur.newPage();
  await page.goto(ADRESSE + "tools/intro-photo-source.webp");

  const sorties = await page.evaluate((C) => {
    const img = document.querySelector("img");
    const W = C.taille[0], H = C.taille[1];
    const toile = document.createElement("canvas");
    toile.width = W; toile.height = H;
    const g = toile.getContext("2d");
    g.drawImage(img, 0, 0, W, H);
    const source = g.getImageData(0, 0, W, H);
    const S = source.data;

    // --- Géométrie ---
    // Quadrilatère convexe, sommets dans le sens des aiguilles d'une montre ;
    // marge : distance minimale aux côtés, en pixels.
    function dansQuad(q, x, y, marge) {
      for (let i = 0; i < 4; i++) {
        const a = q[i], b = q[(i + 1) % 4];
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])) / l < (marge || 0)) return false;
      }
      return true;
    }
    function dansVitrage(x, y, marge) {
      for (const q of C.vitrages) if (dansQuad(q, x, y, marge)) return true;
      return false;
    }
    function distSegment(px, py, a, b) {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
    }
    const L = C.levier;
    // Distance signée au contour du levier (négative dedans).
    function levier(x, y) {
      const rond = Math.hypot(x - L.pivot[0], y - L.pivot[1]) - L.rayon;
      const tige = distSegment(x, y, L.pivot, L.bout) - L.demiLargeur;
      return Math.min(rond, tige);
    }
    const P = C.platine;
    const surPlatine = (x, y) => x >= P[0] && x <= P[2] && y >= P[1] && y <= P[3];

    // --- 1. Le levier, détouré, suréchantillonné ×4 ---
    const K = 4, cad = L.cadre;
    const lw = (cad[2] - cad[0]) * K, lh = (cad[3] - cad[1]) * K;
    const tl = document.createElement("canvas");
    tl.width = lw; tl.height = lh;
    const gl = tl.getContext("2d");
    gl.imageSmoothingEnabled = true;
    gl.drawImage(toile, cad[0], cad[1], cad[2] - cad[0], cad[3] - cad[1], 0, 0, lw, lh);
    const lev = gl.getImageData(0, 0, lw, lh);
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const d = levier(cad[0] + (i + 0.5) / K, cad[1] + (j + 0.5) / K);
      lev.data[(j * lw + i) * 4 + 3] = Math.round(255 * Math.max(0, Math.min(1, 0.5 - d)));
    }
    gl.putImageData(lev, 0, 0);

    // --- 2. La photo : levier effacé, vitrages transparents ---
    const sortie = new ImageData(new Uint8ClampedArray(S), W, H);
    const O = sortie.data;
    const px = (x, y, k) => S[(y * W + x) * 4 + k];
    const efface = (x, y) => levier(x, y) < 1.6;
    for (let x = cad[0] - 2; x <= cad[2] + 2; x++) {
      // Ancres de la colonne : premier pixel de bois au-dessus et en dessous.
      let haut = cad[1] - 3, bas = cad[3] + 3;
      for (let y = cad[1] - 2; y <= cad[3] + 2; y++) {
        if (!efface(x, y)) continue;
        let r, v, b;
        if (surPlatine(x, y)) {
          // La platine est unie : on la recopie depuis sa partie dégagée.
          let xs = x;
          while (efface(xs, y) && xs < P[2]) xs++;
          r = px(xs, y, 0); v = px(xs, y, 1); b = px(xs, y, 2);
        } else {
          // Le montant : fil vertical, on interpole le long de la colonne.
          let h = y, k = y;
          while (h > haut && (efface(x, h) || surPlatine(x, h))) h--;
          while (k < bas && efface(x, k)) k++;
          const t = (y - h) / Math.max(1, k - h);
          r = px(x, h, 0) * (1 - t) + px(x, k, 0) * t;
          v = px(x, h, 1) * (1 - t) + px(x, k, 1) * t;
          b = px(x, h, 2) * (1 - t) + px(x, k, 2) * t;
        }
        const o = (y * W + x) * 4;
        O[o] = r; O[o + 1] = v; O[o + 2] = b;
      }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (dansVitrage(x, y)) O[(y * W + x) * 4 + 3] = 0;
    }
    g.putImageData(sortie, 0, 0);

    // --- 3. Le dehors ---
    const Z = C.zoneDehors, DW = Z[2] - Z[0], DH = Z[3] - Z[1];
    const R = new Float32Array(DW * DH * 3);
    const plein = new Uint8Array(DW * DH);        // 1 : pixel connu
    const loin = new Float32Array(DW * DH);       // distance au vitrage le plus proche
    for (let j = 0; j < DH; j++) for (let i = 0; i < DW; i++) {
      const x = i + Z[0], y = j + Z[1], n = j * DW + i;
      // Trois pixels et demi de marge : le bord du vitrage garde un reste
      // d'intercalaire, qui laisserait des filets dans le paysage.
      if (x >= 0 && y >= 0 && x < W && y < H && dansVitrage(x, y, 3.5)) {
        R[n * 3] = px(x, y, 0); R[n * 3 + 1] = px(x, y, 1); R[n * 3 + 2] = px(x, y, 2);
        plein[n] = 1;
      }
    }
    // Comble une suite de pixels inconnus entre deux connus : deux miroirs
    // (depuis chaque bord) fondus l'un dans l'autre. Garde la texture du
    // feuillage au lieu d'un dégradé lisse.
    // bords : 0 = seulement entre deux plages connues ; 1 = aussi au-delà,
    // en miroir une fois puis en répétant le dernier pixel ; 2 = au-delà,
    // en prolongeant simplement le bord.
    function comble(lire, n, bords) {
      let i = 0;
      while (i < n) {
        if (lire.plein(i)) { i++; continue; }
        let a = i;
        while (i < n && !lire.plein(i)) i++;
        const b = i - 1;                       // [a, b] inconnus
        const avant = a - 1 >= 0 && lire.plein(a - 1), apres = b + 1 < n && lire.plein(b + 1);
        if (!bords && !(avant && apres)) continue;
        // Longueur de la plage connue de part et d'autre du trou.
        const etendue = (orig, sens) => {
          let fin = orig;
          while (fin + sens >= 0 && fin + sens < n && lire.plein(fin + sens)) fin += sens;
          return Math.abs(fin - orig) + 1;
        };
        const longAvant = avant ? etendue(a - 1, -1) : 0, longApres = apres ? etendue(b + 1, 1) : 0;
        for (let k = a; k <= b; k++) {
          let c = null;
          const miroir = (orig, sens) => {
            // Reflet successif dans la plage connue (onde triangle).
            const long = sens < 0 ? longAvant : longApres;
            let d = Math.abs(k - orig) - 1;
            if (avant && apres) {
              // Dans un trou (petits bois, montants du milieu) : reflet en onde
              // triangle, continu aux deux bords.
              const periode = 2 * long;
              d = ((d % periode) + periode) % periode;
              return lire.valeur(d < long ? orig + sens * d : orig + sens * (periode - 1 - d));
            }
            // Au-delà : un seul reflet, puis le bord se prolonge. En hauteur
            // (le ciel, le premier plan), on prolonge directement : un reflet
            // du feuillage y ferait un faux plan d'eau.
            if (bords === 2) d = Math.min(6, long - 1);
            return lire.valeur(orig + sens * Math.min(d, long - 1));
          };
          if (avant && apres) {
            const t = (k - a + 1) / (b - a + 2);
            const u = miroir(a - 1, -1), v = miroir(b + 1, 1);
            c = [u[0] * (1 - t) + v[0] * t, u[1] * (1 - t) + v[1] * t, u[2] * (1 - t) + v[2] * t];
            // Un trou entre deux vitrages reste net : c'est du vrai paysage
            // de part et d'autre, seul le prolongement au loin se floute.
            lire.ecrit(k, c, bords ? Math.min(k - a + 1, b + 1 - k) : 0);
          } else if (avant) {
            c = miroir(a - 1, -1);
            lire.ecrit(k, c, k - a + 1);
          } else if (apres) {
            c = miroir(b + 1, 1);
            lire.ecrit(k, c, b + 1 - k);
          }
        }
      }
    }
    function colonne(i) {
      return {
        plein: (j) => plein[j * DW + i] === 1,
        valeur: (j) => { const n = j * DW + i; return [R[n * 3], R[n * 3 + 1], R[n * 3 + 2]]; },
        ecrit: (j, c, d) => { const n = j * DW + i; R.set(c, n * 3); plein[n] = 2; loin[n] = d; }
      };
    }
    function ligne(j) {
      return {
        plein: (i) => plein[j * DW + i] !== 0,
        valeur: (i) => { const n = j * DW + i; return [R[n * 3], R[n * 3 + 1], R[n * 3 + 2]]; },
        ecrit: (i, c, d) => { const n = j * DW + i; R.set(c, n * 3); plein[n] = 3; loin[n] = Math.max(loin[n], d); }
      };
    }
    const figer = () => { for (let n = 0; n < plein.length; n++) if (plein[n] > 1) plein[n] = 1; };
    // a. les traverses (petits bois) : en colonne, entre deux vitrages ;
    for (let i = 0; i < DW; i++) comble(colonne(i), DH, 0);
    figer();
    // b. les montants du milieu : en ligne, entre les deux vantaux ;
    for (let j = 0; j < DH; j++) comble(ligne(j), DW, 0);
    figer();
    // c. au-delà des vitrages : d'abord en hauteur, puis sur les côtés.
    for (let i = 0; i < DW; i++) comble(colonne(i), DH, 2);
    figer();
    for (let j = 0; j < DH; j++) comble(ligne(j), DW, 1);

    const td = document.createElement("canvas");
    td.width = DW; td.height = DH;
    const gd = td.getContext("2d");
    const net = new ImageData(DW, DH);
    for (let n = 0; n < DW * DH; n++) {
      net.data[n * 4] = R[n * 3]; net.data[n * 4 + 1] = R[n * 3 + 1]; net.data[n * 4 + 2] = R[n * 3 + 2];
      net.data[n * 4 + 3] = 255;
    }
    gd.putImageData(net, 0, 0);
    // Plus on s'éloigne des vitrages, plus le prolongement est flou : un
    // reflet net se verrait, un arrière-plan doux passe pour de la profondeur.
    const flouter = (rayon) => {
      const c = document.createElement("canvas");
      c.width = DW; c.height = DH;
      const gc = c.getContext("2d");
      gc.filter = "blur(" + rayon + "px)";
      gc.drawImage(td, 0, 0);
      return gc.getImageData(0, 0, DW, DH).data;
    };
    const F1 = flouter(8), F2 = flouter(36);
    for (let n = 0; n < DW * DH; n++) {
      const t1 = Math.min(1, loin[n] / 20), t2 = Math.min(1, Math.max(0, (loin[n] - 20) / 90));
      for (let k = 0; k < 3; k++) {
        const v = net.data[n * 4 + k] * (1 - t1) + F1[n * 4 + k] * t1;
        net.data[n * 4 + k] = v * (1 - t2) + F2[n * 4 + k] * t2;
      }
    }
    gd.putImageData(net, 0, 0);

    return {
      photo: toile.toDataURL("image/webp", 0.9),
      poignee: tl.toDataURL("image/webp", 0.92),
      dehors: td.toDataURL("image/webp", 0.86)
    };
  }, config);

  for (const nom of ["photo", "poignee", "dehors"]) {
    const fichier = path.join(RACINE, config[nom]);
    fs.writeFileSync(fichier, Buffer.from(sorties[nom].split(",")[1], "base64"));
    console.log(config[nom], Math.round(fs.statSync(fichier).size / 1024) + " Ko");
  }
  await navigateur.close();
})();
