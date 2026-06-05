import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseUTCDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  if (!dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}
