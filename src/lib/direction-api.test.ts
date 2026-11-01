import { beforeEach, expect, it, vi } from 'vitest';
import { createAreaDirectionPlan } from './direction';
const mocks = vi.hoisted(() => ({ put: vi.fn(), get: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ xtaraApi: mocks }));
import { saveDirectionToApi } from './direction-api';
beforeEach(() => vi.clearAllMocks());
it('requires durable direction readback before returning success', async () => {
  const plan = createAreaDirectionPlan('technology');
  mocks.put.mockResolvedValue({ direction: plan });
  mocks.get.mockResolvedValue({ direction: null });
  await expect(saveDirectionToApi(plan)).rejects.toThrow('readback');
  mocks.get.mockResolvedValue({ direction: plan });
  await expect(saveDirectionToApi(plan)).resolves.toEqual(plan);
  expect(mocks.get).toHaveBeenCalledWith('/me/direction');
});
