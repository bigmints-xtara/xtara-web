"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteUser, sendEmailVerification, signOut } from "firebase/auth";
import {
  BadgeCheck, Building2, Check, ChevronLeft, ChevronRight, FileText, GraduationCap, HelpCircle, Info, Languages, Loader2, LockKeyhole, LogOut,
  Palette, Pencil, Plus, Settings, ShieldCheck, Trash2, User, X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import launchpad from '@/components/launchpad/launchpad.module.css';
import styles from "@/components/journey/journey.module.css";
import Header from "@/components/Header";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LocationInput from "@/components/assessment/LocationInput";
import { pathwayFromAccount, saveAccountStudy } from "@/lib/profile-study";
import AcademicProgressSection from "@/components/profile/AcademicProgressSection";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import type { AcademicGrade } from "@/lib/academic-progress-api";
import { defaultAcademicYear } from "@/lib/academic-progress-api";
import { xtaraApi } from "@/lib/api/client";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { getStateDetails, getStates } from "@/lib/firebase/location";
import { updatePersonalInfo } from "@/lib/firebase/profile-service";
import type { UserProfile } from "@/lib/firebase/auth-helpers";
import {
  emptyPathwayProfile, localizePathwayValue, type PathwayProfileDraft,
} from "@/lib/pathway-profile";
import { listOrganizationWorkspaces, type OrganizationWorkspace } from "@/lib/organization";

const boards = ["CBSE", "CISCE / ICSE", "State board", "IB", "Cambridge", "Other", "Not sure yet"];
const studyLanguages = ["English", "Malayalam", "Hindi", "Tamil", "Other", "Flexible"];
const locationPreferences = ["Near home", "Anywhere in my state", "Anywhere in India", "Open to studying abroad", "Not sure yet"];
const affordabilityOptions = ["Lower-cost options are important", "We can consider moderate fees", "We can compare a wide range", "I am not sure yet", "Prefer not to answer"];
const scholarshipOptions = ["Yes, show scholarships and financial aid", "Maybe, show me what is available", "Not needed right now", "Prefer not to answer"];
const standardSubjects = ["Mathematics", "Science", "English", "Malayalam", "Hindi", "Social Science", "Computer Science", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "Business Studies", "Accountancy", "Political Science", "Psychology", "Physical Education"];

const structureCopy = {
  en: { learner: "Learner information", learnerHelp: "Personal and academic details Xtara holds for you.", preferences: "Preferences", preferencesHelp: "Choose your appearance and language.", appearance: "Appearance", system: "System", light: "Light", dark: "Dark", support: "Support and legal", supportHelp: "Get help and read the policies that apply to your account.", help: "Help and support", about: "About Xtara", privacy: "Privacy Policy", terms: "Terms of Use", savePreferenceError: "We could not save that preference. Try again." },
  ml: { learner: "വിദ്യാർത്ഥിയുടെ വിവരങ്ങൾ", learnerHelp: "Xtara സൂക്ഷിക്കുന്ന വ്യക്തിഗതവും പഠനവുമായി ബന്ധപ്പെട്ടതുമായ വിവരങ്ങൾ.", preferences: "മുൻഗണനകൾ", preferencesHelp: "രൂപവും ഭാഷയും തിരഞ്ഞെടുക്കൂ.", appearance: "രൂപം", system: "സിസ്റ്റം", light: "ലൈറ്റ്", dark: "ഡാർക്ക്", support: "സഹായവും നിയമ വിവരങ്ങളും", supportHelp: "സഹായം നേടുകയും അക്കൗണ്ടിന് ബാധകമായ നയങ്ങൾ വായിക്കുകയും ചെയ്യൂ.", help: "സഹായം", about: "Xtara-യെക്കുറിച്ച്", privacy: "സ്വകാര്യതാ നയം", terms: "ഉപയോഗ നിബന്ധനകൾ", savePreferenceError: "മുൻഗണന സേവ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കൂ." },
  hi: { learner: "विद्यार्थी की जानकारी", learnerHelp: "Xtara में रखी आपकी व्यक्तिगत और पढ़ाई की जानकारी।", preferences: "पसंद", preferencesHelp: "रूप और भाषा चुनें।", appearance: "रूप", system: "सिस्टम", light: "लाइट", dark: "डार्क", support: "सहायता और कानूनी जानकारी", supportHelp: "मदद पाएँ और अपने खाते से जुड़ी नीतियाँ पढ़ें।", help: "मदद और सहायता", about: "Xtara के बारे में", privacy: "गोपनीयता नीति", terms: "उपयोग की शर्तें", savePreferenceError: "यह पसंद सेव नहीं हो सकी। फिर कोशिश करें।" },
  ta: { learner: "கற்றவர் தகவல்", learnerHelp: "Xtara வைத்திருக்கும் உங்கள் தனிப்பட்ட மற்றும் கல்வித் தகவல்.", preferences: "விருப்பங்கள்", preferencesHelp: "தோற்றத்தையும் மொழியையும் தேர்ந்தெடுக்கவும்.", appearance: "தோற்றம்", system: "சிஸ்டம்", light: "லைட்", dark: "டார்க்", support: "உதவி மற்றும் சட்ட தகவல்", supportHelp: "உதவி பெற்று உங்கள் கணக்கிற்கான கொள்கைகளைப் படிக்கவும்.", help: "உதவி மற்றும் ஆதரவு", about: "Xtara பற்றி", privacy: "தனியுரிமைக் கொள்கை", terms: "பயன்பாட்டு விதிமுறைகள்", savePreferenceError: "இந்த விருப்பத்தைச் சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." },
} as const;

const hubCopy = {
  en: { personal: "Personal profile", personalHelp: "Basic information and assessment data", academic: "Academic profile", academicHelp: "School, subjects, marks, and study location", institutions: "Institutions", institutionsHelp: "The institutions connected to your account", settings: "Settings", settingsHelp: "Notifications, appearance, language, and account", support: "Support", supportHelp: "Help and information about Xtara", legal: "Legal", legalHelp: "Privacy Policy and Terms of Use", back: "Back to profile", assessment: "Assessment data", assessmentHelp: "Review your Career Directions and assessment result.", emptyInstitutions: "No institution is connected to this account yet.", institutionError: "We could not load your institutions.", retry: "Try again" },
  ml: { personal: "വ്യക്തിഗത പ്രൊഫൈൽ", personalHelp: "അടിസ്ഥാന വിവരങ്ങളും അസസ്മെന്റ് വിവരങ്ങളും", academic: "പഠന പ്രൊഫൈൽ", academicHelp: "സ്കൂൾ, വിഷയങ്ങൾ, മാർക്കുകൾ, പഠന സ്ഥലം", institutions: "സ്ഥാപനങ്ങൾ", institutionsHelp: "നിങ്ങളുടെ അക്കൗണ്ടുമായി ബന്ധിപ്പിച്ച സ്ഥാപനങ്ങൾ", settings: "ക്രമീകരണങ്ങൾ", settingsHelp: "അറിയിപ്പുകൾ, ദൃശ്യരീതി, ഭാഷ, അക്കൗണ്ട്", support: "സഹായം", supportHelp: "സഹായവും Xtara വിവരങ്ങളും", legal: "നിയമ വിവരങ്ങൾ", legalHelp: "സ്വകാര്യതാ നയവും ഉപയോഗ നിബന്ധനകളും", back: "പ്രൊഫൈലിലേക്ക് മടങ്ങുക", assessment: "അസസ്മെന്റ് വിവരങ്ങൾ", assessmentHelp: "നിങ്ങളുടെ Career Directions-ഉം അസസ്മെന്റ് ഫലവും കാണുക.", emptyInstitutions: "ഈ അക്കൗണ്ടുമായി ഒരു സ്ഥാപനവും ബന്ധിപ്പിച്ചിട്ടില്ല.", institutionError: "സ്ഥാപനങ്ങൾ ലോഡ് ചെയ്യാനായില്ല.", retry: "വീണ്ടും ശ്രമിക്കുക" },
  hi: { personal: "व्यक्तिगत प्रोफ़ाइल", personalHelp: "बुनियादी जानकारी और assessment data", academic: "Academic profile", academicHelp: "स्कूल, subjects, marks और study location", institutions: "Institutions", institutionsHelp: "आपके account से जुड़े institutions", settings: "Settings", settingsHelp: "Notifications, appearance, language और account", support: "Support", supportHelp: "मदद और Xtara की जानकारी", legal: "Legal", legalHelp: "Privacy Policy और Terms of Use", back: "Profile पर वापस जाएँ", assessment: "Assessment data", assessmentHelp: "अपने Career Directions और assessment result देखें।", emptyInstitutions: "इस account से अभी कोई institution नहीं जुड़ा है।", institutionError: "Institutions load नहीं हो सके।", retry: "फिर कोशिश करें" },
  ta: { personal: "தனிப்பட்ட சுயவிவரம்", personalHelp: "அடிப்படை தகவல் மற்றும் மதிப்பீட்டுத் தரவு", academic: "கல்வி சுயவிவரம்", academicHelp: "பள்ளி, பாடங்கள், மதிப்பெண்கள் மற்றும் படிப்பு இடம்", institutions: "நிறுவனங்கள்", institutionsHelp: "உங்கள் கணக்குடன் இணைக்கப்பட்ட நிறுவனங்கள்", settings: "அமைப்புகள்", settingsHelp: "அறிவிப்புகள், தோற்றம், மொழி மற்றும் கணக்கு", support: "ஆதரவு", supportHelp: "உதவி மற்றும் Xtara தகவல்", legal: "சட்டம்", legalHelp: "தனியுரிமைக் கொள்கை மற்றும் பயன்பாட்டு விதிமுறைகள்", back: "சுயவிவரத்திற்குத் திரும்பு", assessment: "மதிப்பீட்டுத் தரவு", assessmentHelp: "உங்கள் Career Directions மற்றும் மதிப்பீட்டு முடிவைப் பார்க்கவும்.", emptyInstitutions: "இந்தக் கணக்குடன் இதுவரை எந்த நிறுவனமும் இணைக்கப்படவில்லை.", institutionError: "உங்கள் நிறுவனங்களை ஏற்ற முடியவில்லை.", retry: "மீண்டும் முயற்சிக்கவும்" },
} as const;

const copy = {
  "en": {
    "title": "My profile",
    "description": "Your details, school progress, and assessment in one place.",
    "edit": "Edit",
    "save": "Save changes",
    "saving": "Saving…",
    "cancel": "Cancel",
    "personal": "Personal details",
    "personalHelp": "How Xtara addresses you and secures your account.",
    "fullName": "Full name",
    "displayName": "Preferred name",
    "email": "Email",
    "verified": "Verified",
    "notVerified": "Not verified",
    "resend": "Resend verification email",
    "sent": "Verification email sent.",
    "study": "School & study",
    "studyHelp": "Your school and study details.",
    "grade": "Current class",
    "grade8": "Class 8",
    "grade9": "Class 9",
    "grade10": "Class 10",
    "grade11": "Class 11",
    "grade12": "Class 12",
    "board": "School board",
    "year": "Academic year",
    "subjects": "Current subjects",
    "addSubject": "Add another subject",
    "customSubject": "Subject name",
    "state": "State",
    "district": "District",
    "city": "Nearest major city",
    "language": "Language for studying",
    "studyLocation": "Where are you open to studying?",
    "fees": "What fees can your family consider?",
    "scholarship": "Would you like scholarship options?",
    "select": "Select an option",
    "locationLoading": "Loading location choices…",
    "locationError": "Some district or city suggestions are unavailable. You can enter your details.",
    "required": "Complete class, board, location, and at least one subject.",
    "assessment": "My assessment",
    "assessmentHelp": "A summary of what you told Xtara—not a permanent label or a perfect-match score.",
    "noAssessment": "Complete the adaptive assessment to see your Career Directions here.",
    "startAssessment": "Start assessment",
    "viewResults": "View full results",
    "reviewAnswers": "Review my answers",
    "completed": "Completed",
    "directions": "Career Directions",
    "strengths": "Signals and strengths",
    "personality": "Working style",
    "family": "Family context",
    "privateContext": "Family context stays separate from marks and never changes them.",
    "account": "Account & privacy",
    "accountHelp": "Manage verification, sign out, and account deletion.",
    "signOut": "Sign out",
    "delete": "Delete account",
    "deleteTitle": "Delete your Xtara account?",
    "deleteHelp": "This permanently removes your account. Enter your email to confirm.",
    "confirmEmail": "Confirm email",
    "deleteForever": "Delete permanently",
    "emailMismatch": "Email address does not match this account.",
    "saved": "Saved",
    "saveError": "We could not save your changes. Your form is still here—please try again.",
    "assessmentDate": "Assessment date",
    "progress": "Progress"
  },
  "ml": {
    "title": "എന്റെ പ്രൊഫൈൽ",
    "description": "നിങ്ങളുടെ വിവരങ്ങളും പഠനപുരോഗതിയും അസസ്‌മെന്റും ഒരിടത്ത്.",
    "edit": "മാറ്റുക",
    "save": "മാറ്റങ്ങൾ സേവ് ചെയ്യൂ",
    "saving": "സേവ് ചെയ്യുന്നു…",
    "cancel": "റദ്ദാക്കുക",
    "personal": "വ്യക്തിഗത വിവരങ്ങൾ",
    "personalHelp": "Xtara നിങ്ങളെ എങ്ങനെ വിളിക്കണം, അക്കൗണ്ട് എങ്ങനെ സുരക്ഷിതമാക്കണം എന്നീ വിവരങ്ങൾ.",
    "fullName": "പൂർണ്ണ പേര്",
    "displayName": "വിളിക്കേണ്ട പേര്",
    "email": "ഇമെയിൽ",
    "verified": "സ്ഥിരീകരിച്ചു",
    "notVerified": "സ്ഥിരീകരിച്ചിട്ടില്ല",
    "resend": "സ്ഥിരീകരണ ഇമെയിൽ വീണ്ടും അയക്കുക",
    "sent": "സ്ഥിരീകരണ ഇമെയിൽ അയച്ചു.",
    "study": "സ്കൂളും പഠനവും",
    "studyHelp": "നിങ്ങളുടെ സ്കൂളും പഠന വിവരങ്ങളും.",
    "grade": "ഇപ്പോഴത്തെ ക്ലാസ്",
    "grade8": "ക്ലാസ് 8",
    "grade9": "ക്ലാസ് 9",
    "grade10": "ക്ലാസ് 10",
    "grade11": "ക്ലാസ് 11",
    "grade12": "ക്ലാസ് 12",
    "board": "വിദ്യാഭ്യാസ ബോർഡ്",
    "year": "അക്കാദമിക് വർഷം",
    "subjects": "ഇപ്പോഴത്തെ വിഷയങ്ങൾ",
    "addSubject": "മറ്റൊരു വിഷയം ചേർക്കുക",
    "customSubject": "വിഷയത്തിന്റെ പേര്",
    "state": "സംസ്ഥാനം",
    "district": "ജില്ല",
    "city": "അടുത്തുള്ള പ്രധാന നഗരം",
    "language": "പഠിക്കാനുള്ള ഭാഷ",
    "studyLocation": "എവിടെയൊക്കെ പഠിക്കാൻ തയ്യാറാണ്?",
    "fees": "കുടുംബത്തിന് പരിഗണിക്കാവുന്ന ഫീസ്",
    "scholarship": "സ്കോളർഷിപ്പ് ഓപ്ഷനുകൾ കാണണോ?",
    "select": "ഒരു ഓപ്ഷൻ തിരഞ്ഞെടുക്കൂ",
    "locationLoading": "സ്ഥല വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു…",
    "locationError": "ചില ജില്ലയുടെയോ നഗരത്തിന്റെയോ നിർദ്ദേശങ്ങൾ ലഭ്യമല്ല. നിങ്ങളുടെ വിവരങ്ങൾ ടൈപ്പ് ചെയ്യാം.",
    "required": "ക്ലാസ്, ബോർഡ്, സ്ഥലം, കുറഞ്ഞത് ഒരു വിഷയം എന്നിവ പൂർത്തിയാക്കൂ.",
    "assessment": "എന്റെ അസസ്‌മെന്റ്",
    "assessmentHelp": "നിങ്ങൾ നൽകിയ മറുപടികളുടെ സംഗ്രഹമാണിത്. നിങ്ങളെ പൂട്ടുന്ന ലേബലോ മാച്ച് സ്കോറോ അല്ല.",
    "noAssessment": "കരിയർ മേഖലകൾ കാണാൻ അസസ്‌മെന്റ് പൂർത്തിയാക്കൂ.",
    "startAssessment": "അസസ്‌മെന്റ് തുടങ്ങാം",
    "viewResults": "പൂർണ്ണ ഫലം കാണാം",
    "reviewAnswers": "മറുപടികൾ മാറ്റാം",
    "completed": "പൂർത്തിയാക്കി",
    "directions": "കരിയർ മേഖലകൾ",
    "strengths": "കണ്ടെത്തിയ കഴിവുകൾ",
    "personality": "ഞാൻ പ്രവർത്തിക്കുന്ന രീതി",
    "family": "വീട്ടിലെ സാഹചര്യം",
    "privateContext": "വീട്ടിലെ സാഹചര്യം നിങ്ങളുടെ അസസ്‌മെന്റ് ഫലം മാറ്റില്ല.",
    "account": "അക്കൗണ്ടും സ്വകാര്യതയും",
    "accountHelp": "സ്ഥിരീകരണം, സൈൻ ഔട്ട്, അക്കൗണ്ട് നീക്കം എന്നിവ നിയന്ത്രിക്കൂ.",
    "signOut": "സൈൻ ഔട്ട്",
    "delete": "അക്കൗണ്ട് നീക്കുക",
    "deleteTitle": "Xtara അക്കൗണ്ട് നീക്കണോ?",
    "deleteHelp": "ഇത് അക്കൗണ്ട് സ്ഥിരമായി നീക്കും. സ്ഥിരീകരിക്കാൻ ഇമെയിൽ നൽകൂ.",
    "confirmEmail": "ഇമെയിൽ സ്ഥിരീകരിക്കുക",
    "deleteForever": "സ്ഥിരമായി നീക്കുക",
    "emailMismatch": "ഇമെയിൽ ഈ അക്കൗണ്ടുമായി പൊരുത്തപ്പെടുന്നില്ല.",
    "saved": "സേവ് ചെയ്തു",
    "saveError": "മാറ്റങ്ങൾ സേവ് ചെയ്യാനായില്ല. നൽകിയ വിവരങ്ങൾ ഇവിടെ തന്നെയുണ്ട്—വീണ്ടും ശ്രമിക്കൂ.",
    "assessmentDate": "അസസ്‌മെന്റ് തീയതി",
    "progress": "പുരോഗതി"
  },
  "hi": {
    "title": "My profile",
    "description": "Details एक जगह रखें।",
    "edit": "Edit",
    "save": "Save changes",
    "saving": "Saving...",
    "cancel": "Cancel",
    "personal": "Personal details",
    "personalHelp": "How Xtara addresses you and secures your account.",
    "fullName": "Full name",
    "displayName": "Preferred name",
    "email": "Email",
    "verified": "Verified",
    "notVerified": "Not verified",
    "resend": "Resend verification email",
    "sent": "Verification email sent.",
    "study": "School & study",
    "studyHelp": "आपके स्कूल और पढ़ाई की जानकारी।",
    "grade": "Grade",
    "grade8": "Class 8",
    "grade9": "Class 9",
    "grade10": "Class 10",
    "grade11": "Class 11",
    "grade12": "Class 12",
    "board": "Board exam",
    "year": "Academic year",
    "subjects": "Current subjects",
    "addSubject": "Add another subject",
    "customSubject": "Subject name",
    "state": "State",
    "district": "District",
    "city": "City",
    "language": "Language for studying",
    "studyLocation": "Where are you open to studying?",
    "fees": "What fees can your family consider?",
    "scholarship": "Would you like scholarship options?",
    "select": "Select an option",
    "locationLoading": "Loading location choices…",
    "locationError": "कुछ ज़िले या शहर के सुझाव उपलब्ध नहीं हैं। आप अपनी जानकारी टाइप कर सकते हैं।",
    "required": "Required",
    "assessment": "My assessment",
    "assessmentHelp": "A summary of what you told Xtara—not a permanent label or a perfect-match score.",
    "noAssessment": "Complete the adaptive assessment to see your Career Directions here.",
    "startAssessment": "Start assessment",
    "viewResults": "View full results",
    "reviewAnswers": "Review my answers",
    "completed": "Completed",
    "directions": "Career Directions",
    "strengths": "Signals and strengths",
    "personality": "Working style",
    "family": "Family context",
    "privateContext": "Family context stays separate from marks and never changes them.",
    "account": "Account & privacy",
    "accountHelp": "Manage verification, sign out, and account deletion.",
    "signOut": "Sign out",
    "delete": "Delete account",
    "deleteTitle": "Delete your Xtara account?",
    "deleteHelp": "This permanently removes your account. Enter your email to confirm.",
    "confirmEmail": "Confirm email",
    "deleteForever": "Delete permanently",
    "emailMismatch": "Email address does not match this account.",
    "saved": "Saved",
    "saveError": "We could not save your changes. Your form is still here—please try again.",
    "assessmentDate": "असेसमेंट की तारीख",
    "progress": "प्रगति"
  },
  "ta": {
    "title": "எனது சுயவிவரம்",
    "description": "உங்கள் விவரங்கள், பள்ளியில் நீங்கள் அடைந்த முன்னேற்றம் மற்றும் மதிப்பீடு ஆகியவை ஒரே இடத்தில்.",
    "edit": "திருத்து",
    "save": "மாற்றங்களைச் சேமிக்கவும்",
    "saving": "சேமிப்பு...",
    "cancel": "ரத்து செய்",
    "personal": "தனிப்பட்ட விவரங்கள்",
    "personalHelp": "Xtara உங்களை எவ்வாறு அணுகுகிறது மற்றும் உங்கள் கணக்கைப் பாதுகாக்கிறது.",
    "fullName": "முழுப் பெயர்",
    "displayName": "விருப்பமான பெயர்",
    "email": "மின்னஞ்சல்",
    "verified": "சரிபார்க்கப்பட்டது",
    "notVerified": "சரிபார்க்கப்படவில்லை",
    "resend": "சரிபார்ப்பு மின்னஞ்சலை மீண்டும் அனுப்பவும்",
    "sent": "சரிபார்ப்பு மின்னஞ்சல் அனுப்பப்பட்டது.",
    "study": "பள்ளியும் படிப்பும்",
    "studyHelp": "உங்கள் பள்ளி மற்றும் படிப்பு விவரங்கள்.",
    "grade": "தற்போதைய வகுப்பு",
    "grade8": "8-ஆம் வகுப்பு",
    "grade9": "9-ஆம் வகுப்பு",
    "grade10": "பத்தாம் வகுப்பு",
    "grade11": "பதினொன்றாம் வகுப்பு",
    "grade12": "பன்னிரண்டாம் வகுப்பு",
    "board": "பள்ளிக் குழு",
    "year": "கல்வியாண்டு",
    "subjects": "தற்போதைய பாடங்கள்",
    "addSubject": "இன்னொரு பாடத்தைச் சேர்க்கவும்",
    "customSubject": "பொருள் பெயர்",
    "state": "மாநிலம்",
    "district": "மாவட்டம்",
    "city": "அருகிலுள்ள பெரிய நகரம்",
    "language": "படிப்பதற்கான மொழி",
    "studyLocation": "எங்கே படிக்கலாம்னு இருக்கீங்க?",
    "fees": "உங்கள் குடும்பம் என்னென்ன கட்டணங்களைச் செலுத்தலாம்?",
    "scholarship": "உங்களுக்கு உதவித்தொகை விருப்பங்கள் வேண்டுமா?",
    "select": "ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்",
    "locationLoading": "இடத் தேர்வுகள் ஏற்றப்படுகின்றன...",
    "locationError": "சில மாவட்டம் அல்லது நகரப் பரிந்துரைகள் கிடைக்கவில்லை. உங்கள் விவரங்களைத் தட்டச்சு செய்யலாம்.",
    "required": "வகுப்பு, வாரியம், இடம் மற்றும் குறைந்தது ஒரு பாடத்தையாவது முழுமையாகப் படியுங்கள்.",
    "assessment": "என் மதிப்பீடு",
    "assessmentHelp": "நீங்கள் Xtara-விடம் பகிர்ந்தவற்றின் சுருக்கம் மட்டுமே; நிரந்தர அடையாளமோ முழுமையான பொருத்த மதிப்பெண்ணோ அல்ல.",
    "noAssessment": "உங்கள் தொழில் வழிகாட்டுதல்களைப் பார்க்க, இங்கே உள்ள தகவல்களைப் பயன்படுத்தி உங்கள் தகவல்களைத் தகுந்தவாறு மாற்றியமைக்கவும்.",
    "startAssessment": "மதிப்பீட்டைத் தொடங்கவும்",
    "viewResults": "முழு முடிவுகளையும் பார்க்கவும்",
    "reviewAnswers": "என் பதில்களை மறுபரிசீலனை செய்யுங்கள்.",
    "completed": "முடிந்தது",
    "directions": "Career Directions",
    "strengths": "சிக்னல்களும் பலமும்",
    "personality": "வேலை செய்யும் முறை",
    "family": "குடும்பச் சூழல்",
    "privateContext": "குடும்ப சூழல் மதிப்பெண்களிலிருந்து தனித்து இருக்கும், மேலும் அவற்றை ஒருபோதும் மாற்றுவதில்லை.",
    "account": "கணக்கு & தனியுரிமை",
    "accountHelp": "சரிபார்ப்பை நிர்வகிக்கவும், வெளியேறவும், கணக்கை நீக்கவும்.",
    "signOut": "வெளியேறு",
    "delete": "கணக்கை நீக்கு",
    "deleteTitle": "உங்கள் Xtara கணக்கை நீக்கவா?",
    "deleteHelp": "இது உங்கள் கணக்கை நிரந்தரமாக நீக்கிவிடும். உறுதிப்படுத்த உங்கள் மின்னஞ்சலை உள்ளிடவும்.",
    "confirmEmail": "மின்னஞ்சலை உறுதிப்படுத்தவும்",
    "deleteForever": "நிரந்தரமாக நீக்கு",
    "emailMismatch": "மின்னஞ்சல் முகவரி இந்த கணக்குடன் பொருந்தவில்லை.",
    "saved": "காப்பாற்றப்பட்டது",
    "saveError": "உங்களால் உங்கள் மாற்றங்களைச் சேமிக்க முடியவில்லை. உங்கள் படிவம் இப்போதும் இங்கேயே உள்ளது- மீண்டும் முயற்சிக்கவும்.",
    "assessmentDate": "மதிப்பீட்டுத் தேதி",
    "progress": "முன்னேற்றம்"
  }
} as const;

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const { locale } = useTranslations();
  const text = copy[locale];
  const router = useRouter();
  const section = useSearchParams().get("section");
  const queryClient = useQueryClient();
  const currentOwner = useRef(user?.uid);
  const hydratedOwner = useRef(user?.uid);
  currentOwner.current = user?.uid;
  const ownsPage = (ownerId: string) => currentOwner.current === ownerId && getFirebaseAuth().currentUser?.uid === ownerId;
  const [profile, setProfile] = useState<UserProfile | null>(userProfile);
  const [pathway, setPathway] = useState<PathwayProfileDraft>(emptyPathwayProfile);
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear());
  const [personalOpen, setPersonalOpen] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);
  useEffect(() => {
    setPersonalOpen(false);
    setStudyOpen(false);
  }, [section]);
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [grade, setGrade] = useState<AcademicGrade>("grade8");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login?next=%2Fprofile"); }, [loading, router, user]);

  useEffect(() => {
    if (hydratedOwner.current !== user?.uid) {
      hydratedOwner.current = user?.uid;
      setGrade("grade8"); setAcademicYear(defaultAcademicYear()); setCustomSubject("");
      setSaving(false); setStatus(""); setPersonalOpen(false); setStudyOpen(false);
    }
    if (!user || !userProfile || userProfile.uid !== user.uid) {
      setSaving(false); setStatus(""); setGrade("grade8"); setAcademicYear(defaultAcademicYear()); setCustomSubject(""); setProfile(null); setPathway(emptyPathwayProfile); setFullName(''); setDisplayName(''); setSubjects([]); setStudyOpen(false); setPersonalOpen(false);
      return;
    }
    setSaving(false); setStatus(""); setCustomSubject("");
    setProfile(userProfile);
    setFullName(userProfile.fullName || userProfile.displayName || user?.displayName || "");
    setDisplayName(userProfile.displayName || user?.displayName || "");
    setPathway(pathwayFromAccount(userProfile));
    setGrade(normalizeGrade(userProfile.gradeStage || userProfile.currentGrade));
    setSubjects(Array.isArray(userProfile.subjectsLearning) ? userProfile.subjectsLearning : []);
  }, [user, userProfile]);

  useEffect(() => {
    let active = true;
    getStates().then((stateItems) => { if (active) setStates(stateItems); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!pathway.state) { setDistricts([]); setCities([]); return () => { active = false; }; }
    setLocationLoading(true);
    setLocationError(false);
    getStateDetails(pathway.state)
      .then((details) => { if (active) { setDistricts(details.districts); setCities(details.cities); setLocationError(Boolean(details.unavailable)); } })
      .finally(() => { if (active) setLocationLoading(false); });
    return () => { active = false; };
  }, [pathway.state]);

  const structure = structureCopy[locale];
  const hub = hubCopy[locale];
  const name = profile?.fullName || profile?.displayName || user?.displayName || text.title;
  const email = user?.email || profile?.email || "";

  const refreshProfile = async (patch: Partial<UserProfile>, ownerId: string) => {
    if (!ownsPage(ownerId)) return;
    setProfile((current) => current ? { ...current, ...patch } : ({ uid: user?.uid || "", email, displayName: null, ...patch } as UserProfile));
    await queryClient.invalidateQueries({ queryKey: ["auth", "userProfile", ownerId] });
  };

  const savePersonal = async () => {
    if (!user || !fullName.trim()) return;
    const ownerId = user.uid;
    setSaving(true); setStatus("");
    try {
      await updatePersonalInfo(user.uid, { fullName, displayName });
      if (!ownsPage(ownerId)) return;
      await refreshProfile({ fullName: fullName.trim(), displayName: displayName.trim() }, ownerId);
      if (!ownsPage(ownerId)) return;
      setPersonalOpen(false); setStatus(text.saved);
    } catch { if (ownsPage(ownerId)) setStatus(text.saveError); } finally { if (ownsPage(ownerId)) setSaving(false); }
  };

  const resetStudyDraft = () => {
    setPathway(pathwayFromAccount(profile));
    setGrade(normalizeGrade(profile?.gradeStage || profile?.currentGrade));
    setSubjects(profile?.subjectsLearning ?? []);
  };
  const changeState = (state: string) => {
    setPathway((current) => ({ ...current, state, district: "", city: "" }));
    setDistricts([]); setCities([]); setLocationError(false);
  };

  const saveStudy = async () => {
    if (!user || !pathway.state || !pathway.district || !pathway.city || !pathway.educationBoard || !subjects.length) { setStatus(text.required); return; }
    const ownerId = user.uid;
    setSaving(true); setStatus("");
    try {
      const saved = await saveAccountStudy(user.uid, { pathway, grade, academicYear, subjects });
      if (!ownsPage(ownerId)) return;
      await refreshProfile(saved, ownerId);
      if (!ownsPage(ownerId)) return;
      setPathway(pathwayFromAccount(saved));
      setStudyOpen(false); setStatus(text.saved);
    } catch { if (ownsPage(ownerId)) setStatus(text.saveError); } finally { if (ownsPage(ownerId)) setSaving(false); }
  };

  const toggleSubject = (subject: string) => setSubjects((current) => current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]);
  const addCustomSubject = () => { const value = customSubject.trim(); if (value && !subjects.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) setSubjects((current) => [...current, value]); setCustomSubject(""); };

  const resendVerification = async () => { if (!user) return; await sendEmailVerification(user); setVerificationSent(true); };
  const logout = async () => { await signOut(getFirebaseAuth()); router.push("/"); };
  const removeAccount = async () => {
    if (!user || deleteEmail.trim().toLocaleLowerCase() !== user.email?.toLocaleLowerCase()) { setDeleteError(text.emailMismatch); return; }
    setDeleting(true);
    try { await deleteUser(user); router.push("/"); } catch (error) { setDeleteError(error instanceof Error ? error.message : text.saveError); setDeleting(false); }
  };

  if (loading || !user) return <ProfileSkeleton />;

  const identity = <Card className={styles.profileIdentity}><CardContent className="flex items-center gap-4 p-5 sm:p-6"><Avatar className="h-14 w-14 border border-white/20"><AvatarFallback className="bg-secondary text-lg text-secondary-foreground">{initials(name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><h2 className="truncate text-lg font-semibold">{name}</h2><p className="truncate text-sm text-white/70">{email}</p></div>{user.emailVerified ? <Badge className="bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/15"><BadgeCheck className="mr-1 h-3.5 w-3.5" />{text.verified}</Badge> : <Badge className="bg-amber-300/15 text-amber-100 hover:bg-amber-300/15">{text.notVerified}</Badge>}</CardContent></Card>;

  const destinations = [
      { key: "personal", icon: User, title: hub.personal, description: hub.personalHelp },
      { key: "academic", icon: GraduationCap, title: hub.academic, description: hub.academicHelp },
      { key: "institutions", icon: Building2, title: hub.institutions, description: hub.institutionsHelp },
      { key: "settings", icon: Settings, title: hub.settings, description: hub.settingsHelp },
      { key: "support", icon: HelpCircle, title: hub.support, description: hub.supportHelp },
      { key: "legal", icon: ShieldCheck, title: hub.legal, description: hub.legalHelp },
    ];
  const sectionTitle = !section ? text.title : section === "personal" ? hub.personal : section === "academic" ? hub.academic : section === "institutions" ? hub.institutions : section === "settings" ? hub.settings : section === "support" ? hub.support : hub.legal;
  return (
    <div className={styles.profileSurface}><Header />
      <main className={styles.profileMain}>
        {section ? <Link href="/profile" className="inline-flex min-h-10 items-center gap-2 rounded-full px-2 text-sm font-semibold text-primary hover:bg-primary/5"><ChevronLeft className="h-4 w-4" />{hub.back}</Link> : null}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{sectionTitle}</h1>
        {status ? <p role="status" className={`mt-5 rounded-xl px-4 py-3 text-sm ${status === text.saved ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"}`}>{status}</p> : null}
        <div className={launchpad.profileGrid}><div>{identity}<nav className={styles.profileDestinations} aria-label={text.title}>{destinations.map(({key, icon: Icon, title}) => <Link key={key} href={`/profile?section=${key}`} className={styles.profileDestination} aria-current={section === key ? 'page' : undefined}><Icon className="h-5 w-5 shrink-0" /><span>{title}</span></Link>)}</nav></div><div className="space-y-5">
          {!section || section === "personal" ? <>
          <ProfileCard id="details" icon={User} title={text.personal} description={text.personalHelp} action={<Button variant="outline" className="min-h-11 rounded-xl" disabled={saving || studyOpen} onClick={() => setPersonalOpen((value) => !value)}><Pencil className="mr-2 h-4 w-4" />{text.edit}</Button>}>
            {personalOpen ? <div className="grid gap-4 rounded-2xl bg-muted p-4 sm:grid-cols-2 sm:p-5"><Field label={text.fullName}><Input value={fullName} onChange={(event) => setFullName(event.target.value)} /></Field><Field label={text.displayName}><Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></Field><div className="sm:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setPersonalOpen(false)}>{text.cancel}</Button><Button onClick={savePersonal} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{saving ? text.saving : text.save}</Button></div></div> : <DescriptionGrid items={[[text.fullName, profile?.fullName || "—"], [text.displayName, profile?.displayName || "—"], [text.email, email]]} />}
          </ProfileCard>
          <ProfileCard id="assessment" icon={BadgeCheck} title={hub.assessment} description={hub.assessmentHelp}><ProfileLink href="/assessment/discovery" icon={BadgeCheck} label={hub.assessment} /></ProfileCard>
          </> : null}

          {!section || section === "academic" ? <>
          <ProfileCard id="study" icon={GraduationCap} title={text.study} description={text.studyHelp} action={<Button variant="outline" className="min-h-11 rounded-xl" disabled={saving || personalOpen} onClick={() => { resetStudyDraft(); setStudyOpen((value) => !value); }}><Pencil className="mr-2 h-4 w-4" />{text.edit}</Button>}>
            {studyOpen ? <div className="rounded-2xl bg-muted p-4 sm:p-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={text.grade}><Choice value={grade} options={["grade8", "grade9", "grade10", "grade11", "grade12"]} placeholder={text.select} getLabel={(value) => gradeLabel(value as AcademicGrade, text)} onChange={(value) => setGrade(value as AcademicGrade)} /></Field>
              <Field label={text.board}><Choice value={pathway.educationBoard} options={boards} placeholder={text.select} getLabel={(value) => localizePathwayValue(value, locale)} onChange={(educationBoard) => setPathway((current) => ({ ...current, educationBoard }))} /></Field>
              <Field label={text.year}><Input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} /></Field>
              <Field label={text.state}><Choice value={pathway.state} options={withCurrent(states, pathway.state)} placeholder={text.select} onChange={changeState} /></Field>
              <Field label={text.district}><LocationInput value={pathway.district} options={withCurrent(districts, pathway.district)} placeholder={text.select} onChange={(district) => setPathway((current) => ({ ...current, district, city: "" }))} disabled={!pathway.state || locationLoading} /></Field>
              <Field label={text.city}><LocationInput value={pathway.city} options={withCurrent(cities, pathway.city)} placeholder={text.select} onChange={(city) => setPathway((current) => ({ ...current, city }))} disabled={!pathway.district || locationLoading} /></Field>
              <Field label={text.language}><Choice value={pathway.studyLanguage} options={studyLanguages} placeholder={text.select} getLabel={(value) => localizePathwayValue(value, locale)} onChange={(studyLanguage) => setPathway((current) => ({ ...current, studyLanguage }))} /></Field>
              <Field label={text.studyLocation}><Choice value={pathway.locationPreference} options={locationPreferences} placeholder={text.select} getLabel={(value) => localizePathwayValue(value, locale)} onChange={(locationPreference) => setPathway((current) => ({ ...current, locationPreference }))} /></Field>
              <Field label={text.fees}><Choice value={pathway.affordability} options={affordabilityOptions} placeholder={text.select} getLabel={(value) => localizePathwayValue(value, locale)} onChange={(affordability) => setPathway((current) => ({ ...current, affordability }))} /></Field>
              <Field label={text.scholarship}><Choice value={pathway.scholarshipInterest} options={scholarshipOptions} placeholder={text.select} getLabel={(value) => localizePathwayValue(value, locale)} onChange={(scholarshipInterest) => setPathway((current) => ({ ...current, scholarshipInterest }))} /></Field>
            </div>{locationLoading ? <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{text.locationLoading}</p> : null}{locationError ? <p role="alert" className="mt-3 text-sm text-amber-800">{text.locationError}</p> : null}
              <div className="mt-6"><p className="text-sm font-medium text-foreground">{text.subjects}</p><div className="mt-3 flex flex-wrap gap-2">{[...new Set([...standardSubjects, ...subjects])].map((subject) => <button type="button" key={subject} aria-pressed={subjects.includes(subject)} onClick={() => toggleSubject(subject)} className={`min-h-10 rounded-full border px-3 py-2 text-sm transition ${subjects.includes(subject) ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 bg-card text-foreground hover:border-primary/40"}`}>{subjects.includes(subject) ? <Check className="mr-1.5 inline h-3.5 w-3.5" /> : null}{subject}</button>)}</div><div className="mt-3 flex gap-2"><Input value={customSubject} onChange={(event) => setCustomSubject(event.target.value)} placeholder={text.customSubject} /><Button type="button" variant="outline" onClick={addCustomSubject} disabled={!customSubject.trim()}><Plus className="mr-2 h-4 w-4" />{text.addSubject}</Button></div></div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => { resetStudyDraft(); setStudyOpen(false); }}>{text.cancel}</Button><Button onClick={saveStudy} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{saving ? text.saving : text.save}</Button></div>
            </div> : <><DescriptionGrid items={[[text.grade, profile?.gradeStage || profile?.currentGrade ? text[normalizeGrade(profile.gradeStage || profile.currentGrade)] : "—"], [text.board, pathwayFromAccount(profile).educationBoard || "—"], [text.state, pathwayFromAccount(profile).state || "—"], [text.district, pathwayFromAccount(profile).district || "—"], [text.city, pathwayFromAccount(profile).city || "—"], [text.language, localizePathwayValue(pathwayFromAccount(profile).studyLanguage, locale) || "—"]]} /><div className="mt-4 flex flex-wrap gap-2">{subjects.length ? subjects.map((subject) => <Badge key={subject} variant="secondary">{subject}</Badge>) : <span className="text-sm text-muted-foreground">{text.subjects}: —</span>}</div></>}
          </ProfileCard>
          {section === "academic" ? <AcademicProgressSection locale={locale} grade={grade} board={pathway.educationBoard} subjects={subjects} /> : null}
          </> : null}

          {section === "institutions" ? <InstitutionMemberships copy={hub} /> : null}
          {section === "settings" ? <><ProfilePreferences locale={locale} />
          <ProfileCard id="account" icon={LockKeyhole} title={text.account} description={text.accountHelp}>
            {!user.emailVerified ? <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950"><p>{text.notVerified}</p><Button variant="link" className="mt-1 h-auto p-0 text-amber-900" onClick={resendVerification}>{text.resend}</Button>{verificationSent ? <p role="status" className="mt-2 text-emerald-800">{text.sent}</p> : null}</div> : <div className="flex items-center gap-2 text-sm text-foreground"><BadgeCheck className="h-4 w-4" />{text.verified}</div>}
            <Separator className="my-5" /><div className="flex flex-col gap-3 sm:flex-row"><Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />{text.signOut}</Button><Button variant="ghost" className="text-destructive hover:bg-red-50 hover:text-red-800" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-2 h-4 w-4" />{text.delete}</Button></div>
            {deleteOpen ? <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><h3 id="delete-title" className="font-semibold text-red-950">{text.deleteTitle}</h3><p className="mt-1 text-sm leading-6 text-red-800">{text.deleteHelp}</p></div><Button size="icon" variant="ghost" aria-label={text.cancel} onClick={() => setDeleteOpen(false)}><X className="h-4 w-4" /></Button></div><Field label={text.confirmEmail} className="mt-4"><Input type="email" value={deleteEmail} onChange={(event) => setDeleteEmail(event.target.value)} /></Field>{deleteError ? <p role="alert" className="mt-2 text-sm text-red-800">{deleteError}</p> : null}<div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleteOpen(false)}>{text.cancel}</Button><Button variant="destructive" onClick={removeAccount} disabled={deleting}>{deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{text.deleteForever}</Button></div></div> : null}
          </ProfileCard></> : null}

          {section === "support" ? <ProfileCard id="support" icon={HelpCircle} title={structure.support} description={structure.supportHelp}>
            <div className="divide-y divide-primary/10 rounded-2xl border border-primary/10">
              <ProfileLink href="/contact" icon={HelpCircle} label={structure.help} />
              <ProfileLink href="/about" icon={Info} label={structure.about} />
            </div>
          </ProfileCard> : null}
          {section === "legal" ? <ProfileCard id="legal" icon={ShieldCheck} title={hub.legal} description={hub.legalHelp}><div className="divide-y divide-primary/10 rounded-2xl border border-primary/10"><ProfileLink href="/privacy-policy" icon={ShieldCheck} label={structure.privacy} /><ProfileLink href="/terms-of-use" icon={FileText} label={structure.terms} /></div></ProfileCard> : null}
        </div>
      </div>
      </main>
    </div>
  );
}

function InstitutionMemberships({ copy }: { copy: (typeof hubCopy)[keyof typeof hubCopy] }) {
  const [items, setItems] = useState<OrganizationWorkspace[]>([]);
  const [selected, setSelected] = useState<OrganizationWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    listOrganizationWorkspaces()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Card className="border-primary/10 shadow-none"><CardContent className="flex min-h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent></Card>;
  if (error) return <Card className="border-primary/10 shadow-none"><CardContent className="flex min-h-40 flex-col items-center justify-center gap-4 p-6 text-center"><p className="text-sm text-muted-foreground">{copy.institutionError}</p><Button variant="outline" onClick={load}>{copy.retry}</Button></CardContent></Card>;
  if (selected) {
    const details = [humanize(selected.role), humanize(selected.organization.kind), humanize(selected.effectiveStatus), selected.organization.academicYear || ""].filter(Boolean);
    return <><Button variant="ghost" className="px-2" onClick={() => setSelected(null)}><ChevronLeft className="mr-2 h-4 w-4" />{copy.institutions}</Button><Card className="mt-3 border-primary/10 shadow-none"><CardContent className="p-6 sm:p-8"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/20 text-primary"><Building2 className="h-7 w-7" /></span><h2 className="mt-5 text-2xl font-semibold text-primary">{selected.organization.name}</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{details.map((value) => <div key={value} className="rounded-xl bg-muted p-4 text-sm font-medium text-primary">{value}</div>)}</div></CardContent></Card></>;
  }
  if (!items.length) return <Card className="border-primary/10 shadow-none"><CardContent className="flex min-h-40 items-center justify-center p-6 text-center text-sm text-muted-foreground">{copy.emptyInstitutions}</CardContent></Card>;
  return <div className="grid gap-3">{items.map((item) => <button type="button" key={item.membershipId} onClick={() => setSelected(item)} className="flex min-h-24 w-full items-center gap-4 rounded-2xl border border-primary/10 bg-card p-5 text-left transition hover:border-primary/25 hover:shadow-sm"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/20 text-primary"><Building2 className="h-6 w-6" /></span><span className="min-w-0 flex-1"><span className="block text-lg font-semibold text-primary">{item.organization.name}</span><span className="mt-1 block text-sm text-muted-foreground">{humanize(item.role)} · {humanize(item.effectiveStatus)}</span></span><ChevronRight className="h-5 w-5 text-slate-400" /></button>)}</div>;
}

function ProfileCard({ id, icon: Icon, title, description, action, children }: { id: string; icon: typeof User; title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <Card id={id} className="scroll-mt-24 border-primary/10 shadow-none"><CardContent className="p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-primary"><Icon className="h-5 w-5" /></span><div><h2 className="text-xl font-semibold text-primary">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div></div>{action}</div><div className="mt-6">{children}</div></CardContent></Card>;
}

function ProfilePreferences({ locale }: { locale: keyof typeof structureCopy }) {
  const text = structureCopy[locale];
  const [preferences, setPreferences] = useState<Record<string, unknown>>({});
  const [theme, setTheme] = useState("system");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    xtaraApi.get<{ preferences?: Record<string, unknown> }>("/me/preferences")
      .then((response) => {
        if (!active) return;
        const next = response.preferences ?? {};
        const nextTheme = next.theme === "light" || next.theme === "dark" ? next.theme : "system";
        setPreferences(next);
        setTheme(nextTheme);
        applyTheme(nextTheme);
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const savePreferences = async (patch: Record<string, unknown>) => {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    setSaving(true);
    setError("");
    try {
      const response = await xtaraApi.put<{ preferences?: Record<string, unknown> }>("/me/preferences", next);
      setPreferences(response.preferences ?? next);
    } catch {
      setError(text.savePreferenceError);
    } finally {
      setSaving(false);
    }
  };

  const changeTheme = (value: string) => {
    const next = value === "light" || value === "dark" ? value : "system";
    setTheme(next);
    applyTheme(next);
    void savePreferences({ theme: next });
  };

  return <ProfileCard id="preferences" icon={Palette} title={text.preferences} description={text.preferencesHelp}>
    <div className="divide-y divide-primary/10 rounded-2xl border border-primary/10">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Palette className="h-5 w-5 text-primary" /><span className="text-sm font-semibold text-primary">{text.appearance}</span></div><div className="w-full sm:w-48"><Choice value={theme} options={["system", "light", "dark"]} placeholder={text.system} getLabel={(value) => value === "light" ? text.light : value === "dark" ? text.dark : text.system} onChange={changeTheme} disabled={loading || saving} /></div></div>
      <div className="flex items-center justify-between gap-4 p-4"><div className="flex items-center gap-3"><Languages className="h-5 w-5 text-primary" /><span className="text-sm font-semibold text-primary">Language</span></div><LanguageSwitcher /></div>
    </div>
    {saving ? <p role="status" className="mt-3 text-sm text-muted-foreground">Saving…</p> : null}
    {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
  </ProfileCard>;
}

function ProfileLink({ href, icon: Icon, label }: { href: string; icon: typeof User; label: string }) {
  return <Link href={href} className="flex min-h-14 items-center gap-3 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-muted/40"><Icon className="h-5 w-5" /><span className="flex-1">{label}</span><span aria-hidden="true">›</span></Link>;
}

function applyTheme(theme: string) {
  const useDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", useDark);
}

function DescriptionGrid({ items }: { items: Array<[string, string]> }) { return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(([label, value]) => <InfoBox key={label} label={label} value={value} />)}</div>; }
function InfoBox({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 break-words font-medium text-primary">{value}</p></div>; }
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`block space-y-2 ${className}`}><span className="text-sm font-medium text-foreground">{label}</span>{children}</label>; }
function Choice({ value, options, placeholder, onChange, getLabel = (option) => option, disabled = false }: { value: string; options: string[]; placeholder: string; onChange: (value: string) => void; getLabel?: (value: string) => string; disabled?: boolean }) { return <Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger className="min-h-11"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{getLabel(option)}</SelectItem>)}</SelectContent></Select>; }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "X"; }
function humanize(value: string) { return value.split("_").filter(Boolean).map((part) => `${part[0]?.toUpperCase()}${part.slice(1)}`).join(" "); }
function normalizeGrade(value?: string): AcademicGrade { return value === "grade9" || value === "grade10" || value === "grade11" || value === "grade12" ? value : "grade8"; }
function gradeLabel(grade: AcademicGrade, text: Record<AcademicGrade, string>) { return text[grade]; }
function withCurrent(options: string[], current: string) { return [...new Set([...(current ? [current] : []), ...options])]; }
function ProfileSkeleton() { return <div className="min-h-screen bg-[#f7fafc]"><Header /><main className="mx-auto max-w-5xl space-y-5 px-4 py-8"><Skeleton className="h-10 w-48" /><Skeleton className="h-28 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /></main></div>; }
