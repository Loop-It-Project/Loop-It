import { db } from '../connection';
import { usersTable, profilesTable } from '../Schemas';
import { swipePreferencesTable } from '../Schemas/swipeGame';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export const seedSwipeTestData = async () => {
  try {
    console.log('🌱 Seeding swipe test data...');

    // Prüfen ob Test-User bereits existieren
    const existingUsers = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.email, 'alex@test.com'));

    if (existingUsers.length > 0) {
      console.log('⚠️ Test users already exist, skipping seed...');
      return;
    }

    // Test-User erstellen
    const testUsers = [
      {
        username: 'alex_gamer',
        email: 'alex@test.com',
        displayName: 'Alex',
        bio: 'Leidenschaftlicher Gamer und Naturliebhaber',
        interests: ['Gaming', 'Wandern', 'Fotografie'],
        hobbies: ['Videospiele', 'Bergsteigen', 'Lesen'],
        dateOfBirth: new Date('1995-05-15'),
        location: { country: 'DE', city: 'Berlin', coordinates: { lat: 52.5200, lng: 13.4050 } }
      },
      {
        username: 'sarah_artist',
        email: 'sarah@test.com',
        displayName: 'Sarah',
        bio: 'Künstlerin mit Leidenschaft für Musik und Kunst',
        interests: ['Kunst', 'Musik', 'Reisen'],
        hobbies: ['Malen', 'Gitarre spielen', 'Kochen'],
        dateOfBirth: new Date('1992-08-22'),
        location: { country: 'DE', city: 'München', coordinates: { lat: 48.1351, lng: 11.5820 } }
      },
      {
        username: 'max_sports',
        email: 'max@test.com',
        displayName: 'Max',
        bio: 'Sportbegeistert und immer für ein Abenteuer zu haben',
        interests: ['Sport', 'Reisen', 'Technologie'],
        hobbies: ['Fußball', 'Schwimmen', 'Programmieren'],
        dateOfBirth: new Date('1998-03-10'),
        location: { country: 'DE', city: 'Hamburg', coordinates: { lat: 53.5511, lng: 9.9937 } }
      },
      {
        username: 'lisa_bookworm',
        email: 'lisa@test.com',
        displayName: 'Lisa',
        bio: 'Bücherwurm und Kaffeeliebhaberin',
        interests: ['Literatur', 'Philosophie', 'Kaffee'],
        hobbies: ['Lesen', 'Schreiben', 'Yoga'],
        dateOfBirth: new Date('1996-11-05'),
        location: { country: 'DE', city: 'Köln', coordinates: { lat: 50.9375, lng: 6.9603 } }
      },
      {
        username: 'tom_musician',
        email: 'tom@test.com',
        displayName: 'Tom',
        bio: 'Musiker und Produzent mit Liebe zum Detail',
        interests: ['Musik', 'Technologie', 'Design'],
        hobbies: ['Musik produzieren', 'Konzerte besuchen', 'Fotografieren'],
        dateOfBirth: new Date('1993-07-18'),
        location: { country: 'DE', city: 'Frankfurt', coordinates: { lat: 50.1109, lng: 8.6821 } }
      }
    ];

    const passwordHash = await bcrypt.hash('password123', 10);

    for (const userData of testUsers) {
      // User erstellen
      const userId = uuidv4();
      await db.insert(usersTable).values({
        id: userId,
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName,
        passwordHash,
        dateOfBirth: userData.dateOfBirth,
        location: userData.location,
        accountStatus: 'active',
        lastActivityAt: new Date()
      });

      // Profile erstellen
      await db.insert(profilesTable).values({
        userId,
        bio: userData.bio,
        interests: userData.interests,
        hobbies: userData.hobbies,
        profileVisibility: 'public',
        showAge: true,
        showLocation: true
      });

      // Default Swipe-Präferenzen erstellen
      await db.insert(swipePreferencesTable).values({
        userId,
        maxDistance: 100,
        minAge: 18,
        maxAge: 35,
        showMe: 'everyone',
        requireCommonInterests: false,
        minCommonInterests: 1,
        excludeAlreadySwiped: true,
        onlyShowActiveUsers: true,
        isVisible: true,
        isPremium: false
      });
    }

    console.log('✅ Swipe test data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding swipe test data:', error);
  }
};