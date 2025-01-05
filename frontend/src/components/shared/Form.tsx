// src/components/shared/Form.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// Label
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({ className, children, ...props }) => (
  <label className={labelVariants({ className })} {...props}>
    {children}
  </label>
);

// Input
const inputVariants = cva(
  "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="space-y-1">
      <input
        className={inputVariants({ className })}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
);

Input.displayName = "Input";

// Textarea
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, ...props }, ref) => (
    <div className="space-y-1">
      <select
        className={`flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
);

Select.displayName = "Select";

// Checkbox
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          className={`h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600 ${className}`}
          ref={ref}
          {...props}
        />
        <label className="text-sm text-gray-700">{label}</label>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
);

Checkbox.displayName = "Checkbox";

// Radio Group
interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  error,
  className,
}) => (
  <div className={`space-y-2 ${className}`}>
    {options.map((option) => (
      <div key={option.value} className="flex items-center space-x-2">
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-600"
        />
        <label className="text-sm text-gray-700">{option.label}</label>
      </div>
    ))}
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

// Form Field
interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  description?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  children,
  required,
  description,
}) => (
  <div className="space-y-2">
    <div>
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </div>
    {children}
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

// Form Container
interface FormContainerProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  onSubmit,
  children,
  className,
}) => (
  <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
    {children}
  </form>
);

// Form Section
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
}) => (
  <div className={`space-y-4 ${className}`}>
    {title && (
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
    )}
    <div className="space-y-4">
      {children}
    </div>
  </div>
);