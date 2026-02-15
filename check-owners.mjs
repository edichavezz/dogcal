import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const owners = await prisma.user.findMany({
  where: { role: 'OWNER' },
  select: { id: true, name: true }
});
console.log('Owners:');
owners.forEach(o => console.log(o.name + ': ' + o.id));

const pups = await prisma.pup.findMany({
  include: { pupOwner: { select: { name: true } } }
});
console.log('\nPups:');
pups.forEach(p => console.log(p.name + ' (owner: ' + p.pupOwner.name + ') - ' + p.id));

await prisma.$disconnect();
