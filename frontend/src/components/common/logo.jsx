import { cn } from '@/lib/utils'

export const Logo = ({ className, uniColor }) => {
    return (
        <img
            src="/reactify-logo.png"
            alt="Reactify"
            width={120}
            height={30}
            className={cn('h-8 w-auto', className)}
        />
    )
}

export const LogoIcon = ({ className, uniColor }) => {
    return (
        <img
            src="/reactify-logo.png"
            alt="Reactify"
            width={30}
            height={30}
            className={cn('size-8', className)}
        />
    )
}

export const LogoStroke = ({ className }) => {
    return (
        <img
            src="/reactify-logo.png"
            alt="Reactify"
            width={40}
            height={40}
            className={cn('size-10', className)}
        />
    )
}
