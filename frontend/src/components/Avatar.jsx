import { initial } from '../lib/text'

export function Avatar({ name, imageUrl, className = 'avatar' }) {
  return (
    <span className={className} aria-hidden="true">
      {imageUrl ? <img src={imageUrl} alt="" /> : initial(name)}
    </span>
  )
}
