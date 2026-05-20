// notificationsService wraps the notifee native library — no pure logic to unit test directly.
// scheduleNotificationsService and createNotificationsChannels will be mocked and exercised
// indirectly in __tests__/store/notificationsStore-test.ts and __tests__/hooks/useNotificationsSync-test.ts

describe('notificationsService', () => {
  it.todo('covered indirectly via notificationsStore and useNotificationsSync tests');
});
