import type { PropsWithChildren } from 'react'

interface Props {
    className?: string;
    marketing?: boolean;
}

const Container = ({ children, className, marketing = false }: PropsWithChildren<Props>) => {
    return (
        <div className={`${marketing ? "site-frame" : "px-2 w-full max-w-7xl mx-auto"} ${className ?? ""}`}>{children}</div>
    )
}

export default Container
