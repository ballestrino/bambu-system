"use server"

import { auth } from "@/auth"
import { getUserById } from "@/data/user"
import { sendPasswordResetEmail } from "@/lib/mail"
import { generatePasswordResetToken } from "@/lib/tokens"

export const resetPasswordLoggedIn = async () => {
  try {
    // Get current session
    const session = await auth()

    if (!session?.user?.id) {
      return { error: "No autenticado" }
    }

    // Get user data
    const existingUser = await getUserById(session.user.id)

    if (!existingUser || !existingUser.email) {
      return { error: "Usuario no encontrado" }
    }

    // Generate password reset token
    const passwordResetToken = await generatePasswordResetToken(
      existingUser.email
    )

    // Send reset email
    await sendPasswordResetEmail(
      passwordResetToken.email,
      passwordResetToken.token
    )

    return { success: "Email de restablecimiento enviado" }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return { error: "Error enviando email" }
  }
}
