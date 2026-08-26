export const SHELL = "mx-auto w-full max-w-[1200px] px-4 sm:px-8 lg:px-12";

export function Logo({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const s =
    size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : size === "xl" ? "h-20 w-20 sm:h-24 sm:w-24" : "h-12 w-12";
  return (
    <img src="/logo.png" alt="BoatPro" className={`${s} object-contain ${className}`} />
  );
}
