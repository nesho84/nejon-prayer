import { useNotifReminderStore } from '@/store/notifReminderStore';

jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

beforeEach(() => {
  useNotifReminderStore.setState({ notifReminderNextShowAt: null, notifReminderShownAt: null, notifReminderShownCount: 0, notifReminderDone: false });
});

describe('notifReminderStore — setters', () => {
  it('starts with nothing recorded', () => {
    const state = useNotifReminderStore.getState();
    expect(state.notifReminderNextShowAt).toBeNull();
    expect(state.notifReminderShownAt).toBeNull();
    expect(state.notifReminderShownCount).toBe(0);
    expect(state.notifReminderDone).toBe(false);
  });

  it('stores and clears the next-show time', () => {
    useNotifReminderStore.getState().setNotifReminderNextShowAt(9999);
    expect(useNotifReminderStore.getState().notifReminderNextShowAt).toBe(9999);
    useNotifReminderStore.getState().setNotifReminderNextShowAt(null);
    expect(useNotifReminderStore.getState().notifReminderNextShowAt).toBeNull();
  });

  it('stores the shown timestamp and count', () => {
    useNotifReminderStore.getState().setNotifReminderShownAt(5678);
    useNotifReminderStore.getState().setNotifReminderShownCount(2);
    expect(useNotifReminderStore.getState().notifReminderShownAt).toBe(5678);
    expect(useNotifReminderStore.getState().notifReminderShownCount).toBe(2);
  });

  it('sets notifReminderDone to true', () => {
    useNotifReminderStore.getState().setNotifReminderDone(true);
    expect(useNotifReminderStore.getState().notifReminderDone).toBe(true);
  });
});
