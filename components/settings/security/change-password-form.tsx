'use client'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FormError } from '@/components/ui/form-error'
import { FormSuccess } from '@/components/ui/form-success'
import { updatePassword } from '@/actions/settings'
import { useSession } from 'next-auth/react'

const schema = z.object({
  password: z.string().min(6, {
    message: 'La contraseña debe tener al menos 6 caracteres',
  }),
  newPassword: z.string().min(6, {
    message: 'La contraseña debe tener al menos 6 caracteres',
  }),
  confirmPassword: z.string().min(6, {
    message: 'La contraseña debe tener al menos 6 caracteres',
  }),
})

export default function ChangePasswordForm({
  onConfirm,
}: {
  onConfirm?: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  const { data: session } = useSession()

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setError(null)
    setSuccess(null)
    setLoading(true)
    if (!session?.user?.id) {
      setError('No se encontro el usuario')
      setLoading(false)
      return
    }
    const result = await updatePassword(
      session.user.id,
      data.password,
      data.newPassword,
    )
    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
    if (result.success) {
      setSuccess(result.success)
      setLoading(false)
      onConfirm?.()
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-4'
      >
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <div className='flex flex-col gap-2'>
                <Label>Contraseña actual</Label>
                <FormControl>
                  <Input type='password' placeholder='******' {...field} />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='newPassword'
          render={({ field }) => (
            <FormItem>
              <div className='flex flex-col gap-2'>
                <Label>Nueva contraseña</Label>
                <FormControl>
                  <Input type='password' placeholder='******' {...field} />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <div className='flex flex-col gap-2'>
                <Label>Confirmar contraseña</Label>
                <FormControl>
                  <Input type='password' placeholder='******' {...field} />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button disabled={loading} type='submit'>
          {loading ? 'Cambiando contraseña...' : 'Cambiar contraseña'}
        </Button>
        <FormError message={error} />
        <FormSuccess message={success} />
      </form>
    </Form>
  )
}
