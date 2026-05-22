import { ModalOptions, useModalStore } from '@/store/modalStore';

const OPTS: ModalOptions = { type: 'alert', title: 'Test', content: 'Hello' };
const CONFIRM_OPTS: ModalOptions = {
  type: 'confirm',
  title: 'Confirm',
  buttons: [
    { label: 'OK', action: 'ok' },
    { label: 'Cancel', action: 'cancel' },
  ],
};

beforeEach(() => {
  useModalStore.setState({ visible: false, options: null, resolve: null });
});

describe('modalStore — show', () => {
  it('starts with visible false and no options', () => {
    const { visible, options } = useModalStore.getState();
    expect(visible).toBe(false);
    expect(options).toBeNull();
  });

  it('show() sets visible true and stores options', () => {
    useModalStore.getState().show(OPTS);
    const { visible, options } = useModalStore.getState();
    expect(visible).toBe(true);
    expect(options).toEqual(OPTS);
  });

  it('show() returns a promise that resolves when hide() is called', async () => {
    const promise = useModalStore.getState().show(CONFIRM_OPTS);
    useModalStore.getState().hide('ok');
    await expect(promise).resolves.toBe('ok');
  });
});

describe('modalStore — hide', () => {
  it('hide() resets visible, options and resolve to initial state', async () => {
    const promise = useModalStore.getState().show(OPTS);
    useModalStore.getState().hide('dismiss');
    await promise;
    const { visible, options, resolve } = useModalStore.getState();
    expect(visible).toBe(false);
    expect(options).toBeNull();
    expect(resolve).toBeNull();
  });

  it('hide() resolves with the action string passed', async () => {
    const promise = useModalStore.getState().show(OPTS);
    useModalStore.getState().hide('cancel');
    await expect(promise).resolves.toBe('cancel');
  });
});
