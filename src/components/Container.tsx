import type { PropsWithChildren } from 'react'
import marketingStyles from './MarketingLayout.module.css'

interface Props {
    className?: string;
    marketing?: boolean;
}

const Container = ({ children, className, marketing = false }: PropsWithChildren<Props>) => {
    return (
        <div className={`${marketing ? marketingStyles.container : "px-2 w-full max-w-7xl mx-auto"} ${className ?? ""}`}>{children}</div>
    )
}

export default Container
