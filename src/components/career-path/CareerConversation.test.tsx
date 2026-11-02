import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({get:vi.fn(),build:vi.fn()}));
vi.mock('@/i18n/language-provider',()=>({useTranslations:()=>({locale:'en'})}));
vi.mock('@/lib/dream-career-student-guide-api',()=>({getDreamCareerStudentGuide:mocks.get}));
vi.mock('@/lib/career-conversation-data',()=>({careerConversationFromGuides:mocks.build}));
vi.mock('./SlideshowOverlay',()=>({default:({slides,onRetry}:{slides:Array<{title:string;subtitle:string}>;onRetry?:()=>void})=><div>{slides.map((slide)=><p key={slide.title}>{slide.title} {slide.subtitle}</p>)}{onRetry ? <button onClick={onRetry}>Retry</button>:null}</div>}));
import CareerConversation from './CareerConversation';
describe('career conversation API loading',()=>{
 beforeEach(()=>{mocks.get.mockReset();mocks.build.mockReset().mockReturnValue([{title:'From API',subtitle:'Current career details'}]);});
 it('fetches current guides only when opened and passes their responses to the mapper',async()=>{
  mocks.get.mockResolvedValue({career:{id:'a'}});
  const view=render(<CareerConversation isOpen={false} careerIds={['a']} onClose={vi.fn()}/>);
  expect(mocks.get).not.toHaveBeenCalled();
  view.rerender(<CareerConversation isOpen careerIds={['a']} onClose={vi.fn()}/>);
  await screen.findByText('From API Current career details');
  expect(mocks.get).toHaveBeenCalledWith('a',expect.objectContaining({locale:'en',signal:expect.any(AbortSignal)}));
  expect(mocks.build).toHaveBeenCalledWith([{career:{id:'a'}}],'en');
 });
 it('shows retry instead of bundled content after failure',async()=>{
  mocks.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({career:{id:'a'}});
  render(<CareerConversation isOpen careerIds={['a']} onClose={vi.fn()}/>);
  await screen.findByText(/couldn’t load/);expect(mocks.build).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Retry'}));
  await screen.findByText('From API Current career details');expect(mocks.get).toHaveBeenCalledTimes(2);
 });
 it('aborts departed requests and does not display their data',async()=>{
  let resolve!:(value:unknown)=>void;
  mocks.get.mockImplementation(()=>new Promise((r)=>{resolve=r;}));
  const view=render(<CareerConversation isOpen careerIds={['a']} onClose={vi.fn()}/>);
  const signal=mocks.get.mock.calls[0][1].signal;
  view.unmount();expect(signal.aborted).toBe(true);resolve({career:{id:'a'}});
  await waitFor(()=>expect(mocks.build).not.toHaveBeenCalled());
 });
});
