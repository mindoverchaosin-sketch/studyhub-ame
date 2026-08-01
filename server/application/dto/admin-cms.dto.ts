export type AdminCmsErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'DATABASE_ERROR' | 'PERMISSION_ERROR';

export type AdminCmsErrorDTO = {
  code: AdminCmsErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type AdminCmsSuccessDTO<T> = {
  success: true;
  data: T;
};

export type AdminCmsErrorResponseDTO = {
  success: false;
  error: AdminCmsErrorDTO;
};

export type AdminCmsResponse<T> = AdminCmsSuccessDTO<T> | AdminCmsErrorResponseDTO;
