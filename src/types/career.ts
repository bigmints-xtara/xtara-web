export type VisualizationType = 'list' | 'timeline' | 'carousel' | 'bento' | 'intro';

export type SlideType =
    | 'meetDreamCareer'
    | 'whyItMatters'
    | 'whyCareerFits'
    | 'careerPath'
    | 'realWorldExperience'
    | 'startLearning'
    | 'xtaraHelps'
    | 'futureToolkit';

export interface SlideContent {
    title: string;
    subtitle: string;
    icon: string;
    titlesOnly?: boolean;
    sources?: Array<{ label: string; url: string }>;
}

export interface CareerSlideData {
    type: SlideType;
    title: string;
    subtitle: string;
    buttonLabel: string;
    visualization: VisualizationType;
    slideIcon: string;
    content: SlideContent[];
}

export interface SlideshowData {
    slides: CareerSlideData[];
}

// Additional types for career path details
export interface CareerPathwayStep {
    title: string;
    duration: string;
    note?: string;
    step?: string; // Sometimes used as an alias for title or full description
}

export interface RelatedCareer {
    title: string;
    reason: string;
}

export interface ROIInsight {
    investmentLevel: string;
    expectedSalaryRange: string;
    paybackPeriod: string;
    verdict: string;
}

export interface Stream {
    name?: string;
    display_course_name?: string;
    course_name?: string;
}

export interface Course {
    course?: string;
    name?: string;
    title?: string;
    course_type?: string;
    degree_type?: string;
    level?: string;
    type?: string;
    duration_year?: number | string;
    durationYear?: number | string;
    duration?: string;
    description?: string;
    details?: string;
    examMode?: string;
    stream?: Stream[];
}

export interface Scholarship {
    name: string;
    type: string;
    level: string;
    note: string;
    country?: string;
    link?: string;
}

export interface OnlineTraining {
    title?: string;
    name?: string;
    provider: string;
    description: string;
    platform?: string;
    link?: string;
}

export interface ToolAndSoftware {
    id?: string;
    name?: string;
    toolName?: string;
    description: string;
    clusters?: string | string[];
    isActive?: boolean;
}

export interface GovernmentExam {
    name: string;
    examRequired: boolean;
    details: string;
}

export interface InternshipExample {
    role?: string;
    title?: string;
    company?: string;
    organization?: string;
    description: string;
    link?: string;
}

export interface PrimaryCareer {
    courses?: Course[];
    careerCluster?: string;
    [key: string]: any;
}

export interface GrowData {
    careerPathway?: CareerPathwayStep[] | string[];
    expectedSalaryRange?: string;
    internshipRoles?: InternshipExample[];
    investmentLevel?: string;
    [key: string]: any;
}

export interface LearnData {
    courses?: Course[];
    scholarships?: Scholarship[];
    toolsAndSoftware?: ToolAndSoftware[];
    onlineTrainings?: OnlineTraining[];
}

export interface RagOutput {
    learn?: LearnData;
    grow?: GrowData;
    [key: string]: any;
}

export interface CareerPath {
    id: string;
    userId: string;
    careerName: string;
    title?: string;
    description?: string;
    whatYouDo?: string;
    whyItMatters?: string;
    matchScore?: number;
    streamSuggestions?: string[];
    expectedSalaryRange?: string;
    salary?: string;
    education?: string;
    matchReasoning?: string;
    archetypes?: string[];
    careerPathway?: CareerPathwayStep[] | string[];
    internshipExamples?: InternshipExample[];
    onlineTrainings?: OnlineTraining[];
    topInstitutions?: any[]; // Keep any[] if no clear structure yet, or define Institution
    relatedCareers?: RelatedCareer[];
    toolsAndSoftware?: ToolAndSoftware[];
    strengths?: string[];
    createdAt: any;
    
    // Fields from career-helpers.ts
    technicalSkills?: string[];
    softSkills?: string[];
    courses?: Course[];
    recommendedCourses?: Course[];
    quote?: string;
    dreamTitle?: string;
    notablePeople?: any[];
    ragOutput?: RagOutput;
    governmentExams?: GovernmentExam[];
    primaryCareer?: PrimaryCareer;
    grow?: GrowData;
    learn?: LearnData;
    careerCluster?: string;
    investmentLevel?: string;
    scholarships?: Scholarship[];
    careerCommunities?: any[];
    connect?: any;
}

type double = number;
