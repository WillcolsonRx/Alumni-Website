"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { FEE_LABEL, FEE_RUPEES, GENDER_OPTIONS } from "@/lib/registration.mjs";
import { Button } from "@/components/ui/button";

const steps = ["Personal", "Academic", "Professional", "Payment"];

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
  const [step, setStep] = useState(0);
  const stepHeading = useRef<HTMLHeadingElement>(null);
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

  function goToStep(next: number) {
    setStep(next);
    requestAnimationFrame(() => stepHeading.current?.focus());
  }

  return (
    <section id="membership" className="membership" aria-labelledby="membership-title">
      <div className="shell membership-grid">
        <div>
          <h2 id="membership-title">Join your alumni network.</h2>
          <p>Membership is {FEE_LABEL}. Use the QR code or bank details to pay, then submit your transaction reference and payment screenshot for staff verification.</p>
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
          const form = event.currentTarget;
          const controls = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
            step === steps.length - 1 ? "[data-step] :is(input, select, textarea)" : `[data-step="${step}"] :is(input, select, textarea)`,
          ));
          const invalid = controls.find((control) => !control.validity.valid);
          if (invalid) {
            const invalidStep = Number(invalid.closest<HTMLElement>("[data-step]")?.dataset.step);
            if (invalidStep === step) invalid.reportValidity();
            else {
              setStep(invalidStep);
              requestAnimationFrame(() => invalid.reportValidity());
            }
            return;
          }
          if (step < steps.length - 1) {
            goToStep(step + 1);
            return;
          }
          const data = new FormData(form);
          startTransition(() => submit(data));
        }} noValidate>
          <h3>Alumni registration</h3>
          {!application.reference && <fieldset disabled={submitting}>
            <ol className="registration-progress" aria-label="Registration progress">
              {steps.map((label, index) => (
                <li key={label} aria-current={index === step ? "step" : undefined} data-complete={index < step}>
                  <span aria-hidden="true">{index + 1}</span>{label}
                </li>
              ))}
            </ol>
            <h4 className="registration-step-title" tabIndex={-1} ref={stepHeading}>{steps[step]} details</h4>
            <input type="hidden" name="amount" value={FEE_RUPEES} />
            <div hidden={step !== 0} data-step="0">
              <div className="form-fields">
              <label>Full name<input name="name" autoComplete="name" minLength={2} maxLength={120} required /></label>
              <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
              <label>Phone number (with country code)<input name="phone" type="tel" autoComplete="tel" maxLength={32} placeholder="+91 98765 43210" required /></label>
              <label>Gender<select name="gender" defaultValue="" required>
                <option value="" disabled>Select an option</option>
                {GENDER_OPTIONS.map((option) => <option key={option}>{option}</option>)}
              </select></label>
              <label>Current city<input name="city" autoComplete="address-level2" maxLength={120} required /></label>
              <label>Current country<input name="country" autoComplete="country-name" maxLength={120} required /></label>
              <label className="form-wide">Recent profile photo<input name="profile_photo" type="file" accept="image/png,image/jpeg" required aria-describedby="profile-photo-help" /><small id="profile-photo-help">PNG or JPEG, up to 2 MB. Visible to authorized staff only.</small></label>
              </div>
            </div>
            <div hidden={step !== 1} data-step="1">
              <div className="form-fields">
              <label>Department at NIPER Raebareli<input name="department" maxLength={120} required /></label>
              <label>Degree and specialisation<input name="programme" minLength={2} maxLength={120} required /></label>
              <label>NIPER enrollment or roll number<input name="enrollment_number" maxLength={80} required /></label>
              <label>Year of admission<input name="admission_year" type="number" min={2008} required /></label>
              <label>Graduation year<input name="year" type="number" min={2008} required /></label>
              <label className="form-wide">Thesis or dissertation title<textarea name="thesis_title" rows={2} maxLength={500} required /></label>
              </div>
            </div>
            <div hidden={step !== 2} data-step="2">
              <div className="form-fields">
              <label>Current employer or organization<input name="employer" autoComplete="organization" maxLength={160} required /><small>Enter “Not currently employed” if applicable.</small></label>
              <label>Current job title or role<input name="job_title" autoComplete="organization-title" maxLength={160} required /><small>Enter your current role or “Not applicable”.</small></label>
              <label>Industry or sector (optional)<input name="industry" maxLength={120} /></label>
              <label>LinkedIn profile URL (optional)<input name="linkedin_url" type="url" maxLength={300} placeholder="https://www.linkedin.com/in/your-profile" /></label>
              </div>
            </div>
            <div hidden={step !== 3} data-step="3">
              <div className="form-fields">
              <p className="form-fee form-wide">Registration fee <strong>{FEE_LABEL}</strong></p>
              <label>Transaction reference (UTR)<input name="transaction" minLength={6} maxLength={80} required /></label>
              <label className="form-wide">Payment screenshot<input name="screenshot" type="file" accept="image/png,image/jpeg" required aria-describedby="screenshot-help" /><small id="screenshot-help">PNG or JPEG, up to 5 MB. Show the amount and transaction reference.</small></label>
              </div>
            <label className="consent"><input type="checkbox" name="consent" required /> I agree to share these details, my profile photo, and the payment screenshot with the alumni association to maintain alumni records and review my registration and payment.</label>
            </div>
            <div className="registration-actions">
              {step > 0 && <Button type="button" variant="outline" onClick={() => goToStep(step - 1)}>Back</Button>}
              <Button type="submit" className="header-join">
                {submitting ? "Submitting…" : step === steps.length - 1 ? "Submit for verification" : "Continue"}
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </fieldset>}
          <div className="form-feedback" role="status">
            {application.message && <p>{application.message}</p>}
            {application.reference && <p>Save your private reference to check your status. <code>{application.reference}</code></p>}
          </div>
        </form>
      </div>
    </section>
  );
}
