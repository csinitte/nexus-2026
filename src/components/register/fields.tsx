'use client';

import type { ChangeEvent, ReactNode } from 'react';

const describedBy = (id: string, hint?: ReactNode, error?: string) =>
  [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="field-error" id={`${id}-error`}>
      {message}
    </p>
  );
}

type BaseProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  wide?: boolean;
};

export function TextField({
  id,
  label,
  error,
  hint,
  optional,
  wide,
  value,
  onChange,
  type = 'text',
  autoComplete,
  inputMode,
  maxLength,
  placeholder,
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel';
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric';
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div className={`field${wide ? ' wide' : ''}${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {optional && <span className="optional"> (optional)</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required={optional ? undefined : true}
      />
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <FieldError id={id} message={error} />
    </div>
  );
}

export function TextArea({
  id,
  label,
  error,
  hint,
  value,
  onChange,
  maxLength,
  rows = 5,
}: BaseProps & { value: string; onChange: (value: string) => void; maxLength: number; rows?: number }) {
  return (
    <div className={`field wide${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint ?? true, error)}
      />
      <p className="field-hint" id={`${id}-hint`}>
        {hint && <span>{hint} </span>}
        <span className="counter">
          {value.length}/{maxLength}
        </span>
      </p>
      <FieldError id={id} message={error} />
    </div>
  );
}

export function SelectField({
  id,
  label,
  error,
  hint,
  wide,
  value,
  onChange,
  placeholder,
  options,
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string; disabled?: boolean }[];
}) {
  return (
    <div className={`field${wide ? ' wide' : ''}${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <FieldError id={id} message={error} />
    </div>
  );
}

/** Radio group rendered as large tappable cards (Yes/No and similar choices). */
export function ChoiceGroup<T extends string>({
  id,
  legend,
  error,
  hint,
  value,
  onChange,
  options,
}: {
  id: string;
  legend: string;
  error?: string;
  hint?: ReactNode;
  value: T | '';
  onChange: (value: T) => void;
  options: { value: T; label: string; detail?: string; disabled?: boolean }[];
}) {
  return (
    <fieldset
      className={`choice-group${error ? ' has-error' : ''}`}
      id={id}
      tabIndex={-1}
      aria-describedby={describedBy(id, hint, error)}
      aria-invalid={error ? true : undefined}
    >
      <legend>{legend}</legend>
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <div className="choices">
        {options.map((o) => (
          <label key={o.value} className={`choice${value === o.value ? ' is-selected' : ''}${o.disabled ? ' is-disabled' : ''}`}>
            <input
              type="radio"
              name={id}
              value={o.value}
              checked={value === o.value}
              disabled={o.disabled}
              onChange={() => onChange(o.value)}
            />
            <span>
              <strong>{o.label}</strong>
              {o.detail && <small>{o.detail}</small>}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={id} message={error} />
    </fieldset>
  );
}

/** Multi-select checklist (team members, accommodation names). */
export function CheckList({
  id,
  legend,
  error,
  hint,
  items,
  selected,
  onToggle,
  limit,
}: {
  id: string;
  legend: string;
  error?: string;
  hint?: ReactNode;
  items: { key: string; label: string; detail?: string }[];
  selected: string[];
  onToggle: (key: string) => void;
  limit?: number;
}) {
  const atLimit = limit !== undefined && selected.length >= limit;
  return (
    <fieldset
      className={`choice-group${error ? ' has-error' : ''}`}
      id={id}
      tabIndex={-1}
      aria-describedby={describedBy(id, hint, error)}
      aria-invalid={error ? true : undefined}
    >
      <legend>{legend}</legend>
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <div className="choices">
        {items.map((item) => {
          const checked = selected.includes(item.key);
          const disabled = !checked && atLimit;
          return (
            <label key={item.key} className={`choice check${checked ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}>
              <input type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggle(item.key)} />
              <span>
                <strong>{item.label}</strong>
                {item.detail && <small>{item.detail}</small>}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={id} message={error} />
    </fieldset>
  );
}
