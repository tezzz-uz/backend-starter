import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectModel } from '@nestjs/mongoose'
import * as bcrypt from 'bcryptjs'
import { Model, Types } from 'mongoose'
import * as crypto from 'node:crypto'

import { OTP } from 'src/models/otp.schema'
import { User } from 'src/models/user.schema'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(OTP.name) readonly otpModel: Model<OTP>,
    private readonly jwtService: JwtService,
  ) {}

  generateOTP() {
    const code = Math.floor(100000 + Math.random() * 900000)

    const code_token = crypto.randomBytes(32).toString('hex')
    const code_hash = crypto
      .createHash('sha256')
      .update(code_token)
      .digest('hex')

    return { code, code_hash }
  }

  async getOTP({ code, code_hash }: { code: number; code_hash: string }) {
    const otp = await this.otpModel.findOne({
      code,
      code_hash,
      created_at: { $gte: new Date(Date.now() - 60000) },
    })

    return otp
  }

  deleteOTP(id: Types.ObjectId) {
    return this.otpModel.findByIdAndDelete(id)
  }

  async getUserByPhoneNumber(phone_number: string) {
    const user = await this.userModel.findOneAndUpdate(
      {
        phone_number,
        is_deleted: false,
      },
      { auth_method: 'phone-number' },
    )

    return user
  }

  async getUserByEmail(email: string) {
    const user = await this.userModel
      .findOne({
        email,
        is_deleted: false,
      })
      .select('+password')

    return user
  }

  async signIn({ phone_number, email, auth_method }: User) {
    const filter = { auth_method, is_deleted: { $ne: true } }

    if (auth_method == 'phone-number') {
      filter['phone_number'] = phone_number
    } else {
      filter['email'] = email
    }

    const user = await this.userModel.findOneAndUpdate(
      filter,
      { phone_number, email, auth_method },
      { upsert: true, new: true },
    )

    return this.jwtService.signAsync({ user: user._id })
  }

  async getUser(id: Types.ObjectId) {
    const user = await this.userModel.findOne({
      _id: id,
      is_deleted: false,
    })

    return user
  }

  async hashPassword(password: string) {
    const hash = await bcrypt.hash(password, 12)

    return hash
  }
}
