using PowerOfAttorneyAgent.Model;

namespace PowerOfAttorneyAgent.Repositories;

/// <summary>
/// Repository class for managing user profile data including Principal, Acquaintances, and Assets
/// </summary>
public class UserProfileRepository
{
    /// <summary>
    /// Gets the Principal information - always returns the same profile
    /// </summary>
    /// <returns>Principal information</returns>
    public Principal GetPrincipal(Guid userId)
    {
        return new Principal
        {
            UserId = userId,
            FullName = "Kari Nordmann",
            NationalId = "01417012345",
            Address = "Parkveien 1, 0350 Oslo"
        };
    }

    /// <summary>
    /// Gets all acquaintances - always returns the same list
    /// </summary>
    /// <returns>List of acquaintances</returns>
    public List<Acquaintance> GetAcquaintances(Guid userId)
    {
        return new List<Acquaintance>
        {
            new Acquaintance
            {
                AcquaintanceId = new Guid("11111111-1111-1111-1111-111111111111"),
                FullName = "Hans Hansen",
                NationalIdNumber = "01017012345",
                Relationship = "Sønn",
                ContactNumber = "+47 900 12 345",
                Email = "hans.hansen@email.no",
                Address = "Storgata 15, 0155 Oslo"
            },
            new Acquaintance
            {
                AcquaintanceId = new Guid("22222222-2222-2222-2222-222222222222"),
                FullName = "Frida Hansen",
                NationalIdNumber = "01017012346",
                Relationship = "Datter",
                ContactNumber = "+47 900 54 321",
                Email = "frida.hansen@email.no",
                Address = "Bjørnsletta 8, 1414 Trollåsen"
            },
            new Acquaintance
            {
                AcquaintanceId = new Guid("33333333-3333-3333-3333-333333333333"),
                FullName = "Nora Hansen",
                NationalIdNumber = "01017012347",
                Relationship = "Backup Fullmektig",
                ContactNumber = "+47 900 80 555",
                Email = "nora.hansen@email.no",
                Address = "Kirkegata 22, 0153 Oslo"
            },
            new Acquaintance
            {
                AcquaintanceId = new Guid("44444444-4444-4444-4444-444444444444"),
                FullName = "Ola Nordmann",
                NationalIdNumber = "01017012348",
                Relationship = "Nabo",
                ContactNumber = "+47 900 99 888",
                Email = "ola.nordmann@email.no",
                Address = "Parkveien 3, 0350 Oslo"
            }
        };
    }

    /// <summary>
    /// Gets all assets - always returns the same list
    /// </summary>
    /// <returns>List of assets</returns>
    public List<Asset> GetAssets(Guid userId)
    {
        return new List<Asset>
        {
            new Asset
            {
                Id = new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Name = "Hovedbolig",
                Type = "Eiendom",
                Description = "Familiens hovedbolig med 4 soverom og hage",
                Value = 6000000.00m,
                Location = "Parkveien 1, 0350 Oslo",
                AcquisitionDate = DateTime.Parse("2010-06-15")
            },
            new Asset
            {
                Id = new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                Name = "Hytte",
                Type = "Eiendom",
                Description = "Sommerhytte ved sjøen",
                Value = 2500000.00m,
                Location = "Sommerveien 2, 1440 Drøbak",
                AcquisitionDate = DateTime.Parse("2005-08-20")
            },
            new Asset
            {
                Id = new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                Name = "Aksjeportefølje",
                Type = "Verdipapirer",
                Description = "Diversifisert aksjeportefølje hos DNB",
                Value = 1250000.00m,
                Location = "DNB Markets",
                AcquisitionDate = DateTime.Parse("2018-03-20")
            },
            new Asset
            {
                Id = new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Name = "2021 Tesla Model S",
                Type = "Kjøretøy",
                Description = "Elektrisk bil for daglig bruk",
                Value = 650000.00m,
                Location = "Hjemme garasje, Parkveien 1",
                AcquisitionDate = DateTime.Parse("2021-08-10")
            },
            new Asset
            {
                Id = new Guid("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                Name = "BSU-konto",
                Type = "Bankkonto",
                Description = "Boligsparing for ungdom - tiltenkt barnebarn",
                Value = 300000.00m,
                Location = "Sparebank 1",
                AcquisitionDate = DateTime.Parse("2019-01-15")
            }
        };
    }

} 