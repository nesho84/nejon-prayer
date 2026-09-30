import { canRequestStoreReview, requestStoreReview } from '@/services/storeReviewService';
import { selectStoreReviewEligible, useStoreReviewStore } from '@/store/storeReviewStore';

jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@/services/storeReviewService', () => ({
  canRequestStoreReview: jest.fn(),
  requestStoreReview: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '2.3.4' } },
}));

const mockCanRequest = canRequestStoreReview as jest.Mock;
const mockRequest = requestStoreReview as jest.Mock;

const NOW = new Date('2026-09-30T12:00:00');
const DAY_MS = 24 * 60 * 60 * 1000;

// Passes every gate: 5 open days, no prior prompt
const ELIGIBLE = { openDays: 5, lastOpenDate: null, promptCount: 0, lastPromptAt: null, lastPromptVersion: null };

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(NOW);
  mockCanRequest.mockResolvedValue(true);
  mockRequest.mockResolvedValue(undefined);
  useStoreReviewStore.setState(ELIGIBLE);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('storeReviewStore — recordAppOpen', () => {
  beforeEach(() => {
    useStoreReviewStore.getState().reset();
  });

  it('counts the first open and remembers the day', () => {
    useStoreReviewStore.getState().recordAppOpen();

    expect(useStoreReviewStore.getState().openDays).toBe(1);
    expect(useStoreReviewStore.getState().lastOpenDate).toBe('2026-09-30');
  });

  it('ignores repeat opens on the same local day', () => {
    useStoreReviewStore.getState().recordAppOpen();
    useStoreReviewStore.getState().recordAppOpen();

    expect(useStoreReviewStore.getState().openDays).toBe(1);
  });

  it('counts an open on a new day', () => {
    useStoreReviewStore.getState().recordAppOpen();
    jest.setSystemTime(new Date('2026-10-01T09:00:00'));
    useStoreReviewStore.getState().recordAppOpen();

    expect(useStoreReviewStore.getState().openDays).toBe(2);
    expect(useStoreReviewStore.getState().lastOpenDate).toBe('2026-10-01');
  });
});

