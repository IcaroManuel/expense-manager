import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async listCategories(@CurrentUser() user: any) {
    return this.categoriesService.list(user.id);
  }

  @Post()
  async createCategory(
    @Body() payload: { name: string; type: 'INCOME' | 'EXPENSE'; icon?: string },
    @CurrentUser() user: any,
  ) {
    return this.categoriesService.create(user.id, payload);
  }

  @Patch(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() payload: { name?: string; type?: 'INCOME' | 'EXPENSE' },
    @CurrentUser() user: any,
  ) {
    return this.categoriesService.update(user.id, id, payload);
  }

  @Delete(':id')
  async deleteCategory(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.categoriesService.delete(user.id, id);
  }
}
