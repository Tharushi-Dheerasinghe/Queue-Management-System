export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  theme,
  className = "",
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300";

  const primaryStyle = theme?.button || "bg-blue-600 text-white hover:bg-blue-700";
  const secondaryStyle = theme
    ? `border ${theme.border} bg-white ${theme.text} hover:bg-slate-50 shadow-sm`
    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm";
  const ghostStyle = theme
    ? `bg-transparent ${theme.text} hover:bg-slate-100`
    : "bg-transparent text-slate-700 hover:bg-slate-100";

  const styles = {
    primary: `${primaryStyle} shadow-sm`,
    secondary: secondaryStyle,
    ghost: ghostStyle,
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}