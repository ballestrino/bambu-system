"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export default function DeleteDialog({
  title = "Eliminar",
  description = "¿Estas seguro de eliminar esto?",
  onClose,
  onConfirm,
  trigger,
  deleteButtonText = "Eliminar",
  deleteButtonVariant = "destructive"
}: {
  title?: string
  description?: string
  onClose?: () => void
  onConfirm: () => void | Promise<void>
  trigger?: React.ReactNode
  deleteButtonText?: string
  deleteButtonVariant?: "default" | "destructive"
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [loading, setLoading] = useState(false)

  const closeOnEdit = () => {
    if (ref.current) {
      ref.current.click()
      onClose?.()
    }
  }

  const closeOnCancel = () => {
    if (ref.current) {
      ref.current.click()
      onClose?.()
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
    closeOnEdit()
  }

  return (
    <Dialog onOpenChange={closeOnEdit}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant='destructive'>
            <Trash2 /> {deleteButtonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{description}</DialogDescription>
        <div className='flex w-full justify-end gap-2'>
          <Button variant='outline' onClick={closeOnCancel}>
            Cancelar
          </Button>
          <Button
            variant={deleteButtonVariant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {deleteButtonText}
          </Button>
        </div>
        <DialogClose className='hidden' ref={ref} />
      </DialogContent>
    </Dialog>
  )
}
