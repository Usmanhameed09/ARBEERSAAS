export interface PricingPrediction {
  predictedBid: number;
  lowBid: number;
  highBid: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  strategy: string;
}

export interface IncumbentContractor {
  awardId: string;
  contractorName: string;
  awardAmount: number;
  baseAndAllOptions?: number;
  totalObligation?: number;
  startDate: string;
  endDate: string;
  potentialEndDate?: string;
  description: string;
  contractPricingType?: string;
  numberOfOffers?: string;
  extentCompeted?: string;
  setAsideType?: string;
  productServiceDescription?: string;
  subAgency?: string;
  office?: string;
}

export interface Opportunity {
  id: string;
  noticeId: string;
  title: string;
  summary: string;
  fullDescription: string;
  agency: string;
  type: string;
  naicsCode: string;
  postedDate: string;
  dueDate: string;
  status: "Go" | "No-Go";
  aiReason: string;
  complianceScore?: number;
  setAside: string;
  placeOfPerformance: string;
  pointOfContact: {
    name: string;
    email: string;
    phone: string;
  };
  allPocs?: {
    type: string;
    fullName: string;
    title: string;
    email: string;
    phone: string;
    fax: string;
  }[];
  attachments: {
    name: string;
    size: string;
    type: string;
    url?: string;
    source?: string;
    pieeUrl?: string;
  }[];
  externalLinks?: {
    title: string;
    url: string;
    type: string;
  }[];
  isNew?: boolean;
  pricingPrediction?: PricingPrediction;
  incumbent?: IncumbentContractor;
  bidKillers?: {
    ruleCode: string;
    ruleName: string;
    severity: string;
  }[];
  bidType?: "RFP" | "RFQ" | "RFI" | "RFO" | "Sources Sought" | "Special Notice" | null;
}

export const NAICS_CODES = [
  { code: "455219", label: "All Other General Merchandise Retailers" },
  { code: "115112", label: "Soil Preparation, Planting, And Cultivating" },
  { code: "221114", label: "Solar Electric Power Generation" },
  { code: "238160", label: "Roofing Contractors" },
  { code: "238210", label: "Electrical Contractors And Other Wiring Installation Contractors" },
  { code: "238990", label: "All Other Specialty Trade Contractors" },
  { code: "314110", label: "Carpet And Rug Mills" },
  { code: "336120", label: "Heavy Duty Truck Manufacturing" },
  { code: "336611", label: "Ship Building And Repairing" },
  { code: "339920", label: "Sporting And Athletic Goods Manufacturing" },
  { code: "339950", label: "Sign Manufacturing" },
  { code: "339999", label: "All Other Miscellaneous Manufacturing" },
  { code: "484121", label: "General Freight Trucking, Long-Distance, Truckload" },
  { code: "541191", label: "Title Abstract And Settlement Offices" },
  { code: "561210", label: "Facilities Support Services" },
  { code: "561612", label: "Security Guards And Patrol Services" },
  { code: "561710", label: "Exterminating And Pest Control Services" },
  { code: "561720", label: "Janitorial Services" },
  { code: "561730", label: "Landscaping Services" },
  { code: "562111", label: "Solid Waste Collection" },
  { code: "562219", label: "Other Nonhazardous Waste Treatment And Disposal" },
  { code: "562910", label: "Remediation Services" },
  { code: "562991", label: "Septic Tank And Related Services" },
  { code: "721211", label: "RV (Recreational Vehicle) Parks And Campgrounds" },
  { code: "722320", label: "Caterers" },
  { code: "812320", label: "Drycleaning And Laundry Services (Except Coin-Operated)" },
];

