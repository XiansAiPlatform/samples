namespace OnboardingAgent.Model.Core;

/// <summary>
/// General customer information
/// </summary>
public class GeneralInformation
    {
        /// <summary>
        /// Unique customer identifier
        /// </summary>
        public string CustomerID { get; set; } = string.Empty;

        /// <summary>
        /// Primary contact information for the customer
        /// </summary>
        public CustomerContact CustomerContact { get; set; } = new();

        /// <summary>
        /// Type of customer (e.g., Enterprise, SMB, Individual)
        /// </summary>
        public CustomerType CustomerType { get; set; }

        /// <summary>
        /// Company or organization name
        /// </summary>
        public string? CompanyName { get; set; }

    /// <summary>
    /// Industry or business sector
    /// </summary>
    public string? Industry { get; set; }
} 