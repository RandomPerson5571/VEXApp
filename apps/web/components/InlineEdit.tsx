"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
  placeholder?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  maxLength?: number;
  className?: string;
}

export function InlineEdit({
  value,
  onSave,
  onCancel,
  onError,
  placeholder = "Untitled",
  disabled = false,
  allowEmpty = false,
  maxLength,
  className = "",
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isPending, startTransition] = useTransition();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const isSavingRef = useRef(false); // Prevents the double-fire race condition

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    // Guard against simultaneous Blur and Enter events
    if (isSavingRef.current) return;

    const trimmedValue = currentValue.trim();
    const trimmedOriginal = value.trim();

    // If it hasn't changed, or is empty when empty isn't allowed, reset cleanly
    if (trimmedValue === trimmedOriginal || (!allowEmpty && trimmedValue === "")) {
      setIsEditing(false);
      setCurrentValue(value);
      return;
    }

    isSavingRef.current = true;

    startTransition(async () => {
      try {
        await onSave(trimmedValue);
        setIsEditing(false);
      } catch (error) {
        setCurrentValue(value); // Rollback
        if (onError) onError(error);
        else console.error("InlineEdit save failure:", error);
      } finally {
        isSavingRef.current = false;
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
      setCurrentValue(value);
      if (onCancel) onCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={currentValue}
        maxLength={maxLength}
        disabled={isPending}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        aria-label={placeholder}
        className={`w-full bg-slate-900 border border-slate-700 text-slate-100 rounded px-1 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        setCurrentValue(value);
        setIsEditing(true);
      }}
      aria-label={`Edit ${value || placeholder}`}
      className={`w-full text-left bg-transparent border-0 cursor-pointer rounded px-1 transition-colors group/inline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed ${
        value 
          ? "text-slate-100 hover:bg-slate-800/50" 
          : "text-slate-500 italic hover:bg-slate-800/50"
      } ${className}`}
    >
      {value.trim() || placeholder}
    </button>
  );
}