export const fetchableOpportunities: Opportunity[] = [
  {
    id: "f1",
    noticeId: "GS-00F-24-0087",
    title: "Zero Trust Architecture Implementation Support - Treasury Department",
    summary:
      "The Department of the Treasury seeks experienced contractors to support Zero Trust Architecture (ZTA) implementation across enterprise IT systems in compliance with OMB M-22-09 and CISA maturity model.",
    fullDescription:
      "This contract supports Treasury's Zero Trust migration across 12 bureaus including IRS, FinCEN, and OCC. Work includes identity governance (ICAM) deployment, micro-segmentation of networks, continuous diagnostics and monitoring (CDM) integration, and SASE implementation. Contractor must demonstrate prior ZTA implementations at federal civilian agencies. FedRAMP High baseline required for all solutions deployed. Period: Base + 3 option years. Estimated value: $42M.",
    agency: "Department of the Treasury",
    type: "Combined Synopsis/Solicitation",
    naicsCode: "541512",
    postedDate: "2024-08-12",
    dueDate: "2024-10-20",
    status: "Go",
    aiReason:
      "Direct ZTA experience from DHS CDM program. Identity governance is a core competency. Treasury ISSO relationships from prior BPA provide competitive intel. Strong win probability.",
    setAside: "Total Small Business",
    placeOfPerformance: "Washington, DC (Hybrid)",
    pointOfContact: {
      name: "Karen Liu",
      email: "karen.liu@treasury.gov",
      phone: "(202) 555-0412",
    },
    attachments: [
      { name: "RFQ_ZTA_Treasury.pdf", size: "5.8 MB", type: "PDF" },
      { name: "ZTA_Architecture_Diagram.pdf", size: "2.1 MB", type: "PDF" },
    ],
    isNew: true,
  },
  {
    id: "f2",
    noticeId: "W91278-24-R-0112",
    title: "Base Operations Support (BOS) Services - Fort Liberty, NC",
    summary:
      "US Army Installation Management Command requires comprehensive Base Operations Support services including facility management, grounds maintenance, pest control, and refuse collection at Fort Liberty.",
    fullDescription:
      "Full-service BOS contract covering 161,000 acres and 8,900+ facilities at Fort Liberty (formerly Fort Bragg). Services span facility management, custodial, grounds maintenance, pest management, refuse/recycling, snow removal, and minor maintenance/repair. Contractor manages 450+ personnel on-site. Must integrate with Army GFEBS and IFS systems. Estimated annual value: $65M. Period: Base year + 4 option years. This is a recompete - incumbent is Vectrus.",
    agency: "US Army IMCOM",
    type: "Presolicitation",
    naicsCode: "561210",
    postedDate: "2024-08-14",
    dueDate: "2024-11-01",
    status: "No-Go",
    aiReason:
      "BOS at this scale (450+ personnel, $65M/yr) significantly exceeds current capacity. No GFEBS integration experience. Incumbent Vectrus has strong recompete advantage. Capital investment requirements too high.",
    setAside: "Unrestricted",
    placeOfPerformance: "Fort Liberty, NC",
    pointOfContact: {
      name: "LTC James Parker",
      email: "james.d.parker.mil@army.mil",
      phone: "(910) 555-0678",
    },
    attachments: [
      { name: "Draft_PWS_BOS_FortLiberty.pdf", size: "14.2 MB", type: "PDF" },
    ],
    isNew: true,
  },
  {
    id: "f3",
    noticeId: "75A50124R00034",
    title: "AI/ML Platform Development for FDA Drug Review Modernization",
    summary:
      "The Food and Drug Administration seeks a contractor to develop and deploy AI/ML capabilities to accelerate drug application review processes, including NLP-based document analysis and predictive analytics.",
    fullDescription:
      "FDA CDER requires development of an AI/ML platform to modernize the drug review pipeline. Key capabilities include NLP models for automated extraction of clinical trial data from NDAs/BLAs, ML-based safety signal detection, predictive models for review timeline optimization, and a reviewer-facing dashboard. Platform must be deployed on FDA's AWS GovCloud environment with FedRAMP High authorization. Must comply with FDA AI/ML guidance and 21 CFR Part 11. Estimated value: $28M over 4 years.",
    agency: "Food and Drug Administration",
    type: "Solicitation",
    naicsCode: "541512",
    postedDate: "2024-08-15",
    dueDate: "2024-10-30",
    status: "Go",
    aiReason:
      "AI/ML capabilities align with your data science practice. AWS GovCloud deployment experience from CDC work is directly applicable. Healthcare domain expertise provides regulatory understanding. High-value emerging market.",
    setAside: "Total Small Business",
    placeOfPerformance: "Silver Spring, MD (Hybrid)",
    pointOfContact: {
      name: "Dr. Anita Patel",
      email: "anita.patel@fda.hhs.gov",
      phone: "(301) 555-0923",
    },
    attachments: [
      { name: "RFP_AI_ML_FDA_CDER.pdf", size: "9.4 MB", type: "PDF" },
      { name: "Technical_Requirements.pdf", size: "3.7 MB", type: "PDF" },
      { name: "Data_Standards_Guide.pdf", size: "1.8 MB", type: "PDF" },
    ],
    isNew: true,
  },
  {
    id: "f4",
    noticeId: "70RSAT24R00000089",
    title: "Next-Gen Border Surveillance Technology - CBP",
    summary:
      "Customs and Border Protection seeks innovative surveillance and detection technology solutions for remote border areas including autonomous sensor towers, drone integration, and AI-powered threat detection.",
    fullDescription:
      "CBP requires deployment of next-generation Integrated Surveillance Tower (IST) systems across 200 miles of remote border terrain. Solution must include autonomous solar-powered sensor towers with radar, LIDAR, and electro-optical/infrared cameras, UAS integration for rapid response, AI/ML-powered object classification and tracking, and C2 system integration with existing CBP Common Operating Picture. Contractor must demonstrate TRL 7+ for all proposed technologies. Estimated value: $150M over 5 years.",
    agency: "Customs and Border Protection",
    type: "Sources Sought",
    naicsCode: "541715",
    postedDate: "2024-08-16",
    dueDate: "2024-09-25",
    status: "No-Go",
    aiReason:
      "Hardware-intensive surveillance systems are outside your core software/IT services capabilities. No UAS or sensor tower experience. Dominated by defense primes (Anduril, FLIR, Elbit). TRL 7+ requirement implies mature technology needed.",
    setAside: "Unrestricted",
    placeOfPerformance: "Multiple Border Locations, AZ/TX",
    pointOfContact: {
      name: "SAC Ricardo Mendez",
      email: "ricardo.mendez@cbp.dhs.gov",
      phone: "(520) 555-0345",
    },
    attachments: [
      { name: "Sources_Sought_IST.pdf", size: "6.3 MB", type: "PDF" },
      { name: "Technical_Specs_Sensors.pdf", size: "4.2 MB", type: "PDF" },
    ],
    isNew: true,
  },
  {
    id: "f5",
    noticeId: "SPE4A7-24-R-0056",
    title: "Enterprise Cloud Data Warehouse Modernization - DLA",
    summary:
      "Defense Logistics Agency seeks modernization of legacy data warehouse infrastructure to a cloud-native solution on AWS/Azure Government, including data lake architecture, ETL pipeline development, and BI/analytics.",
    fullDescription:
      "DLA requires migration of 15+ legacy Oracle/SQL Server data warehouses to a unified cloud data platform. Scope includes data lake/lakehouse architecture design on AWS GovCloud, automated ETL/ELT pipeline development using modern tools (dbt, Airflow), BI dashboard migration from Cognos to Power BI/Tableau, master data management implementation, and data governance framework. Contractor must achieve IL5 authorization. Period: Base + 4 option years. Estimated value: $38M.",
    agency: "Defense Logistics Agency",
    type: "Presolicitation",
    naicsCode: "541512",
    postedDate: "2024-08-17",
    dueDate: "2024-11-10",
    status: "Go",
    aiReason:
      "Cloud data platform modernization is a sweet spot. AWS GovCloud and Azure Government experience present. Data engineering team has dbt/Airflow expertise. DLA relationship from prior analytics task order supports positioning.",
    setAside: "Total Small Business",
    placeOfPerformance: "Fort Belvoir, VA (Hybrid)",
    pointOfContact: {
      name: "Thomas Wright",
      email: "thomas.wright@dla.mil",
      phone: "(703) 555-0567",
    },
    attachments: [
      { name: "Draft_SOW_DataWarehouse.pdf", size: "4.5 MB", type: "PDF" },
      { name: "Current_Architecture_Overview.pdf", size: "2.9 MB", type: "PDF" },
      { name: "Data_Inventory.xlsx", size: "780 KB", type: "XLSX" },
    ],
    isNew: true,
  },
];

