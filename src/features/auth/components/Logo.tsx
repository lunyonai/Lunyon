const MARK_SRC = "/brand/lunyon-mark.png";

const sizeClasses = {
  small: {
    icon: "h-7 w-auto",
    text: "text-[1.125rem]",
  },
  medium: {
    icon: "h-8 w-auto md:h-9",
    text: "text-[1.2rem] md:text-[1.35rem]",
  },
  large: {
    icon: "h-9 w-auto",
    text: "text-[1.45rem]",
  },
} as const;

type LogoSize = keyof typeof sizeClasses;

type LogoProps = {
  size?: LogoSize;
  className?: string;
};

export default function Logo({ size = "medium", className = "" }: LogoProps) {
  const scale = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`.trim()}
      aria-label="Lunyon"
    >
      <img
        src={MARK_SRC}
        alt=""
        className={`${scale.icon} object-contain object-left`}
      />
      <span
        className={`${scale.text} font-semibold leading-none tracking-tight text-[var(--lunyo-text)]`}
        aria-hidden="true"
      >
        Lunyon
      </span>
    </span>
  );
}
