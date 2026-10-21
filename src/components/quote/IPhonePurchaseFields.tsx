import { FiCheck } from 'react-icons/fi'

export const IPhoneChoices = ({ id, label, options, selected, onChange, error, descriptions, multiple = false, className }: {
  id: string; label: string; options: readonly string[]; selected: string | string[]; onChange: (value: string) => void; error?: string; descriptions?: Record<string, string>; multiple?: boolean; className?: string
}) => <fieldset id={`iphone-${id}`} className={className} tabIndex={-1} aria-invalid={!!error} aria-describedby={error ? `iphone-${id}-error` : undefined}>
  <legend>{label}</legend>
  <div className="quote-answers">{options.map(value => {
    const active = Array.isArray(selected) ? selected.includes(value) : selected === value
    return <button type="button" key={value} className={`quote-answer ${active ? 'selected' : ''}`} role={multiple ? 'checkbox' : undefined} aria-checked={multiple ? active : undefined} aria-pressed={multiple ? undefined : active} onClick={() => onChange(value)} aria-describedby={descriptions?.[value] ? `iphone-${id}-option-${options.indexOf(value)}` : undefined}><span>{value}</span>{descriptions?.[value] && <span className="iphone-payment-amount" id={`iphone-${id}-option-${options.indexOf(value)}`} aria-hidden="true">{descriptions[value]}</span>}<span className={`quote-radio-mark ${multiple ? 'quote-checkbox-mark' : ''}`} aria-hidden="true">{active && <FiCheck />}</span></button>
  })}</div>
  {error && <p className="quote-inline-error" id={`iphone-${id}-error`}>{error}</p>}
</fieldset>

export const IPhoneTextField = ({ id, label, value, onChange, maxLength = 100, error, multiline = false }: {
  id: string; label: string; value: string; onChange: (value: string) => void; maxLength?: number; error?: string; multiline?: boolean
}) => <label className="quote-field" htmlFor={`iphone-${id}`}>{label}
  {multiline ? <textarea id={`iphone-${id}`} value={value} maxLength={maxLength} rows={3} onChange={event => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={error ? `iphone-${id}-error` : undefined} />
    : <input id={`iphone-${id}`} value={value} maxLength={maxLength} autoComplete="off" enterKeyHint="done" onChange={event => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={error ? `iphone-${id}-error` : undefined} />}
  {error && <span className="quote-inline-error" id={`iphone-${id}-error`}>{error}</span>}
</label>
