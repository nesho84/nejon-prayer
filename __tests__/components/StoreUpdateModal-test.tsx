import { showStoreUpdateModal } from '@/components/StoreUpdateModal';
import { useAutoModalsStore } from '@/store/autoModalsStore';
import { useModalStore } from '@/store/modalStore';
import { openStoreListing } from '@/utils/system';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@/utils/system', () => ({ openStoreListing: jest.fn() }));
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  return { MaterialDesignIcons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }) };
});

const NOW = new Date('2026-11-16T12:00:00').getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

const show = () => useModalStore.getState().show as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  useModalStore.setState({ visible: false, show: jest.fn(), hide: jest.fn() } as any);
  useAutoModalsStore.setState({ storeUpdateNextShowAt: null, storeUpdateShownAt: null, storeUpdateShownCount: 0 });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('showStoreUpdateModal — show', () => {
  it('shows a dismissable alert with "Later" and "Open Store"', () => {
    showStoreUpdateModal();

    expect(show()).toHaveBeenCalledTimes(1);
    const options = show().mock.calls[0][0];
    expect(options.type).toBe('alert');
    expect(options.dismissable).toBeUndefined();
    expect(options.buttons.map((b: any) => b.action)).toEqual(['later', 'openStore']);
  });

  it('"Open Store" opens the store listing', () => {
    showStoreUpdateModal();
    show().mock.calls[0][0].buttons.find((b: any) => b.action === 'openStore').onPress();
    expect(openStoreListing).toHaveBeenCalledTimes(1);
  });
});

describe('showStoreUpdateModal — recorded on show', () => {
  it('1st and 2nd show come back next launch, the 3rd waits 3 days', () => {
    showStoreUpdateModal();
    expect(useAutoModalsStore.getState().storeUpdateShownCount).toBe(1);
    expect(useAutoModalsStore.getState().storeUpdateShownAt).toBe(NOW);
    expect(useAutoModalsStore.getState().storeUpdateNextShowAt).toBeNull();

    showStoreUpdateModal();
    expect(useAutoModalsStore.getState().storeUpdateShownCount).toBe(2);
    expect(useAutoModalsStore.getState().storeUpdateNextShowAt).toBeNull();

    showStoreUpdateModal();
    expect(useAutoModalsStore.getState().storeUpdateShownCount).toBe(3);
    expect(useAutoModalsStore.getState().storeUpdateNextShowAt).toBe(NOW + 3 * DAY_MS);
  });

  it('keeps waiting 3 days after every later show', () => {
    useAutoModalsStore.setState({ storeUpdateShownCount: 5 });
    showStoreUpdateModal();
    expect(useAutoModalsStore.getState().storeUpdateShownCount).toBe(6);
    expect(useAutoModalsStore.getState().storeUpdateNextShowAt).toBe(NOW + 3 * DAY_MS);
  });

  it('from Settings, nothing is recorded', () => {
    showStoreUpdateModal(true);

    expect(show()).toHaveBeenCalledTimes(1);
    expect(useAutoModalsStore.getState().storeUpdateShownCount).toBe(0);
    expect(useAutoModalsStore.getState().storeUpdateShownAt).toBeNull();
    expect(useAutoModalsStore.getState().storeUpdateNextShowAt).toBeNull();
  });
});
