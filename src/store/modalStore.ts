import { TextStyle, ViewStyle } from 'react-native';
import { create } from 'zustand';

export type ModalType = 'alert' | 'confirm' | 'fullscreen';

export type ModalButton = {
  label: string;
  action: string;
  buttonStyle?: ViewStyle;
  labelStyle?: TextStyle;
};

export type ModalOptions = {
  type: ModalType;
  title?: string;
  content?: string;
  component?: React.ReactNode;
  buttons?: ModalButton[];
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

  show: (options) =>
    new Promise((resolve) => {
      set({ visible: true, options, resolve });
    }),

  hide: (action) => {
    get().resolve?.(action);
    set({ visible: false, options: null, resolve: null });
  },
}));