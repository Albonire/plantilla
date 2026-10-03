#!/usr/bin/env bash
# Converts the raw Gemini Notebook exports into light web assets.
# Usage: scripts/procesar_media.sh /path/to/Assets
# Needs ffmpeg (libmp3lame, libopenh264 or libx264, libsvtav1, libopus) and ImageMagick.
set -euo pipefail

ORIGEN="${1:?falta la carpeta con los archivos originales}"
DESTINO="$(cd "$(dirname "$0")/.." && pwd)"
AUDIO="$DESTINO/public/media/audio"
VIDEO="$DESTINO/public/media/video"
INFO="$DESTINO/src/assets/infografias"
mkdir -p "$AUDIO" "$VIDEO" "$INFO"

buscar() {
  # first existing file among the given candidates
  for candidato in "$@"; do
    if [ -f "$ORIGEN/$candidato" ]; then
      printf '%s' "$ORIGEN/$candidato"
      return 0
    fi
  done
  return 1
}

for n in ${CASOS:-1 2 3 4 5}; do
  # podcasts: mono mp3 at 64 kbps
  if entrada=$(buscar "caso_${n}_podcast.mp3" "caso_${n}_podcast.m4a" "caso_${n}.mp3"); then
    ffmpeg -v error -y -i "$entrada" -vn -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k \
      "$AUDIO/caso_${n}_podcast.mp3"
    echo "audio caso $n listo"
  else
    echo "audio caso $n: no hay archivo"
  fi

  # videos: 540x960, av1 in webm plus h264 fallback for browsers without av1
  if entrada=$(buscar "caso_${n}_video.mp4" "caso_${n}:_video.mp4" "caso_${n}.mp4"); then
    ffmpeg -v error -y -i "$entrada" -vf "scale=540:960:flags=lanczos" -c:v libopenh264 -b:v 520k \
      -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 64k -ac 1 \
      "$VIDEO/caso_${n}_video.mp4"
    ffmpeg -v error -y -i "$entrada" -vf "scale=540:960:flags=lanczos" -c:v libsvtav1 -crf 38 \
      -preset 6 -pix_fmt yuv420p -c:a libopus -b:a 48k -ac 1 "$VIDEO/caso_${n}_video.webm"
    # poster: a frame near the start, as webp
    ffmpeg -v error -y -ss 1.2 -i "$entrada" -frames:v 1 -vf "scale=540:960:flags=lanczos" \
      "$VIDEO/caso_${n}_poster.png"
    magick "$VIDEO/caso_${n}_poster.png" -quality 78 "$VIDEO/caso_${n}_poster.webp"
    rm -f "$VIDEO/caso_${n}_poster.png"
    echo "video caso $n listo"
  else
    echo "video caso $n: no hay archivo"
  fi

  # infographics: crop the empty margins Gemini leaves around some of them (content is untouched),
  # the build converts the result to avif and webp
  if entrada=$(buscar "caso_${n}_infografia.png" "caso_${n}_infografía.png"); then
    case "$n" in
      1) recorte="1240x2048+372+0" ;;
      2) recorte="1499x1536+625+0" ;;
      3) recorte="1052x1536+850+0" ;;
      *) recorte="" ;;
    esac
    if [ -n "$recorte" ]; then
      magick "$entrada" -crop "$recorte" +repage "$INFO/caso_${n}_infografia.png"
    else
      cp "$entrada" "$INFO/caso_${n}_infografia.png"
    fi
    echo "infografia caso $n lista"
  fi
done
