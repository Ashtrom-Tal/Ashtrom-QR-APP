import { getYouTubeEmbedUrl } from '../utils/youtube'
import styles from './YouTubeEmbed.module.css'

interface YouTubeEmbedProps {
  videoId: string
  title?: string
}

/** Responsive 16:9 YouTube preview. The QR is still built from the real URL. */
export function YouTubeEmbed({ videoId, title = 'YouTube video preview' }: YouTubeEmbedProps) {
  return (
    <div className={styles.wrap}>
      <iframe
        src={getYouTubeEmbedUrl(videoId)}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}
