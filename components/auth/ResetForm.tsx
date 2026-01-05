"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { startTransition, useState } from "react"
import { ResetSchema } from "@/schemas/auth-schemas"
import { reset } from "@/actions/reset"
import CardWrapper from '@/components/CardWrapper'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"
import { z } from "zod"
import { FormError } from "@/components/ui/form-error"
import { FormSuccess } from "@/components/ui/form-success"
import { Input } from "../ui/input"

export default function ResetForm() {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, setIsPending] = useState(false)

  const form = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema)
  })

  const onsubmit = (data: z.infer<typeof ResetSchema>) => {
    setError("")
    setSuccess("")

    setIsPending(true)

    startTransition(() => {
      reset(data).then(data => {
        if (data) {
          if (data.error) setError(data.error)
          if (data.success) setSuccess(data.success)
        }
        setIsPending(false)
      })
    })
  }

  return (
    <CardWrapper title='Cambiar Contraseña' subTitle='Olvidaste tu contraseña?'>
      <Form {...form}>
        <form
          className='flex max-w-[300px] w-full sm:w-[450px] sm:max-w-none flex-col items-center justify-center gap-8'
          onSubmit={form.handleSubmit(onsubmit)}
        >
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full flex-col items-center'>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    className='w-full bg-white'
                    placeholder='nombre@ejemplo.com'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit' className='w-full' disabled={isPending}>
            Enviar Email
          </Button>
          <FormError message={error} />
          <FormSuccess message={success} />
        </form>

        <Button variant='link' asChild>
          <Link href='/auth/login'>Volver a Inicio de Sesión</Link>
        </Button>
      </Form>
    </CardWrapper>
  )
}
