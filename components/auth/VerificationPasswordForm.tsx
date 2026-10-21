'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormError } from '@/components/ui/form-error'
import { NewPasswordSchema } from '@/schemas/auth-schemas'

type VerificationPasswordValues = z.infer<typeof NewPasswordSchema>

// The password of a new account is chosen when the email link is opened.
export default function VerificationPasswordForm({
  isPending,
  onSubmit
}: {
  isPending: boolean
  onSubmit: (password: string) => void
}) {
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const form = useForm<VerificationPasswordValues>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: { password: '' }
  })

  const submit = ({ password }: VerificationPasswordValues) => {
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setError('')
    onSubmit(password)
  }

  return (
    <Form {...form}>
      <form
        className='flex w-full flex-col gap-6'
        onSubmit={form.handleSubmit(submit)}
      >
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type='password'
                  placeholder='******'
                  className='w-full bg-background'
                  autoComplete='new-password'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex w-full flex-col gap-2'>
          <Label htmlFor='verification-confirm-password'>
            Confirmar contraseña
          </Label>
          <Input
            id='verification-confirm-password'
            type='password'
            placeholder='******'
            className='w-full bg-background'
            autoComplete='new-password'
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button className='w-full' type='submit' disabled={isPending}>
          Activar cuenta
        </Button>
        <FormError message={error} className='w-full' />
      </form>
    </Form>
  )
}
