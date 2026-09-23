import * as z from "zod"

// ~5MB decoded: a base64 string is 4/3 the size of its bytes.
const MAX_PROFILE_IMAGE_BASE64_LENGTH = Math.floor((5 * 1024 * 1024) / 0.75)

export const UpdateNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "El nombre debe tener entre 2 y 50 caracteres" })
    .max(50, { message: "El nombre debe tener entre 2 y 50 caracteres" })
})

export const UpdateEmailSchema = z.object({
  email: z.email({ message: "Formato de email inválido" }),
  password: z.string().min(1, { message: "Ingresá tu contraseña" })
})

export const UpdatePasswordSchema = z
  .object({
    password: z.string().min(1, { message: "Ingresá tu contraseña actual" }),
    newPassword: z.string().min(6, {
      message: "La nueva contraseña debe tener al menos 6 caracteres"
    }),
    confirmPassword: z.string()
  })
  .refine(values => values.newPassword === values.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
  })

export const UpdateProfileImageSchema = z.object({
  image: z
    .string()
    .startsWith("data:image/", { message: "Formato de imagen inválido" })
    .max(MAX_PROFILE_IMAGE_BASE64_LENGTH, {
      message: "La imagen es demasiado grande. Máximo 5MB."
    })
})

export type UpdateNameValues = z.infer<typeof UpdateNameSchema>
export type UpdateEmailValues = z.infer<typeof UpdateEmailSchema>
export type UpdatePasswordValues = z.infer<typeof UpdatePasswordSchema>
export type UpdateProfileImageValues = z.infer<typeof UpdateProfileImageSchema>

export const getSettingsValidationError = (error: z.ZodError) =>
  error.issues[0]?.message ?? "Datos inválidos"
