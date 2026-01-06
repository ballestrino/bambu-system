import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import ChangePasswordForm from '@/components/settings/security/change-password-form'
import ResetPasswordDialog from './reset-password-dialog'
import { User } from 'next-auth'

import { useState } from 'react'

export default function ChangePasswordDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <p>Cambiar</p>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Llena el formulario para cambiar tu contraseña
          </DialogDescription>
        </DialogHeader>
        <ChangePasswordForm onConfirm={() => setOpen(false)} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              O
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center justify-center">
          <ResetPasswordDialog user={user} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
