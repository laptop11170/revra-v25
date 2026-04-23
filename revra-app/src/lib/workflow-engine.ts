import type { Lead, Workflow, WorkflowNode, WorkflowEdge } from '@/types';

export type TriggerType =
  | 'lead_created'
  | 'lead_stage_changed'
  | 'lead_assigned'
  | 'score_threshold'
  | 'appointment_scheduled'
  | 'call_completed'
  | 'sms_sent'
  | 'ai_briefing_run';

export type ConditionField = 'outcome' | 'score' | 'source' | 'coverage_type' | 'days_in_stage' | 'assigned_agent_id';
export type ConditionOp = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
export type ActionType = 'send_sms' | 'update_stage' | 'assign_agent' | 'send_email' | 'add_tag' | 'schedule_task' | 'queue_emma';

export interface WorkflowExecution {
  workflowId: string;
  leadId: string;
  triggeredAt: number;
  nodeId: string;
  status: 'running' | 'completed' | 'failed';
  result?: Record<string, unknown>;
}

interface NodeResult {
  success: boolean;
  nextNodeId?: string;
  result?: Record<string, unknown>;
  error?: string;
}

async function executeAction(
  node: WorkflowNode,
  lead: Lead,
  context: { adminClient: any; workspaceId: string }
): Promise<NodeResult> {
  const { adminClient } = context;

  switch (node.type) {
    case 'action': {
      const actionType = node.config.actionType as ActionType;
      switch (actionType) {
        case 'send_sms': {
          const message = (node.config.message as string || 'Hello, following up on your inquiry.')
            .replace('{{lead_name}}', lead.fullName)
            .replace('{{agent_name}}', (node.config.agentName as string) || 'Your agent');
          const { data: conv } = await adminClient
            .from('conversations')
            .select('id')
            .eq('lead_id', lead.id)
            .eq('workspace_id', context.workspaceId)
            .maybeSingle();
          let conversationId = conv?.id;
          if (!conversationId) {
            const newConv = await adminClient
              .from('conversations')
              .insert({ workspace_id: context.workspaceId, lead_id: lead.id, channel: 'sms', status: 'active' })
              .select('id').single();
            conversationId = newConv.data?.id;
          }
          if (conversationId) {
            await adminClient.from('messages').insert({
              conversation_id: conversationId,
              direction: 'outbound',
              content: message,
              status: 'queued',
            });
          }
          return { success: true, result: { action: 'sms_sent', message } };
        }
        case 'update_stage': {
          const targetStageId = node.config.targetStageId as string;
          if (targetStageId) {
            await adminClient.from('leads').update({
              stage_id: targetStageId,
              entered_stage_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }).eq('id', lead.id);
          }
          return { success: true, result: { action: 'stage_updated', newStageId: targetStageId } };
        }
        case 'assign_agent': {
          const agentId = node.config.agentId as string;
          if (agentId) {
            await adminClient.from('leads').update({
              assigned_agent_id: agentId,
              updated_at: new Date().toISOString(),
            }).eq('id', lead.id);
          }
          return { success: true, result: { action: 'agent_assigned', agentId } };
        }
        case 'add_tag': {
          const tag = node.config.tag as string;
          if (tag) {
            const existing = (lead.tags || []) as string[];
            if (!existing.includes(tag)) {
              await adminClient.from('leads').update({
                tags: [...existing, tag],
                updated_at: new Date().toISOString(),
              }).eq('id', lead.id);
            }
          }
          return { success: true, result: { action: 'tag_added', tag } };
        }
        case 'queue_emma': {
          const campaignId = node.config.campaignId as string;
          await adminClient.from('emma_events').insert({
            lead_id: lead.id,
            workspace_id: context.workspaceId,
            event_type: 'queued',
            campaign_id: campaignId || null,
            metadata: { queued_by: 'workflow', node_id: node.id, workflow_trigger: true },
          });
          return { success: true, result: { action: 'queued_emma', campaignId } };
        }
        default:
          return { success: true, result: { action: 'noop' } };
      }
    }
    case 'delay': {
      const delayMinutes = (node.config.delayMinutes as number) || 60;
      return { success: true, result: { action: 'delayed', minutes: delayMinutes } };
    }
    default:
      return { success: true, result: { action: 'noop' } };
  }
}

function evaluateCondition(node: WorkflowNode, lead: Lead): boolean {
  const field = node.config.field as ConditionField;
  const op = node.config.operator as ConditionOp;
  const value = node.config.value as string | number;

  let leadValue: unknown;
  switch (field) {
    case 'outcome': leadValue = lead.outcome; break;
    case 'score': leadValue = lead.score; break;
    case 'source': leadValue = lead.source; break;
    case 'coverage_type': leadValue = lead.coverageType; break;
    case 'days_in_stage': leadValue = (lead as any).days_in_stage ?? lead.score; break;
    default: return true;
  }

  switch (op) {
    case 'equals': return String(leadValue) === String(value);
    case 'not_equals': return String(leadValue) !== String(value);
    case 'greater_than': return Number(leadValue) > Number(value);
    case 'less_than': return Number(leadValue) < Number(value);
    case 'contains': return String(leadValue).toLowerCase().includes(String(value).toLowerCase());
    default: return true;
  }
}

export async function evaluateWorkflow(
  workflow: Workflow,
  lead: Lead,
  trigger: TriggerType,
  context: { adminClient: any; workspaceId: string }
): Promise<WorkflowExecution[]> {
  if (!workflow.isActive) return [];

  const nodes = workflow.nodes as WorkflowNode[];
  const edges = workflow.edges as WorkflowEdge[];

  const triggerNode = nodes.find(n => n.type === 'trigger');
  if (!triggerNode) return [];

  const triggerType = triggerNode.config.type as TriggerType;
  if (triggerType !== trigger) return [];

  const executions: WorkflowExecution[] = [];
  const visited = new Set<string>();

  async function traverse(nodeId: string): Promise<void> {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    executions.push({
      workflowId: workflow.id,
      leadId: lead.id,
      triggeredAt: Date.now(),
      nodeId,
      status: 'running',
    });

    const nodeEdges = edges.filter(e => e.sourceId === nodeId);

    if (node.type === 'condition') {
      const passed = evaluateCondition(node, lead);
      const relevantEdge = nodeEdges.find(e => e.condition === (passed ? 'yes' : 'no'));
      if (relevantEdge) {
        await traverse(relevantEdge.targetId);
      }
    } else if (node.type === 'action' || node.type === 'delay') {
      await executeAction(node, lead, context);
      for (const edge of nodeEdges) {
        await traverse(edge.targetId);
      }
    } else if (node.type === 'trigger') {
      for (const edge of nodeEdges) {
        await traverse(edge.targetId);
      }
    }
  }

  for (const edge of edges.filter(e => e.sourceId === triggerNode.id)) {
    await traverse(edge.targetId);
  }

  return executions;
}

export async function logWorkflowRun(
  adminClient: any,
  _workspaceId: string,
  execution: WorkflowExecution
): Promise<void> {
  await adminClient.from('lead_activities').insert({
    lead_id: execution.leadId,
    type: 'workflow_run',
    description: `Workflow triggered: ${execution.nodeId}`,
    metadata: execution,
  });
}
