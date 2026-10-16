import { test, expect } from '@playwright/test';
test('키보드로 조건을 조합하고 가로 넘침 없이 표시한다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('list', { name: '방송 목록' }).getByRole('listitem')).toHaveCount(6);
  const search = page.getByRole('searchbox', { name: '방송 검색' });
  await search.focus();
  await page.keyboard.type('React');
  await search.press('Tab');
  await expect(page.getByRole('combobox', { name: '정렬' })).toBeFocused();
  await page.getByRole('combobox', { name: '정렬' }).selectOption('title-asc');
  await page.getByRole('button', { name: '새벽 React 작업실 즐겨찾기' }).click();
  const favorites = page.getByRole('checkbox', { name: '즐겨찾기만' });
  await favorites.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('list', { name: '방송 목록' }).getByRole('listitem')).toHaveCount(1);
  await page.keyboard.press('Space');
  await expect(page.getByRole('list', { name: '방송 목록' }).getByRole('listitem')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('오류 이후 다시 시도하면 정상 목록으로 복구한다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('listitem')).toHaveCount(6);
  await page.getByRole('combobox', { name: '실험 데이터' }).selectOption('error');
  await page.getByRole('button', { name: '다시 불러오기' }).click();
  await expect(page.getByRole('alert')).toContainText('방송을 불러오지 못했습니다.');
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('listitem')).toHaveCount(6);
});
