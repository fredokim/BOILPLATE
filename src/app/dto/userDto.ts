import {
  IsString,
  IsInt,
  IsEmail,
  ValidateNested,
  IsArray,
} from "class-validator";
import { Type } from "class-transformer";

export class AddressDto {
  @IsString() street!: string;
  @IsString() city!: string;
}

export class UserDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsInt() age!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses!: AddressDto[];
}
