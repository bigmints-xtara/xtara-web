'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
  Plus,
  Save,
  Server,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  adminAgentApi,
  type AdminAgentConfig,
  type AdminAgentProviderConfig,
  type AdminAgentProviderInput,
} from '@/lib/admin-agent';
import AdminAccessSettings from './AdminAccessSettings';

const empty: AdminAgentConfig = {
  enabled: false,
  providers: [],
  providerName: 'Compatible model',
  baseUrl: '',
  model: '',
  apiMode: 'chat_completions',
  hasApiKey: false,
};

function newProvider(): AdminAgentProviderConfig {
  return {
    id: `provider_${crypto.randomUUID().replaceAll('-', '_')}`,
    providerName: '',
    baseUrl: '',
    model: '',
    apiMode: 'chat_completions',
    models: [],
    hasApiKey: false,
  };
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<AdminAgentConfig>(empty);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [clearedKeys, setClearedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discoveringProviderId, setDiscoveringProviderId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminAgentApi.getConfig()
      .then(setConfig)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const activeProvider = useMemo(
    () => config.providers.find((provider) => provider.id === config.activeProviderId),
    [config.activeProviderId, config.providers],
  );

  const updateProvider = (id: string, update: Partial<AdminAgentProviderConfig>) => {
    setSaved(false);
    setConfig((current) => ({
      ...current,
      providers: current.providers.map((provider) => provider.id === id
        ? { ...provider, ...update }
        : provider),
    }));
  };

  const addProvider = () => {
    const provider = newProvider();
    setConfig((current) => ({
      ...current,
      activeProviderId: current.activeProviderId || provider.id,
      providers: [...current.providers, provider],
    }));
    setSaved(false);
    setError(null);
  };

  const removeProvider = (provider: AdminAgentProviderConfig) => {
    if (!confirm(`Remove “${provider.providerName || 'this provider'}”? The stored credential and model selection will be deleted when you save.`)) return;
    setConfig((current) => {
      const providers = current.providers.filter((item) => item.id !== provider.id);
      return {
        ...current,
        providers,
        activeProviderId: current.activeProviderId === provider.id
          ? providers[0]?.id
          : current.activeProviderId,
      };
    });
    setApiKeys((current) => {
      const next = { ...current };
      delete next[provider.id];
      return next;
    });
    setClearedKeys((current) => {
      const next = new Set(current);
      next.delete(provider.id);
      return next;
    });
    setSaved(false);
  };

  const discoverModels = async (provider: AdminAgentProviderConfig) => {
    if (!provider.baseUrl.trim() || discoveringProviderId || saving) return;
    setDiscoveringProviderId(provider.id);
    setSaved(false);
    setError(null);
    try {
      const pendingApiKey = apiKeys[provider.id]?.trim();
      const result = await adminAgentApi.discoverModels({
        providerId: provider.id,
        baseUrl: provider.baseUrl.trim(),
        ...(pendingApiKey ? { apiKey: pendingApiKey } : {}),
      });
      updateProvider(provider.id, {
        baseUrl: result.baseUrl,
        models: result.models,
        model: result.models.some((model) => model.id === provider.model)
          ? provider.model
          : result.models[0]?.id || '',
      });
    } catch (loadError) {
      updateProvider(provider.id, { models: [], model: '' });
      setError(loadError instanceof Error ? loadError.message : 'Unable to load compatible models');
    } finally {
      setDiscoveringProviderId(null);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const providers: AdminAgentProviderInput[] = config.providers.map((provider) => ({
        id: provider.id,
        providerName: provider.providerName,
        baseUrl: provider.baseUrl,
        model: provider.model,
        apiMode: provider.apiMode,
        models: provider.models,
        ...(apiKeys[provider.id]?.trim() ? { apiKey: apiKeys[provider.id].trim() } : {}),
        ...(clearedKeys.has(provider.id) ? { clearApiKey: true } : {}),
      }));
      const next = await adminAgentApi.updateConfig({
        enabled: config.enabled,
        activeProviderId: config.activeProviderId,
        providers,
      });
      setConfig(next);
      setApiKeys({});
      setClearedKeys(new Set());
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save provider settings');
    } finally {
      setSaving(false);
    }
  };

  const clearApiKey = (providerId: string) => {
    setClearedKeys((current) => new Set(current).add(providerId));
    setApiKeys((current) => ({ ...current, [providerId]: '' }));
    updateProvider(providerId, { hasApiKey: false, apiKeyHint: undefined });
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" />Loading settings…</div>;
  }

  const ready = Boolean(config.enabled && activeProvider?.baseUrl && activeProvider.model);
  const hasIncompleteProvider = config.providers.some((provider) => (
    !provider.providerName.trim() || !provider.baseUrl.trim() || !provider.model
  ));
  const saveDisabled = saving
    || Boolean(discoveringProviderId)
    || hasIncompleteProvider
    || (config.enabled && (!activeProvider?.baseUrl || !activeProvider.model));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Manage platform access, roles, compatible model providers, and administrative safeguards.</p>
        </div>

        <AdminAccessSettings />

        <form className="space-y-6" onSubmit={submit}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Agent providers</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Add OpenAI-compatible endpoints, load their available models, and choose which provider and model powers the admin assistant.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={ready ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''} variant="outline">
              <span className={`size-1.5 rounded-full ${ready ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />{ready ? 'Assistant enabled' : 'Not configured'}
            </Badge>
            <Button onClick={addProvider} type="button" variant="outline"><Plus />Add provider</Button>
            <Button disabled={saveDisabled} type="submit">{saving ? <Loader2 className="animate-spin" /> : <Save />}Save changes</Button>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <label className="flex cursor-pointer items-start gap-3">
              <input checked={config.enabled} className="mt-0.5 size-4 accent-[var(--primary)]" onChange={(event) => { setConfig((current) => ({ ...current, enabled: event.target.checked })); setSaved(false); }} type="checkbox" />
              <span><span className="block text-sm font-medium">Enable the admin assistant</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">The active provider and its selected model will be used for new chat turns.</span></span>
            </label>
            <div className="text-sm sm:text-right"><p className="font-medium">{activeProvider?.providerName || 'No active provider'}</p><p className="mt-1 text-xs text-muted-foreground">{activeProvider?.model || 'Select a model below'}</p></div>
          </CardContent>
        </Card>

        {config.providers.length ? (
          <div className="space-y-4">
            {config.providers.map((provider, index) => {
              const active = provider.id === config.activeProviderId;
              const discovering = discoveringProviderId === provider.id;
              const selectedModel = provider.models.find((model) => model.id === provider.model);
              return (
                <Card className={active ? 'border-primary/40 shadow-sm ring-1 ring-primary/10' : 'shadow-sm'} key={provider.id}>
                  <CardHeader className="gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-primary text-primary-foreground' : 'bg-primary/8 text-primary'}`}><Server className="size-5" /></div>
                      <div className="min-w-0"><CardTitle className="truncate text-base">{provider.providerName || `Provider ${index + 1}`}</CardTitle><CardDescription className="truncate">{provider.baseUrl || 'Endpoint not configured'}</CardDescription></div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {active ? <Badge className="border-primary/20 bg-primary/8 text-primary" variant="outline"><Check className="size-3" />Active</Badge> : <Button onClick={() => { setConfig((current) => ({ ...current, activeProviderId: provider.id })); setSaved(false); }} size="sm" type="button" variant="outline">Use for chat</Button>}
                      <Button aria-label={`Remove ${provider.providerName || `provider ${index + 1}`}`} onClick={() => removeProvider(provider)} size="icon-sm" type="button" variant="ghost"><Trash2 /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 p-5 sm:p-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="space-y-2 text-sm font-medium">Provider name<Input onChange={(event) => updateProvider(provider.id, { providerName: event.target.value })} placeholder="GX10" required value={provider.providerName} /></label>
                      <label className="space-y-2 text-sm font-medium">API mode<Select onValueChange={(value) => updateProvider(provider.id, { apiMode: value as AdminAgentProviderConfig['apiMode'] })} value={provider.apiMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="chat_completions">Chat Completions</SelectItem><SelectItem value="responses">Responses</SelectItem></SelectContent></Select></label>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="block space-y-2 text-sm font-medium">Base URL<Input onChange={(event) => updateProvider(provider.id, { baseUrl: event.target.value, model: '', models: [] })} placeholder="http://model-host:8080/v1" required type="url" value={provider.baseUrl} /><span className="block text-xs font-normal text-muted-foreground">The endpoint must expose an OpenAI-compatible models route.</span></label>
                      <label className="space-y-2 text-sm font-medium">API key <span className="font-normal text-muted-foreground">(optional)</span><Input autoComplete="new-password" onChange={(event) => { setApiKeys((current) => ({ ...current, [provider.id]: event.target.value })); setClearedKeys((current) => { const next = new Set(current); next.delete(provider.id); return next; }); setSaved(false); }} placeholder={provider.hasApiKey ? provider.apiKeyHint || 'Configured' : 'Not required for local endpoints'} type="password" value={apiKeys[provider.id] || ''} /></label>
                    </div>
                    <div className="space-y-2 text-sm font-medium">
                      <span>Model</span>
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <Select disabled={!provider.models.length || discovering || saving} onValueChange={(value) => updateProvider(provider.id, { model: value })} value={provider.model}>
                          <SelectTrigger aria-label={`Model for ${provider.providerName || `provider ${index + 1}`}`} className="w-full"><SelectValue placeholder={provider.models.length ? 'Select a model' : 'Load models first'} /></SelectTrigger>
                          <SelectContent>{provider.models.map((model) => <SelectItem key={model.id} value={model.id}>{model.displayName === model.id ? model.id : `${model.displayName} · ${model.id}`}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button disabled={discovering || saving || !provider.baseUrl.trim()} onClick={() => discoverModels(provider)} type="button" variant="outline">{discovering ? <Loader2 className="animate-spin" /> : null}Load models</Button>
                      </div>
                      {selectedModel ? <span className="block text-xs font-normal leading-5 text-muted-foreground">{[selectedModel.owner, selectedModel.role, selectedModel.contextLength ? `${selectedModel.contextLength.toLocaleString()} context` : null].filter(Boolean).join(' · ') || selectedModel.description}</span> : null}
                    </div>
                    {provider.hasApiKey ? <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2 text-xs"><span className="flex items-center gap-2 text-muted-foreground"><KeyRound className="size-3.5" />A credential is stored {provider.apiKeyHint ? `(${provider.apiKeyHint})` : ''}.</span><Button disabled={saving} onClick={() => clearApiKey(provider.id)} size="sm" type="button" variant="ghost">Remove key</Button></div> : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex flex-col items-center px-6 py-14 text-center"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary/8 text-primary"><Server className="size-5" /></div><h2 className="mt-4 font-semibold">Add your first provider</h2><p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">Connect GX10 or any OpenAI-compatible endpoint, load its models, and select the model used by the admin assistant.</p><Button className="mt-5" onClick={addProvider} type="button"><Plus />Add provider</Button></CardContent>
          </Card>
        )}

        {error ? <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p> : null}
        {saved ? <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 className="size-4" />Provider settings saved.</p> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="gap-4 py-5 shadow-none"><CardHeader className="px-5"><div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><LockKeyhole className="size-4" /></div><CardTitle className="text-base">Server-owned credentials</CardTitle><CardDescription>Every provider key is encrypted separately and is never returned to the browser or exposed to the chat model.</CardDescription></CardHeader></Card>
          <Card className="gap-4 py-5 shadow-none"><CardHeader className="px-5"><div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-primary/8 text-primary"><Bot className="size-4" /></div><CardTitle className="text-base">Explicit runtime selection</CardTitle><CardDescription>The Agents SDK receives the active provider and selected model for each new run. Switching here changes future chat turns.</CardDescription></CardHeader></Card>
        </div>
        </form>
      </div>
    </div>
  );
}
