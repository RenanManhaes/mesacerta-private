// Gerado por mcp__claude_ai_Supabase__generate_typescript_types a partir do
// projeto zcsvoeznilzqborkycmi ("Mesa Certa", sa-east-1) em 2026-10-01, depois
// de aplicar as migrations 0001-0007 (supabase/migrations/) — 0007 corrige a
// escalação de privilégio em memberships_insert e adiciona a função
// criar_organizacao() (ver docs/modelo-de-dados.md, seção "Vulnerabilidade
// crítica corrigida").
//
// Não editar à mão. Para atualizar, rode generate_typescript_types de novo e
// substitua este arquivo inteiro.
//
// Colocado fora de src/ propositalmente: dois outros agentes estão
// trabalhando sob src/ (páginas/componentes e design system) neste momento;
// o arquivo mora aqui até a tarefa de troca do auth/cliente de dados (fora
// do escopo de MCT-3/MCT-4) decidir onde a camada de acesso a dados vai
// importar os tipos.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          conflito: boolean
          conflito_motivo: string | null
          created_at: string
          distribution_version_id: string
          event_id: string
          host_id: string | null
          id: string
          organization_id: string
          participant_id: string | null
          round_id: string
          seat_id: string
        }
        Insert: {
          conflito?: boolean
          conflito_motivo?: string | null
          created_at?: string
          distribution_version_id: string
          event_id: string
          host_id?: string | null
          id?: string
          organization_id: string
          participant_id?: string | null
          round_id: string
          seat_id: string
        }
        Update: {
          conflito?: boolean
          conflito_motivo?: string | null
          created_at?: string
          distribution_version_id?: string
          event_id?: string
          host_id?: string | null
          id?: string
          organization_id?: string
          participant_id?: string | null
          round_id?: string
          seat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_distribution_version_id_fkey"
            columns: ["distribution_version_id"]
            isOneToOne: false
            referencedRelation: "distribution_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_versions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          organization_id: string
          published_at: string | null
          seed: number | null
          status: string
          versao: number
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          organization_id: string
          published_at?: string | null
          seed?: number | null
          status?: string
          versao: number
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          organization_id?: string
          published_at?: string | null
          seed?: number | null
          status?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "distribution_versions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacidade_espaco: number | null
          cidade: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          local_nome: string | null
          nome: string
          organization_id: string
          publico_esperado: number | null
          status: string
          tem_fornecedores: boolean
          tem_ingressos: boolean
          tem_networking: boolean
          tem_patrocinadores: boolean
          tem_programacao: boolean
          updated_at: string
        }
        Insert: {
          capacidade_espaco?: number | null
          cidade?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          local_nome?: string | null
          nome: string
          organization_id: string
          publico_esperado?: number | null
          status?: string
          tem_fornecedores?: boolean
          tem_ingressos?: boolean
          tem_networking?: boolean
          tem_patrocinadores?: boolean
          tem_programacao?: boolean
          updated_at?: string
        }
        Update: {
          capacidade_espaco?: number | null
          cidade?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          local_nome?: string | null
          nome?: string
          organization_id?: string
          publico_esperado?: number | null
          status?: string
          tem_fornecedores?: boolean
          tem_ingressos?: boolean
          tem_networking?: boolean
          tem_patrocinadores?: boolean
          tem_programacao?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          categoria: string | null
          created_at: string
          descricao: string
          event_id: string
          id: string
          observacao: string | null
          organization_id: string
          percentual: number | null
          quantidade: number | null
          status: string
          supplier_id: string | null
          tipo_custo: string
          updated_at: string
          valor_previsto: number
          valor_real: number
          valor_unitario: number | null
          vencimento: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          descricao: string
          event_id: string
          id?: string
          observacao?: string | null
          organization_id: string
          percentual?: number | null
          quantidade?: number | null
          status?: string
          supplier_id?: string | null
          tipo_custo?: string
          updated_at?: string
          valor_previsto?: number
          valor_real?: number
          valor_unitario?: number | null
          vencimento?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          descricao?: string
          event_id?: string
          id?: string
          observacao?: string | null
          organization_id?: string
          percentual?: number | null
          quantidade?: number | null
          status?: string
          supplier_id?: string | null
          tipo_custo?: string
          updated_at?: string
          valor_previsto?: number
          valor_real?: number
          valor_unitario?: number | null
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      hosts: {
        Row: {
          created_at: string
          event_id: string
          id: string
          networking_table_id: string
          organization_id: string
          participant_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          networking_table_id: string
          organization_id: string
          participant_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          networking_table_id?: string
          organization_id?: string
          participant_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosts_networking_table_id_fkey"
            columns: ["networking_table_id"]
            isOneToOne: false
            referencedRelation: "networking_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosts_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          capacidade: number | null
          created_at: string
          endereco: string | null
          event_id: string
          id: string
          nome: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          capacidade?: number | null
          created_at?: string
          endereco?: string | null
          event_id: string
          id?: string
          nome: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          capacidade?: number | null
          created_at?: string
          endereco?: string | null
          event_id?: string
          id?: string
          nome?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      networking_tables: {
        Row: {
          capacidade: number
          created_at: string
          event_id: string
          id: string
          nome: string | null
          numero: number
          organization_id: string
          updated_at: string
        }
        Insert: {
          capacidade: number
          created_at?: string
          event_id: string
          id?: string
          nome?: string | null
          numero: number
          organization_id: string
          updated_at?: string
        }
        Update: {
          capacidade?: number
          created_at?: string
          event_id?: string
          id?: string
          nome?: string | null
          numero?: number
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "networking_tables_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "networking_tables_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          cargo: string | null
          created_at: string
          descricao_empresa: string | null
          email: string | null
          empresa: string | null
          event_id: string
          id: string
          nome: string
          observacoes: string | null
          organization_id: string
          segmento: string | null
          status: string
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          descricao_empresa?: string | null
          email?: string | null
          empresa?: string | null
          event_id: string
          id?: string
          nome: string
          observacoes?: string | null
          organization_id: string
          segmento?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          descricao_empresa?: string | null
          email?: string | null
          empresa?: string | null
          event_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string
          segmento?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          data_pagamento: string
          event_id: string
          expense_id: string | null
          id: string
          metodo: string | null
          observacao: string | null
          organization_id: string
          revenue_id: string | null
          sponsor_id: string | null
          status: string
          supplier_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string
          event_id: string
          expense_id?: string | null
          id?: string
          metodo?: string | null
          observacao?: string | null
          organization_id: string
          revenue_id?: string | null
          sponsor_id?: string | null
          status?: string
          supplier_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string
          event_id?: string
          expense_id?: string | null
          id?: string
          metodo?: string | null
          observacao?: string | null
          organization_id?: string
          revenue_id?: string | null
          sponsor_id?: string | null
          status?: string
          supplier_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_revenue_id_fkey"
            columns: ["revenue_id"]
            isOneToOne: false
            referencedRelation: "revenues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      revenues: {
        Row: {
          categoria: string | null
          created_at: string
          data_prevista: string | null
          data_recebida: string | null
          descricao: string
          event_id: string
          id: string
          organization_id: string
          previsto: number
          recebido: number
          status: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_prevista?: string | null
          data_recebida?: string | null
          descricao: string
          event_id: string
          id?: string
          organization_id: string
          previsto?: number
          recebido?: number
          status?: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_prevista?: string | null
          data_recebida?: string | null
          descricao?: string
          event_id?: string
          id?: string
          organization_id?: string
          previsto?: number
          recebido?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenues_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          created_at: string
          distribution_version_id: string
          event_id: string
          id: string
          numero: number
          organization_id: string
        }
        Insert: {
          created_at?: string
          distribution_version_id: string
          event_id: string
          id?: string
          numero: number
          organization_id: string
        }
        Update: {
          created_at?: string
          distribution_version_id?: string
          event_id?: string
          id?: string
          numero?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_distribution_version_id_fkey"
            columns: ["distribution_version_id"]
            isOneToOne: false
            referencedRelation: "distribution_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          created_at: string
          descricao: string | null
          duracao_min: number
          event_id: string
          hora_inicio: string | null
          id: string
          ordem: number
          organization_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          duracao_min?: number
          event_id: string
          hora_inicio?: string | null
          id?: string
          ordem?: number
          organization_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          duracao_min?: number
          event_id?: string
          hora_inicio?: string | null
          id?: string
          ordem?: number
          organization_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      seats: {
        Row: {
          created_at: string
          event_id: string
          id: string
          networking_table_id: string
          organization_id: string
          posicao: number
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          networking_table_id: string
          organization_id: string
          posicao: number
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          networking_table_id?: string
          organization_id?: string
          posicao?: number
        }
        Relationships: [
          {
            foreignKeyName: "seats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seats_networking_table_id_fkey"
            columns: ["networking_table_id"]
            isOneToOne: false
            referencedRelation: "networking_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          nome: string
          organization_id: string
          parametros: Json
          resultado: Json
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          nome?: string
          organization_id: string
          parametros?: Json
          resultado?: Json
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          nome?: string
          organization_id?: string
          parametros?: Json
          resultado?: Json
        }
        Relationships: [
          {
            foreignKeyName: "simulations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_plans: {
        Row: {
          beneficios: Json
          cortesias: number
          created_at: string
          entregaveis: Json
          event_id: string
          id: string
          nome: string
          organization_id: string
          preco: number
          quantidade: number | null
          updated_at: string
        }
        Insert: {
          beneficios?: Json
          cortesias?: number
          created_at?: string
          entregaveis?: Json
          event_id: string
          id?: string
          nome: string
          organization_id: string
          preco?: number
          quantidade?: number | null
          updated_at?: string
        }
        Update: {
          beneficios?: Json
          cortesias?: number
          created_at?: string
          entregaveis?: Json
          event_id?: string
          id?: string
          nome?: string
          organization_id?: string
          preco?: number
          quantidade?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_plans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          contato: string | null
          convidados: number
          created_at: string
          empresa: string
          entregaveis: Json
          event_id: string
          id: string
          organization_id: string
          recebido: number
          sponsor_plan_id: string | null
          status: string
          updated_at: string
          valor_negociado: number
          vencimentos: Json
        }
        Insert: {
          contato?: string | null
          convidados?: number
          created_at?: string
          empresa: string
          entregaveis?: Json
          event_id: string
          id?: string
          organization_id: string
          recebido?: number
          sponsor_plan_id?: string | null
          status?: string
          updated_at?: string
          valor_negociado?: number
          vencimentos?: Json
        }
        Update: {
          contato?: string | null
          convidados?: number
          created_at?: string
          empresa?: string
          entregaveis?: Json
          event_id?: string
          id?: string
          organization_id?: string
          recebido?: number
          sponsor_plan_id?: string | null
          status?: string
          updated_at?: string
          valor_negociado?: number
          vencimentos?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_sponsor_plan_id_fkey"
            columns: ["sponsor_plan_id"]
            isOneToOne: false
            referencedRelation: "sponsor_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          categoria: string | null
          contato: string | null
          contrato: string | null
          created_at: string
          dados_pagamento: Json | null
          event_id: string
          id: string
          nome: string
          observacoes: string | null
          organization_id: string
          proximo_vencimento: string | null
          servico: string | null
          status: string
          updated_at: string
          valor_entrada: number | null
          valor_pago: number
        }
        Insert: {
          categoria?: string | null
          contato?: string | null
          contrato?: string | null
          created_at?: string
          dados_pagamento?: Json | null
          event_id: string
          id?: string
          nome: string
          observacoes?: string | null
          organization_id: string
          proximo_vencimento?: string | null
          servico?: string | null
          status?: string
          updated_at?: string
          valor_entrada?: number | null
          valor_pago?: number
        }
        Update: {
          categoria?: string | null
          contato?: string | null
          contrato?: string | null
          created_at?: string
          dados_pagamento?: Json | null
          event_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string
          proximo_vencimento?: string | null
          servico?: string | null
          status?: string
          updated_at?: string
          valor_entrada?: number | null
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          categoria: string | null
          created_at: string
          descricao: string | null
          event_id: string
          id: string
          organization_id: string
          prazo: string | null
          prioridade: string
          responsavel: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          event_id: string
          id?: string
          organization_id: string
          prazo?: string | null
          prioridade?: string
          responsavel?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          event_id?: string
          id?: string
          organization_id?: string
          prazo?: string | null
          prioridade?: string
          responsavel?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_lots: {
        Row: {
          created_at: string
          desconto: number
          event_id: string
          fim: string | null
          id: string
          inicio: string | null
          nome: string
          organization_id: string
          preco: number
          quantidade: number
          taxa: number
          ticket_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          desconto?: number
          event_id: string
          fim?: string | null
          id?: string
          inicio?: string | null
          nome: string
          organization_id: string
          preco?: number
          quantidade?: number
          taxa?: number
          ticket_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          desconto?: number
          event_id?: string
          fim?: string | null
          id?: string
          inicio?: string | null
          nome?: string
          organization_id?: string
          preco?: number
          quantidade?: number
          taxa?: number
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_lots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_lots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_lots_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          descricao: string | null
          event_id: string
          id: string
          nome: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          event_id: string
          id?: string
          nome: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          event_id?: string
          id?: string
          nome?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      criar_organizacao: { Args: { p_nome: string }; Returns: string }
      is_org_admin: { Args: { p_organization_id: string }; Returns: boolean }
      is_org_member: { Args: { p_organization_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
