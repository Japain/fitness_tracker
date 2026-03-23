import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../api/client', () => ({
  apiRequest: vi.fn(),
  fetchCsrfToken: vi.fn().mockResolvedValue(undefined),
  getCsrfToken: vi.fn().mockReturnValue('mock-csrf-token'),
}));

vi.mock('swr', () => ({
  mutate: vi.fn(),
}));

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    value: online,
    writable: true,
    configurable: true,
  });
}

async function freshQueue() {
  vi.resetModules();

  const { requestQueue } = await import('../../api/requestQueue');
  const { apiRequest } = await import('../../api/client');
  return { requestQueue, apiRequest: vi.mocked(apiRequest) };
}

describe('RequestQueue', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setOnline(true);
  });

  describe('enqueue()', () => {
    it('adds the request to localStorage when offline', async () => {
      setOnline(false);
      const { requestQueue } = await freshQueue();

      await requestQueue.enqueue('/api/workouts', 'POST', { notes: 'test' });

      expect(requestQueue.pendingCount).toBe(1);
      const stored = JSON.parse(localStorage.getItem('fitness-tracker:request-queue') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].url).toBe('/api/workouts');
      expect(stored[0].method).toBe('POST');
    });

    it('does NOT call apiRequest when offline', async () => {
      setOnline(false);
      const { requestQueue, apiRequest } = await freshQueue();

      await requestQueue.enqueue('/api/workouts', 'POST', {});

      expect(apiRequest).not.toHaveBeenCalled();
    });

    it('calls apiRequest immediately when online', async () => {
      setOnline(true);
      const { requestQueue, apiRequest } = await freshQueue();
      apiRequest.mockResolvedValue({});

      await requestQueue.enqueue('/api/workouts/123/exercises', 'POST', { exerciseId: 'abc' });

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/workouts/123/exercises',
        { method: 'POST', body: { exerciseId: 'abc' } },
      );
      expect(requestQueue.pendingCount).toBe(0);
    });

    it('removes the request from the queue after successful processing', async () => {
      setOnline(true);
      const { requestQueue, apiRequest } = await freshQueue();
      apiRequest.mockResolvedValue({});

      await requestQueue.enqueue('/api/test', 'POST', {});

      expect(requestQueue.pendingCount).toBe(0);
      const stored = JSON.parse(localStorage.getItem('fitness-tracker:request-queue') || '[]');
      expect(stored).toHaveLength(0);
    });
  });

  describe('localStorage persistence', () => {
    it('loads persisted queue items on initialization', async () => {
      const queued = [
        {
          id: 'test-id-1',
          url: '/api/workouts',
          method: 'POST',
          body: {},
          timestamp: Date.now(),
          retries: 0,
        },
      ];
      localStorage.setItem('fitness-tracker:request-queue', JSON.stringify(queued));

      setOnline(false);
      const { requestQueue } = await freshQueue();

      expect(requestQueue.pendingCount).toBe(1);
    });

    it('updates localStorage after each state change', async () => {
      setOnline(false);
      const { requestQueue } = await freshQueue();

      await requestQueue.enqueue('/api/test', 'DELETE', {});

      const stored = JSON.parse(localStorage.getItem('fitness-tracker:request-queue') || '[]');
      expect(stored).toHaveLength(1);
    });
  });

  describe('retry and drop logic', () => {
    it('retries failed requests and drops after MAX_RETRIES (3) attempts total', async () => {
      setOnline(true);
      const { requestQueue, apiRequest } = await freshQueue();

      apiRequest.mockRejectedValue(new Error('Server error'));

      // Mock setTimeout to call callback immediately (avoids exponential backoff delays)
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void) => {
        fn();
        return 0;
      }) as typeof setTimeout);

      try {
        await requestQueue.enqueue('/api/test', 'POST', {});

        // Request dropped after MAX_RETRIES failures
        expect(requestQueue.pendingCount).toBe(0);
        // 3 calls total: retries goes 0→1→2→3>=MAX_RETRIES, drops
        expect(apiRequest).toHaveBeenCalledTimes(3);
      } finally {
        setTimeoutSpy.mockRestore();
      }
    });
  });
});
