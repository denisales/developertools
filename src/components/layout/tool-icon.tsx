import * as React from "react";
import {
  Activity,
  AlignLeft,
  BadgeCheck,
  Briefcase,
  Building,
  Building2,
  Calculator,
  Car,
  CheckCircle2,
  Code2,
  CreditCard,
  FileCheck2,
  Fingerprint,
  IdCard,
  KeyRound,
  Landmark,
  MapPin,
  Percent,
  ShieldCheck,
  TrendingUp,
  Truck,
  Type,
  Users,
  Vote,
  Wrench,
  type LucideProps,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Fingerprint,
  Building2,
  TrendingUp,
  IdCard,
  Car,
  Briefcase,
  Vote,
  CreditCard,
  Landmark,
  Users,
  Building,
  Truck,
  MapPin,
  KeyRound,
  ShieldCheck,
  BadgeCheck,
  FileCheck2,
  CheckCircle2,
  Percent,
  Calculator,
  Activity,
  Type,
  AlignLeft,
  Code2,
};

export interface ToolIconProps extends LucideProps {
  name: string;
}

export function ToolIcon({ name, ...props }: ToolIconProps) {
  const IconComponent = ICON_MAP[name] ?? Wrench;
  return <IconComponent {...props} />;
}
