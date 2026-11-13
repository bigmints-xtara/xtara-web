import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { pursueCareer } from '@/lib/career-pursuit-api';
import { LanguageProvider } from '@/i18n/language-provider';
import SignupPage from './page';

const { account, push } = vi.hoisted(() => ({ account: { uid:'learner-1', isAnonymous:false, getIdToken:vi.fn(async () => 'test-token') }, push:vi.fn() }));
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword:vi.fn(), linkWithCredential:vi.fn(), updateProfile:vi.fn(),
  EmailAuthProvider:{credential:vi.fn()},
}));
vi.mock('@/lib/firebase-client', () => ({ getFirebaseAuth:() => ({currentUser:account}) }));
vi.mock('@/context/AuthContext', () => ({useAuth:() => ({configurationError:null})}));
vi.mock('@/lib/api/auth', () => ({createApiSession:vi.fn(),getPostAuthDestination:vi.fn()}));
vi.mock('@/lib/career-pursuit-api', () => ({pursueCareer:vi.fn()}));
vi.mock('@/components/careers/explorer/PursuitContext', () => ({default:() => <p>Selected API career</p>}));
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  const values = new Map<string,string>();
  const storage = {getItem:(key:string) => values.get(key) ?? null,setItem:(key:string,value:string) => values.set(key,value),removeItem:(key:string) => values.delete(key)};
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});
  Object.defineProperty(window,'localStorage',{configurable:true,value:storage});
  vi.mocked(useRouter).mockReturnValue({push} as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('pursueCareer=civil&directionId=build') as ReturnType<typeof useSearchParams>);
  vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({user:account} as unknown as Awaited<ReturnType<typeof createUserWithEmailAndPassword>>);
});

describe('career pursuit signup continuation', () => {
  it('retries a failed career save without creating the account again', async () => {
    vi.mocked(pursueCareer).mockRejectedValueOnce(new Error('readback failed')).mockResolvedValueOnce({pursuit:null,direction:null});
    const {container} = render(<LanguageProvider initialLocale="en"><SignupPage /></LanguageProvider>);
    fireEvent.change(container.querySelector('#signup-name')!, {target:{value:'Learner'}});
    fireEvent.change(container.querySelector('#signup-email')!, {target:{value:'learner@example.test'}});
    fireEvent.change(container.querySelector('#signup-password')!, {target:{value:'test-password'}});
    fireEvent.submit(container.querySelector('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t save');
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Pursue this career'}));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
    expect(createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(pursueCareer).toHaveBeenCalledTimes(2);
    expect(pursueCareer).toHaveBeenLastCalledWith('civil','build','learner-1');
  });

  it('preserves both selected identities when switching to login', () => {
    render(<LanguageProvider initialLocale="en"><SignupPage /></LanguageProvider>);
    expect(screen.getByRole('link',{name:'Log in'})).toHaveAttribute('href','/login?pursueCareer=civil&directionId=build&next=%2Fdashboard');
  });
});
