using Services;

namespace Repositories;

/// <summary>
/// Repository for managing predefined contract terms organized by category
/// </summary>
public class TermRepository
{
    private readonly List<Term> _predefinedTerms;

    public TermRepository()
    {
        _predefinedTerms = InitializePredefinedTerms();
    }

    /// <summary>
    /// Gets all potential terms that can be used in contracts
    /// </summary>
    /// <returns>List of all predefined terms</returns>
    public List<Term> GetPotentialTerms()
    {
        return _predefinedTerms.ToList();
    }

    /// <summary>
    /// Gets potential terms filtered by category
    /// </summary>
    /// <param name="category">The term category to filter by</param>
    /// <returns>List of terms for the specified category</returns>
    public List<Term> GetPotentialTermsByCategory(TermCategory category)
    {
        return _predefinedTerms.Where(t => t.Category == category).ToList();
    }

    /// <summary>
    /// Gets all available term categories that have predefined terms
    /// </summary>
    /// <returns>List of term categories</returns>
    public List<TermCategory> GetAvailableCategories()
    {
        return _predefinedTerms.Select(t => t.Category).Distinct().ToList();
    }

    /// <summary>
    /// Initializes the predefined terms for all categories
    /// </summary>
    /// <returns>List of predefined terms</returns>
    private List<Term> InitializePredefinedTerms()
    {
        return new List<Term>
        {
            // Financial Terms
            new Term
            {
                Id = new Guid("10000001-0001-0001-0001-000000000001"),
                Category = TermCategory.Financial,
                Text = "Payment shall be made within thirty (30) days of invoice date unless otherwise specified in writing."
            },
            new Term
            {
                Id = new Guid("10000001-0001-0001-0001-000000000002"),
                Category = TermCategory.Financial,
                Text = "Late payments shall incur a charge of 1.5% per month or the maximum rate permitted by law, whichever is less."
            },
            new Term
            {
                Id = new Guid("10000001-0001-0001-0001-000000000003"),
                Category = TermCategory.Financial,
                Text = "All expenses incurred in connection with this agreement shall be borne by the respective parties unless otherwise agreed in writing."
            },

            // Obligation Terms
            new Term
            {
                Id = new Guid("20000001-0002-0002-0002-000000000001"),
                Category = TermCategory.Obligation,
                Text = "Each party shall perform its obligations under this agreement in a professional and workmanlike manner."
            },
            new Term
            {
                Id = new Guid("20000001-0002-0002-0002-000000000002"),
                Category = TermCategory.Obligation,
                Text = "The parties shall cooperate in good faith to fulfill the purposes of this agreement."
            },
            new Term
            {
                Id = new Guid("20000001-0002-0002-0002-000000000003"),
                Category = TermCategory.Obligation,
                Text = "Each party shall comply with all applicable laws, regulations, and industry standards in performing under this agreement."
            },

            // Liability Terms
            new Term
            {
                Id = new Guid("30000001-0003-0003-0003-000000000001"),
                Category = TermCategory.Liability,
                Text = "In no event shall either party be liable for any indirect, incidental, special, consequential, or punitive damages."
            },
            new Term
            {
                Id = new Guid("30000001-0003-0003-0003-000000000002"),
                Category = TermCategory.Liability,
                Text = "Each party's total liability under this agreement shall not exceed the total amount paid or payable hereunder."
            },
            new Term
            {
                Id = new Guid("30000001-0003-0003-0003-000000000003"),
                Category = TermCategory.Liability,
                Text = "Each party shall indemnify and hold harmless the other party from claims arising from its breach of this agreement."
            },

            // Duration Terms
            new Term
            {
                Id = new Guid("40000001-0004-0004-0004-000000000001"),
                Category = TermCategory.Duration,
                Text = "This agreement shall commence on the effective date and continue for a period of one (1) year unless terminated earlier."
            },
            new Term
            {
                Id = new Guid("40000001-0004-0004-0004-000000000002"),
                Category = TermCategory.Duration,
                Text = "The term of this agreement may be extended by mutual written consent of the parties."
            },
            new Term
            {
                Id = new Guid("40000001-0004-0004-0004-000000000003"),
                Category = TermCategory.Duration,
                Text = "Time is of the essence in the performance of all obligations under this agreement."
            },

            // Termination Terms
            new Term
            {
                Id = new Guid("50000001-0005-0005-0005-000000000001"),
                Category = TermCategory.Termination,
                Text = "Either party may terminate this agreement with thirty (30) days written notice to the other party."
            },
            new Term
            {
                Id = new Guid("50000001-0005-0005-0005-000000000002"),
                Category = TermCategory.Termination,
                Text = "This agreement may be terminated immediately by either party upon material breach that remains uncured after thirty (30) days written notice."
            },
            new Term
            {
                Id = new Guid("50000001-0005-0005-0005-000000000003"),
                Category = TermCategory.Termination,
                Text = "Upon termination, all rights and obligations shall cease except those that by their nature survive termination."
            },

            // Confidentiality Terms
            new Term
            {
                Id = new Guid("60000001-0006-0006-0006-000000000001"),
                Category = TermCategory.Confidentiality,
                Text = "Each party acknowledges that it may receive confidential information and agrees to maintain such information in strict confidence."
            },
            new Term
            {
                Id = new Guid("60000001-0006-0006-0006-000000000002"),
                Category = TermCategory.Confidentiality,
                Text = "Confidential information shall not include information that is publicly available or independently developed without use of confidential information."
            },
            new Term
            {
                Id = new Guid("60000001-0006-0006-0006-000000000003"),
                Category = TermCategory.Confidentiality,
                Text = "The obligations of confidentiality shall survive termination of this agreement for a period of five (5) years."
            },

            // Non-Compete Terms
            new Term
            {
                Id = new Guid("70000001-0007-0007-0007-000000000001"),
                Category = TermCategory.NonCompete,
                Text = "During the term of this agreement and for twelve (12) months thereafter, neither party shall engage in competing business activities."
            },
            new Term
            {
                Id = new Guid("70000001-0007-0007-0007-000000000002"),
                Category = TermCategory.NonCompete,
                Text = "Non-compete restrictions shall be limited to the geographic area where services are provided under this agreement."
            },

            // Non-Solicitation Terms
            new Term
            {
                Id = new Guid("80000001-0008-0008-0008-000000000001"),
                Category = TermCategory.NonSolicitation,
                Text = "Neither party shall solicit or hire employees of the other party during the term of this agreement and for twelve (12) months thereafter."
            },
            new Term
            {
                Id = new Guid("80000001-0008-0008-0008-000000000002"),
                Category = TermCategory.NonSolicitation,
                Text = "Neither party shall solicit customers or clients of the other party for competing services during the restriction period."
            },

            // Non-Disclosure Terms
            new Term
            {
                Id = new Guid("90000001-0009-0009-0009-000000000001"),
                Category = TermCategory.NonDisclosure,
                Text = "Neither party shall disclose confidential information to any third party without prior written consent of the disclosing party."
            },
            new Term
            {
                Id = new Guid("90000001-0009-0009-0009-000000000002"),
                Category = TermCategory.NonDisclosure,
                Text = "Disclosure may be required by law or court order, provided the receiving party gives prompt notice to allow protective measures."
            },

            // Legal Terms
            new Term
            {
                Id = new Guid("A0000001-000A-000A-000A-000000000001"),
                Category = TermCategory.Legal,
                Text = "This agreement shall be governed by and construed in accordance with the laws of [Jurisdiction]."
            },
            new Term
            {
                Id = new Guid("A0000001-000A-000A-000A-000000000002"),
                Category = TermCategory.Legal,
                Text = "Any disputes arising under this agreement shall be resolved through binding arbitration in accordance with applicable rules."
            },
            new Term
            {
                Id = new Guid("A0000001-000A-000A-000A-000000000003"),
                Category = TermCategory.Legal,
                Text = "If any provision of this agreement is deemed invalid or unenforceable, the remainder shall remain in full force and effect."
            },

            // Renewal Terms
            new Term
            {
                Id = new Guid("B0000001-000B-000B-000B-000000000001"),
                Category = TermCategory.Renewal,
                Text = "This agreement shall automatically renew for successive one-year periods unless either party provides sixty (60) days written notice of non-renewal."
            },
            new Term
            {
                Id = new Guid("B0000001-000B-000B-000B-000000000002"),
                Category = TermCategory.Renewal,
                Text = "Upon renewal, the terms and conditions shall remain the same unless modified by mutual written agreement."
            },

            // General Terms
            new Term
            {
                Id = new Guid("C0000001-000C-000C-000C-000000000001"),
                Category = TermCategory.General,
                Text = "This agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements."
            },
            new Term
            {
                Id = new Guid("C0000001-000C-000C-000C-000000000002"),
                Category = TermCategory.General,
                Text = "No modification of this agreement shall be effective unless in writing and signed by both parties."
            },
            new Term
            {
                Id = new Guid("C0000001-000C-000C-000C-000000000003"),
                Category = TermCategory.General,
                Text = "The parties are independent contractors and nothing herein creates a partnership, joint venture, or agency relationship."
            },
            new Term
            {
                Id = new Guid("C0000001-000C-000C-000C-000000000004"),
                Category = TermCategory.General,
                Text = "All notices required hereunder shall be in writing and delivered by certified mail, email, or other agreed-upon method."
            },

            // Other Terms
            new Term
            {
                Id = new Guid("D0000001-000D-000D-000D-000000000001"),
                Category = TermCategory.Other,
                Text = "Force majeure events shall excuse performance delays caused by circumstances beyond a party's reasonable control."
            },
            new Term
            {
                Id = new Guid("D0000001-000D-000D-000D-000000000002"),
                Category = TermCategory.Other,
                Text = "This agreement may be executed in counterparts, each of which shall be deemed an original and all of which shall constitute one agreement."
            }
        };
    }
}