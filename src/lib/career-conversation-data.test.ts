import { describe, expect, it } from 'vitest';
import { careerConversationFromGuides } from './career-conversation-data';
import type { DreamCareerStudentGuideResponse } from '@/types/dream-career-student-guide';
function guide() {
 const byQuestion = Object.fromEntries(['whatYouDo','dayInLife','subjects','educationRoutes','skills','earnings','starterActivity'].map((id) => [id,{status:'available',evidence:{sourceIds:['official']}}]));
 return {
  career:{id:'engineer',title:'API career title',summary:'API overview'},
  coverage:{byQuestion},resolved:{labels:{subjects:[{id:'math',label:'Mathematics'}],skills:[{id:'testing',label:'Testing'}]}},
  guide:{aboutCareer:{whatYouDo:'API work explanation',activities:[{title:'Design a wing',description:'Check how air moves around it.',sourceIds:['official']}],dayInLife:[],earnings:[{careerStage:'junior',geography:'Kerala',amountMin:20000,amountMax:30000,currency:'INR',period:'month',asOf:'2026-01-01',sourceIds:['official']}]},howToGetThere:{subjects:[{subjectId:'math',guidance:'API subject advice',gradeIds:['grade11','grade12'],sourceIds:['official']}],educationRoutes:[{title:'API degree route',description:'API course requirements',sourceIds:['official']}]},whatYouCanDoNow:{skills:[{skillId:'testing',howUsed:'API skill use',sourceIds:['official']}],starterActivity:{title:'API activity',description:'API activity instructions',sourceIds:['official']}},sources:[{id:'official',reviewStatus:'reviewed',label:'Official source',url:'https://example.edu/route',staleAfter:'2099-01-01'}]},
 } as unknown as DreamCareerStudentGuideResponse;
}
describe('published guide conversation data', () => {
 it('uses actual guide fields, retaining pay context and source links', () => {
  const slides = careerConversationFromGuides([guide()],'en');
  const rendered=JSON.stringify(slides);
  for (const value of ['API overview','API course requirements','API activity instructions','Mathematics','11, 12','API skill use','Kerala','2026-01-01','20,000–30,000','Official source']) expect(rendered).toContain(value);
  expect(slides.find((item)=>item.title==='What could you earn?')?.content[0].sources?.[0].url).toBe('https://example.edu/route');
  expect(rendered).not.toMatch(/Grade 8|assessment noticed|Career Direction|game|growth outlook/);
 });
 it('does not leak stale or missing sections, pending salary sources or empty topic headings', () => {
  const response=guide();
  response.coverage.byQuestion.educationRoutes.status='stale';
  response.coverage.byQuestion.starterActivity.status='missing';
  response.guide.sources[0].reviewStatus='pending';
  const slides=careerConversationFromGuides([response],'en');
  expect(JSON.stringify(slides)).not.toContain('API course requirements');
  expect(slides.some((item)=>item.title==='Something to try')).toBe(false);
  expect(slides.some((item)=>item.title==='What could you earn?')).toBe(false);
 });
 it('keeps a sparse guide honest and localizes prompts without inventing facts', () => {
  const response=guide();
  for(const item of Object.values(response.coverage.byQuestion)) item.status='missing';
  const slides=careerConversationFromGuides([response],'hi');
  expect(slides).toHaveLength(1);expect(slides[0].title).toBe('इन करियर पर बात करें');
  expect(slides[0].content[0].subtitle).toBe('API overview');
 });
});
