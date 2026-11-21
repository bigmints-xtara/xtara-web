"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useTranslations } from "@/i18n/language-provider";

const ContactForm = () => {
  const { t, messages } = useTranslations();
  const contactEmail = messages.contact.form.contactEmail;
  const responseTime = messages.contact.form.responseTime;
  const subjectOptions = messages.contact.form.subjectOptions;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // For now, we'll use a simple mailto link since we don't have a backend
      // In a real implementation, you'd send this to your backend API
      const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
        `${t("contact.form.mailto.name")}: ${formData.name}\n${t("contact.form.mailto.email")}: ${formData.email}\n\n${t("contact.form.mailto.message")}:\n${formData.message}`
      )}`;
      
      window.location.href = mailtoLink;
      setSubmitStatus("success");
      
      // Reset form after successful submission
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white  rounded-2xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {t("contact.form.title")}
        </h2>
        <p className="mt-4 text-lg leading-8 text-gray-600">
          {t("contact.form.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
              {t("contact.form.fields.name.label")}
            </label>
            <div className="mt-2">
              <Input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full"
                placeholder={t("contact.form.fields.name.placeholder")}
 />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              {t("contact.form.fields.email.label")}
            </label>
            <div className="mt-2">
              <Input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full"
                placeholder={t("contact.form.fields.email.placeholder")}
 />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium leading-6 text-gray-900">
            {t("contact.form.fields.subject.label")}
          </label>
          <div className="mt-2">
            <NativeSelect
              name="subject"
              id="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="w-full"
            >
              <option value="">{t("contact.form.fields.subject.placeholder")}</option>
              {subjectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium leading-6 text-gray-900">
            {t("contact.form.fields.message.label")}
          </label>
          <div className="mt-2">
            <Textarea
              name="message"
              id="message"
              rows={6}
              required
              value={formData.message}
              onChange={handleChange}
              className="w-full"
              placeholder={t("contact.form.fields.message.placeholder")}
 />
          </div>
        </div>

        {submitStatus === "success" && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {t("contact.form.status.success")}
                </p>
              </div>
            </div>
          </div>
        )}

        {submitStatus === "error" && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {t("contact.form.status.error")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("contact.form.actions.sending") : t("contact.form.actions.submit")}
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("contact.form.otherWays.title")}</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>📧 {t("contact.form.otherWays.emailLabel")}: <a href={`mailto:${contactEmail}`} className="text-foreground hover:underline">{contactEmail}</a></p>
            <p>⏰ {t("contact.form.otherWays.responseTimeLabel")}: {responseTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm; 
