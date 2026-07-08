import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SummaryService } from './summary.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/summary')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Get()
  async getSummary(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @CurrentUser() user: any,
  ) {
    return this.summaryService.forMonth(user.id, year, month);
  }

  @Get('annual')
  async getAnnual(
    @Query('year', ParseIntPipe) year: number,
    @CurrentUser() user: any,
  ) {
    return this.summaryService.forYear(user.id, year);
  }
}
