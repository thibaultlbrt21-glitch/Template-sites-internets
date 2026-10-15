# Régénère assets/js/dessins.js (les six plans d atelier) : python3 tools/generer-dessins.py
import random, json
R = lambda v: ('%.1f' % v).rstrip('0').rstrip('.')

class D:
    def __init__(s): s.el = []
    def rect(s, x, y, w, h, c='p'): s.el.append(f'<rect class="{c}" x="{R(x)}" y="{R(y)}" width="{R(w)}" height="{R(h)}"/>')
    def line(s, x1, y1, x2, y2, c='t'): s.el.append(f'<line class="{c}" x1="{R(x1)}" y1="{R(y1)}" x2="{R(x2)}" y2="{R(y2)}"/>')
    def poly(s, pts, c='p', closed=True):
        tag = 'polygon' if closed else 'polyline'
        s.el.append(f'<{tag} class="{c}" points="' + ' '.join(f'{R(x)},{R(y)}' for x, y in pts) + '"/>')
    def path(s, d, c='f'): s.el.append(f'<path class="{c}" d="{d}"/>')
    def circle(s, x, y, r, c='f'): s.el.append(f'<circle class="{c}" cx="{R(x)}" cy="{R(y)}" r="{R(r)}"/>')
    def text(s, x, y, t, anchor='middle', rot=None):
        tr = f' transform="rotate({rot} {R(x)} {R(y)})"' if rot is not None else ''
        s.el.append(f'<text class="x" x="{R(x)}" y="{R(y)}" text-anchor="{anchor}"{tr}>{t}</text>')
    # cotes d'architecte : ligne, petits traits obliques aux extrémités, attaches
    def coteH(s, x1, x2, y, t, attache=None):
        if attache is not None:
            s.line(x1, attache, x1, y - 4, 'c'); s.line(x2, attache, x2, y - 4, 'c')
        s.line(x1 - 6, y, x2 + 6, y, 'c')
        s.line(x1 - 3, y + 3, x1 + 3, y - 3, 'c'); s.line(x2 - 3, y + 3, x2 + 3, y - 3, 'c')
        s.text((x1 + x2) / 2, y - 5, t)
    def coteV(s, y1, y2, x, t, attache=None):
        if attache is not None:
            s.line(attache, y1, x + 4, y1, 'c'); s.line(attache, y2, x + 4, y2, 'c')
        s.line(x, y1 - 6, x, y2 + 6, 'c')
        s.line(x - 3, y1 + 3, x + 3, y1 - 3, 'c'); s.line(x - 3, y2 + 3, x + 3, y2 - 3, 'c')
        s.text(x - 6, (y1 + y2) / 2, t, rot=-90)
    def svg(s): return ''.join(s.el)

random.seed(4)
dessins = {}

# ---------------- CUISINE ----------------
d = D()
d.line(14, 262, 386, 262, 't')
for i in range(26): d.line(20 + i * 14, 262, 12 + i * 14, 270, 'f')
d.rect(34, 162, 332, 8)                       # plan de travail
for i, x in enumerate([40, 120, 200, 280]):
    d.rect(x, 172, 78, 82)
d.rect(40, 254, 318, 6, 'f')                  # socle
d.line(40, 199, 118, 199, 'f'); d.line(40, 226, 118, 226, 'f')
for y in (185, 212, 240): d.line(66, y, 92, y, 't')
d.line(176, 182, 176, 206, 't')
d.line(239, 172, 239, 254, 'f'); d.line(231, 182, 231, 206, 't'); d.line(247, 182, 247, 206, 't')
d.line(280, 212, 358, 212, 'f'); d.line(306, 192, 332, 192, 't'); d.line(306, 232, 332, 232, 't')
# évier + mitigeur
d.path('M214 162 L214 150 Q214 140 224 140 L232 140 Q238 140 238 148', 't')
# meubles hauts + étagères ouvertes
d.rect(40, 46, 58, 76); d.rect(100, 46, 58, 76)
d.line(90, 98, 90, 114, 't'); d.line(108, 98, 108, 114, 't')
d.rect(176, 84, 90, 5); d.rect(176, 118, 90, 5)
d.rect(284, 46, 74, 76); d.line(296, 98, 296, 114, 't')
# objets sur les étagères
d.rect(186, 64, 12, 20, 'f'); d.rect(201, 70, 10, 14, 'f'); d.circle(244, 76, 8)
d.path('M244 68 Q240 58 246 52 M244 68 Q252 60 256 62', 'f')
d.rect(190, 104, 26, 14, 'f'); d.rect(222, 108, 30, 10, 'f')
d.circle(60, 150, 8); d.line(60, 150, 60, 162, 'f')
d.coteH(40, 358, 26, '3 180', attache=44)
d.coteV(162, 262, 384, '900', attache=368)
dessins['cuisine'] = dict(titre='Cuisine sur mesure', svg=d.svg())

