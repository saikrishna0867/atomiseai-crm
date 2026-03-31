# Automise AI CRM

A production-grade CRM platform built for the 
Automise AI Batch Challenge.

## Live URL
https://atomise-crm-pr.lovable.app

## Tech Stack
- Frontend: React (built with Lovable)
- Database: Supabase (PostgreSQL)
- Automation: N8n (6 live workflows)
- AI: GPT-4o via N8n
- Deployment: Lovable

## Features
- Contact Management with full activity history
- Kanban Pipeline with drag and drop
- 6 Live N8n Automation Workflows
- AI Lead Summaries powered by GPT-4o
- Email Campaign Builder
- Appointment Scheduler with confirmations
- Drip Email Sequences (Day 1, 3, 7)
- Real-time Dashboard with KPIs

## N8n Workflows
1. New Lead Assigned
2. Stage Change Sequence  
3. Drip Follow-Up Sequence
4. Email Campaign Builder
5. Appointment Confirmation
6. AI Lead Summary (GPT-4o)

## Supabase Tables
contacts, pipeline_deals, activity_log, 
tasks, appointments, campaigns, 
drip_sequences, ai_summaries, dashboard_stats

Built by Saikrishna | Automise AI Batch 2026

I built Automise AI CRM using React via Lovable for the 
frontend, Supabase as the PostgreSQL database with 
9 tables, and N8n for all automation with 6 live 
working workflows. The stack also integrates GPT-4o 
via OpenAI for AI-powered lead summaries generated 
directly inside the CRM. I am most proud of the 
end-to-end automation — when a sales rep adds a 
contact, two webhooks fire simultaneously triggering 
a welcome email, rep notification, task creation, 
and a 3-email drip sequence over 7 days, all without 
any human involvement. The application is fully 
deployed and live at the submitted URL.
