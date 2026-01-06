export default function TwoFactorPolicy({ email }: { email: string }) {
  return (
    <div className='flex w-full flex-col items-center justify-center gap-3 text-center'>
      <p>
        Al habilitar la autenticación de dos factores (2FA), se añadirá una capa
        adicional de seguridad a tu cuenta.
      </p>
      <p>
        Asegúrate de tener acceso al correo electrónico{' '}
        <span className='font-medium'>{email}</span> para completar el proceso.
      </p>
    </div>
  )
}
