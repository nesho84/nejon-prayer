import { sendFeedback } from '@/services/feedbackService';
import { useAutoModalsStore } from '@/store/autoModalsStore';
import { useLanguageStore } from '@/store/languageStore';
import { mmkvStorage } from '@/store/storage';

jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@/services/feedbackService', () => ({
  sendFeedback: jest.fn(),
}));

const mockSendFeedback = sendFeedback as jest.Mock;
const mockSetItem = mmkvStorage.setItem as jest.Mock;

// Exactly what an old persisted store saved
const OLD_RATE_APP = JSON.stringify({
  state: { rateAppNextShowAt: 1000, rateAppShownAt: 900, rateAppShownCount: 2, rateAppDone: true },
  version: 0,
});

// Load a fresh copy of the store over a storage mock that keeps what's written, like MMKV
const loadStore = (initialItems: Record<string, string>) => {
  const items = { ...initialItems };
  let store: typeof useAutoModalsStore = useAutoModalsStore;
  let storage: Record<'getItem' | 'setItem' | 'removeItem', jest.Mock> = mmkvStorage as any;
  jest.isolateModules(() => {
    storage = require('@/store/storage').mmkvStorage;
    storage.getItem.mockImplementation((name: string) => items[name] ?? null);
    storage.setItem.mockImplementation((name: string, value: string) => {
      items[name] = value;
    });
    storage.removeItem.mockImplementation((name: string) => {
      delete items[name];
    });
    store = require('@/store/autoModalsStore').useAutoModalsStore;
  });
  return { store, storage };
};

beforeEach(() => {
  jest.clearAllMocks();
  useLanguageStore.setState({ language: 'en' });
});

describe('autoModalsStore — old stores', () => {
  it('deletes the 3 old stores without carrying their values over', () => {
    const { store, storage } = loadStore({
      'auto-modals-storage': JSON.stringify({ state: { storeReviewShownCount: 1 }, version: 0 }),
      'rate-app-storage': OLD_RATE_APP,
    });

    expect(storage.removeItem).toHaveBeenCalledWith('rate-app-storage');
    expect(storage.removeItem).toHaveBeenCalledWith('feedback-storage');
    expect(storage.removeItem).toHaveBeenCalledWith('notif-reminder-storage');
    expect(store.getState().storeReviewShownCount).toBe(1);
    expect(store.getState().storeReviewDone).toBe(false);
    expect(store.getState().isReady).toBe(true);
  });
});

describe('autoModalsStore — setAutoModals', () => {
  it('merges a patch and keeps the other keys', () => {
    useAutoModalsStore.getState().setAutoModals({ storeReviewShownCount: 2 });
    useAutoModalsStore.getState().setAutoModals({ feedbackNextShowAt: 9999 });

    expect(useAutoModalsStore.getState().storeReviewShownCount).toBe(2);
    expect(useAutoModalsStore.getState().feedbackNextShowAt).toBe(9999);
  });

  it('persists only the data keys', () => {
    useAutoModalsStore.getState().setAutoModals({ storeUpdateShownCount: 1 });

    const written = JSON.parse(mockSetItem.mock.calls.at(-1)[1]);
    expect(written.state.storeUpdateShownCount).toBe(1);
    expect(written.state).not.toHaveProperty('isReady');
  });
});

describe('autoModalsStore — submitFeedback', () => {
  beforeEach(() => {
    useAutoModalsStore.setState({ feedbackDone: false });
  });

  it('sends the answers with the current language', async () => {
    mockSendFeedback.mockResolvedValue({ ok: true });
    useLanguageStore.setState({ language: 'ar' });

    await useAutoModalsStore.getState().submitFeedback({ rating: 4, answers: { donation_interest: 'maybe' } });

    expect(mockSendFeedback).toHaveBeenCalledWith({ rating: 4, answers: { donation_interest: 'maybe' }, language: 'ar' });
  });

  it('marks feedback as done and returns { ok } on success', async () => {
    mockSendFeedback.mockResolvedValue({ ok: true });

    const result = await useAutoModalsStore.getState().submitFeedback({ rating: 5 });

    expect(result).toEqual({ ok: true });
    expect(useAutoModalsStore.getState().feedbackDone).toBe(true);
  });

  it.each(['offline', 'rateLimited', 'server'])('returns the %s error and stays not done', async (error) => {
    mockSendFeedback.mockResolvedValue({ error });

    const result = await useAutoModalsStore.getState().submitFeedback({ rating: 5 });

    expect(result).toEqual({ error });
    expect(useAutoModalsStore.getState().feedbackDone).toBe(false);
  });
});
