import axios from 'axios'

import { API } from '@/api/api'
import type { LoginRequest, LoginResponse } from '@/types/auth'

export const API_SignIn = async (values: LoginRequest): Promise<LoginResponse> => {
  const res = await axios.post<LoginResponse>(`${API}/api/v1/auth/login`, values)
  return res.data
}
