"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { login } from "@/actions/login"
import CardWrapper from '@/components/CardWrapper'
import { OAuth } from "@/components/auth/OAuth"
import { loginFormSchema } from "@/schemas/auth-schemas"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FormError } from "@/components/ui/form-error"
import { FormSuccess } from "@/components/ui/form-success"
import { Label } from "@/components/ui/label"
import { z } from "zod"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"
import { useSession } from "next-auth/react"

export default function LoginForm() {
  const searchParams = useSearchParams()
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "El email ya esta registrado con otro proveedor"
      : ""

  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const [lastSubmittedData, setLastSubmittedData] = useState<z.infer<typeof loginFormSchema> | null>(null)

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      code: ""
    }
  })
  const { update } = useSession()
  const router = useRouter()

  const onsubmit = async (data: z.infer<typeof loginFormSchema>) => {
    if (JSON.stringify(data) === JSON.stringify(lastSubmittedData)) {
      return
    }

    setError(null)
    setSuccess(null)
    setLastSubmittedData(data)

    setIsPending(true)
    const result = await login(data)
    if (result?.error) {
      setError(result.error)
    }

    if (result?.emailVerification) {
      setSuccess(result.emailVerification)
    }

    if (result?.success) {
      form.reset()
      setSuccess(result.success)
      update()
      router.push(DEFAULT_LOGIN_REDIRECT)
      return
    }

    if (result?.twoFactor) {
      setShowTwoFactor(true)
    }

    setIsPending(false)
  }

  return (
    <CardWrapper title='Iniciar Sesión' subTitle='Bienvenido de vuelta'>
      <Form {...form}>
        <form
          className='flex max-w-[300px] w-full sm:w-[450px] sm:max-w-none flex-col items-center justify-center gap-8 '
          onSubmit={form.handleSubmit(onsubmit)}
        >
          {showTwoFactor && (
            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <Label>Código de verificación</Label>
                  <FormControl>
                    <Input
                      {...field}
                      className='w-full bg-white'
                      type='number'
                      placeholder='123456'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {!showTwoFactor && (
            <div className='flex w-full flex-col gap-6'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <Label>Correo electrónico</Label>
                    <FormControl>
                      <Input
                        {...field}
                        className='w-full bg-white'
                        type='email'
                        placeholder='nombre@ejemplo.com'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex w-full flex-col'>
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <Label>Contraseña</Label>
                      <FormControl>
                        <Input
                          {...field}
                          className='w-full bg-white'
                          type='password'
                          placeholder='******'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Link href={"/auth/reset"}>
                  <Button variant={"link"} size={"sm"} type='button'>
                    ¿Olvidaste tu contraseña?
                  </Button>
                </Link>
              </div>
            </div>
          )}
          <div className='flex w-full flex-col items-center gap-6'>
            <Button disabled={isPending} className='w-full font-semibold'>
              {isPending
                ? "Iniciando sesión..."
                : showTwoFactor
                  ? "Confirmar"
                  : "Iniciar sesión"}
            </Button>
            <OAuth />
            <div className='flex w-full flex-col gap-2'>
              <FormError message={error || urlError} className='w-full' />
              <FormSuccess message={success} className='w-full' />
            </div>
            <Link href='/auth/register'>
              <Button variant={"link"}>{`Crear una cuenta`}</Button>
            </Link>
          </div>
        </form>
      </Form>
    </CardWrapper>
  )
}
