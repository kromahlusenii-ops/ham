import { Check } from "lucide-react";

type FeatureItemProps = {
  feature: string;
};

export default function FeatureItem({ feature }: FeatureItemProps) {
  return (
    <li className="flex items-start gap-2.5">
      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
      <span className="text-sm text-carbon">{feature}</span>
    </li>
  );
}
