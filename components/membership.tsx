"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { apply, checkStatus } from "@/app/membership-actions";
import { Button } from "@/components/ui/button";

export function Membership() {
  const [application, submit, submitting] = useActionState(apply, { message: "" });
  const [status, lookup, checking] = useActionState(checkStatus, { message: "" });

  return (
    <section id="membership" className="membership" aria-labelledby="membership-title">
      <div className="shell membership-grid">
        <div>
          <h2 id="membership-title">Join your alumni network.</h2>
          <p>Send your graduation details for review. You can track your application with the private reference you receive after submitting.</p>
          <form action={lookup} className="status-form">
            <label htmlFor="reference">Already applied?</label>
            <div>
              <input id="reference" name="reference" placeholder="Application reference" required minLength={32} maxLength={32} spellCheck={false} />
              <Button variant="outline" disabled={checking}>{checking ? "Checking…" : "Check status"}</Button>
            </div>
            <p role="status">{status.message}</p>
          </form>
        </div>
        <form action={submit} className="application-form">
          <h3>Alumni application</h3>
          <div className="form-fields">
            <label>Full name<input name="name" autoComplete="name" minLength={2} maxLength={120} required /></label>
            <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
            <label>Degree and specialisation<input name="programme" minLength={2} maxLength={120} required /></label>
            <label>Graduation year<input name="year" type="number" min={2008} required /></label>
          </div>
          <label className="consent"><input type="checkbox" name="consent" required /> I agree to share these details with the alumni association to review my application.</label>
          <Button className="header-join" disabled={submitting}>{submitting ? "Submitting…" : "Submit for verification"} <ArrowRight aria-hidden="true" /></Button>
          <div className="form-feedback" role="status">
            {application.message && <p>{application.message}</p>}
            {application.reference && <code>{application.reference}</code>}
          </div>
        </form>
      </div>
    </section>
  );
}
