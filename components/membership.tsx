"use client";

import { startTransition, useActionState, useRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { FEE_RUPEES } from "@/lib/registration.mjs";
import { Button } from "@/components/ui/button";

type Result = { message: string; reference?: string };

async function send(path: string, body: FormData): Promise<Result> {
  try {
    const response = await fetch(path, { method: "POST", body });
    return await response.json();
  } catch {
    return { message: "The registration service is temporarily unavailable. Please try again." };
  }
}

export function Membership() {
  const privateReference = useRef("");
  const [application, submit, submitting] = useActionState(async (_previous: Result, form: FormData) => {
    privateReference.current ||= crypto.randomUUID().replaceAll("-", "");
    form.set("reference", privateReference.current);
    return send("/api/registrations", form);
  }, { message: "" });
  const [status, lookup, checking] = useActionState(
    (_previous: Result, form: FormData) => send("/api/registration-status", form),
    { message: "" },
  );

  return (
    <section id="membership" className="membership" aria-labelledby="membership-title">
      <div className="shell membership-grid">
        <div>
          <h2 id="membership-title">Join your alumni network.</h2>
          <p>Pay exactly ₹6,000 using the payment QR code or the bank details below. Then submit your graduation details, transaction reference, and payment screenshot. Staff will verify the payment against the association’s bank records.</p>
          <a href="/payment-qr.png" className="my-5 inline-flex max-w-full flex-col items-start gap-2 underline">
            <Image src="/payment-qr.png" alt="HDFC payment QR code for NIPER Raebareli Alumni Association" width={410} height={415} className="h-auto w-64 max-w-full rounded-lg" />
            <span>Open payment QR code</span>
          </a>
          <dl className="payment-details">
            <div><dt>Beneficiary</dt><dd>NIPER Raebareli Alumni Association</dd></div>
            <div><dt>Bank</dt><dd>HDFC Bank</dd></div>
            <div><dt>Account number</dt><dd>50100728693241</dd></div>
            <div><dt>IFSC</dt><dd>HDFC0009510</dd></div>
          </dl>
          <form action={lookup} className="status-form">
            <label htmlFor="reference">Check your registration</label>
            <div>
              <input id="reference" name="reference" placeholder="Private reference" required minLength={32} maxLength={32} spellCheck={false} />
              <Button variant="outline" disabled={checking}>{checking ? "Checking…" : "Check status"}</Button>
            </div>
            <p role="status">{status.message}</p>
          </form>
        </div>
        <form className="application-form" method="post" action="/api/registrations" encType="multipart/form-data" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          startTransition(() => submit(form));
        }}>
          <h3>Alumni registration</h3>
          <fieldset disabled={submitting || Boolean(application.reference)}>
            <div className="form-fields">
              <label>Full name<input name="name" autoComplete="name" minLength={2} maxLength={120} required /></label>
              <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
              <label>Degree and specialisation<input name="programme" minLength={2} maxLength={120} required /></label>
              <label>Graduation year<input name="year" type="number" min={2008} required /></label>
              <label>Payment amount (INR)<input name="amount" value={FEE_RUPEES} readOnly /></label>
              <label>Transaction reference (UTR)<input name="transaction" minLength={6} maxLength={80} required /></label>
              <label>Payment screenshot<input name="screenshot" type="file" accept="image/png,image/jpeg" required aria-describedby="screenshot-help" /><small id="screenshot-help">PNG or JPEG, up to 5 MB. Show the amount and transaction reference.</small></label>
            </div>
            <label className="consent"><input type="checkbox" name="consent" required /> I agree to share these details and the screenshot with the alumni association for payment and registration review.</label>
            <Button className="header-join" disabled={submitting || Boolean(application.reference)}>{submitting ? "Submitting…" : "Submit for verification"} <ArrowRight aria-hidden="true" /></Button>
          </fieldset>
          <div className="form-feedback" role="status">
            {application.message && <p>{application.message}</p>}
            {application.reference && <p>Save your private reference to check your status. <code>{application.reference}</code></p>}
          </div>
        </form>
      </div>
    </section>
  );
}
