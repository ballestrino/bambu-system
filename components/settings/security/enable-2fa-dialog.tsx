import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import TwoFactorPolicy from "./2FA-policy"
import { ExtendedUser } from "@/next-auth"
import { enable2FA } from "@/actions/settings"
import { FormError } from "@/components/ui/form-error"
import { FormSuccess } from "@/components/ui/form-success"

export default function Enable2faDialog({
  open,
  setOpen,
  user,
  onSuccess
}: {
  open?: boolean
  setOpen?: (open: boolean) => void
  user: ExtendedUser
  onSuccess?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const handleEnable2FA = async () => {
    setLoading(true)
    setError(null)
    if (!user.id) {
      setLoading(false)
      setError("No se encontro el usuario")
      return
    }
    const result = await enable2FA(user.id)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    }

    if (result.success) {
      setSuccess(result.success)
      setLoading(false)
      onSuccess?.()
      setTimeout(() => {
        setIsOpen(false)
      }, 2500)
    }
  }
  return (
    <Dialog open={open || isOpen} onOpenChange={setOpen || setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <p>Habilitar 2FA</p>
          <Plus className='h-6 w-6' />
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>Habilitar 2FA</DialogTitle>
          <DialogDescription>
            Habilitar la autenticación de dos factores (2FA) para tu cuenta.
          </DialogDescription>
        </DialogHeader>
        <TwoFactorPolicy email={user.email as string} />
        <DialogFooter>
          <div className='flex w-full justify-between'>
            <Button
              className='w-fit'
              variant='outline'
              onClick={() => setOpen?.(false)}
            >
              Cancelar
            </Button>
            <Button
              className='w-fit'
              onClick={handleEnable2FA}
              disabled={loading}
            >
              {loading ? "Habilitando..." : "Habilitar 2FA"}
            </Button>
          </div>
        </DialogFooter>
        <FormError message={error} />
        <FormSuccess message={success} />
      </DialogContent>
    </Dialog>
  )
}
