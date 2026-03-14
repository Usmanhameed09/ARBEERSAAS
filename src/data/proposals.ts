export type SectionStatus = "ai_complete" | "ai_draft" | "human_required" | "missing_doc" | "not_started";

export interface ComplianceItem {
  id: string;
  requirement: string;
  sectionRef: string;
  status: "met" | "partial" | "not_met" | "needs_review";
  notes: string;
}

export interface ProposalSection {
  id: string;
  number: string;
  title: string;
  status: SectionStatus;
  pageLimit?: number;
  currentPages?: number;
  scoringWeight?: number;
  aiDraftingPrompt?: string;
  humanAction?: string;
  complianceIds: string[];
  content?: string;
}

export interface ProposalVolume {
  id: string;
  number: string;
  title: string;
  sections: ProposalSection[];
}

export interface ProposalDraft {
  id: string;
  opportunityId: string;
  title: string;
  agency: string;
  noticeId: string;
  dueDate: string;
  status: "In Progress" | "Ready for Review" | "Submitted" | "Draft";
  overallProgress: number;
  volumes: ProposalVolume[];
  complianceMatrix: ComplianceItem[];
  extractedRequirements: {
    sectionL: string[];
    sectionM: string[];
    pageLimits: { volume: string; limit: number }[];
    formattingRules: string[];
    requiredForms: { name: string; status: "attached" | "missing" | "in_progress" }[];
    mandatoryReps: { name: string; status: "complete" | "incomplete" }[];
  };
  createdAt: string;
  lastModified: string;
}

