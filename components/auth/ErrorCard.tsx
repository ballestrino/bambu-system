import Link from 'next/link'
import { Button } from '@/components/ui/button'
import CardWrapper from '@/components/CardWrapper'

export default function ErrorCard() {
  return (
    <CardWrapper title='Algo ha salido mal!'>
      <Link href='/auth/login'>
        <Button variant={'link'}>{`Back to Login`}</Button>
      </Link>
    </CardWrapper>
  )
}