describe('storeReviewStore — maybeRequestStoreReview', () => {
  it('requests and records the attempt when every gate passes', async () => {
    await useStoreReviewStore.getState().maybeRequestStoreReview();

    expect(mockRequest).toHaveBeenCalledTimes(1);
    const { promptCount, lastPromptAt, lastPromptVersion } = useStoreReviewStore.getState();
    expect(promptCount).toBe(1);
    expect(lastPromptAt).toBe(NOW.getTime());
    expect(lastPromptVersion).toBe('2.3.4');
  });

  it('does nothing and records nothing when hasAction() is false', async () => {
    mockCanRequest.mockResolvedValue(false);

    await useStoreReviewStore.getState().maybeRequestStoreReview();

    expect(mockRequest).not.toHaveBeenCalled();
    expect(useStoreReviewStore.getState().promptCount).toBe(0);
    expect(useStoreReviewStore.getState().lastPromptAt).toBeNull();
  });

  it('writes the counters BEFORE requesting, so a failed request cannot retry', async () => {
    let countAtRequest = -1;
    mockRequest.mockImplementation(async () => {
      countAtRequest = useStoreReviewStore.getState().promptCount;
    });

    await useStoreReviewStore.getState().maybeRequestStoreReview();

    expect(countAtRequest).toBe(1);
  });

  it('claims synchronously — two concurrent calls produce one request', async () => {
    await Promise.all([
      useStoreReviewStore.getState().maybeRequestStoreReview(),
      useStoreReviewStore.getState().maybeRequestStoreReview(),
    ]);

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(useStoreReviewStore.getState().promptCount).toBe(1);
  });

  describe('open days gate (5)', () => {
    it('blocks at 4 days', async () => {
      useStoreReviewStore.setState({ openDays: 4 });

      await useStoreReviewStore.getState().maybeRequestStoreReview();

      expect(mockRequest).not.toHaveBeenCalled();
    });

    it('allows at exactly 5 days', async () => {
      useStoreReviewStore.setState({ openDays: 5 });

      await useStoreReviewStore.getState().maybeRequestStoreReview();

      expect(mockRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('no lifetime cap', () => {
    it('never blocks on promptCount — it only counts attempts', async () => {
      useStoreReviewStore.setState({ promptCount: 99, lastPromptAt: NOW.getTime() - 200 * DAY_MS, lastPromptVersion: '2.0.0' });

      await useStoreReviewStore.getState().maybeRequestStoreReview();

      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(useStoreReviewStore.getState().promptCount).toBe(100);
    });
  });

  describe('14-day gap', () => {
    it('blocks at exactly 14 days', async () => {
      useStoreReviewStore.setState({ promptCount: 1, lastPromptAt: NOW.getTime() - 14 * DAY_MS, lastPromptVersion: '2.0.0' });

      await useStoreReviewStore.getState().maybeRequestStoreReview();

      expect(mockRequest).not.toHaveBeenCalled();
    });

    it('allows just past 14 days', async () => {
      useStoreReviewStore.setState({ promptCount: 1, lastPromptAt: NOW.getTime() - 14 * DAY_MS - 1, lastPromptVersion: '2.0.0' });

      await useStoreReviewStore.getState().maybeRequestStoreReview();

      expect(mockRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('per-version gate', () => {
    it('blocks when already prompted on this app version', async () => {
      useStoreReviewStore.setState({ promptCount: 1, lastPromptAt: NOW.getTime() - 200 * DAY_MS, lastPromptVersion: '2.3.4' });

      await useStoreReviewStore.getState().maybeRequestStoreReview();

      expect(mockRequest).not.toHaveBeenCalled();
    });

    it('allows a new version once the gap has passed', async () => {
      useStoreReviewStore.setState({ promptCount: 1, lastPromptAt: NOW.getTime() - 200 * DAY_MS, lastPromptVersion: '2.3.3' });

      await useStoreReviewStore.getState().maybeRequestStoreReview();

      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(useStoreReviewStore.getState().lastPromptVersion).toBe('2.3.4');
    });
  });
});

describe('storeReviewStore — selectStoreReviewEligible', () => {
  it('is true when every gate passes', () => {
    expect(selectStoreReviewEligible(useStoreReviewStore.getState())).toBe(true);
  });

  it('ignores promptCount', () => {
    useStoreReviewStore.setState({ ...ELIGIBLE, promptCount: 99 });

    expect(selectStoreReviewEligible(useStoreReviewStore.getState())).toBe(true);
  });

  it('is false when any single gate fails', () => {
    const fails = [
      { openDays: 4 },
      { promptCount: 1, lastPromptAt: NOW.getTime() - 14 * DAY_MS, lastPromptVersion: '2.0.0' },
      { promptCount: 1, lastPromptAt: NOW.getTime() - 200 * DAY_MS, lastPromptVersion: '2.3.4' },
    ];

    fails.forEach((override) => {
      useStoreReviewStore.setState({ ...ELIGIBLE, ...override });
      expect(selectStoreReviewEligible(useStoreReviewStore.getState())).toBe(false);
    });
  });
});

describe('storeReviewStore — makeEligible', () => {
  const EXHAUSTED = { openDays: 1, promptCount: 3, lastPromptAt: NOW.getTime(), lastPromptVersion: '2.3.4' };

  it('sets the counters so every gate passes', () => {
    useStoreReviewStore.setState(EXHAUSTED);
    expect(selectStoreReviewEligible(useStoreReviewStore.getState())).toBe(false);

    useStoreReviewStore.getState().makeEligible();

    const { openDays, promptCount, lastPromptAt, lastPromptVersion } = useStoreReviewStore.getState();
    expect({ openDays, promptCount, lastPromptAt, lastPromptVersion }).toEqual({
      openDays: 5,
      promptCount: 0,
      lastPromptAt: null,
      lastPromptVersion: null,
    });
    expect(selectStoreReviewEligible(useStoreReviewStore.getState())).toBe(true);
  });

  it('lets the very next trigger request a review', async () => {
    useStoreReviewStore.setState(EXHAUSTED);
    useStoreReviewStore.getState().makeEligible();

    await useStoreReviewStore.getState().maybeRequestStoreReview();

    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it('leaves lastOpenDate alone', () => {
    useStoreReviewStore.setState({ ...EXHAUSTED, lastOpenDate: '2026-09-29' });

    useStoreReviewStore.getState().makeEligible();

    expect(useStoreReviewStore.getState().lastOpenDate).toBe('2026-09-29');
  });
});

describe('storeReviewStore — reset', () => {
  it('clears every counter back to its initial value', () => {
    useStoreReviewStore.setState({ openDays: 9, lastOpenDate: '2026-09-29', promptCount: 2, lastPromptAt: 123, lastPromptVersion: '2.3.3' });

    useStoreReviewStore.getState().reset();

    const { openDays, lastOpenDate, promptCount, lastPromptAt, lastPromptVersion } = useStoreReviewStore.getState();
    expect({ openDays, lastOpenDate, promptCount, lastPromptAt, lastPromptVersion }).toEqual({
      openDays: 0,
      lastOpenDate: null,
      promptCount: 0,
      lastPromptAt: null,
      lastPromptVersion: null,
    });
  });
});
