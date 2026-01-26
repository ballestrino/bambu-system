import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

export const sendTwoFactorEmail = async (email: string, token: string) => {
  await resend.emails.send({
    from: "twofactorverification@bambu-servicios.com",
    to: email,
    subject: "Tu código de autenticación - Bambú System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Autenticación de Dos Factores</h2>
        <p style="color: #555; font-size: 16px;">Hola,</p>
        <p style="color: #555; font-size: 16px;">Usa el siguiente código para completar tu inicio de sesión:</p>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111;">${token}</span>
        </div>
        <p style="color: #888; font-size: 14px; text-align: center;">Si no solicitaste este código, por favor ignora este correo.</p>
      </div>
    `
  })
}

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${baseUrl}/auth/new-password?token=${token}`

  await resend.emails.send({
    from: "passwordreset@bambu-servicios.com",
    to: email,
    subject: "Restablecer tu contraseña - Bambú System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Restablecer Contraseña</h2>
        <p style="color: #555; font-size: 16px;">Hola,</p>
        <p style="color: #555; font-size: 16px;">Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-size: 16px; font-weight: bold;">Restablecer Contraseña</a>
        </div>
        <p style="color: #888; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
        <p style="color: #0070f3; font-size: 14px; word-break: break-all;">${resetLink}</p>
      </div>
    `
  })
}

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${baseUrl}/auth/new-verification?token=${token}`

  await resend.emails.send({
    from: "verification@bambu-servicios.com",
    to: email,
    subject: "Confirma tu correo electrónico - Bambú System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Confirma tu Correo</h2>
        <p style="color: #555; font-size: 16px;">Hola,</p>
        <p style="color: #555; font-size: 16px;">Gracias por registrarte. Por favor confirma tu dirección de correo electrónico haciendo clic en el siguiente botón:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmLink}" style="background-color: #000; color: #fff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-size: 16px; font-weight: bold;">Confirmar Correo</a>
        </div>
        <p style="color: #888; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
        <p style="color: #0070f3; font-size: 14px; word-break: break-all;">${confirmLink}</p>
      </div>
    `
  })
}
