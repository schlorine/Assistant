import { createClient } from '@supabase/supabase-js'

// 将下面这两个字符串替换为你刚才复制的真实 URL 和 Key
const supabaseUrl = 'https://ojcdamfcrqixunuwpezz.supabase.co'
const supabaseKey = 'sb_publishable_M0yz1NuNeICcl-w2LfqIVw_Rr5pwo0c'

// 创建并导出一个全局唯一的 Supabase 客户端实例
export const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim())