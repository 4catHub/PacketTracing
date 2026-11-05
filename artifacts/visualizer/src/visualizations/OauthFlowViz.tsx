import WorkflowFocusedViz from "./WorkflowFocusedViz";
import OauthFlowScene from "./OauthFlowScene";
import { oauthWorkflow } from "./oauth-flow-model";

export default function OauthFlowViz() {
  return <WorkflowFocusedViz spec={oauthWorkflow} TopologyCanvas={OauthFlowScene} />;
}
