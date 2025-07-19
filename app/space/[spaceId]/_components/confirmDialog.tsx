"use client";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  subtitle?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  title,
  subtitle,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  return (
    <div className="z-50 flex items-center justify-center ">
      <div className="bg-card rounded-xl p-6 w-80 shadow-lg text-foreground">
        <h3 className="font-semibold text-lg mb-2 text-center">{title}</h3>
        {subtitle && (
          <p className="text-sm mb-6 text-center text-muted-foreground">
            {subtitle}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
