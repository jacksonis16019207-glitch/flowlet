const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export type ApiFieldError = {
  field: string
  message: string
}

export type ApiErrorResponse = {
  code: string
  message: string
  fieldErrors: ApiFieldError[]
}

export class ApiRequestError extends Error {
  status: number
  code?: string
  fieldErrors: ApiFieldError[]

  constructor(
    status: number,
    message: string,
    options?: {
      code?: string
      fieldErrors?: ApiFieldError[]
    },
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = options?.code
    this.fieldErrors = options?.fieldErrors ?? []
  }
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const errorResponse = await parseApiErrorResponse(response)

    throw new ApiRequestError(
      response.status,
      errorResponse?.message ?? `Request failed: ${response.status}`,
      {
        code: errorResponse?.code,
        fieldErrors: errorResponse?.fieldErrors,
      },
    )
  }

  return response.json() as Promise<T>
}

async function parseApiErrorResponse(
  response: Response,
): Promise<ApiErrorResponse | null> {
  const contentType = response.headers.get('content-type')

  if (!contentType?.includes('application/json')) {
    return null
  }

  try {
    return (await response.json()) as ApiErrorResponse
  } catch {
    return null
  }
}