# ---------------- DRESSING ----------------
d = D()
d.line(14, 262, 386, 262, 't')
d.rect(60, 32, 280, 230)
d.rect(150, 32, 6, 230); d.rect(244, 32, 6, 230)
d.rect(60, 32, 280, 8, 'f')
# baie gauche : penderie
d.rect(66, 62, 84, 4); d.line(70, 76, 146, 76, 't')
for i, x in enumerate([76, 90, 104, 118, 132]):
    h = random.choice([118, 104, 132, 96, 124])
    d.path(f'M{x} 76 l0 6 M{x-7} 88 L{x} 82 L{x+7} 88', 'f')
    d.path(f'M{x-7} 88 L{x-8} {88+h} L{x+8} {88+h} L{x+7} 88', 'f')
# baie centrale : étagères + tiroirs
for y in (82, 124, 166): d.rect(156, y, 88, 5)
for y in (52, 95, 137):
    d.rect(166, y + 12, 22, 18, 'f'); d.rect(192, y + 18, 30, 12, 'f')
d.rect(156, 196, 88, 66, 'f'); d.line(156, 218, 244, 218, 'f'); d.line(156, 240, 244, 240, 'f')
for y in (206, 228, 250): d.line(188, y, 212, y, 't')
# baie droite : penderie longue + chaussures
d.rect(250, 62, 84, 4); d.line(254, 76, 330, 76, 't')
for x in (266, 284, 302, 318):
    d.path(f'M{x} 76 l0 6 M{x-7} 88 L{x} 82 L{x+7} 88', 'f')
    d.path(f'M{x-7} 88 L{x-9} 214 L{x+9} 214 L{x+7} 88', 'f')
d.line(250, 236, 340, 226, 't'); d.line(250, 256, 340, 246, 't')
for x in (262, 284, 306, 326):
    d.path(f'M{x} {236 - (x-250)/9 - 2} q6 -7 12 -2', 'f')
d.coteH(60, 340, 16, '2 800', attache=28)
d.coteV(32, 262, 372, '2 300', attache=344)
dessins['dressing'] = dict(titre='Dressing', svg=d.svg())

# ---------------- ESCALIER ----------------
d = D()
d.line(10, 262, 390, 262, 't')
d.rect(290, 92, 100, 12)                     # plancher haut
n, x0, y0, go, rise = 8, 40, 262, 250 / 8, 170 / 8
X = [x0 + i * go for i in range(n + 1)]
Y = [y0 - (i + 1) * rise for i in range(n)]
# limon à crémaillère : il suit le profil des marches
prof = [(X[0], 262), (X[0], Y[0] + 5)]
for i in range(n):
    prof.append((X[i + 1], Y[i] + 5))
    if i + 1 < n: prof.append((X[i + 1], Y[i + 1] + 5))
pente = rise / go
yb = lambda x: (Y[0] + 5) - pente * (x - X[1]) + 26
xb = X[1] + ((Y[0] + 5) + 26 - 262) / pente
d.poly(prof + [(290, yb(290)), (xb, 262)])
for i in range(n):
    d.rect(X[i] - 4, Y[i], go + 4, 5)        # marches (nez de 4)
# rampe parallèle aux nez de marche, poteaux, balustres
yr = lambda x: 172 - pente * (x - 37)
d.rect(32, 168, 10, 94); d.rect(266, yr(270) - 4, 8, 92 - yr(270) + 4)
d.line(37, yr(37), 270, yr(270), 't'); d.line(37, yr(37) - 4, 270, yr(270) - 4, 't')
for i in range(n):
    x = X[i] + go / 2
    if x > 262: continue
    d.line(x, Y[i], x, yr(x), 'f')
d.coteH(40, 290, 286, '2 500', attache=266)
d.coteV(92, 262, 16, '1 700', attache=30)
d.text(342, 150, '8 marches', 'middle')
d.text(342, 164, 'h 212 · g 312', 'middle')
dessins['escalier'] = dict(titre='Escalier', svg=d.svg())

# ---------------- BIBLIOTHÈQUE ----------------
d = D()
d.line(14, 262, 386, 262, 't')
d.rect(50, 36, 300, 226)
cols = [50, 125, 200, 275, 350]
for x in cols[1:-1]: d.rect(x - 2.5, 36, 5, 186)
rows = [36, 82, 128, 174, 222]
for y in rows[1:]: d.rect(50, y - 2.5, 300, 5)
# portes basses
for x in (50, 125, 200, 275):
    d.rect(x + 3, 225, 69, 34, 'f'); d.line(x + 30, 236, x + 45, 236, 't')
