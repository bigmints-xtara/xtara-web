"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Container from "@/components/Container";
import MarketingLayout from "@/components/MarketingLayout";
import { useState } from "react";

const DeleteAccountPage = () => {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Create the email content
      const subject = "Account Deletion Request - Xtara";
      const body = `Hello Xtara Team,

I would like to request the deletion of my account and associated personal data.

Email Address: ${email}
Reason for Deletion: ${reason}

Please process my account deletion request as per your privacy policy.

Thank you.

---
This request was submitted through the Xtara website account deletion form.`;

      // Open default email client with pre-filled content
      const mailtoLink = `mailto:xtara.connect@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, "_blank");

      setIsSubmitted(true);
    } catch {
      setError("An error occurred. Please try again or contact us directly at xtara.connect@gmail.com");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MarketingLayout>
      <Container marketing>
        <div className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Request Account Deletion
          </h1>
          <p className="text-lg text-gray-600">
            We&apos;re sorry to see you go. Please fill out the form below to request the deletion of your account and personal data.
          </p>
        </div>

        {!isSubmitted ? (
          <div className="bg-white rounded-lg  p-8 border border-gray-200">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                What happens when you request account deletion?
              </h2>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-sky-500 mr-2">•</span>
                  We&apos;ll process your request within 30 days
                </li>
                <li className="flex items-start">
                  <span className="text-sky-500 mr-2">•</span>
                  All your personal data will be permanently deleted
                </li>
                <li className="flex items-start">
                  <span className="text-sky-500 mr-2">•</span>
                  You&apos;ll receive a confirmation email once the deletion is complete
                </li>
                <li className="flex items-start">
                  <span className="text-sky-500 mr-2">•</span>
                  This action cannot be undone
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                  placeholder="Enter the email address associated with your account"
 />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Deletion (Optional)
                </label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full"
                  placeholder="Please let us know why you're leaving. This helps us improve our service."
 />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Important:</strong> By submitting this request, you acknowledge that:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Your account and all associated data will be permanently deleted</li>
                  <li>• This action cannot be undone</li>
                  <li>• You may lose access to any saved career paths or recommendations</li>
                  <li>• We may retain certain information as required by law</li>
                </ul>
              </div>

              <Button variant="destructive"
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full"
              >
                {isSubmitting ? "Processing..." : "Request Account Deletion"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Having trouble? Contact us directly at{" "}
                <a 
                  href="mailto:xtara.connect@gmail.com" 
                  className="text-sky-500 hover:underline"
                >
                  xtara.connect@gmail.com
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-green-800 mb-2">
              Request Submitted Successfully!
            </h2>
            <p className="text-green-700 mb-4">
              Your account deletion request has been submitted. We&apos;ll process your request within 30 days and send you a confirmation email.
            </p>
            <p className="text-sm text-green-600">
              If you don&apos;t receive a confirmation email, please check your spam folder or contact us at{" "}
              <a 
                href="mailto:xtara.connect@gmail.com" 
                className="underline hover:no-underline"
              >
                xtara.connect@gmail.com
              </a>
            </p>
            <Button variant="outline"
              onClick={() => {
                setIsSubmitted(false);
                setEmail("");
                setReason("");
              }}
              className="mt-6"
            >
              Submit Another Request
            </Button>
          </div>
        )}

        <div className="mt-8 text-center">
          <a 
            href="/privacy-policy" 
            className="text-sky-500 hover:underline"
          >
            ← Back to Privacy Policy
          </a>
        </div>
        </div>
      </Container>
    </MarketingLayout>
  );
};

export default DeleteAccountPage; 
