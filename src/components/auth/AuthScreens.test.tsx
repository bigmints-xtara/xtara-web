import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { getMessages } from "@/i18n/messages";

const common = getMessages("en").auth.common;

describe("branded authentication forms", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("keeps the login-03 field structure while using Xtara's real login choices", async () => {
    const login = getMessages("en").auth.login;
    await act(async () => {
      root.render(
        <LoginForm
          mode="learner"
          copy={{
            chooseType: login.chooseType,
            learnerTab: login.learnerTab,
            educatorTab: login.educatorTab,
            title: login.learner.title,
            description: login.learner.description,
            email: common.email,
            emailPlaceholder: common.emailPlaceholder,
            password: common.password,
            submit: login.learner.submit,
            submitting: login.learner.submitting,
            google: login.learner.google,
            divider: login.divider,
            assessmentPrompt: login.assessmentPrompt,
            assessmentAction: login.assessmentAction,
            signupPrompt: login.signupPrompt,
            signupAction: login.signupAction,
            termsPrefix: common.termsPrefix,
            terms: common.terms,
            privacyConnector: common.privacyConnector,
            privacy: common.privacy,
          }}
          email=""
          password=""
          loading={false}
          learnerHref="/login"
          educatorHref="/login?mode=educator"
          signupHref="/signup"
          onEmailChange={vi.fn()}
          onPasswordChange={vi.fn()}
          onSubmit={vi.fn()}
          onGoogleLogin={vi.fn()}
        />,
      );
    });

    expect(container.querySelector('[data-slot="field-group"]')).not.toBeNull();
    expect(container.querySelector('input[autocomplete="email"]')).not.toBeNull();
    expect(container.querySelector('input[autocomplete="current-password"]')).not.toBeNull();
    expect(container.querySelector('a[href="/assessment"]')).not.toBeNull();
    expect(container.querySelector('a[href="/signup"]')).not.toBeNull();
    expect(container.textContent).toContain("Continue with Google");
    expect(container.textContent).not.toContain("Apple");
  });

  it("provides a complete signup form and Malayalam auth copy", async () => {
    const signup = getMessages("en").auth.signup;
    const variant = signup.variants.saveDiscovery;
    await act(async () => {
      root.render(
        <SignupForm
          copy={{
            title: variant.title,
            description: variant.description,
            name: signup.name,
            namePlaceholder: signup.namePlaceholder,
            email: common.email,
            emailPlaceholder: common.emailPlaceholder,
            password: common.password,
            passwordHint: signup.passwordHint,
            submit: variant.submit,
            submitting: signup.submitting,
            loginPrompt: signup.loginPrompt,
            loginAction: signup.loginAction,
            termsPrefix: common.termsPrefix,
            terms: common.terms,
            privacyConnector: common.privacyConnector,
            privacy: common.privacy,
          }}
          name=""
          email=""
          password=""
          loading={false}
          loginHref="/login?saveDiscovery=1"
          onNameChange={vi.fn()}
          onEmailChange={vi.fn()}
          onPasswordChange={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );
    });

    expect(container.querySelector('input[autocomplete="name"]')).not.toBeNull();
    expect(container.querySelector('input[autocomplete="new-password"]')).not.toBeNull();
    expect(container.querySelector('a[href="/terms-of-use"]')).not.toBeNull();
    expect(container.querySelector('a[href="/privacy-policy"]')).not.toBeNull();
    expect(getMessages("ml").auth.login.learner.title).toBe("വീണ്ടും സ്വാഗതം");
    expect(getMessages("ml").auth.signup.variants.educator.title).toContain("എജുക്കേറ്റർ");
  });
});
