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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      backtest_trades: {
        Row: {
          atr: number | null
          backtest_id: string
          confidence: number
          created_at: string
          days_held: number | null
          entry_date: string
          entry_price: number
          exit_date: string | null
          exit_price: number | null
          exit_reason: string | null
          id: string
          market_regime: string | null
          market_trend: string | null
          pnl_pct: number | null
          r_multiple: number | null
          signal: string
          signal_date: string
          stop_loss: number
          symbol: string
          target: number
        }
        Insert: {
          atr?: number | null
          backtest_id: string
          confidence: number
          created_at?: string
          days_held?: number | null
          entry_date: string
          entry_price: number
          exit_date?: string | null
          exit_price?: number | null
          exit_reason?: string | null
          id?: string
          market_regime?: string | null
          market_trend?: string | null
          pnl_pct?: number | null
          r_multiple?: number | null
          signal: string
          signal_date: string
          stop_loss: number
          symbol: string
          target: number
        }
        Update: {
          atr?: number | null
          backtest_id?: string
          confidence?: number
          created_at?: string
          days_held?: number | null
          entry_date?: string
          entry_price?: number
          exit_date?: string | null
          exit_price?: number | null
          exit_reason?: string | null
          id?: string
          market_regime?: string | null
          market_trend?: string | null
          pnl_pct?: number | null
          r_multiple?: number | null
          signal?: string
          signal_date?: string
          stop_loss?: number
          symbol?: string
          target?: number
        }
        Relationships: [
          {
            foreignKeyName: "backtest_trades_backtest_id_fkey"
            columns: ["backtest_id"]
            isOneToOne: false
            referencedRelation: "backtests"
            referencedColumns: ["id"]
          },
        ]
      }
      backtests: {
        Row: {
          avg_days_held: number | null
          avg_loss_pct: number | null
          avg_win_pct: number | null
          best_trade_pct: number | null
          error_message: string | null
          expectancy_pct: number | null
          finished_at: string | null
          from_date: string
          id: string
          losses: number
          max_drawdown_pct: number | null
          min_confidence: number
          open_trades: number
          profit_factor: number | null
          sharpe: number | null
          started_at: string
          status: string
          strategy_version: string
          symbols_count: number
          to_date: string
          total_return_pct: number | null
          total_trades: number
          win_rate: number | null
          wins: number
          worst_trade_pct: number | null
        }
        Insert: {
          avg_days_held?: number | null
          avg_loss_pct?: number | null
          avg_win_pct?: number | null
          best_trade_pct?: number | null
          error_message?: string | null
          expectancy_pct?: number | null
          finished_at?: string | null
          from_date: string
          id?: string
          losses?: number
          max_drawdown_pct?: number | null
          min_confidence?: number
          open_trades?: number
          profit_factor?: number | null
          sharpe?: number | null
          started_at?: string
          status?: string
          strategy_version?: string
          symbols_count?: number
          to_date: string
          total_return_pct?: number | null
          total_trades?: number
          win_rate?: number | null
          wins?: number
          worst_trade_pct?: number | null
        }
        Update: {
          avg_days_held?: number | null
          avg_loss_pct?: number | null
          avg_win_pct?: number | null
          best_trade_pct?: number | null
          error_message?: string | null
          expectancy_pct?: number | null
          finished_at?: string | null
          from_date?: string
          id?: string
          losses?: number
          max_drawdown_pct?: number | null
          min_confidence?: number
          open_trades?: number
          profit_factor?: number | null
          sharpe?: number | null
          started_at?: string
          status?: string
          strategy_version?: string
          symbols_count?: number
          to_date?: string
          total_return_pct?: number | null
          total_trades?: number
          win_rate?: number | null
          wins?: number
          worst_trade_pct?: number | null
        }
        Relationships: []
      }
      concentration_blocks: {
      Row: {
        id: number
        symbol: string
        share: number
        reason: string | null
        created_at: string | null
      }
      Insert: {
        id?: number
        symbol: string
        share: number
        reason?: string | null
        created_at?: string | null
      }
      Update: {
        id?: number | undefined
        symbol?: string | undefined
        share?: number | undefined
        reason?: string | null | undefined
        created_at?: string | null | undefined
      }
      Relationships: []
    }
    counterfactual_insights: {
        Row: {
          actual_value: number
          counterfactual_value: number
          created_at: string
          feature_name: string
          id: string
          insight_ar: string | null
          predicted_outcome_change: number
          recommendation_id: string | null
          symbol: string
        }
        Insert: {
          actual_value: number
          counterfactual_value: number
          created_at?: string
          feature_name: string
          id?: string
          insight_ar?: string | null
          predicted_outcome_change: number
          recommendation_id?: string | null
          symbol: string
        }
        Update: {
          actual_value?: number
          counterfactual_value?: number
          created_at?: string
          feature_name?: string
          id?: string
          insight_ar?: string | null
          predicted_outcome_change?: number
          recommendation_id?: string | null
          symbol?: string
        }
        Relationships: []
      }
      daily_candles: {
        Row: {
          close: number
          created_at: string
          date: string
          high: number
          id: string
          low: number
          open: number
          symbol: string
          volume: number
        }
        Insert: {
          close: number
          created_at?: string
          date: string
          high: number
          id?: string
          low: number
          open: number
          symbol: string
          volume?: number
        }
        Update: {
          close?: number
          created_at?: string
          date?: string
          high?: number
          id?: string
          low?: number
          open?: number
          symbol?: string
          volume?: number
        }
        Relationships: []
      }
      daily_intelligence: {
        Row: {
          atr14: number | null
          breadth_pct: number | null
          change_pct: number | null
          close: number | null
          composite_score: number | null
          created_at: string
          egx30_change_pct: number | null
          ema21: number | null
          ema9: number | null
          high: number | null
          id: string
          intraday_first: number | null
          intraday_high: number | null
          intraday_last: number | null
          intraday_low: number | null
          intraday_max_drawdown_pct: number | null
          intraday_max_drawup_pct: number | null
          intraday_tick_count: number | null
          intraday_volume: number | null
          low: number | null
          macd: number | null
          macd_hist: number | null
          market_regime: string | null
          market_trend: string | null
          name_ar: string | null
          news_count: number | null
          news_high_impact_count: number | null
          news_sentiment_avg: number | null
          next_5d_return_pct: number | null
          next_day_return_pct: number | null
          open: number | null
          pick_confidence: number | null
          pick_outcome: string | null
          pick_pnl_pct: number | null
          pick_reasons: Json | null
          prev_close: number | null
          rsi14: number | null
          sma50: number | null
          symbol: string
          trade_date: string
          updated_at: string
          vol_ratio: number | null
          volume: number | null
          was_candidate: boolean | null
          was_picked: boolean | null
        }
        Insert: {
          atr14?: number | null
          breadth_pct?: number | null
          change_pct?: number | null
          close?: number | null
          composite_score?: number | null
          created_at?: string
          egx30_change_pct?: number | null
          ema21?: number | null
          ema9?: number | null
          high?: number | null
          id?: string
          intraday_first?: number | null
          intraday_high?: number | null
          intraday_last?: number | null
          intraday_low?: number | null
          intraday_max_drawdown_pct?: number | null
          intraday_max_drawup_pct?: number | null
          intraday_tick_count?: number | null
          intraday_volume?: number | null
          low?: number | null
          macd?: number | null
          macd_hist?: number | null
          market_regime?: string | null
          market_trend?: string | null
          name_ar?: string | null
          news_count?: number | null
          news_high_impact_count?: number | null
          news_sentiment_avg?: number | null
          next_5d_return_pct?: number | null
          next_day_return_pct?: number | null
          open?: number | null
          pick_confidence?: number | null
          pick_outcome?: string | null
          pick_pnl_pct?: number | null
          pick_reasons?: Json | null
          prev_close?: number | null
          rsi14?: number | null
          sma50?: number | null
          symbol: string
          trade_date: string
          updated_at?: string
          vol_ratio?: number | null
          volume?: number | null
          was_candidate?: boolean | null
          was_picked?: boolean | null
        }
        Update: {
          atr14?: number | null
          breadth_pct?: number | null
          change_pct?: number | null
          close?: number | null
          composite_score?: number | null
          created_at?: string
          egx30_change_pct?: number | null
          ema21?: number | null
          ema9?: number | null
          high?: number | null
          id?: string
          intraday_first?: number | null
          intraday_high?: number | null
          intraday_last?: number | null
          intraday_low?: number | null
          intraday_max_drawdown_pct?: number | null
          intraday_max_drawup_pct?: number | null
          intraday_tick_count?: number | null
          intraday_volume?: number | null
          low?: number | null
          macd?: number | null
          macd_hist?: number | null
          market_regime?: string | null
          market_trend?: string | null
          name_ar?: string | null
          news_count?: number | null
          news_high_impact_count?: number | null
          news_sentiment_avg?: number | null
          next_5d_return_pct?: number | null
          next_day_return_pct?: number | null
          open?: number | null
          pick_confidence?: number | null
          pick_outcome?: string | null
          pick_pnl_pct?: number | null
          pick_reasons?: Json | null
          prev_close?: number | null
          rsi14?: number | null
          sma50?: number | null
          symbol?: string
          trade_date?: string
          updated_at?: string
          vol_ratio?: number | null
          volume?: number | null
          was_candidate?: boolean | null
          was_picked?: boolean | null
        }
        Relationships: []
      }
      daily_picks: {
        Row: {
          capital_used: number | null
          confidence: number
          created_at: string
          entry_price: number
          exit_date: string | null
          exit_price: number | null
          id: string
          is_news_elite: boolean
          kelly_pct: number
          max_hold_days: number
          name_ar: string | null
          news_elite_reasons: Json | null
          news_elite_score: number | null
          pick_date: string
          pnl_egp: number | null
          pnl_pct: number | null
          reasons: Json | null
          score: number
          status: string
          stop_pct: number
          stop_price: number
          symbol: string
          target_pct: number
          target_price: number
          updated_at: string
        }
        Insert: {
          capital_used?: number | null
          confidence: number
          created_at?: string
          entry_price: number
          exit_date?: string | null
          exit_price?: number | null
          id?: string
          is_news_elite?: boolean
          kelly_pct: number
          max_hold_days?: number
          name_ar?: string | null
          news_elite_reasons?: Json | null
          news_elite_score?: number | null
          pick_date: string
          pnl_egp?: number | null
          pnl_pct?: number | null
          reasons?: Json | null
          score: number
          status?: string
          stop_pct: number
          stop_price: number
          symbol: string
          target_pct: number
          target_price: number
          updated_at?: string
        }
        Update: {
          capital_used?: number | null
          confidence?: number
          created_at?: string
          entry_price?: number
          exit_date?: string | null
          exit_price?: number | null
          id?: string
          is_news_elite?: boolean
          kelly_pct?: number
          max_hold_days?: number
          name_ar?: string | null
          news_elite_reasons?: Json | null
          news_elite_score?: number | null
          pick_date?: string
          pnl_egp?: number | null
          pnl_pct?: number | null
          reasons?: Json | null
          score?: number
          status?: string
          stop_pct?: number
          stop_price?: number
          symbol?: string
          target_pct?: number
          target_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      data_source_logs: {
        Row: {
          candles_count: number | null
          error: string | null
          id: string
          latency_ms: number | null
          ok: boolean
          provider: string
          symbol: string | null
          ts: string
        }
        Insert: {
          candles_count?: number | null
          error?: string | null
          id?: string
          latency_ms?: number | null
          ok: boolean
          provider: string
          symbol?: string | null
          ts?: string
        }
        Update: {
          candles_count?: number | null
          error?: string | null
          id?: string
          latency_ms?: number | null
          ok?: boolean
          provider?: string
          symbol?: string | null
          ts?: string
        }
        Relationships: []
      }
      decision_suggestions: {
        Row: {
          action_type: string
          applied_at: string | null
          category: string
          confidence: number | null
          created_at: string
          current_value: string | null
          evidence: Json
          evidence_days: number
          id: string
          rationale: string
          rejected_at: string | null
          status: string
          suggested_value: string | null
          target_key: string | null
          updated_at: string
        }
        Insert: {
          action_type?: string
          applied_at?: string | null
          category: string
          confidence?: number | null
          created_at?: string
          current_value?: string | null
          evidence?: Json
          evidence_days?: number
          id?: string
          rationale: string
          rejected_at?: string | null
          status?: string
          suggested_value?: string | null
          target_key?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          applied_at?: string | null
          category?: string
          confidence?: number | null
          created_at?: string
          current_value?: string | null
          evidence?: Json
          evidence_days?: number
          id?: string
          rationale?: string
          rejected_at?: string | null
          status?: string
          suggested_value?: string | null
          target_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ensemble_votes: {
        Row: {
          confidence: number
          created_at: string
          id: string
          model_name: string
          reasoning_ar: string | null
          recommendation_id: string | null
          scan_id: string
          symbol: string
          vote: string
        }
        Insert: {
          confidence: number
          created_at?: string
          id?: string
          model_name: string
          reasoning_ar?: string | null
          recommendation_id?: string | null
          scan_id: string
          symbol: string
          vote: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          model_name?: string
          reasoning_ar?: string | null
          recommendation_id?: string | null
          scan_id?: string
          symbol?: string
          vote?: string
        }
        Relationships: []
      }
      execution_context: {
        Row: {
          best_ask_at_placement: number | null
          best_bid_at_placement: number | null
          break_even: number | null
          created_at: string
          decision_reason: string | null
          id: number
          last_price_at_placement: number | null
          order_lifecycle_id: string
          safe_floor: number | null
          snapshot_before: Json | null
          spread_at_placement: number | null
        }
        Insert: {
          best_ask_at_placement?: number | null
          best_bid_at_placement?: number | null
          break_even?: number | null
          created_at?: string
          decision_reason?: string | null
          id?: number
          last_price_at_placement?: number | null
          order_lifecycle_id: string
          safe_floor?: number | null
          snapshot_before?: Json | null
          spread_at_placement?: number | null
        }
        Update: {
          best_ask_at_placement?: number | null
          best_bid_at_placement?: number | null
          break_even?: number | null
          created_at?: string
          decision_reason?: string | null
          id?: number
          last_price_at_placement?: number | null
          order_lifecycle_id?: string
          safe_floor?: number | null
          snapshot_before?: Json | null
          spread_at_placement?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_context_order_lifecycle_id_fkey"
            columns: ["order_lifecycle_id"]
            isOneToOne: false
            referencedRelation: "fill_analysis_v"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "execution_context_order_lifecycle_id_fkey"
            columns: ["order_lifecycle_id"]
            isOneToOne: false
            referencedRelation: "order_lifecycle"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_quality_log: {
        Row: {
          bid_value_at_request: number | null
          created_at: string
          executed_at: string | null
          executed_price: number | null
          execution_type: string
          id: string
          latency_seconds: number | null
          notes: string | null
          paper_trade_id: string | null
          requested_at: string
          slippage_pct: number | null
          strategy: string
          symbol: string
          target_price: number
          trade_date: string
        }
        Insert: {
          bid_value_at_request?: number | null
          created_at?: string
          executed_at?: string | null
          executed_price?: number | null
          execution_type?: string
          id?: string
          latency_seconds?: number | null
          notes?: string | null
          paper_trade_id?: string | null
          requested_at?: string
          slippage_pct?: number | null
          strategy?: string
          symbol: string
          target_price: number
          trade_date?: string
        }
        Update: {
          bid_value_at_request?: number | null
          created_at?: string
          executed_at?: string | null
          executed_price?: number | null
          execution_type?: string
          id?: string
          latency_seconds?: number | null
          notes?: string | null
          paper_trade_id?: string | null
          requested_at?: string
          slippage_pct?: number | null
          strategy?: string
          symbol?: string
          target_price?: number
          trade_date?: string
        }
        Relationships: []
      }
      extension_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      extension_diag: {
        Row: {
          audio_current_time: number | null
          audio_muted: boolean | null
          audio_paused: boolean | null
          audio_ready_state: number | null
          client_id: string | null
          depth_count_30s: number | null
          extra: Json | null
          id: string
          last_depth_age_ms: number | null
          symbol: string | null
          ts: string
          visibility_state: string | null
        }
        Insert: {
          audio_current_time?: number | null
          audio_muted?: boolean | null
          audio_paused?: boolean | null
          audio_ready_state?: number | null
          client_id?: string | null
          depth_count_30s?: number | null
          extra?: Json | null
          id?: string
          last_depth_age_ms?: number | null
          symbol?: string | null
          ts?: string
          visibility_state?: string | null
        }
        Update: {
          audio_current_time?: number | null
          audio_muted?: boolean | null
          audio_paused?: boolean | null
          audio_ready_state?: number | null
          client_id?: string | null
          depth_count_30s?: number | null
          extra?: Json | null
          id?: string
          last_depth_age_ms?: number | null
          symbol?: string | null
          ts?: string
          visibility_state?: string | null
        }
        Relationships: []
      }
      extension_tab_telemetry: {
        Row: {
          ac_resume_attempts: number | null
          ac_resume_ok: number | null
          ac_state: string | null
          client_id: string
          depth_total: number | null
          extras: Json | null
          has_trigger: boolean | null
          id: number
          l2_soft_resets: number | null
          last_ensure_age_sec: number | null
          last_l2_age_sec: number | null
          last_l2_fresh: boolean | null
          last_snapshot_age_sec: number | null
          opened_at_ms: number | null
          panel_reason: string | null
          panel_state: string | null
          snapshots_sent: number | null
          symbol: string
          ts: string
          uptime_sec: number | null
          uuid: string | null
        }
        Insert: {
          ac_resume_attempts?: number | null
          ac_resume_ok?: number | null
          ac_state?: string | null
          client_id: string
          depth_total?: number | null
          extras?: Json | null
          has_trigger?: boolean | null
          id?: number
          l2_soft_resets?: number | null
          last_ensure_age_sec?: number | null
          last_l2_age_sec?: number | null
          last_l2_fresh?: boolean | null
          last_snapshot_age_sec?: number | null
          opened_at_ms?: number | null
          panel_reason?: string | null
          panel_state?: string | null
          snapshots_sent?: number | null
          symbol: string
          ts?: string
          uptime_sec?: number | null
          uuid?: string | null
        }
        Update: {
          ac_resume_attempts?: number | null
          ac_resume_ok?: number | null
          ac_state?: string | null
          client_id?: string
          depth_total?: number | null
          extras?: Json | null
          has_trigger?: boolean | null
          id?: number
          l2_soft_resets?: number | null
          last_ensure_age_sec?: number | null
          last_l2_age_sec?: number | null
          last_l2_fresh?: boolean | null
          last_snapshot_age_sec?: number | null
          opened_at_ms?: number | null
          panel_reason?: string | null
          panel_state?: string | null
          snapshots_sent?: number | null
          symbol?: string
          ts?: string
          uptime_sec?: number | null
          uuid?: string | null
        }
        Relationships: []
      }
      extension_trades: {
        Row: {
          buy_fee: number | null
          buy_price: number | null
          buy_qty: number | null
          buy_total_cost: number | null
          buy_value: number | null
          client_trade_id: string
          closed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          opened_at: string
          pnl: number | null
          pnl_pct: number | null
          sell_fee: number | null
          sell_net_proceeds: number | null
          sell_price: number | null
          sell_qty: number | null
          sell_value: number | null
          source: string | null
          status: string
          symbol: string
          trade_date: string
          updated_at: string
        }
        Insert: {
          buy_fee?: number | null
          buy_price?: number | null
          buy_qty?: number | null
          buy_total_cost?: number | null
          buy_value?: number | null
          client_trade_id: string
          closed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          opened_at: string
          pnl?: number | null
          pnl_pct?: number | null
          sell_fee?: number | null
          sell_net_proceeds?: number | null
          sell_price?: number | null
          sell_qty?: number | null
          sell_value?: number | null
          source?: string | null
          status?: string
          symbol: string
          trade_date: string
          updated_at?: string
        }
        Update: {
          buy_fee?: number | null
          buy_price?: number | null
          buy_qty?: number | null
          buy_total_cost?: number | null
          buy_value?: number | null
          client_trade_id?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          opened_at?: string
          pnl?: number | null
          pnl_pct?: number | null
          sell_fee?: number | null
          sell_net_proceeds?: number | null
          sell_price?: number | null
          sell_qty?: number | null
          sell_value?: number | null
          source?: string | null
          status?: string
          symbol?: string
          trade_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      fundamentals: {
        Row: {
          as_of: string
          created_at: string
          debt_to_equity: number | null
          dividend_yield: number | null
          earnings_per_share: number | null
          id: string
          market_cap_egp: number | null
          next_earnings_date: string | null
          pb_ratio: number | null
          pe_ratio: number | null
          raw_data: Json | null
          revenue_growth_yoy: number | null
          roe: number | null
          source: string
          symbol: string
        }
        Insert: {
          as_of: string
          created_at?: string
          debt_to_equity?: number | null
          dividend_yield?: number | null
          earnings_per_share?: number | null
          id?: string
          market_cap_egp?: number | null
          next_earnings_date?: string | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          raw_data?: Json | null
          revenue_growth_yoy?: number | null
          roe?: number | null
          source?: string
          symbol: string
        }
        Update: {
          as_of?: string
          created_at?: string
          debt_to_equity?: number | null
          dividend_yield?: number | null
          earnings_per_share?: number | null
          id?: string
          market_cap_egp?: number | null
          next_earnings_date?: string | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          raw_data?: Json | null
          revenue_growth_yoy?: number | null
          roe?: number | null
          source?: string
          symbol?: string
        }
        Relationships: []
      }
      intraday_breakouts: {
        Row: {
          breakout_price: number
          detected_at: string
          filters_passed: Json
          gap_pct: number | null
          hh20: number
          id: string
          notes: string | null
          prev_close: number | null
          sma200: number | null
          sma50: number | null
          symbol: string
          telegram_sent: boolean
          trade_date: string
          vol_avg20: number
          vol_intraday: number
          vol_x: number
        }
        Insert: {
          breakout_price: number
          detected_at?: string
          filters_passed: Json
          gap_pct?: number | null
          hh20: number
          id?: string
          notes?: string | null
          prev_close?: number | null
          sma200?: number | null
          sma50?: number | null
          symbol: string
          telegram_sent?: boolean
          trade_date: string
          vol_avg20: number
          vol_intraday: number
          vol_x: number
        }
        Update: {
          breakout_price?: number
          detected_at?: string
          filters_passed?: Json
          gap_pct?: number | null
          hh20?: number
          id?: string
          notes?: string | null
          prev_close?: number | null
          sma200?: number | null
          sma50?: number | null
          symbol?: string
          telegram_sent?: boolean
          trade_date?: string
          vol_avg20?: number
          vol_intraday?: number
          vol_x?: number
        }
        Relationships: [
          {
            foreignKeyName: "intraday_breakouts_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["symbol"]
          },
        ]
      }
      intraday_candles: {
        Row: {
          bucket_ts: string
          close: number
          created_at: string
          high: number
          id: number
          interval_min: number
          low: number
          open: number
          symbol: string
          tick_count: number
          trade_date: string
          volume: number | null
        }
        Insert: {
          bucket_ts: string
          close: number
          created_at?: string
          high: number
          id?: number
          interval_min?: number
          low: number
          open: number
          symbol: string
          tick_count?: number
          trade_date: string
          volume?: number | null
        }
        Update: {
          bucket_ts?: string
          close?: number
          created_at?: string
          high?: number
          id?: number
          interval_min?: number
          low?: number
          open?: number
          symbol?: string
          tick_count?: number
          trade_date?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "intraday_candles_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["symbol"]
          },
        ]
      }
      learning_labels: {
        Row: {
          confidence: number
          created_at: string
          id: string
          label: string
          label_weight: number
          labeled_at: string
          realized_pct: number
          recommendation_id: string
          symbol: string
          uncertainty: number
        }
        Insert: {
          confidence: number
          created_at?: string
          id?: string
          label: string
          label_weight?: number
          labeled_at?: string
          realized_pct: number
          recommendation_id: string
          symbol: string
          uncertainty: number
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          label?: string
          label_weight?: number
          labeled_at?: string
          realized_pct?: number
          recommendation_id?: string
          symbol?: string
          uncertainty?: number
        }
        Relationships: []
      }
      ingest_tokens: {
      Row: { token: string
        note: string | null
        created_at: string | null }
      Insert: { token: string
        note?: string | null
        created_at?: string | null }
      Update: { token?: string | undefined
        note?: string | null | undefined
        created_at?: string | null | undefined }
      Relationships: []
    }
    ingest_diag: {
      Row: { token: string
        hits: number | null
        first_seen: string | null
        last_seen: string | null }
      Insert: { token: string
        hits?: number | null
        first_seen?: string | null
        last_seen?: string | null }
      Update: { token?: string | undefined
        hits?: number | null | undefined
        first_seen?: string | null | undefined
        last_seen?: string | null | undefined }
      Relationships: []
    }
    live_quotes: {
        Row: {
          ask: number | null
          bid: number | null
          id: number
          received_at: string
          source: string | null
          spread: number | null
          symbol: string
          ts: string
          uuid: string | null
        }
        Insert: {
          ask?: number | null
          bid?: number | null
          id?: number
          received_at?: string
          source?: string | null
          spread?: number | null
          symbol: string
          ts: string
          uuid?: string | null
        }
        Update: {
          ask?: number | null
          bid?: number | null
          id?: number
          received_at?: string
          source?: string | null
          spread?: number | null
          symbol?: string
          ts?: string
          uuid?: string | null
        }
        Relationships: []
      }
      live_ticks: {
        Row: {
          created_at: string
          id: number
          meta: Json | null
          price: number
          source: string
          symbol: string
          ts: string
          volume: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          meta?: Json | null
          price: number
          source: string
          symbol: string
          ts?: string
          volume?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          meta?: Json | null
          price?: number
          source?: string
          symbol?: string
          ts?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_ticks_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["symbol"]
          },
        ]
      }
      macro_indicators: {
        Row: {
          as_of: string
          brent_oil_usd: number | null
          cbe_interest_rate: number | null
          created_at: string
          gold_usd: number | null
          id: string
          inflation_yoy: number | null
          msci_em_close: number | null
          sp500_change_pct: number | null
          sp500_close: number | null
          usd_egp: number | null
        }
        Insert: {
          as_of: string
          brent_oil_usd?: number | null
          cbe_interest_rate?: number | null
          created_at?: string
          gold_usd?: number | null
          id?: string
          inflation_yoy?: number | null
          msci_em_close?: number | null
          sp500_change_pct?: number | null
          sp500_close?: number | null
          usd_egp?: number | null
        }
        Update: {
          as_of?: string
          brent_oil_usd?: number | null
          cbe_interest_rate?: number | null
          created_at?: string
          gold_usd?: number | null
          id?: string
          inflation_yoy?: number | null
          msci_em_close?: number | null
          sp500_change_pct?: number | null
          sp500_close?: number | null
          usd_egp?: number | null
        }
        Relationships: []
      }
      market_regimes: {
        Row: {
          created_at: string
          date: string
          regime: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          regime: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          regime?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_snapshots: {
        Row: {
          change_5d_pct: number | null
          change_pct: number | null
          close: number
          created_at: string
          date: string
          ema20: number | null
          id: string
          index_symbol: string
          rsi14: number | null
          trend: string | null
        }
        Insert: {
          change_5d_pct?: number | null
          change_pct?: number | null
          close: number
          created_at?: string
          date: string
          ema20?: number | null
          id?: string
          index_symbol: string
          rsi14?: number | null
          trend?: string | null
        }
        Update: {
          change_5d_pct?: number | null
          change_pct?: number | null
          close?: number
          created_at?: string
          date?: string
          ema20?: number | null
          id?: string
          index_symbol?: string
          rsi14?: number | null
          trend?: string | null
        }
        Relationships: []
      }
      marketwatch_snapshots: {
        Row: {
          asset_id: string | null
          avg_180_day: number | null
          avg_30_day: number | null
          avg_5_day: number | null
          avg_90_day: number | null
          avg_change_prc: number | null
          captured_at: string
          close_price: number | null
          high_52_week: number | null
          high_price: number | null
          high_price_limit: number | null
          highest_bid: number | null
          highest_bid_qty: number | null
          id: number
          is_same_day: boolean | null
          last_change_prc: number | null
          last_price: number | null
          last_trade_date: string | null
          last_trade_volume: number | null
          listed_shares: number | null
          low_52_week: number | null
          low_price: number | null
          low_price_limit: number | null
          lowest_ask: number | null
          lowest_ask_qty: number | null
          open_price: number | null
          previous_close: number | null
          raw: Json | null
          ref_price: number | null
          symbol: string
          symbol_state: string | null
          total_asks: number | null
          total_bids: number | null
          total_buy: number | null
          total_sell: number | null
          total_trades: number | null
          total_value: number | null
          total_volume: number | null
          trade_rec_serial: number | null
        }
        Insert: {
          asset_id?: string | null
          avg_180_day?: number | null
          avg_30_day?: number | null
          avg_5_day?: number | null
          avg_90_day?: number | null
          avg_change_prc?: number | null
          captured_at?: string
          close_price?: number | null
          high_52_week?: number | null
          high_price?: number | null
          high_price_limit?: number | null
          highest_bid?: number | null
          highest_bid_qty?: number | null
          id?: number
          is_same_day?: boolean | null
          last_change_prc?: number | null
          last_price?: number | null
          last_trade_date?: string | null
          last_trade_volume?: number | null
          listed_shares?: number | null
          low_52_week?: number | null
          low_price?: number | null
          low_price_limit?: number | null
          lowest_ask?: number | null
          lowest_ask_qty?: number | null
          open_price?: number | null
          previous_close?: number | null
          raw?: Json | null
          ref_price?: number | null
          symbol: string
          symbol_state?: string | null
          total_asks?: number | null
          total_bids?: number | null
          total_buy?: number | null
          total_sell?: number | null
          total_trades?: number | null
          total_value?: number | null
          total_volume?: number | null
          trade_rec_serial?: number | null
        }
        Update: {
          asset_id?: string | null
          avg_180_day?: number | null
          avg_30_day?: number | null
          avg_5_day?: number | null
          avg_90_day?: number | null
          avg_change_prc?: number | null
          captured_at?: string
          close_price?: number | null
          high_52_week?: number | null
          high_price?: number | null
          high_price_limit?: number | null
          highest_bid?: number | null
          highest_bid_qty?: number | null
          id?: number
          is_same_day?: boolean | null
          last_change_prc?: number | null
          last_price?: number | null
          last_trade_date?: string | null
          last_trade_volume?: number | null
          listed_shares?: number | null
          low_52_week?: number | null
          low_price?: number | null
          low_price_limit?: number | null
          lowest_ask?: number | null
          lowest_ask_qty?: number | null
          open_price?: number | null
          previous_close?: number | null
          raw?: Json | null
          ref_price?: number | null
          symbol?: string
          symbol_state?: string | null
          total_asks?: number | null
          total_bids?: number | null
          total_buy?: number | null
          total_sell?: number | null
          total_trades?: number | null
          total_value?: number | null
          total_volume?: number | null
          trade_rec_serial?: number | null
        }
        Relationships: []
      }
      missed_signals: {
        Row: {
          candidate_price: number | null
          day_open: number | null
          drop_pct: number | null
          id: string
          metadata: Json
          rank: number | null
          reason: string
          sl_price: number | null
          strategy: string
          symbol: string
          tp_price: number | null
          trade_date: string
          ts: string
        }
        Insert: {
          candidate_price?: number | null
          day_open?: number | null
          drop_pct?: number | null
          id?: string
          metadata?: Json
          rank?: number | null
          reason: string
          sl_price?: number | null
          strategy?: string
          symbol: string
          tp_price?: number | null
          trade_date: string
          ts?: string
        }
        Update: {
          candidate_price?: number | null
          day_open?: number | null
          drop_pct?: number | null
          id?: string
          metadata?: Json
          rank?: number | null
          reason?: string
          sl_price?: number | null
          strategy?: string
          symbol?: string
          tp_price?: number | null
          trade_date?: string
          ts?: string
        }
        Relationships: []
      }
      model_state: {
        Row: {
          data: Json
          key: string
          updated_at: string
        }
        Insert: {
          data?: Json
          key: string
          updated_at?: string
        }
        Update: {
          data?: Json
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_embeddings: {
        Row: {
          created_at: string
          embedding: string
          headline: string
          id: string
          metadata: Json
          outcome_5d_pct: number | null
          outcome_recorded_at: string | null
          published_at: string | null
          sentiment_score: number
          symbol: string
        }
        Insert: {
          created_at?: string
          embedding: string
          headline: string
          id?: string
          metadata?: Json
          outcome_5d_pct?: number | null
          outcome_recorded_at?: string | null
          published_at?: string | null
          sentiment_score?: number
          symbol: string
        }
        Update: {
          created_at?: string
          embedding?: string
          headline?: string
          id?: string
          metadata?: Json
          outcome_5d_pct?: number | null
          outcome_recorded_at?: string | null
          published_at?: string | null
          sentiment_score?: number
          symbol?: string
        }
        Relationships: []
      }
      news_impact_forecasts: {
        Row: {
          baladi_summary: string | null
          category: string
          confidence: number
          created_at: string
          expected_direction: string
          expected_magnitude_pct: number | null
          expires_at: string
          explanation_ar: string | null
          headline: string
          headline_hash: string
          horizon: string
          id: string
          impact_end_date: string
          impact_start_date: string
          is_rights_related: boolean
          news_id: string | null
          notified: boolean
          published_at: string
          symbol: string
        }
        Insert: {
          baladi_summary?: string | null
          category?: string
          confidence?: number
          created_at?: string
          expected_direction?: string
          expected_magnitude_pct?: number | null
          expires_at?: string
          explanation_ar?: string | null
          headline: string
          headline_hash: string
          horizon?: string
          id?: string
          impact_end_date: string
          impact_start_date: string
          is_rights_related?: boolean
          news_id?: string | null
          notified?: boolean
          published_at?: string
          symbol: string
        }
        Update: {
          baladi_summary?: string | null
          category?: string
          confidence?: number
          created_at?: string
          expected_direction?: string
          expected_magnitude_pct?: number | null
          expires_at?: string
          explanation_ar?: string | null
          headline?: string
          headline_hash?: string
          horizon?: string
          id?: string
          impact_end_date?: string
          impact_start_date?: string
          is_rights_related?: boolean
          news_id?: string | null
          notified?: boolean
          published_at?: string
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_impact_forecasts_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_near_signal"
            referencedColumns: ["news_id"]
          },
          {
            foreignKeyName: "news_impact_forecasts_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_sentiment"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sentiment: {
        Row: {
          ai_model: string | null
          created_at: string
          headline: string
          id: string
          impact_level: string
          published_at: string | null
          sentiment: string
          sentiment_score: number
          source_name: string | null
          source_url: string | null
          summary_ar: string | null
          symbol: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          headline: string
          id?: string
          impact_level?: string
          published_at?: string | null
          sentiment: string
          sentiment_score?: number
          source_name?: string | null
          source_url?: string | null
          summary_ar?: string | null
          symbol: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          headline?: string
          id?: string
          impact_level?: string
          published_at?: string | null
          sentiment?: string
          sentiment_score?: number
          source_name?: string | null
          source_url?: string | null
          summary_ar?: string | null
          symbol?: string
        }
        Relationships: []
      }
      online_learning_state: {
        Row: {
          feature_name: string
          last_gradient: number
          n_updates: number
          updated_at: string
          weight: number
        }
        Insert: {
          feature_name: string
          last_gradient?: number
          n_updates?: number
          updated_at?: string
          weight?: number
        }
        Update: {
          feature_name?: string
          last_gradient?: number
          n_updates?: number
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      order_lifecycle: {
        Row: {
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          fill_price_avg: number | null
          filled_qty: number | null
          first_fill_at: string | null
          fully_filled_at: string | null
          id: string
          metadata: Json | null
          order_type: string
          placed_at: string
          remaining_qty: number | null
          requested_price: number | null
          requested_qty: number
          session_id: string | null
          side: string
          signal_source: string | null
          status: string
          strategy: string | null
          symbol: string
          thunder_order_id: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          fill_price_avg?: number | null
          filled_qty?: number | null
          first_fill_at?: string | null
          fully_filled_at?: string | null
          id?: string
          metadata?: Json | null
          order_type: string
          placed_at?: string
          remaining_qty?: number | null
          requested_price?: number | null
          requested_qty: number
          session_id?: string | null
          side: string
          signal_source?: string | null
          status?: string
          strategy?: string | null
          symbol: string
          thunder_order_id?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          fill_price_avg?: number | null
          filled_qty?: number | null
          first_fill_at?: string | null
          fully_filled_at?: string | null
          id?: string
          metadata?: Json | null
          order_type?: string
          placed_at?: string
          remaining_qty?: number | null
          requested_price?: number | null
          requested_qty?: number
          session_id?: string | null
          side?: string
          signal_source?: string | null
          status?: string
          strategy?: string | null
          symbol?: string
          thunder_order_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orderbook_snapshots: {
        Row: {
          asks_depth: Json | null
          best_ask: number | null
          best_ask_qty: number | null
          best_bid: number | null
          best_bid_qty: number | null
          bids_depth: Json | null
          created_at: string
          id: number
          last_price: number | null
          session_id: string | null
          source: string
          spread: number | null
          symbol: string
          ts: string
        }
        Insert: {
          asks_depth?: Json | null
          best_ask?: number | null
          best_ask_qty?: number | null
          best_bid?: number | null
          best_bid_qty?: number | null
          bids_depth?: Json | null
          created_at?: string
          id?: number
          last_price?: number | null
          session_id?: string | null
          source?: string
          spread?: number | null
          symbol: string
          ts?: string
        }
        Update: {
          asks_depth?: Json | null
          best_ask?: number | null
          best_ask_qty?: number | null
          best_bid?: number | null
          best_bid_qty?: number | null
          bids_depth?: Json | null
          created_at?: string
          id?: number
          last_price?: number | null
          session_id?: string | null
          source?: string
          spread?: number | null
          symbol?: string
          ts?: string
        }
        Relationships: []
      }
      paper_trades: {
        Row: {
          capital: number
          created_at: string
          dip_trigger_price: number | null
          entry_price: number
          entry_ts: string
          exit_price: number | null
          exit_reason: string | null
          exit_ts: string | null
          id: string
          illiq_since_ts: string | null
          morning_high: number | null
          pnl: number | null
          pnl_pct: number | null
          sl_price: number
          status: string
          strategy: string
          symbol: string
          tp_price: number
          trade_date: string
          updated_at: string
        }
        Insert: {
          capital?: number
          created_at?: string
          dip_trigger_price?: number | null
          entry_price: number
          entry_ts: string
          exit_price?: number | null
          exit_reason?: string | null
          exit_ts?: string | null
          id?: string
          illiq_since_ts?: string | null
          morning_high?: number | null
          pnl?: number | null
          pnl_pct?: number | null
          sl_price: number
          status?: string
          strategy?: string
          symbol: string
          tp_price: number
          trade_date: string
          updated_at?: string
        }
        Update: {
          capital?: number
          created_at?: string
          dip_trigger_price?: number | null
          entry_price?: number
          entry_ts?: string
          exit_price?: number | null
          exit_reason?: string | null
          exit_ts?: string | null
          id?: string
          illiq_since_ts?: string | null
          morning_high?: number | null
          pnl?: number | null
          pnl_pct?: number | null
          sl_price?: number
          status?: string
          strategy?: string
          symbol?: string
          tp_price?: number
          trade_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      pending_orders: {
        Row: {
          confirmed_at: string | null
          created_at: string
          error_message: string | null
          expires_at: string
          id: string
          limit_price: number | null
          metadata: Json | null
          order_type: string
          prepared_at: string | null
          qty: number | null
          ref_price: number | null
          side: string
          signal_source: string | null
          status: string
          symbol: string
          trade_date: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string
          id?: string
          limit_price?: number | null
          metadata?: Json | null
          order_type?: string
          prepared_at?: string | null
          qty?: number | null
          ref_price?: number | null
          side: string
          signal_source?: string | null
          status?: string
          symbol: string
          trade_date?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string
          id?: string
          limit_price?: number | null
          metadata?: Json | null
          order_type?: string
          prepared_at?: string | null
          qty?: number | null
          ref_price?: number | null
          side?: string
          signal_source?: string | null
          status?: string
          symbol?: string
          trade_date?: string
        }
        Relationships: []
      }
      pick_notifications: {
        Row: {
          id: string
          kind: string
          payload: Json | null
          pick_date: string
          sent_at: string
          symbol: string
        }
        Insert: {
          id?: string
          kind: string
          payload?: Json | null
          pick_date: string
          sent_at?: string
          symbol: string
        }
        Update: {
          id?: string
          kind?: string
          payload?: Json | null
          pick_date?: string
          sent_at?: string
          symbol?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          current_price: number | null
          current_price_at: string | null
          entry_at: string
          entry_date: string
          entry_price: number
          exit_at: string | null
          exit_date: string | null
          exit_price: number | null
          exit_reason: Database["public"]["Enums"]["exit_reason"] | null
          highest_price: number | null
          id: string
          max_hold_days: number | null
          notes: string | null
          pnl_pct: number | null
          quantity: number
          recommendation_id: string | null
          status: Database["public"]["Enums"]["position_status"]
          stop_loss: number | null
          symbol: string
          target_price: number | null
          trailing_stop: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_price?: number | null
          current_price_at?: string | null
          entry_at?: string
          entry_date?: string
          entry_price: number
          exit_at?: string | null
          exit_date?: string | null
          exit_price?: number | null
          exit_reason?: Database["public"]["Enums"]["exit_reason"] | null
          highest_price?: number | null
          id?: string
          max_hold_days?: number | null
          notes?: string | null
          pnl_pct?: number | null
          quantity?: number
          recommendation_id?: string | null
          status?: Database["public"]["Enums"]["position_status"]
          stop_loss?: number | null
          symbol: string
          target_price?: number | null
          trailing_stop?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_price?: number | null
          current_price_at?: string | null
          entry_at?: string
          entry_date?: string
          entry_price?: number
          exit_at?: string | null
          exit_date?: string | null
          exit_price?: number | null
          exit_reason?: Database["public"]["Enums"]["exit_reason"] | null
          highest_price?: number | null
          id?: string
          max_hold_days?: number | null
          notes?: string | null
          pnl_pct?: number | null
          quantity?: number
          recommendation_id?: string | null
          status?: Database["public"]["Enums"]["position_status"]
          stop_loss?: number | null
          symbol?: string
          target_price?: number | null
          trailing_stop?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pre_buy_gate_log: {
        Row: {
          best_ask: number | null
          best_bid: number | null
          bid_sum_at_target: number | null
          decision: string
          entry_price: number
          fee_pct: number
          id: number
          meta: Json | null
          qty: number
          reason: string
          snapshot_age_ms: number | null
          snapshot_ts: string | null
          source: string
          spread: number | null
          symbol: string
          target_price: number
          tp_pct: number
          ts: string
        }
        Insert: {
          best_ask?: number | null
          best_bid?: number | null
          bid_sum_at_target?: number | null
          decision: string
          entry_price: number
          fee_pct: number
          id?: number
          meta?: Json | null
          qty: number
          reason: string
          snapshot_age_ms?: number | null
          snapshot_ts?: string | null
          source?: string
          spread?: number | null
          symbol: string
          target_price: number
          tp_pct: number
          ts?: string
        }
        Update: {
          best_ask?: number | null
          best_bid?: number | null
          bid_sum_at_target?: number | null
          decision?: string
          entry_price?: number
          fee_pct?: number
          id?: number
          meta?: Json | null
          qty?: number
          reason?: string
          snapshot_age_ms?: number | null
          snapshot_ts?: string | null
          source?: string
          spread?: number | null
          symbol?: string
          target_price?: number
          tp_pct?: number
          ts?: string
        }
        Relationships: []
      }
      premarket_shortlist: {
        Row: {
          breadth_pct: number | null
          created_at: string
          id: string
          notes: string | null
          pick_date: string
          reasons: Json | null
          sent_at: string | null
          symbols: string[]
        }
        Insert: {
          breadth_pct?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          pick_date: string
          reasons?: Json | null
          sent_at?: string | null
          symbols?: string[]
        }
        Update: {
          breadth_pct?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          pick_date?: string
          reasons?: Json | null
          sent_at?: string | null
          symbols?: string[]
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          ai_model: string | null
          confidence: number
          created_at: string
          data_completeness: number | null
          ensemble_agreement: number | null
          entry_max: number | null
          entry_min: number | null
          entry_timing_ar: string | null
          expected_gain_pct: number | null
          expected_next_day_pct: number | null
          fundamental_score: number | null
          id: string
          macro_score: number | null
          market_trend: string | null
          max_hold_days: number | null
          original_signal: string | null
          outcome: Database["public"]["Enums"]["reco_outcome"]
          outcome_at: string | null
          outcome_price: number | null
          partial_exit_pct: number | null
          position_size_pct: number | null
          price_at_reco: number
          raw_ai_response: Json | null
          realized_pct: number | null
          reasons_ar: Json
          rejected_by_rules: boolean
          rejection_reason: string | null
          risk_note_ar: string | null
          rr_ratio: number | null
          scan_id: string
          sector_score: number | null
          sentiment_score: number | null
          signal: Database["public"]["Enums"]["signal_type"]
          stop_loss: number | null
          symbol: string
          target: number | null
          technical_score: number | null
          timeframe_days: number | null
          verifier_approved: boolean | null
          verifier_reason: string | null
        }
        Insert: {
          ai_model?: string | null
          confidence: number
          created_at?: string
          data_completeness?: number | null
          ensemble_agreement?: number | null
          entry_max?: number | null
          entry_min?: number | null
          entry_timing_ar?: string | null
          expected_gain_pct?: number | null
          expected_next_day_pct?: number | null
          fundamental_score?: number | null
          id?: string
          macro_score?: number | null
          market_trend?: string | null
          max_hold_days?: number | null
          original_signal?: string | null
          outcome?: Database["public"]["Enums"]["reco_outcome"]
          outcome_at?: string | null
          outcome_price?: number | null
          partial_exit_pct?: number | null
          position_size_pct?: number | null
          price_at_reco: number
          raw_ai_response?: Json | null
          realized_pct?: number | null
          reasons_ar?: Json
          rejected_by_rules?: boolean
          rejection_reason?: string | null
          risk_note_ar?: string | null
          rr_ratio?: number | null
          scan_id: string
          sector_score?: number | null
          sentiment_score?: number | null
          signal: Database["public"]["Enums"]["signal_type"]
          stop_loss?: number | null
          symbol: string
          target?: number | null
          technical_score?: number | null
          timeframe_days?: number | null
          verifier_approved?: boolean | null
          verifier_reason?: string | null
        }
        Update: {
          ai_model?: string | null
          confidence?: number
          created_at?: string
          data_completeness?: number | null
          ensemble_agreement?: number | null
          entry_max?: number | null
          entry_min?: number | null
          entry_timing_ar?: string | null
          expected_gain_pct?: number | null
          expected_next_day_pct?: number | null
          fundamental_score?: number | null
          id?: string
          macro_score?: number | null
          market_trend?: string | null
          max_hold_days?: number | null
          original_signal?: string | null
          outcome?: Database["public"]["Enums"]["reco_outcome"]
          outcome_at?: string | null
          outcome_price?: number | null
          partial_exit_pct?: number | null
          position_size_pct?: number | null
          price_at_reco?: number
          raw_ai_response?: Json | null
          realized_pct?: number | null
          reasons_ar?: Json
          rejected_by_rules?: boolean
          rejection_reason?: string | null
          risk_note_ar?: string | null
          rr_ratio?: number | null
          scan_id?: string
          sector_score?: number | null
          sentiment_score?: number | null
          signal?: Database["public"]["Enums"]["signal_type"]
          stop_loss?: number | null
          symbol?: string
          target?: number | null
          technical_score?: number | null
          timeframe_days?: number | null
          verifier_approved?: boolean | null
          verifier_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["symbol"]
          },
        ]
      }
      scalp_dip_signals: {
        Row: {
          actual_buy_price: number | null
          actual_sell_price: number | null
          bid_confirmed_at_exit: boolean | null
          bid_depth_at_entry: number
          bought: boolean
          buy_timestamp: string | null
          created_at: string
          day1_price: number | null
          day1_status: string | null
          day2_price: number | null
          day2_status: string | null
          day3_price: number | null
          day3_status: string | null
          entry_price: number
          exit_reason: string | null
          extra_hold_used: boolean
          gap_pct: number
          id: number
          news_30h: boolean | null
          position_value: number
          realized_pnl: number | null
          realized_pnl_pct: number | null
          scan_date: string
          sell_signal: boolean
          sell_signal_reason: string | null
          sell_timestamp: string | null
          shadow_exit_price: number | null
          shadow_pnl: number | null
          shadow_pnl_pct: number | null
          sold: boolean
          symbol: string
          updated_at: string
        }
        Insert: {
          actual_buy_price?: number | null
          actual_sell_price?: number | null
          bid_confirmed_at_exit?: boolean | null
          bid_depth_at_entry: number
          bought?: boolean
          buy_timestamp?: string | null
          created_at?: string
          day1_price?: number | null
          day1_status?: string | null
          day2_price?: number | null
          day2_status?: string | null
          day3_price?: number | null
          day3_status?: string | null
          entry_price: number
          exit_reason?: string | null
          extra_hold_used?: boolean
          gap_pct: number
          id?: number
          news_30h?: boolean | null
          position_value: number
          realized_pnl?: number | null
          realized_pnl_pct?: number | null
          scan_date: string
          sell_signal?: boolean
          sell_signal_reason?: string | null
          sell_timestamp?: string | null
          shadow_exit_price?: number | null
          shadow_pnl?: number | null
          shadow_pnl_pct?: number | null
          sold?: boolean
          symbol: string
          updated_at?: string
        }
        Update: {
          actual_buy_price?: number | null
          actual_sell_price?: number | null
          bid_confirmed_at_exit?: boolean | null
          bid_depth_at_entry?: number
          bought?: boolean
          buy_timestamp?: string | null
          created_at?: string
          day1_price?: number | null
          day1_status?: string | null
          day2_price?: number | null
          day2_status?: string | null
          day3_price?: number | null
          day3_status?: string | null
          entry_price?: number
          exit_reason?: string | null
          extra_hold_used?: boolean
          gap_pct?: number
          id?: number
          news_30h?: boolean | null
          position_value?: number
          realized_pnl?: number | null
          realized_pnl_pct?: number | null
          scan_date?: string
          sell_signal?: boolean
          sell_signal_reason?: string | null
          sell_timestamp?: string | null
          shadow_exit_price?: number | null
          shadow_pnl?: number | null
          shadow_pnl_pct?: number | null
          sold?: boolean
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      scalp_feasibility_report: {
        Row: {
          best_case_gain_pct: number | null
          breakeven_price: number
          computed_at: string
          entry_actual_price: number | null
          entry_delay_sec: number | null
          entry_feasible: boolean | null
          entry_price: number
          exit_verdict: string
          id: number
          l2_at_signal_ts: string | null
          l2_at_target_ts: string | null
          l2_best_ask: number | null
          l2_best_bid: number | null
          l2_bid_at_target: number | null
          l2_bid_depth_at_target: number | null
          l2_bid_depth_top5: number | null
          max_price_180s: number | null
          max_price_60s: number | null
          min_price_180s: number | null
          prints_at_breakeven_count: number
          prints_at_target_count: number
          prints_at_target_volume: number
          sellable_at_target: boolean | null
          signal_id: number
          signal_ts: string
          symbol: string
          target_price: number
          ticks_in_window: number
          time_to_breakeven_sec: number | null
          time_to_target_sec: number | null
          trade_date: string
          worst_case_loss_pct: number | null
        }
        Insert: {
          best_case_gain_pct?: number | null
          breakeven_price: number
          computed_at?: string
          entry_actual_price?: number | null
          entry_delay_sec?: number | null
          entry_feasible?: boolean | null
          entry_price: number
          exit_verdict: string
          id?: number
          l2_at_signal_ts?: string | null
          l2_at_target_ts?: string | null
          l2_best_ask?: number | null
          l2_best_bid?: number | null
          l2_bid_at_target?: number | null
          l2_bid_depth_at_target?: number | null
          l2_bid_depth_top5?: number | null
          max_price_180s?: number | null
          max_price_60s?: number | null
          min_price_180s?: number | null
          prints_at_breakeven_count?: number
          prints_at_target_count?: number
          prints_at_target_volume?: number
          sellable_at_target?: boolean | null
          signal_id: number
          signal_ts: string
          symbol: string
          target_price: number
          ticks_in_window?: number
          time_to_breakeven_sec?: number | null
          time_to_target_sec?: number | null
          trade_date: string
          worst_case_loss_pct?: number | null
        }
        Update: {
          best_case_gain_pct?: number | null
          breakeven_price?: number
          computed_at?: string
          entry_actual_price?: number | null
          entry_delay_sec?: number | null
          entry_feasible?: boolean | null
          entry_price?: number
          exit_verdict?: string
          id?: number
          l2_at_signal_ts?: string | null
          l2_at_target_ts?: string | null
          l2_best_ask?: number | null
          l2_best_bid?: number | null
          l2_bid_at_target?: number | null
          l2_bid_depth_at_target?: number | null
          l2_bid_depth_top5?: number | null
          max_price_180s?: number | null
          max_price_60s?: number | null
          min_price_180s?: number | null
          prints_at_breakeven_count?: number
          prints_at_target_count?: number
          prints_at_target_volume?: number
          sellable_at_target?: boolean | null
          signal_id?: number
          signal_ts?: string
          symbol?: string
          target_price?: number
          ticks_in_window?: number
          time_to_breakeven_sec?: number | null
          time_to_target_sec?: number | null
          trade_date?: string
          worst_case_loss_pct?: number | null
        }
        Relationships: []
      }
      scalp_fresh_fetch_log: {
        Row: {
          cached_price: number
          cached_ts: string | null
          created_at: string
          diff_pct: number | null
          fetch_error: string | null
          fetch_ms: number | null
          fresh_price: number | null
          fresh_source: string | null
          id: string
          symbol: string
          trade_id: string | null
          trigger_still_valid: boolean | null
        }
        Insert: {
          cached_price: number
          cached_ts?: string | null
          created_at?: string
          diff_pct?: number | null
          fetch_error?: string | null
          fetch_ms?: number | null
          fresh_price?: number | null
          fresh_source?: string | null
          id?: string
          symbol: string
          trade_id?: string | null
          trigger_still_valid?: boolean | null
        }
        Update: {
          cached_price?: number
          cached_ts?: string | null
          created_at?: string
          diff_pct?: number | null
          fetch_error?: string | null
          fetch_ms?: number | null
          fresh_price?: number | null
          fresh_source?: string | null
          id?: string
          symbol?: string
          trade_id?: string | null
          trigger_still_valid?: boolean | null
        }
        Relationships: []
      }
      scalp_signal_log: {
        Row: {
          day_open: number | null
          decision: string
          id: number
          last_price: number | null
          last_tick_age_sec: number | null
          notes: Json | null
          ret_180s: number | null
          symbol: string
          trade_date: string
          ts: string
        }
        Insert: {
          day_open?: number | null
          decision: string
          id?: number
          last_price?: number | null
          last_tick_age_sec?: number | null
          notes?: Json | null
          ret_180s?: number | null
          symbol: string
          trade_date: string
          ts?: string
        }
        Update: {
          day_open?: number | null
          decision?: string
          id?: number
          last_price?: number | null
          last_tick_age_sec?: number | null
          notes?: Json | null
          ret_180s?: number | null
          symbol?: string
          trade_date?: string
          ts?: string
        }
        Relationships: []
      }
      scalp_timeline_events: {
        Row: {
          at_ms: number
          created_at: string
          event: string
          id: string
          meta: Json | null
          signal_id: string | null
          symbol: string
          uuid: string | null
        }
        Insert: {
          at_ms: number
          created_at?: string
          event: string
          id?: string
          meta?: Json | null
          signal_id?: string | null
          symbol: string
          uuid?: string | null
        }
        Update: {
          at_ms?: number
          created_at?: string
          event?: string
          id?: string
          meta?: Json | null
          signal_id?: string | null
          symbol?: string
          uuid?: string | null
        }
        Relationships: []
      }
      scans: {
        Row: {
          ai_count: number
          error_message: string | null
          finished_at: string | null
          id: string
          source_provider: string | null
          started_at: string
          status: Database["public"]["Enums"]["scan_status"]
          stocks_count: number
        }
        Insert: {
          ai_count?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          source_provider?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["scan_status"]
          stocks_count?: number
        }
        Update: {
          ai_count?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          source_provider?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["scan_status"]
          stocks_count?: number
        }
        Relationships: []
      }
      sell_alerts: {
        Row: {
          acknowledged: boolean
          alert_type: Database["public"]["Enums"]["exit_reason"]
          created_at: string
          id: string
          message_ar: string
          pnl_pct: number | null
          position_id: string
          suggested_exit_price: number | null
          symbol: string
        }
        Insert: {
          acknowledged?: boolean
          alert_type: Database["public"]["Enums"]["exit_reason"]
          created_at?: string
          id?: string
          message_ar: string
          pnl_pct?: number | null
          position_id: string
          suggested_exit_price?: number | null
          symbol: string
        }
        Update: {
          acknowledged?: boolean
          alert_type?: Database["public"]["Enums"]["exit_reason"]
          created_at?: string
          id?: string
          message_ar?: string
          pnl_pct?: number | null
          position_id?: string
          suggested_exit_price?: number | null
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "sell_alerts_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_edits: {
        Row: {
          content_hash: string
          created_at: string
          extra: Json
          files_changed: string[]
          id: string
          migrations: string[]
          summary: string
          turn_id: string | null
          version: string | null
        }
        Insert: {
          content_hash: string
          created_at?: string
          extra?: Json
          files_changed?: string[]
          id?: string
          migrations?: string[]
          summary: string
          turn_id?: string | null
          version?: string | null
        }
        Update: {
          content_hash?: string
          created_at?: string
          extra?: Json
          files_changed?: string[]
          id?: string
          migrations?: string[]
          summary?: string
          turn_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      session_ingest_audit: {
        Row: {
          client_batch_id: string | null
          created_at: string
          duplicate_count: number
          edits_count: number
          error_message: string | null
          error_stage: string | null
          id: string
          items_total: number
          messages_count: number
          ok: boolean
          reads_count: number
          source: string
          turn_id: string | null
        }
        Insert: {
          client_batch_id?: string | null
          created_at?: string
          duplicate_count?: number
          edits_count?: number
          error_message?: string | null
          error_stage?: string | null
          id?: string
          items_total?: number
          messages_count?: number
          ok?: boolean
          reads_count?: number
          source?: string
          turn_id?: string | null
        }
        Update: {
          client_batch_id?: string | null
          created_at?: string
          duplicate_count?: number
          edits_count?: number
          error_message?: string | null
          error_stage?: string | null
          id?: string
          items_total?: number
          messages_count?: number
          ok?: boolean
          reads_count?: number
          source?: string
          turn_id?: string | null
        }
        Relationships: []
      }
      session_messages: {
        Row: {
          content: string
          content_hash: string
          created_at: string
          id: string
          role: string
          turn_id: string | null
        }
        Insert: {
          content: string
          content_hash: string
          created_at?: string
          id?: string
          role: string
          turn_id?: string | null
        }
        Update: {
          content?: string
          content_hash?: string
          created_at?: string
          id?: string
          role?: string
          turn_id?: string | null
        }
        Relationships: []
      }
      session_reads: {
        Row: {
          content_hash: string
          created_at: string
          file_path: string
          id: string
          key_findings: string | null
          purpose: string | null
          turn_id: string | null
        }
        Insert: {
          content_hash: string
          created_at?: string
          file_path: string
          id?: string
          key_findings?: string | null
          purpose?: string | null
          turn_id?: string | null
        }
        Update: {
          content_hash?: string
          created_at?: string
          file_path?: string
          id?: string
          key_findings?: string | null
          purpose?: string | null
          turn_id?: string | null
        }
        Relationships: []
      }
      signal_failures: {
        Row: {
          description_ar: string
          discovered_at: string
          failure_count: number
          id: string
          is_active: boolean
          last_updated: string
          pattern_name: string
          rule_json: Json
          total_count: number
          win_count: number
          win_rate: number | null
        }
        Insert: {
          description_ar: string
          discovered_at?: string
          failure_count?: number
          id?: string
          is_active?: boolean
          last_updated?: string
          pattern_name: string
          rule_json: Json
          total_count?: number
          win_count?: number
          win_rate?: number | null
        }
        Update: {
          description_ar?: string
          discovered_at?: string
          failure_count?: number
          id?: string
          is_active?: boolean
          last_updated?: string
          pattern_name?: string
          rule_json?: Json
          total_count?: number
          win_count?: number
          win_rate?: number | null
        }
        Relationships: []
      }
      smart_exit_log: {
        Row: {
          action: string
          entry_price: number | null
          id: string
          metadata: Json | null
          mw_trades_5m: number | null
          mw_volume_5m: number | null
          pnl_pct: number | null
          position_id: string | null
          price: number | null
          rule: string
          seconds_since_entry: number | null
          shadow: boolean
          strategy: string
          symbol: string
          trade_date: string
          ts: string
        }
        Insert: {
          action: string
          entry_price?: number | null
          id?: string
          metadata?: Json | null
          mw_trades_5m?: number | null
          mw_volume_5m?: number | null
          pnl_pct?: number | null
          position_id?: string | null
          price?: number | null
          rule: string
          seconds_since_entry?: number | null
          shadow?: boolean
          strategy?: string
          symbol: string
          trade_date: string
          ts?: string
        }
        Update: {
          action?: string
          entry_price?: number | null
          id?: string
          metadata?: Json | null
          mw_trades_5m?: number | null
          mw_volume_5m?: number | null
          pnl_pct?: number | null
          position_id?: string | null
          price?: number | null
          rule?: string
          seconds_since_entry?: number | null
          shadow?: boolean
          strategy?: string
          symbol?: string
          trade_date?: string
          ts?: string
        }
        Relationships: []
      }
      sniper_picks: {
        Row: {
          confidence: number | null
          created_at: string
          entry_price: number | null
          exit_price: number | null
          id: string
          name_ar: string | null
          negative_reasons: string[] | null
          notified_at: string | null
          orb_confidence: number | null
          orb_decision: string | null
          orb_high: number | null
          orb_low: number | null
          pick_date: string
          pnl_pct: number | null
          position_pct: number | null
          prev_close: number | null
          reasons: string[] | null
          status: string
          stop_price: number | null
          symbol: string
          target_price: number | null
          trailing_plan: Json | null
          updated_at: string
          v3_score: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          name_ar?: string | null
          negative_reasons?: string[] | null
          notified_at?: string | null
          orb_confidence?: number | null
          orb_decision?: string | null
          orb_high?: number | null
          orb_low?: number | null
          pick_date: string
          pnl_pct?: number | null
          position_pct?: number | null
          prev_close?: number | null
          reasons?: string[] | null
          status?: string
          stop_price?: number | null
          symbol: string
          target_price?: number | null
          trailing_plan?: Json | null
          updated_at?: string
          v3_score: number
        }
        Update: {
          confidence?: number | null
          created_at?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          name_ar?: string | null
          negative_reasons?: string[] | null
          notified_at?: string | null
          orb_confidence?: number | null
          orb_decision?: string | null
          orb_high?: number | null
          orb_low?: number | null
          pick_date?: string
          pnl_pct?: number | null
          position_pct?: number | null
          prev_close?: number | null
          reasons?: string[] | null
          status?: string
          stop_price?: number | null
          symbol?: string
          target_price?: number | null
          trailing_plan?: Json | null
          updated_at?: string
          v3_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "sniper_picks_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["symbol"]
          },
        ]
      }
      stock_snapshots: {
        Row: {
          atr14: number | null
          bb_lower: number | null
          bb_mid: number | null
          bb_upper: number | null
          change_pct: number | null
          close: number
          composite_score: number
          created_at: string
          data_provider: string | null
          ema21: number | null
          ema9: number | null
          high: number | null
          id: string
          low: number | null
          macd: number | null
          macd_hist: number | null
          macd_signal: number | null
          open: number | null
          patterns: Json
          prev_close: number | null
          resistance: number | null
          rsi14: number | null
          scan_id: string
          sma50: number | null
          support: number | null
          symbol: string
          ts: string
          vol_avg20: number | null
          vol_ratio: number | null
          volume: number | null
        }
        Insert: {
          atr14?: number | null
          bb_lower?: number | null
          bb_mid?: number | null
          bb_upper?: number | null
          change_pct?: number | null
          close: number
          composite_score?: number
          created_at?: string
          data_provider?: string | null
          ema21?: number | null
          ema9?: number | null
          high?: number | null
          id?: string
          low?: number | null
          macd?: number | null
          macd_hist?: number | null
          macd_signal?: number | null
          open?: number | null
          patterns?: Json
          prev_close?: number | null
          resistance?: number | null
          rsi14?: number | null
          scan_id: string
          sma50?: number | null
          support?: number | null
          symbol: string
          ts: string
          vol_avg20?: number | null
          vol_ratio?: number | null
          volume?: number | null
        }
        Update: {
          atr14?: number | null
          bb_lower?: number | null
          bb_mid?: number | null
          bb_upper?: number | null
          change_pct?: number | null
          close?: number
          composite_score?: number
          created_at?: string
          data_provider?: string | null
          ema21?: number | null
          ema9?: number | null
          high?: number | null
          id?: string
          low?: number | null
          macd?: number | null
          macd_hist?: number | null
          macd_signal?: number | null
          open?: number | null
          patterns?: Json
          prev_close?: number | null
          resistance?: number | null
          rsi14?: number | null
          scan_id?: string
          sma50?: number | null
          support?: number | null
          symbol?: string
          ts?: string
          vol_avg20?: number | null
          vol_ratio?: number | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_snapshots_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_snapshots_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["symbol"]
          },
        ]
      }
      stocks: {
        Row: {
          created_at: string
          day_tradable: boolean
          investing_slug: string | null
          is_active: boolean
          is_sharia: boolean
          name_ar: string
          name_en: string
          sector_ar: string | null
          sharia_source: string | null
          symbol: string
          yahoo_symbol: string
        }
        Insert: {
          created_at?: string
          day_tradable?: boolean
          investing_slug?: string | null
          is_active?: boolean
          is_sharia?: boolean
          name_ar: string
          name_en: string
          sector_ar?: string | null
          sharia_source?: string | null
          symbol: string
          yahoo_symbol: string
        }
        Update: {
          created_at?: string
          day_tradable?: boolean
          investing_slug?: string | null
          is_active?: boolean
          is_sharia?: boolean
          name_ar?: string
          name_en?: string
          sector_ar?: string | null
          sharia_source?: string | null
          symbol?: string
          yahoo_symbol?: string
        }
        Relationships: []
      }
      mubasher_news: {
        Row: {
          category_id: string | null
          category_name: string | null
          created_at: string
          date_raw: string | null
          headline: string
          id: string
          published_at: string
          pulled_at: string | null
          source: string
          summary_ar: string | null
          url: string
        }
        Insert: {
          category_id?: string | null
          category_name?: string | null
          created_at?: string
          date_raw?: string | null
          headline: string
          id?: string
          published_at: string
          pulled_at?: string | null
          source: string
          summary_ar?: string | null
          url: string
        }
        Update: {
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          date_raw?: string | null
          headline?: string
          id?: string
          published_at?: string
          pulled_at?: string | null
          source?: string
          summary_ar?: string | null
          url?: string
        }
        Relationships: []
      }
      news_symbol_map: {
        Row: {
          article_id: string
          symbol: string
        }
        Insert: {
          article_id: string
          symbol: string
        }
        Update: {
          article_id?: string
          symbol?: string
        }
        Relationships: []
      }
      symbol_profile: {
        Row: {
          market_cap: number | null
          shares_outstanding: number | null
          symbol: string
          updated_at: string
        }
        Insert: {
          market_cap?: number | null
          shares_outstanding?: number | null
          symbol: string
          updated_at?: string
        }
        Update: {
          market_cap?: number | null
          shares_outstanding?: number | null
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      strategy_settings: {
        Row: {
          enabled: boolean
          key: string
          numeric_value: number | null
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          key: string
          numeric_value?: number | null
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          key?: string
          numeric_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      thunder_auth_events: {
        Row: {
          client_id: string | null
          extras: Json | null
          id: string
          kind: string
          message: string | null
          ts: string
          url: string | null
        }
        Insert: {
          client_id?: string | null
          extras?: Json | null
          id?: string
          kind: string
          message?: string | null
          ts?: string
          url?: string | null
        }
        Update: {
          client_id?: string | null
          extras?: Json | null
          id?: string
          kind?: string
          message?: string | null
          ts?: string
          url?: string | null
        }
        Relationships: []
      }
      thunder_tape: {
        Row: {
          asset_id: string
          captured_at: string
          cursor: number
          id: number
          price: number | null
          raw: Json | null
          side: string | null
          symbol: string | null
          trade_time: string | null
          value: number | null
          volume: number | null
        }
        Insert: {
          asset_id: string
          captured_at?: string
          cursor: number
          id?: number
          price?: number | null
          raw?: Json | null
          side?: string | null
          symbol?: string | null
          trade_time?: string | null
          value?: number | null
          volume?: number | null
        }
        Update: {
          asset_id?: string
          captured_at?: string
          cursor?: number
          id?: number
          price?: number | null
          raw?: Json | null
          side?: string | null
          symbol?: string | null
          trade_time?: string | null
          value?: number | null
          volume?: number | null
        }
        Relationships: []
      }
      thunder_tick_archive: {
        Row: {
          ask: number | null
          bid: number | null
          created_at: string
          price: number
          symbol: string
          ts: string
          volume: number | null
        }
        Insert: {
          ask?: number | null
          bid?: number | null
          created_at?: string
          price: number
          symbol: string
          ts: string
          volume?: number | null
        }
        Update: {
          ask?: number | null
          bid?: number | null
          created_at?: string
          price?: number
          symbol?: string
          ts?: string
          volume?: number | null
        }
        Relationships: []
      }
      thunder_watchlist_snapshots: {
        Row: {
          day_tradable: boolean | null
          day_trade_limit: number | null
          feed_price: number | null
          id: number
          market_id: string | null
          max_price_limit: number | null
          min_price_limit: number | null
          name: string | null
          previous_close: number | null
          round_digits: number | null
          source: string
          symbol: string
          ts: string
          uuid: string | null
        }
        Insert: {
          day_tradable?: boolean | null
          day_trade_limit?: number | null
          feed_price?: number | null
          id?: number
          market_id?: string | null
          max_price_limit?: number | null
          min_price_limit?: number | null
          name?: string | null
          previous_close?: number | null
          round_digits?: number | null
          source?: string
          symbol: string
          ts?: string
          uuid?: string | null
        }
        Update: {
          day_tradable?: boolean | null
          day_trade_limit?: number | null
          feed_price?: number | null
          id?: number
          market_id?: string | null
          max_price_limit?: number | null
          min_price_limit?: number | null
          name?: string | null
          previous_close?: number | null
          round_digits?: number | null
          source?: string
          symbol?: string
          ts?: string
          uuid?: string | null
        }
        Relationships: []
      }
      trade_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          paper_trade_id: string | null
          pending_order_id: string | null
          position_id: string | null
          price: number | null
          qty: number | null
          reason: string | null
          source: string | null
          state: string | null
          strategy: string | null
          symbol: string
          trade_date: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          paper_trade_id?: string | null
          pending_order_id?: string | null
          position_id?: string | null
          price?: number | null
          qty?: number | null
          reason?: string | null
          source?: string | null
          state?: string | null
          strategy?: string | null
          symbol: string
          trade_date: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          paper_trade_id?: string | null
          pending_order_id?: string | null
          position_id?: string | null
          price?: number | null
          qty?: number | null
          reason?: string | null
          source?: string | null
          state?: string | null
          strategy?: string | null
          symbol?: string
          trade_date?: string
        }
        Relationships: []
      }
      walk_forward_days: {
        Row: {
          avg_picks_return_pct: number | null
          created_at: string
          id: string
          market_regime: string | null
          next_trading_date: string | null
          picks: Json
          prediction_date: string
          run_id: string
          top_pick_confidence: number | null
          top_pick_return_pct: number | null
          top_pick_symbol: string | null
          was_correct: boolean | null
        }
        Insert: {
          avg_picks_return_pct?: number | null
          created_at?: string
          id?: string
          market_regime?: string | null
          next_trading_date?: string | null
          picks?: Json
          prediction_date: string
          run_id: string
          top_pick_confidence?: number | null
          top_pick_return_pct?: number | null
          top_pick_symbol?: string | null
          was_correct?: boolean | null
        }
        Update: {
          avg_picks_return_pct?: number | null
          created_at?: string
          id?: string
          market_regime?: string | null
          next_trading_date?: string | null
          picks?: Json
          prediction_date?: string
          run_id?: string
          top_pick_confidence?: number | null
          top_pick_return_pct?: number | null
          top_pick_symbol?: string | null
          was_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "walk_forward_days_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "walk_forward_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      walk_forward_runs: {
        Row: {
          accuracy_pct: number | null
          avg_next_day_return_pct: number | null
          correct_days: number
          error_message: string | null
          finished_at: string | null
          from_date: string | null
          id: string
          min_confidence: number
          no_pick_days: number
          picks_per_day: number
          started_at: string
          status: string
          strategy_version: string
          to_date: string | null
          top_pick_win_rate: number | null
          total_days: number
          wrong_days: number
        }
        Insert: {
          accuracy_pct?: number | null
          avg_next_day_return_pct?: number | null
          correct_days?: number
          error_message?: string | null
          finished_at?: string | null
          from_date?: string | null
          id?: string
          min_confidence?: number
          no_pick_days?: number
          picks_per_day?: number
          started_at?: string
          status?: string
          strategy_version?: string
          to_date?: string | null
          top_pick_win_rate?: number | null
          total_days?: number
          wrong_days?: number
        }
        Update: {
          accuracy_pct?: number | null
          avg_next_day_return_pct?: number | null
          correct_days?: number
          error_message?: string | null
          finished_at?: string | null
          from_date?: string | null
          id?: string
          min_confidence?: number
          no_pick_days?: number
          picks_per_day?: number
          started_at?: string
          status?: string
          strategy_version?: string
          to_date?: string | null
          top_pick_win_rate?: number | null
          total_days?: number
          wrong_days?: number
        }
        Relationships: []
      }
    }
    Views: {
      depth_imbalance: {
        Row: {
          ask_levels: number | null
          best_ask: number | null
          best_bid: number | null
          bid_ask_ratio: number | null
          bid_levels: number | null
          id: number | null
          spread: number | null
          symbol: string | null
          total_ask_qty: number | null
          total_bid_qty: number | null
          ts: string | null
        }
        Insert: {
          ask_levels?: never
          best_ask?: number | null
          best_bid?: number | null
          bid_ask_ratio?: never
          bid_levels?: never
          id?: number | null
          spread?: number | null
          symbol?: string | null
          total_ask_qty?: never
          total_bid_qty?: never
          ts?: string | null
        }
        Update: {
          ask_levels?: never
          best_ask?: number | null
          best_bid?: number | null
          bid_ask_ratio?: never
          bid_levels?: never
          id?: number | null
          spread?: number | null
          symbol?: string | null
          total_ask_qty?: never
          total_bid_qty?: never
          ts?: string | null
        }
        Relationships: []
      }
      fill_analysis_v: {
        Row: {
          best_ask_at_placement: number | null
          best_bid_at_placement: number | null
          break_even: number | null
          fill_price_avg: number | null
          filled_qty: number | null
          first_fill_at: string | null
          fully_filled_at: string | null
          order_id: string | null
          order_type: string | null
          placed_at: string | null
          requested_price: number | null
          requested_qty: number | null
          safe_floor: number | null
          side: string | null
          signal_source: string | null
          slippage_vs_requested: number | null
          slippage_vs_touch: number | null
          spread_at_placement: number | null
          status: string | null
          strategy: string | null
          symbol: string | null
          time_to_first_fill_ms: number | null
          time_to_full_fill_ms: number | null
        }
        Relationships: []
      }
      live_ticks_best: {
        Row: {
          meta: Json | null
          price: number | null
          source: string | null
          symbol: string | null
          ts: string | null
          volume: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_ticks_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["symbol"]
          },
        ]
      }
      news_near_signal: {
        Row: {
          decision: string | null
          delta_sec: number | null
          headline: string | null
          last_price: number | null
          news_id: string | null
          news_ts: string | null
          sentiment_score: number | null
          signal_id: number | null
          signal_ts: string | null
          symbol: string | null
        }
        Relationships: []
      }
      opening_range: {
        Row: {
          or_end_ts: string | null
          or_high: number | null
          or_low: number | null
          or_range: number | null
          or_range_pct: number | null
          or_start_ts: string | null
          or_volume: number | null
          symbol: string | null
          ticks_in_range: number | null
          trade_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_ticks_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["symbol"]
          },
        ]
      }
      paper_trades_analytics: {
        Row: {
          avg_hold_sec: number | null
          avg_pnl: number | null
          avg_pnl_pct: number | null
          eod_exits: number | null
          losses: number | null
          sl_hits: number | null
          strategy: string | null
          symbol: string | null
          time_exits: number | null
          total_pnl: number | null
          tp_hits: number | null
          trade_date: string | null
          trades: number | null
          trail_exits: number | null
          win_rate_pct: number | null
          wins: number | null
        }
        Relationships: []
      }
      signal_reversal_check: {
        Row: {
          entry_ts: string | null
          exit_price: number | null
          exit_ts: string | null
          max_price_next_5min: number | null
          min_price_next_5min: number | null
          pnl: number | null
          reversed_below_exit: boolean | null
          strategy: string | null
          symbol: string | null
          trade_id: string | null
        }
        Insert: {
          entry_ts?: string | null
          exit_price?: number | null
          exit_ts?: string | null
          max_price_next_5min?: never
          min_price_next_5min?: never
          pnl?: number | null
          reversed_below_exit?: never
          strategy?: string | null
          symbol?: string | null
          trade_id?: string | null
        }
        Update: {
          entry_ts?: string | null
          exit_price?: number | null
          exit_ts?: string | null
          max_price_next_5min?: never
          min_price_next_5min?: never
          pnl?: number | null
          reversed_below_exit?: never
          strategy?: string | null
          symbol?: string | null
          trade_id?: string | null
        }
        Relationships: []
      }
      strategy_overview: {
        Row: {
          avg_hold_sec: number | null
          avg_loss: number | null
          avg_pnl: number | null
          avg_win: number | null
          best_trade: number | null
          first_date: string | null
          last_date: string | null
          losses: number | null
          sl_hits: number | null
          strategy: string | null
          symbols_traded: number | null
          total_pnl: number | null
          total_trades: number | null
          tp_hits: number | null
          trading_days: number | null
          win_rate_pct: number | null
          wins: number | null
          worst_trade: number | null
        }
        Relationships: []
      }
      strategy_symbol_ranking: {
        Row: {
          avg_pnl: number | null
          strategy: string | null
          symbol: string | null
          total_pnl: number | null
          trades: number | null
          win_rate_pct: number | null
          wins: number | null
        }
        Relationships: []
      }
      symbol_vwap_daily: {
        Row: {
          avg_price: number | null
          day_high: number | null
          day_low: number | null
          symbol: string | null
          tick_count: number | null
          total_volume: number | null
          trade_date: string | null
          vwap: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_ticks_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["symbol"]
          },
        ]
      }
    }
    Functions: {
      dedup_latest_for_symbols: {
        Args: { p_symbols: string[] }
        Returns: {
          symbol: string
          last_price: number | null
          total_volume: number | null
          total_trades: number | null
          highest_bid: number | null
          lowest_ask: number | null
          captured_at: string
        }[]
      }
      candles_stats: {
        Args: never
        Returns: {
          distinct_symbols: number
          max_date: string
          min_date: string
          total_candles: number
        }[]
      }
      compress_marketwatch_snapshots: {
        Args: { retention_days: number }
        Returns: undefined
      }
      gap_liquidity_scores: {
        Args: { lookback_days?: number; min_sessions?: number }
        Returns: {
          avg_distinct_prices: number
          sessions: number
          symbol: string
        }[]
      }
      get_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          jobid: number
          jobname: string
          schedule: string
        }[]
      }
      get_cron_runs: {
        Args: { p_limit?: number }
        Returns: {
          end_time: string
          jobid: number
          jobname: string
          return_message: string
          runid: number
          start_time: string
          status: string
        }[]
      }
      match_news_history: {
        Args: {
          match_count?: number
          match_symbol?: string
          min_similarity?: number
          query_embedding: string
        }
        Returns: {
          headline: string
          id: string
          outcome_5d_pct: number
          published_at: string
          sentiment_score: number
          similarity: number
          symbol: string
        }[]
      }
      top_active_day_tradable_today: {
        Args: { p_limit?: number }
        Returns: {
          symbol: string
        }[]
      }
    }
    Enums: {
      exit_reason:
        | "target_hit"
        | "stop_loss"
        | "trailing_stop"
        | "time_exit"
        | "manual"
        | "news_shock"
      position_status: "open" | "closed"
      reco_outcome:
        | "pending"
        | "target_hit"
        | "stop_hit"
        | "expired"
        | "manual_close"
      scan_status: "running" | "completed" | "failed"
      signal_type: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      exit_reason: [
        "target_hit",
        "stop_loss",
        "trailing_stop",
        "time_exit",
        "manual",
        "news_shock",
      ],
      position_status: ["open", "closed"],
      reco_outcome: [
        "pending",
        "target_hit",
        "stop_hit",
        "expired",
        "manual_close",
      ],
      scan_status: ["running", "completed", "failed"],
      signal_type: ["strong_buy", "buy", "neutral", "sell", "strong_sell"],
    },
  },
} as const
