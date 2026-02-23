interface SelectOption {
  value: string | number
  label: string
}

interface SelectInputProps {
  label?: string
  name: string
  value: string | number
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

export default function SelectInput({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  error,
  required = false,
  disabled = false,
}: SelectInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={name} className="block text-sm font-sans font-medium text-white/70">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`
          w-full bg-white/5 border rounded-xl px-4 py-2.5
          text-white font-sans appearance-none
          focus:outline-none focus:ring-2 transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${
            error
              ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50'
              : 'border-white/10 focus:ring-entel-orange/50 focus:border-entel-orange/50'
          }
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: '2.5rem',
        }}
      >
        {placeholder && (
          <option value="" className="bg-[#1a1a24] text-white/50">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#1a1a24] text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-400 font-sans mt-1">{error}</p>
      )}
    </div>
  )
}
