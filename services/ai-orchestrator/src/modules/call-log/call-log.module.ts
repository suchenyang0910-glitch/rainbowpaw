import { DynamicModule, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiCallLogEntity } from '../ai/entities/ai-call-log.entity';
import {
  CALL_LOG_STORE,
  DbCallLogStore,
  NoopCallLogStore,
} from './call-log.store';

@Global()
@Module({})
export class CallLogModule {
  static forRoot(opts: { enableDb: boolean }): DynamicModule {
    if (!opts.enableDb) {
      return {
        module: CallLogModule,
        providers: [{ provide: CALL_LOG_STORE, useClass: NoopCallLogStore }],
        exports: [CALL_LOG_STORE],
      };
    }

    return {
      module: CallLogModule,
      imports: [TypeOrmModule.forFeature([AiCallLogEntity])],
      providers: [
        DbCallLogStore,
        { provide: CALL_LOG_STORE, useExisting: DbCallLogStore },
      ],
      exports: [CALL_LOG_STORE],
    };
  }
}
