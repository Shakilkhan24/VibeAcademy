import { clsx, type ClassValue } from "clsx";

/** Join class names. Tailwind conflicts are avoided by convention (one owner per property). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
