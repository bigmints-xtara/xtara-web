'use client';

import { AlertTriangle, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type {
  DreamCareerDetailProfileReview,
  DreamCareerDetailProfileV3,
  DreamCareerAdmissionExam,
  DreamCareerEducationCost,
  DreamCareerEducationPathway,
  DreamCareerEducationStage,
  DreamCareerEarningsScenario,
  DreamCareerExam,
  DreamCareerLicence,
  DreamCareerOutlookClaim,
  DreamCareerPerson,
  DreamCareerProfileSource,
  DreamCareerStreamOption,
  DreamCareerTimelineStage,
  DreamCareerReturnScenario,
  DreamCareerSkill,
  DreamCareerSpecialization,
  DreamCareerTradeoff,
  DreamCareerWorkActivity,
  DreamCareerWorkSetting,
} from '@/types/dream-career-detail-profile';

type Props = {
  careerId: string;
  profile?: DreamCareerDetailProfileV3;
  review?: DreamCareerDetailProfileReview;
  onChange: (profile: DreamCareerDetailProfileV3 | undefined, review: DreamCareerDetailProfileReview | undefined) => void;
};

const frequencyOptions = ['daily', 'weekly', 'periodic', 'varies'] as const;
const importanceOptions = ['core', 'important', 'useful'] as const;
const skillCategoryOptions = ['technical', 'human', 'digital', 'domain', 'business', 'creative', 'physical'] as const;
const progressionOptions = ['intern', 'trainee', 'junior', 'associate', 'mid_level', 'senior', 'lead', 'manager', 'senior_manager', 'director', 'executive', 'independent', 'varies'] as const;
const profileReviewOptions = ['pending', 'inReview', 'changesRequested', 'approved'] as const;
const sourceReviewOptions = ['pending', 'approved', 'rejected'] as const;

export default function DreamCareerDetailProfileEditor({ careerId, profile, review, onChange }: Props) {
  if (!profile) {
    return (
      <section className="rounded-xl border border-dashed p-5">
        <h2 className="text-base font-semibold">Structured career profile</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">Add the v3 profile only when its evidence pack is ready. It stays in review and cannot publish until the profile and every source are approved.</p>
        <Button className="mt-4" onClick={() => {
          const next = createEmptyProfile(careerId);
          onChange(next, reconcileReview(next, undefined));
        }} type="button" variant="outline"><Plus />Add structured profile</Button>
      </section>
    );
  }

  const currentReview = reconcileReview(profile, review);
  const errors = validateAdminProfile(profile, currentReview, careerId);
  const setProfile = (next: DreamCareerDetailProfileV3) => onChange(next, reconcileReview(next, currentReview));
  const setReview = (next: DreamCareerDetailProfileReview) => onChange(profile, reconcileReview(profile, next));

  return (
    <section className="space-y-4 rounded-xl border bg-slate-50/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Structured career profile · schema v3</h2>
          <p className="mt-1 text-sm text-slate-600">Every factual row must reference evidence from the source list below.</p>
        </div>
        <Button onClick={() => onChange(undefined, undefined)} size="sm" type="button" variant="destructive"><Trash2 />Remove profile</Button>
      </div>

      {errors.length ? <ValidationSummary errors={errors} /> : <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">The browser checks pass. The API will still run the authoritative schema, evidence-reference, ROI and publication validation.</p>}

      <ProfileSection title="Work and settings">
        <TextArea label="What this career involves" value={profile.work.summary} onChange={(summary) => setProfile({ ...profile, work: { ...profile.work, summary } })} />
        <TextArea label="Why it matters" value={profile.work.whyItMatters} onChange={(whyItMatters) => setProfile({ ...profile, work: { ...profile.work, whyItMatters } })} />
        <Collection title="Work activities" items={profile.work.activities} create={emptyActivity} onChange={(activities) => setProfile({ ...profile, work: { ...profile.work, activities } })} render={(item, update) => <ActivityEditor item={item} update={update} />} />
        <Collection title="Work settings" items={profile.work.settings} create={emptySetting} onChange={(settings) => setProfile({ ...profile, work: { ...profile.work, settings } })} render={(item, update) => <SettingEditor item={item} update={update} />} />
      </ProfileSection>

      <ProfileSection title="Education pathways">
        <Collection items={profile.educationPathways} create={emptyPathway} onChange={(educationPathways) => setProfile({ ...profile, educationPathways })} render={(item, update) => <PathwayEditor item={item} update={update} />} />
      </ProfileSection>

      <ProfileSection title="Skills and progression">
        <Collection title="Skills" items={profile.skills} create={emptySkill} onChange={(skills) => setProfile({ ...profile, skills })} render={(item, update) => <SkillEditor item={item} update={update} />} />
        <div className="grid gap-3 md:grid-cols-2"><Choice label="Timeline model" value={profile.careerTimeline.model} options={['illustrative', 'common', 'regulated']} onChange={(model) => setProfile({ ...profile, careerTimeline: { ...profile.careerTimeline, model: model as typeof profile.careerTimeline.model } })} /><TextArea label="Timeline framing" value={profile.careerTimeline.summary} onChange={(summary) => setProfile({ ...profile, careerTimeline: { ...profile.careerTimeline, summary } })} /></div>
        <Collection title="Career timeline stages" items={profile.careerTimeline.stages} create={() => emptyProgression(profile.careerTimeline.stages.length + 1)} onChange={(stages) => setProfile({ ...profile, careerTimeline: { ...profile.careerTimeline, stages } })} render={(item, update) => <ProgressionEditor item={item} update={update} />} />
      </ProfileSection>

      <ProfileSection title="Education costs, earnings and ROI">
        <Collection title="Education costs" items={profile.financials.educationCosts} create={emptyInvestment} onChange={(educationCosts) => setProfile({ ...profile, financials: { ...profile.financials, educationCosts } })} render={(item, update) => <InvestmentEditor item={item} update={update} />} />
        <Collection title="Earnings evidence" items={profile.financials.earnings} create={emptyEarnings} onChange={(earnings) => setProfile({ ...profile, financials: { ...profile.financials, earnings } })} render={(item, update) => <EarningsEditor item={item} update={update} />} />
        <Collection title="Simple gross payback scenarios" items={profile.financials.returnOnEducation} create={emptyReturn} onChange={(returnOnEducation) => setProfile({ ...profile, financials: { ...profile.financials, returnOnEducation } })} render={(item, update) => <ReturnEditor item={item} update={update} />} />
      </ProfileSection>

      <ProfileSection title="Outlook, regulation, exams and licences">
        <Collection title="Outlook claims" items={profile.outlook} create={emptyOutlook} onChange={(outlook) => setProfile({ ...profile, outlook })} render={(item, update) => <OutlookEditor item={item} update={update} />} />
        <div className="grid gap-3 md:grid-cols-2">
          <Choice label="Regulation status" value={profile.requirements.regulation.status} options={['regulated', 'education_regulated', 'requirements_vary', 'not_role_regulated', 'not_verified']} onChange={(status) => setProfile({ ...profile, requirements: { ...profile.requirements, regulation: { ...profile.requirements.regulation, status: status as typeof profile.requirements.regulation.status } } })} />
          <Text label="Jurisdiction" value={profile.requirements.regulation.jurisdiction} onChange={(jurisdiction) => setProfile({ ...profile, requirements: { ...profile.requirements, regulation: { ...profile.requirements.regulation, jurisdiction } } })} />
          <ListInput label="Regulation source IDs" value={profile.requirements.regulation.sourceIds} onChange={(sourceIds) => setProfile({ ...profile, requirements: { ...profile.requirements, regulation: { ...profile.requirements.regulation, sourceIds } } })} />
        </div>
        <TextArea label="Regulation notes" value={profile.requirements.regulation.notes} onChange={(notes) => setProfile({ ...profile, requirements: { ...profile.requirements, regulation: { ...profile.requirements.regulation, notes } } })} />
        <Collection title="Regulatory authorities" items={profile.requirements.regulation.authorities} create={() => ({ name: '', officialUrl: '' })} onChange={(authorities) => setProfile({ ...profile, requirements: { ...profile.requirements, regulation: { ...profile.requirements.regulation, authorities } } })} render={(item, update) => <div className="grid gap-3 md:grid-cols-2"><Text label="Authority" value={item.name} onChange={(name) => update({ ...item, name })} /><Text label="Official URL" type="url" value={item.officialUrl} onChange={(officialUrl) => update({ ...item, officialUrl })} /></div>} />
        <Collection title="Government or entrance exams" items={profile.requirements.governmentExams} create={emptyExam} onChange={(governmentExams) => setProfile({ ...profile, requirements: { ...profile.requirements, governmentExams } })} render={(item, update) => <ExamEditor item={item} update={update} />} />
        <Collection title="Licences" items={profile.requirements.licences} create={emptyLicence} onChange={(licences) => setProfile({ ...profile, requirements: { ...profile.requirements, licences } })} render={(item, update) => <LicenceEditor item={item} update={update} />} />
      </ProfileSection>

      <ProfileSection title="Specialisations, trade-offs and people">
        <Collection title="Specialisations" items={profile.specializations} create={emptySpecialization} onChange={(specializations) => setProfile({ ...profile, specializations })} render={(item, update) => <SimpleSourcedEditor item={item} update={update} />} />
        <Collection title="Trade-offs" items={profile.tradeoffs} create={emptyTradeoff} onChange={(tradeoffs) => setProfile({ ...profile, tradeoffs })} render={(item, update) => <TradeoffEditor item={item} update={update} />} />
        <Collection title="Notable people" items={profile.notablePeople} create={emptyPerson} onChange={(notablePeople) => setProfile({ ...profile, notablePeople })} render={(item, update) => <PersonEditor item={item} update={update} />} />
      </ProfileSection>

      <ProfileSection title="Try this career">
        <div className="grid gap-3 md:grid-cols-2">
          <Text label="Activity title" value={profile.tryThis.title} onChange={(title) => setProfile({ ...profile, tryThis: { ...profile.tryThis, title } })} />
          <NumberInput label="Duration in minutes" value={profile.tryThis.durationMinutes} onChange={(durationMinutes) => setProfile({ ...profile, tryThis: { ...profile.tryThis, durationMinutes } })} />
          <Choice label="Cost" value={profile.tryThis.cost} options={['free', 'low_cost']} onChange={(cost) => setProfile({ ...profile, tryThis: { ...profile.tryThis, cost: cost as 'free' | 'low_cost' } })} />
        </div>
        <TextArea label="Purpose" value={profile.tryThis.purpose} onChange={(purpose) => setProfile({ ...profile, tryThis: { ...profile.tryThis, purpose } })} />
        <ListInput label="Materials" value={profile.tryThis.materials} multiline onChange={(materials) => setProfile({ ...profile, tryThis: { ...profile.tryThis, materials } })} />
        <ListInput label="Steps" value={profile.tryThis.steps} multiline onChange={(steps) => setProfile({ ...profile, tryThis: { ...profile.tryThis, steps } })} />
        <ListInput label="Reflection questions" value={profile.tryThis.reflectionQuestions} multiline onChange={(reflectionQuestions) => setProfile({ ...profile, tryThis: { ...profile.tryThis, reflectionQuestions } })} />
        <ListInput label="Safety notes" value={profile.tryThis.safetyNotes} multiline onChange={(safetyNotes) => setProfile({ ...profile, tryThis: { ...profile.tryThis, safetyNotes } })} />
      </ProfileSection>

      <ProfileSection title="Related catalog content">
        <div className="grid gap-3 md:grid-cols-2"><ListInput label="Related career IDs" value={profile.relatedCareerIds} onChange={(relatedCareerIds) => setProfile({ ...profile, relatedCareerIds })} /><ListInput label="Course search queries" value={profile.courseQueries} multiline onChange={(courseQueries) => setProfile({ ...profile, courseQueries })} /></div>
      </ProfileSection>

      <ProfileSection title="Evidence sources">
        <Collection items={profile.sources} create={emptySource} onChange={(sources) => setProfile({ ...profile, sources })} render={(item, update) => <SourceEditor item={item} update={update} />} />
      </ProfileSection>

      <ProfileSection title="Editorial approval">
        <div className="grid gap-3 md:grid-cols-3">
          <Choice label="Profile review status" value={currentReview.status} options={profileReviewOptions} onChange={(status) => setReview({ ...currentReview, status: status as DreamCareerDetailProfileReview['status'] })} />
          <Text label="Reviewed by" value={currentReview.reviewedBy || ''} onChange={(reviewedBy) => setReview({ ...currentReview, reviewedBy })} />
          <Text label="Reviewed at" type="date" value={currentReview.reviewedAt?.slice(0, 10) || ''} onChange={(reviewedAt) => setReview({ ...currentReview, reviewedAt })} />
        </div>
        <TextArea label="Review notes" value={currentReview.notes || ''} onChange={(notes) => setReview({ ...currentReview, notes })} />
        <div className="space-y-3">
          {profile.sources.map((source) => {
            const sourceReview = currentReview.sourceReviews.find((item) => item.sourceId === source.id)!;
            const update = (patch: Partial<typeof sourceReview>) => setReview({ ...currentReview, sourceReviews: currentReview.sourceReviews.map((item) => item.sourceId === source.id ? { ...item, ...patch } : item) });
            return <div className="rounded-lg border bg-white p-3" key={source.id}><p className="mb-3 text-sm font-semibold">{source.title || source.id}</p><div className="grid gap-3 md:grid-cols-3"><Choice label="Source review" value={sourceReview.status} options={sourceReviewOptions} onChange={(status) => update({ status: status as typeof sourceReview.status })} /><Text label="Reviewed by" value={sourceReview.reviewedBy || ''} onChange={(reviewedBy) => update({ reviewedBy })} /><Text label="Reviewed at" type="date" value={sourceReview.reviewedAt?.slice(0, 10) || ''} onChange={(reviewedAt) => update({ reviewedAt })} /></div><TextArea label="Source review notes" value={sourceReview.notes || ''} onChange={(notes) => update({ notes })} /></div>;
          })}
        </div>
      </ProfileSection>

      <ProfileSection title="Curation and processing provenance">
        <div className="grid gap-3 md:grid-cols-2"><ReadOnly label="Authoring method" value={profile.provenance.authorship.method} /><ReadOnly label="Author type" value={profile.provenance.authorship.authorType} /><ReadOnly label="Curator" value={profile.provenance.authorship.curatorId} /><ReadOnly label="Research batch" value={profile.provenance.authorship.batchId} /><ReadOnly label="Authored at" value={profile.provenance.authorship.authoredAt} />{profile.provenance.processing ? <><ReadOnly label="Processing tool" value={profile.provenance.processing.tool} /><ReadOnly label="Processing actions" value={profile.provenance.processing.actions.join(', ')} /><ReadOnly label="Processing version" value={profile.provenance.processing.toolVersion} /></> : <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 md:col-span-2">Awaiting processing metadata. The API preserves authorship here; validation, normalization, checksum, and packaging metadata is attached only by the reviewed processor.</div>}</div>
      </ProfileSection>
    </section>
  );
}

function ActivityEditor({ item, update }: ItemProps<DreamCareerWorkActivity>) { return <><div className="grid gap-3 md:grid-cols-3"><Text label="Stable ID" value={item.id} onChange={(id) => update({ ...item, id })} /><Text label="Title" value={item.title} onChange={(title) => update({ ...item, title })} /><Choice label="Frequency" value={item.frequency} options={frequencyOptions} onChange={(frequency) => update({ ...item, frequency: frequency as DreamCareerWorkActivity['frequency'] })} /></div><TextArea label="Description" value={item.description} onChange={(description) => update({ ...item, description })} /><ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} /></>; }
function SettingEditor({ item, update }: ItemProps<DreamCareerWorkSetting>) { return <><div className="grid gap-3 md:grid-cols-3"><Text label="Stable ID" value={item.id} onChange={(id) => update({ ...item, id })} /><Text label="Environment" value={item.environment} onChange={(environment) => update({ ...item, environment })} /><Choice label="Schedule" value={item.schedule} options={['standard_hours', 'shifts', 'flexible', 'project_based', 'seasonal', 'varies']} onChange={(schedule) => update({ ...item, schedule: schedule as DreamCareerWorkSetting['schedule'] })} /><Choice label="Travel" value={item.travel} options={['none', 'occasional', 'frequent', 'varies']} onChange={(travel) => update({ ...item, travel: travel as DreamCareerWorkSetting['travel'] })} /><ListInput label="Work modes" value={item.workModes} onChange={(workModes) => update({ ...item, workModes: workModes as DreamCareerWorkSetting['workModes'] })} /><ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} /></div><TextArea label="Description" value={item.description} onChange={(description) => update({ ...item, description })} /></>; }

function PathwayEditor({ item, update }: ItemProps<DreamCareerEducationPathway>) {
  return <>
    <div className="grid gap-3 md:grid-cols-3">
      <Text label="Stable ID" value={item.id} onChange={(id) => update({ ...item, id })} />
      <Text label="Title" value={item.title} onChange={(title) => update({ ...item, title })} />
      <Choice label="Route type" value={item.routeType} options={['school_to_degree', 'school_to_diploma', 'school_to_vocational', 'postgraduate_specialization', 'apprenticeship', 'competitive_exam', 'portfolio', 'licence', 'mixed', 'other']} onChange={(routeType) => update({ ...item, routeType: routeType as DreamCareerEducationPathway['routeType'] })} />
    </div>
    <TextArea label="Description" value={item.description} onChange={(description) => update({ ...item, description })} />
    <ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} />
    <Collection title="Education timeline" items={item.timeline} create={() => emptyEducationStage(item.timeline.length + 1)} onChange={(timeline) => update({ ...item, timeline })} render={(stage, setStage) => <EducationStageEditor item={stage} update={setStage} />} />
    <Collection title="Entrance exams" items={item.entranceExams} create={emptyAdmissionExam} onChange={(entranceExams) => update({ ...item, entranceExams })} render={(exam, setExam) => <AdmissionExamEditor item={exam} update={setExam} />} />
  </>;
}

