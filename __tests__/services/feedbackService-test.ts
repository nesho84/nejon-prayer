import { FEEDBACK_URL } from '@/constants/links';
import { sendFeedback } from '@/services/feedbackService';
import NetInfo from '@react-native-community/netinfo';

jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn() }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '2.3.5' } },
}));

const netInfoFetch = NetInfo.fetch as jest.Mock;

function mockResponse(status: number) {
  (globalThis.fetch as jest.Mock).mockResolvedValue({ status, text: () => Promise.resolve('') });
}

beforeEach(() => {
  globalThis.fetch = jest.fn();
  netInfoFetch.mockResolvedValue({ isConnected: true });
});

describe('sendFeedback', () => {
  it('POSTs the answers plus version, language, platform and an empty honeypot', async () => {
    mockResponse(201);

    await sendFeedback({ rating: 4, answers: { most_used: ['qibla'] }, message: 'Hi', language: 'ar' });

    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(FEEDBACK_URL);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      rating: 4,
      answers: { most_used: ['qibla'] },
      message: 'Hi',
      appVersion: '2.3.5',
      language: 'ar',
      website: '',
    });
    expect(['android', 'ios']).toContain(body.platform);
  });

  it('returns { ok: true } on 201', async () => {
    mockResponse(201);
    await expect(sendFeedback({ rating: 5, language: 'en' })).resolves.toEqual({ ok: true });
  });

  it('returns rateLimited on 429', async () => {
    mockResponse(429);
    await expect(sendFeedback({ rating: 5, language: 'en' })).resolves.toEqual({ error: 'rateLimited' });
  });

  it.each([400, 404, 413, 422, 500])('returns server on %i', async (status) => {
    mockResponse(status);
    await expect(sendFeedback({ rating: 5, language: 'en' })).resolves.toEqual({ error: 'server' });
  });

  it('returns offline without calling fetch when there is no connection', async () => {
    netInfoFetch.mockResolvedValueOnce({ isConnected: false });
    await expect(sendFeedback({ rating: 5, language: 'en' })).resolves.toEqual({ error: 'offline' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns server instead of throwing when fetch rejects', async () => {
    (globalThis.fetch as jest.Mock).mockRejectedValue(new Error('Aborted'));
    await expect(sendFeedback({ rating: 5, language: 'en' })).resolves.toEqual({ error: 'server' });
  });
});
