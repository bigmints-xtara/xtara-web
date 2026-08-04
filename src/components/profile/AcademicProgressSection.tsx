"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CalendarDays, Loader2, Plus, ShieldCheck, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  academicExamPercentage,
  addAcademicExam,
  defaultAcademicYear,
  deleteAcademicExam,
  getAcademicProgress,
  saveAcademicPeriod,
  type AcademicExamRecord,
  type AcademicExamType,
  type AcademicGrade,
} from "@/lib/academic-progress-api";
import type { Locale } from "@/i18n/config";

const copy = {
  "en": {
    "title": "My school progress",
    "description": "Keep a private history of exams and marks so you can see change over time.",
    "add": "Add exam result",
    "privacy": "Marks help with study planning only. They never reduce your Career Directions or Dream Careers.",
    "loading": "Loading school progress…",
    "noResults": "No exam results added yet.",
    "noResultsHelp": "Add one result when you are ready. This is optional.",
    "examName": "Exam name",
    "examNamePlaceholder": "For example, Term 1",
    "examType": "Exam type",
    "examDate": "Exam date",
    "academicYear": "Academic year",
    "marks": "Marks",
    "obtained": "Marks obtained",
    "maximum": "Maximum marks",
    "note": "Note (optional)",
    "notePlaceholder": "Anything that affected this result or that you want to remember",
    "save": "Save exam result",
    "saving": "Saving…",
    "cancel": "Cancel",
    "removeSubject": "Remove subject",
    "addSubjectFirst": "Add subjects in School & study before recording marks.",
    "incomplete": "Add an exam name, date, and valid marks for at least one subject.",
    "savedByYou": "Added by you",
    "remove": "Remove",
    "confirmRemove": "Remove this result?",
    "keep": "Keep it",
    "unit_test": "Unit test",
    "term": "Term exam",
    "annual": "Annual exam",
    "board": "Board-style exam",
    "other": "Other"
  },
  "ml": {
    "title": "എന്റെ പഠന പുരോഗതി",
    "description": "മാറ്റം മനസ്സിലാക്കാൻ പരീക്ഷകളുടെയും മാർക്കുകളുടെയും സ്വകാര്യ ചരിത്രം സൂക്ഷിക്കൂ.",
    "add": "പരീക്ഷാഫലം ചേർക്കുക",
    "privacy": "മാർക്ക് പഠനപ്ലാൻ തയ്യാറാക്കാൻ മാത്രം ഉപയോഗിക്കും. അത് നിങ്ങളുടെ കരിയർ സാധ്യതകൾ കുറയ്ക്കില്ല.",
    "loading": "പഠന പുരോഗതി ലോഡ് ചെയ്യുന്നു…",
    "noResults": "ഇതുവരെ പരീക്ഷാഫലങ്ങളൊന്നും ചേർത്തിട്ടില്ല.",
    "noResultsHelp": "തയ്യാറാകുമ്പോൾ ഒരു ഫലം ചേർക്കാം. ഇത് നിർബന്ധമല്ല.",
    "examName": "പരീക്ഷയുടെ പേര്",
    "examNamePlaceholder": "ഉദാഹരണം: ഒന്നാം ടേം",
    "examType": "പരീക്ഷയുടെ തരം",
    "examDate": "പരീക്ഷ തീയതി",
    "academicYear": "അക്കാദമിക് വർഷം",
    "marks": "മാർക്ക്",
    "obtained": "ലഭിച്ച മാർക്ക്",
    "maximum": "ആകെ മാർക്ക്",
    "note": "കുറിപ്പ് (ഐച്ഛികം)",
    "notePlaceholder": "ഈ ഫലത്തെ ബാധിച്ച കാര്യമോ ഓർക്കേണ്ട കാര്യമോ",
    "save": "പരീക്ഷാഫലം സൂക്ഷിക്കുക",
    "saving": "സൂക്ഷിക്കുന്നു…",
    "cancel": "റദ്ദാക്കുക",
    "removeSubject": "വിഷയം ഒഴിവാക്കുക",
    "addSubjectFirst": "മാർക്ക് രേഖപ്പെടുത്തുന്നതിന് മുമ്പ് സ്കൂൾ വിവരങ്ങളിൽ വിഷയങ്ങൾ ചേർക്കൂ.",
    "incomplete": "പരീക്ഷയുടെ പേര്, തീയതി, കുറഞ്ഞത് ഒരു വിഷയത്തിലെ ശരിയായ മാർക്ക് എന്നിവ ചേർക്കൂ.",
    "savedByYou": "നിങ്ങൾ ചേർത്തത്",
    "remove": "നീക്കുക",
    "confirmRemove": "ഈ ഫലം നീക്കണോ?",
    "keep": "വേണ്ട, സൂക്ഷിക്കൂ",
    "unit_test": "യൂണിറ്റ് ടെസ്റ്റ്",
    "term": "ടേം പരീക്ഷ",
    "annual": "വാർഷിക പരീക്ഷ",
    "board": "ബോർഡ് മാതൃകാ പരീക്ഷ",
    "other": "മറ്റൊന്ന്"
  },
  "hi": {
    "title": "My school progress",
    "description": "Details एक जगह रखें।",
    "add": "Add",
    "privacy": "Marks help with study planning only. They never reduce your Career Directions or Dream Careers.",
    "loading": "Loading...",
    "noResults": "अभी कोई results add नहीं हैं।",
    "noResultsHelp": "Add one result when you are ready. This is optional.",
    "examName": "Exam name",
    "examNamePlaceholder": "For example, Term 1",
    "examType": "Exam type",
    "examDate": "Exam date",
    "academicYear": "Academic year",
    "marks": "Marks",
    "obtained": "Marks obtained",
    "maximum": "Maximum marks",
    "note": "Note (optional)",
    "notePlaceholder": "Anything that affected this result or that you want to remember",
    "save": "Save changes",
    "saving": "Saving...",
    "cancel": "Cancel",
    "removeSubject": "Remove subject",
    "addSubjectFirst": "Add subjects in School & study before recording marks.",
    "incomplete": "Add an exam name, date, and valid marks for at least one subject.",
    "savedByYou": "Added by you",
    "remove": "Remove",
    "confirmRemove": "Remove this result?",
    "keep": "Keep it",
    "unit_test": "Unit test",
    "term": "Term exam",
    "annual": "Annual exam",
    "board": "Board exam",
    "other": "Other"
  },
  "ta": {
    "title": "என் பள்ளி முன்னேற்றம்",
    "description": "தேர்வுகள் மற்றும் மதிப்பெண்களின் தனிப்பட்ட வரலாற்றை வைத்திருங்கள், இதன் மூலம் காலப்போக்கில் ஏற்படும் மாற்றங்களை நீங்கள் காணலாம்.",
    "add": "தேர்வு முடிவைச் சேர்க்கவும்",
    "privacy": "மார்க்ஸ் படிப்புக்கு மட்டும்தான் உதவும். அது உங்களுடைய தொழில் வழிகாட்டுதலையோ அல்லது கனவு தொழிலையோ குறைக்காது.",
    "loading": "பள்ளிப் படிப்பு முன்னேற்றம் ஏற்றப்படுகிறது…",
    "noResults": "தேர்வு முடிவுகள் இன்னும் சேர்க்கப்படவில்லை.",
    "noResultsHelp": "நீங்கள் தயாரானபோது ஒரு முடிவைச் சேர்க்கலாம். இது விருப்பத்தேர்வு.",
    "examName": "தேர்வு பெயர்",
    "examNamePlaceholder": "உதாரணமாக, தவணை 1",
    "examType": "தேர்வு வகை",
    "examDate": "தேர்வு தேதி",
    "academicYear": "கல்வியாண்டு",
    "marks": "மதிப்பெண்கள்",
    "obtained": "பெறப்பட்ட மதிப்பெண்கள்",
    "maximum": "அதிகபட்ச மதிப்பெண்கள்",
    "note": "குறிப்பு (விருப்பம்)",
    "notePlaceholder": "இந்த முடிவை பாதித்த அல்லது நீங்கள் நினைவில் கொள்ள விரும்பும் எதையும்",
    "save": "தேர்வு முடிவை சேமிக்கவும்",
    "saving": "சேமிப்பு...",
    "cancel": "ரத்து செய்",
    "removeSubject": "தலைப்பை நீக்கு",
    "addSubjectFirst": "மார்க் எடுப்பதற்கு முன்பு பள்ளியில் பாடங்களைச் சேர்த்து படிக்கவும்.",
    "incomplete": "குறைந்தபட்சம் ஒரு பாடத்திற்கான தேர்வு பெயர், தேதி மற்றும் சரியான மதிப்பெண்களைச் சேர்க்கவும்.",
    "savedByYou": "உங்களால் சேர்க்கப்பட்டது",
    "remove": "நீக்கு",
    "confirmRemove": "இந்த முடிவை நீக்கவா?",
    "keep": "இதை வைத்துக்கொள்",
    "unit_test": "யூனிட் டெஸ்ட்",
    "term": "காலத்தேர்வு",
    "annual": "வருடாந்திரத் தேர்வு",
    "board": "பலகை முறை தேர்வு",
    "other": "பிற"
  }
} as const;

