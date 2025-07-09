import { db } from '../connection';
import { rolesTable, userRolesTable, usersTable } from '../Schemas';
import { eq } from 'drizzle-orm';

export async function seedAdminData() {
  try {
    console.log('🌱 Seeding admin data...');

    // Rollen-Struktur mit Standard 'user' Rolle
    const allRoles = [
      { 
        name: 'user', 
        description: 'Standard Benutzer',
        permissions: [
          'read_posts', 
          'create_posts', 
          'join_universes', 
          'create_universes',
          'comment_posts',
          'react_posts',
          'send_messages',
          'update_profile'
        ],
        isActive: true,
        isDefault: true
      },
      { 
        name: 'moderator', 
        description: 'Moderator für Content-Verwaltung',
        permissions: [
          'read_posts', 
          'create_posts', 
          'join_universes', 
          'create_universes',
          'comment_posts',
          'react_posts',
          'send_messages',
          'update_profile',
          'view_reports', 
          'handle_reports',
          'moderate_content',
          'manage_universe_members'
        ],
        isActive: true,
        isDefault: false
      },
      { 
        name: 'admin', 
        description: 'Administrator mit erweiterten Rechten',
        permissions: [
          'read_posts', 
          'create_posts', 
          'join_universes', 
          'create_universes',
          'comment_posts',
          'react_posts',
          'send_messages',
          'update_profile',
          'manage_users', 
          'manage_universes', 
          'view_reports', 
          'handle_reports',
          'moderate_content',
          'view_analytics',
          'manage_roles'
        ],
        isActive: true,
        isDefault: false
      },
      { 
        name: 'super_admin', 
        description: 'Super Administrator mit allen Rechten',
        permissions: [
          'read_posts', 
          'create_posts', 
          'join_universes', 
          'create_universes',
          'comment_posts',
          'react_posts',
          'send_messages',
          'update_profile',
          'manage_users', 
          'manage_universes', 
          'view_reports', 
          'handle_reports',
          'moderate_content',
          'manage_roles', 
          'view_analytics', 
          'system_settings',
          'manage_permissions',
          'access_admin_panel'
        ],
        isActive: true,
        isDefault: false
      }
    ];

    for (const role of allRoles) {
      try {
        const insertedRole = await db
          .insert(rolesTable)
          .values({
            name: role.name,
            description: role.description,
            permissions: JSON.stringify(role.permissions),
            isActive: role.isActive,
            isDefault: role.isDefault
          })
          .onConflictDoNothing()
          .returning();

        if (insertedRole.length > 0) {
          console.log(`✅ Role created: ${role.name}`);
        } else {
          console.log(`ℹ️ Role already exists: ${role.name}`);
        }
      } catch (roleError) {
        console.log(`⚠️ Error creating role ${role.name}:`, roleError);
      }
    }

    // Zerrelius als Super Admin setzen (nur wenn User existiert)
    try {
      const zerriliusUser = await db
        .select({ id: usersTable.id, username: usersTable.username })
        .from(usersTable)
        .where(eq(usersTable.username, 'Zerrelius'))
        .limit(1);

      if (zerriliusUser.length > 0) {
        const superAdminRole = await db
          .select({ id: rolesTable.id })
          .from(rolesTable)
          .where(eq(rolesTable.name, 'super_admin'))
          .limit(1);

        if (superAdminRole.length > 0) {
          await db
            .insert(userRolesTable)
            .values({
              userId: zerriliusUser[0].id,
              roleId: superAdminRole[0].id,
              isActive: true,
              assignedBy: null, // System assignment
              assignedAt: new Date()
            })
            .onConflictDoNothing();

          console.log('✅ Zerrelius assigned Super Admin role');
        }
      } else {
        console.log('ℹ️ Zerrelius user not found - skipping admin role assignment');
      }
    } catch (userRoleError) {
      console.log('ℹ️ User-Role assignment skipped - tables not available yet');
    }

    console.log('🌱 Admin data seeding completed successfully');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Error seeding admin data:', errorMessage);
    console.log('ℹ️ Some admin tables may not exist yet - this is normal during development');
  }
}