namespace OnboardingAgent.Model.Core;

/// <summary>
/// Enumeration of possible onboarding process statuses
/// </summary>
public enum OnboardingStatus
{
    NotStarted,
    InProgress,
    PendingApproval,
    Completed,
    Failed,
    Cancelled
} 