import { requestJson } from '../../../shared/lib/api/client'
import type {
  AppSetting,
  UpdateAppSettingInput,
} from '../types/appSetting'

export function fetchAppSetting(): Promise<AppSetting> {
  return requestJson<AppSetting>('/api/app-settings')
}

export function updateAppSetting(
  input: UpdateAppSettingInput,
): Promise<AppSetting> {
  return requestJson<AppSetting>('/api/app-settings', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}
