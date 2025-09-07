// COMPLETELY REWRITTEN - FIXED VERSION v3.0 - NO getUserByEmail
import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}));

// Logger
app.use('*', logger(console.log));

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Utility functions for KV store keys
const getProjectKey = (id: string) => `project:${id}`;
const getBlockKey = (projectId: string, blockId: string) => `block:${projectId}:${blockId}`;
const getRelationKey = (projectId: string, relationId: string) => `relation:${projectId}:${relationId}`;
const getProjectBlocksKey = (projectId: string) => `blocks:${projectId}`;
const getProjectRelationsKey = (projectId: string) => `relations:${projectId}`;
const getProjectMembersKey = (projectId: string) => `members:${projectId}`;
const getMemberKey = (projectId: string, memberId: string) => `member:${projectId}:${memberId}`;
const getProjectsListKey = () => 'projects:list';
const getUserProjectsKey = (userId: string) => `user_projects:${userId}`;

// Generate unique IDs
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// Test route
app.get('/make-server-6c8ffc9e/test', (c) => {
  return c.json({ message: 'Canvas API server is running with KV store!' });
});

// Auth routes
app.post('/make-server-6c8ffc9e/auth/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return c.json({ error: 'Email et mot de passe requis' }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: { name: name || email.split('@')[0] },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV store
    if (data.user) {
      const userProfile = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || email.split('@')[0],
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await kv.set(`user_profile:${data.user.id}`, userProfile);
      
      // Initialize empty projects list for user
      await kv.set(`user_projects:${data.user.id}`, []);
    }

    return c.json({ 
      message: 'Utilisateur créé avec succès',
      user: data.user 
    });
  } catch (error) {
    console.error('Error during signup:', error);
    return c.json({ error: 'Erreur lors de la création du compte' }, 500);
  }
});

app.get('/make-server-6c8ffc9e/auth/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      console.error('Auth error:', error);
      return c.json({ error: 'Token invalide' }, 401);
    }

    // Get user profile from KV store
    const userProfile = await kv.get(`user_profile:${user.id}`);
    
    if (!userProfile) {
      // Create profile if it doesn't exist (for existing users)
      const newProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await kv.set(`user_profile:${user.id}`, newProfile);
      return c.json({ profile: newProfile });
    }

    return c.json({ profile: userProfile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json({ error: 'Erreur lors de la récupération du profil' }, 500);
  }
});

// Projects routes
app.get('/make-server-6c8ffc9e/projects', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Token invalide' }, 401);
    }

    const userProjectsList = await kv.get(getUserProjectsKey(user.id)) || [];
    const projects = [];
    
    for (const projectId of userProjectsList) {
      const project = await kv.get(getProjectKey(projectId));
      if (project) {
        projects.push(project);
      }
    }

    return c.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

