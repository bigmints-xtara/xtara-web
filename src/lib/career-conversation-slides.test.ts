import { describe, expect, it } from "vitest";

import { generateCareerConversationSlides, generateSlidesFromCareer } from "./career-slides-utils";

describe("Career Conversation slideshow", () => {
  it("uses only supplied curated content to build a parent and teacher discussion", () => {
    const slides = generateCareerConversationSlides({
      directionTitle: "Technology & Digital",
      strengths: ["Solving problems", "Explaining ideas"],
      courses: ["Computer Science", "Bachelor of Computer Applications"],
      careers: [{
        title: "Cybersecurity Analyst",
        summary: "Protects digital systems and information.",
        dailyWork: ["Review alerts", "Investigate incidents"],
        workSetting: "Computer-based team work",
        preparation: "Build computing and networking foundations.",
        tryThis: "Complete a beginner cyber-safety activity.",
        difficultParts: ["Careful monitoring", "Incident responsibility"],
        salaryRange: "Reviewed India range",
        growthOutlook: "Reviewed outlook",
      }],
    });

    expect(slides).toHaveLength(7);
    expect(slides[0].title).toBe("My Career Conversation");
    expect(JSON.stringify(slides)).toContain("Cybersecurity Analyst");
    expect(JSON.stringify(slides)).toContain("Reviewed India range");
    expect(slides.at(-1)?.buttonLabel).toBe("Return to My Career Path");
  });

  it("localizes the conversation structure without changing supplied career evidence", () => {
    const slides = generateCareerConversationSlides({
      locale: "ml",
      directionTitle: "സാങ്കേതികവിദ്യ & ഡിജിറ്റൽ",
      strengths: ["പ്രശ്നപരിഹാരം"],
      courses: ["Computer Science"],
      careers: [{
        title: "സൈബർ സുരക്ഷാ അനലിസ്റ്റ്",
        summary: "ഡിജിറ്റൽ സംവിധാനങ്ങൾ സംരക്ഷിക്കുന്നു.",
        dailyWork: ["സുരക്ഷാ അലർട്ടുകൾ പരിശോധിക്കുന്നു"],
        workSetting: "കമ്പ്യൂട്ടർ അധിഷ്ഠിത ടീം ജോലി",
        preparation: "കമ്പ്യൂട്ടിംഗ് അടിസ്ഥാനങ്ങൾ വളർത്തുക.",
        tryThis: "ഒരു സൈബർ സുരക്ഷാ പ്രവർത്തനം ചെയ്യൂ.",
        difficultParts: ["ശ്രദ്ധാപൂർവമായ നിരീക്ഷണം"],
      }],
    });

    expect(slides[0].title).toBe("എന്റെ കരിയർ സംഭാഷണം");
    expect(slides[0].buttonLabel).toBe("സംഭാഷണം തുടങ്ങുക");
    expect(JSON.stringify(slides)).toContain("സൈബർ സുരക്ഷാ അനലിസ്റ്റ്");
    expect(slides.at(-1)?.buttonLabel).toBe("എന്റെ കരിയർ വഴിയിലേക്ക് മടങ്ങുക");
  });
});

describe("legacy career slideshow notable-person evidence", () => {
  const peopleCard = (person: Record<string, unknown>) => {
    const slides = generateSlidesFromCareer({
      title: "Digital Forensics Specialist",
      notablePeople: [person],
    });
    return slides
      .find((slide) => slide.title === "What will you do?")
      ?.content.find((item) => item.title === "People to learn from");
  };

  it.each([
    ["researcher", "a researcher or academic connected to this field"],
    ["academic", "a researcher or academic connected to this field"],
    ["professor", "a researcher or academic connected to this field"],
    ["adjacent_role", "an adjacent role connected to this field"],
    ["field_leader", "a field leader connected to this work"],
    ["public_service_leader", "a public-service leader connected to this field"],
    ["founder", "a founder connected to this field"],
  ])("keeps a %s relationship distinct from same-role practice", (relationship, expected) => {
    const card = peopleCard({ name: "Vijeta Khare", relationship });

    expect(card?.subtitle).toContain(expected);
    expect(String(card?.subtitle).includes("not as proof")).toBe(
      relationship === "researcher" || relationship === "academic" || relationship === "professor",
    );
    expect(card?.subtitle).not.toContain("Leaders like");
    expect(card?.subtitle).not.toContain("already do similar work");
  });

  it("uses explicit same-role wording only when the typed relationship says same_role", () => {
    expect(peopleCard({ name: "A. Practitioner", relationship: "same_role" })?.subtitle)
      .toBe("A. Practitioner is listed as a public example in this role.");
  });

  it("does not infer leadership or role practice from an untyped legacy person", () => {
    expect(peopleCard({ name: "A. Example" })?.subtitle)
      .toBe("A. Example is one public example to review. Check their profile to understand how their work relates to this role.");
  });
});
