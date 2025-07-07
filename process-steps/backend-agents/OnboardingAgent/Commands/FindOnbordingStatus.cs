using OnboardingAgent.Model;
using OnboardingAgent.Model.Core;
using OnboardingAgent.Model.Integrations;
using OnboardingAgent.Model.Customizations;

namespace OnboardingAgent.Commands;

public class FindOnbordingStatus
{
    public async Task<CustomerOnboarding> Run(Guid customerId)
    {
        await Task.CompletedTask;
        // Create a single dummy customer onboarding instance
        var onboardingInstance = new CustomerOnboarding
        {
            Id = customerId,
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow.AddDays(-1),
            Status = OnboardingStatus.InProgress,
            Notes = "Customer setup in progress, waiting for ERP integration",
            
            // General Information
            General = new GeneralInformation
            {
                CustomerID = "CUST-2024-001",
                CustomerContact = new CustomerContact
                {
                    FullName = "John Smith",
                    Email = "john.smith@acmecorp.com",
                    Phone = "+1-555-123-4567",
                    JobTitle = "IT Director",
                    Department = "Information Technology"
                },
                CustomerType = CustomerType.Enterprise,
                CompanyName = "Acme Corporation",
                Industry = "Manufacturing"
            },
            
            // Integration Configuration
            Integrations = new IntegrationConfiguration
            {
                ERPSystem = new ERPSystemIntegration
                {
                    SystemType = ERPSystemType.SAP,
                    Version = "S/4HANA 2021",
                    ConnectionString = "Server=erp.acmecorp.com;Database=SAPDB;",
                    IsEnabled = true,
                    ConfigurationSettings = new Dictionary<string, string>
                    {
                        { "SyncInterval", "300" },
                        { "EnableRealTimeSync", "true" },
                        { "MaxRetries", "3" }
                    }
                },
                Office = new OfficeIntegration
                {
                    OfficeType = OfficeType.Microsoft365,
                    IsEnabled = true,
                    TenantId = "acmecorp.onmicrosoft.com",
                    EnabledApplications = new List<OfficeApplication>
                    {
                        OfficeApplication.Excel,
                        OfficeApplication.Teams,
                        OfficeApplication.Outlook
                    }
                }
            },
            
            // Product Customizations
            ProductCustomizations = new ProductCustomizations
            {
                Currency = new Currency
                {
                    Code = "USD",
                    Symbol = "$",
                    DisplayName = "US Dollar",
                    DecimalPlaces = 2
                },
                Language = new Language
                {
                    Code = "en-US",
                    DisplayName = "English (United States)",
                    IsRightToLeft = false
                },
                EnabledModules = new List<EnabledModule>
                {
                    new EnabledModule { ModuleId = "INV", ModuleName = "Inventory", IsEnabled = true },
                    new EnabledModule { ModuleId = "RPT", ModuleName = "Reporting", IsEnabled = true },
                    new EnabledModule { ModuleId = "ANA", ModuleName = "Analytics", IsEnabled = false }
                }
            }
        };

        return onboardingInstance;
    }
}