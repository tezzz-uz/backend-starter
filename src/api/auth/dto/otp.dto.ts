import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'

export class SendOTPPhoneNumberDTO {
  @IsString()
  phone_number: string
}

export class SendOTPPhoneEmailDTO {
  @IsString()
  email: string
}

export class OTPResponseDTO {
  @Expose()
  code_hash: string
}
