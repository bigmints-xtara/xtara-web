import { XtaraApiError, xtaraApi } from '@/lib/api/client';
import { xtaraApiOperationPath } from '@/lib/api/generated/xtara-api-operations';

export interface CollegeCourse {
  id?: string;
  course?: string;
  name: string;
  level?: string;
  degreeType?: string;
  duration?: string;
  fees?: string;
  streams?: string[];
  [key: string]: unknown;
}

export interface CollegeInfo {
  id: string;
  name: string;
  shortName?: string;
  type?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  phone?: string;
  website?: string;
  university?: string;
  majorStream?: string;
  yearFounded?: string;
  releaseId?: string;
  sourceNotice?: string;
  courses: CollegeCourse[];
  [key: string]: unknown;
}

type ListResponse<T> = { items?: T[] } | T[];

function itemsFrom<T>(response: ListResponse<T>): T[] {
  return Array.isArray(response) ? response : response.items || [];
}

export class CollegeService {
  static async searchCollegesByCourse(courseName: string, limitCount = 20): Promise<CollegeInfo[]> {
    const params = new URLSearchParams({ course: courseName, limit: String(limitCount) });
    const response = await xtaraApi.get<ListResponse<CollegeInfo>>(`/colleges?${params.toString()}`);
    return itemsFrom(response);
  }

  static async searchCollegesByCareer(careerId: string, limitCount = 20): Promise<CollegeInfo[]> {
    const params = new URLSearchParams({ careerId, limit: String(limitCount) });
    const response = await xtaraApi.get<ListResponse<CollegeInfo>>(`/colleges?${params.toString()}`);
    return itemsFrom(response);
  }

  static async getCollegeById(id: string, options: { offeringId?: string; signal?: AbortSignal } = {}): Promise<CollegeInfo | null> {
    const path = xtaraApiOperationPath('getCollegesCollegeId', { collegeId: id });
    const query = options.offeringId ? `?${new URLSearchParams({ offeringId: options.offeringId })}` : '';
    try {
      const college = await xtaraApi.get<CollegeInfo>(`${path}${query}`, { signal: options.signal });
      return { ...college, courses: college.courses || [] };
    } catch (error) {
      if (error instanceof XtaraApiError && error.status === 404) return null;
      throw error;
    }
  }

  static async searchCollegesByLocationHierarchy(
    courseName: string,
    city?: string,
    state?: string,
    country?: string,
    limitCount = 20
  ): Promise<{ all: CollegeInfo[]; city: CollegeInfo[]; state: CollegeInfo[]; outside: CollegeInfo[] }> {
    const params = new URLSearchParams({ limit: String(limitCount) });
    if (courseName) params.set('course', courseName);
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    if (country) params.set('country', country);

    const response = await xtaraApi.get<ListResponse<CollegeInfo>>(`/colleges?${params.toString()}`);
    const all = itemsFrom(response);
    const cityColleges = city ? all.filter((college) => college.city === city) : [];
    const stateColleges = state ? all.filter((college) => college.state === state && college.city !== city) : [];
    const outside = all.filter((college) => !cityColleges.includes(college) && !stateColleges.includes(college));
    return { all, city: cityColleges, state: stateColleges, outside };
  }
}

export default CollegeService;