function EducationStageEditor({ item, update }: ItemProps<DreamCareerEducationStage>) {
  return <>
    <div className="grid gap-3 md:grid-cols-3">
      <Text label="Stable stage ID" value={item.id} onChange={(id) => update({ ...item, id })} />
      <NumberInput label="Order" value={item.order} onChange={(order) => update({ ...item, order })} />
      <Choice label="Stage" value={item.stageType} options={['grade_10', 'higher_secondary', 'diploma', 'certificate', 'undergraduate', 'postgraduate', 'doctoral', 'professional_training', 'apprenticeship', 'licence', 'entry_preparation']} onChange={(stageType) => update({ ...item, stageType: stageType as DreamCareerEducationStage['stageType'] })} />
      <Text label="Title" value={item.title} onChange={(title) => update({ ...item, title })} />
      <Choice label="Requirement" value={item.requirement} options={['required', 'commonly_expected', 'one_possible_route', 'optional', 'varies']} onChange={(requirement) => update({ ...item, requirement: requirement as DreamCareerEducationStage['requirement'] })} />
      <RangeEditor label="Typical duration in months" value={item.typicalDurationMonths} onChange={(typicalDurationMonths) => update({ ...item, typicalDurationMonths })} />
    </div>
    <TextArea label="Description" value={item.description} onChange={(description) => update({ ...item, description })} />
    <ListInput label="Qualification examples" value={item.qualificationExamples} multiline onChange={(qualificationExamples) => update({ ...item, qualificationExamples })} />
    <ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} />
    <Collection title="Higher Secondary stream choices" items={item.streamOptions} create={emptyStreamOption} onChange={(streamOptions) => update({ ...item, streamOptions })} render={(stream, setStream) => <StreamOptionEditor item={stream} update={setStream} />} />
  </>;
}

