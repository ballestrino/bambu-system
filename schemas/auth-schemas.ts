import * as z from "zod"

export const registerFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "El nombre debe tener al menos 3 letras" }),
  email: z.string().email({
    message: "Email invalido"
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres"
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
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres"
  })
})
