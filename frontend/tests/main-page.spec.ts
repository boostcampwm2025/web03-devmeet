import { expect, test } from '@playwright/test';

test('메인 페이지 렌더링 테스트', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // 상단바 렌더링
  await expect(page.getByRole('banner')).toBeVisible();

  // 회의 시작 섹션 렌더링
  await expect(
    page.getByRole('heading', { name: '새 회의 시작' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: '시작하기' })).toBeVisible();

  // 회의 참여하기 섹션 렌더링
  await expect(
    page.getByRole('heading', { name: '회의 참여하기' }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: '회의 코드 또는 링크' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: '참여하기' })).toBeVisible();
});

test('비로그인 시 회의 생성 실패 테스트', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // 회의 시작하기 버튼 클릭 -> 회의 생성 실패 모달 표시
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(
    page.getByRole('heading', { name: '회의 생성 실패' }),
  ).toBeVisible();
});