function StreamOptionEditor({ item, update }: ItemProps<DreamCareerStreamOption>) {
  return <div className="grid gap-3 md:grid-cols-3">
    <Choice label="Stream" value={item.stream} options={['science', 'commerce', 'humanities', 'vocational', 'any_stream', 'not_verified', 'not_applicable']} onChange={(stream) => update({ ...item, stream: stream as DreamCareerStreamOption['stream'] })} />
    <Choice label="Relevance" value={item.relevance} options={['required', 'accepted', 'helpful', 'not_required', 'varies']} onChange={(relevance) => update({ ...item, relevance: relevance as DreamCareerStreamOption['relevance'] })} />
    <ListInput label="Subjects" value={item.subjects} onChange={(subjects) => update({ ...item, subjects })} />
    <TextArea label="Notes" value={item.notes} onChange={(notes) => update({ ...item, notes })} />
    <ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} />
  </div>;
}

function AdmissionExamEditor({ item, update }: ItemProps<DreamCareerAdmissionExam>) {
  return <>
    <div className="grid gap-3 md:grid-cols-3">
      <Text label="Stable exam ID" value={item.id} onChange={(id) => update({ ...item, id })} />
      <Text label="Exam" value={item.name} onChange={(name) => update({ ...item, name })} />
      <Choice label="Requirement" value={item.requirement} options={['required', 'conditional', 'one_possible_route', 'optional', 'not_applicable']} onChange={(requirement) => update({ ...item, requirement: requirement as DreamCareerAdmissionExam['requirement'] })} />
      <Text label="Authority" value={item.authority} onChange={(authority) => update({ ...item, authority })} />
      <Text label="Official URL" type="url" value={item.officialUrl} onChange={(officialUrl) => update({ ...item, officialUrl })} />
      <ListInput label="Applies to stage IDs" value={item.appliesToStageIds} onChange={(appliesToStageIds) => update({ ...item, appliesToStageIds })} />
      <Choice label="Score type" value={item.scoreType} options={['rank', 'percentile', 'score', 'qualifying_status', 'portfolio_or_interview', 'varies']} onChange={(scoreType) => update({ ...item, scoreType: scoreType as DreamCareerAdmissionExam['scoreType'] })} />
      <Choice label="Score use" value={item.scoreUse} options={['eligibility', 'institution_access', 'seat_category', 'scholarship', 'selection', 'multiple', 'varies']} onChange={(scoreUse) => update({ ...item, scoreUse: scoreUse as DreamCareerAdmissionExam['scoreUse'] })} />
      <Text label="Verified at" type="date" value={item.verifiedAt} onChange={(verifiedAt) => update({ ...item, verifiedAt })} />
      <ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} />
    </div>
    <Collection title="Dated selection benchmarks" items={item.benchmarks} create={emptySelectionBenchmark} onChange={(benchmarks) => update({ ...item, benchmarks })} render={(benchmark, setBenchmark) => <div className="grid gap-3 md:grid-cols-3"><Text label="Stable benchmark ID" value={benchmark.id} onChange={(id) => setBenchmark({ ...benchmark, id })} /><NumberInput label="Year" value={benchmark.year} onChange={(year) => setBenchmark({ ...benchmark, year })} /><Text label="Category" value={benchmark.category} onChange={(category) => setBenchmark({ ...benchmark, category })} /><Text label="Geography" value={benchmark.geography} onChange={(geography) => setBenchmark({ ...benchmark, geography })} /><Choice label="Measure" value={benchmark.measure} options={['rank', 'percentile', 'score']} onChange={(measure) => setBenchmark({ ...benchmark, measure: measure as typeof benchmark.measure })} /><RangeEditor label="Selection range" value={benchmark.range} onChange={(range) => setBenchmark({ ...benchmark, range: range || { min: 0, max: 0 } })} /><TextArea label="Outcome" value={benchmark.outcome} onChange={(outcome) => setBenchmark({ ...benchmark, outcome })} /><ListInput label="Source IDs" value={benchmark.sourceIds} onChange={(sourceIds) => setBenchmark({ ...benchmark, sourceIds })} /></div>} />
  </>;
}

