import { Metadata } from "next"

export const authPagesMetadata = {
  login: {
    title: "Iniciar Sesión | Pronto Pollo",
    description:
      "Accedé a tu cuenta de Pronto Pollo para realizar pedidos, ver tu historial de compras y gestionar tus direcciones de envío. Ingresá de forma rápida y segura.",
    keywords:
      "iniciar sesión, login, acceder cuenta, ingresar, mi cuenta, área cliente"
  } as Metadata,

  register: {
    title: "Crear Cuenta | Registrarse en Pronto Pollo",
    description:
      "Creá tu cuenta en Pronto Pollo y disfrutá de una experiencia de compra personalizada. Registrate gratis y empezá a comprar productos avícolas frescos con entrega a domicilio.",
    keywords:
      "crear cuenta, registrarse, registro, nueva cuenta, sign up, registración"
  } as Metadata,

  reset: {
    title: "Recuperar Contraseña | Pronto Pollo",
    description:
      "¿Olvidaste tu contraseña? Recuperá el acceso a tu cuenta de forma segura. Te enviaremos un enlace para restablecer tu contraseña por email.",
    keywords:
      "recuperar contraseña, olvidé contraseña, restablecer password, resetear contraseña"
  } as Metadata,

  newPassword: {
    title: "Nueva Contraseña | Pronto Pollo",
    description:
      "Establecé una nueva contraseña para tu cuenta de Pronto Pollo. Creá una contraseña segura para proteger tu información personal.",
    keywords:
      "nueva contraseña, cambiar password, establecer contraseña, actualizar contraseña"
  } as Metadata,

  verification: {
    title: "Verificar Email | Pronto Pollo",
    description:
      "Verificá tu dirección de email para activar tu cuenta en Pronto Pollo. Este paso es necesario para completar tu registro y comenzar a comprar.",
    keywords:
      "verificar email, confirmar correo, activar cuenta, verificación de email"
  } as Metadata,

  error: {
    title: "Error de Autenticación | Pronto Pollo",
    description:
      "Ha ocurrido un error durante el proceso de autenticación. Por favor, intentá nuevamente o contactá con nuestro soporte.",
    keywords: "error login, error autenticación, problema acceso"
  } as Metadata
}
