import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, NotFoundException, HttpCode, ParseIntPipe } from '@nestjs/common';
import { ExpensesService, type ExpenseCreate, type ExpenseUpdate } from './expenses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async listExpenses(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @CurrentUser() user: any,
  ) {
    return this.expensesService.listForMonth(user.id, year, month);
  }

  @Post()
  async createExpense(@Body() payload: ExpenseCreate, @CurrentUser() user: any) {
    return this.expensesService.create(user.id, payload);
  }

  @Patch(':id')
  async updateExpense(
    @Param('id') id: string,
    @Body() payload: ExpenseUpdate,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @CurrentUser() user: any,
  ) {
    const updated = await this.expensesService.update(user.id, id, payload, year, month);
    if (!updated) {
      throw new NotFoundException('Expense not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteExpense(
    @Param('id') id: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('scope') scope: string = 'month',
    @CurrentUser() user: any,
  ) {
    let ok = false;
    if (scope === 'all') {
      ok = await this.expensesService.deleteTemplate(user.id, id);
    } else {
      ok = await this.expensesService.deleteForMonth(user.id, id, year, month);
    }

    if (!ok) {
      throw new NotFoundException('Expense not found');
    }
  }
}