function SkillEditor({ item, update }: ItemProps<DreamCareerSkill>) { return <div className="grid gap-3 md:grid-cols-3"><Text label="Stable ID" value={item.id} onChange={(id) => update({ ...item, id })} /><Text label="Name" value={item.name} onChange={(name) => update({ ...item, name })} /><Choice label="Category" value={item.category} options={skillCategoryOptions} onChange={(category) => update({ ...item, category: category as DreamCareerSkill['category'] })} /><Choice label="Importance" value={item.importance} options={importanceOptions} onChange={(importance) => update({ ...item, importance: importance as DreamCareerSkill['importance'] })} /><TextArea label="How it is used" value={item.howUsed} onChange={(howUsed) => update({ ...item, howUsed })} /><ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} /></div>; }
function ProgressionEditor({ item, update }: ItemProps<DreamCareerTimelineStage>) {
  return <>
    <div className="grid gap-3 md:grid-cols-3">
      <Text label="Stable stage ID" value={item.id} onChange={(id) => update({ ...item, id })} />
      <NumberInput label="Order" value={item.order} onChange={(order) => update({ ...item, order })} />
      <Choice label="Level" value={item.level} options={progressionOptions} onChange={(level) => update({ ...item, level: level as DreamCareerTimelineStage['level'] })} />
      <Choice label="Track" value={item.track} options={['individual_contributor', 'management', 'leadership', 'research', 'independent', 'mixed', 'varies']} onChange={(track) => update({ ...item, track: track as DreamCareerTimelineStage['track'] })} />
      <ListInput label="Common titles" value={item.commonTitles} onChange={(commonTitles) => update({ ...item, commonTitles })} />
      <RangeEditor label="Typical experience in years (optional)" value={item.typicalExperienceYears} onChange={(typicalExperienceYears) => update({ ...item, typicalExperienceYears })} />
    </div>
    <TextArea label="Responsibilities" value={item.responsibilities} onChange={(responsibilities) => update({ ...item, responsibilities })} />
    <ListInput label="Progression signals" value={item.progressionSignals} multiline onChange={(progressionSignals) => update({ ...item, progressionSignals })} />
    <ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} />
  </>;
}

