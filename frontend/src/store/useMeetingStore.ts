import { create } from 'zustand';

type AVState = 'ON' | 'OFF' | 'DISABLED';

interface MeetingState {
  audio: AVState;
  video: AVState;
  members: number;
  hasNewChat: boolean;

  isInfoOpen: boolean;
  isMemberOpen: boolean;
  isChatOpen: boolean;
  isWorkspaceOpen: boolean;
  isCodeEditorOpen: boolean;
}

interface MeetingActions {
  setAudio: (state: AVState) => void;
  setVideo: (state: AVState) => void;
  setMembers: (count: number) => void;
  setHasNewChat: (state: boolean) => void;

  setIsOpen: (
    type: keyof Pick<
      MeetingState,
      | 'isInfoOpen'
      | 'isMemberOpen'
      | 'isChatOpen'
      | 'isWorkspaceOpen'
      | 'isCodeEditorOpen'
    >,
    state: boolean,
  ) => void;
}

export const useMeeingStore = create<MeetingState & MeetingActions>((set) => ({
  audio: 'OFF',
  video: 'OFF',
  members: 0,
  hasNewChat: false,

  isInfoOpen: false,
  isMemberOpen: false,
  isChatOpen: false,
  isWorkspaceOpen: false,
  isCodeEditorOpen: false,

  setAudio: (state) => set({ audio: state }),
  setVideo: (state) => set({ video: state }),
  setMembers: (count) => set({ members: count }),
  setHasNewChat: (state) => set({ hasNewChat: state }),

  setIsOpen: (type, state) => set({ [type]: state }),
}));
