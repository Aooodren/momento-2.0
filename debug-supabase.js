// Script de debug pour tester la connexion Supabase
// À exécuter dans la console du navigateur

console.log('🔍 Debug Supabase - Momento 2.0');

// Test de la connexion
async function debugSupabase() {
  try {
    // Importer le client Supabase (si disponible dans window)
    const { supabase } = window;
    if (!supabase) {
      console.error('❌ Supabase client non trouvé dans window');
      return;
    }

    console.log('✅ Client Supabase trouvé');

    // Vérifier l'authentification
    const { data: user, error: authError } = await supabase.auth.getUser();
    console.log('👤 Utilisateur:', user);
    if (authError) console.error('❌ Erreur auth:', authError);

    // Tester l'accès à la table projects
    console.log('📋 Test accès table projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    console.log('📋 Projets:', projects);
    if (projectsError) console.error('❌ Erreur projects:', projectsError);

    // Tester l'accès à la table blocks
    console.log('🧩 Test accès table blocks...');
    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .select('*')
      .limit(5);
    
    console.log('🧩 Blocs:', blocks);
    if (blocksError) console.error('❌ Erreur blocks:', blocksError);

    // Tester création d'un bloc simple
    if (user?.user && projects?.[0]) {
      console.log('🔬 Test création bloc...');
      const { data: newBlock, error: createError } = await supabase
        .from('blocks')
        .insert({
          project_id: projects[0].id,
          title: 'Test Debug Block',
          type: 'standard',
          position_x: 100,
          position_y: 100,
          created_by: user.user.id
        })
        .select()
        .single();
      
      console.log('🔬 Nouveau bloc:', newBlock);
      if (createError) console.error('❌ Erreur création:', createError);
      
      // Supprimer le bloc de test
      if (newBlock) {
        await supabase.from('blocks').delete().eq('id', newBlock.id);
        console.log('🗑️ Bloc de test supprimé');
      }
    }

  } catch (error) {
    console.error('💥 Erreur globale:', error);
  }
}

// Exécuter le debug
debugSupabase();