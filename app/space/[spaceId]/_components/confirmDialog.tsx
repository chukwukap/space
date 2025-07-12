"use client";
import { Button } from "@/components/ui/button";

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
    <div className="z-50 flex items-center justify-center ">
      <div className=" bg-gray-700 rounded-xl p-6 w-80 shadow-lg animate-fade-in">
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
