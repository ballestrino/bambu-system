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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { updateEmail } from "@/actions/settings"
import { FormError } from "@/components/ui/form-error"
import { User } from "next-auth"
import { useSession } from "next-auth/react"

export default function ChangeEmail({ user }: { user: User }) {
  const { update } = useSession()
  const [password, setPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setError(null)
    setLoading(true)
    if (!user) return
    if (!user.id) return
    if (!user.email) return
    if (!password) return
    if (!newEmail) return
    const result = await updateEmail(user.id, newEmail, password, user.email)
    if (result.success) {
      update()
      setOpen(false)
      setPassword("")
      setNewEmail("")
    }
    if (result.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className='flex items-center gap-2'>
        <p title={user.email || "email del usuario"} className='line-clamp-1'>
          {user.email && user.email?.length > 20
            ? user.email?.slice(0, 20) + "..."
            : user.email}
        </p>
        <DialogTrigger asChild>
          <Button size='sm' variant='outline'>
            Cambiar
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar correo electrónico</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label>Nuevo correo electrónico</Label>
            <Input
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label>Contraseña</Label>
            <Input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <DialogDescription>
            Verifica el correo electrónico antes de confirmar
          </DialogDescription>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
          <FormError message={error} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
