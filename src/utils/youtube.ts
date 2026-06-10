/* YouTube detection and embed helpers. */

/** Extract a YouTube video id from the common URL shapes, or null. */
export function getYouTubeId(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return id || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (u.pathname === '/watch') {
        return u.searchParams.get('v')
      }
      const parts = u.pathname.split('/').filter(Boolean)
      // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
      if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
        return parts[1] || null
      }
    }
  } catch {
    // not a parseable URL
  }
  return null
}

export function isYouTubeUrl(url: string): boolean {
  return getYouTubeId(url) !== null
}

/** Privacy-friendly nocookie embed URL for a given video id. */
export function getYouTubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`
}
