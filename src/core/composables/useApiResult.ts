import { plainToInstance } from "class-transformer";
import { validateSync, ValidationError } from "class-validator";
import type { BaseApiResponseDto } from "@dto/BaseApiResponseDto";
import { ApiStatusEnum } from "@shared/enum/result.enum";

export async function useApiResultuseApiResult<T, R = unknown>(
  request: Promise<R>,
  ResponseDto: new () => BaseApiResponseDto<T>,
  onError?: (code?: string, message?: string) => void
): Promise<T | null> {
  try {
    const raw = await request;

    // 1) JSON → DTO 인스턴스
    const dto = plainToInstance(ResponseDto, raw);

    // 2) DTO 스펙 검증
    const errors: ValidationError[] = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      console.error("[useApiResult] DTO validation failed:", errors);
      throw new Error("INVALID_RESPONSE");
    }

    // 3) API 레벨 status 검사
    if (dto.status !== ApiStatusEnum.SUCCESS) {
      onError?.(dto.code, dto.message);
      return null;
    }

    // 4) 최종 data 반환
    return dto.data;
  } catch (err: unknown) {
    console.error("[useApiResult] Error:", err);
    onError?.(err instanceof Error ? err.message : "UNKNOWN_ERROR", undefined);
    return null;
  }
}
