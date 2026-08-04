"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  ExternalLink,
  Globe,
  GraduationCap,
  Loader2,
  MapPin,
  Phone,
} from "lucide-react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "@/i18n/language-provider";
import { CollegeService, type CollegeCourse, type CollegeInfo } from "@/lib/firebase/college-service";

const copy = {
  "en": {
    "loading": "Loading college details…",
    "notFound": "College details are unavailable",
    "notFoundHelp": "The college may have been removed or its information may not be published yet.",
    "back": "Back",
    "college": "College",
    "affiliated": "Affiliated to",
    "information": "College information",
    "type": "Type",
    "website": "Official website",
    "phone": "Phone",
    "address": "Address",
    "established": "Established",
    "stream": "Main study area",
    "checkTitle": "Check current details",
    "checkHelp": "Admissions, fees, courses, and eligibility can change. Confirm them on the college’s official website before applying.",
    "catalogNotice": "Xtara normalized this listing from a third-party directory snapshot. Verify admissions, fees, courses, eligibility, and contact details with the college before applying.",
    "officialSite": "Open official website",
    "contact": "Contact Xtara",
    "courses": "Courses listed",
    "course": "course",
    "coursesCount": "courses",
    "fees": "Fees",
    "streams": "Specializations listed",
    "noCourses": "No course information is published for this college yet."
  },
  "ml": {
    "loading": "കോളേജ് വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു…",
    "notFound": "കോളേജ് വിവരങ്ങൾ ലഭ്യമല്ല",
    "notFoundHelp": "കോളേജ് നീക്കം ചെയ്തതാകാം അല്ലെങ്കിൽ വിവരങ്ങൾ ഇതുവരെ പ്രസിദ്ധീകരിച്ചിട്ടില്ലാകാം.",
    "back": "തിരികെ",
    "college": "കോളേജ്",
    "affiliated": "അഫിലിയേറ്റ് ചെയ്തിരിക്കുന്നത്",
    "information": "കോളേജ് വിവരങ്ങൾ",
    "type": "തരം",
    "website": "ഔദ്യോഗിക വെബ്സൈറ്റ്",
    "phone": "ഫോൺ",
    "address": "വിലാസം",
    "established": "ആരംഭിച്ച വർഷം",
    "stream": "പ്രധാന പഠന മേഖല",
    "checkTitle": "നിലവിലെ വിവരങ്ങൾ പരിശോധിക്കൂ",
    "checkHelp": "പ്രവേശനം, ഫീസ്, കോഴ്സുകൾ, യോഗ്യത എന്നിവ മാറാം. അപേക്ഷിക്കുന്നതിന് മുമ്പ് കോളേജിന്റെ ഔദ്യോഗിക വെബ്സൈറ്റിൽ പരിശോധിക്കൂ.",
    "catalogNotice": "ഈ ലിസ്റ്റിംഗ് ഒരു മൂന്നാം കക്ഷി ഡയറക്ടറി സ്നാപ്ഷോട്ടിൽ നിന്ന് Xtara ക്രമപ്പെടുത്തിയതാണ്. അപേക്ഷിക്കുന്നതിന് മുമ്പ് പ്രവേശനം, ഫീസ്, കോഴ്സുകൾ, യോഗ്യത, ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ എന്നിവ കോളേജുമായി പരിശോധിക്കൂ.",
    "officialSite": "ഔദ്യോഗിക വെബ്സൈറ്റ് തുറക്കുക",
    "contact": "Xtaraയെ ബന്ധപ്പെടുക",
    "courses": "ലിസ്റ്റ് ചെയ്ത കോഴ്സുകൾ",
    "course": "കോഴ്സ്",
    "coursesCount": "കോഴ്സുകൾ",
    "fees": "ഫീസ്",
    "streams": "ലിസ്റ്റ് ചെയ്ത സ്പെഷ്യലൈസേഷനുകൾ",
    "noCourses": "ഈ കോളേജിന്റെ കോഴ്സ് വിവരങ്ങൾ ഇതുവരെ പ്രസിദ്ധീകരിച്ചിട്ടില്ല."
  },
  "hi": {
    "loading": "College details load हो रही हैं...",
    "notFound": "College details available नहीं हैं",
    "notFoundHelp": "यह college record अभी मिल नहीं रहा है।",
    "back": "Back",
    "college": "College",
    "affiliated": "Affiliated to",
    "information": "College information",
    "type": "Type",
    "website": "Official website",
    "phone": "Phone",
    "address": "Address",
    "established": "Established",
    "stream": "Main study stream",
    "checkTitle": "Official details check करें",
    "checkHelp": "Admission, fees, courses, eligibility और dates college की official site से verify करें।",
    "catalogNotice": "Xtara ने यह listing third-party directory snapshot से व्यवस्थित की है। Apply करने से पहले admission, fees, courses, eligibility और contact details college से verify करें।",
    "officialSite": "Official site खोलें",
    "contact": "Xtara से contact करें",
    "courses": "Listed courses",
    "course": "Course",
    "coursesCount": "Courses",
    "fees": "Fees",
    "streams": "Listed specializations",
    "noCourses": "Courses अभी listed नहीं हैं।"
  },
  "ta": {
    "loading": "கல்லூரி விவரங்கள் ஏற்றப்படுகின்றன...",
    "notFound": "கல்லூரி விவரங்கள் கிடைக்கவில்லை.",
    "notFoundHelp": "கல்லூரி நீக்கப்பட்டிருக்கலாம் அல்லது அதன் தகவல்கள் இன்னும் வெளியிடப்படாமல் இருக்கலாம்.",
    "back": "திரும்ப",
    "college": "கல்லூரி",
    "affiliated": "இணைந்த",
    "information": "கல்லூரித் தகவல்",
    "type": "வகை",
    "website": "அதிகாரப்பூர்வ வலைத்தளம்",
    "phone": "தொலைபேசி",
    "address": "முகவரி",
    "established": "நிறுவப்பட்டது",
    "stream": "முக்கிய ஆய்வுப் பகுதி",
    "checkTitle": "தற்போதைய விவரங்களைச் சரிபார்க்கவும்.",
    "checkHelp": "சேர்க்கை, கட்டணம், படிப்புகள் மற்றும் தகுதி ஆகியவை மாறக்கூடும். விண்ணப்பிக்கும் முன் கல்லூரியின் அதிகாரப்பூர்வ இணையதளத்தில் அவற்றை உறுதிப்படுத்திக் கொள்ளுங்கள்.",
    "catalogNotice": "மூன்றாம் தரப்பு அடைவு ஸ்னாப்ஷாட்டில் இருந்து இந்த பட்டியலை Xtara இயல்பாக்கியது. விண்ணப்பிக்கும் முன் கல்லூரியுடன் சேர்க்கை, கட்டணம், படிப்புகள், தகுதி மற்றும் தொடர்பு விவரங்களை சரிபார்க்கவும்.",
    "officialSite": "அதிகாரப்பூர்வ வலைத்தளத்தைத் திறக்கவும்",
    "contact": "Xtaraவைத் தொடர்பு கொள்ளவும்",
    "courses": "பட்டியலிடப்பட்ட படிப்புகள்",
    "course": "பயிற்சி",
    "coursesCount": "பயிற்சிகள்",
    "fees": "கட்டணங்கள்",
    "streams": "பட்டியலிடப்பட்ட சிறப்புப் பிரிவுகள்",
    "noCourses": "இந்தக் கல்லூரியின் எந்தவொரு பாடத்திட்டத் தகவலும் இன்னும் வெளியிடப்படவில்லை."
  }
} as const;

