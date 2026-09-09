const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Address = require('../models/Address');
const Order = require('../models/Order');

const autoSeed = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
    const customerPasswordHash = await bcrypt.hash('Customer@123', salt);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      phone: '+91 98765 43210',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isActive: true
    });

    const customer = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+91 91234 56789',
      passwordHash: customerPasswordHash,
      role: 'user',
      isActive: true
    });

    const categoriesData = [
      {
        name: 'Vegetables',
        description: 'Fresh farm-picked organic vegetables',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
        isActive: true
      },
      {
        name: 'Fruits',
        description: 'Juicy, farm-fresh seasonal fruits',
        image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=80',
        isActive: true
      },
      {
        name: 'Dairy & Eggs',
        description: 'Pure milk, cheese, butter and fresh farm eggs',
        image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop&q=80',
        isActive: true
      },
      {
        name: 'Bakery & Bread',
        description: 'Artisanal bread, cakes, and baked delights',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
        isActive: true
      },
      {
        name: 'Beverages',
        description: 'Refreshing juices, sodas, tea & coffee',
        image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop&q=80',
        isActive: true
      },
      {
        name: 'Snacks & Munchies',
        description: 'Crisps, nuts, biscuits and savory snacks',
        image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&auto=format&fit=crop&q=80',
        isActive: true
      }
    ];

    const categories = await Category.insertMany(categoriesData);
    const catMap = {};
    categories.forEach(c => { catMap[c.name] = c._id; });

    const productsData = [
      {
        name: 'Organic Red Tomatoes',
        description: 'Fresh, vine-ripened red organic tomatoes packed with nutrients.',
        categoryId: catMap['Vegetables'],
        brand: 'Organic Farm',
        images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'],
        price: 60,
        discountPrice: 48,
        unit: 'kg',
        weight: '1 kg',
        stock: 120,
        sku: 'VEG-TOM-01',
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Fresh Green Broccoli',
        description: 'Crisp green broccoli heads rich in vitamins and minerals.',
        categoryId: catMap['Vegetables'],
        brand: 'FreshField',
        images: ['https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&auto=format&fit=crop&q=80'],
        price: 110,
        discountPrice: 90,
        unit: 'pcs',
        weight: '500g',
        stock: 45,
        sku: 'VEG-BROC-02',
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Farm Fresh Spinach (Palak)',
        description: 'Tender and leafy organic green spinach leaves.',
        categoryId: catMap['Vegetables'],
        brand: 'Organic Farm',
        images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80'],
        price: 35,
        discountPrice: 28,
        unit: 'bunch',
        weight: '250g',
        stock: 8,
        sku: 'VEG-SPIN-03',
        isFeatured: false,
        isActive: true
      },
      {
        name: 'Washington Red Apples',
        description: 'Crisp, sweet, and crunchy premium red apples.',
        categoryId: catMap['Fruits'],
        brand: 'FruitHaven',
        images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80'],
        price: 180,
        discountPrice: 150,
        unit: 'kg',
        weight: '1 kg',
        stock: 80,
        sku: 'FRU-APP-01',
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Organic Cavendish Bananas',
        description: 'Naturally ripened sweet yellow bananas.',
        categoryId: catMap['Fruits'],
        brand: 'Organic Farm',
        images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80'],
        price: 50,
        discountPrice: 42,
        unit: 'dozen',
        weight: '1.2 kg',
        stock: 100,
        sku: 'FRU-BAN-02',
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Fresh Alphonso Mangoes',
        description: 'King of mangoes - rich, aromatic, and heavenly sweet.',
        categoryId: catMap['Fruits'],
        brand: 'Ratnagiri Fresh',
        images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80'],
        price: 450,
        discountPrice: 380,
        unit: 'box',
        weight: '1.5 kg (6 pcs)',
        stock: 5,
        sku: 'FRU-MAN-03',
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Whole Milk 1 Liter',
        description: 'Pasteurized farm-fresh whole cow milk.',
        categoryId: catMap['Dairy & Eggs'],
        brand: 'Dairy Pure',
        images: ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80'],
        price: 68,
        discountPrice: 62,
        unit: 'pack',
        weight: '1 L',
        stock: 150,
        sku: 'DAI-MILK-01',
        isFeatured: false,
        isActive: true
      },
      {
        name: 'Farm Eggs Pack of 12',
        description: 'Grade-A brown eggs packed with protein.',
        categoryId: catMap['Dairy & Eggs'],
        brand: 'NutriEgg',
        images: ['https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=600&auto=format&fit=crop&q=80'],
        price: 95,
        discountPrice: 85,
        unit: 'box',
        weight: '12 pcs',
        stock: 60,
        sku: 'DAI-EGG-02',
        isFeatured: true,
        isActive: true
      }
    ];

    const products = await Product.insertMany(productsData);

    const address = await Address.create({
      userId: customer._id,
      name: 'John Doe',
      phone: '+91 91234 56789',
      house: 'Flat 402, Sunshine Apartments',
      street: 'MG Road, 4th Block',
      area: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      landmark: 'Near Forum Mall',
      type: 'Home'
    });

    const sampleOrders = [
      {
        orderNumber: 'GRO-20260908-1001',
        userId: customer._id,
        items: [
          {
            productId: products[0]._id,
            productName: products[0].name,
            image: products[0].images[0],
            quantity: 2,
            unitPrice: products[0].discountPrice,
            totalPrice: products[0].discountPrice * 2
          },
          {
            productId: products[3]._id,
            productName: products[3].name,
            image: products[3].images[0],
            quantity: 1,
            unitPrice: products[3].discountPrice,
            totalPrice: products[3].discountPrice * 1
          }
        ],
        address: {
          name: address.name,
          phone: address.phone,
          house: address.house,
          street: address.street,
          area: address.area,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          type: address.type
        },
        subtotal: 246,
        deliveryFee: 40,
        discount: 0,
        tax: 12,
        totalAmount: 298,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'Pending',
        orderStatus: 'Order Placed'
      }
    ];

    await Order.insertMany(sampleOrders);

    console.log('✅ Automatic Database Seeding Completed!');
  } catch (error) {
    console.error('Auto seeding failed:', error);
  }
};

module.exports = autoSeed;
