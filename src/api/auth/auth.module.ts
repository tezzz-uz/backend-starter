import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { OTP, OTPSchema } from 'src/models/otp.schema'
import { User, UserSchema } from 'src/models/user.schema'

import { EmailService } from 'src/services/email.service'
import { SmsService } from 'src/services/sms.service'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: OTP.name, schema: OTPSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, SmsService, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
