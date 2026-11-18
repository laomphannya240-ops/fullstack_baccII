export function FormField({ label, name, error, hint, required, children }) {
    return (
        <label className="block" htmlFor={name}>
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </span>
            {children}
            {hint && !error && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
            {error && <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span>}
        </label>
    );
}

export function TextField({ label, error, ...props }) {
    return (
        <FormField label={label} error={error} name={props.name} required={props.required}>
            <input {...props} className={`input-field ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} />
        </FormField>
    );
}

export function TextAreaField({ label, error, rows = 4, ...props }) {
    return (
        <FormField label={label} error={error} name={props.name} required={props.required}>
            <textarea {...props} rows={rows} className={`input-field resize-y ${error ? 'border-red-500' : ''}`} />
        </FormField>
    );
}

export function SelectField({ label, error, options = [], placeholder = 'Select an option', ...props }) {
    return (
        <FormField label={label} error={error} name={props.name} required={props.required}>
            <select {...props} className={`input-field ${error ? 'border-red-500' : ''}`}>
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </FormField>
    );
}

export function CheckboxField({ label, description, ...props }) {
    return (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 dark:border-slate-800 dark:hover:border-brand-700">
            <input {...props} type="checkbox" className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            <span>
                <span className="block text-sm font-medium">{label}</span>
                {description && <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span>}
            </span>
        </label>
    );
}
