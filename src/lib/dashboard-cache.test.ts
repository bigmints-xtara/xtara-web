import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateDashboardCache, readDashboardCache, reconcileDashboardCacheOwner, refreshDashboardCache } from './dashboard-cache';
const overview = {id:'health',title:'Health',summary:'Care',reasons:[],guidance:[],reflectionPrompt:'',careers:[]};
beforeEach(() => {
  const values = new Map<string,string>();
  vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key),clear:()=>values.clear()});
  invalidateDashboardCache();
});
describe('verified dashboard continuity', () => {
  it('deduplicates concurrent requests and scopes persisted readbacks by account and locale', async () => {
    let resolve!: (value: typeof overview) => void;
    let calls = 0;
    const load = () => { calls++; return new Promise<typeof overview>(done => { resolve = done; }); };
    const first = refreshDashboardCache('a','en',load);
    const second = refreshDashboardCache('a','en',load);
    expect(calls).toBe(1);
    resolve(overview); await Promise.all([first,second]);
    expect(readDashboardCache('a','en')?.overview).toEqual(overview);
    expect(readDashboardCache('b','en')).toBeNull();
    expect(readDashboardCache('a','ml')).toBeNull();
    expect(readDashboardCache('a','en',Date.now()+25*60*60*1000)).toBeNull();
    expect(JSON.parse(localStorage.getItem('xtara_dashboard_v1:en')!).owner).toBe('a');
  });
  it('retains a verified view on outage and accepts an authoritative empty response', async () => {
    await refreshDashboardCache('a','en',async()=>overview);
    await expect(refreshDashboardCache('a','en',async()=>{throw Error('offline');})).rejects.toThrow();
    expect(readDashboardCache('a','en')?.overview?.id).toBe('health');
    await refreshDashboardCache('a','en',async()=>null);
    expect(readDashboardCache('a','en')?.overview).toBeNull();
  });
  it('rejects malformed or future-dated persisted snapshots', () => {
    for (const value of ['{', JSON.stringify({owner:'a',locale:'en',savedAt:Date.now(),overview:{id:'broken'}}), JSON.stringify({owner:'a',locale:'en',savedAt:Date.now()+100000,overview})]) {
      localStorage.setItem('xtara_dashboard_v1:en',value);
      expect(readDashboardCache('a','en')).toBeNull();
    }
  });
  it('clears on sign-out and prevents in-flight reads restoring invalidated choices', async () => {
    reconcileDashboardCacheOwner('a');
    await refreshDashboardCache('a','en',async()=>overview);
    let resolve!: (value: typeof overview) => void;
    const request = refreshDashboardCache('a','en',()=>new Promise(done=>{resolve=done;}));
    reconcileDashboardCacheOwner(null);
    resolve(overview);
    await expect(request).rejects.toThrow();
    expect(readDashboardCache('a','en')).toBeNull();
    expect(localStorage.getItem('xtara_dashboard_v1:en')).toBeNull();
  });
});