app.post('/make-server-6c8ffc9e/projects', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Token invalide' }, 401);
    }

    const body = await c.req.json();
    const { title, description, type = 'canvas' } = body;

    const projectId = generateId();
    const now = new Date().toISOString();
    
    const project = {
      id: projectId,
      title,
      description,
      type,
      status: 'active',
      owner_id: user.id,
      created_at: now,
      updated_at: now,
    };

    // Save project
    await kv.set(getProjectKey(projectId), project);
    
    // Update global projects list (for admin purposes)
    const projectsList = await kv.get(getProjectsListKey()) || [];
    projectsList.push(projectId);
    await kv.set(getProjectsListKey(), projectsList);

    // Update user's projects list
    const userProjectsList = await kv.get(getUserProjectsKey(user.id)) || [];
    userProjectsList.push(projectId);
    await kv.set(getUserProjectsKey(user.id), userProjectsList);

    // Initialize empty blocks and relations lists
    await kv.set(getProjectBlocksKey(projectId), []);
    await kv.set(getProjectRelationsKey(projectId), []);
    
    // Add the project owner as the first member with "owner" role
    const ownerProfile = await kv.get(`user_profile:${user.id}`) || {
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Propriétaire',
      email: user.email,
      avatar_url: null,
    };

    const ownerMember = {
      id: user.id,
      project_id: projectId,
      email: user.email,
      name: ownerProfile.name,
      role: 'owner',
      status: 'active',
      invited_at: now,
      joined_at: now,
      last_active_at: now,
      message: null,
      avatarUrl: ownerProfile.avatar_url,
      invited_by: null,
      supabase_user_id: user.id,
      invite_method: 'auto_owner',
    };

    // Save owner as member
    await kv.set(getMemberKey(projectId, user.id), ownerMember);
    
    // Initialize members list with owner
    await kv.set(getProjectMembersKey(projectId), [user.id]);

    return c.json({ project });
  } catch (error) {
    console.error('Error creating project:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

app.get('/make-server-6c8ffc9e/projects/:id', async (c) => {
  try {
    const projectId = c.req.param('id');
    const project = await kv.get(getProjectKey(projectId));

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

app.put('/make-server-6c8ffc9e/projects/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Token invalide' }, 401);
    }

    const projectId = c.req.param('id');
    const body = await c.req.json();
    
    const existingProject = await kv.get(getProjectKey(projectId));
    if (!existingProject) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check permissions
    if (existingProject.owner_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const updatedProject = {
      ...existingProject,
      ...body,
      id: projectId,
      owner_id: existingProject.owner_id,
      updated_at: new Date().toISOString(),
    };

    await kv.set(getProjectKey(projectId), updatedProject);
    return c.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// Blocks routes
app.get('/make-server-6c8ffc9e/projects/:projectId/blocks', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const blockIds = await kv.get(getProjectBlocksKey(projectId)) || [];
    const blocks = [];

    for (const blockId of blockIds) {
      const block = await kv.get(getBlockKey(projectId, blockId));
      if (block) {
        blocks.push(block);
      }
    }

    return c.json({ blocks });
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return c.json({ error: 'Failed to fetch blocks' }, 500);
  }
});

app.post('/make-server-6c8ffc9e/projects/:projectId/blocks', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const body = await c.req.json();
    const { title, description, type, position_x, position_y, width, height, metadata } = body;

    const blockId = generateId();
    const now = new Date().toISOString();

    const block = {
      id: blockId,
      project_id: projectId,
      title,
      description: description || '',
      type: type || 'figma',
      status: 'disconnected',
      position_x: position_x || 0,
      position_y: position_y || 0,
      width: width || 200,
      height: height || 150,
      metadata: metadata || {},
      created_at: now,
      updated_at: now,
    };

    await kv.set(getBlockKey(projectId, blockId), block);
    
    const blockIds = await kv.get(getProjectBlocksKey(projectId)) || [];
    blockIds.push(blockId);
    await kv.set(getProjectBlocksKey(projectId), blockIds);

    return c.json({ block });
  } catch (error) {
    console.error('Error creating block:', error);
    return c.json({ error: 'Failed to create block' }, 500);
  }
});

app.put('/make-server-6c8ffc9e/blocks/:id', async (c) => {
  try {
    const blockId = c.req.param('id');
    const body = await c.req.json();
    
    // Find which project this block belongs to
    const projectsList = await kv.get(getProjectsListKey()) || [];
    let foundBlock = null;
    let projectId = null;

    for (const pid of projectsList) {
      const blockIds = await kv.get(getProjectBlocksKey(pid)) || [];
      if (blockIds.includes(blockId)) {
        foundBlock = await kv.get(getBlockKey(pid, blockId));
        projectId = pid;
        break;
      }
    }

    if (!foundBlock || !projectId) {
      return c.json({ error: 'Block not found' }, 404);
    }

    const updatedBlock = {
      ...foundBlock,
      ...body,
      id: blockId,
      project_id: projectId,
      updated_at: new Date().toISOString(),
    };

    await kv.set(getBlockKey(projectId, blockId), updatedBlock);
    return c.json({ block: updatedBlock });
  } catch (error) {
    console.error('Error updating block:', error);
    return c.json({ error: 'Failed to update block' }, 500);
  }
});

// Relations routes
app.get('/make-server-6c8ffc9e/projects/:projectId/relations', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const relationIds = await kv.get(getProjectRelationsKey(projectId)) || [];
    const relations = [];

    for (const relationId of relationIds) {
      const relation = await kv.get(getRelationKey(projectId, relationId));
      if (relation) {
        relations.push(relation);
      }
    }

    return c.json({ relations });
  } catch (error) {
    console.error('Error fetching relations:', error);
    return c.json({ error: 'Failed to fetch relations' }, 500);
  }
});