export default function CollegeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { locale } = useTranslations();
  const text = copy[locale];
  const [college, setCollege] = useState<CollegeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    CollegeService.getCollegeById(id)
      .then((data) => { if (active) setCollege(data); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="sr-only">{text.loading}</span></div>;
  }

  if (!college) {
    return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-xl px-5 py-20 text-center"><Building2 className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-5 text-3xl font-semibold text-primary">{text.notFound}</h1><p className="mt-3 leading-7 text-muted-foreground">{text.notFoundHelp}</p><Button type="button" className="mt-7 rounded-full" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />{text.back}</Button></main></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <section className="bg-primary px-5 py-10 text-white sm:py-14">
          <div className="mx-auto max-w-6xl">
            <button type="button" onClick={() => router.back()} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-white/75 transition hover:text-white"><ArrowLeft className="h-4 w-4" />{text.back}</button>
            <div className="mt-6 flex flex-wrap gap-2"><Badge className="border-white/15 bg-white/10 text-white hover:bg-white/10">{college.type || text.college}</Badge>{college.shortName ? <Badge variant="secondary">{college.shortName}</Badge> : null}</div>
            <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">{college.name}</h1>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/75 sm:flex-row sm:flex-wrap sm:gap-6">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-secondary" />{[college.city, college.state].filter(Boolean).join(", ")}</span>
              {college.university ? <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-secondary" />{text.affiliated} {college.university}</span> : null}
            </div>
          </div>
        </section>

        <section className="mx-auto grid min-w-0 max-w-6xl gap-5 px-5 py-10 lg:grid-cols-[0.8fr_1.2fr] sm:py-14">
          <div className="min-w-0 space-y-5">
            <Card className="min-w-0 border-primary/10 shadow-none"><CardContent className="min-w-0 p-6"><SectionTitle icon={Building2} title={text.information} /><dl className="mt-5 min-w-0 space-y-4"><InfoRow icon={Building2} label={text.type} value={college.type} /><InfoRow icon={Globe} label={text.website} value={college.website} link /><InfoRow icon={Phone} label={text.phone} value={college.phone} /><InfoRow icon={MapPin} label={text.address} value={college.address} /><InfoRow icon={Calendar} label={text.established} value={college.yearFounded} /><InfoRow icon={BookOpen} label={text.stream} value={college.majorStream} /></dl></CardContent></Card>
            <Card className="border-secondary/50 bg-secondary/15 shadow-none"><CardContent className="p-6"><h2 className="text-lg font-semibold text-primary">{text.checkTitle}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{college.releaseId ? text.catalogNotice : text.checkHelp}</p>{college.website ? <Button asChild className="mt-5 w-full rounded-xl"><a href={college.website} target="_blank" rel="noreferrer">{text.officialSite}<ExternalLink className="ml-2 h-4 w-4" /></a></Button> : <Button asChild className="mt-5 w-full rounded-xl"><Link href="/contact">{text.contact}</Link></Button>}</CardContent></Card>
          </div>

          <Card className="min-w-0 border-primary/10 shadow-none"><CardContent className="min-w-0 p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><SectionTitle icon={GraduationCap} title={text.courses} /><Badge variant="secondary">{college.courses.length} {college.courses.length === 1 ? text.course : text.coursesCount}</Badge></div>{college.courses.length ? <div className="mt-6 min-w-0 space-y-4">{college.courses.map((course, index) => <CourseCard key={`${course.course || course.name}-${index}`} course={course} text={text} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-primary/15 bg-muted/30 p-8 text-center text-sm text-muted-foreground">{text.noCourses}</div>}</CardContent></Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function CourseCard({ course, text }: { course: CollegeCourse; text: { fees: string; streams: string } }) {
  const title = course.course || course.name;
  const streams = Array.isArray(course.streams) ? course.streams.map(streamLabel).filter(Boolean) : [];
  return <article className="min-w-0 rounded-2xl border border-primary/10 bg-muted/30 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-lg font-semibold text-primary">{title}</h3>{course.level ? <Badge variant="secondary" className="mt-2">{course.level}</Badge> : null}</div><div className="space-y-1 text-right text-sm text-muted-foreground">{course.duration ? <p>{course.duration}</p> : null}{course.fees ? <p className="font-medium text-primary">{text.fees}: ₹{course.fees}</p> : null}</div></div>{course.degreeType ? <p className="mt-4 text-sm text-muted-foreground">{course.degreeType}</p> : null}{streams.length ? <div className="mt-5 min-w-0 border-t border-primary/10 pt-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{text.streams}</p><div className="mt-3 flex min-w-0 flex-wrap gap-2">{streams.map((stream) => <Badge key={stream} variant="outline" className="max-w-full whitespace-normal break-words py-1.5 text-left leading-5">{stream}</Badge>)}</div></div> : null}</article>;
}

function InfoRow({ icon: Icon, label, value, link = false }: { icon: typeof Building2; label: string; value?: string; link?: boolean }) {
  if (!value) return null;
  return <div className="grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)] gap-3"><Icon className="mt-0.5 h-4 w-4 text-primary" /><div className="min-w-0"><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 min-w-0 break-words text-sm text-foreground">{link ? <a href={value} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-all font-medium text-primary hover:underline">{value}<ExternalLink className="h-3.5 w-3.5 shrink-0" /></a> : value}</dd></div></div>;
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Building2; title: string }) {
  return <div className="flex items-center gap-3 text-primary"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5"><Icon className="h-5 w-5" /></span><h2 className="text-xl font-semibold">{title}</h2></div>;
}

function streamLabel(stream: unknown): string {
  if (typeof stream === "string") return stream;
  if (!stream || typeof stream !== "object") return "";
  const value = stream as Record<string, unknown>;
  return String(value.name || value.display_course_name || value.course_name || "");
}
