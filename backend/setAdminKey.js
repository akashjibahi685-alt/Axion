const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();
const SALT = 'axion_v1_2026_salt';
const secret = 'axion_admin_key_v1';
const hash = crypto.createHash('sha256').update(SALT + secret + SALT).digest('hex');

async function main() {
  await prisma.adminInviteToken.updateMany({ data: { isUsed: true } });
  await prisma.adminInviteToken.create({
    data: {
      tokenHash: hash,
      role: 'Admin',
      permissions: 'ALL',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      isUsed: false
    }
  });
  console.log('Secret key successfully set to: ' + secret);
}
main().catch(console.error).finally(() => prisma.$disconnect());