type MarkDraft = { subject: string; obtained: string; maximum: string };

export default function AcademicProgressSection({ locale, grade, board, subjects }: { locale: Locale; grade: AcademicGrade; board: string; subjects: string[] }) {
  const text = copy[locale];
  const [exams, setExams] = useState<AcademicExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [examName, setExamName] = useState("");
  const [examType, setExamType] = useState<AcademicExamType>("term");
  const [examDate, setExamDate] = useState(new Date().toISOString().slice(0, 10));
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear());
  const [note, setNote] = useState("");
  const [marks, setMarks] = useState<MarkDraft[]>(() => subjects.map((subject) => ({ subject, obtained: "", maximum: "100" })));

  useEffect(() => {
    let active = true;
    getAcademicProgress().then(({ period, exams: savedExams }) => {
      if (!active) return;
      setExams(savedExams);
      if (period?.academicYear) setAcademicYear(period.academicYear);
    }).catch(() => undefined).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!showForm) setMarks(subjects.map((subject) => ({ subject, obtained: "", maximum: "100" })));
  }, [showForm, subjects]);

  const validResults = useMemo(() => marks.flatMap((mark) => {
    const obtained = Number(mark.obtained);
    const maximum = Number(mark.maximum);
    return mark.subject.trim() && mark.obtained !== "" && Number.isFinite(obtained) && Number.isFinite(maximum) && maximum > 0 && obtained >= 0 && obtained <= maximum
      ? [{ subject: mark.subject.trim(), status: "scored" as const, marksObtained: obtained, maximumMarks: maximum }]
      : [];
  }), [marks]);
  const hasInvalidEnteredMark = useMemo(() => marks.some((mark) => {
    if (mark.obtained === "") return false;
    const obtained = Number(mark.obtained);
    const maximum = Number(mark.maximum);
    return !Number.isFinite(obtained) || !Number.isFinite(maximum) || maximum <= 0 || obtained < 0 || obtained > maximum;
  }), [marks]);

  const save = async () => {
    if (!examName.trim() || !examDate || !academicYear.trim() || !validResults.length || hasInvalidEnteredMark) {
      setError(text.incomplete);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveAcademicPeriod({ academicYear: academicYear.trim(), gradeStage: grade, boardId: board || "Not set", subjects });
      const exam = await addAcademicExam({ examName: examName.trim(), examType, examDate, academicYear: academicYear.trim(), gradeStage: grade, note: note.trim() || undefined, subjectResults: validResults });
      setExams((current) => [exam, ...current]);
      setShowForm(false);
      setExamName("");
      setNote("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : text.incomplete);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteAcademicExam(id);
      setExams((current) => current.filter((exam) => exam.id !== id));
      setRemoveId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : text.incomplete);
    }
  };

  return (
    <Card id="progress" className="scroll-mt-24 border-primary/10 shadow-none">
      <CardContent className="p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-primary"><BookOpenCheck className="h-5 w-5" /></span>
            <div><h2 className="text-xl font-semibold text-primary">{text.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{text.description}</p></div>
          </div>
          <Button type="button" className="min-h-11 rounded-xl" onClick={() => { setShowForm(true); setError(""); }} disabled={!subjects.length}>
            <Plus className="mr-2 h-4 w-4" />{text.add}
          </Button>
        </div>
        <div className="mt-5 flex gap-3 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><span>{text.privacy}</span></div>
        {!subjects.length ? <p role="status" className="mt-4 text-sm text-amber-800">{text.addSubjectFirst}</p> : null}

        {showForm ? (
          <div className="mt-6 rounded-2xl border border-primary/10 bg-slate-50 p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={text.examName}><Input value={examName} onChange={(event) => setExamName(event.target.value)} placeholder={text.examNamePlaceholder} /></Field>
              <Field label={text.examType}><Select value={examType} onValueChange={(value) => setExamType(value as AcademicExamType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["unit_test", "term", "annual", "board", "other"] as const).map((type) => <SelectItem key={type} value={type}>{text[type]}</SelectItem>)}</SelectContent></Select></Field>
              <Field label={text.examDate}><Input type="date" max={new Date().toISOString().slice(0, 10)} value={examDate} onChange={(event) => setExamDate(event.target.value)} /></Field>
              <Field label={text.academicYear}><Input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} /></Field>
            </div>
            <h3 className="mt-6 text-sm font-semibold text-primary">{text.marks}</h3>
            <div className="mt-3 space-y-3">
              {marks.map((mark) => (
                <div key={mark.subject} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_130px_130px_auto] sm:items-end">
                  <p className="min-w-0 font-medium text-primary sm:pb-2.5">{mark.subject}</p>
                  <Field label={text.obtained}><Input inputMode="decimal" type="number" min="0" step="0.01" value={mark.obtained} onChange={(event) => setMarks((current) => current.map((item) => item.subject === mark.subject ? { ...item, obtained: event.target.value } : item))} /></Field>
                  <Field label={text.maximum}><Input inputMode="decimal" type="number" min="0.01" step="0.01" value={mark.maximum} onChange={(event) => setMarks((current) => current.map((item) => item.subject === mark.subject ? { ...item, maximum: event.target.value } : item))} /></Field>
                  <Button type="button" variant="ghost" size="icon" aria-label={`${text.removeSubject}: ${mark.subject}`} onClick={() => setMarks((current) => current.filter((item) => item.subject !== mark.subject))}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <Field label={text.note} className="mt-4"><Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={text.notePlaceholder} /></Field>
            {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>{text.cancel}</Button><Button type="button" onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{saving ? text.saving : text.save}</Button></div>
          </div>
        ) : null}

        <div className="mt-6">
          {loading ? <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{text.loading}</p> : exams.length ? (
            <div className="space-y-3">{exams.map((exam) => <div key={exam.id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-primary">{exam.examName}</h3><Badge variant="secondary">{text.savedByYou}</Badge></div><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{new Date(exam.examDate).toLocaleDateString(`${locale}-IN`)}</p></div><p className="text-2xl font-semibold text-primary">{academicExamPercentage(exam)}%</p></div>
              <div className="mt-4 flex flex-wrap gap-2">{exam.subjectResults.map((result) => <span key={result.subject} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">{result.subject}: {result.marksObtained}/{result.maximumMarks}</span>)}</div>
              {exam.note ? <p className="mt-3 text-sm leading-6 text-slate-600">{exam.note}</p> : null}
              <div className="mt-4 flex justify-end">{removeId === exam.id ? <div className="flex items-center gap-2"><span className="text-xs text-red-700">{text.confirmRemove}</span><Button size="sm" variant="outline" onClick={() => setRemoveId(null)}>{text.keep}</Button><Button size="sm" variant="destructive" onClick={() => remove(exam.id)}>{text.remove}</Button></div> : <Button size="sm" variant="ghost" className="text-red-700" onClick={() => setRemoveId(exam.id)}><Trash2 className="mr-2 h-4 w-4" />{text.remove}</Button>}</div>
            </div>)}</div>
          ) : <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center"><p className="font-medium text-primary">{text.noResults}</p><p className="mt-1 text-sm text-slate-500">{text.noResultsHelp}</p></div>}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block space-y-2 ${className}`}><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}
