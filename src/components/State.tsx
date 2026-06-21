import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

interface StateProps {
  variant?: "loading" | "empty" | "error" | "info";
  title?: string;
  children?: ReactNode;
}

const VARIANT_ICON: Record<NonNullable<StateProps["variant"]>, IconName> = {
  loading: "spinner",
  empty: "empty",
  error: "warn",
  info: "info",
};

export function State({ variant = "info", title, children }: StateProps) {
  const icon = VARIANT_ICON[variant];
  const isError = variant === "error";
  return (
    <div className={isError ? "state is-error" : "state"} role="status">
      <span className={variant === "loading" ? "state-icon spin" : "state-icon"}>
        <Icon name={icon} size={28} />
      </span>
      {title && <div className="state-title">{title}</div>}
      {children && <div>{children}</div>}
    </div>
  );
}
