import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/middleware'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const app = new Hono()

// Middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))
app.use('*', logger(console.log))

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// KV Store utility functions
const KV_PREFIX = 'innovation_canvas';

async function kvGet(key: string) {
  const { data, error } = await supabase
    .from('kv_store_6c8ffc9e')
    .select('value')
    .eq('key', `${KV_PREFIX}:${key}`)
    .single();
  
  if (error) return null;
  return data?.value;
}

async function kvSet(key: string, value: any) {
  const { error } = await supabase
    .from('kv_store_6c8ffc9e')
    .upsert({ 
      key: `${KV_PREFIX}:${key}`, 
      value,
      updated_at: new Date().toISOString()
    });
  
  if (error) throw error;
}

async function kvDel(key: string) {
  const { error } = await supabase
    .from('kv_store_6c8ffc9e')
    .delete()
    .eq('key', `${KV_PREFIX}:${key}`);
  
  if (error) throw error;
}

async function kvGetByPrefix(prefix: string) {
  const { data, error } = await supabase
    .from('kv_store_6c8ffc9e')
    .select('key, value')
    .like('key', `${KV_PREFIX}:${prefix}%`);
  
  if (error) return [];
  return data || [];
}

async function kvMdel(keys: string[]) {
  const prefixedKeys = keys.map(key => `${KV_PREFIX}:${key}`);
  const { error } = await supabase
    .from('kv_store_6c8ffc9e')
    .delete()
    .in('key', prefixedKeys);
  
  if (error) throw error;
}

// Helper function to validate user
async function validateUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return { error: 'No access token provided', status: 401 };
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  return { user, error: null };
}

// --- PROJECT ROUTES ---

// Get all projects for a user
app.get('/projects', async (c) => {
  try {
    const { user, error } = await validateUser(c.req.raw);
    if (error) {
      return c.json({ error }, 401);
    }

    const projects = await kvGetByPrefix(`project:${user.id}:`);
    
    return c.json({
      success: true,
      projects: projects.map(p => ({
        id: p.key.split(':')[3], // KV_PREFIX:project:user_id:project_id
        ...p.value
      }))
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

// Get a specific project
app.get('/projects/:id', async (c) => {
  try {
    const { user, error } = await validateUser(c.req.raw);
    if (error) {
      return c.json({ error }, 401);
    }

    const projectId = c.req.param('id');
    const project = await kvGet(`project:${user.id}:${projectId}`);
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({
      success: true,
      project: {
        id: projectId,
        ...project
      }
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

// Create a new project
app.post('/projects', async (c) => {
  try {
    const { user, error } = await validateUser(c.req.raw);
    if (error) {
      return c.json({ error }, 401);
    }

    const body = await c.req.json();
    const { name, description } = body;

    if (!name || !description) {
      return c.json({ error: 'Name and description are required' }, 400);
    }

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const now = new Date().toISOString();

    const projectData = {
      name,
      description,
      created_at: now,
      updated_at: now,
      user_id: user.id
    };

    await kvSet(`project:${user.id}:${projectId}`, projectData);

    // Initialize empty canvas data
    const defaultCanvasData = {
      nodes: [],
      edges: []
    };

    await kvSet(`canvas:${user.id}:${projectId}`, {
      canvas_data: defaultCanvasData,
      updated_at: now
    });

    return c.json({
      success: true,
      project: {
        id: projectId,
        ...projectData
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

// Update a project
app.put('/projects/:id', async (c) => {
  try {
    const { user, error } = await validateUser(c.req.raw);
    if (error) {
      return c.json({ error }, 401);
    }

    const projectId = c.req.param('id');
    const body = await c.req.json();
    const { name, description } = body;

    const existingProject = await kvGet(`project:${user.id}:${projectId}`);
    if (!existingProject) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const updatedProject = {
      ...existingProject,
      name: name || existingProject.name,
      description: description || existingProject.description,
      updated_at: new Date().toISOString()
    };

    await kvSet(`project:${user.id}:${projectId}`, updatedProject);

    return c.json({
      success: true,
      project: {
        id: projectId,
        ...updatedProject
      }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// Delete a project
app.delete('/projects/:id', async (c) => {
  try {
    const { user, error } = await validateUser(c.req.raw);
    if (error) {
      return c.json({ error }, 401);
    }

    const projectId = c.req.param('id');
    
    // Delete project and associated canvas data
    await kvMdel([
      `project:${user.id}:${projectId}`,
      `canvas:${user.id}:${projectId}`
    ]);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

// --- CANVAS DATA ROUTES ---

// Get canvas data for a project
app.get('/projects/:id/canvas', async (c) => {
  try {
    const { user, error } = await validateUser(c.req.raw);
    if (error) {
      return c.json({ error }, 401);
    }

    const projectId = c.req.param('id');
    
    // Check if project exists
    const project = await kvGet(`project:${user.id}:${projectId}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const canvasData = await kvGet(`canvas:${user.id}:${projectId}`);
    
    return c.json({
      success: true,
      canvas_data: canvasData?.canvas_data || { nodes: [], edges: [] },
      updated_at: canvasData?.updated_at || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching canvas data:', error);
    return c.json({ error: 'Failed to fetch canvas data' }, 500);
  }
});

// Save canvas data for a project
app.put('/projects/:id/canvas', async (c) => {
  try {
    const { user, error } = await validateUser(c.req.raw);
    if (error) {
      return c.json({ error }, 401);
    }

    const projectId = c.req.param('id');
    const body = await c.req.json();
    const { canvas_data } = body;

    if (!canvas_data || !canvas_data.nodes || !canvas_data.edges) {
      return c.json({ error: 'Invalid canvas data format' }, 400);
    }

    // Check if project exists
    const project = await kvGet(`project:${user.id}:${projectId}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const now = new Date().toISOString();

    await kvSet(`canvas:${user.id}:${projectId}`, {
      canvas_data,
      updated_at: now
    });

    // Update project's updated_at timestamp
    await kvSet(`project:${user.id}:${projectId}`, {
      ...project,
      updated_at: now
    });

    return c.json({
      success: true,
      updated_at: now
    });
  } catch (error) {
    console.error('Error saving canvas data:', error);
    return c.json({ error: 'Failed to save canvas data' }, 500);
  }
});

// --- AUTH ROUTES ---

// Sign up route
app.post('/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({
      success: true,
      user: data.user
    });
  } catch (error) {
    console.error('Error during signup:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);