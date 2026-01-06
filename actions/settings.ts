"use server"

import { getUserById } from "@/data/user"
import { db } from "@/lib/db"
// import { uploadBase64Image } from "@/lib/cloudinary"
import bcrypt from "bcryptjs"
import { sendVerificationEmail } from "@/lib/mail"
import { generateVerificationToken } from "@/lib/tokens"

export const updateName = async (id: string, name: string) => {
  try {
    const user = await getUserById(id)

    if (!user) {
      return { error: "Usuario no encontrado" }
    }

    // Validar el nombre
    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      return { error: "El nombre debe tener entre 2 y 50 caracteres" }
    }

    await db.user.update({
      where: {
        id: id
      },
      data: {
        name: name.trim()
      }
    })

    return { success: "Nombre actualizado" }
  } catch (error) {
    return { error: "Algo salió mal" }
  }
}

export const updateEmail = async (
  id: string,
  email: string,
  password: string,
  oldemail: string
) => {
  try {
    const user = await getUserById(id)

    if (!user) {
      return { error: "Usuario no encontrado" }
    }

    if (!user.password) {
      return { error: "El usuario no tiene contraseña (cuenta vinculada)" }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "Formato de email inválido" }
    }

    const used = await db.user.findFirst({
      where: {
        email: email
      }
    })

    if (used) {
      return { error: "El email ya está en uso" }
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return { error: "Contraseña incorrecta" }
    }

    const verificationToken = await generateVerificationToken(email, oldemail)
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    )

    return { success: "Email de verificación enviado" }
  } catch (error) {
    return { error: "Algo salió mal" }
  }
}

export const updatePassword = async (
  id: string,
  password: string,
  newPassword: string
) => {
  try {
    const user = await getUserById(id)

    if (!user) {
      return { error: "Usuario no encontrado" }
    }

    if (!user.password) {
      return { error: "El usuario no tiene contraseña (cuenta vinculada)" }
    }

    // Validar contraseña actual
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return { error: "Contraseña incorrecta" }
    }

    // Validar nueva contraseña
    if (newPassword.length < 6) {
      return { error: "La nueva contraseña debe tener al menos 6 caracteres" }
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return { error: "Debes ingresar una contraseña diferente a la actual" }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await db.user.update({
      where: {
        id: id
      },
      data: {
        password: hashedPassword
      }
    })

    return { success: "Contraseña actualizada" }
  } catch (error) {
    return { error: "Algo salió mal" }
  }
}

export const enable2FA = async (id: string) => {
  try {
    const user = await getUserById(id)

    if (!user) {
      return { error: "Usuario no encontrado" }
    }

    if (!user.emailVerified) {
      return { error: "Debes verificar tu email primero" }
    }

    if (user.isTwoFactorEnabled) {
      return { error: "2FA ya está habilitado" }
    }

    await db.user.update({
      where: {
        id: id
      },
      data: {
        isTwoFactorEnabled: true
      }
    })

    return { success: "2FA Habilitado" }
  } catch (error) {
    return { error: "Algo salió mal" }
  }
}

export const disable2FA = async (id: string) => {
  try {
    const user = await getUserById(id)

    if (!user) {
      return { error: "Usuario no encontrado" }
    }

    if (!user.isTwoFactorEnabled) {
      return { error: "2FA no está habilitado" }
    }

    await db.user.update({
      where: {
        id: id
      },
      data: {
        isTwoFactorEnabled: false
      }
    })

    return { success: "2FA Deshabilitado" }
  } catch (error) {
    return { error: "Algo salió mal" }
  }
}

export const updateProfileImage = async (id: string, imageBase64: string) => {
  try {
    const user = await getUserById(id)

    if (!user) {
      return { error: "Usuario no encontrado" }
    }

    // Validar que la imagen sea base64 válida
    if (!imageBase64 || !imageBase64.startsWith("data:image/")) {
      return { error: "Formato de imagen inválido" }
    }

    // Validar tamaño de la imagen (aproximadamente 5MB en base64)
    const base64Size = imageBase64.length * 0.75 // Aproximación del tamaño real
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (base64Size > maxSize) {
      return { error: "La imagen es demasiado grande. Máximo 5MB." }
    }

    // Cloudinary implementation commented out
    /*
    const cloudinaryUrl = await uploadBase64Image(imageBase64)

    if (!cloudinaryUrl) {
      return { error: "Error al subir la imagen. Intenta nuevamente." }
    }

    await db.user.update({
      where: {
        id: id
      },
      data: {
        image: cloudinaryUrl
      }
    })
    */

    return { success: "Actualización de imagen desactivada" }
  } catch (error) {
    return { error: "Algo salió mal" }
  }
}