function InvestmentEditor({ item, update }: ItemProps<DreamCareerEducationCost>) {
  const durationEvidence = item.durationEvidence || 'program_duration';
  return <>
    <div className="grid gap-3 md:grid-cols-3">
      <Text label="Stable cost ID" value={item.id} onChange={(id) => update({ ...item, id })} />
      <Text label="Pathway ID" value={item.educationPathwayId} onChange={(educationPathwayId) => update({ ...item, educationPathwayId })} />
      <Text label="Education stage ID" value={item.educationStageId} onChange={(educationStageId) => update({ ...item, educationStageId })} />
      <Text label="Institution" value={item.institutionName} onChange={(institutionName) => update({ ...item, institutionName })} />
      <Text label="Programme" value={item.programName} onChange={(programName) => update({ ...item, programName })} />
      <Text label="Campus" value={item.campus || ''} onChange={(campus) => update({ ...item, campus: campus || null })} />
      <Choice label="Institution type" value={item.institutionType} options={['government', 'central_government', 'state_government', 'government_aided', 'private', 'deemed_university', 'online', 'training_provider', 'mixed', 'varies']} onChange={(institutionType) => update({ ...item, institutionType: institutionType as DreamCareerEducationCost['institutionType'] })} />
      <Choice label="Fee category" value={item.feeCategory} options={['published_regular', 'published_scholarship', 'published_subsidized', 'published_variable', 'estimated_program_cost', 'other']} onChange={(feeCategory) => update({ ...item, feeCategory: feeCategory as DreamCareerEducationCost['feeCategory'] })} />
      <Text label="Geography" value={item.geography} onChange={(geography) => update({ ...item, geography })} />
      <MoneyEditor value={item.amount} onChange={(amount) => update({ ...item, amount })} />
      <Choice label="Fee period" value={item.feePeriod} options={['total_program', 'year', 'semester', 'course', 'exam', 'varies']} onChange={(feePeriod) => update({ ...item, feePeriod: feePeriod as DreamCareerEducationCost['feePeriod'] })} />
      <Choice label="Duration evidence" value={durationEvidence} options={['program_duration', 'fee_coverage_period', 'not_published']} onChange={(value) => {
        const next = value as NonNullable<DreamCareerEducationCost['durationEvidence']>;
        update({ ...item, durationEvidence: next, durationMonths: next === 'not_published' ? null : item.durationMonths || { min: 0, max: 0 } });
      }} />
      {durationEvidence !== 'not_published' ? <RangeEditor label={durationEvidence === 'fee_coverage_period' ? 'Fee coverage period in months' : 'Program duration in months'} value={item.durationMonths || undefined} onChange={(durationMonths) => update({ ...item, durationMonths: durationMonths || { min: 0, max: 0 } })} /> : <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">No course duration will be shown to learners. Coverage details can remain in Includes.</div>}
      <Choice label="Cost basis" value={item.basis} options={['tuition_only', 'tuition_and_required_fees', 'estimated_program_cost', 'training_and_exam_fees']} onChange={(basis) => update({ ...item, basis: basis as DreamCareerEducationCost['basis'] })} />
      <Text label="As of" value={item.asOf} onChange={(asOf) => update({ ...item, asOf })} />
      <ListInput label="Includes" value={item.includes} multiline onChange={(includes) => update({ ...item, includes })} />
      <ListInput label="Excludes" value={item.excludes} multiline onChange={(excludes) => update({ ...item, excludes })} />
      <ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} />
    </div>
    <div className="rounded-lg border bg-slate-50 p-3">
      <h4 className="mb-3 text-sm font-semibold">Admission and score relationship</h4>
      <div className="grid gap-3 md:grid-cols-3">
        <Choice label="Admission basis" value={item.admissionRoute.basis} options={['entrance_exam', 'qualifying_marks', 'merit_and_counselling', 'management_quota', 'direct_admission', 'scholarship', 'mixed', 'not_applicable', 'varies']} onChange={(basis) => update({ ...item, admissionRoute: { ...item.admissionRoute, basis: basis as typeof item.admissionRoute.basis } })} />
        <ListInput label="Entrance exam IDs" value={item.admissionRoute.entranceExamIds} onChange={(entranceExamIds) => update({ ...item, admissionRoute: { ...item.admissionRoute, entranceExamIds } })} />
        <ListInput label="Benchmark IDs" value={item.admissionRoute.selectionBenchmarkIds} onChange={(selectionBenchmarkIds) => update({ ...item, admissionRoute: { ...item.admissionRoute, selectionBenchmarkIds } })} />
        <Choice label="Seat category" value={item.admissionRoute.seatCategory} options={['all_india_quota', 'state_quota', 'government_merit', 'private_merit', 'management', 'nri', 'scholarship', 'open', 'not_applicable', 'varies']} onChange={(seatCategory) => update({ ...item, admissionRoute: { ...item.admissionRoute, seatCategory: seatCategory as typeof item.admissionRoute.seatCategory } })} />
        <ListInput label="Score effects" value={item.admissionRoute.scoreEffects} onChange={(scoreEffects) => update({ ...item, admissionRoute: { ...item.admissionRoute, scoreEffects: scoreEffects as typeof item.admissionRoute.scoreEffects } })} />
        <Check label="Published fee changes with score" checked={item.admissionRoute.publishedFeeChangesWithScore} onChange={(publishedFeeChangesWithScore) => update({ ...item, admissionRoute: { ...item.admissionRoute, publishedFeeChangesWithScore } })} />
      </div>
      <TextArea label="Plain-language explanation" value={item.admissionRoute.description} onChange={(description) => update({ ...item, admissionRoute: { ...item.admissionRoute, description } })} />
    </div>
  </>;
}

function EarningsEditor({ item, update }: ItemProps<DreamCareerEarningsScenario>) { return <><div className="grid gap-3 md:grid-cols-3"><Text label="Stable ID" value={item.id} onChange={(id) => update({ ...item, id })} /><Choice label="Career stage" value={item.careerStage} options={['intern', 'trainee', 'junior', 'associate', 'mid_level', 'senior', 'lead', 'manager', 'director', 'executive', 'independent', 'all_levels', 'varies']} onChange={(careerStage) => update({ ...item, careerStage: careerStage as DreamCareerEarningsScenario['careerStage'] })} /><Choice label="Employment type" value={item.employmentType} options={['salaried', 'self_employed', 'contract', 'mixed', 'varies']} onChange={(employmentType) => update({ ...item, employmentType: employmentType as DreamCareerEarningsScenario['employmentType'] })} /><Text label="Geography" value={item.geography} onChange={(geography) => update({ ...item, geography })} /><MoneyEditor value={item.amount} onChange={(amount) => update({ ...item, amount })} /><Choice label="Basis" value={item.basis} options={['gross_salary', 'gross_compensation', 'reported_income', 'advertised_range']} onChange={(basis) => update({ ...item, basis: basis as DreamCareerEarningsScenario['basis'] })} /><Text label="As of" value={item.asOf} onChange={(asOf) => update({ ...item, asOf })} /><ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} /></div><ListInput label="Evidence notes and limitations" value={item.evidenceNotes || []} multiline onChange={(evidenceNotes) => update({ ...item, evidenceNotes })} /></>; }
function ReturnEditor({ item, update }: ItemProps<DreamCareerReturnScenario>) { return <><div className="grid gap-3 md:grid-cols-3"><Text label="Stable ID" value={item.id} onChange={(id) => update({ ...item, id })} /><Text label="Education cost ID" value={item.educationCostId} onChange={(educationCostId) => update({ ...item, educationCostId })} /><Text label="Earnings ID" value={item.earningsScenarioId} onChange={(earningsScenarioId) => update({ ...item, earningsScenarioId })} /><RangeEditor label="Payback in months" value={item.paybackMonths} onChange={(paybackMonths) => update({ ...item, paybackMonths: paybackMonths || { min: 0, max: 0 } })} /><Check label="Includes living costs" checked={item.includesLivingCosts} onChange={(includesLivingCosts) => update({ ...item, includesLivingCosts })} /><Check label="Includes foregone earnings" checked={item.includesForegoneEarnings} onChange={(includesForegoneEarnings) => update({ ...item, includesForegoneEarnings })} /><ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} /></div><ListInput label="Assumptions and caveats" value={item.assumptions} multiline onChange={(assumptions) => update({ ...item, assumptions })} /></>; }

