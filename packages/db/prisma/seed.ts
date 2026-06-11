import { BaseUnit, PrismaClient, Role, StockMovementType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

const DEMO_ORG_SLUG = 'demo-bakery';
const DEMO_PASSWORD = 'Password123!';
const DEMO_PASSWORD_HASH = '$2b$10$NOOPI1n1jq/GsenSG6x5HOz5LLJ36vC24.2136vd5z9geAzlfrpSa';

type DemoUserSeed = {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  branchCodes: Array<'MAIN' | 'KADIKOY'>;
};

const DEMO_USERS: DemoUserSeed[] = [
  {
    email: 'demo@kitchenledger.app',
    firstName: 'Demo',
    lastName: 'User',
    role: Role.OWNER,
    branchCodes: ['MAIN', 'KADIKOY'],
  },
  {
    email: 'owner@kitchenledger.app',
    firstName: 'Owner',
    lastName: 'User',
    role: Role.OWNER,
    branchCodes: ['MAIN', 'KADIKOY'],
  },
  {
    email: 'admin@kitchenledger.app',
    firstName: 'Admin',
    lastName: 'User',
    role: Role.ADMIN,
    branchCodes: ['MAIN', 'KADIKOY'],
  },
  {
    email: 'manager@kitchenledger.app',
    firstName: 'Branch',
    lastName: 'Manager',
    role: Role.BRANCH_MANAGER,
    branchCodes: ['KADIKOY'],
  },
  {
    email: 'staff@kitchenledger.app',
    firstName: 'Staff',
    lastName: 'User',
    role: Role.STAFF,
    branchCodes: ['MAIN'],
  },
  {
    email: 'viewer@kitchenledger.app',
    firstName: 'Viewer',
    lastName: 'User',
    role: Role.VIEWER,
    branchCodes: ['MAIN'],
  },
];

async function upsertDemoUser(user: DemoUserSeed) {
  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      passwordHash: DEMO_PASSWORD_HASH,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    create: {
      email: user.email,
      passwordHash: DEMO_PASSWORD_HASH,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
}

async function createPurchaseWithStock(params: {
  organizationId: string;
  branchId: string;
  supplierId: string;
  purchasedAt: Date;
  invoiceNumber: string;
  notes?: string;
  items: Array<{
    ingredientId: string;
    quantity: Decimal;
    unit: BaseUnit;
    totalPrice: Decimal;
  }>;
}) {
  const purchase = await prisma.purchase.create({
    data: {
      organizationId: params.organizationId,
      branchId: params.branchId,
      supplierId: params.supplierId,
      purchasedAt: params.purchasedAt,
      invoiceNumber: params.invoiceNumber,
      notes: params.notes,
      items: {
        create: params.items.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unit: item.unit,
          totalPrice: item.totalPrice,
        })),
      },
    },
    include: { items: true },
  });

  for (const item of purchase.items) {
    const unitCost = item.totalPrice.div(item.quantity);
    const stockBatch = await prisma.stockBatch.create({
      data: {
        organizationId: params.organizationId,
        branchId: params.branchId,
        ingredientId: item.ingredientId,
        purchaseItemId: item.id,
        initialQuantity: item.quantity,
        remainingQuantity: item.quantity,
        unit: item.unit,
        unitCost,
        receivedAt: params.purchasedAt,
      },
    });

    await prisma.stockMovement.create({
      data: {
        organizationId: params.organizationId,
        branchId: params.branchId,
        ingredientId: item.ingredientId,
        stockBatchId: stockBatch.id,
        type: StockMovementType.PURCHASE,
        quantity: item.quantity,
        unit: item.unit,
        reason: `Purchase ${purchase.invoiceNumber}`,
      },
    });
  }

  return purchase;
}