export const proposalDrafts: ProposalDraft[] = [
  {
    id: "prop1",
    opportunityId: "1",
    title: "Construction Manager As Constructor - New LPOE, Coburn Gore, Maine",
    agency: "General Services Administration",
    noticeId: "W912DY-24-R-0045",
    dueDate: "2024-08-15",
    status: "Ready for Review",
    overallProgress: 85,
    volumes: [
      {
        id: "v1-1",
        number: "I",
        title: "Technical Proposal",
        sections: [
          {
            id: "s1-1-1",
            number: "1.1",
            title: "Understanding of Requirements",
            status: "ai_complete",
            pageLimit: 5,
            currentPages: 4,
            scoringWeight: 15,
            aiDraftingPrompt: "This section is worth 15% of the technical score. Demonstrate deep understanding of LPOE construction scope, CBP operational needs, and border station modernization requirements. Reference Coburn Gore site-specific conditions.",
            complianceIds: ["cm1", "cm2"],
            content: "Our team brings extensive experience in federal Land Port of Entry construction, having successfully completed similar projects for GSA and CBP. We understand the unique requirements of the Coburn Gore site, including its remote location in Franklin County, Maine, and the need to maintain border operations during construction...",
          },
          {
            id: "s1-1-2",
            number: "1.2",
            title: "Technical Methodology",
            status: "ai_complete",
            pageLimit: 8,
            currentPages: 7,
            scoringWeight: 20,
            aiDraftingPrompt: "Highest weighted section at 20%. Detail phased construction approach, risk mitigation strategies, and how CMc/CMr delivery method will be executed. Include specific scheduling methodology.",
            complianceIds: ["cm3", "cm4"],
            content: "Our CMc methodology employs a phased approach ensuring uninterrupted border operations throughout construction. Phase 1 focuses on site preparation and temporary facilities, Phase 2 on main port building construction, and Phase 3 on ancillary structures and infrastructure...",
          },
          {
            id: "s1-1-3",
            number: "1.3",
            title: "Staffing Plan",
            status: "human_required",
            pageLimit: 4,
            currentPages: 2,
            scoringWeight: 10,
            aiDraftingPrompt: "Detail key personnel qualifications and organizational chart. Emphasize staff retention and surge capability.",
            humanAction: "Upload resumes for Project Manager, Site Superintendent, and Quality Control Manager. Verify current certifications and clearance status.",
            complianceIds: ["cm5"],
            content: "Key personnel positions have been identified per RFP requirements. [AWAITING RESUME UPLOADS]...",
          },
          {
            id: "s1-1-4",
            number: "2.0",
            title: "Management Plan",
            status: "ai_draft",
            pageLimit: 6,
            currentPages: 5,
            scoringWeight: 15,
            aiDraftingPrompt: "Detail project management framework, communication protocols, reporting structure, and subcontractor management approach. Reference PMI standards.",
            complianceIds: ["cm6", "cm7"],
            content: "Our management approach utilizes an integrated project delivery framework with weekly progress reporting, bi-weekly government coordination meetings, and real-time schedule and cost visibility through Procore...",
          },
          {
            id: "s1-1-5",
            number: "3.0",
            title: "Quality Control Plan",
            status: "ai_complete",
            pageLimit: 4,
            currentPages: 4,
            scoringWeight: 10,
            aiDraftingPrompt: "Must include three-phase inspection system per USACE standards. Reference FAR 52.246-12.",
            complianceIds: ["cm8"],
            content: "Our Quality Control Plan implements the USACE Three-Phase Control System: Preparatory Phase, Initial Phase, and Follow-up Phase for each definable feature of work. A dedicated QC Manager will maintain daily logs...",
          },
        ],
      },
      {
        id: "v1-2",
        number: "II",
        title: "Past Performance",
        sections: [
          {
            id: "s1-2-1",
            number: "1.0",
            title: "Relevant Contract #1 - NAVFAC Mid-Atlantic Facility Maintenance",
            status: "ai_complete",
            scoringWeight: 10,
            complianceIds: ["cm9"],
            content: "Contract: N62470-20-C-0045 | Value: $28.5M | Period: 2020-2024 | Agency: NAVFAC | Relevance: Large-scale federal facility construction and maintenance at Naval Station Norfolk...",
          },
          {
            id: "s1-2-2",
            number: "2.0",
            title: "Relevant Contract #2 - GSA Federal Building Renovation",
            status: "ai_complete",
            scoringWeight: 10,
            complianceIds: ["cm9"],
            content: "Contract: GS-07P-16-HU-C-0034 | Value: $15.2M | Period: 2022-2024 | Agency: GSA PBS | Relevance: CMc delivery on active federal facility with phased occupancy requirements...",
          },
          {
            id: "s1-2-3",
            number: "3.0",
            title: "Relevant Contract #3",
            status: "human_required",
            scoringWeight: 10,
            humanAction: "Select and provide details for a third relevant past performance reference. Must include CPARS rating. Minimum 3 references required by Section L.",
            complianceIds: ["cm9", "cm10"],
          },
          {
            id: "s1-2-4",
            number: "4.0",
            title: "CPARS Summary",
            status: "missing_doc",
            humanAction: "Export and attach CPARS reports for all referenced contracts. Required per Section L.4.2.",
            complianceIds: ["cm10"],
          },
        ],
      },
      {
        id: "v1-3",
        number: "III",
        title: "Price Proposal",
        sections: [
          {
            id: "s1-3-1",
            number: "1.0",
            title: "Pricing Table (CLIN Structure)",
            status: "human_required",
            humanAction: "Complete CLIN pricing table with labor rates, material costs, and subcontractor quotes. Must follow format in Attachment J. Subcontractor pricing from outreach pipeline needed.",
            complianceIds: ["cm11", "cm12"],
          },
          {
            id: "s1-3-2",
            number: "2.0",
            title: "Breakdown per CLIN",
            status: "not_started",
            humanAction: "Provide cost breakdowns for each CLIN item. Requires finalized subcontractor pricing and material quotes.",
            complianceIds: ["cm12"],
          },
          {
            id: "s1-3-3",
            number: "3.0",
            title: "Basis of Estimate",
            status: "ai_draft",
            aiDraftingPrompt: "Document assumptions and methodology behind pricing. Reference wage determinations and material cost indexes.",
            complianceIds: ["cm13"],
            content: "Pricing is based on current Davis-Bacon wage determinations for Franklin County, Maine (WD 2024-0087). Material costs reflect RS Means 2024 national average with 8% regional adjustment factor...",
          },
        ],
      },
      {
        id: "v1-4",
        number: "IV",
        title: "Administrative",
        sections: [
          {
            id: "s1-4-1",
            number: "1.0",
            title: "Representations & Certifications",
            status: "ai_complete",
            complianceIds: ["cm14"],
            content: "All required representations and certifications per FAR 52.204-8 have been completed in SAM.gov. Annual representations are current as of July 2024...",
          },
          {
            id: "s1-4-2",
            number: "2.0",
            title: "Insurance Documentation",
            status: "missing_doc",
            humanAction: "Upload current Certificate of Insurance showing: General Liability ($2M), Workers' Comp (statutory), Auto Liability ($1M), and Builder's Risk per Section H.12.",
            complianceIds: ["cm15"],
          },
          {
            id: "s1-4-3",
            number: "3.0",
            title: "Required Certifications",
            status: "human_required",
            humanAction: "Attach copies of: Small Business Certification, bonding capacity letter ($50M minimum), and state contractor license for Maine.",
            complianceIds: ["cm16", "cm17"],
          },
          {
            id: "s1-4-4",
            number: "4.0",
            title: "Required Forms (SF-33, SF-30, etc.)",
            status: "ai_complete",
            complianceIds: ["cm18"],
            content: "Standard Forms SF-33 (Solicitation, Offer and Award) and SF-30 (Amendment of Solicitation) have been pre-populated with company information...",
          },
        ],
      },
    ],
    complianceMatrix: [
      { id: "cm1", requirement: "Demonstrate understanding of LPOE construction requirements", sectionRef: "L.4.1.a", status: "met", notes: "Addressed in Section 1.1" },
      { id: "cm2", requirement: "Reference site-specific conditions and constraints", sectionRef: "L.4.1.b", status: "met", notes: "Coburn Gore specifics included" },
      { id: "cm3", requirement: "Detailed phased construction approach", sectionRef: "L.4.1.c", status: "met", notes: "Three-phase plan documented" },
      { id: "cm4", requirement: "Risk mitigation strategy", sectionRef: "L.4.1.d", status: "met", notes: "Risk register with mitigations" },
      { id: "cm5", requirement: "Key personnel resumes and qualifications", sectionRef: "L.4.1.e", status: "partial", notes: "Resumes pending upload" },
      { id: "cm6", requirement: "Project management framework", sectionRef: "L.4.2.a", status: "met", notes: "PMI-based framework detailed" },
      { id: "cm7", requirement: "Subcontractor management approach", sectionRef: "L.4.2.b", status: "needs_review", notes: "AI draft needs human review" },
      { id: "cm8", requirement: "Three-phase QC inspection system", sectionRef: "L.4.3", status: "met", notes: "USACE standard implemented" },
      { id: "cm9", requirement: "Minimum 3 relevant past performance references", sectionRef: "L.5.1", status: "partial", notes: "2 of 3 provided" },
      { id: "cm10", requirement: "CPARS documentation for referenced contracts", sectionRef: "L.5.2", status: "not_met", notes: "CPARS reports not yet attached" },
      { id: "cm11", requirement: "CLIN pricing per Attachment J format", sectionRef: "L.6.1", status: "not_met", notes: "Pricing table incomplete" },
      { id: "cm12", requirement: "Cost breakdown per CLIN item", sectionRef: "L.6.2", status: "not_met", notes: "Awaiting sub quotes" },
      { id: "cm13", requirement: "Basis of estimate documentation", sectionRef: "L.6.3", status: "needs_review", notes: "AI draft ready for review" },
      { id: "cm14", requirement: "Current SAM.gov representations", sectionRef: "L.7.1", status: "met", notes: "SAM.gov current" },
      { id: "cm15", requirement: "Certificate of Insurance per Section H.12", sectionRef: "L.7.2", status: "not_met", notes: "Insurance docs not uploaded" },
      { id: "cm16", requirement: "Small business certification", sectionRef: "L.7.3", status: "not_met", notes: "Cert not attached" },
      { id: "cm17", requirement: "Bonding capacity letter ($50M minimum)", sectionRef: "L.7.4", status: "not_met", notes: "Bonding letter pending" },
      { id: "cm18", requirement: "Completed SF-33 and SF-30 forms", sectionRef: "L.7.5", status: "met", notes: "Pre-populated and ready" },
    ],
    extractedRequirements: {
      sectionL: [
        "L.4.1 - Technical Capability: Demonstrate understanding, methodology, staffing",
        "L.4.2 - Management: Project management framework and subcontractor oversight",
        "L.4.3 - Quality Control: Three-phase inspection per USACE standards",
        "L.5 - Past Performance: Minimum 3 relevant contracts with CPARS",
        "L.6 - Pricing: CLIN structure per Attachment J with cost breakdown",
        "L.7 - Administrative: Reps/certs, insurance, forms",
      ],
      sectionM: [
        "M.1 - Technical Capability (40% weight) - Evaluated on understanding, methodology, staffing qualifications",
        "M.2 - Management Approach (15% weight) - PM framework, communication, sub management",
        "M.3 - Quality Control (10% weight) - Three-phase system, corrective action procedures",
        "M.4 - Past Performance (25% weight) - Relevance, recency, quality ratings",
        "M.5 - Price (10% weight) - Evaluated for reasonableness; not lowest price technically acceptable",
      ],
      pageLimits: [
        { volume: "Volume I - Technical", limit: 30 },
        { volume: "Volume II - Past Performance", limit: 15 },
        { volume: "Volume III - Price", limit: 10 },
        { volume: "Volume IV - Administrative", limit: 0 },
      ],
      formattingRules: [
        "12-point Times New Roman font",
        "1-inch margins on all sides",
        "Single-spaced with double-space between paragraphs",
        "Sequential page numbering per volume",
        "Table of Contents required for each volume",
        "Headers must include solicitation number and offeror name",
      ],
      requiredForms: [
        { name: "SF-33 (Solicitation, Offer & Award)", status: "attached" },
        { name: "SF-30 (Amendment of Solicitation)", status: "attached" },
        { name: "Attachment J - CLIN Pricing Template", status: "in_progress" },
        { name: "Past Performance Questionnaire", status: "missing" },
        { name: "Wage Determination Acknowledgment", status: "attached" },
        { name: "Subcontracting Plan (FAR 52.219-9)", status: "in_progress" },
      ],
      mandatoryReps: [
        { name: "FAR 52.204-8 Annual Reps & Certs", status: "complete" },
        { name: "FAR 52.209-7 Information Regarding Responsibility", status: "complete" },
        { name: "FAR 52.219-1 Small Business Program Representations", status: "complete" },
        { name: "FAR 52.222-22 Previous Contracts & Compliance", status: "incomplete" },
        { name: "FAR 52.225-25 Prohibition on Contracting (Kaspersky)", status: "complete" },
      ],
    },
    createdAt: "2024-08-01",
    lastModified: "2024-08-13",
  },
  {
    id: "prop2",
    opportunityId: "2",
    title: "Enterprise IT Support Services - Air Force Research Laboratory",
    agency: "US Air Force",
    noticeId: "FA8532-24-R-0012",
    dueDate: "2024-09-01",
    status: "In Progress",
    overallProgress: 52,
    volumes: [
      {
        id: "v2-1",
        number: "I",
        title: "Technical Proposal",
        sections: [
          { id: "s2-1-1", number: "1.1", title: "Understanding of Requirements", status: "ai_complete", pageLimit: 6, currentPages: 5, scoringWeight: 15, complianceIds: ["cm2-1"], aiDraftingPrompt: "Emphasize understanding of AFRL multi-site IT environment and mission-critical research support needs." },
          { id: "s2-1-2", number: "1.2", title: "Technical Methodology", status: "ai_draft", pageLimit: 10, currentPages: 6, scoringWeight: 25, complianceIds: ["cm2-2"], aiDraftingPrompt: "Highest weighted section at 25%. Detail tiered support model, NOC operations, and cybersecurity framework." },
          { id: "s2-1-3", number: "1.3", title: "Staffing Plan", status: "human_required", pageLimit: 5, currentPages: 1, scoringWeight: 10, complianceIds: ["cm2-3"], humanAction: "Provide key personnel resumes. All staff must hold active Secret clearance minimum." },
          { id: "s2-1-4", number: "2.0", title: "Transition Plan", status: "not_started", pageLimit: 4, scoringWeight: 10, complianceIds: ["cm2-4"], aiDraftingPrompt: "Detail 90-day transition plan from incumbent contractor. Emphasize zero disruption to research operations." },
          { id: "s2-1-5", number: "3.0", title: "Cybersecurity Approach", status: "ai_draft", pageLimit: 5, currentPages: 3, scoringWeight: 10, complianceIds: ["cm2-5"], aiDraftingPrompt: "Must address NIST 800-171 compliance and CMMC Level 2 requirements for CUI handling." },
        ],
      },
      {
        id: "v2-2",
        number: "II",
        title: "Past Performance",
        sections: [
          { id: "s2-2-1", number: "1.0", title: "Relevant Contract #1 - DHS IT Support", status: "ai_complete", complianceIds: ["cm2-6"] },
          { id: "s2-2-2", number: "2.0", title: "Relevant Contract #2", status: "not_started", complianceIds: ["cm2-6"], humanAction: "Select second past performance reference relevant to DoD IT support." },
          { id: "s2-2-3", number: "3.0", title: "Relevant Contract #3", status: "not_started", complianceIds: ["cm2-6"], humanAction: "Select third past performance reference." },
        ],
      },
      {
        id: "v2-3",
        number: "III",
        title: "Price Proposal",
        sections: [
          { id: "s2-3-1", number: "1.0", title: "Labor Rate Table", status: "human_required", complianceIds: ["cm2-7"], humanAction: "Complete labor rates for all 15 labor categories per CDRL format." },
          { id: "s2-3-2", number: "2.0", title: "ODC Estimates", status: "not_started", complianceIds: ["cm2-8"], humanAction: "Estimate other direct costs including equipment, software licenses, and travel." },
        ],
      },
      {
        id: "v2-4",
        number: "IV",
        title: "Administrative",
        sections: [
          { id: "s2-4-1", number: "1.0", title: "Representations & Certifications", status: "ai_complete", complianceIds: ["cm2-9"] },
          { id: "s2-4-2", number: "2.0", title: "Facility Clearance Documentation", status: "missing_doc", complianceIds: ["cm2-10"], humanAction: "Upload DD Form 254 and facility clearance verification letter." },
          { id: "s2-4-3", number: "3.0", title: "Insurance & Certifications", status: "missing_doc", complianceIds: ["cm2-11"], humanAction: "Upload Certificate of Insurance and ISO 20000-1 certification." },
        ],
      },
    ],
    complianceMatrix: [
      { id: "cm2-1", requirement: "Understanding of multi-site IT support", sectionRef: "L.3.1", status: "met", notes: "Addressed in 1.1" },
      { id: "cm2-2", requirement: "Tiered support methodology", sectionRef: "L.3.2", status: "needs_review", notes: "AI draft needs refinement" },
      { id: "cm2-3", requirement: "Key personnel with Secret clearance", sectionRef: "L.3.3", status: "partial", notes: "Resumes pending" },
      { id: "cm2-4", requirement: "90-day transition plan", sectionRef: "L.3.4", status: "not_met", notes: "Not started" },
      { id: "cm2-5", requirement: "NIST 800-171 / CMMC compliance", sectionRef: "L.3.5", status: "needs_review", notes: "Draft in review" },
      { id: "cm2-6", requirement: "3 relevant past performance references", sectionRef: "L.4.1", status: "partial", notes: "1 of 3 complete" },
      { id: "cm2-7", requirement: "Labor rates per CDRL format", sectionRef: "L.5.1", status: "not_met", notes: "Pricing not started" },
      { id: "cm2-8", requirement: "ODC estimates", sectionRef: "L.5.2", status: "not_met", notes: "Not started" },
      { id: "cm2-9", requirement: "SAM.gov reps current", sectionRef: "L.6.1", status: "met", notes: "Verified" },
      { id: "cm2-10", requirement: "Facility clearance verification", sectionRef: "L.6.2", status: "not_met", notes: "DD-254 not uploaded" },
      { id: "cm2-11", requirement: "Insurance and ISO certification", sectionRef: "L.6.3", status: "not_met", notes: "Docs missing" },
    ],
    extractedRequirements: {
      sectionL: [
        "L.3.1 - Technical understanding of AFRL multi-site environment",
        "L.3.2 - Tiered support model (Tier 1-3) with SLA definitions",
        "L.3.3 - Key personnel with active Secret clearance",
        "L.3.4 - 90-day transition plan from incumbent",
        "L.3.5 - Cybersecurity framework compliance",
        "L.4 - Past performance (minimum 3 contracts, $10M+ each)",
        "L.5 - Price proposal with labor rates and ODCs",
      ],
      sectionM: [
        "M.1 - Technical Approach (50%) - Understanding, methodology, staffing, transition",
        "M.2 - Past Performance (30%) - Relevance, recency, CPARS ratings",
        "M.3 - Price (20%) - Best value tradeoff",
      ],
      pageLimits: [
        { volume: "Volume I - Technical", limit: 35 },
        { volume: "Volume II - Past Performance", limit: 20 },
        { volume: "Volume III - Price", limit: 15 },
        { volume: "Volume IV - Administrative", limit: 0 },
      ],
      formattingRules: [
        "11-point Arial font",
        "1-inch margins",
        "1.15 line spacing",
        "Sequential page numbering",
      ],
      requiredForms: [
        { name: "SF-33", status: "attached" },
        { name: "DD Form 254", status: "missing" },
        { name: "CDRL Labor Rate Template", status: "in_progress" },
      ],
      mandatoryReps: [
        { name: "FAR 52.204-8 Annual Reps", status: "complete" },
        { name: "DFARS 252.204-7012 Safeguarding CUI", status: "incomplete" },
        { name: "FAR 52.219-1 Small Business Reps", status: "complete" },
      ],
    },
    createdAt: "2024-07-25",
    lastModified: "2024-08-10",
  },
  {
    id: "prop3",
    opportunityId: "6",
    title: "Cloud Migration and Modernization Services - CDC",
    agency: "Centers for Disease Control and Prevention",
    noticeId: "75D30124R00034",
    dueDate: "2024-10-01",
    status: "Draft",
    overallProgress: 25,
    volumes: [
      {
        id: "v3-1",
        number: "I",
        title: "Technical Proposal",
        sections: [
          { id: "s3-1-1", number: "1.1", title: "Understanding of Requirements", status: "ai_draft", pageLimit: 8, currentPages: 4, scoringWeight: 15, complianceIds: [], aiDraftingPrompt: "Demonstrate understanding of CDC's public health mission and legacy system modernization challenges." },
          { id: "s3-1-2", number: "1.2", title: "Cloud Migration Methodology", status: "ai_draft", pageLimit: 12, currentPages: 5, scoringWeight: 25, complianceIds: [], aiDraftingPrompt: "This section is worth 25%. Detail 6R migration strategy (Rehost, Replatform, Refactor, Repurchase, Retire, Retain) for 23 applications." },
          { id: "s3-1-3", number: "1.3", title: "Staffing Plan", status: "not_started", complianceIds: [], humanAction: "Identify key personnel for cloud architect, DevOps lead, and data migration specialist roles." },
          { id: "s3-1-4", number: "2.0", title: "Security & Compliance (FedRAMP/HIPAA)", status: "not_started", complianceIds: [], aiDraftingPrompt: "Critical section. Must address FedRAMP High and HIPAA compliance for public health data." },
        ],
      },
      {
        id: "v3-2",
        number: "II",
        title: "Past Performance",
        sections: [
          { id: "s3-2-1", number: "1.0", title: "Relevant Contracts", status: "not_started", complianceIds: [], humanAction: "Select 3 relevant cloud migration past performance references." },
        ],
      },
      {
        id: "v3-3",
        number: "III",
        title: "Price Proposal",
        sections: [
          { id: "s3-3-1", number: "1.0", title: "Pricing Structure", status: "not_started", complianceIds: [], humanAction: "Develop pricing for 5-year IDIQ structure with T&M and FFP task order types." },
        ],
      },
      {
        id: "v3-4",
        number: "IV",
        title: "Administrative",
        sections: [
          { id: "s3-4-1", number: "1.0", title: "Representations & Certifications", status: "ai_complete", complianceIds: [] },
          { id: "s3-4-2", number: "2.0", title: "AWS GovCloud Partnership Documentation", status: "missing_doc", complianceIds: [], humanAction: "Upload AWS Partner Network certification and GovCloud authorization letter." },
        ],
      },
    ],
    complianceMatrix: [
      { id: "cm3-1", requirement: "Cloud migration methodology for 23 applications", sectionRef: "L.3.1", status: "needs_review", notes: "AI draft in progress" },
      { id: "cm3-2", requirement: "FedRAMP High compliance plan", sectionRef: "L.3.2", status: "not_met", notes: "Section not started" },
      { id: "cm3-3", requirement: "HIPAA compliance for PHI", sectionRef: "L.3.3", status: "not_met", notes: "Section not started" },
      { id: "cm3-4", requirement: "3 relevant past performance references", sectionRef: "L.4.1", status: "not_met", notes: "Not started" },
      { id: "cm3-5", requirement: "AWS GovCloud deployment capability", sectionRef: "L.3.4", status: "not_met", notes: "Docs pending" },
    ],
    extractedRequirements: {
      sectionL: [
        "L.3.1 - Cloud migration approach for 23 legacy applications",
        "L.3.2 - FedRAMP High authorization strategy",
        "L.3.3 - HIPAA and 21 CFR Part 11 compliance",
        "L.4 - Past performance (3 contracts, cloud migration focus)",
        "L.5 - IDIQ pricing with T&M and FFP CLINs",
      ],
      sectionM: [
        "M.1 - Technical Approach (45%) - Migration methodology, security, staffing",
        "M.2 - Past Performance (35%) - Cloud migration relevance and quality",
        "M.3 - Price (20%) - Reasonableness and realism",
      ],
      pageLimits: [
        { volume: "Volume I - Technical", limit: 40 },
        { volume: "Volume II - Past Performance", limit: 20 },
        { volume: "Volume III - Price", limit: 15 },
        { volume: "Volume IV - Administrative", limit: 0 },
      ],
      formattingRules: [
        "12-point Calibri font",
        "1-inch margins",
        "Single-spaced",
        "Bookmarked PDF submission",
      ],
      requiredForms: [
        { name: "SF-33", status: "attached" },
        { name: "Application Inventory Template", status: "missing" },
        { name: "Cloud Readiness Assessment Form", status: "missing" },
      ],
      mandatoryReps: [
        { name: "FAR 52.204-8 Annual Reps", status: "complete" },
        { name: "HHS-specific Reps", status: "incomplete" },
      ],
    },
    createdAt: "2024-08-06",
    lastModified: "2024-08-08",
  },
];
