"use client";
import { Button } from "./DemoComponents";

interface Props {
  title: string;
  subtitle?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  subtitle,
  confirmLabel = "Yes",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-[var(--app-background)] rounded-xl p-6 w-80 shadow-lg animate-fade-in">
        <h3 className="font-semibold text-lg mb-2 text-center text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm mb-6 text-center text-gray-300">{subtitle}</p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            No
          </Button>
          <Button size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
