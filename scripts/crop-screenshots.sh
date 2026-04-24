#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Varys — Screenshot crop helper
# Usage : ./varys-crop-screenshots.sh [input_dir] [output_dir]
# Dépendance : ImageMagick (`brew install imagemagick`)
#
# Cible README GitHub :
#   • Full-width hero  → 1280 × 800 (recadrage centré)
#   • Small thumb      →  640 × 400 (recadrage centré)
#   • macOS frame      → ajoute un cadre de fenêtre macOS simulé (+40px top, +20px sides/bottom)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

INPUT_DIR="${1:-./screenshots/raw}"
OUTPUT_DIR="${2:-./screenshots}"

HERO_W=1280
HERO_H=800
THUMB_W=640
THUMB_H=400

# Couleur barre de titre simulée (macOS dark)
TITLEBAR_COLOR="#1e1e2e"
TITLEBAR_H=40
SIDE_PAD=20
BOTTOM_PAD=20

# Trafic lights (rouge/jaune/vert) positionnés à gauche
TL_Y=14
TL_R=6   # rayon
RED_X=20
YEL_X=40
GRN_X=60

mkdir -p "$OUTPUT_DIR/hero" "$OUTPUT_DIR/thumb" "$OUTPUT_DIR/framed"

crop_center() {
  local src="$1" dst="$2" w="$3" h="$4"
  convert "$src" \
    -gravity Center \
    -crop "${w}x${h}+0+0" \
    +repage \
    "$dst"
  echo "  ✓ $(basename "$dst")"
}

add_macos_frame() {
  local src="$1" dst="$2"
  local img_w img_h
  img_w=$(identify -format "%w" "$src")
  img_h=$(identify -format "%h" "$src")

  local canvas_w=$(( img_w + SIDE_PAD * 2 ))
  local canvas_h=$(( img_h + TITLEBAR_H + BOTTOM_PAD ))

  # 1. Crée la fenêtre (fond foncé arrondi)
  convert -size "${canvas_w}x${canvas_h}" xc:none \
    -fill "$TITLEBAR_COLOR" \
    -draw "roundrectangle 0,0 $((canvas_w-1)),$((canvas_h-1)) 10,10" \
    /tmp/varys_frame_bg.png

  # 2. Colle le screenshot sous la titlebar
  composite -geometry "+${SIDE_PAD}+${TITLEBAR_H}" "$src" /tmp/varys_frame_bg.png /tmp/varys_frame_comp.png

  # 3. Ajoute les traffic lights
  convert /tmp/varys_frame_comp.png \
    -fill "#ff5f57" -draw "circle ${RED_X},${TL_Y} $((RED_X+TL_R)),${TL_Y}" \
    -fill "#febc2e" -draw "circle ${YEL_X},${TL_Y} $((YEL_X+TL_R)),${TL_Y}" \
    -fill "#28c840" -draw "circle ${GRN_X},${TL_Y} $((GRN_X+TL_R)),${TL_Y}" \
    "$dst"

  rm -f /tmp/varys_frame_bg.png /tmp/varys_frame_comp.png
  echo "  ✓ framed/$(basename "$dst")"
}

echo "🐦 Varys — crop & frame screenshots"
echo "   Input  : $INPUT_DIR"
echo "   Output : $OUTPUT_DIR"
echo ""

shopt -s nullglob
files=("$INPUT_DIR"/*.{png,jpg,jpeg,PNG,JPG,JPEG})

if [[ ${#files[@]} -eq 0 ]]; then
  echo "⚠️  Aucun fichier trouvé dans $INPUT_DIR"
  exit 1
fi

for src in "${files[@]}"; do
  name=$(basename "${src%.*}")
  echo "📸 $name"

  crop_center "$src" "$OUTPUT_DIR/hero/${name}-hero.png"    $HERO_W  $HERO_H
  crop_center "$src" "$OUTPUT_DIR/thumb/${name}-thumb.png"  $THUMB_W $THUMB_H
  add_macos_frame "$OUTPUT_DIR/hero/${name}-hero.png" "$OUTPUT_DIR/framed/${name}-framed.png"
done

echo ""
echo "✅ Done — $(ls "$OUTPUT_DIR/framed/" | wc -l | tr -d ' ') screenshot(s) traité(s)"
echo "   → Utilise les fichiers dans screenshots/framed/ pour le README"
