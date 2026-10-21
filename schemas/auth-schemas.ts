import * as z from "zod"

// bcrypt ignores everything past 72 bytes.
const MAX_PASSWORD_LENGTH = 72

const passwordSchema = z
  .string()
  .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  .max(MAX_PASSWORD_LENGTH, {
    message: "La contraseña puede tener hasta 72 caracteres"
  })

export const registerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "El nombre debe tener al menos 3 letras" })
    .max(50, { message: "El nombre puede tener hasta 50 letras" }),
  email: z
    .string()
    .max(254, { message: "Email invalido" })
    .email({
      message: "Email invalido"
    })
})

export const loginFormSchema = z.object({
  email: z.string().email({
    message: "Email is required"
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres"
  }),
  code: z.optional(z.string())
})

export const ResetSchema = z.object({
  email: z.email({
    message: "Email invalido"
  })
})

export const NewPasswordSchema = z.object({
  password: passwordSchema
})