app.post('/make-server-6c8ffc9e/projects/:projectId/relations', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const body = await c.req.json();
    const { source_block_id, target_block_id, type = 'connection', metadata } = body;

    const relationId = generateId();
    const now = new Date().toISOString();

    const relation = {
      id: relationId,
      project_id: projectId,
      source_block_id,
      target_block_id,
      type,
      metadata: metadata || {},
      created_at: now,
    };

    await kv.set(getRelationKey(projectId, relationId), relation);
    
    const relationIds = await kv.get(getProjectRelationsKey(projectId)) || [];
    relationIds.push(relationId);
    await kv.set(getProjectRelationsKey(projectId), relationIds);

    return c.json({ relation });
  } catch (error) {
    console.error('Error creating relation:', error);
    return c.json({ error: 'Failed to create relation' }, 500);
  }
});

// Members routes
app.get('/make-server-6c8ffc9e/projects/:projectId/members', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const memberIds = await kv.get(getProjectMembersKey(projectId)) || [];
    const members = [];

    for (const memberId of memberIds) {
      const member = await kv.get(getMemberKey(projectId, memberId));
      if (member) {
        members.push(member);
      }
    }

    return c.json({ members });
  } catch (error) {
    console.error('Error fetching members:', error);
    return c.json({ error: 'Failed to fetch members' }, 500);
  }
});

