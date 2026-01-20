'use client';

import Button from '@/components/common/button';
import Modal from '@/components/common/Modal';
import MeetingFormModal from '@/components/landing/MeetingFormModal';
import { useUserStore } from '@/store/useUserStore';
import { useState } from 'react';

type ModalState = 'SETTING' | 'DENIED' | null;

export default function StartMeetingButton() {
  const { isLoggedIn, isLoaded } = useUserStore();
  const [currentModal, setCurrentModal] = useState<ModalState>(null);

  const closeModal = () => setCurrentModal(null);

  const checkIsLoggedIn = () => {
    if (!isLoaded) return;

    if (isLoggedIn) setCurrentModal('SETTING');
    else setCurrentModal('DENIED');
  };

  return (
    <>
      <Button onClick={checkIsLoggedIn}>시작하기</Button>

      {currentModal === 'SETTING' && (
        <MeetingFormModal closeModal={closeModal} />
      )}

      {currentModal === 'DENIED' && (
        <Modal
          title="회의 생성 실패"
          cancelText="확인"
          onCancel={closeModal}
          isLightMode
        >
          로그인이 필요합니다
        </Modal>
      )}
    </>
  );
}