async function main() {
  const seededUsers = await Promise.all(DEMO_USERS.map((user) => upsertDemoUser(user)));
  const userByEmail = new Map(seededUsers.map((user) => [user.email, user]));

  await prisma.organization.deleteMany({ where: { slug: DEMO_ORG_SLUG } });

  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Bakery',
      slug: DEMO_ORG_SLUG,
    },
  });

  for (const demoUser of DEMO_USERS) {
    const user = userByEmail.get(demoUser.email);
    if (!user) {
      continue;
    }

    await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: demoUser.role,
      },
    });
  }

  const mainKitchen = await prisma.branch.create({
    data: {
      organizationId: organization.id,
      name: 'Main Kitchen',
      code: 'MAIN',
    },
  });

  const kadikoyBranch = await prisma.branch.create({
    data: {
      organizationId: organization.id,
      name: 'Kadikoy Branch',
      code: 'KADIKOY',
    },
  });

  const branchByCode = {
    MAIN: mainKitchen,
    KADIKOY: kadikoyBranch,
  } as const;

  for (const demoUser of DEMO_USERS) {
    const user = userByEmail.get(demoUser.email);
    if (!user) {
      continue;
    }

    for (const branchCode of demoUser.branchCodes) {
      const branch = branchByCode[branchCode];
      await prisma.branchMember.create({
        data: {
          branchId: branch.id,
          userId: user.id,
          organizationId: organization.id,
        },
      });
    }
  }

  const [freshFarmEggs, bakeryWholesale, dairyHouse] = await Promise.all([
    prisma.supplier.create({
      data: {
        organizationId: organization.id,
        name: 'Fresh Farm Eggs',
        contactName: 'Ali Yilmaz',
        phone: '+90 212 555 0101',
      },
    }),
    prisma.supplier.create({
      data: {
        organizationId: organization.id,
        name: 'Bakery Wholesale',
        contactName: 'Mehmet Demir',
        email: 'orders@bakerywholesale.example',
      },
    }),
    prisma.supplier.create({
      data: {
        organizationId: organization.id,
        name: 'Dairy House',
        contactName: 'Ayse Kaya',
        email: 'orders@dairyhouse.example',
      },
    }),
  ]);

  const ingredientData = [
    { name: 'Egg', sku: 'EGG', baseUnit: BaseUnit.PIECE, minimumStockLevel: 30 },
    { name: 'Flour', sku: 'FLOUR', baseUnit: BaseUnit.GRAM, minimumStockLevel: 5000 },
    { name: 'Sugar', sku: 'SUGAR', baseUnit: BaseUnit.GRAM, minimumStockLevel: 3000 },
    { name: 'Butter', sku: 'BUTTER', baseUnit: BaseUnit.GRAM, minimumStockLevel: 2000 },
    {
      name: 'Cream Cheese',
      sku: 'CREAM-CHEESE',
      baseUnit: BaseUnit.GRAM,
      minimumStockLevel: 2000,
    },
    { name: 'Cream', sku: 'CREAM', baseUnit: BaseUnit.MILLILITER, minimumStockLevel: 1000 },
  ] as const;

  const ingredients = await Promise.all(
    ingredientData.map((ingredient) =>
      prisma.ingredient.create({
        data: {
          organizationId: organization.id,
          name: ingredient.name,
          sku: ingredient.sku,
          baseUnit: ingredient.baseUnit,
          minimumStockLevel: new Decimal(ingredient.minimumStockLevel),
        },
      }),
    ),
  );

  const [egg, flour, sugar, butter, creamCheese, cream] = ingredients;

  const sanSebastian = await prisma.product.create({
    data: {
      organizationId: organization.id,
      name: 'San Sebastian Cheesecake',
      sku: 'SAN-SEBASTIAN',
      description: 'Classic burnt Basque-style cheesecake',
      defaultServingCount: 8,
    },
  });

  const chocolateCake = await prisma.product.create({
    data: {
      organizationId: organization.id,
      name: 'Chocolate Cake',
      sku: 'CHOC-CAKE',
      description: 'Rich chocolate layer cake',
      defaultServingCount: 10,
    },
  });

  const sanSebastianRecipe = await prisma.recipe.create({
    data: {
      organizationId: organization.id,
      productId: sanSebastian.id,
      name: 'San Sebastian Cheesecake Recipe',
      yieldQuantity: new Decimal(1),
      yieldUnit: BaseUnit.PIECE,
      items: {
        create: [
          { ingredientId: egg.id, quantity: new Decimal(5), unit: BaseUnit.PIECE },
          { ingredientId: flour.id, quantity: new Decimal(30), unit: BaseUnit.GRAM },
          { ingredientId: sugar.id, quantity: new Decimal(200), unit: BaseUnit.GRAM },
          { ingredientId: butter.id, quantity: new Decimal(50), unit: BaseUnit.GRAM },
          { ingredientId: creamCheese.id, quantity: new Decimal(1000), unit: BaseUnit.GRAM },
        ],
      },
    },
  });

  const chocolateCakeRecipe = await prisma.recipe.create({
    data: {
      organizationId: organization.id,
      productId: chocolateCake.id,
      name: 'Chocolate Cake Recipe',
      yieldQuantity: new Decimal(1),
      yieldUnit: BaseUnit.PIECE,
      items: {
        create: [
          { ingredientId: egg.id, quantity: new Decimal(4), unit: BaseUnit.PIECE },
          { ingredientId: flour.id, quantity: new Decimal(250), unit: BaseUnit.GRAM },
          { ingredientId: sugar.id, quantity: new Decimal(300), unit: BaseUnit.GRAM },
          { ingredientId: butter.id, quantity: new Decimal(180), unit: BaseUnit.GRAM },
          { ingredientId: cream.id, quantity: new Decimal(200), unit: BaseUnit.MILLILITER },
        ],
      },
    },
  });

  const mainPurchase = await createPurchaseWithStock({
    organizationId: organization.id,
    branchId: mainKitchen.id,
    supplierId: bakeryWholesale.id,
    purchasedAt: new Date('2026-06-01T10:00:00.000Z'),
    invoiceNumber: 'INV-2026-0001',
    notes: 'Weekly dry goods restock for main kitchen',
    items: [
      {
        ingredientId: egg.id,
        quantity: new Decimal(60),
        unit: BaseUnit.PIECE,
        totalPrice: new Decimal(180),
      },
      {
        ingredientId: flour.id,
        quantity: new Decimal(10000),
        unit: BaseUnit.GRAM,
        totalPrice: new Decimal(150),
      },
      {
        ingredientId: sugar.id,
        quantity: new Decimal(5000),
        unit: BaseUnit.GRAM,
        totalPrice: new Decimal(140),
      },
      {
        ingredientId: butter.id,
        quantity: new Decimal(3000),
        unit: BaseUnit.GRAM,
        totalPrice: new Decimal(360),
      },
    ],
  });

  const dairyPurchase = await createPurchaseWithStock({
    organizationId: organization.id,
    branchId: mainKitchen.id,
    supplierId: dairyHouse.id,
    purchasedAt: new Date('2026-06-02T09:30:00.000Z'),
    invoiceNumber: 'INV-2026-0002',
    notes: 'Dairy products for cheesecakes',
    items: [
      {
        ingredientId: creamCheese.id,
        quantity: new Decimal(6000),
        unit: BaseUnit.GRAM,
        totalPrice: new Decimal(780),
      },
      {
        ingredientId: cream.id,
        quantity: new Decimal(2000),
        unit: BaseUnit.MILLILITER,
        totalPrice: new Decimal(220),
      },
    ],
  });

  const kadikoyPurchase = await createPurchaseWithStock({
    organizationId: organization.id,
    branchId: kadikoyBranch.id,
    supplierId: freshFarmEggs.id,
    purchasedAt: new Date('2026-06-03T08:00:00.000Z'),
    invoiceNumber: 'INV-2026-0003',
    notes: 'Kadikoy branch starter stock with higher egg unit cost',
    items: [
      {
        ingredientId: egg.id,
        quantity: new Decimal(30),
        unit: BaseUnit.PIECE,
        totalPrice: new Decimal(120),
      },
      {
        ingredientId: flour.id,
        quantity: new Decimal(3000),
        unit: BaseUnit.GRAM,
        totalPrice: new Decimal(48),
      },
      {
        ingredientId: sugar.id,
        quantity: new Decimal(2000),
        unit: BaseUnit.GRAM,
        totalPrice: new Decimal(62),
      },
    ],
  });

  console.log('Seed completed:', {
    organization: organization.name,
    password: DEMO_PASSWORD,
    users: DEMO_USERS.map((user) => ({
      email: user.email,
      role: user.role,
      branches: user.branchCodes,
    })),
    branches: [mainKitchen.code, kadikoyBranch.code],
    suppliers: [freshFarmEggs.name, bakeryWholesale.name, dairyHouse.name],
    products: [sanSebastian.sku, chocolateCake.sku],
    recipes: [sanSebastianRecipe.id, chocolateCakeRecipe.id],
    purchases: [mainPurchase.id, dairyPurchase.id, kadikoyPurchase.id],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
