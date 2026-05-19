export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={className ?? "text-sm font-medium text-slate-700"}
      {...props}
    />
  );
}