export const opportunities: Opportunity[] = [
  {
    id: "1",
    noticeId: "W912DY-24-R-0045",
    title: "Construction Manager As Constructor (CMC) Or Construction Manager At Risk (CMR) New Land Port Of Entry, Coburn Gore, Maine",
    summary:
      "The General Services Administration (GSA) is seeking qualified suppliers, manufacturers, and construction contractors for the Construction Manager as Constructor (CMc) or Construction Manager at Risk (CMr) services for a new Land Port of Entry (LPOE) in Coburn Gore, Maine.",
    fullDescription:
      "This Sources Sought Notice is intended for informational purposes only and does not constitute a request for proposals, quotations, or bids. The project involves providing all necessary labor, materials, transportation, supervision, and management for the construction of the new facility, which will replace the existing Coburn Gore Border Station, a historic site established between 1931. The estimated project value is between $50M-$100M. The new LPOE will include a main port building, inspection facilities, staff housing, and supporting infrastructure.",
    agency: "General Services Administration",
    type: "Sources Sought",
    naicsCode: "236220",
    postedDate: "2024-07-25",
    dueDate: "2024-08-15",
    status: "Go",
    aiReason:
      "Strong match with your company's construction management experience. NAICS 236220 aligns with your primary capabilities. Past performance on similar LPOE projects gives competitive advantage.",
    setAside: "Total Small Business",
    placeOfPerformance: "Coburn Gore, ME",
    pointOfContact: {
      name: "John Martinez",
      email: "john.martinez@gsa.gov",
      phone: "(202) 555-0147",
    },
    attachments: [
      { name: "SOW_LPOE_CoburnGore.pdf", size: "2.4 MB", type: "PDF" },
      { name: "Site_Plans_Drawings.pdf", size: "15.8 MB", type: "PDF" },
      { name: "Attachment_J_Wage_Determination.pdf", size: "890 KB", type: "PDF" },
    ],
  },
  {
    id: "2",
    noticeId: "FA8532-24-R-0012",
    title: "Enterprise IT Support Services for Air Force Research Laboratory (AFRL)",
    summary:
      "The US Air Force is seeking proposals for comprehensive IT support services including help desk operations, network administration, cybersecurity monitoring, and cloud infrastructure management for AFRL facilities.",
    fullDescription:
      "This contract will provide full-spectrum IT support services across 9 AFRL locations nationwide. Services include Tier 1-3 help desk support for 12,000+ users, network operations center (NOC) management, cybersecurity incident response, cloud migration and management (AWS GovCloud/Azure Government), and end-user device management. The contract period is a 1-year base with four 1-year option periods. Contractor must maintain Secret-level facility clearance and personnel must hold active Secret clearances minimum.",
    agency: "US Air Force",
    type: "Presolicitation",
    naicsCode: "541512",
    postedDate: "2024-07-20",
    dueDate: "2024-09-01",
    status: "Go",
    aiReason:
      "Excellent fit - your IT managed services division has relevant AFRL past performance. NAICS 541512 is a primary code. Secret clearance workforce available. High win probability based on incumbent relationship.",
    setAside: "Unrestricted",
    placeOfPerformance: "Wright-Patterson AFB, OH (Multiple Locations)",
    pointOfContact: {
      name: "Capt. Sarah Williams",
      email: "sarah.williams.3@us.af.mil",
      phone: "(937) 555-0234",
    },
    attachments: [
      { name: "Draft_PWS_AFRL_IT.pdf", size: "4.1 MB", type: "PDF" },
      { name: "CDRL_List.xlsx", size: "245 KB", type: "XLSX" },
    ],
  },
  {
    id: "3",
    noticeId: "70CDCR24R00000012",
    title: "Cybersecurity Assessment and Authorization (A&A) Services - DHS HQ",
    summary:
      "DHS requires cybersecurity assessment and authorization services to evaluate and authorize information systems in accordance with FISMA, NIST SP 800-53, and DHS 4300A security policy.",
    fullDescription:
      "The Department of Homeland Security requires contractor support for Security Assessment and Authorization (SA&A) activities across DHS headquarters and component agency systems. Work includes conducting security control assessments, developing System Security Plans (SSPs), performing vulnerability scanning and penetration testing, managing Plans of Action & Milestones (POA&Ms), and supporting continuous monitoring activities. Contractor shall assess approximately 150 systems annually. All personnel must hold Top Secret/SCI clearances.",
    agency: "Department of Homeland Security",
    type: "Combined Synopsis/Solicitation",
    naicsCode: "541519",
    postedDate: "2024-08-01",
    dueDate: "2024-09-15",
    status: "Go",
    aiReason:
      "Direct alignment with your cybersecurity practice. Your FedRAMP assessment experience translates well. DHS past performance from previous BPA gives strong advantage.",
    setAside: "8(a) Set-Aside",
    placeOfPerformance: "Washington, DC (Hybrid Remote)",
    pointOfContact: {
      name: "Michael Chen",
      email: "michael.chen@hq.dhs.gov",
      phone: "(202) 555-0891",
    },
    attachments: [
      { name: "RFQ_Cybersecurity_AA.pdf", size: "3.2 MB", type: "PDF" },
      { name: "Attachment_A_Labor_Categories.pdf", size: "567 KB", type: "PDF" },
      { name: "Past_Performance_Template.docx", size: "125 KB", type: "DOCX" },
    ],
  },
  {
    id: "4",
    noticeId: "36C25724R0088",
    title: "Janitorial and Custodial Services - VA Medical Center, Tampa, FL",
    summary:
      "The Department of Veterans Affairs seeks qualified contractors to provide comprehensive janitorial and custodial services at the James A. Haley Veterans' Hospital and associated clinics in Tampa, Florida.",
    fullDescription:
      "This requirement covers daily, weekly, and monthly cleaning services for approximately 1.2 million square feet of medical facility space including patient wards, operating rooms, laboratories, administrative offices, and common areas. Contractor must comply with VA infection control standards, use Green Seal certified cleaning products, and maintain Joint Commission readiness at all times. The contract includes a base year plus four option years with an estimated annual value of $4.5M.",
    agency: "Department of Veterans Affairs",
    type: "Solicitation",
    naicsCode: "561720",
    postedDate: "2024-07-28",
    dueDate: "2024-08-20",
    status: "No-Go",
    aiReason:
      "NAICS 561720 is outside your primary capabilities. No relevant past performance in medical facility custodial services. Highly competitive low-price market with thin margins. Recommend passing.",
    setAside: "Service-Disabled Veteran-Owned Small Business",
    placeOfPerformance: "Tampa, FL",
    pointOfContact: {
      name: "Robert Thompson",
      email: "robert.thompson2@va.gov",
      phone: "(813) 555-0456",
    },
    attachments: [
      { name: "Solicitation_Janitorial_Tampa.pdf", size: "5.6 MB", type: "PDF" },
      { name: "Wage_Determination_2024.pdf", size: "320 KB", type: "PDF" },
    ],
  },
  {
    id: "5",
    noticeId: "W56KGZ-24-R-0034",
    title: "Logistics Support Services for Army Materiel Command (AMC)",
    summary:
      "US Army seeks comprehensive logistics support including warehouse management, supply chain operations, inventory control, and transportation coordination for AMC depots across CONUS.",
    fullDescription:
      "This contract provides logistics and supply chain management support across 5 Army depots. Services include warehouse operations management, automated inventory tracking using GCSS-Army, transportation management and coordination, packaging/crating/handling, and quality assurance inspections. The contractor will manage approximately 2.3 million stock items and process 500,000+ transactions monthly. Requires integration with Army enterprise logistics systems. Period of performance: Base + 4 option years, estimated total value $85M.",
    agency: "US Army",
    type: "Presolicitation",
    naicsCode: "541614",
    postedDate: "2024-08-03",
    dueDate: "2024-09-30",
    status: "No-Go",
    aiReason:
      "While logistics is a capability area, the scale of 5 depots and 2.3M stock items exceeds your current capacity. No GCSS-Army experience on record. Large business competitors likely to dominate. High barrier to entry.",
    setAside: "Unrestricted",
    placeOfPerformance: "Multiple CONUS Locations",
    pointOfContact: {
      name: "Maj. David Kim",
      email: "david.j.kim.mil@army.mil",
      phone: "(256) 555-0789",
    },
    attachments: [
      { name: "Draft_SOW_Logistics_AMC.pdf", size: "7.3 MB", type: "PDF" },
    ],
  },
  {
    id: "6",
    noticeId: "75D30124R00098",
    title: "Cloud Migration and Modernization Services - CDC",
    summary:
      "The Centers for Disease Control and Prevention seeks a contractor to perform application modernization and cloud migration of legacy public health surveillance systems to AWS GovCloud.",
    fullDescription:
      "CDC requires migration of 23 legacy public health applications to AWS GovCloud including re-architecture to cloud-native microservices, containerization using Kubernetes, implementation of CI/CD pipelines, and data migration with zero downtime requirements. Applications support critical public health surveillance including disease outbreak tracking, vaccination monitoring, and epidemiological data analysis. Contractor must achieve FedRAMP High authorization and comply with HIPAA requirements. Estimated value: $35M over 5 years.",
    agency: "Centers for Disease Control and Prevention",
    type: "Combined Synopsis/Solicitation",
    naicsCode: "541512",
    postedDate: "2024-08-05",
    dueDate: "2024-10-01",
    status: "Go",
    aiReason:
      "Strong cloud migration track record with similar federal agencies. AWS GovCloud expertise and existing ATO accelerators reduce risk. Healthcare IT experience from NIH work is directly transferable.",
    setAside: "Total Small Business",
    placeOfPerformance: "Atlanta, GA (Hybrid Remote)",
    pointOfContact: {
      name: "Patricia Green",
      email: "pgreen@cdc.gov",
      phone: "(404) 555-0321",
    },
    attachments: [
      { name: "RFP_Cloud_Migration_CDC.pdf", size: "8.9 MB", type: "PDF" },
      { name: "Technical_Architecture_Current.pdf", size: "3.4 MB", type: "PDF" },
      { name: "Application_Inventory.xlsx", size: "456 KB", type: "XLSX" },
      { name: "Security_Requirements.pdf", size: "1.2 MB", type: "PDF" },
    ],
  },
  {
    id: "7",
    noticeId: "N00178-24-R-3456",
    title: "Facility Maintenance and Repair Services - Naval Station Norfolk",
    summary:
      "NAVFAC Mid-Atlantic requires facilities maintenance, repair, and minor construction services for buildings and infrastructure at Naval Station Norfolk, Virginia.",
    fullDescription:
      "Indefinite Delivery/Indefinite Quantity (IDIQ) contract for comprehensive facility maintenance and repair services covering 3,400+ buildings and structures at the world's largest naval station. Work includes HVAC maintenance, electrical systems, plumbing, roofing repairs, painting, concrete work, and emergency response services. Contractor must maintain 24/7 emergency response capability with 2-hour response time. Annual task order volume estimated at $25M-$30M. Period: Base + 4 option years. Davis-Bacon Act applies.",
    agency: "Naval Facilities Engineering Systems Command",
    type: "Solicitation",
    naicsCode: "236220",
    postedDate: "2024-07-15",
    dueDate: "2024-08-30",
    status: "Go",
    aiReason:
      "NAICS 236220 is your primary code. Existing NAVFAC past performance from Hampton Roads BOS contract. Local workforce available in Norfolk area. IDIQ structure allows scalable commitment.",
    setAside: "Unrestricted",
    placeOfPerformance: "Norfolk, VA",
    pointOfContact: {
      name: "Lisa Anderson",
      email: "lisa.m.anderson@navy.mil",
      phone: "(757) 555-0567",
    },
    attachments: [
      { name: "Solicitation_NAVSTA_Norfolk.pdf", size: "12.3 MB", type: "PDF" },
      { name: "Technical_Specs_Vol1.pdf", size: "6.7 MB", type: "PDF" },
      { name: "Technical_Specs_Vol2.pdf", size: "5.4 MB", type: "PDF" },
    ],
  },
  {
    id: "8",
    noticeId: "DE-SOL-0024567",
    title: "Environmental Remediation Services - DOE Hanford Site",
    summary:
      "The Department of Energy Office of Environmental Management seeks environmental remediation and waste management services for the Hanford Nuclear Reservation in southeastern Washington State.",
    fullDescription:
      "Large-scale environmental remediation contract covering soil and groundwater contamination cleanup, radioactive waste characterization, treatment and disposal, decommissioning of legacy nuclear production facilities, and long-term environmental monitoring. This is one of the most complex environmental cleanup sites in the world with an estimated 56 million gallons of radioactive waste. Contractor must have NRC licenses, DOE Q clearances for key personnel, and demonstrated experience with CERCLA/RCRA remediation at federal facilities. Estimated contract value: $500M+ over 10 years.",
    agency: "Department of Energy",
    type: "Presolicitation",
    naicsCode: "562910",
    postedDate: "2024-08-10",
    dueDate: "2024-11-15",
    status: "No-Go",
    aiReason:
      "Nuclear remediation is highly specialized and outside your core competencies. Requires NRC licenses and DOE Q clearances not currently held. Dominated by large environmental firms (AECOM, Jacobs, Fluor). Contract scale ($500M+) exceeds your bonding capacity.",
    setAside: "Unrestricted",
    placeOfPerformance: "Richland, WA",
    pointOfContact: {
      name: "Dr. James Wilson",
      email: "james.wilson@em.doe.gov",
      phone: "(509) 555-0234",
    },
    attachments: [
      { name: "Draft_RFP_Hanford_Remediation.pdf", size: "24.5 MB", type: "PDF" },
      { name: "Environmental_Impact_Statement.pdf", size: "18.2 MB", type: "PDF" },
    ],
  },
];
