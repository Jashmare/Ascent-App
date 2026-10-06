import { ChevronDown } from 'lucide-react';
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from './cx';
import styles from './Field.module.css';

interface FieldFrameProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Hopeful content (dreams, why it matters) is written in the serif. */
  serif?: boolean;
  /** Keep the label for assistive tech but don't show it. */
  hideLabel?: boolean;
}

function useFieldIds(id?: string) {
  const generated = useId();
  const fieldId = id ?? generated;
  return { fieldId, hintId: `${fieldId}-hint`, errorId: `${fieldId}-error` };
}

function describedBy(hint: ReactNode, error: string | undefined, hintId: string, errorId: string) {
  return [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
}

function Frame({
  fieldId,
  hintId,
  errorId,
  label,
  hint,
  error,
  hideLabel,
  children,
}: FieldFrameProps & { fieldId: string; hintId: string; errorId: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={cx(styles.label, hideLabel && 'visually-hidden')}>
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = FieldFrameProps &
  InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> };

export function TextField({
  label,
  hint,
  error,
  serif,
  hideLabel,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const { fieldId, hintId, errorId } = useFieldIds(id);
  return (
    <Frame {...{ fieldId, hintId, errorId, label, hint, error, hideLabel }}>
      <input
        id={fieldId}
        className={cx(styles.control, serif && styles.serif, className)}
        aria-describedby={describedBy(hint, error, hintId, errorId)}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
    </Frame>
  );
}

type TextAreaProps = FieldFrameProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> };

export function TextArea({
  label,
  hint,
  error,
  serif,
  hideLabel,
  id,
  className,
  rows = 3,
  ...rest
}: TextAreaProps) {
  const { fieldId, hintId, errorId } = useFieldIds(id);
  return (
    <Frame {...{ fieldId, hintId, errorId, label, hint, error, hideLabel }}>
      <textarea
        id={fieldId}
        rows={rows}
        className={cx(styles.control, styles.textarea, serif && styles.serif, className)}
        aria-describedby={describedBy(hint, error, hintId, errorId)}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
    </Frame>
  );
}

type SelectFieldProps = FieldFrameProps &
  SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> };

export function SelectField({
  label,
  hint,
  error,
  hideLabel,
  id,
  className,
  children,
  ...rest
}: SelectFieldProps) {
  const { fieldId, hintId, errorId } = useFieldIds(id);
  return (
    <Frame {...{ fieldId, hintId, errorId, label, hint, error, hideLabel }}>
      <div className={styles.selectWrap}>
        <select
          id={fieldId}
          className={cx(styles.control, styles.select, className)}
          aria-describedby={describedBy(hint, error, hintId, errorId)}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className={styles.chevron} aria-hidden="true" />
      </div>
    </Frame>
  );
}

/** Lays fields out in a column with consistent spacing. */
export function FieldStack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}

/** Two fields side by side on wider screens. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
