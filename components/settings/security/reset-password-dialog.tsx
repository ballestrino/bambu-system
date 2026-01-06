"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { resetPasswordLoggedIn } from "@/actions/resetPasswordLoggedIn"
import { FormError } from "@/components/ui/form-error"
import { FormSuccess } from "@/components/ui/form-success"
import { User } from "next-auth"
import { toast } from "sonner"
import { Mail } from "lucide-react"

export default function ResetPasswordDialog({ user }: { user: User }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const handleSend = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (!user) return
    if (!user.id) return

    const result = await resetPasswordLoggedIn()

    if (result.success) {
      setSuccess(result.success)
      setOpen(false)
      toast.success("Email enviado exitosamente", {
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña",
      })
      setConfirm(false)
    }

    if (result.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) {
        setError(null)
        setSuccess(null)
        setConfirm(false)
      }
    }}>
      <div className='flex items-center gap-2'>
        <DialogTrigger asChild>
          <Button size='sm' variant='link'>
            ¿Olvidaste tu contraseña?
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restablecer contraseña</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950'>
            <div className='flex items-start gap-3'>
              <Mail className='mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-500' />
              <div className='flex-1 space-y-2'>
                <p className='text-sm font-medium text-amber-900 dark:text-amber-100'>
                  Se enviará un email de restablecimiento
                </p>
                <p className='text-sm text-amber-700 dark:text-amber-300'>
                  Recibirás un correo electrónico en <span className="font-medium">{user.email}</span> con un enlace para restablecer tu contraseña.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="confirm"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="confirm" className="text-sm font-normal">
              Confirmo que quiero recibir un email para restablecer mi contraseña
            </label>
          </div>

          <Button onClick={handleSend} disabled={loading || !confirm}>
            {loading ? "Enviando..." : "Enviar email"}
          </Button>
          <FormError message={error} />
          <FormSuccess message={success} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
