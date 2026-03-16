import { create } from 'zustand';

export type ModalType = 'alert' | 'confirm' | 'bottomSheet' | 'fullscreen';

export type ModalButton = {
  label: string;
  action: string;
  destructive?: boolean;
  style?: 'primary' | 'secondary';
};

export type ModalOptions = {
  type: ModalType;
  title?: string;
  content?: string;
  component?: React.ReactNode;
  buttons?: ModalButton[];
  size?: number; // only for bottomSheet — 0 to 1
};

interface ModalStore {
  visible: boolean;
  options: ModalOptions | null;
  resolve: ((action: string) => void) | null;
  show: (options: ModalOptions) => Promise<string>;
  hide: (action: string) => void;
}

export const useModalStore = create<ModalStore>((set, get) => ({
  visible: false,
  options: null,
  resolve: null,

  // Returns a Promise that resolves when the user taps a button
  show: (options) =>
    new Promise((resolve) => {
      set({ visible: true, options, resolve });
    }),

  // Resolves the promise with the action and closes the modal
  hide: (action) => {
    get().resolve?.(action);
    set({ visible: false, options: null, resolve: null });
  },
}));