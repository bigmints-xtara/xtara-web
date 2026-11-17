# Public website copy

The homepage explains Xtara to students in Classes 8–12 and their families.
Start with what the visitor can do: answer questions, learn about jobs and save
choices. Use familiar words before introducing product names. Do not assume a
student already has a career in mind or has talked about one with an adult.

Each section should answer a different question. Explain the three steps once,
then explain how students, parents and teachers can use the product. Avoid
repeating the same outcomes in a second set of cards or replacing explanations
with slogans about direction, clarity, discovery, signals or trust.

Public navigation offers Explore Careers, For parents and For educators. About
is available in the footer. `/parents` gives practical help for adults reading
with a child; it does not add a parent account or access to learner records.
The educator page describes the existing school/class and consented student
views in plain language. Its class illustration is explicitly an example.

Public copy must reflect the current MVP. Do not promise a final job decision,
a guaranteed match, employment, lessons or other unavailable tools. Questions
and browsing can begin without an account; saving requires sign-in. English,
Malayalam, Hindi and Tamil UI copy is maintained together. Explain that some
career information remains in English while translations are prepared.

The website-only copy update leaves Flutter's assessment and Explorer entry
points and all authenticated API contracts unchanged. Preserve native behavior
and server-authoritative saved choices.

Image provenance and the generation brief are in
`public/images/home/README.md`. Keep illustrated people described as an
illustration, not actual customers or a testimonial.

Login uses short, practical copy about returning to saved jobs or school classes.
Keep student and educator entry points clear, and keep Google and email sign-in
available. Password visibility is an explicit labelled toggle. The illustration
supports the form on large screens and is hidden on compact screens. Keep all
four login translations together; presentation changes must preserve existing
role checks and assessment/save continuation.

Public pages share the outer grid in `MarketingLayout.module.css`: 1280px
maximum width including 32px side gutters, reduced to 22px at 700px and below.
Use `<Container marketing>` inside `MarketingLayout` and avoid another layer of
page gutters. Hero, header and footer align to the same grid. Card padding and
narrower article or form columns are intentional inner layouts. Authenticated
workspaces and native Flutter screens retain their own layout conventions.
