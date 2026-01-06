"use client"

import { UpdateSession, useSession } from "next-auth/react"
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
import { updateName } from "@/actions/settings"
import { FormError } from "@/components/ui/form-error"
import { User } from "next-auth"
import { toast } from "sonner"
import { CheckCircle } from "lucide-react"

export default function ChangeName({ user, update }: { user: User, update: UpdateSession }) {
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setError(null)
    setLoading(true)
    if (!user) return
    if (!user.id) return
    if (!name) return
    const result = await updateName(user.id, name)
    if (result.success) {
      update()
      setOpen(false)
      toast("Nombre cambiado exitosamente", {
        description: "Refresca la página para ver los cambios",
        descriptionClassName: "!text-gray-500",
        position: "top-center",
        icon: <CheckCircle className='h-5 w-5 text-green-500' />
      })
      setName("")
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
        <p title={user.name || "nombre del usuario"} className='line-clamp-1'>
          {user.name && user.name?.length > 20
            ? user.name?.slice(0, 20) + "..."
            : user.name}
        </p>
        <DialogTrigger asChild>
          <Button size={"sm"} variant='outline'>
            Cambiar
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar nombre</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label>Nuevo nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <DialogDescription>
            Los cambios de Nombre estan limitados, verifica antes de confirmar.
          </DialogDescription>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Cambiando..." : "Cambiar nombre"}
          </Button>
          <FormError message={error} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
