import { Injectable } from '@nestjs/common';
import { RunCodeDto } from './dto/create-sandbox.dto';

@Injectable()
export class SandboxService {
  runJs(_params: RunCodeDto) {
    return {};
  }
}
