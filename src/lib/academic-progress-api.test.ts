import { describe, expect, it } from 'vitest';

import { academicExamPercentage, defaultAcademicYear } from '@/lib/academic-progress-api';

describe('academic progress helpers', () => {
  it('calculates an exam percentage across different maximum marks', () => {
    expect(academicExamPercentage({
      subjectResults: [
        { subject: 'Mathematics', status: 'scored', marksObtained: 18, maximumMarks: 20 },
        { subject: 'Science', status: 'scored', marksObtained: 30, maximumMarks: 40 },
      ],
    })).toBe(80);
  });

  it('uses the Indian school year boundary in April', () => {
    expect(defaultAcademicYear(new Date('2026-02-10T00:00:00.000Z'))).toBe('2025-26');
    expect(defaultAcademicYear(new Date('2026-07-10T00:00:00.000Z'))).toBe('2026-27');
  });
});
