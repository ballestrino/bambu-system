"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, startTransition } from "react"
import { register as registerAction } from "@/actions/register"
import { OAuth } from "@/components/auth/OAuth"
import CardWrapper from '@/components/CardWrapper'
import { registerFormSchema } from "@/schemas/auth-schemas"
import { FormError } from "@/components/ui/form-error"
import { FormSuccess } from "@/components/ui/form-success"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterForm() {
  const form = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema)
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState<string>("")

  const onsumbit = (data: z.infer<typeof registerFormSchema>) => {
    setError(null)
    setSuccess(null)

    if (data.password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsPending(true)

    startTransition(() => {
      registerAction(data).then(data => {
        if (data) {
          if (data.error) setError(data.error)
          if (data.success) setSuccess(data.success)
        }
        setIsPending(false)
      })
    })
  }

  return (
    <CardWrapper title='Registrarme' subTitle='Crea una cuenta'>
      <Form {...form}>
        <form
          className='flex max-w-[300px] w-full sm:w-[450px] sm:max-w-none flex-col items-center justify-center gap-8'
          onSubmit={form.handleSubmit(onsumbit)}
        >
          <div className='flex w-full flex-col gap-6'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      className='w-full bg-background'
                      placeholder='Juan Perez'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      className='w-full bg-background'
                      placeholder='nombre@ejemplo.com'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      className='w-full bg-background'
                      placeholder='******'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex w-full flex-col gap-2'>
              <Label>Confirmar contraseña</Label>
              <Input
                type='password'
                className='w-full bg-background'
                placeholder='******'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <div className='flex w-full flex-col items-center gap-6'>
            <Button className='w-full' disabled={isPending}>
              Registrarme
            </Button>
            <FormError message={error} className='w-full' />
            <FormSuccess message={success} className='w-full' />
            <OAuth register />
            <Button variant='link' asChild>
              <Link href='/auth/login'>
                Ya tengo una cuenta
              </Link>
            </Button>
          </div>
        </form>
      </Form>
    </CardWrapper>
  )
}
