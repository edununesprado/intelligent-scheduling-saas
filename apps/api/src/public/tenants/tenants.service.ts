import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantsService {
    constructor(private prisma: PrismaService) {}

    async getTenantBySlug(slug: string) {
        const tenant = await this.prisma.tenant.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
            phone: true,
        },
        });

        if (!tenant) throw new NotFoundException('Salão não encontrado');
        return tenant;
    }
}
