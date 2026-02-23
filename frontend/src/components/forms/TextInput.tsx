import { type InputHTMLAttributes } from 'react'

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'onChange'> {
  label?: string
  name: string
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'time'
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

export default function TextInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  required = false,
  disabled = false,
  ...rest
}: TextInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={name} className="block text-sm font-sans font-medium text-white/70">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          w-full bg-white/5 border rounded-xl px-4 py-2.5
          text-white placeholder-white/30 font-sans
          focus:outline-none focus:ring-2 transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${
            error
              ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50'
              : 'border-white/10 focus:ring-entel-orange/50 focus:border-entel-orange/50'
          }
        `}
        {...rest}
      />
      {error && (
        <p className="text-xs text-red-400 font-sans mt-1">{error}</p>
      )}
    </div>
  )
}
