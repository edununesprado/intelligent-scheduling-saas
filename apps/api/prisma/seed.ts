import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Tenant (salão)
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'salao-bela-arte' },
    update: {
      name: 'Salão Bela Arte',
      logoUrl: 'https://dummyimage.com/200x80/000/fff&text=BELA+ARTE',
      primaryColor: '#F97316',
      phone: '(34) 99999-9999',
    },
    create: {
      name: 'Salão Bela Arte',
      slug: 'salao-bela-arte',
      logoUrl: 'https://dummyimage.com/200x80/000/fff&text=BELA+ARTE',
      primaryColor: '#F97316',
      phone: '(34) 99999-9999',
    },
  });

  // Criar o profissional
  await prisma.professional.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'João (Barbeiro)',
      },
    },
    update: { active: true },
    create: {
      tenantId: tenant.id,
      name: 'João (Barbeiro)',
      active: true,
    },
  });


  // Serviço padrão (soft-delete safe)
  await prisma.service.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Corte de Cabelo',
      },
    },
    update: {
      durationMin: 30,
      priceCents: 5000,
      active: true,
    },
    create: {
      tenantId: tenant.id,
      name: 'Corte de Cabelo',
      durationMin: 30,
      priceCents: 5000,
      active: true,
    },
  });

  // Admin user (para login JWT)
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.adminUser.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@salao.com',
      },
    },
    update: {
      passwordHash,
      active: true,
      name: 'Admin',
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@salao.com',
      passwordHash,
      name: 'Admin',
      active: true,
    },
  });

  console.log('✅ Seed executado com sucesso');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
