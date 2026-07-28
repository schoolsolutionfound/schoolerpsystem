import { apiClient } from './client';

export async function syncLoginApi() {
  return apiClient('/auth/login-sync', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function changePasswordApi(newPassword: string) {
  return apiClient('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
}
