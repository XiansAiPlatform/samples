namespace OnboardingAgent.Model.Core;

/// <summary>
/// Customer contact information
/// </summary>
public class CustomerContact
    {
        /// <summary>
        /// Primary contact person's full name
        /// </summary>
        public string FullName { get; set; } = string.Empty;

        /// <summary>
        /// Primary email address
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Primary phone number
        /// </summary>
        public string? Phone { get; set; }

        /// <summary>
        /// Job title or position
        /// </summary>
        public string? JobTitle { get; set; }

    /// <summary>
    /// Department or division
    /// </summary>
    public string? Department { get; set; }
} 