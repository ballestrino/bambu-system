"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { startTransition, useState } from "react"
import { NewPasswordSchema } from "@/schemas/auth-schemas"
import { useSearchParams } from "next/navigation"
import { newPassword } from "@/actions/new-password"
import ErrorSuccessCard from "@/components/ui/error-success-card"
import CardWrapper from '@/components/CardWrapper'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { Label } from "../ui/label"

export default function NewPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, setIsPending] = useState(false)

  const [confirmPassword, setConfirmPassword] = useState("")

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema)
  })

  const onsubmit = (data: z.infer<typeof NewPasswordSchema>) => {
    setError("")
    setSuccess("")

    if (data.password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsPending(false)
      return
    }

    setIsPending(true)

    startTransition(() => {
      newPassword(data, token).then(data => {
        if (data) {
          if (data.error) setError(data.error)
          if (data.success) setSuccess(data.success)
        }
        setIsPending(false)
      })
    })
  }

  return (
    <CardWrapper
      title='Nueva Contraseña'
      subTitle='Escribe tu nueva contraseña'
    >
      <Form {...form}>
        <form
          className='max-w-[300px] w-full sm:w-[450px] sm:max-w-none flex flex-col items-center justify-center gap-8'
          onSubmit={form.handleSubmit(onsubmit)}
        >
          <div className='flex w-full flex-col gap-6'>
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Nueva Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='******'
                      className='w-full bg-white'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex w-full flex-col gap-2'>
              <Label>Confirmar Contraseña</Label>
              <Input
                type='password'
                value={confirmPassword}
                placeholder='******'
                onChange={e => setConfirmPassword(e.target.value)}
                className='w-full bg-white'
              />
            </div>
          </div>
          <div className='flex w-full flex-col gap-2'>
            <Button className='w-full' type='submit' disabled={isPending}>
              Cambiar contraseña
            </Button>
            <ErrorSuccessCard success={success} error={error} />
            <Button variant={"link"}>
              <Link href='/auth/login'>{`Volver a Inicio de Sesión`}</Link>
            </Button>
          </div>
        </form>
      </Form>
    </CardWrapper>
  )
}