// FIXED INVITATION ROUTE - NO getUserByEmail
app.post('/make-server-6c8ffc9e/projects/:projectId/members/invite', async (c) => {
  console.log('🚀🚀🚀 INVITATION ROUTE - STARTING - FIXED VERSION v3.0 - NO getUserByEmail 🚀🚀🚀');
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Token invalide' }, 401);
    }

    const projectId = c.req.param('projectId');
    const body = await c.req.json();
    const { email, role = 'editor', message } = body;

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    console.log('=== INVITATION DEBUG ===');
    console.log('Email:', email);
    console.log('Role:', role);
    console.log('Project ID:', projectId);

    // Get project details
    const project = await kv.get(getProjectKey(projectId));
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get inviter details
    const inviterProfile = await kv.get(`user_profile:${user.id}`) || {
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Un utilisateur',
      email: user.email
    };

    // Check if member already exists
    const memberIds = await kv.get(getProjectMembersKey(projectId)) || [];
    for (const memberId of memberIds) {
      const existingMember = await kv.get(getMemberKey(projectId, memberId));
      if (existingMember && existingMember.email.toLowerCase() === email.toLowerCase()) {
        return c.json({ error: 'Member already exists' }, 409);
      }
    }

    // Get origin for redirect URL
    const referer = c.req.header('Referer');
    const origin = c.req.header('Origin') || (referer ? new URL(referer).origin : 'http://localhost:3000');
    const redirectTo = `${origin}/invitation?project=${projectId}&role=${role}`;
    
    console.log('Redirect URL:', redirectTo);

    try {
      // Check if user already exists first by attempting to get user
      let userAlreadyExists = false;
      try {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        userAlreadyExists = existingUsers.users.some(u => u.email === email);
        console.log('✅ User exists check:', userAlreadyExists);
      } catch (listError) {
        console.log('Cannot check existing users, proceeding with invitation attempt');
      }

      // If user exists, skip Supabase invitation and go directly to direct invitation
      if (userAlreadyExists) {
        console.log('🚀 User already exists, creating direct invitation');
        
        // Create direct invitation
        const invitationToken = generateId() + generateId();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const now = new Date().toISOString();
        
        console.log('📝 Creating invitation token:', invitationToken);
        
        try {
          await kv.set(`invitation:${invitationToken}`, {
            project_id: projectId,
            email,
            role,
            expires_at: expiresAt,
            created_at: now,
            method: 'direct_link'
          });
          console.log('✅ Invitation token saved to KV store');
        } catch (kvError) {
          console.error('❌ Failed to save invitation token:', kvError);
          return c.json({ error: 'Failed to create invitation token' }, 500);
        }

        // Create temporary member entry
        const memberId = generateId();
        const member = {
          id: memberId,
          project_id: projectId,
          email,
          name: email.split('@')[0],
          role,
          status: 'pending',
          invited_at: now,
          joined_at: null,
          last_active_at: null,
          message: message || null,
          avatarUrl: null,
          invited_by: user.id,
          supabase_user_id: null,
          invite_method: 'existing_user',
        };

        console.log('💾 Saving member entry:', memberId);

        try {
          await kv.set(getMemberKey(projectId, memberId), member);
          console.log('✅ Member entry saved');
        } catch (memberError) {
          console.error('❌ Failed to save member entry:', memberError);
          return c.json({ error: 'Failed to create member entry' }, 500);
        }
        
        // Update members list
        try {
          const updatedMemberIds = [...memberIds, memberId];
          await kv.set(getProjectMembersKey(projectId), updatedMemberIds);
          console.log('✅ Members list updated');
        } catch (listError) {
          console.error('❌ Failed to update members list:', listError);
          return c.json({ error: 'Failed to update members list' }, 500);
        }

        console.log('🎉 DIRECT INVITATION CREATED SUCCESSFULLY');
        
        return c.json({ 
          member: {
            ...member,
            supabase_user_id: undefined
          },
          invitation_sent: true,
          existing_user: true,
          invitation_method: 'direct_link',
          invitation_link: `${origin}/invitation?token=${invitationToken}`,
          message: 'Cet utilisateur a déjà un compte. Un lien d\'invitation directe a été créé.'
        });
      }

      // Try Supabase invitation for new users
      const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { 
          project_id: projectId,
          project_title: project.title,
          role: role,
          inviter_name: inviterProfile.name,
          inviter_email: inviterProfile.email,
          message: message || null
        },
        redirectTo
      });

      if (inviteError) {
        console.error('=== INVITATION ERROR ANALYSIS ===');
        console.error('Invitation error:', inviteError);
        console.error('Error code:', (inviteError as any).code);
        console.error('Error status:', (inviteError as any).status);
        console.error('Error name:', (inviteError as any).name);
        console.error('Error message:', inviteError.message);
        
        // Check if user already exists - handle AuthApiError specifically
        const isUserExists = inviteError.message?.includes('already been registered') || 
                             inviteError.message?.includes('User already registered') ||
                             inviteError.message?.includes('already exists') ||
                             (inviteError as any).code === 'email_exists' ||
                             (inviteError as any).status === 422;
        
        console.log('✅ ANALYSIS: Is user exists detected:', isUserExists);
        console.log('✅ ANALYSIS: Error code match:', (inviteError as any).code === 'email_exists');
        console.log('✅ ANALYSIS: Status match:', (inviteError as any).status === 422);
        
        if (isUserExists) {
          // This should not happen now since we check before attempting Supabase invitation
          console.log('⚠️ Fallback: User exists but was not caught by pre-check');
          return c.json({ 
            error: 'User already exists. Please try again.',
            code: 'email_exists'
          }, 422);
          
          // Create direct invitation
          const invitationToken = generateId() + generateId();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          const now = new Date().toISOString();
          
          console.log('📝 Creating invitation token:', invitationToken);
          
          try {
            await kv.set(`invitation:${invitationToken}`, {
              project_id: projectId,
              email,
              role,
              expires_at: expiresAt,
              created_at: now,
              method: 'direct_link'
            });
            console.log('✅ Invitation token saved to KV store');
          } catch (kvError) {
            console.error('❌ Failed to save invitation token:', kvError);
            return c.json({ error: 'Failed to create invitation token' }, 500);
          }

          // Create temporary member entry
          const memberId = generateId();
          const member = {
            id: memberId,
            project_id: projectId,
            email,
            name: email.split('@')[0],
            role,
            status: 'pending',
            invited_at: now,
            joined_at: null,
            last_active_at: null,
            message: message || null,
            avatarUrl: null,
            invited_by: user.id,
            supabase_user_id: null,
            invite_method: 'existing_user',
          };

          console.log('💾 Saving member entry:', memberId);

          try {
            await kv.set(getMemberKey(projectId, memberId), member);
            console.log('✅ Member entry saved');
          } catch (memberError) {
            console.error('❌ Failed to save member entry:', memberError);
            return c.json({ error: 'Failed to create member entry' }, 500);
          }
          
          // Update members list
          try {
            const updatedMemberIds = [...memberIds, memberId];
            await kv.set(getProjectMembersKey(projectId), updatedMemberIds);
            console.log('✅ Members list updated');
          } catch (listError) {
            console.error('❌ Failed to update members list:', listError);
            return c.json({ error: 'Failed to update members list' }, 500);
          }

          console.log('🎉 DIRECT INVITATION CREATED SUCCESSFULLY');
          
          return c.json({ 
            member: {
              ...member,
              supabase_user_id: undefined
            },
            invitation_sent: true,
            existing_user: true,
            invitation_method: 'direct_link',
            invitation_link: `${origin}/invitation?token=${invitationToken}`,
            message: 'Cet utilisateur a déjà un compte. Un lien d\'invitation directe a été créé.'
          });
        } else {
          return c.json({ 
            error: 'Failed to send invitation: ' + inviteError.message,
            details: inviteError.message
          }, 400);
        }
      }
      
      console.log('Supabase invitation sent successfully');

      // Create member entry for new user
      const memberId = data.user?.id || generateId();
      const now = new Date().toISOString();
      
      const member = {
        id: memberId,
        project_id: projectId,
        email,
        name: email.split('@')[0],
        role,
        status: 'invited',
        invited_at: now,
        joined_at: null,
        last_active_at: null,
        message: message || null,
        avatarUrl: null,
        invited_by: user.id,
        supabase_user_id: data.user?.id || null,
        invite_method: 'supabase_email',
      };

      // Save member
      await kv.set(getMemberKey(projectId, memberId), member);
      
      // Update members list for this project
      const updatedMemberIds = [...memberIds, memberId];
      await kv.set(getProjectMembersKey(projectId), updatedMemberIds);

      return c.json({ 
        member: {
          ...member,
          supabase_user_id: undefined
        },
        invitation_sent: true,
        supabase_invitation: true,
        invitation_method: 'supabase_email'
      });
    } catch (supabaseError) {
      console.error('Supabase error:', supabaseError);
      
      return c.json({ 
        error: 'Failed to send invitation',
        details: supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
      }, 500);
    }
  } catch (error) {
    console.error('General error:', error);
    return c.json({ error: 'Failed to invite member' }, 500);
  }
});

