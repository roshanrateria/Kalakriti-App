const { PrismaClient } = require('@prisma/client');

async function checkDB() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.product.count();
    console.log('Products in DB:', count);
    
    if (count > 0) {
      const sample = await prisma.product.findMany({ take: 3 });
      console.log('Sample products:');
      sample.forEach(p => console.log(`- ${p.title} (₹${p.price})`));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