random.seed(11)
for r in range(4):
    top, bot = rows[r] + 3, rows[r + 1] - 3
    for c in range(4):
        left, right = cols[c] + 4, cols[c + 1] - 4
        kind = (r * 4 + c) % 5
        if kind == 3:      # objet : vase ou pile
            cx = (left + right) / 2
            if r % 2: d.path(f'M{cx-8} {bot} L{cx-10} {bot-18} Q{cx} {bot-30} {cx+10} {bot-18} L{cx+8} {bot}', 'f')
            else:
                for k in range(3): d.rect(left + 8, bot - 7 * (k + 1), right - left - 18 + k * 3, 6, 'f')
            continue
        x = left + random.uniform(0, 6)
        while x < right - 6:
            w = random.uniform(4, 8); h = random.uniform(0.62, 0.92) * (bot - top)
            if random.random() < 0.12 and x + h * 0.5 < right:
                d.poly([(x, bot), (x + w, bot), (x + w + h * 0.45, bot - h * 0.9), (x + h * 0.45, bot - h * 0.9)], 'f')
                break
            d.rect(x, bot - h, w, h, 'f'); x += w + random.uniform(0, 1.5)
            if random.random() < 0.18: x += random.uniform(8, 16)
d.coteH(50, 350, 20, '3 000', attache=32)
d.coteV(36, 262, 374, '2 260', attache=354)
dessins['bibliotheque'] = dict(titre='Bibliothèque', svg=d.svg())

# ---------------- TERRASSE ----------------
d = D()
d.line(6, 236, 394, 236, 't')
for i in range(30): d.line(10 + i * 13, 236, 4 + i * 13, 244, 'f')
A, B, C, Dd = (64, 168), (304, 168), (374, 108), (134, 108)
d.poly([A, B, C, Dd])                                   # plateau
for k in range(1, 9):
    t = k / 9; d.line(A[0] + 70 * t, A[1] - 60 * t, B[0] + 70 * t, B[1] - 60 * t, 'f')
d.poly([A, B, (304, 186), (64, 186)])                    # nez de plateau
d.poly([B, C, (374, 126), (304, 186)])                    # joue droite
# marche
d.poly([(43, 204), (283, 204), (304, 186), (64, 186)])
d.line(53.5, 195, 293.5, 195, 'f')
d.poly([(43, 204), (283, 204), (283, 222), (43, 222)])
d.poly([(283, 204), (304, 186), (304, 204), (283, 222)])
# bain de soleil et table basse
d.path('M214 160 L262 150 L276 116 M222 158 L226 168 M258 151 L260 160 M214 160 L216 166', 't')
d.path('M262 150 L272 124', 'f'); d.path('M218 152 L258 144', 'f')
d.poly([(120, 150), (170, 150), (180, 140), (130, 140)], 'f')
d.line(122, 150, 122, 158, 'f'); d.line(168, 150, 168, 158, 'f')
d.text(330, 74, 'lames 21 × 145', 'middle')
d.line(300, 78, 280, 120, 'c')
d.coteH(43, 283, 258, '6 000', attache=226)
dessins['terrasse'] = dict(titre='Terrasse', svg=d.svg())

# ---------------- COMPTOIR (agencement pro) ----------------
d = D()
d.line(10, 262, 390, 262, 't')
d.rect(70, 150, 260, 112)                               # corps du comptoir
for i in range(1, 26): d.line(70 + i * 10, 158, 70 + i * 10, 254, 'f')
d.rect(60, 142, 280, 8)                                 # plateau bas
d.rect(220, 112, 120, 8)                                # tablette haute
d.rect(226, 120, 6, 22); d.rect(328, 120, 6, 22)
d.rect(70, 254, 260, 8, 'f')
for x, l in ((120, 70), (200, 56), (280, 70)):        # suspensions
    d.line(x, 0, x, l, 'f'); d.path(f'M{x-14} {l+16} Q{x} {l-6} {x+14} {l+16} Z', 't')
d.rect(28, 40, 6, 222, 'f'); d.rect(366, 40, 6, 222, 'f')
d.coteH(60, 340, 286, '2 800', attache=266)
d.coteV(142, 262, 388, '1 100', attache=346)
dessins['comptoir'] = dict(titre='Agencement de commerce', svg=d.svg())

out = ['/* =========================================================================',
       '   PILLIARD MENUISERIE AGENCEMENT — plans d\'atelier',
       '   Dessins en élévation (SVG, 400 × 300), cotes en millimètres.',
       '   Classes : p = panneau (peut être « habillé » de bois), t = trait,',
       '   f = détail fin, c = ligne de cote, x = texte de cote.',
       '   Insertion : <div data-dessin="cuisine"></div> (voir main.js).',
       '   ========================================================================= */',
       'window.DESSINS = {']
items = []
for k, v in dessins.items():
    items.append(f'  {k}: {{\n    titre: {json.dumps(v["titre"], ensure_ascii=False)},\n    svg: {json.dumps(v["svg"], ensure_ascii=False)}\n  }}')
out.append(',\n'.join(items))
out.append('};\n')
open(__import__('os').path.join(__import__('os').path.dirname(__file__), '..', 'assets', 'js', 'dessins.js'), 'w', encoding='utf-8').write('\n'.join(out))
print({k: len(v['svg']) for k, v in dessins.items()})