// Test invitation route
app.post('/make-server-6c8ffc9e/test/invitation', async (c) => {
  console.log('🧪 TEST INVITATION ROUTE - FIXED VERSION v3.0');
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Token invalide' }, 401);
    }

    const body = await c.req.json();
    const { email, role = 'editor', message } = body;

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Get origin for redirect URL
    const referer = c.req.header('Referer');
    const origin = c.req.header('Origin') || (referer ? new URL(referer).origin : 'http://localhost:3000');
    const redirectTo = `${origin}/invitation?project=test-project&role=${role}`;
    
    console.log('🧪 TEST INVITATION - Start');
    console.log('📧 Email:', email);
    console.log('🔗 Redirect URL:', redirectTo);

    try {
      console.log('📨 TEST: Attempting Supabase invitation...');
      
      const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { 
          project_id: 'test-project',
          project_title: 'Test Project',
          role: role,
          inviter_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Test User',
          inviter_email: user.email,
          message: message || 'Test invitation'
        },
        redirectTo
      });

      if (inviteError) {
        console.error('❌ TEST: Supabase invitation failed:', inviteError);
        
        // Check if the error is because the user already exists - handle AuthApiError specifically
        const isUserExists = inviteError.message?.includes('already been registered') || 
                             inviteError.message?.includes('User already registered') ||
                             inviteError.message?.includes('already exists') ||
                             (inviteError as any).code === 'email_exists' ||
                             (inviteError as any).status === 422;
        
        if (isUserExists) {
          
          console.log('✅ TEST: User exists, would create direct invitation');
          return c.json({
            success: true,
            test_result: 'User exists - would create direct invitation',
            existing_user: true,
            invitation_method: 'direct_link',
            error_handled: true,
            original_error: inviteError.message,
            test_mode: true
          });
        } else {
          return c.json({ 
            success: false,
            test_result: 'Supabase invitation failed',
            error: inviteError.message || 'Unknown error',
            error_details: inviteError,
            redirect_url: redirectTo,
            test_mode: true
          }, 400);
        }
      }

      console.log('✅ TEST: Supabase invitation successful');
      return c.json({
        success: true,
        test_result: 'Supabase invitation sent successfully',
        user_id: data.user?.id,
        invitation_method: 'supabase_email',
        redirect_url: redirectTo,
        test_mode: true
      });
    } catch (supabaseError) {
      console.error('💥 TEST: Supabase error:', supabaseError);
      return c.json({
        success: false,
        test_result: 'Supabase operation failed',
        error: supabaseError instanceof Error ? supabaseError.message : 'Unknown Supabase error',
        test_mode: true
      }, 500);
    }
  } catch (error) {
    console.error('💥 TEST: General error:', error);
    return c.json({
      success: false,
      test_result: 'General test failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      test_mode: true
    }, 500);
  }
});

