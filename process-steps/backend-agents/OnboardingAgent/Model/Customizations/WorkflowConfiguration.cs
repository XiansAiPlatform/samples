using System.Collections.Generic;

namespace OnboardingAgent.Model.Customizations;

/// <summary>
/// Workflow configuration
/// </summary>
public class WorkflowConfiguration
    {
        /// <summary>
        /// Workflow identifier
        /// </summary>
        public string WorkflowId { get; set; } = string.Empty;

        /// <summary>
        /// Workflow name
        /// </summary>
        public string WorkflowName { get; set; } = string.Empty;

    /// <summary>
    /// Workflow configuration settings
    /// </summary>
    public Dictionary<string, object> Settings { get; set; } = new();
} 