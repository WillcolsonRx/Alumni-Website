import type { DatabaseSync } from "node:sqlite";

export function openApplications(): DatabaseSync;
export function submitApplication(input: { name: string; email: string; programme: string; year: number }): string | null;
export function applicationStatus(reference: string): "pending" | "verified" | "declined" | undefined;
