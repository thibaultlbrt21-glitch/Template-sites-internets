#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère admin/demo.html à partir de admin/config.yml (template menuisier).

L'aperçu de démonstration affiche exactement les mêmes champs, libellés et
aides que l'espace client réel (Decap CMS) : le fichier de configuration
est l'unique source, les deux ne peuvent donc pas diverger.

    python3 tools/build-admin-demo.py

À relancer après chaque modification de admin/config.yml.
"""

import glob
import io
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.exit("PyYAML est requis : pip install pyyaml")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

KEEP = ("name", "label", "widget", "hint", "required", "label_singular",
        "summary", "min", "max", "collapsed", "options")


def extract(field):
    """Ne garde du champ que ce dont le formulaire a besoin."""
    out = {k: field[k] for k in KEEP if k in field}
    out.setdefault("widget", "string")
    if "fields" in field:
        out["fields"] = [extract(f) for f in field["fields"]]
    elif "field" in field:
        # Liste de valeurs simples (widget `field` au singulier chez Decap) :
        # on la signale au formulaire, qui affichera une entrée par ligne.
        out["scalaire"] = extract(field["field"])
    return out


def main():
    with io.open(os.path.join(ROOT, "admin", "config.yml"), encoding="utf-8") as fh:
        config = yaml.safe_load(fh)

    entry = config["collections"][0]["files"][0]
    schema = {
        "label": entry.get("label", "Contenu"),
        "description": entry.get("description", "").strip(),
        "fields": [extract(f) for f in entry["fields"]],
    }

    images = sorted(
        os.path.relpath(p, ROOT).replace(os.sep, "/")
        for p in glob.glob(os.path.join(ROOT, "assets", "images", "*.svg"))
        + glob.glob(os.path.join(ROOT, "assets", "images", "*.jpg"))
        + glob.glob(os.path.join(ROOT, "assets", "images", "*.png"))
    )

    with io.open(os.path.join(ROOT, "tools", "admin-demo.template.html"), encoding="utf-8") as fh:
        template = fh.read()

    html = (template
            .replace("/*__SCHEMA__*/null", json.dumps(schema, ensure_ascii=False))
            .replace("/*__IMAGES__*/null", json.dumps(images, ensure_ascii=False)))

    target = os.path.join(ROOT, "admin", "demo.html")
    with io.open(target, "w", encoding="utf-8") as fh:
        fh.write(html)

    count = len(schema["fields"])
    print("admin/demo.html généré — %d groupes de champs, %d images disponibles"
          % (count, len(images)))


if __name__ == "__main__":
    main()
