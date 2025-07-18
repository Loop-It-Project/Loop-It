import { seedAdminData } from './seedAdminData';
import { seedSwipeTestData } from './seedSwipeTestData';

export const runAllSeeds = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Admin-Daten seeden
    await seedAdminData();
    
    // Swipe-Test-Daten seeden
    await seedSwipeTestData();
    
    console.log('✅ All seeds completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Direkter Aufruf wenn Script ausgeführt wird
if (require.main === module) {
  runAllSeeds();
}