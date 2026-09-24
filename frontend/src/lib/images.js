export const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export function validateImage(file) {
  if (!acceptedImageTypes.includes(file.type)) return 'Use uma imagem JPG, PNG ou WebP.'
  if (file.size > MAX_IMAGE_BYTES) return 'A imagem deve ter no máximo 5 MB.'
  return ''
}
