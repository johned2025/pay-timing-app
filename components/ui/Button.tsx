import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const styles: Record<Variant, string> = {
  primary:   'w-full bg-black text-white rounded-lg py-3 font-medium disabled:opacity-50',
  secondary: 'w-full border border-gray-300 text-gray-700 rounded-lg py-3 font-medium disabled:opacity-50',
  ghost:     'w-full text-sm text-gray-500 py-2',
}

export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={`${styles[variant]} ${className}`}
    />
  )
}
