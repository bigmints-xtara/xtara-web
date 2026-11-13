import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '@/i18n/language-provider';
import { teacherGuidanceCopy } from '@/lib/teacher-guidance-copy';
import type { OrganizationMember } from '@/lib/organization';
import { StudentAssessmentVisuals, TeacherStudentList } from './TeacherGuidance';

const student: OrganizationMember = {
  id: 'school_asha', userId: 'asha', role: 'student', unitIds: ['8a'], displayName: 'Asha', consentStatus: 'active', assessmentStatus: 'completed',
  sharing: { assessment: true, direction: true, actions: true }, guidance: { code: 'choose_direction', needsAttention: true },
  assessmentSummary: { completedAt: '2026-11-01', areas: [{ id: 'tech', title: 'Technology', evidence: 'developing' }], signals: [{ id: 'making', title: 'Making', evidence: 'noticed' }] }, directionProgress: null,
};
function show(ui: React.ReactNode, locale: 'en' | 'ml' | 'hi' | 'ta' = 'en') { return render(<LanguageProvider initialLocale={locale}>{ui}</LanguageProvider>); }
beforeEach(() => Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } }));

describe('teacher guidance', () => {
  it('explains an empty teacher roster with a concrete next step', () => {
    show(<TeacherStudentList students={[]} />);
    expect(screen.getByRole('status')).toHaveTextContent('Ask your school administrator');
    expect(screen.queryByText(/No outstanding/)).not.toBeInTheDocument();
  });

  it('finds students by name and filters attention using the server decision', () => {
    show(<TeacherStudentList students={[student, { ...student, id: 'ben', displayName: 'Ben', guidance: { code: 'sharing_limited', needsAttention: false } }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Needs a next step' }));
    expect(screen.queryByText('Ben')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Asha/ })).toHaveAttribute('href', '/organization/students/school_asha');
    fireEvent.change(screen.getByRole('textbox', { name: 'Find a student' }), { target: { value: 'nothing' } });
    expect(screen.getByRole('status')).toHaveTextContent('No students match');
    fireEvent.click(screen.getByRole('button', { name: 'All students' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Find a student' }), { target: { value: 'bEn' } });
    expect(screen.getByText('Ben')).toBeInTheDocument();
  });
  it('shows categorical evidence and a concrete next conversation without fabricated scores', () => {
    show(<StudentAssessmentVisuals student={student} />);
    expect(screen.getByText('Developing interest')).toBeInTheDocument();
    expect(screen.getByText('Noticed')).toBeInTheDocument();
    expect(screen.getByText('Which of these directions makes you curious, and why?')).toBeInTheDocument();
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });
  it('keeps hidden progress unknown and supports missing evidence and invalid dates', () => {
    show(<StudentAssessmentVisuals student={{ ...student, assessmentSummary: { areas: [{ id: 'tech', title: 'Technology' }] }, sharing: { assessment: true, direction: true, actions: false }, directionProgress: { selectedCareerCount: 1, completedActions: null, reviewOn: 'invalid' } }} />);
    expect(screen.getByText('No strength rating provided')).toBeInTheDocument();
    expect(screen.getAllByText('Not shared').length).toBeGreaterThan(0);
  });
  it('explains withheld results without treating them as missing work', () => {
    show(<StudentAssessmentVisuals student={{ ...student, assessmentSummary: null, sharing: { assessment: false, direction: false, actions: false }, guidance: { code: 'sharing_limited', needsAttention: false } }} />);
    expect(screen.getByText('Guidance is not shared')).toBeInTheDocument();
    expect(screen.getByText('No assessment results are shared yet.')).toBeInTheDocument();
    expect(screen.queryByText('Choose a direction to explore')).not.toBeInTheDocument();
  });
  it('does not mistake an older API response for withheld consent', () => {
    show(<StudentAssessmentVisuals student={{ ...student, guidance: undefined }} />);
    expect(screen.getByText('Guidance summary unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Guidance is not shared')).not.toBeInTheDocument();
  });
  for (const locale of ['ml', 'hi', 'ta'] as const) it('renders translated evidence and guidance in ' + locale, () => {
    show(<StudentAssessmentVisuals student={student} />, locale);
    const c = teacherGuidanceCopy(locale);
    expect(screen.getByText(c.results)).toBeInTheDocument();
    expect(screen.getByText(c.developing)).toBeInTheDocument();
    expect(screen.getByText(c.guidance.choose_direction[3])).toBeInTheDocument();
  });
});
