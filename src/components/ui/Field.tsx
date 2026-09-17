import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

function Wrapper({
  label,
  htmlFor,
  error,
  hint,
  children,
  required,
  containerClassName,
}: {
  label?: string
  htmlFor?: string
  error?: string
  hint?: string
  children: ReactNode
  required?: boolean
  containerClassName?: string
}) {
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-neutral-700">
          {label}
          {required && <span className="text-danger-600"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-neutral-400">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-danger-600">{error}</p>}
    </div>
  )
}

const inputBase =
  'w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-1 disabled:bg-neutral-50 disabled:text-neutral-400'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
  containerClassName?: string
}

export function TextInput({ label, error, hint, icon, className, required, containerClassName, id, ...rest }: TextInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <Wrapper label={label} htmlFor={inputId} error={error} hint={hint} required={required} containerClassName={containerClassName}>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">{icon}</span>}
        <input
          id={inputId}
          className={cn(
            inputBase,
            icon && 'pl-9',
            error ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-400' : 'border-neutral-300 focus:border-brand-500 focus:ring-brand-400',
            className,
          )}
          {...rest}
        />
      </div>
    </Wrapper>
  )
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  containerClassName?: string
}

export function SelectInput({ label, error, hint, placeholder, className, required, children, containerClassName, id, ...rest }: SelectInputProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <Wrapper label={label} htmlFor={selectId} error={error} hint={hint} required={required} containerClassName={containerClassName}>
      <select
        id={selectId}
        className={cn(
          inputBase,
          'bg-white',
          error ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-400' : 'border-neutral-300 focus:border-brand-500 focus:ring-brand-400',
          className,
        )}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
    </Wrapper>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function TextArea({ label, error, hint, className, required, id, ...rest }: TextAreaProps) {
  const autoId = useId()
  const textareaId = id ?? autoId
  return (
    <Wrapper label={label} htmlFor={textareaId} error={error} hint={hint} required={required}>
      <textarea
        id={textareaId}
        className={cn(
          inputBase,
          error ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-400' : 'border-neutral-300 focus:border-brand-500 focus:ring-brand-400',
          className,
        )}
        {...rest}
      />
    </Wrapper>
  )
}
