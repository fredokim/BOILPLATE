// src/dto/BaseApiResponseDto.ts
import "reflect-metadata";
import { IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiStatusEnum, ApiErrorCodeEnum } from "@/shared/enum/result.enum";

/**
 * 서버 공통 응답 스펙을 검증할 DTO
 * @template T data 프로퍼티의 타입
 */
export class BaseApiResponseDto<T> {
  @IsEnum(ApiStatusEnum)
  status!: ApiStatusEnum;

  @IsEnum(ApiErrorCodeEnum)
  @IsOptional()
  code?: ApiErrorCodeEnum;

  @IsString()
  @IsOptional()
  message?: string;

  /**
   * 서브클래스에서 이 데코레이터를 붙여주세요:
   *
   *   @ValidateNested()
   *   @Type(() => SomeDto)
   *   data!: SomeDto;
   */
  @ValidateNested()
  @Type(() => Object)
  data!: T;
}
