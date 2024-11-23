import { MongooseModule } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { MongoMemoryServer } from 'mongodb-memory-server'

import { User, UserSchema } from 'src/models/user.schema'

import { AuthService } from './auth.service'

describe('ProfileController', () => {
  let mongod: MongoMemoryServer
  let module: TestingModule
  let service: AuthService

  beforeAll(async () => {
    mongod = new MongoMemoryServer()
    await mongod.start()
    const mongo_uri = mongod.getUri()

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo_uri),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [AuthService],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  afterAll(async () => {
    await module.close()
    await mongod.stop()
  })

  it('should generate new OTP', async () => {
    const new_otp = service.generateOTP()

    expect(new_otp).toBeDefined()
    expect(typeof new_otp).toBe('number')
  })
})
