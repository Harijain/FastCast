import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, decimals = 0, prefix, suffix, duration }: Props) {
  const v = useCountUp(value, duration, decimals);
  const formatted =
    decimals > 0 ? v.toFixed(decimals) : v.toLocaleString();
  return (
    <span className="font-mono tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}