// Mounted over Core's dist/streamPatterns.js by cinepro/compose.yml. Core's proxy rewrites any
// answer the upstream labels as text, which destroys media that a host disguises as .html; a URL
// matching one of these patterns is streamed through untouched instead. The first eleven are
// Core's own list at the pinned image (src/streamPatterns.ts); refresh them when the image moves.
export const streamPatterns = [
  /pixeldrain\.dev|pixeldra\.in/,
  /hub\.(raj\.lat|toxix\.buzz|oreao-cdn\.buzz)/,
  /wasabisys\.com/,
  /hakunaymatata\.com/,
  /streamflixserver\.site|tripplestream\.online/,
  /illimitableinkwell\.site/,
  /frostcomet5\.pro/,
  /(epimetheus63|earth14|pandora20)\.workers\.dev/,
  /tiktokcdn\.com/,
  /\/content\/(.)*\/page-(.)*\.html/,
  /trendimovies\.com\/tgstream\/stream/,
  // VixSrc: AES-128 segments at /hls/<path>/<track>/<rendition>/NNNN-NNNN.html, served as text/html.
  /\/hls\/.+\/\d{4}-\d{4}\.html(\?|$)/,
]