function OutlookEditor({ item, update }: ItemProps<DreamCareerOutlookClaim>) { return <><div className="grid gap-3 md:grid-cols-4"><Text label="Geography" value={item.geography} onChange={(geography) => update({ ...item, geography })} /><NumberInput label="From year" value={item.fromYear} onChange={(fromYear) => update({ ...item, fromYear })} /><NumberInput label="To year" value={item.toYear} onChange={(toYear) => update({ ...item, toYear })} /><Choice label="Trend" value={item.trend} options={['declining', 'stable', 'growing', 'rapid_growth', 'uncertain', 'varies_by_sector']} onChange={(trend) => update({ ...item, trend: trend as DreamCareerOutlookClaim['trend'] })} /></div><TextArea label="Summary" value={item.summary} onChange={(summary) => update({ ...item, summary })} /><ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} /><Collection title="Outlook metrics" items={item.metrics} create={() => ({ name: '', value: 0, unit: 'other' as const })} onChange={(metrics) => update({ ...item, metrics })} render={(metric, setMetric) => <div className="grid gap-3 md:grid-cols-3"><Text label="Metric" value={metric.name} onChange={(name) => setMetric({ ...metric, name })} /><NumberInput label="Value" value={metric.value} onChange={(value) => setMetric({ ...metric, value })} /><Choice label="Unit" value={metric.unit} options={['percent', 'jobs', 'vacancies', 'index', 'other']} onChange={(unit) => setMetric({ ...metric, unit: unit as typeof metric.unit })} /></div>} /></>; }
function ExamEditor({ item, update }: ItemProps<DreamCareerExam>) { return <div className="grid gap-3 md:grid-cols-3"><Text label="Exam" value={item.name} onChange={(name) => update({ ...item, name })} /><Choice label="Requirement" value={item.requirement} options={['required', 'conditional', 'one_possible_route', 'optional', 'not_applicable']} onChange={(requirement) => update({ ...item, requirement: requirement as DreamCareerExam['requirement'] })} /><Text label="Authority" value={item.authority} onChange={(authority) => update({ ...item, authority })} /><Text label="Official URL" type="url" value={item.officialUrl} onChange={(officialUrl) => update({ ...item, officialUrl })} /><Text label="Applies to" value={item.appliesTo} onChange={(appliesTo) => update({ ...item, appliesTo })} /><Text label="Verified at" type="date" value={item.verifiedAt} onChange={(verifiedAt) => update({ ...item, verifiedAt })} /><ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} /></div>; }
function LicenceEditor({ item, update }: ItemProps<DreamCareerLicence>) { return <div className="grid gap-3 md:grid-cols-3"><Text label="Licence" value={item.name} onChange={(name) => update({ ...item, name })} /><Choice label="Requirement" value={item.requirement} options={['required', 'conditional', 'optional', 'varies']} onChange={(requirement) => update({ ...item, requirement: requirement as DreamCareerLicence['requirement'] })} /><Text label="Authority" value={item.authority} onChange={(authority) => update({ ...item, authority })} /><Text label="Official URL" type="url" value={item.officialUrl} onChange={(officialUrl) => update({ ...item, officialUrl })} /><Text label="Verified at" type="date" value={item.verifiedAt} onChange={(verifiedAt) => update({ ...item, verifiedAt })} /><ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} /></div>; }

function SimpleSourcedEditor({ item, update }: ItemProps<DreamCareerSpecialization>) { return <><div className="grid gap-3 md:grid-cols-2"><Text label="Stable ID" value={item.id} onChange={(id) => update({ ...item, id })} /><Text label="Title" value={item.title} onChange={(title) => update({ ...item, title })} /></div><TextArea label="Description" value={item.description} onChange={(description) => update({ ...item, description })} /><ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} /></>; }
function TradeoffEditor({ item, update }: ItemProps<DreamCareerTradeoff>) { return <><div className="grid gap-3 md:grid-cols-3"><Text label="Stable ID" value={item.id} onChange={(id) => update({ ...item, id })} /><Choice label="Category" value={item.category} options={['study_commitment', 'education_cost', 'competition', 'schedule', 'location', 'travel', 'physical_demands', 'emotional_demands', 'income_variability', 'regulation', 'technology_change', 'other']} onChange={(category) => update({ ...item, category: category as DreamCareerTradeoff['category'] })} /><Choice label="Impact" value={item.impact} options={['low', 'medium', 'high', 'varies']} onChange={(impact) => update({ ...item, impact: impact as DreamCareerTradeoff['impact'] })} /></div><TextArea label="Description" value={item.description} onChange={(description) => update({ ...item, description })} /><ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} /></>; }
function PersonEditor({ item, update }: ItemProps<DreamCareerPerson>) { return <><div className="grid gap-3 md:grid-cols-3"><Text label="Stable ID" value={item.id} onChange={(id) => update({ ...item, id })} /><Text label="Name" value={item.name} onChange={(name) => update({ ...item, name })} /><Choice label="Relationship" value={item.relationship} options={['same_role', 'field_leader', 'researcher', 'founder', 'public_service_leader', 'adjacent_role']} onChange={(relationship) => update({ ...item, relationship: relationship as DreamCareerPerson['relationship'] })} /><Text label="Country" value={item.country} onChange={(country) => update({ ...item, country })} /><Text label="Profile URL" type="url" value={item.profileUrl} onChange={(profileUrl) => update({ ...item, profileUrl })} /><ListInput label="Source IDs" value={item.sourceIds} onChange={(sourceIds) => update({ ...item, sourceIds })} /></div><TextArea label="Known for" value={item.knownFor} onChange={(knownFor) => update({ ...item, knownFor })} /><TextArea label="Why this person is relevant to learners" value={item.whyRelevant} onChange={(whyRelevant) => update({ ...item, whyRelevant })} /></>; }
function SourceEditor({ item, update }: ItemProps<DreamCareerProfileSource>) { return <div className="grid gap-3 md:grid-cols-3"><Text label="Stable source ID" value={item.id} onChange={(id) => update({ ...item, id })} /><Choice label="Source type" value={item.sourceType} options={['government', 'regulator', 'professional_body', 'official_statistics', 'education_provider', 'official_profile', 'research', 'industry_report', 'job_market_data', 'secondary_reference']} onChange={(sourceType) => update({ ...item, sourceType: sourceType as DreamCareerProfileSource['sourceType'] })} /><Text label="Title" value={item.title} onChange={(title) => update({ ...item, title })} /><Text label="Organization" value={item.organization} onChange={(organization) => update({ ...item, organization })} /><Text label="URL" type="url" value={item.url} onChange={(url) => update({ ...item, url })} /><Text label="Geography" value={item.geography} onChange={(geography) => update({ ...item, geography })} /><Text label="Published at" value={item.publishedAt || ''} onChange={(publishedAt) => update({ ...item, publishedAt: publishedAt || null })} /><Text label="Verified at" type="date" value={item.verifiedAt} onChange={(verifiedAt) => update({ ...item, verifiedAt })} /><Text label="Content SHA-256" value={item.contentHash} onChange={(contentHash) => update({ ...item, contentHash })} /></div>; }

