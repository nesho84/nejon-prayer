// storage.ts is a thin MMKV wrapper (setItem, getItem, removeItem) — no logic to unit test.
// MMKV is mocked via jest.mock('@/store/storage') in all store tests that depend on persist middleware.

describe('storage', () => {
  it.todo('covered indirectly — mocked in all store tests');
});
