import { Expose } from 'class-transformer'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export class SignInDTO {
  @IsString()
  phone_number: string

  @IsString()
  @IsOptional()
  email?: string

  @IsNumber()
  code: number

  @IsString()
  code_hash: string
}

export class SignInResponseDTO {
  @Expose()
  access_token: string
}
