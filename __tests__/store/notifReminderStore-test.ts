import { useNotifReminderStore } from '@/store/notifReminderStore';

jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

beforeEach(() => {
  useNotifReminderStore.setState({ notifReminderAt: null, notifReminderCount: 0 });
});

describe('notifReminderStore — setNotifReminderAt', () => {
  it('starts with notifReminderAt as null', () => {
    expect(useNotifReminderStore.getState().notifReminderAt).toBeNull();
  });

  it('stores the timestamp', () => {
    useNotifReminderStore.getState().setNotifReminderAt(1234);
    expect(useNotifReminderStore.getState().notifReminderAt).toBe(1234);
  });

  it('clears it back to null', () => {
    useNotifReminderStore.setState({ notifReminderAt: 1234 });
    useNotifReminderStore.getState().setNotifReminderAt(null);
    expect(useNotifReminderStore.getState().notifReminderAt).toBeNull();
  });
});

describe('notifReminderStore — setNotifReminderCount', () => {
  it('starts with notifReminderCount as 0', () => {
    expect(useNotifReminderStore.getState().notifReminderCount).toBe(0);
  });

  it('stores the count', () => {
    useNotifReminderStore.getState().setNotifReminderCount(2);
    expect(useNotifReminderStore.getState().notifReminderCount).toBe(2);
  });
});
