import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/services')
export class ServicesController {
  constructor(private services: ServicesService) {}

  /**
   * Listar serviços (Admin)
   *
   * Retorna os serviços do salão do admin logado.
   *
   * Regras:
   * - Multi-tenant: lista somente serviços do tenantId presente no JWT.
   * - Pode retornar ativos e inativos (dependendo da implementação).
  */
  @Get()
  list(@CurrentUser() user: any, @Query('active') active?: 'true' | 'false' | 'all') {
    return this.services.list(user.tenantId, active);
  }

  /**
   * Criar serviço (Admin)
   *
   * Cria um novo serviço (ex: Corte, Barba, Unha) para o salão do admin logado.
   *
   * Body comum:
   * - name: string
   * - durationMin: number (duração em minutos)
   * - priceCents?: number (opcional)
   * - active?: boolean (opcional)
   *
   * Regras:
   * - Multi-tenant: o service é criado com tenantId do JWT.
   * - Normalmente existe unique (tenantId + name) para evitar duplicados.
  */
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateServiceDto) {
    return this.services.create(user.tenantId, dto);
  }

  /**
   * Atualizar serviço (Admin)
   *
   * Atualiza parcialmente um serviço do salão.
   *
   * Params:
   * - id: ID do Service (cuid)
   *
   * Body: (qualquer subset dos campos)
   * - name?: string
   * - durationMin?: number
   * - priceCents?: number
   * - active?: boolean
   *
   * Regras:
   * - Multi-tenant: só permite atualizar se o serviço pertencer ao tenantId do JWT.
  */
  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.services.remove(user.tenantId, id);
  }

  @Patch(':id/activate')
  activate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.services.update(user.tenantId, id, { active: true });
  }
}
