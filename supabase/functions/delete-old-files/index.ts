import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const threeDaysAgoIso = threeDaysAgo.toISOString()

    console.log(`Cleaning up files older than: ${threeDaysAgoIso}`)

    // 1. List files in the bucket
    // Note: This is simplified. In a real scenario with many files, 
    // you might want to paginate or use a DB query to find paths.
    const { data: files, error: listError } = await supabase
      .storage
      .from('chat-attachments')
      .list('', { limit: 1000 })

    if (listError) throw listError

    const filesToDelete = files
      ?.filter(f => f.created_at < threeDaysAgoIso)
      .map(f => f.name) ?? []

    if (filesToDelete.length === 0) {
      return new Response(JSON.stringify({ message: 'No files to delete' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Delete files from storage
    const { error: deleteError } = await supabase
      .storage
      .from('chat-attachments')
      .remove(filesToDelete)

    if (deleteError) throw deleteError

    // 3. Clear URLs in the messages table to avoid broken links
    // We match by filename in the URL (this is a bit heuristic)
    // A better way would be to store the full path in a separate column.
    for (const fileName of filesToDelete) {
      await supabase
        .from('mensagens_chat')
        .update({ arquivo_url: null, conteudo: '[Arquivo expirado e removido]' })
        .like('arquivo_url', `%${fileName}%`)
    }

    return new Response(JSON.stringify({ 
      message: `Deleted ${filesToDelete.length} files`,
      files: filesToDelete 
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