type ItemProps<T> = { item: T; update: (item: T) => void };
function Collection<T>({ title, items, create, onChange, render }: { title?: string; items: T[]; create: () => T; onChange: (items: T[]) => void; render: (item: T, update: (item: T) => void) => React.ReactNode }) { return <div className="space-y-3">{title ? <h3 className="text-sm font-semibold">{title}</h3> : null}{items.map((item, index) => <div className="rounded-lg border bg-white p-3" key={index}><div className="mb-3 flex justify-end"><Button aria-label={`Remove ${title || 'item'} ${index + 1}`} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} size="icon" type="button" variant="ghost"><Trash2 className="size-4" /></Button></div>{render(item, (next) => onChange(items.map((current, itemIndex) => itemIndex === index ? next : current)))}</div>)}<Button onClick={() => onChange([...items, create()])} size="sm" type="button" variant="outline"><Plus />Add {title?.toLowerCase() || 'item'}</Button></div>; }
function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) { return <details className="rounded-xl border bg-white" open><summary className="cursor-pointer px-4 py-3 text-sm font-semibold">{title}</summary><div className="space-y-4 border-t p-4">{children}</div></details>; }
function Text({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-sm"><span className="mb-1 block font-medium text-slate-700">{label}</span><input className="h-10 w-full rounded-md border bg-white px-3" onChange={(event) => onChange(event.target.value)} type={type} value={value} /></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-sm"><span className="mb-1 block font-medium text-slate-700">{label}</span><textarea className="min-h-20 w-full rounded-md border bg-white px-3 py-2" onChange={(event) => onChange(event.target.value)} value={value} /></label>; }
function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="block text-sm"><span className="mb-1 block font-medium text-slate-700">{label}</span><input className="h-10 w-full rounded-md border bg-white px-3" onChange={(event) => onChange(Number(event.target.value || 0))} type="number" value={value} /></label>; }
function Choice({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) { return <label className="block text-sm"><span className="mb-1 block font-medium text-slate-700">{label}</span><select className="h-10 w-full rounded-md border bg-white px-3" onChange={(event) => onChange(event.target.value)} value={value}>{options.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select></label>; }
function ListInput({ label, value, onChange, multiline = false }: { label: string; value: string[]; onChange: (value: string[]) => void; multiline?: boolean }) { const text = multiline ? value.join('\n') : value.join(', '); const parse = (next: string) => next.split(multiline ? /\n/ : /,/).map((item) => item.trim()).filter(Boolean); return multiline ? <TextArea label={label} value={text} onChange={(next) => onChange(parse(next))} /> : <Text label={label} value={text} onChange={(next) => onChange(parse(next))} />; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex min-h-10 items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium"><input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />{label}</label>; }
function RangeEditor({ label, value, onChange }: { label: string; value?: { min: number; max: number }; onChange: (value: { min: number; max: number } | undefined) => void }) { return <fieldset><legend className="mb-1 text-sm font-medium text-slate-700">{label}</legend><div className="grid grid-cols-2 gap-2"><input aria-label={`${label} minimum`} className="h-10 rounded-md border px-3" onChange={(event) => onChange({ min: Number(event.target.value || 0), max: value?.max || 0 })} placeholder="Min" type="number" value={value?.min ?? ''} /><input aria-label={`${label} maximum`} className="h-10 rounded-md border px-3" onChange={(event) => onChange({ min: value?.min || 0, max: Number(event.target.value || 0) })} placeholder="Max" type="number" value={value?.max ?? ''} /></div></fieldset>; }
function MoneyEditor({ value, onChange }: { value: { currency: 'INR'; min: number; max: number }; onChange: (value: { currency: 'INR'; min: number; max: number }) => void }) { return <fieldset><legend className="mb-1 text-sm font-medium text-slate-700">Amount in INR</legend><div className="grid grid-cols-2 gap-2"><input aria-label="Minimum amount" className="h-10 rounded-md border px-3" onChange={(event) => onChange({ ...value, min: Number(event.target.value || 0) })} type="number" value={value.min} /><input aria-label="Maximum amount" className="h-10 rounded-md border px-3" onChange={(event) => onChange({ ...value, max: Number(event.target.value || 0) })} type="number" value={value.max} /></div></fieldset>; }
function ReadOnly({ label, value }: { label: string; value: string }) { return <div className="rounded-md border bg-slate-50 p-3"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-all text-sm">{value}</p></div>; }
function ValidationSummary({ errors }: { errors: string[] }) { return <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><div className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" />Profile needs attention</div><ul className="mt-2 list-disc space-y-1 pl-5">{errors.slice(0, 20).map((error) => <li key={error}>{error}</li>)}</ul></div>; }

function reconcileReview(profile: DreamCareerDetailProfileV3, review?: DreamCareerDetailProfileReview): DreamCareerDetailProfileReview { const byId = new Map((review?.sourceReviews || []).map((item) => [item.sourceId, item])); return { status: review?.status || 'pending', reviewedBy: review?.reviewedBy, reviewedAt: review?.reviewedAt, notes: review?.notes, sourceReviews: profile.sources.map((source) => byId.get(source.id) || { sourceId: source.id, status: 'pending' }) }; }
export function validateAdminProfile(profile: DreamCareerDetailProfileV3, review: DreamCareerDetailProfileReview, careerId: string): string[] {
  const errors: string[] = [];
  if (profile.careerId !== careerId) errors.push('Profile career ID must match ' + careerId + '.');
  if (profile.work.summary.trim().length < 80) errors.push('Work summary must be at least 80 characters.');
  if (profile.work.activities.length < 4) errors.push('Add at least four work activities.');
  if (!profile.work.settings.length) errors.push('Add at least one work setting.');
  if (!profile.educationPathways.length) errors.push('Add at least one education pathway.');
  for (const pathway of profile.educationPathways) {
    if (pathway.timeline[0]?.stageType !== 'grade_10') errors.push('Every education pathway must begin at Grade 10.');
    if (!pathway.timeline.some((stage) => stage.stageType === 'higher_secondary')) errors.push('Every education pathway must explain Higher Secondary stream choices.');
  }
  if (profile.skills.length < 5) errors.push('Add at least five skills.');
  if (profile.careerTimeline.stages.length < 4) errors.push('Add at least four ordered career timeline stages.');
  if (profile.specializations.length < 2) errors.push('Add at least two specialisations.');
  if (profile.tradeoffs.length < 3) errors.push('Add at least three trade-offs.');
  if (profile.notablePeople.length < 3) errors.push('Add at least three notable people.');
  const indianPeople = profile.notablePeople.filter((person) => person.country.trim().toLowerCase() === 'india');
  if (indianPeople.length < Math.max(2, Math.ceil(profile.notablePeople.length / 2))) errors.push('Notable people must include at least two Indian people and an Indian majority.');
  if (profile.sources.length < 3) errors.push('Add at least three evidence sources.');
  const sourceIds = profile.sources.map((source) => source.id);
  if (new Set(sourceIds).size !== sourceIds.length) errors.push('Evidence source IDs must be unique.');
  if (profile.sources.some((source) => !/^[a-f0-9]{64}$/.test(source.contentHash))) errors.push('Every source needs its acquired SHA-256 content hash.');
  const institutionTypes = new Set(profile.financials.educationCosts.map((item) => item.institutionType));
  if (!['government', 'central_government', 'state_government', 'government_aided'].some((type) => institutionTypes.has(type as DreamCareerEducationCost['institutionType']))) errors.push('Add a government or government-aided fee scenario.');
  if (!['private', 'deemed_university'].some((type) => institutionTypes.has(type as DreamCareerEducationCost['institutionType']))) errors.push('Add a private or deemed-university fee scenario.');
  for (const item of profile.financials.educationCosts) {
    const durationEvidence = item.durationEvidence || 'program_duration';
    if (item.durationMonths === null && durationEvidence !== 'not_published') errors.push(`Education cost ${item.id} needs duration evidence set to not published when duration is empty.`);
    if (item.durationMonths !== null && durationEvidence === 'not_published') errors.push(`Education cost ${item.id} must clear duration when its evidence is not published.`);
  }
  if (review.status === 'approved') {
    if (!review.reviewedBy || !review.reviewedAt) errors.push('Approved profiles require reviewer name and date.');
    for (const source of review.sourceReviews) if (source.status !== 'approved') errors.push('Approve source ' + source.sourceId + ' before approving the profile.');
  }
  const costIds = new Set(profile.financials.educationCosts.map((item) => item.id));
  const earningIds = new Set(profile.financials.earnings.map((item) => item.id));
  for (const item of profile.financials.returnOnEducation) {
    if (!costIds.has(item.educationCostId)) errors.push('ROI ' + item.id + ' references an unknown education cost.');
    if (!earningIds.has(item.earningsScenarioId)) errors.push('ROI ' + item.id + ' references unknown earnings evidence.');
  }
  return Array.from(new Set(errors));
}

export function createEmptyProfile(careerId: string): DreamCareerDetailProfileV3 { return { schemaVersion: 3, careerId, locale: 'en', work: { summary: '', whyItMatters: '', activities: [], settings: [] }, educationPathways: [], skills: [], careerTimeline: { model: 'illustrative', summary: '', stages: [] }, financials: { educationCosts: [], earnings: [], returnOnEducation: [] }, outlook: [], requirements: { regulation: { status: 'not_verified', jurisdiction: 'India', authorities: [], notes: '', sourceIds: [] }, governmentExams: [], licences: [] }, specializations: [], tradeoffs: [], notablePeople: [], tryThis: { title: '', purpose: '', durationMinutes: 30, cost: 'free', materials: [], steps: [], reflectionQuestions: [], safetyNotes: [] }, relatedCareerIds: [], courseQueries: [], sources: [], provenance: { authorship: { method: 'human_research', authorType: 'human_editor', curatorId: 'admin-editor', batchId: 'admin-draft', authoredAt: new Date().toISOString() } } }; }
const emptyActivity = (): DreamCareerWorkActivity => ({ id: '', title: '', description: '', frequency: 'varies', sourceIds: [] });
const emptySetting = (): DreamCareerWorkSetting => ({ id: '', environment: '', workModes: ['varies'], schedule: 'varies', travel: 'varies', description: '', sourceIds: [] });
const emptyPathway = (): DreamCareerEducationPathway => ({ id: '', title: '', routeType: 'mixed', description: '', timeline: [], entranceExams: [], sourceIds: [] });
const emptyEducationStage = (order: number): DreamCareerEducationStage => ({ id: '', order, stageType: order === 1 ? 'grade_10' : 'higher_secondary', title: '', description: '', requirement: 'one_possible_route', streamOptions: [], qualificationExamples: [], sourceIds: [] });
const emptyStreamOption = (): DreamCareerStreamOption => ({ stream: 'not_verified', relevance: 'varies', subjects: [], notes: '', sourceIds: [] });
const emptyAdmissionExam = (): DreamCareerAdmissionExam => ({ id: '', name: '', requirement: 'one_possible_route', authority: '', officialUrl: '', appliesToStageIds: [], scoreType: 'varies', scoreUse: 'varies', benchmarks: [], verifiedAt: '', sourceIds: [] });
const emptySelectionBenchmark = (): DreamCareerAdmissionExam['benchmarks'][number] => ({ id: '', year: new Date().getFullYear(), category: '', geography: 'India', measure: 'rank', range: { min: 0, max: 0 }, outcome: '', sourceIds: [] });
const emptySkill = (): DreamCareerSkill => ({ id: '', name: '', category: 'technical', importance: 'important', howUsed: '', sourceIds: [] });
const emptyProgression = (order: number): DreamCareerTimelineStage => ({ id: '', order, level: 'junior', track: 'individual_contributor', commonTitles: [], responsibilities: '', progressionSignals: [], sourceIds: [] });
const emptyInvestment = (): DreamCareerEducationCost => ({ id: '', educationPathwayId: '', educationStageId: '', institutionName: '', programName: '', campus: null, institutionType: 'varies', feeCategory: 'other', admissionRoute: { basis: 'varies', entranceExamIds: [], selectionBenchmarkIds: [], seatCategory: 'varies', scoreEffects: ['varies'], publishedFeeChangesWithScore: false, description: '' }, geography: 'India', amount: { currency: 'INR', min: 0, max: 0 }, feePeriod: 'total_program', durationMonths: null, durationEvidence: 'not_published', basis: 'estimated_program_cost', asOf: '', includes: [], excludes: [], sourceIds: [] });
const emptyEarnings = (): DreamCareerEarningsScenario => ({ id: '', careerStage: 'varies', employmentType: 'varies', geography: 'India', amount: { currency: 'INR', min: 0, max: 0 }, period: 'year', basis: 'reported_income', asOf: '', evidenceNotes: [], sourceIds: [] });
const emptyReturn = (): DreamCareerReturnScenario => ({ id: '', educationCostId: '', earningsScenarioId: '', method: 'simple_gross_payback', paybackMonths: { min: 0, max: 0 }, includesLivingCosts: false, includesForegoneEarnings: false, assumptions: [], sourceIds: [] });
const emptyOutlook = (): DreamCareerOutlookClaim => ({ geography: 'India', fromYear: new Date().getFullYear(), toYear: new Date().getFullYear(), trend: 'uncertain', summary: '', metrics: [], sourceIds: [] });
const emptyExam = (): DreamCareerExam => ({ name: '', requirement: 'conditional', authority: '', officialUrl: '', appliesTo: '', verifiedAt: '', sourceIds: [] });
const emptyLicence = (): DreamCareerLicence => ({ name: '', requirement: 'conditional', authority: '', officialUrl: '', verifiedAt: '', sourceIds: [] });
const emptySpecialization = (): DreamCareerSpecialization => ({ id: '', title: '', description: '', sourceIds: [] });
const emptyTradeoff = (): DreamCareerTradeoff => ({ id: '', category: 'other', impact: 'varies', description: '', sourceIds: [] });
const emptyPerson = (): DreamCareerPerson => ({ id: '', name: '', relationship: 'field_leader', knownFor: '', whyRelevant: '', country: 'India', profileUrl: '', sourceIds: [] });
const emptySource = (): DreamCareerProfileSource => ({ id: '', sourceType: 'secondary_reference', title: '', organization: '', url: '', geography: '', publishedAt: null, verifiedAt: '', contentHash: '' });
