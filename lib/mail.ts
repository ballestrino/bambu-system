import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

export const sendTwoFactorEmail = async (email: string, token: string) => {
  await resend.emails.send({
    from: "twofactorverification@bambu-servicios.com",
    to: email,
    subject: "Two Factor Authentication",
    html: `<p>Your two factor authentication code is: ${token}</p>`
  })
}

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${baseUrl}/auth/new-password?token=${token}`

  await resend.emails.send({
    from: "passwordreset@bambu-servicios.com",
    to: email,
    subject: "Reset Password",
    html: `<p>Click <a href="${resetLink}">here</a> to reset password.</p>`
  })
}

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${baseUrl}/auth/new-verification?token=${token}`

  await resend.emails.send({
    from: "verification@bambu-servicios.com",
    to: email,
    subject: "Confirma tu email",
    html: `<p>Click <a href="${confirmLink}">here</a> to confirm your email.</p>`
  })
}
