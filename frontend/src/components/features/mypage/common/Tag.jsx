const variantStyles = {
  default: "bg-gray-100 text-gray-600",
  topic: "bg-violet-100 text-violet-800",
  score: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-100 text-amber-600",
  review: "bg-red-100 text-red-600",
  participant: "bg-white border border-indigo-200 text-indigo-600",
};

export default function Tag({ variant = "default", children }) {
  const variantClass = variantStyles[variant] || variantStyles.default;

  return (
    <span className={`inline-flex items-center py-1 px-2.5 rounded-full text-xs font-bold ${variantClass}`}>
      {children}
    </span>
  );
}
