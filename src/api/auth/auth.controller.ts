import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  NotFoundException,
  Post,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ApiTags } from '@nestjs/swagger'

import { EmailService } from 'src/services/email.service'
import { SmsService } from 'src/services/sms.service'

import { Public } from 'src/common/decarators/public.decarator'
import { ResponseDTO } from 'src/common/decarators/response.decarator'
import { ErrorMessage } from 'src/constants/errors'

import { AuthService } from './auth.service'
import {
  OTPResponseDTO,
  SendOTPPhoneEmailDTO,
  SendOTPPhoneNumberDTO,
} from './dto/otp.dto'
import { SignInDTO, SignInResponseDTO } from './dto/singin.dto'

@ApiTags('Auth')
@Controller('/api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  @Public()
  @Post('/otp/phone-number')
  @ResponseDTO(OTPResponseDTO)
  async sendPhoneNumberOTP(@Body() { phone_number }: SendOTPPhoneNumberDTO) {
    const otp_code = this.authService.generateOTP()
    const code_hash = otp_code.code_hash
    const code = otp_code.code

    const otp = await this.authService.otpModel.create({
      code,
      code_hash,
      phone_number,
      auth_method: 'phone-number',
    })

    try {
      await this.smsService.send(String(otp.code), phone_number)
    } catch (error) {
      console.log(error)
    }

    return { data: otp }
  }

  @Public()
  @Post('/otp/email')
  @ResponseDTO(OTPResponseDTO)
  async sendEmailOTP(@Body() { email }: SendOTPPhoneEmailDTO) {
    const otp_code = this.authService.generateOTP()
    const code_hash = otp_code.code_hash
    const code = otp_code.code

    const otp = await this.authService.otpModel.create({
      code,
      code_hash,
      email,
      auth_method: 'email',
    })

    try {
      await this.emailService.send(email, `${code}`)

      return { data: otp }
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('Try again')
    }
  }

  @Public()
  @Post('/signin')
  @ResponseDTO(SignInResponseDTO)
  async signin(@Body() { code, code_hash, phone_number, email }: SignInDTO) {
    const otp = await this.authService.getOTP({ code, code_hash })

    if (!otp) {
      throw new NotFoundException(ErrorMessage.INVALID_OTP_CODE)
    }

    if (otp.auth_method == 'email' && email !== otp.email) {
      throw new BadRequestException(['incorrect email'])
    } else if (
      otp.auth_method == 'phone-number' &&
      otp.phone_number != phone_number
    ) {
      throw new BadRequestException('incorrect phone number')
    }

    const access_token = await this.authService.signIn({
      phone_number,
      email,
      auth_method: otp.auth_method,
    })

    await this.authService.deleteOTP(otp._id)

    return { data: { access_token } }
  }
}
