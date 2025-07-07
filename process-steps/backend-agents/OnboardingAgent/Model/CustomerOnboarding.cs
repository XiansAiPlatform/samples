using System;
using OnboardingAgent.Model.Integrations;
using OnboardingAgent.Model.Customizations;
using OnboardingAgent.Model.Core;

namespace OnboardingAgent.Model;

/// <summary>
/// Domain model representing the customer onboarding process and configuration
/// </summary>
public class CustomerOnboarding
    {
        /// <summary>
        /// Unique identifier for the customer onboarding process
        /// </summary>
        public Guid Id { get; set; }

        /// <summary>
        /// Timestamp when the onboarding process was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Timestamp when the onboarding process was last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; }

        /// <summary>
        /// Current status of the onboarding process
        /// </summary>
        public OnboardingStatus Status { get; set; }

        /// <summary>
        /// General customer information
        /// </summary>
        public GeneralInformation General { get; set; } = new();

        /// <summary>
        /// Integration configurations
        /// </summary>
        public IntegrationConfiguration Integrations { get; set; } = new();

        /// <summary>
        /// Product customization settings
        /// </summary>
        public ProductCustomizations ProductCustomizations { get; set; } = new();

    /// <summary>
    /// Additional notes or comments about the onboarding process
    /// </summary>
    public string? Notes { get; set; }
} 