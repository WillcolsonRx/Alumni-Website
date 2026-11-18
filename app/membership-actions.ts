"use server";

import { applicationStatus, submitApplication } from "@/lib/applications.mjs";

type Result = { message: string; reference?: string };

function value(data: FormData, name: string) {
  const field = data.get(name);
  return typeof field === "string" ? field.trim() : "";
}

export async function apply(_previous: Result, data: FormData): Promise<Result> {
  const name = value(data, "name");
  const email = value(data, "email").toLowerCase();
  const programme = value(data, "programme");
  const year = Number(value(data, "year"));
  if (name.length < 2 || name.length > 120 || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || programme.length < 2 ||
      programme.length > 120 || !Number.isInteger(year) || year < 2008 ||
      year > new Date().getFullYear() || value(data, "consent") !== "on") {
    return { message: "Check your name, email, programme, graduation year and consent." };
  }
  try {
    const reference = submitApplication({ name, email, programme, year });
    if (!reference) {
      return { message: "If you already submitted an application, use your reference below. If you lost it, contact the association." };
    }
    return { message: "Application saved for review. Keep this private reference to check your status.", reference };
  } catch {
    return { message: "The application could not be saved. Please try again later." };
  }
}

export async function checkStatus(_previous: Result, data: FormData): Promise<Result> {
  const reference = value(data, "reference").toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(reference)) return { message: "Enter the 32-character reference from your application." };
  try {
    const status = applicationStatus(reference);
    const messages = {
      pending: "Your application is awaiting alumni verification.",
      verified: "Your alumni status has been verified.",
      declined: "Your application was declined. Contact the association if you need clarification.",
    };
    return { message: status ? messages[status] : "No application matches that reference." };
  } catch {
    return { message: "Status is temporarily unavailable. Please try again later." };
  }
}