// Get invitation details by token (for existing users)
app.get('/make-server-6c8ffc9e/invitations/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const invitation = await kv.get(`invitation:${token}`);
    
    if (!invitation) {
      return c.json({ error: 'Invitation not found' }, 404);
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expires_at)) {
      return c.json({ error: 'Invitation expired' }, 410);
    }

    // Get project details
    const project = await kv.get(getProjectKey(invitation.project_id));
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({
      invitation: {
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          type: project.type,
        },
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        method: invitation.method || 'direct_link'
      }
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return c.json({ error: 'Failed to fetch invitation' }, 500);
  }
});

// Accept invitation with token (for existing users)
app.post('/make-server-6c8ffc9e/invitations/:token/accept', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Token invalide' }, 401);
    }

    const token = c.req.param('token');
    const invitation = await kv.get(`invitation:${token}`);
    
    if (!invitation) {
      return c.json({ error: 'Invitation not found' }, 404);
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expires_at)) {
      return c.json({ error: 'Invitation expired' }, 410);
    }

    // Check if the user's email matches the invitation
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return c.json({ error: 'Email mismatch. Please sign in with the invited email address.' }, 403);
    }

    const projectId = invitation.project_id;

    // Get user profile
    const userProfile = await kv.get(`user_profile:${user.id}`) || {
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
      email: user.email,
      avatar_url: null,
    };

    // Create member entry
    const memberId = user.id;
    const member = {
      id: memberId,
      project_id: projectId,
      email: invitation.email,
      name: userProfile.name,
      role: invitation.role,
      status: 'active',
      invited_at: invitation.created_at,
      joined_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      message: null,
      avatarUrl: userProfile.avatar_url,
      invited_by: null,
      supabase_user_id: user.id,
      invite_method: 'direct_link',
    };

    // Save member
    await kv.set(getMemberKey(projectId, memberId), member);
    
    // Update members list
    const memberIds = await kv.get(getProjectMembersKey(projectId)) || [];
    if (!memberIds.includes(memberId)) {
      memberIds.push(memberId);
      await kv.set(getProjectMembersKey(projectId), memberIds);
    }

    // Add project to user's projects list
    const userProjectsList = await kv.get(getUserProjectsKey(user.id)) || [];
    if (!userProjectsList.includes(projectId)) {
      userProjectsList.push(projectId);
      await kv.set(getUserProjectsKey(user.id), userProjectsList);
    }

    // Clean up invitation token
    await kv.del(`invitation:${token}`);

    // Get the project for the response
    const project = await kv.get(getProjectKey(projectId));

    return c.json({ 
      member,
      project,
      message: 'Invitation accepted successfully' 
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return c.json({ error: 'Failed to accept invitation' }, 500);
  }
});

