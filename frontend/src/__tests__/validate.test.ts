import { validateMeetingForm } from '@/utils/validate';
import { MeetingForm } from '@/types/forms';

describe('validate', () => {
  const baseForm: MeetingForm = {
    max_participants: 5,
    title: '테스트 회의',
    password: '123456',
  };

  test('정상적인 폼 데이터면 ok=true를 반환한다', () => {
    const result = validateMeetingForm(baseForm);

    expect(result.ok).toBe(true);
    expect(result.message).toBe('');
  });

  test('참가 인원이 허용 범위를 벗어나면 실패한다', () => {
    const result = validateMeetingForm({
      ...baseForm,
      max_participants: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toBe('최대 인원을 확인해주세요');
  });

  test('회의명이 비어있거나 너무 길면 실패한다', () => {
    const emptyTitleResult = validateMeetingForm({
      ...baseForm,
      title: '   ',
    });

    expect(emptyTitleResult.ok).toBe(false);
    expect(emptyTitleResult.message).toBe('회의명을 확인해주세요');

    const longTitleResult = validateMeetingForm({
      ...baseForm,
      title: 'a'.repeat(101),
    });

    expect(longTitleResult.ok).toBe(false);
    expect(longTitleResult.message).toBe('회의명을 확인해주세요');
  });

  test('비밀번호 길이가 조건을 만족하지 않으면 실패한다', () => {
    const shortPasswordResult = validateMeetingForm({
      ...baseForm,
      password: '123',
    });

    expect(shortPasswordResult.ok).toBe(false);
    expect(shortPasswordResult.message).toBe('비밀번호를 확인해주세요');

    const longPasswordResult = validateMeetingForm({
      ...baseForm,
      password: 'a'.repeat(20),
    });

    expect(longPasswordResult.ok).toBe(false);
    expect(longPasswordResult.message).toBe('비밀번호를 확인해주세요');
  });

  test('비밀번호가 없어도 유효한 폼으로 처리된다', () => {
    const result = validateMeetingForm({
      ...baseForm,
      password: '',
    });

    expect(result.ok).toBe(true);
    expect(result.message).toBe('');
  });
});
