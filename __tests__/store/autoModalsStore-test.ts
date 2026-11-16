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

// Exactly what the old persisted stores saved
const OLD_RATE_APP = JSON.stringify({
  state: { rateAppNextShowAt: 1000, rateAppShownAt: 900, rateAppShownCount: 2, rateAppDone: true },
  version: 0,
});
const OLD_FEEDBACK = JSON.stringify({
  state: { feedbackNextShowAt: 2000, feedbackShownAt: null, feedbackShownCount: 0, feedbackDone: false, feedbackLaunchCount: 4 },
  version: 0,
});
const OLD_NOTIF_REMINDER = JSON.stringify({
  state: { notifReminderNextShowAt: 3000, notifReminderShownAt: 2500, notifReminderShownCount: 1, notifReminderDone: false },
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

// Writes to the new store only (other stores load too)
const newStoreWrites = (storage: Record<'setItem', jest.Mock>) =>
  storage.setItem.mock.calls.filter(([name]) => name === 'auto-modals-storage');

beforeEach(() => {
  jest.clearAllMocks();
  useLanguageStore.setState({ language: 'en' });
});

describe('autoModalsStore — migration', () => {
  it('copies the 3 old stores over and removes them', () => {
    const { store, storage } = loadStore({
      'rate-app-storage': OLD_RATE_APP,
      'feedback-storage': OLD_FEEDBACK,
      'notif-reminder-storage': OLD_NOTIF_REMINDER,
    });

    const state = store.getState();
    expect(state.rateAppNextShowAt).toBe(1000);
    expect(state.rateAppShownAt).toBe(900);
    expect(state.rateAppShownCount).toBe(2);
    expect(state.rateAppDone).toBe(true);
    expect(state.feedbackNextShowAt).toBe(2000);
    expect(state.notifReminderNextShowAt).toBe(3000);
    expect(state.notifReminderShownCount).toBe(1);
    expect(state.updateShownCount).toBe(0);
    expect(state.isReady).toBe(true);

    expect(storage.removeItem).toHaveBeenCalledWith('rate-app-storage');
    expect(storage.removeItem).toHaveBeenCalledWith('feedback-storage');
    expect(storage.removeItem).toHaveBeenCalledWith('notif-reminder-storage');
  });

  it('drops feedbackLaunchCount', () => {
    const { store, storage } = loadStore({ 'feedback-storage': OLD_FEEDBACK });

    expect(store.getState()).not.toHaveProperty('feedbackLaunchCount');
    const written = JSON.parse(newStoreWrites(storage)[0][1]);
    expect(written.state).not.toHaveProperty('feedbackLaunchCount');
  });

  it('copies only the old stores that exist', () => {
    const { store, storage } = loadStore({ 'rate-app-storage': OLD_RATE_APP });

    expect(store.getState().rateAppDone).toBe(true);
    expect(store.getState().feedbackNextShowAt).toBeNull();
    expect(store.getState().notifReminderNextShowAt).toBeNull();
  });

  it('skips an unreadable old store without crashing, and still copies the others', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    const { store, storage } = loadStore({
      'rate-app-storage': '{not json',
      'feedback-storage': 'null',
      'notif-reminder-storage': OLD_NOTIF_REMINDER,
    });

    expect(store.getState().rateAppDone).toBe(false);
    expect(store.getState().feedbackNextShowAt).toBeNull();
    expect(store.getState().notifReminderNextShowAt).toBe(3000);
    expect(storage.removeItem).toHaveBeenCalledWith('rate-app-storage');
  });

  it('does nothing when the new store already exists', () => {
    const { store, storage } = loadStore({
      'auto-modals-storage': JSON.stringify({ state: { rateAppShownCount: 1 }, version: 0 }),
      'rate-app-storage': OLD_RATE_APP,
    });

    expect(store.getState().rateAppShownCount).toBe(1);
    expect(store.getState().rateAppDone).toBe(false);
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('does nothing on a fresh install', () => {
    const { store, storage } = loadStore({});

    expect(store.getState().rateAppDone).toBe(false);
    expect(newStoreWrites(storage)).toHaveLength(0);
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
});

describe('autoModalsStore — setAutoModals', () => {
  it('merges a patch and keeps the other keys', () => {
    useAutoModalsStore.getState().setAutoModals({ rateAppShownCount: 2 });
    useAutoModalsStore.getState().setAutoModals({ feedbackNextShowAt: 9999 });

    expect(useAutoModalsStore.getState().rateAppShownCount).toBe(2);
    expect(useAutoModalsStore.getState().feedbackNextShowAt).toBe(9999);
  });

  it('persists only the data keys', () => {
    useAutoModalsStore.getState().setAutoModals({ updateShownCount: 1 });

    const written = JSON.parse(mockSetItem.mock.calls.at(-1)[1]);
    expect(written.state.updateShownCount).toBe(1);
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
