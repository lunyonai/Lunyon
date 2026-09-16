const LOGO_SRC = "/brand/lunyo-logo.png";

const sizeClasses = {
  small: "w-[120px]",
  medium: "w-[115px] md:w-[140px]",
  large: "w-[135px]",
} as const;

type LogoSize = keyof typeof sizeClasses;

type LogoProps = {
  size?: LogoSize;
  className?: string;
};

export default function Logo({ size = "medium", className = "" }: LogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="Lunyo"
      className={`h-auto object-contain object-left ${sizeClasses[size]} ${className}`.trim()}
    />
  );
}