// Remove member from project
app.delete('/make-server-6c8ffc9e/projects/:projectId/members/:memberId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Token invalide' }, 401);
    }

    const projectId = c.req.param('projectId');
    const memberId = c.req.param('memberId');
    
    console.log('=== REMOVE MEMBER DEBUG ===');
    console.log('Current user ID:', user.id);
    console.log('Project ID:', projectId);
    console.log('Member to remove ID:', memberId);

    // Check if project exists
    const project = await kv.get(getProjectKey(projectId));
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if the current user has permission to remove members
    // First check if user is the project owner (highest permission)
    const isProjectOwner = project.owner_id === user.id;
    
    if (isProjectOwner) {
      console.log('✅ Current user is project owner - has all permissions');
    } else {
      // If not owner, check member permissions
      const currentUserMember = await kv.get(getMemberKey(projectId, user.id));
      console.log('Current user member data:', currentUserMember);
      
      if (!currentUserMember) {
        console.log('❌ Current user is not a member of this project');
        return c.json({ error: 'You are not a member of this project' }, 403);
      }
      
      if (!['owner', 'admin'].includes(currentUserMember.role)) {
        console.log('❌ Current user role insufficient:', currentUserMember.role);
        return c.json({ error: `Permission denied: your role is '${currentUserMember.role}', need 'owner' or 'admin'` }, 403);
      }
      
      console.log('✅ Current user has permission to remove members:', currentUserMember.role);
    }


    // Prevent removing the owner
    const memberToRemove = await kv.get(getMemberKey(projectId, memberId));
    console.log('Member to remove data:', memberToRemove);
    
    if (!memberToRemove) {
      console.log('❌ Member to remove not found');
      return c.json({ error: 'Member not found' }, 404);
    }

    if (memberToRemove.role === 'owner') {
      console.log('❌ Cannot remove project owner');
      return c.json({ error: 'Cannot remove project owner' }, 403);
    }
    
    console.log('✅ Member can be removed:', memberToRemove.role);

    // Remove member from project
    await kv.del(getMemberKey(projectId, memberId));
    
    // Remove from members list
    const memberIds = await kv.get(getProjectMembersKey(projectId)) || [];
    const updatedMemberIds = memberIds.filter(id => id !== memberId);
    await kv.set(getProjectMembersKey(projectId), updatedMemberIds);

    // Remove project from user's projects list if they have a user account
    if (memberToRemove.supabase_user_id) {
      const userProjectsList = await kv.get(getUserProjectsKey(memberToRemove.supabase_user_id)) || [];
      const updatedUserProjects = userProjectsList.filter(pid => pid !== projectId);
      await kv.set(getUserProjectsKey(memberToRemove.supabase_user_id), updatedUserProjects);
    }

    console.log('✅ Member removed successfully');
    return c.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// Update member role
app.patch('/make-server-6c8ffc9e/projects/:projectId/members/:memberId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Token invalide' }, 401);
    }

    const projectId = c.req.param('projectId');
    const memberId = c.req.param('memberId');
    const body = await c.req.json();
    const { role } = body;

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    // Check if project exists
    const project = await kv.get(getProjectKey(projectId));
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if the current user has permission to update roles
    // First check if user is the project owner (highest permission)
    const isProjectOwner = project.owner_id === user.id;
    
    if (!isProjectOwner) {
      // If not owner, check member permissions
      const currentUserMember = await kv.get(getMemberKey(projectId, user.id));
      if (!currentUserMember || !['owner', 'admin'].includes(currentUserMember.role)) {
        return c.json({ error: 'Permission denied' }, 403);
      }
    }

    // Get member to update
    const memberToUpdate = await kv.get(getMemberKey(projectId, memberId));
    if (!memberToUpdate) {
      return c.json({ error: 'Member not found' }, 404);
    }

    // Cannot change owner role
    if (memberToUpdate.role === 'owner') {
      return c.json({ error: 'Cannot change owner role' }, 403);
    }

    // Update member role
    const updatedMember = {
      ...memberToUpdate,
      role,
      updated_at: new Date().toISOString()
    };

    await kv.set(getMemberKey(projectId, memberId), updatedMember);

    return c.json({ success: true, member: updatedMember });
  } catch (error) {
    console.error('Error updating member role:', error);
    return c.json({ error: 'Failed to update member role' }, 500);
  }
});

