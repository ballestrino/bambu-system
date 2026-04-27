'use server'

import { auth } from '@/auth'
import { uploadBase64Image } from '@/lib/cloudinary'

export async function uploadChatImage(base64: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: 'No autorizado' }
  }

  if (!base64 || !base64.startsWith('data:image/')) {
    return { error: 'Formato de imagen inválido' }
  }

  const approxSize = base64.length * 0.75
  const maxSize = 5 * 1024 * 1024
  if (approxSize > maxSize) {
    return { error: 'La imagen es demasiado grande. Máximo 5MB.' }
  }

  const url = await uploadBase64Image(base64, 'bambu/chat')

  if (!url) {
    return { error: 'Error al subir la imagen. Intenta nuevamente.' }
  }

  return { success: true, url }
}
