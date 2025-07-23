import "reflect-metadata";
import { IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiErrorCodeEnum, ApiStatusEnum } from "@/shared/enum/result.enum";

export class BaseApiResponseDto<T> {
  @IsEnum(ApiStatusEnum)
  status!: ApiStatusEnum;

  @IsEnum(ApiErrorCodeEnum)
  @IsOptional()
  code?: ApiErrorCodeEnum;

  @IsString()
  @IsOptional()
  message?: string;

  @ValidateNested()
  @Type(/* 서브클래스에서 지정 */)
  data!: T;
}
