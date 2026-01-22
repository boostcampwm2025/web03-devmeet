import { MeetingForm } from '@/types/forms';

interface ValidateResult {
  ok: boolean;
  message: string;
}

// 회의 생성 폼 데이터 검증
export const [MIN_PARTICIPANTS, MAX_PARTICIPANTS] = [1, 100];
const [MAX_TITLE, MIN_PASSWORD, MAX_PASSWORD] = [100, 6, 16];

export const validateMeetingForm = (formData: MeetingForm): ValidateResult => {
  const { max_participants, title, password } = formData;
  const result = { ok: false, message: '' };

  if (
    max_participants < MIN_PARTICIPANTS ||
    max_participants > MAX_PARTICIPANTS
  ) {
    result.message = '최대 인원을 확인해주세요';
    return result;
  }

  // 회의명, 비밀번호에 대한 유효성 검사 조건 추가 필요
  if (title.trim().length === 0 || title.length > MAX_TITLE) {
    result.message = '회의명을 확인해주세요';
    return result;
  }

  if (
    password &&
    (password.length > MAX_PASSWORD || password.length < MIN_PASSWORD)
  ) {
    result.message = '비밀번호를 확인해주세요';
    return result;
  }

  result.ok = true;
  return result;
};
