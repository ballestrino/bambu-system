import { cn } from '@/lib/utils'

interface Props {
    children: React.ReactNode
    title?: string
    subTitle?: string
    className?: string
}

export default function CardWrapper({
    children,
    title,
    subTitle,
    className,
}: Props) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-8 rounded-2xl bg-gradient-to-br from-gray-50 to-brand/5 p-10 shadow-xl dark:from-slate-900 dark:to-blue-950',
                className,
            )}
        >
            {title && subTitle && (
                <div className='flex flex-col items-center justify-center gap-2'>
                    <h1 className='text-2xl font-semibold'>{title}</h1>
                    <p className='text-sm font-light'>{subTitle}</p>
                </div>
            )}

            {children}
        </div>
    )
}