// Delete project route
app.delete('/make-server-6c8ffc9e/projects/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Token invalide' }, 401);
    }

    const projectId = c.req.param('id');
    const project = await kv.get(getProjectKey(projectId));
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check permissions - only owner can delete project
    if (project.owner_id !== user.id) {
      return c.json({ error: 'Only project owner can delete the project' }, 403);
    }

    // Delete all project blocks
    const blockIds = await kv.get(getProjectBlocksKey(projectId)) || [];
    for (const blockId of blockIds) {
      await kv.del(getBlockKey(projectId, blockId));
    }
    await kv.del(getProjectBlocksKey(projectId));

    // Delete all project relations
    const relationIds = await kv.get(getProjectRelationsKey(projectId)) || [];
    for (const relationId of relationIds) {
      await kv.del(getRelationKey(projectId, relationId));
    }
    await kv.del(getProjectRelationsKey(projectId));

    // Delete all project members
    const memberIds = await kv.get(getProjectMembersKey(projectId)) || [];
    for (const memberId of memberIds) {
      const member = await kv.get(getMemberKey(projectId, memberId));
      await kv.del(getMemberKey(projectId, memberId));
      
      // Remove project from user's projects list if they have a user account
      if (member && member.supabase_user_id) {
        const userProjectsList = await kv.get(getUserProjectsKey(member.supabase_user_id)) || [];
        const updatedUserProjects = userProjectsList.filter(pid => pid !== projectId);
        await kv.set(getUserProjectsKey(member.supabase_user_id), updatedUserProjects);
      }
    }
    await kv.del(getProjectMembersKey(projectId));

    // Delete the project itself
    await kv.del(getProjectKey(projectId));

    // Remove from global projects list
    const projectsList = await kv.get(getProjectsListKey()) || [];
    const updatedProjectsList = projectsList.filter(id => id !== projectId);
    await kv.set(getProjectsListKey(), updatedProjectsList);

    // Remove from owner's projects list
    const ownerProjectsList = await kv.get(getUserProjectsKey(user.id)) || [];
    const updatedOwnerProjects = ownerProjectsList.filter(id => id !== projectId);
    await kv.set(getUserProjectsKey(user.id), updatedOwnerProjects);

    return c.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

// Additional routes that might be needed
app.delete('/make-server-6c8ffc9e/blocks/:id', async (c) => {
  try {
    const blockId = c.req.param('id');
    
    // Find which project this block belongs to
    const projectsList = await kv.get(getProjectsListKey()) || [];
    let projectId = null;

    for (const pid of projectsList) {
      const blockIds = await kv.get(getProjectBlocksKey(pid)) || [];
      if (blockIds.includes(blockId)) {
        projectId = pid;
        break;
      }
    }

    if (!projectId) {
      return c.json({ error: 'Block not found' }, 404);
    }

    // Delete block
    await kv.del(getBlockKey(projectId, blockId));
    
    // Remove from blocks list
    const blockIds = await kv.get(getProjectBlocksKey(projectId)) || [];
    const updatedBlockIds = blockIds.filter(id => id !== blockId);
    await kv.set(getProjectBlocksKey(projectId), updatedBlockIds);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting block:', error);
    return c.json({ error: 'Failed to delete block' }, 500);
  }
});

app.delete('/make-server-6c8ffc9e/relations/:id', async (c) => {
  try {
    const relationId = c.req.param('id');
    
    // Find which project this relation belongs to
    const projectsList = await kv.get(getProjectsListKey()) || [];
    let projectId = null;

    for (const pid of projectsList) {
      const relationIds = await kv.get(getProjectRelationsKey(pid)) || [];
      if (relationIds.includes(relationId)) {
        projectId = pid;
        break;
      }
    }

    if (!projectId) {
      return c.json({ error: 'Relation not found' }, 404);
    }

    // Delete relation
    await kv.del(getRelationKey(projectId, relationId));
    
    // Remove from relations list
    const relationIds = await kv.get(getProjectRelationsKey(projectId)) || [];
    const updatedRelationIds = relationIds.filter(id => id !== relationId);
    await kv.set(getProjectRelationsKey(projectId), updatedRelationIds);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting relation:', error);
    return c.json({ error: 'Failed to delete relation' }, 500);
  }
});

app.put('/make-server-6c8ffc9e/auth/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Token invalide' }, 401);
    }

    const body = await c.req.json();
    const { name, avatar_url } = body;

    // Get existing profile
    const existingProfile = await kv.get(`user_profile:${user.id}`);
    
    const updatedProfile = {
      ...existingProfile,
      name: name || existingProfile?.name || user.email?.split('@')[0] || 'Utilisateur',
      avatar_url: avatar_url || existingProfile?.avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`user_profile:${user.id}`, updatedProfile);
    return c.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: 'Erreur lors de la mise à jour du profil' }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);