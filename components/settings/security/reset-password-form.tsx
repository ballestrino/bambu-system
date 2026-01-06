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
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/ui/form-error'
import { FormSuccess } from '@/components/ui/form-success'
import { resetPasswordLoggedIn } from '@/actions/resetPasswordLoggedIn'
import { useSession } from 'next-auth/react'
import { Mail } from 'lucide-react'

const schema = z.object({
  confirm: z.boolean().refine((val) => val === true, {
    message: 'Debes confirmar para continuar',
  }),
})

export default function ResetPasswordForm({
  onSuccess,
}: {
  onSuccess?: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      confirm: false,
    },
  })

  const onSubmit = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (!session?.user?.id) {
      setError('No se encontró el usuario')
      setLoading(false)
      return
    }

    const result = await resetPasswordLoggedIn()

    if (result.error) {
      setError(result.error)
      setLoading(false)
    }

    if (result.success) {
      setSuccess(result.success)
      setLoading(false)
      form.reset()
      onSuccess?.()
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-4'
      >
        <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950'>
          <div className='flex items-start gap-3'>
            <Mail className='mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-500' />
            <div className='flex-1 space-y-2'>
              <p className='text-sm font-medium text-amber-900 dark:text-amber-100'>
                Se enviará un email de restablecimiento
              </p>
              <p className='text-sm text-amber-700 dark:text-amber-300'>
                Recibirás un correo electrónico con un enlace para restablecer tu contraseña.
                El enlace expirará en 1 hora.
              </p>
              <p className='text-sm text-amber-700 dark:text-amber-300'>
                Tu email: <span className='font-medium'>{session?.user?.email}</span>
              </p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name='confirm'
          render={({ field }) => (
            <FormItem>
              <div className='flex items-center gap-2'>
                <FormControl>
                  <input
                    type='checkbox'
                    checked={field.value}
                    onChange={field.onChange}
                    className='h-4 w-4 rounded border-gray-300'
                  />
                </FormControl>
                <label className='text-sm'>
                  Confirmo que quiero recibir un email para restablecer mi contraseña
                </label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={loading || !form.watch('confirm')} type='submit'>
          {loading ? 'Enviando email...' : 'Enviar email de restablecimiento'}
        </Button>

        <FormError message={error} />
        <FormSuccess message={success} />
      </form>
    </Form>
  )
}
